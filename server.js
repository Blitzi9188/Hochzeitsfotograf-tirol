const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const url = require("url");
const zlib = require("zlib");
const crypto = require("crypto");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const {
  createCheckoutSession,
  createSessionDownloadLink,
  fetchCheckoutSessionSummary,
  handleStripeWebhook,
  streamBundleDownload,
  appendLog
} = require("./lib/preset-delivery");
const { sendContactInquiry } = require("./lib/contact-mail");

const rootDir = __dirname;
loadEnvFile(path.join(rootDir, ".env"));
const configuredDataRoot = String(process.env.DATA_ROOT || process.env.RAILWAY_VOLUME_MOUNT_PATH || "").trim();
const dataRoot = configuredDataRoot ? path.resolve(configuredDataRoot) : rootDir;
const host = "0.0.0.0";
const port = Number(process.env.PORT) || 8001;
const editableRoots = [
  path.join(dataRoot, "content"),
  path.join(dataRoot, "admin"),
  path.join(dataRoot, "guides"),
  path.join(dataRoot, "README.md")
];
const uploadsDir = path.join(dataRoot, "assets", "uploads");
const journalDir = path.join(dataRoot, "content", "journal");
const blockedStaticRoots = [
  path.join(rootDir, "private"),
  path.join(rootDir, "node_modules")
];
const blockedStaticFiles = new Set([
  path.join(rootDir, "server.js"),
  path.join(rootDir, "package.json"),
  path.join(rootDir, "package-lock.json"),
  path.join(rootDir, ".env"),
  path.join(rootDir, ".env.local"),
  path.join(rootDir, ".env.production")
]);
const seededPaths = [
  "content",
  "guides",
  "admin",
  path.join("assets", "uploads"),
  path.join("private", "downloads"),
  path.join("private", "runtime"),
  "README.md"
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".svg": "image/svg+xml"
};

const buildCacheControl = (ext) => {
  const lowerExt = String(ext || "").toLowerCase();
  if ([".html"].includes(lowerExt)) return "no-store";
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".svg"].includes(lowerExt)) {
    return "public, max-age=31536000, immutable";
  }
  if ([".css", ".js"].includes(lowerExt)) {
    return "public, max-age=604800, stale-while-revalidate=86400"; // 7 days
  }
  if ([".json", ".xml", ".txt", ".md", ".yml", ".yaml"].includes(lowerExt)) {
    return "public, max-age=3600";
  }
  return "public, max-age=3600";
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
};

const sendText = (res, statusCode, message) => {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(message);
};

// CMS endpoints are admin-only. Check for a shared secret in X-Admin-Token header.
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "").trim();
const isLoopbackAddress = (addr) => {
  const a = String(addr || "").replace(/^::ffff:/, "");
  return a === "127.0.0.1" || a === "::1" || a === "localhost";
};
const isAdminAuthed = (req) => {
  if (ADMIN_TOKEN) {
    const provided = String(req.headers["x-admin-token"] || "").trim();
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(ADMIN_TOKEN);
    return providedBuf.length === expectedBuf.length
      && crypto.timingSafeEqual(providedBuf, expectedBuf);
  }
  return isLoopbackAddress(req.socket && req.socket.remoteAddress);
};
const requireAdminToken = (req, res) => {
  if (isAdminAuthed(req)) return true;
  sendText(res, ADMIN_TOKEN ? 401 : 503, ADMIN_TOKEN ? "Unauthorized" : "Admin API disabled: set ADMIN_TOKEN");
  return false;
};

const pathExists = async (targetPath) => {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const syncSeededPath = async (sourcePath, targetPath) => {
  const sourceStat = await fsp.stat(sourcePath);

  if (sourceStat.isDirectory()) {
    await fsp.mkdir(targetPath, { recursive: true });
    const entries = await fsp.readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      await syncSeededPath(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
    }
    return;
  }

  await fsp.mkdir(path.dirname(targetPath), { recursive: true });

  // Only copy if the file does not yet exist in the persistent volume.
  // This preserves any edits made via the CMS admin panel on the live server
  // while still seeding new files (e.g. new blog posts) on every deploy.
  try {
    await fsp.stat(targetPath);
    return; // File already exists – keep the live/CMS version.
  } catch {
    // Target does not exist yet, so we copy it below.
  }

  await fsp.copyFile(sourcePath, targetPath);
};

const ensurePersistentDataRoot = async () => {
  if (dataRoot === rootDir) return;

  await fsp.mkdir(dataRoot, { recursive: true });

  for (const relativePath of seededPaths) {
    const sourcePath = path.join(rootDir, relativePath);
    const targetPath = path.join(dataRoot, relativePath);
    if (!(await pathExists(sourcePath))) continue;
    await syncSeededPath(sourcePath, targetPath);
  }
};

const MAX_BODY_BYTES = 20 * 1024 * 1024; // 20 MB
const readBody = async (req) => {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      req.destroy();
      throw Object.assign(new Error("Payload too large"), { statusCode: 413 });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const readBodyBuffer = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const translateText = async (text, sourceLang = "de", targetLang = "en") => {
  const query = String(text || "").trim();
  if (!query) return "";

  const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(query)}`;
  const response = await fetch(translateUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error("Unexpected translation response");
  }

  return payload[0]
    .map((part) => Array.isArray(part) ? part[0] : "")
    .join("")
    .trim();
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

const fetchInstagramPosts = async (username, count = 3) => {
  const cleanUsername = getInstagramUsername(username);
  if (!cleanUsername) return [];

  const response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "X-IG-App-ID": "936619743392459",
      "Referer": `https://www.instagram.com/${cleanUsername}/`
    }
  });

  if (!response.ok) {
    throw new Error(`Instagram request failed: ${response.status}`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges || [];

  return edges
    .map(({ node }) => {
      const captionEdge = node?.edge_media_to_caption?.edges?.[0]?.node?.text || "";
      const rawImage = node?.display_url || "";
      return {
        shortcode: node?.shortcode || "",
        url: node?.shortcode ? `https://www.instagram.com/p/${node.shortcode}/` : "",
        image: rawImage ? `/api/instagram-image?url=${encodeURIComponent(rawImage)}` : "",
        caption: captionEdge,
        alt: node?.accessibility_caption || captionEdge || "Instagram post",
        timestamp: Number(node?.taken_at_timestamp || 0)
      };
    })
    .filter((item) => item.url && item.image)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, Math.max(1, Number(count) || 3));
};

const isSafeEditablePath = (relativePath) => {
  const absolutePath = path.resolve(dataRoot, relativePath);
  const allowed = editableRoots.some((base) => absolutePath === base || absolutePath.startsWith(`${base}${path.sep}`));
  return allowed ? absolutePath : null;
};

const isBlockedStaticPath = (absolutePath) => {
  if (blockedStaticFiles.has(absolutePath)) return true;
  const privateRoots = [
    path.join(rootDir, "private"),
    path.join(dataRoot, "private"),
    path.join(rootDir, "node_modules"),
    path.join(dataRoot, "node_modules")
  ];
  return privateRoots.some((blockedRoot) => absolutePath === blockedRoot || absolutePath.startsWith(`${blockedRoot}${path.sep}`));
};

// Git-verwaltete Pfade: immer zuerst aus dem Repo (rootDir) ausliefern, NICHT aus
// dem Volume. Sonst bedient der einmal geseedete Volume-Stand veraltete Dateien und
// Git-Deploys werden nie sichtbar (Volume-Trap). Guides werden ausschliesslich per
// Git gepflegt -> Repo ist die Quelle der Wahrheit.
const REPO_FIRST_PREFIXES = ["/guides/"];

const getStaticCandidates = (pathname) => {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const repoFirst = REPO_FIRST_PREFIXES.some((prefix) => cleanPath.startsWith(prefix));
  const baseOrder = repoFirst ? [rootDir, dataRoot] : [dataRoot, rootDir];
  const candidates = baseOrder.map((baseDir) => ({ baseDir, absolutePath: path.resolve(baseDir, `.${cleanPath}`) }));

  return candidates
    .filter(({ baseDir, absolutePath }) => absolutePath === baseDir || absolutePath.startsWith(`${baseDir}${path.sep}`))
    .map(({ absolutePath }) => absolutePath)
    .filter((absolutePath) => !isBlockedStaticPath(absolutePath));
};

const readFirstAvailableFile = async (relativePath, encoding = null) => {
  const cleanRelativePath = String(relativePath || "").replace(/^\/+/, "");
  const candidates = [dataRoot, rootDir].map((baseDir) => path.join(baseDir, cleanRelativePath));
  for (const filePath of candidates) {
    try {
      return await fsp.readFile(filePath, encoding || undefined);
    } catch {
      continue;
    }
  }
  throw new Error(`Missing file: ${relativePath}`);
};

const readJsonDataFile = async (relativePath) => {
  const raw = await readFirstAvailableFile(relativePath, "utf8");
  return JSON.parse(raw);
};

const escapeInlineJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const serveHomepage = async (req, res) => {
  const template = await readFirstAvailableFile("index.html", "utf8");
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const requestedLang = requestUrl.searchParams.get("lang") === "en" ? "en" : "de";
  const homepageBootstrap = {
    [requestedLang]: await readJsonDataFile(path.join("content", "homepage", `${requestedLang}.json`))
  };

  const bootstrapped = template.replace(
    "<script>window.__HOMEPAGE_BOOTSTRAP__ = null;</script>",
    `<script>window.__HOMEPAGE_BOOTSTRAP__ = ${escapeInlineJson(homepageBootstrap)};</script>`
  );
  const injected = injectSeoHead(bootstrapped, "/");

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(req.method === "HEAD" ? "" : injected);
};

const listFilesRecursive = async (dir) => {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const items = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursive(fullPath);
    }
    return fullPath;
  }));
  return items.flat();
};

const listEditableFiles = async () => {
  const contentFiles = await listFilesRecursive(path.join(dataRoot, "content"));
  return contentFiles
    .filter((file) => [".json", ".md", ".yml", ".yaml"].includes(path.extname(file)))
    .map((file) => path.relative(dataRoot, file))
    .sort();
};

const journalSlugFromFile = (file) =>
  path.basename(file, path.extname(file)).replace(/^\d{4}-\d{2}-\d{2}-/, "");

// Journal repo-first: Git ist die Quelle der Wahrheit. Sonst liefert die einmal
// ins Volume geseedete Kopie veraltete featuredImage/gallery-Pfade (Volume-Trap),
// und migrierte /assets/uploads/-Pfade werden per git push nie live. Fallback auf
// das Volume bleibt, damit rein per CMS veroeffentlichte Slugs (nur im Volume,
// nicht im Repo) weiterhin aufloesen.
const repoJournalDir = path.join(rootDir, "content", "journal");
const journalSearchDirs = repoJournalDir === journalDir ? [journalDir] : [repoJournalDir, journalDir];

const resolveJournalFileBySlug = async (slug) => {
  for (const dir of journalSearchDirs) {
    const files = await listFilesRecursive(dir).catch(() => []);
    const match = files.find((file) => journalSlugFromFile(file) === slug);
    if (match) return match;
  }
  return null;
};

// Repo-first Liste der Journal-.md (fuer die Uebersicht /journal/, die client-seitig
// via /api/files -> /api/file rendert). Repo gewinnt pro Slug, Volume ergaenzt nur
// Slugs, die es im Repo nicht gibt -> Git-Deploys erscheinen sofort in den Karten.
const listJournalRelPaths = async () => {
  const bySlug = new Map();
  // Volume zuerst, dann Repo -> spaeteres set() gewinnt (Repo).
  for (const dir of [...journalSearchDirs].reverse()) {
    const files = await listFilesRecursive(dir).catch(() => []);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      bySlug.set(journalSlugFromFile(file), path.basename(file));
    }
  }
  return [...bySlug.values()].sort().map((name) => `content/journal/${name}`);
};

const SITE_ORIGIN = "https://blitzkneisser.com";
const PAGE_TITLE_SUFFIX = "Blitzkneisser Photography";

// Injects self-referencing canonical + hreflang (de-AT / en / x-default) directly
// into any HTML string before it is sent, so crawlers see correct tags in raw HTML.
const injectSeoHead = (html, pathname) => {
  let clean = String(pathname || "/");
  if (!clean.startsWith("/")) clean = `/${clean}`;
  // Strip query string; keep trailing slash
  clean = clean.split("?")[0];
  if (clean !== "/" && !clean.endsWith("/")) clean += "/";

  const canonical = `${SITE_ORIGIN}${clean}`;
  const replacement = [
    `<script>window.__SITE_ORIGIN__ = ${JSON.stringify(SITE_ORIGIN)};</script>`,
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="de-AT" href="${canonical}">`,
    `<link rel="alternate" hreflang="en" href="${canonical}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
  ].join("\n  ");

  // Remove any existing canonical + hreflang tags
  let out = html
    .replace(/<link\s[^>]*rel="canonical"[^>]*>/gi, "")
    .replace(/<link\s[^>]*rel="alternate"[^>]*hreflang[^>]*>/gi, "")
    .replace(/<link\s[^>]*hreflang[^>]*rel="alternate"[^>]*>/gi, "");

  // Insert after opening <head> tag
  out = out.replace(/(<head(?:\s[^>]*)?>)/i, `$1\n  ${replacement}`);
  return out;
};

const escHtml = (value) =>
  String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Serverseitiges Rendern eines Journal-Beitrags: bäckt Titel, Meta-Description,
// Canonical, H1, Intro-Text (DE-Standard) und BlogPosting/BreadcrumbList-JSON-LD
// direkt in das Template, damit /journal/{slug}/ beim Direktaufruf echtes,
// crawlbares HTML (200) liefert. Das clientseitige JS hydratisiert danach wie bisher.
const renderJournalEntryHtml = (templateHtml, data, body, pageUrl) => {
  const entryTitle = data.title || "Journal Eintrag";
  const seoTitle = data.seoTitle || entryTitle;
  const seoDescription = data.seoDescription || "Journal Beitrag von Blitzkneisser Photography.";
  const featuredImage = data.featuredImage || "";
  const featuredImageAlt = data.featuredImageAlt || entryTitle;
  const fullTitle = `${seoTitle} | ${PAGE_TITLE_SUFFIX}`;

  const paragraphs = String(body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("## "));
  const introHtml = paragraphs
    .map((p, i) => `<p class="${i === 0 ? "dropcap " : ""}text-lg md:text-xl font-light leading-relaxed text-brand-text opacity-90 mb-8">${escHtml(p)}</p>`)
    .join("\n");

  const imageAbsolute = featuredImage
    ? (featuredImage.startsWith("http") ? featuredImage : `${SITE_ORIGIN}${featuredImage}`)
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#blogposting`,
        "headline": seoTitle,
        "description": seoDescription,
        "url": pageUrl,
        "inLanguage": "de-AT",
        "datePublished": data.date || "",
        "dateModified": data.dateModified || data.date || "",
        "author": { "@type": "Person", "name": "Andreas Kiss", "url": `${SITE_ORIGIN}/about/` },
        "publisher": { "@id": `${SITE_ORIGIN}/#business` },
        "mainEntityOfPage": { "@id": `${pageUrl}#webpage` },
        ...(imageAbsolute ? { "image": { "@type": "ImageObject", "url": imageAbsolute, "description": featuredImageAlt } } : {})
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Startseite", "item": `${SITE_ORIGIN}/` },
          { "@type": "ListItem", "position": 2, "name": "Journal", "item": `${SITE_ORIGIN}/journal/` },
          { "@type": "ListItem", "position": 3, "name": entryTitle, "item": pageUrl }
        ]
      }
    ]
  };

  const headInjection = [
    `<meta property="og:title" content="${escHtml(fullTitle)}">`,
    `<meta property="og:description" content="${escHtml(seoDescription)}">`,
    imageAbsolute ? `<meta property="og:image" content="${escHtml(imageAbsolute)}">` : "",
    `<meta property="og:url" content="${escHtml(pageUrl)}">`,
    `<meta property="og:type" content="article">`,
    `<script type="application/ld+json" id="postSchema">${escapeInlineJson(jsonLd)}</script>`
  ].filter(Boolean).join("\n  ");

  let html = templateHtml.toString();
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(fullTitle)}</title>`);
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escHtml(seoDescription)}$2`
  );
  html = html.replace('href="" id="canonicalTag"', `href="${escHtml(pageUrl)}" id="canonicalTag"`);
  html = html.replace('id="entryTitle"></h1>', `id="entryTitle">${escHtml(entryTitle).replace(/ \| /g, "<br>")}</h1>`);
  html = html.replace('id="introSection"></section>', `id="introSection">${introHtml}</section>`);
  html = html.replace('</head>', `  ${headInjection}\n</head>`);
  return html;
};

const listUploadFiles = async () => {
  const entries = await fsp.readdir(uploadsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
    .map((entry) => ({
      name: entry.name,
      url: `/assets/uploads/${encodeURIComponent(entry.name)}`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const splitFrontmatter = (content) => {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content };
  }
  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: "", body: content };
  }
  return {
    frontmatter: content.slice(4, end).trim(),
    body: content.slice(end + 4).replace(/^\n/, "")
  };
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

const parseFrontmatterData = (frontmatter) => {
  const result = {};
  const lines = frontmatter.split("\n");
  let currentArrayKey = null;
  let currentObject = null;
  let lastKey = null;
  let lastObjectKey = null;

  lines.forEach((rawLine) => {
    if (!rawLine.trim()) return;
    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();

    if (indent === 0) {
      currentObject = null;
      lastObjectKey = null;
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) return;
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
      if (!currentArrayKey) return;

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

const serveStatic = async (req, res, pathname) => {
  const candidatePaths = getStaticCandidates(pathname);
  if (!candidatePaths.length) {
    sendText(res, 403, "Forbidden");
    return;
  }

  for (const filePath of candidatePaths) {
    try {
      const stat = await fsp.stat(filePath);
      const targetFile = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
      const ext = path.extname(targetFile).toLowerCase();
      let content = await fsp.readFile(targetFile);

      // Inject SSR canonical + hreflang into every HTML page before serving
      if (ext === ".html") {
        const htmlStr = injectSeoHead(content.toString("utf8"), pathname);
        content = Buffer.from(htmlStr, "utf8");
      }

      const compressible = [".css", ".js", ".html", ".json", ".xml", ".txt", ".svg"].includes(ext);
      const acceptEncoding = req.headers["accept-encoding"] || "";
      if (compressible && acceptEncoding.includes("gzip")) {
        zlib.gzip(content, (err, compressed) => {
          if (err) {
            res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream", "Cache-Control": buildCacheControl(ext) });
            res.end(content);
          } else {
            res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream", "Cache-Control": buildCacheControl(ext), "Content-Encoding": "gzip", "Vary": "Accept-Encoding" });
            res.end(compressed);
          }
        });
      } else {
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream", "Cache-Control": buildCacheControl(ext) });
        res.end(content);
      }
      return;
    } catch {
      continue;
    }
  }

  sendText(res, 404, "Not Found");
};

// ---------------------------------------------------------------------------
// SEO REDIRECTS — zentrale Konfiguration (hier pflegen, nicht verstreut)
// ---------------------------------------------------------------------------

// 1) Alte URLs → neue Ziele (301 permanent)
//    Ziele sind vorläufig; später durch eigene Seiten ersetzen und hier anpassen.
const LEGACY_REDIRECTS = [
  { from: "/hubschrauber-hochzeit",           to: "/hubschrauber-hochzeit-tirol/" },
  { from: "/stadel-hochzeit",                 to: "/experience/" },
  { from: "/helicopter-elopement-in-den-dolomiten", to: "/journal/" },
  // Alte WordPress-URLs (blitzkneisser.com) → neue Pfade (exakt, 301)
  { from: "/about-capturing-intimate-moments-amid-majestic-peaks", to: "/about/" },
  { from: "/contact-me-dolomites-photographer",                    to: "/contact/" },
  { from: "/datenschutz-erklaerung-hochzeits-fotograf",            to: "/dsgvo/" },
  { from: "/dolomites-elopement-stories-capturing-love-in-the-mountains", to: "/journal/" },
  { from: "/mountain-elopement-dolomites",                         to: "/experience/" },
  { from: "/the-best-elopement-locations",                         to: "/journal/the-best-elopement-locations/" },
  { from: "/sunrise-elopement-at-passo-giau",                      to: "/journal/sunrise-elopement-at-passo-giau/" },
  { from: "/proposal-dolomites-engagement-mountains",              to: "/journal/proposal-dolomites-engagement-mountains/" },
  { from: "/winter-elopement-in-the-dolomites",                    to: "/journal/winter-wedding-in-the-alps/" },
  { from: "/winter-wedding-in-the-alps",                           to: "/journal/winter-wedding-in-the-alps/" },
  { from: "/lago-di-braies-wedding-dream-destination-in-the-dolomites", to: "/journal/lago-di-braies-wedding-dream-destination-in-the-dolomites/" },
  { from: "/small-wedding-ideas-to-inspire-elopement",             to: "/journal/small-wedding-ideas-to-inspire-elopement/" },
  { from: "/a-dream-engagement-in-the-alps-2",                     to: "/journal/a-dream-engagement-in-the-alps-2/" },
  { from: "/category/dolomites",                                   to: "/journal/" },
];

// Präfix-Redirects (alte WP-URL-Muster) → neue Pfade (301, Präfix-Match)
const PREFIX_REDIRECTS = [
  { prefix: "/tag/",              to: "/journal/" },
  { prefix: "/gallery-category/", to: "/portfolio/" },
  { prefix: "/shop/",             to: "/workshops-presets/" },
];

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";

  // 2) www → ohne www (301)
  const reqHost = req.headers["host"] || "";
  if (reqHost.startsWith("www.")) {
    const bareHost = reqHost.slice(4);
    const qs = parsed.search || "";
    res.writeHead(301, { Location: `https://${bareHost}${pathname}${qs}` });
    res.end();
    return;
  }

  // 3) Legacy-URL-Redirects (mit und ohne Trailing Slash, 301)
  const pathnameNorm = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  for (const rule of LEGACY_REDIRECTS) {
    if (pathnameNorm === rule.from) {
      res.writeHead(301, { Location: rule.to });
      res.end();
      return;
    }
  }

  // Präfix-Redirects (301) – z. B. /tag/*, /gallery-category/*, /shop/*
  for (const rule of PREFIX_REDIRECTS) {
    if (pathname.startsWith(rule.prefix) || pathnameNorm === rule.prefix.slice(0, -1)) {
      res.writeHead(301, { Location: rule.to });
      res.end();
      return;
    }
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature"
    });
    res.end();
    return;
  }

  try {
    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/") {
      await serveHomepage(req, res);
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/index.html") {
      const query = parsed.search || "";
      res.writeHead(308, { Location: query ? `/${query}` : "/" });
      res.end();
      return;
    }

    const preislisteMatch = pathname.match(/^\/preisliste\/26-27\/?$/);
    if ((req.method === "GET" || req.method === "HEAD") && preislisteMatch) {
      const requestUrl = new URL(req.url || "/", "http://localhost");
      const requestedLang = requestUrl.searchParams.get("lang") === "en" ? "en" : "de";
      let pricing = {};
      try {
        pricing = await readJsonDataFile(path.join("content", "preisliste", `${requestedLang}.json`));
      } catch {
        try { pricing = await readJsonDataFile(path.join("content", "preisliste", "de.json")); } catch { pricing = {}; }
      }

      const blocks = Array.isArray(pricing.blocks) ? pricing.blocks : [];
      const isEn = requestedLang === "en";

      const esc = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      const stripHtml = (s) => {
        if (!s) return "";
        return String(s)
          .replace(/<li[^>]*>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
          .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
          .replace(/&auml;/g,"ä").replace(/&ouml;/g,"ö").replace(/&uuml;/g,"ü")
          .replace(/&szlig;/g,"ß").replace(/&nbsp;/g," ").replace(/&ndash;/g,"–")
          .replace(/&darr;/g,"↓").replace(/&#\d+;/g,"").trim();
      };
      const parseItems = (raw) => stripHtml(raw).split("\n").map(l => l.trim())
        .filter(l => l && l.length > 2 && !/^(INCLUDES?|Inklusive|Includes):?$/i.test(l));

      // Packages
      const pkgBlock = blocks.find(b => b.type === "package-2");
      const pkgCols = pkgBlock ? (pkgBlock.columns || []) : [];
      const pkgHtml = pkgCols.map((col, i) => {
        const num = ["01","02","03"][i] || String(i+1);
        const name = esc(stripHtml(col.name || col.title || "").replace(/^PACKAGE\s*[№#]?\s*\d*/i,"").trim() || `Package ${num}`);
        const price = esc(stripHtml(col.price || ""));
        const items = parseItems(col.includes || col.text || "");
        return `<div class="pl-pkg">
  <span class="pl-pkg-num">Package ${esc(num)}</span>
  <h2 class="headline text-2xl md:text-3xl text-brand-text">${name}</h2>
  <div class="pl-pkg-price">${price}</div>
  <div class="pl-pkg-rule"></div>
  <ul class="pl-pkg-list">${items.map(it => `<li>${esc(it)}</li>`).join("")}</ul>
</div>`;
      }).join("\n");

      // Addons
      const addonTypes = new Set(["collection-text-left-extra-right","includes-left-slider-right","package-1","slider-full-price-below"]);
      const addonBlocks = blocks.filter(b => b.name && addonTypes.has(b.type));
      const addonHtml = addonBlocks.map(block => {
        const col = (block.columns || [])[0] || {};
        const name = esc(stripHtml(block.name || col.name || ""));
        const price = esc(stripHtml(col.price || ""));
        const lines = parseItems(col.includes || col.text || "");
        const prose = lines.filter(l => l.length > 60).slice(0,2);
        const items = lines.filter(l => l.length <= 60 && l.length > 3);
        return `<div class="pl-addon">
  <div class="pl-addon-body">
    <div class="pl-addon-name">${name}</div>
    ${prose.map(p => `<p class="pl-addon-text">${esc(p)}</p>`).join("")}
    ${items.length ? `<ul class="pl-addon-list">${items.map(it => `<li>${esc(it.replace(/^[•\-]\s*/,""))}</li>`).join("")}</ul>` : ""}
  </div>
  <div class="pl-addon-price">${price}</div>
</div>`;
      }).join("\n");

      const activeDe = requestedLang === "de" ? `style="background:#1B1A18;color:#F9F7F2;border-color:#1B1A18;"` : "";
      const activeEn = requestedLang === "en" ? `style="background:#1B1A18;color:#F9F7F2;border-color:#1B1A18;"` : "";

      const html = `<!DOCTYPE html>
<html lang="${esc(requestedLang)}" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${isEn ? "Pricing Wedding Photographer Tyrol &amp; Dolomites | 2026/27" : "Preise Hochzeitsfotograf Tirol &amp; Dolomiten | 2026/27"}</title>
<meta name="description" content="${isEn ? "Pricing for wedding photography, elopements and wedding films in Tyrol, Innsbruck and the Dolomites 2026/27." : "Preise für Hochzeitsfotografie, Elopements und Hochzeitsfilme in Tirol, Innsbruck und den Dolomiten für 2026/27."}">
<link rel="canonical" href="https://blitzkneisser.com/preisliste/26-27/">
<link rel="alternate" hreflang="de-AT" href="https://blitzkneisser.com/preisliste/26-27/">
<link rel="alternate" hreflang="en" href="https://blitzkneisser.com/preisliste/26-27/">
<link rel="alternate" hreflang="x-default" href="https://blitzkneisser.com/preisliste/26-27/">
<link rel="icon" type="image/png" href="/Logo-Blitzkneisser-BERG.png">
<script defer src="/assets/seo.js"></script>
<link rel="stylesheet" href="/assets/home.css">
<style>
body{background:#fff;color:#1B1A18;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
.headline{font-weight:700;letter-spacing:-.05em;line-height:.9;text-transform:uppercase;}
.eyebrow{letter-spacing:.28em;text-transform:uppercase;font-size:10px;font-weight:500;}

/* layout */
.pl-wrap{padding-left:1.5rem;padding-right:1.5rem;}
@media(min-width:768px){.pl-wrap{padding-left:3rem;padding-right:3rem;}}
.pl-inner{max-width:72rem;}

/* hero */
.pl-hero{padding-top:7rem;padding-bottom:3rem;border-bottom:1px solid #E6DED4;}
@media(min-width:768px){.pl-hero{padding-top:9rem;padding-bottom:4rem;}}

/* packages */
.pl-pkg-grid{display:grid;gap:0;border:1px solid #E6DED4;margin-top:3rem;}
@media(min-width:768px){.pl-pkg-grid{grid-template-columns:1fr 1fr;}}
.pl-pkg{padding:2.5rem 2rem;border-bottom:1px solid #E6DED4;position:relative;}
@media(min-width:768px){.pl-pkg{padding:3rem 2.5rem;border-bottom:0;border-right:1px solid #E6DED4;}
.pl-pkg:last-child{border-right:0;}}
.pl-pkg-num{display:block;font-size:10px;letter-spacing:.3em;font-weight:500;color:#6F685F;text-transform:uppercase;margin-bottom:.75rem;}
.pl-pkg-price{font-size:3rem;font-weight:300;color:#1B1A18;line-height:1;margin:.5rem 0 2rem;letter-spacing:-.03em;}
@media(min-width:768px){.pl-pkg-price{font-size:3.5rem;}}
.pl-pkg-rule{width:2rem;height:1px;background:#1B1A18;margin-bottom:1.5rem;}
.pl-pkg-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.6rem;}
.pl-pkg-list li{font-size:.82rem;line-height:1.5;color:#6F685F;display:flex;gap:.65rem;align-items:flex-start;}
.pl-pkg-list li::before{content:'–';color:#B0A89E;flex-shrink:0;font-size:.78rem;margin-top:.1rem;}

/* addons */
.pl-addons{border-top:1px solid #E6DED4;margin-top:4rem;}
.pl-addon{display:flex;justify-content:space-between;align-items:flex-start;gap:2rem;padding:2rem 0;border-bottom:1px solid #E6DED4;flex-wrap:wrap;}
.pl-addon-body{flex:1;min-width:0;}
.pl-addon-name{font-size:10px;letter-spacing:.28em;font-weight:500;text-transform:uppercase;color:#1B1A18;margin-bottom:.6rem;}
.pl-addon-text{font-size:.85rem;line-height:1.6;color:#6F685F;max-width:38rem;margin:0;}
.pl-addon-list{list-style:none;padding:0;margin:.6rem 0 0;display:flex;flex-direction:column;gap:.35rem;}
.pl-addon-list li{font-size:.8rem;line-height:1.4;color:#6F685F;display:flex;gap:.5rem;align-items:flex-start;}
.pl-addon-list li::before{content:'–';color:#B0A89E;flex-shrink:0;font-size:.75rem;margin-top:.05rem;}
.pl-addon-price{font-size:1.4rem;font-weight:300;color:#1B1A18;white-space:nowrap;letter-spacing:-.02em;flex-shrink:0;}
</style>
</head>
<body class="min-h-screen overflow-x-hidden flex flex-col">
<nav class="fixed top-0 left-0 z-50 w-full bg-white/80 px-6 py-5 text-brand-text backdrop-blur-sm transition-all duration-500 md:px-12 md:py-8" id="mainNav">
  <div class="mx-auto flex max-w-[120rem] items-center justify-between gap-6">
    <a href="/" id="navHomeLink" class="group flex items-center" aria-label="Blitzkneisser Photography">
      <img src="/Logo-Blitzkneisser-BERG.png" alt="Blitzkneisser Photography" class="h-11 w-auto brightness-0 contrast-125 opacity-70 transition duration-500 ease-out group-hover:opacity-100 md:h-14">
    </a>
    <button type="button" class="mobile-menu-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenuPanel" aria-label="Menü öffnen"><span></span><span></span><span></span></button>
    <div class="nav-menu-panel ml-auto flex items-center justify-end gap-4 text-right" id="navMenuPanel">
      <div class="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] sm:gap-6 md:gap-8 md:text-xs">
        <a href="/" id="navHomeMenuLink" class="hover:opacity-60 transition-opacity duration-300">${isEn?"Home":"Startseite"}</a>
        <a href="/experience/" id="navExperienceLink" class="hover:opacity-60 transition-opacity duration-300">Experience</a>
        <a href="/guides/" id="navGuidesLink" class="hover:opacity-60 transition-opacity duration-300">Guides</a>
        <a href="/journal/" id="navJournalLink" class="hover:opacity-60 transition-opacity duration-300">Journal</a>
        <a href="/about/" id="navAboutLink" class="hover:opacity-60 transition-opacity duration-300">About</a>
        <a href="/contact/" id="navContactLink" class="hover:opacity-60 transition-opacity duration-300">Contact</a>
        <a href="/film/" id="navFilmLink" class="hidden hover:opacity-60 transition-opacity duration-300">Film</a>
        <a href="/academy/" id="navAcademyLink" class="hidden hover:opacity-60 transition-opacity duration-300">Academy</a>
      </div>
      <div class="nav-lang-toggle flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] md:text-xs">
        <button type="button" class="border border-brand-border px-3 py-2 transition-colors" data-lang-button="de" aria-pressed="${requestedLang==="de"?"true":"false"}" ${activeDe} onclick="localStorage.setItem('site-lang','de');location.href='/preisliste/26-27/'">DE</button>
        <button type="button" class="border border-brand-border px-3 py-2 transition-colors" data-lang-button="en" aria-pressed="${requestedLang==="en"?"true":"false"}" ${activeEn} onclick="localStorage.setItem('site-lang','en');location.href='/preisliste/26-27/?lang=en'">EN</button>
      </div>
    </div>
  </div>
</nav>

<main class="flex-1">

  <!-- HERO -->
  <div class="pl-wrap pl-hero">
    <div class="pl-inner">
      <span class="eyebrow text-brand-muted mb-6 block">${isEn ? "Investment Guide 2026/27" : "Investment Guide 2026/27"}</span>
      <h1 class="headline text-[2.8rem] text-brand-text sm:text-[4rem] md:text-[5.5rem] lg:text-[7rem] mb-6">${isEn ? "Pricing" : "Preisliste"}</h1>
      <p class="text-sm md:text-[0.95rem] leading-relaxed text-brand-muted max-w-xl font-light">${isEn
        ? "Every wedding day is unique. Our packages serve as a starting point — we are happy to tailor them to your day together."
        : "Jeder Hochzeitstag ist einzigartig. Unsere Pakete dienen als grobe Orientierung — wir passen sie gerne gemeinsam auf euren Tag ab."}</p>

      <!-- PACKAGES -->
      <div class="pl-pkg-grid">
${pkgHtml}
      </div>
    </div>
  </div>

  <!-- ADDONS -->
  <div class="pl-wrap py-16 md:py-20">
    <div class="pl-inner">
      <span class="eyebrow text-brand-muted mb-8 block">${isEn ? "Additional Services" : "Zusätzliche Leistungen"}</span>
      <div class="pl-addons">
${addonHtml}
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div class="pl-wrap py-20 md:py-28 border-t border-brand-border">
    <div class="pl-inner">
      <span class="eyebrow text-brand-muted mb-6 block">${isEn ? "Contact" : "Anfrage"}</span>
      <h2 class="headline text-4xl md:text-6xl text-brand-text mb-8">${isEn ? "Any questions?" : "Fragen zu den Preisen?"}</h2>
      <a href="/contact/" class="inline-block border border-brand-text px-6 py-3 text-xs uppercase tracking-[0.2em] text-brand-text transition hover:bg-brand-text hover:text-white" id="heroContactLink">${isEn ? "Get in touch" : "Termin anfragen"}</a>
    </div>
  </div>

</main>

<footer class="py-16 px-6 md:px-12 border-t border-brand-border flex flex-col gap-8 text-[10px] md:flex-row md:items-start md:justify-between md:gap-16 md:text-xs text-[#111111] tracking-[0.2em] uppercase font-medium bg-white">
  <div id="footerBrandText">© 2026 Blitzkneisser Photography</div>
  <div class="flex flex-wrap items-center justify-start gap-x-6 gap-y-3 md:gap-x-8">
    <a id="footerInstagramLink" href="https://www.instagram.com/blitzkneisser/" class="hover:opacity-60 transition-opacity duration-300">Instagram</a>
    <a href="/contact/" class="hover:opacity-60 transition-opacity duration-300" id="footerContactLink">Contact</a>
    <a href="/journal/" class="hover:opacity-60 transition-opacity duration-300" id="footerJournalLink">Journal</a>
    <a href="/film/" class="hover:opacity-60 transition-opacity duration-300" id="footerFilmLink">Film</a>
    <a href="/" class="hover:opacity-60 transition-opacity duration-300" id="footerHomeLink">Home</a>
  </div>
  <div id="footerInstagramFeed" class="footer-instagram-feed"></div>
</footer>
<script src="/assets/footer-settings.js"></script>
</body></html>`;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? "" : html);
      return;
    }

    const journalMatch = pathname.match(/^\/journal\/([^/]+)\/$/);
    if ((req.method === "GET" || req.method === "HEAD") && journalMatch) {
      const slug = journalMatch[1];
      const file = await resolveJournalFileBySlug(slug);
      // Unbekannter Slug -> echter 404 (keine leeren Phantom-Seiten für Googlebot)
      if (!file) {
        sendText(res, 404, "Journal entry not found");
        return;
      }
      const templatePath = path.join(rootDir, "journal", "post", "index.html");
      const templateHtml = await fsp.readFile(templatePath, "utf8");
      const raw = await fsp.readFile(file, "utf8");
      const { frontmatter, body } = splitFrontmatter(raw);
      const data = parseFrontmatterData(frontmatter);
      const pageUrl = `${SITE_ORIGIN}/journal/${slug}/`;
      const html = injectSeoHead(renderJournalEntryHtml(templateHtml, data, body, pageUrl), `/journal/${slug}/`);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(req.method === "HEAD" ? "" : html);
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/contact") {
      const body = JSON.parse(await readBody(req));
      const result = await sendContactInquiry({
        rootDir: dataRoot,
        payload: body,
        meta: {
          ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
          userAgent: req.headers["user-agent"] || ""
        }
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/stripe/create-checkout-session") {
      const body = JSON.parse(await readBody(req));
      const slug = String(body.slug || "");
      const type = String(body.type || "preset");
      const lang = String(body.lang || "de");
      const { session } = await createCheckoutSession({
        rootDir: dataRoot,
        req,
        slug,
        type,
        lang
      });
      sendJson(res, 200, { ok: true, sessionId: session.id, url: session.url });
      return;
    }

    if (req.method === "POST" && pathname === "/api/stripe/webhook") {
      const rawBodyBuffer = await readBodyBuffer(req);
      const signature = String(req.headers["stripe-signature"] || "");
      const result = await handleStripeWebhook({
        rootDir: dataRoot,
        req,
        rawBodyBuffer,
        signature
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/stripe/session-summary") {
      const sessionId = String(parsed.query.session_id || "");
      const result = await fetchCheckoutSessionSummary({ sessionId });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/academy/session-download-link") {
      const sessionId = String(parsed.query.session_id || "");
      const slug = String(parsed.query.entry || "");
      const type = String(parsed.query.type || "");
      const lang = String(parsed.query.lang || "");
      const result = await createSessionDownloadLink({
        rootDir: dataRoot,
        req,
        sessionId,
        slug,
        type,
        lang
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "GET" && pathname === "/api/academy/download") {
      const token = String(parsed.query.token || "");
      if (!token) {
        sendText(res, 400, "Missing token");
        return;
      }
      await streamBundleDownload({
        rootDir: dataRoot,
        res,
        token
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/files") {
      // Oeffentlich (kein Admin): nur Journal-.md, repo-first (Karten der Uebersicht).
      // Admin: vollstaendige Volume-Liste zum Bearbeiten.
      const files = isAdminAuthed(req)
        ? await listEditableFiles()
        : await listJournalRelPaths();
      sendJson(res, 200, { files });
      return;
    }

    if (req.method === "GET" && pathname === "/api/file") {
      const requestedPath = String(parsed.query.path || "");
      const isPublicJournal = /^content\/journal\/[^/]+\.md$/.test(requestedPath);
      if (!isPublicJournal && !requireAdminToken(req, res)) return;
      const safePath = isSafeEditablePath(requestedPath);
      if (!safePath) {
        sendText(res, 400, "Invalid path");
        return;
      }
      // Journal repo-first lesen: der Repo-Stand (git) hat Vorrang vor der
      // geseedeten Volume-Kopie; Fallback auf Volume, falls im Repo nicht vorhanden.
      let readPath = safePath;
      if (isPublicJournal) {
        const repoPath = path.join(rootDir, requestedPath);
        try { await fsp.access(repoPath); readPath = repoPath; } catch { /* Volume-Fallback */ }
      }
      const content = await fsp.readFile(readPath, "utf8");
      sendJson(res, 200, { path: requestedPath, content });
      return;
    }

    if (req.method === "GET" && pathname === "/api/journal-entry") {
      // Öffentlich: liefert nur veröffentlichte Journal-Inhalte (kein Geheimnis),
      // wird vom Browser der Besucher zur Galerie-Hydration aufgerufen.
      const slug = String(parsed.query.slug || "");
      if (!slug) {
        sendText(res, 400, "Missing slug");
        return;
      }
      const file = await resolveJournalFileBySlug(slug);
      if (!file) {
        sendText(res, 404, "Journal entry not found");
        return;
      }
      const relativePath = path.relative(dataRoot, file);
      const content = await fsp.readFile(file, "utf8");
      const { frontmatter, body } = splitFrontmatter(content);
      sendJson(res, 200, { slug, path: relativePath, content, data: parseFrontmatterData(frontmatter), body });
      return;
    }

    if (req.method === "POST" && pathname === "/api/file") {
      if (!requireAdminToken(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const safePath = isSafeEditablePath(String(body.path || ""));
      if (!safePath) {
        sendText(res, 400, "Invalid path");
        return;
      }
      await fsp.mkdir(path.dirname(safePath), { recursive: true });
      await fsp.writeFile(safePath, String(body.content || ""), "utf8");
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/translate") {
      if (!requireAdminToken(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const text = String(body.text || "");
      const sourceLang = String(body.sourceLang || "de");
      const targetLang = String(body.targetLang || "en");
      const translation = await translateText(text, sourceLang, targetLang);
      sendJson(res, 200, { ok: true, translation });
      return;
    }

    if (req.method === "POST" && pathname === "/api/delete-file") {
      if (!requireAdminToken(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const safePath = isSafeEditablePath(String(body.path || ""));
      if (!safePath) {
        sendText(res, 400, "Invalid path");
        return;
      }
      await fsp.unlink(safePath);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/uploads") {
      if (!requireAdminToken(req, res)) return;
      sendJson(res, 200, { files: await listUploadFiles() });
      return;
    }

    if (req.method === "GET" && pathname === "/api/instagram-posts") {
      const username = String(parsed.query.username || "");
      const count = Number(parsed.query.count || 3);
      const posts = await fetchInstagramPosts(username, count);
      sendJson(res, 200, { posts });
      return;
    }

    if (req.method === "GET" && pathname === "/api/instagram-image") {
      const remoteUrl = String(parsed.query.url || "");
      if (!remoteUrl) {
        sendText(res, 400, "Missing url");
        return;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(remoteUrl);
      } catch {
        sendText(res, 400, "Invalid url");
        return;
      }

      if (!/(\.|^)cdninstagram\.com$/i.test(parsedUrl.hostname) && !/(\.|^)fbcdn\.net$/i.test(parsedUrl.hostname)) {
        sendText(res, 400, "Unsupported host");
        return;
      }

      const imageResponse = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.instagram.com/"
        }
      });

      if (!imageResponse.ok) {
        sendText(res, imageResponse.status, "Instagram image request failed");
        return;
      }

      res.writeHead(200, {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=900"
      });
      const arrayBuffer = await imageResponse.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
      return;
    }

    if (req.method === "POST" && pathname === "/api/upload") {
      if (!requireAdminToken(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const filename = path.basename(String(body.filename || ""));
      if (!filename) {
        sendText(res, 400, "Missing filename");
        return;
      }
      // Nur echte Bildformate erlauben (keine ausführbaren/aktiven Typen wie .html/.svg/.js)
      const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
      if (!allowedExt.has(path.extname(filename).toLowerCase())) {
        sendText(res, 400, "Unsupported file type");
        return;
      }
      const buffer = Buffer.from(String(body.contentBase64 || ""), "base64");
      await fsp.mkdir(uploadsDir, { recursive: true });
      await fsp.writeFile(path.join(uploadsDir, filename), buffer);
      sendJson(res, 200, { ok: true, url: `/assets/uploads/${encodeURIComponent(filename)}` });
      return;
    }

    if (req.method === "POST" && pathname === "/api/delete-upload") {
      if (!requireAdminToken(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const filename = path.basename(String(body.filename || ""));
      if (!filename) {
        sendText(res, 400, "Missing filename");
        return;
      }
      await fsp.unlink(path.join(uploadsDir, filename));
      sendJson(res, 200, { ok: true });
      return;
    }

    await serveStatic(req, res, pathname);
  } catch (error) {
    await appendLog(dataRoot, "error", error.message || "Internal Server Error", {
      path: pathname,
      method: req.method
    }).catch(() => {});
    sendText(res, 500, "Internal Server Error");
  }
});

ensurePersistentDataRoot()
  .then(() => {
    server.listen(port, host, () => {
      console.log(`Local CMS server running at http://${host}:${port}`);
      if (dataRoot !== rootDir) {
        console.log(`Persistent data root: ${dataRoot}`);
      }
    });
  })
  .catch((error) => {
    console.error("Failed to prepare persistent data root:", error);
    process.exit(1);
  });
