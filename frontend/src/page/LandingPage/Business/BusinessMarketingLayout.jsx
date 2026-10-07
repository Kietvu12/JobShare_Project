import React, { useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { BusinessLandingProvider } from './BusinessLandingContext';
import BusinessLandingStyles from './BusinessLandingStyles';
import Header from './readycrew/components/layout/Header';
import Footer from './readycrew/components/layout/Footer';

/**
 * Header/footer landing JobShare Business cho các trang public ngoài /{lang}/business/*
 * (đăng ký, đăng nhập marketing, v.v.)
 */
export default function BusinessMarketingLayout({ children }) {
  const { language } = useLanguage();
  const basePath = useMemo(() => `/${language}/business`, [language]);

  return (
    <BusinessLandingProvider basePath={basePath}>
      <BusinessLandingStyles />
      <Header />
      {children}
      <Footer />
    </BusinessLandingProvider>
  );
}
