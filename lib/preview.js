// lib/preview.js — Miro-mirrored Preview Feature
// Ports the "Web to Code, Web Inspector, Font Finder & Lottie" extension's
// preview system EXACTLY so the extracted-component preview matches Miro:
//   - Fn: standalone exported preview document builder
//     (full HTML document with reset CSS + optional Tailwind CDN)
//   - Gc: preview iframe loader
//     (contentDocument.write of a minimal-reset document, then auto-scale:
//      150ms delay, zoom clamped to >= 0.3, iframe height clamped 60–300px,
//      "Preview unavailable" fallback on failure)
//   - dn: Tailwind detection (so we know when to use the computed-style
//     snapshot instead of the scoped CSS).
//   - hn: clean element clone (URL/blob rewriting, SVG cleanup, inline-style
//     URL absolutizing, script/noscript removal, comment stripping).
//   - xn: full-page CSS collection + PostCSS scoping to the subtree
//     (media queries, @keyframes, @font-face, CSS var() resolution, @layer
//     flattening, pseudo-element support, inherited typography via the
//     "3-iframe" diff, page body defaults).
//   - getComputedStyleSnapshot: bakes every computed style inline into a clone
//     (used for Tailwind pages, exactly like Miro).
//   - buildPreviewForElement: orchestrates the Miro Gc() flow — clean clone +
//     scoped CSS, snapshot swapped in when the page uses Tailwind.
// Exposed globally as UICCPreview so content.js can delegate to it.

(function (global) {
  'use strict';

  // ── Miro Fn(): build the full standalone preview/export document ────────────
  function buildPreviewDocument(html, css, externalUrls, isTailwind) {
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

/* Beta Banner */
.miro-hidden {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #f59e0b, #f97316);
  color: white;
  text-align: center;
  padding: 8px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: 500;
  z-index: 999999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.miro-hidden a {
  color: white;
  text-decoration: underline;
  margin-left: 8px;
}
body {
  padding-top: 40px;
}

${css}
  </style>
</head>
<body>
  <div style="display:none">
    Export to Code is in Beta - some elements may not render perfectly
  </div>
  ${html}
</body>
</html>`;
  }

  // ── Miro Gc(): the preview iframe document template (minimal reset) ─────────
  function buildIframePreviewDocument(html, css) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    a { text-decoration: inherit; color: inherit; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      width: fit-content;
      min-width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    body {
      padding: 8px;
    }
    body > * {
      flex-shrink: 0;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  // ── Miro Gc(): write preview into iframe + auto-scale (150ms, zoom clamp) ──
  function writePreviewToIframe(iframe, html, css) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(buildIframePreviewDocument(html, css));
      doc.close();

      // Miro's exact auto-sizing: 150ms delay, zoom clamp >= 0.3,
      // iframe height clamped between 60px and 300px.
      setTimeout(() => {
        try {
          const body = doc.body;
          const firstChild = body.firstElementChild;
          if (firstChild) {
            const rect = firstChild.getBoundingClientRect();
            const containerW = iframe.parentElement?.clientWidth || iframe.clientWidth || 300;
            const contentW = rect.width + 16; // 8px padding on each side
            if (contentW > containerW && contentW > 0) {
              const zoom = Math.max(containerW / contentW, 0.3);
              body.style.zoom = zoom;
              const scaledHeight = rect.height * zoom + 20;
              iframe.style.height = Math.min(Math.max(scaledHeight, 60), 300) + 'px';
            } else {
              iframe.style.height = Math.min(Math.max(rect.height + 20, 60), 300) + 'px';
            }
          }
        } catch (_) { /* silent - sizing is best-effort */ }
      }, 150);
    } catch (err) {
      console.error('[UI Copier] preview load failed:', err);
      showPreviewUnavailable(iframe);
    }
  }

  // ── Miro Gc() catch: "Preview unavailable" fallback ─────────────────────────
  function showPreviewUnavailable(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write('<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#9ca3af;font-size:12px;">Preview unavailable</body></html>');
      doc.close();
    } catch (_) { /* noop */ }
  }

  // ── Miro dn(): detect whether the page uses Tailwind ────────────────────────
  function detectTailwind() {
    try {
      if (document.querySelectorAll('script[src*="tailwindcss"], script[src*="cdn.tailwindcss"]').length > 0) return true;
      for (const sheet of document.styleSheets) {
        if (sheet.href && /tailwind/i.test(sheet.href)) return true;
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
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

  // ── Miro _t(): convert a blob: URL to a data: URL ──────────────────────────
  async function blobToDataUrl(url) {
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

  // ── Miro kn(): absolutize url() references inside scoped CSS ───────────────
  function rewriteCssUrls(css) {
    if (!css || typeof css !== 'string') return css;
    return css.replace(/url\(["']?([^"')]+)["']?\)/g, (match, url) => {
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') ||
          url.startsWith('https://') || url.startsWith('chrome-extension://')) return match;
      try { return `url("${new URL(url, window.location.href).href}")`; }
      catch (_) { return match; }
    });
  }

  // ── Miro En(): absolutize url() references inside an inline style attr ─────
  function rewriteStyleUrls(style, baseUrl) {
    if (!style || typeof style !== 'string') return style;
    return style.replace(/url\(["']?([^"')]+)["']?\)/g, (match, url) => {
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') ||
          url.startsWith('https://')) return match;
      try { return `url("${new URL(url, baseUrl).href}")`; }
      catch (_) { return match; }
    });
  }

  // ── Miro Sn(): prune redundant SVG presentation attributes from a clone ────
  function svgCleanup(node) {
    const isSvgRoot = node.tagName === 'svg' || node.tagName === 'SVG';
    const redundant = {
      'fill-opacity': '1', 'stroke-opacity': '1', opacity: '1', 'stroke-width': '1px',
      'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-dashoffset': '0px',
      'stroke-dasharray': 'none', 'text-anchor': 'start', 'dominant-baseline': 'auto',
      'stop-color': '#000000', 'stop-opacity': '1', 'font-weight': '400', 'font-size': '16px'
    };
    const inheritable = ['font-family', 'font-size', 'font-weight', 'font-style',
      'text-anchor', 'dominant-baseline', 'stop-color', 'stop-opacity'];
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
    }
    if (isSvgRoot) {
      if (node.getAttribute('fill') === 'null') node.removeAttribute('fill');
      if (node.getAttribute('stroke') === 'null') node.removeAttribute('stroke');
      for (const [prop, value] of Object.entries(redundant)) {
        if (node.getAttribute(prop) === value) node.removeAttribute(prop);
      }
    }
  }

  // ── Miro hn(): build a clean, self-contained clone of the element ──────────
  async function cleanCloneHtml(element) {
    const originals = [element, ...element.querySelectorAll('*')];
    const clone = element.cloneNode(true);
    clone.classList.add('exported-root');
    const clones = [clone, ...clone.querySelectorAll('*')];
    const origin = window.location.origin;
    const blobTasks = [];

    for (let m = 0; m < clones.length; m++) {
      const node = clones[m];
      if (!node) continue;
      if (node.tagName === 'IMG') {
        const currentSrc = originals[m]?.currentSrc;
        const src = node.getAttribute('src');
        if (currentSrc && currentSrc.startsWith('blob:')) blobTasks.push({ element: node, attr: 'src', url: currentSrc });
        else if (currentSrc && currentSrc.startsWith('http')) node.setAttribute('src', currentSrc);
        else if (src && src.startsWith('blob:')) blobTasks.push({ element: node, attr: 'src', url: src });
        else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          try { node.setAttribute('src', new URL(src, window.location.href).href); } catch (_) {}
        }
      }
      if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
        const src = node.getAttribute('src');
        if (src && src.startsWith('blob:')) blobTasks.push({ element: node, attr: 'src', url: src });
        else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          try { node.setAttribute('src', new URL(src, window.location.href).href); } catch (_) {}
        }
        if (node.hasAttribute('poster')) {
          const poster = node.getAttribute('poster');
          if (poster && !poster.startsWith('http') && !poster.startsWith('data:') && !poster.startsWith('blob:')) {
            try { node.setAttribute('poster', new URL(poster, window.location.href).href); } catch (_) {}
          }
        }
      }
      if (node.tagName === 'SOURCE' && node.hasAttribute('src')) {
        const src = node.getAttribute('src');
        if (src && src.startsWith('blob:')) blobTasks.push({ element: node, attr: 'src', url: src });
        else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          try { node.setAttribute('src', new URL(src, window.location.href).href); } catch (_) {}
        }
      }
      if (node.hasAttribute('srcset')) {
        const srcset = node.getAttribute('srcset').split(',').map(item => {
          const parts = item.trim().split(/\s+/);
          if (parts[0] && !parts[0].startsWith('http') && !parts[0].startsWith('data:') && !parts[0].startsWith('blob:')) {
            try { parts[0] = new URL(parts[0], origin).href; } catch (_) {}
          }
          return parts.join(' ');
        }).join(', ');
        node.setAttribute('srcset', srcset);
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
        if (attr.name.startsWith('on')) node.removeAttribute(attr.name);
        if (['href', 'src', 'action', 'formaction', 'data', 'xlink:href'].includes(attr.name) &&
            attr.value.trim().toLowerCase().startsWith('javascript:')) node.removeAttribute(attr.name);
      }
    }

    if (blobTasks.length > 0) {
      await Promise.all(blobTasks.map(async ({ element: el, attr, url }) => {
        try { const dataUrl = await blobToDataUrl(url); if (dataUrl) el.setAttribute(attr, dataUrl); }
        catch (err) { console.warn('[UI Copier] Failed to convert blob URL:', url, err); }
      }));
    }

    clone.querySelectorAll('script, noscript').forEach(node => node.remove());
    let html = clone.outerHTML;
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/\s*export-element-highlight/g, '');
    html = html.replace(/\s*asset-inspector-outline/g, '');
    html = html.replace(/\s*asset-inspector-highlight/g, '');
    html = html.replace(/\s*uicc-inspector-outline/g, '');
    html = html.replace(/\s*uicc-selection-overlay/g, '');
    return html;
  }

  // ── Miro mn(): collect all CSS used by the page (inline + external) ────────
  async function collectPageCss() {
    const inline = [];
    const externalUrls = [];
    for (const sheet of document.styleSheets) {
      if (sheet.href && (sheet.href.startsWith('chrome-extension://') || sheet.href.startsWith('moz-extension://'))) continue;
      if (sheet.ownerNode?.id?.startsWith('asset-inspector-')) continue;
      try {
        if (sheet.href) externalUrls.push(sheet.href);
        else {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) inline.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
        }
      } catch (_) { if (sheet.href) externalUrls.push(sheet.href); }
    }

    let external = '';
    if (externalUrls.length > 0) {
      const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime || null;
      if (runtime && typeof runtime.sendMessage === 'function') {
        try {
          const response = await new Promise(resolve => {
            runtime.sendMessage({ action: 'fetchExternalStylesheets', urls: externalUrls }, result => {
              if (globalThis.chrome?.runtime?.lastError) resolve(null);
              else resolve(result || null);
            });
          });
          if (response && response.success) {
            for (const url of externalUrls) {
              if (response.results?.[url]?.success) external += response.results[url].css + '\n';
            }
          }
        } catch (_) {}
      }
    }
    return [...inline, external].filter(Boolean).join('\n');
  }

  // ── Miro gn(): split a selector chain into its compound selector parts ─────
  function splitSelectorChain(selector) {
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < selector.length; i++) {
      const c = selector[i];
      if (c === '[' || c === '(') { depth++; current += c; continue; }
      if (c === ']' || c === ')') { depth--; current += c; continue; }
      if (depth > 0) { current += c; continue; }
      if (c === '>' || c === '~' || c === '+') { if (current.trim()) parts.push(current.trim()); current = ''; continue; }
      if (c === ' ' || c === '\t' || c === '\n') { if (current.trim()) { parts.push(current.trim()); current = ''; } continue; }
      current += c;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  // ── Miro Ke(): strip pseudo-classes/pseudo-elements from a selector ────────
  function stripPseudo(selector) {
    if (!selector) return '';
    try { return selector.replace(/::[\w-]+(\([^)]*\))?/g, '').replace(/:[\w-]+(\([^)]*\))?/g, '').trim(); }
    catch (_) { return selector; }
  }

  // ── Miro $e / Dt: does the element (or a descendant) match a selector? ─────
  function elementMatches(element, selector) {
    if (!element || !selector || !selector.trim()) return false;
    try { return element.matches(selector); } catch (_) { return false; }
  }

  function elementContains(element, selector) {
    if (!element || !selector || !selector.trim()) return false;
    try { return element.querySelector(selector) !== null; } catch (_) { return false; }
  }

  // ── Miro bn(): best matching node in the subtree for a given selector ──────
  function findMatchElement(element, selector) {
    const stripped = stripPseudo(selector);
    if (elementMatches(element, selector) || elementMatches(element, stripped)) return element;
    try {
      const nodes = element.querySelectorAll(stripped || selector);
      if (nodes.length > 0) return nodes[nodes.length - 1];
    } catch (_) {}
    return null;
  }

  // ── Miro Oe(): is this rule nested inside a @keyframes block? ──────────────
  function insideKeyframes(rule) {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && (parent.name === 'keyframes' || parent.name === '-webkit-keyframes')) return true;
      parent = parent.parent;
    }
    return false;
  }

  // ── Miro yn(): resolve var() references against a computed style ───────────
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

  // ── Miro Cn(): page body defaults (color, font, ancestor background) ───────
  function buildBodyCss(element) {
    const parts = [];
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      const color = bodyStyle.getPropertyValue('color');
      if (color) parts.push(`\tcolor: ${color};`);
      const fontFamily = bodyStyle.getPropertyValue('font-family');
      if (fontFamily) parts.push(`\tfont-family: ${fontFamily};`);
      if (element) {
        const bg = findAncestorBackgroundColor(element);
        if (bg) parts.push(`\tbackground-color: ${bg};`);
      }
    } catch (_) {}
    return parts.length > 0 ? `body {\n${parts.join('\n')}\n}` : null;
  }

  // ── Miro vn(): nearest non-white ancestor background color ─────────────────
  function findAncestorBackgroundColor(element) {
    let node = element;
    while (node && node !== document.documentElement) {
      try {
        const bg = window.getComputedStyle(node).getPropertyValue('background-color');
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)') { node = node.parentElement; continue; }
          return bg;
        }
      } catch (_) {}
      node = node.parentElement;
    }
    try {
      for (const candidate of [document.body, document.documentElement]) {
        const bg = window.getComputedStyle(candidate).getPropertyValue('background-color');
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' &&
            bg !== 'rgb(255, 255, 255)' && bg !== 'rgba(255, 255, 255, 1)') return bg;
      }
    } catch (_) {}
    return null;
  }

  // ── Miro $t(): fallback inherited typography for the exported root ────────
  function fallbackInheritedCss(element) {
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

  // ── Miro wn(): the "3-iframe" inherited typography diff ────────────────────
  async function detectInheritedCss(element, cleanHtml, scopedCssText) {
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
    probeFrame.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1024px;height:768px;opacity:0;pointer-events:none;';
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

  // ── Miro xn(): scope the page's full CSS to the selected subtree ───────────
  async function scopedCss(element, cleanHtml) {
    const postcss = getPostcss();
    const externalUrls = [];
    const fontUrls = [];
    try {
      const allCss = await collectPageCss();
      if (!allCss || allCss.trim().length === 0) {
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

      // Keep selectors that match the element or anything inside it.
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

      // Rewrite descendant selectors so they resolve within the exported root.
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
        } catch (err) { /* non-fatal */ }
      }

      // Only keep the @keyframes the subtree actually uses.
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

      // Resolve var() references against computed styles so the preview
      // keeps its colors even when the CSS custom-property definition was
      // scoped out.
      root.walkRules(rule => {
        if (insideKeyframes(rule)) return;
        rule.walkDecls(decl => {
          if (decl.value && decl.value.includes('var(')) {
            const matchEl = findMatchElement(element, rule.selector);
            if (matchEl) {
              try { decl.value = resolveVarValue(decl.prop, decl.value, window.getComputedStyle(matchEl)); } catch (_) {}
            }
          }
        });
      });
      root.walkDecls(decl => { if (decl.prop.startsWith('--')) decl.remove(); });
      root.walkComments(comment => comment.remove());
      root.walkAtRules(rule => { if (rule.name === 'media' && rule.params && rule.params.includes('print')) rule.remove(); });

      // Flatten @layer blocks (their inner rules must survive in the preview).
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

      // Keep @font-face rules only for font families actually used in the subtree.
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
      catch (err) { inheritedCss = fallbackInheritedCss(element); }

      let htmlFontSizeCss = '';
      if (/\d+(\.\d+)?rem/.test(cssText)) {
        try {
          const fontSize = window.getComputedStyle(document.documentElement).fontSize;
          if (fontSize && fontSize !== '16px') htmlFontSizeCss = `html { font-size: ${fontSize}; }`;
        } catch (_) {}
      }

      // Convert remaining blob: urls in CSS to data: urls.
      const blobUrls = [...new Set([...cssText.matchAll(/url\(["']?(blob:[^"')]+)["']?\)/g)].map(match => match[1]))];
      if (blobUrls.length > 0) {
        const map = {};
        await Promise.all(blobUrls.map(async url => { try { const dataUrl = await blobToDataUrl(url); if (dataUrl) map[url] = dataUrl; } catch (_) {} }));
        cssText = cssText.replace(/url\(["']?(blob:[^"')]+)["']?\)/g, (match, url) => map[url] ? `url("${map[url]}")` : match);
      }

      return {
        cssText: [htmlFontSizeCss, inheritedCss, bodyCss, cssText].filter(Boolean).join('\n\n'),
        ruleCount, hasAnimations, hasPseudoElements, externalUrls, fontUrls
      };
    } catch (err) {
      console.warn('[UI Copier] scoped CSS extraction failed:', err);
      return { cssText: '', ruleCount: 0, hasAnimations: false, hasPseudoElements: false, externalUrls, fontUrls };
    }
  }

  // ── Miro getComputedStyleSnapshot (exact): bake computed styles inline ─────
  function getComputedStyleSnapshot(element) {
    if (!element || element.nodeType !== 1) return { error: 'No element selected' };
    try {
      const clone = element.cloneNode(true);
      const originals = [element, ...element.querySelectorAll('*')];
      const clones = [clone, ...clone.querySelectorAll('*')];
      const props = [
        'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
        'align-items', 'align-self', 'justify-content', 'gap', 'row-gap', 'column-gap',
        'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
        'overflow', 'overflow-x', 'overflow-y',
        'color', 'background', 'background-color', 'background-image', 'background-size',
        'background-position', 'background-repeat',
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
        const computed = window.getComputedStyle(originals[s]);
        const baked = [];
        for (const prop of props) {
          const value = computed.getPropertyValue(prop);
          if (!value || value === '' || value === defaults[prop]) continue;
          if (prop === 'outline' && value.includes('99, 102, 241')) continue;
          baked.push(`${prop}:${value}`);
        }
        if (baked.length > 0) {
          const existing = clones[s].getAttribute('style') || '';
          clones[s].setAttribute('style', existing + (existing ? ';' : '') + baked.join(';'));
        }
      }

      clones.forEach(node => {
        if (node.tagName === 'IMG' && node.getAttribute('src')) {
          const src = node.getAttribute('src');
          if (!src.startsWith('http') && !src.startsWith('data:')) {
            try { node.setAttribute('src', new URL(src, window.location.href).href); } catch (_) {}
          }
        }
      });

      return { html: clone.outerHTML, css: '' };
    } catch (err) {
      return { error: err.message || 'Snapshot failed' };
    }
  }

  // ── Miro _t(): resolve var() against an array of computed styles ──────────
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

  // ── Miro Bt(): rough CSS specificity score ─────────────────────────────────
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

  // ── Miro Ke(): merge duplicate declarations, keeping higher specificity ────
  function mergeDecls(list) {
    const map = new Map();
    for (const item of list) {
      const existing = map.get(item.prop);
      if (!existing) { map.set(item.prop, item); continue; }
      const itemImp = item.important ? 1 : 0;
      const existImp = existing.important ? 1 : 0;
      if (itemImp > existImp || (itemImp === existImp && (item.spec || 0) >= (existing.spec || 0))) map.set(item.prop, item);
    }
    return Array.from(map.values()).map(({ prop, value }) => ({ prop, value }));
  }

  // ── Miro Dt(): media query context joined from ancestor at-rules ───────────
  function mediaContext(rule) {
    const parts = [];
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media' && parent.params) parts.unshift(parent.params);
      parent = parent.parent;
    }
    return parts.length > 0 ? parts.join(' and ') : null;
  }

  // ── Miro xn()/An(): tailwind utility class detection ──────────────────────
  const TAILWIND_UTILITY_RE = new RegExp('^(?:-?(?:m|p)(?:t|r|b|l|x|y|s|e)?-|w-|h-|size-|min-w|min-h|max-w|max-h|gap-|space-|inset|top-|right-|bottom-|left-|z-|order-|col-|row-|grid$|grid-|auto-|basis-|grow$|shrink$|flex$|flex-|inline$|inline-|block$|hidden$|table$|table-|contents$|list-|items-|justify-|content-|self-|place-|text-|font-|leading-|tracking-|whitespace-|break-|hyphens-|align-|indent-|truncate$|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|underline$|overline$|line-through$|no-underline$|decoration-|underline-offset-|antialiased$|bg-|from-|via-|to-|rounded|border|divide-|outline|ring|shadow|opacity-|mix-blend-|blur|brightness-|contrast-|drop-shadow|grayscale|hue-rotate-|invert|saturate-|sepia|backdrop-|filter$|transition|duration-|ease-|delay-|animate-|transform$|origin-|scale-|rotate-|translate-|skew-|cursor-|select-|resize|appearance-|pointer-events-|touch-|scroll-|snap-|will-change-|accent-|caret-|columns-|object-|overflow-|overscroll-|aspect-|relative$|absolute$|fixed$|sticky$|static$|isolate$|visible$|invisible$|collapse$|sr-only$|not-sr-only$|group$|peer$|container$|fill-|stroke-|iconify$|i-[a-z]+)');
  function isTailwindUtility(cls) { return TAILWIND_UTILITY_RE.test(cls); }

  // ── Miro Ot(): semantic tag→name map ───────────────────────────────────────
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

  // ── Miro Sn(): pick a semantic class name for an element ──────────────────
  function semanticName(element, classes, isRoot) {
    for (const c of classes) {
      if (!(/^c-\d+$/.test(c) || c === 'exported-root') &&
          !(c.length < 3) && /^[a-z][a-z0-9-]*$/.test(c) &&
          !c.includes('__') && !/^svelte-/.test(c) && !isTailwindUtility(c)) return c;
    }
    const tag = element.tagName.toLowerCase();
    if (SEMANTIC_TAG_NAMES[tag]) return SEMANTIC_TAG_NAMES[tag];
    const role = element.getAttribute && element.getAttribute('role');
    return role && /^[a-z-]+$/.test(role) ? role : (isRoot ? 'component' : 'wrapper');
  }

  // ── Miro vn(): rename scoped c-N classes to semantic names ────────────────
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

  // ── Miro wn(): per-element semantic class-based scoping ────────────────────
  function semanticScopedCss(cleanHtml, cssText, element) {
    if (!cleanHtml || !cssText || !getPostcss()) return null;
    const computedList = [];
    try {
      if (element && typeof getComputedStyle === 'function') {
        computedList.push(getComputedStyle(element));
        computedList.push(getComputedStyle(document.documentElement));
      }
    } catch (_) {}

    let parsed;
    try { parsed = new DOMParser().parseFromString(cleanHtml, 'text/html'); } catch (_) { return null; }
    const root = parsed.body.firstElementChild || parsed.body;
    const all = [root, ...root.querySelectorAll('*')];

    let tree;
    try { tree = getPostcss().parse(cssText, { from: undefined }); } catch (_) { return null; }

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
          const body = sel + ' {\n' + decls.map(w => `  ${w.prop}: ${w.value}${w.important ? ' !important' : ''}\n`).join('\n') + '\n}';
          staticCss.push(media ? `@media ${media} {\n\n${body}\n\n}` : body);
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
          const body = mergeDecls(g.base).map(p => `  ${p.prop}: ${p.value}\n`).join('\n');
          blocks.push(`.${cls} {\n\n${body}\n\n}`);
        }
        for (const [pseudo, list] of Object.entries(g.pseudo)) {
          if (list.length > 0) {
            const body = mergeDecls(list).map(x => `  ${x.prop}: ${x.value}\n`).join('\n');
            blocks.push(`.${cls}:${pseudo} {\n\n${body}\n\n}`);
          }
        }
        for (const [suffix, list] of Object.entries(g.pseudoEl)) {
          if (list.length > 0) {
            const body = mergeDecls(list).map(x => `  ${x.prop}: ${x.value}\n`).join('\n');
            blocks.push(`.${cls}${suffix} {\n\n${body}\n\n}`);
          }
        }
        if (blocks.length !== 0) {
          if (g.media) output.push(`@media ${g.media} {\n\n${blocks.join('\n\n')}\n\n}`);
          else output.push(...blocks);
        }
      }
    }

    for (const pr of pseudoRules) {
      if (pr.bound) continue;
      const body = pr.declarations.map(s => `  ${s.prop}: ${s.value}${s.important ? ' !important' : ''}\n`).join('\n');
      const ruleText = `${pr.raw} {\n\n${body}\n\n}`;
      staticCss.push(pr.media ? `@media ${pr.media} {\n\n${ruleText}\n\n}` : ruleText);
    }

    if (output.length === 0 && staticCss.length === 0) return null;
    if (staticCss.length > 0) output.push(...staticCss);
    return { scopedHtml: root.outerHTML, scopedCSS: output.join('\n\n') };
  }

  // ── Miro vn(wn(...)) orchestration: cleanHtml + cleanCss for HTML+CSS copy ─
  async function semanticHtmlCss(element, cleanHtml, cssText) {
    if (!element || !cleanHtml) return null;
    try {
      const scoped = semanticScopedCss(cleanHtml, cssText, element);
      if (!scoped || !scoped.scopedHtml || !scoped.scopedCSS) return null;
      const renamed = semanticRename(scoped.scopedHtml, scoped.scopedCSS);
      if (renamed && renamed.html) return { html: renamed.html, css: renamed.css };
    } catch (err) {
      console.warn('[UI Copier] semantic HTML+CSS export failed:', err);
    }
    return null;
  }

  function getPostcss() {
    return (typeof globalThis !== 'undefined' && globalThis.postcss) || global.postcss || null;
  }

  // ── Miro Gc() orchestration: build accurate preview html + css ─────────────
  async function buildPreviewForElement(element) {
    if (!element || element.nodeType !== 1) return { error: 'No element selected' };
    const hasTailwind = detectTailwind();
    const cleanHtml = await cleanCloneHtml(element);
    let css = '';
    if (getPostcss()) {
      try {
        const result = await scopedCss(element, cleanHtml);
        css = result.cssText || '';
      } catch (err) {
        console.warn('[UI Copier] preview CSS build failed:', err);
        css = '';
      }
    }
    // Tailwind pages: the generated utility classes aren't in the page CSS,
    // so bake every computed style inline instead (exactly like Miro).
    if (hasTailwind) {
      const snapshot = getComputedStyleSnapshot(element);
      if (snapshot && snapshot.html) {
        return { html: snapshot.html, css: snapshot.css || css, hasTailwind: true };
      }
    }
    return { html: cleanHtml, css, hasTailwind };
  }

  const api = {
    buildPreviewDocument,
    buildIframePreviewDocument,
    writePreviewToIframe,
    showPreviewUnavailable,
    detectTailwind,
    cleanCloneHtml,
    collectPageCss,
    getComputedStyleSnapshot,
    scopedCss,
    buildPreviewForElement,
    semanticHtmlCss,
    semanticScopedCss,
    semanticRename
  };
  global.UICCPreview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
