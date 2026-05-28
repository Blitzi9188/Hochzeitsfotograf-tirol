const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const previewDir = path.join(rootDir, "github-preview");
const journalSourceDir = path.join(rootDir, "content", "journal");

const copyTargets = [
  "assets",
  "BILDER",
  "about",
  "contact",
  "film",
  "impressum",
  "agb",
  "journal",
  "content",
  "index.html",
  "Logo-Blitzkneisser-BERG.png",
  "Logo-Blitzkneisser-2024.png",
  "Logo-Blitzkneisser-2017-HG-hell.png"
];

const ensureDir = async (dir) => {
  await fsp.mkdir(dir, { recursive: true });
};

const copyTarget = async (target) => {
  const source = path.join(rootDir, target);
  const destination = path.join(previewDir, target);
  await ensureDir(path.dirname(destination));
  await fsp.cp(source, destination, { recursive: true, force: true });
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
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
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

const slugFromFile = (file) => path.basename(file, path.extname(file)).replace(/^\d{4}-\d{2}-\d{2}-/, "");

const buildJournalIndex = async () => {
  const files = (await fsp.readdir(journalSourceDir))
    .filter((file) => file.endsWith(".md"))
    .sort();

  const entries = [];
  for (const file of files) {
    const absolutePath = path.join(journalSourceDir, file);
    const content = await fsp.readFile(absolutePath, "utf8");
    const { frontmatter, body } = splitFrontmatter(content);
    const data = parseFrontmatterData(frontmatter);
    entries.push({
      slug: slugFromFile(file),
      path: `content/journal/${file}`,
      ...data,
      body
    });
  }

  const outputPath = path.join(previewDir, "content", "journal", "index.json");
  await ensureDir(path.dirname(outputPath));
  await fsp.writeFile(outputPath, JSON.stringify({ entries }, null, 2), "utf8");
  return entries;
};

const replaceOrThrow = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Preview patch failed: ${label}`);
  }
  return next;
};

const patchHomepage = async () => {
  const filePath = path.join(previewDir, "index.html");
  let source = await fsp.readFile(filePath, "utf8");
  source = replaceOrThrow(
    source,
    /const loadLatestJournalEntries = async \(lang\) => \{[\s\S]*?return entries[\s\S]*?\.slice\(0, 3\);\n    \};/,
    `const loadLatestJournalEntries = async (lang) => {
      const response = await fetch(\`/content/journal/index.json?ts=\${Date.now()}\`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Journal-Dateiliste konnte nicht geladen werden.");
      }

      const payload = await response.json();
      const entries = Array.isArray(payload.entries) ? payload.entries : [];

      return entries
        .map((entry) => {
          const slug = entry.slug || getJournalSlugFromPath(entry.path || "");
          const title = (lang === "en" ? (entry.titleEn || entry.title) : entry.title) || (lang === "en" ? "Journal Story" : "Journal-Beitrag");
          const image = entry.featuredImage || "/assets/uploads/Blitzkneisser-Mountain-Elopement-Dolomites-8.jpg";
          const alt = (lang === "en" ? (entry.featuredImageAltEn || entry.featuredImageAlt || title) : (entry.featuredImageAlt || entry.title || title)) || title;
          const excerpt = (lang === "en" ? (entry.seoDescriptionEn || entry.seoDescription) : entry.seoDescription) || excerptFromMarkdownBody(entry.body || "") || (lang === "en"
            ? "A recent story from the journal."
            : "Ein aktueller Einblick aus dem Journal.");
          const readingTime = entry.readingTime
            ? \`\${entry.readingTime} Min\`
            : "Journal";
          const metaLabel = formatJournalMetaDate(entry.date, lang);
          const url = lang === "en" ? \`/journal/\${slug}/?lang=en\` : \`/journal/\${slug}/\`;

          return {
            title,
            image,
            alt,
            excerpt,
            readingTime,
            metaLabel,
            url,
            date: entry.date || ""
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    };`,
    "homepage journal loader"
  );
  await fsp.writeFile(filePath, source, "utf8");
};

const patchJournalIndex = async () => {
  const filePath = path.join(previewDir, "journal", "index.html");
  let source = await fsp.readFile(filePath, "utf8");
  source = replaceOrThrow(
    source,
    /const loadJournalEntries = async \(\) => \{[\s\S]*?\n    \};/,
    `const loadJournalEntries = async () => {
      const response = await fetch(\`/content/journal/index.json?ts=\${Date.now()}\`, { cache: "no-store" });
      if (!response.ok) throw new Error("Journal could not be loaded.");
      const payload = await response.json();
      journalEntries = (Array.isArray(payload.entries) ? payload.entries : [])
        .map((entry) => ({
          slug: entry.slug || "",
          title: entry.title || "",
          titleEn: entry.titleEn || "",
          date: entry.date || "",
          seoDescription: entry.seoDescription || "",
          seoDescriptionEn: entry.seoDescriptionEn || "",
          featuredImage: entry.featuredImage || "",
          featuredImageAlt: entry.featuredImageAlt || "",
          featuredImageAltEn: entry.featuredImageAltEn || ""
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    };`,
    "journal index loader"
  );
  await fsp.writeFile(filePath, source, "utf8");
};

const patchJournalPostTemplate = async () => {
  const filePath = path.join(previewDir, "journal", "post", "index.html");
  let source = await fsp.readFile(filePath, "utf8");
  source = replaceOrThrow(
    source,
    /const response = await fetch\(`\/api\/journal-entry\?slug=\$\{encodeURIComponent\(slug\)\}&ts=\$\{Date\.now\(\)\}`,[\s\S]*?await applyAdjacentFinalImage\(\);/,
    `const response = await fetch(\`/content/journal/index.json?ts=\${Date.now()}\`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Journal entry not found");
        }
        const payload = await response.json();
        const entries = Array.isArray(payload.entries) ? payload.entries : [];
        const entry = entries.find((item) => item.slug === slug);
        if (!entry) {
          throw new Error("Journal entry not found");
        }
        currentEntryPath = entry.path || "";
        currentEntryData = entry;
        renderEntry(entry);
        await applyAdjacentFinalImage();`,
    "journal post loader"
  );
  await fsp.writeFile(filePath, source, "utf8");
  return source;
};

const createJournalSlugPages = async (entries) => {
  const template = await fsp.readFile(path.join(previewDir, "journal", "post", "index.html"), "utf8");
  for (const entry of entries) {
    const slugDir = path.join(previewDir, "journal", entry.slug);
    await ensureDir(slugDir);
    await fsp.writeFile(path.join(slugDir, "index.html"), template, "utf8");
  }
};

const createNoJekyll = async () => {
  await fsp.writeFile(path.join(previewDir, ".nojekyll"), "", "utf8");
};

const createReadme = async () => {
  const content = `# GitHub Preview

Dieser Ordner ist eine statische Vorschau der Website für GitHub Pages.

## Geeignet für
- visuelle Vorschau
- Teilen per GitHub Pages
- statische Unterseiten inklusive Journal

## Nicht enthalten
- lokales CMS
- Upload-Funktionen
- Server-API aus \`server.js\`

## Upload
1. Den kompletten Inhalt dieses Ordners in ein GitHub-Repository hochladen.
2. GitHub Pages auf den Branch/Ordner dieser Dateien zeigen lassen.

Hinweis:
Die Vorschau ist für ein Root-Deployment gedacht, also z. B. über eine eigene Domain oder ein Pages-Setup ohne zusätzlichen Unterordner.
`;
  await fsp.writeFile(path.join(previewDir, "README-GITHUB-PREVIEW.md"), content, "utf8");
};

const build = async () => {
  await fsp.rm(previewDir, { recursive: true, force: true });
  await ensureDir(previewDir);

  for (const target of copyTargets) {
    await copyTarget(target);
  }

  const entries = await buildJournalIndex();
  await patchHomepage();
  await patchJournalIndex();
  await patchJournalPostTemplate();
  await createJournalSlugPages(entries);
  await createNoJekyll();
  await createReadme();

  console.log(`GitHub preview created at ${previewDir}`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
