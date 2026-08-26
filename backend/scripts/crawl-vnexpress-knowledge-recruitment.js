/**
 * Crawl bài viết tuyển dụng từ VnExpress và seed vào Knowledge Hub (category tuyen-dung).
 *
 * Usage:
 *   node scripts/crawl-vnexpress-knowledge-recruitment.js
 *   node scripts/crawl-vnexpress-knowledge-recruitment.js --dry-run
 *   node scripts/crawl-vnexpress-knowledge-recruitment.js --limit=5
 *
 * Chạy seed category trước nếu chưa có:
 *   node scripts/seed-business-knowledge-categories.js
 */
import { loadBackendEnv } from './loadBackendEnv.js';
import { POST_VISIBILITY_BUSINESS_KNOWLEDGE } from '../src/constants/postVisibility.js';

const loadedFrom = loadBackendEnv();
if (loadedFrom) {
  console.log(`[crawl] .env loaded from: ${loadedFrom}`);
} else {
  console.warn('[crawl] .env not found; using process environment / defaults');
}

const { Category, Post } = await import('../src/models/index.js');
const { default: sequelize } = await import('../src/config/database.js');

const TOPIC_URL = 'https://vnexpress.net/chu-de/tuyen-dung-8476';
const CATEGORY_SLUG = 'tuyen-dung';
const DEFAULT_LIMIT = 10;
const USER_AGENT = 'Mozilla/5.0 (compatible; JobShareKnowledgeBot/1.0; +https://jobshare.vn)';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const articleLimit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1], 10) || DEFAULT_LIMIT) : DEFAULT_LIMIT;

function decodeHtml(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' '));
}

function truncate(str, max) {
  const s = String(str || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function metaContent(html, property) {
  const forward = html.match(new RegExp(`property="${property}"[^>]*content="([^"]+)"`, 'i'));
  if (forward?.[1]) return forward[1].trim();
  const backward = html.match(new RegExp(`content="([^"]+)"[^>]*property="${property}"`, 'i'));
  return backward?.[1]?.trim() || null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function extractArticleLinks(html, limit) {
  const pattern = /https:\/\/vnexpress\.net\/[a-z0-9-]+-\d+\.html/gi;
  const seen = new Set();
  const links = [];
  for (const match of html.matchAll(pattern)) {
    const url = match[0].split('#')[0];
    if (seen.has(url)) continue;
    seen.add(url);
    links.push(url);
    if (links.length >= limit) break;
  }
  return links;
}

function slugFromArticleUrl(url) {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
  const base = pathname.replace(/\.html$/i, '');
  return truncate(`vne-${base}`, 255);
}

function parsePublishedAt(html) {
  const iso = metaContent(html, 'article:published_time');
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const dateText = html.match(/class="date"[^>]*>([^<]+)</i)?.[1];
  if (dateText) {
    const m = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})/);
    if (m) {
      const [, day, month, year, hour, minute] = m.map(Number);
      const d = new Date(year, month - 1, day, hour, minute);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  return new Date();
}

function cleanArticleBody(html) {
  let body = String(html || '');
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  body = body.replace(/<aside[\s\S]*?<\/aside>/gi, '');
  body = body.replace(/\s(class|style|data-src|data-original|data-component|data-component-type)="[^"]*"/gi, '');
  body = body.replace(/\ssrc="([^"]+)"/gi, (full, src) => {
    if (src.startsWith('data:')) return '';
    return full;
  });
  return body.trim();
}

function parseArticlePage(html, sourceUrl) {
  const titleMatch = html.match(/<h1[^>]*class="[^"]*title-detail[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const title = stripTags(titleMatch?.[1] || metaContent(html, 'og:title') || '');
  if (!title) {
    throw new Error('Không tìm thấy tiêu đề bài viết');
  }

  const bodyMatch = html.match(/<article[^>]*class="[^"]*fck_detail[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
  let content = cleanArticleBody(bodyMatch?.[1] || '');
  if (!content) {
    const desc = metaContent(html, 'og:description') || metaContent(html, 'description');
    content = desc ? `<p>${desc}</p>` : '<p>Nội dung bài viết.</p>';
  }

  const sourceBlock = `<p><em>Nguồn: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">VnExpress</a></em></p>`;
  if (!content.includes(sourceUrl)) {
    content = `${content}\n${sourceBlock}`;
  }

  const description =
    metaContent(html, 'og:description') ||
    metaContent(html, 'description') ||
    stripTags(content).slice(0, 160);

  const image =
    metaContent(html, 'og:image') ||
    html.match(/<img[^>]+src="(https:\/\/[^"]+)"/i)?.[1] ||
    null;

  return {
    title: truncate(title, 255),
    content,
    description: truncate(description, 255),
    image,
    thumbnail: image,
    publishedAt: parsePublishedAt(html),
    slug: slugFromArticleUrl(sourceUrl),
    metaUrl: sourceUrl.split('#')[0],
  };
}

async function ensureCategory() {
  const category = await Category.findOne({ where: { slug: CATEGORY_SLUG } });
  if (!category) {
    throw new Error(
      `Category "${CATEGORY_SLUG}" chưa tồn tại. Chạy: node scripts/seed-business-knowledge-categories.js`,
    );
  }
  return category;
}

async function upsertKnowledgePost(category, article) {
  const existing =
    (await Post.findOne({ where: { metaUrl: article.metaUrl } })) ||
    (await Post.findOne({ where: { slug: article.slug } }));

  const payload = {
    title: article.title,
    content: article.content,
    slug: article.slug,
    image: article.image,
    thumbnail: article.thumbnail,
    status: 2,
    type: 1,
    visibilityMask: POST_VISIBILITY_BUSINESS_KNOWLEDGE,
    categoryId: String(category.id),
    metaTitle: article.title,
    metaDescription: article.description,
    metaImage: article.image,
    metaUrl: article.metaUrl,
    publishedAt: article.publishedAt,
    tag: 'VnExpress',
  };

  if (existing) {
    if (dryRun) {
      console.log(`[crawl] [dry-run] would update post #${existing.id}: ${article.title}`);
      return { action: 'update', id: existing.id };
    }
    await existing.update(payload);
    console.log(`[crawl] updated post #${existing.id}: ${article.title}`);
    return { action: 'update', id: existing.id };
  }

  if (dryRun) {
    console.log(`[crawl] [dry-run] would create: ${article.title}`);
    return { action: 'create' };
  }

  const post = await Post.create(payload);
  console.log(`[crawl] created post #${post.id}: ${article.title}`);
  return { action: 'create', id: post.id };
}

async function main() {
  console.log(`[crawl] fetching topic: ${TOPIC_URL}`);
  const listingHtml = await fetchHtml(TOPIC_URL);
  const articleUrls = extractArticleLinks(listingHtml, articleLimit);

  if (articleUrls.length === 0) {
    throw new Error('Không tìm thấy link bài viết trên trang chủ đề');
  }

  console.log(`[crawl] found ${articleUrls.length} article(s)`);
  const category = await ensureCategory();
  console.log(`[crawl] category: ${category.name} (#${category.id})`);

  const summary = { created: 0, updated: 0, failed: 0 };

  for (let i = 0; i < articleUrls.length; i += 1) {
    const url = articleUrls[i];
    console.log(`[crawl] [${i + 1}/${articleUrls.length}] ${url}`);
    try {
      const html = await fetchHtml(url);
      const article = parseArticlePage(html, url);
      const result = await upsertKnowledgePost(category, article);
      if (result.action === 'create') summary.created += 1;
      if (result.action === 'update') summary.updated += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`[crawl] failed ${url}:`, error.message || error);
    }

    if (i < articleUrls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  await sequelize.close();
  console.log('[crawl] done', { dryRun, ...summary });
}

main().catch(async (error) => {
  console.error('[crawl] crawl-vnexpress-knowledge-recruitment failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
