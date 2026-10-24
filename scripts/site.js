(() => {
  const GA4_MEASUREMENT_ID = 'G-TVT4EJPXTV';
  const CONSENT_KEY = 'ironveil-analytics-consent';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.reveal');
    if (targets.length) {
      document.documentElement.classList.add('motion-ready');
      const observer = new IntersectionObserver((entries, currentObserver) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in-view');
          currentObserver.unobserve(entry.target);
        }
      }, { threshold: 0.14, rootMargin: '0px 0px -32px 0px' });
      for (const target of targets) observer.observe(target);
    }
  }

  const pageType = location.pathname.endsWith('/privacy/') ? 'privacy' : location.pathname.endsWith('/support/') ? 'support' : '';
  let analyticsConsent = false;
  let analyticsReady = false;

  function pageLocation() {
    const url = new URL(location.href);
    const campaign = new URLSearchParams();
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      if (url.searchParams.has(key)) campaign.set(key, url.searchParams.get(key));
    }
    return `${url.origin}${url.pathname}${campaign.size ? `?${campaign}` : ''}`;
  }

  function pageReferrer() {
    if (!document.referrer) return '';
    const url = new URL(document.referrer);
    return `${url.origin}${url.pathname}`;
  }

  function sendEvent(name, params = {}) {
    if (!analyticsReady || !analyticsConsent) return;
    window.gtag('event', name, params);
  }

  function updateConsent(analyticsStorage) {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsStorage, ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
  }

  function loadAnalytics() {
    if (!GA4_MEASUREMENT_ID || !analyticsConsent) return;
    if (analyticsReady) {
      updateConsent('granted');
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
    updateConsent('granted');
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.append(script);
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: false,
      page_location: pageLocation(),
      page_referrer: pageReferrer(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    analyticsReady = true;
    sendEvent('page_view', { page_location: pageLocation(), page_referrer: pageReferrer(), page_title: document.title });
  }

  function choice() {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }

  function remember(value) {
    analyticsConsent = value === 'accepted';
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* Consent remains for this page only. */ }
    if (analyticsConsent) loadAnalytics();
    else if (analyticsReady) updateConsent('denied');
    banner.hidden = true;
  }

  const style = document.createElement('style');
  style.textContent = '.analytics-consent{position:fixed;z-index:20;inset:auto 16px 16px auto;width:min(440px,calc(100vw - 32px));padding:18px;background:#171a29;color:#e7e8e4;border:1px solid #eac26c;box-shadow:0 8px 32px #0009;font:15px/1.5 system-ui,sans-serif}.analytics-consent[hidden]{display:none}.analytics-consent p{margin:0 0 12px}.analytics-consent a{color:#eac26c}.analytics-consent button{min-height:40px;margin:4px 8px 0 0;padding:8px 13px;border:1px solid #eac26c;border-radius:20px;background:#eac26c;color:#201c25;font:700 14px system-ui,sans-serif;cursor:pointer}.analytics-consent button.secondary{background:transparent;color:#e7e8e4}.analytics-settings{border:0;background:none;color:inherit;text-decoration:underline;font:inherit;cursor:pointer}.analytics-settings:focus-visible,.analytics-consent button:focus-visible{outline:3px solid #eac26c;outline-offset:3px}';
  document.head.append(style);
  const banner = document.createElement('section');
  banner.className = 'analytics-consent';
  banner.setAttribute('aria-label', 'Analytics preferences');
  banner.setAttribute('aria-describedby', 'analytics-consent-description');
  banner.hidden = true;
  const privacyUrl = new URL('../privacy/', document.currentScript.src);
  banner.innerHTML = '<p id="analytics-consent-description">Allow optional Google Analytics to measure visits and store links? Analytics stays off unless you accept. <a href="' + privacyUrl.href + '">Privacy details</a>.</p><button type="button" data-consent="accepted">Accept analytics</button><button type="button" class="secondary" data-consent="rejected">Reject</button>';
  document.body.append(banner);
  banner.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent]');
    if (button) remember(button.dataset.consent);
  });
  for (const nav of document.querySelectorAll('.site-footer nav')) {
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'analytics-settings';
    settings.textContent = 'Analytics settings';
    settings.addEventListener('click', () => {
      banner.hidden = false;
      banner.querySelector('[data-consent="accepted"]').focus();
    });
    nav.append(settings);
  }

  if (GA4_MEASUREMENT_ID) {
    if (choice() === 'accepted') {
      analyticsConsent = true;
      loadAnalytics();
    } else if (choice() !== 'rejected') {
      banner.hidden = false;
    }
  }

  if (GA4_MEASUREMENT_ID) {
    document.addEventListener('click', (event) => {
      if (pageType) return;
      const link = event.target.closest('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      const host = url.hostname.toLowerCase();
      let store;
      if (host === 'apps.apple.com' || host === 'itunes.apple.com') store = 'app_store';
      else if (host === 'play.google.com') store = 'google_play';
      if (store) sendEvent('store_click', { link_url: `${url.origin}${url.pathname}`, link_domain: host, link_type: store });
    });
  }
})();
