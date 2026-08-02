## 2026-07-26T02:40:30Z
<USER_REQUEST>
You are Worker 1 for Milestone 1 (Code Extraction Accuracy Engine).
Your working directory is: e:\Extension\My extension\.agents\worker_m1_1
Project root is: e:\Extension\My extension
Scope document: e:\Extension\My extension\.agents\m1_extraction_orch\SCOPE.md
Project document: e:\Extension\My extension\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission:
1. Initialize your BRIEFING.md and progress.md in your working directory `e:\Extension\My extension\.agents\worker_m1_1`.
2. Implement fixes and enhancements in `lib/extractor.js` and `tests/extractor.test.js` based on Explorer findings:
   a. **CSS Custom Property Preservation & Resolution**:
      - Preserve `:root`, `html`, `:host` declarations containing `--*` custom properties when scoping authored CSS instead of purging them.
      - Stop unconditionally deleting `--*` declarations (`decl.remove()`).
      - Fix `var(...)` resolution logic in `scopeAuthoredCss`: do not replace `var(...)` with `computed.getPropertyValue(decl.prop)` from default state which corrupts `:hover`/`:focus` colors and shorthand properties (`padding`, `margin`, `border`). Preserve `var(...)` declarations or resolve `--var-name` fallbacks accurately.
      - SVG `resolveColor`: resolve local component parent CSS variables properly.
      - Include custom properties (`--*`) in snapshot mode (`STYLE_PROPERTIES`).
   b. **Advanced CSS Features**:
      - Fix `:hover` and `:focus` pseudo-state variable resolution.
      - Fix animation shorthand parsing (e.g. `animation: 3s ease spin;` must parse `spin` as the keyframe name, not `3s`).
      - Add `mask-image`, `-webkit-mask-image`, `-webkit-background-clip`, `-webkit-text-fill-color` to `STYLE_PROPERTIES` to support CSS mask icons and text gradient clips in snapshot mode.
      - Ensure `rewriteCssUrls` applies to keyframes step declarations.
   c. **Rigid Pixel Dimension Removal**:
      - Filter out rigid subpixel hardcoded pixel dimensions (`width: 257.982px; height: 71.3281px`) on non-media elements / layout containers across authored CSS, inline styles, and snapshot CSS mode.
      - Expand fixed media tags list (`isFixedMedia`) to include `IMG`, `SVG`, `CANVAS`, `VIDEO`, `AUDIO`, `IFRAME`, `EMBED`, `OBJECT`, `PICTURE`, `SOURCE`, `INPUT`, `BUTTON`, `SELECT`, `TEXTAREA`, and fixed icon elements.
   d. **Robust Selector Matching**:
      - Fix `safeMatches()` selector parsing to be parenthesis, bracket, and quote aware so compound selectors, `:where()`, `:is()`, `:has()`, and attribute selectors with spaces (e.g. `[data-x="a b"]`) do not throw SyntaxError or drop valid rules.
      - Fix `splitSelectorList()` backslash escaping to preserve escaped Tailwind selectors (e.g., `.\31 0\/12`).
      - Preserve cascade order when unwrapping `@layer` rules.
   e. **Tests**:
      - Add thorough test cases in `tests/extractor.test.js` to cover all these features and edge cases.
      - Run `npm test` to verify 100% test pass.
3. Write `changes.md` and `handoff.md` in your working directory `e:\Extension\My extension\.agents\worker_m1_1` detailing code changes, test command, test output, and layout compliance.
4. Send a message to parent with your handoff report and test results.
</USER_REQUEST>
