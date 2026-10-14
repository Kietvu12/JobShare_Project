/**
 * Chuyển giữa landing Cộng tác viên (/{lang}/), ứng viên và doanh nghiệp.
 */

import { getLocaleFromPathname, withLocalePath, DEFAULT_LOCALE } from './localeRoutes';

/**
 * @param {string} pathname
 * @returns {{ base: string, role: 'collaborator'|'candidate'|'business', rest: string } | null}
 */
export function getLandingPersonaContext(pathname) {
  const raw = pathname || '/';
  const p = raw.replace(/\/+$/, '') || '/';
  const locale = getLocaleFromPathname(p);
  const ordered = [
    ['/landing/candidate', 'candidate'],
    ['/landing/collaborator', 'collaborator'],
    ['/landing/business', 'business'],
    ['/candidate', 'candidate'],
    ['/collaborator', 'collaborator'],
    ['/business', 'business'],
  ];
  for (const [base, role] of ordered) {
    if (p === base || p.startsWith(`${base}/`)) {
      const rest = p === base ? '' : p.slice(base.length);
      return { base, role, rest };
    }
  }
  if (locale) {
    const rest = p.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '';
    if (rest === '' || rest === '/') return { base: `/${locale}`, role: 'collaborator', rest: '' };
    if (rest.startsWith('/candidate')) {
      return { base: `/${locale}/candidate`, role: 'candidate', rest: rest.slice('/candidate'.length) };
    }
    if (rest.startsWith('/business')) {
      return { base: `/${locale}/business`, role: 'business', rest: rest.slice('/business'.length) };
    }
    if (rest.startsWith('/collaborator')) {
      return {
        base: `/${locale}/collaborator`,
        role: 'collaborator',
        rest: rest.slice('/collaborator'.length),
      };
    }
    if (rest === '/jobs' || rest.startsWith('/jobs/')) {
      return { base: `/${locale}/collaborator`, role: 'collaborator', rest };
    }
  }
  return null;
}

function hrefForPublicJobsPersona(locale, targetRole, rest) {
  if (!/^\/jobs(\/|$)/.test(rest)) return null;
  if (targetRole === 'candidate') {
    return `${withLocalePath(locale, '/candidate')}${rest}`;
  }
  if (targetRole === 'collaborator') {
    return `${withLocalePath(locale, '/collaborator')}${rest}`;
  }
  return null;
}

function hrefForPublicAboutPersona(locale, targetRole, rest) {
  if (rest !== '/about-us' && !rest.startsWith('/about-us/')) return null;
  if (targetRole === 'candidate') {
    return withLocalePath(locale, '/candidate/about-us');
  }
  if (targetRole === 'collaborator') {
    return withLocalePath(locale, '/collaborator/about-us');
  }
  return withLocalePath(locale, '/business/about-us');
}

function personaBasePath(role, locale) {
  const lang = locale || DEFAULT_LOCALE;
  if (role === 'candidate') return withLocalePath(lang, '/candidate');
  if (role === 'business') return withLocalePath(lang, '/business');
  return withLocalePath(lang, '/');
}

/**
 * @param {string} pathname
 * @param {'collaborator'|'candidate'|'business'} targetRole
 */
export function hrefForLandingPersona(pathname, targetRole) {
  const ctx = getLandingPersonaContext(pathname);
  const locale = getLocaleFromPathname(pathname) || DEFAULT_LOCALE;

  if (!ctx) {
    return personaBasePath(targetRole, locale);
  }
  if (ctx.role === targetRole) {
    return `${ctx.base}${ctx.rest || ''}` || ctx.base;
  }

  let rest = ctx.rest;
  if (ctx.role === 'candidate' && targetRole !== 'candidate') {
    if (/^\/(login|register)(\/|$)/.test(rest)) rest = '';
    else if (/^\/profile(\/|$)/.test(rest)) rest = '';
    else if (/^\/nominations\//.test(rest)) rest = '';
    else if (/^\/jobs/.test(rest)) {
      if (targetRole === 'collaborator') rest = '/jobs';
      else rest = '';
    }
  }
  if (ctx.role === 'collaborator' && targetRole !== 'collaborator') {
    if (/^\/(login|register)(\/|$)/.test(rest)) rest = '';
  }
  if (ctx.role === 'business' && targetRole !== 'business') {
    rest = '';
  }

  const jobsHref = hrefForPublicJobsPersona(locale, targetRole, rest);
  if (jobsHref) return jobsHref;

  const aboutHref = hrefForPublicAboutPersona(locale, targetRole, rest);
  if (aboutHref) return aboutHref;

  const otherBase = personaBasePath(targetRole, locale);
  const path = `${otherBase}${rest || ''}`;
  return path || otherBase;
}
