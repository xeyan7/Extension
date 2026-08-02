'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function createMockChrome() {
  return {
    runtime: {
      onInstalled: { addListener: () => {} },
      onMessage: { addListener: () => {}, removeListener: () => {} },
      id: 'mock-extension-id',
      lastError: null
    },
    storage: {
      local: {
        get: (keys, cb) => cb({}),
        set: (data, cb) => cb && cb()
      }
    },
    tabs: {
      onRemoved: { addListener: () => {} },
      sendMessage: () => Promise.resolve({ success: true })
    },
    webNavigation: {
      onBeforeNavigate: { addListener: () => {} },
      onHistoryStateUpdated: { addListener: () => {} },
      onReferenceFragmentUpdated: { addListener: () => {} }
    },
    webRequest: {
      onCompleted: { addListener: () => {}, removeListener: () => {} }
    },
    action: { onClicked: { addListener: () => {} } }
  };
}

test('background script syntax check and security functions', () => {
  const bgPath = path.resolve(__dirname, '..', 'background.js');
  const bgCode = fs.readFileSync(bgPath, 'utf8');

  assert.match(bgCode, /isPrivateHostname/);
  assert.match(bgCode, /parseIPv4To32Bit/);
  assert.match(bgCode, /sanitizeDownloadFilename/);
  assert.match(bgCode, /enqueueStorageMutation/);
  assert.match(bgCode, /onHistoryStateUpdated/);
  assert.match(bgCode, /responseBytesWithinLimit/);
});

test('background private IP detection rules (HIGH-09)', () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  const mockChrome = createMockChrome();
  
  const fn = new Function('chrome', `${bgCode}; return { isPrivateHostname, parseIPv4To32Bit, sanitizeDownloadFilename };`)(mockChrome);
  
  // Loopback and private ranges
  assert.equal(fn.isPrivateHostname('localhost'), true);
  assert.equal(fn.isPrivateHostname('127.0.0.1'), true);
  assert.equal(fn.isPrivateHostname('10.0.0.1'), true);
  assert.equal(fn.isPrivateHostname('192.168.1.1'), true);
  assert.equal(fn.isPrivateHostname('172.16.0.1'), true);
  
  // Alternate IP representations
  assert.equal(fn.isPrivateHostname('2130706433'), true); // Decimal 127.0.0.1
  assert.equal(fn.isPrivateHostname('0x7f000001'), true); // Hex 127.0.0.1
  assert.equal(fn.isPrivateHostname('0177.0.0.1'), true); // Octal 127.0.0.1
  assert.equal(fn.isPrivateHostname('::ffff:127.0.0.1'), true); // IPv4-mapped IPv6

  // Public addresses
  assert.equal(fn.isPrivateHostname('example.com'), false);
  assert.equal(fn.isPrivateHostname('8.8.8.8'), false);
  assert.equal(fn.isPrivateHostname('1.1.1.1'), false);
});

test('background private IP guards block IPv6 literals and short-form IPv4 (SSRF)', () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  const mockChrome = createMockChrome();
  const fn = new Function('chrome', `${bgCode}; return { isPrivateHostname, isSafeRemoteUrl, parseIPv4To32Bit };`)(mockChrome);

  // IPv6 loopback + unique-local + link-local
  assert.equal(fn.isPrivateHostname('[::1]'), true);
  assert.equal(fn.isPrivateHostname('::1'), true);
  assert.equal(fn.isPrivateHostname('[fc00::1]'), true);
  assert.equal(fn.isPrivateHostname('[fd12:3456::1]'), true);
  assert.equal(fn.isPrivateHostname('[fe80::1]'), true);

  // Short-form IPv4 (browsers resolve these to private/loopback)
  assert.equal(fn.isPrivateHostname('127.1'), true);   // 127.0.0.1
  assert.equal(fn.isPrivateHostname('10.1'), true);    // 10.0.0.1
  assert.equal(fn.isPrivateHostname('192.168.1'), true); // 192.168.0.1

  // isSafeRemoteUrl rejects private and non-http(s) URLs, accepts public http(s)
  assert.equal(fn.isSafeRemoteUrl('http://127.0.0.1/x'), false);
  assert.equal(fn.isSafeRemoteUrl('http://[::1]/x'), false);
  assert.equal(fn.isSafeRemoteUrl('https://8.8.8.8/x'), true);
  assert.equal(fn.isSafeRemoteUrl('file:///etc/passwd'), false);
  assert.equal(fn.isSafeRemoteUrl('http://user:pass@example.com/x'), false); // creds rejected
});

test('background downloadAsset sanitizes filename and formatCode caps input size', () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  assert.match(bgCode, /filename: request\.filename \? sanitizeDownloadFilename\(request\.filename\)/);
  assert.match(bgCode, /code\.length > 2 \* 1024 \* 1024/);
  assert.match(bgCode, /sender\.id/);
  assert.match(bgCode, /response\.url && !isSafeRemoteUrl\(response\.url\)/);
});

test('background filename sanitizer (LOW-07, MED-05)', () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  const mockChrome = createMockChrome();
  const fn = new Function('chrome', `${bgCode}; return { sanitizeDownloadFilename };`)(mockChrome);

  assert.equal(fn.sanitizeDownloadFilename('normal.png'), 'normal.png');
  assert.equal(fn.sanitizeDownloadFilename('trailing.dots...'), 'trailing.dots');
  assert.equal(fn.sanitizeDownloadFilename('trailing spaces   '), 'trailing spaces');
  assert.equal(fn.sanitizeDownloadFilename('invalid:char*name?.jpg'), 'invalid-char-name-.jpg');
  assert.equal(fn.sanitizeDownloadFilename('../../../etc/passwd'), 'passwd');
});

test('content color classification handles 8-digit hex and invalid fallbacks (HIGH-06)', () => {
  const contentCode = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
  
  const mockDocument = {
    createElement: () => {
      const styleObj = { _color: '' };
      Object.defineProperty(styleObj, 'color', {
        get() { return styleObj._color; },
        set(val) {
          if (!val || /^(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\(|red|green|blue|black|white|transparent)/i.test(String(val).trim())) {
            styleObj._color = val;
          } else {
            styleObj._color = '';
          }
        }
      });
      return {
        style: styleObj,
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100, bottom: 100, right: 100 }),
        setAttribute: () => {},
        removeAttribute: () => {},
        querySelectorAll: () => [],
        querySelector: () => null,
        appendChild: () => {},
        removeChild: () => {},
        remove: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      };
    },
    body: {
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      appendChild: () => {},
      removeChild: () => {}
    },
    documentElement: { style: {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const mockGlobal = {
    window: {
      location: { href: 'https://example.com' },
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({ matches: false })
    },
    document: mockDocument,
    location: { hostname: 'example.com' },
    getComputedStyle: el => ({ color: el?.style?.color || '' }),
    requestAnimationFrame: fn => fn()
  };

  const fn = new Function('window', 'document', 'location', 'getComputedStyle', 'requestAnimationFrame', `
    ${contentCode};
    return window.uicc || new UIComponentCopier();
  `)(mockGlobal.window, mockGlobal.document, mockGlobal.location, mockGlobal.getComputedStyle, mockGlobal.requestAnimationFrame);

  // Valid 6-digit hex
  assert.equal(fn.classifyColor('#000000'), 'Dark / Neutral');
  assert.equal(fn.classifyColor('#FFFFFF'), 'Light / White');
  assert.equal(fn.classifyColor('#808080'), 'Gray / Neutral');
  assert.equal(fn.classifyColor('#FF0000'), 'Color Token');

  // 8-digit hex (#RRGGBBAA)
  assert.equal(fn.classifyColor('#FF0000FF'), 'Color Token');
  assert.equal(fn.classifyColor('#00000000'), 'Other'); // Transparent

  // Invalid / non-color input fallback
  assert.equal(fn.classifyColor('not-a-color'), 'Other');
  assert.equal(fn.classifyColor(''), 'Other');
});

test('content component preview sanitizes scriptable tags and clobbering (CRIT-01)', () => {
  const contentCode = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
  
  assert.match(contentCode, /script, noscript, iframe, object, embed/);
  assert.match(contentCode, /removeAttribute/);
  assert.match(contentCode, /uicc-component-preview/);
});

test('background copyToClipboard forwards to offscreen document via offscreenWrite', async () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  assert.match(bgCode, /offscreenWrite/);
  assert.match(bgCode, /copyViaOffscreenDocument/);
  assert.match(bgCode, /ensureOffscreenClipboardDocument/);
  assert.match(bgCode, /reasons: \['CLIPBOARD'\]/);

  const sent = [];
  let created = null;
  const mockChrome = createMockChrome();
  mockChrome.offscreen = {
    hasDocument: async () => false,
    createDocument: async opts => { created = opts; }
  };
  mockChrome.runtime.sendMessage = async msg => { sent.push(msg); return { success: true }; };

  // The guard reads globalThis.chrome, so expose the mock there during the test.
  const previousChrome = globalThis.chrome;
  globalThis.chrome = mockChrome;
  try {
    const fn = new Function('chrome', `${bgCode}; return { copyViaOffscreenDocument, ensureOffscreenClipboardDocument };`)(mockChrome);
    const ok = await fn.copyViaOffscreenDocument('hello');
    assert.equal(ok, true);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0], { action: 'offscreenWrite', text: 'hello' });
    assert.ok(created && created.url === 'offscreen.html', 'offscreen document created with offscreen.html');
    assert.deepEqual(created.reasons, ['CLIPBOARD']);
    assert.ok(created.justification && created.justification.length > 0);
  } finally {
    if (previousChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = previousChrome;
  }
});

test('background copyToClipboard degrades gracefully without offscreen API', async () => {
  const bgCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');
  const mockChrome = createMockChrome(); // no chrome.offscreen
  const previousChrome = globalThis.chrome;
  delete globalThis.chrome;
  try {
    const fn = new Function('chrome', `${bgCode}; return { copyViaOffscreenDocument };`)(mockChrome);
    const ok = await fn.copyViaOffscreenDocument('hello');
    assert.equal(ok, false);
  } finally {
    if (previousChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = previousChrome;
  }
});

test('offscreen document only handles offscreenWrite and returns real success', () => {
  const offCode = fs.readFileSync(path.resolve(__dirname, '..', 'offscreen.js'), 'utf8');
  assert.match(offCode, /offscreenWrite/);
  assert.match(offCode, /navigator\.clipboard\.writeText/);
  assert.match(offCode, /execCommand\('copy'\)/);
});
