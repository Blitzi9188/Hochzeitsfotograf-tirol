(() => {
  const INSTAGRAM_FEED_STYLE_ID = "footer-instagram-feed-style";
  const NAV_READY_CLASS = "site-nav-ready";
  const DEFAULT_INSTAGRAM_FALLBACK_IMAGES = [];

  const ensureNavigationReadyStyles = () => {
    const styleId = "site-nav-ready-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      html.${NAV_READY_CLASS} #navMenuPanel > div:first-child,
      html.${NAV_READY_CLASS} #navMenuPanel .nav-lang-toggle {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add(NAV_READY_CLASS);
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
        color: #6f685f;
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
          right: 1rem;
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
      about: "About",
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
    { id: "home", labelDe: "Home", labelEn: "Home", visible: false, order: 1 },
    { id: "experience", labelDe: "Erlebnisse", labelEn: "Experience", visible: true, order: 2 },
    { id: "guides", labelDe: "Guides", labelEn: "Guides", visible: true, order: 3 },
    { id: "journal", labelDe: "Journal", labelEn: "Journal", visible: true, order: 4 },
    { id: "about", labelDe: "Über mich", labelEn: "About", visible: true, order: 5 },
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
    home: (lang) => lang === "en" ? "/?lang=en" : "/",
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
          labelDe: String(fallback.labelDe || item.labelDe || "").trim(),
          labelEn: String(fallback.labelEn || item.labelEn || "").trim(),
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
      copy: "Wir verwenden Cookies für die Funktionalität dieser Website sowie – mit deiner Zustimmung – für Statistik und Marketing.",
      policyShort: "Datenschutz",
      settingsLink: "Einstellungen",
      necessary: "Notwendige (immer aktiv)",
      analytics: "Statistik",
      marketing: "Marketing",
      accept: "Alle akzeptieren",
      reject: "Nur essenzielle",
      save: "Auswahl speichern"
    },
    en: {
      copy: "We use cookies for the functionality of this website and – with your consent – for analytics and marketing.",
      policyShort: "Privacy",
      settingsLink: "Settings",
      necessary: "Necessary (always active)",
      analytics: "Analytics",
      marketing: "Marketing",
      accept: "Accept all",
      reject: "Essential only",
      save: "Save selection"
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
      .pcb {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 200;
        background: rgba(255,255,255,0.97);
        border-top: 1px solid rgba(27,26,24,0.14);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 0.85rem 1.25rem 1rem;
        transform: translateY(100%);
        transition: transform 0.38s cubic-bezier(0.16,1,0.3,1);
        will-change: transform;
      }
      .pcb.is-visible {
        transform: translateY(0);
      }
      .pcb-inner {
        max-width: 54rem;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .pcb-text {
        font-size: 0.7rem;
        line-height: 1.55;
        color: #3d3830;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.25rem 0.6rem;
      }
      .pcb-links {
        display: inline-flex;
        gap: 0.7rem;
        flex-shrink: 0;
      }
      .pcb-links a, .pcb-settings-btn {
        font-size: 0.6rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #1b1a18;
        text-decoration: underline;
        text-underline-offset: 2px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
        min-height: 48px;
        display: inline-flex;
        align-items: center;
      }
      .pcb-links a:hover, .pcb-settings-btn:hover {
        opacity: 0.6;
      }
      .pcb-panel {
        display: none;
        padding: 0.55rem 0 0.1rem;
        border-top: 1px solid rgba(27,26,24,0.08);
      }
      .pcb-panel.is-open {
        display: block;
      }
      .pcb-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1.5rem;
        margin-bottom: 0.6rem;
      }
      .pcb-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.62rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #3d3830;
        cursor: pointer;
        min-height: 48px;
      }
      .pcb-option input[type="checkbox"] {
        width: 1.05rem;
        height: 1.05rem;
        flex: 0 0 auto;
        cursor: pointer;
        accent-color: #1b1a18;
      }
      .pcb-save {
        min-height: 48px;
        border: 1px solid #1b1a18;
        background: #fff;
        color: #1b1a18;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        padding: 0.4rem 1.1rem;
        font-family: inherit;
      }
      .pcb-save:hover {
        background: #1b1a18;
        color: #fff;
      }
      .pcb-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .pcb-btn {
        flex: 1 1 10rem;
        min-height: 48px;
        border: 1px solid #1b1a18;
        background: #fff;
        color: #1b1a18;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        padding: 0.4rem 1rem;
        font-family: inherit;
        text-align: center;
      }
      .pcb-btn:hover {
        background: rgba(27,26,24,0.06);
      }
      .pcb-btn-accept {
        background: #1b1a18;
        color: #fff;
      }
      .pcb-btn-accept:hover {
        background: #3d3830;
      }
    `;
    document.head.appendChild(style);
  };

  const ensurePrivacyConsent = (lang = "de") => {
    const existing = readConsent();
    if (existing?.status) return;
    if (document.getElementById(CONSENT_MODAL_ID)) return;

    ensureConsentStyles();
    const locale = lang === "en" ? "en" : "de";
    let analyticsSelected = true;
    let marketingSelected = true;

    const t = consentTexts[locale] || consentTexts.de;
    const dsgvoHref = locale === "en" ? "/dsgvo/?lang=en" : "/dsgvo/";

    const bar = document.createElement("div");
    bar.id = CONSENT_MODAL_ID;
    bar.className = "pcb";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", locale === "en" ? "Cookie settings" : "Cookie-Einstellungen");

    bar.innerHTML = `
      <div class="pcb-inner">
        <div class="pcb-text">
          <span>${t.copy}</span>
          <span class="pcb-links">
            <a href="${dsgvoHref}" target="_blank" rel="noreferrer">${t.policyShort}</a>
            <button type="button" class="pcb-settings-btn" id="consentSettingsToggle" aria-expanded="false" aria-controls="consentPanel">${t.settingsLink}</button>
          </span>
        </div>
        <div class="pcb-panel" id="consentPanel">
          <div class="pcb-options">
            <label class="pcb-option"><input type="checkbox" checked disabled> ${t.necessary}</label>
            <label class="pcb-option"><input id="consentAnalytics" type="checkbox" checked> ${t.analytics}</label>
            <label class="pcb-option"><input id="consentMarketing" type="checkbox" checked> ${t.marketing}</label>
          </div>
          <button type="button" class="pcb-save" id="consentSave">${t.save}</button>
        </div>
        <div class="pcb-actions">
          <button type="button" class="pcb-btn pcb-btn-accept" id="consentAccept">${t.accept}</button>
          <button type="button" class="pcb-btn" id="consentReject">${t.reject}</button>
        </div>
      </div>
    `;

    const close = () => {
      bar.style.transform = "translateY(100%)";
      bar.addEventListener("transitionend", () => bar.remove(), { once: true });
    };

    bar.querySelector("#consentSettingsToggle").addEventListener("click", () => {
      const panel = bar.querySelector("#consentPanel");
      const btn = bar.querySelector("#consentSettingsToggle");
      const isOpen = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    bar.querySelector("#consentAnalytics").addEventListener("change", (e) => {
      analyticsSelected = e.target.checked;
    });
    bar.querySelector("#consentMarketing").addEventListener("change", (e) => {
      marketingSelected = e.target.checked;
    });
    bar.querySelector("#consentAccept").addEventListener("click", () => {
      saveConsent("accepted", { analytics: true, marketing: true });
      close();
    });
    bar.querySelector("#consentReject").addEventListener("click", () => {
      saveConsent("rejected", { analytics: false, marketing: false });
      close();
    });
    bar.querySelector("#consentSave").addEventListener("click", () => {
      saveConsent("custom", { analytics: analyticsSelected, marketing: marketingSelected });
      close();
    });

    document.body.appendChild(bar);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => bar.classList.add("is-visible"));
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
      // Standort bewusst NICHT anzeigen (Herkunft/Basis nicht plakativ machen)
      brandNode.textContent = `© 2026 ${brand}`;
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
      homeLink.href = lang === "en" ? "/?lang=en" : "/";
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

  const runWhenIdle = (callback) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 2500 });
      return;
    }
    window.setTimeout(callback, 1200);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    ensureMobileBackToTop();
    ensureMobileLangToggleStyles();

    let settings = {};
    let posts = [];
    let fallbackImages = [];

    const homepageBootstrap = window.__HOMEPAGE_BOOTSTRAP__?.de;
    if (homepageBootstrap) {
      fallbackImages = [
        ...(Array.isArray(homepageBootstrap.heroImages) ? homepageBootstrap.heroImages.map((item) => item?.image) : []),
        ...(Array.isArray(homepageBootstrap.portfolioGallery) ? homepageBootstrap.portfolioGallery.map((item) => item?.image) : [])
      ].filter(Boolean).slice(0, 6);
    } else {
      try {
        const response = await fetch(`/content/homepage/de.json?ts=${Date.now()}`, { cache: "no-store" });
        if (response.ok) {
          const homepage = await response.json();
          fallbackImages = [
            ...(Array.isArray(homepage.heroImages) ? homepage.heroImages.map((item) => item?.image) : []),
            ...(Array.isArray(homepage.portfolioGallery) ? homepage.portfolioGallery.map((item) => item?.image) : [])
          ].filter(Boolean).slice(0, 6);
        }
      } catch {
        fallbackImages = [];
      }
    }

    const update = (lang = getLang("en")) => applyFooter(settings, lang, posts, fallbackImages);
    const syncNavigation = (lang = getLang("en")) => {
      localStorage.setItem("site-lang", lang);
      syncInternalLanguageLinks(lang);
      applyNavigation(settings, lang);
      update(lang);
    };

    syncNavigation();
    ensurePrivacyConsent(getLang("en"));

    runWhenIdle(async () => {
      try {
        const response = await fetch(`/content/settings/site.json?ts=${Date.now()}`, { cache: "no-store" });
        if (response.ok) {
          settings = await response.json();
          syncNavigation(getLang("en"));
        }
      } catch {
        settings = settings || {};
      }
    });

    runWhenIdle(async () => {
      try {
        const username = getInstagramUsername(settings.instagram || "blitzkneisser");
        const response = await fetch(`/api/instagram-posts?username=${encodeURIComponent(username)}&count=3&ts=${Date.now()}`, { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json();
          posts = Array.isArray(payload.posts) ? payload.posts : [];
          update(getLang("en"));
        }
      } catch {
        posts = [];
      }
    });

    const navGroup = document.querySelector("#navMenuPanel > div:first-child");
    if (navGroup) {
      const navObserver = new MutationObserver(() => {
        if (isApplyingNavigation) return;
        window.requestAnimationFrame(() => {
          syncNavigation(getLang("en"));
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
      syncNavigation(getLang("en"));
    });
  });
})();
