# Handoff Report: Milestone 1 Code Extraction Accuracy Engine Analysis

**Agent**: Explorer 2  
**Milestone**: Milestone 1 (Code Extraction Accuracy Engine)  
**Working Directory**: `e:\Extension\My extension\.agents\explorer_m1_2`  
**Date**: 2026-07-26  

---

## 1. Observation

Direct observations from codebase inspection of `lib/extractor.js` and `tests/extractor.test.js`:

1. **CSS Variable Resolution in Pseudo Rules (`lib/extractor.js:839-850`)**:
   ```javascript
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
   ```
2. **Keyframe Name Extraction in Shorthand Animation (`lib/extractor.js:820-827`)**:
   ```javascript
   if (/^(?:-webkit-)?animation(?:-name)?$/i.test(decl.prop)) {
     String(decl.value).split(',').forEach(part => {
       const candidate = part.trim().split(/\s+/)[0];
       if (candidate && candidate !== 'none') usedAnimations.add(candidate);
     });
   }
   ```
3. **Keyframe Step URL Rewriting Skipped (`lib/extractor.js:836-837`)**:
   ```javascript
   root.walkRules(rule => {
     if (isInsideKeyframes(rule)) return;
     // URL rewriting skipped for keyframes...
   ```
4. **Missing Properties in `STYLE_PROPERTIES` (`lib/extractor.js:144-176`)**:
   `STYLE_PROPERTIES` contains 176 properties, but lacks `mask`, `mask-image`, `mask-size`, `mask-position`, `mask-repeat`, `-webkit-mask`, `-webkit-mask-image`, `-webkit-mask-size`, `-webkit-background-clip`, and `-webkit-text-fill-color`.
5. **Dead Code Function (`lib/extractor.js:316-322`)**:
   `function stateSuffix(selector)` is defined but never called.
6. **Pixel Width/Height Blanket Stripping (`lib/extractor.js:660-665`)**:
   ```javascript
   if (prop === 'width' || prop === 'height') {
     const isFixedMedia = ['IMG', 'CANVAS', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'INPUT'].includes(tag);
     if (!isFixedMedia) {
       if (value === 'auto' || value === '0px' || value.endsWith('px')) continue;
     }
   }
   ```
7. **Test Suite Execution Result**:
   `npm test` completed with 18 passes, 0 fails. Current unit tests do not test `animation` shorthand with duration leading, variable resolution in pseudo-rules, CSS mask properties, or text gradient clip properties.

---

## 2. Logic Chain

1. **Obs. 1 → Issue 1**: In `scopeAuthoredCss`, when resolving `decl.value` containing `var(...)` for a `:hover` rule (e.g. `.btn:hover { color: var(--hover-color); }`), `decl.prop` (`color`) is looked up on `matchedNode` via `computed.getPropertyValue('color')`. Because `matchedNode` is unhovered, this returns the normal state color, replacing `var(--hover-color)` with the base state color and breaking hover visual state differentiation.
2. **Obs. 2 → Issue 2**: In `scopeAuthoredCss`, parsing `animation: 1s ease spin;` takes `part.trim().split(/\s+/)[0]`, yielding `'1s'` instead of `'spin'`. `'1s'` is added to `usedAnimations`. Later, `@keyframes spin` is checked; since `usedAnimations.has('spin')` is `false`, the valid `@keyframes` rule is removed from the CSS output.
3. **Obs. 4 → Issue 3**: In snapshot extraction mode (`buildSnapshotCss`), computed style properties are filtered against `STYLE_PROPERTIES`. Because `mask-image`, `-webkit-mask-image`, `-webkit-background-clip`, and `-webkit-text-fill-color` are omitted from `STYLE_PROPERTIES`:
   - All CSS mask-based icons (Tailwind `i-...`, Lucide SVG masks) are dropped.
   - Text gradient clipping (`background-clip: text; -webkit-text-fill-color: transparent`) loses `-webkit-text-fill-color`, rendering opaque text over background gradients.
4. **Obs. 6 → Issue 4**: The blanket exclusion of any `px` `width`/`height` on non-media elements strips legitimate fixed-dimension container/component styles (e.g., 40px buttons, 320px cards).
5. **Obs. 7 → Conclusion**: Existing unit tests pass because edge cases (duration-first shorthand animations, hover CSS variables, mask images, gradient clips) are not currently covered in `tests/extractor.test.js`.

---

## 3. Caveats

- **Runtime DOM dependencies**: `scopeAuthoredCss` relies on `global.getComputedStyle` and `safeMatches` against a mock or real DOM tree. Some edge cases depend on browser-specific computed style representations.
- **PostCSS availability**: If PostCSS is not loaded in the runtime environment (`global.postcss` is undefined), `extract()` falls back to `buildSnapshotCss`, making snapshot mode defects (missing pseudo-classes, missing `@keyframes`, missing `@media`) directly visible.

---

## 4. Conclusion

`lib/extractor.js` requires targeted fixes in `scopeAuthoredCss`, `STYLE_PROPERTIES`, and `buildSnapshotCss` to achieve 1:1 extraction accuracy for advanced CSS:
1. **Fix `var()` variable resolution in `scopeAuthoredCss`** to query `--variable-name` instead of `decl.prop` on base nodes.
2. **Fix `animation` shorthand parsing** to correctly extract animation names regardless of duration/timing function positioning.
3. **Add CSS Mask & WebKit Gradient Clip properties** (`mask-image`, `-webkit-mask-image`, `-webkit-background-clip`, `-webkit-text-fill-color`) to `STYLE_PROPERTIES`.
4. **Enable URL rewriting inside `@keyframes` step rules**.
5. **Refine rigid pixel dimension stripping** to preserve intentional fixed component dimensions while preventing top-level layout container rigidity.
6. **Expand unit tests in `tests/extractor.test.js`** to validate all fixed behaviors.

---

## 5. Verification Method

1. **Inspect Report Files**:
   - `e:\Extension\My extension\.agents\explorer_m1_2\analysis.md`
   - `e:\Extension\My extension\.agents\explorer_m1_2\handoff.md`
2. **Run Test Suite**:
   - Run `npm test` from project root `e:\Extension\My extension`.
3. **Invalidation Conditions**:
   - If an `animation` shorthand declaration like `animation: 2s ease-in-out spin infinite;` results in `@keyframes spin` being removed from `scopeAuthoredCss` output.
   - If `.card:hover { color: var(--hover-text); }` output contains `.card:hover { color: rgb(...) }` where the color matches `.card { color: rgb(...) }` instead of `--hover-text`.
   - If `buildSnapshotCss` discards `-webkit-mask-image` or `-webkit-background-clip`.
