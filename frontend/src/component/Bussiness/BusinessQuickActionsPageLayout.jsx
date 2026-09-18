import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessFloatingQuickActions from './BusinessFloatingQuickActions.jsx';
import BusinessQuickActionsPanel, { getDefaultBusinessQuickActions } from './BusinessQuickActionsPanel.jsx';
import BusinessNotificationsPanel from './BusinessNotificationsPanel.jsx';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Layout nội dung chính full-width. Thao tác nhanh + thông báo: sidebar DN (Recruitment Health).
 * Giữ props sidebar* để tương thích (mặc định tắt cột phải).
 */
export default function BusinessQuickActionsPageLayout({
  children,
  onNavigate,
  sidebarExtra = null,
  /** @deprecated Đưa nội dung vào main thay vì cột phải */
  sidebarExtraTop = null,
  showQuickActionsPanel = false,
  showNotifications = true,
  showSidebar = false,
  showSidebarFloating = undefined,
  showMobileFab = false,
  className = '',
  mainClassName = '',
  sidebarClassName = '',
  /** 'default' (220–252px) | 'narrow' (188–228px) | 'wide' (300–400px) */
  sidebarSize = 'default',
}) {
  const navigate = useNavigate();
  const handleNavigate = onNavigate || navigate;
  const { language } = useLanguage();
  const quickActions = useMemo(() => getDefaultBusinessQuickActions(language), [language]);
  const sidebarFloating = showSidebarFloating ?? !showQuickActionsPanel;
  const sidebarGridCols = sidebarSize === 'wide'
    ? 'xl:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]'
    : sidebarSize === 'narrow'
      ? 'xl:grid-cols-[minmax(0,1fr)_minmax(188px,228px)]'
      : 'xl:grid-cols-[minmax(0,1fr)_minmax(220px,252px)]';

  return (
    <>
      <div
        className={`grid h-full min-h-0 flex-1 grid-cols-1 items-stretch gap-3 ${
          showSidebar ? `${sidebarGridCols} xl:gap-3.5 xl:overflow-hidden` : ''
        } ${className}`}
      >
        <div
          className={`business-homepage-scroll scrollbar-hide flex min-h-0 flex-col overflow-y-auto xl:h-full xl:pr-0.5 ${mainClassName}`}
        >
          {children}
        </div>

        {showSidebar ? (
        <div
          className={`hidden min-h-0 flex-col gap-2.5 xl:flex xl:h-full xl:gap-3 ${sidebarClassName}`}
        >
          <div className="business-homepage-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto xl:pr-0.5">
            <div className="flex min-h-full flex-col gap-2.5">
              {sidebarExtraTop}
              {showNotifications ? (
                <BusinessNotificationsPanel onNavigate={handleNavigate} className="min-h-0 flex-1" />
              ) : null}
              {showQuickActionsPanel ? (
                <div className="shrink-0">
                  <BusinessQuickActionsPanel
                    actions={quickActions}
                    onActionClick={(a) => {
                      if (a.path) handleNavigate(a.path);
                    }}
                  />
                </div>
              ) : null}
              {sidebarExtra}
            </div>
          </div>
          {sidebarFloating ? (
            <div className="shrink-0">
              <BusinessFloatingQuickActions onNavigate={handleNavigate} placement="sidebar" />
            </div>
          ) : null}
        </div>
        ) : null}
      </div>

      {showMobileFab ? (
        <div className="xl:hidden">
          <BusinessFloatingQuickActions onNavigate={handleNavigate} placement="fixed" />
        </div>
      ) : null}
    </>
  );
}
