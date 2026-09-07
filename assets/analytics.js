/* Cloudflare Web Analytics – cookielos, ohne Wiedererkennung, ohne Speicherung
   am Geraet. Braucht deshalb keine Einwilligung und laeuft vor dem Banner, damit
   die Reichweite vollstaendig gezaehlt wird. Google Analytics weiter unten bleibt
   an die Zustimmung gekoppelt. */
(function () {
  var s = document.createElement("script");
  s.type = "module";
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", '{"token": "2c5a9c2490964ff895aa83b4d5935f60"}');
  (document.head || document.documentElement).appendChild(s);
})();

/* Google Analytics 4 für blitzkneisser.com
   Lädt Google erst, wenn im Cookie-Banner die Kategorie "Statistik" zugestimmt wurde.
   Der Zustimmungsstand liegt unter bk-privacy-consent-v1 (siehe footer-settings.js). */
(function () {
  "use strict";

  var GA_ID = "G-ZSN0F9G3H3";
  var CONSENT_KEY = "bk-privacy-consent-v1";
  var loaded = false;

  function analyticsErlaubt() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.preferences && parsed.preferences.analytics);
    } catch (e) {
      return false;
    }
  }

  function laden() {
    if (loaded || !analyticsErlaubt()) return;
    loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);

    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  }

  // Ereignis für abgeschickte Anfragen – von der Danke-Seite aufgerufen.
  window.bkTrack = function (name, params) {
    if (!loaded || typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  };

  window.addEventListener("bk:consent-updated", laden);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", laden);
  } else {
    laden();
  }
})();
