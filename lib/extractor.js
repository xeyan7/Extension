(function (global) {
  'use strict';

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
  // Invisible bidi embedding/override controls can make copied source appear
  // reversed in an editor (and are unsafe in generated code). Keep ordinary
  // Arabic/Hebrew text, but remove only the directional control characters.
  const BIDI_CONTROL_CHARACTERS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

  function stripBidiControls(value) {
    return String(value == null ? '' : value).replace(BIDI_CONTROL_CHARACTERS, '');
  }

  const STYLE_PROPERTIES = [
    'display', 'box-sizing', 'position', 'inset', 'top', 'right', 'bottom', 'left',
    'z-index', 'float', 'clear', 'isolation',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'align-items', 'align-content', 'align-self', 'justify-content', 'justify-items',
    'justify-self', 'order', 'gap', 'row-gap', 'column-gap',
    'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
    'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows', 'grid-column', 'grid-row',
    'overflow', 'overflow-x', 'overflow-y', 'overscroll-behavior',
    'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch',
    'line-height', 'letter-spacing', 'word-spacing', 'font-variant',
    'color', 'text-align', 'text-decoration', 'text-transform', 'text-indent',
    'text-overflow', 'text-shadow', 'white-space', 'word-break', 'overflow-wrap',
    'direction', 'unicode-bidi', 'writing-mode', 'text-orientation',
    'vertical-align', 'list-style', 'list-style-type', 'list-style-position',
    'background', 'background-color', 'background-image', 'background-position',
    'background-size', 'background-repeat', 'background-clip', 'background-origin',
    'border', 'border-width', 'border-style', 'border-color', 'border-radius',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'border-collapse', 'border-spacing', 'outline', 'outline-offset', 'box-shadow',
    'opacity', 'visibility', 'filter', 'backdrop-filter', 'mix-blend-mode',
    'transform', 'transform-origin', 'perspective', 'clip-path',
    'object-fit', 'object-position', 'aspect-ratio',
    'fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'cursor', 'pointer-events', 'resize', 'appearance', 'accent-color',
    'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
    'animation-delay', 'animation-iteration-count', 'animation-direction',
    'animation-fill-mode', 'transition', 'content'
  ];

  const DEFAULT_VALUES = new Map(Object.entries({
    position: 'static', top: 'auto', right: 'auto', bottom: 'auto', left: 'auto',
    'z-index': 'auto', float: 'none', clear: 'none', isolation: 'auto',
    'min-width': '0px', 'min-height': '0px', 'max-width': 'none', 'max-height': 'none',
    'margin-top': '0px', 'margin-right': '0px', 'margin-bottom': '0px', 'margin-left': '0px',
    'padding-top': '0px', 'padding-right': '0px', 'padding-bottom': '0px', 'padding-left': '0px',
    'flex-grow': '0', 'flex-shrink': '1', 'flex-basis': 'auto', order: '0',
    'row-gap': 'normal', 'column-gap': 'normal',
    overflow: 'visible', 'overflow-x': 'visible', 'overflow-y': 'visible',
    'text-decoration': 'none solid rgb(0, 0, 0)', 'text-transform': 'none',
    'text-indent': '0px', 'text-overflow': 'clip', 'text-shadow': 'none',
    'white-space': 'normal', 'word-break': 'normal', 'overflow-wrap': 'normal',
    direction: 'ltr', 'unicode-bidi': 'normal', 'writing-mode': 'horizontal-tb',
    'text-orientation': 'mixed',
    'vertical-align': 'baseline', 'list-style-type': 'disc',
    'background-color': 'rgba(0, 0, 0, 0)', 'background-image': 'none',
    'border-top-width': '0px', 'border-right-width': '0px',
    'border-bottom-width': '0px', 'border-left-width': '0px',
    'border-top-style': 'none', 'border-right-style': 'none',
    'border-bottom-style': 'none', 'border-left-style': 'none',
    'border-radius': '0px', outline: 'none', 'outline-offset': '0px',
    'box-shadow': 'none', opacity: '1', visibility: 'visible', filter: 'none',
    'backdrop-filter': 'none', 'mix-blend-mode': 'normal', transform: 'none',
    'clip-path': 'none', 'object-fit': 'fill', 'object-position': '50% 50%',
    'aspect-ratio': 'auto', stroke: 'none', 'stroke-width': '1px',
    'pointer-events': 'auto', resize: 'none', appearance: 'none',
    animation: 'none 0s ease 0s 1 normal none running', 'animation-name': 'none',
    transition: 'all 0s ease 0s', content: 'normal'
  }));

  const INHERITED_PROPERTIES = new Set([
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'line-height',
    'letter-spacing', 'word-spacing', 'font-variant', 'color', 'text-align',
    'text-decoration', 'text-transform', 'text-indent', 'text-shadow', 'white-space',
    'word-break', 'overflow-wrap', 'direction', 'writing-mode', 'text-orientation',
    'visibility', 'cursor', 'list-style',
    'list-style-type', 'list-style-position', 'fill', 'fill-rule', 'stroke',
    'stroke-linecap', 'stroke-linejoin'
  ]);

  function absoluteUrl(value, baseUrl) {
    if (!value || typeof value !== 'string') return value || '';
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:') || trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:')) return trimmed;
    if (DANGEROUS_PROTOCOL.test(trimmed)) return '';
    try { return new URL(trimmed, baseUrl).href; } catch (_) { return trimmed; }
  }

  function rewriteCssUrls(css, baseUrl) {
    if (!css || !baseUrl) return css || '';
    return String(css).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, raw) => {
      const value = raw.trim();
      if (!value || value.startsWith('#') || value.startsWith('data:') ||
          value.startsWith('blob:') || DANGEROUS_PROTOCOL.test(value)) return match;
      const resolved = absoluteUrl(value, baseUrl);
      return resolved ? `url("${resolved.replace(/"/g, '\\"')}")` : 'url("")';
    });
  }

  function rewriteSrcset(srcset, baseUrl) {
    if (!srcset) return '';
    if (/\bdata:/i.test(srcset)) return String(srcset);
    return String(srcset).split(',').map(candidate => {
      const parts = candidate.trim().split(/\s+/);
      if (!parts[0]) return '';
      parts[0] = absoluteUrl(parts[0], baseUrl);
      return parts.filter(Boolean).join(' ');
    }).filter(Boolean).join(', ');
  }

  function escapeHtml(value) {
    return stripBidiControls(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cssEscape(value) {
    if (global.CSS && typeof global.CSS.escape === 'function') return global.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char.codePointAt(0).toString(16)} `);
  }

  function splitSelectorList(value) {
    const selectors = [];
    let current = '';
    let quote = '';
    let depth = 0;
    for (const char of String(value || '')) {
      if (quote) {
        current += char;
        if (char === quote) quote = '';
        else if (char === '\\') current += '';
        continue;
      }
      if (char === '"' || char === "'") { quote = char; current += char; continue; }
      if (char === '(' || char === '[') depth += 1;
      if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
      if (char === ',' && depth === 0) { if (current.trim()) selectors.push(current.trim()); current = ''; }
      else current += char;
    }
    if (current.trim()) selectors.push(current.trim());
    return selectors;
  }

  function stripDynamicPseudo(selector) {
    return String(selector || '')
      .replace(/::(?:before|after|first-letter|first-line|marker|placeholder|selection|backdrop)/gi, '')
      .replace(/:(?:hover|active|focus|focus-visible|focus-within|visited|target|disabled|enabled|checked|indeterminate|placeholder-shown)(?:\([^)]*\))?/gi, '')
      .trim();
  }

  function safeMatches(element, selector) {
    if (!element || !selector) return false;
    try { return element.matches(selector); } catch (_) {
      try { return element.matches(stripDynamicPseudo(selector)); } catch (_) { return false; }
    }
  }

  function isInsideKeyframes(rule) {
    let parent = rule?.parent;
    while (parent) {
      if (parent.type === 'atrule' && /^(?:-webkit-)?keyframes$/i.test(parent.name)) return true;
      parent = parent.parent;
    }
    return false;
  }

  function stateSuffix(selector) {
    const value = String(selector || '');
    const states = Array.from(value.matchAll(/:(hover|active|focus|focus-visible|focus-within|visited|disabled|enabled|checked|indeterminate|placeholder-shown)\b/gi));
    const pseudoElement = value.match(/::(before|after|first-letter|first-line|marker|placeholder|selection|backdrop)\s*$/i);
    const state = states.length ? `:${states[states.length - 1][1]}` : '';
    return `${state}${pseudoElement ? `::${pseudoElement[1]}` : ''}`;
  }

  function parseStyleDeclarations(style) {
    const result = [];
    if (!style) return result;
    for (let i = 0; i < style.length; i += 1) {
      const prop = style[i];
      result.push({
        prop,
        value: style.getPropertyValue(prop),
        important: style.getPropertyPriority(prop) === 'important'
      });
    }
    return result;
  }

  function serializeAttributes(element) {
    return Array.from(element.attributes || []).map(attr => {
      if (BOOLEAN_ATTRIBUTES.has(attr.name.toLowerCase()) && attr.value === '') return attr.name;
      return `${attr.name}="${escapeHtml(attr.value)}"`;
    }).join(' ');
  }

  function formatElement(element, depth = 0) {
    if (!element || element.nodeType !== 1) return '';
    const indent = '  '.repeat(depth);
    const tag = element.tagName.toLowerCase();
    const attrs = serializeAttributes(element);
    const opening = `<${tag}${attrs ? ` ${attrs}` : ''}>`;
    if (VOID_TAGS.has(tag)) return `${indent}${opening}`;
    if (tag === 'pre' || tag === 'textarea') {
      return `${indent}${opening}${escapeHtml(element.textContent || '')}</${tag}>`;
    }

    const children = Array.from(element.childNodes).filter(node => {
      return node.nodeType === 1 || (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim());
    });
    if (children.length === 0) return `${indent}${opening}</${tag}>`;

    const onlyText = children.every(node => node.nodeType === 3);
    const text = onlyText ? children.map(node => node.nodeValue).join('') : '';
    if (onlyText && text.trim().length <= 100 && !['pre', 'textarea', 'script', 'style'].includes(tag)) {
      return `${indent}${opening}${escapeHtml(text.trim())}</${tag}>`;
    }

    const mixedInline = children.some(node => node.nodeType === 3) &&
      children.filter(node => node.nodeType === 1).every(node => INLINE_TAGS.has(node.tagName.toLowerCase()));
    if (mixedInline && element.innerHTML.length <= 1000) {
      return `${indent}${opening}${stripBidiControls(element.innerHTML)}</${tag}>`;
    }

    const body = children.map(node => {
      if (node.nodeType === 1) return formatElement(node, depth + 1);
      const content = ['pre', 'textarea'].includes(tag) ? node.nodeValue : node.nodeValue.trim();
      return `${'  '.repeat(depth + 1)}${escapeHtml(content)}`;
    }).join('\n');
    return `${indent}${opening}\n${body}\n${indent}</${tag}>`;
  }

  function toReactAttribute(name) {
    const lower = name.toLowerCase();
    const aliases = {
      class: 'className', for: 'htmlFor', tabindex: 'tabIndex', crossorigin: 'crossOrigin',
      srcset: 'srcSet', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength',
      cellpadding: 'cellPadding', cellspacing: 'cellSpacing', rowspan: 'rowSpan', colspan: 'colSpan',
      contenteditable: 'contentEditable', spellcheck: 'spellCheck', autoplay: 'autoPlay',
      playsinline: 'playsInline', referrerpolicy: 'referrerPolicy', usemap: 'useMap',
      viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio', gradientunits: 'gradientUnits',
      markerwidth: 'markerWidth', markerheight: 'markerHeight', markerunits: 'markerUnits',
      patternunits: 'patternUnits', patterncontentunits: 'patternContentUnits',
      strokewidth: 'strokeWidth', strokelinecap: 'strokeLinecap', strokelinejoin: 'strokeLinejoin',
      strokedasharray: 'strokeDasharray', strokedashoffset: 'strokeDashoffset',
      fillrule: 'fillRule', cliprule: 'clipRule', clippath: 'clipPath'
    };
    if (aliases[lower]) return aliases[lower];
    if (lower.startsWith('aria-') || lower.startsWith('data-')) return lower;
    return name.replace(/[-:]([a-z])/g, (_, char) => char.toUpperCase());
  }

  function formatReactElement(element, depth = 0) {
    const indent = '  '.repeat(depth);
    const rawTag = element.tagName.toLowerCase();
    const svgTags = {
      clippath: 'clipPath', feblend: 'feBlend', fecolormatrix: 'feColorMatrix',
      fecomponenttransfer: 'feComponentTransfer', fecomposite: 'feComposite',
      feconvolvematrix: 'feConvolveMatrix', fediffuselighting: 'feDiffuseLighting',
      fedisplacementmap: 'feDisplacementMap', fedistantlight: 'feDistantLight',
      fedropshadow: 'feDropShadow', feflood: 'feFlood', fefunca: 'feFuncA',
      fefuncb: 'feFuncB', fefuncg: 'feFuncG', fefuncr: 'feFuncR',
      fegaussianblur: 'feGaussianBlur', feimage: 'feImage', femerge: 'feMerge',
      femergenode: 'feMergeNode', femorphology: 'feMorphology', feoffset: 'feOffset',
      fepointlight: 'fePointLight', fespecularlighting: 'feSpecularLighting',
      fespotlight: 'feSpotLight', fetile: 'feTile', feturbulence: 'feTurbulence',
      lineargradient: 'linearGradient', radialgradient: 'radialGradient',
      textpath: 'textPath', foreignobject: 'foreignObject'
    };
    const tag = svgTags[rawTag] || rawTag;
    const attrs = Array.from(element.attributes || []).map(attr => {
      const name = toReactAttribute(attr.name);
      if (BOOLEAN_ATTRIBUTES.has(attr.name.toLowerCase()) && (attr.value === '' || attr.value === attr.name)) {
        return name;
      }
      return `${name}="${escapeHtml(attr.value)}"`;
    }).join(' ');
    const opening = `<${tag}${attrs ? ` ${attrs}` : ''}`;
    if (VOID_TAGS.has(tag)) return `${indent}${opening} />`;

    const children = Array.from(element.childNodes).filter(node => {
      return node.nodeType === 1 || (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim());
    });
    if (!children.length) return `${indent}${opening}></${tag}>`;
    if (children.every(node => node.nodeType === 3)) {
      const text = children.map(node => node.nodeValue).join('').trim();
      return `${indent}${opening}>${escapeHtml(text).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')}</${tag}>`;
    }
    const mixedInline = children.some(node => node.nodeType === 3) &&
      children.filter(node => node.nodeType === 1).every(node => INLINE_TAGS.has(node.tagName.toLowerCase()));
    if (mixedInline) {
      const inlineBody = children.map(node => node.nodeType === 1
        ? formatReactElement(node, 0).trim()
        : escapeHtml(node.nodeValue || '').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
      ).join('');
      return `${indent}${opening}>${inlineBody}</${tag}>`;
    }
    const body = children.map(node => node.nodeType === 1
      ? formatReactElement(node, depth + 1)
      : `${'  '.repeat(depth + 1)}${escapeHtml(node.nodeValue.trim())}`
    ).join('\n');
    return `${indent}${opening}>\n${body}\n${indent}</${tag}>`;
  }

  async function blobToDataUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (_) { return null; }
  }

  async function inlineBlobCssUrls(css) {
    if (!css || !css.includes('blob:')) return css || '';
    const urls = Array.from(new Set(Array.from(String(css).matchAll(/url\(\s*['"]?(blob:[^'"\)]+)['"]?\s*\)/gi)).map(match => match[1])));
    if (!urls.length) return css;
    const replacements = new Map();
    await Promise.all(urls.map(async url => {
      const dataUrl = await blobToDataUrl(url);
      if (dataUrl) replacements.set(url, dataUrl);
    }));
    return String(css).replace(/url\(\s*(['"]?)(blob:[^'"\)]+)\1\s*\)/gi, (match, quote, url) => {
      const replacement = replacements.get(url);
      return replacement ? `url("${replacement}")` : match;
    });
  }

  class Extractor {
    constructor(options = {}) {
      this.runtime = options.runtime || null;
      this.baseUrl = options.baseUrl || (global.location ? global.location.href : 'https://example.invalid/');
      this._cssCache = null;
      this._cssCacheAt = 0;
    }

    async sendMessage(message) {
      if (!this.runtime || typeof this.runtime.sendMessage !== 'function') return null;
      try { return await this.runtime.sendMessage(message); } catch (_) {
        return await new Promise(resolve => {
          try { this.runtime.sendMessage(message, response => resolve(response || null)); }
          catch (_) { resolve(null); }
        });
      }
    }

    isExtensionNode(node) {
      return Boolean(node && node.nodeType === 1 && (
        node.id === 'sd-toolbar' || node.id === 'uicc-toast' ||
        node.classList.contains('uicc-selection-overlay') ||
        (typeof node.closest === 'function' && node.closest('#sd-toolbar, .uicc-selection-overlay, #uicc-toast'))
      ));
    }

    async cloneAndSanitize(element) {
      const originalNodes = [element, ...element.querySelectorAll('*')];
      const clone = element.cloneNode(true);
      const cloneNodes = [clone, ...clone.querySelectorAll('*')];
      const blobJobs = [];

      clone.querySelectorAll('script, noscript, link[rel="preload"][as="script"]').forEach(node => node.remove());
      clone.querySelectorAll('#sd-toolbar, .uicc-selection-overlay, #uicc-toast').forEach(node => node.remove());

      for (let index = 0; index < cloneNodes.length; index += 1) {
        let node = cloneNodes[index];
        const original = originalNodes[index];
        if (!node || !original || !node.isConnected && node !== clone && !clone.contains(node)) continue;
        node.classList.add(`uicc-s${index}`);

        if (node.tagName === 'CANVAS') {
          try {
            const image = document.createElement('img');
            image.src = original.toDataURL('image/png');
            image.alt = original.getAttribute('aria-label') || 'Canvas snapshot';
            image.width = original.width;
            image.height = original.height;
            image.className = node.className;
            node.replaceWith(image);
            node = image;
            cloneNodes[index] = image;
          } catch (_) {
            node.setAttribute('aria-label', node.getAttribute('aria-label') || 'Canvas could not be captured');
          }
        }

        for (const attr of Array.from(node.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value;
          if (name.startsWith('on') || name === 'nonce' || name === 'integrity' ||
              name === 'contenteditable' || name === 'draggable') {
            node.removeAttribute(attr.name);
            continue;
          }
          if (URL_ATTRIBUTES.has(name)) {
            if (DANGEROUS_PROTOCOL.test(value) || (value.startsWith('data:') && !SAFE_DATA_URL.test(value))) {
              node.removeAttribute(attr.name);
            } else if (value.startsWith('blob:')) {
              blobJobs.push(blobToDataUrl(value).then(data => {
                if (data) node.setAttribute(attr.name, data); else node.removeAttribute(attr.name);
              }));
            } else {
              const resolved = absoluteUrl(value, this.baseUrl);
              if (resolved) node.setAttribute(attr.name, resolved); else node.removeAttribute(attr.name);
            }
          } else if (name === 'srcset') {
            node.setAttribute(attr.name, rewriteSrcset(value, this.baseUrl));
          } else if (name === 'style') {
            node.removeAttribute(attr.name);
          }
        }

        if (node.tagName === 'IMG' && original.currentSrc && !original.currentSrc.startsWith('blob:')) {
          node.setAttribute('src', absoluteUrl(original.currentSrc, this.baseUrl));
        }
        if ((node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') && 'value' in original) {
          if (node.tagName === 'TEXTAREA') node.textContent = original.value;
          else if (!['password', 'file'].includes((original.type || '').toLowerCase())) node.setAttribute('value', original.value);
        }
        if (node.tagName === 'INPUT' && ['checkbox', 'radio'].includes((original.type || '').toLowerCase())) {
          if (original.checked) node.setAttribute('checked', ''); else node.removeAttribute('checked');
        }
        if (node.tagName === 'OPTION' && original.selected) node.setAttribute('selected', '');
        if (node.tagName === 'DETAILS' && original.open) node.setAttribute('open', '');
      }

      await Promise.all(blobJobs);
      return { clone, originalNodes, cloneNodes };
    }

    async collectAllCss(force = false) {
      if (!force && this._cssCache && Date.now() - this._cssCacheAt < 15000) return this._cssCache;
      const inline = [];
      const externalUrls = new Set();
      for (const sheet of Array.from(document.styleSheets || [])) {
        const href = sheet.href || '';
        if (href.startsWith('chrome-extension:') || href.startsWith('moz-extension:')) continue;
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) inline.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
          else if (href) externalUrls.add(href);
        } catch (_) { if (href) externalUrls.add(href); }
      }
      for (const sheet of Array.from(document.adoptedStyleSheets || [])) {
        try { inline.push(Array.from(sheet.cssRules || []).map(rule => rule.cssText).join('\n')); } catch (_) {}
      }

      let external = '';
      if (externalUrls.size) {
        const urls = Array.from(externalUrls);
        const response = await this.sendMessage({ action: 'fetchExternalStylesheets', urls });
        if (response && response.success && response.results) {
          external = urls.map(url => response.results[url]?.success ? response.results[url].css : '').filter(Boolean).join('\n');
        }
      }
      this._cssCache = [...inline, external].filter(Boolean).join('\n');
      this._cssCacheAt = Date.now();
      return this._cssCache;
    }

    computedDeclarations(original, parentStyle, isRoot) {
      const style = global.getComputedStyle(original);
      const declarations = [];
      for (const prop of STYLE_PROPERTIES) {
        let value = style.getPropertyValue(prop).trim();
        if (!value) continue;
        if (value.includes('url(')) value = rewriteCssUrls(value, this.baseUrl);
        const defaultValue = DEFAULT_VALUES.get(prop);
        const inherited = INHERITED_PROPERTIES.has(prop);
        if (!isRoot && inherited && parentStyle && value === parentStyle.getPropertyValue(prop).trim()) continue;
        if (defaultValue && value === defaultValue) continue;
        if ((prop === 'width' || prop === 'height') && !isRoot && !['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME'].includes(original.tagName)) continue;
        if (prop === 'display' && ((value === 'inline' && original.tagName !== 'SPAN') || value === 'block')) {
          const explicit = original.style.getPropertyValue(prop);
          if (!explicit && !isRoot) continue;
        }
        declarations.push({ prop, value, important: false });
      }
      return declarations;
    }

    inlineStyleCss(originalNodes) {
      const blocks = [];
      originalNodes.forEach((node, index) => {
        if (!node?.style?.length || this.isExtensionNode(node)) return;
        const declarations = parseStyleDeclarations(node.style);
        if (!declarations.length) return;
        blocks.push(`.uicc-s${index} {\n${declarations.map(item => {
          const value = rewriteCssUrls(item.value, this.baseUrl);
          return `  ${item.prop}: ${value}${item.important ? ' !important' : ''};`;
        }).join('\n')}\n}`);
      });
      return blocks.join('\n\n');
    }

    inheritedRootCss(element) {
      const style = global.getComputedStyle(element);
      const properties = [
        'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch',
        'line-height', 'letter-spacing', 'word-spacing', 'color', 'text-align',
        'text-transform', 'white-space', 'word-break', 'overflow-wrap',
        'direction', 'unicode-bidi', 'writing-mode', 'text-orientation'
      ];
      const declarations = properties.map(prop => ({ prop, value: style.getPropertyValue(prop).trim() }))
        .filter(item => {
          if (!item.value || item.value === 'none') return false;
          const defaultValue = DEFAULT_VALUES.get(item.prop);
          return !defaultValue || item.value !== defaultValue;
        });
      return declarations.length
        ? `.uicc-s0 {\n${declarations.map(item => `  ${item.prop}: ${item.value};`).join('\n')}\n}`
        : '';
    }

    async scopeAuthoredCss(element, originalNodes) {
      const postcss = global.postcss;
      if (!postcss) return '';
      let source = await this.collectAllCss();
      if (!source || !source.trim()) return '';
      if (source.length > 5_000_000) source = source.slice(0, 5_000_000);

      let root;
      try { root = postcss.parse(source, { from: undefined }); }
      catch (_) {
        try {
          root = postcss.parse(source.replace(/@nest\b[^{]*\{[^}]*\}/g, '').replace(/@apply\b[^;]*;/g, ''), { from: undefined });
        } catch (_) { return ''; }
      }

      const usedAnimations = new Set();
      const usedFonts = new Set();
      for (const node of originalNodes) {
        if (!node || this.isExtensionNode(node)) continue;
        const style = global.getComputedStyle(node);
        String(style.animationName || '').split(',').map(value => value.trim()).filter(value => value && value !== 'none')
          .forEach(value => usedAnimations.add(value));
        String(style.fontFamily || '').split(',').map(value => value.trim().replace(/^['"]|['"]$/g, '').toLowerCase()).filter(Boolean)
          .forEach(value => usedFonts.add(value));
      }

      root.walkRules(rule => {
        if (isInsideKeyframes(rule)) return;
        const rewritten = [];
        for (const selector of rule.selectors || []) {
          const withoutState = stripDynamicPseudo(selector);
          const suffix = stateSuffix(selector);
          originalNodes.forEach((node, index) => {
            if (!node || this.isExtensionNode(node)) return;
            if (safeMatches(node, selector) || safeMatches(node, withoutState)) {
              rewritten.push(`.uicc-s${index}${suffix}`);
            }
          });
        }
        const unique = Array.from(new Set(rewritten));
        if (!unique.length) { rule.remove(); return; }
        rule.selectors = unique;

        rule.walkDecls(declaration => {
          if (declaration.value?.includes('var(')) {
            const firstSelector = unique[0];
            const indexMatch = firstSelector.match(/^\.uicc-s(\d+)/);
            const matchedNode = indexMatch ? originalNodes[Number(indexMatch[1])] : null;
            if (matchedNode) {
              const computed = global.getComputedStyle(matchedNode).getPropertyValue(declaration.prop).trim();
              if (computed) declaration.value = computed;
            }
          }
          if (declaration.value?.includes('url(')) declaration.value = rewriteCssUrls(declaration.value, this.baseUrl);
          if (/^(?:-webkit-)?animation(?:-name)?$/i.test(declaration.prop)) {
            String(declaration.value).split(',').forEach(part => {
              const candidate = part.trim().split(/\s+/)[0];
              if (candidate && candidate !== 'none') usedAnimations.add(candidate);
            });
          }
        });
      });

      root.walkAtRules(atRule => {
        const name = String(atRule.name || '').toLowerCase();
        if (name === 'import' || name === 'charset' || (name === 'media' && /\bprint\b/i.test(atRule.params || ''))) {
          atRule.remove();
          return;
        }
        if (name === 'keyframes' || name === '-webkit-keyframes') {
          if (!usedAnimations.has(atRule.params)) atRule.remove();
          return;
        }
        if (name === 'font-face') {
          let family = '';
          atRule.walkDecls('font-family', declaration => {
            family = declaration.value.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
          });
          if (family && !usedFonts.has(family)) atRule.remove();
          else atRule.walkDecls(declaration => {
            if (declaration.value?.includes('url(')) declaration.value = rewriteCssUrls(declaration.value, this.baseUrl);
          });
          return;
        }
        if (name === 'font-feature-values') atRule.remove();
      });

      root.walkComments(comment => comment.remove());
      let changed = true;
      while (changed) {
        changed = false;
        root.walkAtRules(atRule => {
          if (atRule.nodes && atRule.nodes.length === 0) { atRule.remove(); changed = true; }
        });
      }
      if (typeof root.cleanRaws === 'function') root.cleanRaws();
      return rewriteCssUrls(root.toString(), this.baseUrl).trim();
    }

    buildSnapshotCss(originalNodes) {
      const signatureToClass = new Map();
      const classCss = [];
      const classMap = new Map();
      const pseudoCss = [];

      for (let index = 0; index < originalNodes.length; index += 1) {
        const original = originalNodes[index];
        if (!original || this.isExtensionNode(original)) continue;
        const parentStyle = index === 0 || !original.parentElement ? null : global.getComputedStyle(original.parentElement);
        const declarations = this.computedDeclarations(original, parentStyle, index === 0);
        const signature = declarations.map(item => `${item.prop}:${item.value}`).join(';');
        let className = signatureToClass.get(signature);
        if (!className) {
          className = `uicc-c${signatureToClass.size}`;
          signatureToClass.set(signature, className);
          if (declarations.length) {
            classCss.push(`.${className} {\n${declarations.map(item => `  ${item.prop}: ${item.value};`).join('\n')}\n}`);
          }
        }
        classMap.set(index, className);

        for (const pseudo of ['::before', '::after']) {
          let pseudoStyle;
          try { pseudoStyle = global.getComputedStyle(original, pseudo); } catch (_) { continue; }
          const content = pseudoStyle.getPropertyValue('content');
          if (!content || content === 'none' || content === 'normal') continue;
          const props = ['content', 'display', 'position', 'inset', 'top', 'right', 'bottom', 'left',
            'width', 'height', 'margin', 'padding', 'color', 'background', 'border', 'border-radius',
            'font', 'opacity', 'transform', 'box-shadow'];
          const values = props.map(prop => ({ prop, value: pseudoStyle.getPropertyValue(prop).trim() })).filter(item => item.value);
          pseudoCss.push(`.uicc-s${index}${pseudo} {\n${values.map(item => `  ${item.prop}: ${rewriteCssUrls(item.value, this.baseUrl)};`).join('\n')}\n}`);
        }
      }
      return { css: [...classCss, ...pseudoCss].join('\n\n'), classMap };
    }

    applySnapshotClasses(cloneNodes, classMap) {
      cloneNodes.forEach((node, index) => {
        const className = classMap.get(index);
        if (className) node.classList.add(className);
      });
    }

    removeInternalClasses(clone) {
      for (const node of [clone, ...clone.querySelectorAll('*')]) {
        const kept = Array.from(node.classList).filter(name => !/^uicc-s\d+$/.test(name));
        if (kept.length) node.setAttribute('class', kept.join(' '));
        else node.removeAttribute('class');
      }
    }

    async extract(element) {
      if (!element || element.nodeType !== 1) throw new Error('Select a valid page element first.');
      const { clone, originalNodes, cloneNodes } = await this.cloneAndSanitize(element);
      const authoredCss = await this.scopeAuthoredCss(element, originalNodes);
      const inlineCss = this.inlineStyleCss(originalNodes);
      let css;
      if (authoredCss || inlineCss) {
        css = [this.inheritedRootCss(element), authoredCss, inlineCss].filter(Boolean).join('\n\n');
      } else {
        const snapshot = this.buildSnapshotCss(originalNodes);
        this.applySnapshotClasses(cloneNodes, snapshot.classMap);
        css = snapshot.css;
      }
      css = stripBidiControls(await inlineBlobCssUrls(css));
      const html = stripBidiControls(formatElement(clone));
      return {
        html,
        css,
        combined: `<!-- HTML -->\n${html}\n\n<style>\n${css}\n</style>`,
        stats: {
          elements: originalNodes.length,
          cssRules: (css.match(/\{/g) || []).length,
          images: clone.querySelectorAll('img').length,
          svgs: clone.querySelectorAll('svg').length
        },
        clone
      };
    }

    async toTailwind(element, extraction = null) {
      const result = extraction || await this.extract(element);
      if (typeof global.dn === 'function' && global.dn()) return result.html;
      if (typeof global.fn === 'function' && typeof global.Ar === 'function') {
        try {
          const scoped = global.fn(result.html, result.css);
          if (scoped) {
            const converted = global.Ar(scoped.scopedHtml, scoped.scopedCSS);
            const html = converted.tailwindHtml || result.html;
            return converted.fallbackCSS
              ? `${html}\n\n<style>\n${converted.fallbackCSS.trim()}\n</style>`
              : html;
          }
        } catch (_) {}
      }
      return result.combined;
    }

    async toVue(element, extraction = null) {
      const result = extraction || await this.extract(element);
      return `<template>\n${result.html}\n</template>\n\n<style scoped>\n${result.css}\n</style>`;
    }

    async toReact(element, extraction = null) {
      const result = extraction || await this.extract(element);
      const jsx = formatReactElement(result.clone, 2);
      const css = result.css.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      return `const styles = String.raw\`\n${css}\n\`;\n\nexport default function CopiedComponent() {\n  return (\n    <>\n      <style>{styles}</style>\n${jsx}\n    </>\n  );\n}`;
    }
  }

  const api = {
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
  };
  global.UICCExtractor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
