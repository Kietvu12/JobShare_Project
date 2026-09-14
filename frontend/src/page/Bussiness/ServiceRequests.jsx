import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Info, X } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestModal from '../../component/Bussiness/ServiceRequestModal';
import ServiceRequestAccountSidebar from '../../component/Bussiness/ServiceRequestAccountSidebar';
import { BUSINESS_SERVICE_REQUEST_CATALOG, getServiceByKey } from '../../utils/businessServiceRequestCatalog';
import { BUSINESS_HOMEPAGE_SHELL_STYLES, CARD, PAGE_FONT } from '../../utils/businessHomepageShell';
import { useLanguage } from '../../context/LanguageContext';
import { getBusinessAppCopy } from '../../i18n/businessAppI18n';

const SERVICE_REQUESTS_BREADCRUMB = {
  vi: 'Yêu cầu dịch vụ',
  en: 'Service requests',
  ja: 'サービス依頼',
};

export default function ServiceRequests() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = useMemo(() => getBusinessAppCopy(language), [language]);
  const breadcrumbCurrent = SERVICE_REQUESTS_BREADCRUMB[language] || SERVICE_REQUESTS_BREADCRUMB.vi;
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeService, setActiveService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const serviceKey = searchParams.get('service');
    if (searchParams.get('topup') === '1') {
      setSearchParams({}, { replace: true });
      navigate('/business/service-requests/credit', { replace: true });
      return;
    }
    if (!serviceKey || serviceKey === 'credit_topup') return;
    const service = getServiceByKey(serviceKey);
    if (service?.detailPath) {
      setSearchParams({}, { replace: true });
      navigate(service.detailPath, { replace: true });
      return;
    }
    if (service) {
      setActiveService(service);
      setModalOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, navigate]);

  const openService = (service) => {
    if (service.detailPath) {
      navigate(service.detailPath);
      return;
    }
    setActiveService(service);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setSuccessMsg('Đã gửi yêu cầu. WS sẽ liên hệ xác nhận trong thời gian sớm nhất.');
    loadDashboard();
  };

  if (loading && !dashboard) {
    return (
      <div
        className="flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-[11px] text-slate-500"
        style={{ fontFamily: PAGE_FONT }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <style>{BUSINESS_HOMEPAGE_SHELL_STYLES}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <ServiceRequestModal
          open={modalOpen}
          service={activeService}
          onClose={() => { setModalOpen(false); setActiveService(null); }}
          onSuccess={handleSuccess}
          currentCredit={dashboard?.summary?.credit}
        />

        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2.5">
          {successMsg ? (
            <div className="mb-2 flex shrink-0 items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              <span>{successMsg}</span>
              <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <nav aria-label="Breadcrumb" className="mb-2 shrink-0 text-[11px] text-slate-500 lg:text-xs">
            <button
              type="button"
              onClick={() => navigate('/business')}
              className="transition hover:text-[#0077B6]"
            >
              {copy.jobs.breadcrumb.home}
            </button>
            <span className="mx-1.5 text-slate-400">&gt;</span>
            <span className="font-medium text-slate-700">{breadcrumbCurrent}</span>
          </nav>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_260px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
              <header className="shrink-0">
                <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                  Chọn dịch vụ bạn muốn yêu cầu
                </h1>
                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  Tạo yêu cầu mới và theo dõi tiến độ tại đây. Các dịch vụ branding (Landing Page, quảng cáo, seminar…)
                  vẫn quản lý nội dung trong Thương hiệu tuyển dụng — màn này là nơi gửi và theo dõi yêu cầu tới WS.
                </p>
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-slate-500">
                  <Info className="mt-0.5 h-3 w-3 shrink-0 text-[#0077B6]" aria-hidden />
                  <span>
                    <span className="font-semibold text-slate-700">Lưu ý:</span>{' '}
                    Thời gian xử lý 1–2 ngày làm việc. WS liên hệ xác nhận sau khi tiếp nhận.
                  </span>
                </p>
              </header>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                {BUSINESS_SERVICE_REQUEST_CATALOG.map((service) => {
                  const Icon = service.icon;
                  const cta = service.ctaLabel || 'Tiếp tục';
                  return (
                    <article
                      key={service.key}
                      className={`${CARD} flex h-full min-h-[108px] flex-col p-3 transition-shadow hover:shadow-md`}
                    >
                      <div className="flex gap-2.5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: service.iconBg }}
                        >
                          <Icon className="h-4 w-4" style={{ color: service.iconColor }} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xs font-bold leading-snug text-slate-900">{service.title}</h2>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
                            {service.shortDesc}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openService(service)}
                        className="mt-2.5 inline-flex w-fit items-center rounded-lg border border-[#0077B6]/35 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa] sm:text-[11px]"
                      >
                        {cta}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>

            <ServiceRequestAccountSidebar dashboard={dashboard} />
          </div>
        </div>
      </div>
    </>
  );
}
