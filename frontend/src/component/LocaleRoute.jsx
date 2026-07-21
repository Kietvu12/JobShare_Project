import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  legacyPublicRedirectPath,
  stripLocaleFromPathname,
} from '../utils/localeRoutes';

export function LocaleSync({ urlLocale }) {
  const { language, syncFromUrl } = useLanguage();

  useEffect(() => {
    if (urlLocale && urlLocale !== language) {
      syncFromUrl(urlLocale);
    }
  }, [urlLocale, language, syncFromUrl]);

  return null;
}

export function LocaleGuard() {
  const { lang } = useParams();
  const location = useLocation();

  if (!isSupportedLocale(lang)) {
    const rest = stripLocaleFromPathname(location.pathname);
    const target = rest === '/' ? `/${DEFAULT_LOCALE}/` : `/${DEFAULT_LOCALE}${rest}`;
    return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
  }

  return (
    <>
      <LocaleSync urlLocale={lang} />
      <Outlet />
    </>
  );
}

export function PublicRootRedirect() {
  if (typeof window !== 'undefined' && /^admin\./i.test(window.location.hostname)) {
    return <Navigate to="/admin" replace />;
  }

  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  if (token && userType === 'ctv') return <Navigate to="/agent" replace />;
  if (token && userType === 'admin') return <Navigate to="/admin" replace />;

  return <Navigate to={`/${DEFAULT_LOCALE}/`} replace />;
}

export function LegacyPublicRedirect({ persona = 'collaborator' }) {
  const location = useLocation();
  const target = legacyPublicRedirectPath(location.pathname, location.search, location.hash, persona);
  return <Navigate to={target} replace />;
}

/** /{lang}/collaborator/jobs/:id → /{lang}/jobs/:id (link copy cũ / sai cấu trúc) */
export function LegacyLocaleCollaboratorJobRedirect() {
  const { lang, jobId } = useParams();
  const location = useLocation();
  const safeLang = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  return (
    <Navigate
      to={`/${safeLang}/jobs/${jobId}${location.search}${location.hash}`}
      replace
    />
  );
}
