import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import ServiceRequestAccountSidebar from './ServiceRequestAccountSidebar';
import {
  BUSINESS_UI_FONT,
  SR_BODY,
  SR_BREADCRUMB,
  SR_BREADCRUMB_CURRENT,
  SR_INNER,
  SR_INTAKE_CARD,
  SR_LINK,
  SR_PAGE_STYLES,
  SR_SHELL,
} from '../../utils/serviceRequestUi';
import { getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';

/**
 * Shell chung trang chi tiết dịch vụ (catalog → detailPath).
 */
export default function ServiceRequestIntakeShell({
  loading,
  dashboard,
  breadcrumbLabel,
  children,
  headerExtra = null,
  language = 'vi',
}) {
  const srCopy = getServiceRequestsCopy(language);
  if (loading && !dashboard) {
    return (
      <div
        className={`flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-slate-500 ${SR_BODY}`}
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" />
        <span className="ml-2">{srCopy.loading}</span>
      </div>
    );
  }

  return (
    <>
      <style>{SR_PAGE_STYLES}</style>
      <div className={SR_SHELL} style={{ fontFamily: BUSINESS_UI_FONT }}>
        <div className={SR_INNER}>
          <nav className={`mb-2 flex shrink-0 flex-wrap items-center gap-1 ${SR_BREADCRUMB}`}>
            <Link to="/business/service-requests" className={SR_LINK}>
              {srCopy.breadcrumb}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className={SR_BREADCRUMB_CURRENT}>{breadcrumbLabel}</span>
          </nav>
          {headerExtra}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className={`${SR_INTAKE_CARD} business-homepage-scroll overflow-y-auto`}>{children}</div>
            <ServiceRequestAccountSidebar dashboard={dashboard} language={language} />
          </div>
        </div>
      </div>
    </>
  );
}
