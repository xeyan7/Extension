# Handoff Report: CSS Custom Property Preservation & Extraction Engine Analysis

**Milestone**: Milestone 1 — 1:1 Code Extraction Accuracy Engine  
**Agent**: Explorer 1 (`explorer_m1_1`)  
**Date**: 2026-07-26  
**Working Directory**: `e:\Extension\My extension\.agents\explorer_m1_1`  
**Analysis File**: `e:\Extension\My extension\.agents\explorer_m1_1\analysis.md`  

---

## 1. Observation

### 1.1 Source Code Observations in `lib/extractor.js`
- **Line 856**: `root.walkDecls(decl => { if (decl.prop.startsWith('--')) decl.remove(); });`
  - *Direct Observation*: Deletes **all** CSS custom property declarations starting with `--` from authored CSS.
- **Lines 799–804**:
  ```js
  const kept = (rule.selectors || []).filter(s => matchingSelectors.has(s));
  if (kept.length === 0) {
    rule.remove();
  }
  ```
  - *Direct Observation*: Rules with selectors like `:root`, `html`, `:host`, `body` fail `safeMatches` against `originalNodes` (which only contains the target element and its children) and are removed from `root`.
- **Lines 836–853**:
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
  - *Direct Observation*: 
    1. Replaces `decl.value` with `computed.getPropertyValue(decl.prop)` for any declaration containing `var(`.
    2. Queries `getPropertyValue(decl.prop)` (the target property) rather than `getPropertyValue('--var-name')` (the custom property name).
    3. For pseudo-class rules (e.g. `.btn:hover`), `stripDynamicPseudo` strips `:hover` to `.btn`, causing `getComputedStyle` to evaluate against the non-hovered DOM state.
    4. For shorthand properties like `padding: var(--spacing)`, `getPropertyValue('padding')` returns `""` in browsers, leaving `padding: var(--spacing)` intact while line 856 purges `--spacing`.
    5. Rules inside `@keyframes` are skipped by line 837, leaving `var(...)` references in keyframes while line 856 purges the custom property definitions.
- **Lines 46–58 & 78–90**: SVG color resolution creates a detached dummy `<div>` on `document.body`, failing to resolve CSS variables defined on parent component containers.
- **Lines 144–176**: `STYLE_PROPERTIES` contains 130 standard CSS properties and zero `--*` custom properties.

### 1.2 Test Execution Results
- Command: `npm test`
- Result: 18 passed, 0 failed.
- Existing tests pass because no current unit test in `tests/extractor.test.js` tests CSS custom property preservation, `:root` variable handling, shorthand `var()` properties, hover variable mutation, or `@keyframes` variables.

---

## 2. Logic Chain

1. **Premise**: Milestone 1 requirement (in `SCOPE.md` Requirement 8 & 11) specifies: "Preserve original HTML classes, CSS custom properties (`var(--...)`), typography... CSS variable resolution: resolve color, opacity, and theme variables cleanly."
2. **Step 1 (Root Elimination)**: `scopeAuthoredCss` filters out `:root`, `html`, and `:host` rules because `originalNodes` only contains the component subtree. Therefore, global theme variables defined on `:root` are removed (Observation 1.1, lines 799–804).
3. **Step 2 (Property Purging)**: Line 856 unconditionally deletes all `--*` custom property declarations. Therefore, even if a rule matches the element, its custom properties are deleted (Observation 1.1, line 856).
4. **Step 3 (Naive Replacement Breakdown)**:
   - For shorthand properties (`padding`, `margin`, `border`), `getPropertyValue(decl.prop)` returns `""`. `var(...)` is not replaced, but `--*` is deleted by Line 856, leaving broken references (Observation 1.1, lines 836–853).
   - For `:hover` / `:focus` states, `stripDynamicPseudo` matches the normal state DOM node, overwriting hover state variables with normal state values (Observation 1.1, lines 836–853).
   - For `@keyframes`, keyframes rules are skipped during `var(...)` replacement, but `--*` definitions are deleted by line 856, breaking animation variables (Observation 1.1, lines 836–853).
   - For fluid layouts (`calc(100% - var(--gap))`), static pixel values overwrite responsive fluid expressions, violating SCOPE.md Requirement 9 (Observation 1.1, lines 836–853).
5. **Conclusion**: The current CSS custom property handling in `lib/extractor.js` is destructive, incomplete, and causes severe visual and functional defects across extracted components and multi-format exports.

---

## 3. Caveats

- **No Caveats**: The investigation fully analyzed `lib/extractor.js`, `tests/extractor.test.js`, `SCOPE.md`, and `PROJECT.md`. All findings are directly demonstrated by code snippets and executed test commands.

---

## 4. Conclusion

`lib/extractor.js` requires a targeted refactoring of its CSS Custom Property preservation and resolution pipeline. Specifically, the implementation should:
1. Collect referenced CSS custom properties from `:root`, `html`, `:host`, and ancestor elements and preserve them in a `:root, .exported-root { ... }` block.
2. Stop blanket-deleting `--*` custom property declarations (`decl.remove()` at line 856).
3. Preserve `var(...)` expressions for dynamic pseudo-states (`:hover`, `:focus`), `@keyframes`, `@media`, and responsive fluid layout properties (`width`, `height`, `calc()`).
4. Read `--var-name` directly from the DOM node (`getComputedStyle(node).getPropertyValue('--var-name')`) when variable resolution is needed.

---

## 5. Verification Method

To verify these findings and validate future fixes:
1. **Run Unit Tests**:
   ```bash
   npm test
   ```
2. **Inspect Scoped CSS Output**:
   Execute `scopeAuthoredCss` or `extract` on an HTML element that uses CSS variables (e.g. `:root { --bg: red; } .card { background: var(--bg); padding: var(--pad, 10px); } .card:hover { --bg: blue; }`).
3. **Check Invalidation Conditions**:
   - If output CSS contains `padding: var(--pad)` but no `--pad` declaration exists in `:root` or `.card`, the fix is invalid.
   - If `.card:hover` has its background color replaced with static `red` instead of keeping dynamic hover behavior or `--bg: blue`, the fix is invalid.
   - If `:root` variable definitions are completely missing from output CSS, the fix is invalid.

