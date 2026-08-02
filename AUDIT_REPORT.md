# Repository-wide defect register

This register covers the Manifest V3 service worker, content runtime, extraction engine, floating interface, asset/library flows, permissions, test fixture, documentation, and development tooling. Items are ordered by user or security impact. Status is updated as each fix is verified.

## Fixed as of 2026-07-23

| ID | Area | Defect | Status |
|---|---|---|---|
| C-01 | Host-page safety | Generic `#sd-toolbar` ID → now uses unique `#uicc-ext-7f3a-toolbar` | Resolved |
| C-02 | Data privacy | Sensitive form fields → `isSensitiveFormControl` + value stripping | Resolved |
| C-03 | Local storage | Storage races → `enqueueStorageMutation` serializes operations | Resolved |
| C-04 | Local storage | `storageGet` ignoring lastError → properly checked | Resolved |
| C-05 | Background privacy | WebRequest tracks all tabs → dynamic listener registration | **Resolved** |
| C-06 | Memory safety | Limits exist for blob/canvas/css (MAX_BLOB_BYTES, MAX_CANVAS_PIXELS, etc.) | Resolved |
| H-05 | Keyboard access | Arrow keys + Enter/Space selection support | Resolved |
| H-06 | Generated CSS | `.uicc-s*`/`.uicc-c*` now include scope token per extraction | Resolved |
| H-07 | Sanitization | `iframe`, `object`, `embed`, `base`, refresh meta removed in clone | Resolved |
| H-08 | Background fetch | Streaming reader with byte limits instead of arrayBuffer() | Resolved |
| H-09 | Cross-origin fetch | `isPrivateHostname` + `senderMayAccessPrivateNetwork` checks | Resolved |
| H-10 | Network capture | Filtered by `activeTabs` + `shouldIgnoreNetworkUrl` | Resolved |
| M-01 | Page state | Body cursor saved/restored correctly | Resolved |
| M-04 | Clipboard fallback | Focus/selection restored after fallback copy | Resolved |
| M-07 | SVG scanning | Per-SVG element limit (2000) + 512KB outerHTML limit | **Resolved** |
| M-08 | Download safety | `sanitizeDownloadFilename` strips control chars | Resolved |
| M-10 | Asset colors | `rgbToHex` now handles modern color spaces (oklch, oklab, etc.) | **Resolved** |
| M-11 | Async controls | Download buttons use WeakSet guard against double-clicks | **Resolved** |
| M-13 | Tab semantics | ARIA tab/panel roles + `hidden` attribute toggling | Resolved |
| L-03 | Brand consistency | Icons use cream/green palette | Resolved |

## Open (accepted or deferred)

| ID | Area | Defect | Status |
|---|---|---|---|
| H-01 | Startup latency | GSAP, Tailwind, extractor injected on demand (manifest V3 content script design). Requires programmatic injection which is already used. | Deferred |
| H-02 | CSS collection | Bounded by MAX_COLLECTED_CSS_CHARS, MAX_RULES_PER_SHEET, MAX_STYLESHEETS | Monitored |
| H-03 | Asset scanning | Bounded by scanLimit (12000), rule budget (20000), per-element yields | Monitored |
| H-04 | Asset rendering | Media previews limited to 60 items, SVGs to 120, fonts/colors to 120/240 | Monitored |
| M-02 | Host-page safety | `isOwnUI` uses `data-uicc-owned` attribute prefix, not generic IDs | Resolved |
| M-03 | Selection lifecycle | `getExtraction` validates `element.isConnected` before proceeding | Resolved |
| M-05 | Asset freshness | 15s cache + Refresh button available | Accepted |
| M-06 | Failure recovery | Retry buttons present in asset/library error states | Resolved |
| M-09 | Style matching | Selector cache bounded to 1500 entries | Monitored |
| M-12 | Focus UX | `focusToolbar()` called after show/hide | Resolved |
| M-14 | Scrolling UX | `overscroll-behavior: contain` set on scrollable panel | Resolved |
| L-01 | Dead code | `computedDeclarations`/`removeInternalClasses` removed, others verified | Resolved |
| L-04 | Permissions | `http://*/* https://*/*` required for functionality; `tabs` not requested | Accepted |
| L-05 | Test coverage | 20 tests covering core extraction, security, accessibility | Ongoing |
| L-06 | Documentation | README updated to reflect user-initiated activation | Resolved |

## Accepted product constraints

- Exact extraction is inherently bounded: browser-internal pages, closed shadow roots, cross-origin frames, DRM media, and tainted canvases cannot be copied completely.
- A selected component can contain user-visible private text. The extension can prevent known credential fields from being serialized, but it cannot infer whether all ordinary visible text is confidential.
- Parsing and matching authored CSS still occurs on the page's main thread because the CSSOM and computed styles are DOM-bound. The implementation must cooperate and cap work rather than claim zero main-thread cost.
