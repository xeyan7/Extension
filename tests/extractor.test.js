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
    assert.match(css, /\.uicc-s0\s*\{/);
    assert.match(css, /\.uicc-s0:hover/);
    assert.match(css, /\.uicc-s1:hover/);
    assert.match(css, /\.uicc-s0::before/);
    assert.match(css, /\.uicc-s1\s*\{/);
    assert.match(css, /@media \(max-width: 600px\)/);
    assert.match(css, /@keyframes spin/);
    assert.match(css, /Keep Font/);
    assert.match(css, /https:\/\/example\.com\/page\/keep\.woff2/);
    assert.match(css, /color: rgb\(20, 30, 40\)/);
    assert.doesNotMatch(css, /unrelated|Drop Font|@keyframes unused/);
  } finally {
    globalThis.postcss = previousPostcss;
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});
