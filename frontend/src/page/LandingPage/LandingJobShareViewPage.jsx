import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Download } from 'lucide-react';
import JobDetailPage from '../../component/Shared/JobDetailPage';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { resolveCandidatePrefix, switchLocaleInPathname } from '../../utils/localeRoutes';
import { jobRecruitingCompanyDisplayName } from './LandingJobBrowseSection';
import { hasAnyDownloadableAttachment, hasJobAttachment } from '../../utils/jobAttachmentAvailability';

const LANGUAGE_OPTIONS = ['vi', 'en', 'ja'];

/** Cùng lề ngang với JobDetailPage: outer (p-2/sm:p-4/lg:p-6) + card (p-3/sm:p-4/lg:p-5). */
const SHARE_VIEW_CONTENT_SHELL =
  'mx-auto w-full xl:max-w-[1600px] px-5 sm:px-8 lg:px-11';

function pickJobTitle(job, lang) {
  if (!job) return '';
  if (lang === 'en' && (job.titleEn || job.title_en)) return job.titleEn || job.title_en;
  if (lang === 'ja' && (job.titleJp || job.title_jp)) return job.titleJp || job.title_jp;
  return job.title || '';
}

const i18n = {
  vi: {
    heroLoading: 'Đang tải thông tin việc làm…',
    heroError: 'Không tìm thấy việc làm',
    btnDownloadJd: 'Tải JD',
    jdVietnamese: 'JD tiếng Việt',
    jdEnglish: 'JD tiếng Anh',
    jdJapanese: 'JD tiếng Nhật',
    jdOriginal: 'JD gốc',
    requiredCvForm: 'Form CV bắt buộc',
    downloadError: 'Không tải được JD.',
  },
  en: {
    heroLoading: 'Loading job…',
    heroError: 'Job not found',
    btnDownloadJd: 'Download JD',
    jdVietnamese: 'JD Vietnamese',
    jdEnglish: 'JD English',
    jdJapanese: 'JD Japanese',
    jdOriginal: 'Original JD',
    requiredCvForm: 'Required CV form',
    downloadError: 'Failed to download JD.',
  },
  ja: {
    heroLoading: '読み込み中…',
    heroError: '求人が見つかりません',
    btnDownloadJd: 'JDをダウンロード',
    jdVietnamese: 'JDベトナム語',
    jdEnglish: 'JD英語',
    jdJapanese: 'JD日本語',
    jdOriginal: 'JD原本',
    requiredCvForm: '必須CVフォーム',
    downloadError: 'JDのダウンロードに失敗しました。',
  },
};

function JobShareDownloadMenu({ job, language }) {
  const [open, setOpen] = useState(false);
  const t = i18n[language] || i18n.vi;

  if (!job || !hasAnyDownloadableAttachment(job)) return null;

  const handleDownload = async (fileType) => {
    const id = job.id;
    if (!id) return;
    try {
      await apiService.downloadJobFile(id, fileType, 'applicant');
      setOpen(false);
    } catch (e) {
      alert(e?.message || t.downloadError);
    }
  };

  const items = [
    { type: 'jdFile', label: t.jdVietnamese },
    { type: 'jdFileEn', label: t.jdEnglish },
    { type: 'jdFileJp', label: t.jdJapanese },
    { type: 'jdOriginalFile', label: t.jdOriginal },
    { type: 'requiredCvForm', label: t.requiredCvForm },
  ].filter((item) => hasJobAttachment(job, item.type));

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 sm:px-3 sm:py-2 sm:text-sm"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{t.btnDownloadJd}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute left-0 z-30 mt-1 min-w-[11rem] rounded-lg border border-gray-200 bg-white py-1 text-xs shadow-lg sm:text-sm"
          onMouseLeave={() => setOpen(false)}
        >
          {items.map((item) => (
            <button
              key={item.type}
              type="button"
              className="w-full px-3 py-2 text-left transition-colors hover:bg-gray-50"
              onClick={() => handleDownload(item.type)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Trang xem JD chia sẻ — chỉ hiển thị nội dung job và nút tải JD, không có ứng tuyển / copy / lưu. */
export default function LandingJobShareViewPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const t = i18n[language] || i18n.vi;

  const candidatePrefix = useMemo(() => resolveCandidatePrefix(pathname), [pathname]);

  const [heroState, setHeroState] = useState({ status: 'loading', job: null });

  const onJobLoaded = useCallback((j) => {
    if (j) setHeroState({ status: 'ok', job: j });
    else setHeroState({ status: 'error', job: null });
  }, []);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    navigate(switchLocaleInPathname(pathname, lang));
  };

  const heroTitle =
    heroState.status === 'ok'
      ? pickJobTitle(heroState.job, language)
      : heroState.status === 'error'
        ? t.heroError
        : t.heroLoading;

  const heroCompany =
    heroState.status === 'ok' && heroState.job
      ? jobRecruitingCompanyDisplayName(heroState.job, language, '')
      : '';

  const seoTitle = heroState.status === 'ok' && heroTitle
    ? `${heroTitle}${heroCompany ? ` | ${heroCompany}` : ''} | Workstation JobShare`
    : 'Job | Workstation JobShare';

  const langBtnActive = 'bg-neutral-900 text-white';
  const langBtnIdle = 'text-neutral-700 hover:bg-neutral-200/80';

  return (
    <div className="flex h-[100dvh] flex-col bg-[#FFFAFA] text-[#1a1a1a]">
      <Helmet>
        <title>{seoTitle}</title>
        {heroState.status === 'ok' && heroTitle && (
          <meta name="description" content={`${heroTitle}${heroCompany ? ` - ${heroCompany}` : ''} - Workstation JobShare`} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:url" content={`https://ws-jobshare.com${pathname}`} />
        <meta property="og:image" content="https://ws-jobshare.com/2HGb6Eo3YO1l7uOuEpoiDFXtQrQ6x7Yrzeb2.jpg" />
        <meta property="og:site_name" content="Workstation JobShare" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className={`flex items-center justify-between gap-4 py-3 ${SHARE_VIEW_CONTENT_SHELL}`}>
          <Link to={candidatePrefix} className="inline-flex shrink-0 items-center">
            <img src="/logo.png" alt="Workstation JobShare" className="h-6 w-auto md:h-7" />
          </Link>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isActive = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`h-7 min-w-9 rounded-md px-2 text-[10px] font-bold uppercase transition-colors sm:text-[11px] ${isActive ? langBtnActive : langBtnIdle}`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="shrink-0 border-b border-gray-100 bg-white">
        <div className={`py-4 ${SHARE_VIEW_CONTENT_SHELL}`}>
          <h1 className="text-lg font-bold leading-snug text-gray-900 sm:text-xl md:text-2xl">{heroTitle}</h1>
          {(heroCompany || (heroState.status === 'ok' && heroState.job)) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
              {heroCompany ? (
                <p className="text-sm text-gray-600">{heroCompany}</p>
              ) : null}
              {heroState.status === 'ok' && heroState.job ? (
                <JobShareDownloadMenu job={heroState.job} language={language} />
              ) : null}
            </div>
          )}
        </div>
      </section>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <JobDetailPage
          getJobApi={apiService.getApplicantJobById}
          backPath={`${candidatePrefix}/jobs`}
          showEditButton={false}
          hideSaveToList
          publicLanding
          shareViewOnly
          onJobLoaded={onJobLoaded}
        />
      </div>
    </div>
  );
}
