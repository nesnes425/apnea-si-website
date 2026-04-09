/**
 * Blog migration script: WordPress → Sanity (v2 — improved conversion)
 *
 * Usage:
 *   node scripts/migrate-blog.mjs --slugs slug1,slug2,slug3
 *   node scripts/migrate-blog.mjs --slugs slug1 --dry-run
 *   node scripts/migrate-blog.mjs --delete-all   (removes all blogPost documents)
 */

import { createClient } from "@sanity/client";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config ---

const WP_API_BASE = "https://www.apnea.si/wp-json/wp/v2";

// Load env
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [key, ...rest] = l.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const sanity = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-04-08",
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

// WordPress category ID → Sanity category value
const CATEGORY_MAP = {
  51: "nasveti",
  12: "reportaze",
  61: "reportaze",
  13: "tecaji",
  11: "tekmovanja",
  14: "treningi",
};

// --- HTML entity decoding ---

function decodeEntities(str) {
  return str
    // Named entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&bdquo;/g, "\u201E")
    .replace(/&scaron;/g, "š")
    .replace(/&Scaron;/g, "Š")
    .replace(/&ccaron;/g, "č")
    .replace(/&Ccaron;/g, "Č")
    .replace(/&zcaron;/g, "ž")
    .replace(/&Zcaron;/g, "Ž")
    // Numeric entities
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

// --- HTML cleanup ---

function cleanHtml(html) {
  return (
    html
      // Remove page builder wrappers (Cornerstone x-section/x-row/x-col and all x-* tags)
      .replace(/<\/?x-[^>]*>/g, "")
      .replace(/<div[^>]*class="[^"]*cs-content[^"]*"[^>]*>/g, "")
      // Remove CF7 / WPForms forms entirely
      .replace(/<form[\s\S]*?<\/form>/gi, "")
      .replace(/<div[^>]*class="[^"]*wpcf7[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*class="[^"]*wpforms[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
      // Remove input/select/textarea/label elements (form remnants)
      .replace(/<(?:input|select|textarea|label|button)[^>]*>(?:[\s\S]*?<\/(?:select|textarea|label|button)>)?/gi, "")
      // Remove script/style tags
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      // Remove WP block comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove empty divs
      .replace(/<div[^>]*>\s*<\/div>/g, "")
      // Close remaining open divs
      .replace(/<\/?div[^>]*>/g, "")
      // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<p>\s*&nbsp;\s*<\/p>/g, "")
      // Remove span wrappers (keep content) — page builder often wraps text in spans
      .replace(/<\/?span[^>]*>/g, "")
      .trim()
  );
}

// --- HTML → Portable Text conversion ---

function htmlToPortableText(html, imageAssetMap) {
  const blocks = [];
  const cleaned = cleanHtml(html);
  const chunks = splitIntoChunks(cleaned);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // Skip form-related text (common CF7 labels)
    if (isFormRemnant(trimmed)) continue;

    // Check if this chunk is primarily an image
    if (isImageBlock(trimmed)) {
      const imgUrl = extractImageUrl(trimmed);
      const altMatch = trimmed.match(/alt="([^"]*)"/);
      if (imgUrl && imageAssetMap.has(imgUrl)) {
        blocks.push({
          _type: "image",
          _key: randomKey(),
          asset: { _type: "reference", _ref: imageAssetMap.get(imgUrl) },
          alt: decodeEntities(altMatch?.[1] || ""),
        });
      }
      continue;
    }

    // Detect HTML heading tags
    const headingMatch = trimmed.match(
      /^<(h[1-6])(?:\s[^>]*)?>([\s\S]*)<\/\1>/i
    );
    if (headingMatch) {
      const level = headingMatch[1].toLowerCase();
      const text = decodeEntities(stripTags(headingMatch[2])).trim();
      if (text) blocks.push(makeTextBlock(text, level));
      continue;
    }

    // Detect YouTube iframe
    const youtubeMatch = trimmed.match(
      /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      blocks.push({
        _type: "youtube",
        _key: randomKey(),
        videoId: youtubeMatch[1],
      });
      continue;
    }

    // Extract paragraph content
    const pMatch = trimmed.match(/^<p(?:\s[^>]*)?>([\s\S]*)<\/p>/i);
    const content = pMatch ? pMatch[1] : trimmed;

    // Check if this is a bold-only paragraph → convert to heading
    if (isBoldHeading(content)) {
      const headingText = decodeEntities(
        stripTags(content.replace(/<\/?strong>/gi, ""))
      ).trim();
      if (headingText) {
        blocks.push(makeTextBlock(headingText, "h3"));
        continue;
      }
    }

    // Check if paragraph starts with bold text followed by <br> → split into heading + paragraph
    const boldLeadMatch = content.match(
      /^<strong>([\s\S]*?)<\/strong>\s*<br\s*\/?>\s*([\s\S]+)/i
    );
    if (boldLeadMatch) {
      const headingText = decodeEntities(stripTags(boldLeadMatch[1])).trim();
      const bodyContent = boldLeadMatch[2];
      if (headingText) {
        blocks.push(makeTextBlock(headingText, "h3"));
      }
      const bodyBlock = parseContentToBlock(bodyContent, imageAssetMap);
      if (bodyBlock) blocks.push(bodyBlock);
      continue;
    }

    // Regular paragraph with inline markup
    const block = parseContentToBlock(content, imageAssetMap);
    if (block) blocks.push(block);
  }

  return blocks;
}

function isFormRemnant(html) {
  const text = stripTags(html).trim().toLowerCase();
  const formLabels = [
    "prijava",
    "ime in priimek",
    "ime in priimek spremljevalca",
    "disciplina in najava",
    "komentar",
    "klub",
    "emšo",
    "prijave so zaključene",
    "vaša prijava bo dodana",
    "prijavite se na trening",
    "soglašam s pogoji",
    "pošlji",
    "submit",
  ];
  // Short text that matches a form label
  if (text.length < 80 && formLabels.some((l) => text.includes(l))) return true;
  // Single word that looks like a form element
  if (text.length < 20 && /^(email|e-mail|telefon|tel)$/i.test(text))
    return true;
  return false;
}

function isBoldHeading(content) {
  // Check if the entire paragraph content is wrapped in <strong>
  const stripped = content.trim();
  // Pattern: <strong>text</strong> with nothing else (maybe whitespace)
  const match = stripped.match(
    /^\s*<strong>([\s\S]*?)<\/strong>\s*$/i
  );
  if (!match) return false;
  // The text inside should be short (heading-length, not a full paragraph)
  const innerText = stripTags(match[1]).trim();
  return innerText.length > 0 && innerText.length < 120;
}

function isImageBlock(html) {
  const hasImg = /<img[^>]*>/i.test(html);
  if (!hasImg) return false;
  // Text content besides the image should be minimal
  const textOnly = stripTags(html).trim();
  return textOnly.length < 10;
}

// --- Inline markup parsing (bold, italic, links) ---

function parseContentToBlock(content, imageAssetMap) {
  // Split on <br> for line handling
  const lines = content.split(/<br\s*\/?>/gi);
  const allText = lines.map((l) => decodeEntities(stripTags(l)).trim()).join("\n").trim();
  if (!allText) return null;

  // Parse inline elements properly
  const { children, markDefs } = parseInline(content);
  if (children.length === 0) return null;

  return {
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs,
    children,
  };
}

function parseInline(html) {
  const children = [];
  const markDefs = [];

  // Normalize: replace <br> with newline markers
  let normalized = html.replace(/<br\s*\/?>/gi, "\n");

  // Process segments between tags
  let pos = 0;
  const tagRegex =
    /<(strong|b|em|i|a)(\s[^>]*)?>|<\/(strong|b|em|i|a)>/gi;
  const activeMarks = [];
  let match;

  while ((match = tagRegex.exec(normalized)) !== null) {
    // Text before this tag
    const textBefore = normalized.slice(pos, match.index);
    if (textBefore) {
      const decoded = decodeEntities(stripTags(textBefore));
      if (decoded) {
        children.push({
          _type: "span",
          _key: randomKey(),
          text: decoded,
          marks: [...activeMarks],
        });
      }
    }
    pos = match.index + match[0].length;

    if (match[3]) {
      // Closing tag
      const tagName = match[3].toLowerCase();
      if (tagName === "strong" || tagName === "b") {
        const idx = activeMarks.lastIndexOf("strong");
        if (idx >= 0) activeMarks.splice(idx, 1);
      } else if (tagName === "em" || tagName === "i") {
        const idx = activeMarks.lastIndexOf("em");
        if (idx >= 0) activeMarks.splice(idx, 1);
      } else if (tagName === "a") {
        // Remove the link key from active marks
        const idx = activeMarks.findIndex(
          (m) => m !== "strong" && m !== "em"
        );
        if (idx >= 0) activeMarks.splice(idx, 1);
      }
    } else {
      // Opening tag
      const tagName = match[1].toLowerCase();
      if (tagName === "strong" || tagName === "b") {
        activeMarks.push("strong");
      } else if (tagName === "em" || tagName === "i") {
        activeMarks.push("em");
      } else if (tagName === "a") {
        const hrefMatch = match[2]?.match(/href="([^"]*)"/);
        if (hrefMatch) {
          const key = randomKey();
          markDefs.push({
            _type: "link",
            _key: key,
            href: decodeEntities(hrefMatch[1]),
          });
          activeMarks.push(key);
        }
      }
    }
  }

  // Remaining text after last tag
  const remaining = normalized.slice(pos);
  if (remaining) {
    const decoded = decodeEntities(stripTags(remaining));
    if (decoded) {
      children.push({
        _type: "span",
        _key: randomKey(),
        text: decoded,
        marks: [...activeMarks],
      });
    }
  }

  // If no tags were found, just return plain text
  if (children.length === 0) {
    const plainText = decodeEntities(stripTags(normalized)).trim();
    if (plainText) {
      children.push({
        _type: "span",
        _key: randomKey(),
        text: plainText,
        marks: [],
      });
    }
  }

  return { children, markDefs };
}

function splitIntoChunks(html) {
  // First, ensure standalone images (not inside <p>) are wrapped so they become their own chunks
  // Insert a split marker before and after bare <img> tags that sit between block elements
  let prepared = html.replace(
    /(<\/(?:p|h[1-6]|blockquote|div|figure)>)\s*(<img[^>]*>)/gi,
    "$1<!--SPLIT-->$2<!--SPLIT-->"
  );
  // Also handle images at the start or between non-block content
  prepared = prepared.replace(
    /(<img[^>]*>)\s*(<(?:p|h[1-6]|blockquote|div|figure)[\s>])/gi,
    "<!--SPLIT-->$1<!--SPLIT-->$2"
  );

  // Split on block-level closing tags AND our markers
  const parts = prepared.split(
    /(?<=<\/(?:p|h[1-6]|blockquote|figure)>)|<!--SPLIT-->/i
  );
  return parts.map((p) => p.trim()).filter(Boolean);
}

function extractImageUrl(html) {
  const dataSrc = html.match(/data-src="([^"]+)"/);
  if (dataSrc) return dataSrc[1];
  const src = html.match(/src="([^"]+)"/);
  if (src && !src[1].startsWith("data:")) return src[1];
  return null;
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

function makeTextBlock(text, style = "normal") {
  return {
    _type: "block",
    _key: randomKey(),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: randomKey(), text, marks: [] }],
  };
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10);
}

// --- Image handling ---

async function downloadAndUploadImage(url) {
  try {
    const fullUrl = url.replace(/-\d+x\d+(\.\w+)$/, "$1");
    console.log(`  Downloading: ${fullUrl}`);
    const response = await fetch(fullUrl);
    if (!response.ok) {
      console.log(`  Full-size failed, trying original: ${url}`);
      const response2 = await fetch(url);
      if (!response2.ok) throw new Error(`HTTP ${response2.status}`);
      const buffer = Buffer.from(await response2.arrayBuffer());
      const asset = await sanity.assets.upload("image", buffer, {
        filename: url.split("/").pop(),
      });
      return asset._id;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = await sanity.assets.upload("image", buffer, {
      filename: fullUrl.split("/").pop(),
    });
    return asset._id;
  } catch (err) {
    console.error(`  Failed to upload image ${url}: ${err.message}`);
    return null;
  }
}

// --- WordPress API ---

async function fetchPost(slug) {
  const url = `${WP_API_BASE}/posts?slug=${slug}&_embed`;
  const response = await fetch(url);
  const posts = await response.json();
  if (!posts.length) throw new Error(`Post not found: ${slug}`);
  return posts[0];
}

// --- Main migration ---

async function migratePost(slug, dryRun = false) {
  console.log(`\n--- Migrating: ${slug} ---`);

  const wp = await fetchPost(slug);
  const title = decodeEntities(stripTags(wp.title.rendered));
  console.log(`  Title: ${title}`);
  console.log(`  Date: ${wp.date}`);
  console.log(`  Categories: ${wp.categories}`);

  const html = wp.content.rendered;

  if (stripTags(html).trim().length < 50) {
    console.error(
      `  EMPTY CONTENT — Cornerstone page builder post. Skipping.`
    );
    return { slug, status: "empty", title };
  }

  // Extract image URLs
  const imageUrls = new Set();
  const imgRegex =
    /(?:data-src|src)="(https:\/\/www\.apnea\.si\/wp-content\/uploads\/[^"]+)"/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html))) {
    if (!imgMatch[1].startsWith("data:")) imageUrls.add(imgMatch[1]);
  }

  let featuredImageUrl = null;
  if (wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
    featuredImageUrl = wp._embedded["wp:featuredmedia"][0].source_url;
  }

  console.log(`  Inline images: ${imageUrls.size}`);
  console.log(`  Featured image: ${featuredImageUrl ? "yes" : "no"}`);

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would upload ${imageUrls.size + (featuredImageUrl ? 1 : 0)} images`
    );
    return { slug, status: "dry-run", title };
  }

  // Upload images
  const imageAssetMap = new Map();
  for (const url of imageUrls) {
    const assetId = await downloadAndUploadImage(url);
    if (assetId) imageAssetMap.set(url, assetId);
  }

  let featuredImageAssetId = null;
  if (featuredImageUrl) {
    featuredImageAssetId = await downloadAndUploadImage(featuredImageUrl);
  }

  // Convert HTML → Portable Text
  const body = htmlToPortableText(html, imageAssetMap);
  console.log(`  Portable Text blocks: ${body.length}`);

  // Map categories
  const categories = wp.categories
    .map((id) => CATEGORY_MAP[id])
    .filter(Boolean);

  // Build document
  const doc = {
    _type: "blogPost",
    title,
    slug: { _type: "slug", current: wp.slug },
    publishedAt: wp.date,
    body,
    ...(categories.length > 0 ? { categories } : {}),
    ...(featuredImageAssetId
      ? {
          featuredImage: {
            _type: "image",
            asset: { _type: "reference", _ref: featuredImageAssetId },
          },
        }
      : {}),
  };

  const yoastDesc =
    wp.yoast_head_json?.description || wp.meta?.yoast_wpseo_metadesc;
  if (yoastDesc) doc.metaDescription = decodeEntities(yoastDesc).slice(0, 160);

  const result = await sanity.create(doc);
  console.log(`  Created Sanity document: ${result._id}`);

  const oldUrl = `/${wp.date.slice(0, 4)}/${wp.date.slice(5, 7)}/${wp.date.slice(8, 10)}/${wp.slug}/`;
  const newUrl = `/novice/${wp.slug}/`;

  return {
    slug,
    status: "success",
    title: doc.title,
    sanityId: result._id,
    redirect: { source: oldUrl, destination: newUrl },
  };
}

// --- Delete all blog posts ---

async function deleteAllBlogPosts() {
  const posts = await sanity.fetch(
    `*[_type == "blogPost"]{ _id, title }`
  );
  if (posts.length === 0) {
    console.log("No blog posts to delete.");
    return;
  }
  console.log(`Deleting ${posts.length} blog posts...`);
  for (const post of posts) {
    await sanity.delete(post._id);
    console.log(`  Deleted: ${post.title}`);
  }
  console.log("Done.");
}

// --- CLI ---

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

if (args.includes("--delete-all")) {
  await deleteAllBlogPosts();
  process.exit(0);
}

let slugs = [];
if (args.includes("--slugs")) {
  const idx = args.indexOf("--slugs");
  slugs = args[idx + 1]?.split(",") || [];
} else {
  const match = args.find((a) => a.startsWith("--slugs="));
  if (match) slugs = match.split("=")[1].split(",");
}

if (!slugs.length) {
  console.log(
    "Usage:\n  node scripts/migrate-blog.mjs --slugs slug1,slug2 [--dry-run]\n  node scripts/migrate-blog.mjs --delete-all"
  );
  process.exit(1);
}

console.log(
  `Migrating ${slugs.length} post(s)${dryRun ? " (DRY RUN)" : ""}...`
);

const results = [];
for (const slug of slugs) {
  try {
    const result = await migratePost(slug.trim(), dryRun);
    results.push(result);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    results.push({ slug, status: "error", error: err.message });
  }
}

console.log("\n=== Migration Summary ===");
for (const r of results) {
  console.log(
    `  ${r.status.toUpperCase()}: ${r.slug} — ${r.title || r.error}`
  );
  if (r.redirect)
    console.log(
      `    Redirect: ${r.redirect.source} → ${r.redirect.destination}`
    );
}

// Save redirects
const redirects = results.filter((r) => r.redirect).map((r) => r.redirect);
if (redirects.length > 0) {
  const outPath = resolve(__dirname, "redirects.json");
  writeFileSync(outPath, JSON.stringify(redirects, null, 2));
  console.log(`\nRedirects saved to scripts/redirects.json`);
}
