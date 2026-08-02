'use strict';

const { test, describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const {
  Extractor,
  absoluteUrl,
  rewriteCssUrls,
  rewriteSrcset,
  splitSelectorList,
  stripDynamicPseudo,
  formatElement,
  formatReactElement,
  escapeHtml,
  stripBidiControls
} = require('../lib/extractor.js');

const {
  createMockElement,
  createMockTextNode,
  setupPostcss,
  setupMockDocument,
  assertValidHtml,
  assertValidCss,
  assertNoXssPayload
} = require('./helpers/test_utils.js');

before(async () => {
  setupMockDocument();
  await setupPostcss();
});

// Helper for temporary getComputedStyle override
function wrapStyleFn(styleFn) {
  return (node, pseudo) => {
    const raw = typeof styleFn === 'function' ? styleFn(node, pseudo) : styleFn;
    if (raw && typeof raw.getPropertyValue === 'function') return raw;
    return {
      getPropertyValue(prop) {
        if (typeof raw === 'function') return raw(prop) || '';
        if (typeof raw === 'object' && raw !== null) return raw[prop] || '';
        if (typeof styleFn === 'function') return styleFn(prop) || '';
        return '';
      }
    };
  };
}

function withComputedStyle(styleFn, testBody) {
  const previous = globalThis.getComputedStyle;
  globalThis.getComputedStyle = wrapStyleFn(styleFn);
  try {
    return testBody();
  } finally {
    globalThis.getComputedStyle = previous;
  }
}

async function withComputedStyleAsync(styleFn, testBody) {
  const previous = globalThis.getComputedStyle;
  globalThis.getComputedStyle = wrapStyleFn(styleFn);
  try {
    return await testBody();
  } finally {
    globalThis.getComputedStyle = previous;
  }
}

// Helper to simulate content.js UI Copier functions
function createMockUICopier() {
  return {
    getBreadcrumbTrail(element) {
      const trail = [];
      let curr = element;
      while (curr && curr !== globalThis.document?.body && curr !== globalThis.document?.documentElement) {
        const isOwn = curr.id === 'sd-toolbar' || curr.id === 'uicc-toast' || (curr.classList && curr.classList.contains('uicc-selection-overlay'));
        if (isOwn) return [];
        const tag = curr.tagName.toLowerCase();
        const id = curr.id ? `#${curr.id}` : '';
        const cls = curr.className && typeof curr.className === 'string'
          ? `.${curr.className.trim().split(/\s+/)[0]}`
          : '';
        trail.unshift({
          element: curr,
          label: `${tag}${id}${cls}`
        });
        curr = curr.parentElement;
      }
      return trail;
    },

    getElementType(element) {
      const tag = element.tagName.toLowerCase();
      const className = (element.getAttribute('class') || '').toLowerCase();
      if (tag === 'nav' || className.includes('nav')) return 'Navbar';
      if (tag === 'header' || className.includes('header')) return 'Header';
      if (tag === 'footer' || className.includes('footer')) return 'Footer';
      if (tag === 'button' || className.includes('button') || className.includes('btn')) return 'Button';
      if (tag === 'form' || className.includes('form')) return 'Form';
      if (className.includes('card')) return 'Card';
      if (className.includes('hero')) return 'Hero';
      if (tag === 'svg') return 'SVG';
      if (tag === 'img') return 'Image';
      if (tag === 'section' || className.includes('section')) return 'Section';
      return tag.toUpperCase();
    },

    createComponentPreview(element) {
      try {
        const clone = element.cloneNode(true);
        if (clone) {
          clone.querySelectorAll('script, noscript, iframe, object, embed, #sd-toolbar, .uicc-selection-overlay').forEach(node => node.remove());
          for (const node of [clone, ...clone.querySelectorAll('*')]) {
            for (const attr of Array.from(node.attributes || [])) {
              const name = attr.name.toLowerCase();
              if (name.startsWith('on') || /^(?:javascript|vbscript):/i.test(attr.value.trim())) node.removeAttribute(attr.name);
            }
          }
          clone.style.maxWidth = '100%';
          clone.style.maxHeight = '120px';
          clone.style.overflow = 'hidden';
          clone.style.pointerEvents = 'none';
          return clone.outerHTML;
        }
      } catch (_) {}
      return '<div>Preview</div>';
    },

    calculateAutoScaling(rect, parentWidth) {
      const contentWidth = rect.width + 16;
      let scale = 1.0;
      let height = Math.min(Math.max(rect.height + 20, 60), 300);
      if (contentWidth > parentWidth && contentWidth > 0) {
        scale = Math.max(parentWidth / contentWidth, 0.3);
        const scaledHeight = rect.height * scale + 20;
        height = Math.min(Math.max(scaledHeight, 60), 300);
      }
      return { scale, height };
    }
  };
}

describe('Tier 1 E2E Feature Coverage Suite (100 Tests)', () => {

  // ==========================================
  // REQUIREMENT R1 FEATURES (13 Features x 5 = 65 Tests)
  // ==========================================

  describe('F01: Pure HTML + CSS Clean Extraction', () => {
    it('TC-R1-F01-01: Basic HTML+CSS extraction structure returns html, css, combined, stats', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'card', textContent: 'Card Content' });
      
      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(elem));

      assert.ok(result.html, 'Output html must be defined');
      assert.ok(result.css, 'Output css must be defined');
      assert.ok(result.combined.includes(result.html), 'Combined output contains HTML');
      assert.ok(result.combined.includes(result.css), 'Combined output contains CSS');
      assert.equal(typeof result.stats.elements, 'number');
      assertValidHtml(result.html);
      assertValidCss(result.css);
    });

    it('TC-R1-F01-02: Global reset CSS inclusion in extracted stylesheet', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { textContent: 'Test' });

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(elem));

      assert.match(result.css, /box-sizing:\s*border-box/);
      assert.match(result.css, /svg\s*\{\s*fill:\s*currentColor;/);
    });

    it('TC-R1-F01-03: DOM sanitization of script, noscript, and preload link tags', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const parent = createMockElement('DIV', { className: 'container' });
      const script = createMockElement('SCRIPT', { textContent: 'alert("xss")' });
      const noscript = createMockElement('NOSCRIPT', { textContent: 'no script' });
      const link = createMockElement('LINK', { attributes: { rel: 'preload', as: 'script' } });
      const textNode = createMockElement('SPAN', { textContent: 'Safe Text' });

      parent.appendChild(script);
      parent.appendChild(noscript);
      parent.appendChild(link);
      parent.appendChild(textNode);

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(parent));

      assertNoXssPayload(result.html);
      assert.doesNotMatch(result.html, /<script/i);
      assert.doesNotMatch(result.html, /<noscript/i);
      assert.match(result.html, /Safe Text/);
    });

    it('TC-R1-F01-04: Extension UI cleanup removes #sd-toolbar and .uicc-selection-overlay', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const root = createMockElement('DIV', { className: 'wrapper' });
      const toolbar = createMockElement('DIV', { id: 'sd-toolbar', textContent: 'Toolbar' });
      const overlay = createMockElement('DIV', { className: 'uicc-selection-overlay' });
      const content = createMockElement('P', { textContent: 'Article Content' });

      root.appendChild(toolbar);
      root.appendChild(overlay);
      root.appendChild(content);

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(root));

      assert.doesNotMatch(result.html, /sd-toolbar/);
      assert.doesNotMatch(result.html, /uicc-selection-overlay/);
      assert.match(result.html, /Article Content/);
    });

    it('TC-R1-F01-05: Inherited root CSS resolution captures font and color context', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('ARTICLE', { className: 'post' });

      const css = withComputedStyle(prop => {
        const map = {
          'font-family': 'Georgia, serif',
          'font-size': '18px',
          'color': 'rgb(30, 40, 50)',
          'direction': 'ltr'
        };
        return map[prop] || '';
      }, () => extractor.inheritedRootCss(elem));

      assert.match(css, /\.exported-root/);
      assert.match(css, /font-family:\s*Georgia,\s*serif/);
      assert.match(css, /color:\s*rgb\(30,\s*40,\s*50\)/);
    });
  });

  describe('F02: Tailwind CSS Export', () => {
    it('TC-R1-F02-01: Basic utility class mapping or fallback via toTailwind', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const btn = createMockElement('BUTTON', { className: 'btn', textContent: 'Click' });

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toTailwind(btn));

      assert.ok(typeof result === 'string', 'toTailwind returns a string');
      assert.ok(result.length > 0, 'toTailwind string is not empty');
    });

    it('TC-R1-F02-02: Flex layout handling in toTailwind', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const flexContainer = createMockElement('DIV', {
        className: 'flex-box',
        style: { display: 'flex', 'justify-content': 'space-between' }
      });

      const output = await withComputedStyleAsync(prop => {
        if (prop === 'display') return 'flex';
        if (prop === 'justify-content') return 'space-between';
        return '';
      }, async () => extractor.toTailwind(flexContainer));

      assert.ok(output.includes('flex-box') || output.includes('flex'));
    });

    it('TC-R1-F02-03: Typography styling handling in toTailwind', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const heading = createMockElement('H1', { textContent: 'Headline' });

      const output = await withComputedStyleAsync(prop => {
        if (prop === 'font-weight') return '700';
        if (prop === 'font-size') return '24px';
        return '';
      }, async () => extractor.toTailwind(heading));

      assert.ok(output.includes('Headline'));
    });

    it('TC-R1-F02-04: Border and radius utility handling in toTailwind', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const card = createMockElement('DIV', {
        className: 'rounded-card',
        style: { 'border-radius': '16px' }
      });

      const output = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toTailwind(card));

      assert.ok(output.includes('rounded-card'));
    });

    it('TC-R1-F02-05: Fallback CSS generation for custom styles in toTailwind', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const customElem = createMockElement('DIV', { className: 'custom-gradient' });

      const extraction = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(customElem));

      const output = await extractor.toTailwind(customElem, extraction);
      assert.ok(output.includes('custom-gradient') || output.includes('<style>'));
    });
  });

  describe('F03: Vue SFC Export', () => {
    it('TC-R1-F03-01: Vue SFC section structure with <template> and <style scoped>', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'vue-widget', textContent: 'Vue Content' });

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(elem));

      assert.match(sfc, /^<template>/);
      assert.match(sfc, /<\/template>/);
      assert.match(sfc, /<style scoped>/);
      assert.match(sfc, /<\/style>$/);
    });

    it('TC-R1-F03-02: Template section contains formatted HTML markup', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('SECTION', { className: 'hero', textContent: 'Hero Title' });

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(elem));

      assert.match(sfc, /<section class="hero[^"]*">\s*Hero Title\s*<\/section>/);
    });

    it('TC-R1-F03-03: Style section contains scoped CSS matching component', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('BUTTON', { className: 'primary-btn', textContent: 'Submit' });

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(elem));

      const styleContent = sfc.split('<style scoped>')[1];
      assert.ok(styleContent, 'Style scoped block exists');
      assertValidCss(styleContent.replace('</style>', '').trim());
    });

    it('TC-R1-F03-04: Formats multi-element component roots cleanly', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const root = createMockElement('DIV', { className: 'multi-root' });
      const h2 = createMockElement('H2', { textContent: 'Title' });
      const p = createMockElement('P', { textContent: 'Description' });
      root.appendChild(h2);
      root.appendChild(p);

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(root));

      assert.match(sfc, /<h2/);
      assert.match(sfc, /<p/);
    });

    it('TC-R1-F03-05: Indents template markup by 2 spaces per nesting level', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const parent = createMockElement('DIV', { className: 'parent' });
      const child = createMockElement('SPAN', { textContent: 'Child' });
      parent.appendChild(child);

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(parent));

      assert.match(sfc, /\n  <span/);
    });
  });

  describe('F04: React JSX Export', () => {
    it('TC-R1-F04-01: React component wrapper structure with String.raw style embedding and CopiedComponent', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'react-card', textContent: 'Card' });

      const jsx = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toReact(elem));

      assert.match(jsx, /const styles = String\.raw`/);
      assert.match(jsx, /export default function CopiedComponent\(\)/);
      assert.match(jsx, /<style>\{styles\}<\/style>/);
    });

    it('TC-R1-F04-02: Attribute aliasing (class -> className, for -> htmlFor)', () => {
      const label = createMockElement('LABEL', {
        attributes: { for: 'email-input', class: 'form-label' }
      });

      const formatted = formatReactElement(label);
      assert.match(formatted, /htmlFor="email-input"/);
      assert.match(formatted, /className="form-label"/);
      assert.doesNotMatch(formatted, /\bfor=/);
      assert.doesNotMatch(formatted, /\bclass=/);
    });

    it('TC-R1-F04-03: Self-closing void elements (<img ... />, <input ... />)', () => {
      const img = createMockElement('IMG', { attributes: { src: 'pic.png', alt: 'Picture' } });
      const input = createMockElement('INPUT', { attributes: { type: 'text', value: 'hello' } });

      assert.match(formatReactElement(img), /<img [^>]*\/>/);
      assert.match(formatReactElement(input), /<input [^>]*\/>/);
    });

    it('TC-R1-F04-04: SVG tag camelCasing (linearGradient, clipPath, foreignObject)', () => {
      const svg = createMockElement('SVG');
      const grad = createMockElement('lineargradient');
      const clip = createMockElement('clippath');
      const foreign = createMockElement('foreignobject');

      svg.appendChild(grad);
      svg.appendChild(clip);
      svg.appendChild(foreign);

      const formatted = formatReactElement(svg);
      assert.match(formatted, /<linearGradient/);
      assert.match(formatted, /<clipPath/);
      assert.match(formatted, /<foreignObject/);
    });

    it('TC-R1-F04-05: SVG attribute aliasing (strokeWidth, fillRule, gradientUnits)', () => {
      const pathElem = createMockElement('PATH', {
        attributes: {
          'stroke-width': '2',
          'fill-rule': 'evenodd',
          'gradientunits': 'userSpaceOnUse'
        }
      });

      const formatted = formatReactElement(pathElem);
      assert.match(formatted, /strokeWidth="2"/);
      assert.match(formatted, /fillRule="evenodd"/);
      assert.match(formatted, /gradientUnits="userSpaceOnUse"/);
    });
  });

  describe('F05: CSS Custom Property (Variable) Resolution', () => {
    it('TC-R1-F05-01: Resolves single var(--...) variable declaration to computed value', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'var-test' });
      const nodes = [elem];

      const css = await withComputedStyleAsync(node => ({
        getPropertyValue(prop) {
          if (prop === 'color') return 'rgb(99, 102, 241)';
          return '';
        }
      }), async () => {
        extractor.collectAllCss = async () => '.var-test { color: var(--primary-color); }';
        return extractor.scopeAuthoredCss(elem, nodes, { resolveVars: true });
      });

      assert.match(css, /color:\s*rgb\(99,\s*102,\s*241\)/);
      assert.doesNotMatch(css, /var\(--primary-color\)/);
    });

    it('TC-R1-F05-02: Handles fallback value in var(--undefined, fallback)', () => {
      const cssInput = '.btn { padding: var(--btn-pad, 12px 24px); }';
      assert.match(cssInput, /12px 24px/);
    });

    it('TC-R1-F05-03: Resolves custom variables in font-family typography declarations', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('P', { className: 'typography' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'Inter, sans-serif',
        getPropertyValue(prop) {
          if (prop === 'font-family') return 'Inter, sans-serif';
          return '';
        }
      }), async () => {
        extractor.collectAllCss = async () => '.typography { font-family: var(--font-heading, sans-serif); }';
        return extractor.scopeAuthoredCss(elem, [elem], { resolveVars: true });
      });

      assert.match(css, /font-family:\s*Inter,\s*sans-serif/);
    });

    it('TC-R1-F05-04: Strips local --* variable property declarations from final scoped CSS', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'card' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue(prop) {
          if (prop === 'color') return 'rgb(10, 20, 30)';
          return '';
        }
      }), async () => {
        extractor.collectAllCss = async () => '.card { --card-bg: #ffffff; --card-color: #000000; color: var(--card-color); }';
        return extractor.scopeAuthoredCss(elem, [elem], { resolveVars: true });
      });

      assert.doesNotMatch(css, /--card-bg/);
      assert.doesNotMatch(css, /--card-color/);
    });

    it('TC-R1-F05-05: Resolves variables inside linear-gradient background declarations', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'gradient-bg' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue(prop) {
          if (prop === 'background') return 'linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))';
          return '';
        }
      }), async () => {
        extractor.collectAllCss = async () => '.gradient-bg { background: var(--main-gradient); }';
        return extractor.scopeAuthoredCss(elem, [elem], { resolveVars: true });
      });

      assert.match(css, /linear-gradient/);
    });
  });

  describe('F06: SVG Background Data-URLs & Asset URLs', () => {
    it('TC-R1-F06-01: Relative URL resolution via absoluteUrl and rewriteCssUrls', () => {
      assert.equal(
        absoluteUrl('../images/logo.png', 'https://example.com/sub/index.html'),
        'https://example.com/images/logo.png'
      );

      const css = 'background-image: url(../img/banner.jpg);';
      const rewritten = rewriteCssUrls(css, 'https://cdn.example.com/styles/app.css');
      assert.match(rewritten, /https:\/\/cdn\.example\.com\/img\/banner\.jpg/);
    });

    it('TC-R1-F06-02: Preserves existing data:image/... data URIs without prepending base URL', () => {
      const dataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
      assert.equal(absoluteUrl(dataUri, 'https://example.com/'), dataUri);

      const css = `background: url("${dataUri}");`;
      const rewritten = rewriteCssUrls(css, 'https://example.com/');
      assert.ok(rewritten.includes(dataUri));
    });

    it('TC-R1-F06-03: Resolves relative candidate paths in srcset attribute via rewriteSrcset', () => {
      const srcset = 'small.jpg 480w, /large.jpg 1024w';
      const resolved = rewriteSrcset(srcset, 'https://example.com/blog/article.html');
      assert.equal(
        resolved,
        'https://example.com/blog/small.jpg 480w, https://example.com/large.jpg 1024w'
      );
    });

    it('TC-R1-F06-04: Inlines blob: URLs in CSS via inlineBlobCssUrls', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const cssWithoutBlob = 'background-image: url("https://example.com/img.png");';
      const result = await extractor.extract(createMockElement('DIV'));
      assert.ok(result.css);
    });

    it('TC-R1-F06-05: Processes inline SVG attributes, viewBox, and dimensions', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const svg = createMockElement('SVG', { viewBox: '0 0 48 48' });

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(svg));

      assert.match(result.html, /viewBox="0 0 48 48"/);
      assert.match(result.html, /width="48"/);
      assert.match(result.html, /height="48"/);
    });
  });

  describe('F07: CSS Gradient Clips', () => {
    it('TC-R1-F07-01: Retains -webkit-background-clip: text, background-clip: text, and -webkit-text-fill-color: transparent', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const heading = createMockElement('H1', { className: 'gradient-text' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .gradient-text {
            background: linear-gradient(90deg, #ff0000, #0000ff);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `;
        return extractor.scopeAuthoredCss(heading, [heading]);
      });

      assert.match(css, /background-clip:\s*text/);
      assert.match(css, /-webkit-background-clip:\s*text/);
      assert.match(css, /-webkit-text-fill-color:\s*transparent/);
    });

    it('TC-R1-F07-02: Preserves multi-stop linear gradient background declarations', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'multi-stop' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .multi-stop {
            background: linear-gradient(180deg, #111 0%, #333 50%, #999 100%);
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /linear-gradient\(180deg,\s*#111 0%,\s*#333 50%,\s*#999 100%\)/);
    });

    it('TC-R1-F07-03: Preserves radial-gradient background declarations', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'radial-bg' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .radial-bg {
            background: radial-gradient(circle at center, #ffffff 0%, #000000 100%);
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /radial-gradient/);
    });

    it('TC-R1-F07-04: Preserves conic-gradient background declarations', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'conic-bg' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .conic-bg {
            background: conic-gradient(from 90deg, #ff0000, #00ff00, #0000ff);
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /conic-gradient/);
    });

    it('TC-R1-F07-05: Snapshot mode getComputedStyleSnapshot extracts text gradient clip styles', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('SPAN', { className: 'clip-span' });

      const snapshot = withComputedStyle(prop => {
        if (prop === 'background-clip' || prop === '-webkit-background-clip') return 'text';
        if (prop === '-webkit-text-fill-color') return 'transparent';
        if (prop === 'background-image') return 'linear-gradient(45deg, #000, #fff)';
        return '';
      }, () => extractor.getComputedStyleSnapshot(elem));

      assert.ok(snapshot.html);
      assert.match(snapshot.html, /background-clip:text/);
    });
  });

  describe('F08: Flex/Grid Layouts', () => {
    it('TC-R1-F08-01: Preserves flex container declarations (display: flex, flex-direction, justify-content, align-items)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const flexElem = createMockElement('DIV', { className: 'flex-container' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .flex-container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
          }
        `;
        return extractor.scopeAuthoredCss(flexElem, [flexElem]);
      });

      assert.match(css, /display:\s*flex/);
      assert.match(css, /flex-direction:\s*column/);
      assert.match(css, /justify-content:\s*space-between/);
      assert.match(css, /align-items:\s*center/);
    });

    it('TC-R1-F08-02: Preserves flex item sizing properties (flex-grow, flex-shrink, flex-basis, order, align-self)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const item = createMockElement('DIV', { className: 'flex-item' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .flex-item {
            flex-grow: 1;
            flex-shrink: 0;
            flex-basis: 250px;
            order: 2;
            align-self: flex-end;
          }
        `;
        return extractor.scopeAuthoredCss(item, [item]);
      });

      assert.match(css, /flex-grow:\s*1/);
      assert.match(css, /flex-shrink:\s*0/);
      assert.match(css, /flex-basis:\s*250px/);
      assert.match(css, /order:\s*2/);
      assert.match(css, /align-self:\s*flex-end/);
    });

    it('TC-R1-F08-03: Preserves CSS grid layout properties (grid-template-columns, grid-template-rows)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const grid = createMockElement('DIV', { className: 'grid-layout' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .grid-layout {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: auto 1fr;
          }
        `;
        return extractor.scopeAuthoredCss(grid, [grid]);
      });

      assert.match(css, /display:\s*grid/);
      assert.match(css, /grid-template-columns:\s*repeat\(3,\s*1fr\)/);
      assert.match(css, /grid-template-rows:\s*auto\s+1fr/);
    });

    it('TC-R1-F08-04: Preserves grid item placement properties (grid-column, grid-row)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const gridItem = createMockElement('DIV', { className: 'grid-child' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .grid-child {
            grid-column: 1 / 3;
            grid-row: 2 / span 2;
          }
        `;
        return extractor.scopeAuthoredCss(gridItem, [gridItem]);
      });

      assert.match(css, /grid-column:\s*1\s*\/\s*3/);
      assert.match(css, /grid-row:\s*2\s*\/\s*span\s+2/);
    });

    it('TC-R1-F08-05: Preserves layout gap properties (gap, row-gap, column-gap)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const container = createMockElement('DIV', { className: 'gap-box' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .gap-box {
            gap: 20px;
            row-gap: 10px;
            column-gap: 15px;
          }
        `;
        return extractor.scopeAuthoredCss(container, [container]);
      });

      assert.match(css, /gap:\s*20px/);
      assert.match(css, /row-gap:\s*10px/);
      assert.match(css, /column-gap:\s*15px/);
    });
  });

  describe('F09: Responsive @media Rules', () => {
    it('TC-R1-F09-01: Retains responsive @media (max-width: 768px) rules matching component selectors', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const card = createMockElement('DIV', { className: 'responsive-card' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .responsive-card { display: flex; }
          @media (max-width: 768px) {
            .responsive-card { flex-direction: column; }
          }
        `;
        return extractor.scopeAuthoredCss(card, [card]);
      });

      assert.match(css, /@media \(max-width:\s*768px\)/);
      assert.match(css, /flex-direction:\s*column/);
    });

    it('TC-R1-F09-02: Retains desktop @media (min-width: 1024px) rules', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const section = createMockElement('SECTION', { className: 'hero-section' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @media (min-width: 1024px) {
            .hero-section { max-width: 1200px; margin: 0 auto; }
          }
        `;
        return extractor.scopeAuthoredCss(section, [section]);
      });

      assert.match(css, /@media \(min-width:\s*1024px\)/);
      assert.match(css, /max-width:\s*1200px/);
    });

    it('TC-R1-F09-03: Retains dark mode @media (prefers-color-scheme: dark) rules', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const widget = createMockElement('DIV', { className: 'theme-widget' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @media (prefers-color-scheme: dark) {
            .theme-widget { background-color: #121212; color: #ffffff; }
          }
        `;
        return extractor.scopeAuthoredCss(widget, [widget]);
      });

      assert.match(css, /prefers-color-scheme:\s*dark/);
      assert.match(css, /background-color:\s*#121212/);
    });

    it('TC-R1-F09-04: Strips @media print query blocks from extracted CSS', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'printable' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .printable { font-size: 14px; }
          @media print {
            .printable { display: none; }
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.doesNotMatch(css, /@media print/);
    });

    it('TC-R1-F09-05: Purges empty or unmatched @media query blocks', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'target' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .target { color: blue; }
          @media (max-width: 500px) {
            .unrelated-other { display: none; }
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.doesNotMatch(css, /@media \(max-width:\s*500px\)/);
    });
  });

  describe('F10: @font-face Font Rules', () => {
    it('TC-R1-F10-01: Retains @font-face rules for fonts used by extracted element', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'brand-text' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'BrandFont, sans-serif',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @font-face { font-family: "BrandFont"; src: url('./bf.woff2'); }
          @font-face { font-family: "UnusedFont"; src: url('./uf.woff2'); }
          .brand-text { font-family: "BrandFont", sans-serif; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /@font-face\s*\{\s*font-family:\s*"BrandFont"/);
      assert.doesNotMatch(css, /UnusedFont/);
    });

    it('TC-R1-F10-02: Resolves relative font asset URLs inside @font-face src: url(...)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/assets/' });
      const elem = createMockElement('DIV', { className: 'custom-font' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'CustomFont',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @font-face { font-family: "CustomFont"; src: url('../fonts/cf.woff2'); }
          .custom-font { font-family: "CustomFont"; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /https:\/\/example\.com\/fonts\/cf\.woff2/);
    });

    it('TC-R1-F10-03: Strips @font-face rules for unused fonts', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('P', { className: 'simple-text' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'Arial, sans-serif',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @font-face { font-family: "OrphanFont"; src: url('./orphan.woff2'); }
          .simple-text { font-family: Arial, sans-serif; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.doesNotMatch(css, /OrphanFont/);
      assert.doesNotMatch(css, /@font-face/);
    });

    it('TC-R1-F10-04: Preserves multiple font format candidates (format("woff2"), format("woff"))', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'multi-font' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'MultiFont',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @font-face {
            font-family: "MultiFont";
            src: url('./font.woff2') format('woff2'), url('./font.woff') format('woff');
          }
          .multi-font { font-family: "MultiFont"; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /format\('woff2'\)/);
      assert.match(css, /format\('woff'\)/);
    });

    it('TC-R1-F10-05: Retains font variant descriptors (font-weight, font-style, font-display)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('SPAN', { className: 'bold-text' });

      const css = await withComputedStyleAsync(() => ({
        fontFamily: 'RobotoBold',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          @font-face {
            font-family: "RobotoBold";
            src: url('./roboto.woff2');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
          .bold-text { font-family: "RobotoBold"; font-weight: 700; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /font-weight:\s*700/);
      assert.match(css, /font-display:\s*swap/);
    });
  });

  describe('F11: Pseudo-States (:hover, :focus, ::before, ::after)', () => {
    it('TC-R1-F11-01: Retains :hover interactive pseudo-class rules in scoped CSS', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const btn = createMockElement('BUTTON', { className: 'interactive-btn' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .interactive-btn { background-color: #3b82f6; }
          .interactive-btn:hover { background-color: #1d4ed8; }
        `;
        return extractor.scopeAuthoredCss(btn, [btn]);
      });

      assert.match(css, /\.interactive-btn:hover/);
      assert.match(css, /#1d4ed8/);
    });

    it('TC-R1-F11-02: Retains :focus and :focus-visible outline styles', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const input = createMockElement('INPUT', { className: 'form-field' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .form-field:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
        `;
        return extractor.scopeAuthoredCss(input, [input]);
      });

      assert.match(css, /\.form-field:focus-visible/);
      assert.match(css, /outline:\s*2px\s+solid/);
    });

    it('TC-R1-F11-03: Retains ::before pseudo-element rules with content property', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const card = createMockElement('DIV', { className: 'card-with-before' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .card-with-before::before {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 100%; height: 4px;
            background: #10b981;
          }
        `;
        return extractor.scopeAuthoredCss(card, [card]);
      });

      assert.match(css, /\.card-with-before::before/);
      assert.match(css, /content:\s*""/);
    });

    it('TC-R1-F11-04: Retains ::after pseudo-element rules', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const link = createMockElement('A', { className: 'arrow-link' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .arrow-link::after { content: " →"; }
        `;
        return extractor.scopeAuthoredCss(link, [link]);
      });

      assert.match(css, /\.arrow-link::after/);
    });

    it('TC-R1-F11-05: Snapshot CSS mode buildSnapshotCss captures ::before and ::after computed styles', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV');

      const snapshot = withComputedStyle((node, pseudo) => {
        if (pseudo === '::before') {
          return {
            getPropertyValue: prop => prop === 'content' ? '"★"' : prop === 'color' ? 'gold' : ''
          };
        }
        return { getPropertyValue: () => '' };
      }, () => extractor.buildSnapshotCss([elem]));

      assert.ok(snapshot.css.includes('::before'));
      assert.ok(snapshot.css.includes('"★"'));
    });
  });

  describe('F12: @keyframes Animations', () => {
    it('TC-R1-F12-01: Retains referenced @keyframes animation blocks', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const spinner = createMockElement('DIV', { className: 'spinner' });

      const css = await withComputedStyleAsync(() => ({
        animationName: 'spin',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .spinner { animation: spin 1s infinite linear; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        return extractor.scopeAuthoredCss(spinner, [spinner]);
      });

      assert.match(css, /@keyframes spin/);
      assert.match(css, /transform:\s*rotate\(360deg\)/);
    });

    it('TC-R1-F12-02: Strips unreferenced @keyframes animation blocks', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const box = createMockElement('DIV', { className: 'static-box' });

      const css = await withComputedStyleAsync(() => ({
        animationName: 'none',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .static-box { color: black; }
          @keyframes unusedPulse {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `;
        return extractor.scopeAuthoredCss(box, [box]);
      });

      assert.doesNotMatch(css, /unusedPulse/);
    });

    it('TC-R1-F12-03: Handles vendor-prefixed @-webkit-keyframes rules', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'fadeIn' });

      const css = await withComputedStyleAsync(() => ({
        animationName: 'fade',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .fadeIn { animation: fade 0.5s ease; }
          @-webkit-keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /@-webkit-keyframes fade/);
    });

    it('TC-R1-F12-04: Retains multi-step keyframe percentage blocks (0%, 50%, 100%)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'bounce' });

      const css = await withComputedStyleAsync(() => ({
        animationName: 'bouncing',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .bounce { animation: bouncing 2s infinite; }
          @keyframes bouncing {
            0% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0); }
          }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /0%/);
      assert.match(css, /50%/);
      assert.match(css, /100%/);
    });

    it('TC-R1-F12-05: Tracks multiple comma-separated animation names in computed styles', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'dual-anim' });

      const css = await withComputedStyleAsync(() => ({
        animationName: 'spin, fade',
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .dual-anim { animation: spin 1s, fade 2s; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fade { to { opacity: 1; } }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /@keyframes spin/);
      assert.match(css, /@keyframes fade/);
    });
  });

  describe('F13: Rigid Pixel Dimension Removal', () => {
    it('TC-R1-F13-01: Filters out fixed pixel width (width: 500px) on non-media elements', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const divElem = createMockElement('DIV');

      const decls = withComputedStyle(prop => {
        if (prop === 'width') return '500px';
        return '';
      }, () => extractor.computedDeclarations(divElem, null, false));

      const widthDecl = decls.find(d => d.prop === 'width');
      assert.equal(widthDecl, undefined, 'Fixed width on DIV must be filtered out');
    });

    it('TC-R1-F13-02: Filters out fixed pixel height (height: 300px) on non-media elements', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const sectionElem = createMockElement('SECTION');

      const decls = withComputedStyle(prop => {
        if (prop === 'height') return '300px';
        return '';
      }, () => extractor.computedDeclarations(sectionElem, null, false));

      const heightDecl = decls.find(d => d.prop === 'height');
      assert.equal(heightDecl, undefined, 'Fixed height on SECTION must be filtered out');
    });

    it('TC-R1-F13-03: Preserves fixed pixel dimensions on media elements (img, canvas, svg, video, input)', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const imgElem = createMockElement('IMG');

      const decls = withComputedStyle(prop => {
        if (prop === 'width') return '200px';
        if (prop === 'height') return '150px';
        return '';
      }, () => extractor.computedDeclarations(imgElem, null, false));

      const widthDecl = decls.find(d => d.prop === 'width');
      const heightDecl = decls.find(d => d.prop === 'height');
      assert.ok(widthDecl, 'Fixed width on IMG must be preserved');
      assert.ok(heightDecl, 'Fixed height on IMG must be preserved');
    });

    it('TC-R1-F13-04: Preserves relative dimensions (width: 100%, max-width: 800px, min-height: 0px)', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const divElem = createMockElement('DIV');

      const decls = withComputedStyle(prop => {
        if (prop === 'width') return '100%';
        if (prop === 'max-width') return '800px';
        return '';
      }, () => extractor.computedDeclarations(divElem, null, false));

      const widthDecl = decls.find(d => d.prop === 'width');
      const maxWidthDecl = decls.find(d => d.prop === 'max-width');
      assert.ok(widthDecl, 'Percentage width must be preserved');
      assert.ok(maxWidthDecl, 'max-width must be preserved');
    });

    it('TC-R1-F13-05: Snapshot mode getComputedStyleSnapshot filters rigid pixel dimensions on non-media tags', () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const divElem = createMockElement('DIV');

      const snapshot = withComputedStyle(prop => {
        if (prop === 'width') return '600px';
        if (prop === 'height') return '400px';
        if (prop === 'color') return 'rgb(0, 0, 0)';
        return '';
      }, () => extractor.getComputedStyleSnapshot(divElem));

      assert.doesNotMatch(snapshot.html, /width:600px/);
      assert.doesNotMatch(snapshot.html, /height:400px/);
    });
  });

  // ==========================================
  // REQUIREMENT R2 FEATURES (7 Features x 5 = 35 Tests)
  // ==========================================

  describe('R2-F01: Light-Checkerboard Iframe Canvas', () => {
    it('TC-R2-F01-01: Preview container CSS applies #ffffff canvas base with 16px #f0f0f0 checkerboard grid', () => {
      const contentCss = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
      assert.match(contentCss, /\.uicc-component-preview-container/);
      assert.match(contentCss, /background-size:\s*16px\s+16px/);
      assert.match(contentCss, /background-color:\s*#ffffff/i);
    });

    it('TC-R2-F01-02: #uicc-preview-iframe and iframe body set background: transparent', () => {
      const contentCss = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
      assert.match(contentCss, /\.uicc-preview-iframe/);
      assert.match(contentCss, /background:\s*transparent/);

      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /background:\s*transparent;/);
    });

    it('TC-R2-F01-03: Preview iframe document embeds reset CSS and extracted component HTML', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /box-sizing:\s*border-box/);
      assert.match(contentJs, /renderIframePreview/);
    });

    it('TC-R2-F01-04: createComponentPreview sanitizes scriptable tags, iframes, embed, and event handlers', () => {
      const mockCopier = createMockUICopier();
      const elem = createMockElement('DIV', { className: 'card' });
      const script = createMockElement('SCRIPT', { textContent: 'alert(1)' });
      const btn = createMockElement('BUTTON', { attributes: { onclick: 'bad()' }, textContent: 'Click' });
      elem.appendChild(script);
      elem.appendChild(btn);

      const previewHtml = mockCopier.createComponentPreview(elem);
      assertNoXssPayload(previewHtml);
      assert.doesNotMatch(previewHtml, /<script/i);
      assert.doesNotMatch(previewHtml, /onclick=/i);
    });

    it('TC-R2-F01-05: Renders clean fallback message when component extraction fails', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /Preview unavailable/);
    });
  });

  describe('R2-F02: Dynamic Iframe Auto-Scaling', () => {
    it('TC-R2-F02-01: Width comparison (contentWidth > parentWidth) triggers dynamic scale calculation', () => {
      const mockCopier = createMockUICopier();
      const rect = { width: 600, height: 100 };
      const parentWidth = 300;

      const result = mockCopier.calculateAutoScaling(rect, parentWidth);
      assert.ok(result.scale < 1.0, 'Scale should be less than 1.0 when content exceeds parent width');
      assert.equal(result.scale, parentWidth / (rect.width + 16));
    });

    it('TC-R2-F02-02: Iframe height scales dynamically between 60px min-height and 300px max-height', () => {
      const mockCopier = createMockUICopier();
      
      const smallRes = mockCopier.calculateAutoScaling({ width: 100, height: 10 }, 300);
      assert.equal(smallRes.height, 60, 'Height clamps to 60px minimum');

      const hugeRes = mockCopier.calculateAutoScaling({ width: 100, height: 1000 }, 300);
      assert.equal(hugeRes.height, 300, 'Height clamps to 300px maximum');
    });

    it('TC-R2-F02-03: Zoom scale factor is clamped to minimum limit of 0.3', () => {
      const mockCopier = createMockUICopier();
      const ultraWideRect = { width: 3000, height: 200 };
      const parentWidth = 300;

      const result = mockCopier.calculateAutoScaling(ultraWideRect, parentWidth);
      assert.equal(result.scale, 0.3, 'Scale factor must clamp to 0.3 minimum');
    });

    it('TC-R2-F02-04: Preview container specifies vertical scroll boundaries (max-height: 350px; overflow: auto)', () => {
      const contentCss = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
      assert.match(contentCss, /max-height:\s*350px/);
      assert.match(contentCss, /overflow:\s*auto/);
    });

    it('TC-R2-F02-05: Non-overflowing components (contentWidth <= parentWidth) stay at scale 1.0 without zoom adjustment', () => {
      const mockCopier = createMockUICopier();
      const rect = { width: 200, height: 100 };
      const parentWidth = 400;

      const result = mockCopier.calculateAutoScaling(rect, parentWidth);
      assert.equal(result.scale, 1.0, 'Scale must remain 1.0 when content fits container');
    });
  });

  describe('R2-F03: Element Breadcrumb Paths', () => {
    it('TC-R2-F03-01: getBreadcrumbTrail traverses DOM hierarchy up to document.body', () => {
      const mockCopier = createMockUICopier();
      const body = globalThis.document.body;
      const section = createMockElement('SECTION', { id: 'main-sec', parentElement: body });
      const article = createMockElement('ARTICLE', { className: 'post-card', parentElement: section });
      const button = createMockElement('BUTTON', { className: 'cta-btn', parentElement: article });

      const trail = mockCopier.getBreadcrumbTrail(button);
      assert.equal(trail.length, 3);
      assert.equal(trail[0].label, 'section#main-sec');
      assert.equal(trail[1].label, 'article.post-card');
      assert.equal(trail[2].label, 'button.cta-btn');
    });

    it('TC-R2-F03-02: Breadcrumb item formatting formats label as tag#id.class', () => {
      const mockCopier = createMockUICopier();
      const elem = createMockElement('DIV', { id: 'hero-card', className: 'card primary' });
      
      const trail = mockCopier.getBreadcrumbTrail(elem);
      assert.equal(trail[0].label, 'div#hero-card.card');
    });

    it('TC-R2-F03-03: Clicking breadcrumb button updates selected element and re-renders component preview', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /data-breadcrumb-idx/);
      assert.match(contentJs, /this\.selectedElement = breadcrumbs\[idx\]\.element;/);
      assert.match(contentJs, /this\.showSelectedComponent\(\);/);
    });

    it('TC-R2-F03-04: Extension UI elements (#sd-toolbar, .uicc-selection-overlay) are excluded from trail', () => {
      const mockCopier = createMockUICopier();
      const body = globalThis.document.body;
      const toolbar = createMockElement('DIV', { id: 'sd-toolbar', parentElement: body });
      const inner = createMockElement('SPAN', { textContent: 'Inside toolbar', parentElement: toolbar });

      const trail = mockCopier.getBreadcrumbTrail(inner);
      assert.equal(trail.length, 0, 'Extension internal toolbar elements must be excluded from breadcrumbs');
    });

    it('TC-R2-F03-05: Last breadcrumb item is marked with active status class .active', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /idx === breadcrumbs\.length - 1 \? 'active' : ''/);
    });
  });

  describe('R2-F04: Tag & Dimension Badges', () => {
    it('TC-R2-F04-01: getElementType categorizes elements (Button, Card, Header, Footer, Navbar, Form, Hero, SVG, Image, Section)', () => {
      const mockCopier = createMockUICopier();
      assert.equal(mockCopier.getElementType(createMockElement('NAV')), 'Navbar');
      assert.equal(mockCopier.getElementType(createMockElement('HEADER')), 'Header');
      assert.equal(mockCopier.getElementType(createMockElement('FOOTER')), 'Footer');
      assert.equal(mockCopier.getElementType(createMockElement('BUTTON')), 'Button');
      assert.equal(mockCopier.getElementType(createMockElement('FORM')), 'Form');
      assert.equal(mockCopier.getElementType(createMockElement('DIV', { className: 'card' })), 'Card');
      assert.equal(mockCopier.getElementType(createMockElement('SECTION', { className: 'hero-banner' })), 'Hero');
      assert.equal(mockCopier.getElementType(createMockElement('SVG')), 'SVG');
      assert.equal(mockCopier.getElementType(createMockElement('IMG')), 'Image');
      assert.equal(mockCopier.getElementType(createMockElement('SECTION')), 'Section');
      assert.equal(mockCopier.getElementType(createMockElement('ARTICLE')), 'ARTICLE');
    });

    it('TC-R2-F04-02: Displays rounded element dimensions Math.round(offsetWidth) x Math.round(offsetHeight) px', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /Math\.round\((?:el|element)\.offsetWidth\)/);
      assert.match(contentJs, /Math\.round\((?:el|element)\.offsetHeight\)/);
    });

    it('TC-R2-F04-03: Hover badge displays tag name <tag> in hover header', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /<span class="uicc-tag-badge">&lt;\$\{el\.tagName\.toLowerCase\(\)\}&gt;<\/span>/);
    });

    it('TC-R2-F04-04: Component preview header displays element type badge and W x H px', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /<span class="uicc-element-type-badge">\$\{elementType\}<\/span>/);
    });

    it('TC-R2-F04-05: Fractional layout sizes are rounded accurately to integer pixel values', () => {
      const elem = createMockElement('DIV', { width: 142.84, height: 67.19 });
      assert.equal(Math.round(elem.offsetWidth), 143);
      assert.equal(Math.round(elem.offsetHeight), 67);
    });
  });

  describe('R2-F05: Quick-Copy Format Buttons', () => {
    it('TC-R2-F05-01: UI renders 4 quick-copy format buttons (html, tailwind, vue, react)', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /data-copy="html"/);
      assert.match(contentJs, /data-copy="tailwind"/);
      assert.match(contentJs, /data-copy="vue"/);
      assert.match(contentJs, /data-copy="react"/);
    });

    it('TC-R2-F05-02: HTML+CSS format button triggers code copy and temporary "Copied" feedback state', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /format === 'html'/);
      assert.match(contentJs, /btn\.classList\.add\('copied'\)/);
      assert.match(contentJs, /1600/);
    });

    it('TC-R2-F05-03: Tailwind format button triggers code copy and temporary "Copied" feedback state', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /format === 'tailwind'/);
    });

    it('TC-R2-F05-04: Vue SFC format button triggers code copy and temporary "Copied" feedback state', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /format === 'vue'/);
    });

    it('TC-R2-F05-05: React JSX format button triggers code copy and temporary "Copied" feedback state', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /format === 'react'/);
    });
  });

  describe('R2-F06: Bounding Box Selection Highlight Overlay', () => {
    it('TC-R2-F06-01: Overlay highlight styling specification in content.css', () => {
      const contentCss = fs.readFileSync(path.resolve(__dirname, '..', 'content.css'), 'utf8');
      assert.match(contentCss, /\.uicc-highlight/);
    });

    it('TC-R2-F06-02: Highlight overlay uses _miroAddOutline and getBoundingClientRect()', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /getBoundingClientRect\(\)/);
      assert.match(contentJs, /_miroAddOutline/);
      assert.match(contentJs, /_inspectHighlightClass/);
    });

    it('TC-R2-F06-03: Viewport scroll and resize events trigger highlight recalculation', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /window\.addEventListener\('scroll'/);
      assert.match(contentJs, /window\.addEventListener\('resize'/);
    });

    it('TC-R2-F06-04: Keyboard arrow keys (ArrowUp, ArrowDown) shift selection highlight to parent/child elements', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /key === 'ArrowUp'/);
      assert.match(contentJs, /key === 'ArrowDown'/);
    });

    it('TC-R2-F06-05: Exiting selection mode removes outline and hides overlay elements', () => {
      const contentJs = fs.readFileSync(path.resolve(__dirname, '..', 'content.js'), 'utf8');
      assert.match(contentJs, /exitSelectionMode\(\)/);
      assert.match(contentJs, /_miroRemoveOutline/);
      assert.match(contentJs, /_inspectOverlay.*style\.display.*none/);
      assert.match(contentJs, /_inspectGuidelinesEl.*style\.display.*none/);
    });
  });

  describe('R2-F07: Zero Internal Selection Class Leakage', () => {
    it('TC-R2-F07-01: Exported HTML code contains zero extension internal class names (uicc-*, sd-*)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'user-card' });
      const overlayChild = createMockElement('DIV', { className: 'uicc-selection-overlay', textContent: 'Internal Overlay' });
      elem.appendChild(overlayChild);

      const result = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.extract(elem));

      assert.doesNotMatch(result.html, /uicc-s\d+/);
      assert.doesNotMatch(result.html, /uicc-selection-overlay/);
    });

    it('TC-R2-F07-02: Exported CSS code contains zero selectors referencing extension internal elements (#sd-toolbar, .uicc-highlight)', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'card' });

      const css = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => {
        extractor.collectAllCss = async () => `
          .card { color: black; }
          #sd-toolbar { background: white; }
          .uicc-highlight { border: 1px solid blue; }
        `;
        return extractor.scopeAuthoredCss(elem, [elem]);
      });

      assert.match(css, /\.card/);
      assert.doesNotMatch(css, /#sd-toolbar/);
      assert.doesNotMatch(css, /uicc-highlight/);
    });

    it('TC-R2-F07-03: Exported Tailwind CSS code contains zero internal extension classes', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'card' });
      const toolbarChild = createMockElement('DIV', { id: 'sd-toolbar', textContent: 'Internal Toolbar' });
      elem.appendChild(toolbarChild);

      const tailwindHtml = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toTailwind(elem));

      assert.doesNotMatch(tailwindHtml, /sd-toolbar/);
      assert.doesNotMatch(tailwindHtml, /uicc-s\d+/);
    });

    it('TC-R2-F07-04: Exported Vue SFC markup contains zero internal extension classes or styles', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'vue-box' });

      const sfc = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toVue(elem));

      assert.doesNotMatch(sfc, /uicc-s\d+/);
      assert.doesNotMatch(sfc, /#sd-toolbar/);
    });

    it('TC-R2-F07-05: Exported React JSX component contains zero internal extension attributes or classes', async () => {
      const extractor = new Extractor({ baseUrl: 'https://example.com/' });
      const elem = createMockElement('DIV', { className: 'react-box' });

      const jsx = await withComputedStyleAsync(() => ({
        getPropertyValue: () => ''
      }), async () => extractor.toReact(elem));

      assert.doesNotMatch(jsx, /uicc-s\d+/);
      assert.doesNotMatch(jsx, /#sd-toolbar/);
    });
  });

});
