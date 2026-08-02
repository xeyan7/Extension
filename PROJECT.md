# Project: UI Component Copier Browser Extension

## Architecture
- Chrome Extension (Manifest V3) architecture with background service worker (`background.js`), content script UI (`content.js`, `content.css`), core CSS/HTML extraction engine (`lib/extractor.js`), asset helpers, and multi-format exporters.
- Data Flow:
  1. Selection Mode: Hover/click highlights on target webpage via `content.js`.
  2. Extraction Engine: `lib/extractor.js` parses DOM, computes styles, preserves CSS variables, pseudo-states/elements, `@keyframes`, `@media`, SVG data-URLs, cleans pixel dimensions.
  3. Export Generators: Pure HTML+CSS, Tailwind CSS, Vue SFC (`.vue`), React JSX (`.jsx`).
  4. Miro-Level Preview Component: Dynamic light-checkerboard iframe (`#ffffff` canvas, 16px `#f0f0f0` checkerboard grid) in `content.js`, auto-scaling aspect ratios, zoom/scroll boundaries, element breadcrumbs, W x H badges.

## Code Layout
- `manifest.json`: Extension Manifest V3 configuration
- `background.js`: Service worker handling permissions, tab messaging, asset network interception
- `content.js`: Selection overlay, Miro-style preview modal, UI floating bar, breadcrumbs, event handlers
- `content.css`: Floating bar styles, preview modal layout, outline highlights
- `lib/extractor.js`: DOM tree walker, CSS computed style calculation, CSS custom property resolution, SVG data-URL handling, pseudo-state extraction, responsive media query bundling, multi-format code generation (HTML+CSS, Tailwind, Vue SFC, React JSX)
- `tests/`: Automated unit & integration tests (`background.test.js`, `extractor.test.js`, `fixture.html`, `server.js`)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Track | Requirement-driven test suite (Tiers 1-4) & `TEST_READY.md` | none | IN_PROGRESS |
| 2 | Milestone 1: 1:1 Code Extraction Accuracy Engine | `lib/extractor.js`: CSS custom properties, pseudo-states/elements, media queries, keyframes, rigid pixel removal, selector matching | none | IN_PROGRESS |
| 3 | Milestone 2: Miro-Level Component Preview & Overlay Experience | `content.js`, `content.css`: Light-checkerboard iframe (`#ffffff` / 16px `#f0f0f0`), auto-scaling, breadcrumbs, tag badges, WxH badges, overlay outline (`1.5px dashed #6366F1`), zero class leakage | M1 | PLANNED |
| 4 | Milestone 3: Multi-Format Exporters (Tailwind, Vue, React) | `lib/extractor.js`, `content.js`: HTML+CSS, Tailwind CSS, Vue SFC, React JSX converters & format copy buttons | M1, M2 | PLANNED |
| 5 | Milestone 4: Final Integration, 100% Test Pass & Adversarial Hardening | E2E test suite validation (Phase 1) + Adversarial Tier 5 coverage hardening (Phase 2) | M1, M2, M3, E2E | PLANNED |

## Interface Contracts
### `lib/extractor.js` ↔ `content.js`
- `extractComponent(element, options)`: Returns `{ html, css, tailwind, vue, react, breadcrumbs, metadata: { tagName, dimensions: { width, height }, fontInfo, colors, bg } }`
- `renderPreviewIframe(container, html, css, options)`: Renders scale-to-fit preview in Miro light-checkerboard iframe.
