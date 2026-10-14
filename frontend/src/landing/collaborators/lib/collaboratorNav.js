import { getLocaleFromPathname, resolveCandidatePrefix, withLocalePath } from '../../../utils/localeRoutes';

export function getCollaboratorHomePath(pathname) {
  const locale = getLocaleFromPathname(pathname) || 'vi';
  return withLocalePath(locale, '/');
}

export function buildCollaboratorNavLinks(pathname) {
  const locale = getLocaleFromPathname(pathname) || 'vi';
  const home = withLocalePath(locale, '/');
  return {
    home,
    jobs: withLocalePath(locale, '/collaborator/jobs'),
    about: withLocalePath(locale, '/collaborator/about-us'),
    faq: `${home}#faq`,
    news: `${home}#news`,
    partners: `${home}#partners`,
    guide: `${home}#guide`,
    blog: withLocalePath(locale, '/collaborator/blog'),
    login: withLocalePath(locale, '/collaborator/login'),
    register: withLocalePath(locale, '/collaborator/register'),
  };
}

export function isCollaboratorHomePath(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return false;
  const rest = pathname.replace(new RegExp(`^/${locale}/?$`), '');
  return rest === '' || rest === '/';
}

export function isCollaboratorNavActive(pathname, key) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return false;
  const stripped = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
  if (key === 'home') return stripped === '/' || stripped === '';
  if (key === 'jobs') return stripped === '/collaborator/jobs' || stripped.startsWith('/collaborator/jobs/');
  if (key === 'about') return stripped === '/collaborator/about-us';
  if (key === 'blog') return stripped === '/collaborator/blog' || stripped.startsWith('/collaborator/blog/');
  return false;
}

export function candidateBlogPrefix(pathname) {
  return resolveCandidatePrefix(pathname);
}
