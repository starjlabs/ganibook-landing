/* GaniBook landing — cookie notice (EU/UK visitors only).
 *
 * What it does:
 * - Reads the visitor's country from the `gb-country` cookie, set by the
 *   Cloudflare Pages Function (functions/_middleware.js) from Cloudflare's
 *   edge data. The cookie holds only a 2-letter country code — no personal data.
 * - EU/UK visitors see a small bottom notice: "We use cookies to see how our
 *   website is used." with [OK] and [No thanks]. Google Analytics (GA4) and
 *   Microsoft Clarity load ONLY after OK. No thanks = neither ever loads.
 * - USA, India and all other countries see no notice; analytics loads exactly
 *   as it did before (same tags, same IDs, same order).
 * - The visitor's choice is stored device-local only
 *   (localStorage['gb-cookie-consent'] = 'accepted' | 'declined') and is
 *   honoured on later visits. Nothing is sent to Google, Microsoft or Supabase.
 * - If the country is unknown (no cookie), the notice is shown — the
 *   privacy-safe default.
 *
 * QA hook: adding ?gb-test-country=DE (or any 2-letter code) to the page URL
 * overrides the country for that browser only, so the EU/UK path can be
 * tested from anywhere. It changes nothing for other visitors.
 *
 * The tags injected here are byte-for-byte the ones that were hardcoded in
 * <head> before (Clarity first, then the GA4 gtm.js loader + dataLayer stub),
 * so analytics behaviour for non-EU/UK visitors is unchanged.
 */
(function () {
  'use strict';

  var GA_ID = 'G-QWX0BM4P8J';
  var CLARITY_ID = 'zchx7rn12n';
  var CONSENT_KEY = 'gb-cookie-consent';

  /* EU 27 + UK — the only regions that see the notice. */
  var EU_UK = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'
  ];

  var tagsLoaded = false;

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function getCountry() {
    /* QA override first (?gb-test-country=DE) — this browser only. */
    var params = new URLSearchParams(window.location.search);
    var test = params.get('gb-test-country');
    if (test) return test.toUpperCase().slice(0, 2);
    return getCookie('gb-country').toUpperCase();
  }

  function getStoredChoice() {
    try { return window.localStorage.getItem(CONSENT_KEY) || ''; }
    catch (e) { return ''; }
  }

  function storeChoice(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); }
    catch (e) { /* storage unavailable — choice lasts for this visit only */ }
  }

  /* Inject the analytics tags, exactly as they were hardcoded before. */
  function loadTags() {
    if (tagsLoaded) return;
    tagsLoaded = true;

    /* Microsoft Clarity (was first in <head>). */
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);

    /* Google Analytics (GA4) — gtm.js loader + dataLayer stub. */
    var gtm = document.createElement('script');
    gtm.async = true;
    gtm.src = 'https://www.googletagmanager.com/gtm.js?id=' + GA_ID;
    document.head.appendChild(gtm);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
  }

  function showNotice() {
    var bar = document.createElement('div');
    bar.className = 'gb-cookie-notice';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<div class="gb-cookie-notice-in">' +
        '<p>We use cookies to see how our website is used. ' +
        '<a href="/privacy.html">Learn more</a></p>' +
        '<button type="button" class="gb-cookie-btn gb-cookie-ok">OK</button>' +
        '<button type="button" class="gb-cookie-btn gb-cookie-no">No thanks</button>' +
      '</div>';

    var okBtn = bar.querySelector('.gb-cookie-ok');
    var noBtn = bar.querySelector('.gb-cookie-no');

    okBtn.addEventListener('click', function () {
      storeChoice('accepted');
      loadTags();
      bar.remove();
    });
    noBtn.addEventListener('click', function () {
      storeChoice('declined');
      bar.remove();
    });

    document.body.appendChild(bar);
  }

  function run() {
    var country = getCountry();
    var needsNotice = !country || EU_UK.indexOf(country) !== -1;
    if (!needsNotice) {
      /* USA, India and everywhere else: analytics as before, no notice. */
      loadTags();
      return;
    }
    var choice = getStoredChoice();
    if (choice === 'accepted') { loadTags(); return; }
    if (choice === 'declined') { return; }
    /* First EU/UK visit (or unknown country): show the notice, load nothing. */
    showNotice();
  }

  /* This script runs in <head>; the notice needs <body>, so wait for it. */
  if (document.body) { run(); }
  else { document.addEventListener('DOMContentLoaded', run); }
})();
