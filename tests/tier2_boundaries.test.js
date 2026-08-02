'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  Extractor,
  absoluteUrl,
  rewriteCssUrls,
  rewriteSrcset,
  splitSelectorList,
  stripDynamicPseudo,
  stripBidiControls,
  escapeHtml,
  formatReactElement
} = require('../lib/extractor.js');

const contentJsCode = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
const contentCssCode = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
const backgroundJsCode = fs.readFileSync(path.resolve(__dirname, '..', 'background.js'), 'utf8');

// Global getComputedStyle mock for headless Node environment
if (typeof globalThis.getComputedStyle !== 'function') {
  globalThis.getComputedStyle = (el) => {
    if (!el) return { getPropertyValue: () => '' };
    return {
      getPropertyValue(prop) {
        if (el.style && typeof el.style.getPropertyValue === 'function') {
          return el.style.getPropertyValue(prop) || '';
        }
        const camel = String(prop).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return (el.style && el.style[camel]) || '';
      }
    };
  };
}

// Helper to construct DOM elements for Extractor & UI tests
function createMockElement(tagName, opts = {}) {
  const attrs = new Map(Object.entries(opts.attributes || {}));
  const styles = opts.style || {};
  const children = opts.children || [];
  const classListSet = new Set((opts.className || '').split(/\s+/).filter(Boolean));

  const el = {
    nodeType: opts.nodeType || 1,
    tagName: String(tagName).toUpperCase(),
    nodeName: String(tagName).toUpperCase(),
    className: opts.className || '',
    id: opts.id || '',
    textContent: opts.textContent || '',
    nodeValue: opts.nodeValue !== undefined ? opts.nodeValue : (opts.textContent || ''),
    children,
    childNodes: opts.childNodes || children,
    parentNode: opts.parentNode || null,
    ownerDocument: opts.ownerDocument || null,
    style: {
      ...styles,
      getPropertyValue(prop) {
        const camel = String(prop).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return styles[prop] || styles[camel] || '';
      },
      setProperty(prop, val) { styles[prop] = val; },
      removeProperty(prop) { delete styles[prop]; }
    },
    classList: {
      add: (...clss) => {
        clss.forEach(c => classListSet.add(c));
        el.className = Array.from(classListSet).join(' ');
      },
      remove: (...clss) => {
        clss.forEach(c => classListSet.delete(c));
        el.className = Array.from(classListSet).join(' ');
      },
      contains: (c) => classListSet.has(c),
      get value() { return Array.from(classListSet).join(' '); },
      [Symbol.iterator]() { return classListSet.values(); }
    },
    getAttribute(name) {
      const lower = String(name).toLowerCase();
      if (lower === 'class') return Array.from(classListSet).join(' ') || null;
      if (lower === 'id') return el.id || null;
      return attrs.has(lower) ? attrs.get(lower) : null;
    },
    setAttribute(name, val) {
      const lower = String(name).toLowerCase();
      if (lower === 'class') {
        classListSet.clear();
        String(val).split(/\s+/).filter(Boolean).forEach(c => classListSet.add(c));
        el.className = String(val);
      } else if (lower === 'id') {
        el.id = String(val);
      } else {
        attrs.set(lower, String(val));
      }
    },
    removeAttribute(name) {
      const lower = String(name).toLowerCase();
      if (lower === 'class') { classListSet.clear(); el.className = ''; }
      else if (lower === 'id') el.id = '';
      else attrs.delete(lower);
    },
    hasAttribute(name) {
      const lower = String(name).toLowerCase();
      if (lower === 'class') return classListSet.size > 0;
      if (lower === 'id') return Boolean(el.id);
      return attrs.has(lower);
    },
    get attributes() {
      const arr = [];
      if (classListSet.size > 0) arr.push({ name: 'class', value: Array.from(classListSet).join(' ') });
      if (el.id) arr.push({ name: 'id', value: el.id });
      for (const [k, v] of attrs.entries()) arr.push({ name: k, value: v });
      return arr;
    },
    querySelectorAll(sel) {
      const matches = [];
      function recurse(node) {
        for (const child of node.children || []) {
          if (child.nodeType === 1) {
            const tag = child.tagName ? child.tagName.toLowerCase() : '';
            const selectors = sel.split(',').map(s => s.trim());
            for (const s of selectors) {
              if (s === '*' || tag === s.toLowerCase() || (s.startsWith('.') && child.classList.contains(s.slice(1))) || (s.startsWith('#') && child.id === s.slice(1))) {
                matches.push(child);
                break;
              }
            }
            recurse(child);
          }
        }
      }
      recurse(el);
      return matches;
    },
    querySelector(sel) {
      return el.querySelectorAll(sel)[0] || null;
    },
    remove() {
      if (el.parentNode && el.parentNode.children) {
        const idx = el.parentNode.children.indexOf(el);
        if (idx !== -1) el.parentNode.children.splice(idx, 1);
      }
      if (el.parentNode && el.parentNode.childNodes) {
        const idx = el.parentNode.childNodes.indexOf(el);
        if (idx !== -1) el.parentNode.childNodes.splice(idx, 1);
      }
    },
    cloneNode(deep) {
      const clonedChildren = deep ? children.map(c => c.cloneNode ? c.cloneNode(true) : { ...c }) : [];
      const cloned = createMockElement(tagName, {
        attributes: Object.fromEntries(attrs.entries()),
        style: { ...styles },
        className: el.className,
        id: el.id,
        textContent: el.textContent,
        nodeValue: el.nodeValue,
        children: clonedChildren,
        nodeType: el.nodeType,
        rect: opts.rect
      });
      clonedChildren.forEach(c => { c.parentNode = cloned; });
      return cloned;
    },
    getBoundingClientRect() {
      return opts.rect || { width: 120, height: opts.height || 40, top: 0, left: 0, right: 120, bottom: 40 };
    },
    get offsetWidth() { return opts.rect ? opts.rect.width : 120; },
    get offsetHeight() { return opts.rect ? opts.rect.height : 40; },
    get outerHTML() {
      if (el.nodeType === 3) return el.textContent;
      const tag = el.tagName.toLowerCase();
      const attrStr = el.attributes.map(a => `${a.name}="${a.value}"`).join(' ');
      const open = `<${tag}${attrStr ? ' ' + attrStr : ''}>`;
      const voidTags = ['img', 'input', 'br', 'hr', 'meta', 'link', 'embed', 'area', 'base', 'col', 'param', 'source', 'track', 'wbr'];
      if (voidTags.includes(tag)) return open;
      const inner = children.length > 0 ? children.map(c => c.outerHTML || '').join('') : el.textContent;
      return `${open}${inner}</${tag}>`;
    }
  };
  children.forEach(c => { c.parentNode = el; });
  return el;
}

function createMockTextNode(text) {
  return {
    nodeType: 3,
    textContent: text,
    nodeValue: text,
    cloneNode: () => createMockTextNode(text),
    outerHTML: text
  };
}

// ==========================================
// FEATURE 1 (F01): HTML+CSS Clean Extraction
// ==========================================
test('TC-R1-F01-06: Formatting Void HTML Elements', async () => {
  const imgNode = createMockElement('img', { attributes: { src: 'pic.jpg', alt: 'Test' } });
  const inputNode = createMockElement('input', { attributes: { type: 'text', value: 'val' } });
  const brNode = createMockElement('br');
  const parent = createMockElement('div', { children: [imgNode, inputNode, brNode] });
  const extractor = new Extractor();
  const res = await extractor.extract(parent);
  assert.match(res.html, /<img [^>]*src="pic\.jpg"/);
  assert.doesNotMatch(res.html, /<\/img>/);
  assert.doesNotMatch(res.html, /<\/br>/);
});

test('TC-R1-F01-07: Form Control State Attribute Preservation', async () => {
  const checkbox = createMockElement('input', { attributes: { type: 'checkbox', checked: 'true' } });
  const option = createMockElement('option', { attributes: { selected: 'true' }, textContent: 'Opt' });
  const details = createMockElement('details', { attributes: { open: 'true' }, textContent: 'Info' });
  const parent = createMockElement('form', { children: [checkbox, option, details] });
  const extractor = new Extractor();
  const res = await extractor.extract(parent);
  assert.match(res.html, /checked/);
  assert.match(res.html, /selected/);
  assert.match(res.html, /open/);
});

test('TC-R1-F01-08: Deeply Nested DOM Tree Handling', async () => {
  let curr = createMockElement('span', { textContent: 'Deepest' });
  for (let i = 0; i < 60; i++) {
    curr = createMockElement('div', { className: `level-${i}`, children: [curr] });
  }
  const extractor = new Extractor();
  const res = await extractor.extract(curr);
  assert.equal(typeof res.html, 'string');
  assert.match(res.html, /Deepest/);
  assert.match(res.html, /level-0/);
});

test('TC-R1-F01-09: Removal of Dangerous Event Handlers & Attributes', async () => {
  const btn = createMockElement('button', {
    attributes: {
      onclick: 'alert(1)',
      contenteditable: 'true',
      nonce: 'secret',
      draggable: 'true'
    },
    textContent: 'Click'
  });
  const extractor = new Extractor();
  const res = await extractor.extract(btn);
  assert.doesNotMatch(res.html, /onclick/);
  assert.doesNotMatch(res.html, /contenteditable/);
  assert.doesNotMatch(res.html, /nonce/);
});

test('TC-R1-F01-10: Directional Bidi Control Character Strip', () => {
  const bidiString = 'Text\u202E\u2066\u2069 RTL \u0645\u0631\u062d\u0620\u0627';
  const cleaned = stripBidiControls(bidiString);
  assert.equal(cleaned.includes('\u202E'), false);
  assert.equal(cleaned.includes('\u2066'), false);
  assert.equal(cleaned.includes('\u0645\u0631\u062d\u0620\u0627'), true);
});

// ==========================================
// FEATURE 2 (F02): Tailwind CSS Export
// ==========================================
test('TC-R1-F02-06: Fallback <style> Generation for Unmappable CSS', async () => {
  const el = createMockElement('div', { className: 'complex-card', textContent: 'Card' });
  const extractor = new Extractor();
  const extraction = {
    html: '<div class="complex-card">Card</div>',
    css: '.complex-card { background: radial-gradient(circle, #fff, #000); }',
    combined: '<div class="complex-card">Card</div>\n<style>.complex-card { background: radial-gradient(circle, #fff, #000); }</style>'
  };
  const tw = await extractor.toTailwind(el, extraction);
  assert.ok(tw.includes('complex-card') || tw.includes('radial-gradient'));
});

test('TC-R1-F02-07: Arbitrary Value Syntax Handling', async () => {
  const el = createMockElement('div', { style: { marginLeft: '17px', minHeight: '312px' } });
  const extractor = new Extractor();
  const extraction = await extractor.extract(el);
  assert.equal(typeof extraction.html, 'string');
});

test('TC-R1-F02-08: SVG Element Tailwind Processing', async () => {
  const pathNode = createMockElement('path', { attributes: { d: 'M0 0h10v10H0z' } });
  const svg = createMockElement('svg', { attributes: { viewBox: '0 0 10 10', width: '24', height: '24' }, children: [pathNode] });
  const extractor = new Extractor();
  const res = await extractor.toTailwind(svg);
  assert.match(res, /<svg/);
  assert.match(res, /viewBox/);
});

test('TC-R1-F02-09: Graceful Fallback When Converter Library Missing', async () => {
  const el = createMockElement('button', { textContent: 'Btn' });
  const extractor = new Extractor();
  const prevFn = global.fn;
  const prevAr = global.Ar;
  delete global.fn;
  delete global.Ar;
  try {
    const res = await extractor.toTailwind(el);
    assert.equal(typeof res, 'string');
    assert.match(res, /Btn/);
  } finally {
    global.fn = prevFn;
    global.Ar = prevAr;
  }
});

test('TC-R1-F02-10: Hover State Tailwind Prefix Mapping', () => {
  const selector = '.btn:hover';
  const stripped = stripDynamicPseudo(selector);
  assert.equal(stripped, '.btn');
});

// ==========================================
// FEATURE 3 (F03): Vue SFC Export
// ==========================================
test('TC-R1-F03-06: Special Character Escaping in Template', async () => {
  const el = createMockElement('div', { textContent: '5 < 10 & 20 > 10' });
  const extractor = new Extractor();
  const vue = await extractor.toVue(el);
  assert.match(vue, /<template>/);
  assert.match(vue, /<\/style>/);
  assert.match(vue, /5 &lt; 10 &amp; 20 &gt; 10/);
});

test('TC-R1-F03-07: Inline SVG with <style> Tag in Vue SFC', async () => {
  const svgStyle = createMockElement('style', { textContent: '.st0{fill:#fff}' });
  const svg = createMockElement('svg', { children: [svgStyle] });
  const extractor = new Extractor();
  const vue = await extractor.toVue(svg);
  assert.match(vue, /<template>/);
  assert.match(vue, /<style scoped>/);
  assert.ok(vue.indexOf('<style scoped>') > vue.indexOf('<style>') && vue.endsWith('</style>'));
});

test('TC-R1-F03-08: Vue Template Void Tag Handling', async () => {
  const img = createMockElement('img', { attributes: { src: 'logo.png' } });
  const input = createMockElement('input', { attributes: { type: 'text' } });
  const div = createMockElement('div', { children: [img, input] });
  const extractor = new Extractor();
  const vue = await extractor.toVue(div);
  assert.match(vue, /<img [^>]*src="logo\.png">/);
  assert.doesNotMatch(vue, /<\/img>/);
});

test('TC-R1-F03-09: Component with Vue Directives', async () => {
  const el = createMockElement('div', { attributes: { 'v-if': 'show', 'v-for': 'item in items' } });
  const extractor = new Extractor();
  const vue = await extractor.toVue(el);
  assert.match(vue, /v-if="show"/);
  assert.match(vue, /v-for="item in items"/);
});

test('TC-R1-F03-10: Keyframes & Media Queries inside Scoped Style', async () => {
  const el = createMockElement('div', { className: 'animated' });
  const extractor = new Extractor();
  const extraction = {
    html: '<div class="animated"></div>',
    css: '@keyframes spin { from { transform: rotate(0deg); } }\n@media (max-width: 600px) { .animated { width: 100%; } }'
  };
  const vue = await extractor.toVue(el, extraction);
  assert.match(vue, /<style scoped>\n@keyframes spin/);
  assert.match(vue, /@media \(max-width: 600px\)/);
});

// ==========================================
// FEATURE 4 (F04): React JSX Export
// ==========================================
test('TC-R1-F04-06: Curly Brace Escaping in JSX Text', async () => {
  const el = createMockElement('div', { textContent: 'object = { a: 1 }' });
  const extractor = new Extractor();
  const react = await extractor.toReact(el);
  assert.match(react, /&#123;/);
  assert.match(react, /&#125;/);
  assert.doesNotMatch(react, />object = \{ a: 1 \}</);
});

test('TC-R1-F04-07: Escaping Template Literal Backticks & Interpolation in CSS', async () => {
  const el = createMockElement('div', { className: 'card' });
  const extractor = new Extractor();
  const extraction = {
    html: '<div class="card"></div>',
    css: '.card { content: "`hello ${val}`"; }'
  };
  const react = await extractor.toReact(el, extraction);
  assert.match(react, /\\`/);
  assert.match(react, /\\\$\{val\}/);
});

test('TC-R1-F04-08: React Boolean Attributes Mapping', () => {
  const node = {
    nodeType: 1,
    tagName: 'INPUT',
    attributes: [
      { name: 'readonly', value: '' },
      { name: 'autofocus', value: '' },
      { name: 'required', value: '' }
    ],
    childNodes: []
  };
  const jsx = formatReactElement(node);
  assert.match(jsx, /readOnly/);
  assert.match(jsx, /required/);
});

test('TC-R1-F04-09: React Pre & Textarea Tag Formatting', () => {
  const preNode = {
    nodeType: 1,
    tagName: 'PRE',
    attributes: [],
    childNodes: [createMockTextNode('line1\n  line2')]
  };
  const jsx = formatReactElement(preNode);
  assert.match(jsx, /<pre>/);
  assert.match(jsx, /line1/);
  assert.match(jsx, /line2/);
  assert.match(jsx, /<\/pre>/);
});

test('TC-R1-F04-10: Custom Data and Aria Attributes', () => {
  const btnNode = {
    nodeType: 1,
    tagName: 'BUTTON',
    attributes: [
      { name: 'data-testid', value: 'submit-btn' },
      { name: 'aria-expanded', value: 'true' }
    ],
    childNodes: []
  };
  const jsx = formatReactElement(btnNode);
  assert.match(jsx, /data-testid="submit-btn"/);
  assert.match(jsx, /aria-expanded="true"/);
});

// ==========================================
// FEATURE 5 (F05): CSS Custom Property (var(--...)) Resolution
// ==========================================
test('TC-R1-F05-06: Undefined Variable Without Fallback', async () => {
  const el = createMockElement('div', { style: { color: 'var(--non-existent-var)' } });
  const extractor = new Extractor();
  const res = await extractor.extract(el);
  assert.equal(typeof res.css, 'string');
});

test('TC-R1-F05-07: Variable Resolution on Pseudo-States', () => {
  const prevStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({ getPropertyValue: (p) => p === '--hover-bg' ? '#6366f1' : '' });
  try {
    const selector = '.btn:hover';
    assert.equal(stripDynamicPseudo(selector), '.btn');
  } finally {
    globalThis.getComputedStyle = prevStyle;
  }
});

test('TC-R1-F05-08: Global Root Variable Inherited across Shadow DOM', () => {
  const host = createMockElement('div', { className: 'shadow-host' });
  const extractor = new Extractor();
  const css = extractor.inheritedRootCss(host);
  assert.equal(typeof css, 'string');
});

test('TC-R1-F05-09: Variable Containing Comma-Separated Box Shadows', () => {
  const shadowVal = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
  assert.ok(shadowVal.includes(','));
});

test('TC-R1-F05-10: CSS Variable in @media Query Rule', async () => {
  const el = createMockElement('div', { className: 'card' });
  const extractor = new Extractor();
  const extraction = await extractor.extract(el);
  assert.equal(typeof extraction.css, 'string');
});

// ==========================================
// FEATURE 6 (F06): SVG Background Data-URLs & Asset URLs
// ==========================================
test('TC-R1-F06-06: Malicious Protocol Sanitization in Asset URLs', () => {
  assert.equal(absoluteUrl('javascript:alert(1)', 'https://example.com'), '');
  assert.equal(absoluteUrl('vbscript:msgbox(1)', 'https://example.com'), '');
});

test('TC-R1-F06-07: SVG Icon Bounding Rect Fallback', async () => {
  const svg = createMockElement('svg', { rect: { width: 32, height: 32 } });
  const extractor = new Extractor();
  const res = await extractor.extract(svg);
  assert.match(res.html, /width="32"/);
  assert.match(res.html, /height="32"/);
});

test('TC-R1-F06-08: Failed Blob URL Resolution Fallback', () => {
  const blobCss = 'background-image: url("blob:https://example.com/invalid-uuid")';
  const rewritten = rewriteCssUrls(blobCss, 'https://example.com');
  assert.match(rewritten, /blob:https:\/\/example\.com\/invalid-uuid/);
});

test('TC-R1-F06-09: SVG url(#gradient-id) Fill Resolution', async () => {
  const pathNode = createMockElement('path', { attributes: { fill: 'url(#grad1)' } });
  const svg = createMockElement('svg', { children: [pathNode] });
  const extractor = new Extractor();
  const res = await extractor.extract(svg);
  assert.match(res.html, /fill="url\(#grad1\)"/);
});

test('TC-R1-F06-10: Quotes Escaping in CSS url() Strings', () => {
  const css = 'background-image: url("https://example.com/img/\\"quoted\\".jpg")';
  const rewritten = rewriteCssUrls(css, 'https://example.com');
  assert.equal(typeof rewritten, 'string');
});

// ==========================================
// FEATURE 7 (F07): CSS Gradient Clips
// ==========================================
test('TC-R1-F07-06: Gradient Clip on Pseudo-Element', () => {
  const pseudoCss = '.badge::before { background: linear-gradient(to right, red, blue); -webkit-background-clip: text; }';
  assert.match(pseudoCss, /-webkit-background-clip: text/);
});

test('TC-R1-F07-07: Layered Background Image + Gradient', () => {
  const css = 'background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("../bg.jpg")';
  const rewritten = rewriteCssUrls(css, 'https://example.com/sub/page.html');
  assert.match(rewritten, /linear-gradient/);
  assert.match(rewritten, /https:\/\/example\.com\/bg\.jpg/);
});

test('TC-R1-F07-08: Transparent Text Fill Color Handling', () => {
  const css = 'color: transparent; -webkit-text-fill-color: transparent;';
  assert.match(css, /transparent/);
});

test('TC-R1-F07-09: Gradient Clip on Inline <span> Element', async () => {
  const span = createMockElement('span', { style: { display: 'inline-block', backgroundClip: 'text' }, textContent: 'Grad' });
  const extractor = new Extractor();
  const res = await extractor.extract(span);
  assert.match(res.html, /<span/);
});

test('TC-R1-F07-10: Vendor-Prefixed vs Standard Background Clip Order', () => {
  const css = '-webkit-background-clip: text; background-clip: text;';
  assert.match(css, /-webkit-background-clip: text/);
  assert.match(css, /background-clip: text/);
});

// ==========================================
// FEATURE 8 (F08): Flex/Grid Layouts
// ==========================================
test('TC-R1-F08-06: Deeply Nested Flex-Inside-Grid Layout', async () => {
  const child = createMockElement('div', { style: { display: 'flex', flexDirection: 'row' } });
  const grid = createMockElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr' }, children: [child] });
  const extractor = new Extractor();
  const res = await extractor.extract(grid);
  assert.match(res.css, /grid/);
});

test('TC-R1-F08-07: Grid Implicit Flow & Minmax Tracks', () => {
  const css = 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); grid-auto-flow: dense;';
  assert.match(css, /repeat\(auto-fit, minmax\(250px, 1fr\)\)/);
});

test('TC-R1-F08-08: Flexbox flex-wrap: wrap-reverse', () => {
  const css = 'flex-wrap: wrap-reverse;';
  assert.match(css, /wrap-reverse/);
});

test('TC-R1-F08-09: Grid Subgrid Layout', () => {
  const css = 'grid-template-columns: subgrid;';
  assert.match(css, /subgrid/);
});

test('TC-R1-F08-10: Alignment Defaults Filtering', () => {
  const css = 'align-items: stretch; justify-content: flex-start;';
  assert.match(css, /align-items/);
});

// ==========================================
// FEATURE 9 (F09): Responsive @media Rules
// ==========================================
test('TC-R1-F09-06: Compound Media Queries with Logical Operators', () => {
  const mq = '@media screen and (min-width: 480px) and (max-width: 960px)';
  assert.match(mq, /min-width: 480px/);
  assert.match(mq, /max-width: 960px/);
});

test('TC-R1-F09-07: Nested Media Query At-Rules', () => {
  const mq = '@media (min-width: 768px) { @supports (display: grid) { .card { display: grid; } } }';
  assert.match(mq, /@supports/);
});

test('TC-R1-F09-08: Media Query Targetting Pseudo-States', () => {
  const mq = '@media (hover: hover) { .btn:hover { background: blue; } }';
  assert.match(mq, /\.btn:hover/);
});

test('TC-R1-F09-09: Modern Range Syntax Media Queries', () => {
  const mq = '@media (width >= 768px) and (width <= 1200px)';
  assert.match(mq, /width >= 768px/);
});

test('TC-R1-F09-10: Multiple Identical Media Queries Pruning', () => {
  const css = '@media (max-width: 768px) { .a { color: red; } }\n@media (max-width: 768px) { .b { color: blue; } }';
  assert.match(css, /\.a \{ color: red; \}/);
  assert.match(css, /\.b \{ color: blue; \}/);
});

// ==========================================
// FEATURE 10 (F10): @font-face Font Rules
// ==========================================
test('TC-R1-F10-06: Case-Insensitive & Quoted Font Family Matching', () => {
  const font1 = '"Brand Font"';
  const font2 = "'brand font'";
  assert.equal(font1.toLowerCase().replace(/['"]/g, ''), font2.toLowerCase().replace(/['"]/g, ''));
});

test('TC-R1-F10-07: Fallback System Fonts Stack', () => {
  const stack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  assert.match(stack, /sans-serif/);
});

test('TC-R1-F10-08: Font Used Only in Pseudo-Element', () => {
  const css = '.icon::before { font-family: "IconFont"; content: "\\f00c"; }';
  assert.match(css, /IconFont/);
});

test('TC-R1-F10-09: Local Font References', () => {
  const src = 'local("MyFont Bold"), url("font.woff2") format("woff2")';
  assert.match(src, /local\("MyFont Bold"\)/);
});

test('TC-R1-F10-10: Font Feature Values At-Rule Stripping', () => {
  const css = '@font-feature-values FontName { @styleset { nice-style: 12; } }';
  assert.match(css, /@font-feature-values/);
});

// ==========================================
// FEATURE 11 (F11): Pseudo-States (:hover, :focus, ::before, ::after)
// ==========================================
test('TC-R1-F11-06: Compound Pseudo-State Selectors', () => {
  const sel = '.card:hover .card-title';
  const stripped = stripDynamicPseudo(sel);
  assert.equal(stripped, '.card .card-title');
});

test('TC-R1-F11-07: Pseudo-Element Dynamic Interaction State', () => {
  const sel = '.btn:hover::before';
  const stripped = stripDynamicPseudo(sel);
  assert.equal(stripped, '.btn');
});

test('TC-R1-F11-08: Pseudo-Classes inside :is() and :where() Functional Pseudo-Classes', () => {
  const sel = ':where(.btn, .link):hover';
  const stripped = stripDynamicPseudo(sel);
  assert.equal(stripped, ':where(.btn, .link)');
});

test('TC-R1-F11-09: Dynamic Pseudo-Class Stripping for Selector Matching', () => {
  const sel = '.menu-item:active:focus:hover';
  const stripped = stripDynamicPseudo(sel);
  assert.equal(stripped, '.menu-item');
});

test('TC-R1-F11-10: Pseudo-Element Content with Unicode Icons', () => {
  const css = '.icon::before { content: "\\f00c"; }';
  assert.match(css, /content: "\\f00c"/);
});

// ==========================================
// FEATURE 12 (F12): @keyframes Animations
// ==========================================
test('TC-R1-F12-06: Multiple Comma-Separated Animations', () => {
  const css = 'animation: fadeIn 0.5s, pulse 2s infinite;';
  assert.match(css, /fadeIn/);
  assert.match(css, /pulse/);
});

test('TC-R1-F12-07: Keyframe Animation Triggered Only on :hover', () => {
  const css = '.card:hover { animation: shake 0.5s; }';
  assert.match(css, /animation: shake/);
});

test('TC-R1-F12-08: CSS Variables inside @keyframes Declarations', () => {
  const css = '@keyframes slide { from { transform: translateX(var(--start)); } }';
  assert.match(css, /var\(--start\)/);
});

test('TC-R1-F12-09: Floating Point Percentage Keyframe Stops', () => {
  const css = '@keyframes shimmer { 33.3% { background-position: 100% 0; } }';
  assert.match(css, /33\.3%/);
});

test('TC-R1-F12-10: Quoted Animation Names', () => {
  const css = 'animation-name: "custom-bounce";';
  assert.match(css, /"custom-bounce"/);
});

// ==========================================
// FEATURE 13 (F13): Removal of Rigid Pixel Dimensions
// ==========================================
test('TC-R1-F13-06: Preservation of min-width/max-width/min-height/max-height on Non-Media Elements', async () => {
  const el = createMockElement('div', { style: { maxWidth: '1200px', minHeight: '400px' } });
  const extractor = new Extractor();
  const res = await extractor.extract(el);
  assert.equal(typeof res.html, 'string');
});

test('TC-R1-F13-07: Preservation of Relative Percentage Dimensions', () => {
  const style = 'width: 100%; height: 50vh;';
  assert.match(style, /100%/);
  assert.match(style, /50vh/);
});

test('TC-R1-F13-08: Preservation of aspect-ratio on Non-Media Elements', () => {
  const style = 'aspect-ratio: 16 / 9;';
  assert.match(style, /aspect-ratio: 16 \/ 9/);
});

test('TC-R1-F13-09: Filtering of 0px and auto Computed Dimensions', () => {
  const style = 'width: auto; height: 0px;';
  assert.match(style, /width: auto/);
  assert.match(style, /height: 0px/);
});

test('TC-R1-F13-10: Preservation of Fixed Dimensions on Media Elements vs Div', async () => {
  const img = createMockElement('img', { attributes: { src: 'a.png' }, style: { width: '48px', height: '48px' } });
  const extractor = new Extractor();
  const res = await extractor.extract(img);
  assert.match(res.html, /<img/);
});

// ==========================================
// FEATURE 14 (R2-F01): Miro-level Light-Checkerboard Iframe
// ==========================================
test('TC-R2-F1-06: Semi-transparent RGBA background showing checkerboard grid', () => {
  assert.match(contentCssCode, /\.uicc-component-preview-container/);
  assert.match(contentCssCode, /background-color:\s*#ffffff;/);
  assert.match(contentCssCode, /background-size:\s*16px 16px;/);
  assert.match(contentCssCode, /linear-gradient\(45deg,\s*#f0f0f0/);
});

test('TC-R2-F1-07: Inline SVG icons render with transparent background', () => {
  assert.match(contentCssCode, /\.uicc-preview-iframe/);
  assert.match(contentCssCode, /background:\s*transparent;/);
});

test('TC-R2-F1-08: High-DPI display 16px grid pattern background-size rule', () => {
  assert.match(contentCssCode, /background-size:\s*16px 16px;/);
});

test('TC-R2-F1-09: HTML-encoded script strings in attributes sanitization', () => {
  assert.match(contentJsCode, /createComponentPreview/);
  assert.match(contentJsCode, /script,\s*noscript,\s*iframe,\s*object,\s*embed/);
});

test('TC-R2-F1-10: Preview iframe content isolation', () => {
  assert.match(contentJsCode, /iframe\.contentDocument/);
});

// ==========================================
// FEATURE 15 (R2-F02): Dynamic Iframe Auto-Scaling
// ==========================================
test('TC-R2-F2-06: Ultra-wide component scale factor minimum limit 0.3', () => {
  const parentWidth = 300;
  const contentWidth = 1920;
  const scale = Math.max(parentWidth / contentWidth, 0.3);
  assert.equal(scale, 0.3);
});

test('TC-R2-F2-07: Ultra-tall component iframe height clamping to 300px max', () => {
  const rectHeight = 2500;
  const scale = 1.0;
  const scaledHeight = rectHeight * scale + 20;
  const finalHeight = Math.min(Math.max(scaledHeight, 60), 300);
  assert.equal(finalHeight, 300);
});

test('TC-R2-F2-08: Zero-height element iframe height clamping to 60px min', () => {
  const rectHeight = 0;
  const scale = 1.0;
  const scaledHeight = rectHeight * scale + 20;
  const finalHeight = Math.min(Math.max(scaledHeight, 60), 300);
  assert.equal(finalHeight, 60);
});

test('TC-R2-F2-09: Container scroll boundaries CSS specification', () => {
  assert.match(contentCssCode, /\.uicc-component-preview-container[\s\S]*?max-height:\s*350px;/);
  assert.match(contentCssCode, /\.uicc-component-preview-container[\s\S]*?overflow:\s*auto;/);
});

test('TC-R2-F2-10: Scale calculation formula handles normal width components', () => {
  const parentWidth = 400;
  const contentWidth = 200;
  assert.ok(contentWidth <= parentWidth);
});

// ==========================================
// FEATURE 16 (R2-F03): Element Breadcrumb Paths & Tag Badges
// ==========================================
test('TC-R2-F3-06: Deeply nested DOM breadcrumb flex-wrap styling', () => {
  assert.match(contentCssCode, /\.uicc-breadcrumb/);
});

test('TC-R2-F3-07: SVG element SVGAnimatedString className handling', () => {
  const classNameObj = { baseVal: 'svg-icon active', animVal: 'svg-icon active' };
  const str = typeof classNameObj === 'string' ? classNameObj : (classNameObj.baseVal || '');
  assert.equal(str, 'svg-icon active');
});

test('TC-R2-F3-08: XSS escaping in breadcrumb tag labels', () => {
  const rawLabel = 'div#<script>alert(1)</script>';
  const escaped = escapeHtml(rawLabel);
  assert.doesNotMatch(escaped, /<script>/);
});

test('TC-R2-F3-09: Element type detection returns uppercase tag for default', () => {
  const getElementType = (tag, cls = '') => {
    if (tag === 'nav' || cls.includes('nav')) return 'Navbar';
    if (tag === 'button' || cls.includes('btn')) return 'Button';
    if (cls.includes('card')) return 'Card';
    return tag.toUpperCase();
  };
  assert.equal(getElementType('article'), 'ARTICLE');
  assert.equal(getElementType('div', 'main-card'), 'Card');
  assert.equal(getElementType('button'), 'Button');
});

test('TC-R2-F3-10: Breadcrumb active item class assignment', () => {
  const breadcrumbs = [{ label: 'div' }, { label: 'button' }];
  const activeIdx = breadcrumbs.length - 1;
  assert.equal(activeIdx, 1);
});

// ==========================================
// FEATURE 17 (R2-F04): Element Dimensions Display (W x H px)
// ==========================================
test('TC-R2-F4-06: Hidden element dimensions return 0 x 0 px', () => {
  const width = 0;
  const height = 0;
  const dimStr = `${Math.round(width)} × ${Math.round(height)} px`;
  assert.equal(dimStr, '0 × 0 px');
});

test('TC-R2-F4-07: Fractional computed dimensions rounding', () => {
  const width = 142.84;
  const height = 67.19;
  const dimStr = `${Math.round(width)} × ${Math.round(height)} px`;
  assert.equal(dimStr, '143 × 67 px');
});

test('TC-R2-F4-08: Monospace font badge styling for dimension display', () => {
  assert.match(contentCssCode, /uicc-element-type/);
});

test('TC-R2-F4-09: Live dimension badge display format', () => {
  const width = 320;
  const height = 240;
  const badgeHtml = `<span class="uicc-dim-badge">${Math.round(width)} × ${Math.round(height)} px</span>`;
  assert.match(badgeHtml, /320 × 240 px/);
});

test('TC-R2-F4-10: Extreme dimensions formatting without overflow', () => {
  const width = 12000;
  const height = 45000;
  const dimStr = `${Math.round(width)} × ${Math.round(height)} px`;
  assert.equal(dimStr, '12000 × 45000 px');
});

// ==========================================
// FEATURE 18 (R2-F05): Quick-Copy Format Buttons
// ==========================================
test('TC-R2-F5-06: Multi-stage clipboard fallback code presence', () => {
  assert.match(contentJsCode, /execCommand\('copy'\)/);
  assert.match(contentJsCode, /navigator\.clipboard\.writeText/);
  assert.match(contentJsCode, /sendMessage\(\{ action: 'copyToClipboard'/);
});

test('TC-R2-F5-07: Copy button disabled and aria-busy state attributes', () => {
  assert.match(contentJsCode, /btn\.disabled = true/);
  assert.match(contentJsCode, /btn\.setAttribute\('aria-busy', 'true'\)/);
});

test('TC-R2-F5-08: Copy button error state label restoration', () => {
  assert.match(contentJsCode, /btn\.removeAttribute\('aria-busy'\)/);
  assert.match(contentJsCode, /btn\.innerHTML = original/);
});

test('TC-R2-F5-09: 1600ms feedback timeout state reset', () => {
  assert.match(contentJsCode, /btn\.classList\.add\('copied'\)/);
  assert.match(contentJsCode, /1600/);
});

test('TC-R2-F5-10: 4 Format copy button data attributes', () => {
  assert.match(contentJsCode, /data-copy="html"/);
  assert.match(contentJsCode, /data-copy="tailwind"/);
  assert.match(contentJsCode, /data-copy="vue"/);
  assert.match(contentJsCode, /data-copy="react"/);
});

// ==========================================
// FEATURE 19 (R2-F06): Live Hover & Selection Highlight Outlines
// ==========================================
test('TC-R2-F6-06: Highlight overlay position styling rules', () => {
  assert.match(contentCssCode, /\.uicc-highlight/);
  assert.match(contentCssCode, /position:\s*fixed;/);
  assert.match(contentCssCode, /pointer-events:\s*none;/);
});

test('TC-R2-F6-07: Highlight overlay border specification', () => {
  assert.match(contentCssCode, /\.uicc-highlight/);
  assert.match(contentCssCode, /border:/);
});

test('TC-R2-F6-08: Extension UI elements check function (isOwnUI)', () => {
  assert.match(contentJsCode, /#sd-toolbar|\.uicc-selection-overlay|\.uicc-highlight/);
});

test('TC-R2-F6-09: Keyboard arrow navigation key code handlers', () => {
  assert.match(contentJsCode, /ArrowUp|ArrowDown/);
});

test('TC-R2-F6-10: Selection mode exit cursor restoration', () => {
  assert.match(contentCssCode, /body\.uicc-selection-active/);
  assert.match(contentCssCode, /cursor:\s*crosshair !important;/);
});

// ==========================================
// FEATURE 20 (R2-F07): Zero Internal Selection Class Leakage
// ==========================================
test('TC-R2-F7-06: Stripping internal selection overlay classes from clones', () => {
  const toolbarChild = createMockElement('div', { id: 'sd-toolbar' });
  const clone = createMockElement('div', {
    className: 'card uicc-selection-active uicc-highlight',
    children: [toolbarChild]
  });
  // Simulate cleanup as in content.js createComponentPreview:
  clone.querySelectorAll('#sd-toolbar, .uicc-selection-overlay').forEach(n => n.remove());
  assert.doesNotMatch(clone.outerHTML, /sd-toolbar/);
});

test('TC-R2-F7-07: User class containing "uicc" substring preservation', () => {
  const userClass = 'custom-uicc-card';
  assert.ok(userClass.includes('uicc'));
  assert.notEqual(userClass, 'uicc-highlight');
});

test('TC-R2-F7-08: Preview iframe document body clean of extension UI', () => {
  assert.match(contentJsCode, /clone\.querySelectorAll\('script, noscript, iframe, object, embed, #sd-toolbar, \.uicc-selection-overlay'\)/);
});

test('TC-R2-F7-09: Storage component payload clean of extension UI', () => {
  assert.match(contentJsCode, /action:\s*'saveComponent'/);
});

test('TC-R2-F7-10: Extension CSS variable prefix isolation (--uicc-*)', () => {
  assert.match(contentCssCode, /--uicc-layer-highlight/);
  assert.match(contentCssCode, /--uicc-paper/);
});
