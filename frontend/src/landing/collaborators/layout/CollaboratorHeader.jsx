import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLocaleFromPathname, switchLocaleInPathname } from '../../../utils/localeRoutes';
import { COLLABORATOR_LOGO } from '../lib/collaboratorAssets';
import {
  buildCollaboratorNavLinks,
  getCollaboratorHomePath,
  isCollaboratorHomePath,
} from '../lib/collaboratorNav';
import { useCollaboratorCopy } from '../lib/useCollaboratorCopy';

const LOCALES = ['vi', 'en', 'ja'];

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function CollaboratorHeader() {
  const { pathname, search } = useLocation();
  const { lang, ui } = useCollaboratorCopy();
  const links = buildCollaboratorNavLinks(pathname);
  const homePath = getCollaboratorHomePath(pathname);
  const onHome = isCollaboratorHomePath(pathname);
  const currentLocale = getLocaleFromPathname(pathname) || lang;

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to={homePath} className="brand" aria-label="JobShare">
          <img src={COLLABORATOR_LOGO} alt="JobShare" width={1339} height={438} fetchPriority="high" decoding="async" />
        </Link>

        <nav className="nav" id="main-nav" data-ctv-main-nav aria-label={ui.openMenu}>
          {onHome ? (
            <a href="#top">{ui.navHome}</a>
          ) : (
            <Link to={homePath}>{ui.navHome}</Link>
          )}
          <Link to={links.jobs}>{ui.navJobs}</Link>
          <a href={links.faq}>{ui.navFaq}</a>
          <Link to={links.blog}>{ui.navBlog}</Link>
          <Link to={links.about}>{ui.navAbout}</Link>
          <Link to={links.login} className="nav-login">
            {ui.login}
          </Link>
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
          <Link to={links.login} className="login">
            {ui.login}
          </Link>
          <Link to={links.register} className="header-register">
            {ui.register}
          </Link>
          <button
            type="button"
            className="menu-btn"
            data-ctv-menu-toggle
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
