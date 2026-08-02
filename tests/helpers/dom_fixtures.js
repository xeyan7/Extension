'use strict';

const { createMockElement, createMockTextNode } = require('./test_utils.js');

/**
 * Creates T3-01 / T4-01 SaaS Hero Component Fixture
 */
function createSaaSHeroFixture() {
  const container = createMockElement('SECTION', {
    className: 'hero-section',
    style: { display: 'flex', 'flex-direction': 'column', width: '1200px', padding: '60px 40px' }
  });

  const badge = createMockElement('DIV', {
    className: 'hero-badge',
    style: {
      display: 'inline-flex',
      'align-items': 'center',
      padding: '8px 16px',
      'border-radius': '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      'backdrop-filter': 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    textContent: 'New Feature V2.0'
  });

  const title = createMockElement('H1', {
    className: 'hero-title',
    style: {
      'font-size': '48px',
      'font-weight': '800',
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent'
    },
    textContent: 'Build Faster Applications'
  });

  const ctaGroup = createMockElement('DIV', {
    className: 'cta-group',
    style: { display: 'flex', gap: '16px', 'margin-top': '24px' }
  });

  const primaryBtn = createMockElement('BUTTON', {
    className: 'btn-primary',
    style: { padding: '12px 24px', background: '#6366f1', color: '#ffffff', 'border-radius': '8px', border: 'none' },
    textContent: 'Get Started'
  });

  const secondaryBtn = createMockElement('BUTTON', {
    className: 'btn-secondary',
    style: { padding: '12px 24px', background: 'transparent', color: '#6366f1', 'border-radius': '8px', border: '1px solid #6366f1' },
    textContent: 'View Demo'
  });

  ctaGroup.appendChild(primaryBtn);
  ctaGroup.appendChild(secondaryBtn);

  const previewCard = createMockElement('DIV', {
    className: 'preview-card',
    style: {
      width: '400px',
      height: '250px',
      'box-shadow': '0 20px 50px rgba(0, 0, 0, 0.3)',
      animation: 'float 4s ease-in-out infinite',
      'border-radius': '16px'
    }
  });

  const svgIcon = createMockElement('SVG', {
    attributes: { viewBox: '0 0 48 48', width: '48', height: '48', fill: 'currentColor' }
  });
  const path = createMockElement('PATH', {
    attributes: { d: 'M10 10h28v28H10z' }
  });
  svgIcon.appendChild(path);
  previewCard.appendChild(svgIcon);

  container.appendChild(badge);
  container.appendChild(title);
  container.appendChild(ctaGroup);
  container.appendChild(previewCard);

  return { container, badge, title, ctaGroup, primaryBtn, secondaryBtn, previewCard, svgIcon };
}

/**
 * Creates T4-02 Pricing Table Component Fixture
 */
function createPricingTableFixture() {
  const grid = createMockElement('DIV', {
    className: 'pricing-grid',
    style: {
      display: 'grid',
      'grid-template-columns': 'repeat(3, 1fr)',
      gap: '30px',
      width: '900px',
      '--pricing-bg': '#ffffff',
      '--accent-color': '#6366f1'
    }
  });

  const tiers = [
    { name: 'Starter', price: '$9', popular: false },
    { name: 'Pro', price: '$29', popular: true },
    { name: 'Enterprise', price: '$99', popular: false }
  ];

  const cards = tiers.map(tier => {
    const card = createMockElement('ARTICLE', {
      className: tier.popular ? 'pricing-card popular' : 'pricing-card',
      style: {
        position: 'relative',
        padding: '32px',
        background: 'var(--pricing-bg)',
        border: '1px solid #e4e4e7',
        'border-radius': '12px'
      }
    });

    const name = createMockElement('H3', { textContent: tier.name });
    const price = createMockElement('DIV', { className: 'price', textContent: tier.price });
    const btn = createMockElement('BUTTON', { className: 'select-plan', textContent: 'Select Plan' });

    const checkSvg = createMockElement('SVG', {
      attributes: { viewBox: '0 0 24 24', width: '20', height: '20', stroke: 'var(--accent-color)', 'stroke-width': '2', 'stroke-linecap': 'round' }
    });
    checkSvg.appendChild(createMockElement('POLYLINE', { attributes: { points: '20 6 9 17 4 12' } }));

    card.appendChild(name);
    card.appendChild(price);
    card.appendChild(checkSvg);
    card.appendChild(btn);

    grid.appendChild(card);
    return card;
  });

  return { grid, cards };
}

/**
 * Creates T4-03 E-Commerce Navigation Bar Fixture
 */
function createNavbarFixture() {
  const nav = createMockElement('NAV', {
    className: 'navbar',
    style: { display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', padding: '16px 32px', width: '1200px' }
  });

  const logo = createMockElement('SVG', {
    attributes: { viewBox: '0 0 100 30', width: '100', height: '30' }
  });

  const searchBar = createMockElement('DIV', {
    className: 'search-bar',
    style: { width: '320px', height: '40px', border: '1px solid #ccc', 'border-radius': '20px' }
  });

  const searchInput = createMockElement('INPUT', {
    attributes: { type: 'text', placeholder: 'Search products...', value: 'Headphones' }
  });
  searchBar.appendChild(searchInput);

  const navLinks = createMockElement('UL', { className: 'nav-links', style: { display: 'flex', gap: '20px' } });
  const item1 = createMockElement('LI', { className: 'nav-item', textContent: 'Shop' });
  const dropdown = createMockElement('UL', { className: 'dropdown', style: { display: 'none', position: 'absolute' } });
  dropdown.appendChild(createMockElement('LI', { textContent: 'Electronics' }));
  dropdown.appendChild(createMockElement('LI', { textContent: 'Apparel' }));
  item1.appendChild(dropdown);
  navLinks.appendChild(item1);

  nav.appendChild(logo);
  nav.appendChild(searchBar);
  nav.appendChild(navLinks);

  return { nav, logo, searchBar, searchInput, navLinks, dropdown };
}

/**
 * Creates T4-04 Dark Mode Analytics Dashboard Widget Fixture
 */
function createAnalyticsDashboardFixture() {
  const card = createMockElement('DIV', {
    className: 'dashboard-card',
    style: {
      background: 'rgb(24, 24, 27)',
      color: '#f4f4f5',
      'border-radius': '16px',
      padding: '24px',
      width: '360px'
    }
  });

  const header = createMockElement('DIV', { className: 'card-header', style: { display: 'flex', 'align-items': 'center', gap: '8px' } });
  const statusDot = createMockElement('SPAN', { className: 'status-dot', textContent: 'Live Stats' });
  header.appendChild(statusDot);

  const svgChart = createMockElement('SVG', {
    className: 'chart',
    attributes: { viewBox: '0 0 300 100', width: '300', height: '100' }
  });

  const defs = createMockElement('DEFS');
  const gradient = createMockElement('LINEARGARDIENT', {
    attributes: { id: 'chartGrad', x1: '0', y1: '0', x2: '0', y2: '1', gradientUnits: 'userSpaceOnUse' }
  });
  gradient.appendChild(createMockElement('STOP', { attributes: { offset: '0%', 'stop-color': '#22c55e', 'stop-opacity': '0.8' } }));
  gradient.appendChild(createMockElement('STOP', { attributes: { offset: '100%', 'stop-color': '#22c55e', 'stop-opacity': '0.0' } }));
  defs.appendChild(gradient);

  const path = createMockElement('PATH', {
    attributes: { d: 'M0 80 Q 150 10 300 50 L 300 100 L 0 100 Z', fill: 'url(#chartGrad)' }
  });

  svgChart.appendChild(defs);
  svgChart.appendChild(path);

  card.appendChild(header);
  card.appendChild(svgChart);

  return { card, statusDot, svgChart, gradient, defs };
}

/**
 * Creates T4-05 Bidi Arabic Editorial Card Fixture
 */
function createBidiCardFixture() {
  const card = createMockElement('ARTICLE', {
    className: 'editorial-card',
    style: {
      direction: 'rtl',
      'text-align': 'right',
      'font-family': "'Amiri', serif",
      padding: '20px',
      border: '1px solid #ddd'
    }
  });

  const title = createMockElement('H2', {
    className: 'article-title',
    textContent: 'اخبار \u202Eاليوم\u2069 العاجلة'
  });

  const body = createMockElement('P', {
    className: 'article-body',
    textContent: 'تغطية \u202Dشاملة\u2066 للأحداث.'
  });

  card.appendChild(title);
  card.appendChild(body);

  return { card, title, body };
}

/**
 * Creates T4-06 Encapsulated Modal Dialog Fixture
 */
function createModalDialogFixture() {
  const backdrop = createMockElement('DIV', {
    className: 'modal-backdrop',
    style: {
      position: 'fixed',
      inset: '0px',
      background: 'rgba(0, 0, 0, 0.5)',
      'backdrop-filter': 'blur(4px)',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center'
    }
  });

  const content = createMockElement('DIV', {
    className: 'modal-content',
    style: {
      'max-width': '480px',
      width: '100%',
      background: '#ffffff',
      'border-radius': '12px',
      padding: '24px'
    }
  });

  const title = createMockElement('H2', { textContent: 'Secure Checkout' });
  
  const form = createMockElement('FORM', { attributes: { action: '#', method: 'POST' } });

  const nameInput = createMockElement('INPUT', {
    attributes: { type: 'text', name: 'fullname', value: 'John Doe' }
  });

  const passInput = createMockElement('INPUT', {
    attributes: { type: 'password', name: 'userpass', value: 'SuperSecret123!' }
  });

  const cardInput = createMockElement('INPUT', {
    attributes: { type: 'text', name: 'creditcard', value: '4111222233334444' }
  });

  form.appendChild(nameInput);
  form.appendChild(passInput);
  form.appendChild(cardInput);

  const closeBtn = createMockElement('BUTTON', {
    className: 'modal-close',
    textContent: 'Close'
  });

  content.appendChild(title);
  content.appendChild(form);
  content.appendChild(closeBtn);
  backdrop.appendChild(content);

  return { backdrop, content, title, form, nameInput, passInput, cardInput, closeBtn };
}

module.exports = {
  createSaaSHeroFixture,
  createPricingTableFixture,
  createNavbarFixture,
  createAnalyticsDashboardFixture,
  createBidiCardFixture,
  createModalDialogFixture
};
