import { getLocaleFromPathname } from '../../../utils/localeRoutes';

export const DEFAULT_BUSINESS_LANDING_BASE = '/landing/business';

export function resolveBusinessLandingBase(pathname = '') {
  const path = String(pathname || '');
  if (path.startsWith('/landing/business')) return '/landing/business';
  const locale = getLocaleFromPathname(path);
  if (locale && (path === `/${locale}/business` || path.startsWith(`/${locale}/business/`))) {
    return `/${locale}/business`;
  }
  return DEFAULT_BUSINESS_LANDING_BASE;
}

export function stripBusinessLandingBase(pathname, base = DEFAULT_BUSINESS_LANDING_BASE) {
  if (!pathname.startsWith(base)) return pathname;
  const rest = pathname.slice(base.length) || '/';
  return rest.startsWith('/') ? rest : `/${rest}`;
}

export function toBusinessLandingPath(relativePath, base = DEFAULT_BUSINESS_LANDING_BASE) {
  if (!relativePath || relativePath === '/') return base;
  const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${normalized}`;
}

export function normalizeInternalPath(path) {
  return String(path || '').replace(/\/+$/, '') || '/';
}
