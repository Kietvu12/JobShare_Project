import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_LOCALE, getInitialLocale, isSupportedLocale } from '../utils/localeRoutes';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

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

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, syncFromUrl }}>
      {children}
    </LanguageContext.Provider>
  );
};

