import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { getLandingPageBuilderCopy } from '../i18n/businessAppI18n';
import {
  normalizeEditorContentLocale,
  setEditorContentLocale,
} from '../utils/landingPageEditorContentLocale';

const LandingPageEditorUiContext = createContext(null);

export function LandingPageEditorUiProvider({ children }) {
  const { language } = useLanguage();
  const contentLocale = normalizeEditorContentLocale(language);
  const copy = useMemo(() => getLandingPageBuilderCopy(language), [language]);
  useEffect(() => {
    setEditorContentLocale(contentLocale);
  }, [contentLocale]);
  return (
    <LandingPageEditorUiContext.Provider value={copy}>
      {children}
    </LandingPageEditorUiContext.Provider>
  );
}

/** Copy UI builder/editor landing page (VI / EN / JA) */
export function useLandingPageEditorUi() {
  const ctx = useContext(LandingPageEditorUiContext);
  return ctx || getLandingPageBuilderCopy('vi');
}
