import { useMemo } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { getBusinessLandingCopy } from '../i18n/businessLandingI18n';

export default function useBusinessLandingCopy() {
  const { language } = useLanguage();
  return useMemo(() => getBusinessLandingCopy(language), [language]);
}
