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
      this.highlight = null;
      this.guidelines = null;
      this.selectedElement = null;
      this.isSelectionMode = false;
      this.currentView = null;
      this.currentElement = null;
      this.pointerX = 0;
      this.pointerY = 0;
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
        this.highlight = null;
        this.guidelines = null;
      }
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

      this.highlight = document.createElement('div');
      this.highlight.className = 'uicc-highlight';
      this.overlay.appendChild(this.highlight);

      this.guidelines = document.createElement('div');
      this.guidelines.id = 'uicc-guidelines';
      this.guidelines.className = 'uicc-guidelines';
      this.overlay.appendChild(this.guidelines);

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

    isOwnUI(t) {
      if (!t) return false;
      if (t.id && (t.id.startsWith('sd-') || t.id.startsWith('uicc-'))) return true;
      if (t.closest && t.closest('#sd-toolbar, #uicc-guidelines, .uicc-selection-overlay, [id^="uicc-"], [id^="sd-"]')) return true;
      if (this.overlay && this.overlay.contains(t)) return true;
      if (this.toolbar && this.toolbar.contains(t)) return true;
      return false;
    }

    isSelectable(t) {
      if (!t || t.nodeType !== 1 || t === document.documentElement || t === document.body) return false;
      if (this.isOwnUI(t)) return false;
      const rect = t.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const cs = window.getComputedStyle(t);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return true;
    }

    nextSelectable(t) {
      if (!t) return null;
      let curr = t.firstElementChild || t.nextElementSibling;
      if (!curr) {
        let p = t.parentElement;
        while (p && !p.nextElementSibling && p !== document.body) p = p.parentElement;
        if (p && p.nextElementSibling && p !== document.body) curr = p.nextElementSibling;
      }
      while (curr && curr !== document.body) {
        if (this.isSelectable(curr)) return curr;
        let nxt = curr.firstElementChild || curr.nextElementSibling;
        if (!nxt) {
          let p = curr.parentElement;
          while (p && !p.nextElementSibling && p !== document.body) p = p.parentElement;
          if (p && p.nextElementSibling && p !== document.body) nxt = p.nextElementSibling;
        }
        curr = nxt;
      }
      return null;
    }

    prevSelectable(t) {
      if (!t) return null;
      let curr = t.previousElementSibling;
      if (curr) {
        while (curr.lastElementChild) curr = curr.lastElementChild;
      } else {
        curr = t.parentElement;
      }
      while (curr && curr !== document.body) {
        if (this.isSelectable(curr)) return curr;
        let prev = curr.previousElementSibling;
        if (prev) {
          while (prev.lastElementChild) prev = prev.lastElementChild;
          curr = prev;
        } else {
          curr = curr.parentElement;
        }
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
      return result;
    }

    startSelectorMode() {
      this.isSelectionMode = true;
      this.currentView = 'selector';
      this.collapseToolbar('selector');
      if (this.overlay?.classList) this.overlay.classList.remove('uicc-hidden');
      if (document.body?.classList) document.body.classList.add('uicc-selection-active');

      document.addEventListener('mouseover', this.onMouseOver, true);
      document.addEventListener('mouseout', this.onMouseOut, true);
      document.addEventListener('mousemove', this.onMouseMoveCoords, true);
      document.addEventListener('click', this.onClickCapture, true);
      document.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('scroll', this.onViewportChange, true);
      window.addEventListener('resize', this.onViewportChange, true);
      if (document.body) document.body.style.cursor = 'crosshair';
    }

    renderSelectorPrompt() {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="uicc-selector-status">
            <div class="uicc-status-badge">Selector Active</div>
            <p class="uicc-status-desc">Hover over any component on the webpage and click to inspect it.</p>
            <div class="uicc-status-keys">
              <span>▲▼ Navigate elements</span>
              <span>ESC Cancel</span>
            </div>
          </div>
        `;
      }
    }

    onMouseOver = (e) => {
      if (!this.isSelectionMode) return;
      if (this.isOwnUI(e.target)) return;
      const picked = this.pickElement(e);
      if (picked && picked !== this.currentElement) {
        this.setCurrentElement(picked);
      }
    }

    onMouseOut = (e) => {
      if (!this.isSelectionMode) return;
      if (!e.target || e.target.nodeType !== 1) return;
      if (this.isOwnUI(e.target)) return;
      const related = e.relatedTarget;
      if (related && this.currentElement && this.currentElement.contains(related)) return;
      this.clearSelection();
    }

    onMouseMoveCoords = (e) => {
      if (!this.isSelectionMode) return;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
    }

    onViewportChange = () => {
      if (!this.isSelectionMode || !this.currentElement?.isConnected) return;
      this.highlightElement(this.currentElement);
      this.drawGuidelines(this.currentElement);
      this.drawBoxModel(this.currentElement);
    }

    onClickCapture = (e) => {
      if (!this.isSelectionMode) return;
      if (this.isOwnUI(e.target)) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      const picked = this.pickElement(e) || this.currentElement;
      if (!picked || !this.isSelectable(picked)) return;

      this.selectedElement = picked;
      this._lastExtraction = null;
      this.exitSelectionMode();
      this.setActiveButton('selector');
      this.showSelectedComponent();
    }

    onKeyDown = (e) => {
      if (!this.isSelectionMode) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!this.currentElement) return;
        const next = this.nextSelectable(this.currentElement);
        if (next) { this.setCurrentElement(next); next.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!this.currentElement) return;
        const prev = this.prevSelectable(this.currentElement);
        if (prev) { this.setCurrentElement(prev); prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.exitSelectionMode();
        this.collapseToolbar();
      }
    }

    setCurrentElement(el) {
      this.currentElement = el;
      this.highlightElement(el);
      this.drawGuidelines(el);
      this.drawBoxModel(el);
      this.renderHoverElementInfo(el);
    }

    clearSelection() {
      this.currentElement = null;
      this.highlightElement(null);
      this.clearGuidelines();
      this.clearBoxModel();
      this.renderSelectorPrompt();
    }

    highlightElement(element) {
      if (!this.highlight) return;
      if (!element) {
        this.highlight.style.width = '0px';
        this.highlight.style.height = '0px';
        return;
      }
      if (this.highlight.classList) this.highlight.classList.add('uicc-highlight-active');
      const rect = element.getBoundingClientRect();
      this.highlight.style.top = `${rect.top}px`;
      this.highlight.style.left = `${rect.left}px`;
      this.highlight.style.width = `${rect.width}px`;
      this.highlight.style.height = `${rect.height}px`;
    }

    drawGuidelines(el) {
      if (!this.guidelines) return;
      const rect = el.getBoundingClientRect();
      const docW = document.documentElement.clientWidth || window.innerWidth;
      const docH = document.documentElement.clientHeight || window.innerHeight;
      const vw = docW;

      const top = rect.top;
      const bottom = rect.bottom;
      const left = rect.left;
      const right = rect.right;

      this.guidelines.style.height = docH + 'px';
      let svg = this.guidelines.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
        this.guidelines.insertBefore(svg, this.guidelines.firstChild);
      }
      svg.setAttribute('width', '100%');
      svg.setAttribute('viewBox', `0 0 ${Math.max(vw, 1)} ${Math.max(docH, 1)}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.innerHTML = `
        <line x1="${left}" y1="0" x2="${left}" y2="${docH}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 3" />
        <line x1="${right}" y1="0" x2="${right}" y2="${docH}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 3" />
        <line x1="0" y1="${top}" x2="${docW}" y2="${top}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 3" />
        <line x1="0" y1="${bottom}" x2="${docW}" y2="${bottom}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 3" />
      `;
    }

    clearGuidelines() {
      if (this.guidelines) this.guidelines.innerHTML = '';
    }

    drawBoxModel(el) {
      if (!this.guidelines) return;
      this.clearBoxModel();
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const top = rect.top;
      const left = rect.left;
      const w = rect.width;
      const h = rect.height;

      const mT = Math.max(0, parseFloat(cs.marginTop) || 0);
      const mR = Math.max(0, parseFloat(cs.marginRight) || 0);
      const mB = Math.max(0, parseFloat(cs.marginBottom) || 0);
      const mL = Math.max(0, parseFloat(cs.marginLeft) || 0);

      const pT = parseFloat(cs.paddingTop) || 0;
      const pR = parseFloat(cs.paddingRight) || 0;
      const pB = parseFloat(cs.paddingBottom) || 0;
      const pL = parseFloat(cs.paddingLeft) || 0;

      const bT = parseFloat(cs.borderTopWidth) || 0;
      const bR = parseFloat(cs.borderRightWidth) || 0;
      const bB = parseFloat(cs.borderBottomWidth) || 0;
      const bL = parseFloat(cs.borderLeftWidth) || 0;

      const hasMargin = mT > 0 || mR > 0 || mB > 0 || mL > 0;
      const hasPadding = pT > 0 || pR > 0 || pB > 0 || pL > 0;
      if (!hasMargin && !hasPadding) return;

      const container = document.createElement('div');
      container.className = 'uicc-boxmodel';
      container.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:2147483645;';

      const marginBg = 'rgba(255, 255, 255, 0.12)';
      const marginBadge = 'rgba(0, 0, 0, 0.9)';
      const paddingBg = 'rgba(160, 160, 160, 0.18)';
      const paddingBadge = 'rgba(24, 24, 27, 0.9)';

      const labelStyle = `position:absolute;color:#fff;font-size:10px;font-weight:600;font-family:monospace;padding:1px 4px;border-radius:3px;white-space:nowrap;pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%);`;

      function makeBox(t, l, width, height, bg, size, badgeBg) {
        if (size <= 0 || width <= 0 || height <= 0) return '';
        const rounded = Math.round(size * 10) / 10;
        return `<div style="position:absolute;top:${t}px;left:${l}px;width:${width}px;height:${height}px;background:${bg};pointer-events:none;">
          <div style="${labelStyle}background:${badgeBg};">${rounded}</div>
        </div>`;
      }

      let html = '';
      if (hasMargin) {
        if (mT > 0) html += makeBox(top - mT, left, w, mT, marginBg, mT, marginBadge);
        if (mB > 0) html += makeBox(top + h, left, w, mB, marginBg, mB, marginBadge);
        if (mL > 0) html += makeBox(top, left - mL, mL, h, marginBg, mL, marginBadge);
        if (mR > 0) html += makeBox(top, left + w, mR, h, marginBg, mR, marginBadge);
      }
      if (hasPadding) {
        const padTop = top + bT;
        const padLeft = left + bL;
        const padWidth = w - bL - bR;
        const padHeight = h - bT - bB;
        if (pT > 0) html += makeBox(padTop, padLeft, padWidth, pT, paddingBg, pT, paddingBadge);
        if (pB > 0) html += makeBox(padTop + padHeight - pB, padLeft, padWidth, pB, paddingBg, pB, paddingBadge);
        if (pL > 0) html += makeBox(padTop + pT, padLeft, pL, padHeight - pT - pB, paddingBg, pL, paddingBadge);
        if (pR > 0) html += makeBox(padTop + pT, padLeft + padWidth - pR, pR, padHeight - pT - pB, paddingBg, pR, paddingBadge);
      }

      container.innerHTML = html;
      this.guidelines.appendChild(container);
    }

    clearBoxModel() {
      if (this.guidelines) this.guidelines.querySelectorAll('.uicc-boxmodel').forEach(d => d.remove());
    }

    getBackgroundInfo(el) {
      const transparent = (t) => !t || t === 'transparent' || t === 'rgba(0, 0, 0, 0)';
      const alphaOf = (t) => {
        if (!t) return 0;
        const m = t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) return m[4] ? parseFloat(m[4]) : 1;
        return 1;
      };
      const firstColor = (t) => {
        if (!t || t === 'none') return null;
        const re = [/rgba?\([^)]+\)/gi, /#[a-fA-F0-9]{3,8}\b/gi];
        for (const r of re) { const m = t.match(r); if (m && m.length) return m[0]; }
        return null;
      };
      let node = el, fallback = null;
      for (; node; node = node.parentElement) {
        const cs = window.getComputedStyle(node);
        const img = cs.backgroundImage;
        if (img && img !== 'none' && img.includes('gradient')) {
          const c = firstColor(img);
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
      return fallback || { value: 'rgb(0, 0, 0)', isGradient: false };
    }

    // Render live element information directly INSIDE the expanded floating bar
    renderHoverElementInfo(el) {
      const contentEl = this.toolbar?.querySelector('#uicc-content');
      if (!contentEl) return;
      const cs = window.getComputedStyle(el);
      const bg = this.getBackgroundInfo(el);
      const hasText = el.textContent && el.textContent.trim().length > 0;
      const font = this.escapeHtml(cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim());

      const html = `
        <div class="uicc-hover-preview">
          <div class="uicc-hover-header">
            <span class="uicc-tag-badge">&lt;${el.tagName.toLowerCase()}&gt;</span>
            <span class="uicc-dim-badge">${Math.round(el.offsetWidth)} × ${Math.round(el.offsetHeight)} px</span>
          </div>

          <div class="uicc-hover-specs">
            <div class="uicc-spec-row">
              <span class="uicc-spec-label">Class</span>
              <span class="uicc-spec-val" style="font-family:monospace;">${el.className && typeof el.className === 'string' ? this.escapeHtml(el.className.split(/\s+/)[0] || 'none') : 'none'}</span>
            </div>
            ${hasText ? `
              <div class="uicc-spec-row">
                <span class="uicc-spec-label">Font</span>
                <span class="uicc-spec-val">${font} · ${cs.fontSize}</span>
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

          <div class="uicc-hover-cta">
            Click to inspect this element
          </div>
        </div>
      `;

      contentEl.innerHTML = html;
    }

    exitSelectionMode() {
      this.isSelectionMode = false;
      if (this.overlay?.classList) this.overlay.classList.add('uicc-hidden');
      if (document.body?.classList) document.body.classList.remove('uicc-selection-active');
      if (document.body) document.body.style.cursor = '';
      document.removeEventListener('mouseover', this.onMouseOver, true);
      document.removeEventListener('mouseout', this.onMouseOut, true);
      document.removeEventListener('mousemove', this.onMouseMoveCoords, true);
      document.removeEventListener('click', this.onClickCapture, true);
      document.removeEventListener('keydown', this.onKeyDown, true);
      window.removeEventListener('scroll', this.onViewportChange, true);
      window.removeEventListener('resize', this.onViewportChange, true);
      this.currentElement = null;
      if (this.highlight) {
        this.highlight.style.width = '0px';
        this.highlight.style.height = '0px';
        if (this.highlight.classList) this.highlight.classList.remove('uicc-highlight-active');
      }
      this.clearGuidelines();
      this.clearBoxModel();
    }

    getBreadcrumbTrail(element) {
      const trail = [];
      let curr = element;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (!this.isOwnUI(curr)) {
          const tag = curr.tagName.toLowerCase();
          const id = curr.id ? `#${curr.id}` : '';
          const cls = curr.className && typeof curr.className === 'string'
            ? `.${curr.className.trim().split(/\s+/)[0]}`
            : '';
          trail.unshift({
            element: curr,
            label: `${tag}${id}${cls}`
          });
        }
        curr = curr.parentElement;
      }
      return trail;
    }

    showSelectedComponent() {
      if (!this.selectedElement) return;

      this.expandToolbar();

      const element = this.selectedElement;
      const styles = window.getComputedStyle(element);
      const elementType = this.getElementType(element);
      const preview = this.createComponentPreview(element);
      const properties = this.extractProperties(element, styles);
      const breadcrumbs = this.getBreadcrumbTrail(element);

      const content = `
        <div class="uicc-breadcrumb">
          ${breadcrumbs.map((item, idx) => `
            <button class="uicc-breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}" data-breadcrumb-idx="${idx}">
              ${this.escapeHtml(item.label)}
            </button>
            ${idx < breadcrumbs.length - 1 ? '<span style="color:#52525b;">›</span>' : ''}
          `).join('')}
        </div>

        <div class="uicc-component-preview">
          <div class="uicc-element-type">
            <span class="uicc-element-type-badge">${elementType}</span>
            <span style="font-size:11px;color:#a1a1aa;margin-left:auto;">${Math.round(element.offsetWidth)} × ${Math.round(element.offsetHeight)} px</span>
          </div>
          <div class="uicc-preview-image">
            ${preview}
          </div>
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
                html: extracted.html,
                css: extracted.css
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

      this.toolbar.querySelectorAll('.uicc-breadcrumb-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.breadcrumbIdx, 10);
          if (breadcrumbs[idx] && breadcrumbs[idx].element) {
            this.selectedElement = breadcrumbs[idx].element;
            this._lastExtraction = null;
            this.highlightElement(this.selectedElement);
            this.showSelectedComponent();
          }
        });
      });

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
      if (tag === 'svg') return 'SVG';
      if (tag === 'img') return 'Image';
      if (tag === 'section' || className.includes('section')) return 'Section';
      return tag.toUpperCase();
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
      return '<div>Preview</div>';
    }

    extractProperties(element, styles) {
      const properties = {
        element: {
          'Element Type': element.tagName.toLowerCase(),
          'Class Name': element.className && typeof element.className === 'string' ? element.className : 'none'
        }
      };

      if (element.textContent && element.textContent.trim()) {
        properties.typography = {
          'Font Family': styles.fontFamily,
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
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) throw e;
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
      return result.combined;
    }

    async generateTailwind(element) {
      if (!this.extractor) throw new Error('Extraction engine unavailable');
      await loadPostcss();
      return this.extractor.toTailwind(element, await this.getExtraction(element));
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
      if (hexOrRgb && hexOrRgb.includes('gradient')) return 'Gradient';
      const hex = this.rgbToHex(hexOrRgb);
      if (!hex || !hex.startsWith('#')) return 'Other';
      const clean = hex.slice(1);
      if (clean.length < 6) return 'Other';
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

      const allElements = Array.from(document.querySelectorAll('body, body *')).filter(element => !this.isOwnUI(element));
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

        const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
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
        if (elementIndex > 0 && elementIndex % 400 === 0) {
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
      if (!rgb) return '#000000';
      if (rgb.startsWith('#')) return rgb.toUpperCase();
      const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!match) return rgb;
      const [_, r, g, b] = match;
      return '#' + [r, g, b].map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  }

  if (!window.uicc) {
    window.uicc = new UIComponentCopier();
  }
})();
