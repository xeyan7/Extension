# HTML + CSS Code Extraction Feature — File Structure & Workflow

This document describes **only the code-extraction feature** (HTML + CSS output) of the UI Component Copier extension, and how it mirrors the Miro extension's pipeline.

> **Origin note:** The Miro extension is a proprietary, minified bundle with no public source. This repo contains a faithful *port* of its extraction system, reconstructed from the shipped bundle and kept 1:1 in behavior. The Miro function names each module mirrors are noted inline below.

---

## 1. File structure (files that participate in extraction)

```
manifest.json          → registers content scripts in load order (extractor → preview → content)
lib/extractor.js       → THE extraction engine (DOM clone + sanitize, authored-CSS scoping,
                         computed-style snapshot, HTML+CSS/tailwind/vue/react generators)
lib/preview.js         → Miro-mirrored preview pipeline (clean clone hn, scoped CSS xn,
                         standalone export doc Fn, iframe loader Gc, Tailwind detection dn)
lib/postcss.js         → PostCSS 8.4.47 (bundled ESM) — used to scope page CSS to the subtree
lib/tailwind-lib.js    → Tailwind converter (fn/Ar/dn) used by the Tailwind export button
content.js             → UI wiring: getExtraction(), generateHTMLCSS(), copyCode(), copyToClipboard()
background.js          → fetchExternalStylesheets (CORS bypass), formatCode (Prettier), copyToClipboard (offscreen doc)
offscreen.html|.js     → MV3 offscreen document that performs the real system-clipboard write
demo/extraction-demo.html → standalone browser demo proving the pipeline (no extension needed)
tests/…                → 245 tests (extractor, background, tier1–4 suites)
```

### Load order (critical)

`manifest.json` content script order guarantees `lib/extractor.js` (defines `global.UICCExtractor`) and `lib/preview.js` (defines `global.UICCPreview`) are available before `content.js` runs:

```json
"js": ["lib/gsap.min.js", "lib/tailwind-lib.js", "lib/extractor.js", "lib/preview.js", "content.js"]
```

---

## 2. Workflow (data flow for the HTML+CSS copy)

```
User clicks a component on the page
        │
        ▼
content.js  showSelectedComponent()
        │  preview iframe loads first (renderIframePreview)
        ▼
content.js  generateHTMLCSS(element)
        │   └── calls getExtraction(element)
        │         └── extractor.extract(element)
        ▼
lib/extractor.js  extract(element)          ── Miro Xe() orchestration
        │
        ├─ 1. cloneAndSanitize(element)
        │      • cloneNode(true), strip script/noscript/preload
        │      • remove extension UI (#sd-toolbar, .uicc-*, …)
        │      • add uicc-s{index} marker classes for CSS scoping
        │      • canvas → PNG data-URL, inputs/options/details state
        │      • attribute sanitization (on*, javascript:, nonce, integrity…)
        │      • absolute-URL rewrite (src, srcset, href…) + blob: → data: URL
        │      • processSvgElement() → computed fill/stroke/sizes on every SVG node
        │
        ├─ 2. scopeAuthoredCss(element, nodes)   ── Miro xn()
        │      • collectPageCss() = inline <style> + external sheets (via
        │        background fetchExternalStylesheets) + adoptedStyleSheets
        │      • PostCSS parse → keep selectors matching the subtree
        │      • rewrite descendant selectors to resolve inside exported root
        │      • resolve var(--x) against computed styles
        │      • keep only used @keyframes / @font-face / non-print @media
        │      • flatten @layer, strip comments, rewrite url() to absolute
        │
        ├─ 3. inlineStyleCss(nodes)  → inline style="" attrs as .uicc-s{n} rules
        ├─ 4. inheritedRootCss(element) → .exported-root {…} + body { color/font/bg }
        ├─ 5. snapshot fallback: if no authored+inline CSS, buildSnapshotCss()
        │      bakes every computed style into deduped classes (Miro's
        │      getComputedStyleSnapshot approach)
        │
        └─ 6. formatElement(clone) → pretty-printed HTML
             combined = `<!-- HTML -->\n${html}\n\n<style>\n${css}\n</style>`
             returns { html, css, combined, stats, preview }
        │
        ▼
content.js  copyCode('html')  →  generateHTMLCSS(element)
        │         returns result.combined
        ▼
content.js  copyToClipboard(combined)
        │   navigator.clipboard.writeText  →  execCommand('copy')  →  background
        ▼
background.js  case 'copyToClipboard'
        │   ensureOffscreenClipboardDocument()  (chrome.offscreen, reason CLIPBOARD)
        │   forwards { action: 'offscreenWrite', text }  ← distinct action on purpose
        ▼
offscreen.js  navigator.clipboard.writeText(text)   ← real write happens here
```

### The extraction contract

`extractor.extract(element, options)` returns:

```js
{
  html,      // pretty-printed, sanitized markup (no extension classes, no scripts)
  css,       // GLOBAL_RESET_CSS + inherited root + scoped authored CSS + inline CSS
  combined,  // `<!-- HTML -->\n${html}\n\n<style>\n${css}\n</style>`
  stats: { elements, cssRules, images, svgs },
  preview,   // full standalone HTML document (Miro Fn) — added by content.js getExtraction()
  clone      // the sanitized clone (used by React exporter)
}
```

The **HTML+CSS copy button** copies exactly `combined`.

---

## 3. Miro mirror map

| This repo | Mirrors Miro | Responsibility |
|-----------|--------------|----------------|
| `extractor.cloneAndSanitize` | `hn` | clean self-contained clone (URLs, blobs, SVG, scripts) |
| `extractor.scopeAuthoredCss` | `xn` | full-page CSS collected + scoped to subtree |
| `extractor.collectAllCss` / `preview.collectPageCss` | `mn` | inline + external stylesheet collection |
| `extractor.getComputedStyleSnapshot` / `buildSnapshotCss` | `getComputedStyleSnapshot` | bake computed styles inline (Tailwind fallback) |
| `preview.buildPreviewDocument` | `Fn` | standalone exported HTML document |
| `preview.writePreviewToIframe` | `Gc` | preview iframe + 150ms auto-scale, zoom ≥ 0.3, 60–300px height |
| `preview.detectTailwind` | `dn` | Tailwind detection |
| `preview.semanticHtmlCss` / `semanticScopedCss` | `vn(wn(…))` | semantic class-named HTML+CSS export |
| `extractor.toTailwind` | `fn` + `Ar` | Tailwind utility conversion |
| `background.formatCode` | Prettier | final formatting of copied code |
| `background` + `offscreen.js` | clipboard | real system clipboard write |

---

## 4. How to verify

```bash
npm run check          # syntax checks + all 245 tests
```

**Browser demo (no extension install needed):**

```bash
cd "E:\Extension\My extension"
python -m http.server 8080     # or: npx serve .   /   VS Code Live Server
# open http://localhost:8080/demo/extraction-demo.html
```

The demo loads the exact `lib/` files the extension uses, extracts the sample card with the real pipeline, shows HTML/CSS/combined tabs, renders a Miro-style checkerboard preview iframe, and copies to the system clipboard.

**Extension test in Chrome:**

1. `chrome://extensions` → Developer mode → **Load unpacked** → select this folder.
2. Open any site, click the pointer icon, hover a component, click it.
3. Press **HTML+CSS** → paste into an editor.

---

## 5. Design invariants

- **Zero leakage:** exported HTML/CSS never contains `uicc-*`, `sd-*`, or extension classes.
- **Security:** `on*` handlers, `javascript:`/`vbscript:` URLs, `nonce`, `integrity`, `contenteditable` are stripped; bidi control characters removed.
- **Fidelity:** rigid pixel `width/height` on non-media elements is dropped so layouts stay fluid; media queries, hover/focus states, `::before/::after`, `@keyframes`, `@font-face`, CSS variables, and gradient clips are preserved.
- **Fallbacks:** every stage degrades gracefully — no PostCSS → computed-style snapshot; no external sheets → inline only; no `navigator.clipboard` → execCommand → offscreen document.
