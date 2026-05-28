(() => {
  const INSTAGRAM_FEED_STYLE_ID = "footer-instagram-feed-style";
  const NAV_READY_CLASS = "site-nav-ready";
  const DEFAULT_INSTAGRAM_FALLBACK_IMAGES = [
    "/assets/uploads/Blitzkneisser-Mountain-Elopement-Seceda-180.jpg",
    "/assets/uploads/Blitzkneisser-Elopement-Dolomites-120.jpg",
    "/assets/uploads/Blitzkneisser-Elopement-Lago-di-Braies-Dolomites-11.jpg"
  ];

  const ensureNavigationReadyStyles = () => {
    const styleId = "site-nav-ready-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      html:not(.${NAV_READY_CLASS}) #navMenuPanel > div:first-child,
      html:not(.${NAV_READY_CLASS}) #navMenuPanel .nav-lang-toggle {
        opacity: 0 !important;
      }

      html.${NAV_READY_CLASS} #navMenuPanel > div:first-child,
      html.${NAV_READY_CLASS} #navMenuPanel .nav-lang-toggle {
        opacity: 1 !important;
        transition: opacity 0.15s ease;
      }
    `;
    document.head.appendChild(style);
  };

  ensureNavigationReadyStyles();

  const ensureInstagramFeedStyles = () => {
    if (document.getElementById(INSTAGRAM_FEED_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = INSTAGRAM_FEED_STYLE_ID;
    style.textContent = `
      #footerInstagramFeed.footer-instagram-feed {
        width: 100%;
        border-top: 1px solid rgba(27, 26, 24, 0.1);
        padding-top: 1.5rem;
      }
      #footerInstagramFeed .footer-instagram-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }
      #footerInstagramFeed .footer-instagram-title {
        font-size: 0.65rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #8a837a;
        text-decoration: none;
      }
      #footerInstagramFeed .footer-instagram-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
        width: 100%;
        max-width: 12rem;
        margin: 0 auto;
      }
      #footerInstagramFeed .footer-instagram-card {
        display: block;
        overflow: hidden;
        background: #f5f1eb;
        aspect-ratio: 1 / 1;
      }
      #footerInstagramFeed .footer-instagram-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      @media (min-width: 768px) {
        #footerInstagramFeed.footer-instagram-feed {
          width: auto;
          max-width: 13rem;
          border-top: 0;
          padding-top: 0;
          margin-top: -0.25rem;
        }
        #footerInstagramFeed .footer-instagram-inner {
          align-items: flex-end;
        }
        #footerInstagramFeed .footer-instagram-grid {
          max-width: 13rem;
          margin-left: auto;
          margin-right: 0;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const ensureMobileBackToTop = () => {
    if (document.getElementById("mobileBackToTop")) return;

    const styleId = "mobile-back-to-top-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .mobile-back-to-top {
          position: fixed;
          left: 1rem;
          bottom: 1rem;
          z-index: 58;
          width: 2.75rem;
          height: 2.75rem;
          border: 1px solid #1B1A18;
          background: rgba(255, 255, 255, 0.92);
          color: #1B1A18;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          line-height: 1;
          opacity: 0;
          pointer-events: none;
          transform: translateY(8px);
          transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
          backdrop-filter: blur(8px);
        }
        .mobile-back-to-top:hover {
          background: #1B1A18;
          color: #FFFFFF;
        }
        .mobile-back-to-top.is-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        @media (min-width: 768px) {
          .mobile-back-to-top {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "mobileBackToTop";
    button.className = "mobile-back-to-top";
    button.setAttribute("aria-label", "Zurück nach oben");
    button.title = "Zurück nach oben";
    button.textContent = "↑";

    const updateVisibility = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      button.classList.toggle("is-visible", isMobile && window.scrollY > 260);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    window.addEventListener("orientationchange", updateVisibility);

    document.body.appendChild(button);
    updateVisibility();
  };

  const ensureMobileLangToggleStyles = () => {
    const styleId = "mobile-lang-toggle-global-style";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: 767px) {
        .floating-lang-toggle {
          display: none !important;
        }

        .nav-menu-panel .nav-lang-toggle {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.35rem !important;
          width: 100% !important;
          margin-top: 0.35rem !important;
          padding-top: 0.4rem !important;
          border-top: 1px solid rgba(27, 26, 24, 0.08) !important;
        }

        .nav-menu-panel .nav-lang-toggle button {
          min-width: 2.6rem !important;
          padding: 0.6rem 0.7rem !important;
          font-size: 0.6rem !important;
          line-height: 1 !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const texts = {
    de: {
      contact: "Kontakt",
      journal: "Journal",
      film: "Film",
      home: "Startseite",
      about: "Über mich",
      dsgvo: "DSGVO",
      impressum: "Impressum",
      agb: "AGB",
      instagram: "Instagram",
      instagramFeedTitle: "Neu auf Instagram"
    },
    en: {
      contact: "Contact",
      journal: "Journal",
      film: "Film",
      home: "Home",
      about: "About",
      dsgvo: "Privacy",
      impressum: "Legal Notice",
      agb: "Terms",
      instagram: "Instagram",
      instagramFeedTitle: "Latest on Instagram"
    }
  };

  const defaultMenuItems = [
    { id: "home", labelDe: "Home", labelEn: "Home", visible: true, order: 1 },
    { id: "experience", labelDe: "Experience", labelEn: "Experience", visible: true, order: 2 },
    { id: "guides", labelDe: "Guides", labelEn: "Guides", visible: true, order: 3 },
    { id: "journal", labelDe: "Journal", labelEn: "Journal", visible: true, order: 4 },
    { id: "about", labelDe: "About", labelEn: "About", visible: true, order: 5 },
    { id: "contact", labelDe: "Kontakt", labelEn: "Contact", visible: true, order: 6 },
    { id: "film", labelDe: "Film", labelEn: "Film", visible: false, order: 7 },
    { id: "portfolio", labelDe: "Portfolio", labelEn: "Portfolio", visible: false, order: 8 },
    { id: "academy", labelDe: "Academy", labelEn: "Academy", visible: false, order: 9 }
  ];

  const menuDomMap = {
    home: "navHomeMenuLink",
    experience: "navExperienceLink",
    guides: "navGuidesLink",
    about: "navAboutLink",
    film: "navFilmLink",
    portfolio: "navPortfolioLink",
    journal: "navJournalLink",
    contact: "navContactLink",
    academy: "navAcademyLink"
  };

  const menuHrefMap = {
    home: (lang) => lang === "en" ? "/index.html?lang=en" : "/index.html",
    experience: (lang) => lang === "en" ? "/experience/?lang=en" : "/experience/",
    guides: (lang) => lang === "en" ? "/guides/?lang=en" : "/guides/",
    about: (lang) => lang === "en" ? "/about/?lang=en" : "/about/",
    film: (lang) => lang === "en" ? "/film/?lang=en" : "/film/",
    portfolio: (lang) => lang === "en" ? "/portfolio/?lang=en" : "/portfolio/",
    journal: (lang) => lang === "en" ? "/journal/?lang=en" : "/journal/",
    contact: (lang) => lang === "en" ? "/contact/?lang=en" : "/contact/",
    academy: (lang) => lang === "en" ? "/academy/?lang=en" : "/academy/"
  };

  const normalizeMenuItems = (items = []) => {
    const source = Array.isArray(items) && items.length ? items : defaultMenuItems;
    const knownIds = new Set(defaultMenuItems.map((item) => item.id));
    return source
      .filter((item) => item && knownIds.has(item.id))
      .map((item, index) => {
        const fallback = defaultMenuItems.find((entry) => entry.id === item.id) || defaultMenuItems[index];
        return {
          id: item.id,
          labelDe: String(item.labelDe || fallback.labelDe || "").trim(),
          labelEn: String(item.labelEn || fallback.labelEn || "").trim(),
          visible: item.visible !== false,
          order: Number(item.order || fallback.order || index + 1)
        };
      })
      .sort((a, b) => a.order - b.order);
  };

  const getLang = (fallback = "de") => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "en") return "en";
    const stored = localStorage.getItem("site-lang");
    if (stored === "en" || stored === "de") return stored;
    return fallback;
  };

  const isManagedInternalPagePath = (pathname = "") => {
    const normalized = String(pathname || "").replace(/index\.html$/, "");
    if (normalized === "/" || normalized === "") return true;
    return [
      "/experience/",
      "/guides/",
      "/about/",
      "/journal/",
      "/contact/",
      "/academy/",
      "/portfolio/",
      "/film/",
      "/preisliste/",
      "/impressum/",
      "/dsgvo/",
      "/agb/"
    ].some((prefix) => normalized.startsWith(prefix));
  };

  const buildLangAwareHref = (rawHref, lang) => {
    if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) {
      return rawHref;
    }

    try {
      const parsed = new URL(rawHref, window.location.origin);
      if (parsed.origin !== window.location.origin) return rawHref;
      if (!isManagedInternalPagePath(parsed.pathname)) return rawHref;

      if (lang === "en") {
        parsed.searchParams.set("lang", "en");
      } else {
        parsed.searchParams.delete("lang");
      }

      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return rawHref;
    }
  };

  const syncInternalLanguageLinks = (lang) => {
    document.querySelectorAll("a[href]").forEach((link) => {
      const originalHref = link.dataset.baseHref || link.getAttribute("href");
      if (!originalHref) return;
      if (!link.dataset.baseHref) {
        link.dataset.baseHref = originalHref;
      }
      const nextHref = buildLangAwareHref(link.dataset.baseHref, lang);
      if (nextHref) {
        link.setAttribute("href", nextHref);
      }
    });
  };

  const getInstagramUsername = (value = "") => {
    const input = String(value || "").trim();
    if (!input) return "";
    if (!input.includes("http")) return input.replace(/^@/, "");
    try {
      const parsed = new URL(input);
      const segments = parsed.pathname.split("/").filter(Boolean);
      return (segments[0] || "").replace(/^@/, "");
    } catch {
      return input.replace(/^@/, "");
    }
  };

  let isApplyingNavigation = false;

  const applyNavigation = (settings, lang) => {
    const menuItems = normalizeMenuItems(settings?.menuItems);
    const navGroup = document.querySelector("#navMenuPanel > div:first-child");
    if (!navGroup) return;
    isApplyingNavigation = true;
    const managedIds = Object.values(menuDomMap);
    const existingLinks = new Map();

    managedIds.forEach((nodeId) => {
      const matches = Array.from(navGroup.querySelectorAll(`#${nodeId}`));
      if (matches.length) {
        existingLinks.set(nodeId, matches[0]);
        matches.slice(1).forEach((node) => node.remove());
      }
    });

    const currentPath = window.location.pathname.replace(/index\.html$/, "");
    menuItems.forEach((item) => {
      const nodeId = menuDomMap[item.id];
      const hrefBuilder = menuHrefMap[item.id];
      if (!nodeId || !hrefBuilder) return;

      let link = existingLinks.get(nodeId) || document.getElementById(nodeId);
      if (!link) {
        link = document.createElement("a");
        link.id = nodeId;
        link.className = "hover:opacity-60 transition-opacity duration-300";
      }

      link.href = hrefBuilder(lang);
      link.textContent = lang === "en" ? item.labelEn : item.labelDe;
      link.style.display = item.visible ? "" : "none";

      const targetPath = link.pathname.replace(/index\.html$/, "");
      const isCurrent = item.id !== "home"
        ? currentPath === targetPath
        : (currentPath === "/" || currentPath === "");
      link.className = `${isCurrent ? "opacity-60" : "hover:opacity-60"} transition-opacity duration-300`;
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }

      navGroup.appendChild(link);
    });
    window.setTimeout(() => {
      isApplyingNavigation = false;
      document.documentElement.classList.add(NAV_READY_CLASS);
    }, 0);
  };

  const CONSENT_KEY = "bk-privacy-consent-v1";
  const CONSENT_STYLE_ID = "privacy-consent-style";
  const CONSENT_MODAL_ID = "privacyConsentModal";

  const consentTexts = {
    de: {
      title: "Zustimmung verwalten",
      copy: "Um dir ein optimales Erlebnis zu bieten, verwenden wir Technologien wie Cookies, um Geräteinformationen zu speichern und/oder darauf zuzugreifen. Wenn du diesen Technologien zustimmst, können wir Daten wie das Surfverhalten oder eindeutige IDs auf dieser Website verarbeiten. Wenn du deine Zustimmung nicht erteilst oder zurückziehst, können bestimmte Merkmale und Funktionen beeinträchtigt werden.",
      policy: "Datenschutzerklärung ansehen",
      policyShort: "Datenschutz-Erklärung",
      impressum: "Impressum",
      agb: "AGBs",
      necessary: "Notwendige Daten (immer aktiv)",
      analytics: "Statistik",
      marketing: "Marketing",
      accept: "Zustimmen",
      reject: "Ablehnen",
      save: "Einstellungen speichern"
    },
    en: {
      title: "Manage consent",
      copy: "To provide you with an optimal experience, we use technologies such as cookies to store and/or access device information. If you consent, we may process data such as browsing behavior or unique IDs on this website. If you do not give or withdraw consent, certain features and functions may be affected.",
      policy: "View privacy policy",
      policyShort: "Privacy Policy",
      impressum: "Legal Notice",
      agb: "Terms",
      necessary: "Necessary data (always active)",
      analytics: "Analytics",
      marketing: "Marketing",
      accept: "Consent",
      reject: "Reject",
      save: "Save settings"
    }
  };

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (status, preferences) => {
    const payload = {
      status,
      preferences: {
        necessary: true,
        analytics: Boolean(preferences?.analytics),
        marketing: Boolean(preferences?.marketing)
      },
      timestamp: new Date().toISOString(),
      policyVersion: "2026-04"
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  };

  const ensureConsentStyles = () => {
    if (document.getElementById(CONSENT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CONSENT_STYLE_ID;
    style.textContent = `
      .privacy-consent-overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(27, 26, 24, 0.11);
        display: grid;
        place-items: end center;
        padding: 1rem;
        opacity: 0;
        transition: opacity 0.42s ease;
      }
      .privacy-consent-overlay.is-visible {
        opacity: 1;
      }
      .privacy-consent-modal {
        width: min(40rem, 100%);
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid #e6ded4;
        box-shadow: 0 10px 24px rgba(27, 26, 24, 0.1);
        padding: 0.95rem 0.95rem 0.9rem;
        transform: translateY(10px);
        opacity: 0.98;
        transition: transform 0.42s ease, opacity 0.42s ease;
        text-align: center;
        backdrop-filter: blur(8px);
        position: relative;
      }
      .privacy-consent-overlay.is-visible .privacy-consent-modal {
        transform: translateY(0);
        opacity: 1;
      }
      .privacy-consent-modal h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }
      .privacy-consent-lang {
        display: inline-flex;
        gap: 0.4rem;
        margin: 0;
        position: absolute;
        top: 0.62rem;
        right: 0.62rem;
      }
      .privacy-consent-lang button {
        border: 1px solid #e6ded4;
        background: #fff;
        color: #1b1a18;
        padding: 0.3rem 0.5rem;
        font-size: 0.6rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .privacy-consent-lang button[aria-pressed="true"] {
        border-color: #1b1a18;
        background: #1b1a18;
        color: #fff;
      }
      .privacy-consent-modal p {
        margin: 0 auto 0.65rem;
        max-width: 42rem;
        font-size: 0.75rem;
        line-height: 1.4;
        color: #4d473f;
      }
      .privacy-consent-link {
        display: inline-block;
        margin-bottom: 0.7rem;
        font-size: 0.58rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #1b1a18;
      }
      .privacy-consent-options {
        display: inline-grid;
        gap: 0.35rem;
        margin: 0 auto 0.65rem;
        text-align: left;
      }
      .privacy-consent-option {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.68rem;
      }
      .privacy-consent-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        justify-content: center;
      }
      .privacy-consent-actions button {
        border: 1px solid #1b1a18;
        background: #fff;
        color: #1b1a18;
        padding: 0.48rem 0.72rem;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .privacy-consent-actions .accept {
        background: #1b1a18;
        color: #fff;
        font-weight: 800;
      }
      .privacy-consent-mini-links {
        margin-top: 0.55rem;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.45rem;
        font-size: 0.58rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .privacy-consent-mini-links a {
        color: #6f685f;
        text-decoration: none;
      }
      .privacy-consent-mini-links a:hover {
        color: #1b1a18;
      }
    `;
    document.head.appendChild(style);
  };

  const ensurePrivacyConsent = (lang = "de") => {
    const existing = readConsent();
    if (existing?.status) return;
    if (document.getElementById(CONSENT_MODAL_ID)) return;

    ensureConsentStyles();
    let currentLocale = lang === "en" ? "en" : "de";
    let analyticsSelected = true;
    let marketingSelected = true;
    const overlay = document.createElement("div");
    overlay.id = CONSENT_MODAL_ID;
    overlay.className = "privacy-consent-overlay";

    const close = () => overlay.remove();
    const renderModal = () => {
      const t = consentTexts[currentLocale] || consentTexts.de;
      const policyHref = currentLocale === "en" ? "/impressum/?lang=en" : "/impressum/";
      const dsgvoHref = currentLocale === "en" ? "/dsgvo/?lang=en" : "/dsgvo/";
      const impressumHref = currentLocale === "en" ? "/impressum/?lang=en" : "/impressum/";
      const agbHref = currentLocale === "en" ? "/agb/?lang=en" : "/agb/";
      overlay.innerHTML = `
        <div class="privacy-consent-modal" role="dialog" aria-modal="true" aria-labelledby="privacyConsentTitle">
          <div class="privacy-consent-lang">
            <button type="button" id="consentLangDe" aria-pressed="${currentLocale === "de"}">DE</button>
            <button type="button" id="consentLangEn" aria-pressed="${currentLocale === "en"}">EN</button>
          </div>
          <h2 id="privacyConsentTitle">${t.title}</h2>
          <p>${t.copy}</p>
          <a class="privacy-consent-link" href="${policyHref}" target="_blank" rel="noreferrer">${t.policy}</a>
          <div class="privacy-consent-options">
            <label class="privacy-consent-option"><input type="checkbox" checked disabled> ${t.necessary}</label>
            <label class="privacy-consent-option"><input id="consentAnalytics" type="checkbox" ${analyticsSelected ? "checked" : ""}> ${t.analytics}</label>
            <label class="privacy-consent-option"><input id="consentMarketing" type="checkbox" ${marketingSelected ? "checked" : ""}> ${t.marketing}</label>
          </div>
          <div class="privacy-consent-actions">
            <button type="button" class="accept" id="consentAccept">${t.accept}</button>
            <button type="button" id="consentReject">${t.reject}</button>
            <button type="button" id="consentSave">${t.save}</button>
          </div>
          <div class="privacy-consent-mini-links">
            <a href="${dsgvoHref}" target="_blank" rel="noreferrer">${t.policyShort}</a>
            <span>•</span>
            <a href="${impressumHref}" target="_blank" rel="noreferrer">${t.impressum}</a>
            <span>•</span>
            <a href="${agbHref}" target="_blank" rel="noreferrer">${t.agb}</a>
          </div>
        </div>
      `;

      overlay.querySelector("#consentLangDe")?.addEventListener("click", () => {
        currentLocale = "de";
        renderModal();
      });
      overlay.querySelector("#consentLangEn")?.addEventListener("click", () => {
        currentLocale = "en";
        renderModal();
      });
      overlay.querySelector("#consentAnalytics")?.addEventListener("change", (event) => {
        analyticsSelected = Boolean(event.target?.checked);
      });
      overlay.querySelector("#consentMarketing")?.addEventListener("change", (event) => {
        marketingSelected = Boolean(event.target?.checked);
      });
      overlay.querySelector("#consentAccept")?.addEventListener("click", () => {
        saveConsent("accepted", { analytics: true, marketing: true });
        close();
      });
      overlay.querySelector("#consentReject")?.addEventListener("click", () => {
        saveConsent("rejected", { analytics: false, marketing: false });
        close();
      });
      overlay.querySelector("#consentSave")?.addEventListener("click", () => {
        saveConsent("custom", { analytics: analyticsSelected, marketing: marketingSelected });
        close();
      });
    };

    renderModal();
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      saveConsent("accepted", { analytics: true, marketing: true });
      close();
    });
    window.requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
    });
  };

  const renderInstagramFeed = (settings, lang, posts, fallbackImages = []) => {
    ensureInstagramFeedStyles();

    const footerNode = document.querySelector("footer");
    if (!footerNode) return;

    let feedNode = document.getElementById("footerInstagramFeed");
    if (!feedNode) {
      feedNode = document.createElement("div");
      feedNode.id = "footerInstagramFeed";
      footerNode.appendChild(feedNode);
    }

    const t = texts[lang] || texts.de;
    const accountUrl = settings.instagram || "https://www.instagram.com/blitzkneisser/";
    const safeFallbackImages = Array.isArray(fallbackImages) && fallbackImages.length
      ? fallbackImages
      : DEFAULT_INSTAGRAM_FALLBACK_IMAGES;
    const realCards = Array.isArray(posts) ? posts.filter((post) => post && post.image).slice(0, 3) : [];
    const cards = realCards.length ? realCards : safeFallbackImages
      .slice(0, 3)
      .map((image, index) => ({
        url: accountUrl,
        image,
        alt: `${t.instagram} ${index + 1}`
      }));

    if (!cards.length) {
      feedNode.innerHTML = "";
      return;
    }

    feedNode.className = "footer-instagram-feed";
    feedNode.innerHTML = `
      <div class="footer-instagram-inner">
        <a href="${accountUrl}" target="_blank" rel="noreferrer" class="footer-instagram-title">${t.instagram}</a>
        <div class="footer-instagram-grid">
          ${cards.map((post, index) => {
            const fallback = String(safeFallbackImages[index % Math.max(1, safeFallbackImages.length)] || "").replace(/"/g, "&quot;");
            return `
            <a href="${accountUrl}" target="_blank" rel="noreferrer" class="footer-instagram-card">
              <img src="${post.image}" alt="${String(post.alt || "Instagram post").replace(/"/g, "&quot;")}" ${fallback ? `onerror="if(this.dataset.fallback&&!this.dataset.failed){this.dataset.failed='1';this.src=this.dataset.fallback;}" data-fallback="${fallback}"` : ""} class="h-full w-full aspect-square object-cover transition duration-500 hover:scale-[1.02]">
            </a>
          `;
          }).join("")}
        </div>
      </div>
    `;
  };

  const applyFooter = (settings, lang, posts = [], fallbackImages = []) => {
    const t = texts[lang] || texts.de;
    const brand = String(settings.businessName || settings.siteName || "Blitzkneisser Photography").trim();
    const locality = [settings.locality, settings.region].filter(Boolean).join(", ");
    const brandNode = document.getElementById("footerBrandText");
    const instagramLink = document.getElementById("footerInstagramLink");
    const contactLink = document.getElementById("footerContactLink");
    const journalLink = document.getElementById("footerJournalLink");
    const filmLink = document.getElementById("footerFilmLink");
    const homeLink = document.getElementById("footerHomeLink");
    const emailLink = document.getElementById("footerEmailLink");
    const phoneLink = document.getElementById("footerPhoneLink");
    const locationNode = document.getElementById("footerLocationText");
    const footerNode = brandNode?.closest("footer") || document.querySelector("footer");
    const linksWrapper = instagramLink?.parentElement;
    let metaNode = document.getElementById("footerMetaGroup");
    let dsgvoLink = document.getElementById("footerDsgvoLink");
    let impressumLink = document.getElementById("footerImpressumLink");
    let agbLink = document.getElementById("footerAgbLink");

    if (footerNode) {
      footerNode.className = "py-16 px-6 md:px-12 border-t border-brand-border flex flex-col gap-8 text-[10px] md:flex-row md:items-start md:justify-between md:gap-16 md:text-xs text-brand-muted tracking-[0.2em] uppercase font-medium bg-brand-bg";
    }
    if (footerNode && !metaNode) {
      metaNode = document.createElement("div");
      metaNode.id = "footerMetaGroup";
      footerNode.prepend(metaNode);
    }
    if (metaNode) {
      metaNode.className = "flex flex-col items-start gap-4 text-left";
      if (brandNode && brandNode.parentElement !== metaNode) metaNode.appendChild(brandNode);
      if (linksWrapper && linksWrapper.parentElement !== metaNode) metaNode.appendChild(linksWrapper);
    }
    if (brandNode) {
      brandNode.className = "max-w-xl text-left leading-[1.5]";
    }
    if (linksWrapper) {
      linksWrapper.className = "flex flex-wrap items-center justify-start gap-x-6 gap-y-3 md:gap-x-8";
      if (!dsgvoLink) {
        dsgvoLink = document.createElement("a");
        dsgvoLink.id = "footerDsgvoLink";
        dsgvoLink.className = "hover:text-brand-text transition-colors duration-300";
        linksWrapper.appendChild(dsgvoLink);
      }
      if (!impressumLink) {
        impressumLink = document.createElement("a");
        impressumLink.id = "footerImpressumLink";
        impressumLink.className = "hover:text-brand-text transition-colors duration-300";
        linksWrapper.appendChild(impressumLink);
      }
      if (!agbLink) {
        agbLink = document.createElement("a");
        agbLink.id = "footerAgbLink";
        agbLink.className = "hover:text-brand-text transition-colors duration-300";
        linksWrapper.appendChild(agbLink);
      }
    }

    if (brandNode) {
      brandNode.textContent = `© 2026 ${brand}${locality ? ` — ${locality}` : ""}`;
    }
    if (instagramLink) {
      instagramLink.href = settings.instagram || "https://www.instagram.com/blitzkneisser/";
      instagramLink.target = "_blank";
      instagramLink.rel = "noreferrer";
      instagramLink.textContent = t.instagram;
      instagramLink.className = "hover:text-brand-text transition-colors duration-300 md:hidden";
    }
    contactLink?.remove();
    journalLink?.remove();
    if (dsgvoLink) {
      dsgvoLink.href = lang === "en" ? "/dsgvo/?lang=en" : "/dsgvo/";
      dsgvoLink.textContent = t.dsgvo;
    }
    if (impressumLink) {
      impressumLink.href = lang === "en" ? "/impressum/?lang=en" : "/impressum/";
      impressumLink.textContent = t.impressum;
    }
    if (agbLink) {
      agbLink.href = lang === "en" ? "/agb/?lang=en" : "/agb/";
      agbLink.textContent = t.agb;
    }
    if (filmLink) {
      filmLink.href = lang === "en" ? "/film/?lang=en" : "/film/";
      filmLink.textContent = t.film;
    }
    if (homeLink) {
      homeLink.href = lang === "en" ? "/index.html?lang=en" : "/index.html";
      homeLink.textContent = t.home;
    }
    if (emailLink) {
      emailLink.href = settings.email ? `mailto:${settings.email}` : "#";
      emailLink.textContent = settings.email || "";
    }
    if (phoneLink) {
      phoneLink.href = settings.phone ? `tel:${String(settings.phone).replace(/[^+\d]/g, "")}` : "#";
      phoneLink.textContent = settings.phone || "";
    }
    if (locationNode) {
      locationNode.textContent = locality;
    }

    renderInstagramFeed(settings, lang, posts, fallbackImages);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    ensureMobileBackToTop();
    ensureMobileLangToggleStyles();

    let settings = {};
    let posts = [];
    let fallbackImages = [];
    try {
      const response = await fetch(`/content/settings/site.json?ts=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        settings = await response.json();
      }
    } catch {
      settings = {};
    }

    try {
      const response = await fetch(`/content/homepage/de.json?ts=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        const homepage = await response.json();
        fallbackImages = [
          ...(Array.isArray(homepage.heroRotation) ? homepage.heroRotation.map((item) => item?.image) : []),
          ...(Array.isArray(homepage.portfolioGallery) ? homepage.portfolioGallery.map((item) => item?.image) : [])
        ].filter(Boolean).slice(0, 6);
      }
    } catch {
      fallbackImages = [];
    }

    try {
      const username = getInstagramUsername(settings.instagram || "blitzkneisser");
      const response = await fetch(`/api/instagram-posts?username=${encodeURIComponent(username)}&count=3&ts=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        posts = Array.isArray(payload.posts) ? payload.posts : [];
      }
    } catch {
      posts = [];
    }

    const update = (lang = getLang(settings.defaultLanguage || "de")) => applyFooter(settings, lang, posts, fallbackImages);
    const syncNavigation = (lang = getLang(settings.defaultLanguage || "de")) => {
      localStorage.setItem("site-lang", lang);
      syncInternalLanguageLinks(lang);
      applyNavigation(settings, lang);
      update(lang);
    };

    syncNavigation();
    ensurePrivacyConsent(getLang(settings.defaultLanguage || "de"));

    const navGroup = document.querySelector("#navMenuPanel > div:first-child");
    if (navGroup) {
      const navObserver = new MutationObserver(() => {
        if (isApplyingNavigation) return;
        window.requestAnimationFrame(() => {
          syncNavigation(getLang(settings.defaultLanguage || "de"));
        });
      });
      navObserver.observe(navGroup, { childList: true, subtree: true, characterData: true });
    }

    document.querySelectorAll("[data-lang-button]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLang = button.dataset.langButton;
        window.setTimeout(() => syncNavigation(nextLang), 0);
        window.setTimeout(() => syncNavigation(nextLang), 120);
      });
    });

    window.addEventListener("pageshow", () => {
      syncNavigation(getLang(settings.defaultLanguage || "de"));
    });
  });
})();
