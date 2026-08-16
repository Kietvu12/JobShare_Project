import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

/** Build: node frontend/scripts/build-readycrew-landing-template.mjs && node frontend/scripts/build-readycrew-subpages.mjs */
const TEMPLATE_BASE = '/template/jobshare_business_landing';

const TEMPLATE_BY_SUBPATH = {
  '': `${TEMPLATE_BASE}/index.html`,
  '/about': `${TEMPLATE_BASE}/pages/about.html`,
  '/services': `${TEMPLATE_BASE}/pages/services.html`,
  '/seminar': `${TEMPLATE_BASE}/pages/seminar.html`,
  '/news': `${TEMPLATE_BASE}/pages/news.html`,
  '/news/sample': `${TEMPLATE_BASE}/pages/news-detail.html`,
};

const SEO = {
  vi: {
    title: 'JobShare Business | Nền tảng tuyển dụng & kết nối đối tác',
    description:
      'JobShare Business — nền tảng giúp doanh nghiệp quản lý tuyển dụng, JD, ứng viên và CTV trên một hệ thống thống nhất.',
  },
  en: {
    title: 'JobShare Business | Hiring & partner matching platform',
    description:
      'JobShare Business helps companies manage recruitment, job posts, candidates, and collaborators in one unified platform.',
  },
  ja: {
    title: 'JobShare Business | 採用・パートナーマッチングプラットフォーム',
    description:
      'JobShare Businessは、採用管理、JD、候補者、コラボレーターを一元管理できるプラットフォームです。',
  },
};

const SUBPATH_SEO = {
  '/about': {
    ja: { title: 'JobShare Businessとは | JobShare Business', description: 'JobShare Businessのサービス概要' },
  },
  '/services': {
    ja: { title: '各サービス | JobShare Business', description: 'JobShare Businessのサービス一覧' },
  },
  '/seminar': {
    ja: { title: 'セミナー・イベント | JobShare Business', description: 'JobShare Businessのセミナー・イベント' },
  },
  '/news': {
    ja: { title: 'ニュース | JobShare Business', description: 'JobShare Businessの最新ニュース' },
  },
  '/news/sample': {
    ja: { title: 'ニュース詳細 | JobShare Business', description: 'JobShare Businessのニュース記事' },
  },
};

function resolveBusinessSubpath(pathname) {
  if (pathname.startsWith('/landing/business')) {
    return pathname.slice('/landing/business'.length) || '';
  }
  const localeMatch = pathname.match(/^\/[^/]+\/business(\/.*)?$/);
  if (localeMatch) {
    return localeMatch[1] || '';
  }
  return '';
}

export default function BusinessLandingHome() {
  const { language } = useLanguage();
  const location = useLocation();
  const subpath = resolveBusinessSubpath(location.pathname);
  const templateSrc = TEMPLATE_BY_SUBPATH[subpath] || TEMPLATE_BY_SUBPATH[''];

  const meta = useMemo(() => {
    const subSeo = SUBPATH_SEO[subpath]?.[language] || SUBPATH_SEO[subpath]?.ja;
    if (subSeo) return subSeo;
    return SEO[language] || SEO.vi;
  }, [language, subpath]);

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

      <iframe
        key={templateSrc}
        title="JobShare Business Landing"
        src={templateSrc}
        className="fixed inset-0 block border-0"
        style={{ width: '100%', height: '100dvh' }}
      />
    </>
  );
}
