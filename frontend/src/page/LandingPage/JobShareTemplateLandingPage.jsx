import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  formatPublicPostDate,
  getPostDetailHref,
  pickPublicPostCategoryLabel,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay';
import {
  publicCanonicalUrl,
  resolveCandidatePrefix,
  resolveCollaboratorPrefix,
  resolvePublicBlogPrefix,
  switchLocaleInPathname,
} from '../../utils/localeRoutes';
import { jobRecruitingCompanyDisplayName } from './LandingJobBrowseSection';
import {
  JOBSHARE_TEMPLATE_CONFIG,
  buildTemplateJobCard,
  buildTemplateJobMoreCard,
  buildTemplateNewsCard,
  prepareTemplateHtml,
  templateIndexFile,
} from '../../utils/jobShareTemplateLanding';
import { attachJobShareTemplateBehavior } from '../../utils/jobShareTemplateLandingBehavior';
import './jobShareTemplateLanding.css';

function recruitmentLabel(type, lang) {
  const map = {
    vi: { 1: 'Toàn thời gian', 2: 'Chính thức (haken)', 3: 'Phái cử', 4: 'Bán thời gian', 5: 'Uỷ thác' },
    en: { 1: 'Full-time', 2: 'Permanent (haken)', 3: 'Seconded', 4: 'Part-time', 5: 'Contract' },
    ja: { 1: '正社員', 2: '正社員（派遣）', 3: '派遣', 4: 'パート', 5: '業務委託' },
  };
  const L = map[lang] || map.vi;
  const n = Number(type);
  return L[n] || L[1];
}

function salaryLine(job, language) {
  const sr = job?.salaryRanges?.[0] || job?.salary_ranges?.[0];
  if (!sr) return '—';
  const baseValue =
    language === 'en' && (sr.salaryRangeEn || sr.salary_range_en)
      ? sr.salaryRangeEn || sr.salary_range_en
      : language === 'ja' && (sr.salaryRangeJp || sr.salary_range_jp)
        ? sr.salaryRangeJp || sr.salary_range_jp
        : sr.salaryRange || sr.salary_range || '—';
  const text = String(baseValue || '').trim();
  if (!text || text === '—') return '—';
  return /JPY\b/i.test(text) ? text : `${text} JPY`;
}

function jobTitleForLang(job, language) {
  if (language === 'en' && job?.titleEn) return job.titleEn;
  if (language === 'ja' && job?.titleJp) return job.titleJp;
  return job?.title || '—';
}

const JOB_MORE_LABELS = {
  vi: { top: 'Cơ hội khác', body: 'Việc làm trên JobShare. Khám phá tất cả', aria: 'Việc làm trên JobShare. Khám phá tất cả' },
  en: { top: 'More roles', body: 'Jobs on JobShare. Explore all', aria: 'Jobs on JobShare. Explore all' },
  ja: { top: 'その他の求人', body: 'JobShareの求人をすべて見る', aria: 'JobShareの求人をすべて見る' },
};

export default function JobShareTemplateLandingPage({ templateKey, seoMetaByLang }) {
  const templateConfig = JOBSHARE_TEMPLATE_CONFIG[templateKey];
  const { language, changeLanguage } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [bodyHtml, setBodyHtml] = useState('');
  const [loadError, setLoadError] = useState(false);

  const blogPrefix = resolvePublicBlogPrefix(pathname);
  const candidatePrefix = resolveCandidatePrefix(pathname);
  const collabPrefix = resolveCollaboratorPrefix(pathname);
  const canonicalPath = templateConfig.includeJobs ? candidatePrefix : collabPrefix;
  const seo = seoMetaByLang[language] || seoMetaByLang.vi;

  const hydrateDynamicSections = useCallback(
    async (root) => {
      if (!root) return;

      const newsGrid = root.querySelector('.news-grid');
      if (newsGrid) {
        try {
          const res = await apiService.getPublicPosts({
            page: 1,
            limit: 3,
            sortBy: 'published_at',
            sortOrder: 'DESC',
            surface: templateConfig.newsSurface,
          });
          const posts = Array.isArray(res?.data?.posts) ? res.data.posts.slice(0, 3) : [];
          if (posts.length) {
            newsGrid.innerHTML = posts
              .map((post) =>
                buildTemplateNewsCard({
                  post,
                  language,
                  assetBase: templateConfig.publicBase,
                  blogPrefix,
                  pickTitle: pickPublicPostTitle,
                  pickCategory: pickPublicPostCategoryLabel,
                  formatDate: formatPublicPostDate,
                  detailHref: getPostDetailHref,
                }),
              )
              .join('');
          }
        } catch {
          /* keep static fallback from template */
        }
      }

      if (templateConfig.includeJobs) {
        const jobsGrid = root.querySelector('.jobs-grid');
        if (jobsGrid) {
          try {
            const res = await apiService.getApplicantJobs({
              page: 1,
              limit: 5,
              status: 1,
              sortBy: 'createdAt',
              sortOrder: 'DESC',
            });
            const jobs = res?.success && Array.isArray(res?.data?.jobs) ? res.data.jobs : [];
            const total = Number(res?.data?.pagination?.total ?? res?.data?.total ?? jobs.length) || jobs.length;
            const extra = Math.max(0, total - jobs.length);
            const labels = JOB_MORE_LABELS[language] || JOB_MORE_LABELS.vi;
            const cards = jobs.slice(0, 5).map((job) =>
              buildTemplateJobCard({
                job,
                language,
                candidatePrefix,
                salaryText: salaryLine(job, language),
                companyName: jobRecruitingCompanyDisplayName(job, language),
                jobTitle: jobTitleForLang(job, language),
                employmentLabel: recruitmentLabel(job.recruitmentType ?? job.recruitment_type, language),
              }),
            );
            cards.push(
              buildTemplateJobMoreCard({
                candidatePrefix,
                extraCount: extra,
                labels,
              }),
            );
            jobsGrid.innerHTML = cards.join('');
          } catch {
            /* keep static fallback */
          }
        }
      }
    },
    [blogPrefix, candidatePrefix, language, templateConfig],
  );

  useEffect(() => {
    let cancelled = false;
    const htmlLang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi';
    document.documentElement.lang = htmlLang;
    document.documentElement.classList.add('jobshare-template-landing-root');
    document.body.lang = htmlLang;

    const indexFile = templateIndexFile(language, templateConfig);
    const url = `${templateConfig.publicBase}/${indexFile}`;

    (async () => {
      setLoadError(false);
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load template');
        const raw = await res.text();
        if (cancelled) return;
        const prepared = prepareTemplateHtml(raw, { language, pathname, templateConfig });
        setBodyHtml(prepared);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      document.documentElement.classList.remove('jobshare-template-landing-root');
    };
  }, [language, pathname, templateConfig]);

  useEffect(() => {
    const links = [
      { id: `js-template-fonts-${templateKey}`, href: `${templateConfig.publicBase}/fonts.css` },
      { id: `js-template-styles-${templateKey}`, href: `${templateConfig.publicBase}/styles.css` },
    ];
    links.forEach(({ id, href }) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }, [templateConfig.publicBase, templateKey]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !bodyHtml) return undefined;

    const onClick = (e) => {
      const langLink = e.target.closest('.languages a[lang]');
      if (langLink) {
        e.preventDefault();
        const next = langLink.getAttribute('lang');
        if (next && next !== language) {
          changeLanguage(next);
          navigate(switchLocaleInPathname(pathname, next));
        }
        return;
      }

      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('/') || href.startsWith('./')) {
        e.preventDefault();
        navigate(href.replace(/^\.\//, '/'));
      }
    };

    root.addEventListener('click', onClick);

    let detachBehavior = () => {};
    (async () => {
      await hydrateDynamicSections(root);
      detachBehavior = attachJobShareTemplateBehavior(root, templateConfig);
    })();

    return () => {
      root.removeEventListener('click', onClick);
      detachBehavior();
    };
  }, [bodyHtml, changeLanguage, hydrateDynamicSections, language, navigate, pathname, templateConfig]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || !bodyHtml) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [bodyHtml, pathname]);

  if (loadError) {
    return (
      <div className="jobshare-template-landing-fallback">
        <p>Không tải được giao diện landing. Vui lòng thử tải lại trang.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <html lang={language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi'} />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
        <link rel="canonical" href={publicCanonicalUrl(canonicalPath)} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seo.ogTitle || seo.title} />
        <meta property="og:description" content={seo.ogDesc || seo.description} />
        <meta property="og:url" content={publicCanonicalUrl(canonicalPath)} />
        <meta property="og:site_name" content="Workstation JobShare" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle || seo.title} />
        <meta name="twitter:description" content={seo.ogDesc || seo.description} />
      </Helmet>
      <div
        ref={rootRef}
        className="jobshare-template-landing-root"
        id="top"
        lang={language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi'}
        dangerouslySetInnerHTML={bodyHtml ? { __html: bodyHtml } : undefined}
      />
    </>
  );
}
