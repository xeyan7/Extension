# Scope: Milestone 1 — 1:1 Code Extraction Accuracy Engine

## Mission
Enhance and perfect `lib/extractor.js` for 1:1 visually exact, responsive, clean code extraction across arbitrary websites, frameworks (Tailwind, Nuxt, Next.js, Bootstrap, custom CSS), and complex web components (SVG icons, gradient text, CSS variables, pseudo-elements, media queries, keyframe animations, shadow DOM).

## Requirements & Scope
- Clean, self-contained, responsive HTML and CSS extraction.
- Preserve original HTML classes, CSS custom properties (`var(--...)`), typography, background SVG data-URLs, CSS gradient clips, flex/grid layouts, responsive `@media` rules, `@font-face` fonts, pseudo-states (`:hover`, `:focus`, `::before`, `::after`), and `@keyframes` animations.
- Prevent hardcoded rigid pixel dimensions (`width: 257.982px; height: 71.3281px`) on non-media elements / layout containers.
- Selector matching: compound selectors, pseudo-elements, `:where()`, and `@layer` rules without dropping required styles.
- CSS variable resolution: resolve color, opacity, and theme variables cleanly.

## Key Files
- `lib/extractor.js`
- `tests/extractor.test.js`
