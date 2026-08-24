/** UTM attribution — capture từ URL, lưu session, build link chia sẻ theo nền tảng. */

export const UTM_STORAGE_KEY = 'wjs_utm_attribution';

export const UTM_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/** Campaign nội bộ — không hiện trên URL công khai. */
const INTERNAL_UTM_CAMPAIGNS = new Set(['inbound_referrer']);

function getPublicUtmQueryEntries(stored) {
  if (!stored?.utm_source) return [];
  const entries = [];
  if (stored.utm_source) entries.push(['utm_source', stored.utm_source]);
  if (stored.utm_medium) entries.push(['utm_medium', stored.utm_medium]);
  if (stored.utm_campaign && !INTERNAL_UTM_CAMPAIGNS.has(stored.utm_campaign)) {
    entries.push(['utm_campaign', stored.utm_campaign]);
  }
  if (stored.utm_content) entries.push(['utm_content', stored.utm_content]);
  if (stored.utm_term) entries.push(['utm_term', stored.utm_term]);
  return entries;
}

/** Preset nền tảng → utm_source / utm_medium mặc định */
export const UTM_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', utmSource: 'facebook', utmMedium: 'social' },
  { key: 'instagram', label: 'Instagram', utmSource: 'instagram', utmMedium: 'social' },
  { key: 'linkedin', label: 'LinkedIn', utmSource: 'linkedin', utmMedium: 'social' },
  { key: 'x', label: 'X (Twitter)', utmSource: 'x', utmMedium: 'social' },
  { key: 'tiktok', label: 'TikTok', utmSource: 'tiktok', utmMedium: 'social' },
  { key: 'youtube', label: 'YouTube', utmSource: 'youtube', utmMedium: 'social' },
  { key: 'chatgpt', label: 'ChatGPT', utmSource: 'chatgpt', utmMedium: 'referral' },
  { key: 'google', label: 'Google', utmSource: 'google', utmMedium: 'cpc' },
  { key: 'zalo', label: 'Zalo', utmSource: 'zalo', utmMedium: 'social' },
  { key: 'line', label: 'LINE', utmSource: 'line', utmMedium: 'social' },
  { key: 'telegram', label: 'Telegram', utmSource: 'telegram', utmMedium: 'social' },
  { key: 'threads', label: 'Threads', utmSource: 'threads', utmMedium: 'social' },
  { key: 'pinterest', label: 'Pinterest', utmSource: 'pinterest', utmMedium: 'social' },
  { key: 'reddit', label: 'Reddit', utmSource: 'reddit', utmMedium: 'social' },
  { key: 'email', label: 'Email', utmSource: 'email', utmMedium: 'email' },
  { key: 'website', label: 'Website / Blog', utmSource: 'website', utmMedium: 'referral' },
  { key: 'event', label: 'Sự kiện / Hội thảo', utmSource: 'event', utmMedium: 'offline' },
  { key: 'other', label: 'Khác', utmSource: 'other', utmMedium: 'referral' },
];

export const REGISTRATION_SOURCE_OPTIONS = [
  { value: 'facebook', labels: { vi: 'Facebook', en: 'Facebook', ja: 'Facebook' } },
  { value: 'instagram', labels: { vi: 'Instagram', en: 'Instagram', ja: 'Instagram' } },
  { value: 'linkedin', labels: { vi: 'LinkedIn', en: 'LinkedIn', ja: 'LinkedIn' } },
  { value: 'x', labels: { vi: 'X (Twitter)', en: 'X (Twitter)', ja: 'X（Twitter）' } },
  { value: 'tiktok', labels: { vi: 'TikTok', en: 'TikTok', ja: 'TikTok' } },
  { value: 'youtube', labels: { vi: 'YouTube', en: 'YouTube', ja: 'YouTube' } },
  { value: 'chatgpt', labels: { vi: 'ChatGPT / AI', en: 'ChatGPT / AI', ja: 'ChatGPT / AI' } },
  { value: 'google', labels: { vi: 'Google / Tìm kiếm', en: 'Google / Search', ja: 'Google / 検索' } },
  { value: 'zalo', labels: { vi: 'Zalo', en: 'Zalo', ja: 'Zalo' } },
  { value: 'line', labels: { vi: 'LINE', en: 'LINE', ja: 'LINE' } },
  { value: 'telegram', labels: { vi: 'Telegram', en: 'Telegram', ja: 'Telegram' } },
  { value: 'threads', labels: { vi: 'Threads', en: 'Threads', ja: 'Threads' } },
  { value: 'friend', labels: { vi: 'Bạn bè / Người quen giới thiệu', en: 'Friend / referral', ja: '友人・知人の紹介' } },
  { value: 'event', labels: { vi: 'Sự kiện / Hội thảo', en: 'Event / seminar', ja: 'イベント・セミナー' } },
  { value: 'other', labels: { vi: 'Khác', en: 'Other', ja: 'その他' } },
];

const UTM_SOURCE_ALIASES = {
  twitter: 'x',
  'x.com': 'x',
  fb: 'facebook',
  ig: 'instagram',
  ln: 'linkedin',
  gpt: 'chatgpt',
  openai: 'chatgpt',
};

/** Hostname referrer → nguồn (không cần link có ?utm_ khi user bấm từ app social). */
const REFERRER_HOST_RULES = [
  { match: /(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/, utmSource: 'facebook', utmMedium: 'social' },
  { match: /(^|\.)instagram\.com$|(^|\.)l\.instagram\.com$/, utmSource: 'instagram', utmMedium: 'social' },
  { match: /(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, utmSource: 'linkedin', utmMedium: 'social' },
  { match: /(^|\.)twitter\.com$|(^|\.)x\.com$|(^|\.)t\.co$/, utmSource: 'x', utmMedium: 'social' },
  { match: /(^|\.)tiktok\.com$/, utmSource: 'tiktok', utmMedium: 'social' },
  { match: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/, utmSource: 'youtube', utmMedium: 'social' },
  { match: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/, utmSource: 'chatgpt', utmMedium: 'referral' },
  { match: /(^|\.)google\.[a-z.]{2,}$/, utmSource: 'google', utmMedium: 'organic' },
  { match: /(^|\.)zalo\.me$|(^|\.)zalo\.app$/, utmSource: 'zalo', utmMedium: 'social' },
  { match: /(^|\.)line\.me$/, utmSource: 'line', utmMedium: 'social' },
  { match: /(^|\.)t\.me$|(^|\.)telegram\.org$/, utmSource: 'telegram', utmMedium: 'social' },
  { match: /(^|\.)threads\.net$/, utmSource: 'threads', utmMedium: 'social' },
  { match: /(^|\.)pinterest\.com$|(^|\.)pin\.it$/, utmSource: 'pinterest', utmMedium: 'social' },
  { match: /(^|\.)reddit\.com$|(^|\.)redd\.it$/, utmSource: 'reddit', utmMedium: 'social' },
];

function isSameOriginReferrer(referrer) {
  if (!referrer || typeof window === 'undefined') return true;
  try {
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return true;
  }
}

/** Nhận diện nền tảng từ HTTP Referer (lần click đầu từ social → site). */
export function detectAttributionFromReferrer(referrer = '') {
  if (!referrer || isSameOriginReferrer(referrer)) return null;
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  const rule = REFERRER_HOST_RULES.find((r) => r.match.test(host));
  if (!rule) return null;
  return {
    utm_source: rule.utmSource,
    utm_medium: rule.utmMedium,
    captureMethod: 'referrer',
  };
}

export function normalizeUtmSource(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return '';
  return UTM_SOURCE_ALIASES[v] || v;
}

export function parseUtmFromSearch(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out = {};
  UTM_PARAM_KEYS.forEach((key) => {
    const val = params.get(key);
    if (val) out[key] = val.trim();
  });
  if (out.utm_source) out.utm_source = normalizeUtmSource(out.utm_source);
  return out;
}

export function persistUtmParams(params) {
  if (!params?.utm_source) return;
  try {
    sessionStorage.setItem(
      UTM_STORAGE_KEY,
      JSON.stringify({ ...params, capturedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore quota */
  }
}

export function getStoredUtmParams() {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function captureUtmFromSearch(search = '') {
  const parsed = parseUtmFromSearch(search);
  if (parsed.utm_source) {
    persistUtmParams({ ...parsed, captureMethod: 'utm_url' });
  }
  return parsed;
}

/**
 * Gom attribution cho mọi route trong session:
 * 1) ?utm_* trên URL (ưu tiên, ghi đè)
 * 2) đã lưu session → giữ nguyên khi điều hướng nội bộ
 * 3) lần vào đầu từ social (document.referrer) → tự nhận nguồn
 */
export function capturePageAttribution({ search = '', referrer = '' } = {}) {
  const fromUrl = captureUtmFromSearch(search);
  if (fromUrl.utm_source) return getStoredUtmParams();

  const existing = getStoredUtmParams();
  if (existing?.utm_source) return existing;

  const fromReferrer = detectAttributionFromReferrer(
    referrer || (typeof document !== 'undefined' ? document.referrer : '')
  );
  if (fromReferrer?.utm_source) {
    persistUtmParams(fromReferrer);
    return fromReferrer;
  }

  return existing;
}

/** Gắn utm đã lưu lên thanh địa chỉ (replaceState) — mọi route trong session đều có đuôi utm. */
export function syncAttributionToAddressBar(pathname, search = '', hash = '') {
  if (typeof window === 'undefined') return;
  const stored = getStoredUtmParams();
  if (!stored?.utm_source) return;

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.has('utm_source')) return;

  getPublicUtmQueryEntries(stored).forEach(([key, val]) => {
    params.set(key, val);
  });

  const query = params.toString();
  const next = `${pathname}${query ? `?${query}` : ''}${hash || window.location.hash || ''}`;
  if (`${pathname}${search}${hash}` !== next) {
    window.history.replaceState(window.history.state, '', next);
  }
}

export function utmSourceToRegistrationSource(utmSource) {
  const normalized = normalizeUtmSource(utmSource);
  const known = REGISTRATION_SOURCE_OPTIONS.some((o) => o.value === normalized);
  return known ? normalized : 'other';
}

export function getRegistrationSourceLabel(value, language = 'vi') {
  const lang = ['vi', 'en', 'ja'].includes(language) ? language : 'vi';
  const opt = REGISTRATION_SOURCE_OPTIONS.find((o) => o.value === value);
  if (opt) return opt.labels[lang] || opt.labels.vi;
  return value || '—';
}

export function getUtmPlatformLabel(utmSource, language = 'vi') {
  const normalized = normalizeUtmSource(utmSource);
  const platform = UTM_PLATFORMS.find((p) => p.utmSource === normalized);
  if (platform) return platform.label;
  return utmSource || '—';
}

/**
 * Build URL có đuôi UTM cho nền tảng social.
 * @param {string} baseUrl - URL đích (path hoặc full URL)
 * @param {object} options
 */
export function buildUtmUrl(baseUrl, options = {}) {
  const {
    utmSource,
    utmMedium = 'social',
    utmCampaign = 'ctv_registration',
    utmContent,
    utmTerm,
    origin,
  } = options;

  if (!utmSource) return baseUrl;

  const base = String(baseUrl || '/');
  const url = base.startsWith('http')
    ? new URL(base)
    : new URL(base, origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'));

  url.searchParams.set('utm_source', utmSource);
  url.searchParams.set('utm_medium', utmMedium);
  if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
  if (utmContent) url.searchParams.set('utm_content', utmContent);
  if (utmTerm) url.searchParams.set('utm_term', utmTerm);

  return url.toString();
}

export function buildUtmUrlForPlatform(baseUrl, platformKey, extra = {}) {
  const platform = UTM_PLATFORMS.find((p) => p.key === platformKey);
  if (!platform) return baseUrl;
  return buildUtmUrl(baseUrl, {
    utmSource: platform.utmSource,
    utmMedium: platform.utmMedium,
    utmCampaign: extra.utmCampaign || 'ctv_registration',
    utmContent: extra.utmContent,
    utmTerm: extra.utmTerm,
    origin: extra.origin,
  });
}

/** Gắn UTM đã lưu vào link nội bộ (giữ user trong cùng attribution). */
export function appendStoredUtmToUrl(url, stored = getStoredUtmParams()) {
  if (!stored?.utm_source || !url) return url;
  try {
    const resolved = url.startsWith('http')
      ? new URL(url)
      : new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    UTM_PARAM_KEYS.forEach((key) => {
      if (stored[key] && !resolved.searchParams.has(key)) {
        resolved.searchParams.set(key, stored[key]);
      }
    });
    return url.startsWith('http') ? resolved.toString() : `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return url;
  }
}

export function appendAcquisitionFieldsToPayload(payload, { utm, registrationSource, registrationSourceDetail }) {
  const fields = {
    utmSource: utm?.utm_source || undefined,
    utmMedium: utm?.utm_medium || undefined,
    utmCampaign: utm?.utm_campaign || undefined,
    utmContent: utm?.utm_content || undefined,
    utmTerm: utm?.utm_term || undefined,
    registrationSource: registrationSource || undefined,
    registrationSourceDetail: registrationSourceDetail || undefined,
  };

  if (payload instanceof FormData) {
    Object.entries(fields).forEach(([key, val]) => {
      if (val != null && String(val).trim() !== '') payload.append(key, String(val).trim());
    });
    return payload;
  }

  Object.entries(fields).forEach(([key, val]) => {
    if (val != null && String(val).trim() !== '') payload[key] = String(val).trim();
  });
  return payload;
}

/** Hiển thị admin — tóm tắt nguồn CTV. */
export function hasCollaboratorAcquisitionData(collaborator) {
  if (!collaborator) return false;
  return Boolean(
    collaborator.registrationSource ||
    collaborator.utmSource ||
    collaborator.registrationSourceDetail
  );
}

export function formatCollaboratorAcquisitionLines(collaborator, language = 'vi') {
  if (!collaborator) return [];
  const lines = [];
  if (collaborator.registrationSource) {
    let label = getRegistrationSourceLabel(collaborator.registrationSource, language);
    if (collaborator.registrationSource === 'other' && collaborator.registrationSourceDetail) {
      label += `: ${collaborator.registrationSourceDetail}`;
    }
    lines.push({ key: 'self', label: 'Tự khai báo', value: label });
  }
  if (collaborator.utmSource) {
    lines.push({ key: 'utm_source', label: 'UTM source', value: getUtmPlatformLabel(collaborator.utmSource, language) });
  }
  if (collaborator.utmMedium) lines.push({ key: 'utm_medium', label: 'UTM medium', value: collaborator.utmMedium });
  if (collaborator.utmCampaign) lines.push({ key: 'utm_campaign', label: 'UTM campaign', value: collaborator.utmCampaign });
  if (collaborator.utmContent) lines.push({ key: 'utm_content', label: 'UTM content', value: collaborator.utmContent });
  if (collaborator.utmTerm) lines.push({ key: 'utm_term', label: 'UTM term', value: collaborator.utmTerm });
  return lines;
}
