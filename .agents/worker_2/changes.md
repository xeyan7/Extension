# Changes Log — Worker 2 (Milestone 2 & Milestone 3)

## Summary of Completed Work
Implemented systematic fixes and hardening for all 39 defects (2 Critical, 10 High, 17 Medium, 10 Low) listed in `DEFECT_REGISTER.md`. All changes adhere strictly to the Minimal Change Principle, maintain absolute code integrity, and pass 100% of unit tests with 0 failures/errors.

---

## Complete Defect Fixes & Files Modified

### 1. Critical Defects (2/2)

- **CRIT-01: `content.js` — Script Execution / DOM Clobbering in Component Preview**
  - Sanitized element clones in `createComponentPreview` by stripping scriptable and executable elements (`script`, `style`, `link`, `noscript`, `iframe`, `object`, `embed`, `base`, `form`, `animate`, `set`, `animateMotion`, `animateTransform`, `foreignObject`, `use`).
  - Stripped event handlers (`on*`), URL navigation attributes (`action`, `formaction`, `srcdoc`, `javascript:`, `vbscript:`, `data:text/html`), and prefixed `id` and `name` attributes with `uicc-prev-` to prevent DOM clobbering.

- **CRIT-02: `content.js` — DOM Attribute Breakout / CSS Injection in Asset Library**
  - Refactored `showAssets()` HTML generation to eliminate direct inline string interpolation of unsanitized background colors and font families in `style="..."` attributes.
  - Replaced inline style strings with `data-uicc-bg` and `data-uicc-font` data attributes and applied styles programmatically via JS DOM calls (`el.style.background = ...`, `el.style.fontFamily = ...`).

---

### 2. High Severity Defects (10/10)

- **HIGH-01: `content.js` & `content.css` — Lack of Isolated Subtree / Shadow DOM**
  - Encapsulated floating toolbar, selection overlays, highlight box, and toast notifications within a closed Shadow DOM container (`attachShadow({ mode: 'closed' })`) attached to `#uicc-ext-7f3a-root`.
  - Added full host stylesheet encapsulation preventing page styles from corrupting the extension UI.

- **HIGH-02: `content.js` — Main Thread Freeze during Large Asset Scans**
  - Introduced micro-task cooperative yielding (`await new Promise(r => setTimeout(r, 0))`) every 150 scanned elements in `scanAssets()`.
  - Added view state checks during traversal to immediately abort background scanning if the user closes or switches views.

- **HIGH-03: `content.js` — GSAP Animation State Corruption**
  - Implemented explicit, deterministic style property cleanup when killing or toggling GSAP timelines in `expandToolbar()` and `collapseToolbar()`.

- **HIGH-04: `content.js` — CORS SecurityError Exception Handling on Stylesheets**
  - Wrapped `stylesheet.cssRules`, `rule.type`, and `rule.style` access in `try...catch` blocks to silently swallow cross-origin SecurityError exceptions without halting extraction.

- **HIGH-05: `lib/extractor.js` — Backdrop Clipping Inheritance Failure**
  - Updated `effectiveBackdropCss()` to check ancestor `border-radius`, `clip-path`, and `overflow` clipping bounds, properly computing composite backdrop blur and crop regions.

- **HIGH-06: `content.js` — Color Categorization Fallback & 8-Digit Hex Support**
  - Updated `rgbToHex()` to return `''` when an invalid CSS color string is set.
  - Updated `classifyColor()` to support 8-character hex `#RRGGBBAA` strings, inspect alpha transparency (returning `'Other'` for alpha < 0.05), and return `'Other'` on invalid color inputs.

- **HIGH-07: `content.js` — Copy Button HTML Corruption**
  - Preserved original button HTML in `btn.dataset.originalHtml = btn.innerHTML` before applying loading states.
  - Restored button content from `dataset.originalHtml` upon operation completion or failure, and added double-click guards (`btn.disabled`).

- **HIGH-08: `background.js` — Cross-Tab Asset Data Isolation**
  - Enforced strict tab isolation in `getNetworkAssets` message handler by checking `sender.tab.id` and rejecting requests targeting unauthorized tab contexts.

- **HIGH-09: `background.js` — SSRF Protection & IP Hostname Normalization**
  - Enhanced `isPrivateHostname()` to normalize IP hostnames (decoding hex integers `0x7f000001`, octal integers `0177.0.0.1`, decimal integers `2130706433`, and IPv6-mapped IPv4 `::ffff:127.0.0.1`) using `URL` parsing and `parseIPv4To32Bit()` integer bounds checking.

- **HIGH-10: `background.js` — Function Callback for String Replacement in `expandImports`**
  - Converted string replacements in `expandImports()` to use functional callbacks (`output.replace(pattern, () => replacement)`) to prevent special dollar-sign (`$1`, `$&`, `$'`) replacement injection.

---

### 3. Medium Severity Defects (17/17)

- **MED-01: `content.js` — Selection Mode Scroll Desynchronization**
  - Registered scroll listener during selection mode calling `document.elementFromPoint(this.pointerX, this.pointerY)` in `onViewportChange()` to keep hover target synchronized during scroll.

- **MED-02: `content.js` — Property Editor Input Validation**
  - Stored original style value on `focus`, validated CSS syntax on `blur`/`Enter`, restored previous value and toasted error on invalid input.

- **MED-03: `content.js` — Memory Leak in CSV Export Link Creation**
  - Appended temporary `<a>` element to `document.body` before `.click()`, removed it immediately after, and set Blob URL revocation timeout to 10,000ms.

- **MED-04: `content.js` — Toolbar Drag Position Locking**
  - Preserved user drag offsets and stored position coordinates in `lockToolbarPosition()` when expanding or collapsing views.

- **MED-05: `content.js` — Asset Download Filename Extension Extraction**
  - Derived file extensions from MIME types or default fallbacks for `data:` and `blob:` URIs when triggering asset downloads.

- **MED-06: `content.js` — Extension Container Z-Index & Mount Target**
  - Mounted extension container directly to `document.documentElement` with max z-index (`2147483647`) to prevent stacking context clipping.

- **MED-07: `content.js` — Asset Tabs Keyboard Navigation**
  - Implemented WAI-ARIA Roving Tabindex (`tabindex="0"` for active tab, `-1` for inactive) with `Home`, `End`, `ArrowLeft`, `ArrowRight` key handlers in asset category tabs.

- **MED-08: `content.js` — Toast Notification Stacking & Reflow**
  - Cleared active timers, forced DOM reflow (`void t.offsetWidth`), and re-added entrance animation class (`show`) for rapid consecutive toast calls.

- **MED-09: `lib/extractor.js` — SVG Attribute Alias Mappings**
  - Extended `toReactAttribute()` with complete SVG/XML attribute mappings (`stroke-dasharray`, `stroke-dashoffset`, `stroke-linecap`, `stroke-linejoin`, `stroke-width`, `fill-rule`, `clip-rule`, `clip-path`, `stroke-opacity`, `fill-opacity`, `color-interpolation-filters`, `xml:space`, `xmlns:xlink`, `xlink:href`, etc.).

- **MED-10: `content.js` — Selection Outline Real-Time Update**
  - Called `showSelectedOutline(this.selectedElement)` on input during live CSS property editing to update outline bounds dynamically.

- **MED-11: `background.js` — Streaming Body Reader AbortSignal Cancellation**
  - Linked `AbortSignal` to `reader.cancel()` in `responseBytesWithinLimit()` to release network sockets immediately when fetch requests are aborted.

- **MED-12: `content.js` — Lottie Visual Preview Fallback**
  - Rendered inline SVG play icon preview for Lottie animation items in `showAssets()`.

- **MED-13: `manifest.json` — Dynamic Resource URL Protection**
  - Added `"use_dynamic_url": true` to `web_accessible_resources` in `manifest.json` to prevent static extension fingerprinting across origins.

- **MED-14: `background.js` — Storage Mutation Queue Promise Propagation**
  - Updated `enqueueStorageMutation()` to return the task promise so rejections propagate to callers while keeping the sequential queue intact.

- **MED-15: `background.js` — Base64 Encoding Memory Optimization**
  - Replaced repetitive string concatenations in `fetchAssetBlob()` with an array push and single `.join('')` call to eliminate string re-allocation overhead.

- **MED-16: `background.js` — SPA Route Transition Asset Clearing**
  - Added `chrome.webNavigation.onReferenceFragmentUpdated` and `onHistoryStateUpdated` listeners to clear tab network asset caches during Single Page Application route transitions.

- **MED-17: `tests/background.test.js` — Background Service Worker & Integration Unit Tests**
  - Created unit test file `tests/background.test.js` covering background service worker functions, SSRF IP parsing, download filename sanitization, color classification, and component preview sanitization.

---

### 4. Low Severity Defects (10/10)

- **LOW-01: `content.js` — Breadcrumb `isConnected` Check**
  - Added `element?.isConnected` check in breadcrumb navigation to prevent referencing detached DOM elements.

- **LOW-02: `content.js` — SVG `<style>` Tag & Event Handler Sanitization**
  - Added `<style>` tag stripping and `on*` event attribute removal in `cleanSVG()`.

- **LOW-03: `content.css` — Narrow Viewport Responsive Styling**
  - Added `@media (max-width: 360px)` breakpoint styles in `content.css` for responsive toolbar, copy option grid, and asset library cards.

- **LOW-04: Documentation Crosswalk Mapping**
  - Verified and documented defect mapping crosswalks across `DEFECT_REGISTER.md`, `AUDIT_REPORT.md`, `BUG_LIST.md`, and `changes.md`.

- **LOW-05: `lib/extractor.js` — Native `CSS.escape` Preference**
  - Updated `cssEscape()` to prefer `globalThis.CSS?.escape` when present.

- **LOW-06: `content.css` — Forced-Colors Mode Accessibility**
  - Added `@media (forced-colors: active)` focus outline rules in `content.css` for High Contrast and Windows Forced-Colors mode.

- **LOW-07: `background.js` — Windows Filename Trailing Characters Sanitization**
  - Appended `.replace(/[. ]+$/, '')` in `sanitizeDownloadFilename()` to strip trailing dots and spaces that Windows File Explorer rejects.

- **LOW-08: `content.js` — CSV Export Blob Revocation Delay**
  - Set Blob URL revocation delay in CSV export to 10,000ms (10 seconds).

- **LOW-09: `manifest.json` — Host Permissions Security Justification**
  - Documented host permissions justification in `manifest.json`.

- **LOW-10: `background.js` — PRNG Secure Random Generation**
  - Prefers `crypto.getRandomValues()` before falling back to `Math.random()`.

---

## Verification Results
- `npm test`: **25 / 25 PASS (100% success rate, 0 failures/errors)**
- `npm run check`: **0 syntax errors across `background.js`, `content.js`, `lib/extractor.js`, and test suites**
