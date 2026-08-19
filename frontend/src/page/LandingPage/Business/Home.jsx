import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../context/LanguageContext';
import BusinessLandingLayout from './components/BusinessLandingLayout';
import { A, FONT_STACK, ArrowSvg, TelIcon, BtnArrow } from './components/businessShared.jsx';
import useBusinessLandingCopy from './hooks/useBusinessLandingCopy';
import conversionCharImg from '../../../assets/char.jpg';

/** Build: node frontend/scripts/build-readycrew-landing-template.mjs && node frontend/scripts/build-readycrew-subpages.mjs */
const TEMPLATE_BASE = '/template/jobshare_business_landing';

const TEMPLATE_BY_SUBPATH = {
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
    en: { title: 'About JobShare Business | JobShare Business', description: 'Overview of JobShare Business services' },
    vi: { title: 'Giới thiệu JobShare Business | JobShare Business', description: 'Tổng quan dịch vụ JobShare Business' },
  },
  '/services': {
    ja: { title: '各サービス | JobShare Business', description: 'JobShare Businessのサービス一覧' },
    en: { title: 'Services | JobShare Business', description: 'JobShare Business service list' },
    vi: { title: 'Dịch vụ | JobShare Business', description: 'Danh sách dịch vụ JobShare Business' },
  },
  '/seminar': {
    ja: { title: 'セミナー・イベント | JobShare Business', description: 'JobShare Businessのセミナー・イベント' },
    en: { title: 'Seminars & Events | JobShare Business', description: 'JobShare Business seminars and events' },
    vi: { title: 'Seminar & Sự kiện | JobShare Business', description: 'Seminar và sự kiện JobShare Business' },
  },
  '/news': {
    ja: { title: 'ニュース | JobShare Business', description: 'JobShare Businessの最新ニュース' },
    en: { title: 'News | JobShare Business', description: 'Latest JobShare Business news' },
    vi: { title: 'Tin tức | JobShare Business', description: 'Tin tức mới nhất JobShare Business' },
  },
  '/news/sample': {
    ja: { title: 'ニュース詳細 | JobShare Business', description: 'JobShare Businessのニュース記事' },
    en: { title: 'News detail | JobShare Business', description: 'JobShare Business news article' },
    vi: { title: 'Chi tiết tin tức | JobShare Business', description: 'Bài viết tin tức JobShare Business' },
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

/* ------------------------------------------------------------------ */
/*  Tokens & data                                                      */
/* ------------------------------------------------------------------ */
function MultilineText({ text, className = '' }) {
  const lines = text.split('\n');
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </span>
  );
}

const PARTNER_ROW_1 = [
  { src: 'partner-1.png', alt: 'Link Trust' },
  { src: 'partner-2.png', alt: 'Koyo Engineering' },
  { src: 'partner-3.png', alt: 'EXEO Engineering' },
  { src: 'partner-4.png', alt: 'TechnoPro Construction' },
  { src: 'partner-5.png', alt: 'Nuvoton' },
  { src: 'partner-6.png', alt: 'TechnoPro Design' },
  { src: 'partner-7.png', alt: 'TechnoPro IT' },
  { src: 'partner-8.png', alt: 'ACA Next' },
  { src: 'partner-9.png', alt: 'GMO-Z.com' },
];

const PARTNER_ROW_2 = [
  { src: 'partner-10.png', alt: 'Rakus' },
  { src: 'partner-11.png', alt: 'Brexa Technology' },
  { src: 'partner-12.png', alt: 'B-Next Technologies' },
  { src: 'partner-13.png', alt: 'Staff Service Engineering' },
  { src: 'partner-14.png', alt: 'Quest Global' },
  { src: 'partner-15.png', alt: 'Persol Excel HR Partners' },
  { src: 'partner-16.png', alt: 'Meitec Fielders' },
  { src: 'partner-17.png', alt: 'Unlock Design' },
  { src: 'partner-18.png', alt: 'VMO Japan' },
];

/* ------------------------------------------------------------------ */
/*  UI helpers                                                         */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, y = 26, className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ children, className = '' }) {
  return (
    <h2
      className={`relative pb-5 text-[24px] lg:text-[28px] xl:text-[38px] font-black text-[#282c32] leading-[1.4] border-b-[3px] border-[#d3d6d8] after:content-[''] after:absolute after:bottom-[-3px] after:left-0 after:h-[3px] after:w-5 lg:after:w-10 after:bg-[#0576b6] ${className}`}
    >
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useBusinessLandingCopy();
  const { language } = useLanguage();
  const isJa = language === 'ja';

  return (
    <section>
      <div className="bg-[#0576b6] px-[5vw] xl:px-[8vw] pt-[100px] xl:pt-[133px] overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative flex flex-col lg:flex-row lg:items-end lg:gap-6 xl:block pb-8 lg:pb-16 xl:pb-0 min-h-0 xl:min-h-[569px]">
          <div className="relative z-10 w-full lg:flex-1 lg:min-w-0 xl:max-w-[52%] xl:pb-[150px]">
            <p
              className={
                isJa
                  ? 'text-white text-[17px] lg:text-[18px] xl:text-[34px] font-black leading-[1.4] tracking-[0.02em] mb-2.5'
                  : 'text-white/90 text-[13px] lg:text-[13px] xl:text-[16px] font-bold leading-[1.5] tracking-[0.06em] uppercase mb-3 xl:mb-4'
              }
            >
              {t.hero.sub}
            </p>
            <h2
              className={`font-black text-white tracking-[0.02em] mb-3 ${
                isJa
                  ? 'text-[28px] lg:text-[24px] xl:text-[42px] 2xl:text-[52px] leading-[1.38] xl:leading-[1.32]'
                  : 'text-[26px] sm:text-[30px] lg:text-[24px] xl:text-[40px] 2xl:text-[44px] leading-[1.28] xl:leading-[1.24] max-w-[640px]'
              }`}
            >
              {t.hero.titleLine1}
              <br />
              {t.hero.titleLine2}
            </h2>
            <p className="text-white text-[13px] lg:text-[13px] xl:text-[15px] leading-[1.7] xl:leading-[1.75] font-medium max-w-[560px] mt-2.5 xl:mt-3 mb-4 xl:mb-6 opacity-95">
              {t.hero.desc}
            </p>
            <div className="relative z-20 flex flex-wrap gap-2.5 xl:gap-4 max-w-[610px]">
              <a href="/business/register" className="flex-1 min-w-[110px] sm:min-w-[120px] rounded-[4px] bg-[#373c47] border-2 border-[#373c47] text-white px-3 xl:px-5 py-2.5 xl:py-3 text-center font-extrabold text-[10px] lg:text-[11px] xl:text-[13px] leading-[1.45] hover:bg-transparent hover:border-white transition-colors">
                <MultilineText text={t.hero.ctaDownload} />
              </a>
              <a href="/business/register" className="flex-1 min-w-[110px] sm:min-w-[120px] rounded-[4px] bg-white border-2 border-white text-[#0576b6] px-3 xl:px-5 py-2.5 xl:py-3 text-center font-extrabold text-[10px] lg:text-[11px] xl:text-[13px] leading-[1.45] hover:bg-transparent hover:border-white hover:text-white transition-colors">
                <MultilineText text={t.hero.ctaRegister} />
              </a>
              <a href="/business/login" className="flex-1 min-w-[110px] sm:min-w-[120px] rounded-[4px] bg-white border-2 border-white text-[#0576b6] px-3 xl:px-5 py-2.5 xl:py-3 text-center font-extrabold text-[10px] lg:text-[11px] xl:text-[13px] leading-[1.45] hover:bg-[#0576b6] hover:border-[#0576b6] hover:text-white transition-colors">
                <MultilineText text={t.hero.ctaConsult} />
              </a>
            </div>
          </div>

          <div className="hidden lg:flex relative z-0 lg:flex-1 lg:justify-end lg:max-w-[46%] xl:max-w-none xl:block mt-0 w-full shrink-0 pointer-events-none xl:absolute xl:bottom-0 xl:right-0 xl:w-[min(48%,576px)]">
            <img src={`${A}hero_bg_icon.png`} alt={t.hero.visualAlt} className="block w-full h-auto max-h-[360px] lg:max-h-[420px] xl:max-h-[620px] object-contain object-bottom ml-auto" />
          </div>
        </div>
      </div>

      <div className="relative px-[5vw] xl:px-[8vw] pt-0 xl:pt-[72px] pb-2 xl:pb-0 bg-white">
        <div className="max-w-[1200px] mx-auto relative min-h-0 xl:min-h-[56px]">
          <img
            src={`${A}hero_icon_JP.png`}
            alt={t.hero.badgeAlt}
            className="block w-full h-auto left-0 z-[1] max-w-[260px] sm:max-w-[300px] lg:max-w-[360px] -mt-5 sm:-mt-6 lg:-mt-10 mx-auto lg:mx-0 xl:absolute xl:top-[-158px] min-[1440px]:top-[-170px] xl:max-w-[min(100%,580px)] xl:mt-0 pointer-events-none"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Partner marquee                                                    */
/* ------------------------------------------------------------------ */
function MarqueeRow({ logos, reverse = false }) {
  const items = [...logos, ...logos];
  return (
    <div className="relative overflow-hidden w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 lg:w-24 bg-gradient-to-r from-[#fcf8f7] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 lg:w-24 bg-gradient-to-l from-[#fcf8f7] to-transparent" />
      <div
        className="bl-marquee"
        style={{
          animationDirection: reverse ? 'reverse' : 'normal',
          animationDuration: reverse ? '36s' : '42s',
        }}
      >
        {items.map((logo, i) => (
          <div key={`${logo.src}-${i}`} className="flex-[0_0_auto] w-[170px] h-[76px] rounded-lg flex items-center justify-center p-2">
            <img src={`${A}${logo.src}`} alt={logo.alt} title={logo.alt} loading="lazy" decoding="async" className="w-full h-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerMarquee() {
  const { t } = useBusinessLandingCopy();
  return (
    <section className="px-[1.389vw] lg:px-[1.389vw] xl:-mt-6">
      <div className="mt-10 lg:mt-10 pt-[38px] lg:pt-[60px] pb-[38px] lg:pb-[60px]">
        <div className="flex flex-col gap-3 w-full">
          <MarqueeRow logos={PARTNER_ROW_1} />
          <MarqueeRow logos={PARTNER_ROW_2} reverse />
        </div>
      </div>
      <div className="mt-10 lg:mt-10 px-[6.667vw] lg:px-0">
        <div className="max-w-[1240px] mx-auto border-b border-[#d3d6d8] pb-[40px] lg:pb-[50px]">
          <h2 className="text-center font-black text-[18px] lg:text-[22px] xl:text-[28px] leading-[1.4] text-[#282c32]">
            {t.partners.titleLine1}
            <br />
            {t.partners.titleLine2}
          </h2>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Appeal + video                                                     */
/* ------------------------------------------------------------------ */
const APPEAL_VIDEO_ID = 'XsEwp-u3iHA';

function AppealPlayButton() {
  return (
    <div className="bl-appeal-play">
      <div className="bl-appeal-play__inner">
        <div className="bl-appeal-play__arrow bl-appeal-play__arrow--first" />
        <div className="bl-appeal-play__arrow bl-appeal-play__arrow--second" />
      </div>
    </div>
  );
}

function AppealMarqueeItem() {
  return (
    <p className="bl-appeal-marquee__text flex flex-nowrap shrink-0 mr-[30px] mb-0">
      <span className="bl-appeal-marquee__text-en">JobShare</span>
      <span className="bl-appeal-marquee__text-jp">Business</span>
    </p>
  );
}

function AppealSection() {
  const { t } = useBusinessLandingCopy();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const isJa = language === 'ja';

  return (
    <section className="bl-appeal">
      <div className="bl-appeal__contents">
        <div className={`bl-appeal__text-area${isJa ? '' : ' bl-appeal__text-area--locale'}`}>
          <h2 className={`bl-appeal__main-text${isJa ? '' : ' bl-appeal__main-text--locale'}`}>
            <span className="text-[#0576b6]">
              {t.appeal.titleLine1}
              <br />
              {t.appeal.titleLine2}
            </span>
          </h2>
          <p className="bl-appeal__desc">{t.appeal.desc}</p>
          <a href="/business/register" className="bl-appeal__button">
            {t.appeal.cta}
            <span className="bl-appeal__button-arrow" aria-hidden />
          </a>
        </div>

        <div className="bl-appeal__movie-area">
          <div className="bl-appeal-movie group" role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}>
            <div className="bl-appeal-movie__main-area">
              <div className="bl-appeal-movie__first">
                <div className="bl-appeal-movie__first-thumbnail">
                  <img
                    className="bl-appeal-movie__first-thumbnail-body"
                    src={`${A}261ebbfa0a9b7a7519aa0ec225c75ad2.jpg`}
                    alt={t.appeal.videoTitle}
                    loading="lazy"
                  />
                </div>
                <AppealPlayButton />
              </div>
            </div>
            <div className="bl-appeal-movie__thumbnail-area">
              <span className="bl-appeal-movie__badge">{t.appeal.cmBadge}</span>
            </div>
          </div>
        </div>
      </div>

      {isJa && (
      <div className="bl-appeal-marquee" aria-hidden>
        <div className="bl-appeal-marquee__body">
          <AppealMarqueeItem />
          <AppealMarqueeItem />
          <AppealMarqueeItem />
          <AppealMarqueeItem />
        </div>
      </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-[860px] aspect-video bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${APPEAL_VIDEO_ID}?autoplay=1&rel=0`}
                title={t.appeal.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Proposal — 4 services                                              */
/* ------------------------------------------------------------------ */
function ProposalSection() {
  const { t, services } = useBusinessLandingCopy();
  return (
    <section className="px-[5vw]">
      <div className="max-w-[1120px] mx-auto">
        <Reveal>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            <h2 className="text-center lg:text-left font-black text-[24px] lg:text-[28px] xl:text-[36px] leading-[1.4] text-[#282c32]">
              {t.proposal.titleLine1}
              <br />
              <span className="text-[#0576b6]">{t.proposal.titleHighlight}</span>
              {t.proposal.titleLine2 ? (
                <>
                  <br />
                  {t.proposal.titleLine2}
                </>
              ) : null}
            </h2>
            <a href="/business/register" className="inline-flex items-center gap-3 rounded-[4px] border-2 border-[#b5b7b9] text-[#282c32] px-6 py-3 font-extrabold text-[14px] hover:bg-[#0576b6] hover:border-[#0576b6] hover:text-white transition-colors shrink-0">
              {t.proposal.viewAll}
              <BtnArrow />
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[960px] mx-auto">
          {services.map((svc, i) => (
            <Reveal key={svc.subject} delay={i * 0.08}>
              <a href={svc.href} className="group block h-full">
                <div className="bg-[#fcf8f7] rounded-lg h-[230px] lg:h-[285px] relative flex flex-wrap justify-center items-start pt-[65px] lg:pt-[82px] px-6 transition-transform duration-500 group-hover:-translate-y-1">
                  <img src={`${A}${svc.icon}`} alt="" className="h-20 lg:h-24 object-contain mb-4" />
                  <div className="w-full text-center">
                    <h3 className="text-[#0576b6] font-bold text-[18px] lg:text-[22px] xl:text-[34px] leading-[1.2]">{svc.subject}</h3>
                    <p className="text-[12px] lg:text-[14px] xl:text-[16px] font-black text-[#282c32] mt-[5px]">{svc.jp}</p>
                  </div>
                </div>
                <ol className="mt-5 space-y-1.5 pl-5">
                  {svc.tags.map((tag) => (
                    <li key={tag} className="flex items-start gap-2 text-[13px] lg:text-[14px] font-medium text-[#282c32] leading-relaxed">
                      <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#0576b6] shrink-0" />
                      {tag}
                    </li>
                  ))}
                </ol>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Reason                                                             */
/* ------------------------------------------------------------------ */
function ReasonSection() {
  const { t, reasons } = useBusinessLandingCopy();
  return (
    <section className="px-[5vw] mt-20 lg:mt-28">
      <div className="max-w-[1120px] mx-auto">
        <Reveal>
          <h2 className="o-heading-left relative pb-5 text-[24px] lg:text-[28px] xl:text-[38px] font-black text-[#282c32] leading-[1.4] border-b-[3px] border-[#d3d6d8]">
            {t.reason.titlePrefix}
            <span className="text-[#0576b6]">{t.reason.titleHighlight}</span>
          </h2>
        </Reveal>
        <div className="mt-6">
          {reasons.map((r, i) => (
            <Reveal key={r.num} delay={i * 0.05}>
              <div className="flex flex-wrap items-center justify-between gap-8 border-b border-[#d3d6d8] py-10 lg:py-[50px]">
                <div className="w-full xl:w-[54%]">
                  <p className="text-[#0576b6] font-black text-[48px] lg:text-[48px] xl:text-[64px] leading-none">{r.num}</p>
                  <h3 className="mt-4 font-black text-[20px] lg:text-[24px] xl:text-[30px] leading-[1.4] text-[#282c32]">
                    <span className="text-[#0576b6]">{r.highlight}</span>
                    <br />
                    {r.rest}
                  </h3>
                  <p className="mt-4 text-[12px] lg:text-[14px] xl:text-[16px] font-medium leading-[1.8] lg:leading-[2] text-[#282c32]/55">{r.desc}</p>
                  <a
                    href="/business/register"
                    className="mt-6 inline-flex rounded-[4px] bg-[#0576b6] border-2 border-[#0576b6] text-white px-7 py-3 font-extrabold text-[14px] hover:bg-white hover:text-[#0576b6] transition-colors"
                  >
                    {t.reason.cta}
                  </a>
                </div>
                <div className="w-full xl:w-[42%]">
                  <img src={`${A}${r.img}`} alt="" loading="lazy" className="w-full h-auto" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Conversion banner                                                  */
/* ------------------------------------------------------------------ */
function ConversionBanner() {
  const { t } = useBusinessLandingCopy();
  return (
    <section className="px-[5vw] mt-20 lg:mt-28">
      <Reveal>
        <div className="max-w-[1070px] mx-auto bg-[#0576b6] rounded-[4px] relative overflow-hidden min-h-[260px] lg:min-h-[300px]">
          <img
            src={conversionCharImg}
            alt=""
            aria-hidden
            className="absolute right-0 bottom-0 z-[1] h-[92%] lg:h-full max-h-[300px] lg:max-h-[360px] w-auto object-contain object-bottom pointer-events-none select-none"
          />
          <div className="relative z-[2] px-[8vw] lg:px-[7%] py-[56px] lg:py-[72px]">
            <div className="max-w-[520px]">
              <p className="inline-block lg:block text-center rounded-[20px] bg-white text-[#0576b6] font-black text-[12px] lg:text-[15px] xl:text-[18px] leading-[1.2] px-5 py-3 lg:py-0 lg:px-0 lg:leading-[36px] xl:leading-[40px]">
                {t.conversion.badge}
              </p>
              <p className="mt-4 font-black text-white text-[18px] lg:text-[18px] xl:text-[21px] leading-[1.4] tracking-[0.02em]">
                {t.conversion.titleLine1}
                <br />
                {t.conversion.titleLine2}
              </p>
              <a
                href="/business/register"
                className="mt-6 inline-flex rounded-[4px] bg-white border-2 border-white text-[#0576b6] px-8 py-3.5 font-extrabold text-[14px] hover:bg-transparent hover:text-white transition-colors"
              >
                {t.conversion.cta}
              </a>
              <div className="mt-5">
                <a href="#" className="inline-flex items-center gap-1.5 underline text-white text-[13px]">
                  <ArrowSvg white />
                  {t.conversion.vendorLink}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Flow                                                               */
/* ------------------------------------------------------------------ */
function FlowSection() {
  const { t, flowSteps } = useBusinessLandingCopy();
  return (
    <section className="px-[5vw] mt-20 lg:mt-28">
      <div className="max-w-[1120px] mx-auto">
        <Reveal>
          <h2 className="o-heading-left relative pb-5 text-[24px] lg:text-[28px] xl:text-[38px] font-black text-[#282c32] leading-[1.4] border-b-[3px] border-[#d3d6d8]">
            {t.flow.title}
            <span className="hidden xl:inline">{t.flow.titleSub}</span>
            <span className="block xl:hidden mt-2 text-[16px] lg:text-[16px] xl:text-[18px] font-bold leading-[1.5] text-[#282c32]/70">{t.flow.titleSub}</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-[30px]">
          {flowSteps.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.05}>
              <div className={`border border-[#d3d6d8] rounded-[6px] p-[3.472vw] lg:p-8 xl:p-[42px_50px_50px_50px] grid grid-cols-1 xl:grid-cols-[190px_1fr] gap-8 xl:gap-x-12 ${i === flowSteps.length - 1 ? 'rounded-b-none' : ''}`}>
                <div className="w-[165px] h-[165px] lg:w-[190px] lg:h-[190px] mx-auto lg:mx-0 rounded-full bg-[#0576b6] flex items-center justify-center relative">
                  <img src={`${A}${s.img}`} alt={s.alt} loading="lazy" className="w-[78%] h-[78%] object-contain" />
                </div>
                <div>
                  <p className="text-[#0576b6] font-black text-[15px] tracking-[0.1em]">{s.step}</p>
                  <h3 className="font-black text-[18px] lg:text-[22px] xl:text-[26px] leading-[1.2] lg:leading-none text-[#282c32] border-b border-[#d3d6d8] pb-5 mb-5">{s.title}</h3>
                  <p className="text-[15px] lg:text-[14px] xl:text-[16px] font-medium leading-[1.7] text-[#282c32]/85 whitespace-pre-line">{s.desc}</p>
                  {s.cta && (
                    <a
                      href="/business/register"
                      className="mt-6 inline-flex rounded-[4px] bg-[#0576b6] border-2 border-[#0576b6] text-white px-7 py-3 font-extrabold text-[14px] hover:bg-white hover:text-[#0576b6] transition-colors"
                    >
                      {t.flow.cta}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="bg-[#0576b6] rounded-b-[6px] px-[3vw] py-[30px] xl:py-[45px] flex flex-wrap xl:flex-nowrap items-center justify-center xl:justify-between gap-4 xl:gap-6">
            <p className="text-white font-bold text-[16px] lg:text-[15px] xl:text-[20px] leading-[1.6] flex-1 basis-[280px] max-w-[420px] xl:text-left text-center">
              {t.flow.footerText}
            </p>
            <div className="flex flex-wrap sm:flex-nowrap items-stretch justify-center gap-3 lg:gap-[11px] shrink-0 w-full sm:w-auto">
              <a href="/business/register" className="rounded-[4px] bg-white border-2 border-white text-[#0576b6] px-6 py-3 text-center font-extrabold text-[13px] leading-[1.45] hover:bg-transparent hover:text-white transition-colors shrink-0 min-w-[140px] lg:min-w-[180px]">
                <MultilineText text={t.flow.footerRegister} />
              </a>
              <a href="/business/register" className="rounded-[4px] bg-[#373c47] border-2 border-[#373c47] text-white px-6 py-3 text-center font-extrabold text-[13px] leading-[1.45] hover:bg-transparent hover:border-white transition-colors shrink-0 min-w-[140px] lg:min-w-[180px]">
                <MultilineText text={t.flow.footerDownload} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  News                                                               */
/* ------------------------------------------------------------------ */
function NewsSection() {
  const { t } = useBusinessLandingCopy();
  return (
    <section className="px-[5vw] mt-20 lg:mt-28">
      <div className="max-w-[1120px] mx-auto">
        <Reveal>
          <h2 className="o-heading-left relative pb-5 text-[24px] lg:text-[28px] xl:text-[38px] font-black text-[#282c32] leading-[1.4] border-b-[3px] border-[#d3d6d8]">{t.news.title}</h2>
        </Reveal>
        <div className="mt-8">
          {t.news.items.map((n, i) => (
            <Reveal key={n.date + i} delay={i * 0.03}>
              <a href="#" className="group flex flex-wrap items-center gap-x-6 gap-y-2 py-4 border-b border-[#d3d6d8]">
                <p className="text-[16px] lg:text-[16px] xl:text-[19px] font-semibold leading-[1.4] text-[#0576b6] w-[96px]">{n.date}</p>
                <p className="text-[10px] lg:text-[12px] xl:text-[13px] font-bold text-white bg-[#374149] rounded-[2em] text-center px-[1.5em] py-[0.5em] lg:w-[118px]">{t.news.category}</p>
                <p className="flex-1 min-w-[220px] font-bold text-[14px] lg:text-[15px] xl:text-[16px] leading-[1.4] text-[#0576b6]">
                  {n.title}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-10 text-center">
            <a href="#" className="inline-flex items-center gap-3 rounded-[4px] border-2 border-[#b5b7b9] text-[#282c32] px-8 py-3.5 font-extrabold text-[14px] hover:bg-[#0576b6] hover:border-[#0576b6] hover:text-white transition-colors">
              {t.news.viewAll}
              <BtnArrow />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
function FaqSection() {
  const { t } = useBusinessLandingCopy();
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section className="px-[5vw] mt-20 lg:mt-28">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <h2 className="o-heading-left relative pb-5 text-[24px] lg:text-[28px] xl:text-[38px] font-black text-[#282c32] leading-[1.4] border-b-[3px] border-[#d3d6d8]">
            {t.faq.title}
            <span className="hidden xl:inline">{t.faq.titleSub}</span>
            <span className="block xl:hidden mt-2 text-[16px] lg:text-[16px] xl:text-[18px] font-bold leading-[1.5] text-[#282c32]/70">{t.faq.titleSub}</span>
          </h2>
        </Reveal>
        <div className="mt-8">
          {t.faq.items.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <Reveal key={f.q} delay={i * 0.03}>
                <div className="border-b border-[#d3d6d8] py-5">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-start gap-3 text-left cursor-pointer"
                  >
                    <span className="text-[#0576b6] font-black text-[27px] lg:text-[36px] xl:text-[44px] leading-none">Q.</span>
                    <span className="flex-1 font-black text-[16px] lg:text-[20px] xl:text-[28px] leading-[1.4] text-[#282c32]">{f.q}</span>
                    <span className={`mt-1 w-6 h-6 shrink-0 relative transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <span className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#0576b6] -translate-y-1/2" />
                      <span className={`absolute top-0 bottom-0 left-1/2 w-[2px] bg-[#0576b6] -translate-x-1/2 transition-transform ${isOpen ? 'scale-y-0' : ''}`} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pl-[40px] lg:pl-[56px] pt-4 text-[13px] lg:text-[14px] xl:text-[16px] font-medium leading-[1.7] text-[#282c32]/60 whitespace-pre-line">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer top CTA                                                     */
/* ------------------------------------------------------------------ */
function FooterTopCta() {
  const { t } = useBusinessLandingCopy();
  return (
    <section className="mt-20 lg:mt-28 px-[5vw]">
      <div className="max-w-[1240px] mx-auto">
        <div className="bg-[#0576b6] rounded-t-[12px] relative overflow-hidden min-h-[380px] xl:min-h-[550px]">
          <div className="xl:hidden px-[6vw] pt-8 pb-0 flex justify-center">
            <img src={conversionCharImg} alt={t.footerCta.ambassadorAlt} loading="lazy" className="w-full max-w-[320px] h-auto object-contain" />
          </div>
          <div className="hidden xl:block absolute bottom-0 left-0 z-[2] w-[42%] max-w-[480px]">
            <img src={conversionCharImg} alt={t.footerCta.ambassadorAlt} loading="lazy" className="w-full h-auto object-contain object-bottom" />
          </div>
          <div className="relative z-[3] xl:ml-[45%] px-[6vw] xl:px-8 py-10 lg:py-12 xl:py-[110px]">
            <p className="font-black text-white text-[27px] lg:text-[30px] xl:text-[48px] 2xl:text-[54px] leading-[1.2] tracking-[0.04em]">
              {t.footerCta.titleLine1}
              <br />
              {t.footerCta.titleLine2}
            </p>
            <p className="mt-4 text-[12px] lg:text-[14px] xl:text-[16px] font-black leading-[1.6] tracking-[0.04em] text-white">
              {t.footerCta.desc}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/business/register" className="rounded-[4px] bg-[#373c47] border-2 border-[#373c47] text-white px-7 py-3.5 font-extrabold text-[14px] hover:bg-transparent hover:border-white transition-colors">
                {t.footerCta.download}
              </a>
              <a href="/business/login" className="rounded-[4px] bg-white border-2 border-white text-[#0576b6] px-7 py-3.5 font-extrabold text-[14px] hover:bg-transparent hover:text-white transition-colors">
                {t.footerCta.consult}
              </a>
            </div>
            <a href="tel:0120-311-532" className="mt-8 inline-flex items-center gap-2 text-white">
              <span className="text-white"><TelIcon /></span>
              <span className="text-[22px] lg:text-[20px] xl:text-[22px] font-bold leading-none">0120-311-532</span>
              <span className="text-[12px] font-bold text-white/80 ml-2">{t.header.businessHours}</span>
            </a>
            <div className="mt-5">
              <a href="#" className="inline-flex items-center gap-1.5 underline text-white text-[13px]">
                <ArrowSvg white />
                {t.footerCta.vendorLink}
              </a>
            </div>
          </div>
        </div>
        <div className="bg-[#374149] rounded-b-[12px] px-[22px] lg:px-10">
          <ol className="py-[23px] lg:py-[30px] flex items-center gap-x-4">
            <li className="flex items-center gap-4 text-[10px] lg:text-[12px] font-black">
              <span className="w-2 h-2 rounded-full bg-[#0576b6] shrink-0" />
              <a href="/landing/business" className="text-white font-black">{t.footerCta.breadcrumb}</a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page composition                                                   */
/* ------------------------------------------------------------------ */
function BusinessLandingPage() {
  return (
    <BusinessLandingLayout>
      <style>{`
        @keyframes bl-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .bl-marquee { display: flex; align-items: center; width: max-content; gap: 14px; animation: bl-marquee 42s linear infinite; }
        @keyframes bl-appeal-marquee { from { transform: translateX(0); } to { transform: translateX(50%); } }
        .bl-appeal {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: 0 6.944vw;
          margin: 0 auto 110px;
        }
        @media (max-width: 1279px) {
          .bl-appeal__contents {
            flex-direction: column;
            gap: 40px;
          }
          .bl-appeal__text-area,
          .bl-appeal__text-area--locale {
            max-width: 100%;
            width: 100%;
          }
          .bl-appeal__movie-area {
            max-width: 640px;
            width: 100%;
            margin: 0 auto;
          }
          .bl-appeal__main-text {
            font-size: 36px;
          }
          .bl-appeal__main-text--locale {
            font-size: 32px;
          }
        }
        @media (min-width: 1024px) and (max-width: 1279px) {
          .bl-appeal__main-text {
            font-size: 32px;
          }
          .bl-appeal__main-text--locale {
            font-size: 28px;
          }
          .bl-appeal__desc {
            font-size: 14px;
            line-height: 1.85;
          }
          .bl-appeal__button {
            font-size: 16px;
          }
        }
        @media (max-width: 767px) {
          .bl-appeal { margin: 0 auto 80px; padding: 0 2.667vw; }
        }
        .bl-appeal__contents {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0 5%;
        }
        @media (max-width: 767px) {
          .bl-appeal__contents { gap: 45px 0; }
        }
        .bl-appeal__text-area {
          max-width: 480px;
          width: 45%;
          flex-grow: 1;
        }
        .bl-appeal__text-area--locale {
          max-width: 560px;
          width: 48%;
        }
        @media (max-width: 767px) {
          .bl-appeal__text-area { max-width: 100%; width: 100%; }
          .bl-appeal__text-area--locale { max-width: 100%; width: 100%; }
        }
        .bl-appeal__main-text {
          font-weight: 900;
          font-size: 48px;
          line-height: 1.4;
          font-feature-settings: "palt";
          margin: 0;
        }
        .bl-appeal__main-text--locale {
          font-size: 38px;
          line-height: 1.32;
          text-wrap: balance;
        }
        @media (max-width: 1023px) {
          .bl-appeal__main-text { font-size: 4vw; }
          .bl-appeal__main-text--locale { font-size: 3.6vw; line-height: 1.35; }
        }
        @media (max-width: 767px) {
          .bl-appeal__main-text {
            font-size: 27px;
            text-align: center;
            line-height: 1.2;
            margin: 0 0 20px;
          }
          .bl-appeal__main-text--locale {
            font-size: 24px;
            line-height: 1.3;
          }
        }
        .bl-appeal__desc {
          font-weight: 700;
          font-size: 16px;
          line-height: 2;
          font-feature-settings: "palt";
          margin: 1.25em 0 0;
          color: #282c32;
        }
        @media (max-width: 1023px) {
          .bl-appeal__desc { font-size: 1.6vw; }
        }
        @media (max-width: 767px) {
          .bl-appeal__desc { font-size: 12px; text-align: center; }
        }
        .bl-appeal__button {
          margin-top: 1.5em;
          background-color: #0576b6;
          color: #fff;
          font-weight: 700;
          font-size: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1em;
          position: relative;
          transition: background-color 0.2s ease;
        }
        .bl-appeal__button:hover { background-color: #045a8f; }
        @media (max-width: 767px) {
          .bl-appeal__button { font-size: 16px; margin-top: 1em; }
        }
        .bl-appeal__button-arrow {
          position: absolute;
          display: inline-block;
          width: 2.5em;
          height: 2px;
          top: 60%;
          right: 2em;
          border-radius: 9999px;
          background-color: #fff;
        }
        .bl-appeal__button-arrow::before {
          content: "";
          position: absolute;
          top: calc(50% - 1px);
          right: 0;
          width: 1em;
          height: 2px;
          border-radius: 9999px;
          background-color: #fff;
          transform: rotate(45deg);
          transform-origin: calc(100% - 1px) 50%;
        }
        .bl-appeal__movie-area {
          max-width: 680px;
          width: 50%;
          flex-grow: 0;
        }
        @media (max-width: 767px) {
          .bl-appeal__movie-area { max-width: 100%; width: 100%; }
        }
        .bl-appeal-movie { cursor: pointer; }
        .bl-appeal-movie__first { position: relative; }
        .bl-appeal-movie__first-thumbnail-body {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 12px 12px 0 0;
        }
        @media (max-width: 767px) {
          .bl-appeal-movie__first-thumbnail-body { border-radius: 6px 6px 0 0; }
        }
        .bl-appeal-play {
          width: 113px;
          height: 113px;
          background-color: rgba(255, 255, 255, 0.44);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: 0.5s cubic-bezier(0.85, 0, 0.15, 1);
        }
        .group:hover .bl-appeal-play { background-color: rgba(255, 255, 255, 0); }
        .bl-appeal-play__inner {
          width: 86px;
          height: 86px;
          background-color: #fff;
          border-radius: 50%;
          position: relative;
        }
        .bl-appeal-play__arrow {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 11px 0 11px 20px;
          border-color: transparent transparent transparent #0576b6;
          transition: 0.5s cubic-bezier(0.85, 0, 0.15, 1);
          position: absolute;
          top: 50%;
          left: 50%;
          margin: 0 0 0 3px;
        }
        .bl-appeal-play__arrow--first {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
        .bl-appeal-play__arrow--second {
          opacity: 0;
          transform: translate(-80%, -50%);
        }
        .group:hover .bl-appeal-play__arrow--first {
          opacity: 0;
          transform: translate(-20%, -50%);
        }
        .group:hover .bl-appeal-play__arrow--second {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
        .bl-appeal-movie__thumbnail-area {
          background-color: #0576b6;
          border-radius: 0 0 12px 12px;
          padding: 20px 9% 25px;
        }
        @media (max-width: 767px) {
          .bl-appeal-movie__thumbnail-area {
            padding: 15px 23px;
            border-radius: 0 0 6px 6px;
          }
        }
        .bl-appeal-movie__badge {
          display: block;
          text-align: center;
          color: #fff;
          font-weight: 700;
          font-size: 24px;
        }
        @media (max-width: 767px) {
          .bl-appeal-movie__badge { font-size: 20px; }
        }
        .bl-appeal-marquee {
          position: absolute;
          z-index: -1;
          width: 100%;
          overflow: hidden;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          pointer-events: none;
        }
        @media (max-width: 767px) {
          .bl-appeal-marquee { top: 40%; }
        }
        .bl-appeal-marquee__body {
          display: flex;
          flex-wrap: nowrap;
          width: max-content;
          animation: bl-appeal-marquee 50s linear infinite;
        }
        .bl-appeal-marquee__text {
          opacity: 0.07;
          vertical-align: baseline;
        }
        .bl-appeal-marquee__text-en {
          font-weight: 900;
          font-feature-settings: "palt";
          color: #282c32;
          font-size: 194px;
          line-height: 1;
        }
        @media (max-width: 767px) {
          .bl-appeal-marquee__text-en { font-size: 97px; }
        }
        .bl-appeal-marquee__text-jp {
          font-weight: 900;
          font-feature-settings: "palt";
          color: #282c32;
          font-size: 84px;
          line-height: 1;
          margin: 80px 0 0 10px;
        }
        @media (max-width: 767px) {
          .bl-appeal-marquee__text-jp { font-size: 42px; margin: 30px 0 0 10px; }
        }
      `}</style>

      <main>
        <HeroSection />
        <PartnerMarquee />
        <AppealSection />
        <ProposalSection />
        <ReasonSection />
        <ConversionBanner />
        <FlowSection />
        <NewsSection />
        <FaqSection />
        <FooterTopCta />
      </main>
    </BusinessLandingLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Subpage iframe (auto-sized to content)                            */
/* ------------------------------------------------------------------ */
function AutoSizingIframe({ src }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return undefined;
    let ro;

    const measure = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
        if (h > 50) setHeight(h);
      } catch (e) {
        /* same-origin / not ready */
      }
    };

    const onLoad = () => {
      measure();
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          ro = new ResizeObserver(measure);
          ro.observe(doc.body);
        }
      } catch (e) {
        /* ignore */
      }
    };

    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
      if (ro) ro.disconnect();
    };
  }, [src]);

  return (
    <iframe
      ref={ref}
      key={src}
      title="JobShare Business"
      src={src}
      scrolling="no"
      className="block w-full border-0"
      style={{ height }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
export default function BusinessLandingHome() {
  const { language } = useLanguage();
  const location = useLocation();
  const subpath = resolveBusinessSubpath(location.pathname);
  const isHome = subpath === '';
  const templateSrc = TEMPLATE_BY_SUBPATH[subpath];

  const meta = useMemo(() => {
    const subSeo = SUBPATH_SEO[subpath]?.[language] || SUBPATH_SEO[subpath]?.ja;
    if (subSeo) return subSeo;
    return SEO[language] || SEO.ja;
  }, [language, subpath]);

  useEffect(() => {
    document.body.style.margin = '0';
    document.documentElement.lang = language;
    return () => {
      document.body.style.margin = '';
    };
  }, [language]);

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
      </Helmet>

      {isHome ? (
        <BusinessLandingPage />
      ) : (
        <BusinessLandingLayout>
          <AutoSizingIframe src={templateSrc} />
        </BusinessLandingLayout>
      )}
    </>
  );
}
