import { normalizePostImageUrl } from '../services/api';
import {
  pickPublicPostCategoryLabel,
  pickPublicPostTitle,
} from './publicPostDisplay';

export function formatKnowledgePostDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function knowledgePostImage(post) {
  const raw = post?.thumbnail || post?.image || '';
  return raw ? normalizePostImageUrl(raw) : '';
}

export function knowledgePostPath(post) {
  const key = post?.slug || post?.id;
  if (!key) return null;
  return `/business/knowledge/${encodeURIComponent(key)}`;
}

export function knowledgePostDisplay(post, language) {
  return {
    title: pickPublicPostTitle(post, language),
    category: pickPublicPostCategoryLabel(post, language, ''),
    date: formatKnowledgePostDate(post?.publishedAt || post?.createdAt, language),
    image: knowledgePostImage(post),
    path: knowledgePostPath(post),
  };
}
