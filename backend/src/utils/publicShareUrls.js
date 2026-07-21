import { extractS3KeyFromPostMediaUrl } from './postHtmlS3.js';

const DEFAULT_OG_IMAGE = 'https://ws-jobshare.com/2HGb6Eo3YO1l7uOuEpoiDFXtQrQ6x7Yrzeb2.jpg';

export function getPublicSiteOrigin() {
  return String(process.env.PUBLIC_SITE_ORIGIN || 'https://ws-jobshare.com').replace(/\/+$/, '');
}

export function getPublicApiBasePath() {
  return String(process.env.PUBLIC_API_BASE_PATH || '/api_jobshare/api').replace(/\/+$/, '');
}

/** URL ổn định cho og:image / chia sẻ — redirect sang S3, không dùng presigned URL hết hạn. */
export function buildPublicS3ViewUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const key = extractS3KeyFromPostMediaUrl(trimmed);
    if (key) return buildPublicS3ViewUrl(key);
    return trimmed;
  }

  const key = trimmed.replace(/^\/+/, '');
  const origin = getPublicSiteOrigin();
  const apiBase = getPublicApiBasePath();
  return `${origin}${apiBase}/media/s3-view?key=${encodeURIComponent(key)}`;
}

/** Ảnh chia sẻ bài viết: luôn ưu tiên thumbnail (ảnh đại diện). */
export function buildPostShareImageUrl(post) {
  if (!post) return DEFAULT_OG_IMAGE;
  const thumbnail = post.thumbnail || post.getDataValue?.('thumbnail') || '';
  const fromThumb = buildPublicS3ViewUrl(thumbnail);
  if (fromThumb) return fromThumb;
  return DEFAULT_OG_IMAGE;
}

export function getDefaultOgImageUrl() {
  return DEFAULT_OG_IMAGE;
}
