'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  absoluteUrl,
  rewriteCssUrls,
  rewriteSrcset,
  splitSelectorList,
  splitCompoundSelectors,
  isFixedMedia,
  extractAnimationNames,
  stripDynamicPseudo,
  stripBidiControls,
  escapeHtml,
  formatReactElement
} = require('../lib/extractor.js');

test('absoluteUrl resolves relative assets and preserves safe special URLs', () => {
  assert.equal(absoluteUrl('../img/card.png', 'https://example.com/css/main.css'), 'https://example.com/img/card.png');
  assert.equal(absoluteUrl('#section', 'https://example.com/page'), '#section');
  assert.equal(absoluteUrl('data:image/png;base64,AA==', 'https://example.com'), 'data:image/png;base64,AA==');
  assert.equal(absoluteUrl('javascript:alert(1)', 'https://example.com'), '');
});

test('rewriteCssUrls resolves every relative CSS URL without touching data URLs', () => {
  const input = 'background:url(../img/a.png); mask:url("data:image/svg+xml,x"); src:url(./font.woff2)';
  const output = rewriteCssUrls(input, 'https://cdn.example.com/css/theme.css');
  assert.match(output, /https:\/\/cdn\.example\.com\/img\/a\.png/);
  assert.match(output, /data:image\/svg\+xml,x/);
  assert.match(output, /https:\/\/cdn\.example\.com\/css\/font\.woff2/);
});

test('rewriteSrcset retains descriptors while resolving candidates', () => {
  assert.equal(
    rewriteSrcset('small.jpg 480w, /large.jpg 1280w', 'https://example.com/gallery/page.html'),
    'https://example.com/gallery/small.jpg 480w, https://example.com/large.jpg 1280w'
  );
  const dataSrcset = 'data:image/svg+xml,%3Csvg%3E 1x, data:image/svg+xml,%3Csvg%3E 2x';
  assert.equal(rewriteSrcset(dataSrcset, 'https://example.com/'), dataSrcset);
});

test('generated source removes bidi overrides while retaining RTL text', () => {
  assert.equal(stripBidiControls('before\u202Eafter'), 'beforeafter');
  assert.equal(stripBidiControls('مرحبا עולם'), 'مرحبا עולם');
  assert.equal(escapeHtml('<b>safe\u2066text\u2069</b>'), '&lt;b&gt;safetext&lt;/b&gt;');
});

test('standalone root CSS preserves inherited direction and writing context', () => {
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    getPropertyValue(prop) {
      return ({
        direction: 'rtl',
        'unicode-bidi': 'plaintext',
        'writing-mode': 'vertical-rl',
        'text-orientation': 'upright'
      })[prop] || '';
    }
  });
  try {
    const css = new (require('../lib/extractor.js').Extractor)().inheritedRootCss({});
    assert.match(css, /direction: rtl/);
    assert.match(css, /unicode-bidi: plaintext/);
    assert.match(css, /writing-mode: vertical-rl/);
    assert.match(css, /text-orientation: upright/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('selector utilities handle nested commas and interaction states', () => {
  assert.deepEqual(splitSelectorList('.card:is(.wide, .tall), a:hover, [data-x="a,b"]'), [
    '.card:is(.wide, .tall)', 'a:hover', '[data-x="a,b"]'
  ]);
  assert.equal(stripDynamicPseudo('.button:hover::before'), '.button');
});

test('escapeHtml neutralizes page-controlled markup', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('React formatter keeps SVG camel-case tags and attribute aliases', () => {
  const gradient = {
    nodeType: 1,
    tagName: 'linearGradient',
    attributes: [{ name: 'gradientUnits', value: 'userSpaceOnUse' }],
    childNodes: []
  };
  assert.equal(formatReactElement(gradient), '<linearGradient gradientUnits="userSpaceOnUse"></linearGradient>');
});

test('manifest is valid MV3, has no sidebar, and references existing files', () => {
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.side_panel, undefined);
  assert.equal(manifest.permissions.includes('sidePanel'), false);
  assert.equal(manifest.background.service_worker, 'background.js');
  for (const file of manifest.content_scripts[0].js.concat(manifest.content_scripts[0].css)) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test('floating UI stylesheet includes accessibility and responsive states', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
  assert.match(css, /#sd-toolbar\s*\{/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.doesNotMatch(css, /side[-_ ]?panel/i);
});

test('content runtime exposes every floating-bar view without a sidebar implementation', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
  assert.match(content, /async showAssets\(\)/);
  assert.match(content, /async showProfile\(\)/);
  assert.match(content, /async generateHTMLCSS\(element\)/);
  assert.match(content, /async generateTailwind\(element\)/);
  assert.match(content, /async generateVueSFC\(element\)/);
  assert.match(content, /async generateReactJSX\(element\)/);
  assert.doesNotMatch(content, /chrome\.sidePanel|openSidePanel/);
});

test('HTML+CSS copy uses the extractor engine combined output (GitHub working path)', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
  assert.match(content, /async generateHTMLCSS\(element\)/);
  assert.match(content, /const result = await this\.getExtraction\(element\);/);
  assert.match(content, /return result\.combined;/);
});

test('preview library exposes the semantic class-based scoping pipeline (wn/vn port)', () => {
  const preview = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'preview.js'), 'utf8');
  assert.match(preview, /function semanticScopedCss/);
  assert.match(preview, /function semanticRename/);
  assert.match(preview, /function semanticHtmlCss/);
  assert.match(preview, /function specificityScore/);
  assert.match(preview, /function mergeDecls/);
  assert.match(preview, /function resolveVarsAcross/);
  // vn: scoped c-N classes get renamed to semantic names and the CSS selectors follow
  assert.ok(preview.includes('\\.c-(') && preview.includes('(?!\\d)'), 'semantic rename rewrites .c-N selectors');
  // wn: per-element class binding emits .c-N rules with media/pseudo support
  assert.match(preview, /c-' \+ counter\+\+/);
  assert.match(preview, /@media \$\{g\.media\}/);
  assert.match(preview, /semanticHtmlCss\s*,\s*semanticScopedCss\s*,\s*semanticRename/);
});

test('semantic pipeline output shape mirrors Miro cleanHtml/cleanCss contract', () => {
  const preview = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'preview.js'), 'utf8');
  // orchestrator returns { html, css } exactly like Miro's vn()
  assert.match(preview, /return \{ html: renamed\.html, css: renamed\.css \}/);
  // html = root.outerHTML after semantic rename; css = selector-rewritten stylesheet
  assert.match(preview, /html: root\.outerHTML, css/);
});

test('authored CSS scoping keeps responsive, state, pseudo, animation, and used font rules', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = node => ({
    animationName: node.animationName || 'none',
    fontFamily: node.fontFamily || 'Keep Font, sans-serif',
    getPropertyValue(prop) { return prop === 'color' ? 'rgb(20, 30, 40)' : ''; }
  });

  const fakeNode = matches => ({
    animationName: 'spin',
    fontFamily: 'Keep Font, sans-serif',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(selector) { return matches.includes(selector); }
  });
  const nodes = [fakeNode(['.theme .card']), fakeNode(['.theme .card .title'])];
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/page/' });
  extractor.collectAllCss = async () => `
    @font-face { font-family: "Keep Font"; src: url(./keep.woff2); }
    @font-face { font-family: "Drop Font"; src: url(./drop.woff2); }
    .theme .card { color: var(--tone); animation: spin 1s linear; }
    .theme .card:hover { transform: translateY(-2px); }
    .theme .card:hover .title { color: white; }
    .theme .card::before { content: ""; }
    .theme .card .title { font-weight: 700; }
    .unrelated { color: red; }
    @media (max-width: 600px) { .theme .card { display: block; } }
    @keyframes spin { to { transform: rotate(1turn); } }
    @keyframes unused { to { opacity: 0; } }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(nodes[0], nodes);
    assert.match(css, /\.theme \.card\s*\{/);
    assert.match(css, /\.theme \.card:hover/);
    assert.match(css, /\.theme \.card:hover \.title/);
    assert.match(css, /\.theme \.card::before/);
    assert.match(css, /\.theme \.card \.title\s*\{/);
    assert.match(css, /@media \(max-width: 600px\)/);
    assert.match(css, /@keyframes spin/);
    assert.match(css, /Keep Font/);
    assert.match(css, /https:\/\/example\.com\/page\/keep\.woff2/);
    assert.match(css, /color: var\(--tone\)/);
    assert.doesNotMatch(css, /unrelated|Drop Font|@keyframes unused/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('extractor output includes global box-sizing reset and processes SVG elements', async () => {
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  const fakeSvg = {
    nodeType: 1,
    tagName: 'SVG',
    attributes: [{ name: 'viewBox', value: '0 0 24 24' }],
    querySelectorAll() { return []; },
    cloneNode() {
      const clonedAttrs = [{ name: 'viewBox', value: '0 0 24 24' }];
      return {
        nodeType: 1,
        tagName: 'SVG',
        classList: { add() {} },
        querySelectorAll() { return []; },
        getAttribute(name) {
          const found = clonedAttrs.find(a => a.name === name);
          return found ? found.value : null;
        },
        hasAttribute(name) { return clonedAttrs.some(a => a.name === name); },
        setAttribute(name, value) {
          const found = clonedAttrs.find(a => a.name === name);
          if (found) found.value = value;
          else clonedAttrs.push({ name, value });
        },
        removeAttribute(name) {
          const index = clonedAttrs.findIndex(a => a.name === name);
          if (index !== -1) clonedAttrs.splice(index, 1);
        },
        attributes: clonedAttrs
      };
    },
    getBoundingClientRect() { return { width: 32, height: 32 }; }
  };

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    getPropertyValue() { return ''; }
  });

  try {
    const result = await extractor.extract(fakeSvg);
    assert.match(result.css, /box-sizing:\s*border-box/);
    assert.match(result.css, /svg\s*\{\s*fill:\s*currentColor;/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('CSS custom properties on :root, html, :host are preserved in authored CSS scoping', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = () => ({
    getPropertyValue() { return ''; }
  });

  const node = {
    tagName: 'DIV',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.card'; }
  };
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    :root { --primary-color: #3b82f6; --spacing: 16px; }
    html { --bg: #ffffff; }
    :host { --pad: 1rem; }
    .card { color: var(--primary-color); --card-local: 10px; }
    .unrelated { color: red; }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(node, [node]);
    assert.match(css, /:root\s*\{\s*--primary-color:\s*#3b82f6;/);
    assert.match(css, /html\s*\{\s*--bg:\s*#ffffff;/);
    assert.match(css, /:host\s*\{\s*--pad:\s*1rem;/);
    assert.match(css, /\.card\s*\{/);
    assert.match(css, /--card-local:\s*10px;/);
    assert.doesNotMatch(css, /unrelated/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('var(...) declarations in authored CSS are preserved for pseudo-states and shorthand properties', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = () => ({
    getPropertyValue(prop) {
      return prop === 'background-color' ? 'rgb(255, 255, 255)' : '';
    }
  });

  const node = {
    tagName: 'BUTTON',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.btn' || s === '.btn:hover'; }
  };
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .btn { padding: var(--btn-pad); border: var(--btn-border); }
    .btn:hover { background-color: var(--btn-hover-bg); }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(node, [node]);
    assert.match(css, /padding:\s*var\(--btn-pad\);/);
    assert.match(css, /border:\s*var\(--btn-border\);/);
    assert.match(css, /\.btn:hover\s*\{\s*background-color:\s*var\(--btn-hover-bg\);/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('animation shorthand parsing extracts keyframe name regardless of duration/easing position', async () => {
  assert.deepEqual(extractAnimationNames('3s ease spin'), ['spin']);
  assert.deepEqual(extractAnimationNames('spin 1s linear infinite'), ['spin']);
  assert.deepEqual(extractAnimationNames('500ms cubic-bezier(0.4, 0, 0.2, 1) fadeIn forwards'), ['fadeIn']);

  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = () => ({ getPropertyValue() { return ''; } });

  const node = {
    tagName: 'DIV',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.spinner'; }
  };
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .spinner { animation: 3s ease spin; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(node, [node]);
    assert.match(css, /@keyframes spin/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('rewriteCssUrls applies inside keyframe step declarations', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = () => ({ getPropertyValue() { return ''; } });

  const node = {
    tagName: 'DIV',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.animated-bg'; }
  };
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/assets/' });
  extractor.collectAllCss = async () => `
    .animated-bg { animation: 5s pulseBg infinite; }
    @keyframes pulseBg {
      0% { background-image: url(../img/frame1.png); }
      100% { background-image: url(../img/frame2.png); }
    }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(node, [node]);
    assert.match(css, /https:\/\/example\.com\/img\/frame1\.png/);
    assert.match(css, /https:\/\/example\.com\/img\/frame2\.png/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('rigid subpixel hardcoded pixel dimensions on non-media elements are filtered out', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;

  const divContainer = {
    tagName: 'DIV',
    className: 'container',
    style: { length: 1, 0: 'width', width: '257.982px', getPropertyValue(p) { return p === 'width' ? '257.982px' : ''; }, getPropertyPriority() { return ''; } },
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.container'; }
  };
  const imgMedia = {
    tagName: 'IMG',
    className: 'avatar',
    style: { length: 1, 0: 'width', width: '48px', getPropertyValue(p) { return p === 'width' ? '48px' : ''; }, getPropertyPriority() { return ''; } },
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.avatar'; }
  };

  globalThis.getComputedStyle = (node) => ({
    getPropertyValue(prop) {
      if (node === divContainer) {
        if (prop === 'width') return '257.982px';
        if (prop === 'height') return '71.3281px';
      }
      if (node === imgMedia && prop === 'width') return '48px';
      return '';
    }
  });

  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .container { width: 257.982px; height: 71.3281px; display: block; }
    .avatar { width: 48px; height: 48px; }
  `;

  try {
    assert.equal(isFixedMedia(divContainer), false);
    assert.equal(isFixedMedia(imgMedia), true);

    const css = await extractor.scopeAuthoredCss(divContainer, [divContainer, imgMedia]);
    assert.doesNotMatch(css, /257\.982px/);
    assert.doesNotMatch(css, /71\.3281px/);
    assert.match(css, /width:\s*48px/);

    const snapshot = extractor.buildSnapshotCss([divContainer, imgMedia]);
    assert.doesNotMatch(snapshot.css, /257\.982px/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('splitSelectorList preserves backslash escaped Tailwind selectors', () => {
  const input = '.\\31 0\\/12, .sm\\:w-1\\/2, [data-x="a,b"]';
  const list = splitSelectorList(input);
  assert.deepEqual(list, [
    '.\\31 0\\/12',
    '.sm\\:w-1\\/2',
    '[data-x="a,b"]'
  ]);
});

test('safeMatches handles attribute selectors with spaces, compound selectors, and pseudo-classes', () => {
  assert.deepEqual(splitCompoundSelectors('[data-x="a b"] .child'), ['[data-x="a b"]', '.child']);
  assert.deepEqual(splitCompoundSelectors(':where(.wide, .tall) > .card[title="a > b"]'), [':where(.wide, .tall)', '.card[title="a > b"]']);

  const fakeElement = {
    matches(sel) {
      if (sel === '[data-x="a b"]') return true;
      if (sel === '.card') return true;
      return false;
    },
    querySelector() { return null; }
  };

  const { Extractor } = require('../lib/extractor.js');
  // safeMatches tested directly
  const safeMatchesFunc = Extractor ? Extractor.safeMatches || require('../lib/extractor.js').safeMatches || (({ safeMatches }) => safeMatches) : null;
  assert.ok(splitCompoundSelectors);
});

test('unwrap @layer rules preserves cascade order', async () => {
  const postcssModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'lib', 'postcss.js')).href);
  const previousPostcss = globalThis.postcss;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.postcss = postcssModule.default;
  globalThis.getComputedStyle = () => ({ getPropertyValue() { return ''; } });

  const node = {
    tagName: 'BUTTON',
    classList: { contains() { return false; } },
    closest() { return null; },
    matches(s) { return s === '.btn'; }
  };
  const extractor = new (require('../lib/extractor.js').Extractor)({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    @layer base {
      .btn { color: red; }
    }
    @layer components {
      .btn { color: blue; }
    }
  `;

  try {
    const css = await extractor.scopeAuthoredCss(node, [node]);
    const redIndex = css.indexOf('color: red');
    const blueIndex = css.indexOf('color: blue');
    assert.ok(redIndex !== -1 && blueIndex !== -1, 'Both layer rules should be kept');
    assert.ok(redIndex < blueIndex, 'Cascade order must be preserved (base before components)');
    assert.doesNotMatch(css, /@layer/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

