import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import apiService from '../../services/api';
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal';
import BrandingServiceIntakeModal from '../../component/BusinessBranding/BrandingServiceIntakeModal';
import ServiceRequestIntakeContent from '../../component/Bussiness/ServiceRequestIntakeContent';
import ServiceRequestIntakeShell from '../../component/Bussiness/ServiceRequestIntakeShell';
import { useServiceRequestIntakeFlow } from '../../hooks/useServiceRequestIntakeFlow';
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog';
import { createServiceRequestSubmittedHandler } from '../../utils/billingRecentRequests';
import { useLanguage } from '../../context/LanguageContext';
import { getServiceRequestDetailCopy, getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';

export default function SeminarCampaignRequest() {
  const { language } = useLanguage();
  const detail = useMemo(() => getServiceRequestDetailCopy('seminar_campaign', language), [language]);
  const intakeCopy = useMemo(() => getServiceRequestsCopy(language).intake, [language]);
  const service = useMemo(() => getServiceByKey('seminar_campaign', language), [language]);
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

  return (
    <>
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
      <ServiceRequestIntakeShell
        loading={loading}
        dashboard={dashboard}
        breadcrumbLabel={detail.breadcrumb || service?.title}
        language={language}
      >
        <ServiceRequestIntakeContent
          icon={CalendarDays}
          title={service?.title || detail.title}
          intro={detail.intro || []}
          benefitsTitle={detail.benefitsTitle}
          benefits={detail.benefits || []}
          docDescription={detail.docDescription}
          docHref="/docs/seminar-campaign-brochure.pdf"
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
