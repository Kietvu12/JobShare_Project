import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { landingContainer } from '../lib/landingUi';

const LOCALE_BTN =
  'grid min-h-9 min-w-[34px] place-items-center rounded px-2 text-sm font-semibold text-[#112f3d] hover:bg-[#fcebed]';
const LOCALE_BTN_ACTIVE = 'bg-[#fcebed] font-bold text-[#be1824]';

/**
 * Header landing CTV / ứng viên — Tailwind only (không template styles.css).
 */
export default function LandingPublicHeader({
  siteRootId,
  logoSrc,
  homePath,
  navItems,
  localeLinks,
  loginHref,
  registerHref,
  registerLabel = 'Register',
  showNavLogin = true,
  accountSlot = null,
  openMenuLabel = 'Menu',
  menuToggleAttr,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navId = useId();
  const headerRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [homePath, navItems]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onDoc = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-[var(--jobshare-role-bar-height,0px)] z-20 border-b border-[#dae4e9]/75 bg-white/95 backdrop-blur-md"
    >
      <div className={`${landingContainer} flex min-h-[74px] items-center gap-4 sm:min-h-[88px] sm:gap-6`}>
        <Link to={homePath} className="shrink-0" aria-label="JobShare">
          <img
            src={logoSrc}
            alt="JobShare"
            className="h-auto w-[112px] sm:w-[142px]"
            width={1339}
            height={438}
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        <nav
          id={navId}
          aria-label={openMenuLabel}
          className={`ml-auto hidden items-center gap-5 text-base font-semibold text-[#112f3d] lg:flex xl:gap-6 ${
            mobileOpen
              ? '!absolute !left-0 !right-0 !top-full !flex !max-h-[70vh] !flex-col !items-stretch !gap-0 !overflow-y-auto !border-b !border-[#dae4e9] !bg-white !p-4 !shadow-lg lg:!static lg:!max-h-none lg:!flex-row lg:!border-0 lg:!bg-transparent lg:!p-0 lg:!shadow-none'
              : ''
          }`}
        >
          {navItems.map((item) => (
            <span key={item.key || item.label} className="block lg:inline">
              {item.href.startsWith('#') ? (
                <a href={item.href} className="block py-2 hover:text-[#be1824] lg:py-0">
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={`block py-2 hover:text-[#be1824] lg:py-0 ${item.className || ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </span>
          ))}
          {showNavLogin && loginHref ? (
            <Link
              to={loginHref}
              className="hidden py-2 font-semibold text-[#be1824] hover:underline lg:block lg:py-0"
            >
              {navItems.find((i) => i.key === 'login')?.label || 'Login'}
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
          <div className="flex gap-0.5" aria-label="Language">
            {localeLinks.map(({ code, to, active }) => (
              <Link
                key={code}
                to={to}
                lang={code}
                hrefLang={code}
                aria-current={active ? 'page' : undefined}
                className={`${LOCALE_BTN} ${active ? LOCALE_BTN_ACTIVE : ''}`}
              >
                {code.toUpperCase()}
              </Link>
            ))}
          </div>
          {accountSlot}
          {!accountSlot && loginHref ? (
            <Link to={loginHref} className="hidden text-base font-semibold sm:inline lg:hidden">
              {navItems.find((i) => i.key === 'login')?.label || 'Login'}
            </Link>
          ) : null}
          {!accountSlot && registerHref ? (
            <Link
              to={registerHref}
              className="hidden rounded px-3 py-2 text-sm font-bold text-white bg-[#ed212f] hover:bg-[#be1824] sm:inline"
            >
              {registerLabel}
            </Link>
          ) : null}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded border border-[#dae4e9] bg-white lg:hidden"
            aria-label={openMenuLabel}
            aria-controls={navId}
            aria-expanded={mobileOpen}
            {...{ [menuToggleAttr || 'data-landing-menu-toggle']: true }}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
