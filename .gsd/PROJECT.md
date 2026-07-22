# Project Blueprint — UI Component Copier Browser Extension

## Executive Overview
UI Component Copier is a Chrome Manifest V3 Browser Extension that empowers designers, developers, and learners to visually select any UI component on any webpage and instantly extract clean **HTML + CSS**, **Tailwind CSS**, **Vue 3 SFC**, or **React JSX** code. It also includes an automated Site Asset Crawler to audit and export media, fonts, colors, SVGs, and Lottie animations, alongside a local component library.

## Core Stack & Architecture
- **Extension Platform:** Chrome Extension Manifest V3 (`manifest.json`)
- **Content Injection Engine (`content.js` & `content.css`):**
  - **Flat Off-White Floating Vertical Toolbar (`#uicc-bar`):** Fixed right-middle UI anchor with 3 action icons (Component Selector, Site Assets, Profile & Saved Library).
  - **Flat Off-White Drawer Panel (`#uicc-panel`):** Expandable side panel displaying live code previews, properties editor, and asset inventory.
  - **Spatial DOM Inspector:** Bounding box highlights, spatial guides (`Me`/`Te`), box-model margins/paddings, and cursor coordinate tooltips.
- **Background Service Worker (`background.js`):**
  - Handles action click toggling, CORS external stylesheet fetching with recursive `@import` expansion (depth-5), and local storage persistence (`chrome.storage.local`).
- **Dependencies (`lib/`):**
  - `tailwind-lib.js`: Tailwind class generator and mapper.
  - `postcss.js`: Scoping engine for CSS isolation.

## Authoritative Documentation
- **[PRD.md](file:///e:/Extension/My%20extension/PRD.md)** — Core product requirements specification.
- **[IMPLEMENTATION_PLAN.md](file:///e:/Extension/My%20extension/IMPLEMENTATION_PLAN.md)** — Technical layout and architecture specification.
