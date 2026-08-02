# Analysis Report: CSS & Advanced Extraction Engine (`lib/extractor.js`)

**Agent**: Explorer 2  
**Milestone**: Milestone 1 (Code Extraction Accuracy Engine)  
**Target Files**: `lib/extractor.js`, `tests/extractor.test.js`  
**Date**: 2026-07-26  

---

## 1. Executive Summary

`lib/extractor.js` provides two distinct code extraction strategies:
1. **Authored CSS Scoping** (`scopeAuthoredCss` using PostCSS): Parses original stylesheet rules, matches them against DOM nodes using `safeMatches`, and retains responsive `@media` rules, `@keyframes`, `:hover`/`:focus` pseudo-states, and `@font-face` definitions.
2. **Computed Style Snapshot** (`buildSnapshotCss` & `getComputedStyleSnapshot`): Extracts computed CSS properties directly from the live DOM via `window.getComputedStyle`.

Our investigation revealed critical bugs, missing extraction logic, and parsing errors across all 6 core focus areas (pseudo-classes, pseudo-elements, `@keyframes`, responsive `@media` rules, SVG data-URLs / CSS masks, and CSS gradient clips).

---

## 2. Detailed Findings by Focus Area

### Area 1: Pseudo-Classes (`:hover`, `:focus`, `:active`, `:focus-visible`, etc.)

#### Finding 1.1: CSS Variable Resolution inside Pseudo-Class Rules Overwrites Values with Base Computed Values (CRITICAL)
- **File & Lines**: `lib/extractor.js:839-850`
- **Observation**:
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
- **Analysis**:
  When `decl.value` contains `var(...)` (e.g. `.btn:hover { background-color: var(--hover-bg); }`), the logic resolves `decl.prop` (`background-color`) by calling `getComputedStyle(matchedNode).getPropertyValue('background-color')`. Because `matchedNode` is in its default state (unhovered), `getComputedStyle` returns the **normal state** background color (e.g. `rgb(240, 240, 240)`).
  This overwrites `var(--hover-bg)` in the `:hover` rule with the normal state background color! Consequently, hover effects become visually identical to normal states.
- **Proposed Solution**:
  Instead of evaluating `decl.prop` (e.g. `background-color`) on the unhovered node, resolve the specific CSS variable names (e.g. `--hover-bg`) from computed styles using custom property lookup (`computed.getPropertyValue('--hover-bg')`), or preserve `var(--...)` if the variable definition itself is retained in the root CSS block.

#### Finding 1.2: Total Loss of Pseudo-Classes in Snapshot Mode
- **File & Lines**: `lib/extractor.js:910-945` (`buildSnapshotCss`), `1002-1091` (`getComputedStyleSnapshot`)
- **Observation**:
  Snapshot mode only queries `getComputedStyle(node)` for the base element state.
- **Analysis**:
  When `useAuthoredCss === false` or when external stylesheets cannot be accessed, pseudo-classes (`:hover`, `:focus`, `:active`, `:focus-visible`) are completely absent from the exported CSS.
- **Proposed Solution**:
  Provide fallback pseudo-class generation or document that interactive pseudo-states require authored CSS mode.

#### Finding 1.3: Dead Code `stateSuffix`
- **File & Lines**: `lib/extractor.js:316-322`
- **Observation**:
  `function stateSuffix(selector)` is declared but never referenced anywhere in `lib/extractor.js`.

#### Finding 1.4: Compound Selector Matching Inaccuracies in `safeMatches`
- **File & Lines**: `lib/extractor.js:290-305`
- **Observation**:
  ```javascript
  const parts = selector.trim().split(/[\s>+~]+/);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const lastClean = stripDynamicPseudo(last);
    try { if (element.matches(last) || element.matches(lastClean)) return true; } catch (_) {}
  }
  ```
- **Analysis**:
  If a selector is `.sidebar .card`, and `element` is `.card` located outside `.sidebar`, `parts[parts.length - 1]` is `.card`. `element.matches('.card')` returns `true`, causing rules from unrelated scopes/containers to be falsely captured.

---

### Area 2: Pseudo-Elements (`::before`, `::after`, `::placeholder`, etc.)

#### Finding 2.1: Snapshot Mode Misses Pseudo-Elements Beyond `::before`/`::after` and Uses Restrictive Property Subset
- **File & Lines**: `lib/extractor.js:932-943`
- **Observation**:
  ```javascript
  for (const pseudo of ['::before', '::after']) {
    let pseudoStyle;
    try { pseudoStyle = global.getComputedStyle(original, pseudo); } catch (_) { continue; }
    const content = pseudoStyle.getPropertyValue('content');
    if (!content || content === 'none' || content === 'normal') continue;
    const props = ['content', 'display', 'position', 'inset', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'margin', 'padding', 'color', 'background', 'border', 'border-radius',
      'font', 'opacity', 'transform', 'box-shadow'];
    // ...
  }
  ```
- **Analysis**:
  1. `buildSnapshotCss` ignores `::placeholder`, `::marker`, `::selection`, `::backdrop`, `::first-letter`, `::first-line`.
  2. The 20 hardcoded properties omit essential layout and styling properties: `flex`, `grid`, `align-items`, `justify-content`, `z-index`, `background-image`, `background-size`, `background-position`, `background-repeat`, `background-clip`, `-webkit-background-clip`, `pointer-events`, `cursor`, `transition`, `animation`, `clip-path`, `filter`, `backdrop-filter`, `fill`, `stroke`.
- **Proposed Solution**:
  Expand property extraction list for `::before` and `::after` to include layout, background-image, background-clip, mask, and filter properties.

#### Finding 2.2: Secondary Snapshot Method (`getComputedStyleSnapshot`) Completely Ignores Pseudo-Elements
- **File & Lines**: `lib/extractor.js:1002-1091`
- **Observation**:
  `getComputedStyleSnapshot` has no logic for `::before` or `::after`.

---

### Area 3: `@keyframes` Animations

#### Finding 3.1: Shorthand `animation` Parsing Strips Valid `@keyframes` Rules (CRITICAL BUG)
- **File & Lines**: `lib/extractor.js:820-827`
- **Observation**:
  ```javascript
  root.walkDecls(decl => {
    if (decl.parent?.type === 'atrule' && decl.parent.name === 'font-face') return;
    if (/^(?:-webkit-)?animation(?:-name)?$/i.test(decl.prop)) {
      String(decl.value).split(',').forEach(part => {
        const candidate = part.trim().split(/\s+/)[0];
        if (candidate && candidate !== 'none') usedAnimations.add(candidate);
      });
    }
    // ...
  });
  ```
- **Analysis**:
  For shorthand animation declarations like `animation: 3s ease-in-out 1s infinite spin;`, `part.trim().split(/\s+/)[0]` extracts the **first token**, which is `3s` (the duration), NOT `spin` (the keyframe name).
  `usedAnimations` gets populated with `'3s'`. Later, when filtering `@keyframes`:
  ```javascript
  if (name === 'keyframes' || name === '-webkit-keyframes') {
    if (!usedAnimations.has(atRule.params)) atRule.remove();
    return;
  }
  ```
  Since `usedAnimations.has('spin')` is `false`, the valid `@keyframes spin` rule is **STIPPED AND DELETED** from the CSS output!
- **Proposed Solution**:
  Parse `animation` shorthand declarations properly by discarding CSS time units (`s`, `ms`), timing functions (`ease`, `linear`, `cubic-bezier(...)`), iteration counts (`infinite`, numbers), directions (`normal`, `alternate`), and fill modes (`none`, `forwards`, `backwards`, `both`) to extract the actual animation-name candidate. Alternatively, inspect `style.animationName` from `window.getComputedStyle`.

#### Finding 3.2: URL Rewriting Skipped Inside `@keyframes` Steps
- **File & Lines**: `lib/extractor.js:836-837`
- **Observation**:
  `if (isInsideKeyframes(rule)) return;` prevents `rewriteCssUrls` from running inside `@keyframes` rules. Relative image or font URLs inside keyframes (e.g. `0% { background: url('./frame1.png'); }`) remain unrewritten.

#### Finding 3.3: Total Loss of Animations in Snapshot Mode
- **File & Lines**: `lib/extractor.js:910-945`
- **Observation**:
  Snapshot mode does not capture `@keyframes` at-rules.

---

### Area 4: Responsive `@media` Rules & Container Queries

#### Finding 4.1: Static Snapshot Mode Erases Responsive Breakpoints
- **File & Lines**: `lib/extractor.js:910-945`
- **Observation**:
  Snapshot mode evaluates computed styles at current viewport width and outputs flat class declarations. All `@media` queries (`min-width`, `max-width`), `@media (prefers-color-scheme: dark)`, and `@container` queries are discarded.

#### Finding 4.2: Lack of Support for Modern At-Rules (`@container`, `@supports`, `@starting-style`)
- **File & Lines**: `lib/extractor.js:859-882`
- **Observation**:
  `scopeAuthoredCss` handles `@media`, `@keyframes`, `@font-face`, and `@layer`, but has no explicit support or cleanup for `@container` (CSS Container Queries) or `@starting-style`.

---

### Area 5: Background SVG Data-URLs & CSS Masks

#### Finding 5.1: Missing CSS Mask Properties in `STYLE_PROPERTIES` and Snapshot Mode (CRITICAL)
- **File & Lines**: `lib/extractor.js:144-176` (`STYLE_PROPERTIES`), `1022-1032` (`getComputedStyleSnapshot`)
- **Observation**:
  `STYLE_PROPERTIES` lists background properties, but omits:
  - `mask`, `mask-image`, `mask-size`, `mask-position`, `mask-repeat`, `mask-clip`, `mask-origin`
  - `-webkit-mask`, `-webkit-mask-image`, `-webkit-mask-size`, `-webkit-mask-position`, `-webkit-mask-repeat`, `-webkit-mask-box-image`
- **Analysis**:
  Modern web components (e.g., Tailwind CSS icons `i-heroicons-...`, Lucide icons, Material icons, component libraries) heavily rely on CSS `mask-image` with inline SVG data-URLs to render icons.
  Because these properties are missing from `STYLE_PROPERTIES`, all CSS mask-based icons are **completely stripped** in snapshot extraction mode!
- **Proposed Solution**:
  Add `mask`, `mask-image`, `mask-size`, `mask-position`, `mask-repeat`, `-webkit-mask`, `-webkit-mask-image`, `-webkit-mask-size`, `-webkit-mask-position`, `-webkit-mask-repeat` to `STYLE_PROPERTIES` and snapshot property arrays.

#### Finding 5.2: Unquoted SVG Data-URLs with Parentheses Break `rewriteCssUrls` Regex
- **File & Lines**: `lib/extractor.js:228-237`
- **Observation**:
  ```javascript
  return String(css).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, raw) => ...
  ```
- **Analysis**:
  If an unquoted SVG data-URL contains parentheses (e.g., `url(data:image/svg+xml,...%28...%29)` or unencoded `(`, `)`), non-greedy `(.*?)` matches up to the first closing parenthesis `)`, corrupting the URL.

#### Finding 5.3: Unescaped `#` in SVG Data-URLs in Computed Style Output
- **File & Lines**: `lib/extractor.js:648`
- **Analysis**:
  When `getComputedStyle` returns an SVG data URL with unescaped `#` (e.g., `fill="#333"`), rendering it in raw CSS without quotes causes CSS parsers to interpret `#` as a hash fragment identifier.

---

### Area 6: CSS Gradient Clips

#### Finding 6.1: Missing `-webkit-background-clip` and `-webkit-text-fill-color` in `STYLE_PROPERTIES` (CRITICAL)
- **File & Lines**: `lib/extractor.js:144-176`
- **Observation**:
  `STYLE_PROPERTIES` contains `background-clip`, but missing `-webkit-background-clip` and `-webkit-text-fill-color`.
- **Analysis**:
  CSS gradient text techniques use:
  ```css
  background: linear-gradient(...);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  ```
  In snapshot mode (`buildSnapshotCss`), `computedDeclarations` omits `-webkit-background-clip` and `-webkit-text-fill-color`.
  Result: Gradient text renders with default opaque text color covering the background gradient.
- **Proposed Solution**:
  Add `-webkit-background-clip` and `-webkit-text-fill-color` to `STYLE_PROPERTIES`.

#### Finding 6.2: Indiscriminate Pixel Dimension Removal on Non-Media Elements
- **File & Lines**: `lib/extractor.js:660-665`, `1058-1061`
- **Observation**:
  ```javascript
  if (prop === 'width' || prop === 'height') {
    const isFixedMedia = ['IMG', 'CANVAS', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'INPUT'].includes(tag);
    if (!isFixedMedia) {
      if (value === 'auto' || value === '0px' || value.endsWith('px')) continue;
    }
  }
  ```
- **Analysis**:
  To meet Requirement 9 ("prevent hardcoded rigid pixel dimensions on layout containers"), the extractor discards ALL `px` width/height declarations on non-media elements in snapshot mode.
  This breaks fixed-dimension UI elements (e.g. 40px floating action buttons, 320px cards, 16px badge icons).
- **Proposed Solution**:
  Distinguish layout container elements (`DIV`, `SECTION`, `MAIN`, `ARTICLE`) from fixed-size UI components, or check whether explicit inline/authored width/height was set.

---

## 3. Summary Matrix of Findings & Impact

| # | Feature Area | Severity | Impact Summary | Affected Code |
|---|--------------|----------|----------------|---------------|
| 1.1 | Pseudo-Classes | HIGH | Overwrites `var()` in `:hover`/`:focus` rules with normal state computed color | `lib/extractor.js:839-850` |
| 1.2 | Pseudo-Classes | MEDIUM | Snapshot mode omits all pseudo-class rules (`:hover`, `:focus`) | `lib/extractor.js:910-945` |
| 1.3 | Pseudo-Classes | LOW | Unused dead code function `stateSuffix` | `lib/extractor.js:316-322` |
| 1.4 | Pseudo-Classes | MEDIUM | `safeMatches` fails on structural or custom pseudo-selectors | `lib/extractor.js:290-305` |
| 2.1 | Pseudo-Elements | MEDIUM | Snapshot mode misses pseudo-elements beyond `::before`/`::after` & excludes layout/bg props | `lib/extractor.js:932-943` |
| 3.1 | `@keyframes` | HIGH | Shorthand `animation` parsing extracts time string (`3s`) instead of name, stripping `@keyframes` | `lib/extractor.js:820-827` |
| 3.2 | `@keyframes` | MEDIUM | Relative URLs inside `@keyframes` steps are not rewritten | `lib/extractor.js:836-837` |
| 4.1 | Responsive Media | MEDIUM | Snapshot mode loses all `@media` breakpoints & dark mode queries | `lib/extractor.js:910-945` |
| 5.1 | SVG / CSS Masks | HIGH | Missing `mask-image` & `-webkit-mask` in `STYLE_PROPERTIES` strips all CSS mask icons | `lib/extractor.js:144-176` |
| 5.2 | SVG Data-URLs | MEDIUM | Unquoted SVG data-URLs with parentheses break URL rewrite regex | `lib/extractor.js:228-237` |
| 6.1 | Gradient Clips | HIGH | Missing `-webkit-background-clip` & `-webkit-text-fill-color` breaks text gradient clips | `lib/extractor.js:144-176` |
| 6.2 | Rigid Dimensions | MEDIUM | Blanket stripping of `px` width/height breaks fixed-size UI elements | `lib/extractor.js:660-665` |

---

## 4. Test Coverage Analysis (`tests/extractor.test.js`)

Current unit test suite contains 18 tests. Test coverage for advanced CSS features:
- **Authored CSS scoping** (Test 16): Tests basic `@keyframes`, `@font-face`, `:hover`, `::before`, `@media`. However, it uses `animation: spin 1s linear` (where name is first), masking Bug 3.1!
- **Missing Tests**:
  - Test for shorthand `animation` where duration comes first (e.g. `animation: 1s spin linear`).
  - Test for CSS variable resolution in `:hover` rules (Bug 1.1).
  - Test for CSS mask properties (`mask-image`, `-webkit-mask-image`) with SVG data-URLs.
  - Test for gradient text clipping (`-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`).
  - Test for unquoted SVG data-URLs with parentheses.

---

## 5. Verification Method

To verify these findings:
1. **Unit Test Reproduction**: Create targeted test cases in `tests/extractor.test.js` exercising:
   - Shorthand `animation: 1s ease spin;` scoping.
   - `:hover { color: var(--hover-color); }` scoping.
   - `mask-image` property preservation.
   - `-webkit-background-clip: text` preservation.
2. **Execute `npm test`**: Validate failure of bugs 1.1, 3.1, 5.1, 6.1 under new test assertions.
