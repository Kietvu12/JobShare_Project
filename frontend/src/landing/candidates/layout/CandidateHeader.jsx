import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import { getLocaleFromPathname, switchLocaleInPathname } from '../../../utils/localeRoutes';
import { useCandidateHeaderAvatar } from '../hooks/useCandidateHeaderAvatar';
import { CANDIDATE_LOGO } from '../lib/candidateAssets';
import {
  buildCandidateNavLinks,
  getCandidateHomePath,
  isCandidateHomePath,
} from '../lib/candidateNav';
import { useCandidateCopy } from '../lib/useCandidateCopy';

const LOCALES = ['vi', 'en', 'ja'];

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="header-account-chevron"
      data-open={open ? 'true' : 'false'}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HeaderAccountMenu({
  profilePath,
  homePath,
  menuLabel,
  myInfoLabel,
  logoutLabel,
  applicant,
  avatarUrl,
  initials,
}) {
  const navigate = useNavigate();
  const { logout } = useCandidateAuth();
  const menuId = useId();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const displayName = applicant?.name?.trim() || applicant?.email || menuLabel;

  useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate(homePath, { replace: true });
  };

  return (
    <div className="header-account-wrap" ref={wrapRef}>
      <button
        type="button"
        className="header-account"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={displayName}
        onClick={() => setOpen((v) => !v)}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="header-account-avatar"
            width={34}
            height={34}
            decoding="async"
          />
        ) : (
          <span className="header-account-avatar is-initials" aria-hidden="true">
            {initials}
          </span>
        )}
        <span className="header-account-name">{displayName}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="header-account-dropdown" id={menuId} role="menu" aria-label={menuLabel}>
          <Link
            to={profilePath}
            role="menuitem"
            className="header-account-dropdown-item"
            onClick={() => setOpen(false)}
          >
            {myInfoLabel}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="header-account-dropdown-item is-logout"
            onClick={handleLogout}
          >
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CandidateHeader() {
  const { pathname, search } = useLocation();
  const { lang, ui } = useCandidateCopy();
  const { applicant, isAuthenticated } = useCandidateAuth();
  const { avatarUrl, initials } = useCandidateHeaderAvatar(applicant, isAuthenticated, pathname);
  const links = buildCandidateNavLinks(pathname);
  const homePath = getCandidateHomePath(pathname);
  const onHome = isCandidateHomePath(pathname);
  const currentLocale = getLocaleFromPathname(pathname) || lang;

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to={homePath} className="brand" aria-label="JobShare">
          <img src={CANDIDATE_LOGO} alt="JobShare" width={1339} height={438} fetchPriority="high" decoding="async" />
        </Link>

        <nav className="nav" id="main-nav" data-candidate-main-nav aria-label={ui.openMenu}>
          {onHome ? (
            <a href="#top">{ui.navHome}</a>
          ) : (
            <Link to={homePath}>{ui.navHome}</Link>
          )}
          <Link to={links.jobs}>{ui.navJobs}</Link>
          <Link to={links.profile}>{ui.navProfile}</Link>
          {onHome ? (
            <a href="#partners">{ui.navPartners}</a>
          ) : (
            <a href={links.partners}>{ui.navPartners}</a>
          )}
          <Link to={links.blog}>{ui.navBlog}</Link>
          <Link to={links.about}>{ui.navAbout}</Link>
          {!isAuthenticated ? (
            <Link to={links.login} className="nav-login">
              {ui.login}
            </Link>
          ) : null}
        </nav>

        <div className="header-tools">
          <div className="languages" aria-label="Language">
            {LOCALES.map((code) => {
              const active = currentLocale === code;
              const target = switchLocaleInPathname(pathname, code) + search;
              return (
                <Link
                  key={code}
                  to={target}
                  lang={code}
                  hrefLang={code}
                  aria-current={active ? 'page' : undefined}
                >
                  {code.toUpperCase()}
                </Link>
              );
            })}
          </div>
          {isAuthenticated && applicant ? (
            <HeaderAccountMenu
              profilePath={links.profile}
              homePath={homePath}
              menuLabel={ui.accountMenuLabel || ui.navProfile}
              myInfoLabel={ui.accountMyInfo || ui.navProfile}
              logoutLabel={ui.accountLogout}
              applicant={applicant}
              avatarUrl={avatarUrl}
              initials={initials}
            />
          ) : (
            <>
              <Link to={links.login} className="login">
                {ui.login}
              </Link>
              <Link to={links.register} className="header-register">
                {ui.register}
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-btn"
            data-candidate-menu-toggle
            aria-label={ui.openMenu}
            aria-controls="main-nav"
            aria-expanded="false"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
