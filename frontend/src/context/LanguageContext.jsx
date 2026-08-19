import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_LOCALE, getInitialLocale, isSupportedLocale } from '../utils/localeRoutes';

function createFallbackLanguageApi() {
  if (typeof window === 'undefined') {
    return { language: DEFAULT_LOCALE, changeLanguage: () => {}, syncFromUrl: () => {} };
  }
  return {
    language: getInitialLocale(window.location.pathname),
    changeLanguage: () => {},
    syncFromUrl: () => {},
  };
}

const LanguageContext = createContext(createFallbackLanguageApi());

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return getInitialLocale(window.location.pathname);
    }
    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    if (!isSupportedLocale(lang)) return;
    setLanguage(lang);
  }, []);

  const syncFromUrl = useCallback((lang) => {
    if (!isSupportedLocale(lang)) return;
    setLanguage(lang);
  }, []);

  const value = useMemo(
    () => ({ language, changeLanguage, syncFromUrl }),
    [language, changeLanguage, syncFromUrl],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

