import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getBusinessAppCopy } from '../i18n/businessAppI18n';

export default function useBusinessAppCopy() {
  const { language } = useLanguage();
  return useMemo(() => getBusinessAppCopy(language), [language]);
}
