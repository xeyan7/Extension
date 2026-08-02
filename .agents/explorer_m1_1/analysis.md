# Deep Analysis Report: CSS Custom Property Preservation & Resolution Engine

**Target Component**: `lib/extractor.js` & `tests/extractor.test.js`  
**Milestone**: Milestone 1 — 1:1 Code Extraction Accuracy Engine  
**Author**: Explorer 1  
**Date**: 2026-07-26  

---

## 1. Executive Summary

`lib/extractor.js` currently exhibits **critical implementation flaws** in handling CSS Custom Properties (`var(--...)` and `--*` declarations). Specifically, the current authored CSS scoping pipeline **blindly purges all `--*` custom property declarations** (`decl.remove()` at line 856), **removes all `:root` / `html` / `:host` CSS rules** because root selectors do not match extracted element nodes (lines 799–804), and **destructively overwrites `var(...)` expressions** with snapshot computed style values (lines 836–853).

This naive behavior breaks dynamic hover/focus states, corrupts shorthand properties (`padding`, `margin`, `border`), converts responsive `calc()` layouts into rigid pixel dimensions, breaks `@keyframes` animations referencing custom properties, and disables theme toggling across HTML, Vue, React, and Tailwind exports.

---

## 2. Code Architecture & Data Flow Analysis

### 2.1 CSS Processing Pipeline in `lib/extractor.js`
When `Extractor.extract(element, options)` is executed:
1. `cloneAndSanitize(element)` clones the DOM tree and strips script tags, extension UI elements, and inline `style="..."` attributes (line 575).
2. `collectAllCss()` gathers inline `<style>` rules and external `<link>` stylesheets.
3. `scopeAuthoredCss(element, originalNodes)` parses CSS with PostCSS:
   - **Step A: Rule Filtering (Lines 775–804)**: Checks if selectors match any node in `originalNodes` using `safeMatches`. Rules whose selectors do not match are removed.
   - **Step B: `var(...)` Resolution (Lines 836–853)**: For rules with `var(...)`, finds `matchedNode` via `rule.selectors[0]`, calls `global.getComputedStyle(matchedNode).getPropertyValue(decl.prop)`, and replaces `decl.value` with the computed value string.
   - **Step C: Custom Property Purging (Lines 855–857)**: Iterates over all declarations in remaining rules and deletes any property starting with `--`.
4. `inheritedRootCss(element)` generates root typography and background rules, but **never captures or passes through `--*` custom properties**.
5. Exporters (`toVue`, `toReact`, `toTailwind`) consume the resulting `css` string.

---

## 3. Detailed Findings & Flaw Matrix

### Flaw 1: Discarding of `:root`, `html`, and `:host` Variable Declarations
- **Location**: `lib/extractor.js`, lines 775–804 (`scopeAuthoredCss`)
- **Code Reference**:
  ```js
  root.walkRules(rule => {
    if (isInsideKeyframes(rule)) return;
    let parent = rule.parent;
    if (parent && parent.type === 'atrule' && parent.name === 'font-face') return;

    for (const selector of rule.selectors || []) {
      const clean = stripDynamicPseudo(selector);
      for (const node of originalNodes) {
        if (!node || this.isExtensionNode(node)) continue;
        if (safeMatches(node, selector) || safeMatches(node, clean)) {
          matchingSelectors.add(selector);
          break;
        }
      }
    }
  });
  ```
- **Mechanism**: `originalNodes` contains `element` (the selected component) and its internal descendants. It does **not** contain `document.documentElement` (`<html>`) or `document.body` (unless the user selects `<body>` / `<html>` directly).
- **Impact**: Standard global variable blocks like `:root { --primary-color: #3b82f6; --spacing: 16px; }` or `:host { --card-bg: #fff; }` fail `safeMatches` against component child nodes. Consequently, all `:root` and `:host` rules are **100% deleted** from the scoped CSS output.

---

### Flaw 2: Total Purging of Custom Property Declarations (`--*`)
- **Location**: `lib/extractor.js`, lines 855–857
- **Code Reference**:
  ```js
  root.walkDecls(decl => {
    if (decl.prop.startsWith('--')) decl.remove();
  });
  ```
- **Mechanism**: After `var(...)` replacement, PostCSS walks every remaining rule declaration and deletes any property starting with `--`.
- **Impact**:
  1. If a component defines scoped variables (e.g. `.card { --card-bg: #ffffff; }`), the variable declaration is destroyed.
  2. If a rule relies on variable mutation for states (e.g. `.card.active { --card-bg: #eff6ff; }`), the state modifier becomes useless.
  3. Modern utility frameworks (Tailwind CSS v4, Shoelace, Radix, Shadcn UI) that rely on CSS variables for color opacity, transforms, and elevation shadow fallbacks lose their foundational CSS variable definitions.

---

### Flaw 3: Destructive and Flawed `var(...)` Computed Value Replacement
- **Location**: `lib/extractor.js`, lines 836–853
- **Code Reference**:
  ```js
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
      if (decl.value && decl.value.includes('url(')) decl.value = rewriteCssUrls(decl.value, this.baseUrl);
    });
  });
  ```

This single block introduces **five distinct severe failure modes**:

#### Failure Mode 3A: Shorthand Property Lookup Failure (`padding`, `margin`, `border`, `background`, `flex`, `gap`)
- **Mechanism**: Browsers' `CSSStyleDeclaration.getPropertyValue('padding')` or `getPropertyValue('border')` returns an empty string `""` when queried for shorthand properties (because shorthand expansion requires querying longhands like `padding-top`, `padding-left`, etc.).
- **Result**: `varVal` is empty `""`. `decl.value` is left as `padding: var(--card-padding)`. But line 856 immediately deletes `--card-padding`! The exported CSS retains `padding: var(--card-padding)` pointing to a deleted variable, causing rendering to fail completely in preview/export.

#### Failure Mode 3B: Corrupting Interactive Pseudo-Classes (`:hover`, `:focus`, `:active`, `:disabled`)
- **Mechanism**: When processing a rule like `.btn:hover { color: var(--hover-color); }`, `firstSelector` is `.btn:hover`. `stripDynamicPseudo` strips `:hover` to yield `.btn`. `matchedNode` matches `.btn` in the DOM (which is unhovered). `getComputedStyle(matchedNode).getPropertyValue('color')` evaluates the **unhovered base color** of `.btn`!
- **Result**: `.btn:hover` color declaration is overwritten with `.btn`'s static unhovered color. Interactive visual states are completely ruined.

#### Failure Mode 3C: Replacing Responsive Fluid Layouts with Static Hardcoded Pixels
- **Mechanism**: If a container rule has `width: calc(100% - var(--sidebar-w, 240px));` or `gap: var(--grid-gap, 1.5rem)`, `getComputedStyle(matchedNode).getPropertyValue('width')` returns `742.391px`. `decl.value` is overwritten with `742.391px`.
- **Result**: Responsive fluid component layouts are converted into rigid hardcoded pixel widths, directly violating **Requirement 9** of `SCOPE.md` ("Prevent hardcoded rigid pixel dimensions on non-media elements / layout containers").

#### Failure Mode 3D: Orphaned `var(...)` in `@keyframes`
- **Mechanism**: Line 837 explicitly skips rules inside `@keyframes`: `if (isInsideKeyframes(rule)) return;`. Therefore, `var(...)` in keyframes (e.g. `@keyframes pulse { 0% { transform: scale(var(--start-scale)); } }`) is NOT replaced with a computed value. But line 856 deletes `--start-scale` globally!
- **Result**: Keyframe animations contain unresolved `var(...)` references with no variable definition, causing animations to break upon export.

#### Failure Mode 3E: Elimination of Fallback Values
- **Mechanism**: `decl.value = varVal` replaces the entire expression `var(--accent-color, #10b981)` with `rgb(16, 185, 129)`.
- **Result**: Component design system fallback values are completely wiped out.

---

### Flaw 4: SVG Custom Property Color Resolution Failure
- **Location**: `lib/extractor.js`, lines 46–58 (`resolveColor`) & 78–90 (`processSvgElement`)
- **Mechanism**: SVG elements inspect computed properties `fill`, `stroke`, `stop-color`. If an SVG attribute or style contains `var(--icon-color)`, `resolveColor` creates a detached dummy `<div>` and sets `dummy.style.color = value`. Because the dummy `<div>` is attached to `document.body` (outside the target component DOM hierarchy), it cannot inherit custom properties defined locally on ancestor components (e.g. `.card { --icon-color: #6366f1; }`).
- **Result**: SVG icons fail to resolve variable-based fill/stroke colors and default to fallback or empty attributes.

---

### Flaw 5: Snapshot CSS Mode Completely Ignores Custom Properties
- **Location**: `lib/extractor.js`, lines 144–176 (`STYLE_PROPERTIES`) & lines 910–945 (`buildSnapshotCss`)
- **Mechanism**: `STYLE_PROPERTIES` lists 130 standard CSS properties and zero `--*` custom properties. When `options.useAuthoredCss === false`, `buildSnapshotCss` queries only `STYLE_PROPERTIES`.
- **Result**: In fallback snapshot mode, custom property definitions are never captured or exported.

---

## 4. Impact Assessment Across Export Formats

| Format | Affected Engine Block | Impact Description | Severity |
| :--- | :--- | :--- | :--- |
| **Pure HTML + CSS** | `extract()` / `scopeAuthoredCss` | `:root` & `--*` variables deleted; shorthand properties broken; hover states corrupted to static values. | **CRITICAL** |
| **Vue SFC (`.vue`)** | `toVue()` | `<style scoped>` receives broken CSS with deleted custom properties, breaking themeable Vue components. | **HIGH** |
| **React JSX (`.jsx`)** | `toReact()` | `styles` template string contains invalid `var(...)` references and broken shorthand styles. | **HIGH** |
| **Tailwind CSS** | `toTailwind()` | Utility fallbacks relying on `--tw-*` variables lose variable definitions, breaking ring/shadow/transform utilities. | **HIGH** |

---

## 5. Architectural Recommendations & Fix Strategy

To establish a **1:1 Code Extraction Accuracy Engine** for CSS Custom Properties, the implementation must adopt a **Preservation-First with Smart Resolution Fallback** strategy:

### Recommendation 1: Preserve Needed Custom Property Declarations
1. **Variable Dependency Analysis**:
   - Parse authored CSS to extract all referenced variable names from `var(--var-name, ...)`.
   - Inspect `originalNodes` and ancestor elements (including `document.documentElement` / `:root`) to read declared `--var-name` custom properties using `getComputedStyle(node).getPropertyValue('--var-name')`.
2. **Preserve `:root` / `.exported-root` Custom Property Block**:
   - Construct a clean `:root, .exported-root { ... }` block containing all custom properties referenced by the component.
   - Include this block at the top of the generated CSS output.

### Recommendation 2: Preserve `var(...)` Expressions for Dynamic Rules
- Do **NOT** replace `var(...)` with static computed values for:
  - Rules with dynamic pseudo-classes (`:hover`, `:focus`, `:active`, `:disabled`).
  - Rules inside `@keyframes` or `@media`.
  - Layout properties (`width`, `height`, `flex-basis`, `gap`, `calc()`).
- Keep `var(--name, fallback)` in the CSS while ensuring `--name` is preserved in `:root, .exported-root`.

### Recommendation 3: Smart Direct Custom Property Reading for Static Declarations
- When resolving a custom property value for color/typography variables, query `getComputedStyle(matchedNode).getPropertyValue('--var-name')` directly from the DOM node (which inherits custom property values through the cascade) rather than querying `getPropertyValue(decl.prop)` on shorthand CSS properties.

---

## 6. Proposed New Test Cases for `tests/extractor.test.js`

1. **Test `:root` variable preservation**: Verify that `:root { --primary: #3b82f6; }` is preserved when an extracted element uses `color: var(--primary)`.
2. **Test shorthand property with `var()`**: Verify that `padding: var(--spacing)` is preserved along with `--spacing: 16px` declaration without resulting in `padding: undefined` or empty string.
3. **Test pseudo-class variable preservation**: Verify that `.button:hover { color: var(--hover-color); }` retains its distinct hover variable and does not overwrite hover color with base state color.
4. **Test `@keyframes` with `var()`**: Verify that `@keyframes` rules containing `var(...)` retain their variable references and corresponding `--*` definitions.
5. **Test fluid `calc(100% - var(--w))`**: Verify that fluid layout rules using `calc()` and `var()` are not converted to static rigid pixel dimensions (`px`).

