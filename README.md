# UI Component Copier

A private, local-first Chrome extension for selecting any visible webpage component and copying it as HTML/CSS, Tailwind, Vue 3 SFC, or React JSX. The interface is always a floating bar; the extension does not use Chrome's sidebar or side-panel API.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder: `E:\Extension\My extension`.

The floating bar appears on regular `http` and `https` pages. Chrome blocks content scripts on internal pages such as `chrome://extensions`, the Chrome Web Store, and some PDF/system surfaces.

## Use

- **Pointer** - activate selection, hover a component, and click it. Use the up/down arrow keys to move through DOM elements or `Escape` to cancel.
- **Search** - scan page and network assets. Copy or download media, SVG, fonts, colors, gradients, and Lottie URLs.
- **Person** - open the local component library. Saved components stay in `chrome.storage.local` and can be copied or deleted.
- **Close** - hide the bar. Click the extension toolbar icon to show it again.

After selecting a component, choose HTML+CSS, Tailwind, Vue SFC, or React JSX. The extractor keeps matched authored styles—including media/container queries, hover/focus states, pseudo-elements, keyframes, font faces, CSS variables, and resolved asset URLs—with a computed-style fallback for inaccessible stylesheets. The live property rows can be edited before copying.

## Development checks

```powershell
node --check background.js
node --check content.js
node --check lib\extractor.js
node --no-warnings --test tests\extractor.test.js
```

The repository intentionally has no build step or external runtime dependency. Load the folder directly as an unpacked extension.
