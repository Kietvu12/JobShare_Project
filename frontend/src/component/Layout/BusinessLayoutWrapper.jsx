import React, { useEffect, useState } from 'react';
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
        <BusinessHeader
          businessUser={businessUser}
          mobileNavOpen={mobileNavOpen}
          onMenuToggle={() => setMobileNavOpen((open) => !open)}
        />

        <main className={`flex-1 min-h-0 ${viewportLocked ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className="h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessLayoutWrapper;
