import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Menu, User, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import CollaboratorLandingChatbot from '../LandingPage/CollaboratorLandingChatbot';
import {
  localizedPersonaHref,
  resolveCollaboratorPrefix,
  switchLocaleInPathname,
} from '../../utils/localeRoutes';

const I18N = {
  vi: {
    navHome: 'Trang chủ',
    navJobs: 'Danh sách việc làm',
    navAbout: 'Về chúng tôi',
    navPartners: 'Đối tác',
    navFaq: 'Hỏi và đáp',
    navBlog: 'Blog',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    footerTitle: 'Đăng ký ngay để trở thành cộng tác viên của JobShare và khám phá nhiều cơ hội việc làm tại Nhật Bản. Hoàn toàn miễn phí!',
    footerPersonaCtv: 'CTV',
    footerPersonaDescription: '(cộng tác viên)',
    footerRights: 'Đã đăng ký bản quyền.',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
  },
  en: {
    navHome: 'Home',
    navJobs: 'Job Listings',
    navAbout: 'About Us',
    navPartners: 'Partners',
    navFaq: 'Q&A',
    navBlog: 'Blog',
    login: 'Log in',
    register: 'Sign up',
    footerTitle: 'Sign up now to become a JobShare collaborator and discover many job opportunities in Japan. It is completely free!',
    footerPersonaCtv: 'CTV',
    footerPersonaDescription: '(collaborator)',
    footerRights: 'All rights reserved.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  ja: {
    navHome: 'ホーム',
    navJobs: '求人一覧',
    navAbout: '私たちについて',
    navPartners: 'パートナー',
    navFaq: 'Q&A',
    navBlog: 'ブログ',
    login: 'ログイン',
    register: '登録',
    footerTitle: '今すぐ登録して、JobShareの協力パートナーになり、日本の数百件に及ぶ求人情報をチェックしましょう。完全無料です！',
    footerPersonaCtv: 'CTV',
    footerPersonaDescription: '(コラボレーター)',
    footerRights: 'All rights reserved.',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
  },
};

const LANGUAGE_OPTIONS = ['vi', 'en', 'ja'];

function buildCollaboratorNavLinks(prefix, t) {
  const base = prefix || '/';
  return [
    { to: base, label: t.navHome, scrollToTop: true },
    { to: `${prefix}/jobs`, label: t.navJobs },
    { to: `${prefix}/about-us`, label: t.navAbout },
    { to: `${base}#faq`, label: t.navFaq, scrollTarget: 'faq' },
    { to: `${prefix}/blog`, label: t.navBlog },
  ];
}

const CollaboratorLayout = () => {
  const { pathname } = useLocation();
  const prefix = resolveCollaboratorPrefix(pathname);
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = I18N[language] || I18N.vi;
  const personaText = {
    collaborator: language === 'ja' ? 'コラボレーター' : language === 'en' ? 'Collaborator' : 'Cộng tác viên',
    candidate: language === 'ja' ? '応募者' : language === 'en' ? 'Candidate' : 'Ứng viên',
    company: language === 'ja' ? '企業' : language === 'en' ? 'Company' : 'Doanh nghiệp',
  };
  const personaSubText = {
    collaborator: language === 'ja' ? '候補者を紹介して報酬を獲得' : language === 'en' ? 'Refer candidates and earn commission' : 'Giới thiệu ứng viên & nhận hoa hồng',
    candidate: language === 'ja' ? '日本で仕事を探す' : language === 'en' ? 'Find jobs in Japan' : 'Tìm việc tại Nhật Bản',
    company: language === 'ja' ? '求人掲載と候補者探し' : language === 'en' ? 'Post jobs and find candidates' : 'Đăng tuyển & tìm ứng viên',
  };
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    navigate(switchLocaleInPathname(pathname, lang));
  };

  const personaHref = {
    collaborator: localizedPersonaHref(language, 'collaborator'),
    candidate: localizedPersonaHref(language, 'candidate'),
    company: '/business',
  };
  const navLinks = buildCollaboratorNavLinks(prefix, t);

  const handleNavClick = (item, closeMenu = false) => {
    if (item.scrollTarget) {
      const targetUrl = `${prefix || '/'}#${item.scrollTarget}`;
      navigate(targetUrl);
      if (pathname === prefix || pathname === `${prefix}/`) {
        setTimeout(() => {
          const el = document.getElementById(item.scrollTarget);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    } else if (item.scrollToTop) {
      navigate(prefix || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (closeMenu) setMobileMenuOpen(false);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mainRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const personaDropdownRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setPersonaDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const scroller = mainRef.current;
    if (!scroller) return undefined;

    const onScroll = () => setIsScrolled(scroller.scrollTop > 8);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (!personaDropdownOpen) return undefined;
    const onDoc = (e) => {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(e.target)) setPersonaDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [personaDropdownOpen]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onDoc = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FFFAFA] text-[#1a1a1a]">
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 8)}>
        <section className="mx-auto w-full max-w-[1200px] px-2.5 pt-1.5 sm:px-3 md:px-4 md:pt-2">
          <div className="overflow-hidden rounded-t-xl border border-neutral-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <div className="px-3 py-2 text-center text-[10px] font-medium text-neutral-800 sm:text-[11px]">
              {language === 'vi'
                ? 'Chào mừng bạn đến với Workstation JobShare, bạn muốn tham gia với tư cách nào?'
                : language === 'en'
                  ? 'Welcome to Workstation JobShare, how would you like to join?'
                  : 'JobShareワークステーションへようこそ。どの立場で参加しますか？'}
            </div>
            <div className="grid grid-cols-3 border-t border-neutral-200 bg-white">
              <button type="button" onClick={() => navigate(personaHref.collaborator)} className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-center transition-colors sm:min-h-[62px] sm:px-3 bg-red-50" style={{ boxShadow: 'inset 0 2px 0 #dc2626' }}>
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <div className="text-[10px] sm:text-[11px] font-semibold text-red-700">{personaText.collaborator}</div>
                <div className="hidden sm:block text-[9px] text-neutral-500">{personaSubText.collaborator}</div>
              </button>
              <button type="button" onClick={() => navigate(personaHref.candidate)} className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-center transition-colors sm:min-h-[62px] sm:px-3 hover:bg-neutral-50">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700" />
                <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-900">{personaText.candidate}</div>
                <div className="hidden sm:block text-[9px] text-neutral-500">{personaSubText.candidate}</div>
              </button>
              <button type="button" onClick={() => navigate(personaHref.company)} className="flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-center transition-colors sm:min-h-[62px] sm:px-3 hover:bg-neutral-50">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700" />
                <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-900">{personaText.company}</div>
                <div className="hidden sm:block text-[9px] text-neutral-500">{personaSubText.company}</div>
              </button>
            </div>
          </div>
        </section>

        <header className="sticky top-0 z-[60] border-b border-neutral-200 bg-white shadow-sm">
          <div className={`border-b border-neutral-100 bg-white transition-all duration-200 ${isScrolled ? 'block' : 'hidden'}`}>
            <div ref={personaDropdownRef}>
              <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 py-2 md:px-6">
                <button
                  type="button"
                  onClick={() => setPersonaDropdownOpen((open) => !open)}
                  className="inline-flex max-w-full items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-neutral-800 transition-colors sm:text-[11px]"
                  aria-expanded={personaDropdownOpen}
                >
                  <span className="truncate">
                    {language === 'vi'
                      ? 'Chào mừng bạn đến với Workstation JobShare, bạn muốn tham gia với tư cách nào?'
                      : language === 'en'
                        ? 'Welcome to Workstation JobShare, how would you like to join?'
                        : 'JobShareワークステーションへようこそ。どの立場で参加しますか？'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${personaDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {personaDropdownOpen && (
                  <div className="absolute left-4 right-4 top-full z-[70] mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl sm:left-1/2 sm:right-auto sm:w-[520px] sm:-translate-x-1/2">
                    <button type="button" onClick={() => { setPersonaDropdownOpen(false); navigate(personaHref.collaborator); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 bg-red-50">
                      <Building2 className="h-4 w-4 text-red-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-red-700">{personaText.collaborator}</span>
                        <span className="block truncate text-[11px] text-neutral-500">{personaSubText.collaborator}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => { setPersonaDropdownOpen(false); navigate(personaHref.candidate); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50">
                      <User className="h-4 w-4 text-neutral-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-neutral-900">{personaText.candidate}</span>
                        <span className="block truncate text-[11px] text-neutral-500">{personaSubText.candidate}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => { setPersonaDropdownOpen(false); navigate(personaHref.company); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50">
                      <Building2 className="h-4 w-4 text-neutral-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-neutral-900">{personaText.company}</span>
                        <span className="block truncate text-[11px] text-neutral-500">{personaSubText.company}</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[1200px] px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-4">
            <Link to={prefix || '/'} className="flex-shrink-0">
              <img src="/logo.png" alt="Job Share" className="h-6 w-auto md:h-7" />
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {navLinks.map((item) =>
                item.scrollTarget || item.scrollToTop ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className="text-xs font-semibold text-neutral-900 transition-colors hover:text-neutral-600"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.label} to={item.to} className="text-xs font-semibold text-neutral-900 transition-colors hover:text-neutral-600">
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isActive = language === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageChange(lang)}
                      className={`h-7 min-w-9 rounded-md px-2 text-[10px] font-bold uppercase transition-colors ${
                        isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                      aria-label={`Chuyển sang ngôn ngữ ${lang}`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
              <Link
                to="/login"
                className="hidden h-8 min-w-[96px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-[11px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 sm:inline-flex"
              >
                {t.login}
              </Link>
              <Link
                to="/register"
                className="hidden h-8 min-w-[96px] items-center justify-center rounded-lg bg-neutral-900 px-3 text-[11px] font-semibold !text-white transition-colors hover:bg-neutral-800 sm:inline-flex"
              >
                {t.register}
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden"
                aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            </div>
          </div>
        </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside
            ref={mobileMenuRef}
            className="absolute right-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <Link to={prefix || '/'} onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="Job Share" className="h-6 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
                aria-label={t.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-2">
              {navLinks.map((item) =>
                item.scrollTarget || item.scrollToTop ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item, true)}
                    className="block w-full border-b border-neutral-100 py-3 text-left text-sm font-semibold text-neutral-900 transition-colors hover:text-[#ED212F]"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block border-b border-neutral-100 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:text-[#ED212F]"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="border-t border-neutral-200 px-5 py-4 space-y-3">
              <div className="flex items-center justify-end">
                <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isActive = language === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageChange(lang)}
                        className={`h-7 min-w-8 rounded-md px-1.5 text-[10px] font-bold uppercase transition-colors ${
                          isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-200/80'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
                >
                  {t.login}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold !text-white transition-colors hover:bg-neutral-800 hover:!text-white"
                >
                  {t.register}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

        <Outlet />
      </main>

      {/* <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm font-semibold leading-6 text-neutral-900">{t.footerTitle}</p>
            <p className="text-xs text-neutral-500">
            </p>
          </div>
          <p className="text-xs text-neutral-500">{t.footerRights}</p>
        </div>
      </footer> */}

      <CollaboratorLandingChatbot />
    </div>
  );
};

export default CollaboratorLayout;
