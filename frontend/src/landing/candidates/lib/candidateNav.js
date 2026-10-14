import { getLocaleFromPathname, withLocalePath } from '../../../utils/localeRoutes';

export function getCandidateHomePath(pathname) {
  const locale = getLocaleFromPathname(pathname) || 'vi';
  return withLocalePath(locale, '/candidate');
}

export function buildCandidateNavLinks(pathname) {
  const locale = getLocaleFromPathname(pathname) || 'vi';
  const home = withLocalePath(locale, '/candidate');
  return {
    home,
    jobs: withLocalePath(locale, '/candidate/jobs'),
    profile: withLocalePath(locale, '/candidate/profile'),
    about: withLocalePath(locale, '/candidate/about-us'),
    why: `${home}#why`,
    partners: `${home}#partners`,
    guide: `${home}#guide`,
    blog: withLocalePath(locale, '/candidate/blog'),
    login: withLocalePath(locale, '/candidate/login'),
    register: withLocalePath(locale, '/candidate/register'),
  };
}

export function isCandidateHomePath(pathname) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return false;
  const rest = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
  return rest === '/candidate' || rest === '/candidate/';
}
