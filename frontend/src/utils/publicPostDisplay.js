/** Hiển thị bài public (blog) theo ngôn ngữ — dùng chung landing & danh sách */

import { normalizePostImageUrl } from '../services/api';

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pickPublicPostTitle(post, lang) {
  if (!post) return '';
  const titleEn = post.titleEn || post.title_en || '';
  const titleJp = post.titleJp || post.titleJa || post.title_jp || '';
  if (lang === 'en') return titleEn || post.title || '';
  if (lang === 'ja') return titleJp || titleEn || post.title || '';
  return post.title || titleEn || titleJp || '';
}

function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .replace(/[()（）]/g, '')
    .replace(/[‐‑–—]/g, '-')
    .replace(/\s*\/\s*/g, '/');
}

export function pickPublicPostCategoryLabel(post, lang, fallback = 'News') {
  if (!post) return fallback;
  const category = post.category || {};
  const rawName = String(category.name || category.nameVi || category.nameEn || category.nameJp || '').trim();
  const slugKey = normalizeCategoryKey(String(category.slug || '').replace(/-/g, ' '));
  const nameKey = normalizeCategoryKey(rawName);

  const dict = {
    vi: {
      thongbao: 'Thông báo',
      'thong bao': 'Thông báo',
      tin_tuc: 'Tin tức',
      'tin tuc': 'Tin tức',
      sukien: 'Sự kiện',
      'su kien': 'Sự kiện',
      campaign: 'Campaign',
      chien_dich: 'Chiến dịch',
      'chien dich': 'Chiến dịch',
    },
    en: {
      thongbao: 'Announcement',
      'thong bao': 'Announcement',
      tin_tuc: 'News',
      'tin tuc': 'News',
      sukien: 'Event',
      'su kien': 'Event',
      campaign: 'Campaign',
      chien_dich: 'Campaign',
      'chien dich': 'Campaign',
    },
    ja: {
      thongbao: 'お知らせ',
      'thong bao': 'お知らせ',
      tin_tuc: 'ニュース',
      'tin tuc': 'ニュース',
      sukien: 'イベント',
      'su kien': 'イベント',
      campaign: 'キャンペーン',
      chien_dich: 'キャンペーン',
      'chien dich': 'キャンペーン',
    },
  };

  const langDict = dict[lang] || dict.vi;
  const translated = langDict[slugKey] || langDict[nameKey];
  if (translated) return translated;
  if (lang === 'vi') return category.name || fallback;
  return fallback;
}

export function pickPublicPostExcerpt(post, lang) {
  if (!post) return '';
  const metaDescriptionEn = post.metaDescriptionEn || post.meta_description_en || '';
  const metaDescriptionJp = post.metaDescriptionJp || post.metaDescriptionJa || post.meta_description_jp || '';
  const contentEn = post.contentEn || post.content_en || '';
  const contentJp = post.contentJp || post.contentJa || post.content_jp || '';
  const raw =
    lang === 'en'
      ? metaDescriptionEn || post.metaDescription
      : lang === 'ja'
        ? metaDescriptionJp || metaDescriptionEn || post.metaDescription
        : post.metaDescription || metaDescriptionEn;
  if (raw && String(raw).trim()) return String(raw).trim();
  const content =
    lang === 'en'
      ? contentEn || post.content
      : lang === 'ja'
        ? contentJp || contentEn || post.content
        : post.content;
  const text = stripHtml(content || '');
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export function getPostBlogSlug(post) {
  if (!post) return '';
  const slug = String(post.slug || '').trim();
  if (slug) return slug;
  if (post.id != null) return String(post.id);
  return '';
}

export function getPostDetailHref(post, blogBase = '') {
  const slug = getPostBlogSlug(post);
  if (!slug) return `${blogBase}/blog`;
  const base = String(blogBase || '').replace(/\/$/, '');
  return `${base}/blog/${encodeURIComponent(slug)}`;
}

export function pickPublicPostMetaTitle(post, lang) {
  if (!post) return '';
  const metaTitleEn = post.metaTitleEn || post.meta_title_en || '';
  const metaTitleJp = post.metaTitleJp || post.metaTitleJa || post.meta_title_jp || '';
  if (lang === 'en') return metaTitleEn || post.metaTitle || pickPublicPostTitle(post, lang);
  if (lang === 'ja') return metaTitleJp || post.metaTitle || pickPublicPostTitle(post, lang);
  return post.metaTitle || pickPublicPostTitle(post, lang);
}

const DEFAULT_SHARE_OG_IMAGE = 'https://ws-jobshare.com/2HGb6Eo3YO1l7uOuEpoiDFXtQrQ6x7Yrzeb2.jpg';

function toAbsoluteShareUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
  }
  return url;
}

/** URL ảnh chia sẻ — ưu tiên thumbnail (ảnh đại diện), dùng URL ổn định từ API. */
export function getPostShareImageUrl(post) {
  if (!post) return '';
  if (post.shareImageUrl) return post.shareImageUrl;
  const raw = post.thumbnail || '';
  if (!raw) return DEFAULT_SHARE_OG_IMAGE;
  return toAbsoluteShareUrl(normalizePostImageUrl(raw)) || DEFAULT_SHARE_OG_IMAGE;
}

export function formatPublicPostDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
