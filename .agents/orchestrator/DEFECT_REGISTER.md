# Master Defect Register — Milestone 1 Audit Synthesis

**Total Defects Identified**: 39 (2 Critical, 10 High, 17 Medium, 10 Low)

---

## 1. Critical Severity Defects (2)

| ID | Module | Lines | Description | Fix Strategy |
|---|---|---|---|---|
| **CRIT-01** | `content.js` | 1157–1184, 972–1016 | Unsanitized DOM HTML Injection / XSS in `createComponentPreview`. `clone.outerHTML` assigned directly to `innerHTML`. Bypassed by SVG animation triggers (`onbegin`), formActions, `foreignObject`, DOM clobbering. | Replace direct `innerHTML` injection with DOMPurify sanitization or iframe/Shadow DOM isolation stripping scriptable SVG tags & clobbering IDs. |
| **CRIT-02** | `content.js` | 1713–1714 | CSS Injection & HTML Attribute Breakout in `showAssets` Gradient & Color Renderer. `safe()` only escapes HTML entities, but browser HTML parser decodes entities inside `style="..."` attributes before CSS parsing. | Assign styles programmatically (`element.style.background = val`) instead of building interpolated inline HTML style attributes. |

---

## 2. High Severity Defects (10)

| ID | Module | Lines | Description | Fix Strategy |
|---|---|---|---|---|
| **HIGH-01** | `content.css` / `content.js` | `content.css`: 1–635, `content.js`: 168–199 | Host CSS Leakage due to lack of Shadow DOM encapsulation. Global site CSS overrides extension toolbar buttons, typography, flex layouts. | Wrap floating toolbar and extension overlays in a closed Shadow Root (`attachShadow({ mode: 'closed' })`) and inject `content.css` into Shadow Root. |
| **HIGH-02** | `content.js` | 1487–1564 | Main-Thread Freezing / Jank during `scanAssets` deep DOM traversal. Synchronous loop over 12,000 nodes calling `getComputedStyle` up to 5x per node. | Chunk DOM traversal into micro-tasks using `requestIdleCallback` / `setTimeout` yielding execution, and parse colors via pure JS regex math instead of DOM node creation. |
| **HIGH-03** | `content.js` | 354–453, 455–547 | GSAP Animation State Corruption & Layout Collapse on rapid toolbar toggles. `this.toolbarTimeline.kill()` mid-flight leaves inline styles stuck (`width: 64px`, `opacity: 0.3`). | Replace imperative GSAP container dimension animations with CSS transition classes (`.is-collapsed`, `.is-expanded`) or call clean deterministic style reset on timeline kill. |
| **HIGH-04** | `content.js` | 1567–1589 | Uncaught CORS `SecurityError` Exception when accessing `rule.cssRules` on cross-origin stylesheet `@import` rules, crashing asset scanner. | Wrap all accesses to `rule.cssRules` and nested CSS rule blocks in `try...catch` at every level of iteration. |
| **HIGH-05** | `lib/extractor.js` | 830–879 | Ancestor backdrop extraction (`effectiveBackdropCss`) ignores parent `overflow: hidden`, `clip-path`, and `border-radius`, projecting unclipped parent background images. | Check parent `overflow`, `clip-path`, and `border-radius` during backdrop accumulation and compute intersection bounds/clip-path. |
| **HIGH-06** | `content.js` | 1407–1422 | Inaccurate Color Categorization in Asset Palette Scanner. 8-digit hex (`#RRGGBBAA`) drops alpha and `rgbToHex` fallback `#000000` misclassifies invalid colors as Dark/Neutral. | Support 8-char hex strings with alpha in `classifyColor` and return `'Other'` if `rgbToHex` returns fallback/invalid. |
| **HIGH-07** | `content.js` | 1067–1091 | Copy Button Loading State corrupts SVG button icon HTML on fast double-clicks when wiping `innerHTML` for `'Generating…'`. | Store original SVG markup separately outside DOM manipulation cycle or rely on dataset/CSS classes for loading state text. |
| **HIGH-08** | `background.js` | 333 | Cross-Tab Asset Access via Message Authorization Fallback. `sender.tab?.id ?? request.tabId` allows content scripts to read assets from arbitrary tabs. | Restrict `getNetworkAssets` to `sender.tab.id` exclusively. |
| **HIGH-09** | `background.js` | 63–75 | SSRF & Private Network Check Bypass via alternate IP formats (decimal `2130706433`, hex `0x7f000001`, octal `0177.0.0.1`, mapped IPv6 `::ffff:127.0.0.1`). | Normalize host IP addresses using URL API and IP regex/parsing before checking private network ranges. |
| **HIGH-10** | `background.js` | 232 | Regex Replacement String Substitution Injection in `expandImports`. `output.replace(match[0], ...)` interprets special replacement patterns (`$``, `$'`, `$&`). | Use functional replacement callback `() => imported` instead of direct replacement string. |

---

## 3. Medium Severity Defects (17)

| ID | Module | Lines | Description | Fix Strategy |
|---|---|---|---|---|
| **MED-01** | `content.js` | 661–702 | Selection Mode Cursor & Scroll Desynchronization Bug on scroll with stationary mouse pointer. | Recalculate `document.elementFromPoint(pointerX, pointerY)` on scroll events when in selection mode. |
| **MED-02** | `content.js` | 1093–1138 | Invalid CSS Value Input Handling & Instant Keystroke Validation Error in Property Editor. Mutates DOM inline style without undo stack. | Validate CSS property syntax on `blur`/`Enter`, and save original inline styles before mutation. |
| **MED-03** | `content.js` | 1798–1805 | Memory Leak in CSV Export Blob URL handling & unattached anchor element click. | Append anchor to body, click, remove anchor, and revoke Blob URL in short 1,000ms timeout. |
| **MED-04** | `content.js` | 204–211, 370–380 | Broken Position Reset Logic & hardcoded `lockToolbarPosition()` overriding drag offset comments. | Clean up position locking overrides and implement proper drag event handlers with `localStorage` offset persistence. |
| **MED-05** | `content.js` | 1765–1790 | Unsanitized `data:` and `blob:` URIs in asset download filename handler. | Detect `data:` / `blob:` schemes and derive file extension from MIME type. |
| **MED-06** | `content.css` | 33–61, 544–594 | Stacking Context Clipping & Z-Index Conflict when host `body` has `transform` or `contain`. | Mount top-level root extension container to `document.documentElement`. |
| **MED-07** | `content.js` | 1721–1747 | Keyboard Navigation Trap in Asset Category Tabs (lacks Roving Tabindex, `Home`, `End`). | Implement standard WAI-ARIA Roving Tabindex pattern with `Home`/`End` key handlers. |
| **MED-08** | `content.js` | 1873–1890 | Toast Notification Stacking & Timer Race condition causing flickering on rapid consecutive toasts. | Force DOM reflow or maintain toast transition animation queue. |
| **MED-09** | `lib/extractor.js` | 495–504 | SVG Attribute Alias Loss in React JSX Formatter (`xml:space`, `xmlns:xlink` converted to invalid JSX attributes). | Explicitly map XML/XLink namespace attributes in `toReactAttribute`. |
| **MED-10** | `content.js` | 1093–1138 | Property editing live feedback layout shift does not update selection outline bounds until `blur`. | Re-calculate `showSelectedOutline` on `input` when layout changes. |
| **MED-11** | `background.js` | 167–172 | `fetchWithTimeout` does not pass `AbortSignal` to body reader streaming logic in `responseBytesWithinLimit`. | Link AbortSignal into `responseBytesWithinLimit` reader cancellation. |
| **MED-12** | `content.js` / `PRD.md` | 1591, 1718 | Lottie files lack visual preview in Site Assets tab despite PRD specification. | Add static icon/frame fallback preview in Lottie asset list. |
| **MED-13** | `manifest.json` | 27–32 | Web Accessible Resource Static Fingerprinting allows host pages to detect extension presence. | Document fingerprinting risk or dynamic resource scoping if applicable. |
| **MED-14** | `background.js` | 255 | `enqueueStorageMutation` swallows errors without returning rejected promises to caller. | Propagate rejection in storage mutation queue handler. |
| **MED-15** | `background.js` | 374–377 | Memory Allocation Spike on large asset Base64 encoding using `String.fromCharCode(...bytes)`. | Process Base64 encoding in chunks or use `Buffer` / `FileReader` / `TextDecoder`. |
| **MED-16** | `background.js` | 144–155 | Tab Asset Accumulation on Single Page Application (SPA) soft route transitions. | Clear network assets on SPA navigation events. |
| **MED-17** | `package.json` / `tests/` | 1–11 | Missing background service worker tests and component integration tests. | Add unit tests for `background.js` message handling and storage operations. |

---

## 4. Low Severity & Documentation Defects (10)

| ID | Module | Lines | Description | Fix Strategy |
|---|---|---|---|---|
| **LOW-01** | `content.js` | 1052–1064 | Missing `isConnected` guard in Breadcrumb navigation for detached SPA DOM nodes. | Check `element?.isConnected` before selecting breadcrumb target. |
| **LOW-02** | `content.js` | 1388–1405 | SVG `cleanSVG` does not sanitize `<style>` tags or XML event attributes (`<set attributeName=...>`). | Sanitize SVG `<style>` blocks and strip event attributes. |
| **LOW-03** | `content.css` | 378, 614–629 | Responsive Layout Truncation on narrow viewports (<360px). | Use `repeat(auto-fit, minmax(120px, 1fr))` for copy options. |
| **LOW-04** | `AUDIT_REPORT.md` / `BUG_LIST.md` | Doc Crosswalk | Inconsistent defect ID mapping between AUDIT_REPORT and BUG_LIST registers. | Update doc files with unified crosswalk mapping table. |
| **LOW-05** | `lib/extractor.js` | 195–198 | Fallback `cssEscape` performs slow character-by-character regex replacements. | Prefer native `CSS.escape` when available. |
| **LOW-06** | `content.css` | 107–111 | Focus outline lacks high contrast forced-colors mode support. | Add `@media (forced-colors: active)` CSS rules. |
| **LOW-07** | `background.js` | 262–266 | `sanitizeDownloadFilename` allows trailing dots/spaces which are invalid on Windows OS. | Append `.replace(/[. ]+$/, '')` to sanitize filenames. |
| **LOW-08** | `content.js` | 1802 | CSV export blob URL retains 60s memory timeout unnecessarily. | Reduce revocation timeout to 10s. |
| **LOW-09** | `manifest.json` | 14–17 | Wildcard host permissions `<all_urls>` scrutiny. | Document host permissions justification in manifest comments / README. |
| **LOW-10** | `background.js` | 16–19 | `createId()` PRNG fallback using `Math.random()`. | Prefer `crypto.getRandomValues()` when `crypto.randomUUID` is unavailable. |
