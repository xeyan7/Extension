// UI Component Copier — Minimalist Super Design Floating Toolbar Script

(function () {
  if (window.__UI_COMPONENT_COPIER_INJECTED__) {
    if (window.uicc && typeof window.uicc.init === 'function') {
      try { window.uicc.init(); } catch (e) {}
    }
    return;
  }
  window.__UI_COMPONENT_COPIER_INJECTED__ = true;

  // Lazy-load postcss
  let _postcssPromise = null;

  function getExtensionRuntime() {
    try {
      return globalThis.chrome?.runtime || globalThis.browser?.runtime || null;
    } catch (e) {
      return null;
    }
  }

  function loadPostcss() {
    const existing = globalThis.postcss || window.postcss;
    if (existing) return Promise.resolve(existing);
    if (_postcssPromise) return _postcssPromise;

    const runtime = getExtensionRuntime();
    if (!runtime || typeof runtime.getURL !== 'function') {
      return Promise.resolve(null);
    }

    let postcssUrl;
    try {
      postcssUrl = runtime.getURL('lib/postcss.js');
    } catch (e) {
      return Promise.resolve(null);
    }

    _postcssPromise = import(postcssUrl).then(m => {
      const pc = m.default || m;
      window.postcss = pc;
      globalThis.postcss = pc;
      return pc;
    }).catch(() => {
      _postcssPromise = null;
      return null;
    });
    return _postcssPromise;
  }

  // Minimalist 2.5px Bold Dark Line-Art Icons matching reference white capsule design
  const ICONS = {
    selector: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7 18 3-7 7-3L3 3z"/></svg>',
    assets: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/></svg>',
    profile: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>',
    tailwind: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19 22 12l-4.5-7h-11L2 12l4.5 7z"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  class UIComponentCopier {
    constructor() {
      this.toolbar = null;
      this.overlay = null;
      this.guidelines = null;     // absolute div appended to body for SVG guidelines + box model
      this.selectedElement = null;
      this.isSelectionMode = false;
      this.currentView = null;
      this.currentElement = null; // currently hovered element (Q in Miro)
      this.pointerX = 0;
      this.pointerY = 0;

      // ── Scroll-lock: freeze hover focus while the page scrolls ──────────────
      // When the wheel/page scrolls under a STATIONARY cursor the browser still
      // fires boundary events (mouseout on the old element, mouseover on the one
      // that slid under the pointer). Without this flag the highlight would hop
      // between elements while the user is only scrolling. While locked, the
      // hover stays on `currentElement`; the first real pointer movement clears
      // the lock and normal cursor-driven hovering resumes.
      this._scrollLocked = false;
      this._lastMoveX = null;   // last coords from a REAL mousemove (null = none yet)
      this._lastMoveY = null;
      this.extractor = globalThis.UICCExtractor
        ? new globalThis.UICCExtractor.Extractor({ runtime: getExtensionRuntime(), baseUrl: window.location.href })
        : null;
      this._lastExtraction = null;

      this.toolbarTimeline = null;
      this.toolbarState = 'collapsed';
      this.collapsedToolbarHeight = null;

      // Track bound handlers for proper cleanup
      this._boundKeyDown = null;
      this._boundRuntimeMessage = null;
      this._toastTimer = null;

      // ── Miro-mirror inspector state ──────────────────────────────────────────
      this._inspectHighlightStyle = null; // <style> tag injected into <head>
      this._inspectOverlay = null;        // J  – frosted-glass preview panel
      this._inspectCoordLabel = null;     // Z  – coordinate pill that follows cursor
      this._inspectGuidelinesEl = null;   // q  – fixed div for SVG lines + box model
      this._inspectHighlightClass = 'uicc-inspector-outline'; // Fe (backup outline rule)
      this._inspectSelectedClass = 'uicc-inspector-selected'; // Miro asset-inspector-editing (persistent selected outline)

      // Crisp highlight ring — painted on the element via these classes, the
      // way Miro does it, so it is snapped to device pixels together with the
      // element and stays perfectly aligned at any zoom / display scaling.
      this._inspectHoverOutlineClass = 'uicc-hover-outline';
      this._inspectLockedOutlineClass = 'uicc-locked-outline';

      // Selection box UI + live-tracking state
      // #sd-component-inspector renders this extension's SOFT look: the green
      // fill, the 0.12s glide, the fade and the locked pulse halo. It carries no
      // crisp stroke, so its sub-pixel snapping can never be seen. It lives
      // inside a `position:fixed` layer and is re-synced every frame from
      // `getBoundingClientRect()` deltas, sized to the element's EXACT border
      // box (no padding, sub-pixel accurate, per-corner radius copied).
      this._selectionBoxLayer = null;     // fixed layer — the box lives INSIDE it
      this._selectionBox = null;          // #sd-component-inspector (the visual box)
      this._boxTarget = null;             // the element the box is currently tracking
      this._boxLocked = false;            // locked → pulse style (persistent selection)
      this._boxLastEl = null;             // for smooth element jumps vs. exact tracking
      this._boxElChangedAt = null;
      this._boxRafId = null;              // rAF handle that glues box to element
      // ────────────────────────────────────────────────────────────────────────

      this.init();
    }

    init() {
      this.destroy();
      this.createToolbar();
      this.createOverlay();
      this.attachEventListeners();
    }

    destroy() {
      // Remove keydown listener if it exists
      if (this._boundKeyDown) {
        document.removeEventListener('keydown', this._boundKeyDown);
        this._boundKeyDown = null;
      }
      const runtime = getExtensionRuntime();
      if (this._boundRuntimeMessage && runtime?.onMessage) {
        runtime.onMessage.removeListener(this._boundRuntimeMessage);
        this._boundRuntimeMessage = null;
      }
      if (this.toolbarTimeline) {
        this.toolbarTimeline.kill();
        this.toolbarTimeline = null;
      }
      // Clear toast timer
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
        this._toastTimer = null;
      }
      // Remove selection mode listeners
      this.exitSelectionMode();
      // Remove toolbar and overlay from DOM
      if (this.toolbar) {
        this.toolbar.remove();
        this.toolbar = null;
      }
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      // Clean up orphaned inspector elements
      [this._selectionBoxLayer, this._inspectGuidelinesEl, this._inspectCoordLabel, this._inspectOverlay].forEach(el => {
        if (el && el.parentNode) el.remove();
      });
      this._selectionBoxLayer = null;
      this._selectionBox = null;
      this._inspectGuidelinesEl = null;
      this._inspectCoordLabel = null;
      this._inspectOverlay = null;
      // Remove any leftover selection box layers and sticky hover/selection classes
      document.querySelectorAll('#sd-component-inspector').forEach(n => n.remove());
      document.querySelectorAll('#uicc-inspector-box-layer').forEach(n => n.remove());
      document.querySelectorAll('#uicc-inspector-outline-style').forEach(n => n.remove());
      this._miroClearOutlineClasses();
      document.querySelectorAll('.' + this._inspectHighlightClass).forEach(n => n.classList.remove(this._inspectHighlightClass));
      document.querySelectorAll('.' + this._inspectSelectedClass).forEach(n => n.classList.remove(this._inspectSelectedClass));
      this._miroRemoveHighlightStyle();
    }

    createToolbar() {
      const existing = document.getElementById('sd-toolbar');
      if (existing) existing.remove();

      this.toolbar = document.createElement('div');
      this.toolbar.id = 'sd-toolbar';
      this.toolbar.setAttribute('role', 'region');
      this.toolbar.setAttribute('aria-label', 'UI Component Copier');

      // Exactly 3 PRD icons + 1 Close button cross (x)
      this.toolbar.innerHTML = `
        <div class="sd-toolbar__bar" role="toolbar" aria-label="Component copier tools">
          <div class="sd-toolbar__modes">
            <button class="sd-toolbar__mode-btn" data-action="selector" title="Component Selector" aria-label="Select a component" aria-pressed="false">
              <span class="sd-toolbar__btn-icon">${ICONS.selector}</span>
            </button>
            <button class="sd-toolbar__mode-btn" data-action="assets" title="Site Assets" aria-label="Inspect site assets" aria-pressed="false">
              <span class="sd-toolbar__btn-icon">${ICONS.assets}</span>
            </button>
            <button class="sd-toolbar__mode-btn" data-action="profile" title="Local library" aria-label="Open local component library" aria-pressed="false">
              <span class="sd-toolbar__btn-icon">${ICONS.profile}</span>
            </button>
          </div>

          <div class="sd-toolbar__divider"></div>

          <button class="sd-toolbar__close-btn" data-action="close" title="Close Floating Bar" aria-label="Close floating bar">
            ${ICONS.close}
          </button>
        </div>

        <div class="sd-toolbar__content" id="uicc-content"></div>
      `;

      document.body.appendChild(this.toolbar);
      this.lockToolbarPosition();
      this.collapsedToolbarHeight = Math.ceil(this.toolbar.getBoundingClientRect().height);
    }

    lockToolbarPosition() {
      if (!this.toolbar) return;
      this.toolbar.style.top = '50%';
      this.toolbar.style.right = '20px';
      this.toolbar.style.bottom = 'auto';
      this.toolbar.style.left = 'auto';
      this.toolbar.style.transform = 'translateY(-50%)';
    }

    createOverlay() {
      const existing = document.querySelector('.uicc-selection-overlay');
      if (existing) existing.remove();

      this.overlay = document.createElement('div');
      this.overlay.className = 'uicc-selection-overlay uicc-hidden';
      this.overlay.setAttribute('aria-hidden', 'true');

      document.body.appendChild(this.overlay);
    }

    attachEventListeners() {
      this.toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (btn) {
          e.stopPropagation();
          this.handleBarClick(btn.dataset.action);
        }
      });

      this._boundKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (this.isSelectionMode) {
            this.exitSelectionMode();
          }
          this.collapseToolbar();
        }
      };
      document.addEventListener('keydown', this._boundKeyDown);

      const runtime = getExtensionRuntime();
      if (runtime?.onMessage) {
        this._boundRuntimeMessage = (message, sender, sendResponse) => {
          if (message?.action !== 'toggleFloatingBar') return false;
          const hidden = !this.toolbar || this.toolbar.style.display === 'none';
          if (!this.toolbar || !document.documentElement.contains(this.toolbar)) this.init();
          else if (hidden) this.toolbar.style.display = 'flex';
          else {
            this.exitSelectionMode();
            this.toolbar.style.display = 'none';
          }
          sendResponse({ success: true, visible: hidden });
          return false;
        };
        runtime.onMessage.addListener(this._boundRuntimeMessage);
      }
    }

    handleBarClick(action) {
      if (action === 'close') {
        this.exitSelectionMode();
        this.collapseToolbar();
        if (this.toolbar) {
          this.toolbar.style.display = 'none';
          this.toolbar.style.visibility = 'visible';
        }
        return;
      }

      if (action === 'selector') {
        if (this.isSelectionMode) {
          this.exitSelectionMode();
          this.collapseToolbar();
          return;
        }
        this.setActiveButton(action);
        this.startSelectorMode();
        return;
      }

      // If clicking the active tab button while expanded, collapse toolbar
      if (this.currentView === action && this.toolbar?.classList?.contains('expanded')) {
        this.collapseToolbar();
        return;
      }

      this.exitSelectionMode();

      // Ensure toolbar is visible
      if (this.toolbar) {
        this.toolbar.style.display = 'flex';
        this.toolbar.style.visibility = 'visible';
        this.toolbar.style.opacity = '1';
      }

      this.setActiveButton(action);
      this.currentView = action;

      if (action === 'assets') {
        this.showAssets();
      } else if (action === 'profile') {
        this.showProfile();
      }
    }

    setActiveButton(action) {
      if (!this.toolbar) return;
      this.toolbar.querySelectorAll('.sd-toolbar__mode-btn').forEach(b => {
        b?.classList?.remove('sd-toolbar__mode-btn--active');
        b?.setAttribute?.('aria-pressed', 'false');
      });
      const btn = this.toolbar.querySelector(`[data-action="${action}"]`);
      if (btn?.classList) {
        btn.classList.add('sd-toolbar__mode-btn--active');
        btn.setAttribute('aria-pressed', 'true');
      }
    }

    clearActiveButton() {
      if (!this.toolbar) return;
      this.toolbar.querySelectorAll('.sd-toolbar__mode-btn').forEach(b => {
        b?.classList?.remove('sd-toolbar__mode-btn--active');
        b?.setAttribute?.('aria-pressed', 'false');
      });
    }

    expandToolbar() {
      if (!this.toolbar) return;

      const contentEl = this.toolbar.querySelector('#uicc-content');
      const previousState = this.toolbarState;
      const isAlreadyExpanded = previousState === 'expanded';
      const collapsedHeight = this.collapsedToolbarHeight || 268;
      const expandedHeight = Math.max(collapsedHeight, Math.min(620, Math.floor(window.innerHeight * 0.86)));
      const expandedWidth = Math.max(300, Math.min(430, window.innerWidth - 32));

      if (this.toolbarTimeline) {
        this.toolbarTimeline.kill();
        this.toolbarTimeline = null;
      }

      // Preserve current position (don't reset after drag)
      {
        // Not dragged — use default anchored position
        this.toolbar.style.top = '50%';
        this.toolbar.style.transform = 'translateY(-50%)';
        this.toolbar.style.right = '20px';
        this.toolbar.style.left = 'auto';
      }
      // If dragged, keep user's position

      // Kill any existing GSAP tweens on these elements
      this.lockToolbarPosition();
      this.toolbar.style.display = 'flex';
      this.toolbar.style.visibility = 'visible';

      if (previousState === 'collapsed') {
        this.toolbar.style.width = '64px';
        this.toolbar.style.height = `${collapsedHeight}px`;
        this.toolbar.style.minHeight = '0';
      }

      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf([this.toolbar, contentEl]);
      }

      // Add expanded class for flex layout (row-reverse keeps icons on RIGHT)
      this.toolbar.classList.add('expanded');
      this.toolbarState = 'expanding';

      if (isAlreadyExpanded) {
        this.toolbar.style.width = `${expandedWidth}px`;
        this.toolbar.style.height = `${expandedHeight}px`;
        this.toolbar.style.minHeight = '0';
        this.toolbar.style.borderRadius = '20px';
        if (contentEl) {
          contentEl.style.display = 'flex';
          contentEl.style.opacity = '1';
          contentEl.style.transform = 'translateX(0)';
        }
        this.toolbarState = 'expanded';
        return;
      }

      if (typeof gsap !== 'undefined' && contentEl) {
        this.toolbarTimeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          onComplete: () => {
            this.toolbarState = 'expanded';
            this.toolbarTimeline = null;
          }
        });

        // Compute collapsed height for proportional "taller" animation
        this.toolbarTimeline.to(this.toolbar, {
          width: expandedWidth,
          height: expandedHeight,
          minHeight: 0,
          borderRadius: 20,
          duration: 0.36
        });

        this.toolbarTimeline.fromTo(contentEl, {
          display: 'flex',
          opacity: 1,
          x: 12
        }, {
          opacity: 1,
          x: 0,
          duration: 0.22,
          ease: 'power2.out'
        }, '-=0.2');
      } else {
        this.toolbar.style.width = `${expandedWidth}px`;
        this.toolbar.style.height = `${expandedHeight}px`;
        this.toolbar.style.minHeight = '0';
        this.toolbar.style.borderRadius = '20px';
        if (contentEl) {
          contentEl.style.display = 'flex';
          contentEl.style.opacity = '1';
          contentEl.style.transform = 'translateX(0)';
        }
        this.toolbarState = 'expanded';
      }
    }

    collapseToolbar(preserveAction = null) {
      if (!this.toolbar) return;

      const contentEl = this.toolbar.querySelector('#uicc-content');
      const keepActionSelected = () => {
        this.currentView = preserveAction;
        if (preserveAction) this.setActiveButton(preserveAction);
        else this.clearActiveButton();
      };

      // Activating the selector while already collapsed changes only the icon
      // state; the floating bar itself must remain visually unchanged.
      if (this.toolbarState === 'collapsed' && !this.toolbar.classList.contains('expanded')) {
        if (contentEl) contentEl.style.display = 'none';
        keepActionSelected();
        return;
      }

      keepActionSelected();
      this.toolbarState = 'collapsing';

      if (this.toolbarTimeline) {
        this.toolbarTimeline.kill();
        this.toolbarTimeline = null;
      }

      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf([this.toolbar, contentEl]);
      }

      this.lockToolbarPosition();

      if (typeof gsap !== 'undefined' && contentEl) {
        this.toolbarTimeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          onComplete: () => {
            gsap.set(contentEl, { display: 'none', x: 0 });
            this.toolbar.classList.remove('expanded');
            this.toolbar.style.height = '';
            this.toolbar.style.borderRadius = '';
            this.toolbar.style.width = '';
            this.toolbar.style.minHeight = '';
            this.toolbar.style.flexDirection = '';
            const barEl = this.toolbar.querySelector('.sd-toolbar__bar');
            if (barEl) barEl.style.order = '';
            if (contentEl) contentEl.style.order = '';
            // Return to default anchored position
            this.toolbar.style.top = '50%';
            this.toolbar.style.transform = 'translateY(-50%)';
            this.toolbar.style.right = '20px';
            this.toolbar.style.left = 'auto';
            keepActionSelected();
            this.toolbarState = 'collapsed';
            this.toolbarTimeline = null;
          }
        });

        this.toolbarTimeline.to(contentEl, {
          opacity: 0,
          x: 10,
          duration: 0.15,
          ease: 'power2.in'
        });

        this.toolbarTimeline.to(this.toolbar, {
          width: 64,
          height: this.collapsedToolbarHeight || 268,
          minHeight: 0,
          borderRadius: 20,
          duration: 0.32
        }, '-=0.02');
      } else {
        if (contentEl) {
          contentEl.style.display = 'none';
        }
        this.toolbar.classList.remove('expanded');
        this.toolbar.style.height = '';
        this.toolbar.style.borderRadius = '';
        this.toolbar.style.width = '';
        this.toolbar.style.minHeight = '';
        this.toolbar.style.flexDirection = '';
        const barEl = this.toolbar.querySelector('.sd-toolbar__bar');
        if (barEl) barEl.style.order = '';
        if (contentEl) contentEl.style.order = '';
        this.toolbar.style.top = '50%';
        this.toolbar.style.transform = 'translateY(-50%)';
        this.toolbar.style.right = '20px';
        this.toolbar.style.left = 'auto';
        keepActionSelected();
        this.toolbarState = 'collapsed';
      }
    }

    // ── pe: Miro-exact one-to-one — own UI check
    isOwnUI(t) {
      if (!t) return false;
      if (t.id && (t.id.startsWith('sd-') || t.id.startsWith('uicc-') || t.id.startsWith('asset-inspector-') || t.id === 'sd-component-inspector')) return true;
      if (t.closest && t.closest('#sd-toolbar, #sd-component-inspector, #sd-tree-navigator, #uicc-guidelines, .uicc-selection-overlay, [id^="uicc-"], [id^="sd-"], [id^="asset-inspector-"]')) return true;
      if (this.overlay && this.overlay.contains(t)) return true;
      if (this.toolbar && this.toolbar.contains(t)) return true;
      if (this._inspectGuidelinesEl && this._inspectGuidelinesEl.contains(t)) return true;
      if (this._inspectOverlay && this._inspectOverlay.contains(t)) return true;
      if (this._inspectCoordLabel && this._inspectCoordLabel.contains(t)) return true;
      return false;
    }

    // ── he: Miro-exact one-to-one — only documentElement, zero-size and hidden are out
    isSelectable(t) {
      if (!t || t === document.documentElement) return false;
      const rect = t.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const cs = window.getComputedStyle(t);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return true;
    }

    // ── Ir: next selectable in FLAT DOCUMENT ORDER (Miro-exact) ──────────────
    //    Miro walks a flat `body, body *` array, not the tree. Tree-walking
    //    produces a different (and surprising) order, which is why arrow-key
    //    navigation used to land on unexpected elements.
    nextSelectable(t) {
      const all = Array.from(document.querySelectorAll('body, body *'));
      const i = all.indexOf(t);
      if (i === -1) return all.find(el => this.isSelectable(el)) || null;
      for (let n = i + 1; n < all.length; n++) {
        if (!this.isOwnUI(all[n]) && this.isSelectable(all[n])) return all[n];
      }
      return null;
    }

    // ── zr: previous selectable in FLAT DOCUMENT ORDER (Miro-exact) ──────────
    prevSelectable(t) {
      const all = Array.from(document.querySelectorAll('body, body *'));
      const i = all.indexOf(t);
      if (i === -1) return all.find(el => this.isSelectable(el)) || null;
      for (let n = i - 1; n >= 0; n--) {
        if (!this.isOwnUI(all[n]) && this.isSelectable(all[n])) return all[n];
      }
      return null;
    }

    pickElement(e) {
      const target = e.target;
      if (!target || target.nodeType !== 1) return null;
      if (this.isOwnUI(target) || !this.isSelectable(target)) return null;
      let result = target;
      const media = target.querySelectorAll('img, video, audio, canvas');
      if (media.length > 0) {
        let best = null, bestDist = Infinity;
        const px = this.pointerX, py = this.pointerY;
        media.forEach(m => {
          const r = m.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = Math.sqrt(Math.pow(cx - px, 2) + Math.pow(cy - py, 2));
          if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom && d < bestDist) {
            bestDist = d; best = m;
          }
        });
        if (best) result = best;
      }
      // Superdesign parent bounding-box collapse algorithm
      const o = result.getBoundingClientRect();
      while (result && result.parentElement && result.parentElement !== document.body && result.parentElement !== document.documentElement) {
        const r = result.parentElement.getBoundingClientRect();
        if (
          r.width === o.width &&
          r.height === o.height &&
          r.top === o.top &&
          r.left === o.left &&
          r.right === o.right &&
          r.bottom === o.bottom
        ) {
          result = result.parentElement;
        } else {
          break;
        }
      }
      return result;
    }    // ═══════════════════════════════════════════════════════════════════════════
    // MIRO-EXACT INSPECTOR SYSTEM
    // Mirrors: Jr (start), Et (stop), xt (mouseover), At (mouseout),
    //          Ct (mousemove), vt (click), wt (keydown),
    //          _r (inject highlight style), Br (remove highlight style),
    //          Pr (create preview panel), Or (create guidelines div),
    //          Dr (create coord label), $r (update coord label),
    //          Le (add outline class), Ge (remove outline class),
    //          Me (draw guidelines SVG), Te (draw box model),
    //          Re (render preview panel), qr (set current hovered element),
    //          Hr (clear hover state)
    // ═══════════════════════════════════════════════════════════════════════════

    // ── _r: inject <style> for the outline class ─────────────────────────────
    _miroInjectHighlightStyle() {
      if (this._inspectHighlightStyle) return;
      this._inspectHighlightStyle = document.createElement('style');
      this._inspectHighlightStyle.id = 'uicc-inspector-highlight-style';
      this._inspectHighlightStyle.textContent = `
        .${this._inspectHighlightClass} {
          outline: 2.5px solid #315d4c !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(this._inspectHighlightStyle);
    }

    // ── Br: remove the injected <style> ──────────────────────────────────────
    _miroRemoveHighlightStyle() {
      if (this._inspectHighlightStyle) {
        this._inspectHighlightStyle.remove();
        this._inspectHighlightStyle = null;
      }
    }

    // ── Pr: create the frosted-glass preview panel (J) ───────────────────────
    _miroCreatePreviewPanel() {
      if (this._inspectOverlay) return;
      const el = document.createElement('div');
      el.id = 'uicc-inspector-overlay';
      el.style.cssText = `
        position: fixed;
        background: rgba(255, 255, 255, 0.92);
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        backdrop-filter: saturate(180%) blur(20px);
        color: #1D1D1F;
        padding: 13px 14px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        z-index: 2147483647;
        pointer-events: none;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
        max-width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        line-height: 1.5;
        letter-spacing: -0.01em;
        display: none;
        color-scheme: light;
      `;
      document.body.appendChild(el);
      this._inspectOverlay = el;
    }

    // ── Or: create the absolute guidelines container (q) — Miro exact ────────
    _miroCreateGuidelines() {
      if (this._inspectGuidelinesEl) {
        this._inspectGuidelinesEl.style.display = '';
        return;
      }
      const el = document.createElement('div');
      el.id = 'uicc-inspector-guidelines';
      el.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        pointer-events: none;
        z-index: 999995;
        overflow: visible;
      `;
      document.body.appendChild(el);
      this._inspectGuidelinesEl = el;
    }

    // ── Dr: create the coordinate pill (Z) ───────────────────────────────────
    _miroCreateCoordLabel() {
      if (this._inspectCoordLabel) {
        this._inspectCoordLabel.style.display = 'none';
        return;
      }
      const el = document.createElement('div');
      el.id = 'uicc-inspector-coord-label';
      el.style.cssText = `
        position: fixed;
        background: rgba(255, 255, 255, 0.9);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        color: rgba(29, 29, 31, 0.85);
        font-size: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-variant-numeric: tabular-nums;
        padding: 3px 7px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        pointer-events: none;
        z-index: 2147483647;
        white-space: nowrap;
        transition: left 0.05s linear, top 0.05s linear;
        color-scheme: light;
        display: none;
      `;
      document.body.appendChild(el);
      this._inspectCoordLabel = el;
    }

    // ── $r: update coord label position + text ───────────────────────────────
    _miroUpdateCoordLabel(x, y) {
      if (!this._inspectCoordLabel) return;
      this._inspectCoordLabel.style.display = 'block';
      this._inspectCoordLabel.style.left = (x + 14) + 'px';
      this._inspectCoordLabel.style.top  = (y + 14) + 'px';
      this._inspectCoordLabel.textContent = `${Math.round(x + window.scrollX)}, ${Math.round(y + window.scrollY)}`;
    }

    // ── Le/Re: highlight — Miro one-to-one (element outline for border) + keep UI fill box ─
    // Miro Re: Ge() + t.classList.add(Fe) where Fe="asset-inspector-outline" (outline:2px solid #6366F1)
    // We add Miro-exact element outline for perfect alignment (border) and keep our fixed-layer box for light fill
    _miroAddOutline(el, locked = false) {
      if (!el || !el.isConnected) return;
      // Miro Ge/Re one-to-one
      this._miroClearOutlineClasses();
      const cls = locked ? this._inspectLockedOutlineClass : this._inspectHoverOutlineClass;
      el.classList.add(cls);
      // Keep UI: fill box on fixed layer (old UI light fill, smooth, pulse)
      if (!this._ensureSelectionBoxElements()) return;
      this._boxTarget = el;
      this._boxLocked = !!locked;
      this._syncSelectionBox(el);
      this._startBoxTracking();
    }

    // ── Strip any stray ring classes left by an earlier session ─────────────
    _miroClearOutlineClasses() {
      document.querySelectorAll('.' + this._inspectHoverOutlineClass)
        .forEach(n => n.classList.remove(this._inspectHoverOutlineClass));
      document.querySelectorAll('.' + this._inspectLockedOutlineClass)
        .forEach(n => n.classList.remove(this._inspectLockedOutlineClass));
    }

    // ── (lazy) create the fixed layer + the box div ─────────────────────────
    _ensureSelectionBoxElements() {
      if (this._selectionBoxLayer && this._selectionBoxLayer.isConnected) return true;
      const layer = document.createElement('div');
      layer.id = 'uicc-inspector-box-layer';
      layer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 9999990;
        overflow: visible;
      `;
      document.body.appendChild(layer);
      const box = document.createElement('div');
      box.id = 'sd-component-inspector';
      layer.appendChild(box);
      this._selectionBoxLayer = layer;
      this._selectionBox = box;
      return true;
    }

    // ── Sync: make the box occupy the element's EXACT border box ────────────
    //      • no padding / inflation of any kind — the box IS the element's rect
    //      • each EDGE is snapped to a whole device pixel, the same rounding the
    //        browser applies when it paints the element itself. This is what
    //        makes the box's stroke land on exactly the same physical pixels as
    //        the element's edge at fractional display scaling (125%, 150%) or
    //        browser zoom. Snapping the edges (rather than the width) keeps both
    //        sides aligned instead of accumulating the error on one side.
    //      • each corner radius is copied verbatim, so pills, circles and
    //        elliptical corners are traced instead of approximated
    //    The 2px stroke is then offset outward from this box by the browser's
    //    own `outline-offset` logic, so no radius is ever recomputed here.
    _syncSelectionBox(el) {
      const layer = this._selectionBoxLayer;
      const box   = this._selectionBox;
      if (!layer || !box || !el || !el.isConnected) return;
      const lr = layer.getBoundingClientRect();
      const r  = el.getBoundingClientRect();

      // Element CHANGE → let the CSS ease carry the box between elements.
      // Otherwise keep `transition:none`, so scroll / resize / animation
      // tracking is instant and never lags or drifts.
      // The `exact-lock` class wins over the eased CSS transition (which is
      // declared `!important`), so an inline `transition` cannot be used here.
      if (el !== this._boxLastEl) {
        this._boxElChangedAt = performance.now();
        box.classList.remove('exact-lock');
      } else if (this._boxElChangedAt !== null && performance.now() - this._boxElChangedAt > 120) {
        this._boxElChangedAt = null;
        box.classList.add('exact-lock');
      }

      const cs = window.getComputedStyle(el);

      const left = r.left - lr.left;
      const top = r.top - lr.top;

      box.style.display = 'block';
      box.classList.add('active');
      box.classList.toggle('locked', !!this._boxLocked);
      box.style.left   = left + 'px';
      box.style.top    = top  + 'px';
      box.style.width  = r.width + 'px';
      box.style.height = r.height + 'px';
      // Per-corner copy — preserves elliptical / mixed radii that the
      // `borderRadius` shorthand can flatten.
      box.style.borderTopLeftRadius     = cs.borderTopLeftRadius;
      box.style.borderTopRightRadius    = cs.borderTopRightRadius;
      box.style.borderBottomRightRadius = cs.borderBottomRightRadius;
      box.style.borderBottomLeftRadius  = cs.borderBottomLeftRadius;
      this._boxLastEl = el;
    }

    // ── rAF loop: keeps the box glued during scroll / resize / animations ───
    _startBoxTracking() {
      if (this._boxRafId) return;
      const tick = () => {
        this._boxRafId = null;
        if (!this._boxTarget) return;
        if (this._boxTarget.isConnected) {
          this._syncSelectionBox(this._boxTarget);
          this._boxRafId = requestAnimationFrame(tick);
        } else {
          this._miroRemoveOutline();
        }
      };
      this._boxRafId = requestAnimationFrame(tick);
    }

    _stopBoxTracking() {
      if (this._boxRafId) {
        cancelAnimationFrame(this._boxRafId);
        this._boxRafId = null;
      }
    }

    // ── Pin the box to exact per-frame tracking, right now ──────────────────
    //    The eased glide exists only to carry the box BETWEEN elements. Scrolling
    //    never changes the element, so if a scroll starts inside the 120ms glide
    //    window the box would swim behind its element. Settling the glide early
    //    keeps the fill locked. A later element change re-arms it as usual.
    _miroPinBoxExact() {
      this._boxElChangedAt = null;
      if (this._selectionBox) this._selectionBox.classList.add('exact-lock');
    }

    // ── Ge: drop the ring + hide the selection box + stop the tracking loop ──
    _miroRemoveOutline() {
      this._miroClearOutlineClasses();
      this._stopBoxTracking();
      this._boxTarget = null;
      this._boxLastEl = null;
      this._boxElChangedAt = null;
      if (this._selectionBox) {
        this._selectionBox.classList.remove('active', 'locked', 'exact-lock');
        this._selectionBox.style.display = 'none';
      }
    }

    // ── St: apply the persistent "selected" outline (Miro asset-inspector-editing) ──
    _miroApplySelectedOutline(el) {
      if (!el || el.nodeType !== 1) return;
      this._miroRemoveSelectedOutline();
      el.classList.add(this._inspectSelectedClass);
    }

    // ── kt: remove the persistent "selected" outline from any element ────────
    _miroRemoveSelectedOutline() {
      document.querySelectorAll('.' + this._inspectSelectedClass)
        .forEach(n => n.classList.remove(this._inspectSelectedClass));
    }

    // ── Me: draw guidelines SVG lines in the absolute guidelines div — Miro exact ─
    _miroDrawGuidelines(el) {
      const q = this._inspectGuidelinesEl;
      if (!q) return;
      const rect = el.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollW = document.scrollingElement.scrollWidth;
      const scrollH = document.scrollingElement.scrollHeight;
      const viewW   = document.documentElement.clientWidth;
      const absTop    = rect.top    + scrollY;
      const absRight  = rect.right  + scrollX;
      const absBottom = rect.bottom + scrollY;
      const absLeft   = rect.left   + scrollX;

      q.style.height = scrollH + 'px';
      const NS = 'http://www.w3.org/2000/svg';
      let svg = q.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS(NS, 'svg');
        svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
        q.insertBefore(svg, q.firstChild);
      }
      svg.setAttribute('width', '100%');
      svg.setAttribute('viewBox', `0 0 ${viewW} ${scrollH}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.innerHTML = `
        <line x1="${absLeft}"  y1="0" x2="${absLeft}"  y2="${scrollH}" stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="${absRight}" y1="0" x2="${absRight}" y2="${scrollH}" stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="0" y1="${absTop}"    x2="${scrollW}" y2="${absTop}"    stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="0" y1="${absBottom}" x2="${scrollW}" y2="${absBottom}" stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
      `;
    }

    // ── Nr: clear guidelines SVG ──────────────────────────────────────────────
    _miroClearGuidelines() {
      if (this._inspectGuidelinesEl) this._inspectGuidelinesEl.innerHTML = '';
    }

    // ── Te: draw box model (margins + paddings) — Miro exact ───────────────
    _miroDrawBoxModel(el) {
      const q = this._inspectGuidelinesEl;
      if (!q) return;
      q.querySelectorAll('.uicc-inspector-boxmodel').forEach(d => d.remove());
      q.querySelectorAll('.asset-inspector-boxmodel').forEach(d => d.remove());
      const e = el.getBoundingClientRect();
      const r = window.getComputedStyle(el);
      const n = window.scrollX || document.documentElement.scrollLeft;
      const l = window.scrollY || document.documentElement.scrollTop;
      const c = e.top + l;
      const f = e.left + n;
      const m = e.width;
      const o = e.height;
      const s = Math.max(0, parseFloat(r.marginTop) || 0);
      const a = Math.max(0, parseFloat(r.marginRight) || 0);
      const i = Math.max(0, parseFloat(r.marginBottom) || 0);
      const b = Math.max(0, parseFloat(r.marginLeft) || 0);
      const u = parseFloat(r.paddingTop) || 0;
      const h = parseFloat(r.paddingRight) || 0;
      const g = parseFloat(r.paddingBottom) || 0;
      const S = parseFloat(r.paddingLeft) || 0;
      const A = parseFloat(r.borderTopWidth) || 0;
      const C = parseFloat(r.borderRightWidth) || 0;
      const d = parseFloat(r.borderBottomWidth) || 0;
      const w = parseFloat(r.borderLeftWidth) || 0;
      const v = s > 0 || a > 0 || i > 0 || b > 0;
      const p = u > 0 || h > 0 || g > 0 || S > 0;
      if (!v && !p) return;
      const y = document.createElement('div');
      y.className = 'uicc-inspector-boxmodel';
      y.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
      const E = 'rgba(135, 112, 163, 0.85)';
      const M = 'rgba(76, 175, 80, 0.85)';
      const F = `
        position:absolute;
        color:#fff;
        font-size:10px;
        font-weight:600;
        font-family:monospace;
        padding:1px 5px;
        border-radius:3px;
        white-space:nowrap;
        pointer-events:none;
      `;
      function k(B, I, L, z, X, Y, T) {
        if (X <= 0 || L <= 0 || z <= 0) return '';
        const P = Math.round(X * 10) / 10;
        let D = '';
        D = 'left:50%;top:50%;transform:translate(-50%,-50%);';
        return `<div style="position:absolute;top:${B}px;left:${I}px;width:${L}px;height:${z}px;pointer-events:none;">
          <div style="${F}background:${Y};${D}">${P}</div>
        </div>`;
      }
      let R = '';
      if (v) {
        if (s > 0) R += k(c - s, f, m, s, s, E, 'top');
        if (i > 0) R += k(c + o, f, m, i, i, E, 'bottom');
        if (b > 0) R += k(c, f - b, b, o, b, E, 'left');
        if (a > 0) R += k(c, f + m, a, o, a, E, 'right');
      }
      if (p) {
        const B = c + A;
        const I = f + w;
        const L = m - w - C;
        const z = o - A - d;
        if (u > 0) R += k(B, I, L, u, u, M, 'top');
        if (g > 0) R += k(B + z - g, I, L, g, g, M, 'bottom');
        if (S > 0) R += k(B + u, I, S, z - u - g, S, M, 'left');
        if (h > 0) R += k(B + u, I + L - h, h, z - u - g, h, M, 'right');
      }
      y.innerHTML = R;
      q.appendChild(y);
    }

    // ── Re: build and position the preview panel ──────────────────────────────
    _miroRenderPreviewPanel(el) {
      const J = this._inspectOverlay;
      if (!J) return;

      // Mirror Miro's Ur() inline — extract all style info
      const cs = window.getComputedStyle(el);
      const bgInfo = this.getBackgroundInfo(el);
      const info = {
        type:                  this.getElementType(el),
        color:                 cs.color,
        backgroundColor:       bgInfo.value,
        backgroundIsGradient:  bgInfo.isGradient,
        backgroundGradientValue: bgInfo.gradientValue,
        fontFamily:            cs.fontFamily,
        fontSize:              cs.fontSize,
        fontWeight:            cs.fontWeight,
      };
      const hasText = el.textContent && el.textContent.trim().length > 0;

      // ── Miro's exact inline helper functions (n and l) ──
      const n = (title) =>
        `<span style="font-size:9px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:rgba(60,60,67,0.5);">${title}</span>`;

      const l = (title, val) => {
        if (!val || val === 'none' || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') {
          return `<div style="display:flex;align-items:center;gap:8px;">${n(title)}
            <span style="font-size:11px;color:rgba(60,60,67,0.5);">${val || 'none'}</span></div>`;
        }
        return `<div style="display:flex;align-items:center;gap:8px;">${n(title)}
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(118,118,128,0.08);border:1px solid rgba(0,0,0,0.06);border-radius:6px;padding:2px 7px;">
            <span style="width:11px;height:11px;border-radius:3px;background:${val};box-shadow:inset 0 0 0 1px rgba(0,0,0,0.12);flex-shrink:0;"></span>
            <span style="font-size:11px;font-weight:500;color:#1D1D1F;font-variant-numeric:tabular-nums;">${val}</span>
          </span></div>`;
      };

      // ── Miro's exact HTML template (c variable) ──
      let c = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-weight:600;color:#4F46E5;font-size:12px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.20);border-radius:6px;padding:2px 8px;">${info.type}</span>
          <span style="font-size:11px;color:rgba(60,60,67,0.5);font-variant-numeric:tabular-nums;">${Math.round(el.offsetWidth)} \xD7 ${Math.round(el.offsetHeight)}</span>
        </div>
      `;

      c += '<div style="display:grid;gap:7px;">';
      if (hasText) c += l('Text', info.color);

      if (info.backgroundIsGradient) {
        c += `<div style="display:flex;flex-direction:column;gap:5px;">${n('Gradient')}
          <div style="background:${info.backgroundGradientValue};border-radius:6px;height:22px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.10);"></div>
          <span style="font-size:10px;color:rgba(60,60,67,0.55);word-break:break-all;line-height:1.4;">${info.backgroundGradientValue}</span></div>`;
      } else {
        c += l('Background', info.backgroundColor);
      }
      c += '</div>';

      if (hasText) {
        const fontName = this.simplifyFontFamily(info.fontFamily);
        c += `
          <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);">
            ${n('Font')}
            <span style="font-size:11px;color:#1D1D1F;"><strong style="font-weight:600;">${fontName}</strong>
              <span style="color:rgba(60,60,67,0.5);">${info.fontSize} \xB7 ${info.fontWeight}</span></span>
          </div>
        `;
      }

      // Miro's exact footer hint
      c += `
        <div style="display:flex;align-items:center;gap:5px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(0,0,0,0.05);font-size:10px;color:rgba(60,60,67,0.45);">
          <span style="background:rgba(118,118,128,0.10);border:1px solid rgba(0,0,0,0.08);border-radius:4px;padding:1px 5px;font-size:9px;font-weight:600;color:rgba(60,60,67,0.6);">&#9650;&#9660;</span> navigate
        </div>
      `;

      J.innerHTML = c;
      J.style.display = 'block';

      // ── Miro's exact positioning logic ──
      const rect = el.getBoundingClientRect();
      const pRect = J.getBoundingClientRect();
      const gap = 12;
      let left = rect.left;
      let top  = rect.bottom + gap;

      // flip to above if panel overflows below
      if (top + pRect.height > window.innerHeight) top = rect.top - pRect.height - gap;
      // clamp right edge
      if (left + pRect.width > window.innerWidth)  left = window.innerWidth - pRect.width - gap;
      // clamp left edge
      if (left < gap) left = gap;

      J.style.left = left + 'px';
      J.style.top  = top  + 'px';
    }

    // ── qr: set hovered element and update all visuals ───────────────────────
_miroSetHovered(el) {
      this.currentElement = el;
      this._miroAddOutline(el);
      this._miroDrawGuidelines(el);
      this._miroDrawBoxModel(el);
      this.renderHoverElementInfo(el);  // updates the toolbar panel only
    }

    // ── Hr: clear hover state ─────────────────────────────────────────────────
    _miroClearHover() {
      this._miroRemoveOutline();
      this._miroClearGuidelines();
      if (this._inspectOverlay) this._inspectOverlay.style.display = 'none';
      if (this._inspectCoordLabel) this._inspectCoordLabel.style.display = 'none';
      // Only re-render toolbar prompt if not already showing it
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (contentEl && !contentEl.querySelector('.uicc-selector-status')) {
        this.renderSelectorPrompt();
      }
    }

    // ── xt: mouseover handler — Miro-exact ────────────────────────────────────
    //    Two details here are the whole reason selection felt "off" before:
    //      1. If the target is not itself selectable Miro BAILS. It does not
    //         walk up to an ancestor, so hovering a gap never promotes the
    //         selection to a wrapper <div>.
    //      2. Element changes happen ONLY here, never on mousemove.
    //      3. While the page is scrolling under a stationary cursor we BAIL, so
    //         the highlight stays locked on the element the user was pointing at
    //         instead of hopping to whatever slid under the pointer.
    _miroOnMouseover = (e) => {
      if (!this.isSelectionMode || this._scrollLocked) return;
      const target = e.target;
      if (this.isOwnUI(target) || !this.isSelectable(target)) return;

      let el = target;
      // Prefer the nearest media child that actually contains the pointer.
      const media = target.querySelectorAll('img, video, audio, canvas');
      if (media.length > 0) {
        let best = null, bestDist = Infinity;
        const px = this.pointerX, py = this.pointerY;
        media.forEach(m => {
          const r = m.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = Math.sqrt(Math.pow(cx - px, 2) + Math.pow(cy - py, 2));
          if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom && d < bestDist) {
            bestDist = d; best = m;
          }
        });
        if (best) el = best;
      }
      if (el !== this.currentElement) this._miroSetHovered(el);
    }

    // ── At: mouseout handler — Miro-exact ─────────────────────────────────────
    //    Clear unless the pointer moved into a descendant of the current
    //    element, or unless hover focus is currently locked by scrolling.
    _miroOnMouseout = (e) => {
      if (!this.isSelectionMode) return;
      if (this.isOwnUI(e.target)) return;
      const related = e.relatedTarget;
      // Pointer left the window entirely → drop the lock and clear everything.
      if (!related) {
        this._scrollLocked = false;
        this._miroClearHover();
        this.currentElement = null;
        return;
      }
      // Scrolling moved a different element under a stationary cursor → keep the
      // current highlight. The lock is released by the next real mousemove.
      if (this._scrollLocked) return;
      if (this.currentElement && this.currentElement.contains(related)) return;
      this._miroClearHover();
      this.currentElement = null;
    }

    // ── Ct: mousemove handler ─────────────────────────────────────────────────
    //    Records pointer coordinates and moves the coord pill, like Miro's `Ct`.
    //    It deliberately does NOT take over element changes from mouseover — the
    //    old version re-resolved on every move and fought with mouseover, which
    //    made the highlight jump to the wrong element.
    //
    //    It does, however, fill a VACUUM. Hover state driven purely by mouseover
    //    has no recovery path: mouseover fires only on element entry, so if that
    //    one event is missed (scroll moving a new element under a stationary
    //    cursor, an SPA re-render, a synthetic event, or a target that failed the
    //    selectable check) nothing is highlighted and nothing will re-trigger
    //    until the pointer leaves and re-enters a different element. That is the
    //    "sometimes no border appears" case. The guard below only acts when
    //    there is no live highlight under the pointer, so it can never override
    //    a correct one.
    //
    //    Scroll-lock: this is also where the lock is RELEASED. Events whose
    //    client coords are byte-identical to the previous move are synthetic
    //    (browsers re-dispatch a move after a scroll to refresh :hover), so they
    //    are ignored and the lock survives. Any genuine cursor movement clears
    //    the lock and hover re-syncs with the pointer through the normal path.
    _miroOnMousemove = (e) => {
      if (!this.isSelectionMode) return;

      // Physically stationary cursor (synthetic move emitted by a scroll) →
      // keep the hover locked on the current element and change nothing.
      if (this._lastMoveX !== null &&
          e.clientX === this._lastMoveX && e.clientY === this._lastMoveY) return;

      this._lastMoveX = e.clientX;
      this._lastMoveY = e.clientY;
      this._scrollLocked = false;

      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this._miroUpdateCoordLabel(e.clientX, e.clientY);

      // Already highlighting something that still sits under the cursor → leave
      // it alone. mouseover owns transitions between elements.
      const cur = this.currentElement;
      if (cur && cur.isConnected) {
        const r = cur.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) return;
      }

      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (!under || this.isOwnUI(under) || !this.isSelectable(under)) return;
      if (under !== cur) this._miroSetHovered(under);
    }

    // ── wheel / scroll handlers — locks hover focus and re-syncs the viewport canvas ─
    //    Scrolling never re-targets the hover. It pins the highlight to whatever
    //    the user was already pointing at (the box + guidelines keep tracking it
    //    as it moves) until the cursor is physically moved again.
    _miroOnWheel = () => {
      if (!this.isSelectionMode) return;
      if (this.currentElement && this.currentElement.isConnected) {
        this._scrollLocked = true;
        this._miroPinBoxExact();
        this._refreshInspectorVisuals();
      }
    }

    _miroOnScroll = () => {
      if (!this.isSelectionMode) return;
      if (this.currentElement && this.currentElement.isConnected) {
        this._scrollLocked = true;
        this._miroPinBoxExact();
        this._refreshInspectorVisuals();
      }
    }

    // ── vt: click handler — Miro-exact target resolution ──────────────────────
    _miroOnClick = (e) => {
      if (!this.isSelectionMode) return;
      if (this.isOwnUI(e.target)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const el = this.currentElement || document.elementFromPoint(e.clientX, e.clientY);
      if (!el || this.isOwnUI(el)) return;
      this.selectedElement = el;
      this._lastExtraction = null;
      this.exitSelectionMode();
      this._miroApplySelectedOutline(this.selectedElement);
      this.setActiveButton('selector');
      this.showSelectedComponent();
    }

    // ── wt: keydown handler ───────────────────────────────────────────────────
    _miroOnKeydown = (e) => {
      if (!this.isSelectionMode) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!this.currentElement) return;
        const next = this.nextSelectable(this.currentElement);
        if (next) {
          // Keyboard navigation owns the hover; the scrollIntoView below must not
          // let boundary events hand it back to whatever sits under the cursor.
          this._scrollLocked = true;
          this._miroSetHovered(next);
          next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!this.currentElement) return;
        const prev = this.prevSelectable(this.currentElement);
        if (prev) {
          this._scrollLocked = true;
          this._miroSetHovered(prev);
          prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.exitSelectionMode();
        this.collapseToolbar();
      }
    }

    // ── Jr: start inspector ───────────────────────────────────────────────────
    startSelectorMode() {
      this.isSelectionMode = true;
      this.pointerX = 0;
      this.pointerY = 0;
      this._scrollLocked = false;
      this._lastMoveX = null;
      this._lastMoveY = null;
      this.currentView = 'selector';
      this.collapseToolbar('selector');
      if (this.overlay?.classList) this.overlay.classList.remove('uicc-hidden');
      if (document.body?.classList) document.body.classList.add('uicc-selection-active');

      // Miro: inject all UI elements first
      this._miroInjectHighlightStyle();
      this._miroCreatePreviewPanel();
      this._miroCreateGuidelines();

      document.addEventListener('mouseover', this._miroOnMouseover, true);
      document.addEventListener('mouseout',  this._miroOnMouseout,  true);
      document.addEventListener('mousemove', this._miroOnMousemove, true);
      document.addEventListener('click',     this._miroOnClick,     true);
      document.addEventListener('keydown',   this._miroOnKeydown,   true);
      window.addEventListener('wheel',       this._miroOnWheel,     { passive: true, capture: true });
      window.addEventListener('scroll',      this._miroOnScroll,    { passive: true, capture: true });
      window.addEventListener('resize',      this.onViewportChange, true);
      if (document.body) document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20width%3D\'28\'%20height%3D\'28\'%20viewBox%3D\'0%200%2028%2028\'%3E%3Cdefs%3E%3Cfilter%20id%3D\'g\'%20x%3D\'-50%25\'%20y%3D\'-50%25\'%20width%3D\'200%25\'%20height%3D\'200%25\'%3E%3CfeDropShadow%20dx%3D\'0\'%20dy%3D\'0\'%20stdDeviation%3D\'1.6\'%20flood-color%3D\'%23ffffff\'%20flood-opacity%3D\'0.9\'%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Cg%20filter%3D\'url(%23g)\'%20fill%3D\'none\'%20stroke%3D\'%23191a17\'%20stroke-width%3D\'2.2\'%20stroke-linecap%3D\'round\'%3E%3Cpath%20d%3D\'M14%205%20v18\'%2F%3E%3Cpath%20d%3D\'M5%2014%20h18\'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 14 14, crosshair';
    }

    // ── Et: stop inspector ────────────────────────────────────────────────────
    exitSelectionMode() {
      this.isSelectionMode = false;
      this.pointerX = 0;
      this.pointerY = 0;
      this._scrollLocked = false;
      this._lastMoveX = null;
      this._lastMoveY = null;
      if (this.overlay?.classList) this.overlay.classList.add('uicc-hidden');
      if (document.body?.classList) document.body.classList.remove('uicc-selection-active');
      if (document.body) document.body.style.cursor = '';

      document.removeEventListener('mouseover', this._miroOnMouseover, true);
      document.removeEventListener('mouseout',  this._miroOnMouseout,  true);
      document.removeEventListener('mousemove', this._miroOnMousemove, true);
      document.removeEventListener('click',     this._miroOnClick,     true);
      document.removeEventListener('keydown',   this._miroOnKeydown,   true);
      window.removeEventListener('wheel',       this._miroOnWheel,     { capture: true });
      window.removeEventListener('scroll',      this._miroOnScroll,    { capture: true });
      window.removeEventListener('resize',      this.onViewportChange, true);

      // Miro: hide panel, remove outline, hide guidelines + coord label
      if (this._inspectOverlay)       { this._inspectOverlay.style.display = 'none'; }
      this._miroRemoveOutline();
      this._miroRemoveSelectedOutline();
      this._miroRemoveHighlightStyle();
      if (this._inspectGuidelinesEl)  { this._inspectGuidelinesEl.style.display = 'none'; this._inspectGuidelinesEl.innerHTML = ''; }
      if (this._inspectCoordLabel)    { this._inspectCoordLabel.style.display = 'none'; }
      if (this._visualRefreshRafId)    { cancelAnimationFrame(this._visualRefreshRafId); this._visualRefreshRafId = null; }

      this.currentElement = null;
    }

    // ── onViewportChange + scroll refresh: re-sync the selection visuals ─────
    //    The selection box is glued by its own rAF loop + delta math; this
    //    refresh only re-draws the guidelines + box-model badges on scroll/
    //    resize and nudges the box if the tracked element changed.
    _visualRefreshRafId = null;
    _refreshInspectorVisuals() {
      if (!this.isSelectionMode || !this.currentElement?.isConnected) return;
      if (this._visualRefreshRafId) return;
      this._visualRefreshRafId = requestAnimationFrame(() => {
        this._visualRefreshRafId = null;
        if (!this.isSelectionMode || !this.currentElement?.isConnected) return;
        this._miroDrawGuidelines(this.currentElement);
        this._miroDrawBoxModel(this.currentElement);
        if (this._boxTarget === this.currentElement) this._syncSelectionBox(this.currentElement);
      });
    }
    onViewportChange = () => { this._refreshInspectorVisuals(); }

    // ── Stubs kept for backward-compat with showSelectedComponent ────────────
    renderSelectorPrompt() {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="uicc-selector-status">
            <div class="uicc-status-badge">Selector Active</div>
            <p class="uicc-status-desc">Hover over any component on the webpage and click to inspect it.</p>
            <div class="uicc-status-keys">
              <span>&#9650;&#9660; Navigate</span>
              <span>ESC Cancel</span>
            </div>
          </div>
        `;
      }
    }

    setCurrentElement(el) {
      this.currentElement = el;
      this._miroSetHovered(el);
    }

    clearSelection() {
      this.currentElement = null;
      this._miroClearHover();
    }

    highlightElement(element) {
      if (element && element.isConnected) {
        this._miroAddOutline(element);
      }
    }

    // legacy compat – delegate to new system
    clearGuidelines() { this._miroClearGuidelines(); }
    clearBoxModel() { if (this._inspectGuidelinesEl) this._inspectGuidelinesEl.querySelectorAll('.uicc-inspector-boxmodel').forEach(d => d.remove()); }

    getBackgroundInfo(el) {
      const transparent = (t) => !t || t === 'transparent' || t === 'rgba(0, 0, 0, 0)';
      const alphaOf = (t) => {
        if (!t) return 0;
        // support oklch/oklab too (mirrors Miro's ht function)
        const m = t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) return m[4] ? parseFloat(m[4]) : 1;
        const ok = t.match(/^(?:oklch|oklab)\([^/]+\/\s*([\d.]+%?)\s*\)/i);
        if (ok) return ok[1].endsWith('%') ? parseFloat(ok[1]) / 100 : parseFloat(ok[1]);
        return 1;
      };
      const firstGradientColor = (t) => {
        if (!t || t === 'none') return null;
        for (const re of [/(?:oklab|oklch)\([^)]+\)/gi, /rgba?\([^)]+\)/gi, /hsla?\([^)]+\)/gi, /#[a-fA-F0-9]{3,8}\b/gi]) {
          const m = t.match(re);
          if (m && m.length) return m[0];
        }
        return null;
      };
      let node = el, fallback = null;
      for (; node; node = node.parentElement) {
        const cs  = window.getComputedStyle(node);
        const img = cs.backgroundImage;
        if (img && img !== 'none' && img.includes('gradient')) {
          const c = firstGradientColor(img);
          if (c) return { value: c, isGradient: true, gradientValue: img };
        }
        const bg = cs.backgroundColor;
        if (bg && !transparent(bg)) {
          const a = alphaOf(bg);
          if (a > 0.8) return { value: bg, isGradient: false };
          if (a > 0.3 && !fallback) fallback = { value: bg, isGradient: false };
        }
        if (node === document.documentElement) break;
      }
      return fallback || { value: 'rgb(255, 255, 255)', isGradient: false };
    }

    // Render live element info INSIDE the floating toolbar (unchanged)
    renderHoverElementInfo(el) {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (!contentEl) return;
      const cs = window.getComputedStyle(el);
      const bg = this.getBackgroundInfo(el);
      const hasText = el.textContent && el.textContent.trim().length > 0;
      const font = this.escapeHtml(this.simplifyFontFamily(cs.fontFamily));

      contentEl.innerHTML = `
        <div class="uicc-hover-preview">
          <div class="uicc-hover-header">
            <span class="uicc-tag-badge">${this.getElementType(el)}</span>
            <span class="uicc-dim-badge">${Math.round(el.offsetWidth)} \xD7 ${Math.round(el.offsetHeight)} px</span>
          </div>
          <div class="uicc-hover-specs">
            <div class="uicc-spec-row">
              <span class="uicc-spec-label">Type</span>
              <span class="uicc-spec-val">${this.getElementType(el)}</span>
            </div>
            ${hasText ? `
              <div class="uicc-spec-row">
                <span class="uicc-spec-label">Font</span>
                <span class="uicc-spec-val">${font} &middot; ${cs.fontSize}</span>
              </div>
              <div class="uicc-spec-row">
                <span class="uicc-spec-label">Color</span>
                <span class="uicc-spec-val"><span class="uicc-color-dot" style="background:${cs.color}"></span> ${cs.color}</span>
              </div>
            ` : ''}
            <div class="uicc-spec-row">
              <span class="uicc-spec-label">Background</span>
              <span class="uicc-spec-val"><span class="uicc-color-dot" style="background:${bg.value}"></span> ${bg.value}</span>
            </div>
          </div>
          <div class="uicc-hover-cta">Click to inspect this element</div>
        </div>
      `;
    }

    showSelectedComponent() {
      if (!this.selectedElement) return;

      this.expandToolbar();

      const element = this.selectedElement;
      const styles = window.getComputedStyle(element);
      const elementType = this.getElementType(element);
      const properties = this.extractProperties(element, styles);

      const tag = element.tagName.toLowerCase();
      const isMedia = tag === 'img' || tag === 'video' || tag === 'svg' || tag === 'canvas';

      let previewContainerHtml = '';
      if (tag === 'img' && element.src) {
        previewContainerHtml = `<div class="uicc-media-preview-box"><img src="${this.escapeHtml(element.src)}" alt="${this.escapeHtml(element.alt || '')}"></div>`;
      } else if (tag === 'video' && element.src) {
        previewContainerHtml = `<div class="uicc-media-preview-box"><video src="${this.escapeHtml(element.src)}" controls></video></div>`;
      } else if (tag === 'svg') {
        // Sanitize via cleanSVG: page-controlled SVG must never be injected raw
        // into the toolbar (on* handlers / foreignObject <img onerror> would run).
        previewContainerHtml = `<div class="uicc-media-preview-box">${this.cleanSVG(element)}</div>`;
      } else if (tag === 'canvas') {
        try {
          previewContainerHtml = `<div class="uicc-media-preview-box"><img src="${element.toDataURL()}"></div>`;
        } catch(e) {
          previewContainerHtml = `<div class="uicc-media-preview-box"><span style="font-size:11px;color:#9ca3af;">Canvas Preview</span></div>`;
        }
      } else {
        previewContainerHtml = `
          <div class="uicc-component-preview-container">
            <iframe id="uicc-preview-iframe" class="uicc-preview-iframe"></iframe>
          </div>
        `;
      }

      const content = `
        <div class="uicc-component-preview">
          <div class="uicc-element-type">
            <div class="uicc-element-type-label">Element Type</div>
            <div class="uicc-element-type-title">
              <span class="uicc-element-type-badge">${elementType}</span>
              <span class="uicc-dim-badge">${Math.round(element.offsetWidth)} × ${Math.round(element.offsetHeight)} px</span>
            </div>
          </div>
          ${previewContainerHtml}
        </div>

        <div class="uicc-copy-options">
          <button class="uicc-copy-btn" data-copy="html">
            ${ICONS.html} HTML+CSS
          </button>
          <button class="uicc-copy-btn" data-copy="tailwind">
            ${ICONS.tailwind} Tailwind
          </button>
          <button class="uicc-copy-btn" data-copy="vue">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2L2 19h20L12 2z"/></svg> Vue SFC
          </button>
          <button class="uicc-copy-btn" data-copy="react">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75"><ellipse cx="12" cy="12" rx="9" ry="3"/><ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(120 12 12)"/></svg> React JSX
          </button>
        </div>

        <button class="uicc-btn-secondary" id="uicc-save-btn" style="margin-bottom:12px;">
          Save Component to Library
        </button>

        <div class="uicc-properties">
          ${this.renderProperties(properties)}
        </div>
      `;

      this.toolbar.querySelector('#uicc-content').innerHTML = content;

      if (!isMedia) {
        this.renderIframePreview(element);
      }

      const saveBtn = this.toolbar.querySelector('#uicc-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving…';
          try {
            const extracted = await this.getExtraction(element, true);
            const response = await getExtensionRuntime().sendMessage({
              action: 'saveComponent',
              component: {
                type: elementType,
                pageTitle: document.title,
                pageUrl: location.href,
                createdAt: new Date().toISOString(),
                html: extracted.cleanHtml || extracted.html,
                css: extracted.cleanCss || extracted.css
              }
            });
            if (!response?.success) throw new Error(response?.error || 'Save failed');
            saveBtn.textContent = 'Saved';
            this.toast('Component saved');
          } catch (error) {
            saveBtn.textContent = 'Save failed - try again';
            this.toast(error.message || 'Could not save component');
          } finally {
            setTimeout(() => {
              if (!saveBtn) return;
              saveBtn.disabled = false;
              saveBtn.textContent = 'Save component';
            }, 1800);
          }
        });
      }

      this.toolbar.querySelectorAll('.uicc-copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (btn.disabled) return;
          const format = btn.dataset.copy;
          const original = btn.innerHTML;
          btn.disabled = true;
          btn.setAttribute('aria-busy', 'true');
          btn.textContent = 'Generating…';
          const didCopy = await this.copyCode(format);
          btn.removeAttribute('aria-busy');
          if (!didCopy) {
            btn.disabled = false;
            btn.innerHTML = original;
            return;
          }
          btn.classList.add('copied');
          btn.innerHTML = `${ICONS.check} Copied`;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.disabled = false;
            btn.innerHTML = original;
          }, 1600);
        });
      });

      this.toolbar.querySelectorAll('.uicc-editable-prop').forEach(span => {
        span.addEventListener('focus', () => {
          span.dataset.previousValue = span.textContent.trim();
        });
        span.addEventListener('input', () => {
          if (!this.selectedElement) return;
          const prop = span.dataset.styleProp;
          const newVal = span.textContent.trim();
          if (prop && newVal) {
            const cssProp = prop.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
            if (globalThis.CSS?.supports && !CSS.supports(cssProp, newVal)) {
              span.classList.add('invalid');
              return;
            }
            try {
              span.classList.remove('invalid');
              this.selectedElement.style[prop] = newVal;
              this._lastExtraction = null;
              this.highlightElement(this.selectedElement);
              this.renderIframePreview(this.selectedElement);
            } catch (e) {
              console.warn('UI Copier: style update error', e);
            }
          }
        });
        span.addEventListener('blur', () => {
          if (!span.classList.contains('invalid') || !this.selectedElement) return;
          const prop = span.dataset.styleProp;
          span.textContent = getComputedStyle(this.selectedElement)[prop] || span.dataset.previousValue || '';
          span.classList.remove('invalid');
          this.toast('That CSS value is not valid');
        });
        span.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            span.blur();
          }
        });
      });
    }

    isTextLike(element) {
      if (!element) return false;
      const tag = element.tagName.toLowerCase();
      if (['span', 'p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'em', 'strong', 'b', 'i', 'label', 'small', 'li', 'td', 'th', 'figcaption', 'blockquote', 'code'].includes(tag)) return true;
      const text = (element.textContent || '').trim();
      const structuredChildren = [...element.children].filter(c => {
        const t = c.tagName.toLowerCase();
        return !['span', 'b', 'i', 'em', 'strong', 'a', 'br', 'code'].includes(t);
      });
      return text.length > 0 && structuredChildren.length === 0;
    }

    getElementType(element) {
      const tag = element.tagName.toLowerCase();
      const className = (element.getAttribute('class') || '').toLowerCase();
      if (tag === 'nav' || className.includes('nav')) return 'Navbar';
      if (tag === 'header' || className.includes('header')) return 'Header';
      if (tag === 'footer' || className.includes('footer')) return 'Footer';
      if (tag === 'button' || className.includes('button') || className.includes('btn')) return 'Button';
      if (tag === 'form' || className.includes('form')) return 'Form';
      if (className.includes('card')) return 'Card';
      if (className.includes('hero')) return 'Hero';
      if (tag === 'svg') return 'Icon';
      if (tag === 'img') return 'Image';
      if (tag === 'video') return 'Video';
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return 'Input';
      if (tag === 'section' || className.includes('section')) return 'Section';
      return this.isTextLike(element) ? 'Text' : 'Component';
    }

    describeElement(element) {
      if (!element) return 'none';
      const type = this.getElementType(element);
      if (type === 'Text') {
        const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
        if (text) return text.length > 28 ? text.slice(0, 28) + '…' : text;
      }
      return type;
    }

    simplifyFontFamily(fontFamily) {
      if (!fontFamily) return 'Default';
      const names = fontFamily.split(',').map(n => n.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      const first = (names[0] || '').toLowerCase();
      const systemStacks = ['-apple-system', 'blinkmacsystemfont', 'segoe ui', 'system-ui', 'ubuntu', 'roboto', 'arial', 'helvetica', 'helvetica neue', 'verdana', 'geneva', 'tahoma', 'trebuchet ms', 'candara', 'gill sans', 'pt sans', 'lucida grande', 'sans-serif', 'serif', 'monospace'];
      if (systemStacks.includes(first)) {
        if (/mono|consolas|courier/.test(first)) return 'Monospace';
        if (/serif/.test(first) && !/sans/.test(first)) return 'Serif';
        if (/sans|system|apple|arial|helvetica|roboto|ubuntu/.test(first)) return 'Sans-serif';
        return 'System';
      }
      return names[0] || 'Default';
    }

    createComponentPreview(element) {
      try {
        const clone = element.cloneNode(true);
        if (clone) {
          clone.querySelectorAll('script, noscript, iframe, object, embed, #sd-toolbar, .uicc-selection-overlay').forEach(node => node.remove());
          for (const node of [clone, ...clone.querySelectorAll('*')]) {
            for (const attr of Array.from(node.attributes || [])) {
              const name = attr.name.toLowerCase();
              if (name.startsWith('on') || /^(?:javascript|vbscript):/i.test(attr.value.trim())) node.removeAttribute(attr.name);
            }
          }
          clone.style.maxWidth = '100%';
          clone.style.maxHeight = '120px';
          clone.style.overflow = 'hidden';
          clone.style.pointerEvents = 'none';
          return clone.outerHTML;
        }
      } catch (e) {
        console.warn('UI Copier: preview build error', e);
      }
      return '<div>Preview unavailable</div>';
    }

    // ── Miro-exact getComputedStyleSnapshot ──────────────────────────────────
    getComputedStyleSnapshot(element) {
      if (!element || !element.isConnected) return { html: '', css: '' };
      try {
        const clone = element.cloneNode(true);
        // clean script/iframe/extension DOM nodes
        clone.querySelectorAll('script, noscript, iframe, object, embed, #sd-toolbar, .uicc-selection-overlay').forEach(node => node.remove());

        // Strip on* handlers and dangerous URL attributes so page-controlled
        // markup written into the preview iframe can never execute (MED-4).
        for (const node of [clone, ...clone.querySelectorAll('*')]) {
          for (const attr of Array.from(node.attributes || [])) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) node.removeAttribute(attr.name);
            else if (['href', 'src', 'action', 'formaction', 'data', 'xlink:href'].includes(name) &&
                /^(?:javascript|vbscript):/i.test(attr.value.trim())) node.removeAttribute(attr.name);
          }
          if (node.classList) node.classList.remove(this._inspectSelectedClass);
        }

        const origElements = [element, ...element.querySelectorAll('*')];
        const cloneElements = [clone, ...clone.querySelectorAll('*')];

        // Miro's exact property list, plus box-sizing + the webkit background-
        // clip props (needed so gradient-clipped / fill-colour text keeps its
        // colour in the preview).
        const propsToExtract = [
          "display","position","top","right","bottom","left","z-index",
          "width","height","min-width","min-height","max-width","max-height",
          "margin","margin-top","margin-right","margin-bottom","margin-left",
          "padding","padding-top","padding-right","padding-bottom","padding-left",
          "flex-direction","flex-wrap","flex-grow","flex-shrink","flex-basis",
          "align-items","align-self","justify-content","gap","row-gap","column-gap",
          "grid-template-columns","grid-template-rows","grid-column","grid-row",
          "overflow","overflow-x","overflow-y",
          "color","background","background-color","background-image","background-size",
          "background-position","background-repeat",
          "font-family","font-size","font-weight","font-style","line-height",
          "letter-spacing","text-align","text-transform","text-decoration",
          "white-space","word-break","text-overflow",
          "border","border-width","border-style","border-color","border-radius",
          "border-top-left-radius","border-top-right-radius",
          "border-bottom-left-radius","border-bottom-right-radius",
          "box-shadow","opacity","transform","transition","cursor","pointer-events",
          "visibility","object-fit","object-position","aspect-ratio","isolation",
          "mix-blend-mode","filter","backdrop-filter","outline","outline-offset",
          "text-indent","vertical-align","list-style-type","table-layout",
          "border-collapse","border-spacing","fill","stroke","stroke-width"
        ];

        // Miro's exact defaults map: values equal to these are NOT baked in, so
        // the preview iframe's reset (box-sizing, flex-shrink on body > *, etc.)
        // stays in effect for them — instead of being forced to a default value
        // that fights the reset and breaks alignment.
        const defaults = {
          position: "static", top: "auto", right: "auto", bottom: "auto", left: "auto",
          "z-index": "auto", "min-width": "0px", "min-height": "0px", "max-width": "none",
          "max-height": "none", "flex-grow": "0", "flex-shrink": "1", "flex-basis": "auto",
          overflow: "visible", "overflow-x": "visible", "overflow-y": "visible",
          transform: "none", filter: "none", "backdrop-filter": "none", opacity: "1",
          visibility: "visible", cursor: "auto", "pointer-events": "auto", isolation: "auto",
          "mix-blend-mode": "normal", "box-shadow": "none", "text-transform": "none",
          "text-decoration": "none", "text-indent": "0px", outline: "", "outline-offset": "0px",
          "object-fit": "fill", "aspect-ratio": "auto", "white-space": "normal",
          "word-break": "normal", "text-overflow": "clip", "border-collapse": "separate",
          "table-layout": "auto", fill: "", stroke: "none", "stroke-width": "1"
        };

        // Miro's exact application: plain `prop:value` pairs (NO !important),
        // appended to any existing inline style. Skipping defaults + the
        // extension's own outline colour (#315d4c = rgb(49, 93, 76)) means the
        // iframe reset wins for default values while meaningful styles are baked in.
        for (let s = 0; s < origElements.length && s < cloneElements.length; s++) {
          const computedStyle = window.getComputedStyle(origElements[s]);
          const styles = [];
          for (const prop of propsToExtract) {
            const value = computedStyle.getPropertyValue(prop);
            if (!value || value === "" || value === defaults[prop]) continue;
            if (prop === "outline" && /49, 93, 76|45, 138, 104/.test(value)) continue;
            if (prop === "outline-offset" && /49, 93, 76|45, 138, 104/.test(computedStyle.getPropertyValue("outline"))) continue;
            styles.push(`${prop}:${value}`);
          }
          if (styles.length > 0) {
            const existing = cloneElements[s].getAttribute("style") || "";
            cloneElements[s].setAttribute("style", existing + (existing ? ";" : "") + styles.join(";"));
          }
        }

        // Fix image URLs
        cloneElements.forEach(el => {
          if (el.tagName === "IMG" && el.getAttribute("src")) {
            const src = el.getAttribute("src");
            if (!src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("blob:")) {
              try { 
                el.setAttribute("src", new URL(src, window.location.href).href); 
              } catch(e) {}
            }
          }
        });

        return { html: clone.outerHTML, css: "" };
      } catch (e) {
        console.error("getComputedStyleSnapshot error", e);
        return { html: element.outerHTML, css: "" };
      }
    }

    // ── Miro-exact iframe document population + auto zoom & height scaling ────
    async renderIframePreview(element) {
      let iframe = this.toolbar?.querySelector('#uicc-preview-iframe');
      if (!iframe) return;

      // This method awaits the preview build, and the panel can be re-rendered
      // during that gap (a style edit, a new selection, switching views). The
      // iframe captured above would then be detached, and a detached iframe has
      // no browsing context — `contentWindow` is null, so touching
      // `contentWindow.document` throws. Tag each run so a superseded one stops,
      // and re-query the iframe after every await instead of trusting the
      // captured reference.
      const renderId = (this._previewRenderId || 0) + 1;
      this._previewRenderId = renderId;
      const liveIframe = () => {
        if (this._previewRenderId !== renderId) return null; // superseded
        const el = this.toolbar?.querySelector('#uicc-preview-iframe');
        return el && el.isConnected ? el : null;
      };

      // Real on-page width of the selected element. Wide selections (e.g. the
      // whole website) are previewed at this width so responsive media queries
      // evaluate against the element's actual viewport instead of the narrow
      // preview container (which would collapse the layout — broken text
      // alignment, random line breaks, misaligned buttons).
      let designWidth = 0;
      try { designWidth = element.getBoundingClientRect().width; } catch (e) {}

      // Show Miro's exact loading spinner state initially
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error('preview iframe detached');
        doc.open();
        doc.write(`<html><body style="margin:0; display:flex; align-items:center; justify-content:center; height:100%; font-family:-apple-system,BlinkMacSystemFont,sans-serif; color:#9ca3af; font-size:12px; gap:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="animation:uicc-spin 1s linear infinite;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <style>@keyframes uicc-spin{to{transform:rotate(360deg)}}</style>
          Loading preview...
        </body></html>`);
        doc.close();
      } catch(e) {}

      let html = '', css = '';

      // ── Miro Xe() orchestration (lib/preview.js) ─────────────────────────
      // The exact Miro preview pipeline: clean clone (hn) + full-page scoped CSS
      // (xn) with the computed-style snapshot (getComputedStyleSnapshot) swapped
      // in when the page uses Tailwind (dn). This is what makes the preview
      // match Miro's — backgrounds, webfonts, inherited typography, media
      // queries, and keyframes all render identically.
      if (globalThis.UICCPreview && typeof globalThis.UICCPreview.buildPreviewForElement === 'function') {
        try {
          await loadPostcss();
          const preview = await globalThis.UICCPreview.buildPreviewForElement(element);
          if (preview && typeof preview.html === 'string' && preview.html) {
            html = preview.html;
            css = preview.css || '';
          }
        } catch (e) {
          console.warn('UI Copier: Miro preview pipeline failed, falling back to extraction', e);
        }
      }

      // Fallback: previous best-effort extraction + computed-style snapshot.
      if (!html) {
        // Miro Gc flow (full preview workflow copied from Miro):
        //   - The extracted CSS is ALWAYS kept in the preview (Miro: a = o.css, or
        //     a = d.css || o.css for Tailwind). It carries the element's background
        //     rules and @font-face / webfonts — without it the iframe shows a
        //     transparent background and webfont text can fail to render (missing).
        //   - The computed-style snapshot is then layered on top, baking in exact
        //     inline styles so alignment, colors, and widths match the original.
        let extracted = null;
        try {
          extracted = await this.getExtraction(element).catch(() => null);
          if (extracted && extracted.css) css = extracted.css;
        } catch (e) { /* non-fatal - css is best-effort */ }

        try {
          const snapshot = this.getComputedStyleSnapshot(element);
          html = (snapshot && snapshot.html) || (extracted && extracted.html) || element.outerHTML;
        } catch (e) {
          console.warn('UI Copier: getComputedStyleSnapshot failed, falling back to extraction', e);
          if (extracted && extracted.html) html = extracted.html;
          if (!html) html = element.outerHTML;
        }
      }

      // ── Miro-mirrored preview module (lib/preview.js) ────────────────────
      // Prefer the UICCPreview loader (exact Miro Gc port: minimal-reset doc +
      // 150ms auto-scale with zoom clamp). The inline template below remains as
      // the fallback path when the module is unavailable.
      // Re-resolve after the awaits above; bail if this run was superseded or
      // the panel was re-rendered while the preview was being built.
      iframe = liveIframe();
      if (!iframe) return;

      if (globalThis.UICCPreview && typeof globalThis.UICCPreview.writePreviewToIframe === 'function') {
        globalThis.UICCPreview.writePreviewToIframe(iframe, html, css, designWidth);
        return;
      }

      // Miro's EXACT iframe template with minimal reset (fixed for whole-website)
      const docHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    a { text-decoration: inherit; color: inherit; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      width: fit-content;
      min-width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    body {
      padding: 8px;
    }
    body > * {
      flex-shrink: 0;
      text-align: initial;
    }
    ${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;

      try {
        const container = iframe.parentElement;
        const containerW = container?.clientWidth || iframe.clientWidth || 300;
        const wide = typeof designWidth === 'number' && isFinite(designWidth) && designWidth > containerW + 8;
        if (wide) {
          iframe.style.width = Math.max(320, Math.min(4000, Math.round(designWidth))) + 'px';
          if (container) container.style.overflowX = 'hidden';
        } else {
          iframe.style.width = '';
          if (container) container.style.overflowX = '';
        }

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(docHtml);
        doc.close();

        // Miro's exact auto-sizing with 150ms delay
        setTimeout(() => {
          if (!iframe.isConnected) return;
          try {
            const body = doc.body;
            if (!body) return;
            const firstChild = body.firstElementChild;
            if (firstChild) {
              const rect = firstChild.getBoundingClientRect();
              const contentW = rect.width + 16; // 8px padding on each side
              // Scale down if content is wider than container
              if (contentW > containerW && contentW > 0) {
                // Wide (whole-site) previews scale fully so nothing is clipped;
                // component previews keep Miro's readability clamp of 0.3.
                const zoom = wide ? (containerW / contentW) : Math.max(containerW / contentW, 0.3);
                body.style.zoom = zoom;
                if (wide) {
                  const s = doc.createElement('style');
                  s.textContent = 'html, body { justify-content: flex-start !important; }';
                  doc.head.appendChild(s);
                  firstChild.style.marginLeft = '0';
                  firstChild.style.marginRight = '0';
                }
                const scaledHeight = rect.height * zoom + 20;
                iframe.style.height = Math.min(Math.max(scaledHeight, 60), 300) + 'px';
              } else {
                iframe.style.height = Math.min(Math.max(rect.height + 20, 60), 300) + 'px';
              }
            }
          } catch (err) {
            // Silent fail
          }
        }, 150);
      } catch (err) {
        console.warn('UI Copier: iframe render error', err);
      }
    }

    extractProperties(element, styles) {
      const properties = {
        element: {
          'Element Type': this.getElementType(element),
          'Description': this.describeElement(element)
        }
      };

      if (element.textContent && element.textContent.trim()) {
        properties.typography = {
          'Font Family': this.simplifyFontFamily(styles.fontFamily),
          'Font Size': styles.fontSize,
          'Font Weight': styles.fontWeight,
          'Line Height': styles.lineHeight,
          'Text Alignment': styles.textAlign,
          'Text Color': styles.color
        };
      }

      properties.background = {
        'Background Color': styles.backgroundColor
      };

      properties.border = {
        'Border Style': styles.borderStyle,
        'Border Width': styles.borderWidth,
        'Border Radius': styles.borderRadius,
        'Border Color': styles.borderColor
      };

      properties.size = {
        'Width': `${Math.round(element.offsetWidth)}px`,
        'Height': `${Math.round(element.offsetHeight)}px`,
        'Display': styles.display,
        'Position': styles.position
      };

      return properties;
    }

    renderProperties(properties) {
      let html = '';
      const propKeyToStyleMap = {
        'Background Color': 'backgroundColor',
        'Text Color': 'color',
        'Font Size': 'fontSize',
        'Font Weight': 'fontWeight',
        'Line Height': 'lineHeight',
        'Text Alignment': 'textAlign',
        'Border Style': 'borderStyle',
        'Border Width': 'borderWidth',
        'Border Radius': 'borderRadius',
        'Border Color': 'borderColor',
        'Width': 'width',
        'Height': 'height'
      };

      for (let [groupName, props] of Object.entries(properties)) {
        const title = groupName.charAt(0).toUpperCase() + groupName.slice(1);
        html += `
          <div class="uicc-property-group">
            <h3>${title}</h3>
            ${Object.entries(props).map(([key, value]) => {
              const styleProp = propKeyToStyleMap[key];
              const isEditable = Boolean(styleProp);
              return `
                <div class="uicc-property-row">
                  <span class="uicc-property-label">${key}</span>
                  ${isEditable ? `
                    <span class="uicc-property-value uicc-editable-prop" contenteditable="true" spellcheck="false" data-style-prop="${styleProp}" role="textbox" aria-label="Edit ${this.escapeHtml(key)}" title="Click to live edit CSS">${this.escapeHtml(String(value))}</span>
                  ` : `
                    <span class="uicc-property-value">${this.escapeHtml(String(value))}</span>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      return html;
    }

    async getExtraction(element, force = false) {
      if (!this.extractor) throw new Error('The extraction engine did not load. Reload the extension and try again.');
      if (!element?.isConnected) throw new Error('The selected element is no longer on the page. Select it again.');
      if (!force && this._lastExtraction?.element === element && this._lastExtraction.result) {
        return this._lastExtraction.result;
      }
      await loadPostcss();
      const result = await this.extractor.extract(element);
      // Miro-mirrored (Fn): attach a standalone preview document to extraction
      // results exactly like the Miro extension's Xe() returns `preview`.
      if (result && typeof result.html === 'string' && globalThis.UICCPreview &&
          typeof globalThis.UICCPreview.buildPreviewDocument === 'function') {
        try {
          result.preview = globalThis.UICCPreview.buildPreviewDocument(
            result.html, result.css || '', [], false
          );
        } catch (_) { /* additive - never fail extraction over preview */ }
      }
      this._lastExtraction = { element, result };
      return result;
    }

    async generateVueSFC(element) {
      if (!this.extractor) throw new Error('Extraction engine unavailable');
      return this.extractor.toVue(element, await this.getExtraction(element));
    }

    async generateReactJSX(element) {
      if (!this.extractor) throw new Error('Extraction engine unavailable');
      return this.extractor.toReact(element, await this.getExtraction(element));
    }

    async copyCode(format) {
      if (!this.selectedElement) return false;
      let code = '';
      try {
        if (format === 'html') code = await this.generateHTMLCSS(this.selectedElement);
        else if (format === 'tailwind') code = await this.generateTailwind(this.selectedElement);
        else if (format === 'vue') code = await this.generateVueSFC(this.selectedElement);
        else if (format === 'react') code = await this.generateReactJSX(this.selectedElement);
        if (code) {
          await this.copyToClipboard(code);
          this.toast(`Copied ${format.toUpperCase()} to clipboard!`);
          return true;
        }
      } catch (err) {
        console.warn('UI Copier: copy action failed', err);
        this.toast(err?.message || 'Copy failed. Select the component again and retry.');
      }
      return false;
    }

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          const copied = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (copied) return;
        } catch (_) {}
        const runtime = getExtensionRuntime();
        if (runtime?.sendMessage) {
          await runtime.sendMessage({ action: 'copyToClipboard', text });
        } else {
          throw e;
        }
      }
    }

    async collectAllCSS() {
      const own = [];
      const externalUrls = [];
      for (const sheet of document.styleSheets) {
        if (sheet.href && (sheet.href.startsWith('chrome-extension://') || sheet.href.startsWith('moz-extension://'))) continue;
        try {
          if (sheet.href) {
            externalUrls.push(sheet.href);
          } else {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) own.push(Array.from(rules).map(r => r.cssText).join('\n'));
          }
        } catch (e) {
          if (sheet.href) externalUrls.push(sheet.href);
        }
      }

      let external = '';
      if (externalUrls.length > 0) {
        try {
          const runtime = getExtensionRuntime();
          if (runtime && typeof runtime.sendMessage === 'function') {
            const resp = await runtime.sendMessage({
              action: 'fetchExternalStylesheets',
              urls: externalUrls
            });
            if (resp && resp.success && resp.results) {
              external = externalUrls
                .map(url => (resp.results[url] && resp.results[url].success) ? resp.results[url].css : '')
                .filter(Boolean)
                .join('\n');
            }
          }
        } catch (e) {
          console.warn('UI Copier: stylesheet fetch error', e);
        }
      }
      return [...own, external].filter(Boolean).join('\n');
    }

    async scopeCSS(allCSS, element) {
      const postcss = await loadPostcss();
      if (!postcss) return '';
      let root;
      try { root = postcss.parse(allCSS, { from: undefined }); } catch (e) { return ''; }

      const subtree = [element, ...element.querySelectorAll('*')];
      const cache = new Map();
      const matchesAny = (sel) => {
        if (cache.has(sel)) return cache.get(sel);
        let result = false;
        try { result = subtree.some(node => node.matches(sel)); } catch (e) {}
        cache.set(sel, result);
        return result;
      };
      const stripPseudo = (sel) => sel.replace(/::[\w-]+(\([^)]*\))?/g, '').replace(/:[\w-]+(\([^)]*\))?/g, '').trim();

      root.walkRules(rule => {
        if (rule.parent && rule.parent.type === 'atrule' && (rule.parent.name === 'keyframes' || rule.parent.name === 'font-face')) return;
        const kept = rule.selectors.filter(sel => matchesAny(sel) || matchesAny(stripPseudo(sel)));
        if (kept.length > 0) rule.selectors = kept;
        else rule.remove();
      });
      return root.toString();
    }

    async resolveOneUrl(url) {
      if (!url || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
      try { return new URL(url, window.location.href).href; } catch (e) { return url; }
    }

    async rewriteAssetUrls(html, element) {
      const clone = element.cloneNode(true);
      const nodes = [clone, ...clone.querySelectorAll('*')];
      const originals = [element, ...element.querySelectorAll('*')];
      const blobTasks = [];
      for (let m = 0; m < nodes.length; m++) {
        const n = nodes[m];
        const orig = originals[m];
        if (n.tagName === 'IMG') {
          const cur = orig.currentSrc || orig.getAttribute('src');
          if (cur) blobTasks.push(this.resolveOneUrl(cur).then(r => { if (r) n.setAttribute('src', r); }));
        }
      }
      await Promise.all(blobTasks);
      return clone.outerHTML;
    }

    async generateHTMLCSS(element) {
      const result = await this.getExtraction(element);
      if (result.cleanHtml && result.cleanCss) {
        return `<!-- HTML -->\n${result.cleanHtml}\n\n<style>\n${result.cleanCss}\n</style>`;
      }
      return result.combined || `<!-- HTML -->\n${result.html}\n\n<style>\n${result.css || ''}\n</style>`;
    }

    async generateTailwind(element) {
      if (!this.extractor) throw new Error('Extraction engine unavailable');
      const result = await this.getExtraction(element);
      if (result.tailwindHtml) {
        return result.tailwindFallbackCSS
          ? `${result.tailwindHtml}\n\n<style>\n${result.tailwindFallbackCSS.trim()}\n</style>`
          : result.tailwindHtml;
      }
      return this.extractor.toTailwind(element, result);
    }

    cleanSVG(svgElement) {
      if (!svgElement) return '';
      const clone = svgElement.cloneNode(true);
      clone.querySelectorAll('script, foreignObject').forEach(node => node.remove());
      for (const node of [clone, ...clone.querySelectorAll('*')]) {
        for (const attr of Array.from(node.attributes || [])) {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on') || (['href', 'xlink:href'].includes(name) && /^(?:javascript|vbscript):/i.test(attr.value.trim()))) {
            node.removeAttribute(attr.name);
          }
        }
      }
      if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      return clone.outerHTML.trim();
    }

    classifyColor(hexOrRgb) {
      if (!hexOrRgb || typeof hexOrRgb !== 'string') return 'Other';
      const trimmed = hexOrRgb.trim();
      if (!trimmed || trimmed === 'transparent' || trimmed === 'none') return 'Other';
      if (trimmed.includes('gradient')) return 'Gradient';
      const hex = this.rgbToHex(trimmed);
      if (!hex || !hex.startsWith('#')) return 'Other';
      const clean = hex.slice(1);
      if (clean.length < 6) return 'Other';
      if (clean.length === 8) {
        const alpha = parseInt(clean.substring(6, 8), 16);
        if (alpha === 0) return 'Other';
      }
      const num = parseInt(clean.substring(0, 6), 16);
      if (isNaN(num)) return 'Other';
      const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
      const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      if (l < 0.15) return 'Dark / Neutral';
      if (l > 0.92) return 'Light / White';
      if (Math.abs(max - min) < 0.08) return 'Gray / Neutral';
      return 'Color Token';
    }

    extractFontFacesLegacy() {
      const fontFaces = [];
      const seenUrls = new Set();
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              const family = (rule.style.fontFamily || 'Unknown').replace(/['"]/g, '').trim();
              const src = rule.style.src || '';
              const match = src.match(/url\(["']?([^"')]+)["']?\)/i);
              if (match && match[1]) {
                let url = match[1];
                try { url = new URL(url, sheet.href || window.location.href).href; } catch (e) {}
                if (!seenUrls.has(url)) {
                  seenUrls.add(url);
                  fontFaces.push({ family, url });
                }
              }
            }
          }
        } catch (e) {}
      }
      return fontFaces;
    }

    extractAssetsLegacy() {
      const imagesMap = new Map();
      document.querySelectorAll('img').forEach(img => {
        if (img.src && !imagesMap.has(img.src)) {
          imagesMap.set(img.src, {
            src: img.src,
            alt: img.alt || 'Image',
            width: img.naturalWidth || img.offsetWidth || 0,
            height: img.naturalHeight || img.offsetHeight || 0
          });
        }
      });

      document.querySelectorAll('body, body *').forEach(el => {
        if (this.isOwnUI(el)) return;
        const cs = window.getComputedStyle(el);
        const bgImg = cs.backgroundImage;
        if (bgImg && bgImg !== 'none' && !bgImg.includes('gradient')) {
          const m = bgImg.match(/url\(["']?([^"')]+)["']?\)/i);
          if (m && m[1]) {
            let url = m[1];
            try { url = new URL(url, window.location.href).href; } catch (e) {}
            if (!imagesMap.has(url)) {
              imagesMap.set(url, {
                src: url,
                alt: 'Background Image',
                width: el.offsetWidth || 0,
                height: el.offsetHeight || 0
              });
            }
          }
        }
      });

      const videos = [];
      document.querySelectorAll('video').forEach(vid => {
        const src = vid.src || (vid.querySelector('source') ? vid.querySelector('source').src : null);
        if (src) {
          videos.push({
            src,
            poster: vid.poster || '',
            width: vid.videoWidth || vid.offsetWidth || 0,
            height: vid.videoHeight || vid.offsetHeight || 0
          });
        }
      });

      const svgs = [];
      document.querySelectorAll('svg').forEach((svg, idx) => {
        if (this.isOwnUI(svg)) return;
        const code = this.cleanSVG(svg);
        if (code.length > 20) {
          const rect = svg.getBoundingClientRect();
          svgs.push({
            id: idx,
            code,
            name: svg.getAttribute('aria-label') || `SVG Icon ${svgs.length + 1}`,
            width: Math.round(rect.width) || 24,
            height: Math.round(rect.height) || 24
          });
        }
      });

      const lotties = [];
      document.querySelectorAll('lottie-player, [data-lottie-path], dotlottie-player').forEach((lot, idx) => {
        const src = lot.getAttribute('src') || lot.getAttribute('data-lottie-path');
        if (src) lotties.push({ id: idx, url: src, name: `Lottie ${idx + 1}` });
      });

      const colorsMap = new Map();
      document.querySelectorAll('body, body *').forEach(el => {
        if (this.isOwnUI(el)) return;
        const cs = window.getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          const hex = this.rgbToHex(bg);
          colorsMap.set(hex, (colorsMap.get(hex) || 0) + 1);
        }
        const fg = cs.color;
        if (fg && fg !== 'transparent' && fg !== 'rgba(0, 0, 0, 0)') {
          const hex = this.rgbToHex(fg);
          colorsMap.set(hex, (colorsMap.get(hex) || 0) + 1);
        }
      });

      const colors = Array.from(colorsMap.entries()).map(([hex, count]) => ({
        val: hex,
        hex,
        count,
        category: this.classifyColor(hex)
      }));

      const fontFaces = this.extractFontFacesLegacy();
      const fontsMap = new Map();
      document.querySelectorAll('body, body *').forEach(el => {
        if (this.isOwnUI(el)) return;
        const cs = window.getComputedStyle(el);
        const font = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (font) fontsMap.set(font, (fontsMap.get(font) || 0) + 1);
      });

      const fonts = Array.from(fontsMap.entries()).map(([family, count]) => {
        const face = fontFaces.find(f => f.family.toLowerCase() === family.toLowerCase());
        return {
          family,
          count,
          weight: '400',
          url: face ? face.url : null
        };
      });

      return { images: Array.from(imagesMap.values()), videos, svgs, lotties, colors, fonts };
    }

    showAssetsLegacy() {
      const assets = this.extractAssetsLegacy();

      const content = `
        <div class="uicc-assets-overview">
          <div class="uicc-stat-card"><div class="uicc-stat-number">${assets.images.length}</div><div class="uicc-stat-label">Images</div></div>
          <div class="uicc-stat-card"><div class="uicc-stat-number">${assets.svgs.length}</div><div class="uicc-stat-label">SVGs</div></div>
          <div class="uicc-stat-card"><div class="uicc-stat-number">${assets.colors.length}</div><div class="uicc-stat-label">Colors</div></div>
          <div class="uicc-stat-card"><div class="uicc-stat-number">${assets.fonts.length}</div><div class="uicc-stat-label">Fonts</div></div>
          <div class="uicc-stat-card"><div class="uicc-stat-number">${assets.videos.length}</div><div class="uicc-stat-label">Videos</div></div>
          <div class="uicc-stat-card"><div class="uicc-stat-number" style="font-size:11px">${window.location.hostname}</div><div class="uicc-stat-label">Domain</div></div>
        </div>

        <div class="uicc-asset-tabs">
          <button class="uicc-asset-tab active" data-tab="all">All</button>
          <button class="uicc-asset-tab" data-tab="media">Media (${assets.images.length})</button>
          <button class="uicc-asset-tab" data-tab="svgs">SVGs (${assets.svgs.length})</button>
          <button class="uicc-asset-tab" data-tab="fonts">Fonts (${assets.fonts.length})</button>
          <button class="uicc-asset-tab" data-tab="colors">Colors (${assets.colors.length})</button>
        </div>

        <div class="uicc-tab-pane active" id="uicc-pane-media">
          <div class="uicc-media-grid">
            ${assets.images.map(item => `
              <div class="uicc-media-item" data-copy-url="${item.src}" title="Click to copy image URL">
                <img src="${item.src}" alt="${item.alt}" class="uicc-media-preview" loading="lazy" />
                <div style="font-size:9px;color:#71717a;margin-top:4px;">${item.width} × ${item.height}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="uicc-tab-pane" id="uicc-pane-svgs">
          <div class="uicc-svg-grid">
            ${assets.svgs.map((svg, idx) => `
              <div class="uicc-svg-item">
                <div class="uicc-svg-preview">${svg.code}</div>
                <div style="font-size:9px;color:#71717a;">${svg.width} × ${svg.height}</div>
                <button class="uicc-btn-secondary" style="padding:4px;font-size:10px;margin-top:4px;" data-copy-svg="${idx}">Copy SVG</button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="uicc-tab-pane" id="uicc-pane-fonts">
          ${assets.fonts.map(f => `
            <div class="uicc-property-group">
              <div style="font-family:'${this.escapeHtml(f.family)}', sans-serif;font-size:15px;color:#f4f4f5;margin-bottom:4px;">Aa Bb Cc 123</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;">
                <strong style="color:#f4f4f5;">${this.escapeHtml(f.family)}</strong>
                <span class="uicc-element-type-badge">${f.count} instances</span>
              </div>
              ${f.url ? `<button class="uicc-btn-secondary" style="padding:3px;font-size:10px;margin-top:6px;" data-font-url="${f.url}">Copy Font URL</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="uicc-tab-pane" id="uicc-pane-colors">
          ${assets.colors.map(c => `
            <div class="uicc-color-row" data-copy-color="${c.hex}">
              <div class="uicc-color-swatch" style="background:${c.val};"></div>
              <div>
                <div class="uicc-color-hex">${c.hex}</div>
                <div class="uicc-color-meta">${c.category} · ${c.count} instances</div>
              </div>
            </div>
          `).join('')}
          <button class="uicc-btn-primary" style="margin-top:12px;" id="uicc-copy-prompt">Copy Design Tokens Spec</button>
          <button class="uicc-btn-secondary" style="margin-top:8px;" id="uicc-export-csv">Export CSV Palette</button>
        </div>
      `;

      this.toolbar.querySelector('#uicc-content').innerHTML = content;
      this.expandToolbar();

      const tabs = this.toolbar.querySelectorAll('.uicc-asset-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.stopPropagation();
          tabs.forEach(t => t?.classList?.remove('active'));
          if (tab?.classList) tab.classList.add('active');
          const target = tab.dataset.tab;
          const panes = this.toolbar.querySelectorAll('.uicc-tab-pane');
          panes.forEach(pane => {
            if (!pane?.classList) return;
            if (target === 'all') pane.classList.add('active');
            else pane.classList.toggle('active', pane.id === `uicc-pane-${target}`);
          });
        });
      });

      this.toolbar.querySelectorAll('[data-copy-svg]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = assets.svgs[parseInt(btn.dataset.copySvg, 10)];
          if (item) {
            this.copyToClipboard(item.code);
            this.toast('SVG code copied!');
          }
        });
      });

      this.toolbar.querySelectorAll('[data-copy-color]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.copyToClipboard(item.dataset.copyColor);
          this.toast(`Color ${item.dataset.copyColor} copied!`);
        });
      });

      this.toolbar.querySelectorAll('[data-copy-url]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.copyToClipboard(item.dataset.copyUrl);
          this.toast('Image URL copied!');
        });
      });

      const promptBtn = this.toolbar.querySelector('#uicc-copy-prompt');
      if (promptBtn) {
        promptBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const domain = window.location.hostname;
          const colors = assets.colors.slice(0, 10);
          const fonts = assets.fonts.slice(0, 5);

          const spec = `### Design Tokens Specification — ${domain}

#### Typography
${fonts.map(f => `- **${f.family}**: ${f.weight} (${f.count} instances)`).join('\n') || '- System font stack'}

#### Extracted Color Tokens (${colors.length})
${colors.map(c => `- \`${c.hex}\` (${c.category}, ${c.count} instances)`).join('\n')}

#### Usage
Integrate these tokens directly into your CSS variables, Tailwind configuration, or design system theme.`;

          this.copyToClipboard(spec);
          this.toast('Design Tokens specification copied!');
        });
      }

      const csvBtn = this.toolbar.querySelector('#uicc-export-csv');
      if (csvBtn) {
        csvBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          let csv = 'Color,Hex,Category,Count\n';
          assets.colors.forEach(c => csv += `"${c.val}","${c.hex}","${c.category}",${c.count}\n`);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `palette-${window.location.hostname}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast('CSV exported!');
        });
      }
    }

    async showProfileLegacy() {
      const requestedView = 'profile';

      try {
        const resp = await chrome.runtime.sendMessage({ action: 'getComponents' });
        if (this.currentView !== requestedView || !this.toolbar) return;
        const saved = (resp && resp.components) ? resp.components : [];

        const content = `
          <div class="uicc-property-group" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;color:#f4f4f5;font-weight:600;font-size:14px;border:1px solid #3f3f46;">P</div>
              <div>
                <div style="font-weight:600;font-size:13px;">Local workspace</div>
                <div style="font-size:11px;">Stored in this browser profile</div>
                <span class="uicc-element-type-badge" style="margin-top:4px;">Private</span>
              </div>
            </div>
          </div>

          <div class="uicc-property-group">
            <h3>Saved Component Library (${saved.length})</h3>
            ${saved.length === 0 ? '<div style="font-size:11px;color:#71717a;padding:6px 0;">No saved components yet. Inspect an element and click Save Component.</div>' : ''}
            ${saved.map((item, idx) => `
              <div style="background:#09090b;border:1px solid #27272a;border-radius:8px;padding:8px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span class="uicc-element-type-badge">${item.type || 'Component'}</span>
                  <span style="font-size:10px;color:#71717a;">${item.timestamp || ''}</span>
                </div>
                <pre style="font-size:10px;color:#a1a1aa;max-height:50px;overflow:hidden;margin-bottom:6px;">${this.escapeHtml((item.html || '').slice(0, 120))}...</pre>
                <button class="uicc-btn-secondary" style="padding:4px;font-size:10px;" data-copy-saved="${idx}">Copy HTML</button>
              </div>
            `).join('')}
          </div>
        `;

        this.toolbar.querySelector('#uicc-content').innerHTML = content;
        this.expandToolbar();

        this.toolbar.querySelectorAll('[data-copy-saved]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = saved[parseInt(btn.dataset.copySaved, 10)];
            if (item) {
              this.copyToClipboard(item.html);
              this.toast('Saved component HTML copied!');
            }
          });
        });
      } catch (e) {
        if (this.currentView !== requestedView || !this.toolbar) return;
        this.toolbar.querySelector('#uicc-content').innerHTML = '<div style="font-size:12px;color:#71717a;">Saved components library ready.</div>';
        this.expandToolbar();
      }
    }

    async extractAssets() {
      const images = new Map();
      const videos = new Map();
      const audio = new Map();
      const lotties = new Map();
      const gradients = new Map();
      const colors = new Map();
      const fonts = new Map();
      const fontUrls = new Map();

      const addMedia = (map, url, details = {}) => {
        if (!url || /^(?:data|blob):/i.test(url)) return;
        let absolute = url;
        try { absolute = new URL(url, location.href).href; } catch (_) {}
        if (!map.has(absolute)) map.set(absolute, { src: absolute, ...details });
      };

      document.querySelectorAll('img').forEach(img => {
        if (this.isOwnUI(img)) return;
        addMedia(images, img.currentSrc || img.src, {
          name: img.alt || img.getAttribute('aria-label') || 'Image',
          width: img.naturalWidth || img.clientWidth || 0,
          height: img.naturalHeight || img.clientHeight || 0,
          kind: 'image'
        });
      });

      document.querySelectorAll('video').forEach(video => {
        if (this.isOwnUI(video)) return;
        const sources = [video.currentSrc, video.src, ...Array.from(video.querySelectorAll('source')).map(source => source.src)];
        sources.forEach(src => addMedia(videos, src, {
          name: video.getAttribute('aria-label') || 'Video', poster: video.poster || '',
          width: video.videoWidth || video.clientWidth || 0,
          height: video.videoHeight || video.clientHeight || 0, kind: 'video'
        }));
      });

      document.querySelectorAll('audio').forEach(player => {
        if (this.isOwnUI(player)) return;
        const sources = [player.currentSrc, player.src, ...Array.from(player.querySelectorAll('source')).map(source => source.src)];
        sources.forEach(src => addMedia(audio, src, { name: player.getAttribute('aria-label') || 'Audio', kind: 'audio' }));
      });

      const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED']);
      const allElements = Array.from(document.querySelectorAll('body, body *')).filter(element => !this.isOwnUI(element) && !SKIP_TAGS.has(element.tagName));
      const scanLimit = 12000;
      const scanTruncated = allElements.length > scanLimit;
      const visibleElements = allElements.slice(0, scanLimit);
      for (let elementIndex = 0; elementIndex < visibleElements.length; elementIndex += 1) {
        const element = visibleElements[elementIndex];
        const style = getComputedStyle(element);
        for (const property of ['backgroundImage', 'maskImage', 'webkitMaskImage', 'content']) {
          const value = style[property];
          if (!value || value === 'none') continue;
          const matches = Array.from(value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi));
          matches.forEach(match => addMedia(images, match[1], {
            name: property.includes('mask') ? 'Mask image' : 'Background image',
            width: element.clientWidth || 0, height: element.clientHeight || 0, kind: 'image'
          }));
          if (/gradient\(/i.test(value)) gradients.set(value, (gradients.get(value) || 0) + 1);
        }

        for (const value of [style.color, style.backgroundColor, style.borderTopColor, style.fill, style.stroke]) {
          if (!value || value === 'transparent' || value === 'none' || value === 'rgba(0, 0, 0, 0)') continue;
          const hex = this.rgbToHex(value);
          if (!hex || !String(hex).startsWith('#')) continue;
          colors.set(hex, (colors.get(hex) || 0) + 1);
        }

        const family = style.fontFamily ? style.fontFamily.split(',')[0].replace(/["']/g, '').trim() : '';
        const hasDirectText = Array.from(element.childNodes || []).some(node => node.nodeType === 3 && node.nodeValue?.trim());
        const isTextControl = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(element.tagName);
        if (family && (hasDirectText || isTextControl)) {
          const key = [family, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing, element.tagName.toLowerCase()].join('|');
          const current = fonts.get(key) || {
            family, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing, role: element.tagName.toLowerCase(), count: 0, url: ''
          };
          current.count += 1;
          fonts.set(key, current);
        }
        if (elementIndex > 0 && elementIndex % 200 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
          if (this.currentView !== 'assets') break;
        }
      }

      const scanRules = rules => {
        for (const rule of Array.from(rules || [])) {
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            const family = (rule.style.fontFamily || 'Web font').replace(/["']/g, '').trim();
            const matches = Array.from((rule.style.src || '').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi));
            matches.forEach(match => {
              let url = match[1];
              try { url = new URL(url, rule.parentStyleSheet?.href || location.href).href; } catch (_) {}
              fontUrls.set(family.toLowerCase(), url);
            });
          } else if (rule.cssRules) scanRules(rule.cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try { scanRules(sheet.cssRules || sheet.rules); } catch (_) {}
      }

      document.querySelectorAll('lottie-player, dotlottie-player, [data-lottie-path], [data-animation-path]').forEach((node, index) => {
        const src = node.getAttribute('src') || node.getAttribute('data-lottie-path') || node.getAttribute('data-animation-path');
        if (src) addMedia(lotties, src, { name: node.getAttribute('aria-label') || `Lottie ${index + 1}`, kind: 'lottie' });
      });

      const svgs = [];
      const seenSvg = new Set();
      document.querySelectorAll('svg').forEach(svg => {
        if (this.isOwnUI(svg)) return;
        const code = this.cleanSVG(svg);
        if (!code || seenSvg.has(code)) return;
        seenSvg.add(code);
        const rect = svg.getBoundingClientRect();
        svgs.push({
          code, name: svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || `SVG ${svgs.length + 1}`,
          width: Math.round(rect.width) || 24, height: Math.round(rect.height) || 24
        });
      });

      const networkFontUrls = [];
      try {
        const network = await getExtensionRuntime()?.sendMessage({ action: 'getNetworkAssets' });
        (network?.images || []).forEach(url => addMedia(images, url, { name: 'Network image', width: 0, height: 0, kind: 'image' }));
        (network?.videos || []).forEach(url => addMedia(videos, url, { name: 'Network video', kind: 'video' }));
        (network?.audio || []).forEach(url => addMedia(audio, url, { name: 'Network audio', kind: 'audio' }));
        (network?.fonts || []).forEach(url => networkFontUrls.push(url));
        [...(network?.other || []), ...(network?.scripts || [])].filter(url => /(?:lottie|\.json(?:[?#]|$))/i.test(url))
          .forEach((url, index) => addMedia(lotties, url, { name: `Animation ${index + 1}`, kind: 'lottie' }));
      } catch (_) {}

      const fontList = Array.from(fonts.values()).sort((a, b) => b.count - a.count).map(font => {
        const familyKey = font.family.toLowerCase();
        const familySlug = familyKey.replace(/[^a-z0-9]+/g, '');
        const networkMatch = networkFontUrls.find(url => url.toLowerCase().replace(/[^a-z0-9]+/g, '').includes(familySlug));
        return { ...font, url: fontUrls.get(familyKey) || networkMatch || '' };
      });
      return {
        images: Array.from(images.values()), videos: Array.from(videos.values()), audio: Array.from(audio.values()),
        svgs, lotties: Array.from(lotties.values()), gradients: Array.from(gradients, ([value, count]) => ({ value, count })),
        colors: Array.from(colors, ([hex, count]) => ({ hex, val: hex, count, category: this.classifyColor(hex) }))
          .sort((a, b) => b.count - a.count),
        fonts: fontList,
        scanTruncated,
        scannedElements: visibleElements.length,
        totalElements: allElements.length
      };
    }

    async showAssets() {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (!contentEl) return;
      contentEl.innerHTML = '<div class="uicc-loading"><span class="uicc-loading-bar"></span><span>Scanning page and network assets…</span></div>';
      this.expandToolbar();

      let assets;
      try { assets = await this.extractAssets(); }
      catch (error) {
        contentEl.innerHTML = `<div class="uicc-empty-state"><strong>Asset scan failed</strong><span>${this.escapeHtml(error.message || 'Reload the page and try again.')}</span></div>`;
        return;
      }
      if (this.currentView !== 'assets') return;

      const media = [...assets.images, ...assets.videos, ...assets.audio];
      const safe = value => this.escapeHtml(String(value || ''));
      const mediaMarkup = media.slice(0, 180).map((item, index) => {
        const preview = item.kind === 'video'
          ? `<video class="uicc-media-preview" src="${safe(item.src)}" poster="${safe(item.poster)}" muted preload="metadata"></video>`
          : item.kind === 'audio'
            ? '<div class="uicc-audio-preview">WAVE</div>'
            : `<img src="${safe(item.src)}" alt="${safe(item.name)}" class="uicc-media-preview" loading="lazy" />`;
        return `<article class="uicc-media-item">
          ${preview}
          <div class="uicc-asset-name">${safe(item.name)}</div>
          <div class="uicc-asset-meta">${item.width ? `${item.width} × ${item.height}` : item.kind}</div>
          <div class="uicc-asset-actions"><button data-copy-media="${index}">Copy URL</button><button data-download-media="${index}">Download</button></div>
        </article>`;
      }).join('');

      contentEl.innerHTML = `
        <header class="uicc-view-header"><div><span class="uicc-eyebrow">Site library</span><h2>${safe(location.hostname)}</h2></div><span class="uicc-total-count">${media.length + assets.svgs.length + assets.lotties.length} ${media.length + assets.svgs.length + assets.lotties.length === 1 ? 'asset' : 'assets'}</span></header>
        ${assets.scanTruncated ? `<div class="uicc-scan-note">Scanned the first ${assets.scannedElements.toLocaleString()} of ${assets.totalElements.toLocaleString()} elements to keep this page responsive.</div>` : ''}
        <div class="uicc-assets-overview">
          ${[['Images', assets.images.length], ['Video', assets.videos.length], ['SVG', assets.svgs.length], ['Fonts', assets.fonts.length], ['Colors', assets.colors.length], ['Lottie', assets.lotties.length]].map(([label, count]) => `<div class="uicc-stat-card"><div class="uicc-stat-number">${count}</div><div class="uicc-stat-label">${label}</div></div>`).join('')}
        </div>
        <nav class="uicc-asset-tabs" aria-label="Asset categories">
          <button class="uicc-asset-tab active" data-tab="media">Media</button>
          <button class="uicc-asset-tab" data-tab="svgs">SVG</button>
          <button class="uicc-asset-tab" data-tab="fonts">Type</button>
          <button class="uicc-asset-tab" data-tab="colors">Color</button>
          <button class="uicc-asset-tab" data-tab="lottie">Lottie</button>
        </nav>
        <section class="uicc-tab-pane active" id="uicc-pane-media"><div class="uicc-media-grid">${mediaMarkup || '<div class="uicc-empty-state"><strong>No media found</strong><span>Scroll the page to load lazy assets, then reopen this view.</span></div>'}</div></section>
        <section class="uicc-tab-pane" id="uicc-pane-svgs"><div class="uicc-svg-grid">${assets.svgs.slice(0, 120).map((svg, index) => `<article class="uicc-svg-item"><div class="uicc-svg-preview">${svg.code}</div><div class="uicc-asset-name">${safe(svg.name)}</div><div class="uicc-asset-meta">${svg.width} × ${svg.height}</div><button class="uicc-inline-action" data-copy-svg-new="${index}">Copy SVG</button></article>`).join('') || '<div class="uicc-empty-state"><strong>No inline SVG found</strong></div>'}</div></section>
        <section class="uicc-tab-pane" id="uicc-pane-fonts">${assets.fonts.slice(0, 120).map((font, index) => `<article class="uicc-font-row"><div class="uicc-font-sample" style="font-family:${safe(font.family)}">Aa Bb Cc 123</div><div class="uicc-font-heading"><strong>${safe(font.family)}</strong><span>${font.count} uses</span></div><dl><div><dt>Role</dt><dd>${safe(font.role)}</dd></div><div><dt>Size</dt><dd>${safe(font.size)}</dd></div><div><dt>Weight</dt><dd>${safe(font.weight)}</dd></div><div><dt>Line height</dt><dd>${safe(font.lineHeight)}</dd></div></dl>${font.url ? `<button class="uicc-inline-action" data-copy-font="${index}">Copy font URL</button>` : ''}</article>`).join('') || '<div class="uicc-empty-state"><strong>No typography found</strong></div>'}</section>
        <section class="uicc-tab-pane" id="uicc-pane-colors">
          ${assets.gradients.map((gradient, index) => `<button class="uicc-gradient-row" data-copy-gradient="${index}"><span style="background:${safe(gradient.value)}"></span><code>${safe(gradient.value)}</code><em>${gradient.count}</em></button>`).join('')}
          <div class="uicc-color-list">${assets.colors.map((color, index) => `<button class="uicc-color-row" data-copy-color-new="${index}"><span class="uicc-color-swatch" style="background:${safe(color.hex)}"></span><span><strong>${safe(color.hex)}</strong><small>${safe(color.category)} · ${color.count} uses</small></span></button>`).join('')}</div>
          <button class="uicc-btn-primary" id="uicc-copy-tokens">Copy design tokens</button><button class="uicc-btn-secondary" id="uicc-export-csv-new">Export CSV</button>
        </section>
        <section class="uicc-tab-pane" id="uicc-pane-lottie">${assets.lotties.map((item, index) => `<article class="uicc-lottie-row"><div><strong>${safe(item.name)}</strong><span>${safe(item.src)}</span></div><div class="uicc-asset-actions"><button data-copy-lottie="${index}">Copy URL</button><button data-download-lottie="${index}">Download</button></div></article>`).join('') || '<div class="uicc-empty-state"><strong>No Lottie files found</strong><span>JSON animation requests appear here after the page loads them.</span></div>'}</section>
      `;

      const tabs = contentEl.querySelectorAll('.uicc-asset-tab');
      tabs.forEach(tab => tab.addEventListener('click', event => {
        event.stopPropagation();
        tabs.forEach(item => item.classList.toggle('active', item === tab));
        contentEl.querySelectorAll('.uicc-tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === `uicc-pane-${tab.dataset.tab}`));
      }));

      const copy = async (value, message) => {
        if (!value) { this.toast('This asset does not have a copyable value'); return; }
        try { await this.copyToClipboard(value); this.toast(message); }
        catch (error) { this.toast(error?.message || 'Copy failed'); }
      };
      contentEl.querySelectorAll('[data-copy-media]').forEach(button => button.addEventListener('click', () => copy(media[Number(button.dataset.copyMedia)]?.src || '', 'Asset URL copied')));
      contentEl.querySelectorAll('[data-copy-svg-new]').forEach(button => button.addEventListener('click', () => copy(assets.svgs[Number(button.dataset.copySvgNew)]?.code || '', 'SVG copied')));
      contentEl.querySelectorAll('[data-copy-font]').forEach(button => button.addEventListener('click', () => copy(assets.fonts[Number(button.dataset.copyFont)]?.url || '', 'Font URL copied')));
      contentEl.querySelectorAll('[data-copy-gradient]').forEach(button => button.addEventListener('click', () => copy(assets.gradients[Number(button.dataset.copyGradient)]?.value || '', 'Gradient copied')));
      contentEl.querySelectorAll('[data-copy-color-new]').forEach(button => button.addEventListener('click', () => copy(assets.colors[Number(button.dataset.copyColorNew)]?.hex || '', 'Color copied')));
      contentEl.querySelectorAll('[data-copy-lottie]').forEach(button => button.addEventListener('click', () => copy(assets.lotties[Number(button.dataset.copyLottie)]?.src || '', 'Lottie URL copied')));

      const download = async item => {
        if (!item?.src) return;
        try {
          const filename = (() => { try { return new URL(item.src).pathname.split('/').pop() || 'asset'; } catch (_) { return 'asset'; } })();
          const response = await getExtensionRuntime().sendMessage({ action: 'downloadAsset', url: item.src, filename });
          this.toast(response?.success ? 'Download started' : response?.error || 'Download failed');
        } catch (error) { this.toast(error?.message || 'Download failed'); }
      };
      contentEl.querySelectorAll('[data-download-media]').forEach(button => button.addEventListener('click', () => download(media[Number(button.dataset.downloadMedia)])));
      contentEl.querySelectorAll('[data-download-lottie]').forEach(button => button.addEventListener('click', () => download(assets.lotties[Number(button.dataset.downloadLottie)])));

      contentEl.querySelector('#uicc-copy-tokens')?.addEventListener('click', () => {
        const tokens = `:root {\n${assets.colors.slice(0, 24).map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n')}\n${assets.gradients.slice(0, 12).map((gradient, index) => `  --gradient-${index + 1}: ${gradient.value};`).join('\n')}\n}`;
        copy(tokens, 'Design tokens copied');
      });
      contentEl.querySelector('#uicc-export-csv-new')?.addEventListener('click', () => {
        const csv = ['hex,category,count', ...assets.colors.map(color => `"${color.hex}","${color.category}",${color.count}`)].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = `colors-${location.hostname}.csv`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); this.toast('Color CSV exported');
      });
    }

    async showProfile() {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (!contentEl) return;
      contentEl.innerHTML = '<div class="uicc-loading"><span class="uicc-loading-bar"></span><span>Loading your local library…</span></div>';
      this.expandToolbar();
      let saved = [];
      try {
        const response = await getExtensionRuntime().sendMessage({ action: 'getComponents' });
        if (!response?.success) throw new Error(response?.error || 'Storage unavailable');
        saved = response.components || [];
      } catch (error) {
        contentEl.innerHTML = `<div class="uicc-empty-state"><strong>Library unavailable</strong><span>${this.escapeHtml(error.message)}</span></div>`;
        return;
      }
      if (this.currentView !== 'profile') return;
      const encoder = new TextEncoder();
      const bytes = saved.reduce((total, item) => total + encoder.encode(item.html || '').byteLength + encoder.encode(item.css || '').byteLength, 0);
      contentEl.innerHTML = `
        <header class="uicc-view-header"><div><span class="uicc-eyebrow">Local workspace</span><h2>Saved components</h2></div><span class="uicc-total-count">${saved.length}/100</span></header>
        <div class="uicc-library-summary"><div><strong>${saved.length}</strong><span>components</span></div><div><strong>${(bytes / 1024).toFixed(1)} KB</strong><span>stored locally</span></div></div>
        <div class="uicc-library-list">${saved.map((item, index) => `<article class="uicc-library-item"><div class="uicc-library-heading"><span>${this.escapeHtml(item.type || 'Component')}</span><time>${this.escapeHtml(new Date(item.createdAt || Date.now()).toLocaleDateString())}</time></div><strong>${this.escapeHtml(item.pageTitle || (() => { try { return new URL(item.pageUrl).hostname; } catch (_) { return 'Saved page'; } })())}</strong><code>${this.escapeHtml((item.html || '').replace(/\s+/g, ' ').slice(0, 110))}</code><div class="uicc-library-actions"><button data-copy-saved-new="${index}">Copy code</button><button data-delete-saved="${index}" class="danger">Delete</button></div></article>`).join('') || '<div class="uicc-empty-state"><strong>Your library is empty</strong><span>Select a page component and choose “Save component”.</span></div>'}</div>
        <p class="uicc-privacy-note">Your component library stays in this browser profile. No account or upload is required.</p>
      `;
      contentEl.querySelectorAll('[data-copy-saved-new]').forEach(button => button.addEventListener('click', async () => {
        const item = saved[Number(button.dataset.copySavedNew)];
        await this.copyToClipboard(`<!-- HTML -->\n${item?.html || ''}\n\n<style>\n${item?.css || ''}\n</style>`);
        this.toast('Saved component copied');
      }));
      contentEl.querySelectorAll('[data-delete-saved]').forEach(button => button.addEventListener('click', async () => {
        if (button.dataset.confirming !== 'true') {
          button.dataset.confirming = 'true';
          button.textContent = 'Confirm delete';
          button.classList.add('confirming');
          setTimeout(() => {
            if (!button.isConnected || button.dataset.confirming !== 'true') return;
            button.dataset.confirming = 'false';
            button.textContent = 'Delete';
            button.classList.remove('confirming');
          }, 3000);
          return;
        }
        const item = saved[Number(button.dataset.deleteSaved)];
        if (!item?.id) return;
        button.disabled = true;
        const response = await getExtensionRuntime().sendMessage({ action: 'deleteComponent', id: item.id });
        if (response?.success) { this.toast('Component deleted'); this.showProfile(); }
        else this.toast(response?.error || 'Delete failed');
      }));
    }

    toast(msg) {
      let t = document.getElementById('uicc-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'uicc-toast';
        t.className = 'uicc-toast';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        (document.body || document.documentElement).appendChild(t);
      }
      t.textContent = msg;
      if (t?.classList) t.classList.add('show');
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        if (t?.classList) t.classList.remove('show');
      }, 2000);
    }

    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    rgbToHex(rgb) {
      if (!rgb || typeof rgb !== 'string') return null;
      const clean = rgb.trim();
      if (!clean) return null;
      if (clean.startsWith('#')) return clean.toUpperCase();
      const match = clean.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (!match) return null;
      const [_, r, g, b] = match;
      return '#' + [r, g, b].map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  }

  if (!window.uicc) {
    window.uicc = new UIComponentCopier();
  }
})();
