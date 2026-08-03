import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  Info,
  X,
} from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestModal from '../../component/Bussiness/ServiceRequestModal';
import ServiceRequestAccountSidebar from '../../component/Bussiness/ServiceRequestAccountSidebar';
import { BUSINESS_SERVICE_REQUEST_CATALOG, getServiceByKey } from '../../utils/businessServiceRequestCatalog';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
const CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm';

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .service-req-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .service-req-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .service-req-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;

export default function ServiceRequests() {
  const navigate = useNavigate();
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
        className="flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-xs text-slate-500"
        style={{ fontFamily: PAGE_FONT }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" />
        Đang tải...
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <style>{pageStyles}</style>

      <ServiceRequestModal
        open={modalOpen}
        service={activeService}
        onClose={() => { setModalOpen(false); setActiveService(null); }}
        onSuccess={handleSuccess}
        currentCredit={dashboard?.summary?.credit}
      />

      <div className="service-req-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 text-[11px] lg:overflow-hidden">
        {successMsg ? (
          <div className={`${CARD} flex shrink-0 items-start justify-between gap-2 border-emerald-200 bg-emerald-50 text-xs text-emerald-800`}>
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        <header className="shrink-0">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Yêu cầu dịch vụ</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
            Chọn dịch vụ bạn cần và gửi yêu cầu tới JobShare. Chúng tôi sẽ liên hệ và hỗ trợ bạn trong thời gian sớm nhất.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:overflow-hidden">
          <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-2">
              {BUSINESS_SERVICE_REQUEST_CATALOG.map((service) => {
                const Icon = service.icon;
                return (
                  <article
                    key={service.key}
                    className={`${CARD} flex flex-col lg:h-full lg:min-h-0`}
                  >
                    <div
                      className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: service.iconBg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: service.iconColor }} strokeWidth={2} />
                    </div>
                    <h2 className="shrink-0 text-xs font-bold text-slate-900">{service.title}</h2>
                    <p className="mt-1 shrink-0 text-[10px] leading-relaxed text-slate-500">
                      {service.shortDesc}
                    </p>
                    <button
                      type="button"
                      onClick={() => openService(service)}
                      className="mt-3 w-full rounded-lg border border-[#0077B6]/30 bg-white py-2 text-[10px] font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa] lg:mt-auto lg:pt-3"
                    >
                      Xem chi tiết
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="flex shrink-0 items-start gap-2 rounded-xl border border-[#0077B6]/15 bg-[#e8f4fa]/60 px-3 py-2.5 text-[10px] leading-relaxed text-slate-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
              <p>
                <span className="font-semibold text-slate-800">Lưu ý:</span>{' '}
                Thời gian xử lý yêu cầu: 1–2 ngày làm việc. JobShare sẽ liên hệ xác nhận và tư vấn chi tiết sau khi tiếp nhận yêu cầu của bạn.
              </p>
            </div>
          </div>

          <ServiceRequestAccountSidebar dashboard={dashboard} />
        </div>
      </div>
    </div>
  );
}
