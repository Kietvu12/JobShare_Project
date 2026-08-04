import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Download, FilePenLine, FileText, Gift, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal';
import BrandingServiceIntakeModal from '../../component/BusinessBranding/BrandingServiceIntakeModal';
import ServiceRequestAccountSidebar from '../../component/Bussiness/ServiceRequestAccountSidebar';
import { useServiceRequestIntakeFlow } from '../../hooks/useServiceRequestIntakeFlow';
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog';
import { createServiceRequestSubmittedHandler } from '../../utils/billingRecentRequests';
import { BRAND, BUSINESS_HOMEPAGE_SHELL_STYLES, CARD, PAGE_FONT } from '../../utils/businessHomepageShell';

const BENEFITS = [
  'Profile chuyên nghiệp, thống nhất visual theo brand công ty.',
  'Tăng ấn tượng và niềm tin với ứng viên tiềm năng.',
  'Trình bày rõ văn hóa, phúc lợi và giá trị cốt lõi doanh nghiệp.',
  'Dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
  'WS biên tập nội dung và thiết kế deck/PDF/web snippet.',
];

const INTRO = [
  'Profile công ty chuyên nghiệp giúp doanh nghiệp tạo ấn tượng mạnh mẽ với ứng viên tiềm năng, thể hiện rõ văn hóa, phúc lợi và giá trị cốt lõi.',
  'Workstation biên tập nội dung và thiết kế profile (deck, PDF hoặc web snippet) thống nhất visual — dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
];

export default function CompanyProfileRequest() {
  const service = getServiceByKey('company_profile');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getBusinessBillingDashboard();
      if (res?.success) setDashboard(res.data);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    intakeOpen,
    intakeModalServiceKey,
    openIntake,
    closeIntake,
    handleIntakeSubmit,
    submitting,
    error,
    alertModal,
    closeAlertModal,
  } = useServiceRequestIntakeFlow({
    serviceKey: service?.key,
    serviceTitle: service?.title,
    onSubmitted: createServiceRequestSubmittedHandler(setDashboard, loadDashboard),
  });

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-[11px] text-slate-500" style={{ fontFamily: PAGE_FONT }}>
        <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <style>{BUSINESS_HOMEPAGE_SHELL_STYLES}</style>
      <BrandingServiceIntakeModal
        open={intakeOpen}
        serviceKey={intakeModalServiceKey}
        onClose={closeIntake}
        onSubmit={handleIntakeSubmit}
        submitting={submitting}
      />
      <BrandingAlertModal
        open={alertModal.open}
        kind={alertModal.kind}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        confirmLabel={alertModal.confirmLabel}
        cancelLabel={alertModal.cancelLabel}
        hideCancel={alertModal.hideCancel}
        onConfirm={alertModal.onConfirm}
        onClose={closeAlertModal}
      />
      <div className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]" style={{ fontFamily: PAGE_FONT }}>
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2.5">
          <nav className="mb-1.5 flex shrink-0 flex-wrap items-center gap-1 text-[10px] text-slate-500 sm:text-[11px]">
            <Link to="/business/service-requests" className="font-medium text-[#0077B6] hover:underline">Yêu cầu dịch vụ</Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-700">Profile company</span>
          </nav>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className={`${CARD} flex h-full min-h-0 flex-col overflow-hidden p-3.5 sm:p-4`}>
              <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 sm:gap-4">
                <header className="flex shrink-0 flex-col justify-between gap-3 sm:gap-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FilePenLine className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                    </div>
                    <h1 className="text-base font-bold leading-snug text-slate-900 sm:text-[17px]">
                      {service?.title || 'Yêu cầu thiết kế profile company'}
                    </h1>
                  </div>
                  <div className="flex flex-col justify-between gap-2 sm:gap-2.5">
                    {INTRO.map((para) => (
                      <p key={para} className="text-[10px] leading-snug text-slate-600 sm:text-[11px]">{para}</p>
                    ))}
                  </div>
                </header>

                <section className="flex min-h-0 flex-1 flex-col justify-between gap-2.5 border-t border-slate-100 py-3 sm:gap-3 sm:py-3.5">
                  <div className="flex shrink-0 items-center gap-2">
                    <Gift className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
                    <h2 className="text-[11px] font-bold leading-snug text-slate-900 sm:text-xs">
                      Lợi ích khi sử dụng dịch vụ thiết kế profile company
                    </h2>
                  </div>
                  <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1 sm:gap-1.5">
                    {BENEFITS.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[10px] leading-snug text-slate-700 sm:text-[11px]">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0077B6] text-[8px] font-bold text-white">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="flex shrink-0 flex-col justify-between gap-2.5 border-t border-slate-100 py-3 sm:gap-3 sm:py-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
                    <h2 className="text-[11px] font-bold leading-snug text-slate-900 sm:text-xs">
                      Tài liệu giới thiệu chi tiết
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <p className="min-w-0 flex-1 text-[10px] leading-snug text-slate-600 sm:text-[11px]">
                      Tải brochure quy trình, mẫu profile và bảng giá tham khảo trước khi gửi yêu cầu.
                    </p>
                    <a
                      href="/docs/company-profile-brochure.pdf"
                      download
                      className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-800 transition-colors hover:bg-slate-50 sm:text-[11px]"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
                      <span>Download tài liệu (PDF · 2.1 MB)</span>
                    </a>
                  </div>
                </section>

                <div className="flex shrink-0 flex-col gap-1.5 border-t border-slate-100 pt-3 sm:pt-3.5">
                  {error ? <p className="text-[10px] text-rose-600 sm:text-[11px]">{error}</p> : null}
                  <button
                    type="button"
                    onClick={openIntake}
                    disabled={submitting}
                    className="inline-flex w-fit items-center justify-center rounded-lg px-4 py-2 text-[10px] font-bold text-white disabled:opacity-60 sm:text-[11px]"
                    style={{ background: BRAND }}
                  >
                    {submitting ? 'Đang gửi…' : 'Gửi yêu cầu →'}
                  </button>
                </div>
              </div>
            </div>
            <ServiceRequestAccountSidebar dashboard={dashboard} />
          </div>
        </div>
      </div>
    </>
  );
}
