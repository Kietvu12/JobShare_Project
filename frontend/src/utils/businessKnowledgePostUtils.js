import { normalizePostImageUrl } from '../services/api';

export function formatKnowledgePostDate(iso, lang = 'vi') {
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
