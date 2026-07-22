# Project Roadmap — UI Component Copier

## Milestone 1 — Core Architectural Setup (COMPLETED)
- [x] Manifest V3 setup (`manifest.json`) with activeTab, storage, scripting, host permissions.
- [x] Background service worker (`background.js`) with action toggle & CORS stylesheet fetcher.
- [x] Injection of a flat off-white floating vertical toolbar (`#uicc-bar`) and drawer panel (`#uicc-panel`).

## Milestone 2 — Visual Inspector & Multi-Format Code Generation (COMPLETED)
- [x] DOM element hover highlight, spatial measurement guides, box-model overlays.
- [x] Keybindings: `Escape` key cancels inspection mode.
- [x] Auto-expansion of drawer panel upon component selection.
- [x] Multi-format code generation: HTML + CSS, Tailwind CSS, Vue 3 SFC, React JSX.
- [x] Live editable CSS properties grid inside drawer panel.

## Milestone 3 — Site Asset Discovery & AI Integration (COMPLETED)
- [x] Media crawler: Images, Videos, SVGs, Lottie files.
- [x] Typography & Color palette extractor with CSV export.
- [x] "✨ Copy for AI" prompt generator for Cursor / Claude workflows.

## Milestone 4 — Storage, Testing & Chrome Web Store Readiness (IN PROGRESS)
- [x] Local component library storage via `chrome.storage.local`.
- [ ] Comprehensive browser verification across complex real-world sites (Shadow DOM, dynamic CSS variables, nested iframes).
- [ ] Icon asset verification (16px, 32px, 48px, 128px PNGs).
- [ ] Production zip packaging for Chrome Web Store submission.
