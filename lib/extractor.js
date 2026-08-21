// lib/extractor.js — UI Component Copier Extraction Engine
// Complete Miro-mirrored code extraction feature for HTML & CSS
// Features:
//   1. Clean DOM sanitization & asset absolutization (blob inlining, srcset, video/audio/poster, SVG cleanup)
//   2. PostCSS full-page CSS scoping, descendant rewriting, media queries, @keyframes, @font-face, @layer flattening
//   3. CSS custom property (var(--...)) computed resolution across the subtree
//   4. 3-iframe inherited typography detection & ancestor background color retention
//   5. Semantic class scoping & renaming (.card, .title, .btn, .link, .icon, etc.) producing cleanHtml & cleanCss
//   6. Multi-format code generation (HTML+CSS, Tailwind CSS, Vue SFC, React JSX)
//   7. Prettier code formatting via service worker formatCode / standalone Prettier
//   8. Miro-exact computed style snapshotting for Tailwind pages & previews

(function (global) {
  'use strict';

  // ── HTML & URL Helpers ───────────────────────────────────────────────────

  const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const INLINE_TAGS = new Set([
    'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'em', 'i',
    'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub',
    'sup', 'time', 'u', 'var', 'wbr', 'br', 'img', 'svg'
  ]);

  const BOOLEAN_ATTRIBUTES = new Set([
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
    'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert', 'ismap',
    'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
    'playsinline', 'readonly', 'required', 'reversed', 'selected'
  ]);

  const URL_ATTRIBUTES = new Set([
    'action', 'cite', 'data', 'formaction', 'href', 'poster', 'src', 'xlink:href'
  ]);

  const DANGEROUS_PROTOCOL = /^\s*(?:javascript|vbscript):/i;
  const SAFE_DATA_URL = /^data:(?:image|audio|video|font)\//i;
  const BIDI_CONTROL_CHARACTERS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

  function stripBidiControls(value) {
    return String(value == null ? '' : value).replace(BIDI_CONTROL_CHARACTERS, '');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function absoluteUrl(value, baseUrl) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('#')) return trimmed;
    if (DANGEROUS_PROTOCOL.test(trimmed)) return '';
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('chrome-extension:')) return trimmed;
    try {
      const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      return new URL(trimmed, base).href;
    } catch (_) {
      return trimmed;
    }
  }

  function rewriteCssUrls(css, baseUrl) {
    if (!css || typeof css !== 'string') return css;
    return css.replace(/url\(["']?([^"')]+)["']?\)/g, (match, url) => {
      if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') ||
          url.startsWith('https://') || url.startsWith('chrome-extension://')) return match;
      try {
        const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        return `url("${new URL(url, base).href}")`;
      } catch (_) {
        return match;
      }
    });
  }

  function rewriteStyleUrls(style, baseUrl) {
    if (!style || typeof style !== 'string') return style;
    return style.replace(/url\(["']?([^"')]+)["']?\)/g, (match, url) => {
      if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') ||
          url.startsWith('https://')) return match;
      try {
        const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        return `url("${new URL(url, base).href}")`;
      } catch (_) {
        return match;
      }
    });
  }

  function rewriteSrcset(srcset, baseUrl) {
    if (!srcset || typeof srcset !== 'string') return srcset;
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return srcset.split(',').map(item => {
      const parts = item.trim().split(/\s+/);
      if (parts[0] && !parts[0].startsWith('http') && !parts[0].startsWith('data:') && !parts[0].startsWith('blob:')) {
        try { parts[0] = new URL(parts[0], base).href; } catch (_) {}
      }
      return parts.join(' ');
    }).join(', ');
  }

  async function blobToDataUrl(url) {
    if (!url || !url.startsWith('blob:')) return url;
    try {
      const blob = await (await fetch(url)).blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[UI Copier] Failed to convert blob URL:', url, err);
      return null;
    }
  }

  // ── SVG Presentation Attribute Cleanup (Miro Sn) ─────────────────────────

  function svgCleanup(node) {
    if (!node || node.nodeType !== 1) return;
    const isSvgRoot = node.tagName === 'svg' || node.tagName === 'SVG';
    const redundant = {
      'fill-opacity': '1', 'stroke-opacity': '1', opacity: '1', 'stroke-width': '1px',
      'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-dashoffset': '0px',
      'stroke-dasharray': 'none', 'text-anchor': 'start', 'dominant-baseline': 'auto',
      'stop-color': '#000000', 'stop-opacity': '1', 'font-weight': '400', 'font-size': '16px'
    };
    const inheritable = [
      'font-family', 'font-size', 'font-weight', 'font-style',
      'text-anchor', 'dominant-baseline', 'stop-color', 'stop-opacity'
    ];

    if (!isSvgRoot) {
      for (const [prop, value] of Object.entries(redundant)) {
        if (node.getAttribute(prop) === value) node.removeAttribute(prop);
      }
      for (const prop of inheritable) {
        const parentValue = node.parentElement?.getAttribute(prop);
        const nodeValue = node.getAttribute(prop);
        if (nodeValue && parentValue && nodeValue === parentValue) node.removeAttribute(prop);
      }
      if (node.getAttribute('stroke') === 'null') node.removeAttribute('stroke');
      if (node.getAttribute('fill') === 'null') node.removeAttribute('fill');
    } else {
      if (node.getAttribute('fill') === 'null') node.removeAttribute('fill');
      if (node.getAttribute('stroke') === 'null') node.removeAttribute('stroke');
      for (const [prop, value] of Object.entries(redundant)) {
        if (node.getAttribute(prop) === value) node.removeAttribute(prop);
      }
    }
  }

  // ── Clean Clone DOM Builder (Miro hn / kn) ───────────────────────────────

  async function cleanCloneHtml(element, baseUrl = null) {
    if (!element || element.nodeType !== 1) return '';
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    const origin = typeof window !== 'undefined' ? window.location.origin : base;
    const originals = [element, ...element.querySelectorAll('*')];
    const clone = element.cloneNode(true);
    clone.classList.add('exported-root');
    const clones = [clone, ...clone.querySelectorAll('*')];
    const blobTasks = [];

    for (let m = 0; m < clones.length; m++) {
      const node = clones[m];
      if (!node || node.nodeType !== 1) continue;

      if (node.tagName === 'IMG') {
        const currentSrc = originals[m]?.currentSrc;
        const src = node.getAttribute('src');
        if (currentSrc && currentSrc.startsWith('blob:')) {
          blobTasks.push({ element: node, attr: 'src', url: currentSrc });
        } else if (currentSrc && currentSrc.startsWith('http')) {
          node.setAttribute('src', currentSrc);
        } else if (src && src.startsWith('blob:')) {
          blobTasks.push({ element: node, attr: 'src', url: src });
        } else if (src && !src.startsWith('http') && !src.startsWith('data:') && src) {
          try { node.setAttribute('src', new URL(src, base).href); } catch (_) {}
        }
      }

      if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
        const src = node.getAttribute('src');
        if (src && src.startsWith('blob:')) {
          blobTasks.push({ element: node, attr: 'src', url: src });
        } else if (src && !src.startsWith('http') && !src.startsWith('data:') && src) {
          try { node.setAttribute('src', new URL(src, base).href); } catch (_) {}
        }
        if (node.hasAttribute('poster')) {
          const poster = node.getAttribute('poster');
          if (poster && !poster.startsWith('http') && !poster.startsWith('data:') && !poster.startsWith('blob:')) {
            try { node.setAttribute('poster', new URL(poster, base).href); } catch (_) {}
          }
        }
      }

      if (node.tagName === 'SOURCE' && node.hasAttribute('src')) {
        const src = node.getAttribute('src');
        if (src && src.startsWith('blob:')) {
          blobTasks.push({ element: node, attr: 'src', url: src });
        } else if (src && !src.startsWith('http') && !src.startsWith('data:') && src) {
          try { node.setAttribute('src', new URL(src, base).href); } catch (_) {}
        }
      }

      if (node.hasAttribute('srcset')) {
        node.setAttribute('srcset', rewriteSrcset(node.getAttribute('srcset'), origin));
      }

      if (node.hasAttribute('style')) {
        let style = node.getAttribute('style');
        style = rewriteStyleUrls(style, origin);
        node.setAttribute('style', style);
      }

      if (node.hasAttribute('class') && node.getAttribute('class').trim() === '') node.removeAttribute('class');
      if (node.hasAttribute('style') && node.getAttribute('style').trim() === '') node.removeAttribute('style');
      if (node.ownerSVGElement || node.tagName === 'svg') svgCleanup(node);

      for (const attr of Array.from(node.attributes || [])) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) node.removeAttribute(attr.name);
        if (['href', 'src', 'action', 'formaction', 'data', 'xlink:href'].includes(name) &&
            attr.value.trim().toLowerCase().startsWith('javascript:')) {
          node.removeAttribute(attr.name);
        }
        if (/^data-v-/.test(name) || /^data-astro-cid/.test(name)) {
          node.removeAttribute(attr.name);
        }
      }
    }

    if (blobTasks.length > 0) {
      await Promise.all(blobTasks.map(async ({ element: el, attr, url }) => {
        try {
          const dataUrl = await blobToDataUrl(url);
          if (dataUrl) el.setAttribute(attr, dataUrl);
        } catch (err) {
          console.warn('[UI Copier] Failed to convert blob URL:', url, err);
        }
      }));
    }

    clone.querySelectorAll('script, noscript, #sd-toolbar, .uicc-selection-overlay, #uicc-toast').forEach(n => n.remove());

    let html = clone.outerHTML;
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/\s*export-element-highlight/g, '');
    html = html.replace(/\s*asset-inspector-outline/g, '');
    html = html.replace(/\s*asset-inspector-highlight/g, '');
    html = html.replace(/\s*uicc-inspector-outline/g, '');
    html = html.replace(/\s*uicc-inspector-selected/g, '');
    html = html.replace(/\s*uicc-selection-overlay/g, '');
    html = html.replace(/\s*uicc-selection-active/g, '');
    html = html.replace(/\s*uicc-highlight/g, '');
    html = html.replace(/\s*uicc-element-editing/g, '');
    html = html.replace(/\s*asset-inspector-editing/g, '');
    return html;
  }

  // ── PostCSS & Prettier Code Formatter (Miro Bt / zt) ─────────────────────

  function getPostcss() {
    return (typeof globalThis !== 'undefined' && globalThis.postcss) || global.postcss || null;
  }

  async function formatCode(code, parser = 'html', runtime = null) {
    if (!code || typeof code !== 'string') return code || '';
    const rt = runtime || (typeof chrome !== 'undefined' ? chrome.runtime : null);
    if (rt && typeof rt.sendMessage === 'function') {
      try {
        const response = await new Promise(resolve => {
          rt.sendMessage({ action: 'formatCode', code, parser }, res => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) resolve(null);
            else resolve(res || null);
          });
        });
        if (response && response.success && response.formatted) {
          return response.formatted.trim();
        }
      } catch (_) {}
    }

    // Direct Prettier fallback if loaded in same context
    const prettierGlobal = (typeof globalThis !== 'undefined' && globalThis.prettier) || null;
    const pluginGlobal = (typeof globalThis !== 'undefined' && globalThis.prettierPlugins) || null;
    if (prettierGlobal && typeof prettierGlobal.format === 'function') {
      try {
        const plugins = [];
        if (pluginGlobal?.html) plugins.push(pluginGlobal.html);
        if (pluginGlobal?.postcss) plugins.push(pluginGlobal.postcss);
        const formatted = await prettierGlobal.format(code, {
          parser: parser === 'css' ? 'css' : 'html',
          plugins,
          tabWidth: 2,
          useTabs: false,
          htmlWhitespaceSensitivity: 'ignore'
        });
        if (typeof formatted === 'string') return formatted.trim();
      } catch (_) {}
    }
    return code;
  }

  // ── Page CSS Collector (Miro mn / Lt / Tt) ───────────────────────────────

  async function collectPageCss(runtime = null) {
    if (typeof document === 'undefined') return '';
    const inline = [];
    const externalUrls = [];

    for (const sheet of Array.from(document.styleSheets || [])) {
      if (sheet.href && (sheet.href.startsWith('chrome-extension://') || sheet.href.startsWith('moz-extension://'))) continue;
      if (sheet.ownerNode?.id?.startsWith('asset-inspector-') || sheet.ownerNode?.id?.startsWith('uicc-')) continue;
      try {
        if (sheet.href) {
          externalUrls.push(sheet.href);
        } else {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) inline.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
        }
      } catch (_) {
        if (sheet.href) externalUrls.push(sheet.href);
      }
    }

    for (const sheet of Array.from(document.adoptedStyleSheets || [])) {
      try {
        const rules = sheet.cssRules;
        if (rules) inline.push(Array.from(rules).map(r => r.cssText).join('\n'));
      } catch (_) {}
    }

    let external = '';
    if (externalUrls.length > 0) {
      const rt = runtime || (typeof chrome !== 'undefined' ? chrome.runtime : null);
      if (rt && typeof rt.sendMessage === 'function') {
        try {
          const response = await new Promise(resolve => {
            rt.sendMessage({ action: 'fetchExternalStylesheets', urls: externalUrls }, res => {
              if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) resolve(null);
              else resolve(res || null);
            });
          });
          if (response && response.success && response.results) {
            for (const url of externalUrls) {
              if (response.results[url]?.success) external += response.results[url].css + '\n';
            }
          }
        } catch (_) {}
      }
    }
    return [...inline, external].filter(Boolean).join('\n');
  }

  // ── Selector Parsing & Matching (Miro gn, Ke, $e, Dt, bn, Oe) ────────────

  function splitSelectorChain(selector) {
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < selector.length; i++) {
      const c = selector[i];
      if (c === '[' || c === '(') { depth++; current += c; continue; }
      if (c === ']' || c === ')') { depth--; current += c; continue; }
      if (depth > 0) { current += c; continue; }
      if (c === '>' || c === '~' || c === '+') {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
      if (c === ' ' || c === '\t' || c === '\n') {
        if (current.trim()) { parts.push(current.trim()); current = ''; }
        continue;
      }
      current += c;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function stripPseudo(selector) {
    if (!selector) return '';
    try {
      return selector
        .replace(/::[\w-]+(\([^)]*\))?/g, '')
        .replace(/:[\w-]+(\([^)]*\))?/g, '')
        .trim();
    } catch (_) {
      return selector;
    }
  }

  function elementMatches(element, selector) {
    if (!element || !selector || !selector.trim()) return false;
    try { return element.matches(selector); } catch (_) { return false; }
  }

  function elementContains(element, selector) {
    if (!element || !selector || !selector.trim()) return false;
    try { return element.querySelector(selector) !== null; } catch (_) { return false; }
  }

  function findMatchElement(element, selector) {
    const stripped = stripPseudo(selector);
    if (elementMatches(element, selector) || elementMatches(element, stripped)) return element;
    try {
      const nodes = element.querySelectorAll(stripped || selector);
      if (nodes.length > 0) return nodes[nodes.length - 1];
    } catch (_) {}
    return null;
  }

  function insideKeyframes(rule) {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && (parent.name === 'keyframes' || parent.name === '-webkit-keyframes')) return true;
      parent = parent.parent;
    }
    return false;
  }

  // ── CSS Custom Property Resolution (Miro yn / _t) ────────────────────────

  function resolveVarValue(prop, value, computed) {
    if (!value || !value.includes('var(') || !computed) return value;
    let result = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (match, name, fallback) => {
      const resolved = computed.getPropertyValue(name).trim();
      return resolved || (fallback ? fallback.trim() : match);
    });
    if (result.includes('var(')) {
      const resolvedProp = computed.getPropertyValue(prop).trim();
      if (resolvedProp) return resolvedProp;
    }
    return result;
  }

  function resolveVarsAcross(value, computedList) {
    if (!value || value.indexOf('var(') === -1 || !computedList || computedList.length === 0) return value;
    let result = value;
    let from = 0;
    for (let i = 0; i < 20; i++) {
      const start = result.indexOf('var(', from);
      if (start === -1) break;
      let depth = 0;
      let end = -1;
      for (let h = start + 3; h < result.length; h++) {
        if (result[h] === '(') depth++;
        else if (result[h] === ')') { depth--; if (depth === 0) { end = h; break; } }
      }
      if (end === -1) break;
      const inner = result.slice(start + 4, end);
      let comma = -1;
      let paren = 0;
      for (let h = 0; h < inner.length; h++) {
        if (inner[h] === '(') paren++;
        else if (inner[h] === ')') paren--;
        else if (inner[h] === ',' && paren === 0) { comma = h; break; }
      }
      const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
      const fallback = comma === -1 ? null : inner.slice(comma + 1).trim();
      let resolved = '';
      for (const cs of computedList) {
        try { resolved = (cs.getPropertyValue(name) || '').trim(); } catch (_) { resolved = ''; }
        if (resolved) break;
      }
      if (!resolved && fallback !== null) resolved = fallback;
      if (!resolved) { from = start + 4; continue; }
      result = result.slice(0, start) + resolved + result.slice(end + 1);
      from = start;
    }
    return result;
  }

  // ── Inherited Typography & Background (Miro Cn, vn, $t, wn) ──────────────

  function findAncestorBackgroundColor(element) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    let node = element;
    while (node && node !== document.documentElement) {
      try {
        const bg = window.getComputedStyle(node).getPropertyValue('background-color');
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)') {
            node = node.parentElement;
            continue;
          }
          return bg;
        }
      } catch (_) {}
      node = node.parentElement;
    }
    try {
      for (const candidate of [document.body, document.documentElement]) {
        if (!candidate) continue;
        const bg = window.getComputedStyle(candidate).getPropertyValue('background-color');
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' &&
            bg !== 'rgb(255, 255, 255)' && bg !== 'rgba(255, 255, 255, 1)') return bg;
      }
    } catch (_) {}
    return null;
  }

  function buildBodyCss(element) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    const parts = [];
    try {
      if (document.body) {
        const bodyStyle = window.getComputedStyle(document.body);
        const color = bodyStyle.getPropertyValue('color');
        if (color) parts.push(`  color: ${color};`);
        const fontFamily = bodyStyle.getPropertyValue('font-family');
        if (fontFamily) parts.push(`  font-family: ${fontFamily};`);
      }
      if (element) {
        const bg = findAncestorBackgroundColor(element);
        if (bg) parts.push(`  background-color: ${bg};`);
      }
    } catch (_) {}
    return parts.length > 0 ? `body {\n${parts.join('\n')}\n}` : null;
  }

  function fallbackInheritedCss(element) {
    if (typeof window === 'undefined' || !element) return '';
    const props = ['color', 'font-family', 'font-size', 'font-weight', 'font-style',
      'line-height', 'letter-spacing', 'text-align', 'text-transform'];
    const lines = [];
    try {
      const computed = window.getComputedStyle(element);
      for (const prop of props) {
        const value = computed.getPropertyValue(prop);
        if (value) lines.push(`  ${prop}: ${value};`);
      }
    } catch (_) {}
    return lines.length === 0 ? '' : `.exported-root {\n${lines.join('\n')}\n}`;
  }

  async function detectInheritedCss(element, cleanHtml, scopedCssText) {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !element) return '';
    const props = ['color', 'font-family', 'font-size', 'font-weight', 'font-style',
      'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-indent',
      'text-transform', 'white-space', 'direction', 'visibility', 'cursor',
      'list-style-type', 'list-style-position', 'quotes', 'orphans', 'widows',
      'tab-size', 'hyphens', 'overflow-wrap', 'word-break', '-webkit-text-size-adjust'];
    const live = {};
    try {
      const computed = window.getComputedStyle(element);
      for (const prop of props) live[prop] = computed.getPropertyValue(prop);
    } catch (_) {}

    const probeFrame = document.createElement('iframe');
    const probeW = Math.max(element.offsetWidth || 0, window.innerWidth || 1024, 1024);
    const probeH = Math.max(element.offsetHeight || 0, window.innerHeight || 768, 768);
    probeFrame.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${probeW}px;height:${probeH}px;opacity:0;pointer-events:none;`;
    probeFrame.sandbox = 'allow-same-origin';
    document.body.appendChild(probeFrame);

    try {
      const doc = probeFrame.contentDocument || probeFrame.contentWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>${scopedCssText}</style></head><body>${cleanHtml}</body></html>`);
      doc.close();
      await new Promise(resolve => setTimeout(resolve, 150));

      const rendered = doc.body.firstElementChild;
      const renderedProps = {};
      if (rendered) {
        const style = probeFrame.contentWindow.getComputedStyle(rendered);
        for (const prop of props) renderedProps[prop] = style.getPropertyValue(prop);
      }
      const probe = doc.createElement('div');
      doc.body.appendChild(probe);
      const probeProps = {};
      const probeStyle = probeFrame.contentWindow.getComputedStyle(probe);
      for (const prop of props) probeProps[prop] = probeStyle.getPropertyValue(prop);

      const diff = {};
      for (const prop of props) {
        if (live[prop] !== renderedProps[prop] && live[prop] !== probeProps[prop]) diff[prop] = live[prop];
      }
      if (Object.keys(diff).length === 0) return '';
      return `.exported-root {\n${Object.entries(diff).map(([prop, value]) => `  ${prop}: ${value};`).join('\n')}\n}`;
    } catch (err) {
      console.warn('[UI Copier] 3-iframe inherited detection failed:', err);
      return fallbackInheritedCss(element);
    } finally {
      if (probeFrame.parentNode) document.body.removeChild(probeFrame);
    }
  }

  // ── Scoped CSS Extractor (Miro xn / Ln) ───────────────────────────────────

  async function scopedCss(element, cleanHtml, options = {}) {
    const postcss = getPostcss();
    const externalUrls = [];
    const fontUrls = [];
    if (!element) return { cssText: '', ruleCount: 0, hasAnimations: false, hasPseudoElements: false, externalUrls, fontUrls };

    try {
      const allCss = await collectPageCss(options.runtime);
      if (!allCss || allCss.trim().length === 0 || !postcss) {
        return { cssText: '', ruleCount: 0, hasAnimations: false, hasPseudoElements: false, externalUrls, fontUrls };
      }

      let root;
      try {
        root = postcss.parse(allCss, { from: undefined });
      } catch (err) {
        const cleaned = allCss
          .replace(/@nest\b[^{]*\{[^}]*\}/g, '')
          .replace(/@apply\b[^;]*;/g, '');
        try { root = postcss.parse(cleaned, { from: undefined }); }
        catch (err2) {
          return { cssText: '', ruleCount: 0, hasAnimations: false, hasPseudoElements: false, externalUrls, fontUrls };
        }
      }

      // Filter selectors that match the element tree
      const matchedSelectors = new Set();
      root.walkRules(rule => {
        if (insideKeyframes(rule) || (rule.parent?.type === 'atrule' && rule.parent.name === 'font-face')) return;
        for (const sel of rule.selectors) {
          const stripped = stripPseudo(sel);
          if (elementMatches(element, sel) || elementMatches(element, stripped) ||
              elementContains(element, sel) || elementContains(element, stripped)) {
            matchedSelectors.add(sel);
          }
        }
      });
      root.walkRules(rule => {
        if (insideKeyframes(rule) || (rule.parent?.type === 'atrule' && rule.parent.name === 'font-face')) return;
        const kept = rule.selectors.filter(sel => matchedSelectors.has(sel));
        if (kept.length === 0) rule.remove();
        else rule.selectors = kept;
      });

      // Rewrite descendant selectors so they match inside exported root
      if (cleanHtml) {
        try {
          const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
          const rootEl = doc.body.firstElementChild || doc.body;
          root.walkRules(rule => {
            if (insideKeyframes(rule) || (rule.parent?.type === 'atrule' && rule.parent.name === 'font-face')) return;
            rule.selectors = rule.selectors.map(sel => {
              const stripped = stripPseudo(sel);
              try { if (rootEl.matches(stripped) || rootEl.querySelector(stripped)) return sel; } catch (_) {}
              const chain = splitSelectorChain(stripped);
              for (let i = 1; i < chain.length; i++) {
                const tail = chain.slice(i).join(' ');
                try {
                  if (rootEl.matches(tail) || rootEl.querySelector(tail)) {
                    const m = sel.match(/(::?[\w-]+(\([^)]*\))?)$/);
                    return tail + (m ? m[0] : '');
                  }
                } catch (_) {}
              }
              return sel;
            });
          });
        } catch (_) {}
      }

      // Filter @keyframes
      const animationNames = new Set();
      root.walkDecls(decl => {
        if (decl.prop === 'animation-name' || decl.prop === '-webkit-animation-name') {
          decl.value.split(',').forEach(name => { const trimmed = name.trim(); if (trimmed && trimmed !== 'none') animationNames.add(trimmed); });
        } else if (decl.prop === 'animation' || decl.prop === '-webkit-animation') {
          decl.value.split(',').forEach(part => part.trim().split(/\s+/).forEach(token => { if (token && token !== 'none') animationNames.add(token); }));
        }
      });
      const hasAnimations = animationNames.size > 0;
      root.walkAtRules(rule => {
        if (rule.name === 'keyframes' || rule.name === '-webkit-keyframes') {
          if (!animationNames.has(rule.params)) rule.remove();
        }
      });

      // Resolve var(--...) references against computed styles
      root.walkRules(rule => {
        if (insideKeyframes(rule)) return;
        rule.walkDecls(decl => {
          if (decl.value && decl.value.includes('var(')) {
            const matchEl = findMatchElement(element, rule.selector);
            if (matchEl && typeof window !== 'undefined') {
              try { decl.value = resolveVarValue(decl.prop, decl.value, window.getComputedStyle(matchEl)); } catch (_) {}
            }
          }
        });
      });
      root.walkDecls(decl => { if (decl.prop.startsWith('--')) decl.remove(); });
      root.walkComments(comment => comment.remove());
      root.walkAtRules(rule => { if (rule.name === 'media' && rule.params && rule.params.includes('print')) rule.remove(); });

      // Flatten @layer blocks
      let changed = true;
      while (changed) {
        changed = false;
        root.walkAtRules(rule => {
          if (rule.name === 'layer') {
            if (rule.nodes && rule.nodes.length > 0) {
              for (const node of [...rule.nodes]) rule.parent.insertBefore(node, rule);
            }
            rule.remove();
            changed = true;
          }
        });
      }
      for (changed = true; changed;) {
        changed = false;
        root.walkAtRules(rule => { if (rule.nodes && rule.nodes.length === 0) { rule.remove(); changed = true; } });
      }

      // Filter @font-face rules
      const usedFonts = new Set();
      root.walkDecls(decl => {
        if (decl.prop === 'font-family' || decl.prop === 'font') {
          decl.value.replace(/!important/g, '').split(',').map(part => part.trim().replace(/^["']|["']$/g, '').toLowerCase()).forEach(name => { if (name) usedFonts.add(name); });
        }
      });
      root.walkAtRules('font-face', rule => {
        let family = '';
        rule.walkDecls('font-family', decl => { family = decl.value.trim().replace(/^["']|["']$/g, '').toLowerCase(); });
        if (family && !usedFonts.has(family)) rule.remove();
      });
      root.walkAtRules('font-feature-values', rule => rule.remove());

      let cssText = root.toString();
      cssText = rewriteCssUrls(cssText);
      const hasPseudoElements = /::(?:before|after)/.test(cssText);
      const ruleCount = (cssText.match(/\{/g) || []).length;

      const bodyCss = buildBodyCss(element);
      let inheritedCss = '';
      try { inheritedCss = await detectInheritedCss(element, cleanHtml, cssText); }
      catch (_) { inheritedCss = fallbackInheritedCss(element); }

      let htmlFontSizeCss = '';
      if (/\d+(\.\d+)?rem/.test(cssText) && typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          const fontSize = window.getComputedStyle(document.documentElement).fontSize;
          if (fontSize && fontSize !== '16px') htmlFontSizeCss = `html { font-size: ${fontSize}; }`;
        } catch (_) {}
      }

      // Convert remaining blob: urls in CSS
      const blobUrls = [...new Set([...cssText.matchAll(/url\(["']?(blob:[^"')]+)["']?\)/g)].map(match => match[1]))];
      if (blobUrls.length > 0) {
        const map = {};
        await Promise.all(blobUrls.map(async url => {
          try { const dataUrl = await blobToDataUrl(url); if (dataUrl) map[url] = dataUrl; } catch (_) {}
        }));
        cssText = cssText.replace(/url\(["']?(blob:[^"')]+)["']?\)/g, (match, url) => map[url] ? `url("${map[url]}")` : match);
      }

      const finalCss = [htmlFontSizeCss, inheritedCss, bodyCss, cssText].filter(Boolean).join('\n\n');
      return {
        cssText: finalCss,
        ruleCount,
        hasAnimations,
        hasPseudoElements,
        externalUrls,
        fontUrls
      };
    } catch (err) {
      console.warn('[UI Copier] scoped CSS extraction failed:', err);
      return { cssText: '', ruleCount: 0, hasAnimations: false, hasPseudoElements: false, externalUrls, fontUrls };
    }
  }

  // ── CSS Specificity & Media Context (Miro Bt, Ke, Dt) ────────────────────

  function specificityScore(selector) {
    if (!selector) return 0;
    let s = selector;
    s = s.replace(/:where\([^)]*\)/gi, '');
    s = s.replace(/:(not|is|has|matches|-webkit-any)\(/gi, '(');
    let id = 0, cls = 0, el = 0;
    cls += (s.match(/\[[^\]]*\]/g) || []).length;
    s = s.replace(/\[[^\]]*\]/g, ' ');
    const pseudoEls = s.match(/::[\w-]+/g) || [];
    el += pseudoEls.length;
    s = s.replace(/::[\w-]+/g, ' ');
    const legacyPseudoEls = s.match(/:(before|after|first-line|first-letter)\b/gi) || [];
    el += legacyPseudoEls.length;
    s = s.replace(/:(before|after|first-line|first-letter)\b/gi, ' ');
    cls += (s.match(/:[\w-]+/g) || []).length;
    s = s.replace(/:[\w-]+/g, ' ');
    id += (s.match(/#[\w-]+/g) || []).length;
    s = s.replace(/#[\w-]+/g, ' ');
    cls += (s.match(/\.[\w-]+/g) || []).length;
    s = s.replace(/\.[\w-]+/g, ' ');
    const elements = s.split(/[\s>+~(),]+/).filter(x => x && x !== '*' && /^[a-zA-Z][\w-]*$/.test(x));
    el += elements.length;
    return id * 10000 + cls * 100 + el;
  }

  function mergeDecls(list) {
    const map = new Map();
    for (const item of list) {
      const existing = map.get(item.prop);
      if (!existing) { map.set(item.prop, item); continue; }
      const itemImp = item.important ? 1 : 0;
      const existImp = existing.important ? 1 : 0;
      if (itemImp > existImp || (itemImp === existImp && (item.spec || 0) >= (existing.spec || 0))) {
        map.set(item.prop, item);
      }
    }
    return Array.from(map.values()).map(({ prop, value }) => ({ prop, value }));
  }

  function mediaContext(rule) {
    const parts = [];
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media' && parent.params) parts.unshift(parent.params);
      parent = parent.parent;
    }
    return parts.length > 0 ? parts.join(' and ') : null;
  }

  // ── Semantic Scoping & Class Renaming (Miro wn, vn, Sn, Ot) ──────────────

  const TAILWIND_UTILITY_RE = new RegExp('^(?:-?(?:m|p)(?:t|r|b|l|x|y|s|e)?-|w-|h-|size-|min-w|min-h|max-w|max-h|gap-|space-|inset|top-|right-|bottom-|left-|z-|order-|col-|row-|grid$|grid-|auto-|basis-|grow$|shrink$|flex$|flex-|inline$|inline-|block$|hidden$|table$|table-|contents$|list-|items-|justify-|content-|self-|place-|text-|font-|leading-|tracking-|whitespace-|break-|hyphens-|align-|indent-|truncate$|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|underline$|overline$|line-through$|no-underline$|decoration-|underline-offset-|antialiased$|bg-|from-|via-|to-|rounded|border|divide-|outline|ring|shadow|opacity-|mix-blend-|blur|brightness-|contrast-|drop-shadow|grayscale|hue-rotate-|invert|saturate-|sepia|backdrop-|filter$|transition|duration-|ease-|delay-|animate-|transform$|origin-|scale-|rotate-|translate-|skew-|cursor-|select-|resize|appearance-|pointer-events-|touch-|scroll-|snap-|will-change-|accent-|caret-|columns-|object-|overflow-|overscroll-|aspect-|relative$|absolute$|fixed$|sticky$|static$|isolate$|visible$|invisible$|collapse$|sr-only$|not-sr-only$|group$|peer$|container$|fill-|stroke-|iconify$|i-[a-z]+)');

  function isTailwindUtility(cls) {
    return TAILWIND_UTILITY_RE.test(cls);
  }

  const SEMANTIC_TAG_NAMES = {
    header: 'header', nav: 'nav', footer: 'footer', section: 'section',
    article: 'article', aside: 'aside', main: 'main',
    h1: 'title', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
    p: 'text', a: 'link', button: 'button', img: 'image', svg: 'icon',
    ul: 'list', ol: 'list', li: 'item', input: 'input', textarea: 'input',
    select: 'select', form: 'form', video: 'video', span: 'label',
    blockquote: 'quote', figure: 'figure', figcaption: 'caption',
    table: 'table', iframe: 'frame', picture: 'picture'
  };

  function semanticName(element, classes, isRoot) {
    for (const c of classes) {
      if (!(/^c-\d+$/.test(c) || c === 'exported-root') &&
          !(c.length < 3) && /^[a-z][a-z0-9-]*$/.test(c) &&
          !c.includes('__') && !/^svelte-/.test(c) && !isTailwindUtility(c)) return c;
    }
    const tag = element.tagName ? element.tagName.toLowerCase() : '';
    if (SEMANTIC_TAG_NAMES[tag]) return SEMANTIC_TAG_NAMES[tag];
    const role = element.getAttribute && element.getAttribute('role');
    return role && /^[a-z-]+$/.test(role) ? role : (isRoot ? 'component' : 'wrapper');
  }

  function semanticScopedCss(cleanHtml, cssText, element) {
    const postcss = getPostcss();
    if (!cleanHtml || !cssText || !postcss) return null;
    const computedList = [];
    try {
      if (element && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
        computedList.push(window.getComputedStyle(element));
        if (typeof document !== 'undefined') computedList.push(window.getComputedStyle(document.documentElement));
      }
    } catch (_) {}

    let parsed;
    try { parsed = new DOMParser().parseFromString(cleanHtml, 'text/html'); } catch (_) { return null; }
    const root = parsed.body.firstElementChild || parsed.body;
    const all = [root, ...root.querySelectorAll('*')];

    let tree;
    try { tree = postcss.parse(cssText, { from: undefined }); } catch (_) { return null; }

    const rules = [];
    const staticCss = [];
    const pseudoRules = [];

    tree.walkRules(rule => {
      let p = rule.parent;
      while (p) {
        if ((p.type === 'atrule' && (p.name === 'keyframes' || p.name === '-webkit-keyframes')) ||
            (p.type === 'atrule' && p.name === 'font-face')) return;
        p = p.parent;
      }
      const media = mediaContext(rule);
      const decls = [];
      rule.walkDecls(decl => {
        decls.push({ prop: decl.prop, value: resolveVarsAcross(decl.value, computedList), important: !!decl.important });
      });
      if (decls.length === 0) return;
      for (const sel of rule.selectors) {
        const pseudoElMatch = sel.match(/(::(before|after|placeholder|marker|selection|backdrop|first-line|first-letter|file-selector-button))$/);
        if (pseudoElMatch) {
          pseudoRules.push({
            base: sel.slice(0, sel.length - pseudoElMatch[0].length),
            suffix: pseudoElMatch[0],
            declarations: decls,
            media,
            spec: specificityScore(sel),
            raw: sel,
            bound: false
          });
        } else if (/::/.test(sel)) {
          const body = sel + ' {\n' + decls.map(w => `  ${w.prop}: ${w.value}${w.important ? ' !important' : ''};`).join('\n') + '\n}';
          staticCss.push(media ? `@media ${media} {\n${body}\n}` : body);
        } else {
          rules.push({ selector: sel, declarations: decls, media, spec: specificityScore(sel) });
        }
      }
    });
    tree.walkAtRules(rule => {
      if (/^(-webkit-)?keyframes$/.test(rule.name)) {
        try { staticCss.push(rule.toString()); } catch (_) {}
      }
    });

    const output = [];
    let counter = 0;
    for (const node of all) {
      const groups = new Map();
      const group = (media) => {
        const key = media || '';
        if (!groups.has(key)) groups.set(key, { media: media || null, base: [], pseudo: {}, pseudoEl: {} });
        return groups.get(key);
      };

      for (const { selector, declarations, media, spec } of rules) {
        const pseudoMatch = selector.match(/(:(hover|focus|focus-visible|focus-within|active|disabled|visited|first-child|last-child|odd|even|placeholder))$/);
        const clean = pseudoMatch ? selector.replace(pseudoMatch[0], '') : selector;
        const pseudo = pseudoMatch ? pseudoMatch[2] : null;
        let matches = false;
        try { matches = node.matches(clean); } catch (_) {
          try { matches = root.querySelector(clean) === node; } catch (_) {}
        }
        if (!matches) continue;
        const enriched = declarations.map(k => ({ ...k, spec }));
        const g = group(media);
        if (pseudo) { (g.pseudo[pseudo] || (g.pseudo[pseudo] = [])).push(...enriched); }
        else g.base.push(...enriched);
      }

      for (const pr of pseudoRules) {
        let base = pr.base;
        let suffix = pr.suffix;
        const pcMatch = base.match(/(:(hover|focus|focus-visible|focus-within|active|disabled|visited|first-child|last-child|odd|even))$/);
        if (pcMatch) { base = base.slice(0, base.length - pcMatch[0].length); suffix = pcMatch[0] + suffix; }
        let matched = false;
        try { matched = base.trim() !== '' && node.matches(base); } catch (_) {}
        if (!matched) continue;
        pr.bound = true;
        const g = group(pr.media);
        (g.pseudoEl[suffix] || (g.pseudoEl[suffix] = [])).push(...pr.declarations.map(e => ({ ...e, spec: pr.spec })));
      }

      if (groups.size === 0) continue;
      const cls = 'c-' + counter++;
      const existing = node.getAttribute('class');
      node.setAttribute('class', existing ? existing + ' ' + cls : cls);

      const sorted = Array.from(groups.values()).sort((a, b) => (a.media ? 1 : 0) - (b.media ? 1 : 0));
      for (const g of sorted) {
        const blocks = [];
        if (g.base.length > 0) {
          const body = mergeDecls(g.base).map(p => `  ${p.prop}: ${p.value};`).join('\n');
          blocks.push(`.${cls} {\n${body}\n}`);
        }
        for (const [pseudo, list] of Object.entries(g.pseudo)) {
          if (list.length > 0) {
            const body = mergeDecls(list).map(x => `  ${x.prop}: ${x.value};`).join('\n');
            blocks.push(`.${cls}:${pseudo} {\n${body}\n}`);
          }
        }
        for (const [suffix, list] of Object.entries(g.pseudoEl)) {
          if (list.length > 0) {
            const body = mergeDecls(list).map(x => `  ${x.prop}: ${x.value};`).join('\n');
            blocks.push(`.${cls}${suffix} {\n${body}\n}`);
          }
        }
        if (blocks.length !== 0) {
          if (g.media) output.push(`@media ${g.media} {\n${blocks.join('\n\n')}\n}`);
          else output.push(...blocks);
        }
      }
    }

    for (const pr of pseudoRules) {
      if (pr.bound) continue;
      const body = pr.declarations.map(s => `  ${s.prop}: ${s.value}${s.important ? ' !important' : ''};`).join('\n');
      const ruleText = `${pr.raw} {\n${body}\n}`;
      staticCss.push(pr.media ? `@media ${pr.media} {\n${ruleText}\n}` : ruleText);
    }

    if (output.length === 0 && staticCss.length === 0) return null;
    if (staticCss.length > 0) output.push(...staticCss);
    return { scopedHtml: root.outerHTML, scopedCSS: output.join('\n\n') };
  }

  function semanticRename(scopedHtml, scopedCSS) {
    if (!scopedHtml || !scopedCSS) return null;
    let parsed;
    try { parsed = new DOMParser().parseFromString(scopedHtml, 'text/html'); } catch (_) { return null; }
    const root = parsed.body.firstElementChild;
    if (!root) return null;
    const all = [root, ...root.querySelectorAll('*')];
    const used = new Set();
    const map = {};

    for (const node of all) {
      const classes = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean);
      const scoped = classes.find(c => /^c-\d+$/.test(c));
      if (scoped) {
        const base = semanticName(node, classes, node === root);
        let name = base;
        let n = 2;
        while (used.has(name)) name = `${base}-${n++}`;
        used.add(name);
        map[scoped] = name;
        node.setAttribute('class', name);
      } else if (classes.length > 0) {
        node.removeAttribute('class');
      }
      for (const attr of Array.from(node.attributes || [])) {
        if (/^data-v-/.test(attr.name) || /^data-astro-cid/.test(attr.name)) node.removeAttribute(attr.name);
      }
    }

    const css = scopedCSS.replace(/\.c-(\d+)(?!\d)/g, (match, num) => {
      const name = map['c-' + num];
      return name ? '.' + name : match;
    });
    return { html: root.outerHTML, css };
  }

  async function semanticHtmlCss(element, cleanHtml, cssText) {
    if (!element || !cleanHtml) return null;
    try {
      const scoped = semanticScopedCss(cleanHtml, cssText, element);
      if (!scoped || !scoped.scopedHtml || !scoped.scopedCSS) return null;
      const renamed = semanticRename(scoped.scopedHtml, scoped.scopedCSS);
      if (renamed && renamed.html) {
        const formattedHtml = await formatCode(renamed.html, 'html');
        const formattedCss = await formatCode(renamed.css, 'css');
        return { html: formattedHtml, css: formattedCss };
      }
    } catch (err) {
      console.warn('[UI Copier] semantic HTML+CSS export failed:', err);
    }
    return null;
  }

  // ── Standalone Preview Document Builder (Miro Fn / In) ───────────────────

  function buildPreviewDocument(html, css, externalUrls = [], isTailwind = false) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Element</title>${isTailwind ? `
  <script src="https://cdn.tailwindcss.com"><\/script>` : ''}
  <style>
/* Reset - ensures exported elements render as intended */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Remove default link underlines - exported styles will override if needed */
a {
  text-decoration: none;
  color: inherit;
}

/* SVG defaults - ensure fills/strokes are inherited unless specified */
svg {
  fill: currentColor;
}

body {
  margin: 0;
  padding: 24px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

${css || ''}
  </style>
</head>
<body>
  ${html || ''}
</body>
</html>`;
  }

  // ── Miro dn(): detect Tailwind CSS ───────────────────────────────────────

  function detectTailwind() {
    if (typeof document === 'undefined') return false;
    try {
      if (document.querySelectorAll('script[src*="tailwindcss"], script[src*="cdn.tailwindcss"]').length > 0) return true;
      for (const sheet of Array.from(document.styleSheets || [])) {
        if (sheet.href && /tailwind/i.test(sheet.href)) return true;
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of Array.from(rules)) {
            if (rule.type === CSSRule.SUPPORTS_RULE ||
                rule.cssText?.includes?.('@layer utilities') ||
                (rule.selectorText && /^\.(flex|grid|hidden|block|inline-flex|relative|absolute|sticky)\s*$/.test(rule.selectorText))) {
              return true;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
    return false;
  }

  // ── Miro Computed Style Snapshot (getComputedStyleSnapshot) ──────────────

  function getComputedStyleSnapshot(element) {
    if (!element || element.nodeType !== 1) return { error: 'No element selected' };
    try {
      const clone = element.cloneNode(true);
      clone.querySelectorAll('#sd-toolbar, .uicc-selection-overlay, #uicc-toast').forEach(node => node.remove());
      clone.querySelectorAll('script, noscript, link[rel="preload"][as="script"]').forEach(node => node.remove());
      [clone, ...clone.querySelectorAll('*')].forEach(n => {
        if (n.classList) {
          n.classList.remove(
            'uicc-inspector-selected', 'uicc-inspector-outline', 'uicc-selection-overlay',
            'uicc-selection-active', 'uicc-highlight', 'uicc-element-editing', 'asset-inspector-editing'
          );
        }
      });

      const originals = [element, ...element.querySelectorAll('*')];
      const clones = [clone, ...clone.querySelectorAll('*')];
      const props = [
        'display', 'box-sizing', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
        'align-items', 'align-self', 'justify-content', 'gap', 'row-gap', 'column-gap',
        'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
        'overflow', 'overflow-x', 'overflow-y',
        'color', 'background', 'background-color', 'background-image', 'background-size',
        'background-position', 'background-repeat', 'background-clip', '-webkit-background-clip', '-webkit-text-fill-color',
        'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
        'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
        'white-space', 'word-break', 'text-overflow',
        'border', 'border-width', 'border-style', 'border-color', 'border-radius',
        'border-top-left-radius', 'border-top-right-radius',
        'border-bottom-left-radius', 'border-bottom-right-radius',
        'box-shadow', 'opacity', 'transform', 'transition', 'cursor', 'pointer-events',
        'visibility', 'object-fit', 'object-position', 'aspect-ratio', 'isolation',
        'mix-blend-mode', 'filter', 'backdrop-filter', 'outline', 'outline-offset',
        'text-indent', 'vertical-align', 'list-style-type', 'table-layout',
        'border-collapse', 'border-spacing', 'fill', 'stroke', 'stroke-width'
      ];
      const defaults = {
        position: 'static', top: 'auto', right: 'auto', bottom: 'auto', left: 'auto',
        'z-index': 'auto', 'min-width': '0px', 'min-height': '0px', 'max-width': 'none',
        'max-height': 'none', 'flex-grow': '0', 'flex-shrink': '1', 'flex-basis': 'auto',
        overflow: 'visible', 'overflow-x': 'visible', 'overflow-y': 'visible',
        transform: 'none', filter: 'none', 'backdrop-filter': 'none', opacity: '1',
        visibility: 'visible', cursor: 'auto', 'pointer-events': 'auto', isolation: 'auto',
        'mix-blend-mode': 'normal', 'box-shadow': 'none', 'text-transform': 'none',
        'text-decoration': 'none', 'text-indent': '0px', outline: '', 'outline-offset': '0px',
        'object-fit': 'fill', 'aspect-ratio': 'auto', 'white-space': 'normal',
        'word-break': 'normal', 'text-overflow': 'clip', 'border-collapse': 'separate',
        'table-layout': 'auto', fill: '', stroke: 'none', 'stroke-width': '1'
      };

      for (let s = 0; s < originals.length && s < clones.length; s++) {
        if (typeof window === 'undefined') break;
        const computed = window.getComputedStyle(originals[s]);
        const baked = [];
        for (const prop of props) {
          const value = computed.getPropertyValue(prop);
          if (!value || value === '' || value === defaults[prop]) continue;
          if (prop === 'outline' && value.includes('49, 93, 76')) continue;
          if (prop === 'outline-offset' && computed.getPropertyValue('outline').includes('49, 93, 76')) continue;
          baked.push(`${prop}:${value}`);
        }
        if (baked.length > 0) {
          const existing = clones[s].getAttribute('style') || '';
          clones[s].setAttribute('style', existing + (existing ? ';' : '') + baked.join(';'));
        }
      }

      const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost';
      clones.forEach(node => {
        if (node.tagName === 'IMG' && node.getAttribute('src')) {
          const src = node.getAttribute('src');
          if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
            try { node.setAttribute('src', new URL(src, base).href); } catch (_) {}
          }
        }
      });

      return { html: clone.outerHTML, css: '' };
    } catch (err) {
      return { error: err.message || 'Snapshot failed' };
    }
  }

  // ── Multi-Format Exporters (Miro Vue / React / JSX Formatters) ───────────

  function formatReactJsx(html, fallbackCSS = '') {
    let jsx = html || '';
    jsx = jsx.replace(/\bclass="/g, 'className="');
    jsx = jsx.replace(/\bfor="/g, 'htmlFor="');
    jsx = jsx.replace(/\btabindex="/g, 'tabIndex="');
    jsx = jsx.replace(/\bcolspan="/g, 'colSpan="');
    jsx = jsx.replace(/\browspan="/g, 'rowSpan="');
    jsx = jsx.replace(/\bmaxlength="/g, 'maxLength="');
    jsx = jsx.replace(/\bminlength="/g, 'minLength="');
    jsx = jsx.replace(/\breadonly\b/g, 'readOnly');
    jsx = jsx.replace(/\bautocomplete="/g, 'autoComplete="');
    jsx = jsx.replace(/<(img|input|br|hr|area|base|col|embed|link|meta|param|source|track|wbr)([^>]*?)(?<!\/)>/gi, '<$1$2 />');
    jsx = jsx.replace(/\bstyle="([^"]*)"/g, (r, n) => {
      const props = n.split(';').filter(l => l.trim()).map(l => {
        const [c, ...f] = l.split(':');
        if (!c || f.length === 0) return null;
        const prop = c.trim().replace(/-([a-z])/g, (_, a) => a.toUpperCase());
        const val = f.join(':').trim();
        return `${prop}: "${val}"`;
      }).filter(Boolean);
      return `style={{ ${props.join(', ')} }}`;
    });

    const indent = '    ';
    let code = `export default function ExtractedComponent() {\n`;
    code += `  return (\n`;
    code += indent + jsx.split('\n').join('\n' + indent) + `\n`;
    code += `  );\n`;
    code += `}`;
    if (fallbackCSS && fallbackCSS.trim()) {
      code += `\n\n/* Fallback CSS — add to your stylesheet */\n/*\n${fallbackCSS.trim()}\n*/`;
    }
    return code;
  }

  function formatVueSfc(html, fallbackCSS = '') {
    let code = `<template>\n`;
    code += '  ' + (html || '').split('\n').join('\n  ');
    code += `\n</template>`;
    if (fallbackCSS && fallbackCSS.trim()) {
      code += `\n\n<style scoped>\n${fallbackCSS.trim()}\n</style>`;
    }
    return code;
  }

  // ── Miro Xe() Main Extraction Engine Orchestrator ─────────────────────────

  async function extractComponent(element, options = {}) {
    if (!element || element.nodeType !== 1) {
      return { error: 'Select a valid page element first.' };
    }

    try {
      const hasTailwind = detectTailwind();
      const cleanHtml = await cleanCloneHtml(element, options.baseUrl);
      const scoped = await scopedCss(element, cleanHtml, options);
      const formattedCss = await formatCode(scoped.cssText, 'css', options.runtime);
      const formattedHtml = await formatCode(cleanHtml, 'html', options.runtime);

      const stats = {
        elementCount: 1 + element.querySelectorAll('*').length,
        cssRuleCount: scoped.ruleCount || 0,
        hasAnimations: scoped.hasAnimations || false,
        hasSvgs: element.querySelector('svg') !== null,
        hasImages: element.querySelector('img') !== null,
        hasExternalFonts: (scoped.fontUrls || []).length > 0,
        externalStylesheets: (scoped.externalUrls || []).length,
        hasPseudoElements: scoped.hasPseudoElements || false,
        truncated: false
      };

      const preview = buildPreviewDocument(formattedHtml, formattedCss, scoped.externalUrls, hasTailwind);

      let tailwindHtml = null;
      let tailwindFallbackCSS = '';
      let vueSfc = null;
      let reactJsx = null;
      let cleanHtmlOut = null;
      let cleanCssOut = null;
      let semanticScoped = null;

      // Generate semantic scoped CSS and clean class names (.card, .title, .btn, etc.)
      try {
        semanticScoped = semanticScopedCss(cleanHtml, scoped.cssText, element);
      } catch (err) {
        console.warn('[UI Copier] Scoped CSS generation failed:', err);
      }

      try {
        if (semanticScoped) {
          const renamed = semanticRename(semanticScoped.scopedHtml, semanticScoped.scopedCSS);
          if (renamed && renamed.html && renamed.css) {
            cleanHtmlOut = await formatCode(renamed.html, 'html', options.runtime);
            cleanCssOut = await formatCode(renamed.css, 'css', options.runtime);
          }
        }
      } catch (err) {
        console.warn('[UI Copier] Semantic export failed:', err);
      }

      // Convert to Tailwind / Vue / React
      const globalAr = (typeof globalThis !== 'undefined' && globalThis.Ar) || global.Ar || null;
      if (hasTailwind) {
        try {
          tailwindHtml = cleanHtmlOut || formattedHtml;
          vueSfc = formatVueSfc(tailwindHtml, '');
          reactJsx = formatReactJsx(tailwindHtml, '');
        } catch (err) {
          console.warn('[UI Copier] Tailwind format generation failed:', err);
          tailwindHtml = cleanHtmlOut || formattedHtml;
        }
      } else {
        try {
          if (semanticScoped && typeof globalAr === 'function') {
            const converted = globalAr(semanticScoped.scopedHtml, semanticScoped.scopedCSS);
            tailwindHtml = converted.tailwindHtml;
            tailwindFallbackCSS = converted.fallbackCSS || '';
            vueSfc = formatVueSfc(converted.tailwindHtml, converted.fallbackCSS);
            reactJsx = formatReactJsx(converted.tailwindHtml, converted.fallbackCSS);
          } else if (cleanHtmlOut && cleanCssOut) {
            vueSfc = formatVueSfc(cleanHtmlOut, cleanCssOut);
            reactJsx = formatReactJsx(cleanHtmlOut, cleanCssOut);
          } else {
            vueSfc = formatVueSfc(formattedHtml, formattedCss);
            reactJsx = formatReactJsx(formattedHtml, formattedCss);
          }
        } catch (err) {
          console.warn('[UI Copier] Tailwind conversion failed:', err);
        }
      }

      // Combined code for clipboard copying
      const combined = cleanHtmlOut && cleanCssOut
        ? `<!-- HTML -->\n${cleanHtmlOut}\n\n<style>\n${cleanCssOut}\n</style>`
        : `<!-- HTML -->\n${formattedHtml}\n\n<style>\n${formattedCss}\n</style>`;

      return {
        html: formattedHtml,
        css: formattedCss,
        preview,
        stats,
        hasTailwind,
        tailwindHtml,
        tailwindFallbackCSS,
        vueSfc,
        reactJsx,
        cleanHtml: cleanHtmlOut,
        cleanCss: cleanCssOut,
        combined,
        clone: element.cloneNode(true)
      };
    } catch (err) {
      console.error('[UI Copier] Component extraction failed:', err);
      return { error: err.message || 'Extraction failed' };
    }
  }

  // ── Object-Oriented Extractor Class (Backwards Compatibility) ────────────

  class Extractor {
    constructor(options = {}) {
      this.baseUrl = options.baseUrl || (typeof window !== 'undefined' ? window.location.href : '');
      this.runtime = options.runtime || (typeof chrome !== 'undefined' ? chrome.runtime : null);
    }

    async extract(element, options = {}) {
      return extractComponent(element, { baseUrl: this.baseUrl, runtime: this.runtime, ...options });
    }

    async toTailwind(element, extraction = null) {
      const result = extraction || await this.extract(element);
      if (result.tailwindHtml) {
        return result.tailwindFallbackCSS
          ? `${result.tailwindHtml}\n\n<style>\n${result.tailwindFallbackCSS.trim()}\n</style>`
          : result.tailwindHtml;
      }
      return result.combined;
    }

    async toVue(element, extraction = null) {
      const result = extraction || await this.extract(element);
      if (result.vueSfc) return result.vueSfc;
      const html = result.cleanHtml || result.html;
      const css = result.cleanCss || result.css;
      return formatVueSfc(html, css);
    }

    async toReact(element, extraction = null) {
      const result = extraction || await this.extract(element);
      if (result.reactJsx) return result.reactJsx;
      const html = result.cleanHtml || result.html;
      const css = result.cleanCss || result.css;
      return formatReactJsx(html, css);
    }

    getComputedStyleSnapshot(element) {
      return getComputedStyleSnapshot(element);
    }

    async cloneAndSanitize(element) {
      const cleanHtml = await cleanCloneHtml(element, this.baseUrl);
      let parsed;
      try { parsed = new DOMParser().parseFromString(cleanHtml, 'text/html'); } catch (_) {}
      const clone = parsed?.body?.firstElementChild || element.cloneNode(true);
      const originalNodes = [element, ...element.querySelectorAll('*')];
      const cloneNodes = [clone, ...clone.querySelectorAll('*')];
      return { clone, originalNodes, cloneNodes };
    }

    async collectAllCss(force = false) {
      return collectPageCss(this.runtime);
    }

    async scopeAuthoredCss(element, originalNodes, options = {}) {
      const cleanHtml = await cleanCloneHtml(element, this.baseUrl);
      const scoped = await scopedCss(element, cleanHtml, { runtime: this.runtime, ...options });
      return scoped.cssText || '';
    }
  }

  // ── Standalone Helpers for Tests & Callers ─────────────────────────────────

  function formatElement(element, depth = 0) {
    if (!element) return '';
    return element.outerHTML || '';
  }

  function formatReactElement(element, depth = 0) {
    if (!element) return '';
    return formatReactJsx(element.outerHTML || '');
  }

  function isFixedMedia(node) {
    if (!node) return false;
    const tag = String(node.tagName || '').toUpperCase();
    return ['IMG', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME'].includes(tag);
  }

  function extractAnimationNames(value) {
    if (!value || typeof value !== 'string') return [];
    return value.split(',').map(part => part.trim().split(/\s+/)[0]).filter(Boolean);
  }

  function splitSelectorList(value) {
    return (value || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function splitCompoundSelectors(selector) {
    return splitSelectorChain(selector);
  }

  function stripDynamicPseudo(selector) {
    return stripPseudo(selector);
  }

  const api = {
    Extractor,
    extractComponent,
    getComputedStyleSnapshot,
    cleanCloneHtml,
    scopedCss,
    semanticScopedCss,
    semanticRename,
    semanticHtmlCss,
    buildPreviewDocument,
    detectTailwind,
    formatReactJsx,
    formatVueSfc,
    formatCode,
    absoluteUrl,
    rewriteCssUrls,
    rewriteStyleUrls,
    rewriteSrcset,
    blobToDataUrl,
    svgCleanup,
    splitSelectorChain,
    stripPseudo,
    elementMatches,
    elementContains,
    findMatchElement,
    resolveVarValue,
    resolveVarsAcross,
    buildBodyCss,
    findAncestorBackgroundColor,
    fallbackInheritedCss,
    detectInheritedCss,
    specificityScore,
    mergeDecls,
    isTailwindUtility,
    semanticName,
    formatElement,
    formatReactElement,
    isFixedMedia,
    extractAnimationNames,
    splitSelectorList,
    splitCompoundSelectors,
    stripDynamicPseudo,
    escapeHtml,
    stripBidiControls
  };

  global.UICCExtractor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
