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
        if (prop === 'display') return 'flex';
        if (prop === 'font-family') return 'Inter, -apple-system, sans-serif';
        if (prop === 'color') return '#0f172a';
        if (prop === 'background-color') return '#ffffff';
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
    if (nodes.length > 0) {
      for (const n of nodes) body.appendChild(n);
    } else {
      body.appendChild(new MockNode('div'));
    }
    return { body };
  }
};

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

require(path.resolve(__dirname, '../lib/tailwind-lib.js'));
const extractorApi = require(path.resolve(__dirname, '../lib/extractor.js'));

describe('Miro Edge Cases & Layout Alignment Verification', () => {

  it('1. should preserve flexbox and grid layouts accurately without sizing distortion', async () => {
    const navbar = new MockNode('nav', { class: 'navbar-container' });
    const logo = new MockNode('a', { class: 'nav-logo', href: '/' });
    const menu = new MockNode('ul', { class: 'nav-menu' });
    const item1 = new MockNode('li', { class: 'nav-item' });
    const item2 = new MockNode('li', { class: 'nav-item' });
    menu.appendChild(item1);
    menu.appendChild(item2);
    navbar.appendChild(logo);
    navbar.appendChild(menu);

    const css = `
      .navbar-container { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; gap: 16px; }
      .nav-logo { font-size: 20px; font-weight: 700; color: #2563eb; }
      .nav-menu { display: flex; align-items: center; gap: 12px; list-style: none; margin: 0; padding: 0; }
      .nav-item { font-size: 14px; color: #334155; }
    `;

    const cleanHtml = await extractorApi.cleanCloneHtml(navbar);
    const semantic = await extractorApi.semanticHtmlCss(navbar, cleanHtml, css);

    assert.ok(semantic, 'Should produce semantic extraction');
    assert.ok(semantic.css.includes('justify-content: space-between'), 'Should retain flex justify-content');
    assert.ok(semantic.css.includes('align-items: center'), 'Should retain flex align-items');
    assert.ok(semantic.css.includes('gap: 16px') || semantic.css.includes('gap: 12px'), 'Should retain gap spacing');
  });

  it('2. should handle pseudo elements (::before, ::after) and hover states', async () => {
    const button = new MockNode('button', { class: 'glow-btn' });
    const css = `
      .glow-btn { position: relative; padding: 12px 24px; background: #3b82f6; color: #fff; border-radius: 8px; }
      .glow-btn:hover { background: #2563eb; }
      .glow-btn::before { content: ""; position: absolute; inset: -2px; background: linear-gradient(45deg, #ff007f, #7928ca); border-radius: 10px; z-index: -1; }
    `;

    const cleanHtml = await extractorApi.cleanCloneHtml(button);
    const semantic = await extractorApi.semanticHtmlCss(button, cleanHtml, css);

    assert.ok(semantic, 'Should produce semantic result');
    assert.ok(semantic.css.includes(':hover'), 'Should retain :hover selector');
    assert.ok(semantic.css.includes('::before') || semantic.css.includes(':before'), 'Should retain ::before pseudo-element');
  });

  it('3. should generate valid HTML+CSS clipboard snippet with style block', async () => {
    const card = new MockNode('div', { class: 'pricing-card' });
    const title = new MockNode('h3', { class: 'pricing-title' });
    const price = new MockNode('div', { class: 'pricing-amount' });
    card.appendChild(title);
    card.appendChild(price);

    const extraction = await extractorApi.extractComponent(card);
    assert.ok(extraction.combined.startsWith('<!-- HTML -->'), 'Combined should start with HTML marker');
    assert.ok(extraction.combined.includes('<style>'), 'Combined should contain style tag');
    assert.ok(extraction.combined.includes('</style>'), 'Combined should close style tag');
  });

  it('4. should format React JSX with style objects and valid JSX self-closing tags', () => {
    const rawHtml = '<div class="banner" style="margin-top: 10px; z-index: 10;"><img src="logo.png"><input type="text"></div>';
    const reactCode = extractorApi.formatReactJsx(rawHtml);

    assert.ok(reactCode.includes('className="banner"'), 'Should convert class to className');
    assert.ok(reactCode.includes('<img src="logo.png" />'), 'Should self-close img tags');
    assert.ok(reactCode.includes('<input type="text" />'), 'Should self-close input tags');
    assert.ok(reactCode.includes('style={{ marginTop: "10px", zIndex: "10" }}'), 'Should convert style string to JSX style object');
  });
});
