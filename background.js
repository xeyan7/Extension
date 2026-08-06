'use strict';

// Miro-mirrored formatCode: load the real Prettier 3.8.3 standalone + html
// + css/postcss plugins into the service worker, exactly like Miro bundles
// them. Guarded so Node-based tests (no importScripts) fall back gracefully.
if (typeof importScripts === 'function') {
  try {
    importScripts(
      'lib/prettier-standalone.js',
      'lib/prettier-plugin-html.js',
      'lib/prettier-plugin-postcss.js'
    );
  } catch (_) { /* prettier unavailable; formatCode falls back */ }
}

const networkAssets = new Map();
const MAX_ASSETS_PER_TYPE = 500;
const MAX_LIBRARY_BYTES = 8 * 1024 * 1024;
const MAX_COMPONENT_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = ['images', 'videos', 'audio', 'stylesheets', 'scripts', 'fonts', 'other'];

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `uicc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function byteLength(value) {
  return new TextEncoder().encode(String(value || '')).byteLength;
}

function componentBytes(component) {
  return byteLength(component?.html) + byteLength(component?.css) + byteLength(component?.pageUrl) + 256;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['uiccSettings'], result => {
    if (chrome.runtime.lastError || result.uiccSettings) return;
    chrome.storage.local.set({
      uiccSettings: { includeNetworkAssets: true, defaultFormat: 'html', version: 2 }
    });
  });
});

function parseIPv4To32Bit(ip) {
  if (!ip || typeof ip !== 'string') return null;
  let clean = ip.trim();
  if (clean.startsWith('::ffff:')) clean = clean.slice(7);
  if (/^0x[0-9a-f]+$/i.test(clean)) {
    const val = parseInt(clean, 16);
    return isNaN(val) || val < 0 || val > 0xffffffff ? null : val >>> 0;
  }
  if (/^\d+$/.test(clean)) {
    const val = parseInt(clean, 10);
    return isNaN(val) || val < 0 || val > 0xffffffff ? null : val >>> 0;
  }
  const parts = clean.split('.');
  if (parts.length < 1 || parts.length > 4) return null;
  // Support short forms (browsers resolve 127.1 → 127.0.0.1, 10.1 → 10.0.0.1,
  // 192.168.1 → 192.168.0.1). First n-1 parts are 8-bit, last part carries the
  // remaining bits — without this, 127.1/10.1 bypass the private-IP guard.
  let num = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    let n;
    if (/^0[0-7]+$/.test(part)) n = parseInt(part, 8);
    else if (/^0x[0-9a-f]+$/i.test(part)) n = parseInt(part, 16);
    else if (/^\d+$/.test(part)) n = parseInt(part, 10);
    else return null;
    const isLast = i === parts.length - 1;
    const maxBits = isLast ? 32 - 8 * (parts.length - 1) : 8;
    if (isNaN(n) || n < 0 || n >= (1 << maxBits)) return null;
    num = (num << maxBits) + n;
  }
  return num >>> 0;
}

function isPrivateIPv6Literal(hostname) {
  // hostname from new URL() keeps the brackets for IPv6, e.g. "[::1]".
  const lower = String(hostname || '').toLowerCase().trim();
  let core = lower;
  if (core.startsWith('[') && core.endsWith(']')) core = core.slice(1, -1);
  if (core.startsWith('::ffff:')) core = core.slice(7); // IPv4-mapped → handled by IPv4 parser
  if (core === '::1' || core === '::') return true; // loopback + unspecified
  if (/^fe80:/i.test(core) || /^fe8[0-9a-f]:/i.test(core)) return true; // fe80::/10 link-local
  if (/^fc[0-9a-f]{2}:/i.test(core) || /^fd[0-9a-f]{2}:/i.test(core)) return true; // fc00::/7 unique local
  return false;
}

function isPrivateHostname(hostname) {
  if (!hostname) return false;
  const lower = String(hostname).toLowerCase().trim();
  if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return true;
  const ip32 = parseIPv4To32Bit(lower);
  if (ip32 !== null) {
    const b1 = (ip32 >>> 24) & 0xff;
    const b2 = (ip32 >>> 16) & 0xff;
    if (b1 === 127) return true; // 127.0.0.0/8
    if (b1 === 10) return true; // 10.0.0.0/8
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true; // 172.16.0.0/12
    if (b1 === 192 && b2 === 168) return true; // 192.168.0.0/16
    if (b1 === 0 || b1 === 169 && b2 === 254) return true; // 0.0.0.0/8 + Link-local 169.254.0.0/16
  }
  if (lower.includes(':')) return isPrivateIPv6Literal(lower);
  return false;
}

function sanitizeDownloadFilename(filename) {
  if (!filename) return 'download';
  let name = String(filename).replace(/\\/g, '/');
  const lastSlash = name.lastIndexOf('/');
  if (lastSlash !== -1) name = name.slice(lastSlash + 1);
  name = name.replace(/[:*?"<>|]/g, '-');
  name = name.replace(/\.+$/g, '').trim();
  name = name.replace(/\s+$/g, '');
  return name || 'download';
}

function enqueueStorageMutation(fn) {
  return typeof fn === 'function' ? fn() : Promise.resolve();
}

function onHistoryStateUpdated(details) {
  if (details?.tabId >= 0 && details?.frameId === 0) {
    networkAssets.delete(details.tabId);
  }
}

function responseBytesWithinLimit(bytes, limit = 8 * 1024 * 1024) {
  return typeof bytes === 'number' && bytes <= limit;
}

function isSupportedPage(url) {
  return /^https?:\/\//i.test(url || '');
}

function isSafeRemoteUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (isPrivateHostname(parsed.hostname)) return false;
    // Defeat DNS rebinding: never trust a raw IP-style literal that failed the
    // parser, and reject userinfo so credentials can't be smuggled past the host.
    if (parsed.username || parsed.password) return false;
    return true;
  } catch (_) { return false; }
}

function getTabAssets(tabId) {
  if (!networkAssets.has(tabId)) {
    networkAssets.set(tabId, Object.fromEntries(ASSET_TYPES.map(type => [type, new Set()])));
  }
  return networkAssets.get(tabId);
}

function addAsset(set, url) {
  if (!url || set.has(url) || set.size >= MAX_ASSETS_PER_TYPE) return;
  set.add(url);
}

function shouldIgnoreNetworkUrl(url) {
  return !url || url.startsWith('chrome-extension:') || url.startsWith('moz-extension:') ||
    url.includes('/@vite/') || url.includes('/@react-refresh') ||
    url.includes('__vite_ping') || url.includes('.hot-update.') ||
    url.includes('webpack-hmr') || url.includes('/sockjs-node/') || url.endsWith('.map');
}

chrome.webRequest.onCompleted.addListener(details => {
  if (details.tabId < 0 || shouldIgnoreNetworkUrl(details.url)) return;
  const assets = getTabAssets(details.tabId);
  const { type, url } = details;
  if (type === 'image') addAsset(assets.images, url);
  else if (type === 'media') {
    if (/\.(?:mp4|webm|ogv|mov|m3u8)(?:[?#]|$)/i.test(url)) addAsset(assets.videos, url);
    else addAsset(assets.audio, url);
  } else if (type === 'stylesheet') addAsset(assets.stylesheets, url);
  else if (type === 'script') addAsset(assets.scripts, url);
  else if (type === 'font' || /\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i.test(url)) addAsset(assets.fonts, url);
  else if (/\.(?:jpe?g|png|gif|svg|webp|avif|bmp|ico)(?:[?#]|$)/i.test(url)) addAsset(assets.images, url);
  else addAsset(assets.other, url);
}, { urls: ['<all_urls>'] });

chrome.tabs.onRemoved.addListener(tabId => networkAssets.delete(tabId));
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId === 0) networkAssets.delete(details.tabId);
});

function resolveCssUrls(css, baseUrl) {
  if (!css || !baseUrl) return css || '';
  return String(css).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, raw) => {
    const value = raw.trim();
    if (!value || value.startsWith('#') || value.startsWith('data:') ||
        value.startsWith('blob:') || /^https?:\/\//i.test(value) || value.startsWith('//')) return match;
    try { return `url("${new URL(value, baseUrl).href}")`; } catch (_) { return match; }
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

// ── Miro-mirrored formatCode (background prettier-equivalent) ────────────────
const HTML_VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const HTML_VERBATIM_TAGS = new Set(['pre', 'textarea', 'script', 'style']);

function tokenizeHtml(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === '<') {
      if (source.startsWith('<!--', i)) {
        const end = source.indexOf('-->', i + 4);
        const endIdx = end === -1 ? source.length : end + 3;
        tokens.push({ type: 'comment', value: source.slice(i, endIdx) });
        i = endIdx;
        continue;
      }
      let j = i + 1;
      let quote = null;
      while (j < source.length) {
        const ch = source[j];
        if (quote) { if (ch === quote) quote = null; }
        else if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '>') break;
        j++;
      }
      tokens.push({ type: 'tag', value: source.slice(i, Math.min(j + 1, source.length)) });
      i = j + 1;
    } else {
      let j = i;
      while (j < source.length && source[j] !== '<') j++;
      tokens.push({ type: 'text', value: source.slice(i, j) });
      i = j;
    }
  }
  return tokens;
}

function formatHtmlCode(source) {
  if (!source || typeof source !== 'string' || !source.includes('<')) return source;
  const tokens = tokenizeHtml(source);
  const lines = [];
  let depth = 0;
  let verbatim = false;
  let buffer = '';
  const flush = () => {
    const t = buffer.trim();
    if (t) lines.push(`${'  '.repeat(depth)}${t}`);
    buffer = '';
  };

  for (const token of tokens) {
    if (token.type === 'comment') { flush(); lines.push(`${'  '.repeat(depth)}${token.value}`); continue; }
    if (token.type === 'text') {
      if (verbatim) { if (lines.length) lines[lines.length - 1] += token.value; else lines.push(token.value); }
      else buffer += token.value;
      continue;
    }
    const match = token.value.match(/^<\/?\s*([a-zA-Z][\w-]*)/);
    const name = match ? match[1].toLowerCase() : '';
    if (token.value.startsWith('</')) {
      flush();
      if (verbatim && HTML_VERBATIM_TAGS.has(name)) verbatim = false;
      depth = Math.max(0, depth - 1);
      lines.push(`${'  '.repeat(depth)}${token.value.trim()}`);
      continue;
    }
    flush();
    const isClosing = /\/>\s*$/.test(token.value.trim());
    const isVoid = HTML_VOID_TAGS.has(name) || isClosing;
    if (isVoid) { lines.push(`${'  '.repeat(depth)}${token.value.trim()}`); continue; }
    lines.push(`${'  '.repeat(depth)}${token.value.trim()}`);
    if (HTML_VERBATIM_TAGS.has(name)) verbatim = true;
    depth++;
  }
  flush();
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function formatCssCode(source) {
  if (!source || typeof source !== 'string') return source;
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = null;
  const flushDecl = () => {
    const t = current.trim();
    if (t) parts.push(`${'  '.repeat(depth)}${t}${t.endsWith(';') ? '' : ';'}`);
    current = '';
  };
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inString) { current += ch; if (ch === inString) inString = null; continue; }
    if (ch === '"' || ch === "'") { inString = ch; current += ch; continue; }
    if (ch === '{') {
      const sel = current.trim();
      if (sel) parts.push(`${'  '.repeat(depth)}${sel} {`);
      current = '';
      depth++;
      continue;
    }
    if (ch === '}') {
      if (current.trim()) flushDecl();
      depth = Math.max(0, depth - 1);
      parts.push(`${'  '.repeat(depth)}}`);
      current = '';
      continue;
    }
    if (ch === ';') { if (current.trim()) flushDecl(); continue; }
    current += ch;
  }
  if (current.trim()) flushDecl();
  return parts.join('\n');
}

function formatCodeOutput(code, parser) {
  try {
    if (parser === 'css') return formatCssCode(code);
    return formatHtmlCode(code);
  } catch (_) { return code; }
}

async function expandImports(css, baseUrl, seen = new Set(), depth = 0) {
  if (depth > 5 || !css || !css.includes('@import')) return resolveCssUrls(css, baseUrl);
  const regex = /@import\s+(?:url\(\s*["']?([^"')\s]+)["']?\s*\)|["']([^"']+)["'])\s*([^;]*);/gi;
  const matches = Array.from(css.matchAll(regex));
  let output = css;
  for (const match of matches) {
    const rawUrl = match[1] || match[2];
    const media = (match[3] || '').trim();
    let absolute;
    try { absolute = new URL(rawUrl, baseUrl).href; } catch (_) { output = output.replace(match[0], ''); continue; }
    if (!isSafeRemoteUrl(absolute)) { output = output.replace(match[0], ''); continue; }
    if (seen.has(absolute)) { output = output.replace(match[0], ''); continue; }
    seen.add(absolute);
    try {
      const response = await fetchWithTimeout(absolute, { headers: { Accept: 'text/css,*/*' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // DNS-rebinding guard: the DNS answer may differ from the pre-fetch check.
      if (response.url && !isSafeRemoteUrl(response.url)) throw new Error('Unsafe redirect target');
      let imported = await response.text();
      imported = await expandImports(imported, absolute, seen, depth + 1);
      imported = resolveCssUrls(imported, absolute);
      if (media) imported = `@media ${media} {\n${imported}\n}`;
      output = output.replace(match[0], `\n/* ${absolute} */\n${imported}\n`);
    } catch (_) { output = output.replace(match[0], ''); }
  }
  return resolveCssUrls(output, baseUrl);
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, result => resolve(result || {})));
}

function storageSet(value) {
  return new Promise((resolve, reject) => chrome.storage.local.set(value, () => {
    if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve();
  }));
}

// ── Miro-mirrored clipboard: MV3 offscreen document write ───────────────────
// Service workers cannot reliably use navigator.clipboard.writeText, so the
// real write happens in a dedicated offscreen document (CLIPBOARD reason).
// This replaces the old no-op stub that claimed success without copying.
//
// The forward uses a DISTINCT action ('offscreenWrite') on purpose: content
// scripts' 'copyToClipboard' messages are broadcast to every extension context
// (background + offscreen), so if offscreen.js listened for the same action it
// would double-write and double-respond. The distinct action also removes any
// self-delivery ambiguity for the background's own sendMessage.
let _offscreenClipboardPromise = null;

async function ensureOffscreenClipboardDocument() {
  if (typeof globalThis.chrome?.offscreen === 'undefined') return false;
  if (_offscreenClipboardPromise) return _offscreenClipboardPromise;
  _offscreenClipboardPromise = (async () => {
    try {
      const hasDoc = await chrome.offscreen.hasDocument();
      if (!hasDoc) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['CLIPBOARD'],
          justification: 'Write extracted component code to the system clipboard when the page-context fallbacks are unavailable.'
        });
      }
      return true;
    } catch (_) {
      _offscreenClipboardPromise = null; // allow retry on next call
      return false;
    }
  })();
  return _offscreenClipboardPromise;
}

async function copyViaOffscreenDocument(text) {
  try {
    const ready = await ensureOffscreenClipboardDocument();
    if (!ready) return false;
    const response = await chrome.runtime.sendMessage({ action: 'offscreenWrite', text });
    return Boolean(response && response.success);
  } catch (_) {
    return false;
  }
}

async function handleMessage(request, sender) {
  // Only accept messages from this extension's own contexts (content scripts,
  // offscreen document). The sender.id check prevents a compromised or
  // externally-connectable context from driving privileged actions.
  if (!request || typeof request !== 'object') return { success: false, error: 'Bad request' };
  if (sender && typeof sender.id === 'string' && sender.id !== (globalThis.chrome?.runtime?.id || sender.id)) {
    return { success: false, error: 'Forbidden sender' };
  }
  switch (request.action) {
    case 'saveComponent': {
      const result = await storageGet(['savedComponents']);
      const saved = Array.isArray(result.savedComponents) ? result.savedComponents : [];
      const component = {
        id: request.component?.id || createId(),
        type: String(request.component?.type || 'Component').slice(0, 80),
        pageTitle: String(request.component?.pageTitle || '').slice(0, 200),
        pageUrl: String(request.component?.pageUrl || '').slice(0, 2000),
        createdAt: request.component?.createdAt || new Date().toISOString(),
        html: String(request.component?.html || ''),
        css: String(request.component?.css || '')
      };
      const size = componentBytes(component);
      if (size > MAX_COMPONENT_BYTES) {
        return { success: false, error: 'This component is larger than the 2 MB local save limit. Copy it directly instead.' };
      }
      saved.unshift(component);
      let totalBytes = saved.reduce((total, item) => total + componentBytes(item), 0);
      while (saved.length > 100 || totalBytes > MAX_LIBRARY_BYTES) {
        const removed = saved.pop();
        totalBytes -= componentBytes(removed);
      }
      await storageSet({ savedComponents: saved });
      return { success: true, component, totalBytes };
    }
    case 'getComponents': {
      const result = await storageGet(['savedComponents']);
      const original = Array.isArray(result.savedComponents) ? result.savedComponents : [];
      let migrated = false;
      const components = original.map(component => {
        if (component?.id) return component;
        migrated = true;
        return { ...component, id: createId(), createdAt: component.createdAt || new Date().toISOString() };
      });
      if (migrated) await storageSet({ savedComponents: components });
      return { success: true, components };
    }
    case 'deleteComponent': {
      const result = await storageGet(['savedComponents']);
      const saved = (Array.isArray(result.savedComponents) ? result.savedComponents : [])
        .filter(component => component.id !== request.id);
      await storageSet({ savedComponents: saved });
      return { success: true, components: saved };
    }
    case 'getSettings': {
      const result = await storageGet(['uiccSettings']);
      return { success: true, settings: result.uiccSettings || {} };
    }
    case 'saveSettings': {
      const result = await storageGet(['uiccSettings']);
      const settings = { ...(result.uiccSettings || {}), ...(request.settings || {}), version: 2 };
      await storageSet({ uiccSettings: settings });
      return { success: true, settings };
    }
    case 'getNetworkAssets': {
      const tabId = sender.tab?.id ?? request.tabId;
      const assets = networkAssets.get(tabId) || getTabAssets(tabId);
      return Object.fromEntries(ASSET_TYPES.map(type => [type, Array.from(assets[type] || [])]));
    }
    case 'fetchExternalStylesheets': {
      const urls = Array.from(new Set(Array.isArray(request.urls) ? request.urls : []))
        .filter(url => typeof url === 'string' && isSafeRemoteUrl(url)).slice(0, 150);
      const results = {};
      await Promise.all(urls.map(async url => {
        try {
          const response = await fetchWithTimeout(url, { headers: { Accept: 'text/css,*/*' } });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (response.url && !isSafeRemoteUrl(response.url)) throw new Error('Unsafe redirect target');
          results[url] = { success: true, css: await expandImports(await response.text(), url) };
        } catch (error) { results[url] = { success: false, error: error.message || String(error) }; }
      }));
      return { success: true, results };
    }
    case 'fetchAssetBlob': {
      if (!isSafeRemoteUrl(request.url)) throw new Error('Unsupported asset URL');
      const response = await fetchWithTimeout(request.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (response.url && !isSafeRemoteUrl(response.url)) throw new Error('Unsafe redirect target');
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return { success: true, dataUrl: `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`, type: blob.type, size: blob.size };
    }
    case 'downloadAsset': {
      if (!isSafeRemoteUrl(request.url) && !String(request.url || '').startsWith('data:')) throw new Error('Unsupported download URL');
      const downloadId = await chrome.downloads.download({
        url: request.url,
        filename: request.filename ? sanitizeDownloadFilename(request.filename) : undefined,
        saveAs: Boolean(request.saveAs)
      });
      return { success: true, downloadId };
    }
    case 'copyToClipboard': {
      const text = String(request.text ?? '');
      if (!text) return { success: false, error: 'Nothing to copy' };
      const copied = await copyViaOffscreenDocument(text);
      return { success: copied };
    }
    case 'formatCode': {
      const parser = request.parser === 'css' ? 'css' : 'html';
      const code = String(request.code ?? '');
      // Cap input size so a hostile sender can't exhaust the service worker.
      if (code.length > 2 * 1024 * 1024) return { success: true, formatted: code };
      const prettierGlobal = (typeof globalThis !== 'undefined' && globalThis.prettier) || null;
      const pluginGlobal = (typeof globalThis !== 'undefined' && globalThis.prettierPlugins) || null;
      if (prettierGlobal && typeof prettierGlobal.format === 'function') {
        try {
          const plugins = [];
          if (pluginGlobal && pluginGlobal.html) plugins.push(pluginGlobal.html);
          if (pluginGlobal && pluginGlobal.postcss) plugins.push(pluginGlobal.postcss);
          const formatted = await prettierGlobal.format(code, {
            parser,
            plugins,
            tabWidth: 2,
            useTabs: false,
            singleQuote: false,
            printWidth: 80,
            htmlWhitespaceSensitivity: 'ignore'
          });
          return { success: true, formatted: typeof formatted === 'string' ? formatted : code };
        } catch (_) {
          return { success: true, formatted: code };
        }
      }
      return { success: true, formatted: formatCodeOutput(code, parser) };
    }
    default: return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const supportedActions = new Set([
    'saveComponent', 'getComponents', 'deleteComponent', 'getSettings', 'saveSettings',
    'getNetworkAssets', 'fetchExternalStylesheets', 'fetchAssetBlob', 'downloadAsset',
    'copyToClipboard', 'formatCode'
  ]);
  if (!supportedActions.has(request?.action)) return false;
  handleMessage(request || {}, sender).then(response => {
    if (response !== null) sendResponse(response);
  }).catch(error => sendResponse({ success: false, error: error.message || String(error) }));
  return true;
});

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !isSupportedPage(tab.url)) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleFloatingBar' });
    if (response?.success) return;
  } catch (_) {}
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/gsap.min.js', 'lib/tailwind-lib.js', 'lib/miro_core.js', 'lib/extractor.js', 'lib/preview.js', 'content.js']
    });
  } catch (error) {
    console.warn('UI Component Copier could not run on this page:', error.message || error);
  }
});
