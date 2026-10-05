import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Info, X } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestModal from '../../component/Bussiness/ServiceRequestModal';
import ServiceRequestAccountSidebar from '../../component/Bussiness/ServiceRequestAccountSidebar';
import BusinessServiceFeeSimulator from '../../component/Bussiness/BusinessServiceFeeSimulator.jsx';
import { getBusinessServiceRequestCatalog, getServiceByKey } from '../../utils/businessServiceRequestCatalog';
import { getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';
import {
  BUSINESS_UI_FONT,
  SR_BODY_LG,
  SR_BODY,
  SR_BREADCRUMB,
  SR_BREADCRUMB_CURRENT,
  SR_CATALOG_GRID,
  SR_CATALOG_LAYOUT_STYLES,
  SR_CATALOG_PANEL,
  SR_INNER,
  SR_LINK,
  SR_PAGE_STYLES,
  SR_PAGE_TITLE,
  SR_SERVICE_CARD,
  SR_SERVICE_CARD_BTN,
  SR_SERVICE_CARD_DESC,
  SR_SERVICE_CARD_TITLE,
  SR_SHELL,
  SR_SUCCESS_BANNER,
} from '../../utils/serviceRequestUi';
import { useLanguage } from '../../context/LanguageContext';
import { getBusinessAppCopy } from '../../i18n/businessAppI18n';

export default function ServiceRequests() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = useMemo(() => getBusinessAppCopy(language), [language]);
  const srCopy = useMemo(() => getServiceRequestsCopy(language), [language]);
  const catalog = useMemo(() => getBusinessServiceRequestCatalog(language), [language]);
  const breadcrumbCurrent = srCopy.breadcrumb;
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
    const service = getServiceByKey(serviceKey, language);
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
  }, [searchParams, setSearchParams, navigate, language]);

  const openService = (service) => {
    if (service.detailPath) {
      navigate(service.detailPath);
      return;
    }
    setActiveService(service);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setSuccessMsg(srCopy.successSent);
    loadDashboard();
  };

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
      <style>{SR_PAGE_STYLES}{SR_CATALOG_LAYOUT_STYLES}</style>
      <div className={SR_SHELL} style={{ fontFamily: BUSINESS_UI_FONT }}>
        <ServiceRequestModal
          open={modalOpen}
          service={activeService}
          onClose={() => { setModalOpen(false); setActiveService(null); }}
          onSuccess={handleSuccess}
          currentCredit={dashboard?.summary?.credit}
          language={language}
        />

        <div className={SR_INNER}>
          {successMsg ? (
            <div className={SR_SUCCESS_BANNER}>
              <span>{successMsg}</span>
              <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <nav aria-label="Breadcrumb" className={`mb-2 shrink-0 ${SR_BREADCRUMB}`}>
            <button
              type="button"
              onClick={() => navigate('/business')}
              className={`transition hover:text-[#0077B6] ${SR_LINK}`}
            >
              {copy.jobs.breadcrumb.home}
            </button>
            <span className="mx-1.5 text-slate-400">&gt;</span>
            <span className={SR_BREADCRUMB_CURRENT}>{breadcrumbCurrent}</span>
          </nav>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="business-homepage-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:pr-1">
              <header className="shrink-0 space-y-2">
                <h1 className={SR_PAGE_TITLE}>
                  {srCopy.pageTitle}
                </h1>
                <p className={`max-w-3xl leading-relaxed text-slate-600 ${SR_BODY_LG}`}>
                  {srCopy.pageIntro}
                </p>
                <p className={`flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white px-4 py-3 leading-relaxed ${SR_BODY}`}>
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0077B6]" aria-hidden />
                  <span>
                    <span className="font-semibold text-slate-700">{srCopy.noteLabel}</span>{' '}
                    {srCopy.noteBody}
                  </span>
                </p>
              </header>

              <BusinessServiceFeeSimulator className="shrink-0" highlight />

              <h2 className="shrink-0 text-base font-bold text-slate-900 sm:text-lg">
                {srCopy.otherServicesHeading}
              </h2>

              <div className={`-mt-2 ${SR_CATALOG_PANEL}`}>
                <div className={SR_CATALOG_GRID}>
                  {catalog.map((service) => {
                    const Icon = service.icon;
                    const cta = service.ctaLabel || srCopy.continueCta;
                    return (
                      <article
                        key={service.key}
                        className={SR_SERVICE_CARD}
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-[3.25rem] sm:w-[3.25rem]"
                          style={{ background: service.iconBg }}
                        >
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: service.iconColor }} strokeWidth={2} />
                        </div>
                        <h2 className={`leading-snug ${SR_SERVICE_CARD_TITLE}`}>{service.title}</h2>
                        <p className={`min-h-0 flex-1 ${SR_SERVICE_CARD_DESC}`}>
                          {service.shortDesc}
                        </p>
                        <button
                          type="button"
                          onClick={() => openService(service)}
                          className={SR_SERVICE_CARD_BTN}
                        >
                          {cta}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>

            <ServiceRequestAccountSidebar dashboard={dashboard} language={language} />
          </div>
        </div>
      </div>
    </>
  );
}
