import React, { useEffect, useState } from 'react';
import AgentHomePageSession2 from '../../component/Agent/AgentHomePageSession2';
import AgentHomePageSession3 from '../../component/Agent/AgentHomePageSession3';
import AgentHomePageSession4 from '../../component/Agent/AgentHomePageSession4';
import AgentHomePageSession4Floating from '../../component/Agent/AgentHomePageSession4Floating';
import AgentHomePageSessionPaymentNomination from '../../component/Agent/AgentHomePageSessionPaymentNomination';
import AgentHomePageSession1 from '../../component/Agent/AgentHomePageSession1';

const HomePage = () => {
  const [isSession4Hidden, setIsSession4Hidden] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const updateLayoutState = () => {
      const hidden = window.innerWidth < 1024;
      setIsSession4Hidden(hidden);
      window.dispatchEvent(new CustomEvent('jobshare:toggle-layout-chatbot', { detail: { hide: !hidden } }));
    };

    updateLayoutState();
    window.addEventListener('resize', updateLayoutState);
    return () => {
      window.removeEventListener('resize', updateLayoutState);
      window.dispatchEvent(new CustomEvent('jobshare:toggle-layout-chatbot', { detail: { hide: false } }));
    };
  }, []);

  return (
    <>
      <div className="h-full min-h-0 rounded-[18px] bg-[#faf7f5]">
        <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden xl:flex-row xl:gap-2">
          {/* Main column - scrolls independently */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar xl:pr-1">
            <div className="space-y-3 pb-2">
              <AgentHomePageSession3 />
              <AgentHomePageSession2 />
              <AgentHomePageSessionPaymentNomination />
            </div>
          </div>

          {/* Right dashboard column - separate scroll container */}
          <aside className="hidden min-h-0 w-[320px] flex-shrink-0 overflow-y-auto overscroll-contain hide-scrollbar xl:block 2xl:w-[360px]">
            <AgentHomePageSession4 />
          </aside>
        </div>
      </div>

      {/* Floating Schedule Button (Mobile/Tablet only) */}
      {isSession4Hidden && (
        <div className="xl:hidden">
          <AgentHomePageSession4Floating />
        </div>
      )}

    </>
  );
};

export default HomePage;