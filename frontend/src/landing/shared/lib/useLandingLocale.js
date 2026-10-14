import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getLocaleFromPathname } from '../../../utils/localeRoutes';

const SUPPORTED = new Set(['vi', 'en', 'ja']);

/** Locale public landing (CTV, ứng viên, …) — ưu tiên segment URL `/{lang}/`. */
export function useLandingLocale() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const fromUrl = getLocaleFromPathname(pathname);
  const candidate = fromUrl || language || 'vi';
  return SUPPORTED.has(candidate) ? candidate : 'vi';
}
