/** Locale-prefixed public URLs: /vi/, /en/, /ja/ */

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja'];
export const DEFAULT_LOCALE = 'ja';

/** Trang public mặc định khi vào `/` (chưa đăng nhập). */
export const PUBLIC_ENTRY_PATH = `/${DEFAULT_LOCALE}/`;

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value);
}

export function getPreferredLocale() {
  return DEFAULT_LOCALE;
}

function readStoredLanguagePreference() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem('language');
    return isSupportedLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Ngôn ngữ ưu tiên khi khởi tạo: URL trước; portal /business|/admin → localStorage hoặc vi; còn lại ja. */
export function getInitialLocale(pathname = '') {
  const fromUrl = getLocaleFromPathname(pathname);
  if (fromUrl) return fromUrl;
  const path = String(pathname || '');
  if (path.startsWith('/business') || path.startsWith('/admin')) {
    return readStoredLanguagePreference() || 'vi';
  }
  return DEFAULT_LOCALE;
}

export function getLocaleFromPathname(pathname) {
  const segment = String(pathname || '').split('/').filter(Boolean)[0];
  return isSupportedLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname || '/';
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  return rest.startsWith('/') ? rest : `/${rest}`;
}

export function withLocalePath(locale, path = '/') {
  const lang = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  if (!path || path === '/') return `/${lang}`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${normalized}`;
}

function mapLegacyCollaboratorRest(lang, rest) {
  const normalized = rest || '';
  if (normalized === '' || normalized === '/') {
    return withLocalePath(lang, '/');
  }
  if (normalized.startsWith('/jobs')) {
    return withLocalePath(lang, `/collaborator${normalized}`);
  }
  if (normalized.startsWith('/about-us')) {
    return withLocalePath(lang, `/collaborator${normalized}`);
  }
  if (normalized.startsWith('/blog')) {
    return withLocalePath(lang, `/candidate${normalized}`);
  }
  return withLocalePath(lang, `/business${normalized}`);
}

export function switchLocaleInPathname(pathname, newLocale) {
  const lang = isSupportedLocale(newLocale) ? newLocale : DEFAULT_LOCALE;
  const current = getLocaleFromPathname(pathname);
  if (current) {
    return pathname.replace(`/${current}`, `/${lang}`);
  }

  if (pathname.startsWith('/landing/candidate')) {
    const rest = pathname.slice('/landing/candidate'.length) || '';
    return withLocalePath(lang, `/candidate${rest}`);
  }
  if (pathname.startsWith('/candidate')) {
    const rest = pathname.slice('/candidate'.length) || '';
    return withLocalePath(lang, `/candidate${rest}`);
  }
  if (pathname.startsWith('/landing/collaborator')) {
    const rest = pathname.slice('/landing/collaborator'.length) || '';
    return mapLegacyCollaboratorRest(lang, rest);
  }
  if (pathname.startsWith('/collaborator')) {
    const rest = pathname.slice('/collaborator'.length) || '';
    if (rest.startsWith('/jobs')) {
      return `${withLocalePath(lang, `/collaborator${rest}`)}${search}${hash}`;
    }
    return mapLegacyCollaboratorRest(lang, rest);
  }
  if (pathname.startsWith('/landing/business')) {
    const rest = pathname.slice('/landing/business'.length) || '';
    return withLocalePath(lang, `/business${rest}`);
  }
  if (pathname === '/') return withLocalePath(lang, '/');
  return withLocalePath(lang, pathname);
}

export function resolveCandidatePrefix(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (locale) return `/${locale}/candidate`;
  if (pathname.startsWith('/landing/candidate')) return '/landing/candidate';
  if (pathname.startsWith('/candidate')) return '/candidate';
  return withLocalePath(getPreferredLocale(), '/candidate');
}

export function resolveCollaboratorPrefix(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (locale) return `/${locale}/collaborator`;
  if (pathname.startsWith('/landing/collaborator')) return '/landing/collaborator';
  if (pathname.startsWith('/collaborator')) return '/collaborator';
  return withLocalePath(getPreferredLocale(), '/collaborator');
}

export function isCollaboratorPublicPath(pathname) {
  const stripped = stripLocaleFromPathname(pathname);
  if (stripped.startsWith('/collaborator')) return true;
  if (pathname.startsWith('/landing/collaborator')) return true;
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return false;
  const rest = stripped === '/' ? '' : stripped;
  return rest === '/jobs' || rest.startsWith('/jobs/');
}

export function isCandidateMarketingHome(pathname) {
  const path = String(pathname || '');
  const rest = stripLocaleFromPathname(path);
  if (rest === '/candidate' || rest === '/candidate/') return true;
  return path === '/candidate' || path === '/candidate/' || path === '/landing/candidate' || path === '/landing/candidate/';
}

export function isCandidatePublicPath(pathname) {
  const stripped = stripLocaleFromPathname(pathname);
  return (
    stripped.startsWith('/candidate') ||
    pathname.startsWith('/landing/candidate') ||
    pathname.startsWith('/candidate')
  );
}

export function resolvePublicJobsBasePath(pathname) {
  if (isCollaboratorPublicPath(pathname)) {
    return `${resolveCollaboratorPrefix(pathname)}/jobs`;
  }
  return `${resolveCandidatePrefix(pathname)}/jobs`;
}

/** About Us theo persona (CTV vs ứng viên). */
export function resolvePublicAboutPath(pathname) {
  if (isCollaboratorPublicPath(pathname)) {
    return `${resolveCollaboratorPrefix(pathname)}/about-us`;
  }
  return `${resolveCandidatePrefix(pathname)}/about-us`;
}

/** Danh sách + chi tiết job public (JobShare Jobs V3). */
export function isPublicJobsV3StandaloneRoute(pathname) {
  const pathNorm = String(pathname || '').replace(/\/+$/, '') || '/';
  const jobsBase = resolvePublicJobsBasePath(pathname).replace(/\/+$/, '');
  if (pathNorm === jobsBase) return true;

  if (!pathNorm.startsWith(`${jobsBase}/`)) return false;

  const tail = pathNorm.slice(jobsBase.length + 1);
  const segments = tail.split('/').filter(Boolean);
  if (segments.length !== 1) return false;

  const reserved = new Set(['apply', 'confirm', 'nominate', 'view']);
  return !reserved.has(segments[0].toLowerCase());
}

/**
 * URL public chia sẻ job cho ứng viên.
 * Mặc định: /{lang}/candidate/jobs/{slug|id}/view
 */
export function buildPublicShareJobUrl({
  jobId,
  slug,
  locale,
  origin,
} = {}) {
  const lang = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const key = String(slug || '').trim() || String(jobId || '').trim();
  if (!key) return '';
  const encoded = encodeURIComponent(key);
  const path = withLocalePath(lang, `/candidate/jobs/${encoded}/view`);
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://ws-jobshare.com');
  return `${String(base).replace(/\/+$/, '')}${path}`;
}

export function isBusinessPublicPath(pathname) {
  const path = String(pathname || '');
  if (path.startsWith('/landing/business')) return true;
  const locale = getLocaleFromPathname(path);
  if (locale && (path === `/${locale}/business` || path.startsWith(`/${locale}/business/`))) {
    return true;
  }
  return false;
}

export function resolvePublicBlogPrefix(pathname) {
  if (isCandidatePublicPath(pathname)) {
    return resolveCandidatePrefix(pathname);
  }
  return resolveBusinessLandingPrefix(pathname);
}

export function localizedPersonaHref(locale, persona) {
  const lang = isSupportedLocale(locale) ? locale : getPreferredLocale();
  if (persona === 'candidate') return withLocalePath(lang, '/candidate');
  if (persona === 'collaborator') return withLocalePath(lang, '/');
  if (persona === 'company' || persona === 'business') return withLocalePath(lang, '/business');
  return withLocalePath(lang, '/business');
}

export function resolveBusinessLandingPrefix(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (locale) return `/${locale}/business`;
  if (pathname.startsWith('/landing/business')) return '/landing/business';
  return withLocalePath(getPreferredLocale(), '/business');
}

export function legacyPublicRedirectPath(pathname, search = '', hash = '', persona = 'collaborator') {
  const lang = DEFAULT_LOCALE;

  if (pathname.startsWith('/landing/candidate')) {
    const rest = pathname.slice('/landing/candidate'.length) || '';
    return `${withLocalePath(lang, `/candidate${rest}`)}${search}${hash}`;
  }
  if (pathname.startsWith('/candidate')) {
    const rest = pathname.slice('/candidate'.length) || '';
    return `${withLocalePath(lang, `/candidate${rest}`)}${search}${hash}`;
  }
  if (pathname.startsWith('/landing/collaborator')) {
    const rest = pathname.slice('/landing/collaborator'.length) || '';
    return `${mapLegacyCollaboratorRest(lang, rest)}${search}${hash}`;
  }
  if (pathname.startsWith('/collaborator')) {
    const rest = pathname.slice('/collaborator'.length) || '';
    return `${mapLegacyCollaboratorRest(lang, rest)}${search}${hash}`;
  }
  if (pathname.startsWith('/landing/business')) {
    const rest = pathname.slice('/landing/business'.length) || '';
    return `${withLocalePath(lang, `/business${rest}`)}${search}${hash}`;
  }

  if (persona === 'candidate') {
    return `${withLocalePath(lang, '/candidate')}${search}${hash}`;
  }
  return `${withLocalePath(lang, '/')}${search}${hash}`;
}

export function publicCanonicalUrl(pathname) {
  const locale = getLocaleFromPathname(pathname) || getPreferredLocale();
  const stripped = stripLocaleFromPathname(pathname);

  if (stripped.startsWith('/candidate')) {
    const rest = stripped.slice('/candidate'.length) || '';
    return `https://ws-jobshare.com/${locale}/candidate${rest}`;
  }
  if (stripped === '/' || stripped === '') {
    return `https://ws-jobshare.com/${locale}/`;
  }
  return `https://ws-jobshare.com/${locale}${stripped}`;
}
