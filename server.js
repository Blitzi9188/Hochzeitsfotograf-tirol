const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const url = require("url");

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
  if ([".css", ".js", ".json", ".xml", ".txt", ".md", ".yml", ".yaml"].includes(lowerExt)) {
    return "public, max-age=3600";
  }
  return "public, max-age=900";
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data));
};

const sendText = (res, statusCode, message) => {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(message);
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

  try {
    const targetStat = await fsp.stat(targetPath);
    if (targetStat.isFile() && targetStat.mtimeMs >= sourceStat.mtimeMs) {
      return;
    }
  } catch {
    // Target does not exist yet, so we copy it below.
  }

  await fsp.copyFile(sourcePath, targetPath);
  await fsp.utimes(targetPath, sourceStat.atime, sourceStat.mtime);
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

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
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

const getStaticCandidates = (pathname) => {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const candidates = [dataRoot, rootDir].map((baseDir) => ({ baseDir, absolutePath: path.resolve(baseDir, `.${cleanPath}`) }));

  return candidates
    .filter(({ baseDir, absolutePath }) => absolutePath.startsWith(baseDir))
    .map(({ absolutePath }) => absolutePath)
    .filter((absolutePath) => !isBlockedStaticPath(absolutePath));
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

const resolveJournalFileBySlug = async (slug) => {
  const files = await listFilesRecursive(journalDir);
  return files.find((file) => journalSlugFromFile(file) === slug) || null;
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
      const content = await fsp.readFile(targetFile);
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": buildCacheControl(ext)
      });
      res.end(content);
      return;
    } catch {
      continue;
    }
  }

  sendText(res, 404, "Not Found");
};

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";

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
    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/index.html") {
      const query = parsed.search || "";
      res.writeHead(308, { Location: query ? `/${query}` : "/" });
      res.end();
      return;
    }

    const journalMatch = pathname.match(/^\/journal\/([^/]+)\/$/);
    if ((req.method === "GET" || req.method === "HEAD") && journalMatch) {
      const templatePath = path.join(rootDir, "journal", "post", "index.html");
      const content = await fsp.readFile(templatePath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(req.method === "HEAD" ? "" : content);
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
      sendJson(res, 200, { files: await listEditableFiles() });
      return;
    }

    if (req.method === "GET" && pathname === "/api/file") {
      const requestedPath = String(parsed.query.path || "");
      const safePath = isSafeEditablePath(requestedPath);
      if (!safePath) {
        sendText(res, 400, "Invalid path");
        return;
      }
      const content = await fsp.readFile(safePath, "utf8");
      sendJson(res, 200, { path: requestedPath, content });
      return;
    }

    if (req.method === "GET" && pathname === "/api/journal-entry") {
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
      const body = JSON.parse(await readBody(req));
      const text = String(body.text || "");
      const sourceLang = String(body.sourceLang || "de");
      const targetLang = String(body.targetLang || "en");
      const translation = await translateText(text, sourceLang, targetLang);
      sendJson(res, 200, { ok: true, translation });
      return;
    }

    if (req.method === "POST" && pathname === "/api/delete-file") {
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
      const body = JSON.parse(await readBody(req));
      const filename = path.basename(String(body.filename || ""));
      if (!filename) {
        sendText(res, 400, "Missing filename");
        return;
      }
      const buffer = Buffer.from(String(body.contentBase64 || ""), "base64");
      await fsp.mkdir(uploadsDir, { recursive: true });
      await fsp.writeFile(path.join(uploadsDir, filename), buffer);
      sendJson(res, 200, { ok: true, url: `/assets/uploads/${encodeURIComponent(filename)}` });
      return;
    }

    if (req.method === "POST" && pathname === "/api/delete-upload") {
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
    sendText(res, 500, error.message || "Internal Server Error");
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
