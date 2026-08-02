# Comprehensive Analysis Report: Code Extraction Accuracy Engine (`lib/extractor.js`)

**Agent**: Explorer 3 (Milestone 1)  
**Date**: 2026-07-25  
**Target Files**: `lib/extractor.js`, `tests/extractor.test.js`  
**Scope**: Rigid pixel dimension removal, compound selector matching, `:where()` / `@layer` rules, CSS variable resolution, and code extraction accuracy gaps.

---

## Executive Summary

An in-depth analysis of `lib/extractor.js` and `tests/extractor.test.js` was conducted. Currently, all 18 existing unit tests in `npm test` pass. However, detailed static and runtime analysis of `lib/extractor.js` reveals critical structural gaps and bugs in CSS extraction accuracy:

1. **Rigid Pixel Dimensions**: Authored CSS (`scopeAuthoredCss`) and inline CSS (`inlineStyleCss`) preserve hardcoded subpixel layout dimensions (`width: 257.982px; height: 71.3281px;`) on layout containers verbatim, destroying layout responsiveness. Meanwhile, computed snapshot mode indiscriminately strips pixel dimensions from non-media tags, collapsing small icon/avatar elements.
2. **Compound Selector & `:where()` Matching**: `safeMatches()` uses naive regex whitespace splitting (`[\s>+~]+`) that corrupts selector parsing whenever spaces or commas appear inside `:where(...)`, `:is(...)`, `:has(...)`, or attribute selectors (e.g. `[data-x="a b"]`). Furthermore, `splitSelectorList()` contains a string un-escaping bug (`char === '\\'` drops backslashes).
3. **`@layer` Unwrapping & Cascade Hierarchy**: `@layer` rules are unwrapped post-pruning without preserving initial layer declaration ordering (`@layer base, components, utilities;`), which can break cascade priority in exported CSS.
4. **CSS Variable (`var()`) Resolution Bug**: `scopeAuthoredCss` attempts to resolve `var()` values by querying `getComputedStyle(node).getPropertyValue(decl.prop)` on default node state. For `:hover` / `:focus` rules, this overwrites hover property values with default state values, completely destroying interactive hover styles.

---

## Detailed Findings

### 1. Hardcoded & Subpixel Pixel Dimension Removal Logic

#### A. Current Implementation Overview
- In `computedDeclarations()` (lines 660–665) and `getComputedStyleSnapshot()` (lines 1058–1061):
  ```javascript
  if (prop === 'width' || prop === 'height') {
    const isFixedMedia = ['IMG', 'CANVAS', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'INPUT'].includes(tag);
    if (!isFixedMedia) {
      if (value === 'auto' || value === '0px' || value.endsWith('px')) continue;
    }
  }
  ```

#### B. Identified Gaps & Deficiencies
1. **Authored CSS & Inline CSS Bypass Cleaning**:
   - `scopeAuthoredCss()` leaves authored CSS declarations untouched. If stylesheets contain `.container { width: 1240.4px; }` or `.card { height: 350.25px; }`, these rigid dimensions remain in the exported CSS.
   - `inlineStyleCss()` extracts all `node.style` declarations verbatim:
     ```javascript
     blocks.push(`.uicc-s${index} {\n${declarations.map(item => `  ${item.prop}: ${value};`).join('\n')}\n}`);
     ```
     Dynamic runtime inline styles (e.g., `width: 257.982px; height: 71.3281px` set by JS positioning libraries) are written directly into generated CSS.
2. **Incomplete Media / Fixed Element Tag List**:
   - `isFixedMedia` only lists `['IMG', 'CANVAS', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'INPUT']`.
   - Missing media / replaced tags: `EMBED`, `OBJECT`, `PICTURE`, `SOURCE`.
   - Missing form control tags: `BUTTON`, `SELECT`, `TEXTAREA`, `PROGRESS`, `METER`.
   - Non-media icon/avatar elements: Small elements like `<span class="avatar">` or `<div class="icon-wrapper">` rely on explicit fixed pixel dimensions (e.g., `24px x 24px` or `40px x 40px`). In snapshot mode, `if (value.endsWith('px')) continue;` strips their width and height, causing them to collapse to 0x0.
3. **Subpixel Fractional Pixels (`257.982px`)**:
   - Subpixel precision numbers returned by `getComputedStyle` (e.g., `width: 257.982147px`) are never rounded or normalized to clean values or percentages.
4. **Over-stripping vs Under-stripping**:
   - Non-media elements with explicit percentage or flex dimensions are preserved, but fixed-size card components in snapshot mode lose `width` entirely without a responsive fallback (`max-width: 100%`).

---

### 2. Compound Selector, `:where()`, and `@layer` Matching Logic

#### A. Compound Selector & `:where()` Parsing Flaws
- In `safeMatches()` (lines 290–305):
  ```javascript
  function safeMatches(element, selector) {
    if (!element || !selector) return false;
    const clean = stripDynamicPseudo(selector);
    try { if (element.matches(selector) || element.matches(clean)) return true; } catch (_) {}
    
    const parts = selector.trim().split(/[\s>+~]+/);
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const lastClean = stripDynamicPseudo(last);
      try { if (element.matches(last) || element.matches(lastClean)) return true; } catch (_) {}
    }
    
    try { if (element.querySelector(clean) !== null) return true; } catch (_) {}
    return false;
  }
  ```

#### B. Failure Scenarios
1. **Whitespace inside `:where()`, `:is()`, `:has()`, and attributes**:
   - Selector: `:where(.btn-primary, .btn-secondary)`
   - `selector.trim().split(/[\s>+~]+/)` splits on the space after `,`.
   - Resulting `parts`: `[':where(.btn-primary,', '.btn-secondary)']`.
   - `last`: `'.btn-secondary)'`.
   - `element.matches('.btn-secondary)')` throws `DOMException: SyntaxError: '.btn-secondary)' is not a valid selector.`.
   - Exception caught -> returns `false`.
   - **Consequence**: Valid rules utilizing `:where()` with multiple parameters or spaces are improperly dropped during CSS scoping!
2. **Escaped Characters Bug in `splitSelectorList`**:
   - Lines 266–270:
     ```javascript
     if (quote) {
       current += char;
       if (char === quote) quote = '';
       else if (char === '\\') current += ''; // BUG: Drops backslashes inside quotes
       continue;
     }
     ```
   - When `char === '\\'`, `current += ''` discards the escape character. If a string contains `\'`, the backslash is deleted and the quote is treated as closing the string, corrupting selector splitting.
3. **Escaped Class Names (Tailwind / UnoCSS)**:
   - Selectors with escaped characters like `.hover\:bg-blue-500:hover` or `.w-1\/2` can fail matching when `stripDynamicPseudo()` incorrectly strips colon segments or un-escaped tokens.
4. **`:where()` Specificity & Ancestor Scoping**:
   - `:where()` selectors often target top-level theme containers (e.g. `:where(.dark) .card`). If `.dark` resides on `<html>` or `<body>` and `element` is `.card`, `element.matches(':where(.dark) .card')` succeeds ONLY if `.card` is attached to the document tree. When isolated, `element.matches` fails, and the fallback `parts` split corrupts the selector.

#### C. `@layer` Rules Processing
- Lines 883–895:
  ```javascript
  let changed = true;
  while (changed) {
    changed = false;
    root.walkAtRules(atRule => {
      if (atRule.name === 'layer') {
        if (atRule.nodes && atRule.nodes.length > 0) {
          for (const child of [...atRule.nodes]) atRule.parent.insertBefore(atRule, child);
        }
        atRule.remove();
        changed = true;
      }
    });
  }
  ```
- **Issues**:
  - `@layer` declaration statements like `@layer base, components, utilities;` are stripped, but unwrapping `@layer components` at arbitrary locations in the document shifts rule precedence to source order.
  - If a framework relies on `@layer` cascade order overrides, unwrapping `@layer` without adjusting CSS order can alter specificity behavior.

---

### 3. CSS Custom Property (`var()`) Resolution Bug in Stateful Rules

#### A. Root Cause Analysis
- Lines 836–853 in `scopeAuthoredCss()`:
  ```javascript
  root.walkRules(rule => {
    if (isInsideKeyframes(rule)) return;
    rule.walkDecls(decl => {
      if (decl.value && decl.value.includes('var(')) {
        const firstSelector = rule.selectors[0];
        const clean = stripDynamicPseudo(firstSelector);
        const matchedNode = originalNodes.find(n => n && !this.isExtensionNode(n) && (safeMatches(n, firstSelector) || safeMatches(n, clean)));
        if (matchedNode) {
          try {
            const computed = global.getComputedStyle(matchedNode);
            const varVal = computed.getPropertyValue(decl.prop).trim();
            if (varVal) decl.value = varVal;
          } catch (_) {}
        }
      }
    });
  });
  ```
- **The Bug**:
  - When `rule` is `.btn:hover { color: var(--btn-hover-color); }`:
  - `matchedNode` is `.btn`.
  - `computed.getPropertyValue('color')` is called on `.btn` in its **default (non-hover)** state.
  - Returns `rgb(0, 0, 0)` (default color).
  - `decl.value` inside `.btn:hover` is replaced with `rgb(0, 0, 0)`.
  - **Result**: `.btn:hover` receives `color: rgb(0, 0, 0)`! The hover color becomes identical to the default color, completely disabling the hover visual state!

---

## Proposed Technical Recommendations

1. **Refined Rigid Pixel Cleaning**:
   - Create a dedicated helper `cleanPixelDimensions(css, elementTags)` that:
     - Distinguishes fixed media tags (`img`, `svg`, `canvas`, `video`, `audio`, `iframe`, `embed`, `object`, `picture`, `source`, `input`, `button`, `select`, `textarea`) and small icon containers from standard layout containers.
     - Strips or converts subpixel pixel dimensions on layout containers to fluid values (e.g. `max-width: 100%`, `height: auto`) or rounds subpixels (`257.98px` -> `258px`).
     - Cleans subpixels and rigid layout dimensions in both `scopeAuthoredCss()` and `inlineStyleCss()`.
2. **Robust Selector Matching & `:where()` Parsing**:
   - Replace naive `split(/[\s>+~]+/)` in `safeMatches()` with a balanced parentheses-aware and quote-aware parser (`splitCombinators()`).
   - Fix `char === '\\'` in `splitSelectorList()` so backslashes inside string quotes are preserved.
   - Enhance `stripDynamicPseudo()` to support vendor pseudo-elements and argument-bearing pseudo-classes without corrupting escaped class names.
3. **Correct CSS Variable Resolution**:
   - In `scopeAuthoredCss()`, extract custom property names from `var(--var-name)` and query `computed.getPropertyValue('--var-name')` instead of `computed.getPropertyValue(decl.prop)`.
   - Preserve `var()` fallback values when custom properties cannot be resolved.
4. **Enhanced `@layer` Handling**:
   - Ensure layer statements are cleanly removed and layer contents are unwrapped while maintaining correct cascade order.

---

## Verification & Test Strategy
- Run `npm test` to verify existing tests pass.
- Add test coverage for:
  - Non-media container rigid pixel dimension stripping vs media element pixel retention.
  - Selector matching with `:where(.a, .b)`, `:is()`, `:has()`, and attribute selectors containing commas/spaces.
  - Hover state CSS variable preservation (`.btn:hover { color: var(--hover-col); }`).
  - Escaped selector matching (`.hover\:bg-blue-500:hover`).
