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

  const GLOBAL_RESET_CSS = `/* Reset - ensures exported elements render as intended */
*, *::before, *::after {
  box-sizing: border-box;
}

svg {
  fill: currentColor;
}`;

  function resolveColor(value, targetElement) {
    if (!value || value === 'none' || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return value || '';
    if (typeof document === 'undefined') return value;
    try {
      const dummy = document.createElement('div');
      dummy.style.color = value;
      const parent = (targetElement && targetElement.parentNode) ? targetElement.parentNode : (targetElement || document.body);
      if (parent && typeof parent.appendChild === 'function') parent.appendChild(dummy);
      const computed = globalThis.getComputedStyle ? globalThis.getComputedStyle(dummy).color : value;
      if (dummy.parentNode) dummy.parentNode.removeChild(dummy);
      return computed || value;
    } catch (_) {
      return value;
    }
  }

  function isFixedMedia(node) {
    if (!node) return false;
    let tag = typeof node === 'string' ? node : String(node.tagName || '');
    tag = tag.toUpperCase();
    const FIXED_TAGS = new Set([
      'IMG', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME',
      'EMBED', 'OBJECT', 'PICTURE', 'SOURCE', 'INPUT',
      'BUTTON', 'SELECT', 'TEXTAREA', 'I'
    ]);
    if (FIXED_TAGS.has(tag)) return true;
    if (typeof node === 'object' && node.nodeType === 1) {
      const className = String(node.className || '');
      if (/\b(?:icon|i-[a-z0-9_-]+|fa-[a-z0-9_-]+|lucide|heroicon|material-icons)\b/i.test(className)) {
        return true;
      }
      if (node.getAttribute && node.getAttribute('role') === 'img') return true;
    }
    return false;
  }

  function processSvgElement(origSvg, cloneSvg) {
    if (!origSvg || !cloneSvg) return;
    const SVG_PROPS = [
      "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap",
      "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity",
      "opacity", "font-family", "font-size", "font-weight", "font-style",
      "text-anchor", "dominant-baseline", "stop-color", "stop-opacity"
    ];
    const origNodes = [origSvg, ...origSvg.querySelectorAll('*')];
    const cloneNodes = [cloneSvg, ...cloneSvg.querySelectorAll('*')];

    origNodes.forEach((origNode, i) => {
      const cloneNode = cloneNodes[i];
      if (!cloneNode || origNode.nodeType !== 1) return;
      try {
        const computed = globalThis.getComputedStyle ? globalThis.getComputedStyle(origNode) : null;
        if (!computed) return;
        SVG_PROPS.forEach(prop => {
          const val = computed.getPropertyValue(prop);
          if (!val || val === 'inherit') return;
          if (prop === 'fill' || prop === 'stroke' || prop === 'stop-color') {
            const attr = cloneNode.getAttribute(prop);
            if (attr && attr.startsWith('url(')) return;
            const resolved = resolveColor(val, origNode);
            if (resolved) cloneNode.setAttribute(prop, resolved);
          } else {
            if (val === 'none' || val === 'normal') return;
            cloneNode.setAttribute(prop, val);
          }
        });
      } catch (_) {}
    });

    let w = cloneSvg.getAttribute('width') || origSvg.getAttribute('width');
    let h = cloneSvg.getAttribute('height') || origSvg.getAttribute('height');
    if (!w || !h || w === 'auto' || h === 'auto' || String(w).endsWith('%') || String(h).endsWith('%')) {
      const viewBoxVal = origSvg.viewBox?.baseVal;
      if (viewBoxVal && viewBoxVal.width && viewBoxVal.height) {
        w = w || viewBoxVal.width;
        h = h || viewBoxVal.height;
      } else {
        const vb = origSvg.getAttribute('viewBox') || origSvg.getAttribute('viewbox');
        if (vb) {
          const parts = vb.split(/[\s,]+/);
          if (parts.length === 4) {
            w = w || parseFloat(parts[2]);
            h = h || parseFloat(parts[3]);
          }
        }
      }
      if (!w || !h) {
        try {
          const rect = origSvg.getBoundingClientRect();
          w = w || Math.round(rect.width);
          h = h || Math.round(rect.height);
        } catch (_) {}
      }
      w = w || 24;
      h = h || 24;
      cloneSvg.setAttribute('width', w);
      cloneSvg.setAttribute('height', h);
    }

    if (!cloneSvg.hasAttribute('viewBox') && (origSvg.getAttribute('viewBox') || origSvg.getAttribute('viewbox'))) {
      cloneSvg.setAttribute('viewBox', origSvg.getAttribute('viewBox') || origSvg.getAttribute('viewbox'));
    }

    const defaults = {
      "fill-opacity": "1", "stroke-opacity": "1", opacity: "1", "stroke-width": "1px",
      "stroke-linecap": "butt", "stroke-linejoin": "miter", "stroke-dashoffset": "0px",
      "stroke-dasharray": "none", "text-anchor": "start", "dominant-baseline": "auto",
      "stop-color": "#000000", "stop-opacity": "1", "font-weight": "400", "font-size": "16px"
    };
    cloneNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.getAttribute('stroke') === 'null') node.removeAttribute('stroke');
      if (node.getAttribute('fill') === 'null') node.removeAttribute('fill');
      for (const [k, v] of Object.entries(defaults)) {
        if (node.getAttribute(k) === v) node.removeAttribute(k);
      }
    });
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
    'background-size', 'background-repeat', 'background-clip', '-webkit-background-clip',
    '-webkit-text-fill-color', 'background-origin',
    'mask', 'mask-image', '-webkit-mask', '-webkit-mask-image',
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
    '-webkit-background-clip': 'border-box', '-webkit-text-fill-color': 'currentcolor',
    'mask-image': 'none', '-webkit-mask-image': 'none',
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
    if (!baseUrl || baseUrl.includes('example.invalid')) return trimmed;
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
    let escaped = false;
    for (const char of String(value || '')) {
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        current += char;
        escaped = true;
        continue;
      }
      if (quote) {
        current += char;
        if (char === quote) quote = '';
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

  function splitCompoundSelectors(selector) {
    const parts = [];
    let current = '';
    let quote = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let escaped = false;

    for (let i = 0; i < selector.length; i += 1) {
      const char = selector[i];
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        current += char;
        escaped = true;
        continue;
      }
      if (quote) {
        current += char;
        if (char === quote) quote = '';
        continue;
      }
      if (char === '"' || char === "'") { quote = char; current += char; continue; }
      if (char === '(') { parenDepth += 1; current += char; continue; }
      if (char === ')') { parenDepth = Math.max(0, parenDepth - 1); current += char; continue; }
      if (char === '[') { bracketDepth += 1; current += char; continue; }
      if (char === ']') { bracketDepth = Math.max(0, bracketDepth - 1); current += char; continue; }

      if (parenDepth === 0 && bracketDepth === 0) {
        if (char === ' ' || char === '>' || char === '+' || char === '~') {
          if (current.trim()) parts.push(current.trim());
          current = '';
          continue;
        }
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function stripDynamicPseudo(selector) {
    return String(selector || '')
      .replace(/::(?:before|after|first-letter|first-line|marker|placeholder|selection|backdrop)/gi, '')
      .replace(/:(?:focus-visible|focus-within|placeholder-shown|hover|active|focus|visited|target|disabled|enabled|checked|indeterminate)(?:\([^)]*\))?/gi, '')
      .trim();
  }

  function safeMatches(element, selector) {
    if (!element || !selector) return false;
    const clean = stripDynamicPseudo(selector);
    try { if (element.matches(clean)) return true; } catch (_) {}
    try { if (element.matches(selector)) return true; } catch (_) {}

    const parts = splitCompoundSelectors(selector);
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const lastClean = stripDynamicPseudo(last);
      try { if (element.matches(lastClean) || element.matches(last)) return true; } catch (_) {}
    }

    try { if (element.querySelector(clean) !== null) return true; } catch (_) {}
    return false;
  }

  function extractAnimationNames(value) {
    if (!value) return [];
    const reserved = new Set([
      'none', 'initial', 'inherit', 'unset', 'revert', 'auto',
      'infinite', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
      'step-start', 'step-end', 'normal', 'reverse', 'alternate',
      'alternate-reverse', 'forwards', 'backwards', 'both', 'running', 'paused'
    ]);
    const names = [];
    const cleanValue = String(value).replace(/\b[a-z0-9_-]+\([^)]*\)/gi, '');
    cleanValue.split(',').forEach(part => {
      const tokens = part.trim().split(/\s+/);
      for (const token of tokens) {
        if (!token) continue;
        const lower = token.toLowerCase();
        if (reserved.has(lower)) continue;
        if (/^-?\d*(?:\.\d+)?(?:s|ms)$/i.test(token)) continue;
        if (/^\d+(?:\.\d+)?$/.test(token)) continue;
        names.push(token);
      }
    });
    return names;
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
      let name = attr.name;
      if (name.toLowerCase() === 'viewbox') name = 'viewBox';
      if (BOOLEAN_ATTRIBUTES.has(name.toLowerCase()) && attr.value === '') return name;
      return `${name}="${escapeHtml(attr.value)}"`;
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

    const children = Array.from(element.childNodes || []).filter(node => {
      return node.nodeType === 1 || (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim());
    });
    if (children.length === 0) {
      if (element.textContent && element.textContent.trim()) {
        return `${indent}${opening}${escapeHtml(element.textContent.trim())}</${tag}>`;
      }
      return `${indent}${opening}</${tag}>`;
    }

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
      srcset: 'srcSet', readonly: 'readOnly', autofocus: 'autoFocus', maxlength: 'maxLength', minlength: 'minLength',
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
    if (!element || element.nodeType !== 1) return '';
    const indent = '  '.repeat(depth);
    const rawTag = element.tagName.toLowerCase();
    const svgTags = {
      svg: 'svg', path: 'path', circle: 'circle', rect: 'rect', line: 'line',
      polyline: 'polyline', polygon: 'polygon', ellipse: 'ellipse', g: 'g',
      use: 'use', defs: 'defs', symbol: 'symbol', lineargradient: 'linearGradient',
      lineargardient: 'linearGradient', radialgradient: 'radialGradient',
      clippath: 'clipPath', text: 'text', tspan: 'tspan', filter: 'filter',
      feblend: 'feBlend', fecolormatrix: 'feColorMatrix',
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

    const isPreOrTextarea = tag === 'pre' || tag === 'textarea';
    const children = Array.from(element.childNodes).filter(node => {
      return node.nodeType === 1 || (node.nodeType === 3 && node.nodeValue && (isPreOrTextarea || node.nodeValue.trim()));
    });
    if (!children.length) {
      if (element.textContent && element.textContent.trim()) {
        const text = escapeHtml(element.textContent.trim()).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
        return `${indent}${opening}>${text}</${tag}>`;
      }
      return `${indent}${opening}></${tag}>`;
    }
    if (children.every(node => node.nodeType === 3)) {
      const text = isPreOrTextarea
        ? children.map(node => node.nodeValue).join('')
        : children.map(node => node.nodeValue).join('').trim();
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
        (typeof node.classList?.contains === 'function' && node.classList.contains('uicc-selection-overlay')) ||
        (typeof node.closest === 'function' && node.closest('#sd-toolbar, .uicc-selection-overlay, #uicc-toast'))
      ));
    }

    isSanitizedNode(node) {
      if (!node || node.nodeType !== 1) return false;
      const tag = String(node.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'NOSCRIPT') return false;
      if (node.id === 'sd-toolbar' || node.id === 'uicc-toast' || (typeof node.classList?.contains === 'function' && node.classList.contains('uicc-selection-overlay'))) return false;
      if (typeof node.closest === 'function' && node.closest('#sd-toolbar, .uicc-selection-overlay, #uicc-toast')) return false;
      return true;
    }

    async cloneAndSanitize(element) {
      const clone = element.cloneNode(true);
      clone.querySelectorAll('script, noscript, link[rel="preload"][as="script"]').forEach(node => node.remove());
      clone.querySelectorAll('#sd-toolbar, .uicc-selection-overlay, #uicc-toast').forEach(node => node.remove());
      clone.classList.add('exported-root');

      const rawOriginals = [element, ...element.querySelectorAll('*')].filter(n => this.isSanitizedNode(n));
      const rawClones = [clone, ...clone.querySelectorAll('*')].filter(n => this.isSanitizedNode(n));

      const MAX_ELEMENTS = 1000;
      const originalNodes = rawOriginals.slice(0, MAX_ELEMENTS);
      const cloneNodes = rawClones.slice(0, MAX_ELEMENTS);
      const blobJobs = [];

      for (let index = 0; index < cloneNodes.length; index += 1) {
        let node = cloneNodes[index];
        const original = originalNodes[index];
        if (!node || !original) continue;
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

        if (node.tagName === 'INPUT') {
          const type = (node.getAttribute('type') || '').toLowerCase();
          if (type === 'password') {
            node.removeAttribute('value');
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

      try {
        const origSvgs = element.tagName === 'SVG' || element.tagName === 'svg' ? [element] : Array.from(element.querySelectorAll('svg'));
        const cloneSvgs = clone.tagName === 'SVG' || clone.tagName === 'svg' ? [clone] : Array.from(clone.querySelectorAll('svg'));
        origSvgs.forEach((origSvg, i) => {
          if (cloneSvgs[i]) processSvgElement(origSvg, cloneSvgs[i]);
        });
      } catch (_) {}

      return { clone, originalNodes, cloneNodes };
    }

    async collectAllCss(force = false) {
      if (!force && this._cssCache && Date.now() - this._cssCacheAt < 15000) return this._cssCache;
      const inline = [];
      const externalUrls = new Set();
      for (const sheet of Array.from(global.document?.styleSheets || [])) {
        const href = sheet.href || '';
        if (href.startsWith('chrome-extension:') || href.startsWith('moz-extension:')) continue;
        if (sheet.ownerNode?.id?.startsWith('uicc-') || sheet.ownerNode?.id?.startsWith('asset-inspector-')) continue;
        if (href) {
          externalUrls.add(href);
        } else {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) inline.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
          } catch (_) {}
        }
      }
      for (const sheet of Array.from(global.document?.adoptedStyleSheets || [])) {
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
      const getComputed = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle : (typeof global.getComputedStyle === 'function' ? global.getComputedStyle : null);
      const style = getComputed ? getComputed(original) : null;
      const declarations = [];
      if (!style) return declarations;
      const tag = String(original.tagName || '').toUpperCase();

      const customProps = [];
      try {
        for (let i = 0; i < style.length; i += 1) {
          const prop = style[i];
          if (prop && prop.startsWith('--')) customProps.push(prop);
        }
      } catch (_) {}

      const allProps = [...STYLE_PROPERTIES, ...customProps];
      for (const prop of allProps) {
        let value = style.getPropertyValue(prop).trim();
        if (!value) continue;
        if (value.includes('url(')) value = rewriteCssUrls(value, this.baseUrl);
        const defaultValue = DEFAULT_VALUES.get(prop);
        const inherited = INHERITED_PROPERTIES.has(prop);
        if (!isRoot && inherited && parentStyle && value === parentStyle.getPropertyValue(prop).trim()) continue;
        if (defaultValue && value === defaultValue) continue;

        if (prop === 'display') {
          const defaultTagDisplay = ['DIV', 'P', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'ASIDE', 'UL', 'OL', 'LI', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'TR'].includes(tag) ? 'block' :
            ['SPAN', 'A', 'B', 'I', 'STRONG', 'EM', 'CODE', 'LABEL', 'SMALL', 'SUB', 'SUP', 'VAR', 'KBD', 'CITE'].includes(tag) ? 'inline' : '';
          if (defaultTagDisplay && value === defaultTagDisplay) continue;
        }

        if (prop === 'width' || prop === 'height') {
          if (!isFixedMedia(original)) {
            if (value === 'auto' || value === '0px' || value.endsWith('px')) continue;
          }
        }

        declarations.push({ prop, value, important: false });
      }
      return declarations;
    }

    inlineStyleCss(originalNodes) {
      const blocks = [];
      originalNodes.forEach((node, index) => {
        if (!node?.style?.length || this.isExtensionNode(node)) return;
        let declarations = parseStyleDeclarations(node.style);
        if (!isFixedMedia(node)) {
          declarations = declarations.filter(item => {
            if (item.prop === 'width' || item.prop === 'height') {
              if (item.value === 'auto' || item.value === '0px' || item.value.endsWith('px')) return false;
            }
            return true;
          });
        }
        if (!declarations.length) return;
        blocks.push(`.uicc-s${index} {\n${declarations.map(item => {
          const value = rewriteCssUrls(item.value, this.baseUrl);
          return `  ${item.prop}: ${value}${item.important ? ' !important' : ''};`;
        }).join('\n')}\n}`);
      });
      return blocks.join('\n\n');
    }

    findAncestorBackground(element) {
      let e = element;
      const getComputed = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle : (typeof global.getComputedStyle === 'function' ? global.getComputedStyle : null);
      if (!getComputed) return null;
      while (e && e !== global.document?.documentElement) {
        try {
          const r = getComputed(e).getPropertyValue("background-color") || getComputed(e).getPropertyValue("background");
          if (r && r !== "transparent" && r !== "rgba(0, 0, 0, 0)") {
            if (r === "rgb(255, 255, 255)" || r === "rgba(255, 255, 255, 1)") {
              e = e.parentElement;
              continue;
            }
            return r;
          }
        } catch (_) {}
        e = e.parentElement;
      }
      try {
        for (const rNode of [global.document?.body, global.document?.documentElement]) {
          if (!rNode) continue;
          const n = getComputed(rNode).getPropertyValue("background-color") || getComputed(rNode).getPropertyValue("background");
          if (n && n !== "transparent" && n !== "rgba(0, 0, 0, 0)" && n !== "rgb(255, 255, 255)" && n !== "rgba(255, 255, 255, 1)") {
            return n;
          }
        }
      } catch (_) {}
      return null;
    }

    inheritedRootCss(element) {
      const declarations = [];
      const getComputed = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle : (typeof global.getComputedStyle === 'function' ? global.getComputedStyle : null);
      if (element && getComputed) {
        try {
          const style = getComputed(element);
          const properties = [
            'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch',
            'line-height', 'letter-spacing', 'word-spacing', 'color', 'text-align',
            'text-transform', 'white-space', 'word-break', 'overflow-wrap',
            'direction', 'unicode-bidi', 'writing-mode', 'text-orientation'
          ];
          for (const prop of properties) {
            const val = style.getPropertyValue(prop)?.trim();
            if (!val || val === 'none') continue;
            const defaultValue = DEFAULT_VALUES.get(prop);
            if (!defaultValue || val !== defaultValue) {
              declarations.push(`  ${prop}: ${val};`);
            }
          }
        } catch (_) {}
      }

      const bodyDecls = [];
      try {
        if (global.document?.body && getComputed) {
          const bodyStyle = getComputed(global.document.body);
          const color = bodyStyle.getPropertyValue("color");
          if (color) bodyDecls.push(`  color: ${color};`);
          const font = bodyStyle.getPropertyValue("font-family");
          if (font) bodyDecls.push(`  font-family: ${font};`);
        }
        if (element) {
          const bg = this.findAncestorBackground(element);
          if (bg) bodyDecls.push(`  background-color: ${bg};`);
        }
      } catch (_) {}

      const parts = [];
      if (declarations.length > 0) {
        parts.push(`.exported-root {\n${declarations.join('\n')}\n}`);
      }
      if (bodyDecls.length > 0) {
        parts.push(`body {\n${bodyDecls.join('\n')}\n}`);
      }
      return parts.join('\n\n');
    }

    async scopeAuthoredCss(element, originalNodes, options = {}) {
      const postcss = global.postcss;
      if (!postcss) return '';
      let source = await this.collectAllCss();
      if (!source || !source.trim()) return '';
      if (source.length > 10_000_000) source = source.slice(0, 10_000_000);

      let root;
      try { root = postcss.parse(source, { from: undefined }); }
      catch (_) {
        try {
          root = postcss.parse(source.replace(/@nest\b[^{]*\{[^}]*\}/g, '').replace(/@apply\b[^;]*;/g, ''), { from: undefined });
        } catch (_) { return ''; }
      }

      // Build fast element index (tag names, classes, IDs) to prune impossible selector matches
      const presentTags = new Set();
      const presentClasses = new Set();
      const presentIds = new Set();
      const validNodes = [];

      for (const node of originalNodes) {
        if (!node || this.isExtensionNode(node)) continue;
        validNodes.push(node);
        if (node.tagName) presentTags.add(String(node.tagName).toLowerCase());
        const idVal = node.id || (typeof node.getAttribute === 'function' ? node.getAttribute('id') : null);
        if (idVal && typeof idVal === 'string') presentIds.add(idVal.toLowerCase());

        let classStr = typeof node.className === 'string' ? node.className : '';
        if (!classStr && typeof node.getAttribute === 'function') {
          classStr = node.getAttribute('class') || '';
        }
        if (classStr && typeof classStr === 'string') {
          classStr.split(/\s+/).forEach(c => c && presentClasses.add(c.toLowerCase()));
        }
        if (node.classList && typeof node.classList[Symbol.iterator] === 'function') {
          try {
            for (const cls of node.classList) {
              if (cls && typeof cls === 'string') presentClasses.add(cls.toLowerCase());
            }
          } catch (_) {}
        }
      }

      const hasIndex = presentTags.size > 0 || presentClasses.size > 0 || presentIds.size > 0;

      function canSelectorMatch(selector) {
        if (!selector) return false;
        if (!hasIndex) return true;
        const clean = stripDynamicPseudo(selector).trim();
        if (!clean) return false;

        if (/^(?::root|:host|html|body)(?:[.:#\[\s>]|$)/i.test(clean)) return true;

        // Class pruning
        if (presentClasses.size > 0) {
          const classMatches = clean.match(/\.([a-zA-Z0-9_-]+|\\[^\s])/g);
          if (classMatches && classMatches.length > 0) {
            let hasAnyClass = false;
            for (const rawCls of classMatches) {
              const clsName = rawCls.slice(1).replace(/\\/g, '').toLowerCase();
              if (presentClasses.has(clsName)) {
                hasAnyClass = true;
                break;
              }
            }
            if (!hasAnyClass) return false;
          }
        }

        // ID pruning
        if (presentIds.size > 0) {
          const idMatches = clean.match(/#([a-zA-Z0-9_-]+|\\[^\s])/g);
          if (idMatches && idMatches.length > 0) {
            let hasAnyId = false;
            for (const rawId of idMatches) {
              const idName = rawId.slice(1).replace(/\\/g, '').toLowerCase();
              if (presentIds.has(idName)) {
                hasAnyId = true;
                break;
              }
            }
            if (!hasAnyId) return false;
          }
        }

        // Tag pruning
        if (presentTags.size > 0) {
          const tagMatches = clean.match(/(?:^|[\s>+~])([a-zA-Z1-6]+)(?=[.#\[:\s>+~]|$)/g);
          if (tagMatches && tagMatches.length > 0) {
            let hasAnyTag = false;
            for (const rawTag of tagMatches) {
              const tagName = rawTag.replace(/^[\s>+~]+/, '').toLowerCase();
              if (tagName === 'html' || tagName === 'body' || presentTags.has(tagName)) {
                hasAnyTag = true;
                break;
              }
            }
            if (!hasAnyTag) return false;
          }
        }

        return true;
      }

      const selectorMatchCache = new Map();
      function matchesSubtree(selector, clean) {
        if (selectorMatchCache.has(selector)) return selectorMatchCache.get(selector);

        if (!canSelectorMatch(selector) && !canSelectorMatch(clean)) {
          selectorMatchCache.set(selector, false);
          return false;
        }

        let matched = false;
        for (const node of validNodes) {
          if (safeMatches(node, selector) || safeMatches(node, clean)) {
            matched = true;
            break;
          }
        }
        selectorMatchCache.set(selector, matched);
        return matched;
      }

      const matchingSelectors = new Set();
      root.walkRules(rule => {
        if (isInsideKeyframes(rule)) return;
        let parent = rule.parent;
        if (parent && parent.type === 'atrule' && parent.name === 'font-face') return;

        const hasCustomDecls = rule.nodes && rule.nodes.some(n => n.type === 'decl' && n.prop && n.prop.startsWith('--'));

        for (const selector of rule.selectors || []) {
          const clean = stripDynamicPseudo(selector);
          const isRootHtmlHost = /^(?::root|:host|html)(?:[.:#\[]|$)/i.test(clean);
          if (isRootHtmlHost && hasCustomDecls) {
            matchingSelectors.add(selector);
            continue;
          }
          if (matchesSubtree(selector, clean)) {
            matchingSelectors.add(selector);
          }
        }
      });

      root.walkRules(rule => {
        if (isInsideKeyframes(rule)) return;
        let parent = rule.parent;
        if (parent && parent.type === 'atrule' && parent.name === 'font-face') return;

        const kept = (rule.selectors || []).filter(s => matchingSelectors.has(s));
        if (kept.length === 0) {
          rule.remove();
        } else {
          rule.selectors = kept;
        }
      });

      const usedAnimations = new Set();
      const usedFonts = new Set();

      const getComputed = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle : (typeof global.getComputedStyle === 'function' ? global.getComputedStyle : null);
      if (getComputed) {
        for (const node of validNodes) {
          try {
            const style = getComputed(node);
            String(style?.animationName || '').split(',').map(v => v.trim()).filter(v => v && v !== 'none')
              .forEach(v => usedAnimations.add(v));
            String(style?.fontFamily || '').split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '').toLowerCase()).filter(Boolean)
              .forEach(v => usedFonts.add(v));
          } catch (_) {}
        }
      }

      root.walkDecls(decl => {
        if (decl.parent?.type === 'atrule' && decl.parent.name === 'font-face') return;
        if (/^(?:-webkit-)?animation(?:-name)?$/i.test(decl.prop)) {
          extractAnimationNames(decl.value).forEach(name => usedAnimations.add(name));
        }
        if (/^(?:-webkit-)?font(?:-family)?$/i.test(decl.prop)) {
          decl.value.replace(/!important/g, '').split(',').forEach(f => {
            const family = f.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
            if (family) usedFonts.add(family);
          });
        }
      });

      root.walkRules(rule => {
        if (isInsideKeyframes(rule)) return;
        const isRootHtmlHost = (rule.selectors || []).some(s => /^(?::root|:host|html)(?:[.:#\[]|$)/i.test(stripDynamicPseudo(s)));

        let matchedNodesForDecl = null;
        const getMatchedNodes = () => {
          if (matchedNodesForDecl === null) {
            matchedNodesForDecl = validNodes.filter(n => rule.selectors.some(s => safeMatches(n, s)));
          }
          return matchedNodesForDecl;
        };

        rule.walkDecls(decl => {
          if (options.resolveVars) {
            if (!isRootHtmlHost && decl.prop && decl.prop.startsWith('--')) {
              decl.remove();
              return;
            }
            if (!isRootHtmlHost && decl.value && decl.value.includes('var(') && getComputed) {
              const matchedNodes = getMatchedNodes();
              for (const n of matchedNodes) {
                try {
                  const computedVal = getComputed(n).getPropertyValue(decl.prop)?.trim();
                  if (computedVal && computedVal !== 'none' && computedVal !== 'initial') {
                    decl.value = computedVal;
                    break;
                  }
                } catch (_) {}
              }
            }
          }
          if (decl.value && decl.value.includes('url(')) decl.value = rewriteCssUrls(decl.value, this.baseUrl);
          if (decl.prop === 'width' || decl.prop === 'height') {
            if (decl.value.endsWith('px') || /\d+(?:\.\d+)?px/i.test(decl.value)) {
              const matchedForDecl = getMatchedNodes();
              if (matchedForDecl.length > 0 && matchedForDecl.every(n => !isFixedMedia(n))) {
                decl.remove();
              }
            }
          }
        });
      });

      root.walkDecls(decl => {
        if (decl.value && decl.value.includes('url(')) decl.value = rewriteCssUrls(decl.value, this.baseUrl);
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

      let hasLayers = true;
      while (hasLayers) {
        hasLayers = false;
        const layerRules = [];
        root.walkAtRules('layer', atRule => { layerRules.push(atRule); });
        if (!layerRules.length) break;
        hasLayers = true;

        for (const atRule of layerRules) {
          if (!atRule.parent) continue;
          if (atRule.nodes && atRule.nodes.length > 0) {
            const children = [...atRule.nodes];
            for (const child of children) {
              atRule.parent.insertBefore(atRule, child);
            }
          }
          atRule.remove();
        }
      }

      let changed = true;
      while (changed) {
        changed = false;
        root.walkAtRules(atRule => {
          if (atRule.nodes && atRule.nodes.length === 0) { atRule.remove(); changed = true; }
        });
      }

      root.walkComments(comment => comment.remove());
      if (typeof root.cleanRaws === 'function') root.cleanRaws();
      return rewriteCssUrls(root.toString(), this.baseUrl).trim();
    }

    buildSnapshotCss(originalNodes) {
      const signatureToClass = new Map();
      const classCss = [];
      const classMap = new Map();
      const pseudoCss = [];

      const getComputed = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle : (typeof global.getComputedStyle === 'function' ? global.getComputedStyle : null);

      for (let index = 0; index < originalNodes.length; index += 1) {
        const original = originalNodes[index];
        if (!original || this.isExtensionNode(original)) continue;
        const parentStyle = index === 0 || !original.parentElement || !getComputed ? null : getComputed(original.parentElement);
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
          try { pseudoStyle = getComputed ? getComputed(original, pseudo) : null; } catch (_) { continue; }
          if (!pseudoStyle) continue;
          const content = pseudoStyle.getPropertyValue('content');
          if (!content || content === 'none' || content === 'normal') continue;
          const props = ['content', 'display', 'position', 'inset', 'top', 'right', 'bottom', 'left',
            'width', 'height', 'margin', 'padding', 'color', 'background', 'border', 'border-radius',
            'font', 'opacity', 'transform', 'box-shadow'];
          const values = props.map(prop => ({ prop, value: pseudoStyle.getPropertyValue(prop).trim() })).filter(item => item.value);
          pseudoCss.push(`.${className}${pseudo} {\n${values.map(item => `  ${item.prop}: ${rewriteCssUrls(item.value, this.baseUrl)};`).join('\n')}\n}`);
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
        if (!node || node.nodeType !== 1) continue;
        if (node.id === 'sd-toolbar' || node.id === 'uicc-toast' || (typeof node.classList?.contains === 'function' && node.classList.contains('uicc-selection-overlay'))) {
          node.remove();
          continue;
        }
        if (node.classList) {
          if (typeof node.classList.remove === 'function') {
            node.classList.remove('asset-inspector-editing', 'uicc-element-editing', 'uicc-selection-active', 'uicc-highlight', 'exported-root');
          }
          const kept = Array.from(node.classList).filter(name => !/^uicc-s\d+$/.test(name) && name !== 'uicc-selection-active' && name !== 'uicc-highlight' && name !== 'exported-root' && name !== 'asset-inspector-editing' && name !== 'uicc-element-editing');
          if (kept.length) node.setAttribute('class', kept.join(' '));
          else node.removeAttribute('class');
        }
      }
    }

    async extract(element, options = {}) {
      if (!element || element.nodeType !== 1) throw new Error('Select a valid page element first.');
      if (!window.MiroCore || !window.MiroCore.extractComponent) {
        throw new Error('Miro extraction engine not loaded.');
      }
      
      const result = await window.MiroCore.extractComponent(element, options);
      console.log("[MyExtension] MiroCore returned:", result);
      
      if (result.error) throw new Error(result.error);
      
      const cssString = result.css || result.cssText || '';
      console.log("[MyExtension] Final CSS length:", cssString.length);
      
      return {
        html: result.html,
        css: cssString,
        combined: `<!-- HTML -->\n${result.html}\n\n<style>\n${cssString}\n</style>`,
        stats: {
          elements: result.stats?.elementCount || 0,
          cssRules: result.stats?.cssRuleCount || 0,
          images: element.querySelectorAll('img').length,
          svgs: element.querySelectorAll('svg').length
        },
        clone: document.createElement('div')
      };
    }

    getComputedStyleSnapshot(element) {
      if (!element || element.nodeType !== 1) throw new Error('Select a valid page element first.');
      const clone = element.cloneNode(true);
      clone.querySelectorAll('#sd-toolbar, .uicc-selection-overlay, #uicc-toast').forEach(node => node.remove());
      clone.querySelectorAll('script, noscript, link[rel="preload"][as="script"]').forEach(node => node.remove());

      const rawOriginals = [element, ...element.querySelectorAll('*')].filter(n => n && n.nodeType === 1);
      const rawClones = [clone, ...clone.querySelectorAll('*')].filter(n => n && n.nodeType === 1);

      const MAX_ELEMENTS = 1000;
      const l = rawOriginals.slice(0, MAX_ELEMENTS);
      const c = rawClones.slice(0, MAX_ELEMENTS);

      const u = [
        "display","box-sizing","position","top","right","bottom","left","z-index","width","height",
        "min-width","min-height","max-width","max-height","margin","margin-top","margin-right",
        "margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom",
        "padding-left","flex-direction","flex-wrap","flex-grow","flex-shrink","flex-basis",
        "align-items","align-self","justify-content","gap","row-gap","column-gap",
        "grid-template-columns","grid-template-rows","grid-column","grid-row","overflow",
        "overflow-x","overflow-y","color","background","background-color","background-image",
        "background-size","background-position","background-repeat","background-clip","-webkit-background-clip","-webkit-text-fill-color","font-family","font-size",
        "font-weight","font-style","line-height","letter-spacing","text-align","text-transform",
        "text-decoration","white-space","word-break","text-overflow","border","border-width",
        "border-style","border-color","border-radius","border-top-left-radius",
        "border-top-right-radius","border-bottom-left-radius","border-bottom-right-radius",
        "box-shadow","opacity","transform","transition","cursor","pointer-events","visibility",
        "object-fit","object-position","aspect-ratio","isolation","mix-blend-mode","filter",
        "backdrop-filter","outline","outline-offset","text-indent","vertical-align",
        "list-style-type","table-layout","border-collapse","border-spacing","fill","stroke","stroke-width"
      ];

      const m = {
        position: "static", top: "auto", right: "auto", bottom: "auto", left: "auto",
        "z-index": "auto", "min-width": "0px", "min-height": "0px", "max-width": "none",
        "max-height": "none", "flex-grow": "0", "flex-shrink": "1", "flex-basis": "auto",
        overflow: "visible", "overflow-x": "visible", "overflow-y": "visible",
        transform: "none", filter: "none", "backdrop-filter": "none", opacity: "1",
        visibility: "visible", cursor: "auto", "pointer-events": "auto", isolation: "auto",
        "mix-blend-mode": "normal", "box-shadow": "none", "text-transform": "none",
        "text-decoration": "none", "text-indent": "0px", outline: "", "outline-offset": "0px",
        "object-fit": "fill", "aspect-ratio": "auto", "white-space": "normal",
        "word-break": "normal", "text-overflow": "clip", "border-collapse": "separate",
        "table-layout": "auto", fill: "", stroke: "none", "stroke-width": "1"
      };

      for (let s = 0; s < l.length && s < c.length; s++) {
        const origNode = l[s];
        const cloneNode = c[s];
        if (!origNode || !cloneNode) continue;
        const o = globalThis.getComputedStyle ? globalThis.getComputedStyle(origNode) : null;
        if (!o) continue;
        const a = [];
        const customProps = [];
        try {
          for (let i = 0; i < o.length; i += 1) {
            const prop = o[i];
            if (prop && prop.startsWith('--')) customProps.push(prop);
          }
        } catch (_) {}

        const allProps = [...u, ...customProps];
        for (const i of allProps) {
          let p = o.getPropertyValue(i);
          if (!p || p === "" || p === m[i] || (i === "outline" && p.includes("99, 102, 241"))) continue;
          if (i === "width" || i === "height") {
            if (!isFixedMedia(origNode) && (p === 'auto' || p === '0px' || p.endsWith('px'))) continue;
          }
          p = resolveColor(p, origNode);
          a.push(`${i}:${p}`);
        }
        if (a.length > 0) {
          const existing = cloneNode.getAttribute("style") || "";
          cloneNode.setAttribute("style", (existing ? existing + ";" : "") + a.join(";"));
        }
      }

      c.forEach(s => {
        if (s.tagName === "IMG" && s.getAttribute("src")) {
          const src = s.getAttribute("src");
          if (!src.startsWith("http") && !src.startsWith("data:")) {
            try { s.setAttribute("src", new URL(src, this.baseUrl || globalThis.location.href).href); } catch (_) {}
          }
        }
      });

      try {
        const origSvgs = element.tagName === 'SVG' || element.tagName === 'svg' ? [element] : Array.from(element.querySelectorAll('svg'));
        const cloneSvgs = clone.tagName === 'SVG' || clone.tagName === 'svg' ? [clone] : Array.from(clone.querySelectorAll('svg'));
        origSvgs.forEach((origSvg, i) => {
          if (cloneSvgs[i]) processSvgElement(origSvg, cloneSvgs[i]);
        });
      } catch (_) {}

      const ancestorBg = this.findAncestorBackground(element) || '';
      const fullCss = [GLOBAL_RESET_CSS, this.inheritedRootCss(element)].filter(Boolean).join('\n\n');
      return { html: clone.outerHTML, css: fullCss, ancestorBg };
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
    splitCompoundSelectors,
    isFixedMedia,
    extractAnimationNames,
    stripDynamicPseudo,
    formatElement,
    formatReactElement,
    escapeHtml,
    stripBidiControls
  };
  global.UICCExtractor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
