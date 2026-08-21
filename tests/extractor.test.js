const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Robust DOM mock for test suite
class MockClassList {
  constructor(node) {
    this._node = node;
    this._set = new Set();
  }

  _sync() {
    if (this._set.size > 0) {
      this._node._attrs['class'] = Array.from(this._set).join(' ');
    } else {
      delete this._node._attrs['class'];
    }
  }

  add(...classes) {
    for (const c of classes) if (c) this._set.add(c);
    this._sync();
  }

  remove(...classes) {
    for (const c of classes) this._set.delete(c);
    this._sync();
  }

  contains(cls) {
    return this._set.has(cls);
  }

  has(cls) {
    return this._set.has(cls);
  }

  [Symbol.iterator]() {
    return this._set[Symbol.iterator]();
  }
}

class MockNode {
  constructor(tagName = 'div', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.nodeType = 1;
    this.attributes = [];
    this._attrs = {};
    this.children = [];
    this.parentElement = null;
    this.classList = new MockClassList(this);
    this.style = {
      _styles: {},
      getPropertyValue: (prop) => this.style._styles[prop] || '',
      setProperty: (prop, val) => { this.style._styles[prop] = val; }
    };
    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  set className(val) {
    this.setAttribute('class', val);
  }

  getAttribute(name) {
    return this._attrs[name] !== undefined ? this._attrs[name] : null;
  }

  setAttribute(name, value) {
    const val = String(value);
    this._attrs[name] = val;
    const existing = this.attributes.find(a => a.name === name);
    if (existing) existing.value = val;
    else this.attributes.push({ name, value: val });
    if (name === 'class') {
      this.classList._set = new Set(val.split(/\s+/).filter(Boolean));
    }
  }

  hasAttribute(name) {
    return this._attrs[name] !== undefined;
  }

  removeAttribute(name) {
    delete this._attrs[name];
    this.attributes = this.attributes.filter(a => a.name !== name);
    if (name === 'class') this.classList._set.clear();
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  cloneNode(deep = true) {
    const clone = new MockNode(this.tagName.toLowerCase(), { ...this._attrs });
    for (const [k, v] of Object.entries(this.style._styles)) {
      clone.style._styles[k] = v;
    }
    if (deep) {
      for (const child of this.children) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  get lastElementChild() {
    return this.children[this.children.length - 1] || null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) results.push(child);
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  matches(selector) {
    if (!selector) return false;
    const s = selector.trim();
    if (s === '*') return true;
    if (s.startsWith('.')) {
      const cls = s.slice(1).split(/[:\s>+~]/)[0];
      return this.classList.contains(cls);
    }
    if (s.startsWith('#')) {
      const id = s.slice(1).split(/[:\s>+~]/)[0];
      return this.getAttribute('id') === id;
    }
    const tag = s.split(/[:. \s>+~]/)[0].toUpperCase();
    if (tag && this.tagName === tag) return true;
    return false;
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = Object.entries(this._attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    const attrStr = attrs ? ' ' + attrs : '';
    if (['img', 'input', 'br', 'hr', 'source'].includes(tag)) {
      return `<${tag}${attrStr}>`;
    }
    const inner = this.children.map(c => c.outerHTML).join('');
    return `<${tag}${attrStr}>${inner}</${tag}>`;
  }
}

// Global mocks
global.window = {
  location: { href: 'https://example.com/page', origin: 'https://example.com' },
  getComputedStyle: (node) => {
    return {
      getPropertyValue: (prop) => {
        if (node?.style?._styles?.[prop]) return node.style._styles[prop];
        if (prop === 'display') return 'block';
        if (prop === 'font-family') return 'Inter, sans-serif';
        if (prop === 'color') return '#111827';
        if (prop === 'background-color') return 'transparent';
        if (prop === 'font-size') return '16px';
        return '';
      }
    };
  }
};

global.document = {
  createElement: (tag) => new MockNode(tag),
  body: new MockNode('body'),
  documentElement: new MockNode('html'),
  styleSheets: []
};

global.DOMParser = class {
  parseFromString(html) {
    const body = new MockNode('body');
    // Extract tags
    const tagMatches = Array.from(html.matchAll(/<([a-z0-9-]+)([^>]*?)>([\s\S]*?)<\/\1>|<([a-z0-9-]+)([^>]*?)\/?>/gi));
    if (tagMatches.length === 0) {
      const defaultEl = new MockNode('div');
      body.appendChild(defaultEl);
      return { body };
    }

    function buildNodes(snippet) {
      const list = [];
      const matches = Array.from(snippet.matchAll(/<([a-z0-9-]+)([^>]*?)>([\s\S]*?)<\/\1>|<([a-z0-9-]+)([^>]*?)\/?>/gi));
      for (const m of matches) {
        const tag = m[1] || m[4];
        const rawAttrs = m[2] || m[5] || '';
        const inner = m[3] || '';
        const node = new MockNode(tag);
        const attrMatches = Array.from(rawAttrs.matchAll(/([a-z0-9_-]+)="([^"]*)"/gi));
        for (const am of attrMatches) {
          node.setAttribute(am[1], am[2]);
        }
        if (inner.trim() && inner.includes('<')) {
          const innerNodes = buildNodes(inner);
          for (const inNode of innerNodes) node.appendChild(inNode);
        }
        list.push(node);
      }
      return list;
    }

    const nodes = buildNodes(html);
    for (const n of nodes) body.appendChild(n);
    return { body };
  }
};

global.CSSRule = { SUPPORTS_RULE: 4 };

// Load PostCSS and Prettier
const postcss = require(path.resolve(__dirname, '../lib/postcss.js'));
global.postcss = postcss;
globalThis.postcss = postcss;

const prettier = require(path.resolve(__dirname, '../lib/prettier-standalone.js'));
const pluginHtml = require(path.resolve(__dirname, '../lib/prettier-plugin-html.js'));
const pluginPostcss = require(path.resolve(__dirname, '../lib/prettier-plugin-postcss.js'));
global.prettier = prettier;
global.prettierPlugins = { html: pluginHtml, postcss: pluginPostcss };
globalThis.prettier = prettier;
globalThis.prettierPlugins = { html: pluginHtml, postcss: pluginPostcss };

// Load extension libraries
require(path.resolve(__dirname, '../lib/tailwind-lib.js'));
const extractorApi = require(path.resolve(__dirname, '../lib/extractor.js'));
const previewApi = require(path.resolve(__dirname, '../lib/preview.js'));

describe('Miro Code Extraction Engine Parity Tests', () => {

  it('1. should clean DOM, strip overlay/inspector classes, and resolve relative URLs', async () => {
    const card = new MockNode('div', {
      class: 'card export-element-highlight uicc-inspector-selected',
      style: "background-image: url('images/bg.png');"
    });
    const img = new MockNode('img', {
      src: 'avatar.jpg',
      srcset: 'avatar.jpg 1x, avatar-2x.jpg 2x'
    });
    card.appendChild(img);

    const cleanHtml = await extractorApi.cleanCloneHtml(card, 'https://example.com/page');

    assert.ok(cleanHtml.includes('exported-root'), 'Should contain exported-root class');
    assert.ok(cleanHtml.includes('https://example.com/images/bg.png'), 'Should absolutize background-image URL');
    assert.ok(cleanHtml.includes('https://example.com/avatar.jpg'), 'Should absolutize img src');
    assert.ok(cleanHtml.includes('https://example.com/avatar-2x.jpg'), 'Should absolutize img srcset');
    assert.ok(!cleanHtml.includes('uicc-'), 'Should strip uicc- classes');
    assert.ok(!cleanHtml.includes('export-element-highlight'), 'Should strip export-element-highlight');
  });

  it('2. should calculate CSS specificity scores accurately', () => {
    assert.strictEqual(extractorApi.specificityScore('div'), 1);
    assert.strictEqual(extractorApi.specificityScore('.card'), 100);
    assert.strictEqual(extractorApi.specificityScore('#header'), 10000);
    assert.strictEqual(extractorApi.specificityScore('#header .nav a.link:hover'), 10301);
  });

  it('3. should merge declarations prioritizing higher specificity and !important', () => {
    const decls = [
      { prop: 'color', value: 'red', spec: 10, important: false },
      { prop: 'color', value: 'blue', spec: 100, important: false },
      { prop: 'font-size', value: '16px', spec: 100, important: false },
      { prop: 'font-size', value: '14px', spec: 10, important: true }
    ];

    const merged = extractorApi.mergeDecls(decls);
    const color = merged.find(d => d.prop === 'color');
    const fontSize = merged.find(d => d.prop === 'font-size');

    assert.strictEqual(color.value, 'blue', 'Should pick higher specificity color');
    assert.strictEqual(fontSize.value, '14px', 'Should pick !important font-size over higher specificity');
  });

  it('4. should resolve CSS custom properties (var(--...)) across elements', () => {
    const mockComputed = {
      getPropertyValue: (name) => {
        if (name === '--brand-color') return '#3b82f6';
        if (name === '--font-base') return 'Inter, sans-serif';
        return '';
      }
    };

    const resolvedColor = extractorApi.resolveVarsAcross('var(--brand-color, red)', [mockComputed]);
    const resolvedFont = extractorApi.resolveVarsAcross('var(--font-base, sans-serif)', [mockComputed]);
    const resolvedFallback = extractorApi.resolveVarsAcross('var(--unknown-var, #111827)', [mockComputed]);

    assert.strictEqual(resolvedColor, '#3b82f6', 'Should resolve custom color property');
    assert.strictEqual(resolvedFont, 'Inter, sans-serif', 'Should resolve custom font property');
    assert.strictEqual(resolvedFallback, '#111827', 'Should use fallback when variable is undeclared');
  });

  it('5. should perform semantic scoped CSS extraction and semantic renaming', async () => {
    const card = new MockNode('div', { class: 'custom-wrapper' });
    const h2 = new MockNode('h2', { class: 'raw-header' });
    const btn = new MockNode('button', { class: 'action-btn' });
    card.appendChild(h2);
    card.appendChild(btn);

    const cssText = `
      .custom-wrapper { display: flex; flex-direction: column; padding: 20px; background-color: #ffffff; border-radius: 8px; }
      .raw-header { font-size: 20px; font-weight: 600; color: #111827; }
      .action-btn { background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; }
      .action-btn:hover { background-color: #1d4ed8; }
    `;

    const cleanHtml = await extractorApi.cleanCloneHtml(card);
    const semantic = await extractorApi.semanticHtmlCss(card, cleanHtml, cssText);

    assert.ok(semantic, 'Should produce semantic HTML and CSS');
    assert.ok(semantic.html.includes('class='), 'Semantic HTML should include class attributes');
    assert.ok(semantic.css.includes('display: flex'), 'Semantic CSS should include flex layout');
    assert.ok(semantic.css.includes('background-color: #ffffff') || semantic.css.includes('#ffffff'), 'Semantic CSS should retain background color');
    assert.ok(semantic.css.includes(':hover'), 'Semantic CSS should retain hover state');
  });

  it('6. should extract complete component using extractComponent()', async () => {
    const section = new MockNode('section', { class: 'hero-section' });
    const h1 = new MockNode('h1', { class: 'hero-title' });
    const a = new MockNode('a', { class: 'cta-button', href: 'https://example.com/start' });
    section.appendChild(h1);
    section.appendChild(a);

    const extraction = await extractorApi.extractComponent(section, { baseUrl: 'https://example.com' });

    assert.ok(!extraction.error, 'Extraction should succeed without errors');
    assert.ok(extraction.html, 'Should return clean HTML');
    assert.ok(extraction.preview.includes('<!DOCTYPE html>'), 'Should return standalone preview document');
    assert.ok(extraction.preview.includes('box-sizing: border-box;'), 'Preview should include reset CSS');
    assert.ok(extraction.combined.includes('<!-- HTML -->'), 'Combined should format HTML+CSS banner');
    assert.ok(extraction.combined.includes('<style>'), 'Combined should include <style> block');
  });

  it('7. should convert extracted code to Tailwind, Vue SFC, and React JSX', async () => {
    const card = new MockNode('div', { class: 'info-card' });
    const h3 = new MockNode('h3', { class: 'info-title' });
    card.appendChild(h3);

    const extractor = new extractorApi.Extractor({ baseUrl: 'https://example.com' });
    const extraction = await extractor.extract(card);

    const tailwind = await extractor.toTailwind(card, extraction);
    const vue = await extractor.toVue(card, extraction);
    const react = await extractor.toReact(card, extraction);

    assert.ok(typeof tailwind === 'string' && tailwind.length > 0, 'Should generate Tailwind markup');
    assert.ok(vue.includes('<template>') && vue.includes('</template>'), 'Should generate Vue SFC template block');
    assert.ok(react.includes('export default function ExtractedComponent()'), 'Should generate React function component');
    assert.ok(!react.includes('class="'), 'React JSX should not contain raw class=" attributes');
  });

  it('8. should build computed style snapshot for Tailwind pages', () => {
    const box = new MockNode('div');
    box.style._styles = {
      display: 'flex',
      padding: '16px',
      color: '#111827'
    };

    const snapshot = extractorApi.getComputedStyleSnapshot(box);
    assert.ok(!snapshot.error, 'Snapshot should succeed');
    assert.ok(snapshot.html.includes('style='), 'Snapshot should bake computed styles inline');
  });

  it('9. previewApi and extractorApi should share consistent interfaces', () => {
    assert.strictEqual(typeof previewApi.buildPreviewDocument, 'function');
    assert.strictEqual(typeof extractorApi.buildPreviewDocument, 'function');
    assert.strictEqual(typeof previewApi.detectTailwind, 'function');
    assert.strictEqual(typeof extractorApi.detectTailwind, 'function');
    assert.strictEqual(typeof previewApi.getComputedStyleSnapshot, 'function');
    assert.strictEqual(typeof extractorApi.getComputedStyleSnapshot, 'function');
  });
});
