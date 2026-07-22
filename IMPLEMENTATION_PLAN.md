# UI Component Copier - implemented architecture

The extension is a Manifest V3 browser extension with a single floating bar. It does not request the `sidePanel` permission, declare a `side_panel`, or create sidebar UI.

## Runtime

- `manifest.json` registers the service worker and content assets.
- `background.js` stores saved components, expands imported stylesheets, downloads assets, and tracks page network assets.
- `lib/extractor.js` sanitizes selected DOM, scopes matched authored CSS, preserves responsive/state/pseudo/animation/font rules, resolves variables and asset URLs, falls back to rendered styles when necessary, and generates HTML/CSS, Tailwind, Vue SFC, and React JSX output.
- `content.js` owns selection, the floating bar, live inspection, code actions, asset discovery, and the local component library.
- `content.css` contains the floating UI, inspection overlays, responsive layouts, focus states, reduced-motion behavior, loading states, empty states, and error states.

## Product behavior

1. The selector activates from the pointer icon while the bar stays compact.
2. Hovering shows element bounds and box-model measurements.
3. Clicking a page element expands the floating bar with preview, breadcrumbs, code formats, editable properties, and save controls.
4. The asset view combines DOM and network sources for images, video, audio, SVG, fonts, colors, gradients, and Lottie files.
5. The library stores up to 100 generated components locally, enforces per-item and total byte limits, and supports copy and confirmed deletion.
6. Clicking the browser action toggles the floating bar; restricted browser pages are ignored safely.

## Verification

- `node --check` validates all JavaScript entry points.
- `node --test tests/extractor.test.js` covers URL rewriting, sanitization helpers, selector parsing, responsive and interactive authored CSS, animations/fonts, React SVG output, manifest integrity, accessibility states, and the no-sidebar contract.
- `tests/fixture.html` is the deterministic render and exporter smoke fixture.
- `tests/smoke-*.png` record collapsed, selected, narrow asset, and exporter-pass states from local headless Chrome.
