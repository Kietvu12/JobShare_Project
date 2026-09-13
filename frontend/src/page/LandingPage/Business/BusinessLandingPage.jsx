import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Home, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../../context/LanguageContext';
import { localizedPersonaHref } from '../../../utils/localeRoutes';

const COPY = {
  vi: {
    pageTitle: 'Doanh nghiệp | Workstation JobShare',
    welcome: 'Chào mừng bạn đến với Workstation JobShare, bạn muốn tham gia với tư cách nào?',
    collaborator: 'Cộng tác viên',
    collaboratorSub: 'Giới thiệu ứng viên & nhận hoa hồng',
    candidate: 'Ứng viên',
    candidateSub: 'Tìm việc tại Nhật Bản',
    company: 'Doanh nghiệp',
    companySub: 'Đăng tuyển & tìm ứng viên',
    code: '404',
    title: 'Trang doanh nghiệp chưa khả dụng',
    description:
      'Khu vực dành cho doanh nghiệp đang được xây dựng. Vui lòng quay lại trang chủ hoặc chọn chế độ xem khác.',
    backHome: 'Quay về trang chủ',
  },
  en: {
    pageTitle: 'Company | Workstation JobShare',
    welcome: 'Welcome to Workstation JobShare, how would you like to join?',
    collaborator: 'Collaborator',
    collaboratorSub: 'Refer candidates and earn commission',
    candidate: 'Candidate',
    candidateSub: 'Find jobs in Japan',
    company: 'Company',
    companySub: 'Post jobs and find candidates',
    code: '404',
    title: 'Company page is not available yet',
    description:
      'The business area is under development. Please return to the homepage or choose another view mode.',
    backHome: 'Back to homepage',
  },
  ja: {
    pageTitle: '企業 | Workstation JobShare',
    welcome: 'JobShareワークステーションへようこそ。どの立場で参加しますか？',
    collaborator: 'コラボレーター',
    collaboratorSub: '候補者を紹介して報酬を獲得',
    candidate: '応募者',
    candidateSub: '日本で仕事を探す',
    company: '企業',
    companySub: '求人掲載と候補者探し',
    code: '404',
    title: '企業向けページは現在ご利用いただけません',
    description:
      '企業向けエリアは現在開発中です。ホームページに戻るか、別の表示モードをお選びください。',
    backHome: 'ホームに戻る',
  },
};

const BusinessLandingPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = COPY[language] || COPY.vi;
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const personaDropdownRef = useRef(null);

  const homeHref = localizedPersonaHref(language, 'collaborator');
  const candidateHref = localizedPersonaHref(language, 'candidate');

  useEffect(() => {
    if (!personaDropdownOpen) return undefined;
    const onDoc = (e) => {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(e.target)) {
        setPersonaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [personaDropdownOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1a1a1a]">
      <Helmet>
        <title>{t.pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="mx-auto w-full max-w-[1200px] px-2.5 pt-1.5 sm:px-3 md:px-4 md:pt-2">
        <div className="overflow-hidden rounded-t-xl border border-neutral-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          <div className="px-3 py-2 text-center text-[10px] font-medium text-neutral-800 sm:text-[11px]">
            {t.welcome}
          </div>
          <div className="grid grid-cols-3 border-t border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => navigate(homeHref)}
              className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-center transition-colors hover:bg-neutral-50 sm:min-h-[62px] sm:px-3"
            >
              <Building2 className="h-4 w-4 text-neutral-700 sm:h-5 sm:w-5" />
              <div className="text-[10px] font-semibold text-neutral-900 sm:text-[11px]">{t.collaborator}</div>
              <div className="hidden text-[9px] text-neutral-500 sm:block">{t.collaboratorSub}</div>
            </button>
            <button
              type="button"
              onClick={() => navigate(candidateHref)}
              className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-center transition-colors hover:bg-neutral-50 sm:min-h-[62px] sm:px-3"
            >
              <User className="h-4 w-4 text-neutral-700 sm:h-5 sm:w-5" />
              <div className="text-[10px] font-semibold text-neutral-900 sm:text-[11px]">{t.candidate}</div>
              <div className="hidden text-[9px] text-neutral-500 sm:block">{t.candidateSub}</div>
            </button>
            <button
              type="button"
              className="flex min-h-[54px] flex-col items-center justify-center gap-1 bg-neutral-900 px-2 py-1.5 text-center sm:min-h-[62px] sm:px-3"
              style={{ boxShadow: 'inset 0 2px 0 #ffffff33' }}
              aria-current="page"
            >
              <Building2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              <div className="text-[10px] font-semibold text-white sm:text-[11px]">{t.company}</div>
              <div className="hidden text-[9px] text-neutral-300 sm:block">{t.companySub}</div>
            </button>
          </div>
        </div>
      </section>

      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div ref={personaDropdownRef} className="border-b border-neutral-100 bg-white md:hidden">
          <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 py-2">
            <button
              type="button"
              onClick={() => setPersonaDropdownOpen((open) => !open)}
              className="inline-flex max-w-full items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-neutral-800"
              aria-expanded={personaDropdownOpen}
            >
              <span className="truncate">{t.welcome}</span>
              <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${personaDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {personaDropdownOpen && (
              <div className="absolute left-4 right-4 top-full z-20 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                <button type="button" onClick={() => navigate(homeHref)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50">
                  <Building2 className="h-4 w-4 text-neutral-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-neutral-900">{t.collaborator}</span>
                    <span className="block truncate text-[11px] text-neutral-500">{t.collaboratorSub}</span>
                  </span>
                </button>
                <button type="button" onClick={() => navigate(candidateHref)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50">
                  <User className="h-4 w-4 text-neutral-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-neutral-900">{t.candidate}</span>
                    <span className="block truncate text-[11px] text-neutral-500">{t.candidateSub}</span>
                  </span>
                </button>
                <button type="button" className="flex w-full items-center gap-3 bg-neutral-900 px-4 py-3 text-left">
                  <Building2 className="h-4 w-4 text-white" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-white">{t.company}</span>
                    <span className="block truncate text-[11px] text-neutral-300">{t.companySub}</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1200px] items-center px-4 py-3 md:px-6">
          <Link to={homeHref} className="flex-shrink-0">
            <img src="/logo.png" alt="Job Share" className="h-6 w-auto md:h-7" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg text-center">
          <div
            className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-4xl font-black tracking-tight text-neutral-900 sm:h-28 sm:w-28 sm:text-5xl"
            aria-hidden
          >
            {t.code}
          </div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base">
            {t.description}
          </p>
          <button
            type="button"
            onClick={() => navigate(homeHref)}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Home className="h-4 w-4" aria-hidden />
            {t.backHome}
          </button>
        </div>
      </main>
    </div>
  );
};

export default BusinessLandingPage;
