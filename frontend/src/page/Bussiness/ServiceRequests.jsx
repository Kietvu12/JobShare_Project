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

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:overflow-hidden">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
                {BUSINESS_SERVICE_REQUEST_CATALOG.map((service) => {
                  const Icon = service.icon;
                  return (
                    <article key={service.key} className={`${CARD} flex h-full min-h-0 flex-col p-2.5 transition-shadow hover:shadow-md sm:p-3`}>
                      <div className="flex flex-1 flex-col justify-center">
                        <div
                          className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: service.iconBg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: service.iconColor }} strokeWidth={2} />
                        </div>
                        <h2 className="text-[11px] font-bold leading-snug text-slate-900 sm:text-xs">{service.title}</h2>
                        <p className="mt-1 text-[9px] leading-snug text-slate-500 sm:text-[10px]">
                          {service.shortDesc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openService(service)}
                        className="mt-2 shrink-0 w-full rounded-lg border border-[#0077B6]/30 bg-white py-1.5 text-[10px] font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa] sm:text-[11px]"
                      >
                        Xem chi tiết
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className={`${CARD} flex shrink-0 items-start gap-2 border-[#0077B6]/15 bg-[#e8f4fa]/60 p-2.5 sm:p-3`}>
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-[#0077B6]" />
                <p className="text-[9px] leading-snug text-slate-600 sm:text-[10px]">
                  <span className="font-semibold text-slate-800">Lưu ý:</span>{' '}
                  Thời gian xử lý yêu cầu: 1–2 ngày làm việc. JobShare sẽ liên hệ xác nhận và tư vấn chi tiết sau khi tiếp nhận yêu cầu của bạn.
                </p>
              </div>
            </div>

            <ServiceRequestAccountSidebar dashboard={dashboard} />
          </div>
        </div>
      </div>
    </>
  );
}
