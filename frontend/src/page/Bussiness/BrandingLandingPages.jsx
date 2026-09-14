import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import TemplateSlidePanel from '../../component/BusinessBranding/TemplateSlidePanel';
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal';
import BrandingLandingPageDashboard, { buildBrandingStatCards } from '../../component/BusinessBranding/BrandingLandingPageDashboard';
import { isCompanyBuilderContent } from '../../utils/companyLandingPageSchema';
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx';
import { useLanguage } from '../../context/LanguageContext';
import { getBrandingCopy } from '../../i18n/businessAppI18n';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

const shellStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) { .business-homepage-shell { --hp-zoom: 0.9; } }
  @media (min-width: 1280px) and (max-width: 1535px) { .business-homepage-shell { --hp-zoom: 0.86; } }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
`;

export default function BrandingLandingPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const copy = useMemo(() => getBrandingCopy(language), [language]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [landingPages, setLandingPages] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [alertModal, setAlertModal] = useState({
    open: false,
    kind: 'notice',
    title: '',
    message: '',
    variant: 'info',
    confirmLabel: 'OK',
    cancelLabel: '',
    hideCancel: false,
    onConfirm: null,
  });

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const openNoticeModal = (title, message, variant = 'info', confirmLabel) => {
    setAlertModal({
      open: true,
      kind: 'notice',
      title,
      message,
      variant,
      confirmLabel: confirmLabel ?? copy.alerts.ok,
      cancelLabel: copy.alerts.cancel,
      hideCancel: false,
      onConfirm: null,
    });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, listRes] = await Promise.all([
        apiService.getBusinessLandingPageDashboard(),
        apiService.getBusinessLandingPages({ page: 1, limit: 20 }),
      ]);
      if (dashRes?.success) setDashboard(dashRes.data);
      if (listRes?.success) setLandingPages(listRes.data?.landingPages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (location.state?.openLandingCreate) {
      setShowCreate(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const stats = dashboard?.stats || {};
  const activities = dashboard?.activities || [];
  const statCards = useMemo(() => buildBrandingStatCards(stats, copy), [stats, copy]);
  const statsEmpty = !loading
    && (stats.views || 0) === 0
    && (stats.formSubmissions || 0) === 0
    && (stats.conversionRate || 0) === 0;
  const hasPublishedPage = !loading && landingPages.some((p) => Number(p.status) === 1);

  const handleCreated = () => {
    loadData();
  };

  const openEditor = (p) => {
    const path = isCompanyBuilderContent(p.content) || p.builderType === 'company'
      ? `/business/saiyo/pages/${p.id}/build`
      : `/business/saiyo/pages/${p.id}/edit`;
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
  };

  const copyPublicLink = (lp) => {
    const url = `${window.location.origin}${lp.publicPath || `/lp/${lp.slug}`}`;
    navigator.clipboard.writeText(url);
    openNoticeModal(copy.alerts.copyTitle, copy.alerts.copyMessage, 'success');
  };

  return (
    <>
      <style>{shellStyles}</style>
      <TemplateSlidePanel open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
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

      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-[#f4f6f8] xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
              <span className="text-sm">{copy.loading}</span>
            </div>
          ) : (
            <BusinessQuickActionsPageLayout onNavigate={(path) => navigate(path)}>
              <nav className="mb-2 flex shrink-0 flex-wrap items-center gap-1 text-[11px] text-slate-500 lg:text-xs">
                <Link to="/business" className="font-medium text-[#0077B6] hover:underline">
                  {copy.breadcrumb.home}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                <Link to="/business/saiyo" className="font-medium text-[#0077B6] hover:underline">
                  {copy.breadcrumb.current}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="font-semibold text-slate-700">{copy.landingPagesManageTitle}</span>
              </nav>
              <BrandingLandingPageDashboard
                copy={copy}
                language={language}
                statCards={statCards}
                statsEmpty={statsEmpty}
                hasPublishedPage={hasPublishedPage}
                displayPages={landingPages}
                activities={activities}
                setShowCreate={setShowCreate}
                openEditor={openEditor}
                copyPublicLink={copyPublicLink}
              />
            </BusinessQuickActionsPageLayout>
          )}
        </div>
      </div>
    </>
  );
}
