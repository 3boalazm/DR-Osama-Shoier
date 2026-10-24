/* ══════════════════════════════════════════════════════════════
   core.js — the shared shell every page loads first.

   Holds the three things that must behave identically on every
   page — language, theme and the page chrome (header, menu,
   install sheet, toast, footer) — so no page can drift from the
   others and nothing is copy-pasted four times.

   Pages declare themselves with  <body data-page="…">.
   Everything else here is exposed on window.APP for booking.js.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const DEFAULT_LOCALE = 'ar-EG';
  const STORAGE = { locale: 'dr-locale', theme: 'dr-theme', installHidden: 'dr-install-hidden' };

  /* Order here is the order in the menu. */
  const PAGES = [
    { id: 'home', href: 'index.html', key: 'nav.home' },
    { id: 'booking', href: 'booking.html', key: 'nav.book' },
    { id: 'clinic', href: 'clinic.html', key: 'nav.clinic' },
    { id: 'privacy', href: 'privacy.html', key: 'nav.privacy' },
  ];

  const PHONE = '+201229999120';
  const WHATSAPP = '201229999120';

  /* The doctor's own accounts. Every one of these was published by him —
     the structured data and the footer of osamashaeer.com, the channel
     description on YouTube, the TikTok bio — so none of them is a guess.
     An account that exists but is empty was left out rather than sent
     patients to a dead page. */
  const SOCIALS = [
    { id: 'facebook', url: 'https://www.facebook.com/ProfOsamaShaeer' },
    { id: 'instagram', url: 'https://www.instagram.com/osamashaeer/' },
    { id: 'youtube', url: 'https://www.youtube.com/@penile.implant.expert' },
    { id: 'x', url: 'https://x.com/drosamashaeer' },
    { id: 'linkedin', url: 'https://www.linkedin.com/in/prof-dr-osama-shaeer-2aa017108/' },
    { id: 'tiktok', url: 'https://www.tiktok.com/@prof.osamashaeer' },
  ];

  const state = {
    locale: DEFAULT_LOCALE,
    theme: 'light',
    page: document.body.dataset.page || 'home',
    clinic: null,
    services: [],
    servicesLoaded: false,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ───────────────────────────── icons ───────────────────────────── */

  const ICONS = {
    phone:
      '<path d="M6.6 3.5 9 3l1.6 4-2 1.4a12 12 0 0 0 6 6L16 12.4 20 14l-.5 2.4A2 2 0 0 1 17.4 18C10.2 17.6 6.4 13.8 6 6.6a2 2 0 0 1 .6-1.5Z" stroke-linecap="round" stroke-linejoin="round"/>',
    globe:
      '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8M12 3.4c2.2 2.3 3.4 5.3 3.4 8.6s-1.2 6.3-3.4 8.6c-2.2-2.3-3.4-5.3-3.4-8.6S9.8 5.7 12 3.4Z"/>',
    sun:
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" stroke-linecap="round"/>',
    moon: '<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" stroke-linejoin="round"/>',
    install:
      '<path d="M12 3.5v10.5" stroke-linecap="round"/><path d="m7.6 9.8 4.4 4.4 4.4-4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" stroke-linecap="round"/>',
    menu:
      '<path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>',
    close:
      '<path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/>',
    chevron:
      '<path d="m14 5-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/>',
    pin:
      '<path d="M12 21s6.5-5.4 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.6 12 21 12 21Z" stroke-linejoin="round"/><circle cx="12" cy="10.6" r="2.4"/>',
    clock:
      '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.8" stroke-linecap="round"/>',
    shield:
      '<path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6Z" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.5 10" stroke-linecap="round" stroke-linejoin="round"/>',
    whatsapp:
      '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/>',
    calendar:
      '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke-linecap="round"/>',
    share:
      '<path d="M12 15.5V4" stroke-linecap="round"/><path d="m7.8 8 4.2-4.2L16.2 8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 13.5v5a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8v-5" stroke-linecap="round"/>',
    dots:
      '<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>',
  };

  const ic = (name, width) =>
    `<svg${width ? ` style="width:${width}px;height:${width}px"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${
      ICONS[name] || ''
    }</svg>`;

  /* Brand marks are filled glyphs, not strokes, so they cannot go through
     ic() — it would draw them as outlines. Same 24×24 box, same
     currentColor, so they follow the theme like every other icon. */
  const BRAND_ICONS = {
    facebook:
      '<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>',
    instagram:
      '<path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>',
    youtube:
      '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
    x:
      '<path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>',
    tiktok:
      '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>',
    linkedin:
      '<g transform="scale(1.5)"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/></g>',
  };

  const brandIc = name =>
    `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">${
      BRAND_ICONS[name] || ''
    }</svg>`;

  /**
   * The name of each platform, one literal key per platform.
   *
   * Written out like this on purpose: a list of computed keys would hide
   * a missing translation from the audit until a patient saw a raw key on
   * the screen instead of a platform name.
   */
  const SOCIAL_LABEL = {
    facebook: () => t('social.facebook'),
    instagram: () => t('social.instagram'),
    youtube: () => t('social.youtube'),
    x: () => t('social.x'),
    linkedin: () => t('social.linkedin'),
    tiktok: () => t('social.tiktok'),
  };

  /**
   * The doctor's accounts, as a row of links.
   *
   * 'labelled' shows the platform name next to the mark — used where there
   * is room for it. 'icons' shows the mark alone and carries the name in
   * aria-label instead, so the link still has an accessible name.
   */
  function socialLinks(variant = 'labelled') {
    const labelled = variant === 'labelled';

    return SOCIALS.map(
      s => `<a class="social-btn${labelled ? '' : ' is-icon'}" href="${s.url}" target="_blank" rel="noopener"
                  data-i18n-aria="social.${s.id}" aria-label="${SOCIAL_LABEL[s.id]?.() ?? s.id}">${brandIc(s.id)}${
        labelled ? `<span class="social-name" data-i18n="social.${s.id}"></span>` : ''
      }</a>`,
    ).join('');
  }

  /** Fill every social-links placeholder on the page. */
  function renderSocials(root = document) {
    $$('[data-socials]', root).forEach(el => {
      el.innerHTML = socialLinks(el.dataset.socials || 'labelled');
    });
  }

  /* ───────────────────────────── i18n ───────────────────────────── */

  function flatten(obj, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
      else out[key] = v;
    }
    return out;
  }

  const FLAT = {};
  for (const [id, dict] of Object.entries(window.I18N)) FLAT[id] = flatten(dict);

  function t(key, vars) {
    let value = FLAT[state.locale]?.[key] ?? FLAT[DEFAULT_LOCALE]?.[key] ?? key;
    if (vars) {
      value = String(value).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
    }
    return value;
  }

  /** Pick the right variant out of an `{ 'ar-EG': …, en: … }` map. */
  function localized(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[state.locale] ?? value[DEFAULT_LOCALE] ?? Object.values(value)[0] ?? '';
  }

  const localeMeta = () => window.LOCALES.find(l => l.id === state.locale) || window.LOCALES[0];

  /* ─────────────────────────── formatting ─────────────────────────── */

  function fmtDate(iso, opts) {
    if (!iso) return '';
    return new Intl.DateTimeFormat(localeMeta().intl, { timeZone: 'Africa/Cairo', ...opts }).format(
      new Date(`${iso}T12:00:00`),
    );
  }

  function fmtTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = String(m).padStart(2, '0');
    if (state.locale === 'en') return `${h12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
    return `${String(h12).padStart(2, '0')}:${mm} ${h >= 12 ? 'م' : 'ص'}`;
  }

  const money = n => new Intl.NumberFormat(localeMeta().intl).format(n);

  /* ───────────────────────────── toast ───────────────────────────── */

  let toastTimer;
  function toast(msg, tone = 'info') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.dataset.tone = tone;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 4000);
  }

  /* ────────────────────────────── api ─────────────────────────────── */

  async function api(path, body) {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.code ? t(`err.${data.code}`) : t('err.generic'));
      err.code = data.code;
      throw err;
    }
    return data;
  }

  /** Clinic details + service list, fetched once per page. */
  async function loadClinic() {
    if (state.clinic) return state;
    const data = await api('/api/clinic');
    state.clinic = data.clinic;
    state.services = data.services || [];
    state.servicesLoaded = true;
    return state;
  }

  /* ──────────────────────────── chrome ────────────────────────────── */

  const avatar = `
    <span class="brand-avatar">
      <picture>
        <source type="image/webp" srcset="img/avatar-96.webp 1x, img/avatar-192.webp 2x" />
        <img src="img/avatar-96.jpg" srcset="img/avatar-96.jpg 1x, img/avatar-192.jpg 2x"
             width="96" height="96" alt="" decoding="async" />
      </picture>
    </span>`;

  function navLinks(cls) {
    return PAGES.map(
      p => `<a class="${cls}${p.id === state.page ? ' is-active' : ''}" href="${p.href}"
              data-i18n="${p.key}"${p.id === state.page ? ' aria-current="page"' : ''}></a>`,
    ).join('');
  }

  function headerMarkup() {
    // The header CTA is whatever the visitor most likely wants next: on the
    // booking page that is a phone call, everywhere else it is booking.
    const booking = state.page === 'booking';
    const cta = booking
      ? `<a class="nav-cta" id="navCta" href="tel:${PHONE}">${ic('phone')}<span data-i18n="nav.call"></span></a>`
      : `<a class="nav-cta" id="navCta" href="booking.html">${ic('calendar')}<span data-i18n="nav.cta"></span></a>`;

    return `
      <a class="skip-link" href="#main" data-i18n="a11y.skip"></a>
      <header class="site-header">
        <div class="wrap">
          <nav class="nav-pill" aria-label="Site">
            <a class="brand" href="index.html">
              ${avatar}
              <span class="brand-text">
                <strong data-i18n="brand.name"></strong>
                <span data-i18n="brand.role"></span>
              </span>
            </a>

            <div class="nav-links">${navLinks('nav-link')}</div>

            <div class="nav-actions">
              <button type="button" class="icon-btn install-btn" id="installBtn" hidden
                      data-i18n-aria="install.ariaInstall">
                ${ic('install')}
              </button>

              <div class="lang-control">
                <span class="lang-globe">${ic('globe')}</span>
                <select id="langSelect" class="lang-select" data-i18n-aria="a11y.langLabel"></select>
              </div>

              <button type="button" class="icon-btn" id="themeBtn" data-i18n-aria="a11y.themeDark">
                <span class="ico-sun">${ic('sun')}</span>
                <span class="ico-moon">${ic('moon')}</span>
              </button>

              <button type="button" class="icon-btn menu-btn" id="menuBtn"
                      aria-expanded="false" aria-controls="menuSheet" data-i18n-aria="nav.menu">
                ${ic('menu')}
              </button>

              ${cta}
            </div>
          </nav>
        </div>
      </header>`;
  }

  function menuMarkup() {
    return `
      <div class="sheet-backdrop" id="menuSheet" hidden>
        <div class="sheet menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
          <div class="menu-head">
            <span class="menu-title" id="menuTitle" data-i18n="nav.menu"></span>
            <button type="button" class="sheet-close" id="menuClose" data-i18n-aria="nav.close">
              ${ic('close')}
            </button>
          </div>
          <nav class="menu-links">${navLinks('menu-link')}</nav>
          <button type="button" class="menu-install" id="menuInstall" hidden>
            ${ic('install')}<span data-i18n="nav.install"></span>${ic('chevron')}
          </button>
          <div class="menu-foot">
            <a class="menu-contact" href="tel:${PHONE}">${ic('phone')}<span>012 2999 9120</span></a>
            <a class="menu-contact" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">
              ${ic('whatsapp')}<span data-i18n="footer.whatsapp"></span>
            </a>
          </div>
        </div>
      </div>`;
  }

  function installMarkup() {
    return `
      <div class="sheet-backdrop" id="installSheet" hidden>
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="installTitle">
          <button class="sheet-close" id="installClose" aria-label="×">
            ${ic('close')}
          </button>
          <div class="sheet-icon" aria-hidden="true">
            <img src="icons/icon-192.png" alt="" width="64" height="64" />
          </div>
          <h3 id="installTitle" data-i18n="install.title"></h3>
          <p id="installDesc" data-i18n="install.desc"></p>
          <p class="install-alert" id="installAlert" hidden></p>
          <ol class="install-steps" id="installSteps"></ol>
          <button type="button" class="primary-btn sheet-cta" id="installCta" data-i18n="install.cta"></button>
          <button type="button" class="ghost-btn sheet-alt" id="installCopy" data-i18n="install.copy"></button>
        </div>
      </div>`;
  }

  function footerMarkup() {
    return `
      <div class="wrap footer-inner">
        <p data-i18n-html="footer.copy"></p>
        <p class="footer-links">
          <a href="tel:${PHONE}">01229999120</a>
          <span aria-hidden="true">·</span>
          <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener" data-i18n="footer.whatsapp"></a>
          <span aria-hidden="true">·</span>
          <a href="https://osamashaeer.com/" target="_blank" rel="noopener" data-i18n="footer.site"></a>
        </p>
        <div class="footer-social" data-socials="icons"></div>
      </div>`;
  }

  /* ───────────────────────── theme & locale ───────────────────────── */

  function setTheme(theme, { persist = true } = {}) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    $('#themeColor')?.setAttribute('content', theme === 'dark' ? '#080f16' : '#faf7f2');

    const btn = $('#themeBtn');
    if (btn) {
      // The label must name the mode that is *coming*, in the reader's own
      // language — the old one ended in English "dark"/"light" even in Arabic.
      btn.setAttribute('aria-label', t(theme === 'dark' ? 'a11y.themeLight' : 'a11y.themeDark'));
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
    }
    if (persist) {
      try {
        localStorage.setItem(STORAGE.theme, theme);
      } catch {}
    }
  }

  function setLocale(id, { persist = true } = {}) {
    const meta = window.LOCALES.find(l => l.id === id) || window.LOCALES[0];
    state.locale = meta.id;

    document.documentElement.lang = meta.id === 'en' ? 'en' : 'ar';
    document.documentElement.dir = meta.dir;

    if (persist) {
      try {
        localStorage.setItem(STORAGE.locale, meta.id);
      } catch {}
    }

    const select = $('#langSelect');
    if (select) {
      select.value = meta.id;
      select.title = meta.label;
    }

    applyText();
    document.dispatchEvent(new CustomEvent('localechange', { detail: meta.id }));
  }

  /** Fill every translated node in the document, chrome included. */
  function applyText() {
    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    // The footer carries the current year in its copy, so the placeholder
    // has to be filled in here — otherwise the page literally shows "{year}".
    const vars = { year: new Date().getFullYear() };
    $$('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml, vars);
    });
    $$('[data-i18n-alt]').forEach(el => {
      el.setAttribute('alt', t(el.dataset.i18nAlt));
    });
    $$('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });

    if (document.body.dataset.title) document.title = t(document.body.dataset.title);
    $('meta[name="description"]')?.setAttribute('content', t('meta.desc'));

    // Content that comes from clinic data rather than the dictionary.
    if (state.clinic) {
      $$('[data-clinic="address"]').forEach(el => (el.textContent = localized(state.clinic.address)));
    }
  }

  /* ──────────────────────────── wiring ────────────────────────────── */

  function buildLangSelect() {
    const select = $('#langSelect');
    if (!select) return;
    // The full name would not fit in the header pill, so the option text is
    // the short form and the full name rides along as the title.
    select.innerHTML = window.LOCALES.map(
      l => `<option value="${l.id}" title="${l.label}">${l.short || l.label}</option>`,
    ).join('');
    select.value = state.locale;
    select.addEventListener('change', e => setLocale(e.target.value));
  }

  function wireTheme() {
    $('#themeBtn')?.addEventListener('click', () => {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Follow the OS only while the user has not picked a theme explicitly.
    window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', e => {
      let hasPreference = false;
      try {
        hasPreference = !!localStorage.getItem(STORAGE.theme);
      } catch {}
      if (!hasPreference) setTheme(e.matches ? 'dark' : 'light', { persist: false });
    });
  }

  /* ── overlays: one open at a time, Escape and backdrop close ── */

  const overlays = new Set();
  function openSheet(id) {
    const sheet = document.getElementById(id);
    if (!sheet) return;
    sheet.hidden = false;
    overlays.add(id);
    document.body.style.overflow = 'hidden';
    const btn = $('#menuBtn');
    if (btn) btn.setAttribute('aria-expanded', String(id === 'menuSheet'));
    sheet.querySelector('.sheet')?.querySelector('a, button')?.focus();
  }

  function closeSheets() {
    const fromMenu = overlays.has('menuSheet');
    overlays.forEach(id => {
      const sheet = document.getElementById(id);
      if (sheet) sheet.hidden = true;
    });
    overlays.clear();
    document.body.style.overflow = '';
    $('#menuBtn')?.setAttribute('aria-expanded', 'false');
    // Return focus to whatever opened the sheet, so the keyboard user is
    // not dropped back at the top of the document.
    if (fromMenu) $('#menuBtn')?.focus();
  }

  function wireMenu() {
    $('#menuBtn')?.addEventListener('click', () => openSheet('menuSheet'));
    $('#menuClose')?.addEventListener('click', closeSheets);
    $('#menuSheet')?.addEventListener('click', e => {
      if (e.target.id === 'menuSheet') closeSheets();
    });
    // Following a link leaves the sheet open behind the next page's
    // backdrop, so close it on the way out.
    $$('#menuSheet .menu-link').forEach(a => a.addEventListener('click', closeSheets));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSheets();
    });
  }

  /* ── install (PWA) ── */

  function installStepsMarkup() {
    const ios = window.PWA?.isIOS?.();
    const rows = ios
      ? [`${t('install.ios1')} ${ic('share')}`, t('install.ios2'), t('install.ios3')]
      : [`${t('install.android1').replace('(⋮)', '')} ${ic('dots')}`, t('install.android2'), t('install.android3')];
    return rows.map(text => `<li>${text}</li>`).join('');
  }

  /* One sheet, five situations. Which one we are in decides the steps, the
     primary button and whether the in-app warning shows — a "تثبيت" button
     that cannot do anything is worse than no button. */
  function openInstallSheet() {
    const sheet = $('#installSheet');
    if (!sheet) return;

    const pwa = window.PWA || {};
    const standalone = pwa.isStandalone?.() === true;
    const canPrompt = pwa.canInstall?.() === true;
    const inApp = pwa.isInAppBrowser?.() === true;
    const intent = pwa.chromeIntent?.(location.href) || null;

    $('#installTitle').textContent = standalone ? t('install.done') : t('install.title');
    $('#installDesc').textContent = t('install.desc');
    $('#installDesc').hidden = standalone;

    const alert = $('#installAlert');
    alert.hidden = !inApp;
    alert.textContent = inApp ? t('install.inAppDesc') : '';

    $('#installSteps').innerHTML = standalone || inApp ? '' : installStepsMarkup();
    $('#installSteps').hidden = standalone || inApp;

    const cta = $('#installCta');
    let mode = 'close';
    if (!standalone) {
      if (canPrompt) {
        cta.textContent = t('install.cta');
        mode = 'native';
      } else if (intent) {
        cta.textContent = t('install.openChrome');
        mode = 'chrome';
      } else {
        cta.textContent = t('install.ctaManual');
      }
    } else {
      cta.textContent = t('install.ctaManual');
    }
    cta.dataset.mode = mode;

    $('#installCopy').hidden = standalone;

    openSheet('installSheet');
  }

  function wireInstall() {
    const btn = $('#installBtn');
    if (!btn) return;

    /* Show the button only when there is something it can do.
       `hidden = installed` alone left it on screen in desktop Firefox and
       Safari, where neither the native prompt nor the iOS instructions
       apply — tapping it led to a dead end. */
    const syncVisible = () => {
      const pwa = window.PWA;
      if (!pwa) {
        btn.hidden = true;
        return;
      }
      const actionable = pwa.canInstall() || pwa.isIOS() || pwa.isInAppBrowser?.() === true;
      const installed = pwa.isStandalone();
      btn.hidden = installed || !actionable;
      // The menu keeps a labelled entry even when the icon is hidden, so
      // "how do I get this on my phone?" always has an answer.
      const row = $('#menuInstall');
      if (row) row.hidden = installed;
    };
    syncVisible();
    window.PWA?.onChange?.(syncVisible);

    btn.addEventListener('click', () => {
      if (window.PWA?.isStandalone()) return toast(t('install.done'));
      openInstallSheet();
    });

    $('#menuInstall')?.addEventListener('click', () => {
      closeSheets();
      openInstallSheet();
    });

    $('#installCopy')?.addEventListener('click', async () => {
      const url = `${location.origin}/`;
      try {
        await navigator.clipboard.writeText(url);
        toast(t('install.copied'));
      } catch {
        // Clipboard API needs a secure context and a user gesture; when both
        // are missing, pointing at the address bar beats failing silently.
        toast(url);
      }
    });

    $('#installClose')?.addEventListener('click', closeSheets);
    $('#installSheet')?.addEventListener('click', e => {
      if (e.target.id === 'installSheet') closeSheets();
    });

    $('#installCta')?.addEventListener('click', async e => {
      const cta = e.currentTarget;
      if (cta.dataset.mode === 'chrome') {
        const intent = window.PWA.chromeIntent?.(location.href);
        if (intent) location.href = intent;
        return;
      }
      if (cta.dataset.mode !== 'native') return closeSheets();

      const outcome = await window.PWA.prompt();
      if (outcome === 'accepted') {
        closeSheets();
        toast(t('install.done'));
      } else {
        // Prompt dismissed — fall back to written instructions.
        openInstallSheet();
      }
    });

    window.addEventListener('appinstalled', () => {
      closeSheets();
      toast(t('install.done'));
      const card = $('#installCard');
      if (card) card.hidden = true;
    });
  }

  /* The home-page card is the only place a visitor who never opens the menu
     learns the app can live on their phone. It appears once, and stays gone
     after a dismissal — a prompt that keeps coming back is an advert. */
  function wireInstallCard() {
    const card = $('#installCard');
    if (!card) return;

    let hidden = true;
    try {
      hidden = localStorage.getItem(STORAGE.installHidden) === '1';
    } catch {}

    const sync = () => {
      // Already installed? The card has nothing left to offer.
      card.hidden = hidden || window.PWA?.isStandalone?.() === true;
    };
    sync();

    $('#installCardBtn')?.addEventListener('click', openInstallSheet);
    $('#installCardClose')?.addEventListener('click', () => {
      hidden = true;
      try {
        localStorage.setItem(STORAGE.installHidden, '1');
      } catch {}
      sync();
    });
  }

  /* ───────────────────────────── boot ─────────────────────────────── */

  let booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    try {
      state.theme = document.documentElement.dataset.theme || 'light';
      const saved = localStorage.getItem(STORAGE.locale);
      state.locale = window.LOCALES.some(l => l.id === saved) ? saved : DEFAULT_LOCALE;
    } catch {
      state.theme = 'light';
    }

    buildLangSelect();
    wireTheme();
    wireMenu();
    wireInstall();
    wireInstallCard();
    setLocale(state.locale, { persist: false });

    // Give every page the clinic card, then let it render.
    loadClinic()
      .then(() => {
        applyText();
        document.dispatchEvent(new CustomEvent('clinicready', { detail: state }));
      })
      .catch(err => {
        console.error(err);
        toast(t('err.load'), 'error');
      });
  }

  /* Chrome is injected while <body> is still parsing, so the header is in
     place before the first paint — no layout shift, no flash of an empty
     nav. Text is applied immediately for the same reason. */
  document.body.insertAdjacentHTML('afterbegin', headerMarkup() + menuMarkup() + installMarkup());
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>',
  );

  try {
    const savedTheme = localStorage.getItem(STORAGE.theme);
    if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;
    const savedLocale = localStorage.getItem(STORAGE.locale);
    if (window.LOCALES.some(l => l.id === savedLocale)) state.locale = savedLocale;
  } catch {}

  // Text for the chrome only; page content is not parsed yet.
  applyText();

  document.addEventListener('DOMContentLoaded', () => {
    const footer = $('footer.site-footer');
    if (footer) footer.innerHTML = footerMarkup();
    renderSocials();
    boot();
    applyText();
  });

  window.APP = {
    state,
    t,
    localized,
    applyText,
    api,
    loadClinic,
    setLocale,
    setTheme,
    toast,
    fmtDate,
    fmtTime,
    money,
    ic,
    $,
    $$,
    PHONE,
    WHATSAPP,
  };
})();
