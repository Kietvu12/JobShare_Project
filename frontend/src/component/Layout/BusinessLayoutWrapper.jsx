import React from 'react';
import { Outlet } from 'react-router-dom';
import BusinessSidebar from './BusinessSidebar';
import BusinessHeader from './BusinessHeader';
import useBusinessUser from '../../hooks/useBusinessUser';

const BusinessLayoutWrapper = () => {
  const businessUser = useBusinessUser();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <style>{`
        /* Custom scrollbar cho main content */
        main::-webkit-scrollbar {
          width: 6px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 3px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
        
        /* Firefox */
        main {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 transparent;
        }
      `}</style>
      
      {/* Sidebar */}
      <BusinessSidebar businessUser={businessUser} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <BusinessHeader businessUser={businessUser} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessLayoutWrapper;
