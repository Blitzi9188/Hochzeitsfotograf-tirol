const fs = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JOURNAL_DIR = path.join(ROOT, "content", "journal");
const POSTS_API = "https://blitzkneisser.com/wp-json/wp/v2/posts?per_page=100&_fields=date,slug,link,title,content,excerpt,yoast_head_json";

const IMPORT_SLUGS = new Set([
  "winter-elopement-in-the-dolomites",
  "a-dream-engagement-in-the-alps-2",
  "the-best-elopement-locations",
  "lago-di-braies-wedding-dream-destination-in-the-dolomites",
  "sunrise-elopement-at-passo-giau",
  "proposal-dolomites-engagement-mountains",
  "winter-wedding-in-the-alps",
  "pizza-elopement-dolomites-mountains",
  "small-wedding-ideas-to-inspire-elopement",
  "adventure-heart-of-the-dolomites"
]);

const decodeHtml = (value = "") =>
  String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripHtml = (html = "") => {
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|blockquote)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ");
  return decodeHtml(text)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const splitParagraphs = (text = "") =>
  String(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((paragraph) => !/^(contact me|kontaktieren sie mich)$/i.test(paragraph));

const extractImages = (html = "") => {
  const seen = new Set();
  const items = [];

  [...String(html).matchAll(/<img[^>]+(?:src|data-lazy-src|data-src)=["']([^"']+)["'][^>]*>/gi)]
    .forEach((match) => {
      const tag = match[0] || "";
      const url = match[1] || "";
      const altMatch = tag.match(/\salt=["']([^"']*)["']/i);
      const alt = decodeHtml((altMatch?.[1] || "").trim());
      items.push({ image: url, alt });
    });

  [...String(html).matchAll(/data-src-full=["']([^"']+)["'][^>]*data-title=["']([^"']*)["']/gi)]
    .forEach((match) => {
      items.push({
        image: match[1] || "",
        alt: decodeHtml((match[2] || "").trim())
      });
    });

  [...String(html).matchAll(/data-src=["']([^"']+)["'][^>]*data-title=["']([^"']*)["']/gi)]
    .forEach((match) => {
      items.push({
        image: match[1] || "",
        alt: decodeHtml((match[2] || "").trim())
      });
    });

  return items
    .filter((item) => item.image && item.image.startsWith("http"))
    .filter((item) => {
      if (seen.has(item.image)) return false;
      seen.add(item.image);
      return true;
    });
};

const translateText = async (text, sourceLang = "en", targetLang = "de") => {
  const query = String(text || "").trim();
  if (!query) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }
  const payload = await response.json();
  return (payload?.[0] || [])
    .map((part) => Array.isArray(part) ? part[0] : "")
    .join("")
    .trim();
};

const translateParagraphs = async (paragraphs, sourceLang = "en", targetLang = "de") => {
  const result = [];
  for (const paragraph of paragraphs) {
    result.push(await translateText(paragraph, sourceLang, targetLang));
  }
  return result;
};

const yamlScalar = (value = "") => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;

const sanitizeFilenameSlug = (slug = "") => slug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();

const buildMarkdown = (post) => {
  const datePrefix = String(post.date || "").slice(0, 10) || "2026-01-01";
  const lines = [
    "---",
    "lang: de",
    `title: ${yamlScalar(post.titleDe)}`,
    `titleEn: ${yamlScalar(post.titleEn)}`,
    'author: "Blitzkneisser"',
    `date: ${yamlScalar(post.date)}`,
    'readingTime: ""',
    `seoTitle: ${yamlScalar(post.seoTitleDe)}`,
    `seoTitleEn: ${yamlScalar(post.seoTitleEn)}`,
    `seoDescription: ${yamlScalar(post.seoDescriptionDe)}`,
    `seoDescriptionEn: ${yamlScalar(post.seoDescriptionEn)}`,
    `featuredImage: ${post.featuredImage}`,
    `featuredImageAlt: ${yamlScalar(post.featuredImageAltDe)}`,
    `featuredImageAltEn: ${yamlScalar(post.featuredImageAltEn)}`,
    'galleryIntroHeading: ""',
    'galleryIntroHeadingEn: ""',
    `galleryIntroText: ${yamlScalar(post.middleTextDe)}`,
    `galleryIntroTextEn: ${yamlScalar(post.middleTextEn)}`,
    'galleryOutroHeading: ""',
    'galleryOutroHeadingEn: ""',
    'galleryOutroText: ""',
    'galleryOutroTextEn: ""',
    `bodyEn: ${yamlScalar(post.bodyEn)}`,
    "showToc: false",
    "gallery:"
  ];

  post.gallery.forEach((item) => {
    lines.push(`  - image: ${item.image}`);
    lines.push(`    alt: ${yamlScalar(item.altDe)}`);
    lines.push(`    altEn: ${yamlScalar(item.altEn)}`);
    lines.push('    link: ""');
  });

  lines.push("---", "", post.bodyDe, "");

  return {
    filename: `${datePrefix}-${sanitizeFilenameSlug(post.slug)}.md`,
    content: lines.join("\n")
  };
};

const main = async () => {
  const response = await fetch(POSTS_API, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!response.ok) {
    throw new Error(`Posts API failed: ${response.status}`);
  }

  const posts = await response.json();
  const selectedPosts = posts.filter((post) => IMPORT_SLUGS.has(post.slug));

  for (const post of selectedPosts) {
    const titleEn = decodeHtml(post?.title?.rendered || "").trim();
    const seoTitleEn = decodeHtml(post?.yoast_head_json?.title || titleEn).trim();
    const seoDescriptionEn = decodeHtml(post?.yoast_head_json?.description || stripHtml(post?.excerpt?.rendered || "")).trim();
    const featuredImage = post?.yoast_head_json?.og_image?.[0]?.url || "";
    const featuredImageAltEn = decodeHtml(
      post?.yoast_head_json?.schema?.["@graph"]?.find?.((item) => item?.["@type"] === "ImageObject")?.caption ||
      titleEn
    ).trim() || titleEn;

    const contentHtml = post?.content?.rendered || "";
    const paragraphsEn = splitParagraphs(stripHtml(contentHtml));
    const introParagraphsEn = paragraphsEn.slice(0, 2);
    const middleParagraphsEn = paragraphsEn.slice(2);
    const images = extractImages(contentHtml);

    const [titleDe, seoTitleDe, seoDescriptionDe] = await Promise.all([
      translateText(titleEn, "en", "de"),
      translateText(seoTitleEn, "en", "de"),
      translateText(seoDescriptionEn, "en", "de")
    ]);

    const [introParagraphsDe, middleParagraphsDe] = await Promise.all([
      translateParagraphs(introParagraphsEn, "en", "de"),
      translateParagraphs(middleParagraphsEn, "en", "de")
    ]);

    const featuredImageAltDe = await translateText(featuredImageAltEn, "en", "de");

    const gallery = [];
    for (const image of images) {
      const altEn = image.alt || titleEn;
      gallery.push({
        image: image.image,
        altEn,
        altDe: titleDe
      });
    }

    if (!gallery.length && featuredImage) {
      gallery.push({
        image: featuredImage,
        altEn: featuredImageAltEn,
        altDe: featuredImageAltDe
      });
    }

    const markdown = buildMarkdown({
      slug: post.slug,
      date: new Date(post.date).toISOString(),
      titleDe,
      titleEn,
      seoTitleDe,
      seoTitleEn,
      seoDescriptionDe,
      seoDescriptionEn,
      featuredImage,
      featuredImageAltDe,
      featuredImageAltEn,
      bodyDe: introParagraphsDe.join("\n\n"),
      bodyEn: introParagraphsEn.join("\n\n"),
      middleTextDe: middleParagraphsDe.join("\n\n"),
      middleTextEn: middleParagraphsEn.join("\n\n"),
      gallery
    });

    await fs.writeFile(path.join(JOURNAL_DIR, markdown.filename), markdown.content, "utf8");
    console.log(`Imported: ${markdown.filename}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
