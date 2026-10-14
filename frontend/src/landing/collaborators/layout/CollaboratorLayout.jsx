import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getLocaleFromPathname } from '../../../utils/localeRoutes';
import { JobShareRoleSwitchBar } from '../../shared/switch-sites';
import '../../templates/JobShare_Collaborator_V3/fonts.css';
import '../collaborator-styles.scoped.css';
import '../collaborator-v3-overrides.css';
import { CollaboratorChromeProvider } from '../context/CollaboratorChromeContext';
import { useCollaboratorMobileNav } from '../hooks/useCollaboratorMobileNav';
import { useCollaboratorCopy } from '../lib/useCollaboratorCopy';
import CollaboratorBackToTop from './CollaboratorBackToTop';
import CollaboratorContactDialog from './CollaboratorContactDialog';
import CollaboratorFooter from './CollaboratorFooter';
import CollaboratorHeader from './CollaboratorHeader';

const BODY_CLASS = 'jobshare-collaborator-v3';

function CollaboratorLayoutInner() {
  const { pathname } = useLocation();
  const { lang, ui } = useCollaboratorCopy();
  useCollaboratorMobileNav();

  useEffect(() => {
    const locale = getLocaleFromPathname(pathname) || lang;
    document.body.lang = locale;
    document.documentElement.lang = locale;
    document.body.classList.add(BODY_CLASS);
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, [pathname, lang]);

  return (
    <div id="collaborator-site-root">
      <span id="top" className="sr-only" aria-hidden="true" />
      <a className="skip" href="#main">
        {ui.skip}
      </a>
      <JobShareRoleSwitchBar activePersona="collaborator" />
      <CollaboratorHeader />
      <main id="main">
        <Outlet />
      </main>
      <CollaboratorFooter />
      <div className="floating-controls">
        <CollaboratorBackToTop />
      </div>
      <CollaboratorContactDialog />
    </div>
  );
}

export default function CollaboratorLayout() {
  return (
    <CollaboratorChromeProvider>
      <CollaboratorLayoutInner />
    </CollaboratorChromeProvider>
  );
}
