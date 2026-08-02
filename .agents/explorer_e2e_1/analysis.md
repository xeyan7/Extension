# Requirement R1 Analysis & E2E Test Suite Design
**Agent**: `explorer_e2e_1`  
**Working Directory**: `e:\Extension\My extension\.agents\explorer_e2e_1`  
**Target Requirement**: R1: 1:1 Code Extraction Accuracy Engine  
**Date**: 2026-07-26  

---

## 1. Executive Summary & Codebase Assessment

The UI Component Copier extension extracts self-contained HTML and CSS from arbitrary web page elements across various frameworks and web standards. Requirement **R1 (1:1 Code Extraction Accuracy Engine)** demands visually exact, responsive, clean code extraction and export to multiple formats (HTML+CSS, Tailwind CSS, Vue SFC, React JSX).

### Inspected Codebase Artefacts
1. **`lib/extractor.js`**: Core `Extractor` class implementation.
   - `extract(element, options)`: Sanitizes DOM, scopes authored CSS via PostCSS, resolves CSS variables, processes inline SVGs, formats HTML, and outputs combined markup.
   - `toTailwind(element, extraction)`: Transforms extracted code to Tailwind utility classes via `global.fn` / `global.Ar` with fallback CSS.
   - `toVue(element, extraction)`: Formats output as Vue SFC (`<template>` + `<style scoped>`).
   - `toReact(element, extraction)`: Formats output as React JSX (`className`, camelCase attributes, escaped string templates, void element handling).
   - `scopeAuthoredCss(element, originalNodes)`: Scopes document CSS, matches selectors (`safeMatches`), resolves `var(...)` properties, handles `@font-face`, `@keyframes`, `@media`, and strips unused rules/variables.
   - `computedDeclarations()` / `getComputedStyleSnapshot()`: Extracts computed CSS declarations while filtering out rigid pixel dimensions (`width`/`height`) on non-media elements.
2. **`content.js`**: Chrome extension content script integration.
   - Coordinates `Extractor` invocation, PostCSS loading, stylesheet fetching (`fetchExternalStylesheets`), clipboard copying (`copyToClipboard`), and UI state management.
3. **`tests/extractor.test.js`**: Existing unit test suite (Node.js test runner).
   - Validates utility functions (`absoluteUrl`, `rewriteCssUrls`, `rewriteSrcset`, `stripBidiControls`, `escapeHtml`, `formatReactElement`) and basic authored CSS scoping.
4. **`tests/fixture.html`**: Test HTML page containing representative components (navigation, hero section, card, inline SVG, media queries, linear gradients, dynamic exports).

---

## 2. Feature Breakdown (13 Distinct R1 Capabilities)

From `ORIGINAL_REQUEST.md`, `SCOPE.md`, and codebase inspection, 13 distinct features were identified under Requirement R1:

| Ref ID | Feature Name | Description | Key Modules/Functions |
| :--- | :--- | :--- | :--- |
| **F01** | HTML+CSS Clean Extraction | Extracts sanitized HTML and scoped CSS with global reset, body inheritance, and indentation formatting. | `extract()`, `cloneAndSanitize()`, `formatElement()`, `inheritedRootCss()` |
| **F02** | Tailwind CSS Export | Converts extracted HTML+CSS into utility-first Tailwind classes with fallback CSS when needed. | `toTailwind()`, `generateTailwind()`, `global.fn`, `global.Ar` |
| **F03** | Vue SFC Export | Wraps extracted markup and scoped CSS into `<template>` and `<style scoped>` blocks. | `toVue()`, `generateVueSFC()` |
| **F04** | React JSX Export | Converts attributes to React JSX (`className`, `htmlFor`), camelCases SVG tags/attrs, escapes `{}`. | `toReact()`, `formatReactElement()`, `toReactAttribute()` |
| **F05** | CSS Custom Property Resolution | Resolves `var(--...)` variables to computed values and strips `--*` property declarations. | `scopeAuthoredCss()`, computed variable lookup |
| **F06** | SVG Background Data-URLs & Assets | Resolves relative asset URLs, inlines `blob:` data-URLs, sanitizes `javascript:`, preserves data-URIs. | `rewriteCssUrls()`, `inlineBlobCssUrls()`, `absoluteUrl()` |
| **F07** | CSS Gradient Clips | Retains `background-clip: text`, `-webkit-background-clip`, `-webkit-text-fill-color: transparent`, multi-stop gradients. | `STYLE_PROPERTIES`, `getComputedStyleSnapshot()` |
| **F08** | Flex/Grid Layouts | Preserves Flexbox (`display: flex`, `gap`, `flex-*`) and CSS Grid (`display: grid`, `grid-template-*`) structures. | `STYLE_PROPERTIES`, `DEFAULT_VALUES` |
| **F09** | Responsive `@media` Rules | Retains relevant media queries (`max-width`, `min-width`, `prefers-color-scheme`), strips print media. | `scopeAuthoredCss()` at-rule walker |
| **F10** | `@font-face` Font Rules | Tracks used `font-family` names, keeps matching `@font-face` definitions, rewrites font asset URLs. | `scopeAuthoredCss()`, `usedFonts` |
| **F11** | Pseudo-States (`:hover`, `:focus`, etc.) | Retains interaction pseudo-classes (`:hover`, `:focus`) and pseudo-elements (`::before`, `::after`). | `stripDynamicPseudo()`, `safeMatches()`, `buildSnapshotCss()` |
| **F12** | `@keyframes` Animations | Tracks used `animation-name` properties, preserves matching `@keyframes` blocks, strips unused animations. | `scopeAuthoredCss()`, `usedAnimations` |
| **F13** | Rigid Pixel Dimension Removal | Filters out fixed pixel width/height on non-media elements while strictly preserving on media tags (`img`, `svg`, `canvas`). | `computedDeclarations()`, `isFixedMedia` check |

---

## 3. Comprehensive E2E Test Suite Design (4-Tier Methodology)

Each of the 13 features is covered by **5 Tier 1 (Feature Coverage)** test cases and **5 Tier 2 (Boundary & Corner Cases)** test cases, yielding **130 test cases total**.

---

### Feature 1: HTML+CSS Clean Extraction (F01)

#### Tier 1: Feature Coverage
- **TC-R1-F01-01: Basic HTML+CSS Extraction Structure**
  - *Input*: Component with `div > h2 + p + button`.
  - *Steps*: Pass DOM node to `extractor.extract()`.
  - *Expected*: Returns object containing valid `html`, `css`, `combined`, `stats`. `html` is well-formatted. `css` includes `GLOBAL_RESET_CSS`.
  - *Invalidation*: `html` or `css` is empty or undefined.
- **TC-R1-F01-02: Global Reset CSS Inclusion**
  - *Input*: Standard DOM element.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Generated `css` contains `*, *::before, *::after { box-sizing: border-box; }` and `svg { fill: currentColor; }`.
  - *Invalidation*: Reset CSS block missing from `css`.
- **TC-R1-F01-03: DOM Sanitization of Script & Internal Tags**
  - *Input*: Element containing `<script>alert(1)</script>`, `<noscript>`, and `<link rel="preload">`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extracted HTML contains no `<script>`, `<noscript>`, or preload `<link>` tags.
  - *Invalidation*: Script or noscript tags present in output HTML.
- **TC-R1-F01-04: Extension UI Cleanup**
  - *Input*: DOM subtree containing extension elements (`#sd-toolbar`, `.uicc-selection-overlay`, `#uicc-toast`).
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: All extension UI elements are completely stripped from extracted HTML and CSS selectors.
  - *Invalidation*: Extension element IDs or overlay classes leak into output.
- **TC-R1-F01-05: Inherited Root CSS Resolution**
  - *Input*: Page body with `color: rgb(30, 40, 50); font-family: Georgia;`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS includes `body { color: ...; font-family: ...; }` or `.exported-root` inheritance rule.
  - *Invalidation*: Inherited root font/color declarations missing from CSS output.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F01-06: Formatting Void HTML Elements**
  - *Input*: Element containing `<img src="x">`, `<input type="text">`, `<br>`, `<hr>`, `<meta>`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Void tags are rendered self-closing or without closing tags (e.g. `<img ...>`, `<input ...>`), without invalid closing tags like `</img>`.
  - *Invalidation*: Invalid XML closing tags on void HTML elements.
- **TC-R1-F01-07: Form Control State Attribute Preservation**
  - *Input*: `<input type="checkbox" checked>`, `<option selected>`, `<details open>`, `<input value="hello">`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output HTML preserves boolean attributes `checked`, `selected`, `open`, and input `value`.
  - *Invalidation*: Checked or selected state lost upon extraction.
- **TC-R1-F01-08: Deeply Nested DOM Tree Handling**
  - *Input*: DOM tree nested 60 levels deep.
  - *Steps*: Call `extractor.extract(deepElement)`.
  - *Expected*: Extraction completes within 500ms without stack overflow or recursion error.
  - *Invalidation*: Call stack exceeded error or truncated tree.
- **TC-R1-F01-09: Removal of Dangerous Event Handlers & Attributes**
  - *Input*: `<button onclick="doBad()" contenteditable="true" nonce="123" draggable="true">`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Attributes `onclick`, `contenteditable`, `nonce`, `draggable` are removed from output HTML.
  - *Invalidation*: `onclick` or `contenteditable` retained in output HTML.
- **TC-R1-F01-10: Directional Bidi Control Character Strip**
  - *Input*: Text containing invisible bidi controls `\u202E` (Right-To-Left Override) alongside RTL text `مرحبا`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Bidi control characters `\u202E` are stripped while RTL Arabic characters `مرحبا` are preserved.
  - *Invalidation*: Bidi control characters remaining or Arabic text damaged.

---

### Feature 2: Tailwind CSS Export (F02)

#### Tier 1: Feature Coverage
- **TC-R1-F02-01: Basic Utility Class Mapping**
  - *Input*: Element with `padding: 16px; margin: 8px; background-color: rgb(255, 255, 255)`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Output HTML contains Tailwind classes like `p-4 m-2 bg-white`.
  - *Invalidation*: Raw inline CSS used when standard Tailwind utility exists.
- **TC-R1-F02-02: Flex Layout Tailwind Export**
  - *Input*: Flex container with `display: flex; flex-direction: row; justify-content: space-between; gap: 16px`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Class list includes `flex flex-row justify-between gap-4`.
  - *Invalidation*: Flex utility classes missing from container.
- **TC-R1-F02-03: Typography Tailwind Mapping**
  - *Input*: Heading with `font-size: 24px; font-weight: 700; color: rgb(79, 70, 229)`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Output classes include `text-2xl font-bold text-indigo-600` (or exact color match).
  - *Invalidation*: Typography classes omitted.
- **TC-R1-F02-04: Border & Radius Utility Mapping**
  - *Input*: Card with `border-radius: 16px; border: 1px solid rgb(229, 231, 235)`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Class list includes `rounded-2xl border border-gray-200`.
  - *Invalidation*: Border radius mapped incorrectly.
- **TC-R1-F02-05: Shadow Utility Mapping**
  - *Input*: Element with `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Output class list includes `shadow-lg` or arbitrary shadow bracket syntax `shadow-[...]`.
  - *Invalidation*: Shadow property dropped entirely.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F02-06: Fallback `<style>` Generation for Unmappable CSS**
  - *Input*: Element with complex multi-stop radial gradient background.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Unmappable CSS gradient is output in a `<style>` block appended after Tailwind HTML.
  - *Invalidation*: Gradient silently dropped without fallback style block.
- **TC-R1-F02-07: Arbitrary Value Syntax Handling**
  - *Input*: Element with custom width `margin-left: 17px; min-height: 312px`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Output uses Tailwind arbitrary brackets `ml-[17px] min-h-[312px]`.
  - *Invalidation*: Rounding to incorrect standard Tailwind scale.
- **TC-R1-F02-08: SVG Element Tailwind Processing**
  - *Input*: `<svg class="w-6 h-6 fill-current">` containing `<path>`.
  - *Steps*: Call `extractor.toTailwind(svgElement)`.
  - *Expected*: SVG width/height and fill properties map cleanly without removing SVG structural attributes.
  - *Invalidation*: SVG internal paths stripped or corrupted.
- **TC-R1-F02-09: Graceful Fallback When Converter Library Missing**
  - *Input*: `global.fn` or `global.Ar` undefined.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Gracefully returns combined HTML+CSS without throwing exception.
  - *Invalidation*: Unhandled error or crash.
- **TC-R1-F02-10: Hover State Tailwind Prefix Mapping**
  - *Input*: Button with `:hover { background-color: rgb(67, 56, 202); }`.
  - *Steps*: Call `extractor.toTailwind(element)`.
  - *Expected*: Class list includes `hover:bg-indigo-700`.
  - *Invalidation*: Hover state lost or mapped without `hover:` prefix.

---

### Feature 3: Vue SFC Export (F03)

#### Tier 1: Feature Coverage
- **TC-R1-F03-01: Vue SFC Section Structure**
  - *Input*: Standard web component element.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Output string begins with `<template>`, contains HTML, followed by `</template>\n\n<style scoped>`, CSS, and `</style>`.
  - *Invalidation*: Missing `<template>` or `<style scoped>` tags.
- **TC-R1-F03-02: Valid Markup inside `<template>`**
  - *Input*: Component with nav links and SVG icon.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Content inside `<template>` is valid HTML with preserved classes and structure.
  - *Invalidation*: Syntax errors inside template block.
- **TC-R1-F03-03: Scoped CSS Isolation**
  - *Input*: Component with custom CSS styles.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: `<style scoped>` section contains scoped selectors matching extracted HTML.
  - *Invalidation*: Style tag lacks `scoped` attribute.
- **TC-R1-F03-04: Multi-Element Component Root**
  - *Input*: Container element with multiple siblings.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Extracted template root is formatted cleanly (Vue 3 multi-root compliant).
  - *Invalidation*: Broken root tag wrapping.
- **TC-R1-F03-05: Clean Formatting & Indentation**
  - *Input*: Nested article component.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: HTML inside `<template>` is indented by 2 spaces per nest level.
  - *Invalidation*: Single-line output or mangled indentation.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F03-06: Special Character Escaping in Template**
  - *Input*: Element with text content `5 < 10 & 20 > 10`.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Text content is escaped as `5 &lt; 10 &amp; 20 &gt; 10`.
  - *Invalidation*: Unescaped `<` or `&` causing Vue template parse failure.
- **TC-R1-F03-07: Inline SVG with `<style>` Tag in Vue SFC**
  - *Input*: Component containing inline SVG with internal `<style>` block.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: SVG internal style block is either inlined or preserved without closing the parent `<style scoped>` tag prematurely.
  - *Invalidation*: Early closure of `<style scoped>` due to SVG style tag.
- **TC-R1-F03-08: Vue Template Void Tag Handling**
  - *Input*: Component with `<input type="text">`, `<img src="a.png">`.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Void tags conform to HTML5 template syntax.
  - *Invalidation*: Unclosed non-void tags.
- **TC-R1-F03-09: Component with Vue Directives (`v-if`, `v-for`)**
  - *Input*: Element containing existing `v-if` or `v-bind` attributes.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Vue directive attributes are preserved verbatim in output template.
  - *Invalidation*: Vue directives stripped during sanitization.
- **TC-R1-F03-10: Keyframes & Media Queries inside Scoped Style**
  - *Input*: Component with `@keyframes pulse` and `@media (max-width: 600px)`.
  - *Steps*: Call `extractor.toVue(element)`.
  - *Expected*: Keyframes and media queries are cleanly retained inside `<style scoped>`.
  - *Invalidation*: Keyframes stripped from Vue style section.

---

### Feature 4: React JSX Export (F04)

#### Tier 1: Feature Coverage
- **TC-R1-F04-01: React Component Wrapper Structure**
  - *Input*: Standard component element.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Output string defines `const styles = String.raw\`...\``, exports default function `CopiedComponent()`, inserts `<style>{styles}</style>`, and returns JSX.
  - *Invalidation*: Missing React component function or style declaration.
- **TC-R1-F04-02: Attribute Aliasing (`class` -> `className`, `for` -> `htmlFor`)**
  - *Input*: `<label for="email" class="form-label">Email</label>`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Output JSX uses `htmlFor="email"` and `className="form-label"`.
  - *Invalidation*: `class=` or `for=` present in JSX output.
- **TC-R1-F04-03: Self-Closing Void Elements in JSX**
  - *Input*: `<img src="logo.png">`, `<input type="text">`, `<br>`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Output JSX renders `<img src="logo.png" />`, `<input type="text" />`, `<br />`.
  - *Invalidation*: Unclosed void tags causing JSX parser error.
- **TC-R1-F04-04: SVG Tag CamelCasing**
  - *Input*: SVG element containing `<lineargradient>`, `<clippath>`, `<foreignobject>`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: JSX converts tags to `<linearGradient>`, `<clipPath>`, `<foreignObject>`.
  - *Invalidation*: Lowercase `<lineargradient>` in JSX output.
- **TC-R1-F04-05: SVG Attribute Aliasing**
  - *Input*: SVG with `stroke-width="2"`, `fill-rule="evenodd"`, `gradientUnits="userSpaceOnUse"`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: JSX attributes become `strokeWidth="2"`, `fillRule="evenodd"`, `gradientUnits="userSpaceOnUse"`.
  - *Invalidation*: Hyphenated attributes `stroke-width` in JSX.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F04-06: Curly Brace Escaping in JSX Text**
  - *Input*: Element with text content `object = { a: 1 }`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Literal `{` and `}` in text nodes are escaped to `&#123;` and `&#125;`.
  - *Invalidation*: Raw `{ a: 1 }` unescaped in JSX text causing parser error.
- **TC-R1-F04-07: Escaping Template Literal Backticks & Interpolation in CSS**
  - *Input*: Extracted CSS containing backticks ``` ` ``` or `${val}` syntax.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Backticks and `${` inside `String.raw\`...\`` are properly escaped (`\` ` and `\${`).
  - *Invalidation*: Unescaped `${` breaking template string execution.
- **TC-R1-F04-08: React Boolean Attributes Mapping**
  - *Input*: `<input readonly disabled autofocus required>`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: JSX uses `readOnly`, `disabled`, `autoFocus`, `required`.
  - *Invalidation*: `readonly` or `autofocus` in lowercase.
- **TC-R1-F04-09: React Pre & Textarea Tag Formatting**
  - *Input*: `<pre>line1\n  line2</pre>`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: Content inside `<pre>` preserves exact formatting without introducing extra JSX whitespace lines.
  - *Invalidation*: Mangled preformatted text lines.
- **TC-R1-F04-10: Custom Data and Aria Attributes**
  - *Input*: `<button data-testid="submit-btn" aria-expanded="true">`.
  - *Steps*: Call `extractor.toReact(element)`.
  - *Expected*: `data-testid` and `aria-expanded` retain hyphenated format (lowercase).
  - *Invalidation*: `dataTestid` or `ariaExpanded` camelCased improperly.

---

### Feature 5: CSS Custom Property (`var(--...)`) Resolution (F05)

#### Tier 1: Feature Coverage
- **TC-R1-F05-01: Single Variable Color Resolution**
  - *Input*: Authored CSS `.card { color: var(--text-color); }` where computed color is `rgb(31, 41, 55)`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: CSS output contains `color: rgb(31, 41, 55);`.
  - *Invalidation*: `var(--text-color)` left unresolved in output CSS.
- **TC-R1-F05-02: Fallback Variable Resolution**
  - *Input*: CSS `.btn { padding: var(--btn-padding, 12px 24px); }` with undefined `--btn-padding`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Resolved CSS uses fallback value `padding: 12px 24px;` or computed value.
  - *Invalidation*: Unresolved variable declaration.
- **TC-R1-F05-03: Variable Resolution in Typography**
  - *Input*: `font-family: var(--font-heading, Inter, sans-serif)`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS contains resolved font stack.
  - *Invalidation*: `var(--font-heading)` retained.
- **TC-R1-F05-04: Removal of Local `--*` Variable Declarations**
  - *Input*: CSS rule `.root { --primary: #6366f1; color: var(--primary); }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Resolved CSS contains `color: ...;` and `--primary: #6366f1;` is stripped.
  - *Invalidation*: Leftover `--primary` declaration in final scoped CSS.
- **TC-R1-F05-05: Variable Resolution in Gradient Backgrounds**
  - *Input*: `background: linear-gradient(90deg, var(--start-color), var(--end-color))`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS contains `background: linear-gradient(90deg, rgb(...), rgb(...));`.
  - *Invalidation*: Unresolved variables inside gradient string.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F05-06: Undefined Variable Without Fallback**
  - *Input*: `color: var(--non-existent-var)` with no computed value.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Variable is safely ignored or handled without crashing.
  - *Invalidation*: Unhandled exception during PostCSS declaration parsing.
- **TC-R1-F05-07: Variable Resolution on Pseudo-States**
  - *Input*: `.btn:hover { background-color: var(--hover-bg); }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `:hover` rule contains resolved computed color value.
  - *Invalidation*: Pseudo-state rule variable unresolved.
- **TC-R1-F05-08: Global Root Variable Inherited across Shadow DOM**
  - *Input*: Component inside Shadow DOM using root CSS variable.
  - *Steps*: Call `extractor.extract(shadowHostElement)`.
  - *Expected*: Computed style resolves host CSS variable accurately.
  - *Invalidation*: Blank or transparent color fallback.
- **TC-R1-F05-09: Variable Containing Comma-Separated Box Shadows**
  - *Input*: `--shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); box-shadow: var(--shadow);`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Resolved box-shadow declaration retains multi-shadow comma list.
  - *Invalidation*: Truncated shadow list after first comma.
- **TC-R1-F05-10: CSS Variable in `@media` Query Rule**
  - *Input*: `@media (max-width: 768px) { .card { padding: var(--mobile-pad); } }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Variable inside media query block is resolved cleanly.
  - *Invalidation*: Variable left unresolved inside media query.

---

### Feature 6: SVG Background Data-URLs & Asset URLs (F06)

#### Tier 1: Feature Coverage
- **TC-R1-F06-01: Relative Image URL Resolution**
  - *Input*: `background-image: url('../img/hero.png')` with `baseUrl = 'https://example.com/sub/page.html'`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Resolved CSS uses `url("https://example.com/img/hero.png")`.
  - *Invalidation*: Relative path retained or broken URL.
- **TC-R1-F06-02: Preservation of Existing Data-URLs**
  - *Input*: `background-image: url('data:image/svg+xml;base64,PHN2Zy...=')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `data:` URL is preserved intact without prepending base URL.
  - *Invalidation*: `https://example.com/data:image...` corruption.
- **TC-R1-F06-03: Image Srcset Candidate URL Resolution**
  - *Input*: `<img srcset="small.jpg 480w, /large.jpg 1024w">` with `baseUrl = 'https://example.com/blog/'`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `srcset` output contains `https://example.com/blog/small.jpg 480w, https://example.com/large.jpg 1024w`.
  - *Invalidation*: Missing descriptors (`480w`) or unresolved relative paths.
- **TC-R1-F06-04: Inlining `blob:` URLs in CSS & DOM**
  - *Input*: Element with `background-image: url('blob:https://example.com/1234')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `blob:` URL is converted to base64 `data:image/...` URL via `blobToDataUrl`.
  - *Invalidation*: Raw `blob:` URL left in exported CSS.
- **TC-R1-F06-05: Inline SVG Attribute & Dimensions Processing**
  - *Input*: `<svg viewBox="0 0 100 100">` without `width` or `height` attributes.
  - *Steps*: Call `extractor.extract(svgElement)`.
  - *Expected*: Extracted SVG clone gains computed `width="100"` and `height="100"` attributes derived from `viewBox` or bounding rect.
  - *Invalidation*: SVG extracted without width/height or viewBox.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F06-06: Malicious Protocol Sanitization in Asset URLs**
  - *Input*: `<img src="javascript:alert(1)">` or `background: url('javascript:void(0)')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `javascript:` URL is stripped, setting `src=""` or removing attribute.
  - *Invalidation*: Executable javascript protocol retained.
- **TC-R1-F06-07: SVG Icon Bounding Rect Fallback**
  - *Input*: `<svg>` with no `width`, `height`, or `viewBox`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extractor computes width/height via `getBoundingClientRect()` or defaults to `24x24`.
  - *Invalidation*: Extracted SVG rendered with 0 width or crashing.
- **TC-R1-F06-08: Failed Blob URL Resolution Fallback**
  - *Input*: Expired or unresolvable `blob:http://invalid`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `blob:` URL fails gracefully, leaving attribute blank or removing it without throwing error.
  - *Invalidation*: Unhandled promise rejection.
- **TC-R1-F06-09: SVG `url(#gradient-id)` Fill Resolution**
  - *Input*: `<path fill="url(#myGradient)">`.
  - *Steps*: Call `extractor.extract(svgElement)`.
  - *Expected*: `fill="url(#myGradient)"` is preserved verbatim without attempting to resolve as color.
  - *Invalidation*: `fill="url(#myGradient)"` overwritten with computed color.
- **TC-R1-F06-10: Quotes Escaping in CSS `url()` Strings**
  - *Input*: `background-image: url('https://example.com/img/"quoted".jpg')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Quotes inside CSS URL strings are escaped (`url("https://example.com/img/\"quoted\".jpg")`).
  - *Invalidation*: Broken CSS syntax due to unescaped double quotes.

---

### Feature 7: CSS Gradient Clips (F07)

#### Tier 1: Feature Coverage
- **TC-R1-F07-01: Text Gradient Clip Extraction**
  - *Input*: Heading with `background: linear-gradient(to right, #4f46e5, #06b6d4); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Generated CSS retains `background-clip`, `-webkit-background-clip`, and `-webkit-text-fill-color`.
  - *Invalidation*: `-webkit-background-clip` or `-webkit-text-fill-color` omitted.
- **TC-R1-F07-02: Multi-Stop Linear Gradient Preservation**
  - *Input*: `background: linear-gradient(90deg, red 0%, yellow 50%, blue 100%)`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: All gradient color stops and angles are preserved in final CSS.
  - *Invalidation*: Color stops truncated to 2 colors.
- **TC-R1-F07-03: Radial Gradient Extraction**
  - *Input*: `background: radial-gradient(circle at 50% 50%, #ffffff 0%, #000000 100%)`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS contains exact radial-gradient declaration.
  - *Invalidation*: Radial gradient converted to solid color.
- **TC-R1-F07-04: Conic Gradient Extraction**
  - *Input*: `background: conic-gradient(from 90deg, #ff0000, #00ff00, #0000ff)`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Conic-gradient declaration preserved in output CSS.
  - *Invalidation*: Conic gradient dropped.
- **TC-R1-F07-05: Gradient Extraction in Snapshot Mode**
  - *Input*: Element with background gradient passed to `getComputedStyleSnapshot(element)`.
  - *Steps*: Call `extractor.getComputedStyleSnapshot(element)`.
  - *Expected*: Snapshot inline style attribute includes `background` or `background-image` gradient declaration.
  - *Invalidation*: Snapshot background missing gradient string.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F07-06: Gradient Clip on Pseudo-Element**
  - *Input*: `.badge::before { background: linear-gradient(...); -webkit-background-clip: text; }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Gradient clip properties are retained in `::before` pseudo-element rule.
  - *Invalidation*: Pseudo-element gradient clip stripped.
- **TC-R1-F07-07: Layered Background Image + Gradient**
  - *Input*: `background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('bg.jpg')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Multi-layer background image declaration is preserved with resolved URL.
  - *Invalidation*: Gradient layer stripped, leaving only image URL.
- **TC-R1-F07-08: Transparent Text Fill Color Handling**
  - *Input*: `color: transparent; -webkit-text-fill-color: transparent`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `color: transparent` or `rgba(0,0,0,0)` is preserved alongside background clip so text remains visible via gradient.
  - *Invalidation*: Transparent color replaced with default black text.
- **TC-R1-F07-09: Gradient Clip on Inline `<span>` Element**
  - *Input*: Inline `<span>` with text gradient clip inside paragraph.
  - *Steps*: Call `extractor.extract(spanElement)`.
  - *Expected*: `display: inline-block` or inline gradient clip properties extracted correctly.
  - *Invalidation*: Span layout broken.
- **TC-R1-F07-10: Vendor-Prefixed vs Standard Background Clip Order**
  - *Input*: CSS with both `-webkit-background-clip: text` and `background-clip: text`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Both vendor-prefixed and standard declarations are output to ensure cross-browser fidelity.
  - *Invalidation*: Prefixed property removed when standard property is present.

---

### Feature 8: Flex/Grid Layouts (F08)

#### Tier 1: Feature Coverage
- **TC-R1-F08-01: Flexbox Container Properties**
  - *Input*: Element with `display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 20px`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extracted CSS preserves all flex container declarations.
  - *Invalidation*: `gap` or `justify-content` missing.
- **TC-R1-F08-02: Flex Item Sizing Properties**
  - *Input*: Flex child with `flex: 1 0 300px; order: 2; align-self: flex-end`.
  - *Steps*: Call `extractor.extract(childElement)`.
  - *Expected*: Extracted CSS preserves `flex-grow`, `flex-shrink`, `flex-basis`, `order`, `align-self`.
  - *Invalidation*: `flex` properties filtered out.
- **TC-R1-F08-03: CSS Grid Template Columns & Rows**
  - *Input*: Element with `display: grid; grid-template-columns: 200px 1fr 2fr; grid-template-rows: auto 1fr`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extracted CSS preserves `grid-template-columns` and `grid-template-rows`.
  - *Invalidation*: Grid columns converted to block layout.
- **TC-R1-F08-04: CSS Grid Item Placement**
  - *Input*: Grid child with `grid-column: 1 / 3; grid-row: 2 / span 2`.
  - *Steps*: Call `extractor.extract(childElement)`.
  - *Expected*: Extracted CSS includes `grid-column` and `grid-row` placement.
  - *Invalidation*: Grid placement declarations lost.
- **TC-R1-F08-05: Gap Property in Flex & Grid**
  - *Input*: Element with `display: flex; gap: 16px 24px` (`row-gap: 16px; column-gap: 24px`).
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `gap`, `row-gap`, or `column-gap` preserved in final CSS.
  - *Invalidation*: Gap properties filtered as default values.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F08-06: Deeply Nested Flex-Inside-Grid Layout**
  - *Input*: Grid layout containing flex containers containing flex children.
  - *Steps*: Call `extractor.extract(rootGrid)`.
  - *Expected*: Every level of the layout hierarchy retains its respective flex or grid CSS properties.
  - *Invalidation*: Inner flex properties dropped.
- **TC-R1-F08-07: Grid Implicit Flow & Minmax Tracks**
  - *Input*: `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); grid-auto-flow: dense`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Complex `minmax` and `auto-fit` column definitions are preserved verbatim.
  - *Invalidation*: `repeat(...)` function expanded incorrectly or dropped.
- **TC-R1-F08-08: Flexbox `flex-wrap: wrap-reverse`**
  - *Input*: Flex container with `flex-wrap: wrap-reverse`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `flex-wrap: wrap-reverse` is preserved in output CSS.
  - *Invalidation*: `flex-wrap` reset to `nowrap`.
- **TC-R1-F08-09: Grid Subgrid Layout**
  - *Input*: Grid item with `grid-template-columns: subgrid`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `subgrid` value preserved in output CSS.
  - *Invalidation*: Subgrid property stripped.
- **TC-R1-F08-10: Alignment Defaults Filtering**
  - *Input*: Element with `align-items: stretch; justify-content: flex-start`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Default flex alignment values (`stretch`, `flex-start`) are omitted or included cleanly without breaking layout.
  - *Invalidation*: Inconsistent flex display rendering.

---

### Feature 9: Responsive `@media` Rules (F09)

#### Tier 1: Feature Coverage
- **TC-R1-F09-01: Responsive `@media (max-width: 768px)` Extraction**
  - *Input*: Authored CSS containing `@media (max-width: 768px) { .card { flex-direction: column; } }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Generated CSS includes `@media (max-width: 768px)` block wrapping `.card` rule.
  - *Invalidation*: Media query block dropped.
- **TC-R1-F09-02: Desktop Viewport `@media (min-width: 1024px)` Rule**
  - *Input*: Authored CSS containing `@media (min-width: 1024px) { .card { display: grid; } }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Generated CSS retains `@media (min-width: 1024px)` block.
  - *Invalidation*: Min-width media query stripped.
- **TC-R1-F09-03: Dark Mode `@media (prefers-color-scheme: dark)` Rule**
  - *Input*: Authored CSS with `@media (prefers-color-scheme: dark) { .card { background: #1f2937; } }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: `prefers-color-scheme: dark` media query retained in output CSS.
  - *Invalidation*: Color scheme media query removed.
- **TC-R1-F09-04: Removal of `@media print` Queries**
  - *Input*: Authored CSS containing `@media print { .card { display: none; } }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: `@media print` rule is completely removed from extracted CSS.
  - *Invalidation*: Print styles present in output CSS.
- **TC-R1-F09-05: Removal of Unmatched Media Query Blocks**
  - *Input*: Authored CSS `@media (max-width: 600px) { .unrelated-sidebar { width: 100%; } }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Empty media query block (since `.unrelated-sidebar` is not in extracted DOM) is purged.
  - *Invalidation*: Empty `@media` block left in output.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F09-06: Compound Media Queries with Logical Operators**
  - *Input*: `@media screen and (min-width: 480px) and (max-width: 960px)`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Full compound media query condition string is preserved intact.
  - *Invalidation*: Media query condition truncated.
- **TC-R1-F09-07: Nested Media Query At-Rules**
  - *Input*: Media query containing `@supports (display: grid)`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Nested at-rule structure retained or unnested cleanly without syntax errors.
  - *Invalidation*: PostCSS parse crash on nested at-rules.
- **TC-R1-F09-08: Media Query Targetting Pseudo-States**
  - *Input*: `@media (hover: hover) { .btn:hover { background: blue; } }`.
  - *Steps*: Call `extractor.extract(btnElement)`.
  - *Expected*: Media query wrapping `.btn:hover` pseudo-state rule preserved.
  - *Invalidation*: Pseudo-state inside media query dropped.
- **TC-R1-F09-09: Modern Range Syntax Media Queries**
  - *Input*: `@media (width >= 768px) and (width <= 1200px)`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Modern range syntax media query preserved without syntax corruption.
  - *Invalidation*: PostCSS error on range syntax.
- **TC-R1-F09-10: Multiple Identical Media Queries Pruning**
  - *Input*: Authored CSS with 3 separate `@media (max-width: 768px)` blocks for different matching sub-elements.
  - *Steps*: Call `extractor.extract(parentElement)`.
  - *Expected*: Generated CSS includes media query blocks cleanly without invalid nesting.
  - *Invalidation*: Broken CSS syntax from duplicate at-rule merging.

---

### Feature 10: `@font-face` Font Rules (F10)

#### Tier 1: Feature Coverage
- **TC-R1-F10-01: Used `@font-face` Rule Retention**
  - *Input*: Document contains `@font-face { font-family: 'CustomFont'; src: url('./cf.woff2'); }`. Component element uses `font-family: 'CustomFont', sans-serif`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS includes `@font-face` definition for `'CustomFont'`.
  - *Invalidation*: `@font-face` rule stripped.
- **TC-R1-F10-02: Asset URL Resolution inside `@font-face`**
  - *Input*: `@font-face { font-family: 'CustomFont'; src: url('../fonts/cf.woff2'); }` with `baseUrl = 'https://cdn.example.com/styles/main.css'`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output `@font-face` uses `src: url("https://cdn.example.com/fonts/cf.woff2")`.
  - *Invalidation*: Relative path retained.
- **TC-R1-F10-03: Stripping Unused `@font-face` Rules**
  - *Input*: Document contains `@font-face` for `'UnusedFont'`. Component uses only `Arial`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS contains no `@font-face` rule for `'UnusedFont'`.
  - *Invalidation*: Unused `@font-face` rules bloat output CSS.
- **TC-R1-F10-04: Multiple Font Sources (`format('woff2')`, `format('woff')`)**
  - *Input*: `@font-face` with `src: url('a.woff2') format('woff2'), url('a.woff') format('woff')`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: All font source candidates in `src` list have their URLs resolved and formats retained.
  - *Invalidation*: Second font URL candidate dropped.
- **TC-R1-F10-05: Preservation of Font Variant Descriptors**
  - *Input*: `@font-face` with `font-weight: 700; font-style: italic; font-display: swap;`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output `@font-face` retains `font-weight`, `font-style`, and `font-display`.
  - *Invalidation*: `font-weight` or `font-display` missing from `@font-face`.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F10-06: Case-Insensitive & Quoted Font Family Matching**
  - *Input*: `@font-face { font-family: "Brand Font"; ... }` vs element style `font-family: 'brand font', sans-serif`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extractor matches font family case-insensitively and retains `@font-face`.
  - *Invalidation*: Font matching fails due to quotes or uppercase differences.
- **TC-R1-F10-07: Fallback System Fonts Stack**
  - *Input*: Element style `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: No errors or invalid `@font-face` lookups triggered for system font stack keywords.
  - *Invalidation*: Failed extraction or attempt to fetch web fonts for system keywords.
- **TC-R1-F10-08: Font Used Only in Pseudo-Element**
  - *Input*: Component root has standard font, but `::before` uses `font-family: 'IconFont'`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Extractor detects `'IconFont'` usage in pseudo-element and retains corresponding `@font-face`.
  - *Invalidation*: Icon font `@font-face` stripped because main DOM element didn't list it.
- **TC-R1-F10-09: Local Font References (`src: local(...)`)**
  - *Input*: `@font-face { font-family: 'MyFont'; src: local('MyFont Bold'), url('font.woff2'); }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `local(...)` reference preserved intact while `url(...)` is resolved.
  - *Invalidation*: `local(...)` string corrupted.
- **TC-R1-F10-10: Font Feature Values At-Rule Stripping**
  - *Input*: Document CSS containing `@font-feature-values FontName { ... }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `@font-feature-values` at-rule is safely stripped to keep CSS clean.
  - *Invalidation*: Unsupported at-rule causing CSS output bloat.

---

### Feature 11: Pseudo-States (`:hover`, `:focus`, `::before`, `::after`) (F11)

#### Tier 1: Feature Coverage
- **TC-R1-F11-01: `:hover` Interactive State CSS Preservation**
  - *Input*: Button with `.btn:hover { background-color: #4338ca; transform: translateY(-1px); }`.
  - *Steps*: Call `extractor.extract(btnElement)`.
  - *Expected*: Generated CSS output retains `.btn:hover` selector and properties.
  - *Invalidation*: `:hover` rule omitted from CSS.
- **TC-R1-F11-02: `:focus` and `:focus-visible` Outline Styles**
  - *Input*: Input field with `:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }`.
  - *Steps*: Call `extractor.extract(inputElement)`.
  - *Expected*: Output CSS retains `:focus-visible` rule.
  - *Invalidation*: Focus states stripped.
- **TC-R1-F11-03: `::before` Pseudo-Element Extraction**
  - *Input*: Card with `.card::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.5); }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Generated CSS output retains `.card::before` rule with `content` property.
  - *Invalidation*: `::before` rule or `content` property missing.
- **TC-R1-F11-04: `::after` Pseudo-Element Extraction**
  - *Input*: Link with `a::after { content: " →"; color: currentColor; }`.
  - *Steps*: Call `extractor.extract(linkElement)`.
  - *Expected*: Generated CSS retains `::after` pseudo-element rule.
  - *Invalidation*: `::after` pseudo-element missing.
- **TC-R1-F11-05: Snapshot CSS Mode Pseudo-Element Styles**
  - *Input*: Component with computed `::before` styles extracted via `buildSnapshotCss(nodes)`.
  - *Steps*: Call `extractor.buildSnapshotCss(nodes)`.
  - *Expected*: `pseudoCss` array includes `.uicc-c0::before { content: ...; display: ...; }`.
  - *Invalidation*: Snapshot CSS mode misses computed pseudo-element styles.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F11-06: Compound Pseudo-State Selectors**
  - *Input*: `.card:hover .card-title { color: #6366f1; }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Selector matching checks `.card` and `.card-title`, retaining `.card:hover .card-title` in output CSS.
  - *Invalidation*: Selector stripped because element itself doesn't match `.card:hover .card-title`.
- **TC-R1-F11-07: Pseudo-Element Dynamic Interaction State**
  - *Input*: `.btn:hover::before { opacity: 1; transform: scale(1.05); }`.
  - *Steps*: Call `extractor.extract(btnElement)`.
  - *Expected*: Combined `.btn:hover::before` rule preserved in output CSS.
  - *Invalidation*: Pseudo-element hover rule lost.
- **TC-R1-F11-08: Pseudo-Classes inside `:is()` and `:where()` Functional Pseudo-Classes**
  - *Input*: `:where(.btn, .link):hover { opacity: 0.8; }`.
  - *Steps*: Call `extractor.extract(btnElement)`.
  - *Expected*: `stripDynamicPseudo()` and `safeMatches()` handle nested functional pseudo-classes and preserve the rule.
  - *Invalidation*: `:where()` rule dropped during CSS scoping.
- **TC-R1-F11-09: Dynamic Pseudo-Class Stripping for Selector Matching**
  - *Input*: Selector `.menu-item:active:focus:hover`.
  - *Steps*: Test `stripDynamicPseudo('.menu-item:active:focus:hover')`.
  - *Expected*: Returns `.menu-item`, enabling safe element matching against DOM while keeping original selector in CSS.
  - *Invalidation*: `stripDynamicPseudo` returns empty string or malformed selector.
- **TC-R1-F11-10: Pseudo-Element Content with Unicode Icons**
  - *Input*: `.icon::before { content: "\f00c"; font-family: "FontAwesome"; }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Unicode icon string in `content` property is escaped cleanly without string corruption.
  - *Invalidation*: Mangled unicode content in output CSS.

---

### Feature 12: `@keyframes` Animations (F12)

#### Tier 1: Feature Coverage
- **TC-R1-F12-01: Standard `@keyframes` Animation Retention**
  - *Input*: Component style `.spinner { animation: spin 1s linear infinite; }` and `@keyframes spin { to { transform: rotate(360deg); } }`.
  - *Steps*: Call `extractor.extract(spinnerElement)`.
  - *Expected*: Extracted CSS retains `@keyframes spin` block.
  - *Invalidation*: Keyframe animation block removed.
- **TC-R1-F12-02: `animation-name` Specific Declaration Retention**
  - *Input*: `.fade { animation-name: fadeIn; animation-duration: 0.3s; }` and `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`.
  - *Steps*: Call `extractor.extract(fadeElement)`.
  - *Expected*: Extracted CSS retains `@keyframes fadeIn`.
  - *Invalidation*: Keyframes for `animation-name` property dropped.
- **TC-R1-F12-03: Stripping Unused `@keyframes` Animations**
  - *Input*: Document CSS contains `@keyframes unusedAnim { ... }`. Component uses no animations or only `spin`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Output CSS contains no `@keyframes unusedAnim` block.
  - *Invalidation*: Unused keyframes remaining in CSS.
- **TC-R1-F12-04: Vendor-Prefixed `@-webkit-keyframes` Support**
  - *Input*: CSS with `@-webkit-keyframes pulse { 0% { opacity: 1; } }` referenced by `-webkit-animation: pulse 2s`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `-webkit-keyframes pulse` block is retained in output CSS.
  - *Invalidation*: Prefixed keyframe rule stripped.
- **TC-R1-F12-05: Multi-Step Keyframe Percentages**
  - *Input*: `@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: All percentage step selectors (`0%, 20%...`) preserved intact.
  - *Invalidation*: Keyframe steps missing or corrupted.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F12-06: Multiple Comma-Separated Animations**
  - *Input*: `.badge { animation: fadeIn 0.5s, pulse 2s infinite; }`.
  - *Steps*: Call `extractor.extract(badgeElement)`.
  - *Expected*: Extractor tracks both `fadeIn` and `pulse` in `usedAnimations` and retains both `@keyframes` blocks.
  - *Invalidation*: Only first animation retained; second `@keyframes` stripped.
- **TC-R1-F12-07: Keyframe Animation Triggered Only on `:hover`**
  - *Input*: Base style `.card { opacity: 1; }` and hover style `.card:hover { animation: shake 0.5s; }`.
  - *Steps*: Call `extractor.extract(cardElement)`.
  - *Expected*: Extractor detects `shake` animation referenced inside `:hover` rule and retains `@keyframes shake`.
  - *Invalidation*: Keyframes stripped because static element computed style listed `animation-name: none`.
- **TC-R1-F12-08: CSS Variables inside `@keyframes` Declarations**
  - *Input*: `@keyframes slide { from { transform: translateX(var(--start)); } }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: CSS variable inside keyframes rule is resolved or preserved cleanly.
  - *Invalidation*: Keyframe rule removed or PostCSS error.
- **TC-R1-F12-09: Floating Point Percentage Keyframe Stops**
  - *Input*: `@keyframes shimmer { 33.3% { background-position: 100% 0; } }`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Floating point percentage stop `33.3%` preserved.
  - *Invalidation*: Percentage step truncated or lost.
- **TC-R1-F12-10: Quoted Animation Names**
  - *Input*: `animation-name: "custom-bounce"`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Unquotes animation name and matches `@keyframes custom-bounce`.
  - *Invalidation*: Keyframes stripped due to quote mismatch.

---

### Feature 13: Removal of Hardcoded Rigid Pixel Dimensions on Non-Media Elements (F13)

#### Tier 1: Feature Coverage
- **TC-R1-F13-01: Removal of Rigid Computed Width on `<div>` Containers**
  - *Input*: `<div>` element with computed style `width: 345.678px; display: block`.
  - *Steps*: Call `extractor.extract(divElement)`.
  - *Expected*: Output CSS for `div` contains no explicit `width: 345.678px;` property.
  - *Invalidation*: Rigid pixel width retained on `div`.
- **TC-R1-F13-02: Removal of Rigid Computed Height on `<p>` and Heading Elements**
  - *Input*: `<p>` element with computed style `height: 48.32px`.
  - *Steps*: Call `extractor.extract(pElement)`.
  - *Expected*: Output CSS for `<p>` contains no explicit `height: 48.32px;` declaration.
  - *Invalidation*: Height pixel value retained on paragraph.
- **TC-R1-F13-03: Preservation of Fixed Dimensions on `<img>` Elements**
  - *Input*: `<img src="avatar.jpg">` with computed `width: 48px; height: 48px`.
  - *Steps*: Call `extractor.extract(imgElement)`.
  - *Expected*: Output HTML/CSS for `<img>` preserves `width: 48px; height: 48px;` (or HTML attributes `width="48" height="48"`).
  - *Invalidation*: Image width or height removed, collapsing image layout.
- **TC-R1-F13-04: Preservation of Fixed Dimensions on `<svg>` and `<canvas>` Elements**
  - *Input*: `<svg>` icon with computed `width: 24px; height: 24px` and `<canvas>` with `width: 300px; height: 150px`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Fixed pixel dimensions are strictly preserved on `<svg>` and `<canvas>`.
  - *Invalidation*: SVG or canvas dimensions removed.
- **TC-R1-F13-05: Preservation of Fixed Dimensions on `<video>`, `<audio>`, `<iframe`, `<input>` Elements**
  - *Input*: `<iframe src="..." style="width: 500px; height: 300px">`.
  - *Steps*: Call `extractor.extract(iframeElement)`.
  - *Expected*: Media/embed element dimensions (`width: 500px; height: 300px`) are preserved.
  - *Invalidation*: Iframe dimensions removed.

#### Tier 2: Boundary & Corner Cases
- **TC-R1-F13-06: Preservation of `min-width`, `max-width`, `min-height`, `max-height` on Non-Media Elements**
  - *Input*: `<div style="max-width: 1200px; min-height: 400px">`.
  - *Steps*: Call `extractor.extract(divElement)`.
  - *Expected*: `max-width: 1200px` and `min-height: 400px` are strictly preserved in output CSS.
  - *Invalidation*: `max-width` or `min-height` removed alongside rigid width.
- **TC-R1-F13-07: Preservation of Relative Percentage Dimensions (`width: 100%`)**
  - *Input*: `<div style="width: 100%; height: 50vh">`.
  - *Steps*: Call `extractor.extract(divElement)`.
  - *Expected*: Percentage and viewport unit dimensions (`100%`, `50vh`) are preserved.
  - *Invalidation*: Relative dimension percentage removed.
- **TC-R1-F13-08: Preservation of `aspect-ratio` on Non-Media Elements**
  - *Input*: `<div style="aspect-ratio: 16 / 9">`.
  - *Steps*: Call `extractor.extract(divElement)`.
  - *Expected*: `aspect-ratio: 16 / 9` preserved in output CSS.
  - *Invalidation*: `aspect-ratio` stripped.
- **TC-R1-F13-09: Filtering of `0px` and `auto` Computed Dimensions**
  - *Input*: Container element where computed style returns `width: auto; height: 0px`.
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: `width: auto` and `height: 0px` are filtered out of computed declarations.
  - *Invalidation*: Explicit `height: 0px` breaks element rendering.
- **TC-R1-F13-10: Non-Media Component with Explicit Inline Pixel Style in Authored HTML**
  - *Input*: `<div style="width: 300px">` (authored inline style on original element).
  - *Steps*: Call `extractor.extract(element)`.
  - *Expected*: Authored inline `style` attribute is stripped during sanitization, and non-media filtering prevents re-adding rigid `300px` width unless specified in authored CSS rules.
  - *Invalidation*: Inline style leaked into exported HTML root.

---

## 4. Verification & Validation Protocol

To execute and verify these test cases:
1. Run existing unit tests:
   ```bash
   npm test
   ```
2. Run fixture server / headless browser tests to evaluate `tests/fixture.html`:
   - Inspect `document.body.dataset.exportStatus` (must be `pass`).
   - Validate format outputs for HTML, Tailwind, Vue SFC, and React JSX.
3. Invalidation conditions for the overall test suite:
   - Any test failure in `npm test`.
   - Missing coverage for any of the 13 identified R1 features.
   - Failure to output valid syntax for Vue SFC or React JSX exports.
