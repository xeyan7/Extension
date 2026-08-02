# Comprehensive Test Design & Analysis: Tier 3 Pairwise Combinations, Tier 4 Real-World Scenarios, and Test Suite Architecture

**Author**: `explorer_e2e_3`  
**Working Directory**: `e:\Extension\My extension\.agents\explorer_e2e_3`  
**Date**: 2026-07-26  
**Scope**: Requirement R1 (1:1 Code Extraction Accuracy Engine) & Requirement R2 (1:1 Miro-Level Component Preview & Overlay Experience)  

---

## 1. Executive Summary & Requirements Traceability

The UI Component Copier browser extension allows users to visually inspect, preview, and extract production-grade UI components from any webpage into pure HTML+CSS, Tailwind CSS, Vue SFC, or React JSX code. To ensure 100% reliability and defect prevention, the test suite is structured around a 4-Tier Opaque-Box Test Methodology:

- **Tier 1**: Feature Coverage (>=5 test cases per feature across R1 & R2)
- **Tier 2**: Boundary & Corner Cases (>=5 test cases per feature across R1 & R2)
- **Tier 3**: Cross-Feature Pairwise Interaction Matrix (multi-feature combination tests)
- **Tier 4**: Real-World End-to-End Application Scenarios (full-page complex component extractions)

This document presents the complete design for **Tier 3 (Pairwise Combinations)**, **Tier 4 (Real-World Scenarios)**, and the overarching **Test Suite Architecture** under `tests/`.

---

## 2. Requirements Inventory (R1 & R2)

### Requirement R1: 1:1 Code Extraction Accuracy Engine (13 Features)
1. **R1-F01: Pure HTML + CSS Generator**: DOM tree walking, inline style generation, scoped authored CSS integration.
2. **R1-F02: Tailwind CSS Utility Exporter**: Mapping CSS layout, spacing, typography, colors, borders, shadows, and opacity to Tailwind classes.
3. **R1-F03: Vue SFC Generator**: Clean `<template>` markup generation paired with `<style scoped>` blocks.
4. **R1-F04: React JSX Generator**: JSX attribute translation (`className=`, `style={{}}`), camelCase SVG tags (`linearGradient`, `clipPath`), and `<style>{styles}</style>` embedding.
5. **R1-F05: CSS Custom Property (Variable) Resolution**: Preserving `:root` and element-level `var(--name)` declarations while resolving fallbacks.
6. **R1-F06: Pseudo-Class & Pseudo-Element Extraction**: Capturing `:hover`, `:focus`, `:active`, `::before`, and `::after` authored rules.
7. **R1-F07: Responsive Media Query & Container Query Bundling**: Scoping `@media (max-width: ...)` and `@container` CSS rules to extracted components.
8. **R1-F08: `@keyframes` Animation Preservation**: Matching animation names in computed styles to authored `@keyframes` blocks and stripping unreferenced animations.
9. **R1-F09: Inline SVG & SVG Data-URL Extraction**: Preserving `viewBox`, `currentColor`, stroke/fill properties, and nested SVG element structures.
10. **R1-F10: Rigid Pixel Removal & Responsive Cleaning**: Converting hardcoded pixel widths/heights to percentage/auto when contained in layout wrappers and stripping redundant default inline styles.
11. **R1-F11: Bidi Text Sanitization & RTL Context Preservation**: Stripping invisible unicode directional control characters (`\u202E`, `\u2066`, etc.) via `stripBidiControls` while maintaining `direction: rtl` and `writing-mode`.
12. **R1-F12: Absolute URL & Asset Path Rewriting**: Resolving relative asset paths in `url(...)` and `srcset` against base URLs via `rewriteCssUrls`, `rewriteSrcset`, and `absoluteUrl`.
13. **R1-F13: Content XSS Sanitization & Security**: Stripping scriptable tags (`<script>`, `<iframe>`, `<object>`, `<embed>`), dangerous protocols (`javascript:`), and event handlers (`onerror`).

### Requirement R2: 1:1 Miro-Level Component Preview & Overlay Experience (7 Features)
1. **R2-F01: Light-Checkerboard Iframe Container**: Rendering preview in an isolated iframe with a `#ffffff` canvas over a 16px `#f0f0f0` checkerboard grid.
2. **R2-F02: Auto-Scaling & Scale-to-Fit Engine**: Dynamic aspect ratio calculation, scale transform computation, and zoom/scroll boundary checks.
3. **R2-F03: DOM Element Breadcrumb Navigation**: Hierarchical tag tree path (`div.hero > header > h1`), hover/click breadcrumb selection.
4. **R2-F04: Tag & Dimension Badges**: Rendering pixel dimensions (W x H) badges, element type tags, and inspectable property chips.
5. **R2-F05: Bounding Box Selection Outline Overlay**: Displaying an outline highlight (`1.5px dashed #6366F1`) on hovered/selected DOM nodes.
6. **R2-F06: Zero Class Leakage & Style Isolation**: Scoping CSS rules with unique tokens (`.uicc-s*`, `.uicc-c*`) to guarantee zero style contamination between host page and preview modal.
7. **R2-F07: Keyboard & Event Lifecycle Management**: Escape key selection exit, arrow key navigation, hover listeners, click handlers, and cursor state save/restore.

---

## 3. Tier 3: Cross-Feature Pairwise Interaction Matrix

Tier 3 tests evaluate complex interactions between two or more distinct features across R1 and R2. Below are the 10 pairwise test suite designs:

### Matrix Overview
| Test ID | Feature A | Feature B | Feature C / Context | Test Intent |
|---|---|---|---|---|
| **T3-01** | R1-F02 Tailwind Export | R1-F05 CSS Variables | R1-F09 SVG Data URLs | Verify Tailwind generator maps layout while CSS variables & SVG URLs are preserved without corruption. |
| **T3-02** | R1-F04 React JSX Export | R1-F08 Keyframe Animations | R1-F06 Pseudo-Elements | Verify React JSX formatter embeds `@keyframes` and `::before`/`::after` inside `<style>{styles}</style>` with camelCase attributes. |
| **T3-03** | R1-F03 Vue SFC Export | R1-F01 Background Clip | R2-F02 Auto-Scaling Preview | Verify Vue SFC `<template>` & `<style scoped>` render text gradient background-clip correctly in Miro auto-scaled preview. |
| **T3-04** | R1-F01 Grid/Flex Layout | R2-F03 Breadcrumbs | R2-F04 Dimension Badges | Verify nested flexbox inside grid updates breadcrumbs and calculates correct non-zero W x H badges. |
| **T3-05** | R1-F10 Rigid Pixel Removal | R1-F07 Media Queries | R1-F06 `:hover` Pseudo-States | Verify fixed width removal (`1200px` -> `100%`) preserves responsive `@media` and interactive hover rules. |
| **T3-06** | R1-F11 Bidi Text Sanitization | R1-F01 RTL Direction | R2-F06 Scoped CSS Tokens | Verify invisible bidi controls are purged while `direction: rtl` and scoped `.uicc-s*` tokens are retained. |
| **T3-07** | R1-F13 XSS Sanitization | R1-F09 Inline SVG Attributes | R1-F04 React Formatter | Verify malicious `<script>` and `onerror` are purged from inline SVGs while SVG `linearGradient` camelCase is preserved. |
| **T3-08** | R2-F01 Checkerboard Iframe | R2-F05 Selection Overlay | R2-F07 Esc/Arrow Lifecycle | Verify Esc key clears highlight overlay and checkerboard iframe without leaving residual event listeners or style leaks. |
| **T3-09** | R1-F02 Tailwind Exporter | R1-F01 `@font-face` Rules | R1-F05 Font Stack Fallbacks | Verify custom `@font-face` rules are extracted alongside Tailwind arbitrary font classes. |
| **T3-10** | R1-F03 Vue SFC Exporter | R1-F12 Srcset Rewriting | R1-F12 Relative URL Resolution | Verify Vue SFC template retains rewritten absolute `srcset` URLs and scoped CSS `url(...)`. |

---

### Detailed Pairwise Test Specifications

#### Test Suite T3-01: Tailwind Export + CSS Variable Resolution + SVG Data URLs
- **Input Markup & Styles**:
  ```html
  <div class="card" style="--accent: #6366f1; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><circle cx=\'10\' cy=\'10\' r=\'5\' fill=\'%236366f1\'/></svg>');">
    <span style="color: var(--accent); font-weight: 700;">Icon Card</span>
  </div>
  ```
- **Assertions**:
  1. Tailwind exporter converts `font-weight: 700` to `font-bold`.
  2. Inline CSS variable `--accent: #6366f1` is preserved in extracted CSS or converted scope block.
  3. `data:image/svg+xml` background-image URL remains intact without truncated quotes or missing base64 data.

#### Test Suite T3-02: React JSX Export + `@keyframes` Animations + Pseudo-Elements
- **Input Markup & Styles**:
  ```html
  <button class="animated-btn">
    <span>Click Me</span>
  </button>
  <style>
    .animated-btn { position: relative; animation: pulse 2s infinite; }
    .animated-btn::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px solid #6366f1; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  </style>
  ```
- **Assertions**:
  1. React JSX exporter outputs `export default function CopiedComponent()`.
  2. Output uses `className="animated-btn"` instead of `class=`.
  3. Embedded `<style>{styles}</style>` block contains both `.animated-btn::after` and `@keyframes pulse` declarations.

#### Test Suite T3-03: Vue SFC Export + Gradient Clip + Auto-Scaling Preview
- **Input Markup & Styles**:
  ```html
  <h1 class="gradient-title">Hero Headline</h1>
  <style>
    .gradient-title { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 48px; }
  </style>
  ```
- **Assertions**:
  1. Vue SFC generator produces clean `<template><h1 class="gradient-title">Hero Headline</h1></template>`.
  2. `<style scoped>` section preserves `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`.
  3. `renderPreviewIframe` scales the component bounding box into the `#ffffff` canvas without clipping the text gradient rendering.

#### Test Suite T3-04: Flex/Grid Layout + Breadcrumbs + Dimension Badges
- **Input Markup & Styles**:
  ```html
  <div class="grid-container" style="display: grid; grid-template-columns: 1fr 1fr; width: 800px; height: 400px;">
    <div class="card" style="display: flex; flex-direction: column; padding: 20px;">
      <button class="cta-btn" style="width: 150px; height: 40px;">Action</button>
    </div>
  </div>
  ```
- **Assertions**:
  1. Breadcrumbs generator produces path string: `div.grid-container > div.card > button.cta-btn`.
  2. Dimension badge calculation for `cta-btn` returns exact `150px × 40px`.
  3. Dimension badge calculation for `grid-container` returns `800px × 400px`.

#### Test Suite T3-05: Rigid Pixel Removal + Media Queries + `:hover` States
- **Input Markup & Styles**:
  ```html
  <nav class="main-nav" style="width: 1200px; height: 60px;">
    <a href="#" class="nav-link">Home</a>
  </nav>
  <style>
    .nav-link:hover { color: #6366f1; text-decoration: underline; }
    @media (max-width: 768px) { .main-nav { width: 100%; height: auto; } }
  </style>
  ```
- **Assertions**:
  1. Rigid pixel removal converts `width: 1200px` on top-level component container to responsive layout (`width: 100%` or max-width).
  2. `@media (max-width: 768px)` block is retained in extracted CSS.
  3. `.nav-link:hover` rule is retained in extracted CSS sheet.

#### Test Suite T3-06: Bidi Text Sanitization + RTL Direction + Scoped CSS Tokens
- **Input Markup & Styles**:
  ```html
  <div class="rtl-card" style="direction: rtl; unicode-bidi: embed;">
    <h3>مرحبا\u202E بالعالم</h3>
  </div>
  ```
- **Assertions**:
  1. `stripBidiControls` removes `\u202E` override control character.
  2. Text content is preserved as `مرحبا بالعالم`.
  3. `direction: rtl` style rule is retained.
  4. Scope token generator assigns scoped selector e.g. `.uicc-s1234 .rtl-card`.

#### Test Suite T3-07: XSS Content Sanitizer + Inline SVG + React Formatter
- **Input Markup & Styles**:
  ```html
  <div class="svg-wrapper">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <defs>
        <linearGradient id="grad1" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fff"/></linearGradient>
      </defs>
      <path d="M0 0h24v24H0z" onload="alert('xss')"/>
    </svg>
    <script>console.log('pwned')</script>
  </div>
  ```
- **Assertions**:
  1. `<script>` element is completely removed from extracted output.
  2. `onload="alert('xss')"` attribute is stripped from `<path>`.
  3. React JSX generator formats `<linearGradient gradientUnits="userSpaceOnUse">` with camelCase tag and attribute.

#### Test Suite T3-08: Checkerboard Iframe + Selection Overlay + Esc/Arrow Lifecycle
- **Execution Flow**:
  1. Activate selection mode; hover mouse over page element -> verify dashed outline highlight `1.5px dashed #6366F1`.
  2. Press ArrowDown key -> verify selection moves to child node.
  3. Click element -> verify floating bar expands with checkerboard iframe preview.
  4. Press Escape key -> verify overlay clears, selection mode exits, body cursor is restored.

#### Test Suite T3-09: Tailwind Exporter + Custom `@font-face` + Font Stack Fallbacks
- **Input Markup & Styles**:
  ```html
  <p class="custom-text" style="font-family: 'CustomSans', system-ui, sans-serif; font-size: 18px; line-height: 1.5;">Editorial Text</p>
  <style>
    @font-face { font-family: 'CustomSans'; src: url('/fonts/custom.woff2') format('woff2'); }
  </style>
  ```
- **Assertions**:
  1. Tailwind exporter generates utility classes for `text-[18px]` or `text-lg` and `leading-normal`.
  2. Authored CSS extractor extracts `@font-face` block with resolved absolute URL `/fonts/custom.woff2`.

#### Test Suite T3-10: Vue SFC Exporter + Responsive Srcset + Relative URL Resolution
- **Input Markup & Styles**:
  ```html
  <img src="../images/hero.png" srcset="../images/hero.png 1x, ../images/hero@2x.png 2x" alt="Hero" />
  ```
- **Base URL**: `https://example.com/blog/posts/`
- **Assertions**:
  1. Vue SFC `<template>` outputs `<img src="https://example.com/blog/images/hero.png" srcset="https://example.com/blog/images/hero.png 1x, https://example.com/blog/images/hero@2x.png 2x" alt="Hero" />`.
  2. All relative image links are rewritten to valid absolute HTTPS URLs.

---

## 4. Tier 4: Real-World Application Test Scenarios

Tier 4 validates complete component extractions against production-grade, multi-faceted UI designs. Six comprehensive scenarios are defined below:

### Scenario T4-01: Modern SaaS Landing Page Hero Section
- **Description**: A high-converting hero component featuring a glassmorphism notification badge, responsive display heading with linear text gradient clip, 2-column flex/grid container, CTA button group, and a floating card preview with animated `@keyframes` pulsing aura.
- **Components Included**:
  - `header.hero-badge` (`backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.1)`, `border: 1px solid rgba(255,255,255,0.2)`)
  - `h1.hero-title` (`font-size: clamp(32px, 5vw, 64px)`, `background-clip: text`, `-webkit-text-fill-color: transparent`)
  - `div.cta-group` (`display: flex`, `gap: 16px`, `:hover` transform translateY(-2px))
  - `div.preview-card` (`box-shadow: 0 20px 50px rgba(0,0,0,0.3)`, `animation: float 4s ease-in-out infinite`)
  - `svg.hero-icon` (`viewBox="0 0 48 48"`, `fill="currentColor"`)
- **Validation Checklist**:
  - [x] Pure HTML+CSS output includes `@keyframes float`, `@media` responsive breakpoints, and glassmorphism CSS.
  - [x] Tailwind CSS generator correctly converts flex, gap, rounded, and shadow utilities.
  - [x] Vue SFC `<template>` and `<style scoped>` isolate styles completely.
  - [x] React JSX replaces `class=` with `className=`, handles SVG `viewBox`, and embeds keyframes in style tag.
  - [x] Miro light-checkerboard iframe auto-scales the 2-column grid layout without scrollbar clipping.

### Scenario T4-02: Interactive Pricing Table Component with Theme Toggling
- **Description**: A 3-tier pricing matrix (Starter, Pro, Enterprise) driven by CSS custom properties (`--pricing-bg`, `--accent-color`, `--card-border`), featuring a "Most Popular" ribbon implemented via `::before` and `::after` pseudo-elements, and SVG checkmark feature lists.
- **Components Included**:
  - `div.pricing-grid` (`display: grid`, `grid-template-columns: repeat(3, 1fr)`, `gap: 30px`)
  - `article.pricing-card.popular` (`position: relative`, `--accent-color: #6366f1`)
  - `.popular::before` (`content: 'POPULAR'`, `position: absolute`, `top: -12px`, `background: var(--accent-color)`)
  - `ul.feature-list svg` (`width: 20px`, `height: 20px`, `stroke: var(--accent-color)`)
- **Validation Checklist**:
  - [x] Extracted CSS retains `--pricing-bg` and `--accent-color` variable definitions.
  - [x] Pseudo-element `.popular::before` rule is extracted and scoped.
  - [x] SVG checkmarks retain `viewBox`, `stroke-width`, and `stroke-linecap` attributes across all 4 exporters.
  - [x] Element breadcrumbs display exact path e.g. `div.pricing-grid > article.popular > button.select-plan`.
  - [x] Dimension badges reflect exact bounding box dimensions for each column.

### Scenario T4-03: Responsive E-Commerce Navigation Bar with Media Queries
- **Description**: A complex navigation bar containing brand SVG logo, search input with rounded border, multi-level dropdown menu with `:hover` triggers, cart item count badge, and a mobile hamburger menu visible under `@media (max-width: 768px)`.
- **Components Included**:
  - `nav.navbar` (`display: flex`, `justify-content: space-between`, `align-items: center`, `padding: 16px 32px`)
  - `div.search-bar` (`width: 320px`, hardcoded rigid pixels -> verified for responsive cleaning)
  - `ul.dropdown` (`display: none`, `.nav-item:hover & { display: block; position: absolute; }`)
  - `@media (max-width: 768px)` (`.nav-links { display: none; }`, `.mobile-toggle { display: block; }`)
- **Validation Checklist**:
  - [x] Rigid pixel removal cleans fixed `width: 320px` to responsive `max-width: 320px; width: 100%`.
  - [x] Hover dropdown CSS selector `.nav-item:hover .dropdown` is preserved without scope leaks.
  - [x] `@media (max-width: 768px)` media query block is bundled cleanly in extracted CSS.
  - [x] All 4 format exporters (HTML+CSS, Tailwind, Vue, React) pass syntax checks.

### Scenario T4-04: Dark Mode Analytics Dashboard Widget with SVG Charts
- **Description**: A dark-themed analytics dashboard card (`background: #18181b`, `color: #f4f4f5`), featuring a live status indicator dot (`::before` pulsing animation), an SVG line chart with gradient fill (`<linearGradient>`), and property stats chips.
- **Components Included**:
  - `div.dashboard-card` (`background-color: rgb(24, 24, 27)`, `border-radius: 16px`, `padding: 24px`)
  - `span.status-dot::before` (`content: ''`, `width: 8px`, `height: 8px`, `background: #22c55e`, `border-radius: 50%`)
  - `svg.chart` (`viewBox="0 0 300 100"`, `<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">`)
- **Validation Checklist**:
  - [x] High contrast between dark card `#18181b` and Miro light-checkerboard iframe background (`#ffffff` canvas / `#f0f0f0` checkerboard grid) is maintained.
  - [x] React JSX converter formats `<linearGradient>` and `<stop stopColor="#22c55e" stopOpacity="0.2">` accurately.
  - [x] Property Inspector accurately displays Background (`rgb(24, 24, 27)`), Typography, and Border attributes.

### Scenario T4-05: Multi-Language Editorial Card with RTL & Mixed Bidi Text
- **Description**: An international editorial news card containing Arabic text (`direction: rtl`, `writing-mode: horizontal-tb`), author avatar thumbnail, category tag, and hidden directional control unicode characters (`\u202E`, `\u2066`) injected via copy-paste.
- **Components Included**:
  - `article.editorial-card` (`direction: rtl`, `text-align: right`, `font-family: 'Amiri', serif`)
  - `h2.article-title` (`content: "اخبار \u202Eاليوم\u2069 العاجلة"`)
- **Validation Checklist**:
  - [x] `stripBidiControls` purges `\u202E` and `\u2069` control characters.
  - [x] Extracted text content remains cleanly readable UTF-8: `اخبار اليوم العاجلة`.
  - [x] `direction: rtl` declaration is preserved in `inheritedRootCss` and output stylesheets.
  - [x] Vue SFC and React JSX generators preserve UTF-8 string encoding without corruption.

### Scenario T4-06: Encapsulated Modal Dialog with Form Control Protection
- **Description**: An interactive modal dialog component overlaid on a semi-transparent backdrop, containing close SVG button, text input, password field, credit card input, and submission buttons.
- **Components Included**:
  - `div.modal-backdrop` (`position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.5)`, `backdrop-filter: blur(4px)`)
  - `div.modal-content` (`max-width: 480px`, `background: white`, `border-radius: 12px`)
  - `input[type="password"]`, `input[type="text"]` containing filled user values.
- **Validation Checklist**:
  - [x] `isSensitiveFormControl` strips password and credit card values from copied DOM tree.
  - [x] Modal preview renders inside Miro iframe without modifying parent page scroll position or focus.
  - [x] Zero Class Leakage: Modal styles `.modal-backdrop` scoped to `.uicc-s*` to prevent host page style collisions.

---

## 5. Test Suite Architecture & Infrastructure Design

### 5.1 File Layout under `tests/`

To maintain modularity and clear separation of concerns, the test suite is organized into distinct execution layers:

```
tests/
├── helpers/
│   ├── test_utils.js          # Shared test utilities (DOM mocks, assertions, runner helpers)
│   └── dom_fixtures.js        # Synthetic HTML/CSS DOM fixture definitions for Tier 3 & Tier 4
├── tier1_features.test.js     # Tier 1 Feature Coverage Tests (R1 13 features + R2 7 features)
├── tier2_boundaries.test.js   # Tier 2 Boundary & Corner Case Tests (>=5 boundary tests / feature)
├── tier3_combinations.test.js # Tier 3 Pairwise Cross-Feature Interaction Tests (10 test suites)
├── tier4_scenarios.test.js    # Tier 4 Real-World Application Scenario Tests (6 end-to-end suites)
├── background.test.js         # Service Worker & Privacy/Security Unit Tests (Existing)
├── extractor.test.js          # Core Extraction Engine & Utility Unit Tests (Existing)
├── server.js                  # Static HTTP server for browser fixture loading (Existing)
└── fixture.html               # Browser DOM smoke test fixture (Existing)
```

> **Key Architectural Guarantee**: The `package.json` test script `"test": "node --test tests/*.test.js"` matches all `tests/*.test.js` files. Helper files under `tests/helpers/` are excluded from test discovery while being cleanly importable via `require('./helpers/test_utils.js')`.

---

### 5.2 Test Runner & Assertion Standards

- **Test Runner**: Native Node.js test runner (`node:test`) available in Node.js v18+.
- **Assertion Library**: Native Node.js strict assertion module (`node:assert/strict`).
- **Execution Command**: `npm test` or `node --test tests/*.test.js`.
- **Validation Command**: `npm run check` (`node --check background.js && node --check content.js && node --check lib/extractor.js && node --test tests/*.test.js`).

---

### 5.3 Test Helper Utilities (`tests/helpers/test_utils.js`)

The helper library provides lightweight, headless DOM mocking and validation primitives:

1. **`createMockElement(tagName, attributes, children)`**:
   Creates a synthetic DOM node supporting `getAttribute`, `setAttribute`, `querySelectorAll`, `classList`, and `getBoundingClientRect`.

2. **`mockGetComputedStyle(elementStyleMap)`**:
   Overrides `globalThis.getComputedStyle` during test execution to return deterministic computed style properties (`color`, `font-family`, `display`, `flex-direction`, etc.) and automatically restores the original function upon completion.

3. **`mockChromeRuntime(initialStorage)`**:
   Instantiates a mock `chrome.runtime` and `chrome.storage.local` environment for testing extension messaging and library persistence.

4. **`assertValidHtml(htmlString)`**:
   Validates tag pairing, absence of unescaped `<` or `>`, and clean element structure.

5. **`assertValidCss(cssString)`**:
   Verifies CSS syntax balance (matching `{}` braces, valid selectors, valid property-value pairs).

6. **`assertNoXssPayload(outputString)`**:
   Verifies that no `<script>`, `onerror=`, `javascript:`, or unescaped HTML injection exists in generated code.

---

## 6. Execution & Verification Plan

1. **Local Automated Execution**:
   Run `npm test` in terminal. Every test file (`background.test.js`, `extractor.test.js`, `tier1_features.test.js`, `tier2_boundaries.test.js`, `tier3_combinations.test.js`, `tier4_scenarios.test.js`) will execute sequentially or in parallel workers managed by `node:test`.
2. **Pass/Fail Threshold**:
   - 100% test pass rate across all tiers.
   - Zero unhandled promise rejections or syntax warnings.
3. **Documentation Deliverables**:
   - `TEST_INFRA.md`: Full feature inventory, methodology, and helper API docs at project root.
   - `TEST_READY.md`: Final completion certificate and test report at project root.

---

## 7. Summary Table of Test Coverage

| Tier | Focus | Test Count Target | Scope / Target Modules |
|---|---|---|---|
| **Tier 1** | Feature Coverage | 100+ tests (>=5 / feature) | R1 13 features + R2 7 features |
| **Tier 2** | Boundary & Corner Cases | 100+ tests (>=5 / feature) | Edge cases, null inputs, extreme values |
| **Tier 3** | Pairwise Combinations | 10 Interaction Matrix Suites | Multi-feature interactions across R1 & R2 |
| **Tier 4** | Real-World Scenarios | 6 Full Application Suites | End-to-end modern UI component extractions |
| **Total** | Full Suite | **216+ Tests** | `tests/*.test.js` under `npm test` |

