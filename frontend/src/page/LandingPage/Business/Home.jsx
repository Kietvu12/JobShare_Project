import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../../context/LanguageContext';

const TEMPLATE_SRC = '/template/jobshare_business_landing/index.html';

const SEO = {
  vi: {
    title: 'JobShare Business | Nền tảng quản lý tuyển dụng doanh nghiệp',
    description:
      'JobShare Business — quản lý JD, ứng viên, CTV và Scout trên một nền tảng. Tuyển dụng kỹ sư tại Nhật Bản hiệu quả hơn.',
  },
  en: {
    title: 'JobShare Business | Recruitment management platform',
    description:
      'JobShare Business helps companies manage job posts, candidates, collaborators, and Scout in one platform for efficient hiring in Japan.',
  },
  ja: {
    title: 'JobShare Business | 採用管理プラットフォーム',
    description:
      'JobShare Businessは、JD、候補者、コラボレーター、Scoutを一元管理できる採用プラットフォームです。',
  },
};

export default function BusinessLandingHome() {
  const { language } = useLanguage();
  const meta = SEO[language] || SEO.vi;

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.margin = '';
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/*
        Template i-web (採用管理システム) — build: node scripts/build-business-landing-template.mjs
        Scroll trong iframe; không auto-resize theo chiều cao nội dung.
      */}
      <iframe
        title="JobShare Business Landing"
        src={TEMPLATE_SRC}
        className="fixed inset-0 block border-0"
        style={{ width: '100%', height: '100dvh' }}
      />
    </>
  );
}
