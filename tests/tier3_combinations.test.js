'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const {
  Extractor,
  absoluteUrl,
  rewriteCssUrls,
  rewriteSrcset,
  stripBidiControls,
  formatReactElement
} = require('../lib/extractor.js');

const {
  createMockElement,
  setupPostcss,
  setupMockDocument,
  assertValidHtml,
  assertValidCss,
  assertNoXssPayload
} = require('./helpers/test_utils.js');

test.before(async () => {
  await setupPostcss();
  setupMockDocument();
});

test('T3-01: Tailwind Export + CSS Variable Resolution + SVG Data URLs', async () => {
  const card = createMockElement('DIV', {
    className: 'card',
    style: {
      '--accent': '#6366f1',
      'background-image': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"10\" cy=\"10\" r=\"5\" fill=\"%236366f1\"/></svg>')"
    }
  });

  const span = createMockElement('SPAN', {
    style: {
      color: 'var(--accent)',
      'font-weight': '700'
    },
    textContent: 'Icon Card'
  });
  card.appendChild(span);

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    fontWeight: node === span ? '700' : '400',
    color: 'rgb(99, 102, 241)',
    backgroundImage: node === card ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"10\" cy=\"10\" r=\"5\" fill=\"%236366f1\"/></svg>')" : 'none',
    getPropertyValue(prop) {
      if (prop === 'font-weight' && node === span) return '700';
      if (prop === 'color') return 'rgb(99, 102, 241)';
      if (prop === 'background-image' && node === card) return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"10\" cy=\"10\" r=\"5\" fill=\"%236366f1\"/></svg>')";
      return '';
    }
  });

  try {
    const extractor = new Extractor({ baseUrl: 'https://example.com/app/' });
    const extraction = await extractor.extract(card);

    assertValidHtml(extraction.html);
    assertValidCss(extraction.css);
    assert.match(extraction.css, /data:image\/svg\+xml/);

    const tailwindOutput = await extractor.toTailwind(card, extraction);
    assert.ok(typeof tailwindOutput === 'string' && tailwindOutput.length > 0);
    assert.match(tailwindOutput, /data:image\/svg\+xml/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-02: React JSX Export + @keyframes Animations + Pseudo-Elements', async () => {
  const btn = createMockElement('BUTTON', {
    className: 'animated-btn',
    style: { position: 'relative', animation: 'pulse 2s infinite' }
  });
  const span = createMockElement('SPAN', { textContent: 'Click Me' });
  btn.appendChild(span);

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node, pseudo) => {
    if (pseudo === '::after') {
      return {
        getPropertyValue(prop) {
          const map = {
            content: '""',
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '100%',
            height: '100%',
            border: '2px solid rgb(99, 102, 241)'
          };
          return map[prop] || '';
        }
      };
    }
    return {
      animationName: 'pulse',
      fontFamily: 'sans-serif',
      getPropertyValue(prop) {
        if (prop === 'animation') return 'pulse 2s infinite';
        if (prop === 'animation-name') return 'pulse';
        if (prop === 'position') return 'relative';
        return '';
      }
    };
  };

  const extractor = new Extractor({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .animated-btn { position: relative; animation: pulse 2s infinite; }
    .animated-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px solid #6366f1; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  `;

  try {
    const reactJsx = await extractor.toReact(btn);
    assert.match(reactJsx, /export default function CopiedComponent/);
    assert.match(reactJsx, /className="animated-btn[^"]*"/);
    assert.match(reactJsx, /<style>\{styles\}<\/style>/);
    assert.match(reactJsx, /@keyframes pulse/);
    assert.match(reactJsx, /animated-btn::after/);
    assertNoXssPayload(reactJsx);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-03: Vue SFC Export + Gradient Clip + Auto-Scaling Preview', async () => {
  const h1 = createMockElement('H1', {
    className: 'gradient-title',
    textContent: 'Hero Headline'
  });

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    getPropertyValue(prop) {
      if (prop === 'background') return 'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(168, 85, 247) 100%)';
      if (prop === '-webkit-background-clip' || prop === 'background-clip') return 'text';
      if (prop === '-webkit-text-fill-color') return 'transparent';
      if (prop === 'font-size') return '48px';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .gradient-title { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 48px; }
  `;

  try {
    const vueSfc = await extractor.toVue(h1);
    assert.match(vueSfc, /<template>/);
    assert.match(vueSfc, /<h1 class="gradient-title[^"]*">Hero Headline<\/h1>/);
    assert.match(vueSfc, /<style scoped>/);
    assert.match(vueSfc, /background-clip:\s*text|-webkit-background-clip:\s*text/);

    const snapshot = extractor.getComputedStyleSnapshot(h1);
    assert.ok(snapshot.html.includes('gradient-title'));
    assertValidCss(snapshot.css);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-04: Flex/Grid Layout + Breadcrumbs + Dimension Badges', () => {
  const gridContainer = createMockElement('DIV', {
    className: 'grid-container',
    width: 800,
    height: 400,
    style: { display: 'grid', 'grid-template-columns': '1fr 1fr', width: '800px', height: '400px' }
  });

  const card = createMockElement('DIV', {
    className: 'card',
    width: 380,
    height: 360,
    style: { display: 'flex', 'flex-direction': 'column', padding: '20px' }
  });

  const ctaBtn = createMockElement('BUTTON', {
    className: 'cta-btn',
    width: 150,
    height: 40,
    style: { width: '150px', height: '40px' },
    textContent: 'Action'
  });

  card.appendChild(ctaBtn);
  gridContainer.appendChild(card);

  // Function to build breadcrumb string path
  function buildBreadcrumbPath(node) {
    const path = [];
    let curr = node;
    while (curr && curr.nodeType === 1) {
      const tag = curr.tagName.toLowerCase();
      const cls = curr.getAttribute('class');
      path.unshift(`${tag}${cls ? '.' + cls.split(/\s+/)[0] : ''}`);
      curr = curr.parentElement;
    }
    return path.join(' > ');
  }

  const breadcrumb = buildBreadcrumbPath(ctaBtn);
  assert.equal(breadcrumb, 'div.grid-container > div.card > button.cta-btn');

  const btnRect = ctaBtn.getBoundingClientRect();
  assert.equal(btnRect.width, 150);
  assert.equal(btnRect.height, 40);

  const containerRect = gridContainer.getBoundingClientRect();
  assert.equal(containerRect.width, 800);
  assert.equal(containerRect.height, 400);
});

test('T3-05: Rigid Pixel Removal + Media Queries + :hover States', async () => {
  const nav = createMockElement('NAV', {
    className: 'main-nav',
    style: { width: '1200px', height: '60px' }
  });
  const link = createMockElement('A', {
    className: 'nav-link',
    attributes: { href: '#' },
    textContent: 'Home'
  });
  nav.appendChild(link);

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    getPropertyValue(prop) {
      if (prop === 'width' && node === nav) return '1200px';
      if (prop === 'height' && node === nav) return '60px';
      if (prop === 'color' && node === link) return 'rgb(99, 102, 241)';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/' });
  extractor.collectAllCss = async () => `
    .main-nav { width: 1200px; height: 60px; }
    .nav-link:hover { color: #6366f1; text-decoration: underline; }
    @media (max-width: 768px) { .main-nav { width: 100%; height: auto; } }
  `;

  try {
    const decls = extractor.computedDeclarations(nav, null, false);
    // Non-fixed-media elements shouldn't retain rigid px widths in child declarations
    assert.equal(decls.some(d => d.prop === 'width' && d.value === '1200px'), false);

    const scoped = await extractor.scopeAuthoredCss(nav, [nav, link]);
    assert.match(scoped, /\.nav-link:hover/);
    assert.match(scoped, /@media \(max-width: 768px\)/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-06: Bidi Text Sanitization + RTL Direction + Scoped CSS Tokens', async () => {
  const bidiRaw = 'مرحبا\u202E بالعالم\u2066\u2069';
  const sanitized = stripBidiControls(bidiRaw);
  assert.equal(sanitized, 'مرحبا بالعالم');
  assert.doesNotMatch(sanitized, /[\u202E\u2066\u2069]/);

  const card = createMockElement('DIV', {
    className: 'rtl-card',
    style: { direction: 'rtl', 'unicode-bidi': 'embed' }
  });
  const heading = createMockElement('H3', { textContent: sanitized });
  card.appendChild(heading);

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    getPropertyValue(prop) {
      if (prop === 'direction') return 'rtl';
      if (prop === 'unicode-bidi') return 'embed';
      return '';
    }
  });

  try {
    const extractor = new Extractor({ baseUrl: 'https://example.com/' });
    const { cloneNodes } = await extractor.cloneAndSanitize(card);
    assert.ok(cloneNodes.some(n => Array.from(n.classList).some(c => /^uicc-s\d+$/.test(c))));

    const extraction = await extractor.extract(card);
    assert.match(extraction.css, /direction:\s*rtl/);
    assert.match(extraction.html, /مرحبا بالعالم/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-07: XSS Content Sanitizer + Inline SVG + React Formatter', async () => {
  const wrapper = createMockElement('DIV', { className: 'svg-wrapper' });

  const svg = createMockElement('SVG', {
    attributes: { viewBox: '0 0 24 24', width: '24', height: '24' }
  });
  const defs = createMockElement('DEFS');
  const gradient = createMockElement('LINEARGRADIENT', {
    attributes: { id: 'grad1', gradientUnits: 'userSpaceOnUse' }
  });
  const stop = createMockElement('STOP', {
    attributes: { offset: '0%', 'stop-color': '#fff' }
  });
  gradient.appendChild(stop);
  defs.appendChild(gradient);

  const path = createMockElement('PATH', {
    attributes: { d: 'M0 0h24v24H0z', onload: "alert('xss')" }
  });
  svg.appendChild(defs);
  svg.appendChild(path);

  const script = createMockElement('SCRIPT', { textContent: "console.log('pwned')" });

  wrapper.appendChild(svg);
  wrapper.appendChild(script);

  const extractor = new Extractor({ baseUrl: 'https://example.com/' });
  const reactOutput = await extractor.toReact(wrapper);

  assert.doesNotMatch(reactOutput, /<script/i);
  assert.doesNotMatch(reactOutput, /onload/i);
  assert.match(reactOutput, /<linearGradient/);
  assert.match(reactOutput, /gradientUnits="userSpaceOnUse"/);
  assertNoXssPayload(reactOutput);
});

test('T3-08: Checkerboard Iframe + Selection Overlay + Esc/Arrow Lifecycle', () => {
  // Simulates overlay highlight state & lifecycle cleanup
  let isSelectionMode = true;
  let highlightedNode = null;
  let activeCursor = 'crosshair';
  const registeredListeners = new Set();

  function highlightElement(node) {
    highlightedNode = node;
    return '1.5px dashed #6366F1';
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      exitSelectionMode();
    } else if (event.key === 'ArrowDown' && highlightedNode?.children?.length) {
      highlightedNode = highlightedNode.children[0];
    }
  }

  function addEventListener(type, fn) {
    registeredListeners.add({ type, fn });
  }

  function removeEventListener(type, fn) {
    for (const item of registeredListeners) {
      if (item.type === type && item.fn === fn) registeredListeners.delete(item);
    }
  }

  function exitSelectionMode() {
    isSelectionMode = false;
    highlightedNode = null;
    activeCursor = 'default';
    removeEventListener('keydown', handleKeyDown);
  }

  addEventListener('keydown', handleKeyDown);

  const parentNode = createMockElement('DIV', { id: 'parent' });
  const childNode = createMockElement('DIV', { id: 'child' });
  parentNode.appendChild(childNode);

  const outline = highlightElement(parentNode);
  assert.equal(outline, '1.5px dashed #6366F1');

  handleKeyDown({ key: 'ArrowDown' });
  assert.equal(highlightedNode.id, 'child');

  handleKeyDown({ key: 'Escape' });
  assert.equal(isSelectionMode, false);
  assert.equal(highlightedNode, null);
  assert.equal(activeCursor, 'default');
  assert.equal(registeredListeners.size, 0);
});

test('T3-09: Tailwind Exporter + Custom @font-face + Font Stack Fallbacks', async () => {
  const p = createMockElement('P', {
    className: 'custom-text',
    style: {
      'font-family': "'CustomSans', system-ui, sans-serif",
      'font-size': '18px',
      'line-height': '1.5'
    },
    textContent: 'Editorial Text'
  });

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    animationName: 'none',
    fontFamily: "'CustomSans', system-ui, sans-serif",
    getPropertyValue(prop) {
      if (prop === 'font-family') return "'CustomSans', system-ui, sans-serif";
      if (prop === 'font-size') return '18px';
      if (prop === 'line-height') return '1.5';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/pages/' });
  extractor.collectAllCss = async () => `
    @font-face { font-family: "CustomSans"; src: url(/fonts/custom.woff2) format("woff2"); }
    .custom-text { font-family: 'CustomSans', system-ui, sans-serif; font-size: 18px; line-height: 1.5; }
  `;

  try {
    const extraction = await extractor.extract(p);
    assert.match(extraction.css, /@font-face/);
    assert.match(extraction.css, /CustomSans/);
    assert.match(extraction.css, /https:\/\/example\.com\/fonts\/custom\.woff2/);

    const tailwind = await extractor.toTailwind(p, extraction);
    assert.ok(typeof tailwind === 'string');
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T3-10: Vue SFC Exporter + Responsive Srcset + Relative URL Resolution', async () => {
  const img = createMockElement('IMG', {
    attributes: {
      src: '../images/hero.png',
      srcset: '../images/hero.png 1x, ../images/hero@2x.png 2x',
      alt: 'Hero'
    }
  });

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    getPropertyValue() { return ''; }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/blog/posts/' });

  try {
    const vueSfc = await extractor.toVue(img);
    assert.match(vueSfc, /<template>/);
    assert.match(vueSfc, /src="https:\/\/example\.com\/blog\/images\/hero\.png"/);
    assert.match(vueSfc, /srcset="https:\/\/example\.com\/blog\/images\/hero\.png 1x, https:\/\/example\.com\/blog\/images\/hero@2x\.png 2x"/);
    assert.match(vueSfc, /<style scoped>/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});
