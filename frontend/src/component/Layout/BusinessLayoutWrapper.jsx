import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BusinessSidebar from './BusinessSidebar';
import BusinessHeader from './BusinessHeader';
import useBusinessUser from '../../hooks/useBusinessUser';
import { isBusinessViewportLockedPage } from '../../utils/businessPageMeta';
import { BUSINESS_UI_FONT, BUSINESS_UI_TYPOGRAPHY_STYLES } from '../../utils/businessUiFont';

const BusinessLayoutWrapper = () => {
  const businessUser = useBusinessUser();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const viewportLocked = isBusinessViewportLockedPage(location.pathname);
  const mainScrollRef = useRef(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div
      className="business-app-ui flex h-screen overflow-hidden bg-gray-50"
      style={{ fontFamily: BUSINESS_UI_FONT }}
    >
      <style>{BUSINESS_UI_TYPOGRAPHY_STYLES}</style>
      
      <BusinessSidebar
        businessUser={businessUser}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          ref={mainScrollRef}
          className={`business-app-main-scroll flex min-h-0 flex-1 flex-col ${
            viewportLocked ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'
          }`}
          style={{ scrollPaddingTop: 'var(--business-header-height, 3rem)' }}
        >
          <BusinessHeader
            businessUser={businessUser}
            mobileNavOpen={mobileNavOpen}
            onMenuToggle={() => setMobileNavOpen((open) => !open)}
            scrollContainerRef={mainScrollRef}
          />

          <div className={`business-page-outlet min-h-0 flex-1 ${viewportLocked ? 'overflow-hidden' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessLayoutWrapper;
