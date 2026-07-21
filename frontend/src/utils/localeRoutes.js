/** Locale-prefixed public URLs: /vi/, /en/, /ja/ */

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja'];
export const DEFAULT_LOCALE = 'vi';

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value);
}

export function getPreferredLocale() {
  return DEFAULT_LOCALE;
}

/** Ngôn ngữ ưu tiên khi khởi tạo: URL trước, mặc định vi (không đọc localStorage). */
export function getInitialLocale(pathname = '') {
  const fromUrl = getLocaleFromPathname(pathname);
  return fromUrl || DEFAULT_LOCALE;
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
    return withLocalePath(lang, rest || '/');
  }
  if (pathname.startsWith('/collaborator')) {
    const rest = pathname.slice('/collaborator'.length) || '';
    return withLocalePath(lang, rest || '/');
  }
  if (pathname === '/') return withLocalePath(lang, '/');
  return withLocalePath(lang, pathname);
}

export function resolveCollaboratorPrefix(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (locale) return `/${locale}`;
  if (pathname.startsWith('/landing/collaborator')) return '/landing/collaborator';
  if (pathname.startsWith('/collaborator')) return '/collaborator';
  return withLocalePath(getPreferredLocale());
}

export function resolveCandidatePrefix(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (locale) return `/${locale}/candidate`;
  if (pathname.startsWith('/landing/candidate')) return '/landing/candidate';
  if (pathname.startsWith('/candidate')) return '/candidate';
  return withLocalePath(getPreferredLocale(), '/candidate');
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
  if (isCandidatePublicPath(pathname)) {
    return `${resolveCandidatePrefix(pathname)}/jobs`;
  }
  return `${resolveCollaboratorPrefix(pathname)}/jobs`;
}

/**
 * URL public chia sẻ job cho ứng viên.
 * Mặc định: /{lang}/candidate/jobs/{slug|id}/view
 * Không dùng /collaborator/jobs/... (legacy, dễ thành /vi/collaborator/jobs/... — không có route).
 */
export function buildPublicShareJobUrl({
  jobId,
  slug,
  locale,
  persona = 'candidate',
  origin,
} = {}) {
  const lang = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const key = String(slug || '').trim() || String(jobId || '').trim();
  if (!key) return '';
  const encoded = encodeURIComponent(key);
  const path =
    persona === 'candidate'
      ? withLocalePath(lang, `/candidate/jobs/${encoded}/view`)
      : withLocalePath(lang, `/jobs/${encoded}`);
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://ws-jobshare.com');
  return `${String(base).replace(/\/+$/, '')}${path}`;
}

export function resolvePublicBlogPrefix(pathname) {
  if (isCandidatePublicPath(pathname)) {
    return resolveCandidatePrefix(pathname);
  }
  return resolveCollaboratorPrefix(pathname);
}

export function localizedPersonaHref(locale, persona) {
  const lang = isSupportedLocale(locale) ? locale : getPreferredLocale();
  if (persona === 'candidate') return withLocalePath(lang, '/candidate');
  if (persona === 'collaborator') return withLocalePath(lang, '/');
  return '/business';
}

export function legacyPublicRedirectPath(pathname, search = '', hash = '', persona = 'collaborator') {
  const lang = DEFAULT_LOCALE;
  let rest = pathname;

  if (pathname.startsWith('/landing/candidate')) {
    rest = pathname.slice('/landing/candidate'.length) || '';
    return `${withLocalePath(lang, `/candidate${rest}`)}${search}${hash}`;
  }
  if (pathname.startsWith('/candidate')) {
    rest = pathname.slice('/candidate'.length) || '';
    return `${withLocalePath(lang, `/candidate${rest}`)}${search}${hash}`;
  }
  if (pathname.startsWith('/landing/collaborator')) {
    rest = pathname.slice('/landing/collaborator'.length) || '';
    return `${withLocalePath(lang, rest || '/')}${search}${hash}`;
  }
  if (pathname.startsWith('/collaborator')) {
    rest = pathname.slice('/collaborator'.length) || '';
    return `${withLocalePath(lang, rest || '/')}${search}${hash}`;
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
  if (stripped === '/') return `https://ws-jobshare.com/${locale}/`;
  return `https://ws-jobshare.com/${locale}${stripped}`;
}
