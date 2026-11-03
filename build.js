/**
 * JURO website static site generator.
 * Reads editable content from /content/*.json (managed through Decap CMS at /admin)
 * and writes a complete static website to /dist. No external dependencies.
 *
 *   node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const read = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', n + '.json'), 'utf8'));

const S = read('settings');
const HOME = read('home');
const PROD = read('products');
const ABOUT = read('about');
const CUST = read('customers');
const CONTACT = read('contact');
const INFRA = read('infrastructure');

const VERSION = Date.now().toString(36);
const SITE = (S.siteUrl || '').replace(/\/$/, '');
const CATS = PROD.categories || [];
const catBySlug = Object.fromEntries(CATS.map((c) => [c.slug, c]));

/* ---------- helpers ---------- */
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paras = (t = '') => String(t).split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
const lines = (t = '') => esc(t).replace(/\n/g, '<br>');
const tel = (p = '') => 'tel:' + String(p).replace(/[^\d+]/g, '');
const waNum = String(S.whatsappNumber || '').replace(/\D/g, '');
const waLink = (msg) => waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg || S.whatsappGreeting || '')}` : '/contact/#enquiry';
const initials = (n) => n.replace(/\b(M\/S|Pvt|Ltd|Limited|Private|&|and|Company|Co)\b\.?/gi, '').trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const T = (v, d) => (v === undefined || v === null || v === '' ? d : v);
const LOGO = T(S.logo, '/images/brand/juro-logo.png');
const catHref = (slug) => `/products/${slug}/`;
const prodHref = (p) => `/products/${p.category}/${p.slug}/`;
const CAT_COLORS = { 'lighting-housings': '#e8950f', 'electrical-housings': '#7b5cff', 'turned-components': '#2c55c4', 'sheet-metal-components': '#0f9fb1', 'press-tools': '#e4572e', 'elevator-components': '#2f80ed', 'fabrication-job-work': '#f2711c' };
const catColor = (slug) => CAT_COLORS[slug] || '#2c55c4';
const enquireHref = (title) => `/contact/?product=${encodeURIComponent(title)}#enquiry`;

function srcset(src) {
  if (!src || !/\.(jpe?g|png|webp)$/i.test(src)) return '';
  const sm = src.replace(/(\.[a-z]+)$/i, '-sm$1');
  return fs.existsSync(path.join(ROOT, 'static', sm)) ? ` srcset="${esc(sm)} 960w, ${esc(src)} 1920w" sizes="100vw"` : '';
}

const ICONS = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  wa: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.3.6 4.5 1.8 6.5L3 29l6.9-1.8a13.2 13.2 0 0 0 6.1 1.5h.1c7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.3 10 10.1 5.3 16 5.3c5.9 0 10.7 4.7 10.7 10.6S21.9 26.4 16 26.4zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>',
  gear: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
const TRUST_ICONS = {
  machines: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  drawing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V5l4-2v18M9 9h10v12M13 13h2M13 17h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  factory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21h20M3 21V10l6 4V10l6 4V6h5v15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};
const CAT_ICONS = {
  'turned-components': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 20h8v8H4zM12 16h10v16H12zM22 21h14v6H22zM36 18h8v12h-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2 24h44" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/></svg>',
  'sheet-metal-components': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 14 24 6l18 8-18 8z M6 14v18l18 8V22 M42 14v18l-18 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="15" cy="27" r="1.8" fill="currentColor"/><circle cx="33" cy="27" r="1.8" fill="currentColor"/></svg>',
  'press-tools': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 6h32v8H8zM18 14h12v10H18zM8 36h32v6H8zM16 30h16v6H16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M11 14v22M37 14v22" stroke="currentColor" stroke-width="2"/></svg>',
  'elevator-components': '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="4" width="28" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 4v40" stroke="currentColor" stroke-width="2"/><path d="m16 18 3-4 3 4M26 30l3 4 3-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  'fabrication-job-work': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 40h36M10 40V26h28v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m30 6-8 14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 22l2-2M17 20l-2-3M24 24l3 1M19 24l-3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};
CAT_ICONS['lighting-housings'] = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4a13 13 0 0 0-8 23.3V33h16v-5.7A13 13 0 0 0 24 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M17 38h14M19 43h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 12v8M20 16h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
CAT_ICONS['electrical-housings'] = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="28" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 22v4M20 22v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="29" y="18" width="7" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const catIcon = (slug) => CAT_ICONS[slug] || ICONS.gear;

const NAV = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/products/', label: 'Products', key: 'products', dropdown: true },
  { href: '/about/', label: 'About Us', key: 'about' },
  { href: '/infrastructure/', label: 'Infrastructure', key: 'infrastructure' },
  { href: '/customers/', label: 'Our Customers', key: 'customers' },
  { href: '/contact/', label: 'Contact Us', key: 'contact' },
];

/* ---------- structured data ---------- */
function jsonLd(extra = []) {
  const org = {
    '@type': ['Organization', 'Manufacturer'],
    '@id': SITE + '/#organization',
    name: S.companyName,
    alternateName: S.brandName,
    slogan: S.tagline,
    url: SITE + '/',
    logo: SITE + LOGO,
    email: S.email,
    foundingDate: '2023',
    telephone: (S.contacts || [])[0]?.phone,
    address: (S.addresses || []).map((a) => ({ '@type': 'PostalAddress', streetAddress: a.lines.replace(/\n/g, ' '), addressCountry: 'IN' })),
    contactPoint: (S.contacts || []).map((c) => ({ '@type': 'ContactPoint', telephone: c.phone, contactType: 'sales', name: c.name, areaServed: 'IN', availableLanguage: ['English', 'Hindi'] })),
    knowsAbout: CATS.map((c) => c.title),
  };
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, ...extra] })}</script>`;
}

/* ---------- layout ---------- */
function header(active) {
  const dd = CATS.map((c) => `<li><a href="${catHref(c.slug)}"><span class="dd-ic">${catIcon(c.slug)}</span><span><strong>${esc(c.title)}</strong><small>${esc(c.summary)}</small></span></a></li>`).join('');
  const links = NAV.map((n) => n.dropdown
    ? `<li class="has-dd"><a href="${n.href}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></a><div class="dd"><ul>${dd}<li class="dd-all"><a href="/products/">View all products ${ICONS.arrow}</a></li></ul></div></li>`
    : `<li><a href="${n.href}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  const mob = NAV.map((n, i) => `<li style="--i:${i}"><a href="${n.href}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  const c0 = (S.contacts || [])[0] || {};
  return `
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap topbar-in">
  <span>${ICONS.pin}${esc(T(S.topbarText, ''))}</span>
  <span class="tb-right"><a href="mailto:${esc(S.email)}">${ICONS.mail}${esc(S.email)}</a><a href="${tel(c0.phone)}">${ICONS.phone}${esc(c0.phone || '')}</a></span>
</div></div>
<header class="site-header" id="top">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="${esc(S.companyName)} — Home">
      <img src="${esc(LOGO)}" alt="${esc(S.brandName)} logo" width="120" height="86">
      <span class="brand-txt"><strong>${esc(S.companyName)}</strong><small>${esc(S.tagline)}</small></span>
    </a>
    <nav class="main-nav" aria-label="Main"><ul>${links}</ul></nav>
    <div class="nav-cta">
      <a class="btn btn-primary btn-sm" href="/contact/#enquiry" data-magnetic>${esc(T(S.headerButton, 'Enquire Now'))}</a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <ul>${mob}</ul>
  <div class="mnav-foot">
    <a class="btn btn-primary" href="/contact/#enquiry">${esc(T(S.headerButton, 'Enquire Now'))}</a>
    <a class="btn btn-wa" href="${waLink()}" target="_blank" rel="noopener">${ICONS.wa}WhatsApp</a>
    <p>${esc(S.email)}</p>
  </div>
</div>`;
}

function footer() {
  const cats = CATS.map((c) => `<li><a href="${catHref(c.slug)}">${esc(c.title)}</a></li>`).join('');
  const ppl = (S.contacts || []).map((c) => `<li><a href="${tel(c.phone)}">${ICONS.phone}<span>${esc(c.name)}<br><b>${esc(c.phone)}</b></span></a></li>`).join('');
  const adr = (S.addresses || []).map((a) => `<li>${ICONS.pin}<span><b>${esc(a.label)}</b><br>${lines(a.lines)}</span></li>`).join('');
  return `
<section class="cta-strip">
  <div class="wrap cta-strip-in reveal">
    <div><p class="eyebrow">${esc(T(S.ctaEyebrow, 'Start a project'))}</p><h2>${esc(HOME.cta.heading)}</h2><p>${esc(HOME.cta.text)}</p></div>
    <div class="cta-actions"><a class="btn btn-primary" href="/contact/#enquiry" data-magnetic>${esc(HOME.cta.button)}${ICONS.arrow}</a><a class="btn btn-wa" href="${waLink()}" target="_blank" rel="noopener">${ICONS.wa}Chat on WhatsApp</a></div>
  </div>
</section>
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <img src="${esc(LOGO)}" alt="${esc(S.brandName)} — ${esc(S.tagline)}" width="130" height="93" loading="lazy">
      <p>${esc(S.footerNote)}</p>
      <a class="foot-mail" href="mailto:${esc(S.email)}">${ICONS.mail}${esc(S.email)}</a>
    </div>
    <div><h3>Company</h3><ul class="foot-links">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}<li><a href="/contact/#enquiry">${esc(T(S.headerButton, 'Enquire Now'))}</a></li></ul></div>
    <div><h3>Products</h3><ul class="foot-links">${cats}</ul></div>
    <div><h3>Reach us</h3><ul class="foot-contact">${ppl}${adr}</ul></div>
  </div>
  <div class="wrap foot-bottom">
    <p>© <span data-year>${new Date().getFullYear()}</span> ${esc(S.companyName)} All rights reserved.</p>
    <p>${esc(S.brandName)} · ${esc(S.tagline)}</p>
  </div>
</footer>
<a class="enq-tab" href="/contact/#enquiry" data-enquire="">${esc(T(S.floatingButton, 'Enquire Now'))}</a>
<div class="float-actions">
  <a class="fab fab-wa" href="${waLink()}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICONS.wa}<span class="fab-tip">Chat with us</span></a>
  <button class="to-top" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</div>
${enquiryPanel()}
<dialog class="lightbox" aria-label="Image viewer"><button class="lb-close" aria-label="Close">×</button><button class="lb-prev" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="Next image">›</button></dialog>`;
}

function layout({ key, title, description, urlPath, ogImage, body, preload, ld, noindex }) {
  const url = SITE + urlPath;
  const og = SITE + (ogImage || '/images/hero/hero-turned.jpg');
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('juro-visited'))document.documentElement.classList.add('no-loader')}catch(e){}</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#ffffff">
<meta name="geo.region" content="IN-UP">
<meta name="geo.placename" content="Ghaziabad, Uttar Pradesh, India">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.companyName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1920">
<meta property="og:image:height" content="1080">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(og)}">
<link rel="icon" type="image/png" href="/images/brand/favicon.png">
<link rel="apple-touch-icon" href="/images/brand/icon-192.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
${preload || ''}
<link rel="stylesheet" href="/css/style.css?v=${VERSION}">
${jsonLd(ld || [])}
</head>
<body data-page="${key}">
<div class="loader" aria-hidden="true"><div class="loader-mark"><img src="${esc(LOGO)}" alt="" width="110" height="78"><p class="loader-tag">${taglineWords()}</p><span class="loader-bar"></span></div></div>
${header(key)}
<main id="main">
${body}
</main>
${footer()}
<script>window.JURO=${JSON.stringify({ wa: waNum, company: S.companyName })};</script>
<script src="/js/main.js?v=${VERSION}" defer></script>
</body>
</html>`;
}

function pageHero({ title, intro, image, crumb, parent }) {
  return `
<section class="page-hero">
  <div class="page-hero-bg" data-parallax="0.2"><img src="${esc(image)}"${srcset(image)} alt="" fetchpriority="high"></div>
  <div class="wrap page-hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>${parent ? `<a href="${parent.href}">${esc(parent.label)}</a><span>/</span>` : ''}<span aria-current="page">${esc(crumb)}</span></nav>
    <h1 class="split">${esc(title)}</h1>
    <p class="lead">${esc(intro)}</p>
  </div>
</section>`;
}

const taglineWords = () => String(S.tagline || '').split(/\s+/).filter(Boolean).map((w, i) => `<span class="tw" style="--ti:${i}" aria-hidden="true">${esc(w)}</span>`).join(' ');

const sectionHead = (eyebrow, h, p = '', cls = '') => `<div class="sec-head ${cls} reveal">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ''}</div>`;

function visual(image, title, slug, big) {
  if (image) return `<img src="${esc(image)}" alt="${esc(title)} manufactured by JURO" loading="lazy" decoding="async">`;
  return `<div class="blueprint-ph${big ? ' big' : ''}" role="img" aria-label="${esc(title)} — illustration">${catIcon(slug)}<span>${esc(title)}</span></div>`;
}

/* product catalogue (filter + cards) — used on Home and Products */
function faqBlock() {
  const items = (HOME.faq || []).map((f, i) => `<details class="faq-item reveal" style="--d:${i * 50}ms"${i === 0 ? ' open' : ''}><summary><span>${esc(f.q)}</span><i>${ICONS.plus}</i></summary><div class="faq-a"><p>${esc(f.a)}</p></div></details>`).join('');
  return `
<section class="section faq" id="faq">
  <div class="wrap faq-grid">
    <div class="faq-head reveal">
      <p class="eyebrow">${esc(T(HOME.faqEyebrow, 'FAQ'))}</p>
      <h2>${esc(HOME.faqHeading)}</h2>
      <p>${esc(T(HOME.faqText, ''))}</p>
      <div class="btn-row"><a class="btn btn-primary" href="/contact/#enquiry">${esc(T(HOME.faqButton, 'Ask a question'))} ${ICONS.arrow}</a></div>
    </div>
    <div class="faq-list">${items}</div>
  </div>
</section>`;
}
const faqLd = () => (HOME.faq || []).length ? [{ '@type': 'FAQPage', mainEntity: HOME.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : [];

/* ---------- pages ---------- */
function homePage() {
  const H = HOME.hero;
  const slides = H.slides.map((sl, i) => `<figure class="slide" data-i="${i}"><img src="${esc(sl.image)}"${srcset(sl.image)} alt="${esc(sl.alt)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><figcaption>${esc(sl.label || '')}</figcaption></figure>`).join('');
  const dots = H.slides.map((sl, i) => `<button role="tab" aria-label="Show slide ${i + 1}: ${esc(sl.label || '')}" data-go="${i}"><span></span></button>`).join('');
  let wi = 0;
  const headingLines = H.heading.split('\n').map((l) => `<span class="line"><span>${l.trim().split(/\s+/).map((w) => `<span class="hw" style="--wi:${wi++}">${esc(w)}</span>`).join(' ')}</span></span>`).join('');
  const stats = HOME.stats.map((st) => `<div class="hstat"><strong><span data-count="${Number(st.value)}"${st.plain ? ' data-plain' : ''}>${st.plain ? esc(st.value) : '0'}</span>${esc((st.suffix || '').trim())}</strong><span>${esc(st.label)}</span></div>`).join('<i class="hstat-div" aria-hidden="true"></i>');
  const trust = (HOME.trust || []).map((t, i) => `<li class="reveal" style="--d:${i * 70}ms"><span class="trust-ic">${TRUST_ICONS[t.icon] || ICONS.check}</span><span><strong>${esc(t.title)}</strong><small>${esc(t.text)}</small></span></li>`).join('');
  const why = HOME.why.map((w, i) => `<li class="reveal" style="--d:${i * 80}ms"><span class="why-ic">${ICONS.check}</span><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></li>`).join('');
  const proc = HOME.process.map((p, i) => `<li class="reveal" style="--d:${i * 90}ms"><span class="step-n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join('');
  const inds = HOME.industries.map((x) => `<li>${esc(x)}</li>`).join('');
  const marquee = CUST.customers.map((c) => c.logo ? `<li class="mq-logo"><span class="mq-chip"><img src="${esc(c.logo)}" alt="${esc(c.name)}" loading="lazy"></span></li>` : `<li>${esc(c.name)}</li>`).join('');
  const machinesTop = INFRA.machines.slice(0, 6).map((m) => `<li><b>${esc(m.qty)}</b><span>${esc(m.name)}</span></li>`).join('');

  const body = `
<section class="hero" aria-roledescription="carousel" aria-label="Highlights" data-slide-seconds="${esc(T(H.slideSeconds, 3))}">
  <div class="hero-slides" data-parallax="0.25">${slides}</div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="spark-field" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <p class="eyebrow hero-eyebrow">${esc(H.eyebrow)}</p>
    <h1 class="hero-title">${headingLines}</h1>
    <p class="hero-sub">${esc(H.subheading)}</p>
    <div class="hero-actions">
      <a class="btn btn-primary btn-lg" href="/contact/#enquiry" data-magnetic>${esc(H.primaryButton)}${ICONS.arrow}</a>
      <a class="btn btn-line btn-lg" href="/products/">${esc(H.secondaryButton)}</a>
    </div>
    <div class="hero-stats">${stats}</div>
    <div class="hero-meta">
      <div class="hero-dots" role="tablist" aria-label="Choose slide">${dots}</div>
      <p class="hero-label" aria-live="polite"></p>
    </div>
  </div>
</section>

<section class="trust" aria-label="Why JURO"><div class="wrap"><ul class="trust-grid">${trust}</ul></div></section>

<section class="marquee-band" aria-label="Customers we supply">
  <p class="mq-title">${esc(T(S.marqueeTitle, 'Trusted supplier to'))}</p>
  <div class="marquee"><ul>${marquee}</ul><ul aria-hidden="true">${marquee}</ul></div>
</section>

<section class="section intro" id="intro">
  <div class="wrap intro-grid">
    <div class="intro-media reveal-img">
      <div class="frame"><img src="${esc(HOME.intro.image)}" alt="${esc(HOME.intro.imageAlt)}" loading="lazy" decoding="async"></div>
      ${HOME.introBadge && HOME.introBadge.value ? `<div class="intro-badge"><b>${esc(HOME.introBadge.label)}</b><span>${esc(HOME.introBadge.value)}</span><small>${esc(HOME.introBadge.place)}</small></div>` : ''}
    </div>
    <div class="intro-txt reveal">
      <p class="eyebrow">${esc(HOME.intro.eyebrow)}</p>
      <h2>${esc(HOME.intro.heading)}</h2>
      ${paras(HOME.intro.text)}
      <div class="btn-row"><a class="btn btn-primary" href="/about/">${esc(T(HOME.introButtons?.primary, 'About the company'))}${ICONS.arrow}</a><a class="btn btn-line" href="/contact/#enquiry">${esc(T(HOME.introButtons?.secondary, 'Enquire Now'))}</a></div>
    </div>
  </div>
</section>

<section class="section products-sec" id="products">
  <div class="wrap">
    <div class="sec-row">
      ${sectionHead(HOME.productsEyebrow, HOME.productsHeading, HOME.productsText)}
      <a class="text-link reveal" href="/products/">View full product range ${ICONS.arrow}</a>
    </div>
    ${productCatalogue(8, true)}
  </div>
</section>

<section class="section why">
  <div class="wrap why-grid">
    <div class="why-head reveal">
      <p class="eyebrow">${esc(T(HOME.whyEyebrow, 'Our strengths'))}</p>
      <h2>${esc(HOME.whyHeading)}</h2>
      <p>${esc(T(HOME.whyText, ''))}</p>
      <ul class="mach-mini">${machinesTop}</ul>
      <a class="text-link" href="/infrastructure/#machines">See all machines ${ICONS.arrow}</a>
    </div>
    <ul class="why-list">${why}</ul>
  </div>
</section>

<section class="section process">
  <div class="wrap">
    ${sectionHead(T(HOME.processEyebrow, 'How we work'), HOME.processHeading, '', 'center')}
    <ol class="steps">${proc}</ol>
  </div>
</section>

<section class="industries">
  <div class="wrap ind-in reveal">
    <h2>${esc(HOME.industriesHeading)}</h2>
    <ul class="ind-list">${inds}</ul>
  </div>
</section>
${testimonialsBlock()}
${faqBlock()}`;
  return layout({ key: 'home', title: HOME.seoTitle, description: HOME.seoDescription, urlPath: '/', ogImage: H.slides[0]?.image, body, ld: faqLd(),
    preload: `<link rel="preload" as="image" href="${esc(H.slides[0]?.image)}"${srcset(H.slides[0]?.image).replace('srcset', 'imagesrcset').replace('sizes', 'imagesizes')}>` });
}

function productCatalogue(limit, featuredOnly) {
  let all = PROD.products || [];
  if (featuredOnly) { const f = all.filter((p) => p.featured); if (f.length) all = f; }
  const list = all.slice(0, limit || undefined);
  const used = CATS.filter((c) => list.some((p) => p.category === c.slug));
  const count = (slug) => list.filter((p) => p.category === slug).length;
  const filters = `<div class="pfilters reveal" role="group" aria-label="Filter products by category">
    <button type="button" class="pf on" data-filter="all" aria-pressed="true">All products <span>${list.length}</span></button>
    ${used.map((c) => `<button type="button" class="pf" style="--c:${catColor(c.slug)}" data-filter="${esc(c.slug)}" aria-pressed="false">${esc(c.filterLabel || c.title)} <span>${count(c.slug)}</span></button>`).join('')}
  </div>`;
  return `${filters}<div class="pgrid">${list.map((p, i) => productCard(p, i)).join('')}</div><p class="pempty" hidden>No products in this category.</p>`;
}

function productCard(p, i) {
  const c = catBySlug[p.category] || {};
  const href = p.slug ? prodHref(p) : (c.slug ? catHref(c.slug) : '');
  return `
    <article class="pcard reveal" style="--d:${(i % 4) * 60}ms; --c:${catColor(p.category)}" data-cat="${esc(p.category)}">
      <a class="pcard-img" href="${href}" aria-label="${esc(p.name)} — details">${visual(p.image, p.name, p.category)}<span class="pcard-view">View details</span></a>
      <div class="pcard-body">
        ${c.slug ? `<a class="pcard-cat" href="${catHref(c.slug)}">${esc(c.title)}</a>` : ''}
        <h3><a href="${href}">${esc(p.name)}</a></h3>
        <p>${esc(p.description)}</p>
        <div class="pcard-actions">
          <a class="pcard-link" href="${enquireHref(c.title || p.name)}" data-enquire="${esc(c.title || '')}" data-note="${esc(p.name)}">Enquire Now ${ICONS.arrow}</a>
          <a class="pcard-wa" href="${waLink(`Hello, I would like a quotation for ${p.name}.`)}" target="_blank" rel="noopener" aria-label="Ask about ${esc(p.name)} on WhatsApp">${ICONS.wa}</a>
        </div>
      </div>
    </article>`;
}

function productPage(p) {
  const c = catBySlug[p.category] || {};
  const gal = [p.image, ...(p.gallery || [])].filter((v, k, a) => v && a.indexOf(v) === k);
  const thumbs = gal.length > 1 ? `<ul class="pd-thumbs">${gal.map((g, k) => `<li><button type="button" class="pd-thumb${k === 0 ? ' on' : ''}" data-src="${esc(g)}" aria-label="Show image ${k + 1}"><img src="${esc(g)}" alt="" loading="lazy"></button></li>`).join('')}</ul>` : '';
  const specs = (p.specs || []).filter((s) => s && s.label);
  const quick = specs.slice(0, 3);
  const related = (PROD.products || []).filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const body = `
<section class="pd-top" style="--c:${catColor(p.category)}">
  <div class="pd-blob" aria-hidden="true"></div>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/products/">Products</a><span>/</span>${c.slug ? `<a href="${catHref(c.slug)}">${esc(c.title)}</a><span>/</span>` : ''}<span aria-current="page">${esc(p.name)}</span></nav>
    <div class="pd-grid">
      <div class="pd-media reveal-img">
        <div>
          ${gal.length ? `<button type="button" class="pd-main" data-lb="${esc(gal[0])}" data-cap="${esc(p.name)}" aria-label="Enlarge image"><img src="${esc(gal[0])}" alt="${esc(p.name)} — manufactured by JURO"></button>` : visual('', p.name, p.category, true)}
          ${thumbs}
        </div>
      </div>
      <div class="pd-info">
        ${c.slug ? `<a class="pd-cat" href="${catHref(c.slug)}"><span class="cat-ic">${catIcon(c.slug)}</span>${esc(c.title)}</a>` : ''}
        <h1 class="split">${esc(p.name)}</h1>
        <p class="pd-lead">${esc(p.description)}</p>
        ${quick.length ? `<ul class="pd-quick">${quick.map((s) => `<li><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></li>`).join('')}</ul>` : ''}
        <div class="btn-row">
          <a class="btn btn-primary btn-lg" href="${enquireHref(c.title || p.name)}" data-enquire="${esc(c.title || '')}" data-note="${esc(p.name)}">Enquire Now${ICONS.arrow}</a>
          <a class="btn btn-wa btn-lg" href="${waLink(`Hello, I would like a quotation for ${p.name}.`)}" target="_blank" rel="noopener">${ICONS.wa}WhatsApp</a>
        </div>
        <p class="pd-note">${ICONS.check}Made to your drawing, sample or specification.</p>
      </div>
    </div>
  </div>
</section>
<section class="section pd-details">
  <div class="wrap pd-cols">
    <div class="reveal">
      <p class="eyebrow">Overview</p>
      <h2>About this product</h2>
      ${paras(p.overview || p.description)}
      ${(p.parts || []).length ? `<h3 class="mini-h">Parts / range</h3><ul class="chips">${p.parts.map((it) => `<li>${ICONS.check}${esc(it)}</li>`).join('')}</ul>` : ''}
    </div>
    ${specs.length ? `<div class="reveal"><p class="eyebrow">Specifications</p><h2>Technical details</h2><div class="table-wrap"><table class="spec-table"><tbody>${specs.map((s) => `<tr><th scope="row">${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
  </div>
</section>
${p.readyImage ? `<section class="section ready-sec"><div class="wrap ready reveal">
  <div class="ready-img"><img src="${esc(p.readyImage)}" alt="Finished product using a JURO housing" loading="lazy"></div>
  <div><p class="eyebrow">Finished product</p><h2>Where our housing goes</h2><p>${esc(p.readyCaption || '')}</p>
  <a class="btn btn-primary" href="${enquireHref(c.title || p.name)}" data-enquire="${esc(c.title || '')}" data-note="${esc(p.name)}">Enquire Now${ICONS.arrow}</a></div>
</div></section>` : ''}
${related.length ? `<section class="section products-sec"><div class="wrap">
  ${sectionHead('Related', `More ${c.title || 'products'}`)}
  <div class="pgrid pgrid-fit">${related.map((x, k) => productCard(x, k)).join('')}</div>
</div></section>` : ''}`;
  const url = prodHref(p);
  const ld = [
    { '@type': 'Product', name: p.name, description: p.description, image: gal.map((g) => SITE + g), brand: { '@type': 'Brand', name: S.brandName }, manufacturer: { '@id': SITE + '/#organization' }, category: c.title },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + '/products/' },
      { '@type': 'ListItem', position: 3, name: c.title, item: SITE + catHref(c.slug) },
      { '@type': 'ListItem', position: 4, name: p.name, item: SITE + url }] }];
  return layout({ key: 'products', title: `${p.name} | ${S.brandName} — ${S.companyName}`, description: `${p.description} Manufactured by ${S.companyName}, Ghaziabad.`, urlPath: url, ogImage: p.image, body, ld });
}

/* shared enquiry form — used on Contact page and in the floating Enquire Now panel */
function enquiryForm(p) {
  const options = CATS.map((s) => `<option>${esc(s.title)}</option>`).join('') + `<option>${esc(CONTACT.otherOption)}</option>`;
  const f = (name, label, input) => `<div class="field"><label for="${p}-${name}">${label}</label>${input}<p class="err" data-err="${name}" id="${p}-e-${name}"></p></div>`;
  return `
      <form name="enquiry" method="POST" action="/thank-you/" data-netlify="true" netlify-honeypot="company_website" novalidate class="enq-form">
        <input type="hidden" name="form-name" value="enquiry">
        <input type="hidden" name="page" value="">
        <p class="hp" aria-hidden="true"><label>Leave this empty <input name="company_website" tabindex="-1" autocomplete="off"></label></p>
        <div class="f-row">
          ${f('name', 'Name *', `<input id="${p}-name" name="name" required autocomplete="name" maxlength="80">`)}
          ${f('company', 'Company name *', `<input id="${p}-company" name="company" required autocomplete="organization" maxlength="120">`)}
        </div>
        <div class="f-row">
          ${f('mobile', 'Mobile number *', `<input id="${p}-mobile" name="mobile" type="tel" required inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" maxlength="16">`)}
          ${f('email', 'Email address *', `<input id="${p}-email" name="email" type="email" required autocomplete="email" maxlength="120">`)}
        </div>
        ${f('service', 'Product required *', `<select id="${p}-service" name="service" required><option value="">Select a product</option>${options}</select>`)}
        ${f('message', 'Message *', `<textarea id="${p}-message" name="message" rows="${p === 'q' ? 3 : 5}" required maxlength="2000" placeholder="Component details, material, quantity, drawing reference…"></textarea>`)}
        <label class="check"><input type="checkbox" name="open_whatsapp" class="f-wa" checked> Also open WhatsApp with my enquiry</label>
        <button class="btn btn-primary btn-block btn-lg" type="submit">Submit Enquiry ${ICONS.arrow}</button>
        <div class="form-status" role="status" aria-live="polite" hidden></div>
      </form>`;
}

function enquiryPanel() {
  return `
<dialog class="enq-panel" aria-labelledby="enq-panel-title">
  <div class="enq-panel-in">
    <div class="enq-panel-head">
      <div><p class="eyebrow">${esc(T(S.floatingButton, 'Enquire Now'))}</p><h2 id="enq-panel-title">${esc(CONTACT.formHeading)}</h2></div>
      <button type="button" class="enq-close" aria-label="Close enquiry form">×</button>
    </div>
    <p class="muted">${esc(CONTACT.formText)}</p>
    ${enquiryForm('q')}
    <p class="enq-direct">Prefer to talk? ${(S.contacts || []).map((c) => `<a href="${tel(c.phone)}">${esc(c.phone)}</a>`).join(' · ')}</p>
  </div>
</dialog>`;
}

function categoryCards(exclude) {
  return CATS.filter((c) => c.slug !== exclude).map((c, i) => `
    <a class="ccard reveal" style="--d:${i * 60}ms; --c:${catColor(c.slug)}" href="${catHref(c.slug)}">
      <span class="ccard-ic">${catIcon(c.slug)}</span>
      <span class="ccard-txt"><strong>${esc(c.title)}</strong><small>${esc(c.summary)}</small></span>
      <span class="ccard-go" aria-hidden="true">${ICONS.arrow}</span>
    </a>`).join('');
}

function productsPage() {
  const feats = PROD.features.map((f, i) => `<li class="reveal" style="--d:${i * 80}ms">${ICONS.check}<span>${esc(f)}</span></li>`).join('');
  const body = `
${pageHero({ title: PROD.heading, intro: PROD.intro, image: PROD.bannerImage, crumb: 'Products' })}
<section class="section products-sec">
  <div class="wrap">
    ${sectionHead(T(PROD.gridEyebrow, 'Catalogue'), PROD.gridHeading, PROD.gridText)}
    ${productCatalogue()}
  </div>
</section>
<section class="section cats-sec">
  <div class="wrap">
    ${sectionHead(T(PROD.categoriesEyebrow, 'Categories'), PROD.categoriesHeading, T(PROD.categoriesText, ''))}
    <div class="ccards ccards-5">${categoryCards()}</div>
  </div>
</section>
<section class="section feats-band"><div class="wrap">
  ${sectionHead(T(PROD.featuresEyebrow, ''), PROD.featuresHeading, T(PROD.featuresText, ''), 'center')}
  <ul class="feats">${feats}</ul>
</div></section>`;
  const ld = [{ '@type': 'ItemList', name: 'JURO Products', itemListElement: CATS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.title, url: SITE + catHref(c.slug) })) }];
  return layout({ key: 'products', title: PROD.seoTitle, description: PROD.seoDescription, urlPath: '/products/', ogImage: PROD.bannerImage, body, ld });
}

function categoryPage(s) {
  const gal = (s.gallery || []).filter(Boolean);
  const galHtml = gal.length > 1 ? `<ul class="gallery">${gal.map((g, gi) => `<li><button type="button" data-lb="${esc(g)}" data-cap="${esc(s.title)} — image ${gi + 1}" aria-label="Enlarge ${esc(s.title)} image ${gi + 1}"><img src="${esc(g)}" alt="${esc(s.title)} — example ${gi + 1}" loading="lazy" decoding="async"></button></li>`).join('')}</ul>` : '';
  const prods = (PROD.products || []).filter((p) => p.category === s.slug);
  const inds = (s.industries || []).filter(Boolean);
  const body = `
${pageHero({ title: s.title, intro: s.summary, image: s.bannerImage || PROD.bannerImage, crumb: s.title, parent: { href: '/products/', label: 'Products' } })}
<section class="section">
  <div class="wrap cat-block">
    <div class="cat-media reveal-img">
      <div>${s.image ? `<button type="button" class="cat-main-img" data-lb="${esc(s.image)}" data-cap="${esc(s.title)}" aria-label="Enlarge ${esc(s.title)} image">${visual(s.image, s.title, s.slug, true)}</button>` : visual('', s.title, s.slug, true)}
      ${galHtml}</div>
    </div>
    <div class="cat-txt reveal">
      <p class="cat-tag"><span class="cat-ic">${catIcon(s.slug)}</span>${esc(s.category)}</p>
      <h2>Overview</h2>
      ${paras(s.description)}
      ${(s.items || []).length ? `<h3 class="mini-h">Range includes</h3><ul class="chips">${s.items.map((it) => `<li>${ICONS.check}${esc(it)}</li>`).join('')}</ul>` : ''}
      ${inds.length ? `<h3 class="mini-h">Industries served</h3><ul class="chips chips-plain">${inds.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>` : ''}
      <div class="btn-row">
        <a class="btn btn-primary" href="${enquireHref(s.title)}" data-enquire="${esc(s.title)}">Enquire Now${ICONS.arrow}</a>
        <a class="btn btn-wa-line" href="${waLink(`Hello, I would like a quotation for ${s.title}.`)}" target="_blank" rel="noopener">${ICONS.wa}WhatsApp</a>
      </div>
    </div>
  </div>
</section>
${prods.length ? `<section class="section products-sec"><div class="wrap">
  ${sectionHead('Examples', `${s.title} we make`, 'Typical parts from this category. We also manufacture to your own drawing.')}
  <div class="pgrid pgrid-fit">${prods.map((p, i) => productCard(p, i)).join('')}</div>
</div></section>` : ''}
<section class="section">
  <div class="wrap">
    ${sectionHead('More products', 'Other categories')}
    <div class="ccards ccards-4">${categoryCards(s.slug)}</div>
  </div>
</section>`;
  const url = catHref(s.slug);
  const ld = [{ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + '/products/' },
    { '@type': 'ListItem', position: 3, name: s.title, item: SITE + url }] }];
  return layout({ key: 'products', title: `${s.title} | ${S.brandName} — ${S.companyName}`, description: T(s.seoDescription, s.summary), urlPath: url, ogImage: s.bannerImage, body, ld });
}

const INFRA_ICONS = {
  turning: CAT_ICONS['turned-components'],
  press: CAT_ICONS['press-tools'],
  drill: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 4h20v10H14zM20 14h8v8h-8zM24 22v16M20 30h8M21 38l3 6 3-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  grind: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="18" r="12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 40h36M10 34h28v6H10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  weld: CAT_ICONS['fabrication-job-work'],
  power: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="36" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m26 18-6 10h8l-6 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 14v-4M36 14v-4" stroke="currentColor" stroke-width="2"/></svg>',
};

function infrastructurePage() {
  const I = INFRA;
  const caps = (I.capabilities || []).map((c, i) => `<li class="cap reveal" style="--d:${(i % 3) * 70}ms"><span class="cap-ic">${INFRA_ICONS[c.icon] || ICONS.gear}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></li>`).join('');
  const mach = (I.machines || []).map((m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.qty)}</td></tr>`).join('');
  const facts = (I.facts || []).map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
  const checks = (I.qualityChecks || []).map((c, i) => `<li class="reveal" style="--d:${i * 60}ms">${ICONS.check}<span>${esc(c)}</span></li>`).join('');
  const proc = HOME.process.map((p, i) => `<li class="reveal" style="--d:${i * 90}ms"><span class="step-n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join('');
  const body = `
${pageHero({ title: I.heading, intro: I.intro, image: I.bannerImage, crumb: I.heading })}
<section class="section">
  <div class="wrap">
    ${sectionHead(T(I.capabilitiesEyebrow, ''), I.capabilitiesHeading)}
    <ul class="caps">${caps}</ul>
  </div>
</section>
<section class="section machines-sec" id="machines">
  <div class="wrap about-two">
    <div class="reveal">
      <p class="eyebrow">${esc(T(I.machinesEyebrow, 'Infrastructure'))}</p><h2>${esc(I.machinesHeading)}</h2>
      <p>${esc(T(I.machinesText, ''))}</p>
      <dl class="facts">${facts}</dl>
    </div>
    <div class="table-wrap reveal"><table class="mach-table"><caption class="sr">Machines available at JURO works</caption><thead><tr><th scope="col">Machine</th><th scope="col">Qty</th></tr></thead><tbody>${mach}</tbody></table></div>
  </div>
</section>
<section class="section" id="quality">
  <div class="wrap about-two">
    <div class="reveal">
      <p class="eyebrow">${esc(T(I.qualityEyebrow, 'Quality'))}</p><h2>${esc(I.qualityHeading)}</h2>
      <p>${esc(I.qualityText)}</p>
      <p>${esc(T(I.rawMaterialText, ''))}</p>
      ${I.certificationsNote ? `<p class="cert-note">${esc(I.certificationsNote)}</p>` : ''}
    </div>
    <div class="reveal">
      <h3 class="mini-h">Every lot is checked for</h3>
      <ul class="qchecks">${checks}</ul>
    </div>
  </div>
</section>
<section class="section process">
  <div class="wrap">
    ${sectionHead(T(HOME.processEyebrow, 'How we work'), HOME.processHeading, '', 'center')}
    <ol class="steps">${proc}</ol>
  </div>
</section>`;
  return layout({ key: 'infrastructure', title: I.seoTitle, description: I.seoDescription, urlPath: '/infrastructure/', ogImage: I.bannerImage, body });
}

function aboutPage() {
  const facts = ABOUT.factSheet.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
  const team = ABOUT.team.map((t, i) => `<li class="reveal" style="--d:${i * 50}ms">${esc(t)}</li>`).join('');
  const body = `
${pageHero({ title: ABOUT.heading, intro: ABOUT.intro, image: ABOUT.bannerImage, crumb: 'About Us' })}
<section class="section">
  <div class="wrap intro-grid">
    <div class="intro-txt reveal">
      <p class="eyebrow">${esc(T(ABOUT.storyEyebrow, 'Our story'))}</p>
      <h2>${esc(T(ABOUT.storyHeading, ''))}</h2>
      ${paras(ABOUT.story)}
    </div>
    <div class="intro-media reveal-img">
      <div class="frame"><img src="${esc(ABOUT.storyImage)}" alt="Precision turned components made by Jugnu Roshni Pvt. Ltd." loading="lazy"></div>
    </div>
  </div>
</section>
<section class="section vision-band">
  <div class="wrap vision-grid">
    <blockquote class="vision reveal"><p class="eyebrow">${esc(T(ABOUT.visionEyebrow, 'Our vision'))}</p><p class="vision-q">“${esc(ABOUT.vision)}”</p></blockquote>
    <div class="leader reveal"><span class="leader-mono" aria-hidden="true">${esc(initials(ABOUT.leader.name.replace(/^Mr\.?\s*/, '')))}</span><div><h3>${esc(ABOUT.leader.name)}</h3><p class="leader-role">${esc(ABOUT.leader.role)}</p><p>${esc(ABOUT.leader.text)}</p></div></div>
  </div>
</section>
<section class="section">
  <div class="wrap about-two">
    <div class="reveal">
      <p class="eyebrow">${esc(T(ABOUT.factEyebrow, 'Fact sheet'))}</p><h2>${esc(T(ABOUT.factHeading, 'Company at a glance'))}</h2>
      <dl class="facts">${facts}</dl>
    </div>
    <div class="reveal">
      <p class="eyebrow">${esc(T(ABOUT.teamEyebrow, 'People'))}</p><h2>${esc(ABOUT.teamHeading)}</h2>
      <p>${esc(ABOUT.teamText)}</p>
      <ul class="team">${team}</ul>
    </div>
  </div>
</section>
<section class="section machines-sec">
  <div class="wrap join reveal">
    <div><h2>${esc(T(ABOUT.infraTeaserHeading, 'Our works & machines'))}</h2><p>${esc(T(ABOUT.infraTeaserText, ''))}</p></div>
    <a class="btn btn-primary" href="/infrastructure/">${esc(T(ABOUT.infraTeaserButton, 'View infrastructure'))}${ICONS.arrow}</a>
  </div>
</section>`;
  return layout({ key: 'about', title: ABOUT.seoTitle, description: ABOUT.seoDescription, urlPath: '/about/', ogImage: ABOUT.bannerImage, body });
}

function customersPage() {
  const cards = CUST.customers.map((c, i) => `
    <li class="cust reveal" style="--d:${(i % 4) * 70}ms">
      ${c.logo ? `<span class="cust-logo"><img src="${esc(c.logo)}" alt="${esc(c.name)} logo" loading="lazy"></span>` : `<span class="cust-mono" aria-hidden="true">${esc(initials(c.name))}</span>`}
      <h3>${esc(c.name)}</h3>
      <p class="cust-loc">${ICONS.pin}${esc(c.location)}</p>
      ${c.note ? `<p class="cust-note">${esc(c.note)}</p>` : ''}
    </li>`).join('');
  const inds = HOME.industries.map((x) => `<li>${esc(x)}</li>`).join('');
  const body = `
${pageHero({ title: CUST.heading, intro: CUST.intro, image: CUST.bannerImage, crumb: 'Our Customers' })}
<section class="section">
  <div class="wrap">
    ${sectionHead(T(CUST.listEyebrow, ''), T(CUST.listHeading, 'Companies we supply'), T(CUST.listText, ''))}
    <ul class="cust-grid">${cards}</ul>
    <p class="fine reveal">${esc(CUST.disclaimer)}</p>
  </div>
</section>
${testimonialsBlock()}
<section class="industries tinted">
  <div class="wrap ind-in reveal"><h2>${esc(HOME.industriesHeading)}</h2><ul class="ind-list">${inds}</ul></div>
</section>
<section class="section">
  <div class="wrap join reveal">
    <div><h2>${esc(CUST.ctaHeading)}</h2><p>${esc(CUST.ctaText)}</p></div>
    <a class="btn btn-primary" href="/contact/#enquiry">${esc(T(CUST.ctaButton, 'Enquire Now'))}${ICONS.arrow}</a>
  </div>
</section>`;
  return layout({ key: 'customers', title: CUST.seoTitle, description: CUST.seoDescription, urlPath: '/customers/', ogImage: CUST.bannerImage, body });
}

function testimonialsBlock() {
  const list = (HOME.testimonials || []).filter((t) => t && t.quote && t.name);
  if (!list.length) return '';
  return `
<section class="section testi-sec">
  <div class="wrap">
    ${sectionHead(T(HOME.testimonialsEyebrow, ''), T(HOME.testimonialsHeading, 'Customer feedback'))}
    <ul class="testis">${list.map((t, i) => `<li class="testi reveal" style="--d:${i * 70}ms"><blockquote><p>“${esc(t.quote)}”</p></blockquote><p class="testi-by"><strong>${esc(t.name)}</strong>${t.role || t.company ? `<span>${esc([t.role, t.company].filter(Boolean).join(', '))}</span>` : ''}</p></li>`).join('')}</ul>
  </div>
</section>`;
}

function contactPage() {
  const people = (S.contacts || []).map((c) => `
    <li class="person">
      <span class="person-mono" aria-hidden="true">${esc(initials(c.name.replace(/^Mr\.?\s*/, '')))}</span>
      <div><h3>${esc(c.name)}</h3><p>${esc(c.role || '')}</p>
      <a class="person-tel" href="${tel(c.phone)}">${ICONS.phone}${esc(c.phone)}</a></div>
    </li>`).join('');
  const addrs = (S.addresses || []).map((a) => `
    <div class="addr reveal">
      <div class="addr-txt"><h3>${ICONS.pin}${esc(a.label)}</h3><p>${lines(a.lines)}</p>
      <a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapQuery || a.lines)}" target="_blank" rel="noopener">Open in Google Maps ${ICONS.arrow}</a></div>
      <div class="map"><iframe title="Map — ${esc(a.label)}" src="https://www.google.com/maps?q=${encodeURIComponent(a.mapQuery || a.lines)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
    </div>`).join('');
  const body = `
${pageHero({ title: CONTACT.heading, intro: CONTACT.intro, image: CONTACT.bannerImage, crumb: 'Contact Us' })}
<section class="section contact-sec">
  <div class="wrap contact-grid">
    <div class="form-card reveal" id="enquiry">
      <h2>${esc(CONTACT.formHeading)}</h2>
      <p class="muted">${esc(CONTACT.formText)}</p>
      ${enquiryForm('f')}
    </div>
    <aside class="contact-side reveal">
      <h2>${esc(T(CONTACT.sideHeading, 'Talk to us directly'))}</h2>
      <ul class="people">${people}</ul>
      <a class="btn btn-wa btn-block" href="${waLink()}" target="_blank" rel="noopener">${ICONS.wa}Chat on WhatsApp</a>
      <ul class="c-list">
        <li>${ICONS.mail}<a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>
        ${S.workingHours ? `<li>${ICONS.clock}<span>${esc(S.workingHours)}</span></li>` : ''}
      </ul>
    </aside>
  </div>
</section>
<section class="section addr-sec"><div class="wrap">${sectionHead(T(CONTACT.locationsEyebrow, ''), T(CONTACT.locationsHeading, 'Visit our works & office'))}<div class="addr-grid">${addrs}</div></div></section>`;
  return layout({ key: 'contact', title: CONTACT.seoTitle, description: CONTACT.seoDescription, urlPath: '/contact/', ogImage: CONTACT.bannerImage, body });
}

function simplePage(key, title, h, text, urlPath) {
  const body = `<section class="section simple"><div class="wrap simple-in"><h1>${esc(h)}</h1><p>${esc(text)}</p><div class="btn-row center"><a class="btn btn-primary" href="/">Back to Home</a><a class="btn btn-line" href="/products/">View Products</a></div></div></section>`;
  return layout({ key, title, description: text, urlPath, body, noindex: true });
}

/* ---------- write ---------- */
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function out(rel, html) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'static'), OUT);
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
out('index.html', homePage());
out('products/index.html', productsPage());
out('about/index.html', aboutPage());
out('customers/index.html', customersPage());
out('contact/index.html', contactPage());
out('infrastructure/index.html', infrastructurePage());
CATS.forEach((c) => out(`products/${c.slug}/index.html`, categoryPage(c)));
(PROD.products || []).filter((p) => p.slug && catBySlug[p.category]).forEach((p) => out(`products/${p.category}/${p.slug}/index.html`, productPage(p)));
out('thank-you/index.html', simplePage('thanks', 'Thank you | ' + S.companyName, 'Thank you for your enquiry', CONTACT.successMessage, '/thank-you/'));
out('404.html', simplePage('404', 'Page not found | ' + S.companyName, 'Page not found', 'The page you are looking for does not exist or has moved.', '/404'));

const today = new Date().toISOString().slice(0, 10);
const urls = ['/', '/products/', ...CATS.map((c) => catHref(c.slug)), ...(PROD.products || []).filter((p) => p.slug && catBySlug[p.category]).map(prodHref), '/about/', '/infrastructure/', '/customers/', '/contact/'];
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u, i) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${i ? '0.8' : '1.0'}</priority></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /thank-you/\n\nSitemap: ${SITE}/sitemap.xml\n`);
out('site.webmanifest', JSON.stringify({ name: S.companyName, short_name: S.brandName, icons: [{ src: '/images/brand/icon-192.png', sizes: '192x192', type: 'image/png' }], theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone' }, null, 2));

console.log('Built', urls.length + 2, 'pages into', path.relative(ROOT, OUT) + '/');
