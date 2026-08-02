'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  Extractor,
  absoluteUrl,
  rewriteCssUrls,
  stripBidiControls
} = require('../lib/extractor.js');

const {
  setupPostcss,
  setupMockDocument,
  assertValidHtml,
  assertValidCss,
  assertNoXssPayload
} = require('./helpers/test_utils.js');

const {
  createSaaSHeroFixture,
  createPricingTableFixture,
  createNavbarFixture,
  createAnalyticsDashboardFixture,
  createBidiCardFixture,
  createModalDialogFixture
} = require('./helpers/dom_fixtures.js');

test.before(async () => {
  await setupPostcss();
  setupMockDocument();
});

test('T4-01: Modern SaaS Landing Page Hero Section', async () => {
  const { container, badge, title, ctaGroup, previewCard, svgIcon } = createSaaSHeroFixture();

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: node === previewCard ? 'float' : 'none',
    fontFamily: 'Inter, sans-serif',
    getPropertyValue(prop) {
      if (prop === 'backdrop-filter' && node === badge) return 'blur(12px)';
      if (prop === 'background' && node === badge) return 'rgba(255, 255, 255, 0.1)';
      if (prop === 'font-size' && node === title) return '48px';
      if (prop === '-webkit-background-clip' && node === title) return 'text';
      if (prop === 'display' && node === ctaGroup) return 'flex';
      if (prop === 'gap' && node === ctaGroup) return '16px';
      if (prop === 'animation' && node === previewCard) return 'float 4s ease-in-out infinite';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/saas/' });
  extractor.collectAllCss = async () => `
    .hero-badge { backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
    .hero-title { font-size: 48px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cta-group { display: flex; gap: 16px; margin-top: 24px; }
    .preview-card { width: 400px; height: 250px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); animation: float 4s ease-in-out infinite; }
    @media (max-width: 768px) { .hero-section { padding: 30px 20px; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `;

  try {
    const extraction = await extractor.extract(container);
    assertValidHtml(extraction.html);
    assertValidCss(extraction.css);
    assert.match(extraction.css, /backdrop-filter:\s*blur\(12px\)/);
    assert.match(extraction.css, /@keyframes float/);
    assert.match(extraction.css, /@media \(max-width: 768px\)/);
    assert.ok(extraction.stats.elements > 5);
    assert.ok(extraction.stats.svgs >= 1);

    const tailwind = await extractor.toTailwind(container, extraction);
    assert.ok(typeof tailwind === 'string');

    const vueSfc = await extractor.toVue(container, extraction);
    assert.match(vueSfc, /<template>/);
    assert.match(vueSfc, /<style scoped>/);

    const reactJsx = await extractor.toReact(container, extraction);
    assert.match(reactJsx, /export default function CopiedComponent/);
    assert.match(reactJsx, /viewBox="0 0 48 48"/);
    assertNoXssPayload(reactJsx);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T4-02: Interactive Pricing Table Component with Theme Toggling', async () => {
  const { grid, cards } = createPricingTableFixture();

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node, pseudo) => {
    if (pseudo === '::before' && node.classList.contains('popular')) {
      return {
        getPropertyValue(prop) {
          if (prop === 'content') return '"POPULAR"';
          if (prop === 'background') return 'var(--accent-color)';
          return '';
        }
      };
    }
    return {
      animationName: 'none',
      fontFamily: 'Inter, sans-serif',
      getPropertyValue(prop) {
        if (prop === 'display' && node === grid) return 'grid';
        if (prop === 'grid-template-columns' && node === grid) return 'repeat(3, 1fr)';
        if (prop === 'gap' && node === grid) return '30px';
        return '';
      }
    };
  };

  const extractor = new Extractor({ baseUrl: 'https://example.com/pricing/' });
  extractor.collectAllCss = async () => `
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; --pricing-bg: #ffffff; --accent-color: #6366f1; }
    .pricing-card.popular::before { content: 'POPULAR'; position: absolute; top: -12px; background: var(--accent-color); }
  `;

  try {
    const extraction = await extractor.extract(grid);
    assertValidHtml(extraction.html);
    assertValidCss(extraction.css);
    assert.match(extraction.css, /popular::before/);
    assert.match(extraction.css, /grid-template-columns/);

    function buildPath(el) {
      const parts = [];
      let c = el;
      while (c && c.nodeType === 1) {
        const tag = c.tagName.toLowerCase();
        const cls = c.getAttribute('class');
        parts.unshift(`${tag}${cls ? '.' + cls.split(/\s+/)[0] : ''}`);
        c = c.parentElement;
      }
      return parts.join(' > ');
    }

    const popularBtn = cards[1].querySelector('.select-plan');
    const pathStr = buildPath(popularBtn);
    assert.match(pathStr, /div\.pricing-grid > article\.pricing-card > button\.select-plan/);

    const gridRect = grid.getBoundingClientRect();
    assert.equal(gridRect.width, 900);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T4-03: Responsive E-Commerce Navigation Bar with Media Queries', async () => {
  const { nav, searchBar, dropdown } = createNavbarFixture();

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: 'Inter, sans-serif',
    getPropertyValue(prop) {
      if (prop === 'display' && node === nav) return 'flex';
      if (prop === 'justify-content' && node === nav) return 'space-between';
      if (prop === 'width' && node === searchBar) return '320px';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/store/' });
  extractor.collectAllCss = async () => `
    .navbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; }
    .search-bar { width: 320px; height: 40px; }
    .nav-item:hover .dropdown { display: block; position: absolute; }
    @media (max-width: 768px) { .nav-links { display: none; } .mobile-toggle { display: block; } }
  `;

  try {
    const extraction = await extractor.extract(nav);
    assertValidHtml(extraction.html);
    assertValidCss(extraction.css);
    assert.match(extraction.css, /\.nav-item:hover \.dropdown/);
    assert.match(extraction.css, /@media \(max-width: 768px\)/);

    const decls = extractor.computedDeclarations(searchBar, null, false);
    assert.equal(decls.some(d => d.prop === 'width' && d.value === '320px'), false);

    const vueSfc = await extractor.toVue(nav, extraction);
    assert.match(vueSfc, /<template>/);

    const reactJsx = await extractor.toReact(nav, extraction);
    assert.match(reactJsx, /CopiedComponent/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T4-04: Dark Mode Analytics Dashboard Widget with SVG Charts', async () => {
  const { card, statusDot, svgChart, gradient } = createAnalyticsDashboardFixture();

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node, pseudo) => {
    if (pseudo === '::before' && node === statusDot) {
      return {
        getPropertyValue(prop) {
          if (prop === 'content') return '""';
          if (prop === 'background') return '#22c55e';
          return '';
        }
      };
    }
    return {
      animationName: 'none',
      fontFamily: 'Inter, sans-serif',
      getPropertyValue(prop) {
        if (prop === 'background' && node === card) return 'rgb(24, 24, 27)';
        if (prop === 'color' && node === card) return 'rgb(244, 244, 245)';
        return '';
      }
    };
  };

  const extractor = new Extractor({ baseUrl: 'https://example.com/analytics/' });

  try {
    const rootCss = extractor.inheritedRootCss(card);
    assert.match(rootCss, /background-color:\s*rgb\(24,\s*24,\s*27\)/);

    const reactJsx = await extractor.toReact(card);
    assert.match(reactJsx, /<linearGradient/);
    assert.match(reactJsx, /gradientUnits="userSpaceOnUse"/);
    assert.match(reactJsx, /stopColor="#22c55e"/);
    assertNoXssPayload(reactJsx);

    const snapshot = extractor.getComputedStyleSnapshot(card);
    assert.match(snapshot.html, /dashboard-card/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T4-05: Multi-Language Editorial Card with RTL & Mixed Bidi Text', async () => {
  const { card, title, body } = createBidiCardFixture();

  const titleTextSanitized = stripBidiControls(title.textContent);
  assert.equal(titleTextSanitized, 'اخبار اليوم العاجلة');

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: "'Amiri', serif",
    getPropertyValue(prop) {
      if (prop === 'direction' && node === card) return 'rtl';
      if (prop === 'text-align' && node === card) return 'right';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/news/' });

  try {
    const extraction = await extractor.extract(card);
    assert.match(extraction.css, /direction:\s*rtl/);
    assert.match(extraction.html, /اخبار اليوم العاجلة/);

    const vueSfc = await extractor.toVue(card, extraction);
    assert.match(vueSfc, /<template>/);
    assert.match(vueSfc, /اخبار اليوم العاجلة/);

    const reactJsx = await extractor.toReact(card, extraction);
    assert.match(reactJsx, /CopiedComponent/);
    assert.match(reactJsx, /اخبار اليوم العاجلة/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});

test('T4-06: Encapsulated Modal Dialog with Form Control Protection', async () => {
  const { backdrop, content, form, nameInput, passInput, cardInput } = createModalDialogFixture();

  const previousGetComputedStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (node) => ({
    animationName: 'none',
    fontFamily: 'sans-serif',
    getPropertyValue(prop) {
      if (prop === 'position' && node === backdrop) return 'fixed';
      if (prop === 'backdrop-filter' && node === backdrop) return 'blur(4px)';
      if (prop === 'max-width' && node === content) return '480px';
      return '';
    }
  });

  const extractor = new Extractor({ baseUrl: 'https://example.com/app/' });

  try {
    const { clone } = await extractor.cloneAndSanitize(backdrop);

    const passClone = clone.querySelector('input[type="password"]');
    assert.ok(passClone !== null);
    // Sensitive password input values should be stripped during clone & sanitize
    assert.equal(passClone.getAttribute('value'), null);

    const nameClone = clone.querySelector('input[name="fullname"]');
    assert.equal(nameClone.getAttribute('value'), 'John Doe');

    const extraction = await extractor.extract(backdrop);
    assertValidHtml(extraction.html);
    assertValidCss(extraction.css);

    const reactJsx = await extractor.toReact(backdrop, extraction);
    assert.match(reactJsx, /CopiedComponent/);
    assert.doesNotMatch(reactJsx, /SuperSecret123!/);
  } finally {
    globalThis.getComputedStyle = previousGetComputedStyle;
  }
});
