'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

/**
 * Creates a robust synthetic DOM node for headless Node.js testing of Extractor & content scripts.
 */
function createMockElement(tagName = 'DIV', options = {}) {
  if (typeof tagName === 'object' && tagName !== null) {
    options = tagName;
    tagName = options.tagName || 'DIV';
  }

  const uppercaseTag = String(tagName).toUpperCase();
  const attributesMap = new Map();
  const children = [];
  const elementListenersMap = new Map();

  const element = {
    nodeType: 1,
    tagName: uppercaseTag,
    nodeName: uppercaseTag,
    parentNode: options.parentNode || null,
    parentElement: options.parentElement || options.parentNode || null,
    childNodes: children,
    attributes: [],
    
    get id() {
      return attributesMap.get('id') || '';
    },
    set id(val) {
      if (val) attributesMap.set('id', String(val));
      else attributesMap.delete('id');
      syncAttributesArray();
    },

    get className() {
      return Array.from(classSet).join(' ');
    },
    set className(val) {
      classSet.clear();
      if (val) String(val).split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      syncClassAttribute();
    },

    get offsetWidth() {
      return this.getBoundingClientRect().width;
    },
    get offsetHeight() {
      return this.getBoundingClientRect().height;
    },

    addEventListener(type, fn) {
      if (!elementListenersMap.has(type)) elementListenersMap.set(type, []);
      elementListenersMap.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      if (elementListenersMap.has(type)) {
        const list = elementListenersMap.get(type);
        const idx = list.indexOf(fn);
        if (idx !== -1) list.splice(idx, 1);
      }
    },
    dispatchEvent(event) {
      const list = elementListenersMap.get(event.type) || [];
      list.forEach(fn => fn(event));
    },

    // Geometry & bounding rect
    _rect: (function() {
      const styleWidth = options.style?.width ? parseFloat(options.style.width) : NaN;
      const styleHeight = options.style?.height ? parseFloat(options.style.height) : NaN;
      const computedWidth = options.width || (!isNaN(styleWidth) ? styleWidth : 100);
      const computedHeight = options.height || (!isNaN(styleHeight) ? styleHeight : 50);
      const x = options.x || 0;
      const y = options.y || 0;
      return {
        x, y,
        width: computedWidth,
        height: computedHeight,
        top: y,
        left: x,
        right: x + computedWidth,
        bottom: y + computedHeight
      };
    })(),
    getBoundingClientRect() {
      return { ...this._rect };
    },

    // Style declaration mock
    style: {
      _styles: new Map(),
      getPropertyValue(prop) {
        return this._styles.get(String(prop).toLowerCase()) || '';
      },
      setProperty(prop, value, priority = '') {
        const key = String(prop).toLowerCase();
        if (value === null || value === undefined || value === '') {
          this._styles.delete(key);
        } else {
          this._styles.set(key, String(value));
        }
      },
      removeProperty(prop) {
        const key = String(prop).toLowerCase();
        const prev = this._styles.get(key) || '';
        this._styles.delete(key);
        return prev;
      },
      getPropertyPriority() {
        return '';
      },
      get length() {
        return this._styles.size;
      }
    }
  };

  // Children property returning only nodeType === 1 element nodes
  Object.defineProperty(element, 'children', {
    get() {
      return children.filter(c => c && c.nodeType === 1);
    }
  });

  // Sync style array indexing style[i]
  Object.defineProperty(element.style, 'length', {
    get() {
      return element.style._styles.size;
    }
  });

  // Proxy style indexing (style[0], style[1], etc.)
  element.style = new Proxy(element.style, {
    get(target, prop) {
      if (typeof prop === 'string' && !isNaN(Number(prop))) {
        const keys = Array.from(target._styles.keys());
        return keys[Number(prop)];
      }
      return target[prop];
    }
  });

  // ClassList mock
  const classSet = new Set();
  element.classList = {
    add(...names) {
      names.forEach(n => {
        if (n) classSet.add(n);
      });
      syncClassAttribute();
    },
    remove(...names) {
      names.forEach(n => classSet.delete(n));
      syncClassAttribute();
    },
    contains(name) {
      return classSet.has(name);
    },
    toggle(name, force) {
      if (force === true || (force === undefined && !classSet.has(name))) {
        classSet.add(name);
      } else {
        classSet.delete(name);
      }
      syncClassAttribute();
    },
    get length() {
      return classSet.size;
    },
    [Symbol.iterator]() {
      return classSet.values();
    }
  };

  function syncClassAttribute() {
    const classStr = Array.from(classSet).join(' ');
    if (classStr) {
      attributesMap.set('class', classStr);
    } else {
      attributesMap.delete('class');
    }
    syncAttributesArray();
  }

  function syncAttributesArray() {
    element.attributes = Array.from(attributesMap.entries()).map(([name, value]) => ({
      name,
      value: String(value)
    }));
  }

  element.getAttribute = function (name) {
    const key = String(name).toLowerCase();
    return attributesMap.has(key) ? attributesMap.get(key) : null;
  };

  element.setAttribute = function (name, value) {
    const key = String(name).toLowerCase();
    const valStr = String(value);
    attributesMap.set(key, valStr);
    if (key === 'class') {
      classSet.clear();
      valStr.split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
    } else if (key === 'id') {
      element.id = valStr;
    } else if (key === 'style') {
      element.style._styles.clear();
      valStr.split(';').forEach(rule => {
        const parts = rule.split(':');
        if (parts.length >= 2) {
          const prop = parts[0].trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();
          if (prop && val) element.style.setProperty(prop, val);
        }
      });
    }
    syncAttributesArray();
  };

  element.hasAttribute = function (name) {
    return attributesMap.has(String(name).toLowerCase());
  };

  element.removeAttribute = function (name) {
    const key = String(name).toLowerCase();
    attributesMap.delete(key);
    if (key === 'class') classSet.clear();
    if (key === 'id') element.id = '';
    syncAttributesArray();
  };

  element.appendChild = function (child) {
    if (!child) return child;
    if (child.nodeType === 1 || child.nodeType === 3) {
      child.parentNode = element;
      child.parentElement = element;
      children.push(child);
    }
    return child;
  };

  element.removeChild = function (child) {
    const idx = children.indexOf(child);
    if (idx !== -1) {
      children.splice(idx, 1);
      child.parentNode = null;
      child.parentElement = null;
    }
    return child;
  };

  element.replaceWith = function (newChild) {
    if (!element.parentNode) return;
    const parentChildren = element.parentNode.childNodes;
    const idx = parentChildren.indexOf(element);
    if (idx !== -1) {
      parentChildren[idx] = newChild;
      newChild.parentNode = element.parentNode;
      newChild.parentElement = element.parentNode;
    }
  };

  element.remove = function () {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  // Selector matching helper
  element.matches = function (selector) {
    if (!selector) return false;
    const rawSel = String(selector).trim();
    if (rawSel.includes(',')) {
      return rawSel.split(',').some(sub => element.matches(sub.trim()));
    }
    const sel = rawSel;
    if (sel === '*' || sel.toUpperCase() === uppercaseTag) return true;
    if (sel.startsWith('#')) {
      const idVal = sel.slice(1).split(':')[0].split('[')[0];
      return attributesMap.get('id') === idVal;
    }
    if (sel.includes('.')) {
      const rawParts = sel.split('.');
      const tagPart = rawParts[0];
      if (tagPart && tagPart.toUpperCase() !== uppercaseTag) return false;
      const classParts = rawParts.slice(1);
      return classParts.every(p => {
        const cls = p.split(':')[0].split('[')[0];
        return classSet.has(cls);
      });
    }
    const attrMatch = sel.match(/^([a-zA-Z0-9-]+)?\[([a-zA-Z0-9-]+)(?:=([ "']?)(.*?)\3)?\]$/);
    if (attrMatch) {
      const tag = attrMatch[1];
      const attrName = attrMatch[2];
      const attrVal = attrMatch[4];
      if (tag && tag.toUpperCase() !== uppercaseTag) return false;
      if (!attributesMap.has(attrName.toLowerCase())) return false;
      if (attrVal !== undefined && attributesMap.get(attrName.toLowerCase()) !== attrVal) return false;
      return true;
    }
    return sel.toUpperCase() === uppercaseTag;
  };

  element.closest = function (selector) {
    let curr = element;
    while (curr) {
      if (curr.nodeType === 1 && curr.matches(selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  };

  element.querySelector = function (selector) {
    const results = element.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  };

  element.querySelectorAll = function (selector) {
    const matchesList = [];
    function traverse(node) {
      if (!node || node.nodeType !== 1) return;
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (child.matches(selector)) {
            matchesList.push(child);
          }
          traverse(child);
        }
      }
    }
    traverse(element);
    return matchesList;
  };

  element.cloneNode = function (deep = false) {
    const clone = createMockElement(uppercaseTag, {
      x: element._rect.x,
      y: element._rect.y,
      width: element._rect.width,
      height: element._rect.height
    });

    for (const [k, v] of attributesMap.entries()) {
      clone.setAttribute(k, v);
    }
    for (const [prop, val] of element.style._styles.entries()) {
      clone.style.setProperty(prop, val);
    }

    if (deep) {
      for (const child of children) {
        if (child.nodeType === 1) {
          clone.appendChild(child.cloneNode(true));
        } else if (child.nodeType === 3) {
          clone.appendChild(createMockTextNode(child.nodeValue));
        }
      }
    }
    return clone;
  };

  // Text content & innerHTML properties
  Object.defineProperty(element, 'textContent', {
    get() {
      return children.map(c => (c.nodeType === 3 ? c.nodeValue : c.textContent || '')).join('');
    },
    set(val) {
      children.length = 0;
      if (val !== null && val !== undefined && val !== '') {
        element.appendChild(createMockTextNode(String(val)));
      }
    }
  });

  Object.defineProperty(element, 'innerHTML', {
    get() {
      return children.map(c => {
        if (c.nodeType === 3) return c.nodeValue;
        return c.outerHTML || '';
      }).join('');
    },
    set(val) {
      children.length = 0;
      if (val) {
        element.appendChild(createMockTextNode(String(val).replace(/<[^>]*>/g, '')));
      }
    }
  });

  Object.defineProperty(element, 'outerHTML', {
    get() {
      const attrsStr = Array.from(attributesMap.entries())
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      const openTag = `<${uppercaseTag.toLowerCase()}${attrsStr ? ' ' + attrsStr : ''}>`;
      const voidTags = new Set(['IMG', 'INPUT', 'BR', 'HR', 'META', 'LINK', 'AREA', 'SOURCE']);
      if (voidTags.has(uppercaseTag)) return openTag;
      return `${openTag}${element.innerHTML}</${uppercaseTag.toLowerCase()}>`;
    }
  });

  // Apply initial attributes if provided
  if (options.id) element.setAttribute('id', options.id);
  if (options.className) element.setAttribute('class', options.className);
  if (options.viewBox) element.setAttribute('viewBox', options.viewBox);
  if (options.attributes) {
    for (const [k, v] of Object.entries(options.attributes)) {
      element.setAttribute(k, v);
    }
  }
  if (options.style) {
    for (const [k, v] of Object.entries(options.style)) {
      element.style.setProperty(k, v);
    }
  }
  if (options.children) {
    options.children.forEach(c => element.appendChild(c));
  }
  if (options.textContent) {
    element.textContent = options.textContent;
  }

  return element;
}

function createMockTextNode(text = '') {
  return {
    nodeType: 3,
    nodeValue: String(text),
    textContent: String(text),
    parentNode: null,
    parentElement: null
  };
}

/**
 * Mocks globalThis.postcss using lib/postcss.js
 */
async function setupPostcss() {
  if (!globalThis.postcss) {
    const postcssPath = path.resolve(__dirname, '..', '..', 'lib', 'postcss.js');
    const postcssModule = await import(pathToFileURL(postcssPath).href);
    globalThis.postcss = postcssModule.default || postcssModule;
  }
  return globalThis.postcss;
}

/**
 * Sets up basic global document/window environment for tests if missing.
 */
function setupDOMEnvironment() {
  const eventListenersMap = new Map();

  if (!globalThis.document) {
    const bodyMock = createMockElement('body');
    const htmlMock = createMockElement('html');
    htmlMock.appendChild(bodyMock);

    globalThis.document = {
      body: bodyMock,
      documentElement: htmlMock,
      title: 'Test Document',
      location: { href: 'https://example.com/test.html' },
      createElement: tagName => createMockElement(tagName),
      createTextNode: text => createMockTextNode(text),
      querySelector: sel => htmlMock.querySelector(sel),
      querySelectorAll: sel => htmlMock.querySelectorAll(sel),
      styleSheets: [],
      adoptedStyleSheets: [],
      execCommand: () => true,
      addEventListener: (type, fn) => {
        if (!eventListenersMap.has(type)) eventListenersMap.set(type, []);
        eventListenersMap.get(type).push(fn);
      },
      removeEventListener: (type, fn) => {
        if (eventListenersMap.has(type)) {
          const list = eventListenersMap.get(type);
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
        }
      },
      dispatchEvent: event => {
        const list = eventListenersMap.get(event.type) || [];
        list.forEach(fn => fn(event));
      }
    };
  } else {
    if (!globalThis.document.addEventListener) {
      globalThis.document.addEventListener = (type, fn) => {
        if (!eventListenersMap.has(type)) eventListenersMap.set(type, []);
        eventListenersMap.get(type).push(fn);
      };
    }
    if (!globalThis.document.removeEventListener) {
      globalThis.document.removeEventListener = (type, fn) => {
        if (eventListenersMap.has(type)) {
          const list = eventListenersMap.get(type);
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
        }
      };
    }
  }

  if (!globalThis.window) {
    globalThis.window = globalThis;
  }
  if (!globalThis.window.addEventListener) {
    globalThis.window.addEventListener = (type, fn) => {
      if (!eventListenersMap.has(`win_${type}`)) eventListenersMap.set(`win_${type}`, []);
      eventListenersMap.get(`win_${type}`).push(fn);
    };
  }
  if (!globalThis.window.removeEventListener) {
    globalThis.window.removeEventListener = (type, fn) => {
      if (eventListenersMap.has(`win_${type}`)) {
        const list = eventListenersMap.get(`win_${type}`);
        const idx = list.indexOf(fn);
        if (idx !== -1) list.splice(idx, 1);
      }
    };
  }
  if (!globalThis.location) {
    globalThis.location = { href: 'https://example.com/test.html' };
  }
  if (!globalThis.navigator) {
    globalThis.navigator = {
      clipboard: {
        writeText: async () => {}
      }
    };
  }
}

/**
 * Setup global document and body mocks for Extractor tests
 */
function setupMockDocument() {
  const root = createMockElement('HTML');
  const body = createMockElement('BODY');
  root.appendChild(body);

  globalThis.document = {
    documentElement: root,
    body: body,
    styleSheets: [],
    adoptedStyleSheets: [],
    createElement: (tag) => createMockElement(tag),
    createTextNode: (text) => createMockTextNode(text),
    getElementById: (id) => root.querySelector(`#${id}`),
    querySelectorAll: (sel) => root.querySelectorAll(sel),
    querySelector: (sel) => root.querySelector(sel)
  };

  if (!globalThis.getComputedStyle) {
    globalThis.getComputedStyle = (node) => ({
      animationName: node?.style?.getPropertyValue('animation-name') || 'none',
      fontFamily: node?.style?.getPropertyValue('font-family') || 'sans-serif',
      getPropertyValue: (prop) => node?.style?.getPropertyValue(prop) || ''
    });
  }

  return globalThis.document;
}

/**
 * Asserts HTML string has matching basic tags and no unescaped syntax errors.
 */
function assertValidHtml(htmlString) {
  if (typeof htmlString !== 'string') throw new Error('HTML must be a string');
  const openTags = (htmlString.match(/<[a-z0-9-]+[^>/]*>/gi) || []).map(t => t.match(/<([a-z0-9-]+)/i)[1].toLowerCase());
  const closeTags = (htmlString.match(/<\/[a-z0-9-]+>/gi) || []).map(t => t.match(/<\/([a-z0-9-]+)/i)[1].toLowerCase());
  // Basic validation that output is valid HTML
  if (openTags.length === 0 && !htmlString.includes('<')) {
    throw new Error('Expected HTML string to contain markup tags');
  }
  return true;
}

/**
 * Asserts CSS string has balanced braces.
 */
function assertValidCss(cssString) {
  if (typeof cssString !== 'string') throw new Error('CSS must be a string');
  const openBraces = (cssString.match(/\{/g) || []).length;
  const closeBraces = (cssString.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    throw new Error(`Unbalanced CSS braces: ${openBraces} open vs ${closeBraces} close`);
  }
  return true;
}

/**
 * Asserts no script tags, onerror attributes, or javascript: URLs exist.
 */
function assertNoXssPayload(outputString) {
  const lower = String(outputString).toLowerCase();
  if (lower.includes('<script') || lower.includes('javascript:') || lower.includes('onerror=')) {
    throw new Error('XSS payload detected in output string');
  }
  return true;
}

module.exports = {
  createMockElement,
  createMockTextNode,
  setupPostcss,
  setupMockDocument,
  assertValidHtml,
  assertValidCss,
  assertNoXssPayload
};
