const app = document.getElementById("app");
const mainMenu = document.getElementById("mainMenu");
const statusNode = document.getElementById("status");
const viewEyebrow = document.getElementById("viewEyebrow");
const viewTitle = document.getElementById("viewTitle");
const viewDescription = document.getElementById("viewDescription");
const openSavedRevisionLink = document.getElementById("openSavedRevisionLink");

const MENU_GROUPS = [
  {
    label: "Start",
    items: [
      { id: "dashboard", eyebrow: "Dashboard", title: "CMS Übersicht", description: "Schneller Einstieg in Seiten, Journal, Medien und Einstellungen.", meta: "Systemstatus" }
    ]
  },
  {
    label: "Seiten",
    items: [
      { id: "homepage-de", eyebrow: "Homepage", title: "Homepage DE / EN", description: "Hero, Über mich, Leistungen, FAQ und SEO in Deutsch und Englisch gemeinsam pflegen.", meta: "Hauptseite" },
      { id: "experience", eyebrow: "Experience", title: "Experience Seite", description: "Experience-Texte, emotionale Sections, FAQ und Bilder in Deutsch pflegen und auf Englisch automatisch ergänzen.", meta: "Journey" },
      { id: "guides-hub", eyebrow: "Guides", title: "Guides Hauptseite", description: "Hero, Start Here, weitere Guides, Stories, FAQ und Abschluss der Guides-Hauptseite pflegen.", meta: "Guide Hub" },
      { id: "guides-pages", eyebrow: "Guides", title: "Guide Unterseiten", description: "Alle Guide-Unterseiten mit DE/EN Texten, Bildern und ALT-Texten übersichtlich bearbeiten.", meta: "Guide Pages" },
      { id: "about", eyebrow: "About", title: "About Seite", description: "About-Texte, Timeline, Bilder und ALT-Texte pflegen.", meta: "Profil" },
      { id: "portfolio", eyebrow: "Portfolio", title: "Portfolio Seite", description: "Portfolio-Texte und Galeriebilder in Deutsch und Englisch pflegen.", meta: "Galerie" },
      { id: "film", eyebrow: "Film", title: "Film Seite", description: "Filmarchiv, Posterbilder und Video-Links für Vimeo oder YouTube pflegen.", meta: "Video" },
      { id: "academy", eyebrow: "Academy", title: "Academy Seite", description: "Workshops, Presets, Detailseiten sowie Stripe- und Download-Links in Deutsch und Englisch pflegen.", meta: "Education" },
      { id: "preisliste", eyebrow: "Preisliste", title: "Preisliste 26/27", description: "Preislisten-Blöcke, Preise und Bilder in Deutsch und Englisch pflegen.", meta: "Angebot" }
    ]
  },
  {
    label: "Redaktion",
    items: [
      { id: "journal", eyebrow: "Journal", title: "Journal Beiträge", description: "Beiträge redaktionell verwalten, strukturieren und öffnen.", meta: "Stories" }
    ]
  },
  {
    label: "Medien",
    items: [
      { id: "images", eyebrow: "Bilder", title: "Bilder und ALT-Texte", description: "Uploads, ALT-Texte und SEO-Metadaten pflegen.", meta: "" }
    ]
  },
  {
    label: "System",
    items: [
      { id: "settings", eyebrow: "Einstellungen", title: "Site Einstellungen", description: "Kontakt, SEO-Basisdaten und globale Links verwalten.", meta: "Konfiguration" }
    ]
  }
];

const MENU = MENU_GROUPS.flatMap((group) => group.items);

const state = {
  view: "dashboard",
  files: [],
  uploads: [],
  cache: {},
  lastSavedAt: Date.now(),
  draft: {},
  selected: {
    journal: "",
    archive: "",
    images: "",
    guidesPage: "",
  }
};

const initialView = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    return MENU.some((entry) => entry.id === view) ? view : "dashboard";
  } catch {
    return "dashboard";
  }
})();

state.view = initialView;

const HOMEPAGE_FILES = {
  "homepage-de": "content/homepage/de.json",
  "homepage-en": "content/homepage/en.json"
};

const SETTINGS_FILE = "content/settings/site.json";
const PREISLISTE_FILES = {
  de: "content/preisliste/de.json",
  en: "content/preisliste/en.json"
};
const EXPERIENCE_FILE = "content/experience/page.json";
const GUIDES_HUB_FILE = "content/guides/hub.json";
const GUIDES_INDEX_FILE = "content/guides/index.json";
const GUIDES_PAGE_PREFIX = "content/guides/pages/";
const PREISLISTE_TRANSLATABLE_KEYS = new Set([
  "title",
  "text",
  "includes",
  "add_extras_text",
  "terms",
  "name",
  "description",
  "alt",
  "msg_inquiry",
  "msg_added",
  "msg_pwd_restored",
  "thanks_headline",
  "thanks_msg",
  "i_agree_text",
  "terms_text",
  "submit_text",
  "label",
  "placeholder",
  "options",
  "heading",
  "copy",
  "summary",
  "body",
  "bodyEn"
]);
const ABOUT_FILE = "content/about/page.json";
const PORTFOLIO_FILE = "content/portfolio/page.json";
const FILM_FILE = "content/film/page.json";
const ACADEMY_FILE = "content/academy/page.json";
const JOURNAL_PREFIX = "content/journal/";
const IMAGE_META_PREFIX = "content/images/";

const STATIC_IMAGE_USAGES = [
  {
    image: "/assets/uploads/Blitzkneisser-Mountain-Elopement-Dolomites-8.jpg",
    area: "Homepage",
    slot: "Hero Hintergrund",
    detail: "Startseite Hero und Standard Open Graph Bild"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Couple-Shooting-Dolomites-INSTA-4.jpg",
    area: "Homepage",
    slot: "Über mich Bild",
    detail: "Bildblock in der About-Sektion der Startseite"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Elopemnt-Dolomites-Lago-di-Braies-15.jpg",
    area: "Homepage",
    slot: "Leistungen",
    detail: "Bildkarte in den Leistungen"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Dolomites-Elopement-Snow-2.jpg",
    area: "Homepage",
    slot: "Journal Preview 1",
    detail: "Erste Vorschaukarte im Journal-Bereich"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Elopement-Dolomites-Picnic-143.jpg",
    area: "Homepage",
    slot: "Journal Preview 2",
    detail: "Zweite Vorschaukarte im Journal-Bereich"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Dolomites-Proposel-INSTA-3.jpg",
    area: "Homepage",
    slot: "Journal Preview 3",
    detail: "Dritte Vorschaukarte im Journal-Bereich"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Couple-Shooting-Dolomites-INSTA-4.jpg",
    area: "About",
    slot: "Portrait",
    detail: "Portraitbild auf der About-Seite"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Mountain-Elopement-Instagram-5.jpg",
    area: "About",
    slot: "CTA Bild",
    detail: "Abschlussbild mit Anfrage-CTA auf der About-Seite"
  },
  {
    image: "/assets/uploads/Blitzkneisser-Mountain-Elopement-Dolomites-8.jpg",
    area: "Film",
    slot: "Posterbild",
    detail: "Filmarchiv Startbild"
  }
];

const getPreviewUrl = () => {
  const stamp = state.lastSavedAt || Date.now();
  if (state.view === "journal") {
    return `/journal/?preview=${stamp}`;
  }
  if (state.view === "about") {
    return `/about/?preview=${stamp}`;
  }
  if (state.view === "experience") {
    return `/experience/?preview=${stamp}`;
  }
  if (state.view === "guides-hub") {
    return `/guides/?preview=${stamp}`;
  }
  if (state.view === "guides-pages") {
    const slug = state.selected.guidesPage || "";
    return slug ? `/guides/${slug}/?preview=${stamp}` : `/guides/?preview=${stamp}`;
  }
  if (state.view === "portfolio") {
    return `/portfolio/?preview=${stamp}`;
  }
  if (state.view === "film") {
    return `/film/?preview=${stamp}`;
  }
  if (state.view === "academy") {
    return `/academy/?preview=${stamp}`;
  }
  if (state.view === "preisliste") {
    return `/preisliste/26-27/?preview=${stamp}`;
  }
  if (state.view === "homepage-en") {
    return `/index.html?preview=${stamp}&lang=en`;
  }
  return `/index.html?preview=${stamp}`;
};

const updatePreviewLink = () => {
  if (!openSavedRevisionLink) return;
  openSavedRevisionLink.href = getPreviewUrl();
};

const openPreviewInNewTab = (url) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const normalizeImagePath = (value) => String(value || "").trim();

const getJournalSlugFromPath = (path) =>
  path.split("/").pop().replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");

const getJournalPostUrl = (path) => `/journal/${getJournalSlugFromPath(path)}/?preview=${state.lastSavedAt || Date.now()}`;

const syncHomepageEnglishFromGerman = async (data) => {
  const englishPath = HOMEPAGE_FILES["homepage-en"];
  await saveFile(englishPath, { type: "json", data: structuredClone(data) });
};

const translatePricingJson = async (value, key = "") => {
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) {
      result.push(await translatePricingJson(item, key));
    }
    return result;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string" && PREISLISTE_TRANSLATABLE_KEYS.has(String(key || "").trim())) {
      const text = value.trim();
      if (!text) return value;
      try {
        return await translateCmsText(text, "de", "en");
      } catch {
        return value;
      }
    }
    return value;
  }

  const next = Array.isArray(value) ? [] : {};
  for (const [childKey, childValue] of Object.entries(value)) {
    if (childKey === "url" || childKey === "image" || childKey === "preview" || childKey === "cover" || childKey === "link" || childKey === "href" || childKey === "path" || childKey === "id" || childKey === "slug" || childKey === "block_id" || childKey === "random_id" || childKey === "width" || childKey === "height" || childKey === "scale" || childKey === "scale_mobile" || childKey === "position" || childKey === "position_mobile" || childKey === "overlay" || childKey === "mask_details" || childKey === "mask_details_mobile" || childKey === "use_positioning" || childKey === "limit_width" || childKey === "color" || childKey === "block_color" || childKey === "block_accent_color" || childKey === "currency" || childKey === "currency_position" || childKey === "currency_delimiter" || childKey === "pricing_tax" || childKey === "show_inquiry" || childKey === "show_calculator" || childKey === "show_terms" || childKey === "show_menu" || childKey === "show_dynamic_url") {
      next[childKey] = structuredClone(childValue);
      continue;
    }
    next[childKey] = await translatePricingJson(childValue, childKey);
  }
  return next;
};

const api = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const translateCmsText = async (text, sourceLang = "de", targetLang = "en") => {
  const value = String(text || "").trim();
  if (!value) return "";
  const response = await api("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: value,
      sourceLang,
      targetLang
    })
  });
  return String(response.translation || "");
};

const attachAutoTranslation = (sourceSelector, targetSelector, root = document) => {
  const sourceNode = root.querySelector(sourceSelector);
  const targetNode = root.querySelector(targetSelector);
  if (!sourceNode || !targetNode) return;

  sourceNode.addEventListener("change", async () => {
    const sourceValue = String(sourceNode.value || "").trim();
    if (!sourceValue) {
      targetNode.value = "";
      return;
    }

    try {
      setStatus("Englische Übersetzung wird erzeugt...");
      targetNode.value = await translateCmsText(sourceValue, "de", "en");
      setStatus("Englische Übersetzung aktualisiert.", "success");
    } catch (error) {
      setStatus(`Übersetzung fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const unescapeStoredText = (value) =>
  String(value ?? "").replace(/\\n/g, "\n");

const setStatus = (message, type = "") => {
  statusNode.textContent = message;
  statusNode.className = `status${type ? ` ${type}` : ""}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildAutoAltFromImagePath = (imagePath, fallback = "Hochzeitsfoto") => {
  const filename = decodeURIComponent(String(imagePath || "").split("/").pop() || "");
  const baseName = filename.replace(/\.[^.]+$/, "");
  const cleaned = baseName
    .replace(/[-_]+/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  const words = cleaned.split(" ").filter(Boolean).slice(0, 12).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const buildCombinedStoryCopy = (data, baseKey) => {
  const directValue = String(data?.[baseKey] || "").trim();
  if (directValue) return directValue;
  return [1, 2, 3]
    .map((index) => String(data?.[`${baseKey}${index}`] || "").trim())
    .filter(Boolean)
    .join("\n\n");
};

const splitStoryCopyForLegacyFields = (value) => {
  const parts = String(value || "")
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    first: parts[0] || "",
    second: parts[1] || "",
    third: parts.length <= 2 ? (parts[2] || "") : parts.slice(2).join("\n\n")
  };
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDateTimeLocalValue = (value, fallback = "") => {
  if (!value) return fallback || "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || value;
  return date.toISOString();
};

const splitFrontmatter = (content) => {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content };
  }
  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: "", body: content };
  }
  const frontmatter = content.slice(4, end).trim();
  const body = content.slice(end + 4).replace(/^\n/, "");
  return { frontmatter, body };
};

const parseScalar = (value) => {
  const trimmed = String(value).trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n");
  }
  return trimmed;
};

const appendContinuation = (target, key, line) => {
  if (!key) return;
  const next = line.trim();
  target[key] = target[key] ? `${target[key]} ${next}` : next;
};

const parseFrontmatter = (frontmatter) => {
  const result = {};
  const lines = frontmatter.split("\n");
  let currentArrayKey = null;
  let currentObject = null;
  let lastKey = null;
  let lastObjectKey = null;

  lines.forEach((rawLine) => {
    if (!rawLine.trim()) {
      return;
    }

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();

    if (indent === 0) {
      currentObject = null;
      lastObjectKey = null;

      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return;
      }
      const key = line.slice(0, separatorIndex).trim();
      const rest = line.slice(separatorIndex + 1).trim();
      lastKey = key;

      if (rest === "") {
        result[key] = [];
        currentArrayKey = key;
        return;
      }

      result[key] = parseScalar(rest);
      currentArrayKey = null;
      return;
    }

    if (line.startsWith("- ")) {
      const itemValue = line.slice(2);
      if (!currentArrayKey) {
        return;
      }

      if (itemValue.includes(":")) {
        const separatorIndex = itemValue.indexOf(":");
        const key = itemValue.slice(0, separatorIndex).trim();
        const rest = itemValue.slice(separatorIndex + 1).trim();
        currentObject = {};
        currentObject[key] = parseScalar(rest);
        lastObjectKey = key;
        result[currentArrayKey].push(currentObject);
      } else {
        result[currentArrayKey].push(parseScalar(itemValue));
        currentObject = null;
        lastObjectKey = null;
      }
      return;
    }

    if (currentObject && line.includes(":")) {
      const separatorIndex = line.indexOf(":");
      const key = line.slice(0, separatorIndex).trim();
      const rest = line.slice(separatorIndex + 1).trim();
      currentObject[key] = parseScalar(rest);
      lastObjectKey = key;
      return;
    }

    if (currentObject && !line.includes(":")) {
      appendContinuation(currentObject, lastObjectKey, rawLine);
      return;
    }

    if (!line.includes(":")) {
      appendContinuation(result, lastKey, rawLine);
    }
  });

  return result;
};

const yamlValue = (value) => {
  if (typeof value === "boolean") return value ? "true" : "false";
  const stringValue = String(value ?? "");
  if (stringValue === "" || /[:[\]{}#"]|^\s|\s$|\n/.test(stringValue)) {
    return `"${stringValue.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"')}"`;
  }
  return stringValue;
};

const serializeFrontmatter = (data) => {
  const lines = ["---"];

  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const entries = Object.entries(item);
          entries.forEach(([nestedKey, nestedValue], index) => {
            const prefix = index === 0 ? "  - " : "    ";
            lines.push(`${prefix}${nestedKey}: ${yamlValue(nestedValue)}`);
          });
        } else {
          lines.push(`  - ${yamlValue(item)}`);
        }
      });
    } else {
      lines.push(`${key}: ${yamlValue(value)}`);
    }
  });

  lines.push("---");
  return lines.join("\n");
};

const buildMarkdown = (frontmatterObject, body) =>
  `${serializeFrontmatter(frontmatterObject)}\n\n${String(body || "").trim()}\n`;

const parseContentFile = (path, content) => {
  if (path.endsWith(".json")) {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "json" && parsed.data && typeof parsed.data === "object") {
      return { type: "json", data: parsed.data };
    }
    return { type: "json", data: parsed };
  }
  const { frontmatter, body } = splitFrontmatter(content);
  return { type: "markdown", data: parseFrontmatter(frontmatter), body };
};

const serializeContentFile = (path, data) => {
  if (path.endsWith(".json")) {
    const jsonData = data && data.type === "json" && data.data ? data.data : data;
    return `${JSON.stringify(jsonData, null, 2)}\n`;
  }
  return buildMarkdown(data.frontmatter, data.body);
};

const ensureFile = async (path) => {
  if (!state.cache[path]) {
    const response = await api(`/api/file?path=${encodeURIComponent(path)}`);
    state.cache[path] = parseContentFile(path, response.content);
  }
  return state.cache[path];
};

const saveFile = async (path, payload) => {
  const content = serializeContentFile(path, payload);
  await api("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content })
  });
  state.cache[path] = payload;
  state.lastSavedAt = Date.now();
  updatePreviewLink();
};

const readRawFile = async (path) => {
  const response = await api(`/api/file?path=${encodeURIComponent(path)}`);
  return String(response.content || "");
};

const replaceInlinePageData = (html, data) => {
  const startMarker = "    const pageData = ";
  const endMarker = "\n\n    const params = new URLSearchParams";
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error("pageData Block konnte nicht gefunden werden.");
  }
  const replacement = `    const pageData = ${JSON.stringify(data, null, 6)};`;
  return `${html.slice(0, start)}${replacement}${html.slice(end)}`;
};

const syncInlineGuidesHtml = async (htmlPath, data) => {
  const html = await readRawFile(htmlPath);
  let nextHtml = replaceInlinePageData(html, data);
  const defaultTitle = data?.de?.title || data?.en?.title || "";
  const defaultDescription = data?.de?.description || data?.en?.description || "";
  if (defaultTitle) {
    nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(defaultTitle)}</title>`);
  }
  if (defaultDescription) {
    nextHtml = nextHtml.replace(
      /<meta\s*\n\s*name="description"[\s\S]*?\n\s*>/,
      `<meta\n    name="description"\n    content="${escapeHtml(defaultDescription)}"\n  >`
    );
  }
  await api("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: htmlPath, content: nextHtml })
  });
  state.lastSavedAt = Date.now();
  updatePreviewLink();
};

const syncGuidePreviewIntoHub = async (slug, guideData) => {
  const hubFile = await ensureFile(GUIDES_HUB_FILE);
  const hubData = structuredClone(hubFile.data || {});
  const href = `/guides/${slug}/`;

  ["de", "en"].forEach((lang) => {
    const guideLang = guideData?.[lang] || {};
    const hero = guideLang.hero || {};
    const startHereItems = hubData?.[lang]?.startHere?.items;
    const helpfulGuides = hubData?.[lang]?.helpful?.guides;

    if (Array.isArray(startHereItems)) {
      startHereItems.forEach((item) => {
        if (item?.href !== href) return;
        item.image = hero.image || item.image || "";
        item.alt = hero.imageAlt || item.alt || "";
      });
    }

    if (!Array.isArray(helpfulGuides)) return;

    helpfulGuides.forEach((item) => {
      if (item?.href !== href) return;
      item.title = hero.title || item.title || "";
      item.copy = hero.copy || item.copy || "";
      item.image = hero.image || item.image || "";
      item.alt = hero.imageAlt || item.alt || "";
    });
  });

  await saveFile(GUIDES_HUB_FILE, { type: "json", data: hubData });
  state.cache[GUIDES_HUB_FILE] = { type: "json", data: hubData };
  await syncInlineGuidesHtml("guides/index.html", hubData);
};

const getGuidePageFilePath = (slug) => `${GUIDES_PAGE_PREFIX}${slug}.json`;

const slugifyGuide = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const refreshEditableFiles = async () => {
  state.files = await api("/api/files").then((response) => response.files);
};

const createGuidePageFromTemplate = async ({ sourceSlug, newSlug, titleDe, titleEn }) => {
  const pagesFile = await ensureFile(GUIDES_INDEX_FILE);
  const pagesData = structuredClone(pagesFile.data || { pages: [] });
  pagesData.pages = Array.isArray(pagesData.pages) ? pagesData.pages : [];
  if (pagesData.pages.some((item) => item.slug === newSlug)) {
    throw new Error("Ein Guide mit diesem Slug existiert bereits.");
  }

  const sourceJsonPath = getGuidePageFilePath(sourceSlug);
  const sourceHtmlPath = `guides/${sourceSlug}/index.html`;
  const newJsonPath = getGuidePageFilePath(newSlug);
  const newHtmlPath = `guides/${newSlug}/index.html`;
  const sourceFile = await ensureFile(sourceJsonPath);
  const nextData = structuredClone(sourceFile.data || {});

  nextData.de = nextData.de || {};
  nextData.en = nextData.en || {};
  nextData.de.title = `${titleDe} | Guides`;
  nextData.en.title = `${titleEn} | Guides`;
  nextData.de.description = nextData.de.description || `Platzhalterbeschreibung für ${titleDe}.`;
  nextData.en.description = nextData.en.description || `Placeholder description for ${titleEn}.`;
  nextData.de.hero = nextData.de.hero || {};
  nextData.en.hero = nextData.en.hero || {};
  nextData.de.hero.title = titleDe;
  nextData.en.hero.title = titleEn;

  await saveFile(newJsonPath, { type: "json", data: nextData });
  const sourceHtml = await readRawFile(sourceHtmlPath);
  let nextHtml = replaceInlinePageData(sourceHtml, nextData);
  nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(nextData.de.title || nextData.en.title || titleDe)}</title>`);
  nextHtml = nextHtml.replace(
    /<meta\s*\n\s*name="description"[\s\S]*?\n\s*>/,
    `<meta\n    name="description"\n    content="${escapeHtml(nextData.de.description || nextData.en.description || "")}"\n  >`
  );
  await api("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: newHtmlPath, content: nextHtml })
  });

  const nextEntry = {
    slug: newSlug,
    titleDe,
    titleEn,
    file: newJsonPath,
    html: newHtmlPath
  };

  const sourceIndex = pagesData.pages.findIndex((item) => item.slug === sourceSlug);
  if (sourceIndex >= 0) pagesData.pages.splice(sourceIndex + 1, 0, nextEntry);
  else pagesData.pages.push(nextEntry);

  await saveFile(GUIDES_INDEX_FILE, { type: "json", data: pagesData });
  state.cache[GUIDES_INDEX_FILE] = { type: "json", data: pagesData };
  await refreshEditableFiles();
  state.selected.guidesPage = newSlug;
};

const deleteGuidePage = async (slug) => {
  const pagesFile = await ensureFile(GUIDES_INDEX_FILE);
  const pagesData = structuredClone(pagesFile.data || { pages: [] });
  pagesData.pages = Array.isArray(pagesData.pages) ? pagesData.pages : [];
  const entry = pagesData.pages.find((item) => item.slug === slug);
  if (!entry) throw new Error("Guide konnte nicht gefunden werden.");

  const href = `/guides/${slug}/`;
  pagesData.pages = pagesData.pages.filter((item) => item.slug !== slug);
  await saveFile(GUIDES_INDEX_FILE, { type: "json", data: pagesData });
  state.cache[GUIDES_INDEX_FILE] = { type: "json", data: pagesData };

  const hubFile = await ensureFile(GUIDES_HUB_FILE);
  const hubData = structuredClone(hubFile.data || {});
  ["de", "en"].forEach((lang) => {
    if (Array.isArray(hubData?.[lang]?.helpful?.guides)) {
      hubData[lang].helpful.guides = hubData[lang].helpful.guides.filter((item) => item?.href !== href);
    }
    if (Array.isArray(hubData?.[lang]?.startHere?.items)) {
      hubData[lang].startHere.items = hubData[lang].startHere.items.filter((item) => item?.href !== href);
    }
  });
  await saveFile(GUIDES_HUB_FILE, { type: "json", data: hubData });
  state.cache[GUIDES_HUB_FILE] = { type: "json", data: hubData };
  await syncInlineGuidesHtml("guides/index.html", hubData);

  const deleteMaybe = async (path) => {
    try {
      await api("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
      });
    } catch {}
  };
  await deleteMaybe(entry.file || getGuidePageFilePath(slug));
  await deleteMaybe(entry.html || `guides/${slug}/index.html`);

  await refreshEditableFiles();
  state.selected.guidesPage = pagesData.pages[0]?.slug || "";
};

const listByPrefix = (prefix) => state.files.filter((file) => file.startsWith(prefix)).sort();

const collectImageUsageMap = async () => {
  const usageMap = new Map();
  const addUsage = (imagePath, usage) => {
    const normalized = normalizeImagePath(imagePath);
    if (!normalized) return;
    if (!usageMap.has(normalized)) {
      usageMap.set(normalized, []);
    }
    usageMap.get(normalized).push(usage);
  };

  STATIC_IMAGE_USAGES.forEach((usage) => {
    addUsage(usage.image, usage);
  });

  const imageMetaFiles = listByPrefix(IMAGE_META_PREFIX);
  await Promise.all(imageMetaFiles.map(async (file) => {
    const parsed = await ensureFile(file);
    if (parsed.data?.image) {
      addUsage(parsed.data.image, {
        area: "CMS Bilddaten",
        slot: parsed.data.title || file.split("/").pop(),
        detail: file
      });
    }
  }));

  const journalFiles = listByPrefix(JOURNAL_PREFIX);
  await Promise.all(journalFiles.map(async (file) => {
    const parsed = await ensureFile(file);
    const title = parsed.data?.title || file.split("/").pop();

    if (parsed.data?.featuredImage) {
      addUsage(parsed.data.featuredImage, {
        area: "Journal",
        slot: `${title} - Hero`,
        detail: file
      });
    }

    const gallery = Array.isArray(parsed.data?.gallery) ? parsed.data.gallery : [];
    gallery.forEach((item, index) => {
      if (item?.image) {
        addUsage(item.image, {
          area: "Journal",
          slot: `${title} - Galerie ${index + 1}`,
          detail: file
        });
      }
    });
  }));

  try {
    const aboutFile = await ensureFile(ABOUT_FILE);
    if (aboutFile.data?.portraitImage) {
      addUsage(aboutFile.data.portraitImage, {
        area: "About",
        slot: "Portrait",
        detail: ABOUT_FILE
      });
    }
    if (aboutFile.data?.ctaImage) {
      addUsage(aboutFile.data.ctaImage, {
        area: "About",
        slot: "CTA Bild",
        detail: ABOUT_FILE
      });
    }
  } catch {
    // About data may not exist yet.
  }

  try {
    const filmFile = await ensureFile(FILM_FILE);
    const films = Array.isArray(filmFile.data?.films) ? filmFile.data.films : [];
    films.forEach((film, index) => {
      if (film?.posterImage) {
        addUsage(film.posterImage, {
          area: "Film",
          slot: `${film.title || `Film ${index + 1}`} - Poster`,
          detail: FILM_FILE
        });
      }
    });
  } catch {
    // Film data may not exist yet.
  }

  try {
    const portfolioFile = await ensureFile(PORTFOLIO_FILE);
    const gallery = Array.isArray(portfolioFile.data?.gallery) ? portfolioFile.data.gallery : [];
    gallery.forEach((item, index) => {
      if (item?.image) {
        addUsage(item.image, {
          area: "Portfolio",
          slot: `Galerie ${index + 1}`,
          detail: PORTFOLIO_FILE
        });
      }
    });
  } catch {
    // Portfolio data may not exist yet.
  }

  return usageMap;
};

const renderMenu = () => {
  mainMenu.innerHTML = MENU_GROUPS.map((group) => `
    <div class="menu-group">
      <p class="menu-group-label">${escapeHtml(group.label)}</p>
      ${group.items.map((item) => `
        <button class="menu-button ${state.view === item.id ? "active" : ""}" data-menu="${item.id}" type="button">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.description)}</span>
          ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
        </button>
      `).join("")}
    </div>
  `).join("");

  mainMenu.querySelectorAll("[data-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.menu;
      updatePreviewLink();
      render();
    });
  });
};

const setHeader = () => {
  const item = MENU.find((entry) => entry.id === state.view) || MENU[0];
  viewEyebrow.textContent = item.eyebrow;
  viewTitle.textContent = item.title;
  viewDescription.innerHTML = `${item.description}<div class="topbar-meta">${item.meta || item.eyebrow}</div>`;
};

const renderDashboard = () => {
  const journalCount = listByPrefix("content/journal/").length;
  const archiveCount = listByPrefix("content/archive/").length;
  const imageMetaCount = listByPrefix("content/images/").length;

  app.innerHTML = `
    <div class="grid dashboard-grid">
      <section class="panel metric-card">
        <p class="eyebrow">Homepage</p>
        <strong>2</strong>
        <span>Deutsch und Englisch</span>
      </section>
      <section class="panel metric-card">
        <p class="eyebrow">Journal</p>
        <strong>${journalCount}</strong>
        <span>Beiträge im System</span>
      </section>
      <section class="panel metric-card">
        <p class="eyebrow">Archiv</p>
        <strong>${archiveCount}</strong>
        <span>Vergangene Hochzeiten</span>
      </section>
      <section class="panel metric-card">
        <p class="eyebrow">Bilder</p>
        <strong>${state.uploads.length}</strong>
        <span>Uploads verfuegbar</span>
      </section>
    </div>

    <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
      <section class="panel">
        <h2 class="section-title">Schnellzugriff</h2>
        <div class="actions">
          <button class="button" data-jump="homepage-de" type="button">Homepage DE / EN</button>
          <button class="button" data-jump="about" type="button">About</button>
          <button class="button" data-jump="portfolio" type="button">Portfolio</button>
          <button class="button" data-jump="film" type="button">Film</button>
          <button class="button" data-jump="academy" type="button">Academy</button>
          <button class="button" data-jump="preisliste" type="button">Preisliste</button>
          <button class="button" data-jump="journal" type="button">Journal</button>
          <button class="button" data-jump="images" type="button">Bilder</button>
          <button class="button" data-jump="settings" type="button">Einstellungen</button>
        </div>
      </section>
      <section class="panel">
        <h2 class="section-title">Systemstatus</h2>
        <p class="muted">Lokaler Server aktiv. Inhalte werden direkt in den Dateien unter <code>content/</code> und Bilder unter <code>assets/uploads/</code> gespeichert.</p>
      </section>
    </div>
  `;

  app.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.jump;
      render();
    });
  });
};

const renderArrayStrings = (items, groupName, fieldName, placeholder) => `
  <div class="array-list">
    ${items.map((item, index) => `
      <div class="array-item">
        <div class="field">
          <label>${fieldName} ${index + 1}</label>
          <input type="text" data-array-group="${groupName}" data-array-item="${index}" value="${escapeHtml(item)}" placeholder="${escapeHtml(placeholder)}">
        </div>
      </div>
    `).join("")}
  </div>
`;

const uploadFileToLibrary = async (file) => {
  const contentBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });

  await api("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentBase64 })
  });

  await loadUploads();
  return `/assets/uploads/${encodeURIComponent(file.name)}`;
};

const loadGuidesPageIndex = async () => {
  const file = await ensureFile(GUIDES_INDEX_FILE);
  const pages = Array.isArray(file.data?.pages) ? file.data.pages : [];
  return pages;
};

const getSelectedGuideSlug = async () => {
  const pages = await loadGuidesPageIndex();
  if (!state.selected.guidesPage || !pages.some((item) => item.slug === state.selected.guidesPage)) {
    state.selected.guidesPage = pages[0]?.slug || "";
  }
  return state.selected.guidesPage;
};

const bindGuidesHubPage = async () => {
  const file = await ensureFile(GUIDES_HUB_FILE);
  const data = structuredClone(file.data);
  const de = data.de || {};
  const en = data.en || {};
  de.startHere = de.startHere || { items: [] };
  en.startHere = en.startHere || { items: [] };
  de.helpful = de.helpful || { guides: [] };
  en.helpful = en.helpful || { guides: [] };
  de.stories = de.stories || { items: [] };
  en.stories = en.stories || { items: [] };
  de.faq = de.faq || { items: [] };
  en.faq = en.faq || { items: [] };
  de.final = de.final || {};
  en.final = en.final || {};

  const pairs = (deItems = [], enItems = []) => Array.from({ length: Math.max(deItems.length, enItems.length) }, (_, index) => ({
    de: deItems[index] || {},
    en: enItems[index] || {}
  }));

  const startHerePairs = pairs(de.startHere.items, en.startHere.items);
  const helpfulPairs = pairs(de.helpful.guides, en.helpful.guides);
  const storyPairs = pairs(de.stories.items, en.stories.items);
  const faqPairs = pairs(de.faq.items, en.faq.items);
  const heroRotationImages = Array.isArray(de.hero?.images)
    ? de.hero.images
    : (Array.isArray(en.hero?.images) ? en.hero.images : []);
  const faqQuestion = (item) => item?.q || item?.question || item?.title || "";
  const faqAnswer = (item) => item?.a || item?.answer || item?.copy || "";

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="guidesHubForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(GUIDES_HUB_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/guides/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Guides Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="titleDe" value="${escapeHtml(de.title || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="titleEn" value="${escapeHtml(en.title || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="descriptionDe">${escapeHtml(de.description || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="descriptionEn">${escapeHtml(en.description || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field">
            <label>Hero Bild Rotation</label>
            <div class="muted" style="margin-bottom: 12px;">Diese Bilder werden auf der Guides-Hauptseite bei jedem neuen Laden zufällig gewechselt.</div>
            <div class="array-list" id="guidesHubHeroImagesList">
              ${heroRotationImages.map((imagePath, index) => `
                <div class="array-item">
                  <div class="field">
                    <label>Hero Bild ${index + 1}</label>
                    <input type="text" data-guides-hub-hero-image="${index}" value="${escapeHtml(imagePath || "")}" placeholder="/assets/uploads/datei.jpg">
                    <div class="upload-inline" style="margin-top: 10px;">
                      <label>
                        Bild hochladen
                        <input type="file" data-guides-hub-hero-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                      </label>
                      <button class="button danger" type="button" data-guides-hub-hero-clear="${index}">Bild entfernen</button>
                    </div>
                    <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(imagePath || "URL wird nach Upload automatisch erzeugt.")}</div>
                    ${imagePath ? `
                      <div class="inline-image-preview">
                        <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(de.hero?.imageAlt || en.hero?.imageAlt || `Guides Hero ${index + 1}`)}">
                        <span>${escapeHtml(imagePath)}</span>
                      </div>
                    ` : ""}
                  </div>
                  <button class="button danger" type="button" data-remove-guides-hub-hero="${index}">Eintrag entfernen</button>
                </div>
              `).join("")}
            </div>
            <div class="actions">
              <button class="button secondary" type="button" id="addGuidesHubHeroImage">Hero Bild hinzufügen</button>
            </div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="heroEyebrowDe" value="${escapeHtml(de.hero?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="heroEyebrowEn" value="${escapeHtml(en.hero?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Titel DE</label><textarea name="heroTitleDe">${escapeHtml(de.hero?.title || "")}</textarea></div>
            <div class="field"><label>Hero Titel EN</label><textarea name="heroTitleEn">${escapeHtml(en.hero?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Copy DE</label><textarea name="heroCopyDe">${escapeHtml(de.hero?.copy || "")}</textarea></div>
            <div class="field"><label>Hero Copy EN</label><textarea name="heroCopyEn">${escapeHtml(en.hero?.copy || "")}</textarea></div>
          </div>
          <div class="field">
            <label>Hero Bild</label>
            <input type="text" name="heroImage" value="${escapeHtml(de.hero?.image || en.hero?.image || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="guidesHubHeroUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="guidesHubHeroClear">Bild entfernen</button>
            </div>
            ${de.hero?.image || en.hero?.image ? `<div class="inline-image-preview"><img src="${escapeHtml(de.hero?.image || en.hero?.image || "")}" alt="${escapeHtml(de.hero?.imageAlt || en.hero?.imageAlt || "Guides Hero Bild")}"><span>${escapeHtml(de.hero?.image || en.hero?.image || "")}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="heroImageAltDe">${escapeHtml(de.hero?.imageAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="heroImageAltEn">${escapeHtml(en.hero?.imageAlt || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Start Here Intro</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="introEyebrowDe" value="${escapeHtml(de.intro?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="introEyebrowEn" value="${escapeHtml(en.intro?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Intro Copy DE</label><textarea name="introCopyDe">${escapeHtml(de.intro?.copy || "")}</textarea></div>
            <div class="field"><label>Intro Copy EN</label><textarea name="introCopyEn">${escapeHtml(en.intro?.copy || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Start Here Karten</h2>
          </div>
          <div class="array-list">
            ${startHerePairs.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Karte ${index + 1} Bild</label><input type="text" data-guides-start-image="${index}" value="${escapeHtml(item.de.image || item.en.image || "")}" placeholder="/assets/uploads/datei.jpg"></div>
                  <div class="field"><label>Link</label><input type="text" data-guides-start-href="${index}" value="${escapeHtml(item.de.href || item.en.href || "")}" placeholder="/guides/.../"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>ALT DE</label><input type="text" data-guides-start-alt-de="${index}" value="${escapeHtml(item.de.alt || "")}"></div>
                  <div class="field"><label>ALT EN</label><input type="text" data-guides-start-alt-en="${index}" value="${escapeHtml(item.en.alt || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-guides-start-title-de="${index}" value="${escapeHtml(item.de.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-guides-start-title-en="${index}" value="${escapeHtml(item.en.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-guides-start-copy-de="${index}">${escapeHtml(item.de.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-guides-start-copy-en="${index}">${escapeHtml(item.en.copy || "")}</textarea></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>CTA DE</label><input type="text" data-guides-start-cta-de="${index}" value="${escapeHtml(item.de.cta || "")}"></div>
                  <div class="field"><label>CTA EN</label><input type="text" data-guides-start-cta-en="${index}" value="${escapeHtml(item.en.cta || "")}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Mehr Guides Button</h2>
          <div class="field-grid-2">
            <div class="field"><label>Button offen DE</label><input type="text" name="moreOpenDe" value="${escapeHtml(de.moreGuides?.open || "")}"></div>
            <div class="field"><label>Button offen EN</label><input type="text" name="moreOpenEn" value="${escapeHtml(en.moreGuides?.open || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Button geschlossen DE</label><input type="text" name="moreCloseDe" value="${escapeHtml(de.moreGuides?.close || "")}"></div>
            <div class="field"><label>Button geschlossen EN</label><input type="text" name="moreCloseEn" value="${escapeHtml(en.moreGuides?.close || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Weitere Guides (unter Read More)</h2>
          <div class="array-list">
            ${helpfulPairs.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Bild</label><input type="text" data-guides-help-image="${index}" value="${escapeHtml(item.de.image || item.en.image || "")}"></div>
                  <div class="field"><label>Link</label><input type="text" data-guides-help-href="${index}" value="${escapeHtml(item.de.href || item.en.href || "")}"></div>
                </div>
                <div class="field">
                  <div class="upload-inline" style="margin-top: 0;">
                    <label>Bild hochladen<input type="file" data-guides-help-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
                    <button class="button danger" type="button" data-guides-help-clear="${index}">Bild entfernen</button>
                  </div>
                  ${(item.de.image || item.en.image) ? `<div class="inline-image-preview"><img src="${escapeHtml(item.de.image || item.en.image || "")}" alt="${escapeHtml(item.de.alt || item.en.alt || `Guide Bild ${index + 1}`)}"><span>${escapeHtml(item.de.image || item.en.image || "")}</span></div>` : ""}
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>ALT DE</label><input type="text" data-guides-help-alt-de="${index}" value="${escapeHtml(item.de.alt || "")}"></div>
                  <div class="field"><label>ALT EN</label><input type="text" data-guides-help-alt-en="${index}" value="${escapeHtml(item.en.alt || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-guides-help-title-de="${index}" value="${escapeHtml(item.de.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-guides-help-title-en="${index}" value="${escapeHtml(item.en.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-guides-help-copy-de="${index}">${escapeHtml(item.de.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-guides-help-copy-en="${index}">${escapeHtml(item.en.copy || "")}</textarea></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>CTA DE</label><input type="text" data-guides-help-cta-de="${index}" value="${escapeHtml(item.de.cta || "")}"></div>
                  <div class="field"><label>CTA EN</label><input type="text" data-guides-help-cta-en="${index}" value="${escapeHtml(item.en.cta || "")}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Real Stories</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="storiesEyebrowDe" value="${escapeHtml(de.stories?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="storiesEyebrowEn" value="${escapeHtml(en.stories?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="storiesTitleDe">${escapeHtml(de.stories?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="storiesTitleEn">${escapeHtml(en.stories?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="storiesCopyDe">${escapeHtml(de.stories?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="storiesCopyEn">${escapeHtml(en.stories?.copy || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hint DE</label><input type="text" name="storiesHintDe" value="${escapeHtml(de.stories?.hint || "")}"></div>
            <div class="field"><label>Hint EN</label><input type="text" name="storiesHintEn" value="${escapeHtml(en.stories?.hint || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="storiesCtaDe" value="${escapeHtml(de.stories?.cta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="storiesCtaEn" value="${escapeHtml(en.stories?.cta || "")}"></div>
          </div>
          <div class="array-list">
            ${storyPairs.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Bild</label><input type="text" data-guides-story-image="${index}" value="${escapeHtml(item.de.image || item.en.image || "")}"></div>
                  <div class="field"><label>Link</label><input type="text" data-guides-story-href="${index}" value="${escapeHtml(item.de.href || item.en.href || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>ALT DE</label><input type="text" data-guides-story-alt-de="${index}" value="${escapeHtml(item.de.alt || "")}"></div>
                  <div class="field"><label>ALT EN</label><input type="text" data-guides-story-alt-en="${index}" value="${escapeHtml(item.en.alt || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-guides-story-title-de="${index}" value="${escapeHtml(item.de.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-guides-story-title-en="${index}" value="${escapeHtml(item.en.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Ort DE</label><input type="text" data-guides-story-location-de="${index}" value="${escapeHtml(item.de.location || "")}"></div>
                  <div class="field"><label>Ort EN</label><input type="text" data-guides-story-location-en="${index}" value="${escapeHtml(item.en.location || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Stimmung DE</label><input type="text" data-guides-story-feeling-de="${index}" value="${escapeHtml(item.de.feeling || "")}"></div>
                  <div class="field"><label>Stimmung EN</label><input type="text" data-guides-story-feeling-en="${index}" value="${escapeHtml(item.en.feeling || "")}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">FAQ</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="faqEyebrowDe" value="${escapeHtml(de.faq?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="faqEyebrowEn" value="${escapeHtml(en.faq?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="faqTitleDe">${escapeHtml(de.faq?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="faqTitleEn">${escapeHtml(en.faq?.title || "")}</textarea></div>
          </div>
          <div class="array-list">
            ${faqPairs.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Frage DE</label><input type="text" data-guides-faq-q-de="${index}" value="${escapeHtml(faqQuestion(item.de))}"></div>
                  <div class="field"><label>Frage EN</label><input type="text" data-guides-faq-q-en="${index}" value="${escapeHtml(faqQuestion(item.en))}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Antwort DE</label><textarea data-guides-faq-a-de="${index}">${escapeHtml(faqAnswer(item.de))}</textarea></div>
                  <div class="field"><label>Antwort EN</label><textarea data-guides-faq-a-en="${index}">${escapeHtml(faqAnswer(item.en))}</textarea></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Final CTA</h2>
          <div class="field">
            <label>Final CTA Bild</label>
            <input type="text" name="finalImage" value="${escapeHtml(de.final?.image || en.final?.image || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="guidesHubFinalUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="guidesHubFinalClear">Bild entfernen</button>
            </div>
            ${de.final?.image || en.final?.image ? `<div class="inline-image-preview"><img src="${escapeHtml(de.final?.image || en.final?.image || "")}" alt="${escapeHtml(de.final?.imageAlt || en.final?.imageAlt || "Guides Final CTA Bild")}"><span>${escapeHtml(de.final?.image || en.final?.image || "")}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="finalImageAltDe">${escapeHtml(de.final?.imageAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="finalImageAltEn">${escapeHtml(en.final?.imageAlt || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="finalEyebrowDe" value="${escapeHtml(de.final?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="finalEyebrowEn" value="${escapeHtml(en.final?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="finalTitleDe">${escapeHtml(de.final?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="finalTitleEn">${escapeHtml(en.final?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="finalCopyDe">${escapeHtml(de.final?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="finalCopyEn">${escapeHtml(en.final?.copy || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="finalCtaDe" value="${escapeHtml(de.final?.cta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="finalCtaEn" value="${escapeHtml(en.final?.cta || "")}"></div>
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/guides/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Guides Seite öffnen</a>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  [
    ["[name='titleDe']", "[name='titleEn']"],
    ["[name='descriptionDe']", "[name='descriptionEn']"],
    ["[name='heroEyebrowDe']", "[name='heroEyebrowEn']"],
    ["[name='heroTitleDe']", "[name='heroTitleEn']"],
    ["[name='heroCopyDe']", "[name='heroCopyEn']"],
    ["[name='heroImageAltDe']", "[name='heroImageAltEn']"],
    ["[name='introEyebrowDe']", "[name='introEyebrowEn']"],
    ["[name='introCopyDe']", "[name='introCopyEn']"],
    ["[name='moreOpenDe']", "[name='moreOpenEn']"],
    ["[name='moreCloseDe']", "[name='moreCloseEn']"],
    ["[name='storiesEyebrowDe']", "[name='storiesEyebrowEn']"],
    ["[name='storiesTitleDe']", "[name='storiesTitleEn']"],
    ["[name='storiesCopyDe']", "[name='storiesCopyEn']"],
    ["[name='storiesHintDe']", "[name='storiesHintEn']"],
    ["[name='storiesCtaDe']", "[name='storiesCtaEn']"],
    ["[name='faqEyebrowDe']", "[name='faqEyebrowEn']"],
    ["[name='faqTitleDe']", "[name='faqTitleEn']"],
    ["[name='finalImageAltDe']", "[name='finalImageAltEn']"],
    ["[name='finalEyebrowDe']", "[name='finalEyebrowEn']"],
    ["[name='finalTitleDe']", "[name='finalTitleEn']"],
    ["[name='finalCopyDe']", "[name='finalCopyEn']"],
    ["[name='finalCtaDe']", "[name='finalCtaEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  startHerePairs.forEach((_, index) => {
    attachAutoTranslation(`[data-guides-start-alt-de="${index}"]`, `[data-guides-start-alt-en="${index}"]`);
  });

  helpfulPairs.forEach((_, index) => {
    attachAutoTranslation(`[data-guides-help-alt-de="${index}"]`, `[data-guides-help-alt-en="${index}"]`);
  });

  storyPairs.forEach((_, index) => {
    attachAutoTranslation(`[data-guides-story-alt-de="${index}"]`, `[data-guides-story-alt-en="${index}"]`);
  });

  const rerenderGuidesHub = async () => {
    state.cache[GUIDES_HUB_FILE] = { type: "json", data };
    await bindGuidesHubPage();
  };

  const addGuidesHubHeroImage = document.getElementById("addGuidesHubHeroImage");
  if (addGuidesHubHeroImage) {
    addGuidesHubHeroImage.addEventListener("click", async () => {
      de.hero = de.hero || {};
      en.hero = en.hero || {};
      de.hero.images = Array.isArray(de.hero.images) ? de.hero.images : [];
      en.hero.images = Array.isArray(en.hero.images) ? en.hero.images : [];
      de.hero.images.push("");
      en.hero.images.push("");
      await rerenderGuidesHub();
    });
  }

  app.querySelectorAll("[data-guides-hub-hero-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      const index = Number(event.target.dataset.guidesHubHeroUpload);
      if (!fileToUpload || Number.isNaN(index)) return;
      try {
        setStatus("Guides Hero Rotationsbild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.hero = de.hero || {};
        en.hero = en.hero || {};
        de.hero.images = Array.isArray(de.hero.images) ? de.hero.images : [];
        en.hero.images = Array.isArray(en.hero.images) ? en.hero.images : [];
        de.hero.images[index] = uploadedPath;
        en.hero.images[index] = uploadedPath;
        setStatus("Guides Hero Rotationsbild erfolgreich hochgeladen.", "success");
        await rerenderGuidesHub();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-guides-hub-hero-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.guidesHubHeroClear);
      if (Number.isNaN(index)) return;
      de.hero = de.hero || {};
      en.hero = en.hero || {};
      de.hero.images = Array.isArray(de.hero.images) ? de.hero.images : [];
      en.hero.images = Array.isArray(en.hero.images) ? en.hero.images : [];
      de.hero.images[index] = "";
      en.hero.images[index] = "";
      setStatus("Guides Hero Rotationsbild entfernt.", "success");
      await rerenderGuidesHub();
    });
  });

  app.querySelectorAll("[data-remove-guides-hub-hero]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.removeGuidesHubHero);
      if (Number.isNaN(index)) return;
      de.hero = de.hero || {};
      en.hero = en.hero || {};
      de.hero.images = Array.isArray(de.hero.images) ? de.hero.images : [];
      en.hero.images = Array.isArray(en.hero.images) ? en.hero.images : [];
      de.hero.images.splice(index, 1);
      en.hero.images.splice(index, 1);
      await rerenderGuidesHub();
    });
  });

  const guidesHubHeroUpload = document.getElementById("guidesHubHeroUpload");
  if (guidesHubHeroUpload) {
    guidesHubHeroUpload.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      try {
        setStatus("Guides Hero Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.hero = de.hero || {};
        en.hero = en.hero || {};
        de.hero.image = uploadedPath;
        en.hero.image = uploadedPath;
        if (!String(de.hero.imageAlt || "").trim()) {
          de.hero.imageAlt = buildAutoAltFromImagePath(fileToUpload.name, "Guides Hero Bild");
        }
        if (!String(en.hero.imageAlt || "").trim() && String(de.hero.imageAlt || "").trim()) {
          try {
            en.hero.imageAlt = await translateCmsText(de.hero.imageAlt, "de", "en");
          } catch {
            en.hero.imageAlt = "";
          }
        }
        state.cache[GUIDES_HUB_FILE] = { type: "json", data };
        setStatus("Guides Hero Bild erfolgreich hochgeladen.", "success");
        await bindGuidesHubPage();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  }

  const guidesHubHeroClear = document.getElementById("guidesHubHeroClear");
  if (guidesHubHeroClear) {
    guidesHubHeroClear.addEventListener("click", async () => {
      de.hero = de.hero || {};
      en.hero = en.hero || {};
      de.hero.image = "";
      en.hero.image = "";
      de.hero.imageAlt = "";
      en.hero.imageAlt = "";
      state.cache[GUIDES_HUB_FILE] = { type: "json", data };
      setStatus("Guides Hero Bild entfernt.", "success");
      await bindGuidesHubPage();
    });
  }

  const guidesHubFinalUpload = document.getElementById("guidesHubFinalUpload");
  if (guidesHubFinalUpload) {
    guidesHubFinalUpload.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      try {
        setStatus("Guides Final CTA Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.final = de.final || {};
        en.final = en.final || {};
        de.final.image = uploadedPath;
        en.final.image = uploadedPath;
        if (!String(de.final.imageAlt || "").trim()) {
          de.final.imageAlt = buildAutoAltFromImagePath(fileToUpload.name, "Guides Final CTA Bild");
        }
        if (!String(en.final.imageAlt || "").trim() && String(de.final.imageAlt || "").trim()) {
          try {
            en.final.imageAlt = await translateCmsText(de.final.imageAlt, "de", "en");
          } catch {
            en.final.imageAlt = "";
          }
        }
        state.cache[GUIDES_HUB_FILE] = { type: "json", data };
        setStatus("Guides Final CTA Bild erfolgreich hochgeladen.", "success");
        await bindGuidesHubPage();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  }

  const guidesHubFinalClear = document.getElementById("guidesHubFinalClear");
  if (guidesHubFinalClear) {
    guidesHubFinalClear.addEventListener("click", async () => {
      de.final = de.final || {};
      en.final = en.final || {};
      de.final.image = "";
      en.final.image = "";
      de.final.imageAlt = "";
      en.final.imageAlt = "";
      state.cache[GUIDES_HUB_FILE] = { type: "json", data };
      setStatus("Guides Final CTA Bild entfernt.", "success");
      await bindGuidesHubPage();
    });
  }

  document.querySelectorAll("[data-guides-help-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      const index = Number(event.target.dataset.guidesHelpUpload);
      if (!fileToUpload || Number.isNaN(index)) return;
      try {
        setStatus("Guide-Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.helpful = de.helpful || { guides: [] };
        en.helpful = en.helpful || { guides: [] };
        de.helpful.guides = Array.isArray(de.helpful.guides) ? de.helpful.guides : [];
        en.helpful.guides = Array.isArray(en.helpful.guides) ? en.helpful.guides : [];
        de.helpful.guides[index] = de.helpful.guides[index] || {};
        en.helpful.guides[index] = en.helpful.guides[index] || {};
        de.helpful.guides[index].image = uploadedPath;
        en.helpful.guides[index].image = uploadedPath;
        if (!String(de.helpful.guides[index].alt || "").trim()) {
          de.helpful.guides[index].alt = buildAutoAltFromImagePath(fileToUpload.name, `Guide Bild ${index + 1}`);
        }
        if (!String(en.helpful.guides[index].alt || "").trim() && String(de.helpful.guides[index].alt || "").trim()) {
          try {
            en.helpful.guides[index].alt = await translateCmsText(de.helpful.guides[index].alt, "de", "en");
          } catch {
            en.helpful.guides[index].alt = "";
          }
        }
        state.cache[GUIDES_HUB_FILE] = { type: "json", data };
        setStatus("Guide-Bild erfolgreich hochgeladen.", "success");
        await bindGuidesHubPage();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  document.querySelectorAll("[data-guides-help-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.guidesHelpClear);
      if (Number.isNaN(index)) return;
      de.helpful = de.helpful || { guides: [] };
      en.helpful = en.helpful || { guides: [] };
      de.helpful.guides = Array.isArray(de.helpful.guides) ? de.helpful.guides : [];
      en.helpful.guides = Array.isArray(en.helpful.guides) ? en.helpful.guides : [];
      de.helpful.guides[index] = de.helpful.guides[index] || {};
      en.helpful.guides[index] = en.helpful.guides[index] || {};
      de.helpful.guides[index].image = "";
      en.helpful.guides[index].image = "";
      de.helpful.guides[index].alt = "";
      en.helpful.guides[index].alt = "";
      state.cache[GUIDES_HUB_FILE] = { type: "json", data };
      setStatus("Guide-Bild entfernt.", "success");
      await bindGuidesHubPage();
    });
  });

  const hubForm = document.getElementById("guidesHubForm");
  hubForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const sharedHeroImage = form.heroImage.value.trim();
    const sharedFinalImage = form.finalImage.value.trim();
    const heroRotationImages = Array.from(form.querySelectorAll("[data-guides-hub-hero-image]"))
      .map((input) => input.value.trim())
      .filter(Boolean);
    const nextData = {
      de: {
        title: form.titleDe.value,
        description: form.descriptionDe.value,
        hero: {
          eyebrow: form.heroEyebrowDe.value,
          title: form.heroTitleDe.value,
          copy: form.heroCopyDe.value,
          images: heroRotationImages,
          image: sharedHeroImage,
          imageAlt: form.heroImageAltDe.value,
          primaryCta: de.hero?.primaryCta || "",
          secondaryCta: de.hero?.secondaryCta || ""
        },
        intro: { eyebrow: form.introEyebrowDe.value, copy: form.introCopyDe.value },
        moreGuides: { open: form.moreOpenDe.value, close: form.moreCloseDe.value },
        startHere: {
          items: startHerePairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-start-title-de="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guides-start-copy-de="${index}"]`)?.value || "",
            cta: form.querySelector(`[data-guides-start-cta-de="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-start-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-start-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-start-alt-de="${index}"]`)?.value || ""
          }))
        },
        helpful: {
          eyebrow: de.helpful?.eyebrow || "",
          title: de.helpful?.title || "",
          copy: de.helpful?.copy || "",
          guides: helpfulPairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-help-title-de="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guides-help-copy-de="${index}"]`)?.value || "",
            cta: form.querySelector(`[data-guides-help-cta-de="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-help-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-help-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-help-alt-de="${index}"]`)?.value || "",
            tags: de.helpful?.guides?.[index]?.tags || []
          }))
        },
        stories: {
          eyebrow: form.storiesEyebrowDe.value,
          title: form.storiesTitleDe.value,
          copy: form.storiesCopyDe.value,
          hint: form.storiesHintDe.value,
          cta: form.storiesCtaDe.value,
          items: storyPairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-story-title-de="${index}"]`)?.value || "",
            location: form.querySelector(`[data-guides-story-location-de="${index}"]`)?.value || "",
            feeling: form.querySelector(`[data-guides-story-feeling-de="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-story-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-story-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-story-alt-de="${index}"]`)?.value || ""
          }))
        },
        faq: {
          eyebrow: form.faqEyebrowDe.value,
          title: form.faqTitleDe.value,
          items: faqPairs.map((_, index) => ({
            q: form.querySelector(`[data-guides-faq-q-de="${index}"]`)?.value || "",
            a: form.querySelector(`[data-guides-faq-a-de="${index}"]`)?.value || ""
          }))
        },
        final: {
          image: sharedFinalImage,
          imageAlt: form.finalImageAltDe.value,
          eyebrow: form.finalEyebrowDe.value,
          title: form.finalTitleDe.value,
          copy: form.finalCopyDe.value,
          cta: form.finalCtaDe.value
        }
      },
      en: {
        title: form.titleEn.value,
        description: form.descriptionEn.value,
        hero: {
          eyebrow: form.heroEyebrowEn.value,
          title: form.heroTitleEn.value,
          copy: form.heroCopyEn.value,
          images: heroRotationImages,
          image: sharedHeroImage,
          imageAlt: form.heroImageAltEn.value,
          primaryCta: en.hero?.primaryCta || "",
          secondaryCta: en.hero?.secondaryCta || ""
        },
        intro: { eyebrow: form.introEyebrowEn.value, copy: form.introCopyEn.value },
        moreGuides: { open: form.moreOpenEn.value, close: form.moreCloseEn.value },
        startHere: {
          items: startHerePairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-start-title-en="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guides-start-copy-en="${index}"]`)?.value || "",
            cta: form.querySelector(`[data-guides-start-cta-en="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-start-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-start-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-start-alt-en="${index}"]`)?.value || ""
          }))
        },
        helpful: {
          eyebrow: en.helpful?.eyebrow || "",
          title: en.helpful?.title || "",
          copy: en.helpful?.copy || "",
          guides: helpfulPairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-help-title-en="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guides-help-copy-en="${index}"]`)?.value || "",
            cta: form.querySelector(`[data-guides-help-cta-en="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-help-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-help-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-help-alt-en="${index}"]`)?.value || "",
            tags: en.helpful?.guides?.[index]?.tags || []
          }))
        },
        stories: {
          eyebrow: form.storiesEyebrowEn.value,
          title: form.storiesTitleEn.value,
          copy: form.storiesCopyEn.value,
          hint: form.storiesHintEn.value,
          cta: form.storiesCtaEn.value,
          items: storyPairs.map((_, index) => ({
            title: form.querySelector(`[data-guides-story-title-en="${index}"]`)?.value || "",
            location: form.querySelector(`[data-guides-story-location-en="${index}"]`)?.value || "",
            feeling: form.querySelector(`[data-guides-story-feeling-en="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guides-story-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guides-story-image="${index}"]`)?.value || "",
            alt: form.querySelector(`[data-guides-story-alt-en="${index}"]`)?.value || ""
          }))
        },
        faq: {
          eyebrow: form.faqEyebrowEn.value,
          title: form.faqTitleEn.value,
          items: faqPairs.map((_, index) => ({
            q: form.querySelector(`[data-guides-faq-q-en="${index}"]`)?.value || "",
            a: form.querySelector(`[data-guides-faq-a-en="${index}"]`)?.value || ""
          }))
        },
        final: {
          image: sharedFinalImage,
          imageAlt: form.finalImageAltEn.value,
          eyebrow: form.finalEyebrowEn.value,
          title: form.finalTitleEn.value,
          copy: form.finalCopyEn.value,
          cta: form.finalCtaEn.value
        }
      }
    };

    setStatus("Guides Hauptseite wird gespeichert...");
    try {
      await saveFile(GUIDES_HUB_FILE, { type: "json", data: nextData });
      await syncInlineGuidesHtml("guides/index.html", nextData);
      setStatus("Guides Hauptseite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) openPreviewInNewTab(getPreviewUrl());
      else await render();
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindGuidesPageManager = async () => {
  const pages = await loadGuidesPageIndex();
  const slug = await getSelectedGuideSlug();
  const filePath = getGuidePageFilePath(slug);
  const file = await ensureFile(filePath);
  const data = structuredClone(file.data);
  const de = data.de || {};
  const en = data.en || {};
  de.sections = de.sections || { seasonOrder: [], seasons: {} };
  en.sections = en.sections || { seasonOrder: [], seasons: {} };
  de.sections.seasons = de.sections.seasons || {};
  en.sections.seasons = en.sections.seasons || {};
  let sectionKeys = Array.isArray(de.sections?.seasonOrder) && de.sections.seasonOrder.length
    ? [...de.sections.seasonOrder]
    : Object.keys(de.sections?.seasons || {});
  const pairedFacts = Array.from({ length: Math.max(de.overview?.items?.length || 0, en.overview?.items?.length || 0) }, (_, index) => ({
    de: de.overview?.items?.[index] || {},
    en: en.overview?.items?.[index] || {}
  }));
  const pairedPlanning = Array.from({ length: Math.max(de.planning?.items?.length || 0, en.planning?.items?.length || 0) }, (_, index) => ({
    de: de.planning?.items?.[index] || {},
    en: en.planning?.items?.[index] || {}
  }));
  const pairedFaq = Array.from({ length: Math.max(de.faq?.items?.length || 0, en.faq?.items?.length || 0) }, (_, index) => ({
    de: de.faq?.items?.[index] || {},
    en: en.faq?.items?.[index] || {}
  }));
  const pairedRelated = Array.from({ length: Math.max(de.related?.items?.length || 0, en.related?.items?.length || 0) }, (_, index) => ({
    de: de.related?.items?.[index] || {},
    en: en.related?.items?.[index] || {}
  }));
  const faqQuestion = (item) => item?.q || item?.question || item?.title || "";
  const faqAnswer = (item) => item?.a || item?.answer || item?.copy || "";
  const createEmptyGuideBlock = () => ({
    layout: "image-left",
    image: "",
    imageAlt: "",
    eyebrow: "",
    title: "",
    intro: "",
    copy: "",
    points: [],
    facts: [],
    note: "",
    meta: "",
    linkLabel: "",
    linkHref: ""
  });

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="guidesPageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(filePath)}</div>
          <div class="actions" style="margin-top: 0;">
            <button class="button secondary" type="button" id="guidesPageAdd">Guide hinzufügen</button>
            <button class="button danger" type="button" id="guidesPageDelete">Guide löschen</button>
            <a class="button secondary" href="/guides/${escapeHtml(slug)}/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Guide öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Guide wählen</h2>
          <div class="field">
            <label>Unterseite</label>
            <select id="guidesPageSelect">${pages.map((item) => `<option value="${escapeHtml(item.slug)}" ${item.slug === slug ? "selected" : ""}>${escapeHtml(item.titleDe || item.titleEn || item.slug)}</option>`).join("")}</select>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="titleDe" value="${escapeHtml(de.title || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="titleEn" value="${escapeHtml(en.title || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="descriptionDe">${escapeHtml(de.description || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="descriptionEn">${escapeHtml(en.description || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="heroEyebrowDe" value="${escapeHtml(de.hero?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="heroEyebrowEn" value="${escapeHtml(en.hero?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="heroTitleDe">${escapeHtml(de.hero?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="heroTitleEn">${escapeHtml(en.hero?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="heroCopyDe">${escapeHtml(de.hero?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="heroCopyEn">${escapeHtml(en.hero?.copy || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="heroCtaDe" value="${escapeHtml(de.hero?.cta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="heroCtaEn" value="${escapeHtml(en.hero?.cta || "")}"></div>
          </div>
          <div class="field">
            <label>Hero Bild</label>
            <input type="text" name="heroImage" value="${escapeHtml(de.hero?.image || en.hero?.image || "")}">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="guidesPageHeroUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="guidesPageHeroClear">Bild entfernen</button>
            </div>
            ${de.hero?.image || en.hero?.image ? `<div class="inline-image-preview"><img src="${escapeHtml(de.hero?.image || en.hero?.image || "")}" alt="${escapeHtml(de.hero?.imageAlt || en.hero?.imageAlt || "Guide Hero Bild")}"><span>${escapeHtml(de.hero?.image || en.hero?.image || "")}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="heroImageAltDe">${escapeHtml(de.hero?.imageAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="heroImageAltEn">${escapeHtml(en.hero?.imageAlt || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Guide Fakten</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="overviewEyebrowDe" value="${escapeHtml(de.overview?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="overviewEyebrowEn" value="${escapeHtml(en.overview?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="overviewCopyDe">${escapeHtml(de.overview?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="overviewCopyEn">${escapeHtml(en.overview?.copy || "")}</textarea></div>
          </div>
          <div class="array-list">
            ${pairedFacts.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Icon</label><input type="text" data-guide-fact-icon="${index}" value="${escapeHtml(item.de.icon || item.en.icon || "")}"></div>
                  <div class="field"><label>Label DE</label><input type="text" data-guide-fact-label-de="${index}" value="${escapeHtml(item.de.label || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Label EN</label><input type="text" data-guide-fact-label-en="${index}" value="${escapeHtml(item.en.label || "")}"></div>
                  <div class="field"><label>Value DE</label><input type="text" data-guide-fact-value-de="${index}" value="${escapeHtml(item.de.value || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Value EN</label><input type="text" data-guide-fact-value-en="${index}" value="${escapeHtml(item.en.value || "")}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Einleitung</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="philosophyEyebrowDe" value="${escapeHtml(de.philosophy?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="philosophyEyebrowEn" value="${escapeHtml(en.philosophy?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="philosophyTitleDe">${escapeHtml(de.philosophy?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="philosophyTitleEn">${escapeHtml(en.philosophy?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="philosophyCopyDe">${escapeHtml(de.philosophy?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="philosophyCopyEn">${escapeHtml(en.philosophy?.copy || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Content Blöcke</h2>
          <div class="actions" style="justify-content: flex-end; margin: 0 0 14px;">
            <button class="button secondary" type="button" id="guideBlockAdd">Block hinzufügen</button>
          </div>
          <div class="array-list">
            ${sectionKeys.map((key) => {
              const deBlock = de.sections?.seasons?.[key] || {};
              const enBlock = en.sections?.seasons?.[key] || {};
              const factRows = Array.from({ length: Math.max(deBlock.facts?.length || 0, enBlock.facts?.length || 0) }, (_, index) => ({
                de: deBlock.facts?.[index] || {},
                en: enBlock.facts?.[index] || {}
              }));
              return `
                <div class="array-item">
                  <div class="actions" style="justify-content: space-between; margin: 0 0 10px;">
                    <div class="muted">Block: ${escapeHtml(key)}</div>
                    <button class="button danger" type="button" data-guide-block-delete="${key}">Block löschen</button>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Layout</label><input type="text" data-guide-block-layout="${key}" value="${escapeHtml(deBlock.layout || enBlock.layout || "")}"></div>
                    <div class="field">
                      <label>Bild</label>
                      <input type="text" data-guide-block-image="${key}" value="${escapeHtml(deBlock.image || enBlock.image || "")}">
                      <div class="upload-inline" style="margin-top: 10px;">
                        <label>Bild hochladen<input type="file" data-guide-block-upload="${key}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
                        <button class="button danger" type="button" data-guide-block-clear="${key}">Bild entfernen</button>
                      </div>
                      ${(deBlock.image || enBlock.image) ? `<div class="inline-image-preview"><img src="${escapeHtml(deBlock.image || enBlock.image || "")}" alt="${escapeHtml(deBlock.imageAlt || enBlock.imageAlt || `Guide Block ${key}`)}"><span>${escapeHtml(deBlock.image || enBlock.image || "")}</span></div>` : ""}
                    </div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>ALT DE</label><input type="text" data-guide-block-alt-de="${key}" value="${escapeHtml(deBlock.imageAlt || "")}"></div>
                    <div class="field"><label>ALT EN</label><input type="text" data-guide-block-alt-en="${key}" value="${escapeHtml(enBlock.imageAlt || "")}"></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Textsymbol / Eyebrow DE</label><input type="text" data-guide-block-eyebrow-de="${key}" value="${escapeHtml(deBlock.eyebrow || "")}"></div>
                    <div class="field"><label>Textsymbol / Eyebrow EN</label><input type="text" data-guide-block-eyebrow-en="${key}" value="${escapeHtml(enBlock.eyebrow || "")}"></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Titel DE</label><input type="text" data-guide-block-title-de="${key}" value="${escapeHtml(deBlock.title || "")}"></div>
                    <div class="field"><label>Titel EN</label><input type="text" data-guide-block-title-en="${key}" value="${escapeHtml(enBlock.title || "")}"></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Intro DE</label><textarea data-guide-block-intro-de="${key}">${escapeHtml(deBlock.intro || "")}</textarea></div>
                    <div class="field"><label>Intro EN</label><textarea data-guide-block-intro-en="${key}">${escapeHtml(enBlock.intro || "")}</textarea></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Copy DE</label><textarea data-guide-block-copy-de="${key}">${escapeHtml(deBlock.copy || "")}</textarea></div>
                    <div class="field"><label>Copy EN</label><textarea data-guide-block-copy-en="${key}">${escapeHtml(enBlock.copy || "")}</textarea></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Punkte DE (eine Zeile pro Punkt)</label><textarea data-guide-block-points-de="${key}">${escapeHtml((deBlock.points || []).join("\\n"))}</textarea></div>
                    <div class="field"><label>Punkte EN (eine Zeile pro Punkt)</label><textarea data-guide-block-points-en="${key}">${escapeHtml((enBlock.points || []).join("\\n"))}</textarea></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Note DE</label><textarea data-guide-block-note-de="${key}">${escapeHtml(deBlock.note || "")}</textarea></div>
                    <div class="field"><label>Note EN</label><textarea data-guide-block-note-en="${key}">${escapeHtml(enBlock.note || "")}</textarea></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Meta DE</label><input type="text" data-guide-block-meta-de="${key}" value="${escapeHtml(deBlock.meta || "")}"></div>
                    <div class="field"><label>Meta EN</label><input type="text" data-guide-block-meta-en="${key}" value="${escapeHtml(enBlock.meta || "")}"></div>
                  </div>
                  <div class="field-grid-2">
                    <div class="field"><label>Link Label DE</label><input type="text" data-guide-block-link-label-de="${key}" value="${escapeHtml(deBlock.linkLabel || "")}"></div>
                    <div class="field"><label>Link Label EN</label><input type="text" data-guide-block-link-label-en="${key}" value="${escapeHtml(enBlock.linkLabel || "")}"></div>
                  </div>
                  <div class="field"><label>Link URL</label><input type="text" data-guide-block-link-href="${key}" value="${escapeHtml(deBlock.linkHref || enBlock.linkHref || "")}"></div>
                  <div class="array-list" style="margin-top: 14px;">
                    ${factRows.map((factRow, factIndex) => `
                      <div class="array-item">
                        <div class="field-grid-2">
                          <div class="field"><label>Fact ${factIndex + 1} Icon</label><input type="text" data-guide-block-fact-icon="${key}-${factIndex}" value="${escapeHtml(factRow.de.icon || factRow.en.icon || "")}"></div>
                          <div class="field"><label>Fact ${factIndex + 1} Label DE</label><input type="text" data-guide-block-fact-label-de="${key}-${factIndex}" value="${escapeHtml(factRow.de.label || "")}"></div>
                        </div>
                        <div class="field-grid-2">
                          <div class="field"><label>Label EN</label><input type="text" data-guide-block-fact-label-en="${key}-${factIndex}" value="${escapeHtml(factRow.en.label || "")}"></div>
                          <div class="field"><label>Value DE</label><input type="text" data-guide-block-fact-value-de="${key}-${factIndex}" value="${escapeHtml(factRow.de.value || "")}"></div>
                        </div>
                        <div class="field-grid-2">
                          <div class="field"><label>Value EN</label><input type="text" data-guide-block-fact-value-en="${key}-${factIndex}" value="${escapeHtml(factRow.en.value || "")}"></div>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Planning Notes</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="planningEyebrowDe" value="${escapeHtml(de.planning?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="planningEyebrowEn" value="${escapeHtml(en.planning?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="planningTitleDe">${escapeHtml(de.planning?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="planningTitleEn">${escapeHtml(en.planning?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Intro DE</label><textarea name="planningIntroDe">${escapeHtml(de.planning?.intro || "")}</textarea></div>
            <div class="field"><label>Intro EN</label><textarea name="planningIntroEn">${escapeHtml(en.planning?.intro || "")}</textarea></div>
          </div>
          <div class="array-list">
            ${pairedPlanning.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Label DE</label><input type="text" data-guide-planning-label-de="${index}" value="${escapeHtml(item.de.label || "")}"></div>
                  <div class="field"><label>Label EN</label><input type="text" data-guide-planning-label-en="${index}" value="${escapeHtml(item.en.label || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-guide-planning-title-de="${index}" value="${escapeHtml(item.de.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-guide-planning-title-en="${index}" value="${escapeHtml(item.en.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-guide-planning-copy-de="${index}">${escapeHtml(item.de.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-guide-planning-copy-en="${index}">${escapeHtml(item.en.copy || "")}</textarea></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Meta DE</label><input type="text" data-guide-planning-meta-de="${index}" value="${escapeHtml(item.de.meta || "")}"></div>
                  <div class="field"><label>Meta EN</label><input type="text" data-guide-planning-meta-en="${index}" value="${escapeHtml(item.en.meta || "")}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">FAQ</h2>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="faqTitleDe">${escapeHtml(de.faq?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="faqTitleEn">${escapeHtml(en.faq?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Intro DE</label><textarea name="faqIntroDe">${escapeHtml(de.faq?.intro || "")}</textarea></div>
            <div class="field"><label>Intro EN</label><textarea name="faqIntroEn">${escapeHtml(en.faq?.intro || "")}</textarea></div>
          </div>
          <div class="array-list">
            ${pairedFaq.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Frage DE</label><input type="text" data-guide-faq-q-de="${index}" value="${escapeHtml(faqQuestion(item.de))}"></div>
                  <div class="field"><label>Frage EN</label><input type="text" data-guide-faq-q-en="${index}" value="${escapeHtml(faqQuestion(item.en))}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Antwort DE</label><textarea data-guide-faq-a-de="${index}">${escapeHtml(faqAnswer(item.de))}</textarea></div>
                  <div class="field"><label>Antwort EN</label><textarea data-guide-faq-a-en="${index}">${escapeHtml(faqAnswer(item.en))}</textarea></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Verwandte Leitfäden</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="relatedEyebrowDe" value="${escapeHtml(de.related?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="relatedEyebrowEn" value="${escapeHtml(en.related?.eyebrow || "")}"></div>
          </div>
          <div class="array-list">
            ${pairedRelated.map((item, index) => `
              <div class="array-item">
                <div class="muted" style="margin-bottom: 10px;">Guide ${index + 1}</div>
                <div class="field-grid-2">
                  <div class="field">
                    <label>Bild</label>
                    <input type="text" data-guide-related-image="${index}" value="${escapeHtml(item.de.image || item.en.image || "")}">
                    <div class="upload-inline" style="margin-top: 10px;">
                      <label>Bild hochladen<input type="file" data-guide-related-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
                      <button class="button danger" type="button" data-guide-related-clear="${index}">Bild entfernen</button>
                    </div>
                    ${(item.de.image || item.en.image) ? `<div class="inline-image-preview"><img src="${escapeHtml(item.de.image || item.en.image || "")}" alt="${escapeHtml(item.de.title || item.en.title || `Related Guide ${index + 1}`)}"><span>${escapeHtml(item.de.image || item.en.image || "")}</span></div>` : ""}
                  </div>
                  <div class="field">
                    <label>Link URL</label>
                    <input type="text" data-guide-related-href="${index}" value="${escapeHtml(item.de.href || item.en.href || "")}">
                  </div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Label DE</label><input type="text" data-guide-related-label-de="${index}" value="${escapeHtml(item.de.label || "")}"></div>
                  <div class="field"><label>Label EN</label><input type="text" data-guide-related-label-en="${index}" value="${escapeHtml(item.en.label || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-guide-related-title-de="${index}" value="${escapeHtml(item.de.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-guide-related-title-en="${index}" value="${escapeHtml(item.en.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-guide-related-copy-de="${index}">${escapeHtml(item.de.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-guide-related-copy-en="${index}">${escapeHtml(item.en.copy || "")}</textarea></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Final CTA</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="finalEyebrowDe" value="${escapeHtml(de.final?.eyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="finalEyebrowEn" value="${escapeHtml(en.final?.eyebrow || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="finalTitleDe">${escapeHtml(de.final?.title || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="finalTitleEn">${escapeHtml(en.final?.title || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="finalCopyDe">${escapeHtml(de.final?.copy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="finalCopyEn">${escapeHtml(en.final?.copy || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="finalCtaDe" value="${escapeHtml(de.final?.cta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="finalCtaEn" value="${escapeHtml(en.final?.cta || "")}"></div>
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/guides/${escapeHtml(slug)}/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Guide öffnen</a>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById("guidesPageSelect").addEventListener("change", async (event) => {
    state.selected.guidesPage = event.target.value;
    await render();
  });

  const guidesPageAdd = document.getElementById("guidesPageAdd");
  if (guidesPageAdd) {
    guidesPageAdd.addEventListener("click", async () => {
      const titleDe = window.prompt("Titel DE für den neuen Guide:", "Neuer Guide");
      if (!titleDe || !String(titleDe).trim()) return;
      const titleEn = window.prompt("Title EN for the new guide:", String(titleDe).trim());
      if (!titleEn || !String(titleEn).trim()) return;
      const suggestedSlug = slugifyGuide(String(titleEn).trim()) || slugifyGuide(String(titleDe).trim()) || "new-guide";
      const newSlug = window.prompt("Slug für den neuen Guide:", suggestedSlug);
      if (!newSlug || !String(newSlug).trim()) return;
      try {
        setStatus("Neuer Guide wird angelegt...");
        await createGuidePageFromTemplate({
          sourceSlug: slug,
          newSlug: slugifyGuide(newSlug),
          titleDe: String(titleDe).trim(),
          titleEn: String(titleEn).trim()
        });
        setStatus("Neuer Guide erfolgreich angelegt.", "success");
        await render();
      } catch (error) {
        setStatus(`Guide konnte nicht angelegt werden: ${error.message}`, "error");
      }
    });
  }

  const guidesPageDelete = document.getElementById("guidesPageDelete");
  if (guidesPageDelete) {
    guidesPageDelete.addEventListener("click", async () => {
      if (!window.confirm(`Diesen Guide wirklich löschen?\n\n${slug}`)) return;
      try {
        setStatus("Guide wird gelöscht...");
        await deleteGuidePage(slug);
        setStatus("Guide erfolgreich gelöscht.", "success");
        await render();
      } catch (error) {
        setStatus(`Guide konnte nicht gelöscht werden: ${error.message}`, "error");
      }
    });
  }

  const guideBlockAdd = document.getElementById("guideBlockAdd");
  if (guideBlockAdd) {
    guideBlockAdd.addEventListener("click", async () => {
      const label = window.prompt("Interner Blockname / Schlüssel:", "new-block");
      const nextKey = slugifyGuide(label || "");
      if (!nextKey) return;
      if (sectionKeys.includes(nextKey)) {
        setStatus("Ein Block mit diesem Namen existiert bereits.", "error");
        return;
      }
      de.sections = de.sections || { seasonOrder: [], seasons: {} };
      en.sections = en.sections || { seasonOrder: [], seasons: {} };
      de.sections.seasons = de.sections.seasons || {};
      en.sections.seasons = en.sections.seasons || {};
      de.sections.seasons[nextKey] = createEmptyGuideBlock();
      en.sections.seasons[nextKey] = createEmptyGuideBlock();
      sectionKeys = [...sectionKeys, nextKey];
      de.sections.seasonOrder = [...sectionKeys];
      en.sections.seasonOrder = [...sectionKeys];
      state.cache[filePath] = { type: "json", data };
      setStatus(`Block ${nextKey} wurde angelegt. Bitte Inhalte ergänzen und speichern.`, "success");
      await bindGuidesPageManager();
    });
  }

  app.querySelectorAll("[data-guide-block-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.dataset.guideBlockDelete;
      if (!key) return;
      if (!window.confirm(`Block wirklich löschen?\n\n${key}`)) return;
      sectionKeys = sectionKeys.filter((entry) => entry !== key);
      if (de.sections?.seasons) delete de.sections.seasons[key];
      if (en.sections?.seasons) delete en.sections.seasons[key];
      de.sections.seasonOrder = [...sectionKeys];
      en.sections.seasonOrder = [...sectionKeys];
      state.cache[filePath] = { type: "json", data };
      setStatus(`Block ${key} entfernt. Bitte speichern, wenn die Änderung bleiben soll.`, "success");
      await bindGuidesPageManager();
    });
  });

  [
    ["[name='titleDe']", "[name='titleEn']"], ["[name='descriptionDe']", "[name='descriptionEn']"],
    ["[name='heroEyebrowDe']", "[name='heroEyebrowEn']"], ["[name='heroTitleDe']", "[name='heroTitleEn']"],
    ["[name='heroCopyDe']", "[name='heroCopyEn']"], ["[name='heroCtaDe']", "[name='heroCtaEn']"],
    ["[name='heroImageAltDe']", "[name='heroImageAltEn']"], ["[name='overviewEyebrowDe']", "[name='overviewEyebrowEn']"],
    ["[name='overviewCopyDe']", "[name='overviewCopyEn']"], ["[name='philosophyEyebrowDe']", "[name='philosophyEyebrowEn']"],
    ["[name='philosophyTitleDe']", "[name='philosophyTitleEn']"], ["[name='philosophyCopyDe']", "[name='philosophyCopyEn']"],
    ["[name='planningEyebrowDe']", "[name='planningEyebrowEn']"], ["[name='planningTitleDe']", "[name='planningTitleEn']"],
    ["[name='planningIntroDe']", "[name='planningIntroEn']"], ["[name='faqTitleDe']", "[name='faqTitleEn']"],
    ["[name='faqIntroDe']", "[name='faqIntroEn']"], ["[name='relatedEyebrowDe']", "[name='relatedEyebrowEn']"], ["[name='finalEyebrowDe']", "[name='finalEyebrowEn']"],
    ["[name='finalTitleDe']", "[name='finalTitleEn']"], ["[name='finalCopyDe']", "[name='finalCopyEn']"],
    ["[name='finalCtaDe']", "[name='finalCtaEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  pairedFacts.forEach((_, index) => {
    attachAutoTranslation(`[data-guide-fact-label-de="${index}"]`, `[data-guide-fact-label-en="${index}"]`);
    attachAutoTranslation(`[data-guide-fact-value-de="${index}"]`, `[data-guide-fact-value-en="${index}"]`);
  });

  sectionKeys.forEach((key) => {
    attachAutoTranslation(`[data-guide-block-alt-de="${key}"]`, `[data-guide-block-alt-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-eyebrow-de="${key}"]`, `[data-guide-block-eyebrow-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-title-de="${key}"]`, `[data-guide-block-title-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-intro-de="${key}"]`, `[data-guide-block-intro-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-copy-de="${key}"]`, `[data-guide-block-copy-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-points-de="${key}"]`, `[data-guide-block-points-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-note-de="${key}"]`, `[data-guide-block-note-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-meta-de="${key}"]`, `[data-guide-block-meta-en="${key}"]`);
    attachAutoTranslation(`[data-guide-block-link-label-de="${key}"]`, `[data-guide-block-link-label-en="${key}"]`);

    const deBlock = de.sections?.seasons?.[key] || {};
    const enBlock = en.sections?.seasons?.[key] || {};
    const factCount = Math.max(deBlock.facts?.length || 0, enBlock.facts?.length || 0);
    Array.from({ length: factCount }, (_, factIndex) => factIndex).forEach((factIndex) => {
      attachAutoTranslation(`[data-guide-block-fact-label-de="${key}-${factIndex}"]`, `[data-guide-block-fact-label-en="${key}-${factIndex}"]`);
      attachAutoTranslation(`[data-guide-block-fact-value-de="${key}-${factIndex}"]`, `[data-guide-block-fact-value-en="${key}-${factIndex}"]`);
    });
  });

  pairedPlanning.forEach((_, index) => {
    attachAutoTranslation(`[data-guide-planning-label-de="${index}"]`, `[data-guide-planning-label-en="${index}"]`);
    attachAutoTranslation(`[data-guide-planning-title-de="${index}"]`, `[data-guide-planning-title-en="${index}"]`);
    attachAutoTranslation(`[data-guide-planning-copy-de="${index}"]`, `[data-guide-planning-copy-en="${index}"]`);
    attachAutoTranslation(`[data-guide-planning-meta-de="${index}"]`, `[data-guide-planning-meta-en="${index}"]`);
  });

  pairedFaq.forEach((_, index) => {
    attachAutoTranslation(`[data-guide-faq-q-de="${index}"]`, `[data-guide-faq-q-en="${index}"]`);
    attachAutoTranslation(`[data-guide-faq-a-de="${index}"]`, `[data-guide-faq-a-en="${index}"]`);
  });

  pairedRelated.forEach((_, index) => {
    attachAutoTranslation(`[data-guide-related-label-de="${index}"]`, `[data-guide-related-label-en="${index}"]`);
    attachAutoTranslation(`[data-guide-related-title-de="${index}"]`, `[data-guide-related-title-en="${index}"]`);
    attachAutoTranslation(`[data-guide-related-copy-de="${index}"]`, `[data-guide-related-copy-en="${index}"]`);
  });

  const guidesPageHeroUpload = document.getElementById("guidesPageHeroUpload");
  if (guidesPageHeroUpload) {
    guidesPageHeroUpload.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      try {
        setStatus("Guide Hero Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.hero = de.hero || {};
        en.hero = en.hero || {};
        de.hero.image = uploadedPath;
        en.hero.image = uploadedPath;
        if (!String(de.hero.imageAlt || "").trim()) {
          de.hero.imageAlt = buildAutoAltFromImagePath(fileToUpload.name, "Guide Hero Bild");
        }
        if (!String(en.hero.imageAlt || "").trim() && String(de.hero.imageAlt || "").trim()) {
          try {
            en.hero.imageAlt = await translateCmsText(de.hero.imageAlt, "de", "en");
          } catch {
            en.hero.imageAlt = "";
          }
        }
        state.cache[filePath] = { type: "json", data };
        await saveFile(filePath, { type: "json", data });
        await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
        await syncGuidePreviewIntoHub(slug, data);
        setStatus("Guide Hero Bild erfolgreich hochgeladen und gespeichert.", "success");
        await bindGuidesPageManager();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  }

  const guidesPageHeroClear = document.getElementById("guidesPageHeroClear");
  if (guidesPageHeroClear) {
    guidesPageHeroClear.addEventListener("click", async () => {
      de.hero = de.hero || {};
      en.hero = en.hero || {};
      de.hero.image = "";
      en.hero.image = "";
      de.hero.imageAlt = "";
      en.hero.imageAlt = "";
      state.cache[filePath] = { type: "json", data };
      await saveFile(filePath, { type: "json", data });
      await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
      await syncGuidePreviewIntoHub(slug, data);
      setStatus("Guide Hero Bild entfernt und gespeichert.", "success");
      await bindGuidesPageManager();
    });
  }

  app.querySelectorAll("[data-guide-block-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      const key = event.target.dataset.guideBlockUpload;
      if (!fileToUpload || !key) return;
      try {
        setStatus(`Guide-Bild für Block ${key} wird hochgeladen...`);
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.sections = de.sections || { seasonOrder: sectionKeys, seasons: {} };
        en.sections = en.sections || { seasonOrder: sectionKeys, seasons: {} };
        de.sections.seasons = de.sections.seasons || {};
        en.sections.seasons = en.sections.seasons || {};
        de.sections.seasons[key] = de.sections.seasons[key] || {};
        en.sections.seasons[key] = en.sections.seasons[key] || {};
        de.sections.seasons[key].image = uploadedPath;
        en.sections.seasons[key].image = uploadedPath;
        if (!String(de.sections.seasons[key].imageAlt || "").trim()) {
          de.sections.seasons[key].imageAlt = buildAutoAltFromImagePath(fileToUpload.name, `Guide Block ${key}`);
        }
        if (!String(en.sections.seasons[key].imageAlt || "").trim() && String(de.sections.seasons[key].imageAlt || "").trim()) {
          try {
            en.sections.seasons[key].imageAlt = await translateCmsText(de.sections.seasons[key].imageAlt, "de", "en");
          } catch {
            en.sections.seasons[key].imageAlt = "";
          }
        }
        state.cache[filePath] = { type: "json", data };
        await saveFile(filePath, { type: "json", data });
        await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
        await syncGuidePreviewIntoHub(slug, data);
        setStatus(`Guide-Bild für Block ${key} erfolgreich hochgeladen und gespeichert.`, "success");
        await bindGuidesPageManager();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-guide-block-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.dataset.guideBlockClear;
      if (!key) return;
      de.sections = de.sections || { seasonOrder: sectionKeys, seasons: {} };
      en.sections = en.sections || { seasonOrder: sectionKeys, seasons: {} };
      de.sections.seasons = de.sections.seasons || {};
      en.sections.seasons = en.sections.seasons || {};
      de.sections.seasons[key] = de.sections.seasons[key] || {};
      en.sections.seasons[key] = en.sections.seasons[key] || {};
      de.sections.seasons[key].image = "";
      en.sections.seasons[key].image = "";
      de.sections.seasons[key].imageAlt = "";
      en.sections.seasons[key].imageAlt = "";
      state.cache[filePath] = { type: "json", data };
      await saveFile(filePath, { type: "json", data });
      await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
      await syncGuidePreviewIntoHub(slug, data);
      setStatus(`Guide-Bild für Block ${key} entfernt und gespeichert.`, "success");
      await bindGuidesPageManager();
    });
  });

  app.querySelectorAll("[data-guide-related-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      const index = Number(event.target.dataset.guideRelatedUpload);
      if (!fileToUpload || Number.isNaN(index)) return;
      try {
        setStatus(`Bild für verwandten Leitfaden ${index + 1} wird hochgeladen...`);
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        de.related = de.related || { eyebrow: "", items: [] };
        en.related = en.related || { eyebrow: "", items: [] };
        de.related.items = Array.isArray(de.related.items) ? de.related.items : [];
        en.related.items = Array.isArray(en.related.items) ? en.related.items : [];
        de.related.items[index] = de.related.items[index] || {};
        en.related.items[index] = en.related.items[index] || {};
        de.related.items[index].image = uploadedPath;
        en.related.items[index].image = uploadedPath;
        state.cache[filePath] = { type: "json", data };
        await saveFile(filePath, { type: "json", data });
        await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
        setStatus(`Bild für verwandten Leitfaden ${index + 1} gespeichert.`, "success");
        await bindGuidesPageManager();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-guide-related-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.guideRelatedClear);
      if (Number.isNaN(index)) return;
      de.related = de.related || { eyebrow: "", items: [] };
      en.related = en.related || { eyebrow: "", items: [] };
      de.related.items = Array.isArray(de.related.items) ? de.related.items : [];
      en.related.items = Array.isArray(en.related.items) ? en.related.items : [];
      de.related.items[index] = de.related.items[index] || {};
      en.related.items[index] = en.related.items[index] || {};
      de.related.items[index].image = "";
      en.related.items[index].image = "";
      state.cache[filePath] = { type: "json", data };
      await saveFile(filePath, { type: "json", data });
      await syncInlineGuidesHtml(`guides/${slug}/index.html`, data);
      setStatus(`Bild für verwandten Leitfaden ${index + 1} entfernt.`, "success");
      await bindGuidesPageManager();
    });
  });

  document.getElementById("guidesPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const sharedHeroImage = form.heroImage.value.trim();
    const buildBlock = (lang, key) => {
      const prefix = lang === "de" ? "de" : "en";
      const get = (field) => form.querySelector(`[data-guide-block-${field}-${prefix}="${key}"]`)?.value || "";
      const points = (form.querySelector(`[data-guide-block-points-${prefix}="${key}"]`)?.value || "").split("\n").map((item) => item.trim()).filter(Boolean);
      const deBlock = de.sections?.seasons?.[key] || {};
      const enBlock = en.sections?.seasons?.[key] || {};
      const sourceBlock = lang === "de" ? deBlock : enBlock;
      const otherBlock = lang === "de" ? enBlock : deBlock;
      const factCount = Math.max(deBlock.facts?.length || 0, enBlock.facts?.length || 0);
      return {
        layout: form.querySelector(`[data-guide-block-layout="${key}"]`)?.value || sourceBlock.layout || otherBlock.layout || "",
        image: form.querySelector(`[data-guide-block-image="${key}"]`)?.value || sourceBlock.image || otherBlock.image || "",
        imageAlt: get("alt"),
        eyebrow: get("eyebrow"),
        title: get("title"),
        intro: get("intro"),
        copy: get("copy"),
        points,
        facts: Array.from({ length: factCount }, (_, factIndex) => ({
          icon: form.querySelector(`[data-guide-block-fact-icon="${key}-${factIndex}"]`)?.value || "",
          label: form.querySelector(`[data-guide-block-fact-label-${prefix}="${key}-${factIndex}"]`)?.value || "",
          value: form.querySelector(`[data-guide-block-fact-value-${prefix}="${key}-${factIndex}"]`)?.value || ""
        })).filter((item) => item.icon || item.label || item.value),
        note: get("note"),
        meta: get("meta"),
        linkLabel: get("link-label"),
        linkHref: form.querySelector(`[data-guide-block-link-href="${key}"]`)?.value || sourceBlock.linkHref || otherBlock.linkHref || ""
      };
    };

    const nextData = {
      de: {
        ...de,
        title: form.titleDe.value,
        description: form.descriptionDe.value,
        hero: {
          ...de.hero,
          eyebrow: form.heroEyebrowDe.value,
          title: form.heroTitleDe.value,
          copy: form.heroCopyDe.value,
          cta: form.heroCtaDe.value,
          image: sharedHeroImage,
          imageAlt: form.heroImageAltDe.value
        },
        overview: {
          ...de.overview,
          eyebrow: form.overviewEyebrowDe.value,
          copy: form.overviewCopyDe.value,
          items: pairedFacts.map((_, index) => ({
            icon: form.querySelector(`[data-guide-fact-icon="${index}"]`)?.value || "",
            label: form.querySelector(`[data-guide-fact-label-de="${index}"]`)?.value || "",
            value: form.querySelector(`[data-guide-fact-value-de="${index}"]`)?.value || ""
          })).filter((item) => item.icon || item.label || item.value)
        },
        philosophy: {
          ...de.philosophy,
          eyebrow: form.philosophyEyebrowDe.value,
          title: form.philosophyTitleDe.value,
          copy: form.philosophyCopyDe.value
        },
        sections: {
          seasonOrder: sectionKeys,
          seasons: Object.fromEntries(sectionKeys.map((key) => [key, buildBlock("de", key)]))
        },
        planning: {
          ...de.planning,
          eyebrow: form.planningEyebrowDe.value,
          title: form.planningTitleDe.value,
          intro: form.planningIntroDe.value,
          items: pairedPlanning.map((_, index) => ({
            label: form.querySelector(`[data-guide-planning-label-de="${index}"]`)?.value || "",
            title: form.querySelector(`[data-guide-planning-title-de="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guide-planning-copy-de="${index}"]`)?.value || "",
            meta: form.querySelector(`[data-guide-planning-meta-de="${index}"]`)?.value || ""
          })).filter((item) => item.label || item.title || item.copy || item.meta)
        },
        faq: {
          ...de.faq,
          title: form.faqTitleDe.value,
          intro: form.faqIntroDe.value,
          items: pairedFaq.map((_, index) => ({
            q: form.querySelector(`[data-guide-faq-q-de="${index}"]`)?.value || "",
            a: form.querySelector(`[data-guide-faq-a-de="${index}"]`)?.value || ""
          })).filter((item) => item.q || item.a)
        },
        related: {
          ...de.related,
          eyebrow: form.relatedEyebrowDe.value,
          items: pairedRelated.map((_, index) => ({
            label: form.querySelector(`[data-guide-related-label-de="${index}"]`)?.value || "",
            title: form.querySelector(`[data-guide-related-title-de="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guide-related-copy-de="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guide-related-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guide-related-image="${index}"]`)?.value || ""
          })).filter((item) => item.label || item.title || item.copy || item.href || item.image)
        },
        final: {
          ...de.final,
          eyebrow: form.finalEyebrowDe.value,
          title: form.finalTitleDe.value,
          copy: form.finalCopyDe.value,
          cta: form.finalCtaDe.value
        }
      },
      en: {
        ...en,
        title: form.titleEn.value,
        description: form.descriptionEn.value,
        hero: {
          ...en.hero,
          eyebrow: form.heroEyebrowEn.value,
          title: form.heroTitleEn.value,
          copy: form.heroCopyEn.value,
          cta: form.heroCtaEn.value,
          image: sharedHeroImage,
          imageAlt: form.heroImageAltEn.value
        },
        overview: {
          ...en.overview,
          eyebrow: form.overviewEyebrowEn.value,
          copy: form.overviewCopyEn.value,
          items: pairedFacts.map((_, index) => ({
            icon: form.querySelector(`[data-guide-fact-icon="${index}"]`)?.value || "",
            label: form.querySelector(`[data-guide-fact-label-en="${index}"]`)?.value || "",
            value: form.querySelector(`[data-guide-fact-value-en="${index}"]`)?.value || ""
          })).filter((item) => item.icon || item.label || item.value)
        },
        philosophy: {
          ...en.philosophy,
          eyebrow: form.philosophyEyebrowEn.value,
          title: form.philosophyTitleEn.value,
          copy: form.philosophyCopyEn.value
        },
        sections: {
          seasonOrder: sectionKeys,
          seasons: Object.fromEntries(sectionKeys.map((key) => [key, buildBlock("en", key)]))
        },
        planning: {
          ...en.planning,
          eyebrow: form.planningEyebrowEn.value,
          title: form.planningTitleEn.value,
          intro: form.planningIntroEn.value,
          items: pairedPlanning.map((_, index) => ({
            label: form.querySelector(`[data-guide-planning-label-en="${index}"]`)?.value || "",
            title: form.querySelector(`[data-guide-planning-title-en="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guide-planning-copy-en="${index}"]`)?.value || "",
            meta: form.querySelector(`[data-guide-planning-meta-en="${index}"]`)?.value || ""
          })).filter((item) => item.label || item.title || item.copy || item.meta)
        },
        faq: {
          ...en.faq,
          title: form.faqTitleEn.value,
          intro: form.faqIntroEn.value,
          items: pairedFaq.map((_, index) => ({
            q: form.querySelector(`[data-guide-faq-q-en="${index}"]`)?.value || "",
            a: form.querySelector(`[data-guide-faq-a-en="${index}"]`)?.value || ""
          })).filter((item) => item.q || item.a)
        },
        related: {
          ...en.related,
          eyebrow: form.relatedEyebrowEn.value,
          items: pairedRelated.map((_, index) => ({
            label: form.querySelector(`[data-guide-related-label-en="${index}"]`)?.value || "",
            title: form.querySelector(`[data-guide-related-title-en="${index}"]`)?.value || "",
            copy: form.querySelector(`[data-guide-related-copy-en="${index}"]`)?.value || "",
            href: form.querySelector(`[data-guide-related-href="${index}"]`)?.value || "",
            image: form.querySelector(`[data-guide-related-image="${index}"]`)?.value || ""
          })).filter((item) => item.label || item.title || item.copy || item.href || item.image)
        },
        final: {
          ...en.final,
          eyebrow: form.finalEyebrowEn.value,
          title: form.finalTitleEn.value,
          copy: form.finalCopyEn.value,
          cta: form.finalCtaEn.value
        }
      }
    };

    setStatus("Guide-Unterseite wird gespeichert...");
    try {
      await saveFile(filePath, { type: "json", data: nextData });
      await syncInlineGuidesHtml(`guides/${slug}/index.html`, nextData);
      await syncGuidePreviewIntoHub(slug, nextData);
      const indexFile = await ensureFile(GUIDES_INDEX_FILE);
      const nextIndex = structuredClone(indexFile.data);
      nextIndex.pages = (nextIndex.pages || []).map((item) => item.slug === slug ? { ...item, titleDe: nextData.de.hero?.title || item.titleDe, titleEn: nextData.en.hero?.title || item.titleEn } : item);
      await saveFile(GUIDES_INDEX_FILE, { type: "json", data: nextIndex });
      setStatus("Guide-Unterseite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) openPreviewInNewTab(getPreviewUrl());
      else await render();
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const deleteUploadFromLibrary = async (imageUrl) => {
  const filename = decodeURIComponent(String(imageUrl || "").split("/").pop() || "");
  if (!filename) {
    throw new Error("Kein Dateiname gefunden");
  }
  await api("/api/delete-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename })
  });
  await loadUploads();
};

const deleteEditableEntry = async (path) => {
  await api("/api/delete-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });
};

const createImageMetaEntryFromUpload = async (imageUrl) => {
  const normalizedUrl = normalizeImagePath(imageUrl);
  if (!normalizedUrl) {
    throw new Error("Kein Bildpfad gefunden");
  }

  const files = listByPrefix(IMAGE_META_PREFIX);
  for (const file of files) {
    const parsed = await ensureFile(file);
    if (normalizeImagePath(parsed.data?.image) === normalizedUrl) {
      return file;
    }
  }

  const filename = normalizedUrl.split("/").pop() || "bild";
  const baseTitle = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const safeTitle = baseTitle || "Bild";
  const baseSlug = slugify(safeTitle) || "bild";
  let candidatePath = `${IMAGE_META_PREFIX}${baseSlug}.md`;
  let counter = 2;

  while (files.includes(candidatePath)) {
    candidatePath = `${IMAGE_META_PREFIX}${baseSlug}-${counter}.md`;
    counter += 1;
  }

  const template = buildMarkdown({
    title: safeTitle,
    image: normalizedUrl,
    lang: "neutral",
    alt: "",
    altPrompt: "",
    keywords: []
  }, "");

  await api("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: candidatePath, content: template })
  });

  state.files = await api("/api/files").then((response) => response.files);
  state.cache[candidatePath] = parseContentFile(candidatePath, template);
  return candidatePath;
};

const bindHomepage = async (viewId) => {
  const germanPath = HOMEPAGE_FILES["homepage-de"];
  const englishPath = HOMEPAGE_FILES["homepage-en"];
  const germanFile = await ensureFile(germanPath);
  const englishFile = await ensureFile(englishPath);
  const dataDe = structuredClone(germanFile.data);
  const dataEn = structuredClone(englishFile.data);

  const renderLangFieldPair = (label, name, valueDe, valueEn, type = "input") => `
    <div class="field-grid-2">
      <div class="field">
        <label>${label} DE</label>
        ${type === "textarea"
          ? `<textarea name="${name}.de">${escapeHtml(valueDe || "")}</textarea>`
          : `<input type="text" name="${name}.de" value="${escapeHtml(valueDe || "")}">`}
      </div>
      <div class="field">
        <label>${label} EN</label>
        ${type === "textarea"
          ? `<textarea name="${name}.en">${escapeHtml(valueEn || "")}</textarea>`
          : `<input type="text" name="${name}.en" value="${escapeHtml(valueEn || "")}">`}
      </div>
    </div>
  `;

  const renderBilingualList = (itemsDe, itemsEn, groupName, label) => {
    const maxItems = Math.max(itemsDe.length, itemsEn.length, 1);
    return `
      <div class="array-list">
        ${Array.from({ length: maxItems }, (_, index) => `
          <div class="array-item">
            <div class="field-grid-2">
              <div class="field">
                <label>${label} ${index + 1} DE</label>
                <input type="text" data-array-group="${groupName}-de" data-array-index="${index}" value="${escapeHtml(itemsDe[index] || "")}">
              </div>
              <div class="field">
                <label>${label} ${index + 1} EN</label>
                <input type="text" data-array-group="${groupName}-en" data-array-index="${index}" value="${escapeHtml(itemsEn[index] || "")}">
              </div>
            </div>
            <button class="button danger" type="button" data-remove-bilingual-array="${groupName}" data-array-index="${index}">Eintrag entfernen</button>
          </div>
        `).join("")}
      </div>
    `;
  };

  const faqLength = Math.max((dataDe.faq || []).length, (dataEn.faq || []).length, 1);

  app.innerHTML = `
    <section class="panel">
      <div class="empty" style="margin-bottom: 18px;">
        Homepage Deutsch und Englisch werden hier gemeinsam gepflegt. Links Deutsch, rechts Englisch.
      </div>
      <form class="form-grid" id="homepageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">DE: ${escapeHtml(germanPath)}<br>EN: ${escapeHtml(englishPath)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/index.html?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Homepage öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <h2 class="section-title">SEO</h2>
        ${renderLangFieldPair("Meta Title", "metaTitle", dataDe.metaTitle, dataEn.metaTitle)}
        ${renderLangFieldPair("Meta Description", "metaDescription", dataDe.metaDescription, dataEn.metaDescription, "textarea")}

        <h2 class="section-title">Hero</h2>
        <div class="field">
          <label>Hero Bild Rotation</label>
          <div class="muted" style="margin-bottom: 12px;">Diese Bilder werden auf der Startseite bei jedem neuen Laden zufällig gewechselt.</div>
          <div class="array-list" id="homepageHeroImagesList">
            ${(Array.isArray(dataDe.heroImages) ? dataDe.heroImages : []).map((item, index) => `
              <div class="array-item">
                <div class="field">
                  <label>Hero Bild ${index + 1}</label>
                  <input type="text" data-home-hero-image="${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                  <div class="upload-inline" style="margin-top: 10px;">
                    <label>
                      Hero Bild hochladen
                      <input type="file" data-home-hero-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                    </label>
                    <button class="button danger" type="button" data-home-hero-clear="${index}">Bild entfernen</button>
                  </div>
                  <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(item.image || "URL wird nach Upload automatisch erzeugt.")}</div>
                  ${item.image ? `
                    <div class="inline-image-preview">
                      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.altEn || `Hero ${index + 1}`)}">
                      <span>${escapeHtml(item.image)}</span>
                    </div>
                  ` : ""}
                </div>
                <div class="field-grid-2">
                  <div class="field">
                    <label>ALT DE ${index + 1}</label>
                    <textarea data-home-hero-alt="${index}">${escapeHtml(item.alt || "")}</textarea>
                  </div>
                  <div class="field">
                    <label>ALT EN ${index + 1}</label>
                    <textarea data-home-hero-alt-en="${index}">${escapeHtml(item.altEn || "")}</textarea>
                  </div>
                </div>
                <button class="button danger" type="button" data-remove-home-hero="${index}">Eintrag entfernen</button>
              </div>
            `).join("")}
          </div>
          <div class="actions">
            <button class="button secondary" type="button" id="addHomepageHeroImage">Hero Bild hinzufügen</button>
          </div>
        </div>
        ${renderLangFieldPair("Eyebrow", "hero.eyebrow", dataDe.hero.eyebrow, dataEn.hero.eyebrow)}
        ${renderLangFieldPair("Title", "hero.title", dataDe.hero.title, dataEn.hero.title, "textarea")}
        ${renderLangFieldPair("Hero Text", "hero.copy", dataDe.hero.copy, dataEn.hero.copy, "textarea")}
        ${renderLangFieldPair("Primary CTA", "hero.primaryCta", dataDe.hero.primaryCta, dataEn.hero.primaryCta)}
        ${renderLangFieldPair("Secondary CTA", "hero.secondaryCta", dataDe.hero.secondaryCta, dataEn.hero.secondaryCta)}

        <h2 class="section-title">Über mich / About</h2>
        <div class="empty" style="margin-bottom: 18px;">
          Hier bearbeitest du den Textblock unter „Ruhige Bilder mit Tiefe und Leichtigkeit“ auf der Startseite. Jeder Absatz kann links auf Deutsch und rechts auf Englisch gepflegt werden.
        </div>
        ${renderLangFieldPair("Section Title", "about.title", dataDe.about.title, dataEn.about.title)}
        ${renderLangFieldPair("Textblock Absatz 1", "about.copy1", dataDe.about.copy1, dataEn.about.copy1, "textarea")}
        ${renderLangFieldPair("Textblock Absatz 2", "about.copy2", dataDe.about.copy2, dataEn.about.copy2, "textarea")}
        ${renderLangFieldPair("Textblock Absatz 3", "about.copy3", dataDe.about.copy3, dataEn.about.copy3, "textarea")}
        ${renderLangFieldPair("Textblock Absatz 4", "about.copy4", dataDe.about.copy4, dataEn.about.copy4, "textarea")}
        ${renderLangFieldPair("Label Studio", "about.metaLabelStudio", dataDe.about.metaLabelStudio, dataEn.about.metaLabelStudio)}
        ${renderLangFieldPair("Studio", "about.metaStudio", dataDe.about.metaStudio, dataEn.about.metaStudio)}
        ${renderLangFieldPair("Label Name", "about.metaLabelName", dataDe.about.metaLabelName, dataEn.about.metaLabelName)}
        ${renderLangFieldPair("Name", "about.metaName", dataDe.about.metaName, dataEn.about.metaName)}
        ${renderLangFieldPair("Label Standort", "about.metaLabelLocation", dataDe.about.metaLabelLocation, dataEn.about.metaLabelLocation)}
        ${renderLangFieldPair("Standort", "about.metaLocation", dataDe.about.metaLocation, dataEn.about.metaLocation)}
        ${renderLangFieldPair("Label E-Mail", "about.metaLabelEmail", dataDe.about.metaLabelEmail, dataEn.about.metaLabelEmail)}
        ${renderLangFieldPair("E-Mail", "about.metaEmail", dataDe.about.metaEmail, dataEn.about.metaEmail)}
        ${renderLangFieldPair("Label Telefon", "about.metaLabelPhone", dataDe.about.metaLabelPhone, dataEn.about.metaLabelPhone)}
        ${renderLangFieldPair("Telefon", "about.metaPhone", dataDe.about.metaPhone, dataEn.about.metaPhone)}

        <h2 class="section-title">Journal Startseite</h2>
        ${renderLangFieldPair("Eyebrow", "journal.eyebrow", dataDe.journal?.eyebrow, dataEn.journal?.eyebrow)}
        ${renderLangFieldPair("Überschrift", "journal.title", dataDe.journal?.title, dataEn.journal?.title, "textarea")}
        ${renderLangFieldPair("Linktext", "journal.link", dataDe.journal?.link, dataEn.journal?.link)}

        <h2 class="section-title">Portfolio Galerie</h2>
        ${renderLangFieldPair("Portfolio Eyebrow", "portfolio.eyebrow", dataDe.portfolio?.eyebrow, dataEn.portfolio?.eyebrow)}
        ${renderLangFieldPair("Portfolio Überschrift", "portfolio.title", dataDe.portfolio?.title, dataEn.portfolio?.title, "textarea")}
        <div class="array-list" id="homepagePortfolioGalleryList">
          ${(Array.isArray(dataDe.portfolioGallery) ? dataDe.portfolioGallery : []).map((item, index) => `
            <div class="array-item">
              <div class="field">
                <label>Bild ${index + 1}</label>
                <input type="text" data-portfolio-image="${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                <div class="upload-inline" style="margin-top: 10px;">
                  <label>
                    Portfolio Bild hochladen
                    <input type="file" data-portfolio-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                  </label>
                  <button class="button danger" type="button" data-portfolio-clear="${index}">Bild entfernen</button>
                </div>
                <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(item.image || "URL wird nach Upload automatisch erzeugt.")}</div>
                ${item.image ? `
                  <div class="inline-image-preview">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.altEn || `Portfolio ${index + 1}`)}">
                    <span>${escapeHtml(item.image)}</span>
                  </div>
                ` : ""}
              </div>
              <div class="field-grid-2">
                <div class="field">
                  <label>ALT DE ${index + 1}</label>
                  <textarea data-portfolio-alt="${index}">${escapeHtml(item.alt || "")}</textarea>
                </div>
                <div class="field">
                  <label>ALT EN ${index + 1}</label>
                  <textarea data-portfolio-alt-en="${index}">${escapeHtml(item.altEn || "")}</textarea>
                </div>
              </div>
              <button class="button danger" type="button" data-remove-portfolio="${index}">Eintrag entfernen</button>
            </div>
          `).join("")}
        </div>
        <div class="actions">
          <button class="button secondary" type="button" id="addPortfolioGalleryImage">Portfolio Bild hinzufügen</button>
        </div>

        <h2 class="section-title">FAQ</h2>
        <div class="array-list" id="faqList">
          ${Array.from({ length: faqLength }, (_, index) => `
            <div class="array-item">
              <div class="field-grid-2">
                <div class="field">
                  <label>Frage ${index + 1} DE</label>
                  <input type="text" data-faq-question-de="${index}" value="${escapeHtml(dataDe.faq?.[index]?.question || "")}">
                </div>
                <div class="field">
                  <label>Frage ${index + 1} EN</label>
                  <input type="text" data-faq-question-en="${index}" value="${escapeHtml(dataEn.faq?.[index]?.question || "")}">
                </div>
              </div>
              <div class="field-grid-2">
                <div class="field">
                  <label>Antwort ${index + 1} DE</label>
                  <textarea data-faq-answer-de="${index}">${escapeHtml(dataDe.faq?.[index]?.answer || "")}</textarea>
                </div>
                <div class="field">
                  <label>Antwort ${index + 1} EN</label>
                  <textarea data-faq-answer-en="${index}">${escapeHtml(dataEn.faq?.[index]?.answer || "")}</textarea>
                </div>
              </div>
              <button class="button danger" type="button" data-remove-faq="${index}">FAQ entfernen</button>
            </div>
          `).join("")}
        </div>
        <div class="actions">
          <button class="button secondary" type="button" id="addFaqButton">FAQ hinzufügen</button>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const rerender = async () => {
    state.cache[germanPath] = { type: "json", data: dataDe };
    state.cache[englishPath] = { type: "json", data: dataEn };
    await bindHomepage(viewId);
  };

  app.querySelector("#addFaqButton").addEventListener("click", async () => {
    dataDe.faq = Array.isArray(dataDe.faq) ? dataDe.faq : [];
    dataEn.faq = Array.isArray(dataEn.faq) ? dataEn.faq : [];
    dataDe.faq.push({ question: "", answer: "" });
    dataEn.faq.push({ question: "", answer: "" });
    await rerender();
  });

  app.querySelector("#addHomepageHeroImage").addEventListener("click", async () => {
    dataDe.heroImages = Array.isArray(dataDe.heroImages) ? dataDe.heroImages : [];
    dataDe.heroImages.push({ image: "", alt: "", altEn: "" });
    await rerender();
  });

  app.querySelectorAll("[data-home-hero-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const index = Number(event.target.dataset.homeHeroUpload);
      try {
        setStatus("Hero Rotationsbild wird hochgeladen...");
        dataDe.heroImages = Array.isArray(dataDe.heroImages) ? dataDe.heroImages : [];
        dataDe.heroImages[index].image = await uploadFileToLibrary(fileToUpload);
        setStatus("Hero Rotationsbild erfolgreich hochgeladen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-home-hero-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.homeHeroClear);
      dataDe.heroImages[index].image = "";
      dataDe.heroImages[index].alt = "";
      dataDe.heroImages[index].altEn = "";
      setStatus("Hero Rotationsbild und ALT-Texte entfernt.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-remove-home-hero]").forEach((button) => {
    button.addEventListener("click", async () => {
      dataDe.heroImages.splice(Number(button.dataset.removeHomeHero), 1);
      await rerender();
    });
  });

  app.querySelector("#addPortfolioGalleryImage").addEventListener("click", async () => {
    dataDe.portfolioGallery = Array.isArray(dataDe.portfolioGallery) ? dataDe.portfolioGallery : [];
    dataDe.portfolioGallery.push({ image: "", alt: "", altEn: "" });
    await rerender();
  });

  app.querySelectorAll("[data-portfolio-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const index = Number(event.target.dataset.portfolioUpload);
      try {
        setStatus("Portfolio Bild wird hochgeladen...");
        dataDe.portfolioGallery[index].image = await uploadFileToLibrary(fileToUpload);
        setStatus("Portfolio Bild erfolgreich hochgeladen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-portfolio-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.portfolioClear);
      dataDe.portfolioGallery[index].image = "";
      dataDe.portfolioGallery[index].alt = "";
      dataDe.portfolioGallery[index].altEn = "";
      setStatus("Portfolio Bild und ALT-Texte entfernt.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-remove-portfolio]").forEach((button) => {
    button.addEventListener("click", async () => {
      dataDe.portfolioGallery.splice(Number(button.dataset.removePortfolio), 1);
      await rerender();
    });
  });

  app.querySelectorAll("[data-remove-faq]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.removeFaq);
      dataDe.faq.splice(index, 1);
      dataEn.faq.splice(index, 1);
      await rerender();
    });
  });

  [
    ["[name='metaTitle.de']", "[name='metaTitle.en']"],
    ["[name='metaDescription.de']", "[name='metaDescription.en']"],
    ["[name='hero.eyebrow.de']", "[name='hero.eyebrow.en']"],
    ["[name='hero.title.de']", "[name='hero.title.en']"],
    ["[name='hero.copy.de']", "[name='hero.copy.en']"],
    ["[name='hero.primaryCta.de']", "[name='hero.primaryCta.en']"],
    ["[name='hero.secondaryCta.de']", "[name='hero.secondaryCta.en']"],
    ["[name='about.title.de']", "[name='about.title.en']"],
    ["[name='about.copy1.de']", "[name='about.copy1.en']"],
    ["[name='about.copy2.de']", "[name='about.copy2.en']"],
    ["[name='about.copy3.de']", "[name='about.copy3.en']"],
    ["[name='about.copy4.de']", "[name='about.copy4.en']"],
    ["[name='about.metaLabelStudio.de']", "[name='about.metaLabelStudio.en']"],
    ["[name='about.metaStudio.de']", "[name='about.metaStudio.en']"],
    ["[name='about.metaLabelName.de']", "[name='about.metaLabelName.en']"],
    ["[name='about.metaName.de']", "[name='about.metaName.en']"],
    ["[name='about.metaLabelLocation.de']", "[name='about.metaLabelLocation.en']"],
    ["[name='about.metaLocation.de']", "[name='about.metaLocation.en']"],
    ["[name='about.metaLabelEmail.de']", "[name='about.metaLabelEmail.en']"],
    ["[name='about.metaEmail.de']", "[name='about.metaEmail.en']"],
    ["[name='about.metaLabelPhone.de']", "[name='about.metaLabelPhone.en']"],
    ["[name='about.metaPhone.de']", "[name='about.metaPhone.en']"],
    ["[name='journal.eyebrow.de']", "[name='journal.eyebrow.en']"],
    ["[name='journal.title.de']", "[name='journal.title.en']"],
    ["[name='journal.link.de']", "[name='journal.link.en']"],
    ["[name='portfolio.eyebrow.de']", "[name='portfolio.eyebrow.en']"],
    ["[name='portfolio.title.de']", "[name='portfolio.title.en']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));
  app.querySelectorAll("[data-faq-question-de]").forEach((sourceNode, index) => {
    attachAutoTranslation(`[data-faq-question-de='${index}']`, `[data-faq-question-en='${index}']`);
    attachAutoTranslation(`[data-faq-answer-de='${index}']`, `[data-faq-answer-en='${index}']`);
  });
  app.querySelectorAll("[data-home-hero-alt]").forEach((sourceNode, index) => {
    attachAutoTranslation(`[data-home-hero-alt='${index}']`, `[data-home-hero-alt-en='${index}']`);
  });
  app.querySelectorAll("[data-portfolio-alt]").forEach((sourceNode, index) => {
    attachAutoTranslation(`[data-portfolio-alt='${index}']`, `[data-portfolio-alt-en='${index}']`);
  });

  app.querySelector("#homepageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const get = (name) => form.querySelector(`[name="${name}"]`)?.value || "";
    const shouldOpenPreview = event.submitter?.value === "true";

    dataDe.metaTitle = get("metaTitle.de");
    dataEn.metaTitle = get("metaTitle.en");
    dataDe.metaDescription = get("metaDescription.de");
    dataEn.metaDescription = get("metaDescription.en");
    const heroImages = Array.from(form.querySelectorAll("[data-home-hero-image]")).map((input, index) => ({
      image: input.value,
      alt: form.querySelector(`[data-home-hero-alt="${index}"]`)?.value || "",
      altEn: form.querySelector(`[data-home-hero-alt-en="${index}"]`)?.value || ""
    })).filter((item) => item.image || item.alt || item.altEn);
    dataDe.heroImages = heroImages;
    dataEn.heroImages = structuredClone(heroImages);

    dataDe.hero.eyebrow = get("hero.eyebrow.de");
    dataEn.hero.eyebrow = get("hero.eyebrow.en");
    dataDe.hero.title = get("hero.title.de");
    dataEn.hero.title = get("hero.title.en");
    dataDe.hero.copy = get("hero.copy.de");
    dataEn.hero.copy = get("hero.copy.en");
    dataDe.hero.primaryCta = get("hero.primaryCta.de");
    dataEn.hero.primaryCta = get("hero.primaryCta.en");
    dataDe.hero.secondaryCta = get("hero.secondaryCta.de");
    dataEn.hero.secondaryCta = get("hero.secondaryCta.en");

    dataDe.about.title = get("about.title.de");
    dataEn.about.title = get("about.title.en");
    dataDe.about.copy1 = get("about.copy1.de");
    dataEn.about.copy1 = get("about.copy1.en");
    dataDe.about.copy2 = get("about.copy2.de");
    dataEn.about.copy2 = get("about.copy2.en");
    dataDe.about.copy3 = get("about.copy3.de");
    dataEn.about.copy3 = get("about.copy3.en");
    dataDe.about.copy4 = get("about.copy4.de");
    dataEn.about.copy4 = get("about.copy4.en");
    dataDe.about.metaLabelStudio = get("about.metaLabelStudio.de");
    dataEn.about.metaLabelStudio = get("about.metaLabelStudio.en");
    dataDe.about.metaStudio = get("about.metaStudio.de");
    dataEn.about.metaStudio = get("about.metaStudio.en");
    dataDe.about.metaLabelName = get("about.metaLabelName.de");
    dataEn.about.metaLabelName = get("about.metaLabelName.en");
    dataDe.about.metaName = get("about.metaName.de");
    dataEn.about.metaName = get("about.metaName.en");
    dataDe.about.metaLabelLocation = get("about.metaLabelLocation.de");
    dataEn.about.metaLabelLocation = get("about.metaLabelLocation.en");
    dataDe.about.metaLocation = get("about.metaLocation.de");
    dataEn.about.metaLocation = get("about.metaLocation.en");
    dataDe.about.metaLabelEmail = get("about.metaLabelEmail.de");
    dataEn.about.metaLabelEmail = get("about.metaLabelEmail.en");
    dataDe.about.metaEmail = get("about.metaEmail.de");
    dataEn.about.metaEmail = get("about.metaEmail.en");
    dataDe.about.metaLabelPhone = get("about.metaLabelPhone.de");
    dataEn.about.metaLabelPhone = get("about.metaLabelPhone.en");
    dataDe.about.metaPhone = get("about.metaPhone.de");
    dataEn.about.metaPhone = get("about.metaPhone.en");

    dataDe.journal = dataDe.journal || {};
    dataEn.journal = dataEn.journal || {};
    dataDe.journal.eyebrow = get("journal.eyebrow.de");
    dataEn.journal.eyebrow = get("journal.eyebrow.en");
    dataDe.journal.title = get("journal.title.de");
    dataEn.journal.title = get("journal.title.en");
    dataDe.journal.link = get("journal.link.de");
    dataEn.journal.link = get("journal.link.en");

    dataDe.portfolio = dataDe.portfolio || {};
    dataEn.portfolio = dataEn.portfolio || {};
    dataDe.portfolio.eyebrow = get("portfolio.eyebrow.de");
    dataEn.portfolio.eyebrow = get("portfolio.eyebrow.en");
    dataDe.portfolio.title = get("portfolio.title.de");
    dataEn.portfolio.title = get("portfolio.title.en");

    const portfolioGallery = Array.from(form.querySelectorAll("[data-portfolio-image]")).map((input, index) => ({
      image: input.value,
      alt: form.querySelector(`[data-portfolio-alt="${index}"]`)?.value || "",
      altEn: form.querySelector(`[data-portfolio-alt-en="${index}"]`)?.value || ""
    })).filter((item) => item.image || item.alt || item.altEn);
    dataDe.portfolioGallery = portfolioGallery;
    dataEn.portfolioGallery = structuredClone(portfolioGallery);

    const faqRange = Array.from(form.querySelectorAll("[data-faq-question-de]")).map((_, index) => index);
    dataDe.faq = faqRange.map((index) => ({
      question: form.querySelector(`[data-faq-question-de="${index}"]`)?.value || "",
      answer: form.querySelector(`[data-faq-answer-de="${index}"]`)?.value || ""
    })).filter((item) => item.question || item.answer);
    dataEn.faq = faqRange.map((index) => ({
      question: form.querySelector(`[data-faq-question-en="${index}"]`)?.value || "",
      answer: form.querySelector(`[data-faq-answer-en="${index}"]`)?.value || ""
    })).filter((item) => item.question || item.answer);

    setStatus("Homepage Deutsch und Englisch werden gespeichert...");
    try {
      await saveFile(germanPath, { type: "json", data: dataDe });
      await saveFile(englishPath, { type: "json", data: dataEn });
      setStatus("Homepage Deutsch und Englisch gespeichert. Vorschau ist bereit.", "success");
      await render();
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindFilmPage = async () => {
  const file = await ensureFile(FILM_FILE);
  const data = structuredClone(file.data);
  data.films = Array.isArray(data.films) ? data.films : [];

  const getFilmProvider = (film) => {
    if (film?.videoProvider) return film.videoProvider;
    return String(film?.videoUrl || "").includes("vimeo.com") ? "vimeo" : "youtube";
  };

  const getFilmProviderBadge = (provider) => provider === "vimeo" ? "VM" : "YT";

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="filmPageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(FILM_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/film/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Film Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="metaTitle" value="${escapeHtml(data.metaTitle || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="metaTitleEn" value="${escapeHtml(data.metaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="metaDescription">${escapeHtml(data.metaDescription || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="metaDescriptionEn">${escapeHtml(data.metaDescriptionEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field-grid-2">
            <div class="field"><label>Hero Title DE</label><textarea name="heroTitle">${escapeHtml(data.heroTitle || "")}</textarea></div>
            <div class="field"><label>Hero Title EN</label><textarea name="heroTitleEn">${escapeHtml(data.heroTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Caption DE</label><input type="text" name="heroCaption" value="${escapeHtml(data.heroCaption || "")}"></div>
            <div class="field"><label>Hero Caption EN</label><input type="text" name="heroCaptionEn" value="${escapeHtml(data.heroCaptionEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Footer Rechts DE</label><input type="text" name="footerLegal" value="${escapeHtml(data.footerLegal || "")}"></div>
            <div class="field"><label>Footer Rechts EN</label><input type="text" name="footerLegalEn" value="${escapeHtml(data.footerLegalEn || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Film Karten</h2>
            <button class="button secondary" type="button" id="addFilmCardButton">Film hinzufuegen</button>
          </div>
          <div class="array-list" id="filmCardsList">
            ${data.films.map((film, index) => `
              <div class="array-item" data-film-item="${index}">
                <div class="actions" style="justify-content: flex-end; margin-top: 0; margin-bottom: 2px;">
                  <button class="button secondary" type="button" data-film-move-up="${index}" ${index === 0 ? "disabled" : ""}>Nach oben</button>
                  <button class="button secondary" type="button" data-film-move-down="${index}" ${index === data.films.length - 1 ? "disabled" : ""}>Nach unten</button>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE ${index + 1}</label><input type="text" data-film-field="title" data-film-index="${index}" value="${escapeHtml(film.title || "")}"></div>
                  <div class="field"><label>Titel EN ${index + 1}</label><input type="text" data-film-field="titleEn" data-film-index="${index}" value="${escapeHtml(film.titleEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Jahr</label><input type="text" data-film-field="year" data-film-index="${index}" value="${escapeHtml(film.year || "")}" placeholder="2026"></div>
                  <div class="field"><label>Layout</label><select data-film-field="layout" data-film-index="${index}">
                    <option value="standard" ${film.layout === "standard" ? "selected" : ""}>Standard</option>
                    <option value="portrait" ${film.layout === "portrait" ? "selected" : ""}>Portrait</option>
                    <option value="wide" ${film.layout === "wide" ? "selected" : ""}>Wide</option>
                  </select></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Saison DE</label><input type="text" data-film-field="season" data-film-index="${index}" value="${escapeHtml(film.season || "")}"></div>
                  <div class="field"><label>Saison EN</label><input type="text" data-film-field="seasonEn" data-film-index="${index}" value="${escapeHtml(film.seasonEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Ort DE</label><input type="text" data-film-field="location" data-film-index="${index}" value="${escapeHtml(film.location || "")}"></div>
                  <div class="field"><label>Ort EN</label><input type="text" data-film-field="locationEn" data-film-index="${index}" value="${escapeHtml(film.locationEn || "")}"></div>
                </div>
                <div class="field"><label>Format</label><input type="text" data-film-field="format" data-film-index="${index}" value="${escapeHtml(film.format || "")}" placeholder="Super 8, 4K, Highlight Film"></div>
                <div class="field-grid-2">
                  <div class="field">
                    <label>Video Plattform</label>
                    <select data-film-field="videoProvider" data-film-index="${index}">
                      <option value="youtube" ${getFilmProvider(film) === "youtube" ? "selected" : ""}>YouTube</option>
                      <option value="vimeo" ${getFilmProvider(film) === "vimeo" ? "selected" : ""}>Vimeo</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Video Link</label>
                    <input type="text" data-film-field="videoUrl" data-film-index="${index}" value="${escapeHtml(film.videoUrl || "")}" placeholder="https://youtube.com/watch?v=... oder https://vimeo.com/...">
                  </div>
                </div>
                <div class="field">
                  <label>Posterbild / Startbild</label>
                  <input type="text" data-film-field="posterImage" data-film-index="${index}" value="${escapeHtml(film.posterImage || "")}" placeholder="/assets/uploads/datei.jpg">
                  <div class="upload-inline" style="margin-top: 10px;">
                    <label>
                      Bild hochladen
                      <input type="file" data-film-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                    </label>
                    <button class="button danger" type="button" data-film-clear-image="${index}">Bild entfernen</button>
                  </div>
                  <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(film.posterImage || "URL wird nach Upload automatisch erzeugt.")}</div>
                  ${film.posterImage ? `
                    <div class="inline-image-preview">
                      <img src="${escapeHtml(film.posterImage)}" alt="${escapeHtml(film.posterAlt || film.title || "Posterbild Vorschau")}">
                      <span><strong>${escapeHtml(getFilmProviderBadge(getFilmProvider(film)))}</strong> ${escapeHtml(film.posterImage)}</span>
                    </div>
                  ` : ""}
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>ALT Text DE</label><textarea data-film-field="posterAlt" data-film-index="${index}">${escapeHtml(film.posterAlt || "")}</textarea></div>
                  <div class="field"><label>ALT Text EN</label><textarea data-film-field="posterAltEn" data-film-index="${index}">${escapeHtml(film.posterAltEn || "")}</textarea></div>
                </div>
                <button class="button danger" type="button" data-remove-film="${index}">Film entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/film/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Film Seite öffnen</a>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const rerender = async () => {
    state.cache[FILM_FILE] = { type: "json", data };
    await bindFilmPage();
  };

  document.getElementById("addFilmCardButton").addEventListener("click", async () => {
    data.films.push({
      title: "",
      titleEn: "",
      year: "",
      season: "",
      seasonEn: "",
      format: "",
      location: "",
      locationEn: "",
      layout: "standard",
      videoProvider: "youtube",
      posterImage: "",
      posterAlt: "",
      posterAltEn: "",
      videoUrl: ""
    });
    await rerender();
  });

  app.querySelectorAll("[data-remove-film]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.films.splice(Number(button.dataset.removeFilm), 1);
      await rerender();
    });
  });

  app.querySelectorAll("[data-film-move-up]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.filmMoveUp);
      if (index <= 0) return;
      [data.films[index - 1], data.films[index]] = [data.films[index], data.films[index - 1]];
      setStatus("Film nach oben verschoben.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-film-move-down]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.filmMoveDown);
      if (index >= data.films.length - 1) return;
      [data.films[index], data.films[index + 1]] = [data.films[index + 1], data.films[index]];
      setStatus("Film nach unten verschoben.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-film-clear-image]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.filmClearImage);
      data.films[index].posterImage = "";
      data.films[index].posterAlt = "";
      data.films[index].posterAltEn = "";
      setStatus("Film-Bild und ALT-Texte entfernt.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-film-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const index = Number(event.target.dataset.filmUpload);

      try {
        setStatus("Bild wird hochgeladen...");
        const imageUrl = await uploadFileToLibrary(fileToUpload);
        data.films[index].posterImage = imageUrl;
        setStatus("Bild erfolgreich hochgeladen. URL wurde eingetragen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  document.getElementById("filmPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const nextData = {
      metaTitle: form.metaTitle.value,
      metaDescription: form.metaDescription.value,
      metaTitleEn: form.metaTitleEn.value,
      metaDescriptionEn: form.metaDescriptionEn.value,
      heroTitle: form.heroTitle.value,
      heroTitleEn: form.heroTitleEn.value,
      heroCaption: form.heroCaption.value,
      heroCaptionEn: form.heroCaptionEn.value,
      footerLegal: form.footerLegal.value,
      footerLegalEn: form.footerLegalEn.value,
      films: data.films.map((_, index) => ({
        title: form.querySelector(`[data-film-field="title"][data-film-index="${index}"]`).value,
        titleEn: form.querySelector(`[data-film-field="titleEn"][data-film-index="${index}"]`).value,
        year: form.querySelector(`[data-film-field="year"][data-film-index="${index}"]`).value,
        season: form.querySelector(`[data-film-field="season"][data-film-index="${index}"]`).value,
        seasonEn: form.querySelector(`[data-film-field="seasonEn"][data-film-index="${index}"]`).value,
        format: form.querySelector(`[data-film-field="format"][data-film-index="${index}"]`).value,
        location: form.querySelector(`[data-film-field="location"][data-film-index="${index}"]`).value,
        locationEn: form.querySelector(`[data-film-field="locationEn"][data-film-index="${index}"]`).value,
        layout: form.querySelector(`[data-film-field="layout"][data-film-index="${index}"]`).value,
        videoProvider: form.querySelector(`[data-film-field="videoProvider"][data-film-index="${index}"]`).value,
        posterImage: form.querySelector(`[data-film-field="posterImage"][data-film-index="${index}"]`).value,
        posterAlt: form.querySelector(`[data-film-field="posterAlt"][data-film-index="${index}"]`).value,
        posterAltEn: form.querySelector(`[data-film-field="posterAltEn"][data-film-index="${index}"]`).value,
        videoUrl: form.querySelector(`[data-film-field="videoUrl"][data-film-index="${index}"]`).value
      })).filter((film) => film.title || film.titleEn || film.posterImage || film.videoUrl)
    };

    setStatus("Film Seite wird gespeichert...");
    try {
      await saveFile(FILM_FILE, { type: "json", data: nextData });
      setStatus("Film Seite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      } else {
        await render();
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindPortfolioPage = async () => {
  const file = await ensureFile(PORTFOLIO_FILE);
  const data = structuredClone(file.data);
  data.gallery = Array.isArray(data.gallery) ? data.gallery : [];

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="portfolioPageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(PORTFOLIO_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/portfolio/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Portfolio Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="metaTitle" value="${escapeHtml(data.metaTitle || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="metaTitleEn" value="${escapeHtml(data.metaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="metaDescription">${escapeHtml(data.metaDescription || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="metaDescriptionEn">${escapeHtml(data.metaDescriptionEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="heroEyebrow" value="${escapeHtml(data.heroEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="heroEyebrowEn" value="${escapeHtml(data.heroEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Title DE</label><textarea name="heroTitle">${escapeHtml(data.heroTitle || "")}</textarea></div>
            <div class="field"><label>Hero Title EN</label><textarea name="heroTitleEn">${escapeHtml(data.heroTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Copy DE</label><textarea name="heroCopy">${escapeHtml(data.heroCopy || "")}</textarea></div>
            <div class="field"><label>Hero Copy EN</label><textarea name="heroCopyEn">${escapeHtml(data.heroCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero CTA DE</label><input type="text" name="heroCta" value="${escapeHtml(data.heroCta || "")}"></div>
            <div class="field"><label>Hero CTA EN</label><input type="text" name="heroCtaEn" value="${escapeHtml(data.heroCtaEn || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Abschluss</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="closingEyebrow" value="${escapeHtml(data.closingEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="closingEyebrowEn" value="${escapeHtml(data.closingEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="closingCopy">${escapeHtml(data.closingCopy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="closingCopyEn">${escapeHtml(data.closingCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="closingCta" value="${escapeHtml(data.closingCta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="closingCtaEn" value="${escapeHtml(data.closingCtaEn || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Galerie Bilder</h2>
            <button class="button secondary" type="button" id="addPortfolioPageImage">Bild hinzufügen</button>
          </div>
          <div class="array-list">
            ${data.gallery.map((item, index) => `
              <div class="array-item">
                <div class="actions" style="justify-content: flex-end; margin-top: 0; margin-bottom: 14px;">
                  <button class="button secondary" type="button" data-move-portfolio-page-image-up="${index}" ${index === 0 ? "disabled" : ""}>Nach oben</button>
                  <button class="button secondary" type="button" data-move-portfolio-page-image-down="${index}" ${index === data.gallery.length - 1 ? "disabled" : ""}>Nach unten</button>
                </div>
                <div class="field">
                  <label>Bild ${index + 1}</label>
                  <input type="text" data-portfolio-page-image="${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                  <div class="upload-inline" style="margin-top: 10px;">
                    <label>
                      Bild hochladen
                      <input type="file" data-portfolio-page-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                    </label>
                    <button class="button danger" type="button" data-portfolio-page-clear="${index}">Bild entfernen</button>
                  </div>
                  <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(item.image || "URL wird nach Upload automatisch erzeugt.")}</div>
                  ${item.image ? `
                    <div class="inline-image-preview">
                      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || `Portfolio Bild ${index + 1}`)}">
                      <span>${escapeHtml(item.image)}</span>
                    </div>
                  ` : ""}
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>ALT Text DE</label><textarea data-portfolio-page-alt="${index}">${escapeHtml(item.alt || "")}</textarea></div>
                  <div class="field"><label>ALT Text EN</label><textarea data-portfolio-page-alt-en="${index}">${escapeHtml(item.altEn || "")}</textarea></div>
                </div>
                <button class="button danger" type="button" data-remove-portfolio-page-image="${index}">Eintrag entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/portfolio/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Portfolio Seite öffnen</a>
          <button class="button secondary" type="button" id="addPortfolioPageImageBottom">Weiteres Bild hinzufügen</button>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const rerender = async () => {
    state.cache[PORTFOLIO_FILE] = { type: "json", data };
    await bindPortfolioPage();
  };

  document.getElementById("addPortfolioPageImage").addEventListener("click", async () => {
    data.gallery.push({ image: "", alt: "", altEn: "" });
    await rerender();
  });

  document.getElementById("addPortfolioPageImageBottom").addEventListener("click", async () => {
    data.gallery.push({ image: "", alt: "", altEn: "" });
    await rerender();
  });

  app.querySelectorAll("[data-remove-portfolio-page-image]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.gallery.splice(Number(button.dataset.removePortfolioPageImage), 1);
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-portfolio-page-image-up]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.movePortfolioPageImageUp);
      if (index <= 0) return;
      [data.gallery[index - 1], data.gallery[index]] = [data.gallery[index], data.gallery[index - 1]];
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-portfolio-page-image-down]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.movePortfolioPageImageDown);
      if (index >= data.gallery.length - 1) return;
      [data.gallery[index], data.gallery[index + 1]] = [data.gallery[index + 1], data.gallery[index]];
      await rerender();
    });
  });

  app.querySelectorAll("[data-portfolio-page-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.portfolioPageClear);
      data.gallery[index].image = "";
      data.gallery[index].alt = "";
      data.gallery[index].altEn = "";
      setStatus("Bild und ALT-Texte entfernt.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-portfolio-page-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const index = Number(event.target.dataset.portfolioPageUpload);
      try {
        setStatus("Bild wird hochgeladen...");
        data.gallery[index].image = await uploadFileToLibrary(fileToUpload);
        if (!String(data.gallery[index].alt || "").trim()) {
          data.gallery[index].alt = buildAutoAltFromImagePath(fileToUpload.name, `Portfolio Bild ${index + 1}`);
        }
        if (!String(data.gallery[index].altEn || "").trim() && String(data.gallery[index].alt || "").trim()) {
          try {
            data.gallery[index].altEn = await translateCmsText(data.gallery[index].alt, "de", "en");
          } catch {
            data.gallery[index].altEn = "";
          }
        }
        setStatus("Bild erfolgreich hochgeladen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  [
    ["[name='metaTitle']", "[name='metaTitleEn']"],
    ["[name='metaDescription']", "[name='metaDescriptionEn']"],
    ["[name='heroEyebrow']", "[name='heroEyebrowEn']"],
    ["[name='heroTitle']", "[name='heroTitleEn']"],
    ["[name='heroCopy']", "[name='heroCopyEn']"],
    ["[name='heroCta']", "[name='heroCtaEn']"],
    ["[name='closingEyebrow']", "[name='closingEyebrowEn']"],
    ["[name='closingCopy']", "[name='closingCopyEn']"],
    ["[name='closingCta']", "[name='closingCtaEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  data.gallery.forEach((_, index) => {
    attachAutoTranslation(
      `[data-portfolio-page-alt='${index}']`,
      `[data-portfolio-page-alt-en='${index}']`
    );
  });

  document.getElementById("portfolioPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const nextData = {
      metaTitle: form.metaTitle.value,
      metaDescription: form.metaDescription.value,
      metaTitleEn: form.metaTitleEn.value,
      metaDescriptionEn: form.metaDescriptionEn.value,
      heroEyebrow: form.heroEyebrow.value,
      heroEyebrowEn: form.heroEyebrowEn.value,
      heroTitle: form.heroTitle.value,
      heroTitleEn: form.heroTitleEn.value,
      heroCopy: form.heroCopy.value,
      heroCopyEn: form.heroCopyEn.value,
      heroCta: form.heroCta.value,
      heroCtaEn: form.heroCtaEn.value,
      closingEyebrow: form.closingEyebrow.value,
      closingEyebrowEn: form.closingEyebrowEn.value,
      closingCopy: form.closingCopy.value,
      closingCopyEn: form.closingCopyEn.value,
      closingCta: form.closingCta.value,
      closingCtaEn: form.closingCtaEn.value,
      gallery: data.gallery.map((_, index) => ({
        image: form.querySelector(`[data-portfolio-page-image="${index}"]`)?.value || "",
        alt: form.querySelector(`[data-portfolio-page-alt="${index}"]`)?.value || "",
        altEn: form.querySelector(`[data-portfolio-page-alt-en="${index}"]`)?.value || ""
      })).filter((item) => item.image || item.alt || item.altEn)
    };

    setStatus("Portfolio Seite wird gespeichert...");
    try {
      await saveFile(PORTFOLIO_FILE, { type: "json", data: nextData });
      setStatus("Portfolio Seite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      } else {
        await render();
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindExperiencePage = async () => {
  const file = await ensureFile(EXPERIENCE_FILE);
  const data = structuredClone(file.data);
  data.process = Array.isArray(data.process) ? data.process : [];
  data.specialItems = Array.isArray(data.specialItems) ? data.specialItems : [];
  data.planningItems = Array.isArray(data.planningItems) ? data.planningItems : [];
  data.faq = Array.isArray(data.faq) ? data.faq : [];

  const rerender = async () => {
    state.cache[EXPERIENCE_FILE] = { type: "json", data };
    await bindExperiencePage();
  };

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="experiencePageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(EXPERIENCE_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/experience/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Experience Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="metaTitle" value="${escapeHtml(data.metaTitle || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="metaTitleEn" value="${escapeHtml(data.metaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="metaDescription">${escapeHtml(data.metaDescription || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="metaDescriptionEn">${escapeHtml(data.metaDescriptionEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="heroEyebrow" value="${escapeHtml(data.heroEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="heroEyebrowEn" value="${escapeHtml(data.heroEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="heroTitle">${escapeHtml(data.heroTitle || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="heroTitleEn">${escapeHtml(data.heroTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="heroCopy">${escapeHtml(data.heroCopy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="heroCopyEn">${escapeHtml(data.heroCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="heroCta" value="${escapeHtml(data.heroCta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="heroCtaEn" value="${escapeHtml(data.heroCtaEn || "")}"></div>
          </div>
          <div class="field">
            <label>Hero Bild</label>
            <input type="text" name="heroImage" value="${escapeHtml(data.heroImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="experienceHeroUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="experienceHeroClear">Bild entfernen</button>
            </div>
            ${data.heroImage ? `<div class="inline-image-preview"><img src="${escapeHtml(data.heroImage)}" alt="${escapeHtml(data.heroAlt || "Hero Bild")}"><span>${escapeHtml(data.heroImage)}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="heroAlt">${escapeHtml(data.heroAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="heroAltEn">${escapeHtml(data.heroAltEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Philosophie</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="philosophyEyebrow" value="${escapeHtml(data.philosophyEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="philosophyEyebrowEn" value="${escapeHtml(data.philosophyEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="philosophyTitle">${escapeHtml(data.philosophyTitle || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="philosophyTitleEn">${escapeHtml(data.philosophyTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="philosophyCopy">${escapeHtml(data.philosophyCopy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="philosophyCopyEn">${escapeHtml(data.philosophyCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Linktext DE</label><input type="text" name="philosophyCta" value="${escapeHtml(data.philosophyCta || "")}"></div>
            <div class="field"><label>Linktext EN</label><input type="text" name="philosophyCtaEn" value="${escapeHtml(data.philosophyCtaEn || "")}"></div>
          </div>
          <div class="field">
            <label>Philosophie Bild</label>
            <input type="text" name="philosophyImage" value="${escapeHtml(data.philosophyImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="experiencePhilosophyUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="experiencePhilosophyClear">Bild entfernen</button>
            </div>
            ${data.philosophyImage ? `<div class="inline-image-preview"><img src="${escapeHtml(data.philosophyImage)}" alt="${escapeHtml(data.philosophyAlt || "Philosophie Bild")}"><span>${escapeHtml(data.philosophyImage)}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="philosophyAlt">${escapeHtml(data.philosophyAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="philosophyAltEn">${escapeHtml(data.philosophyAltEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Process</h2>
            <button class="button secondary" type="button" id="addExperienceProcess">Schritt hinzufügen</button>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="processEyebrow" value="${escapeHtml(data.processEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="processEyebrowEn" value="${escapeHtml(data.processEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><input type="text" name="processTitle" value="${escapeHtml(data.processTitle || "")}"></div>
            <div class="field"><label>Titel EN</label><input type="text" name="processTitleEn" value="${escapeHtml(data.processTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Subline DE</label><input type="text" name="processSubline" value="${escapeHtml(data.processSubline || "")}"></div>
            <div class="field"><label>Subline EN</label><input type="text" name="processSublineEn" value="${escapeHtml(data.processSublineEn || "")}"></div>
          </div>
          <div class="array-list">
            ${data.process.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Nummer</label><input type="text" data-experience-process-number="${index}" value="${escapeHtml(item.number || "")}"></div>
                  <div class="field"><label>Titel DE</label><input type="text" data-experience-process-title="${index}" value="${escapeHtml(item.title || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel EN</label><input type="text" data-experience-process-title-en="${index}" value="${escapeHtml(item.titleEn || "")}"></div>
                  <div class="field"><label>Copy DE</label><textarea data-experience-process-copy="${index}">${escapeHtml(item.copy || "")}</textarea></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy EN</label><textarea data-experience-process-copy-en="${index}">${escapeHtml(item.copyEn || "")}</textarea></div>
                  <div class="field" style="display:flex;align-items:flex-end;"><button class="button danger" type="button" data-remove-experience-process="${index}">Schritt entfernen</button></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Besonderheiten</h2>
            <button class="button secondary" type="button" id="addExperienceSpecial">Eintrag hinzufügen</button>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="specialEyebrow" value="${escapeHtml(data.specialEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="specialEyebrowEn" value="${escapeHtml(data.specialEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="specialTitle">${escapeHtml(data.specialTitle || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="specialTitleEn">${escapeHtml(data.specialTitleEn || "")}</textarea></div>
          </div>
          <div class="array-list">
            ${data.specialItems.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-experience-special-title="${index}" value="${escapeHtml(item.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-experience-special-title-en="${index}" value="${escapeHtml(item.titleEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-experience-special-copy="${index}">${escapeHtml(item.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-experience-special-copy-en="${index}">${escapeHtml(item.copyEn || "")}</textarea></div>
                </div>
                <button class="button danger" type="button" data-remove-experience-special="${index}">Eintrag entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Testimonial</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="testimonialEyebrow" value="${escapeHtml(data.testimonialEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="testimonialEyebrowEn" value="${escapeHtml(data.testimonialEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Zitat DE</label><textarea name="testimonialQuote">${escapeHtml(data.testimonialQuote || "")}</textarea></div>
            <div class="field"><label>Zitat EN</label><textarea name="testimonialQuoteEn">${escapeHtml(data.testimonialQuoteEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Name DE</label><input type="text" name="testimonialName" value="${escapeHtml(data.testimonialName || "")}"></div>
            <div class="field"><label>Name EN</label><input type="text" name="testimonialNameEn" value="${escapeHtml(data.testimonialNameEn || "")}"></div>
          </div>
          <div class="field">
            <label>Testimonial Bild</label>
            <input type="text" name="testimonialImage" value="${escapeHtml(data.testimonialImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="experienceTestimonialUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="experienceTestimonialClear">Bild entfernen</button>
            </div>
            ${data.testimonialImage ? `<div class="inline-image-preview"><img src="${escapeHtml(data.testimonialImage)}" alt="${escapeHtml(data.testimonialAlt || "Testimonial Bild")}"><span>${escapeHtml(data.testimonialImage)}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="testimonialAlt">${escapeHtml(data.testimonialAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="testimonialAltEn">${escapeHtml(data.testimonialAltEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Planning Support</h2>
            <button class="button secondary" type="button" id="addExperiencePlanning">Punkt hinzufügen</button>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="planningEyebrow" value="${escapeHtml(data.planningEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="planningEyebrowEn" value="${escapeHtml(data.planningEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="planningTitle">${escapeHtml(data.planningTitle || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="planningTitleEn">${escapeHtml(data.planningTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="planningCta" value="${escapeHtml(data.planningCta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="planningCtaEn" value="${escapeHtml(data.planningCtaEn || "")}"></div>
          </div>
          <div class="array-list">
            ${data.planningItems.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Punkt DE</label><input type="text" data-experience-planning-label="${index}" value="${escapeHtml(item.label || "")}"></div>
                  <div class="field"><label>Punkt EN</label><input type="text" data-experience-planning-label-en="${index}" value="${escapeHtml(item.labelEn || "")}"></div>
                </div>
                <button class="button danger" type="button" data-remove-experience-planning="${index}">Punkt entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">FAQ</h2>
            <button class="button secondary" type="button" id="addExperienceFaq">FAQ hinzufügen</button>
          </div>
          <div class="array-list">
            ${data.faq.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Frage DE</label><input type="text" data-experience-faq-question="${index}" value="${escapeHtml(item.question || "")}"></div>
                  <div class="field"><label>Frage EN</label><input type="text" data-experience-faq-question-en="${index}" value="${escapeHtml(item.questionEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Antwort DE</label><textarea data-experience-faq-answer="${index}">${escapeHtml(item.answer || "")}</textarea></div>
                  <div class="field"><label>Antwort EN</label><textarea data-experience-faq-answer-en="${index}">${escapeHtml(item.answerEn || "")}</textarea></div>
                </div>
                <button class="button danger" type="button" data-remove-experience-faq="${index}">FAQ entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Final CTA</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="finalEyebrow" value="${escapeHtml(data.finalEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="finalEyebrowEn" value="${escapeHtml(data.finalEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Titel DE</label><textarea name="finalTitle">${escapeHtml(data.finalTitle || "")}</textarea></div>
            <div class="field"><label>Titel EN</label><textarea name="finalTitleEn">${escapeHtml(data.finalTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="finalCta" value="${escapeHtml(data.finalCta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="finalCtaEn" value="${escapeHtml(data.finalCtaEn || "")}"></div>
          </div>
          <div class="field">
            <label>Finales Bild</label>
            <input type="text" name="finalImage" value="${escapeHtml(data.finalImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>Bild hochladen<input type="file" id="experienceFinalUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif"></label>
              <button class="button danger" type="button" id="experienceFinalClear">Bild entfernen</button>
            </div>
            ${data.finalImage ? `<div class="inline-image-preview"><img src="${escapeHtml(data.finalImage)}" alt="${escapeHtml(data.finalAlt || "Finales Bild")}"><span>${escapeHtml(data.finalImage)}</span></div>` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="finalAlt">${escapeHtml(data.finalAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="finalAltEn">${escapeHtml(data.finalAltEn || "")}</textarea></div>
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/experience/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">Experience Seite öffnen</a>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const bindImageUpload = (uploadId, clearId, imageKey, altKey, altEnKey, successLabel) => {
    const upload = document.getElementById(uploadId);
    const clear = document.getElementById(clearId);
    if (upload) {
      upload.addEventListener("change", async (event) => {
        const [fileToUpload] = event.target.files || [];
        if (!fileToUpload) return;
        try {
          setStatus(`${successLabel} wird hochgeladen...`);
          data[imageKey] = await uploadFileToLibrary(fileToUpload);
          if (!String(data[altKey] || "").trim()) {
            data[altKey] = buildAutoAltFromImagePath(fileToUpload.name, successLabel);
          }
          if (!String(data[altEnKey] || "").trim() && String(data[altKey] || "").trim()) {
            try {
              data[altEnKey] = await translateCmsText(data[altKey], "de", "en");
            } catch {
              data[altEnKey] = "";
            }
          }
          setStatus(`${successLabel} erfolgreich hochgeladen.`, "success");
          await rerender();
        } catch (error) {
          setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
        }
      });
    }
    if (clear) {
      clear.addEventListener("click", async () => {
        data[imageKey] = "";
        data[altKey] = "";
        data[altEnKey] = "";
        setStatus(`${successLabel} entfernt.`, "success");
        await rerender();
      });
    }
  };

  bindImageUpload("experienceHeroUpload", "experienceHeroClear", "heroImage", "heroAlt", "heroAltEn", "Hero Bild");
  bindImageUpload("experiencePhilosophyUpload", "experiencePhilosophyClear", "philosophyImage", "philosophyAlt", "philosophyAltEn", "Philosophie Bild");
  bindImageUpload("experienceTestimonialUpload", "experienceTestimonialClear", "testimonialImage", "testimonialAlt", "testimonialAltEn", "Testimonial Bild");
  bindImageUpload("experienceFinalUpload", "experienceFinalClear", "finalImage", "finalAlt", "finalAltEn", "Finales Bild");

  document.getElementById("addExperienceProcess").addEventListener("click", async () => {
    data.process.push({ number: "", title: "", titleEn: "", copy: "", copyEn: "" });
    await rerender();
  });
  document.getElementById("addExperienceSpecial").addEventListener("click", async () => {
    data.specialItems.push({ title: "", titleEn: "", copy: "", copyEn: "" });
    await rerender();
  });
  document.getElementById("addExperiencePlanning").addEventListener("click", async () => {
    data.planningItems.push({ label: "", labelEn: "" });
    await rerender();
  });
  document.getElementById("addExperienceFaq").addEventListener("click", async () => {
    data.faq.push({ question: "", questionEn: "", answer: "", answerEn: "" });
    await rerender();
  });

  app.querySelectorAll("[data-remove-experience-process]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.process.splice(Number(button.dataset.removeExperienceProcess), 1);
      await rerender();
    });
  });
  app.querySelectorAll("[data-remove-experience-special]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.specialItems.splice(Number(button.dataset.removeExperienceSpecial), 1);
      await rerender();
    });
  });
  app.querySelectorAll("[data-remove-experience-planning]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.planningItems.splice(Number(button.dataset.removeExperiencePlanning), 1);
      await rerender();
    });
  });
  app.querySelectorAll("[data-remove-experience-faq]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.faq.splice(Number(button.dataset.removeExperienceFaq), 1);
      await rerender();
    });
  });

  [
    ["[name='metaTitle']", "[name='metaTitleEn']"],
    ["[name='metaDescription']", "[name='metaDescriptionEn']"],
    ["[name='heroEyebrow']", "[name='heroEyebrowEn']"],
    ["[name='heroTitle']", "[name='heroTitleEn']"],
    ["[name='heroCopy']", "[name='heroCopyEn']"],
    ["[name='heroCta']", "[name='heroCtaEn']"],
    ["[name='heroAlt']", "[name='heroAltEn']"],
    ["[name='philosophyEyebrow']", "[name='philosophyEyebrowEn']"],
    ["[name='philosophyTitle']", "[name='philosophyTitleEn']"],
    ["[name='philosophyCopy']", "[name='philosophyCopyEn']"],
    ["[name='philosophyCta']", "[name='philosophyCtaEn']"],
    ["[name='philosophyAlt']", "[name='philosophyAltEn']"],
    ["[name='processEyebrow']", "[name='processEyebrowEn']"],
    ["[name='processTitle']", "[name='processTitleEn']"],
    ["[name='processSubline']", "[name='processSublineEn']"],
    ["[name='specialEyebrow']", "[name='specialEyebrowEn']"],
    ["[name='specialTitle']", "[name='specialTitleEn']"],
    ["[name='testimonialEyebrow']", "[name='testimonialEyebrowEn']"],
    ["[name='testimonialQuote']", "[name='testimonialQuoteEn']"],
    ["[name='testimonialName']", "[name='testimonialNameEn']"],
    ["[name='testimonialAlt']", "[name='testimonialAltEn']"],
    ["[name='planningEyebrow']", "[name='planningEyebrowEn']"],
    ["[name='planningTitle']", "[name='planningTitleEn']"],
    ["[name='planningCta']", "[name='planningCtaEn']"],
    ["[name='finalEyebrow']", "[name='finalEyebrowEn']"],
    ["[name='finalTitle']", "[name='finalTitleEn']"],
    ["[name='finalCta']", "[name='finalCtaEn']"],
    ["[name='finalAlt']", "[name='finalAltEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  data.process.forEach((_, index) => {
    attachAutoTranslation(`[data-experience-process-title='${index}']`, `[data-experience-process-title-en='${index}']`);
    attachAutoTranslation(`[data-experience-process-copy='${index}']`, `[data-experience-process-copy-en='${index}']`);
  });
  data.specialItems.forEach((_, index) => {
    attachAutoTranslation(`[data-experience-special-title='${index}']`, `[data-experience-special-title-en='${index}']`);
    attachAutoTranslation(`[data-experience-special-copy='${index}']`, `[data-experience-special-copy-en='${index}']`);
  });
  data.planningItems.forEach((_, index) => {
    attachAutoTranslation(`[data-experience-planning-label='${index}']`, `[data-experience-planning-label-en='${index}']`);
  });
  data.faq.forEach((_, index) => {
    attachAutoTranslation(`[data-experience-faq-question='${index}']`, `[data-experience-faq-question-en='${index}']`);
    attachAutoTranslation(`[data-experience-faq-answer='${index}']`, `[data-experience-faq-answer-en='${index}']`);
  });

  document.getElementById("experiencePageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const nextData = {
      metaTitle: form.metaTitle.value,
      metaTitleEn: form.metaTitleEn.value,
      metaDescription: form.metaDescription.value,
      metaDescriptionEn: form.metaDescriptionEn.value,
      heroEyebrow: form.heroEyebrow.value,
      heroEyebrowEn: form.heroEyebrowEn.value,
      heroTitle: form.heroTitle.value,
      heroTitleEn: form.heroTitleEn.value,
      heroCopy: form.heroCopy.value,
      heroCopyEn: form.heroCopyEn.value,
      heroCta: form.heroCta.value,
      heroCtaEn: form.heroCtaEn.value,
      heroImage: form.heroImage.value,
      heroAlt: form.heroAlt.value,
      heroAltEn: form.heroAltEn.value,
      philosophyEyebrow: form.philosophyEyebrow.value,
      philosophyEyebrowEn: form.philosophyEyebrowEn.value,
      philosophyTitle: form.philosophyTitle.value,
      philosophyTitleEn: form.philosophyTitleEn.value,
      philosophyCopy: form.philosophyCopy.value,
      philosophyCopyEn: form.philosophyCopyEn.value,
      philosophyCta: form.philosophyCta.value,
      philosophyCtaEn: form.philosophyCtaEn.value,
      philosophyImage: form.philosophyImage.value,
      philosophyAlt: form.philosophyAlt.value,
      philosophyAltEn: form.philosophyAltEn.value,
      processEyebrow: form.processEyebrow.value,
      processEyebrowEn: form.processEyebrowEn.value,
      processTitle: form.processTitle.value,
      processTitleEn: form.processTitleEn.value,
      processSubline: form.processSubline.value,
      processSublineEn: form.processSublineEn.value,
      process: data.process.map((_, index) => ({
        number: form.querySelector(`[data-experience-process-number="${index}"]`)?.value || "",
        title: form.querySelector(`[data-experience-process-title="${index}"]`)?.value || "",
        titleEn: form.querySelector(`[data-experience-process-title-en="${index}"]`)?.value || "",
        copy: form.querySelector(`[data-experience-process-copy="${index}"]`)?.value || "",
        copyEn: form.querySelector(`[data-experience-process-copy-en="${index}"]`)?.value || ""
      })).filter((item) => item.number || item.title || item.titleEn || item.copy || item.copyEn),
      specialEyebrow: form.specialEyebrow.value,
      specialEyebrowEn: form.specialEyebrowEn.value,
      specialTitle: form.specialTitle.value,
      specialTitleEn: form.specialTitleEn.value,
      specialItems: data.specialItems.map((_, index) => ({
        title: form.querySelector(`[data-experience-special-title="${index}"]`)?.value || "",
        titleEn: form.querySelector(`[data-experience-special-title-en="${index}"]`)?.value || "",
        copy: form.querySelector(`[data-experience-special-copy="${index}"]`)?.value || "",
        copyEn: form.querySelector(`[data-experience-special-copy-en="${index}"]`)?.value || ""
      })).filter((item) => item.title || item.titleEn || item.copy || item.copyEn),
      testimonialEyebrow: form.testimonialEyebrow.value,
      testimonialEyebrowEn: form.testimonialEyebrowEn.value,
      testimonialQuote: form.testimonialQuote.value,
      testimonialQuoteEn: form.testimonialQuoteEn.value,
      testimonialName: form.testimonialName.value,
      testimonialNameEn: form.testimonialNameEn.value,
      testimonialImage: form.testimonialImage.value,
      testimonialAlt: form.testimonialAlt.value,
      testimonialAltEn: form.testimonialAltEn.value,
      planningEyebrow: form.planningEyebrow.value,
      planningEyebrowEn: form.planningEyebrowEn.value,
      planningTitle: form.planningTitle.value,
      planningTitleEn: form.planningTitleEn.value,
      planningCta: form.planningCta.value,
      planningCtaEn: form.planningCtaEn.value,
      planningItems: data.planningItems.map((_, index) => ({
        label: form.querySelector(`[data-experience-planning-label="${index}"]`)?.value || "",
        labelEn: form.querySelector(`[data-experience-planning-label-en="${index}"]`)?.value || ""
      })).filter((item) => item.label || item.labelEn),
      faq: data.faq.map((_, index) => ({
        question: form.querySelector(`[data-experience-faq-question="${index}"]`)?.value || "",
        questionEn: form.querySelector(`[data-experience-faq-question-en="${index}"]`)?.value || "",
        answer: form.querySelector(`[data-experience-faq-answer="${index}"]`)?.value || "",
        answerEn: form.querySelector(`[data-experience-faq-answer-en="${index}"]`)?.value || ""
      })).filter((item) => item.question || item.questionEn || item.answer || item.answerEn),
      finalEyebrow: form.finalEyebrow.value,
      finalEyebrowEn: form.finalEyebrowEn.value,
      finalTitle: form.finalTitle.value,
      finalTitleEn: form.finalTitleEn.value,
      finalCta: form.finalCta.value,
      finalCtaEn: form.finalCtaEn.value,
      finalImage: form.finalImage.value,
      finalAlt: form.finalAlt.value,
      finalAltEn: form.finalAltEn.value
    };

    setStatus("Experience Seite wird gespeichert...");
    try {
      await saveFile(EXPERIENCE_FILE, { type: "json", data: nextData });
      setStatus("Experience Seite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      } else {
        await render();
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindAcademyPage = async () => {
  const file = await ensureFile(ACADEMY_FILE);
  const data = structuredClone(file.data);
  data.workshops = Array.isArray(data.workshops) ? data.workshops : [];
  data.presets = Array.isArray(data.presets) ? data.presets : [];

  const createEmptyOffer = (kind) => ({
    slug: "",
    title: "",
    titleEn: "",
    label: kind === "preset" ? "Preset Collection" : "Field Workshop",
    labelEn: kind === "preset" ? "Preset Collection" : "Field Workshop",
    description: "",
    descriptionEn: "",
    detailText: "",
    detailTextEn: "",
    price: "",
    priceEn: "",
    cta: kind === "preset" ? "Preset kaufen" : "Workshop anfragen",
    ctaEn: kind === "preset" ? "Buy preset" : "Inquire about workshop",
    image: "",
    alt: "",
    altEn: "",
    aspectClass: kind === "preset" ? "aspect-square" : "aspect-video",
    videoEmbed: "",
    paymentType: kind === "preset" ? "stripe" : "contact",
    productUrl: "",
    stripeUrl: "",
    stripePriceId: "",
    bundleId: "",
    resourceUrl: "",
    resourceLabel: "Dateien öffnen",
    resourceLabelEn: "Open files",
    installText: "",
    installTextEn: "",
    legalNote: "Digitale Produkte sind vom Umtausch und von der Rückgabe ausgeschlossen. Bitte prüfe vor dem Kauf die Kompatibilität mit deiner Lightroom-Version.",
    legalNoteEn: "Digital products are excluded from exchange and refund. Please check compatibility with your Lightroom version before purchasing.",
    grayscale: false
  });

  const previewStamp = state.lastSavedAt || Date.now();
  const detailPreviewUrl = (entry, kind) => {
    const previewSlug = slugify(entry.slug || entry.title || `${kind}-${Date.now()}`) || `${kind}-preview`;
    return `/academy/item/?entry=${encodeURIComponent(previewSlug)}&type=${kind}&preview=${previewStamp}`;
  };

  const renderOfferFields = (items, kind, label) => `
    <div class="section-card">
      <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
        <h2 class="section-title" style="margin: 0;">${label}</h2>
        <button class="button secondary" type="button" data-add-academy-offer="${kind}">${kind === "preset" ? "Preset hinzufügen" : "Workshop hinzufügen"}</button>
      </div>
      <div class="muted" style="margin-bottom: 14px;">Reihenfolge, Bilder, Detailtexte, Video-Embeds, Stripe-Links und Download-Links direkt hier pflegen.</div>
      <div class="array-list">
        ${items.map((item, index) => `
          <div class="array-item">
            <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
              <div class="muted">${escapeHtml(item.title || item.titleEn || `${kind === "preset" ? "Preset" : "Workshop"} ${index + 1}`)}</div>
              <div class="actions" style="margin-top: 0;">
                <a class="button secondary" href="${detailPreviewUrl(item, kind)}" target="_blank" rel="noreferrer">Detail öffnen</a>
                <button class="button secondary" type="button" data-move-academy-offer-up="${kind}:${index}" ${index === 0 ? "disabled" : ""}>Nach oben</button>
                <button class="button secondary" type="button" data-move-academy-offer-down="${kind}:${index}" ${index === items.length - 1 ? "disabled" : ""}>Nach unten</button>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field"><label>Titel DE</label><input type="text" data-academy-title="${kind}:${index}" value="${escapeHtml(item.title || "")}"></div>
              <div class="field"><label>Titel EN</label><input type="text" data-academy-title-en="${kind}:${index}" value="${escapeHtml(item.titleEn || "")}"></div>
            </div>
            <div class="field-grid-2">
              <div class="field"><label>Label DE</label><input type="text" data-academy-label="${kind}:${index}" value="${escapeHtml(item.label || "")}"></div>
              <div class="field"><label>Label EN</label><input type="text" data-academy-label-en="${kind}:${index}" value="${escapeHtml(item.labelEn || "")}"></div>
            </div>
            <div class="field-grid-2">
              <div class="field"><label>Preis DE</label><input type="text" data-academy-price="${kind}:${index}" value="${escapeHtml(item.price || "")}"></div>
              <div class="field"><label>Preis EN</label><input type="text" data-academy-price-en="${kind}:${index}" value="${escapeHtml(item.priceEn || "")}"></div>
            </div>
            <div class="field-grid-2">
              <div class="field"><label>CTA DE</label><input type="text" data-academy-cta="${kind}:${index}" value="${escapeHtml(item.cta || "")}"></div>
              <div class="field"><label>CTA EN</label><input type="text" data-academy-cta-en="${kind}:${index}" value="${escapeHtml(item.ctaEn || "")}"></div>
            </div>
            <div class="field-grid-2">
              <div class="field"><label>Beschreibung DE</label><textarea data-academy-description="${kind}:${index}">${escapeHtml(item.description || "")}</textarea></div>
              <div class="field"><label>Beschreibung EN</label><textarea data-academy-description-en="${kind}:${index}">${escapeHtml(item.descriptionEn || "")}</textarea></div>
            </div>
            <div class="field-grid-2">
              <div class="field"><label>Detailtext DE</label><textarea data-academy-detail="${kind}:${index}" style="min-height: 180px;">${escapeHtml(item.detailText || "")}</textarea></div>
              <div class="field"><label>Detailtext EN</label><textarea data-academy-detail-en="${kind}:${index}" style="min-height: 180px;">${escapeHtml(item.detailTextEn || "")}</textarea></div>
            </div>

            <div class="field-grid-2">
              <div class="field">
                <label>Bild</label>
                <input type="text" data-academy-image="${kind}:${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                <div class="upload-inline" style="margin-top: 10px;">
                  <label>
                    Bild hochladen
                    <input type="file" data-academy-upload="${kind}:${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                  </label>
                  <button class="button danger" type="button" data-academy-clear-image="${kind}:${index}">Bild entfernen</button>
                </div>
                ${item.image ? `
                  <div class="inline-image-preview">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title || `Academy ${index + 1}`)}">
                    <span>${escapeHtml(item.image)}</span>
                  </div>
                ` : ""}
              </div>
              <div class="field">
                <label>Video Embed URL</label>
                <input type="text" data-academy-video="${kind}:${index}" value="${escapeHtml(item.videoEmbed || "")}" placeholder="https://player.vimeo.com/video/...">
                <div class="muted" style="margin-top: 8px;">Optional. Wenn eingetragen, zeigt die Detailseite statt des Bildes das Video groß an.</div>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field"><label>ALT Text DE</label><textarea data-academy-alt="${kind}:${index}">${escapeHtml(item.alt || "")}</textarea></div>
              <div class="field"><label>ALT Text EN</label><textarea data-academy-alt-en="${kind}:${index}">${escapeHtml(item.altEn || "")}</textarea></div>
            </div>

            <div class="field-grid-2">
              <div class="field">
                <label>Zahlungsmodus</label>
                <select data-academy-payment-type="${kind}:${index}">
                  <option value="contact" ${item.paymentType === "contact" ? "selected" : ""}>Kontakt / Anfrage</option>
                  <option value="stripe" ${item.paymentType === "stripe" ? "selected" : ""}>Stripe Checkout / Payment Link</option>
                </select>
              </div>
              <div class="field">
                <label>Stripe Checkout- oder Payment-Link</label>
                <input type="text" data-academy-stripe-url="${kind}:${index}" value="${escapeHtml(item.stripeUrl || "")}" placeholder="https://buy.stripe.com/...">
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field">
                <label>Stripe Price ID</label>
                <input type="text" data-academy-stripe-price-id="${kind}:${index}" value="${escapeHtml(item.stripePriceId || "")}" placeholder="price_123...">
              </div>
              <div class="field">
                <label>Bundle ID</label>
                <input type="text" data-academy-bundle-id="${kind}:${index}" value="${escapeHtml(item.bundleId || "")}" placeholder="juniper-bundle-desktop-mobile">
                <div class="muted" style="margin-top: 8px;">Für automatische Auslieferung nach Stripe-Zahlung. Die Dateien liegen privat unter <code>private/downloads/&lt;bundle-id&gt;/</code>.</div>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field">
                <label>Download-Link nach Kauf (Dropbox)</label>
                <input type="text" data-academy-resource-url="${kind}:${index}" value="${escapeHtml(item.resourceUrl || "")}" placeholder="https://www.dropbox.com/...">
                <div class="muted" style="margin-top: 8px;">Dieser Link erscheint erst auf der Danke-Seite nach dem Kauf und nicht öffentlich auf der Preset-Seite.</div>
              </div>
              <div class="field">
                <label>Hinweis</label>
                <div class="muted" style="margin-top: 34px;">Die Preset-Seite leitet nur noch auf Stripe weiter. Der Dropbox-Link wird für den Download nach dem Kauf verwendet.</div>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field-grid-2">
                <div class="field"><label>Linktext DE</label><input type="text" data-academy-resource-label="${kind}:${index}" value="${escapeHtml(item.resourceLabel || "")}" placeholder="Dateien öffnen"></div>
                <div class="field"><label>Linktext EN</label><input type="text" data-academy-resource-label-en="${kind}:${index}" value="${escapeHtml(item.resourceLabelEn || "")}" placeholder="Open files"></div>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field"><label>Installationshinweise DE</label><textarea data-academy-install-text="${kind}:${index}" style="min-height: 140px;">${escapeHtml(item.installText || "")}</textarea></div>
              <div class="field"><label>Installationshinweise EN</label><textarea data-academy-install-text-en="${kind}:${index}" style="min-height: 140px;">${escapeHtml(item.installTextEn || "")}</textarea></div>
            </div>

            <div class="field-grid-2">
              <div class="field"><label>Digitalprodukt Hinweis / Rückgabeausschluss DE</label><textarea data-academy-legal-note="${kind}:${index}" style="min-height: 140px;">${escapeHtml(item.legalNote || "")}</textarea></div>
              <div class="field"><label>Digitalprodukt Hinweis / Rückgabeausschluss EN</label><textarea data-academy-legal-note-en="${kind}:${index}" style="min-height: 140px;">${escapeHtml(item.legalNoteEn || "")}</textarea></div>
            </div>

            <div class="field-grid-2">
              <div class="field">
                <label>Slug</label>
                <input type="text" data-academy-slug="${kind}:${index}" value="${escapeHtml(item.slug || "")}" placeholder="wird aus dem Titel erzeugt">
              </div>
              <div class="field">
                <label>Bildformat / Effekt</label>
                <div class="field-grid-2" style="grid-template-columns: 1fr auto; gap: 12px;">
                  <select data-academy-aspect="${kind}:${index}">
                    <option value="aspect-video" ${item.aspectClass === "aspect-video" ? "selected" : ""}>Querformat</option>
                    <option value="aspect-square" ${item.aspectClass === "aspect-square" ? "selected" : ""}>Quadrat</option>
                  </select>
                  <label style="display:flex; align-items:center; gap:10px; margin:0; white-space:nowrap;">
                    <input type="checkbox" data-academy-grayscale="${kind}:${index}" ${item.grayscale ? "checked" : ""}>
                    Graustufen Hover
                  </label>
                </div>
              </div>
            </div>

            <button class="button danger" type="button" data-remove-academy-offer="${kind}:${index}">Eintrag entfernen</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="academyPageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(ACADEMY_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/academy/?preview=${previewStamp}" target="_blank" rel="noreferrer">Academy Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="metaTitle" value="${escapeHtml(data.metaTitle || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="metaTitleEn" value="${escapeHtml(data.metaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="metaDescription">${escapeHtml(data.metaDescription || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="metaDescriptionEn">${escapeHtml(data.metaDescriptionEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Header</h2>
          <div class="field-grid-2">
            <div class="field"><label>Überschrift DE</label><textarea name="heroTitle">${escapeHtml(data.heroTitle || "")}</textarea></div>
            <div class="field"><label>Überschrift EN</label><textarea name="heroTitleEn">${escapeHtml(data.heroTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Einleitung DE</label><textarea name="heroCopy">${escapeHtml(data.heroCopy || "")}</textarea></div>
            <div class="field"><label>Einleitung EN</label><textarea name="heroCopyEn">${escapeHtml(data.heroCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Laufschrift DE</label><textarea name="marqueeText">${escapeHtml(data.marqueeText || "")}</textarea></div>
            <div class="field"><label>Laufschrift EN</label><textarea name="marqueeTextEn">${escapeHtml(data.marqueeTextEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Bereiche</h2>
          <div class="field-grid-2">
            <div class="field"><label>Workshops Track DE</label><input type="text" name="workshopsTrack" value="${escapeHtml(data.workshopsTrack || "")}"></div>
            <div class="field"><label>Workshops Track EN</label><input type="text" name="workshopsTrackEn" value="${escapeHtml(data.workshopsTrackEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Workshops Überschrift DE</label><input type="text" name="workshopsTitle" value="${escapeHtml(data.workshopsTitle || "")}"></div>
            <div class="field"><label>Workshops Überschrift EN</label><input type="text" name="workshopsTitleEn" value="${escapeHtml(data.workshopsTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Helper DE</label><input type="text" name="workshopsHelper" value="${escapeHtml(data.workshopsHelper || "")}"></div>
            <div class="field"><label>Helper EN</label><input type="text" name="workshopsHelperEn" value="${escapeHtml(data.workshopsHelperEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Presets Track DE</label><input type="text" name="presetsTrack" value="${escapeHtml(data.presetsTrack || "")}"></div>
            <div class="field"><label>Presets Track EN</label><input type="text" name="presetsTrackEn" value="${escapeHtml(data.presetsTrackEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Presets Überschrift DE</label><input type="text" name="presetsTitle" value="${escapeHtml(data.presetsTitle || "")}"></div>
            <div class="field"><label>Presets Überschrift EN</label><input type="text" name="presetsTitleEn" value="${escapeHtml(data.presetsTitleEn || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Abschluss</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="closingEyebrow" value="${escapeHtml(data.closingEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="closingEyebrowEn" value="${escapeHtml(data.closingEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Copy DE</label><textarea name="closingCopy">${escapeHtml(data.closingCopy || "")}</textarea></div>
            <div class="field"><label>Copy EN</label><textarea name="closingCopyEn">${escapeHtml(data.closingCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA DE</label><input type="text" name="closingCta" value="${escapeHtml(data.closingCta || "")}"></div>
            <div class="field"><label>CTA EN</label><input type="text" name="closingCtaEn" value="${escapeHtml(data.closingCtaEn || "")}"></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Detailseite & Stripe</h2>
          <div class="field-grid-2">
            <div class="field"><label>Zurück Link DE</label><input type="text" name="detailBack" value="${escapeHtml(data.detailBack || "")}"></div>
            <div class="field"><label>Zurück Link EN</label><input type="text" name="detailBackEn" value="${escapeHtml(data.detailBackEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Preview Label DE</label><input type="text" name="detailPreview" value="${escapeHtml(data.detailPreview || "")}"></div>
            <div class="field"><label>Preview Label EN</label><input type="text" name="detailPreviewEn" value="${escapeHtml(data.detailPreviewEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Angebot Label DE</label><input type="text" name="detailOffer" value="${escapeHtml(data.detailOffer || "")}"></div>
            <div class="field"><label>Angebot Label EN</label><input type="text" name="detailOfferEn" value="${escapeHtml(data.detailOfferEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Beschreibung Label DE</label><input type="text" name="detailCopyTitle" value="${escapeHtml(data.detailCopyTitle || "")}"></div>
            <div class="field"><label>Beschreibung Label EN</label><input type="text" name="detailCopyTitleEn" value="${escapeHtml(data.detailCopyTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Standard CTA Workshop DE</label><input type="text" name="detailCtaWorkshop" value="${escapeHtml(data.detailCtaWorkshop || "")}"></div>
            <div class="field"><label>Standard CTA Workshop EN</label><input type="text" name="detailCtaWorkshopEn" value="${escapeHtml(data.detailCtaWorkshopEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Standard CTA Preset DE</label><input type="text" name="detailCtaPreset" value="${escapeHtml(data.detailCtaPreset || "")}"></div>
            <div class="field"><label>Standard CTA Preset EN</label><input type="text" name="detailCtaPresetEn" value="${escapeHtml(data.detailCtaPresetEn || "")}"></div>
          </div>
          <div class="field">
            <label>Stripe Standard Checkout / Payment Link</label>
            <input type="text" name="stripeStoreUrl" value="${escapeHtml(data.stripeStoreUrl || "")}" placeholder="https://buy.stripe.com/...">
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Stripe Hinweis DE</label><textarea name="stripeNotice">${escapeHtml(data.stripeNotice || "")}</textarea></div>
            <div class="field"><label>Stripe Hinweis EN</label><textarea name="stripeNoticeEn">${escapeHtml(data.stripeNoticeEn || "")}</textarea></div>
          </div>
        </div>

        ${renderOfferFields(data.workshops, "workshop", "Workshops")}
        ${renderOfferFields(data.presets, "preset", "Presets")}

        <div class="actions">
          <a class="button secondary" href="/academy/?preview=${previewStamp}" target="_blank" rel="noreferrer">Academy Seite öffnen</a>
          <button class="button secondary" type="button" data-add-academy-offer="workshop">Weiteren Workshop hinzufügen</button>
          <button class="button secondary" type="button" data-add-academy-offer="preset">Weiteres Preset hinzufügen</button>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const rerender = async () => {
    state.cache[ACADEMY_FILE] = { type: "json", data };
    await bindAcademyPage();
  };

  app.querySelectorAll("[data-add-academy-offer]").forEach((button) => {
    button.addEventListener("click", async () => {
      const kind = button.dataset.addAcademyOffer;
      if (kind === "workshop") {
        data.workshops.push(createEmptyOffer("workshop"));
      } else {
        data.presets.push(createEmptyOffer("preset"));
      }
      await rerender();
    });
  });

  app.querySelectorAll("[data-remove-academy-offer]").forEach((button) => {
    button.addEventListener("click", async () => {
      const [kind, indexValue] = button.dataset.removeAcademyOffer.split(":");
      const index = Number(indexValue);
      const target = kind === "workshop" ? data.workshops : data.presets;
      target.splice(index, 1);
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-academy-offer-up]").forEach((button) => {
    button.addEventListener("click", async () => {
      const [kind, indexValue] = button.dataset.moveAcademyOfferUp.split(":");
      const index = Number(indexValue);
      const target = kind === "workshop" ? data.workshops : data.presets;
      if (index <= 0) return;
      [target[index - 1], target[index]] = [target[index], target[index - 1]];
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-academy-offer-down]").forEach((button) => {
    button.addEventListener("click", async () => {
      const [kind, indexValue] = button.dataset.moveAcademyOfferDown.split(":");
      const index = Number(indexValue);
      const target = kind === "workshop" ? data.workshops : data.presets;
      if (index >= target.length - 1) return;
      [target[index], target[index + 1]] = [target[index + 1], target[index]];
      await rerender();
    });
  });

  app.querySelectorAll("[data-academy-clear-image]").forEach((button) => {
    button.addEventListener("click", async () => {
      const [kind, indexValue] = button.dataset.academyClearImage.split(":");
      const index = Number(indexValue);
      const target = kind === "workshop" ? data.workshops : data.presets;
      target[index].image = "";
      target[index].alt = "";
      target[index].altEn = "";
      setStatus("Bild und ALT-Texte entfernt.", "success");
      await rerender();
    });
  });

  app.querySelectorAll("[data-academy-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const [kind, indexValue] = event.target.dataset.academyUpload.split(":");
      const index = Number(indexValue);
      const target = kind === "workshop" ? data.workshops : data.presets;
      try {
        setStatus("Bild wird hochgeladen...");
        target[index].image = await uploadFileToLibrary(fileToUpload);
        if (!String(target[index].alt || "").trim()) {
          target[index].alt = buildAutoAltFromImagePath(fileToUpload.name, `${kind === "preset" ? "Preset" : "Workshop"} ${index + 1}`);
        }
        if (!String(target[index].altEn || "").trim() && String(target[index].alt || "").trim()) {
          try {
            target[index].altEn = await translateCmsText(target[index].alt, "de", "en");
          } catch {
            target[index].altEn = "";
          }
        }
        setStatus("Bild erfolgreich hochgeladen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  [
    ["[name='metaTitle']", "[name='metaTitleEn']"],
    ["[name='metaDescription']", "[name='metaDescriptionEn']"],
    ["[name='heroTitle']", "[name='heroTitleEn']"],
    ["[name='heroCopy']", "[name='heroCopyEn']"],
    ["[name='marqueeText']", "[name='marqueeTextEn']"],
    ["[name='workshopsTrack']", "[name='workshopsTrackEn']"],
    ["[name='workshopsTitle']", "[name='workshopsTitleEn']"],
    ["[name='workshopsHelper']", "[name='workshopsHelperEn']"],
    ["[name='presetsTrack']", "[name='presetsTrackEn']"],
    ["[name='presetsTitle']", "[name='presetsTitleEn']"],
    ["[name='closingEyebrow']", "[name='closingEyebrowEn']"],
    ["[name='closingCopy']", "[name='closingCopyEn']"],
    ["[name='closingCta']", "[name='closingCtaEn']"],
    ["[name='detailBack']", "[name='detailBackEn']"],
    ["[name='detailPreview']", "[name='detailPreviewEn']"],
    ["[name='detailOffer']", "[name='detailOfferEn']"],
    ["[name='detailCopyTitle']", "[name='detailCopyTitleEn']"],
    ["[name='detailCtaWorkshop']", "[name='detailCtaWorkshopEn']"],
    ["[name='detailCtaPreset']", "[name='detailCtaPresetEn']"],
    ["[name='stripeNotice']", "[name='stripeNoticeEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  const connectOfferTranslations = (items, kind) => {
    items.forEach((_, index) => {
      [
        [`[data-academy-title='${kind}:${index}']`, `[data-academy-title-en='${kind}:${index}']`],
        [`[data-academy-label='${kind}:${index}']`, `[data-academy-label-en='${kind}:${index}']`],
        [`[data-academy-price='${kind}:${index}']`, `[data-academy-price-en='${kind}:${index}']`],
        [`[data-academy-cta='${kind}:${index}']`, `[data-academy-cta-en='${kind}:${index}']`],
        [`[data-academy-description='${kind}:${index}']`, `[data-academy-description-en='${kind}:${index}']`],
        [`[data-academy-detail='${kind}:${index}']`, `[data-academy-detail-en='${kind}:${index}']`],
        [`[data-academy-alt='${kind}:${index}']`, `[data-academy-alt-en='${kind}:${index}']`],
        [`[data-academy-resource-label='${kind}:${index}']`, `[data-academy-resource-label-en='${kind}:${index}']`],
        [`[data-academy-install-text='${kind}:${index}']`, `[data-academy-install-text-en='${kind}:${index}']`],
        [`[data-academy-legal-note='${kind}:${index}']`, `[data-academy-legal-note-en='${kind}:${index}']`]
      ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));
    });
  };

  connectOfferTranslations(data.workshops, "workshop");
  connectOfferTranslations(data.presets, "preset");

  document.getElementById("academyPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const collectOffers = (items, kind) => items.map((_, index) => {
      const title = form.querySelector(`[data-academy-title="${kind}:${index}"]`)?.value || "";
      const generatedSlug = slugify(
        form.querySelector(`[data-academy-slug="${kind}:${index}"]`)?.value ||
        title
      );
      return {
        slug: generatedSlug || `${kind}-${index + 1}`,
        title,
        titleEn: form.querySelector(`[data-academy-title-en="${kind}:${index}"]`)?.value || "",
        label: form.querySelector(`[data-academy-label="${kind}:${index}"]`)?.value || "",
        labelEn: form.querySelector(`[data-academy-label-en="${kind}:${index}"]`)?.value || "",
        description: form.querySelector(`[data-academy-description="${kind}:${index}"]`)?.value || "",
        descriptionEn: form.querySelector(`[data-academy-description-en="${kind}:${index}"]`)?.value || "",
        detailText: form.querySelector(`[data-academy-detail="${kind}:${index}"]`)?.value || "",
        detailTextEn: form.querySelector(`[data-academy-detail-en="${kind}:${index}"]`)?.value || "",
        price: form.querySelector(`[data-academy-price="${kind}:${index}"]`)?.value || "",
        priceEn: form.querySelector(`[data-academy-price-en="${kind}:${index}"]`)?.value || "",
        cta: form.querySelector(`[data-academy-cta="${kind}:${index}"]`)?.value || "",
        ctaEn: form.querySelector(`[data-academy-cta-en="${kind}:${index}"]`)?.value || "",
        image: form.querySelector(`[data-academy-image="${kind}:${index}"]`)?.value || "",
        alt: form.querySelector(`[data-academy-alt="${kind}:${index}"]`)?.value || "",
        altEn: form.querySelector(`[data-academy-alt-en="${kind}:${index}"]`)?.value || "",
        aspectClass: form.querySelector(`[data-academy-aspect="${kind}:${index}"]`)?.value || (kind === "preset" ? "aspect-square" : "aspect-video"),
        videoEmbed: form.querySelector(`[data-academy-video="${kind}:${index}"]`)?.value || "",
        paymentType: form.querySelector(`[data-academy-payment-type="${kind}:${index}"]`)?.value || "contact",
        productUrl: form.querySelector(`[data-academy-product-url="${kind}:${index}"]`)?.value || "",
        stripeUrl: form.querySelector(`[data-academy-stripe-url="${kind}:${index}"]`)?.value || "",
        stripePriceId: form.querySelector(`[data-academy-stripe-price-id="${kind}:${index}"]`)?.value || "",
        bundleId: form.querySelector(`[data-academy-bundle-id="${kind}:${index}"]`)?.value || "",
        resourceUrl: form.querySelector(`[data-academy-resource-url="${kind}:${index}"]`)?.value || "",
        resourceLabel: form.querySelector(`[data-academy-resource-label="${kind}:${index}"]`)?.value || "",
        resourceLabelEn: form.querySelector(`[data-academy-resource-label-en="${kind}:${index}"]`)?.value || "",
        installText: form.querySelector(`[data-academy-install-text="${kind}:${index}"]`)?.value || "",
        installTextEn: form.querySelector(`[data-academy-install-text-en="${kind}:${index}"]`)?.value || "",
        legalNote: form.querySelector(`[data-academy-legal-note="${kind}:${index}"]`)?.value || "",
        legalNoteEn: form.querySelector(`[data-academy-legal-note-en="${kind}:${index}"]`)?.value || "",
        grayscale: Boolean(form.querySelector(`[data-academy-grayscale="${kind}:${index}"]`)?.checked)
      };
    }).filter((item) => item.title || item.titleEn || item.image || item.description || item.descriptionEn);

    const nextData = {
      metaTitle: form.metaTitle.value,
      metaTitleEn: form.metaTitleEn.value,
      metaDescription: form.metaDescription.value,
      metaDescriptionEn: form.metaDescriptionEn.value,
      heroTitle: form.heroTitle.value,
      heroTitleEn: form.heroTitleEn.value,
      heroCopy: form.heroCopy.value,
      heroCopyEn: form.heroCopyEn.value,
      marqueeText: form.marqueeText.value,
      marqueeTextEn: form.marqueeTextEn.value,
      workshopsTrack: form.workshopsTrack.value,
      workshopsTrackEn: form.workshopsTrackEn.value,
      workshopsTitle: form.workshopsTitle.value,
      workshopsTitleEn: form.workshopsTitleEn.value,
      workshopsHelper: form.workshopsHelper.value,
      workshopsHelperEn: form.workshopsHelperEn.value,
      presetsTrack: form.presetsTrack.value,
      presetsTrackEn: form.presetsTrackEn.value,
      presetsTitle: form.presetsTitle.value,
      presetsTitleEn: form.presetsTitleEn.value,
      closingEyebrow: form.closingEyebrow.value,
      closingEyebrowEn: form.closingEyebrowEn.value,
      closingCopy: form.closingCopy.value,
      closingCopyEn: form.closingCopyEn.value,
      closingCta: form.closingCta.value,
      closingCtaEn: form.closingCtaEn.value,
      detailBack: form.detailBack.value,
      detailBackEn: form.detailBackEn.value,
      detailPreview: form.detailPreview.value,
      detailPreviewEn: form.detailPreviewEn.value,
      detailOffer: form.detailOffer.value,
      detailOfferEn: form.detailOfferEn.value,
      detailCopyTitle: form.detailCopyTitle.value,
      detailCopyTitleEn: form.detailCopyTitleEn.value,
      detailCtaWorkshop: form.detailCtaWorkshop.value,
      detailCtaWorkshopEn: form.detailCtaWorkshopEn.value,
      detailCtaPreset: form.detailCtaPreset.value,
      detailCtaPresetEn: form.detailCtaPresetEn.value,
      stripeStoreUrl: form.stripeStoreUrl.value,
      stripeNotice: form.stripeNotice.value,
      stripeNoticeEn: form.stripeNoticeEn.value,
      woocommerceStoreUrl: "",
      woocommerceNotice: "",
      woocommerceNoticeEn: "",
      workshops: collectOffers(data.workshops, "workshop"),
      presets: collectOffers(data.presets, "preset")
    };

    setStatus("Academy Seite wird gespeichert...");
    try {
      await saveFile(ACADEMY_FILE, { type: "json", data: nextData });
      setStatus("Academy Seite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      } else {
        await render();
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindAboutPage = async () => {
  const file = await ensureFile(ABOUT_FILE);
  const data = structuredClone(file.data);
  data.timeline = Array.isArray(data.timeline) ? data.timeline : [];
  data.portraitImages = Array.isArray(data.portraitImages)
    ? data.portraitImages.map((entry) => {
        if (typeof entry === "string") return { image: entry };
        if (entry && typeof entry === "object") return { image: entry.image || "" };
        return { image: "" };
      })
    : [];
  if (!data.portraitImages.length && data.portraitImage) {
    data.portraitImages = [{ image: data.portraitImage }];
  }
  const storyCopyDe = buildCombinedStoryCopy(data, "storyCopy");
  const storyCopyEn = buildCombinedStoryCopy(data, "storyCopyEn");

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="aboutPageForm">
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">${escapeHtml(ABOUT_FILE)}</div>
          <div class="actions" style="margin-top: 0;">
            <a class="button secondary" href="/about/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">About Seite öffnen</a>
            <button class="button secondary" type="submit">Speichern</button>
            <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">SEO</h2>
          <div class="field-grid-2">
            <div class="field"><label>Meta Title DE</label><input type="text" name="metaTitle" value="${escapeHtml(data.metaTitle || "")}"></div>
            <div class="field"><label>Meta Title EN</label><input type="text" name="metaTitleEn" value="${escapeHtml(data.metaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Meta Description DE</label><textarea name="metaDescription">${escapeHtml(data.metaDescription || "")}</textarea></div>
            <div class="field"><label>Meta Description EN</label><textarea name="metaDescriptionEn">${escapeHtml(data.metaDescriptionEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Hero</h2>
          <div class="field-grid-2">
            <div class="field"><label>Hero Title DE</label><textarea name="heroTitle">${escapeHtml(data.heroTitle || "")}</textarea></div>
            <div class="field"><label>Hero Title EN</label><textarea name="heroTitleEn">${escapeHtml(data.heroTitleEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Hero Copy DE</label><textarea name="heroCopy">${escapeHtml(data.heroCopy || "")}</textarea></div>
            <div class="field"><label>Hero Copy EN</label><textarea name="heroCopyEn">${escapeHtml(data.heroCopyEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Portrait</h2>
          <div class="field">
            <label>Portraitbild</label>
            <input type="text" name="portraitImage" value="${escapeHtml(data.portraitImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>
                Portrait hochladen
                <input type="file" id="aboutPortraitUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
              </label>
              <button class="button danger" type="button" id="aboutPortraitClear">Bild entfernen</button>
            </div>
            <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(data.portraitImage || "URL wird nach Upload automatisch erzeugt.")}</div>
            ${data.portraitImage ? `
              <div class="inline-image-preview">
                <img src="${escapeHtml(data.portraitImage)}" alt="${escapeHtml(data.portraitAlt || "Portrait Vorschau")}">
                <span>${escapeHtml(data.portraitImage)}</span>
              </div>
            ` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="portraitAlt">${escapeHtml(data.portraitAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="portraitAltEn">${escapeHtml(data.portraitAltEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Rollenzeile DE</label><input type="text" name="portraitRole" value="${escapeHtml(data.portraitRole || "")}"></div>
            <div class="field"><label>Rollenzeile EN</label><input type="text" name="portraitRoleEn" value="${escapeHtml(data.portraitRoleEn || "")}"></div>
          </div>
          <div class="section-card" style="margin-top: 18px; padding: 18px; background: #fbfaf7;">
            <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
              <h3 class="section-title" style="margin: 0;">Weitere About Bilder</h3>
              <div class="actions" style="margin-top: 0; gap: 10px;">
                <label class="button secondary" style="cursor:pointer;">
                  Bild hochladen
                  <input type="file" id="aboutPortraitGalleryUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif" style="display:none;">
                </label>
                <button class="button secondary" type="button" id="addAboutPortraitImage">Bildfeld hinzufügen</button>
              </div>
            </div>
            <div class="muted" style="margin-bottom: 12px;">Diese Bilder werden auf der About-Seite zufällig beim Laden gewechselt.</div>
            <div class="array-list">
              ${data.portraitImages.length ? data.portraitImages.map((item, index) => `
                <div class="array-item">
                  <div class="field">
                    <label>Bild ${index + 1}</label>
                    <input type="text" data-about-portrait-image="${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                  </div>
                  ${item.image ? `
                    <div class="inline-image-preview">
                      <img src="${escapeHtml(item.image)}" alt="About Bild ${index + 1}">
                      <span>${escapeHtml(item.image)}</span>
                    </div>
                  ` : ""}
                  <div class="actions" style="justify-content: flex-start; gap: 10px;">
                    <button class="button secondary" type="button" data-move-about-portrait-up="${index}">Nach oben</button>
                    <button class="button secondary" type="button" data-move-about-portrait-down="${index}">Nach unten</button>
                    <button class="button danger" type="button" data-remove-about-portrait="${index}">Entfernen</button>
                  </div>
                </div>
              `).join("") : `<div class="muted">Noch keine zusätzlichen About-Bilder hinterlegt.</div>`}
            </div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Textbereich</h2>
          <div class="field-grid-2">
            <div class="field"><label>Section Title DE</label><input type="text" name="storyTitle" value="${escapeHtml(data.storyTitle || "")}"></div>
            <div class="field"><label>Section Title EN</label><input type="text" name="storyTitleEn" value="${escapeHtml(data.storyTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Textbereich DE</label><textarea name="storyCopy" rows="10" placeholder="Mehrere Absätze mit Leerzeile trennen">${escapeHtml(storyCopyDe)}</textarea></div>
            <div class="field"><label>Textbereich EN</label><textarea name="storyCopyEn" rows="10" placeholder="Separate paragraphs with blank lines">${escapeHtml(storyCopyEn)}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">Philosophie</h2>
          <div class="field-grid-2">
            <div class="field"><label>Eyebrow DE</label><input type="text" name="philosophyEyebrow" value="${escapeHtml(data.philosophyEyebrow || "")}"></div>
            <div class="field"><label>Eyebrow EN</label><input type="text" name="philosophyEyebrowEn" value="${escapeHtml(data.philosophyEyebrowEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Quote DE</label><textarea name="philosophyQuote">${escapeHtml(data.philosophyQuote || "")}</textarea></div>
            <div class="field"><label>Quote EN</label><textarea name="philosophyQuoteEn">${escapeHtml(data.philosophyQuoteEn || "")}</textarea></div>
          </div>
        </div>

        <div class="section-card">
          <div class="actions" style="justify-content: space-between; margin-top: 0; margin-bottom: 14px;">
            <h2 class="section-title" style="margin: 0;">Timeline</h2>
            <button class="button secondary" type="button" id="addAboutTimelineItem">Timeline Punkt hinzufuegen</button>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>Timeline Eyebrow DE</label><input type="text" name="timelineEyebrow" value="${escapeHtml(data.timelineEyebrow || "")}"></div>
            <div class="field"><label>Timeline Eyebrow EN</label><input type="text" name="timelineEyebrowEn" value="${escapeHtml(data.timelineEyebrowEn || "")}"></div>
          </div>
          <div class="array-list">
            ${data.timeline.map((item, index) => `
              <div class="array-item">
                <div class="field-grid-2">
                  <div class="field"><label>Jahr DE ${index + 1}</label><input type="text" data-about-timeline="year" data-about-index="${index}" value="${escapeHtml(item.year || "")}"></div>
                  <div class="field"><label>Jahr EN ${index + 1}</label><input type="text" data-about-timeline="yearEn" data-about-index="${index}" value="${escapeHtml(item.yearEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Titel DE</label><input type="text" data-about-timeline="title" data-about-index="${index}" value="${escapeHtml(item.title || "")}"></div>
                  <div class="field"><label>Titel EN</label><input type="text" data-about-timeline="titleEn" data-about-index="${index}" value="${escapeHtml(item.titleEn || "")}"></div>
                </div>
                <div class="field-grid-2">
                  <div class="field"><label>Copy DE</label><textarea data-about-timeline="copy" data-about-index="${index}">${escapeHtml(item.copy || "")}</textarea></div>
                  <div class="field"><label>Copy EN</label><textarea data-about-timeline="copyEn" data-about-index="${index}">${escapeHtml(item.copyEn || "")}</textarea></div>
                </div>
                <button class="button danger" type="button" data-remove-about-timeline="${index}">Timeline Punkt entfernen</button>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section-card">
          <h2 class="section-title">CTA Abschluss</h2>
          <div class="field-grid-2">
            <div class="field"><label>CTA Title DE</label><input type="text" name="ctaTitle" value="${escapeHtml(data.ctaTitle || "")}"></div>
            <div class="field"><label>CTA Title EN</label><input type="text" name="ctaTitleEn" value="${escapeHtml(data.ctaTitleEn || "")}"></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA Copy DE</label><textarea name="ctaCopy">${escapeHtml(data.ctaCopy || "")}</textarea></div>
            <div class="field"><label>CTA Copy EN</label><textarea name="ctaCopyEn">${escapeHtml(data.ctaCopyEn || "")}</textarea></div>
          </div>
          <div class="field-grid-2">
            <div class="field"><label>CTA Link Label DE</label><input type="text" name="ctaLinkLabel" value="${escapeHtml(data.ctaLinkLabel || "")}"></div>
            <div class="field"><label>CTA Link Label EN</label><input type="text" name="ctaLinkLabelEn" value="${escapeHtml(data.ctaLinkLabelEn || "")}"></div>
          </div>
          <div class="field">
            <label>CTA Bild</label>
            <input type="text" name="ctaImage" value="${escapeHtml(data.ctaImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>
                CTA Bild hochladen
                <input type="file" id="aboutCtaUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
              </label>
              <button class="button danger" type="button" id="aboutCtaClear">Bild entfernen</button>
            </div>
            <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(data.ctaImage || "URL wird nach Upload automatisch erzeugt.")}</div>
            ${data.ctaImage ? `
              <div class="inline-image-preview">
                <img src="${escapeHtml(data.ctaImage)}" alt="${escapeHtml(data.ctaAlt || "CTA Bild Vorschau")}">
                <span>${escapeHtml(data.ctaImage)}</span>
              </div>
            ` : ""}
          </div>
          <div class="field-grid-2">
            <div class="field"><label>ALT Text DE</label><textarea name="ctaAlt">${escapeHtml(data.ctaAlt || "")}</textarea></div>
            <div class="field"><label>ALT Text EN</label><textarea name="ctaAltEn">${escapeHtml(data.ctaAltEn || "")}</textarea></div>
          </div>
        </div>

        <div class="actions">
          <a class="button secondary" href="/about/?preview=${state.lastSavedAt || Date.now()}" target="_blank" rel="noreferrer">About Seite öffnen</a>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  const rerender = async () => {
    state.cache[ABOUT_FILE] = { type: "json", data };
    await bindAboutPage();
  };

  document.getElementById("addAboutTimelineItem").addEventListener("click", async () => {
    data.timeline.push({ year: "", yearEn: "", title: "", titleEn: "", copy: "", copyEn: "" });
    await rerender();
  });

  app.querySelectorAll("[data-remove-about-timeline]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.timeline.splice(Number(button.dataset.removeAboutTimeline), 1);
      await rerender();
    });
  });

  document.getElementById("aboutPortraitUpload").addEventListener("change", async (event) => {
    const [fileToUpload] = event.target.files || [];
    if (!fileToUpload) return;
    try {
      setStatus("Portraitbild wird hochgeladen...");
      data.portraitImage = await uploadFileToLibrary(fileToUpload);
      setStatus("Portraitbild erfolgreich hochgeladen.", "success");
      await rerender();
    } catch (error) {
      setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
    }
  });

  document.getElementById("aboutPortraitClear").addEventListener("click", async () => {
    data.portraitImage = "";
    data.portraitAlt = "";
    data.portraitAltEn = "";
    setStatus("Portraitbild und ALT-Texte entfernt.", "success");
    await rerender();
  });

  const aboutPortraitGalleryUpload = document.getElementById("aboutPortraitGalleryUpload");
  if (aboutPortraitGalleryUpload) {
    aboutPortraitGalleryUpload.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      try {
        setStatus("Weiteres About Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        data.portraitImages.push({ image: uploadedPath });
        if (!data.portraitImage) data.portraitImage = uploadedPath;
        setStatus("About Bild erfolgreich hinzugefügt.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  }

  const addAboutPortraitImage = document.getElementById("addAboutPortraitImage");
  if (addAboutPortraitImage) {
    addAboutPortraitImage.addEventListener("click", async () => {
      data.portraitImages.push({ image: "" });
      await rerender();
    });
  }

  app.querySelectorAll("[data-remove-about-portrait]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.portraitImages.splice(Number(button.dataset.removeAboutPortrait), 1);
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-about-portrait-up]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.moveAboutPortraitUp);
      if (index <= 0) return;
      [data.portraitImages[index - 1], data.portraitImages[index]] = [data.portraitImages[index], data.portraitImages[index - 1]];
      await rerender();
    });
  });

  app.querySelectorAll("[data-move-about-portrait-down]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.moveAboutPortraitDown);
      if (index >= data.portraitImages.length - 1) return;
      [data.portraitImages[index + 1], data.portraitImages[index]] = [data.portraitImages[index], data.portraitImages[index + 1]];
      await rerender();
    });
  });

  document.getElementById("aboutCtaUpload").addEventListener("change", async (event) => {
    const [fileToUpload] = event.target.files || [];
    if (!fileToUpload) return;
    try {
      setStatus("CTA Bild wird hochgeladen...");
      data.ctaImage = await uploadFileToLibrary(fileToUpload);
      setStatus("CTA Bild erfolgreich hochgeladen.", "success");
      await rerender();
    } catch (error) {
      setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
    }
  });

  document.getElementById("aboutCtaClear").addEventListener("click", async () => {
    data.ctaImage = "";
    data.ctaAlt = "";
    data.ctaAltEn = "";
    setStatus("CTA-Bild und ALT-Texte entfernt.", "success");
    await rerender();
  });

  [
    ["[name='metaTitle']", "[name='metaTitleEn']"],
    ["[name='metaDescription']", "[name='metaDescriptionEn']"],
    ["[name='heroTitle']", "[name='heroTitleEn']"],
    ["[name='heroCopy']", "[name='heroCopyEn']"],
    ["[name='portraitAlt']", "[name='portraitAltEn']"],
    ["[name='portraitRole']", "[name='portraitRoleEn']"],
    ["[name='storyTitle']", "[name='storyTitleEn']"],
    ["[name='storyCopy']", "[name='storyCopyEn']"],
    ["[name='philosophyEyebrow']", "[name='philosophyEyebrowEn']"],
    ["[name='philosophyQuote']", "[name='philosophyQuoteEn']"],
    ["[name='timelineEyebrow']", "[name='timelineEyebrowEn']"],
    ["[name='ctaTitle']", "[name='ctaTitleEn']"],
    ["[name='ctaCopy']", "[name='ctaCopyEn']"],
    ["[name='ctaLinkLabel']", "[name='ctaLinkLabelEn']"],
    ["[name='ctaAlt']", "[name='ctaAltEn']"]
  ].forEach(([sourceSelector, targetSelector]) => attachAutoTranslation(sourceSelector, targetSelector));

  app.querySelectorAll('[data-about-timeline="title"]').forEach((node, index) => {
    attachAutoTranslation(
      `[data-about-timeline="title"][data-about-index="${index}"]`,
      `[data-about-timeline="titleEn"][data-about-index="${index}"]`
    );
  });

  app.querySelectorAll('[data-about-timeline="copy"]').forEach((node, index) => {
    attachAutoTranslation(
      `[data-about-timeline="copy"][data-about-index="${index}"]`,
      `[data-about-timeline="copyEn"][data-about-index="${index}"]`
    );
  });

  document.getElementById("aboutPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const storyCopyPartsDe = splitStoryCopyForLegacyFields(form.storyCopy.value);
    const storyCopyPartsEn = splitStoryCopyForLegacyFields(form.storyCopyEn.value);
    const nextData = {
      metaTitle: form.metaTitle.value,
      metaDescription: form.metaDescription.value,
      metaTitleEn: form.metaTitleEn.value,
      metaDescriptionEn: form.metaDescriptionEn.value,
      heroTitle: form.heroTitle.value,
      heroTitleEn: form.heroTitleEn.value,
      heroCopy: form.heroCopy.value,
      heroCopyEn: form.heroCopyEn.value,
      portraitImage: form.portraitImage.value,
      portraitImages: Array.from(form.querySelectorAll("[data-about-portrait-image]"))
        .map((node) => ({ image: node.value.trim() }))
        .filter((entry) => entry.image),
      portraitAlt: form.portraitAlt.value,
      portraitAltEn: form.portraitAltEn.value,
      portraitRole: form.portraitRole.value,
      portraitRoleEn: form.portraitRoleEn.value,
      storyTitle: form.storyTitle.value,
      storyTitleEn: form.storyTitleEn.value,
      storyCopy: form.storyCopy.value,
      storyCopyEn: form.storyCopyEn.value,
      storyCopy1: storyCopyPartsDe.first,
      storyCopy1En: storyCopyPartsEn.first,
      storyCopy2: storyCopyPartsDe.second,
      storyCopy2En: storyCopyPartsEn.second,
      storyCopy3: storyCopyPartsDe.third,
      storyCopy3En: storyCopyPartsEn.third,
      philosophyEyebrow: form.philosophyEyebrow.value,
      philosophyEyebrowEn: form.philosophyEyebrowEn.value,
      philosophyQuote: form.philosophyQuote.value,
      philosophyQuoteEn: form.philosophyQuoteEn.value,
      timelineEyebrow: form.timelineEyebrow.value,
      timelineEyebrowEn: form.timelineEyebrowEn.value,
      timeline: data.timeline.map((_, index) => ({
        year: form.querySelector(`[data-about-timeline="year"][data-about-index="${index}"]`).value,
        yearEn: form.querySelector(`[data-about-timeline="yearEn"][data-about-index="${index}"]`).value,
        title: form.querySelector(`[data-about-timeline="title"][data-about-index="${index}"]`).value,
        titleEn: form.querySelector(`[data-about-timeline="titleEn"][data-about-index="${index}"]`).value,
        copy: form.querySelector(`[data-about-timeline="copy"][data-about-index="${index}"]`).value,
        copyEn: form.querySelector(`[data-about-timeline="copyEn"][data-about-index="${index}"]`).value
      })).filter((item) => item.year || item.yearEn || item.title || item.titleEn || item.copy || item.copyEn),
      ctaTitle: form.ctaTitle.value,
      ctaTitleEn: form.ctaTitleEn.value,
      ctaCopy: form.ctaCopy.value,
      ctaCopyEn: form.ctaCopyEn.value,
      ctaLinkLabel: form.ctaLinkLabel.value,
      ctaLinkLabelEn: form.ctaLinkLabelEn.value,
      ctaImage: form.ctaImage.value,
      ctaAlt: form.ctaAlt.value,
      ctaAltEn: form.ctaAltEn.value
    };

    setStatus("About Seite wird gespeichert...");
    try {
      await saveFile(ABOUT_FILE, { type: "json", data: nextData });
      setStatus("About Seite gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      } else {
        await render();
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindSettings = async () => {
  const file = await ensureFile(SETTINGS_FILE);
  const data = structuredClone(file.data);
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
  const savedMenuItems = Array.isArray(data.menuItems) ? data.menuItems : [];
  const mergedMenuItems = [
    ...savedMenuItems,
    ...defaultMenuItems.filter((defaultItem) => !savedMenuItems.some((item) => item.id === defaultItem.id))
  ];
  const menuItems = (mergedMenuItems.length ? mergedMenuItems : defaultMenuItems)
    .map((item, index) => {
      const fallback = defaultMenuItems.find((entry) => entry.id === item.id) || defaultMenuItems[index] || defaultMenuItems[0];
      return {
        id: item.id || fallback.id,
        labelDe: item.labelDe || fallback.labelDe,
        labelEn: item.labelEn || fallback.labelEn,
        visible: item.visible !== false,
        order: Number(item.order || index + 1)
      };
    })
    .sort((a, b) => a.order - b.order);

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="settingsForm">
        <div class="field">
          <label>Konfigurationsbild / Globales Bild</label>
          <div class="muted" style="margin-bottom: 12px;">Kann für globale Einstellungen, Vorschau oder spätere Einbindungen zentral gepflegt werden.</div>
          <input type="text" name="brandImage" value="${escapeHtml(data.brandImage || "")}" placeholder="/assets/uploads/datei.jpg">
          <div class="upload-inline" style="margin-top: 10px;">
            <label>
              Bild hochladen
              <input type="file" id="settingsBrandImageUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
            </label>
            <button class="button danger" type="button" id="settingsBrandImageClear">Bild entfernen</button>
          </div>
          <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(data.brandImage || "URL wird nach Upload automatisch erzeugt.")}</div>
          ${data.brandImage ? `
            <div class="inline-image-preview">
              <img src="${escapeHtml(data.brandImage)}" alt="Konfigurationsbild">
              <span>${escapeHtml(data.brandImage)}</span>
            </div>
          ` : ""}
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Site Name</label><input type="text" name="siteName" value="${escapeHtml(data.siteName)}"></div>
          <div class="field"><label>Business Name</label><input type="text" name="businessName" value="${escapeHtml(data.businessName)}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Default Language</label><select name="defaultLanguage"><option value="de" ${data.defaultLanguage === "de" ? "selected" : ""}>DE</option><option value="en" ${data.defaultLanguage === "en" ? "selected" : ""}>EN</option></select></div>
          <div class="field"><label>Site URL</label><input type="text" name="siteUrl" value="${escapeHtml(data.siteUrl)}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Phone</label><input type="text" name="phone" value="${escapeHtml(data.phone)}"></div>
          <div class="field"><label>Email</label><input type="email" name="email" value="${escapeHtml(data.email)}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Locality</label><input type="text" name="locality" value="${escapeHtml(data.locality)}"></div>
          <div class="field"><label>Region</label><input type="text" name="region" value="${escapeHtml(data.region)}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Instagram</label><input type="text" name="instagram" value="${escapeHtml(data.instagram)}"></div>
          <div class="field"><label>Pinterest</label><input type="text" name="pinterest" value="${escapeHtml(data.pinterest)}"></div>
        </div>
        <div class="field"><label>Google Reviews</label><input type="text" name="googleReviews" value="${escapeHtml(data.googleReviews)}"></div>
        <div class="field" style="padding-top: 8px; border-top: 1px solid var(--border);">
          <label style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);">Menü Einstellungen</label>
          <div class="muted" style="margin-top: 6px;">Hier kannst du die Reihenfolge der Menüreiter ändern, sie ein- oder ausblenden und die Bezeichnungen für Deutsch und Englisch pflegen.</div>
        </div>
        <div class="array-list">
          ${menuItems.map((item, index) => `
            <div class="array-item" data-menu-item="${escapeHtml(item.id)}">
              <div class="field-grid-2" style="align-items: end;">
                <div class="field">
                  <label>Menüpunkt</label>
                  <input type="text" value="${escapeHtml(item.id)}" readonly>
                </div>
                <div class="field">
                  <label>Reihenfolge</label>
                  <input type="number" min="1" step="1" name="menu.order.${escapeHtml(item.id)}" value="${escapeHtml(String(item.order || index + 1))}">
                </div>
              </div>
              <div class="field-grid-2">
                <div class="field"><label>Label DE</label><input type="text" name="menu.labelDe.${escapeHtml(item.id)}" value="${escapeHtml(item.labelDe || "")}"></div>
                <div class="field"><label>Label EN</label><input type="text" name="menu.labelEn.${escapeHtml(item.id)}" value="${escapeHtml(item.labelEn || "")}"></div>
              </div>
              <div class="field">
                <label style="display:flex; align-items:center; gap:10px; font-size:13px;">
                  <input type="checkbox" name="menu.visible.${escapeHtml(item.id)}" ${item.visible !== false ? "checked" : ""}>
                  Im Menü anzeigen
                </label>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="field" style="padding-top: 8px; border-top: 1px solid var(--border);">
          <label style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);">Seiten Einstellungen</label>
          <div class="muted" style="margin-top: 6px;">Texte für Impressum und AGB. Diese Seiten werden automatisch im Footer verlinkt.</div>
        </div>
        <div class="field" style="padding-top: 8px;">
          <label style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);">Kontakt Einstellungen</label>
          <div class="muted" style="margin-top: 6px;">Hier steuerst du die Empfänger-Mail des Formulars, die Direct-Mail-Adresse und den sichtbaren Standort auf der Kontaktseite.</div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Kontaktformular Empfänger</label><input type="email" name="contactFormRecipient" value="${escapeHtml(data.contactFormRecipient || data.email || "")}" placeholder="foto@blitzkneisser.com"></div>
          <div class="field"><label>Direct Mail Adresse</label><input type="email" name="contactDirectMail" value="${escapeHtml(data.contactDirectMail || data.email || "")}" placeholder="foto@blitzkneisser.com"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Telefon</label><input type="text" name="contactPhone" value="${escapeHtml(data.contactPhone || data.phone || "")}" placeholder="+43 664 3918228"></div>
          <div class="field"><label>Formular Button DE</label><input type="text" name="contactSubmitDe" value="${escapeHtml(data.contactSubmitDe || "")}" placeholder="Nachricht senden"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Formular Button EN</label><input type="text" name="contactSubmitEn" value="${escapeHtml(data.contactSubmitEn || "")}" placeholder="Send Message"></div>
          <div class="field"><label>Formular Titel DE</label><input type="text" name="contactIntroTitleDe" value="${escapeHtml(data.contactIntroTitleDe || "")}" placeholder="Begin a conversation"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Formular Titel EN</label><input type="text" name="contactIntroTitleEn" value="${escapeHtml(data.contactIntroTitleEn || "")}" placeholder="Begin a conversation"></div>
          <div class="field"><label>Formular Unterzeile DE</label><input type="text" name="contactIntroMetaDe" value="${escapeHtml(data.contactIntroMetaDe || "")}" placeholder="Antwort innerhalb von 48 Stunden"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Formular Unterzeile EN</label><input type="text" name="contactIntroMetaEn" value="${escapeHtml(data.contactIntroMetaEn || "")}" placeholder="We respond to inquiries within 48 hours"></div>
          <div class="field"><label>Label Name DE</label><input type="text" name="contactNameLabelDe" value="${escapeHtml(data.contactNameLabelDe || "")}" placeholder="Name"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Label Name EN</label><input type="text" name="contactNameLabelEn" value="${escapeHtml(data.contactNameLabelEn || "")}" placeholder="Name"></div>
          <div class="field"><label>Platzhalter Name DE</label><input type="text" name="contactNamePlaceholderDe" value="${escapeHtml(data.contactNamePlaceholderDe || "")}" placeholder="Euer Name"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter Name EN</label><input type="text" name="contactNamePlaceholderEn" value="${escapeHtml(data.contactNamePlaceholderEn || "")}" placeholder="Your name"></div>
          <div class="field"><label>Label E-Mail DE</label><input type="text" name="contactEmailLabelDe" value="${escapeHtml(data.contactEmailLabelDe || "")}" placeholder="E-Mail"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Label E-Mail EN</label><input type="text" name="contactEmailLabelEn" value="${escapeHtml(data.contactEmailLabelEn || "")}" placeholder="Email"></div>
          <div class="field"><label>Platzhalter E-Mail DE</label><input type="text" name="contactEmailPlaceholderDe" value="${escapeHtml(data.contactEmailPlaceholderDe || "")}" placeholder="hallo@beispiel.de"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter E-Mail EN</label><input type="text" name="contactEmailPlaceholderEn" value="${escapeHtml(data.contactEmailPlaceholderEn || "")}" placeholder="hello@example.com"></div>
          <div class="field"><label>Label Datum DE</label><input type="text" name="contactDateLabelDe" value="${escapeHtml(data.contactDateLabelDe || "")}" placeholder="Hochzeitsdatum"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Label Datum EN</label><input type="text" name="contactDateLabelEn" value="${escapeHtml(data.contactDateLabelEn || "")}" placeholder="Wedding Date"></div>
          <div class="field"><label>Platzhalter Datum DE</label><input type="text" name="contactDatePlaceholderDe" value="${escapeHtml(data.contactDatePlaceholderDe || "")}" placeholder="Wunschdatum"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter Datum EN</label><input type="text" name="contactDatePlaceholderEn" value="${escapeHtml(data.contactDatePlaceholderEn || "")}" placeholder="Preferred date"></div>
          <div class="field"><label>Label Ort DE</label><input type="text" name="contactLocationLabelDe" value="${escapeHtml(data.contactLocationLabelDe || "")}" placeholder="Ort"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Label Ort EN</label><input type="text" name="contactLocationLabelEn" value="${escapeHtml(data.contactLocationLabelEn || "")}" placeholder="Location"></div>
          <div class="field"><label>Platzhalter Ort DE</label><input type="text" name="contactLocationPlaceholderDe" value="${escapeHtml(data.contactLocationPlaceholderDe || "")}" placeholder="Tirol, Dolomiten, Alpen"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter Ort EN</label><input type="text" name="contactLocationPlaceholderEn" value="${escapeHtml(data.contactLocationPlaceholderEn || "")}" placeholder="Tyrol, Dolomites, Alps"></div>
          <div class="field"><label>Label Nachricht DE</label><input type="text" name="contactMessageLabelDe" value="${escapeHtml(data.contactMessageLabelDe || "")}" placeholder="Nachricht"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Label Nachricht EN</label><input type="text" name="contactMessageLabelEn" value="${escapeHtml(data.contactMessageLabelEn || "")}" placeholder="Message"></div>
          <div class="field"><label>Platzhalter Nachricht DE</label><input type="text" name="contactMessagePlaceholderDe" value="${escapeHtml(data.contactMessagePlaceholderDe || "")}" placeholder="Erzählt mir von euren Plänen..."></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter Nachricht EN</label><input type="text" name="contactMessagePlaceholderEn" value="${escapeHtml(data.contactMessagePlaceholderEn || "")}" placeholder="Share your plans..."></div>
          <div class="field"><label>Platzhalter Auswahl DE</label><input type="text" name="contactReferralPlaceholderDe" value="${escapeHtml(data.contactReferralPlaceholderDe || "")}" placeholder="Bitte auswählen"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Platzhalter Auswahl EN</label><input type="text" name="contactReferralPlaceholderEn" value="${escapeHtml(data.contactReferralPlaceholderEn || "")}" placeholder="Please select"></div>
          <div class="field"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Standort Text DE</label><textarea name="contactLocationDe" rows="4" placeholder="Innsbruck, Tirol&#10;Verfügbar in den Alpen">${escapeHtml(data.contactLocationDe || "")}</textarea></div>
          <div class="field"><label>Standort Text EN</label><textarea name="contactLocationEn" rows="4" placeholder="Innsbruck, Tyrol&#10;Available across the Alps">${escapeHtml(data.contactLocationEn || "")}</textarea></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Impressum Titel DE</label><input type="text" name="impressumTitleDe" value="${escapeHtml(data.impressumTitleDe || "")}"></div>
          <div class="field"><label>Impressum Titel EN</label><input type="text" name="impressumTitleEn" value="${escapeHtml(data.impressumTitleEn || "")}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>Impressum Text DE</label><textarea name="impressumBodyDe" rows="10" placeholder="Deutscher Impressumstext">${escapeHtml(data.impressumBodyDe || "")}</textarea></div>
          <div class="field"><label>Impressum Text EN</label><textarea name="impressumBodyEn" rows="10" placeholder="English legal notice text">${escapeHtml(data.impressumBodyEn || "")}</textarea></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>DSGVO Titel DE</label><input type="text" name="dsgvoTitleDe" value="${escapeHtml(data.dsgvoTitleDe || "")}"></div>
          <div class="field"><label>DSGVO Titel EN</label><input type="text" name="dsgvoTitleEn" value="${escapeHtml(data.dsgvoTitleEn || "")}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>DSGVO Text DE</label><textarea name="dsgvoBodyDe" rows="10" placeholder="Deutscher DSGVO-Text">${escapeHtml(data.dsgvoBodyDe || "")}</textarea></div>
          <div class="field"><label>DSGVO Text EN</label><textarea name="dsgvoBodyEn" rows="10" placeholder="English GDPR text">${escapeHtml(data.dsgvoBodyEn || "")}</textarea></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>AGB Titel DE</label><input type="text" name="agbTitleDe" value="${escapeHtml(data.agbTitleDe || "")}"></div>
          <div class="field"><label>AGB Titel EN</label><input type="text" name="agbTitleEn" value="${escapeHtml(data.agbTitleEn || "")}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field"><label>AGB Text DE</label><textarea name="agbBodyDe" rows="10" placeholder="Deutsche AGB">${escapeHtml(data.agbBodyDe || "")}</textarea></div>
          <div class="field"><label>AGB Text EN</label><textarea name="agbBodyEn" rows="10" placeholder="English terms and conditions">${escapeHtml(data.agbBodyEn || "")}</textarea></div>
        </div>
        <div class="actions">
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </form>
    </section>
  `;

  app.querySelector("#settingsBrandImageUpload").addEventListener("change", async (event) => {
    const [fileToUpload] = event.target.files || [];
    if (!fileToUpload) return;
    try {
      setStatus("Konfigurationsbild wird hochgeladen...");
      data.brandImage = await uploadFileToLibrary(fileToUpload);
      await saveFile(SETTINGS_FILE, { type: "json", data });
      setStatus("Konfigurationsbild erfolgreich hochgeladen.", "success");
      await bindSettings();
    } catch (error) {
      setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
    }
  });

  app.querySelector("#settingsBrandImageClear").addEventListener("click", async () => {
    data.brandImage = "";
    await saveFile(SETTINGS_FILE, { type: "json", data });
    setStatus("Konfigurationsbild entfernt.", "success");
    await bindSettings();
  });

  app.querySelector("#settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const next = { ...data, ...Object.fromEntries(new FormData(form).entries()) };
    next.menuItems = menuItems
      .map((item) => ({
        id: item.id,
        labelDe: form.querySelector(`[name="menu.labelDe.${item.id}"]`)?.value || item.labelDe || "",
        labelEn: form.querySelector(`[name="menu.labelEn.${item.id}"]`)?.value || item.labelEn || "",
        visible: Boolean(form.querySelector(`[name="menu.visible.${item.id}"]`)?.checked),
        order: Number(form.querySelector(`[name="menu.order.${item.id}"]`)?.value || item.order || 0)
      }))
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index + 1 }));
    const shouldOpenPreview = event.submitter?.value === "true";
    setStatus("Einstellungen werden gespeichert...");
    try {
      await saveFile(SETTINGS_FILE, { type: "json", data: next });
      setStatus("Einstellungen gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindPreisliste = async () => {
  const deFile = await ensureFile(PREISLISTE_FILES.de);
  const enFile = await ensureFile(PREISLISTE_FILES.en);
  const dataDe = structuredClone(deFile.data || {});
  let dataEn = structuredClone(enFile.data || {});

  const getBlock = (index) => dataDe.blocks?.[index] || {};
  const getColumn = (blockIndex, columnIndex = 0) => (dataDe.blocks?.[blockIndex]?.columns || [])[columnIndex] || {};
  const getGallery = (blockIndex) => (dataDe.blocks?.[blockIndex]?.gallery || []);
  let preislisteTranslationTimer = null;
  let preislisteTranslationJobId = 0;
  let preislisteTranslationRunning = false;
  function getDeepValue(root, path) {
    const parts = String(path || "").split(".").filter(Boolean);
    let cursor = root;
    for (const part of parts) {
      if (cursor == null) return "";
      const key = /^\d+$/.test(part) ? Number(part) : part;
      cursor = cursor[key];
    }
    return cursor ?? "";
  }

  const htmlToTextLines = (html, { preserveList = false } = {}) => {
    const container = document.createElement("div");
    container.innerHTML = String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, preserveList ? "• " : "");
    const text = (container.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return text;
  };

  const extractHeadingText = (html) => {
    const container = document.createElement("div");
    container.innerHTML = String(html || "");
    const heading = container.querySelector("h1, h2, h3, h4, h5, h6");
    return heading ? String(heading.textContent || "").trim() : htmlToTextLines(html).split("\n").find(Boolean) || "";
  };

  const extractBodyText = (html) => {
    const container = document.createElement("div");
    container.innerHTML = String(html || "");
    container.querySelectorAll("h1, h2, h3, h4, h5, h6, img, hr").forEach((node) => node.remove());
    return htmlToTextLines(container.innerHTML);
  };

  const extractListText = (html) => {
    const container = document.createElement("div");
    container.innerHTML = String(html || "");
    const items = Array.from(container.querySelectorAll("li"))
      .map((node) => String(node.textContent || "").trim())
      .filter(Boolean);
    if (items.length) return items.join("\n");
    return htmlToTextLines(container.innerHTML);
  };

  const escapeRichText = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const paragraphsToHtml = (value) => {
    return String(value || "")
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeRichText(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const buildRichHtml = (mode, value, tag = "h4") => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return "";
    if (mode === "heading") {
      return `<${tag}>${escapeRichText(cleaned)}</${tag}>`;
    }
    if (mode === "price") {
      return `<h2>${escapeRichText(cleaned)}</h2>`;
    }
    if (mode === "list") {
      const items = cleaned.split("\n").map((line) => line.replace(/^•\s*/, "").trim()).filter(Boolean);
      return `<h4>Inklusive:</h4><ul>${items.map((item) => `<li>${escapeRichText(item)}</li>`).join("")}</ul>`;
    }
    if (mode === "label") {
      return `<h4>${escapeRichText(cleaned)}</h4>`;
    }
    return paragraphsToHtml(cleaned);
  };

  const readRichValue = (mode, html) => {
    if (mode === "heading" || mode === "price" || mode === "label") return extractHeadingText(html);
    if (mode === "list") return extractListText(html);
    return extractBodyText(html);
  };

  const baseField = (label, path, value, type = "input", readOnly = false) => `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      ${type === "textarea"
        ? `<textarea data-preisliste-path="${escapeHtml(path)}" rows="6" ${readOnly ? "readonly" : ""}>${escapeHtml(value || "")}</textarea>`
        : `<input type="text" data-preisliste-path="${escapeHtml(path)}" value="${escapeHtml(value || "")}" ${readOnly ? "readonly" : ""}>`}
    </div>
  `;

  const imageField = (label, path, value) => `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <input type="text" data-preisliste-path="${escapeHtml(path)}" value="${escapeHtml(value || "")}" placeholder="/assets/uploads/datei.jpg">
      <div class="upload-inline" style="margin-top: 10px;">
        <label>
          Bild hochladen
          <input type="file" data-preisliste-upload="${escapeHtml(path)}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
        </label>
      </div>
    </div>
  `;

  const renderLangPair = (label, pathDe, pathEn, type = "textarea") => `
    <div class="field-grid-2">
      ${baseField(`${label} DE`, pathDe, getDeepValue(dataDe, pathDe), type)}
      ${baseField(`${label} EN`, pathEn, getDeepValue(dataEn, pathEn), type, true)}
    </div>
  `;

  const renderRichLangPair = (label, pathDe, pathEn, mode = "body", options = {}) => {
    const rows = options.rows || (mode === "body" || mode === "list" ? 8 : 3);
    const tag = options.tag || "h4";
    return `
      <div class="field-grid-2">
        <div class="field">
          <label>${escapeHtml(`${label} DE`)}</label>
          <textarea data-preisliste-rich-path="${escapeHtml(pathDe)}" data-preisliste-rich-mode="${escapeHtml(mode)}" data-preisliste-rich-tag="${escapeHtml(tag)}" rows="${rows}">${escapeHtml(readRichValue(mode, getDeepValue(dataDe, pathDe)))}</textarea>
        </div>
        <div class="field">
          <label>${escapeHtml(`${label} EN`)}</label>
          <textarea data-preisliste-rich-path="${escapeHtml(pathEn)}" data-preisliste-rich-mode="${escapeHtml(mode)}" data-preisliste-rich-tag="${escapeHtml(tag)}" rows="${rows}" readonly>${escapeHtml(readRichValue(mode, getDeepValue(dataEn, pathEn)))}</textarea>
        </div>
      </div>
    `;
  };

  const renderImagePair = (label, path) => `
    <div class="field-grid-2">
      ${imageField(`${label} DE`, path, getDeepValue(dataDe, path))}
      <div class="field">
        <label>${escapeHtml(`${label} EN`)}</label>
        <input type="text" value="${escapeHtml(getDeepValue(dataEn, path) || "")}" readonly>
      </div>
    </div>
  `;

  const renderColumnEditor = (blockIndex, columnIndex, columnLabel) => {
    const prefix = `blocks.${blockIndex}.columns.${columnIndex}`;
    const blockType = String(getBlock(blockIndex).type || "");
    const titleTag = blockType === "package-2" ? "h2" : "h4";
    return `
      <article class="section-card" style="padding: 16px; margin-bottom: 16px;">
        <div class="eyebrow" style="margin-bottom: 8px;">${escapeHtml(columnLabel)}</div>
        <div class="field-grid-2">
          ${renderLangPair("Anzeigename", `${prefix}.name`, `${prefix}.name`, "input")}
          ${renderRichLangPair("Preis", `${prefix}.price`, `${prefix}.price`, "price", { rows: 3 })}
        </div>
        <details class="section-card" style="padding: 14px; margin-top: 12px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Text & Inhalt</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderRichLangPair("Titel", `${prefix}.title`, `${prefix}.title`, "heading", { rows: 3, tag: titleTag })}
            ${renderRichLangPair("Beschreibung", `${prefix}.text`, `${prefix}.text`, "body", { rows: 7 })}
            ${renderRichLangPair("Inklusive Liste", `${prefix}.includes`, `${prefix}.includes`, "list", { rows: 7 })}
            ${renderRichLangPair("Zusatzlabel", `${prefix}.add_extras_text`, `${prefix}.add_extras_text`, "label", { rows: 3 })}
          </div>
        </details>
        <details class="section-card" style="padding: 14px; margin-top: 12px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Bild & Medien</summary>
          <div style="margin-top: 14px;">
            ${renderImagePair("Bild", `${prefix}.image.url`)}
          </div>
        </details>
      </article>
    `;
  };

  const renderGallery = (blockIndex) => {
    const items = getGallery(blockIndex);
    return `
      <div class="array-list">
        <div class="eyebrow" style="margin: 0 0 10px;">Galerie / Alt-Texte</div>
        ${items.map((item, index) => `
          <details class="section-card" style="padding: 14px; margin-bottom: 12px;">
            <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em;">Bild ${index + 1}</summary>
            <div style="margin-top: 14px; display: grid; gap: 12px;">
              <div class="field-grid-2">
                ${imageField(`Bild ${index + 1} DE`, `blocks.${blockIndex}.gallery.${index}.preview`, item.preview || item.url || "")}
                <div class="field">
                  <label>Bild ${index + 1} EN</label>
                  <input type="text" value="${escapeHtml((dataEn.blocks?.[blockIndex]?.gallery?.[index]?.preview || dataEn.blocks?.[blockIndex]?.gallery?.[index]?.url || ""))}" readonly>
                </div>
              </div>
              <div class="field-grid-2">
                ${baseField(`ALT ${index + 1} DE`, `blocks.${blockIndex}.gallery.${index}.alt`, item.alt || "", "textarea")}
                ${baseField(`ALT ${index + 1} EN`, `blocks.${blockIndex}.gallery.${index}.alt`, dataEn.blocks?.[blockIndex]?.gallery?.[index]?.alt || "", "textarea", true)}
              </div>
              <div class="field-grid-2">
                ${baseField(`Link ${index + 1} DE`, `blocks.${blockIndex}.gallery.${index}.link`, item.link || "", "input")}
                ${baseField(`Link ${index + 1} EN`, `blocks.${blockIndex}.gallery.${index}.link`, dataEn.blocks?.[blockIndex]?.gallery?.[index]?.link || "", "input", true)}
              </div>
              <div class="actions" style="margin-top: 0;">
                <button class="button secondary" type="button" data-gallery-move="${blockIndex}" data-index="${index}" data-dir="-1">Nach oben</button>
                <button class="button secondary" type="button" data-gallery-move="${blockIndex}" data-index="${index}" data-dir="1">Nach unten</button>
                <button class="button danger" type="button" data-gallery-remove="${blockIndex}" data-index="${index}">Entfernen</button>
              </div>
            </div>
          </details>
        `).join("")}
      </div>
      <div class="actions" style="margin-top: 10px;">
        <button class="button secondary" type="button" data-gallery-add="${blockIndex}">Bild hinzufügen</button>
      </div>
    `;
  };

  const getBlockAdminTitle = (block, index) => {
    const type = String(block?.type || "");
    const explicitName = String(block?.name || "").trim();
    if (index === 0) return "Intro";
    if (index === 1) return "Einleitung";
    if (type === "package-2") return explicitName || "Foto Packages";
    if (type === "video-centered") return explicitName || "Film";
    if (type === "slider-full-price-below") return explicitName || "After Wedding";
    if (type === "text-2columns") return explicitName || "FAQ";
    if (type === "collection-text-left-extra-right") return explicitName || "Zusatzstunden";
    if (type === "includes-left-slider-right") return explicitName || "Add Extras";
    if (type === "package-1") return explicitName || "Leistungsblock";
    return explicitName || type || `Block ${index + 1}`;
  };

  const getBlockAdminSummary = (block) => {
    const columns = Array.isArray(block?.columns) ? block.columns : [];
    const priceBits = columns
      .map((column) => String(column?.price || "").trim())
      .filter(Boolean)
      .slice(0, 3);
    const galleryCount = Array.isArray(block?.gallery) ? block.gallery.filter((item) => item?.preview || item?.url).length : 0;
    const unitCount = columns.length;
    const pieces = [];
    if (unitCount) pieces.push(`${unitCount} Einheit${unitCount === 1 ? "" : "en"}`);
    if (priceBits.length) pieces.push(priceBits.join(" · "));
    if (galleryCount) pieces.push(`${galleryCount} Bild${galleryCount === 1 ? "" : "er"}`);
    return pieces.join(" · ");
  };

  const blockCard = (title, index, body) => `
    <article class="section-card" id="preisliste-block-${index}" style="padding: 18px; margin-bottom: 18px; scroll-margin-top: 140px;">
      <div class="actions" style="justify-content: space-between; margin-top: 0;">
        <div>
          <div class="eyebrow">${escapeHtml(title)}</div>
          <div class="muted">${escapeHtml(getBlockAdminSummary(getBlock(index)) || `Block ${index + 1}`)}</div>
        </div>
        <div class="actions" style="margin-top: 0;">
          <button class="button secondary" type="button" data-block-move="${index}" data-dir="-1">Nach oben</button>
          <button class="button secondary" type="button" data-block-move="${index}" data-dir="1">Nach unten</button>
        </div>
      </div>
      <div style="margin-top: 16px; display: grid; gap: 12px;">
        ${body}
      </div>
    </article>
  `;

  const buildPriceOverview = (root) => {
    const blocks = Array.isArray(root?.blocks) ? root.blocks : [];
    const overview = [];

    blocks.forEach((block, blockIndex) => {
      const columns = Array.isArray(block?.columns) ? block.columns : [];
      columns.forEach((column, columnIndex) => {
        const rawLabel = String(column?.name || column?.title || block?.name || `Block ${blockIndex + 1}`).trim();
        const rawPrice = String(column?.price || "").trim();
        if (!rawLabel && !rawPrice) return;
        overview.push({
          label: rawLabel || `Block ${blockIndex + 1}.${columnIndex + 1}`,
          price: rawPrice || "Preis offen"
        });
      });
    });

    if (!overview.length) {
      return [{ label: "Keine Preisblöcke gefunden", price: "Bitte Inhalte prüfen" }];
    }

    return overview;
  };

  const renderBlockEditor = (index, block) => {
    const type = String(block.type || "");
    if (index === 0) {
      return blockCard("Intro", index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Startbereich</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            <div class="field-grid-2">
              <div class="field">
                <label>Intro Titel DE</label>
                <input type="text" data-preisliste-centered="intro-title-de" value="${escapeHtml(extractHeadingText(getDeepValue(dataDe, `blocks.${index}.text`)))}">
              </div>
              <div class="field">
                <label>Intro Titel EN</label>
                <input type="text" data-preisliste-centered="intro-title-en" value="${escapeHtml(extractHeadingText(getDeepValue(dataEn, `blocks.${index}.text`)))}" readonly>
              </div>
            </div>
            ${renderImagePair("Hintergrundbild", `blocks.${index}.background.image`)}
          </div>
        </details>
      `);
    }
    if (index === 1) {
      return blockCard("Einleitung", index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Kurztext</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            <div class="field-grid-2">
              <div class="field">
                <label>Bereich Titel DE</label>
                <input type="text" data-preisliste-centered="intro-copy-title-de" value="${escapeHtml(extractHeadingText(getDeepValue(dataDe, `blocks.${index}.text`)))}">
              </div>
              <div class="field">
                <label>Bereich Titel EN</label>
                <input type="text" data-preisliste-centered="intro-copy-title-en" value="${escapeHtml(extractHeadingText(getDeepValue(dataEn, `blocks.${index}.text`)))}" readonly>
              </div>
            </div>
            <div class="field-grid-2">
              <div class="field">
                <label>Einleitungstext DE</label>
                <textarea data-preisliste-centered="intro-copy-body-de" rows="10">${escapeHtml(extractBodyText(getDeepValue(dataDe, `blocks.${index}.text`)))}</textarea>
              </div>
              <div class="field">
                <label>Einleitungstext EN</label>
                <textarea data-preisliste-centered="intro-copy-body-en" rows="10" readonly>${escapeHtml(extractBodyText(getDeepValue(dataEn, `blocks.${index}.text`)))}</textarea>
              </div>
            </div>
          </div>
        </details>
      `);
    }
    if (type === "package-2") {
      return blockCard(getBlockAdminTitle(block, index), index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Paketübersicht</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderLangPair("Bereich Name", `blocks.${index}.name`, `blocks.${index}.name`, "input")}
          </div>
        </details>
        ${renderColumnEditor(index, 0, "Paket 1")}
        ${renderColumnEditor(index, 1, "Paket 2")}
      `);
    }
    if (type === "video-centered") {
      return blockCard(getBlockAdminTitle(block, index), index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Video</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderImagePair("Video Cover", `blocks.${index}.video.cover`)}
            ${renderLangPair("Video URL", `blocks.${index}.video.url`, `blocks.${index}.video.url`, "input")}
          </div>
        </details>
      `);
    }
    if (type === "slider-full-price-below") {
      return blockCard(getBlockAdminTitle(block, index), index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">After Wedding Übersicht</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderLangPair("Bereich Name", `blocks.${index}.name`, `blocks.${index}.name`, "input")}
          </div>
        </details>
        ${renderColumnEditor(index, 0, "Collection / Preisblock")}
        ${renderGallery(index)}
      `);
    }
    if (type === "text-2columns") {
      return blockCard(getBlockAdminTitle(block, index), index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">FAQ Überschrift</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderLangPair("Bereich Name", `blocks.${index}.name`, `blocks.${index}.name`, "input")}
          </div>
        </details>
        ${renderColumnEditor(index, 0, "Linke Spalte")}
        ${renderColumnEditor(index, 1, "Rechte Spalte")}
      `);
    }
    if (type === "collection-text-left-extra-right" || type === "includes-left-slider-right" || type === "package-1") {
      return blockCard(block.name || type || `Block ${index + 1}`, index, `
        <details class="section-card" open style="padding: 14px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Bereich</summary>
          <div style="margin-top: 14px; display: grid; gap: 12px;">
            ${renderLangPair("Bereich Name", `blocks.${index}.name`, `blocks.${index}.name`, "input")}
          </div>
        </details>
        ${renderColumnEditor(index, 0, "Inhalt")}
        ${renderGallery(index)}
      `);
    }
    return blockCard(getBlockAdminTitle(block, index), index, `
      <details class="section-card" open style="padding: 14px;">
        <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Bereich</summary>
        <div style="margin-top: 14px; display: grid; gap: 12px;">
          ${renderLangPair("Bereich Name", `blocks.${index}.name`, `blocks.${index}.name`, "input")}
        </div>
      </details>
      ${renderColumnEditor(index, 0, "Inhalt")}
      ${renderGallery(index)}
    `);
  };

  const blockEditors = (Array.isArray(dataDe.blocks) ? dataDe.blocks : []).map((block, index) => renderBlockEditor(index, block)).join("");

  app.innerHTML = `
    <section class="panel">
      <form class="form-grid" id="preislisteForm">
        <div class="empty">
          Die Preisliste ist jetzt in klare Blöcke gegliedert. Du bearbeitest oben die Übersicht, darunter die einzelnen Sektionen, Preise und Bilder - ohne dich durch rohe Textwände zu kämpfen.
        </div>
        <div class="actions" style="justify-content: space-between; margin-top: 0;">
          <div class="muted">DE: ${escapeHtml(PREISLISTE_FILES.de)}<br>EN: ${escapeHtml(PREISLISTE_FILES.en)}</div>
          <div class="actions" style="margin-top: 0;">
            <button class="button secondary" type="button" id="generatePreislisteEn">EN aus DE generieren</button>
            <button class="button secondary" type="button" id="openPreislisteDe">Vorschau DE</button>
            <button class="button secondary" type="button" id="openPreislisteEn">Vorschau EN</button>
            <button class="button secondary" type="submit">Speichern</button>
          </div>
        </div>
        <section class="section-card" style="padding: 18px;">
          <div class="eyebrow" style="margin-bottom: 8px;">Schnellübersicht</div>
          <div class="muted" style="margin-bottom: 14px;">Hier siehst du die wichtigsten Preisblöcke kompakt und kannst sie als Ganzes sortieren.</div>
          <div class="overview-grid">
            ${(Array.isArray(dataDe.blocks) ? dataDe.blocks : []).map((block, index) => `
              <a class="overview-item" href="#preisliste-block-${index}" style="text-decoration: none;">
                <div class="overview-label">${escapeHtml(getBlockAdminTitle(block, index))}</div>
                <div class="muted" style="margin-top: 6px;">${escapeHtml(getBlockAdminSummary(block) || "Direkt zum Bearbeiten springen")}</div>
              </a>
            `).join("")}
          </div>
          <div class="overview-grid" style="margin-top: 14px;">
            ${buildPriceOverview(dataDe).map((item) => `
              <article class="overview-item">
                <div class="overview-label">${escapeHtml(item.label)}</div>
                <div class="overview-price">${escapeHtml(item.price)}</div>
              </article>
            `).join("")}
          </div>
        </section>
        ${blockEditors}
        <details class="section-card" style="padding: 18px;">
          <summary style="cursor: pointer; font-weight: 700; text-transform: uppercase; letter-spacing: 0.24em;">Erweitert: Rohdaten</summary>
          <div class="field-grid-2" style="margin-top: 18px;">
            <div class="field">
              <label>Preisliste DE JSON</label>
              <textarea id="preislisteDeJson" rows="24" spellcheck="false" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(JSON.stringify(dataDe, null, 2))}</textarea>
            </div>
            <div class="field">
              <label>Preisliste EN JSON</label>
              <textarea id="preislisteEnJson" rows="24" spellcheck="false" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(JSON.stringify(dataEn, null, 2))}</textarea>
            </div>
          </div>
        </details>
        <div class="actions">
          <button class="button secondary" type="button" id="generatePreislisteEnBottom">EN aus DE generieren</button>
          <button class="button secondary" type="button" id="openPreislisteDeBottom">Vorschau DE</button>
          <button class="button secondary" type="button" id="openPreislisteEnBottom">Vorschau EN</button>
          <button class="button secondary" type="submit">Speichern</button>
        </div>
      </form>
    </section>
  `;

  const openDe = () => openPreviewInNewTab("/preisliste/26-27/");
  const openEn = () => openPreviewInNewTab("/preisliste/26-27/?lang=en");
  const syncPreislisteEnglishDom = (translated) => {
    if (!translated || typeof translated !== "object") return;
    dataEn = structuredClone(translated);
    app.querySelector("#preislisteEnJson").value = JSON.stringify(dataEn, null, 2);
    app.querySelectorAll("[data-preisliste-path][readonly]").forEach((node) => {
      const path = node.dataset.preislistePath;
      const nextValue = getDeepValue(dataEn, path);
      node.value = nextValue == null ? "" : String(nextValue);
    });
    app.querySelectorAll("[data-preisliste-rich-path][readonly]").forEach((node) => {
      const path = node.dataset.preislisteRichPath;
      const mode = node.dataset.preislisteRichMode || "body";
      const nextValue = getDeepValue(dataEn, path);
      node.value = readRichValue(mode, nextValue);
    });
    const introEnTitle = app.querySelector('[data-preisliste-centered="intro-title-en"]');
    if (introEnTitle) introEnTitle.value = extractHeadingText(getDeepValue(dataEn, "blocks.0.text"));
    const introCopyEnTitle = app.querySelector('[data-preisliste-centered="intro-copy-title-en"]');
    if (introCopyEnTitle) introCopyEnTitle.value = extractHeadingText(getDeepValue(dataEn, "blocks.1.text"));
    const introCopyEnBody = app.querySelector('[data-preisliste-centered="intro-copy-body-en"]');
    if (introCopyEnBody) introCopyEnBody.value = extractBodyText(getDeepValue(dataEn, "blocks.1.text"));
  };

  const runPreislisteAutoTranslation = async ({ silent = true } = {}) => {
    preislisteTranslationJobId += 1;
    const jobId = preislisteTranslationJobId;
    preislisteTranslationRunning = true;
    try {
      const translated = await translatePricingJson(structuredClone(dataDe));
      if (jobId !== preislisteTranslationJobId) return;
      syncPreislisteEnglishDom(translated);
      if (!silent) {
        setStatus("Englische Preisliste wurde automatisch aktualisiert.", "success");
      }
    } catch (error) {
      if (!silent) {
        setStatus(`Automatische EN-Übersetzung fehlgeschlagen: ${error.message}`, "error");
      }
    } finally {
      if (jobId === preislisteTranslationJobId) {
        preislisteTranslationRunning = false;
      }
    }
  };

  const generateEn = async () => {
    try {
      setStatus("Englische Preisliste wird aus der deutschen Version generiert...");
      await runPreislisteAutoTranslation({ silent: false });
      await saveFile(PREISLISTE_FILES.de, { type: "json", data: dataDe });
      await saveFile(PREISLISTE_FILES.en, { type: "json", data: dataEn });
      setStatus("Englische Preisliste wurde generiert.", "success");
      openEn();
    } catch (error) {
      setStatus(`Generierung fehlgeschlagen: ${error.message}`, "error");
    }
  };

  const setDeepValue = (root, path, value) => {
    const parts = String(path || "").split(".").filter(Boolean);
    if (!parts.length) return;
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      const nextKey = /^\d+$/.test(parts[i + 1]) ? [] : {};
      if (cursor[key] == null || typeof cursor[key] !== "object") {
        cursor[key] = nextKey;
      }
      cursor = cursor[key];
    }
    const lastKey = /^\d+$/.test(parts.at(-1)) ? Number(parts.at(-1)) : parts.at(-1);
    cursor[lastKey] = value;
  };

  const getFormValue = (input) => {
    if (input.type === "checkbox") return input.checked;
    return input.value;
  };

  const moveArrayItem = (root, arrayPath, index, direction) => {
    const parts = String(arrayPath).split(".");
    let cursor = root;
    for (const part of parts) {
      const key = /^\d+$/.test(part) ? Number(part) : part;
      cursor = cursor[key];
      if (!cursor) return;
    }
    if (!Array.isArray(cursor)) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cursor.length) return;
    [cursor[index], cursor[nextIndex]] = [cursor[nextIndex], cursor[index]];
  };

  app.querySelector("#openPreislisteDe").addEventListener("click", openDe);
  app.querySelector("#openPreislisteEn").addEventListener("click", openEn);
  app.querySelector("#openPreislisteDeBottom").addEventListener("click", openDe);
  app.querySelector("#openPreislisteEnBottom").addEventListener("click", openEn);
  app.querySelector("#generatePreislisteEn").addEventListener("click", generateEn);
  app.querySelector("#generatePreislisteEnBottom").addEventListener("click", generateEn);

  app.querySelector("#preislisteForm").addEventListener("input", (event) => {
    const target = event.target;
    if (!target || !target.matches("[data-preisliste-path]")) return;
    const path = target.dataset.preislistePath;
    setDeepValue(dataDe, path, getFormValue(target));
    app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
    if (preislisteTranslationTimer) clearTimeout(preislisteTranslationTimer);
    preislisteTranslationTimer = setTimeout(async () => {
      await runPreislisteAutoTranslation({ silent: true });
    }, 240);
  });

  app.querySelector("#preislisteForm").addEventListener("input", (event) => {
    const target = event.target;
    if (!target) return;
    if (target.matches("[data-preisliste-rich-path]")) {
      const path = target.dataset.preislisteRichPath;
      const mode = target.dataset.preislisteRichMode || "body";
      const tag = target.dataset.preislisteRichTag || "h4";
      setDeepValue(dataDe, path, buildRichHtml(mode, target.value, tag));
      app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
      if (preislisteTranslationTimer) clearTimeout(preislisteTranslationTimer);
      preislisteTranslationTimer = setTimeout(async () => {
        await runPreislisteAutoTranslation({ silent: true });
      }, 240);
      return;
    }
    if (target.matches('[data-preisliste-centered="intro-title-de"]')) {
      const title = target.value;
      setDeepValue(dataDe, "blocks.0.text", `<p style="text-align: center;"><img src="/Logo-Blitzkneisser-BERG.png" style="width: 160px;" class="fr-fic fr-dib"></p><h1 style="text-align: center;"><span style="color: rgb(255, 255, 255);">${escapeRichText(title)}</span></h1><p style="text-align: center;"><span style="font-size: 48px;"><span style="color: rgb(255, 255, 255);">&darr;</span></span></p><hr><p></p>`);
      app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
      if (preislisteTranslationTimer) clearTimeout(preislisteTranslationTimer);
      preislisteTranslationTimer = setTimeout(async () => {
        await runPreislisteAutoTranslation({ silent: true });
      }, 240);
      return;
    }
    if (target.matches('[data-preisliste-centered="intro-copy-title-de"], [data-preisliste-centered="intro-copy-body-de"]')) {
      const title = app.querySelector('[data-preisliste-centered="intro-copy-title-de"]')?.value || "";
      const body = app.querySelector('[data-preisliste-centered="intro-copy-body-de"]')?.value || "";
      setDeepValue(dataDe, "blocks.1.text", `<h1 style="text-align: center;">${escapeRichText(title)}</h1>${paragraphsToHtml(body)}`);
      app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
      if (preislisteTranslationTimer) clearTimeout(preislisteTranslationTimer);
      preislisteTranslationTimer = setTimeout(async () => {
        await runPreislisteAutoTranslation({ silent: true });
      }, 240);
    }
  });

  app.querySelector("#preislisteForm").addEventListener("change", (event) => {
    const target = event.target;
    if (!target || !target.matches("[data-preisliste-path]")) return;
    const path = target.dataset.preislistePath;
    setDeepValue(dataDe, path, getFormValue(target));
    app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
  });

  app.querySelector("#preislisteForm").addEventListener("click", async (event) => {
    const moveButton = event.target.closest("[data-block-move]");
    if (moveButton) {
      const index = Number(moveButton.dataset.blockMove);
      const direction = Number(moveButton.dataset.dir);
      moveArrayItem(dataDe, "blocks", index, direction);
      moveArrayItem(dataEn, "blocks", index, direction);
      state.lastSavedAt = Date.now();
      await runPreislisteAutoTranslation({ silent: true });
      await bindPreisliste();
      return;
    }
    const galleryAdd = event.target.closest("[data-gallery-add]");
    if (galleryAdd) {
      const blockIndex = Number(galleryAdd.dataset.galleryAdd);
      dataDe.blocks[blockIndex].gallery = Array.isArray(dataDe.blocks[blockIndex].gallery) ? dataDe.blocks[blockIndex].gallery : [];
      dataDe.blocks[blockIndex].gallery.push({ preview: "", alt: "", link: "" });
      await runPreislisteAutoTranslation({ silent: true });
      await bindPreisliste();
      return;
    }
    const galleryRemove = event.target.closest("[data-gallery-remove]");
    if (galleryRemove) {
      const blockIndex = Number(galleryRemove.dataset.galleryRemove);
      const index = Number(galleryRemove.dataset.index);
      dataDe.blocks[blockIndex].gallery.splice(index, 1);
      await runPreislisteAutoTranslation({ silent: true });
      await bindPreisliste();
      return;
    }
    const galleryMove = event.target.closest("[data-gallery-move]");
    if (galleryMove) {
      const blockIndex = Number(galleryMove.dataset.galleryMove);
      const index = Number(galleryMove.dataset.index);
      const direction = Number(galleryMove.dataset.dir);
      const gallery = dataDe.blocks[blockIndex].gallery || [];
      const nextIndex = index + direction;
      if (nextIndex >= 0 && nextIndex < gallery.length) {
        [gallery[index], gallery[nextIndex]] = [gallery[nextIndex], gallery[index]];
        await runPreislisteAutoTranslation({ silent: true });
        await bindPreisliste();
      }
      return;
    }
  }, true);

  app.querySelectorAll("[data-preisliste-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      try {
        setStatus("Bild wird hochgeladen...");
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        const path = event.target.dataset.preislisteUpload;
        setDeepValue(dataDe, path, uploadedPath);
        app.querySelector("#preislisteDeJson").value = JSON.stringify(dataDe, null, 2);
        await runPreislisteAutoTranslation({ silent: true });
        setStatus("Bild erfolgreich hochgeladen.", "success");
        await bindPreisliste();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  app.querySelector("#preislisteDeJson").addEventListener("input", () => {
    if (preislisteTranslationTimer) clearTimeout(preislisteTranslationTimer);
    preislisteTranslationTimer = setTimeout(async () => {
      try {
        const parsed = JSON.parse(app.querySelector("#preislisteDeJson").value || "{}");
        if (!parsed || typeof parsed !== "object") return;
        Object.keys(dataDe).forEach((key) => delete dataDe[key]);
        Object.assign(dataDe, parsed);
        if (!preislisteTranslationRunning) {
          await runPreislisteAutoTranslation({ silent: true });
        }
      } catch {
        // Ignore while the user is still typing invalid JSON fragments.
      }
    }, 300);
  });

  app.querySelector("#preislisteForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await runPreislisteAutoTranslation({ silent: true });
      app.querySelector("#preislisteEnJson").value = JSON.stringify(dataEn, null, 2);
      setStatus("Preisliste wird gespeichert...");
      await saveFile(PREISLISTE_FILES.de, { type: "json", data: dataDe });
      await saveFile(PREISLISTE_FILES.en, { type: "json", data: dataEn });
      setStatus("Preisliste gespeichert.", "success");
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const renderEntityEditor = (options) => {
  const { entityName, filePrefix, templateFactory, fieldBuilder } = options;
  const files = listByPrefix(filePrefix);
  const selectedPath = state.selected[entityName] || files[0] || "";

  if (!state.selected[entityName] && selectedPath) {
    state.selected[entityName] = selectedPath;
  }

  app.innerHTML = `
    <div class="content-grid">
      <section class="panel list-panel">
        <div>
          <p class="eyebrow">${escapeHtml(entityName)}</p>
          <h2 class="section-title">${escapeHtml(entityName)} Übersicht</h2>
        </div>
        <button class="button secondary" type="button" data-create-entry="${entityName}">Neu anlegen</button>
        ${files.length ? files.map((file) => `
          <button class="item-button ${file === selectedPath ? "active" : ""}" type="button" data-select-file="${escapeHtml(file)}">
            <strong>${escapeHtml(file.split("/").pop())}</strong>
            <span>${escapeHtml(file)}</span>
          </button>
        `).join("") : '<div class="empty">Noch keine Einträge vorhanden.</div>'}
      </section>
      <section class="panel" id="${entityName}EditorPanel">
        <div class="empty">Eintrag wird geladen...</div>
      </section>
    </div>
  `;

  app.querySelector(`[data-create-entry="${entityName}"]`).addEventListener("click", async () => {
    const rawTitle = window.prompt(`Titel für neuen ${entityName}-Eintrag:`);
    if (!rawTitle) return;
    const slug = slugify(rawTitle);
    if (!slug) return;

    const datePrefix = new Date().toISOString().slice(0, 10);
    const path = `${filePrefix}${datePrefix}-${slug}.md`;
    const template = templateFactory(rawTitle);

    try {
      await api("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: template })
      });
      state.files = await api("/api/files").then((response) => response.files);
      state.cache[path] = parseContentFile(path, template);
      state.selected[entityName] = path;
      state.lastSavedAt = Date.now();
      updatePreviewLink();
      setStatus(`${entityName} Eintrag angelegt.`, "success");
      await render();
    } catch (error) {
      setStatus(`Anlegen fehlgeschlagen: ${error.message}`, "error");
    }
  });

  app.querySelectorAll("[data-select-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selected[entityName] = button.dataset.selectFile;
      await render();
    });
  });

  if (selectedPath) {
    fieldBuilder(selectedPath);
  } else {
    document.getElementById(`${entityName}EditorPanel`).innerHTML = '<div class="empty">Kein Eintrag ausgewählt.</div>';
  }
};

const bindJournalManager = async () => {
  const files = listByPrefix(JOURNAL_PREFIX);
  const selectedPath = state.selected.journal || files[0] || "";
  if (!state.selected.journal && selectedPath) {
    state.selected.journal = selectedPath;
  }

  const journalEntries = await Promise.all(files.map(async (file) => {
    const parsed = await ensureFile(file);
    return {
      path: file,
      slug: getJournalSlugFromPath(file),
      title: parsed.data.title || file.split("/").pop(),
      date: parsed.data.date || "",
      readingTime: parsed.data.readingTime || "",
      featuredImage: parsed.data.featuredImage || "",
      seoDescription: parsed.data.seoDescription || ""
    };
  }));

  journalEntries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  app.innerHTML = `
    <div class="content-grid">
      <section class="panel list-panel">
        <div>
          <p class="eyebrow">Journal</p>
          <h2 class="section-title">Beiträge</h2>
        </div>
        <button class="button secondary" type="button" id="createJournalEntry">Neuen Beitrag anlegen</button>
        <div class="journal-list">
          ${journalEntries.length ? journalEntries.map((entry) => `
            <button class="journal-list-card ${entry.path === selectedPath ? "active" : ""}" type="button" data-journal-select="${escapeHtml(entry.path)}">
              <img src="${escapeHtml(entry.featuredImage || "/assets/uploads/Blitzkneisser-Mountain-Elopement-Dolomites-8.jpg")}" alt="${escapeHtml(entry.title || "Journal Vorschau")}">
              <div>
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(entry.date || "Ohne Datum")}</span>
                <span>${escapeHtml(entry.readingTime ? `${entry.readingTime} Min` : "Journal Beitrag")}</span>
              </div>
            </button>
          `).join("") : '<div class="empty">Noch keine Journal-Beiträge vorhanden.</div>'}
        </div>
      </section>
      <section class="panel" id="journalEditorPanel">
        <div class="empty">Beitrag wird geladen...</div>
      </section>
    </div>
  `;

  document.getElementById("createJournalEntry").addEventListener("click", async () => {
    const rawTitle = window.prompt("Titel für neuen Journal-Beitrag:");
    if (!rawTitle) return;
    const slug = slugify(rawTitle);
    if (!slug) return;
    const datePrefix = new Date().toISOString().slice(0, 10);
    const path = `${JOURNAL_PREFIX}${datePrefix}-${slug}.md`;
    const templateFrontmatter = {
      lang: "de",
      title: rawTitle,
      titleEn: "",
      author: "Blitzkneisser",
      date: new Date().toISOString(),
      readingTime: "",
      seoTitle: rawTitle,
      seoTitleEn: "",
      seoDescription: "",
      seoDescriptionEn: "",
      featuredImage: "",
      featuredImageAlt: "",
      featuredImageAltEn: "",
      galleryIntroHeading: "",
      galleryIntroText: "",
      galleryOutroHeading: "",
      galleryOutroText: "",
      galleryIntroHeadingEn: "",
      galleryIntroTextEn: "",
      galleryOutroHeadingEn: "",
      galleryOutroTextEn: "",
      bodyEn: "",
      showToc: false,
      gallery: []
    };
    const template = buildMarkdown(templateFrontmatter, "");

    try {
      await api("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: template })
      });
      state.files = await api("/api/files").then((response) => response.files);
      state.cache[path] = parseContentFile(path, template);
      state.selected.journal = path;
      state.lastSavedAt = Date.now();
      updatePreviewLink();
      setStatus("Journal-Beitrag angelegt.", "success");
      await render();
    } catch (error) {
      setStatus(`Anlegen fehlgeschlagen: ${error.message}`, "error");
    }
  });

  app.querySelectorAll("[data-journal-select]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selected.journal = button.dataset.journalSelect;
      await render();
    });
  });

  if (selectedPath) {
    await bindJournal(selectedPath);
  } else {
    document.getElementById("journalEditorPanel").innerHTML = '<div class="empty">Kein Beitrag ausgewählt.</div>';
  }
};

const bindJournal = async (path) => {
  const parsed = await ensureFile(path);
  const data = structuredClone(parsed.data);
  const body = parsed.body || "";
  const bodyEn = unescapeStoredText(data.bodyEn || "");
  const gallery = Array.isArray(data.gallery) ? data.gallery : [];
  const panel = document.getElementById("journalEditorPanel");
  const journalTranslationTimers = new Map();
  const probeImageDimensions = (src) => new Promise((resolve) => {
    if (!src) {
      resolve({ ok: false, width: 0, height: 0 });
      return;
    }
    const image = new Image();
    image.onload = () => resolve({ ok: true, width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
    image.onerror = () => resolve({ ok: false, width: 0, height: 0 });
    image.src = src;
  });
  const renderImageQualityWarning = (width, height) => {
    const longEdge = Math.max(width, height);
    const shortEdge = Math.min(width, height);
    const megapixels = (width * height) / 1000000;
    if (longEdge < 1400 || shortEdge < 900) {
      return `⚠️ Klein (${width}×${height}) – kann auf der Seite unscharf wirken.`;
    }
    if (longEdge > 9000 || megapixels > 28) {
      return `⚠️ Sehr groß (${width}×${height}) – kann die Ladezeit spürbar erhöhen.`;
    }
    return "";
  };
  const runJournalImageQualityChecks = async () => {
    const images = Array.from(panel.querySelectorAll("[data-quality-image]"));
    await Promise.all(images.map(async (node) => {
      const key = node.getAttribute("data-quality-image");
      const warningNode = panel.querySelector(`[data-quality-warning="${key}"]`);
      if (!warningNode) return;
      const source = node.getAttribute("src") || "";
      const probe = await probeImageDimensions(source);
      if (!probe.ok) {
        warningNode.textContent = "";
        return;
      }
      warningNode.textContent = renderImageQualityWarning(probe.width, probe.height);
      warningNode.style.color = warningNode.textContent ? "var(--danger)" : "var(--muted)";
      warningNode.style.display = warningNode.textContent ? "block" : "none";
    }));
  };

  const renderLangFieldPair = (label, name, valueDe, valueEn, type = "input") => `
    <div class="field-grid-2">
      <div class="field">
        <label>${label} DE</label>
        ${type === "textarea"
          ? `<textarea name="${name}.de">${escapeHtml(valueDe || "")}</textarea>`
          : `<input type="text" name="${name}.de" value="${escapeHtml(valueDe || "")}">`}
      </div>
      <div class="field">
        <label>${label} EN</label>
        ${type === "textarea"
          ? `<textarea name="${name}.en">${escapeHtml(valueEn || "")}</textarea>`
          : `<input type="text" name="${name}.en" value="${escapeHtml(valueEn || "")}">`}
      </div>
    </div>
  `;

  panel.innerHTML = `
    <form class="form-grid" id="journalForm">
      <div class="actions" style="justify-content: space-between; margin-top: 0;">
        <div class="muted">${escapeHtml(path)}</div>
        <div class="actions" style="margin-top: 0;">
          <a class="button secondary" href="${escapeHtml(getJournalPostUrl(path))}" target="_blank" rel="noreferrer">Beitrag öffnen</a>
          <button class="button danger" type="button" id="deleteJournalEntryTop">Beitrag löschen</button>
          <button class="button secondary" type="submit">Speichern</button>
          <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
        </div>
      </div>

      <div class="section-card">
        <h3 class="section-title">Übersicht</h3>
        <div class="empty" style="margin-bottom: 18px;">
          Journal Deutsch und Englisch werden hier gemeinsam gepflegt. Links Deutsch, rechts Englisch. Englische Felder werden beim Verlassen der deutschen Felder automatisch übersetzt.
        </div>
        ${renderLangFieldPair("Titel", "title", data.title || "", data.titleEn || "")}
        <div class="field-grid-2">
          <div class="field"><label>Sprache</label><select name="lang"><option value="de" ${data.lang === "de" || !data.lang ? "selected" : ""}>DE</option><option value="en" ${data.lang === "en" ? "selected" : ""}>EN</option></select></div>
          <div class="field"><label>Autor</label><input type="text" name="author" value="${escapeHtml(data.author || "")}"></div>
        </div>
        <div class="field-grid-2">
          <div class="field">
            <label>Datum</label>
            <input type="datetime-local" name="date" value="${escapeHtml(toDateTimeLocalValue(data.date || ""))}">
            <div class="muted" style="font-size: 12px;">Datum und Uhrzeit des Beitrags. Wird im Frontend automatisch formatiert angezeigt.</div>
          </div>
          <div class="field"><label>Lesezeit</label><input type="text" name="readingTime" value="${escapeHtml(data.readingTime || "")}"></div>
        </div>
      </div>

      <div class="section-card">
        <h3 class="section-title">Inhalt</h3>
        ${renderLangFieldPair("Text vor der Galerie", "body", body, bodyEn, "textarea")}
        <div class="muted" style="font-size: 12px;">Dieser Inhalt wird im Beitrag oberhalb der Galerie angezeigt.</div>
      </div>

      <div class="section-card">
        <h3 class="section-title">SEO und Hero</h3>
        ${renderLangFieldPair("SEO Title", "seoTitle", data.seoTitle || "", data.seoTitleEn || "")}
        <div class="field-grid-2">
          <div class="field">
            <label>Featured Image</label>
            <input type="text" name="featuredImage" value="${escapeHtml(data.featuredImage || "")}" placeholder="/assets/uploads/datei.jpg">
            <div class="upload-inline" style="margin-top: 10px;">
              <label>
                Hero Bild hochladen
                <input type="file" id="journalFeaturedImageUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
              </label>
              <button class="button danger" type="button" id="journalFeaturedImageClear">Bild entfernen</button>
            </div>
            <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(data.featuredImage || "URL wird nach Upload automatisch erzeugt.")}</div>
            ${data.featuredImage ? `
              <div class="inline-image-preview">
                <img src="${escapeHtml(data.featuredImage)}" alt="${escapeHtml(data.featuredImageAlt || data.title || "Hero Vorschau")}" data-quality-image="journal-featured">
                <span>${escapeHtml(data.featuredImage)}</span>
                <small class="muted" data-quality-warning="journal-featured" style="display:none; margin-top: 6px;"></small>
              </div>
            ` : ""}
          </div>
        </div>
        ${renderLangFieldPair("SEO Description", "seoDescription", data.seoDescription || "", data.seoDescriptionEn || "", "textarea")}
        ${renderLangFieldPair("Featured Image Alt", "featuredImageAlt", data.featuredImageAlt || "", data.featuredImageAltEn || "", "textarea")}
        <div class="field"><label>Inhaltsverzeichnis</label><select name="showToc"><option value="true" ${data.showToc === true ? "selected" : ""}>Aktiv</option><option value="false" ${data.showToc === false ? "selected" : ""}>Inaktiv</option></select></div>
      </div>

      <div class="section-card">
        <h3 class="section-title">Galerie</h3>
        ${renderLangFieldPair("H3 vor Galerie", "galleryIntroHeading", data.galleryIntroHeading || "", data.galleryIntroHeadingEn || "")}
        ${renderLangFieldPair("Kleines Textfeld vor Galerie", "galleryIntroText", data.galleryIntroText || "", data.galleryIntroTextEn || "", "textarea")}
        ${renderLangFieldPair("H3 nach Galerie", "galleryOutroHeading", data.galleryOutroHeading || "", data.galleryOutroHeadingEn || "")}
        ${renderLangFieldPair("Kleines Textfeld nach Galerie", "galleryOutroText", data.galleryOutroText || "", data.galleryOutroTextEn || "", "textarea")}
        <div class="muted" style="font-size: 12px; margin-top: -6px;">
          WWW- und HTTP-Adressen werden im Frontend automatisch als klickbare Links dargestellt (z. B. www.elikos.com).
        </div>
        <div class="actions" style="justify-content: flex-start; margin-bottom: 18px;">
          <label class="button secondary" style="cursor: pointer;">
            Mehrere Bilder hochladen
            <input type="file" id="journalGalleryBatchUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif" multiple style="display: none;">
          </label>
          <span class="muted">Die Bilder werden direkt als einzelne Galerie-Einträge angelegt und können danach separat bearbeitet werden.</span>
        </div>
        <div class="array-list" id="journalGalleryList">
          ${gallery.map((item, index) => `
            <div class="array-item">
              <div class="field">
                <label>Bild ${index + 1}</label>
                <input type="text" data-gallery-image="${index}" value="${escapeHtml(item.image || "")}" placeholder="/assets/uploads/datei.jpg">
                <div class="upload-inline" style="margin-top: 10px;">
                  <label>
                    Galerie Bild hochladen
                    <input type="file" data-gallery-upload="${index}" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
                  </label>
                  <button class="button danger" type="button" data-gallery-clear="${index}">Bild loeschen</button>
                </div>
                <div class="muted" style="font-size: 12px; word-break: break-all;">${escapeHtml(item.image || "URL wird nach Upload automatisch erzeugt.")}</div>
                ${item.image ? `
                  <div class="inline-image-preview">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || `Galerie ${index + 1}`)}" data-quality-image="journal-gallery-${index}">
                    <span>${escapeHtml(item.image)}</span>
                    <small class="muted" data-quality-warning="journal-gallery-${index}" style="display:none; margin-top: 6px;"></small>
                  </div>
                ` : ""}
              </div>
              <div class="field">
                <label>ALT Text ${index + 1}</label>
                <textarea data-gallery-alt="${index}">${escapeHtml(item.alt || "")}</textarea>
              </div>
              <div class="field">
                <label>Link / SEO-Verlinkung ${index + 1}</label>
                <input type="text" data-gallery-link="${index}" value="${escapeHtml(item.link || "")}" placeholder="/journal/beispiel/ oder https://...">
                <div class="muted" style="font-size: 12px;">Optional. Wenn gesetzt, wird das Bild im Frontend anklickbar.</div>
              </div>
              <button class="button danger" type="button" data-remove-gallery="${index}">Bild entfernen</button>
            </div>
          `).join("")}
        </div>
        <div class="actions">
          <button class="button secondary" type="button" id="addJournalGalleryImage">Bild hinzufuegen</button>
        </div>
      </div>

      <div class="actions">
        <a class="button secondary" href="${escapeHtml(getJournalPostUrl(path))}" target="_blank" rel="noreferrer">Beitrag öffnen</a>
        <button class="button danger" type="button" id="deleteJournalEntryBottom">Beitrag löschen</button>
        <button class="button secondary" type="submit">Speichern</button>
        <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
      </div>
    </form>
  `;

  runJournalImageQualityChecks();

  const rerender = async () => {
    state.cache[path] = { type: "markdown", data, body };
    await bindJournal(path);
  };

  const attachJournalAutoTranslation = (sourceSelector, targetSelector) => {
    const sourceNode = panel.querySelector(sourceSelector);
    const targetNode = panel.querySelector(targetSelector);
    if (!sourceNode || !targetNode) return;

    const translateNow = async () => {
      const sourceValue = String(sourceNode.value || "").trim();
      if (!sourceValue) {
        targetNode.value = "";
        return;
      }

      try {
        setStatus("Englische Journal-Übersetzung wird erzeugt...");
        targetNode.value = await translateCmsText(sourceValue, "de", "en");
        setStatus("Englische Journal-Übersetzung aktualisiert.", "success");
      } catch (error) {
        setStatus(`Übersetzung fehlgeschlagen: ${error.message}`, "error");
      }
    };

    const scheduleTranslation = () => {
      const timerKey = `${sourceSelector}→${targetSelector}`;
      if (journalTranslationTimers.has(timerKey)) {
        clearTimeout(journalTranslationTimers.get(timerKey));
      }
      journalTranslationTimers.set(timerKey, setTimeout(() => {
        translateNow();
      }, 450));
    };

    sourceNode.addEventListener("input", scheduleTranslation);
    sourceNode.addEventListener("change", scheduleTranslation);

    if (!String(targetNode.value || "").trim() && String(sourceNode.value || "").trim()) {
      translateNow();
    }
  };

  panel.querySelector("#addJournalGalleryImage").addEventListener("click", async () => {
    data.gallery = Array.isArray(data.gallery) ? data.gallery : [];
    data.gallery.push({ image: "", alt: "", link: "" });
    await rerender();
  });

  panel.querySelector("#journalGalleryBatchUpload").addEventListener("change", async (event) => {
    const filesToUpload = Array.from(event.target.files || []);
    if (!filesToUpload.length) return;
    try {
      setStatus(`${filesToUpload.length} Galeriebilder werden hochgeladen...`);
      data.gallery = Array.isArray(data.gallery) ? data.gallery : [];
      for (const fileToUpload of filesToUpload) {
        const uploadedPath = await uploadFileToLibrary(fileToUpload);
        data.gallery.push({
          image: uploadedPath,
          alt: buildAutoAltFromImagePath(uploadedPath, "Galeriebild im Journal"),
          link: ""
        });
      }
      setStatus(`${filesToUpload.length} Galeriebilder erfolgreich hochgeladen. ALT-Texte wurden automatisch gesetzt und können angepasst werden.`, "success");
    } catch (error) {
      setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
    await rerender();
  });

  panel.querySelector("#journalFeaturedImageUpload").addEventListener("change", async (event) => {
    const [fileToUpload] = event.target.files || [];
    if (!fileToUpload) return;
    try {
      setStatus("Hero Bild wird hochgeladen...");
      data.featuredImage = await uploadFileToLibrary(fileToUpload);
      data.featuredImageAlt = buildAutoAltFromImagePath(data.featuredImage, "Hero Bild im Journal");
      if (!String(data.featuredImageAltEn || "").trim()) {
        data.featuredImageAltEn = data.featuredImageAlt;
      }
      setStatus("Hero Bild erfolgreich hochgeladen.", "success");
      await rerender();
    } catch (error) {
      setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
    }
  });

  panel.querySelector("#journalFeaturedImageClear").addEventListener("click", async () => {
    data.featuredImage = "";
    data.featuredImageAlt = "";
    setStatus("Hero-Bild und ALT-Text entfernt.", "success");
    await rerender();
  });

  panel.querySelectorAll("[data-gallery-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const [fileToUpload] = event.target.files || [];
      if (!fileToUpload) return;
      const index = Number(event.target.dataset.galleryUpload);
      try {
        setStatus("Galeriebild wird hochgeladen...");
        data.gallery[index].image = await uploadFileToLibrary(fileToUpload);
        const hasAlt = String(data.gallery[index].alt || "").trim();
        if (!hasAlt) {
          data.gallery[index].alt = buildAutoAltFromImagePath(data.gallery[index].image, `Galeriebild ${index + 1}`);
        }
        if (typeof data.gallery[index].link !== "string") data.gallery[index].link = "";
        setStatus("Galeriebild erfolgreich hochgeladen.", "success");
        await rerender();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    });
  });

  panel.querySelectorAll("[data-gallery-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.galleryClear);
      data.gallery[index].image = "";
      data.gallery[index].alt = "";
      data.gallery[index].link = "";
      setStatus("Galeriebild, ALT-Text und Link entfernt.", "success");
      await rerender();
    });
  });

  panel.querySelectorAll("[data-remove-gallery]").forEach((button) => {
    button.addEventListener("click", async () => {
      data.gallery.splice(Number(button.dataset.removeGallery), 1);
      await rerender();
    });
  });

  const deleteJournalEntry = async () => {
    const confirmed = window.confirm("Diesen Journal-Beitrag wirklich komplett löschen?");
    if (!confirmed) return;

    setStatus("Journal-Beitrag wird gelöscht...");
    try {
      await api("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
      });

      delete state.cache[path];
      state.files = await api("/api/files").then((response) => response.files);
      const remainingJournalFiles = listByPrefix(JOURNAL_PREFIX);
      state.selected.journal = remainingJournalFiles[0] || "";
      state.lastSavedAt = Date.now();
      updatePreviewLink();
      setStatus("Journal-Beitrag gelöscht.", "success");
      await render();
    } catch (error) {
      setStatus(`Löschen fehlgeschlagen: ${error.message}`, "error");
    }
  };

  panel.querySelector("#deleteJournalEntryTop").addEventListener("click", deleteJournalEntry);
  panel.querySelector("#deleteJournalEntryBottom").addEventListener("click", deleteJournalEntry);

  [
    ["[name='title.de']", "[name='title.en']"],
    ["[name='body.de']", "[name='body.en']"],
    ["[name='seoTitle.de']", "[name='seoTitle.en']"],
    ["[name='seoDescription.de']", "[name='seoDescription.en']"],
    ["[name='featuredImageAlt.de']", "[name='featuredImageAlt.en']"],
    ["[name='galleryIntroHeading.de']", "[name='galleryIntroHeading.en']"],
    ["[name='galleryIntroText.de']", "[name='galleryIntroText.en']"],
    ["[name='galleryOutroHeading.de']", "[name='galleryOutroHeading.en']"],
    ["[name='galleryOutroText.de']", "[name='galleryOutroText.en']"]
  ].forEach(([sourceSelector, targetSelector]) => attachJournalAutoTranslation(sourceSelector, targetSelector));

  panel.querySelector("#journalForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const get = (name) => form.querySelector(`[name="${name}"]`)?.value || "";
    const fillTargetIfEmpty = (targetName, sourceName) => {
      const targetValue = get(targetName);
      return targetValue || get(sourceName);
    };
    const nextFrontmatter = {
      lang: form.lang.value,
      title: get("title.de"),
      titleEn: fillTargetIfEmpty("title.en", "title.de"),
      author: form.author.value,
      date: fromDateTimeLocalValue(form.date.value, parsed.data?.date || ""),
      readingTime: form.readingTime.value,
      seoTitle: get("seoTitle.de"),
      seoTitleEn: fillTargetIfEmpty("seoTitle.en", "seoTitle.de"),
      seoDescription: get("seoDescription.de"),
      seoDescriptionEn: fillTargetIfEmpty("seoDescription.en", "seoDescription.de"),
      featuredImage: form.featuredImage.value,
      featuredImageAlt: get("featuredImageAlt.de"),
      featuredImageAltEn: fillTargetIfEmpty("featuredImageAlt.en", "featuredImageAlt.de"),
      galleryIntroHeading: get("galleryIntroHeading.de"),
      galleryIntroHeadingEn: fillTargetIfEmpty("galleryIntroHeading.en", "galleryIntroHeading.de"),
      galleryIntroText: get("galleryIntroText.de"),
      galleryIntroTextEn: fillTargetIfEmpty("galleryIntroText.en", "galleryIntroText.de"),
      galleryOutroHeading: get("galleryOutroHeading.de"),
      galleryOutroHeadingEn: fillTargetIfEmpty("galleryOutroHeading.en", "galleryOutroHeading.de"),
      galleryOutroText: get("galleryOutroText.de"),
      galleryOutroTextEn: fillTargetIfEmpty("galleryOutroText.en", "galleryOutroText.de"),
      bodyEn: fillTargetIfEmpty("body.en", "body.de"),
      showToc: form.showToc.value === "true",
      gallery: Array.from(form.querySelectorAll("[data-gallery-image]")).map((input, index) => ({
        image: input.value,
        alt: form.querySelector(`[data-gallery-alt="${index}"]`).value,
        link: form.querySelector(`[data-gallery-link="${index}"]`)?.value || ""
      })).filter((item) => item.image || item.alt || item.link)
    };

    setStatus("Journal wird gespeichert...");
    try {
      await saveFile(path, {
        type: "markdown",
        data: nextFrontmatter,
        frontmatter: nextFrontmatter,
        body: get("body.de")
      });
      setStatus("Journal gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindArchive = async (path) => {
  const parsed = await ensureFile(path);
  const data = structuredClone(parsed.data);
  const galleryJson = JSON.stringify(data.gallery || [], null, 2);
  const panel = document.getElementById("archiveEditorPanel");

  panel.innerHTML = `
    <form class="form-grid" id="archiveForm">
      <div class="field-grid-2">
        <div class="field"><label>Sprache</label><select name="lang"><option value="de" ${data.lang === "de" ? "selected" : ""}>DE</option><option value="en" ${data.lang === "en" ? "selected" : ""}>EN</option></select></div>
        <div class="field"><label>Season</label><input type="text" name="season" value="${escapeHtml(data.season || "")}"></div>
      </div>
      <div class="field-grid-2">
        <div class="field"><label>Titel</label><input type="text" name="title" value="${escapeHtml(data.title || "")}"></div>
        <div class="field"><label>Location</label><input type="text" name="location" value="${escapeHtml(data.location || "")}"></div>
      </div>
      <div class="field-grid-2">
        <div class="field"><label>Hero Image</label><input type="text" name="heroImage" value="${escapeHtml(data.heroImage || "")}"></div>
        <div class="field"><label>Hero Image Alt</label><textarea name="heroImageAlt">${escapeHtml(data.heroImageAlt || "")}</textarea></div>
      </div>
      <div class="field"><label>Zusammenfassung</label><textarea name="summary">${escapeHtml(data.summary || "")}</textarea></div>
      <div class="field"><label>Galerie (JSON Array)</label><textarea name="gallery" style="min-height: 240px;">${escapeHtml(galleryJson)}</textarea></div>
      <div class="actions">
        <button class="button secondary" type="submit">Speichern</button>
        <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
      </div>
    </form>
  `;

  panel.querySelector("#archiveForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    let gallery;
    try {
      gallery = JSON.parse(form.gallery.value || "[]");
    } catch {
      setStatus("Galerie JSON ist ungültig.", "error");
      return;
    }

    const nextFrontmatter = {
      lang: form.lang.value,
      title: form.title.value,
      location: form.location.value,
      season: form.season.value,
      heroImage: form.heroImage.value,
      heroImageAlt: form.heroImageAlt.value,
      gallery,
      summary: form.summary.value
    };

    setStatus("Archiv wird gespeichert...");
    try {
      await saveFile(path, {
        type: "markdown",
        data: nextFrontmatter,
        frontmatter: nextFrontmatter,
        body: ""
      });
      setStatus("Archiv gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });
};

const bindImages = async (path) => {
  const parsed = await ensureFile(path);
  const data = structuredClone(parsed.data);
  const keywordsText = Array.isArray(data.keywords) ? data.keywords.join("\n") : "";
  const panel = document.getElementById("imagesEditorPanel");
  const usageMap = await collectImageUsageMap();
  const usages = usageMap.get(normalizeImagePath(data.image)) || [];
  const canRemoveUpload = Boolean(data.image) && usages.length === 0;

  panel.innerHTML = `
    <form class="form-grid" id="imageMetaForm">
      <div class="media-preview">
        <div class="media-preview-card">
          <img src="${escapeHtml(data.image || "")}" alt="${escapeHtml(data.alt || data.title || "Bildvorschau")}">
          <span>${escapeHtml(data.image || "Kein Bildpfad gesetzt")}</span>
        </div>
        <div class="grid" style="gap: 14px;">
          <div>
            <p class="eyebrow">Bildvorschau</p>
            <h2 class="section-title" style="margin-bottom: 8px;">Wo dieses Bild verwendet wird</h2>
            <div class="usage-list">
              ${usages.length ? usages.map((usage) => `
                <div class="usage-item">
                  <small>${escapeHtml(usage.area)}</small>
                  <strong>${escapeHtml(usage.slot)}</strong>
                  <span>${escapeHtml(usage.detail)}</span>
                </div>
              `).join("") : '<div class="empty">Dieses Bild ist aktuell noch keiner Seite oder keinem Beitrag fest zugeordnet.</div>'}
            </div>
          </div>
        </div>
      </div>

      <div class="field-grid-2">
        <div class="field"><label>Titel</label><input type="text" name="title" value="${escapeHtml(data.title || "")}"></div>
        <div class="field"><label>Sprache</label><select name="lang"><option value="neutral" ${data.lang === "neutral" ? "selected" : ""}>Neutral</option><option value="de" ${data.lang === "de" ? "selected" : ""}>DE</option><option value="en" ${data.lang === "en" ? "selected" : ""}>EN</option></select></div>
      </div>
      <div class="field"><label>Bildpfad</label><input type="text" name="image" value="${escapeHtml(data.image || "")}"></div>
      <div class="field-grid-2">
        <div class="field"><label>ALT Text</label><textarea name="alt">${escapeHtml(data.alt || "")}</textarea></div>
        <div class="field"><label>Auto ALT Prompt</label><textarea name="altPrompt">${escapeHtml(data.altPrompt || "")}</textarea></div>
      </div>
      <div class="field"><label>Keywords (eine Zeile pro Keyword)</label><textarea name="keywords">${escapeHtml(keywordsText)}</textarea></div>
      <div class="actions">
        <button class="button danger" type="button" id="deleteImageMetaButton">Meta-Eintrag entfernen</button>
        ${canRemoveUpload ? '<button class="button danger" type="button" id="deleteImageUploadButton">Bilddatei entfernen</button>' : ""}
        <button class="button secondary" type="submit">Speichern</button>
        <button class="button" type="submit" name="openPreview" value="true">Speichern & Öffnen</button>
      </div>
    </form>
    <section class="panel" style="margin-top: 18px;">
      <div class="upload-inline">
        <label>
          Bild hochladen
          <input type="file" id="imageUploadInline" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
        </label>
        <button class="button secondary" id="refreshUploadsInline" type="button">Uploads aktualisieren</button>
      </div>
      <div style="margin-top: 18px;">
        ${state.uploads.length ? `
          <div class="uploads-grid">
            ${state.uploads.map((file) => `
              <button class="upload-card upload-select-card" type="button" data-use-upload-image="${escapeHtml(file.url)}">
                <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}">
                <strong>${escapeHtml(file.name)}</strong>
                <span>${escapeHtml(file.url)}</span>
              </button>
            `).join("")}
          </div>
        ` : '<div class="empty">Noch keine Uploads vorhanden.</div>'}
      </div>
    </section>
  `;

  panel.querySelector("#imageMetaForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const shouldOpenPreview = event.submitter?.value === "true";
    const nextFrontmatter = {
      title: form.title.value,
      image: form.image.value,
      lang: form.lang.value,
      alt: form.alt.value,
      altPrompt: form.altPrompt.value,
      keywords: form.keywords.value.split("\n").map((item) => item.trim()).filter(Boolean)
    };

    setStatus("Bild-Metadaten werden gespeichert...");
    try {
      await saveFile(path, {
        type: "markdown",
        data: nextFrontmatter,
        frontmatter: nextFrontmatter,
        body: ""
      });
      setStatus("Bild-Metadaten gespeichert. Vorschau ist bereit.", "success");
      if (shouldOpenPreview) {
        openPreviewInNewTab(getPreviewUrl());
      }
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, "error");
    }
  });

  panel.querySelector("#deleteImageMetaButton").addEventListener("click", async () => {
    const confirmed = window.confirm("Meta-Eintrag wirklich entfernen?");
    if (!confirmed) return;
    try {
      await deleteEditableEntry(path);
      delete state.cache[path];
      state.files = await api("/api/files").then((response) => response.files);
      state.selected.images = "";
      state.lastSavedAt = Date.now();
      updatePreviewLink();
      setStatus("Meta-Eintrag entfernt.", "success");
      await render();
    } catch (error) {
      setStatus(`Meta-Eintrag konnte nicht entfernt werden: ${error.message}`, "error");
    }
  });

  if (canRemoveUpload) {
    panel.querySelector("#deleteImageUploadButton").addEventListener("click", async () => {
      const confirmed = window.confirm("Bilddatei wirklich aus den Uploads entfernen?");
      if (!confirmed) return;
      try {
        await deleteUploadFromLibrary(data.image);
        data.image = "";
        const nextFrontmatter = {
          title: data.title || "",
          image: "",
          lang: data.lang || "neutral",
          alt: "",
          altPrompt: data.altPrompt || "",
          keywords: Array.isArray(data.keywords) ? data.keywords : []
        };
        await saveFile(path, {
          type: "markdown",
          data: nextFrontmatter,
          frontmatter: nextFrontmatter,
          body: ""
        });
        state.cache[path] = { type: "markdown", data: nextFrontmatter, body: "" };
        setStatus("Bilddatei entfernt und Meta aktualisiert.", "success");
        await bindImages(path);
      } catch (error) {
        setStatus(`Bilddatei konnte nicht entfernt werden: ${error.message}`, "error");
      }
    });
  }

  panel.querySelector("#refreshUploadsInline").addEventListener("click", async () => {
    try {
      await loadUploads();
      setStatus("Uploads aktualisiert.", "success");
      await bindImages(path);
    } catch (error) {
      setStatus(`Uploads konnten nicht geladen werden: ${error.message}`, "error");
    }
  });

  panel.querySelector("#imageUploadInline").addEventListener("change", async (event) => {
    const [fileToUpload] = event.target.files || [];
    if (!fileToUpload) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setStatus("Bild wird hochgeladen...");
        const contentBase64 = String(reader.result).split(",")[1];
        await api("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: fileToUpload.name, contentBase64 })
        });
        await loadUploads();
        setStatus("Bild erfolgreich hochgeladen.", "success");
        await bindImages(path);
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    };
    reader.readAsDataURL(fileToUpload);
  });

  panel.querySelectorAll("[data-use-upload-image]").forEach((button) => {
    button.addEventListener("click", () => {
      const imageField = panel.querySelector('[name="image"]');
      if (imageField) {
        imageField.value = button.dataset.useUploadImage;
      }
      setStatus("Bild in das Bildpfad-Feld übernommen. Jetzt noch ALT-Text eintragen und speichern.", "success");
    });
  });
};

const bindImagesManager = async () => {
  const files = listByPrefix(IMAGE_META_PREFIX);
  const selectedPath = state.selected.images || files[0] || "";
  if (!state.selected.images && selectedPath) {
    state.selected.images = selectedPath;
  }

  const usageMap = await collectImageUsageMap();
  const imageEntries = await Promise.all(files.map(async (file) => {
    const parsed = await ensureFile(file);
    const imagePath = normalizeImagePath(parsed.data?.image);
    const usages = usageMap.get(imagePath) || [];
    return {
      path: file,
      title: parsed.data?.title || file.split("/").pop(),
      image: imagePath,
      alt: parsed.data?.alt || "",
      usageCount: usages.length
    };
  }));
  const trackedImages = new Set(imageEntries.map((entry) => normalizeImagePath(entry.image)).filter(Boolean));
  const untrackedUploads = state.uploads.filter((file) => !trackedImages.has(normalizeImagePath(file.url)));
  const trackedByImage = new Map(imageEntries.map((entry) => [normalizeImagePath(entry.image), entry]));

  app.innerHTML = `
    <div class="content-grid">
      <section class="panel list-panel">
        <div>
          <p class="eyebrow">Medien</p>
          <h2 class="section-title">Bildverwaltung</h2>
        </div>
        <button class="button secondary" type="button" data-create-entry="images">Neues Bild-Meta anlegen</button>
        <div style="display: grid; gap: 12px;">
          <p class="eyebrow" style="margin-top: 8px;">Mit ALT-Text</p>
          ${imageEntries.length ? imageEntries.map((entry) => `
          <button class="image-list-card ${entry.path === selectedPath ? "active" : ""}" type="button" data-select-image="${escapeHtml(entry.path)}">
            <img src="${escapeHtml(entry.image || "")}" alt="${escapeHtml(entry.alt || entry.title)}">
            <div>
              <strong>${escapeHtml(entry.title)}</strong>
              <span>${escapeHtml(entry.image || "Kein Bildpfad gesetzt")}</span>
              <small>${escapeHtml(`${entry.usageCount} Verwendungen`)}</small>
            </div>
          </button>
          `).join("") : '<div class="empty">Noch keine Bild-Metadaten vorhanden.</div>'}
        </div>
        ${untrackedUploads.length ? `
          <div style="margin-top: 18px;">
            <p class="eyebrow">Uploads ohne ALT-Texte</p>
            <div class="array-list">
              ${untrackedUploads.map((file) => `
                <div class="image-list-card" style="cursor: default;">
                  <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}">
                  <div>
                    <strong>${escapeHtml(file.name)}</strong>
                    <span>${escapeHtml(file.url)}</span>
                    <small>Kein ALT-Text vorhanden</small>
                    <div class="actions" style="margin-top: 10px;">
                      <button class="button secondary" type="button" data-create-from-upload="${escapeHtml(file.url)}">ALT-Text anlegen</button>
                      <button class="button danger" type="button" data-delete-upload="${escapeHtml(file.url)}">Upload entfernen</button>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
        ${state.uploads.length ? `
          <div style="margin-top: 18px;">
            <p class="eyebrow">Upload-Bibliothek</p>
            <div class="array-list">
              ${state.uploads.map((file) => {
                const trackedEntry = trackedByImage.get(normalizeImagePath(file.url));
                return `
                  <div class="image-list-card" style="cursor: default;">
                    <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}">
                    <div>
                      <strong>${escapeHtml(file.name)}</strong>
                      <span>${escapeHtml(file.url)}</span>
                      <small>${trackedEntry ? "Mit ALT-Text verknüpft" : "Noch nicht verknüpft"}</small>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
      </section>
      <section class="panel" id="imagesEditorPanel">
        <div class="empty">Bilddaten werden geladen...</div>
      </section>
    </div>
  `;

  app.querySelector('[data-create-entry="images"]').addEventListener("click", async () => {
    const rawTitle = window.prompt("Titel für neues Bild-Meta:");
    if (!rawTitle) return;
    const slug = slugify(rawTitle);
    if (!slug) return;
    const path = `${IMAGE_META_PREFIX}${slug}.md`;
    const template = buildMarkdown({
      title: rawTitle,
      image: "",
      lang: "neutral",
      alt: "",
      altPrompt: "",
      keywords: []
    }, "");

    try {
      await api("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: template })
      });
      state.files = await api("/api/files").then((response) => response.files);
      state.cache[path] = parseContentFile(path, template);
      state.selected.images = path;
      state.lastSavedAt = Date.now();
      updatePreviewLink();
      setStatus("Bild-Meta angelegt.", "success");
      await render();
    } catch (error) {
      setStatus(`Anlegen fehlgeschlagen: ${error.message}`, "error");
    }
  });

  app.querySelectorAll("[data-select-image]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selected.images = button.dataset.selectImage;
      await render();
    });
  });

  app.querySelectorAll("[data-create-from-upload]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const path = await createImageMetaEntryFromUpload(button.dataset.createFromUpload);
        state.selected.images = path;
        state.lastSavedAt = Date.now();
        updatePreviewLink();
        setStatus("Bild-Meta angelegt. ALT-Text kann jetzt bearbeitet werden.", "success");
        await render();
      } catch (error) {
        setStatus(`Bild-Meta konnte nicht angelegt werden: ${error.message}`, "error");
      }
    });
  });

  app.querySelectorAll("[data-delete-upload]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Diesen Upload wirklich entfernen?");
      if (!confirmed) return;
      try {
        await deleteUploadFromLibrary(button.dataset.deleteUpload);
        setStatus("Upload entfernt.", "success");
        await render();
      } catch (error) {
        setStatus(`Upload konnte nicht entfernt werden: ${error.message}`, "error");
      }
    });
  });

  if (selectedPath) {
    await bindImages(selectedPath);
  } else {
    document.getElementById("imagesEditorPanel").innerHTML = '<div class="empty">Kein Bild ausgewählt.</div>';
  }
};

const bindMediaLibrary = () => {
  app.innerHTML = `
    <div class="grid">
      <section class="panel">
        <div class="upload-inline">
          <label>
            Bild hochladen
            <input type="file" id="imageUpload" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif">
          </label>
          <button class="button secondary" id="refreshUploadsButton" type="button">Uploads aktualisieren</button>
        </div>
      </section>
      <section class="panel">
        <h2 class="section-title">Upload Bibliothek</h2>
        ${state.uploads.length ? `
          <div class="uploads-grid">
            ${state.uploads.map((file) => `
              <a class="upload-card" href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">
                <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}">
                <strong>${escapeHtml(file.name)}</strong>
                <span>${escapeHtml(file.url)}</span>
              </a>
            `).join("")}
          </div>
        ` : '<div class="empty">Noch keine Uploads vorhanden.</div>'}
      </section>
    </div>
  `;

  app.querySelector("#refreshUploadsButton").addEventListener("click", async () => {
    await loadUploads();
    setStatus("Uploads aktualisiert.", "success");
    bindMediaLibrary();
  });

  app.querySelector("#imageUpload").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setStatus("Bild wird hochgeladen...");
        const contentBase64 = String(reader.result).split(",")[1];
        await api("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentBase64 })
        });
        await loadUploads();
        setStatus("Bild erfolgreich hochgeladen.", "success");
        bindMediaLibrary();
      } catch (error) {
        setStatus(`Upload fehlgeschlagen: ${error.message}`, "error");
      }
    };
    reader.readAsDataURL(file);
  });
};

const loadUploads = async () => {
  const response = await api("/api/uploads");
  state.uploads = response.files;
};

const render = async () => {
  updatePreviewLink();
  renderMenu();
  setHeader();

  try {
    if (state.view === "dashboard") {
      renderDashboard();
      return;
    }

    if (state.view === "homepage-de" || state.view === "homepage-en") {
      await bindHomepage(state.view);
      return;
    }

    if (state.view === "about") {
      await bindAboutPage();
      return;
    }

    if (state.view === "experience") {
      await bindExperiencePage();
      return;
    }

    if (state.view === "guides-hub") {
      await bindGuidesHubPage();
      return;
    }

    if (state.view === "guides-pages") {
      await bindGuidesPageManager();
      return;
    }

    if (state.view === "portfolio") {
      await bindPortfolioPage();
      return;
    }

    if (state.view === "film") {
      await bindFilmPage();
      return;
    }

    if (state.view === "academy") {
      await bindAcademyPage();
      return;
    }

    if (state.view === "preisliste") {
      await bindPreisliste();
      return;
    }

    if (state.view === "settings") {
      await bindSettings();
      return;
    }

    if (state.view === "journal") {
      await bindJournalManager();
      return;
    }

    if (state.view === "images") {
      await bindImagesManager();
      return;
    }

    bindMediaLibrary();
  } catch (error) {
    app.innerHTML = `<section class="panel"><div class="empty">Fehler beim Laden: ${escapeHtml(error.message)}</div></section>`;
    setStatus(`Fehler beim Laden: ${error.message}`, "error");
  }
};

const boot = async () => {
  try {
    setStatus("CMS wird initialisiert...");
    const [filesResponse, uploadsResponse] = await Promise.all([
      api("/api/files"),
      api("/api/uploads")
    ]);
    state.files = filesResponse.files;
    state.uploads = uploadsResponse.files;
    updatePreviewLink();
    await render();
    setStatus("CMS bereit.", "success");
  } catch (error) {
    app.innerHTML = `<section class="panel"><div class="empty">CMS konnte nicht geladen werden: ${escapeHtml(error.message)}</div></section>`;
    setStatus(`Start fehlgeschlagen: ${error.message}`, "error");
  }
};

boot();
