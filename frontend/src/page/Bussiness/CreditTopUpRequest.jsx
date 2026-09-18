import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Coins, X } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestIntakeShell from '../../component/Bussiness/ServiceRequestIntakeShell';
import CreditPricingPackageCard from '../../component/Bussiness/CreditPricingPackageCard';
import CreditPackageConfirmModal from '../../component/Bussiness/CreditPackageConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { getServiceRequestDetailCopy } from '../../i18n/businessApp/serviceRequests';
import { creditPricingIntroStyles } from '../../utils/creditPricingStyles';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import {
  SR_BODY,
  SR_CAPTION,
  SR_PAGE_STYLES,
  SR_PAGE_TITLE,
  SR_SECTION,
  SR_SUCCESS_BANNER,
} from '../../utils/serviceRequestUi';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

export default function CreditTopUpRequest() {
  const { language } = useLanguage();
  const scoutCopy = useMemo(() => getScoutWorkspaceCopy(language).onboarding.direct, [language]);
  const creditDetail = useMemo(() => getServiceRequestDetailCopy('credit_topup', language), [language]);
  const modalCopy = scoutCopy.pricingModal;
  const confirmCopy = scoutCopy.packageConfirm;
  const priceLocale = getPriceLocale(language);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [pendingKey, setPendingKey] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pendingPkg = useMemo(
    () => (pendingKey ? getCreditPackageByKey(pendingKey) : null),
    [pendingKey],
  );

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

  const handleChoose = (key) => {
    setError('');
    setPendingKey(key);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const pkg = getCreditPackageByKey(pendingKey);
    if (!pkg) {
      setError(scoutCopy.selectPackageError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.createBusinessCreditRequest({
        amount: pkg.credits,
        note: `Gói ${pkg.name} — ${formatCreditAmount(pkg.credits)} (${formatYenAmount(pkg.priceYen)})`,
      });
      if (res?.success) {
        const code = res.data?.request?.requestCode || res.data?.requestCode || '';
        setSuccessMsg(scoutCopy.topUpSuccess(code));
        setConfirmOpen(false);
        setPendingKey(null);
        await loadDashboard();
      } else {
        setError(res?.message || 'Không thể gửi yêu cầu nạp credit');
      }
    } catch (err) {
      setError(err?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{SR_PAGE_STYLES}</style>
      <style>{creditPricingIntroStyles}</style>
      <ServiceRequestIntakeShell
        loading={loading}
        dashboard={dashboard}
        breadcrumbLabel={creditDetail.breadcrumb || creditDetail.title}
        language={language}
        headerExtra={
          successMsg ? (
            <div className={SR_SUCCESS_BANNER}>
              <span>{successMsg}</span>
              <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null
        }
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                <Coins className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
              </div>
              <h1 className={SR_PAGE_TITLE}>{creditDetail.title}</h1>
            </div>
            <div className="mt-2 space-y-1.5">
              {scoutCopy.creditIntroLines.map((line) => (
                <p key={line} className={`leading-relaxed text-slate-600 ${SR_BODY}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="credit-pricing-intro-shell business-app-ui mt-1 flex flex-col gap-3 px-4 pb-4 sm:gap-4 sm:px-5 sm:pb-5 lg:min-h-0 lg:flex-1">
            <p className={`shrink-0 ${SR_SECTION}`}>{scoutCopy.creditPackagesTitle}</p>
            {error ? (
              <p className={`shrink-0 text-rose-600 ${SR_BODY}`}>{error}</p>
            ) : null}
            <div className="credit-pricing-panel">
              <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3 lg:gap-4">
                {BUSINESS_CREDIT_PACKAGES.map((pkg) => {
                  const pkgCopy = scoutCopy.pricingPackages?.[pkg.key] || {
                    description: '',
                    features: [],
                  };
                  return (
                    <CreditPricingPackageCard
                      key={pkg.key}
                      pkg={pkg}
                      featured={pkg.key === FEATURED_CREDIT_PACKAGE_KEY}
                      selected={pendingKey === pkg.key && confirmOpen}
                      modalCopy={modalCopy}
                      pkgCopy={pkgCopy}
                      onChoose={handleChoose}
                      submitting={submitting}
                      submittingKey={submitting ? pendingKey : null}
                      submitCopy={scoutCopy}
                      priceLocale={priceLocale}
                      compact
                    />
                  );
                })}
              </div>
            </div>
            <p className={`mt-1 shrink-0 leading-relaxed ${SR_CAPTION}`}>
              {scoutCopy.creditPackagesNote}
            </p>
          </div>
        </div>
      </ServiceRequestIntakeShell>

      <CreditPackageConfirmModal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={submitting}
        pkg={pendingPkg}
        unlockCost={5}
        copy={confirmCopy}
        priceLocale={priceLocale}
      />
    </>
  );
}
