# Original User Request

## Initial Request — 2026-07-26T02:38:03Z

Enhance and perfect the Chrome Extension (`My extension` at `e:\Extension\My extension`) for 1:1 visually exact, responsive, clean code extraction and component previewing across all websites, frameworks (Tailwind, Nuxt, Next.js, Bootstrap, custom CSS), and complex web components (SVG icons, gradient text, CSS variables, pseudo-elements, media queries, keyframe animations, shadow DOM).

Working directory: e:\Extension\My extension
Integrity mode: development

## Requirements

### R1. 1:1 Code Extraction Accuracy Engine
- Extract clean, self-contained, responsive HTML and CSS for any selected web component across arbitrary websites.
- Preserve original HTML classes, CSS custom properties (`var(--...)`), typography, background SVG data-URLs, CSS gradient clips, flex/grid layouts, responsive `@media` rules, `@font-face` fonts, pseudo-states (`:hover`, `:focus`, `::before`, `::after`), and `@keyframes` animations.
- Prevent hardcoded rigid pixel dimensions (`width: 257.982px; height: 71.3281px`) on non-media elements.
- Export to pure HTML+CSS, Tailwind CSS, Vue SFC (`.vue`), and React JSX formats without breaking layout or visual appearance.

### R2. 1:1 Miro-Level Component Preview & Overlay Experience
- Render component previews in a clean light-checkerboard iframe (`#ffffff` canvas with 16px `#f0f0f0` checkerboard grid) matching Miro's exact preview architecture.
- Ensure the preview iframe dynamically auto-scales content with correct aspect ratios, scroll boundaries, and zoom without warping or truncating elements.
- Display element breadcrumb paths, tag badges, element dimensions (`W × H px`), and quick-copy format buttons.
- Render accurate hover and selection highlight outlines (`1.5px dashed #6366F1`) on the live webpage without leaking internal selection classes into exported code.

## Acceptance Criteria

### Automated Verification
- [ ] All unit tests in `tests/*.test.js` pass with 100% success (`npm test`).
- [ ] Code extraction engine extracts clean HTML+CSS, Tailwind, Vue SFC, and React JSX for complex elements without syntax errors.
- [ ] Selector matching handles compound selectors, pseudo-elements, `:where()`, and `@layer` rules without dropping required styles.
- [ ] CSS variable resolution resolves color, opacity, and theme variables cleanly.
- [ ] Preview iframe renders exact extracted HTML and CSS without falling back to blank or degraded plain text.
