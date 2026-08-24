import { Post, Category } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  POST_VISIBILITY_AGENT_HOME,
  POST_VISIBILITY_PUBLIC_CTV,
  POST_VISIBILITY_PUBLIC_CANDIDATE,
  POST_VISIBILITY_BUSINESS_KNOWLEDGE,
} from '../constants/postVisibility.js';
import {
  buildPostShareImageUrl,
  getDefaultOgImageUrl,
  getPublicSiteOrigin,
} from '../utils/publicShareUrls.js';

const SUPPORTED_LANGS = new Set(['vi', 'en', 'ja']);

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function postVisibilityWhereForSurface(surface, { agentHome = false } = {}) {
  if (agentHome) {
    return sequelize.where(
      sequelize.literal(`(\`Post\`.\`visibility_mask\` & ${POST_VISIBILITY_AGENT_HOME})`),
      Op.gt,
      0
    );
  }
  const s = String(surface || '').toLowerCase();
  if (s === 'candidate') {
    return sequelize.where(
      sequelize.literal(`(\`Post\`.\`visibility_mask\` & ${POST_VISIBILITY_PUBLIC_CANDIDATE})`),
      Op.gt,
      0
    );
  }
  if (s === 'collaborator') {
    return sequelize.where(
      sequelize.literal(`(\`Post\`.\`visibility_mask\` & ${POST_VISIBILITY_PUBLIC_CTV})`),
      Op.gt,
      0
    );
  }
  if (s === 'business' || s === 'business_knowledge' || s === 'knowledge') {
    return sequelize.where(
      sequelize.literal(`(\`Post\`.\`visibility_mask\` & ${POST_VISIBILITY_BUSINESS_KNOWLEDGE})`),
      Op.gt,
      0
    );
  }
  const publicBits = POST_VISIBILITY_PUBLIC_CTV | POST_VISIBILITY_PUBLIC_CANDIDATE;
  return sequelize.where(
    sequelize.literal(`(\`Post\`.\`visibility_mask\` & ${publicBits})`),
    Op.gt,
    0
  );
}

/** Public/CTV detail: nhận slug hoặc id (số) để tương thích link cũ */
export async function findPublishedPostBySlugOrId(identifier, visibilityWhere) {
  const key = String(identifier || '').trim();
  if (!key) return null;

  const include = [
    {
      model: Category,
      as: 'category',
      required: false,
      attributes: ['id', 'name', 'slug', 'color', 'sortOrder'],
    },
  ];

  let post = await Post.findOne({
    where: {
      [Op.and]: [{ slug: key }, { status: 2 }, visibilityWhere],
    },
    include,
  });

  if (!post && /^\d+$/.test(key)) {
    post = await Post.findOne({
      where: {
        [Op.and]: [{ id: key }, { status: 2 }, visibilityWhere],
      },
      include,
    });
  }

  return post;
}

function pickPostTitle(post, lang) {
  if (!post) return '';
  if (lang === 'en') return post.titleEn || post.title || '';
  if (lang === 'ja') return post.titleJp || post.titleEn || post.title || '';
  return post.title || post.titleEn || post.titleJp || '';
}

function pickPostMetaTitle(post, lang) {
  if (!post) return '';
  if (lang === 'en') return post.metaTitleEn || post.metaTitle || pickPostTitle(post, lang);
  if (lang === 'ja') return post.metaTitleJp || post.metaTitle || pickPostTitle(post, lang);
  return post.metaTitle || pickPostTitle(post, lang);
}

function pickPostDescription(post, lang) {
  if (!post) return '';
  if (lang === 'en') {
    const raw = post.metaDescriptionEn || post.metaDescription || '';
    if (raw?.trim()) return String(raw).trim();
    return stripHtml(post.contentEn || post.content || '').slice(0, 160);
  }
  if (lang === 'ja') {
    const raw = post.metaDescriptionJp || post.metaDescription || '';
    if (raw?.trim()) return String(raw).trim();
    return stripHtml(post.contentJp || post.contentEn || post.content || '').slice(0, 160);
  }
  const raw = post.metaDescription || '';
  if (raw?.trim()) return String(raw).trim();
  return stripHtml(post.content || '').slice(0, 160);
}

export function normalizeBlogLang(lang) {
  const l = String(lang || 'vi').toLowerCase();
  return SUPPORTED_LANGS.has(l) ? l : 'vi';
}

export function buildPostCanonicalPath({ lang, slug, surface }) {
  const safeLang = normalizeBlogLang(lang);
  const safeSlug = encodeURIComponent(String(slug || '').trim());
  if (surface === 'candidate') return `/${safeLang}/candidate/blog/${safeSlug}`;
  return `/${safeLang}/blog/${safeSlug}`;
}

export async function buildPostOgMeta({ slug, lang, surface }) {
  const visibilityWhere = postVisibilityWhereForSurface(surface);
  const post = await findPublishedPostBySlugOrId(slug, visibilityWhere);
  if (!post) return null;

  const safeLang = normalizeBlogLang(lang);
  const canonicalPath = buildPostCanonicalPath({ lang: safeLang, slug: post.slug || slug, surface });
  const origin = getPublicSiteOrigin();
  const title = pickPostMetaTitle(post, safeLang) || pickPostTitle(post, safeLang) || 'Blog';
  const description = pickPostDescription(post, safeLang);
  const shareImageUrl = buildPostShareImageUrl(post);

  return {
    title: `${title} | Workstation JobShare`,
    description,
    shareImageUrl: shareImageUrl || getDefaultOgImageUrl(),
    canonicalUrl: `${origin}${canonicalPath}`,
    slug: post.slug || slug,
  };
}

/** Slug danh mục Knowledge Hub doanh nghiệp */
export const BUSINESS_KNOWLEDGE_CATEGORY_SLUGS = [
  'tuyen-dung',
  'quan-tri-nhan-su',
  'phat-trien-doi-ngu',
  'phap-ly-tuan-thu',
  'ky-nang-nghe-nghiep',
  'khac',
];

export async function listBusinessKnowledgeCategories() {
  const visibilityWhere = postVisibilityWhereForSurface('business');
  const categories = await Category.findAll({
    where: {
      isActive: true,
      slug: { [Op.in]: BUSINESS_KNOWLEDGE_CATEGORY_SLUGS },
    },
    attributes: ['id', 'name', 'slug', 'color', 'sortOrder', 'description'],
    order: [['sortOrder', 'ASC'], ['id', 'ASC']],
  });

  const counts = await Post.findAll({
    where: {
      status: 2,
      categoryId: { [Op.in]: categories.map((c) => c.id) },
      [Op.and]: [visibilityWhere],
    },
    attributes: [
      'categoryId',
      [sequelize.fn('COUNT', sequelize.col('Post.id')), 'postCount'],
    ],
    group: ['categoryId'],
    raw: true,
  });

  const countMap = new Map(
    counts.map((row) => [String(row.categoryId), Number(row.postCount) || 0]),
  );

  return categories.map((cat) => {
    const json = cat.toJSON();
    return {
      ...json,
      postCount: countMap.get(String(cat.id)) || 0,
    };
  });
}
