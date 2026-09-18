import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import apiService from '../../services/api';
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal';
import ServiceRequestIntakeContent from '../../component/Bussiness/ServiceRequestIntakeContent';
import ServiceRequestIntakeShell from '../../component/Bussiness/ServiceRequestIntakeShell';
import { useServiceRequestIntakeFlow } from '../../hooks/useServiceRequestIntakeFlow';
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog';
import { createServiceRequestSubmittedHandler } from '../../utils/billingRecentRequests';
import { useLanguage } from '../../context/LanguageContext';
import { getServiceRequestDetailCopy, getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';

export default function LandingPagePremiumRequest() {
  const { language } = useLanguage();
  const detail = useMemo(() => getServiceRequestDetailCopy('landing_page_premium', language), [language]);
  const intakeCopy = useMemo(() => getServiceRequestsCopy(language).intake, [language]);
  const service = useMemo(() => getServiceByKey('landing_page_premium', language), [language]);
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
    openIntake,
    submitting,
    error,
    alertModal,
    closeAlertModal,
  } = useServiceRequestIntakeFlow({
    serviceKey: service?.key,
    serviceTitle: service?.title,
    defaultNote: detail.defaultNote,
    useIntakeModal: false,
    onSubmitted: createServiceRequestSubmittedHandler(setDashboard, loadDashboard),
  });

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <>
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
      <ServiceRequestIntakeShell
        loading={loading}
        dashboard={dashboard}
        breadcrumbLabel={detail.breadcrumb || service?.title}
        language={language}
      >
        <ServiceRequestIntakeContent
          icon={LayoutTemplate}
          title={service?.title || detail.title}
          intro={detail.intro || []}
          benefitsTitle={detail.benefitsTitle}
          benefits={detail.benefits || []}
          docDescription={detail.docDescription}
          docHref="/docs/landing-page-premium-brochure.pdf"
          docDownloadLabel={detail.docDownloadLabel}
          docSectionTitle={intakeCopy.docSectionTitle}
          error={error}
          submitting={submitting}
          onSubmit={openIntake}
          submitLabel={intakeCopy.submit}
          submittingLabel={intakeCopy.submitting}
        />
      </ServiceRequestIntakeShell>
    </>
  );
}
