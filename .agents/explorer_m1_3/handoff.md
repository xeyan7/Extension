# Handoff Report: Explorer 3 (Milestone 1)

**Working Directory**: `e:\Extension\My extension\.agents\explorer_m1_3`  
**Target Files**: `lib/extractor.js`, `tests/extractor.test.js`  
**Handoff Type**: Hard  

---

## 1. Observation

1. **Test Suite Status**: Executed `npm test` on `e:\Extension\My extension`. All 18 tests passed in 285ms.
   ```
   ✔ authored CSS scoping keeps responsive, state, pseudo, animation, and used font rules (33.2032ms)
   ✔ extractor output includes global box-sizing reset and processes SVG elements (3.3751ms)
   ℹ tests 18 | pass 18 | fail 0
   ```
2. **Dimension Filtering**:
   - `lib/extractor.js:660-665` & `lib/extractor.js:1058-1061`:
     ```javascript
     if (prop === 'width' || prop === 'height') {
       const isFixedMedia = ['IMG', 'CANVAS', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'INPUT'].includes(tag);
       if (!isFixedMedia) {
         if (value === 'auto' || value === '0px' || value.endsWith('px')) continue;
       }
     }
     ```
   - `lib/extractor.js:672-684` (`inlineStyleCss`):
     ```javascript
     blocks.push(`.uicc-s${index} {\n${declarations.map(item => {
       const value = rewriteCssUrls(item.value, this.baseUrl);
       return `  ${item.prop}: ${value}${item.important ? ' !important' : ''};`;
     }).join('\n')}\n}`);
     ```
     `inlineStyleCss` outputs all inline styles without dimension filtering.
3. **Compound Selector & `:where()` Matching**:
   - `lib/extractor.js:295-299`:
     ```javascript
     const parts = selector.trim().split(/[\s>+~]+/);
     if (parts.length > 1) {
       const last = parts[parts.length - 1];
       const lastClean = stripDynamicPseudo(last);
       try { if (element.matches(last) || element.matches(lastClean)) return true; } catch (_) {}
     }
     ```
   - `lib/extractor.js:270`:
     ```javascript
     else if (char === '\\') current += '';
     ```
4. **CSS Custom Property (`var()`) Resolution in Scoped Authored CSS**:
   - `lib/extractor.js:836-850`:
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

---

## 2. Logic Chain

1. **Observation 2** shows that while snapshot mode strips pixel `width`/`height` on non-media elements, `inlineStyleCss` and `scopeAuthoredCss` do not filter hardcoded pixel dimensions on non-media layout containers. Consequently, layout containers with inline styles or authored CSS rules retain rigid pixel dimensions like `width: 257.982px; height: 71.3281px`, destroying layout responsiveness.
2. **Observation 2** also shows that `isFixedMedia` omits `EMBED`, `OBJECT`, `PICTURE`, `SOURCE`, `BUTTON`, `SELECT`, `TEXTAREA`, and small icon wrapper elements. In snapshot mode, non-media icon containers lose `width`/`height` and collapse to 0x0.
3. **Observation 3** shows `safeMatches()` splits selectors on `[\s>+~]+`. When a selector contains `:where(.btn-a, .btn-b)` or attribute selectors with spaces, `split()` splits inside parentheses or brackets, producing invalid selector tokens like `'.btn-b)'`. `element.matches('.btn-b)')` throws a `SyntaxError`, resulting in valid rules being erroneously dropped. Additionally, `current += ''` on line 270 removes backslashes inside quoted strings in `splitSelectorList()`.
4. **Observation 4** shows `scopeAuthoredCss()` replaces `var()` values in declarations by fetching `computed.getPropertyValue(decl.prop)` from the matched DOM element in default state. For stateful rules (e.g. `.btn:hover { color: var(--btn-hover-color); }`), `getPropertyValue('color')` returns the default state color, overwriting the hover declaration with the default state color and destroying hover interactive styling.

---

## 3. Caveats

- **No Code Modifications**: As a read-only Explorer, no source files under `lib/` or `tests/` were modified.
- **Environment Context**: Unit tests run using Node.js test runner (`node --test`). DOM tests mock `globalThis.getComputedStyle` or run within DOM environments.

---

## 4. Conclusion

`lib/extractor.js` requires structural fixes before Milestone 1 implementation can be deemed 100% accurate:
1. Implement a dimension cleaner that strips/rounds rigid pixel values on non-media layout containers across authored and inline styles, while preserving essential dimensions on media tags (`img`, `svg`, `canvas`, `video`, `audio`, `iframe`, `embed`, `object`, `picture`, `source`, `input`, `button`, `select`, `textarea`) and fixed icon elements.
2. Upgrade `safeMatches()` to use balanced parentheses/quote-aware splitting, fix backslash escaping in `splitSelectorList()`, and support `:where()`, `:is()`, `:has()`, and escaped Tailwind selectors.
3. Fix `scopeAuthoredCss()` variable resolution to lookup custom property definitions (`--var-name`) rather than default-state computed property values (`decl.prop`).

---

## 5. Verification Method

1. **Run Unit Tests**:
   ```bash
   npm test
   ```
2. **Inspect Files**:
   - `lib/extractor.js` (lines 261-305 for selector matching, lines 640-685 & 1058-1065 for dimensions, lines 836-850 for CSS variable resolution).
   - `analysis.md` in `e:\Extension\My extension\.agents\explorer_m1_3\analysis.md`.
3. **Invalidation Conditions**:
   - If `npm test` fails after fixes.
   - If `:where(.a, .b)` rules are dropped during CSS scoping.
   - If `.btn:hover` color becomes identical to `.btn` default color after CSS scoping.
