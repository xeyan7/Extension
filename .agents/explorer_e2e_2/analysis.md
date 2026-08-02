# R2 Component Preview & Overlay Experience — Technical Analysis & Test Design

## Executive Summary

This document provides a comprehensive technical audit of **Requirement R2: 1:1 Miro-Level Component Preview & Overlay Experience** for the Chrome Extension (`My extension`). It details the technical implementation found in `content.js`, `content.css`, `background.js`, and the existing `tests/` directory, identifies specification gaps, and delivers an exhaustive 70-test-case 4-Tier test design (35 Tier 1 Feature Coverage cases and 35 Tier 2 Boundary & Corner cases across all 7 sub-features).

---

## Technical Audit & Codebase Mapping for Requirement R2

Requirement R2 encompasses 7 distinct features required for a 1:1 Miro-level component preview and overlay experience.

### 1. Miro-Level Light-Checkerboard Iframe (`#ffffff` canvas, 16px `#f0f0f0` grid)
- **CSS Specification (`content.css` lines 352-378)**:
  - Container class `.uicc-component-preview-container`:
    - `background-image`: 45-degree and -45-degree linear gradients creating a 16px checkerboard grid.
    - `background-size`: `16px 16px`.
    - `background-position`: `0 0, 0 8px, 8px -8px, -8px 0px`.
    - `background-color`: `#ffffff` (canvas base).
    - `border`: `1px solid var(--uicc-line-strong)`.
  - Iframe class `.uicc-preview-iframe`:
    - `background: transparent`.
    - `border: none`.
- **JS Implementation (`content.js` lines 974-977, 1005-1080)**:
  - Preview iframe element: `<iframe id="uicc-preview-iframe" class="uicc-preview-iframe" title="Component Preview"></iframe>`.
  - Documents injected into iframe set body `background: transparent` and `margin: 0; padding: 12px;` so the transparent regions of extracted HTML components show the underlying checkerboard grid.
  - Sanitization via `createComponentPreview()` (lines 1209-1230): Clones nodes and strips `<script>`, `<noscript>`, `<iframe>`, `<object>`, `<embed>`, `#sd-toolbar`, `.uicc-selection-overlay`, inline event attributes (`onload`, `onclick`), and `javascript:` URIs.
  - Fallback error state (lines 1072-1078): Displays "Preview unavailable" message in clean muted text if extraction fails.

### 2. Dynamic Iframe Auto-Scaling
- **JS Implementation (`content.js` lines 1052-1070)**:
  - Content width calculation: `const rect = first.getBoundingClientRect()`, `const contentWidth = rect.width + 16`.
  - Container width reference: `const parentWidth = iframe.parentElement?.clientWidth || iframe.clientWidth || 300`.
  - Scaling logic:
    - If `contentWidth > parentWidth`: calculates `scale = Math.max(parentWidth / contentWidth, 0.3)`.
    - Applies `body.style.zoom = scale`.
    - Computes height: `scaledHeight = rect.height * scale + 20`.
    - Sets height: `iframe.style.height = Math.min(Math.max(scaledHeight, 60), 300) + 'px'`.
    - Else: `iframe.style.height = Math.min(Math.max(rect.height + 20, 60), 300) + 'px'`.
  - Container scroll boundaries (`content.css` line 355): `max-height: 350px; overflow: auto;` allowing smooth vertical scrolling when content exceeds container viewport.

### 3. Element Breadcrumb Paths & Tag Badges
- **JS Implementation (`content.js` lines 927-945, 960-967, 1116-1125)**:
  - `getBreadcrumbTrail(element)`: Traverses DOM parent chain up to `document.body`, excluding UI extension elements (`isOwnUI(curr)`).
  - Label format: `${tag}${id}${cls}` (e.g. `article#story.fixture-card`).
  - UI Rendering: Renders flex breadcrumb buttons (`.uicc-breadcrumb-item`) with active state (`.active`) for current selection and `›` separators (`color: #52525b`).
  - Interactivity: Clicking any breadcrumb button re-selects that DOM element (`this.selectedElement`), updates highlight (`highlightElement`), and re-renders component preview (`showSelectedComponent()`).
  - Tag Badges:
    - Live hover badge (`content.js` line 871): `<span class="uicc-tag-badge">&lt;${tag}&gt;</span>`.
    - Component preview header badge (`content.js` line 971): `<span class="uicc-element-type-badge">${elementType}</span>`.
    - Semantic type detection (`getElementType` lines 1193-1207): Navbar, Header, Footer, Button, Form, Card, Hero, SVG, Image, Section, or tag name in uppercase.

### 4. Element Dimensions Display (`W × H px`)
- **JS & CSS Implementation (`content.js` lines 872, 972; `content.css` lines 312-313)**:
  - Hover info badge: `<span class="uicc-dim-badge">${Math.round(el.offsetWidth)} × ${Math.round(el.offsetHeight)} px</span>`.
  - Preview header display: `<span style="font-size:11px;color:#a1a1aa;margin-left:auto;">${Math.round(element.offsetWidth)} × ${Math.round(element.offsetHeight)} px</span>`.
  - Monospace font styling (`font: 10px var(--uicc-mono)`) ensures clean tabular digit alignment.

### 5. Quick-Copy Format Buttons
- **JS & CSS Implementation (`content.js` lines 979-992, 1128-1151, 1337-1395; `content.css` lines 380-415)**:
  - 4 Format Buttons: `HTML+CSS` (`data-copy="html"`), `Tailwind` (`data-copy="tailwind"`), `Vue SFC` (`data-copy="vue"`), `React JSX` (`data-copy="react"`).
  - Async generation pipeline: `generateHTMLCSS()`, `generateTailwind()`, `generateVueSFC()`, `generateReactJSX()`.
  - 3-Stage Clipboard Fallback (`copyToClipboard` lines 1357-1395):
    1. Synchronous `document.execCommand('copy')` via off-screen textarea.
    2. `navigator.clipboard.writeText(text)`.
    3. Extension background messaging `chrome.runtime.sendMessage({ action: 'copyToClipboard', text })`.
  - Visual UI Feedback: Sets button `disabled`, `aria-busy="true"`, label "Generating…", then on success adds `.copied` class with green styling (`var(--uicc-accent)`), checkmark icon, and "Copied" text for 1600ms before resetting.

### 6. Live Hover & Selection Highlight Outlines
- **Specification vs Current Implementation Audit**:
  - Requirement R2 Spec: Highlight outline must render `1.5px dashed #6366F1` on live webpage.
  - Current `content.css` (lines 554-565): `.uicc-highlight` uses `border: 2px solid #2d8a68; background: rgba(49, 93, 76, .08);`.
  - **Gap Identified**: Current CSS implementation uses `#2d8a68` solid border instead of the requirement-specified `1.5px dashed #6366F1`. Test suite must flag this discrepancy for verification.
  - Position tracking (`content.js` lines 703-716): Updates `top`, `left`, `width`, `height` in real-time matching `element.getBoundingClientRect()`.
  - Guidelines and Box Model: Renders SVG alignment guidelines (`drawGuidelines`) and margin/padding box model overlays (`drawBoxModel`).
  - Viewport tracking (`content.js` lines 640-645): Updates highlight on `scroll` and `resize` events.
  - Keyboard navigation (lines 665-685): `ArrowUp` / `ArrowDown` keys cycle selection through parent/sibling elements, updating highlight immediately.

### 7. Zero Internal Selection Class Leakage into Exported Code
- **JS & Library Implementation (`content.js` lines 1213-1224; `lib/extractor.js`)**:
  - Node cloning in `createComponentPreview` strips `#sd-toolbar` and `.uicc-selection-overlay`.
  - `Extractor` cleans SVG, HTML, CSS, Tailwind, Vue SFC, and React JSX extractions to prevent internal classes (`.uicc-highlight`, `.uicc-selection-active`, `.uicc-guidelines`, `.uicc-boxmodel`, `#sd-toolbar`) or extension CSS variables (`--uicc-*`) from leaking into output code.

---

## 4-Tier Test Suite Design for Requirement R2

Below is the complete 70-test-case suite designed according to Tier 1 (Feature Coverage >=5/feature) and Tier 2 (Boundary & Corner Cases >=5/feature).

---

### Feature 1: Miro-level Light-Checkerboard Iframe

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F1-01`**: Verify `.uicc-component-preview-container` CSS applies `#ffffff` background with 16px `#f0f0f0` checkerboard grid pattern (`linear-gradient` angles 45deg and -45deg).
- **`TC-R2-F1-02`**: Verify `#uicc-preview-iframe` and iframe `document.body` set `background: transparent` so background grid is visible through transparent component areas.
- **`TC-R2-F1-03`**: Verify component HTML and CSS render inside iframe document with correct structure and styling without degrading to plain text.
- **`TC-R2-F1-04`**: Verify security sanitization in `createComponentPreview()` strips `<script>`, `<noscript>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers (`onclick`, `onload`), and `javascript:` URIs from preview iframe content.
- **`TC-R2-F1-05`**: Verify fallback error state renders "Preview unavailable" message cleanly inside iframe document when component extraction fails.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F1-06`**: Component with semi-transparent RGBA background (`rgba(0, 0, 0, 0.4)`) — verify checkerboard grid shows through semi-transparent layer correctly.
- **`TC-R2-F1-07`**: Component containing inline SVG icons with transparent viewbox — verify SVG fills/strokes render without black/opaque background boxes covering grid.
- **`TC-R2-F1-08`**: High-DPI display / 200% zoom level — verify 16px checkerboard grid pattern renders sharp lines without visual distortion.
- **`TC-R2-F1-09`**: Component containing HTML-encoded script strings in attributes (`data-snippet="<script>alert(1)</script>"`) — verify script is not executed or unsafely evaluated in preview iframe.
- **`TC-R2-F1-10`**: Rapid component selection switching (<100ms interval) — verify preview iframe document updates reliably without memory leaks or race conditions leaving stale document content.

---

### Feature 2: Dynamic Iframe Auto-Scaling

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F2-01`**: Verify width comparison (`contentWidth > parentWidth`) triggers dynamic scale calculation.
- **`TC-R2-F2-02`**: Verify iframe height calculation dynamically adjusts `iframe.style.height` between `60px` min-height and `300px` max-height based on content bounding box height.
- **`TC-R2-F2-03`**: Verify element zoom (`body.style.zoom = scale`) down to `0.3` scale factor preserves original visual aspect ratio without warping text or flex layouts.
- **`TC-R2-F2-04`**: Verify preview container scroll boundary (`max-height: 350px; overflow: auto`) enables vertical scrolling when scaled preview height exceeds `300px`.
- **`TC-R2-F2-05`**: Verify non-overflowing components (`contentWidth <= parentWidth`) render at scale `1.0` without zoom adjustment.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F2-06`**: Ultra-wide component (1920px full-screen hero section) — verify scale factor clamps to `0.3` minimum limit without layout breakage or NaN zoom value.
- **`TC-R2-F2-07`**: Ultra-tall component (2500px long landing page article) — verify iframe height clamps to `300px` max-height and container vertical scrollbar functions correctly.
- **`TC-R2-F2-08`**: Zero-height element or empty div (`height: 0px`) — verify iframe height clamps gracefully to `60px` minimum height without visual collapse.
- **`TC-R2-F2-09`**: Browser window resize while component preview is open — verify iframe zoom scale and height re-evaluate dynamically.
- **`TC-R2-F2-10`**: Component with CSS transforms or fixed positioning — verify scale calculation uses `getBoundingClientRect()` dimensions without infinite reflow loops.

---

### Feature 3: Element Breadcrumb Paths & Tag Badges

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F3-01`**: Verify `getBreadcrumbTrail()` generates an ordered DOM hierarchy array from target element up to `document.body`.
- **`TC-R2-F3-02`**: Verify breadcrumb item formatting displays tag name, ID (`#id`), and primary class (`.class`), e.g., `article#story.fixture-card`.
- **`TC-R2-F3-03`**: Verify clicking any breadcrumb button re-selects that ancestor DOM element and re-renders component preview panel.
- **`TC-R2-F3-04`**: Verify extension internal UI elements (`#sd-toolbar`, `.uicc-selection-overlay`, `.uicc-guidelines`) are completely excluded from breadcrumb trail hierarchy.
- **`TC-R2-F3-05`**: Verify element type badge (`Button`, `Card`, `Header`, `Footer`, `Navbar`, `Form`, `Hero`, `Section`, `SVG`, `Image`) displays accurate category label in preview header and hover card.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F3-06`**: Deeply nested DOM element (>15 levels deep) — verify breadcrumb trail container flex-wraps cleanly without breaking toolbar layout or hiding buttons.
- **`TC-R2-F3-07`**: Element with SVGAnimatedString class name (SVG element) — verify breadcrumb builder converts class name safely without throwing `className.trim is not a function` error.
- **`TC-R2-F3-08`**: Element with special characters, quotes, or script tags in ID/class — verify HTML escaping prevents XSS injection when rendering breadcrumb buttons.
- **`TC-R2-F3-09`**: Selecting `document.body` directly — verify breadcrumb trail displays single active body item without null pointer exceptions.
- **`TC-R2-F3-10`**: Clicking current active breadcrumb button — verify operation is idempotent without triggering duplicate extractions or UI flickering.

---

### Feature 4: Element Dimensions Display (`W × H px`)

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F4-01`**: Verify live hover card displays rounded element dimensions `Math.round(offsetWidth) × Math.round(offsetHeight) px`.
- **`TC-R2-F4-02`**: Verify component preview header displays current selected element dimensions `W × H px` aligned right in monospace font.
- **`TC-R2-F4-03`**: Verify dimension display updates dynamically in real-time when moving mouse across elements of varying sizes.
- **`TC-R2-F4-04`**: Verify dimension badges use tabular-nums / monospace typography for consistent width alignment across changing digits.
- **`TC-R2-F4-05`**: Verify dimension display handles fractional computed layout sizes (e.g. `142.84px × 67.19px`) by rounding accurately to integer values (`143 × 67 px`).

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F4-06`**: Hidden element or zero-dimension element (`display: none` or `0x0`) — verify dimensions display shows `0 × 0 px` without crashing or returning `NaN`.
- **`TC-R2-F4-07`**: Inline text span breaking across multiple lines — verify dimensions accurately reflect the bounding box rectangle.
- **`TC-R2-F4-08`**: Scaled element using CSS `transform: scale(2.5)` — verify offsetWidth/offsetHeight vs bounding rect dimensions handle visual vs layout size consistently.
- **`TC-R2-F4-09`**: Dynamic element size change (e.g., expanding accordion or accordion collapse) — verify dimension display refreshes accurately upon re-selection.
- **`TC-R2-F4-10`**: Extremely large element dimensions (e.g. `12000 × 45000 px` canvas) — verify text formatting does not overflow or clip badge container.

---

### Feature 5: Quick-Copy Format Buttons

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F5-01`**: Verify UI renders 4 quick-copy format buttons: `HTML+CSS`, `Tailwind`, `Vue SFC`, `React JSX`.
- **`TC-R2-F5-02`**: Verify clicking `HTML+CSS` format button triggers `generateHTMLCSS()`, copies generated markup to clipboard, and shows "Copied" feedback state.
- **`TC-R2-F5-03`**: Verify clicking `Tailwind` format button triggers `generateTailwind()`, copies generated classes to clipboard, and shows "Copied" feedback state.
- **`TC-R2-F5-04`**: Verify clicking `Vue SFC` format button triggers `generateVueSFC()`, copies SFC `<template>` & `<style scoped>` markup to clipboard, and shows "Copied" feedback state.
- **`TC-R2-F5-05`**: Verify clicking `React JSX` format button triggers `generateReactJSX()`, copies JSX component syntax to clipboard, and shows "Copied" feedback state.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F5-06`**: Restricted Clipboard API environment — verify multi-stage fallback (`execCommand` -> `navigator.clipboard` -> `chrome.runtime.sendMessage`) completes copy action successfully.
- **`TC-R2-F5-07`**: Rapid double-clicking copy button during async code generation — verify button sets `disabled` and `aria-busy="true"` to prevent duplicate extractions.
- **`TC-R2-F5-08`**: Code generation rejection / error — verify button resets disabled state, restores original label, and displays error toast message.
- **`TC-R2-F5-09`**: Feedback state timeout (1600ms) — verify `.copied` CSS class is removed and original button icon + label are restored after timeout.
- **`TC-R2-F5-10`**: Large component extraction (>150KB HTML/CSS payload) — verify clipboard write succeeds without freezing browser UI thread.

---

### Feature 6: Live Hover & Selection Highlight Outlines

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F6-01`**: Verify selection highlight overlay applies `1.5px dashed #6366F1` stroke/border around target element bounding rectangle.
- **`TC-R2-F6-02`**: Verify highlight overlay position (`top`, `left`, `width`, `height`) dynamically tracks hovered element via `getBoundingClientRect()`.
- **`TC-R2-F6-03`**: Verify window scrolling or viewport resizing updates highlight position in real time (`onViewportChange`).
- **`TC-R2-F6-04`**: Verify SVG guidelines overlay draws dashed alignment lines from element boundaries to viewport edges.
- **`TC-R2-F6-05`**: Verify keyboard navigation (`ArrowUp` / `ArrowDown` keys) shifts selection highlight to parent/sibling element immediately.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F6-06`**: Fixed / sticky positioning element (`position: fixed; top: 0`) during page scroll — verify highlight overlay stays pinned to fixed element position without drifting.
- **`TC-R2-F6-07`**: Partially off-screen element — verify highlight overlay bounds clip gracefully at viewport boundary without causing horizontal/vertical scrollbar oscillation.
- **`TC-R2-F6-08`**: Rotated or skewed element (`transform: rotate(30deg)`) — verify highlight outline bounding box covers element transformed area accurately.
- **`TC-R2-F6-09`**: Hovering extension UI toolbar (`#sd-toolbar`, `.uicc-selection-overlay`) — verify highlight overlay is suppressed (`isOwnUI(target) === true`).
- **`TC-R2-F6-10`**: Exiting selection mode (`Escape` key or click) — verify highlight overlay styles reset (`width: 0px`, `height: 0px`, hidden overlay) and body cursor restores to default.

---

### Feature 7: Zero Internal Selection Class Leakage into Exported Code

#### Tier 1: Feature Coverage Test Cases
- **`TC-R2-F7-01`**: Verify exported HTML code contains zero extension internal class names (`uicc-*`, `sd-*`).
- **`TC-R2-F7-02`**: Verify exported CSS code contains zero selectors referencing extension internal elements (`#sd-toolbar`, `.uicc-highlight`, `.uicc-selection-overlay`).
- **`TC-R2-F7-03`**: Verify exported Tailwind CSS code contains no utility classes derived from extension internal UI elements.
- **`TC-R2-F7-04`**: Verify exported Vue SFC template & style blocks contain zero `uicc-*` attributes, classes, or styles.
- **`TC-R2-F7-05`**: Verify exported React JSX component contains zero `uicc-*` attributes, classNames, or style objects.

#### Tier 2: Boundary & Corner Case Test Cases
- **`TC-R2-F7-06`**: Target element selected while `uicc-highlight-active` or `uicc-selection-active` class is present on DOM — verify internal state classes are stripped prior to code extraction.
- **`TC-R2-F7-07`**: Component containing target element with user class containing "uicc" substring (e.g. `class="custom-uicc-card"`) — verify legitimate user class is preserved while internal extension classes (`.uicc-highlight`) are stripped.
- **`TC-R2-F7-08`**: Preview iframe document generation — verify preview HTML body contains only extracted target component markup without toolbar or overlay DOM structures.
- **`TC-R2-F7-09`**: Saved component in local library storage — verify saved HTML and CSS objects in storage are 100% clean of internal extension leakage.
- **`TC-R2-F7-10`**: Component with inline `style` attributes referencing extension CSS variables (`--uicc-layer-*`, `--uicc-paper`) — verify internal extension custom properties are purged during extraction.

---

## Existing Test Suite Gap Analysis

Inspection of the existing test files reveals the following test coverage state:
1. `tests/background.test.js` focus:
   - Background script syntax, private IP detection (`isPrivateHostname`), filename sanitization (`sanitizeDownloadFilename`), color classification (`classifyColor`), and script tag sanitization in preview (`script, noscript, iframe, object, embed`).
2. `tests/extractor.test.js` focus:
   - Extractor core functions (`absoluteUrl`, `rewriteCssUrls`, `rewriteSrcset`, `stripBidiControls`, `splitSelectorList`, `stripDynamicPseudo`, `escapeHtml`, `formatReactElement`, `scopeAuthoredCss`).
3. `tests/fixture.html` & `tests/server.js`:
   - Interactive fixture for visual verification and node test HTTP server.

**Gaps Identified for R2:**
- **Zero test cases in `tests/` specifically verifying the 16px `#f0f0f0` / `#ffffff` Miro checkerboard iframe container CSS rules.**
- **Zero test cases verifying the dynamic auto-scaling zoom formula (`parentWidth / contentWidth`, min limit `0.3`) and iframe height bounds (`60px` to `300px`).**
- **Zero unit tests verifying breadcrumb item clicks switching `selectedElement` and re-rendering preview.**
- **Zero test cases checking the `#6366F1` 1.5px dashed highlight specification against current `#2d8a68` implementation.**
- **Zero test cases checking format button click visual states (Generating -> Copied 1600ms timeout reset).**

---

## Recommended Test Implementation Plan

To achieve comprehensive automated verification:
1. **Highlight Style Fix & Unit Test**: Update `content.css` `.uicc-highlight` border to `1.5px dashed #6366F1` per R2 spec, and add unit test verifying the CSS declaration.
2. **Preview Iframe & Auto-Scaler Unit Test File (`tests/preview.test.js`)**: Add automated JSDOM / Node test cases validating `createComponentPreview()`, checkerboard CSS rules, dynamic scale calculation, and height bounds.
3. **Format Buttons & Leakage Integration Test**: Add DOM tests asserting clean output across HTML, Tailwind, Vue, and React formats without `uicc-*` leakage.
