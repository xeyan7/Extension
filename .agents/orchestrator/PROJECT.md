# Project: Chrome Extension Code Audit, Fixes & Polish

## Architecture
- Chrome Extension (Manifest V3)
- `background.js`: Service worker handling messages, storage, network requests, state management
- `content.js`: Main content script injected into pages managing UI components, floating bar, asset extraction, color palette, fonts, settings, DOM inspection
- `lib/extractor.js`: Utility library for asset extraction and DOM parsing
- `content.css`: Styling for injected UI floating bar, toast, overlays
- `tests/`: Unit test suite run via `npm test`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Code Audit & Defect Discovery | Audit repository, identify runtime exceptions, race conditions, memory leaks, XSS, insecure message passing, CSS conflicts. Produce defect register. | none | DONE |
| 2 | M2: Systematic Fixes & Hardening | Fix defects by severity (Critical, High, Medium, Low). Ensure zero regressions and security hardening. | M1 | DONE |
| 3 | M3: UX Polish & Final Verification | Refine floating bar interactions, toast feedback, keyboard nav, visual polish, verify `npm test` pass. | M2 | DONE |

## Interface Contracts
### background.js ↔ content.js
- Standardized extension messaging format: `{ action: string, data: object }`
- Secure response handling and error propagation

## Code Layout
- `background.js`
- `content.js`
- `content.css`
- `lib/extractor.js`
- `manifest.json`
- `tests/`
