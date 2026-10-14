import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getLocaleFromPathname } from '../../../utils/localeRoutes';
import { JobShareRoleSwitchBar } from '../../shared/switch-sites';
import '../../templates/JobShare_Candidate_V1_1_20261006/fonts.css';
import '../candidate-styles.scoped.css';
import '../candidate-v1-overrides.css';
import { CandidateChromeProvider } from '../context/CandidateChromeContext';
import { useCandidateMobileNav } from '../hooks/useCandidateMobileNav';
import { useCandidateCopy } from '../lib/useCandidateCopy';
import CandidateBackToTop from './CandidateBackToTop';
import CandidateContactDialog from './CandidateContactDialog';
import CandidateFooter from './CandidateFooter';
import CandidateHeader from './CandidateHeader';

const BODY_CLASS = 'jobshare-candidate-v1';

function CandidateLayoutInner() {
  const { pathname } = useLocation();
  const { lang, ui } = useCandidateCopy();
  useCandidateMobileNav();

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
    <div id="candidate-site-root">
      <span id="top" className="sr-only" aria-hidden="true" />
      <a className="skip" href="#main">
        {ui.skip}
      </a>
      <JobShareRoleSwitchBar activePersona="candidate" />
      <CandidateHeader />
      <main id="main">
        <Outlet />
      </main>
      <CandidateFooter />
      <div className="floating-controls">
        <CandidateBackToTop />
      </div>
      <CandidateContactDialog />
    </div>
  );
}

export default function CandidateLayout() {
  return (
    <CandidateChromeProvider>
      <CandidateLayoutInner />
    </CandidateChromeProvider>
  );
}
