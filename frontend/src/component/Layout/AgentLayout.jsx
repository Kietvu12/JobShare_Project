import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CollaboratorLandingChatbot from '../LandingPage/CollaboratorLandingChatbot';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavbar from './BottomNavbar';
import PublicSupportChatUnreadNotice from '../Shared/PublicSupportChatUnreadNotice';

const AgentLayout = () => {
  const location = useLocation();
  const hideFloatingChatbot = /\/nominations\/[^/]+$/.test(location.pathname);
  const [showFloatingChatbot, setShowFloatingChatbot] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const updateVisibility = () => {
      setShowFloatingChatbot(window.innerWidth < 1024);
    };
    updateVisibility();
    window.addEventListener('resize', updateVisibility);
    return () => window.removeEventListener('resize', updateVisibility);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-100 via-red-50/40 to-stone-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-3 pb-24 sm:pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNavbar />
      {!hideFloatingChatbot && showFloatingChatbot && <CollaboratorLandingChatbot />}
      <PublicSupportChatUnreadNotice role="ctv" />
    </div>
  );
};

export default AgentLayout;

