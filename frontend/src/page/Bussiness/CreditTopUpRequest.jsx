import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Coins, Loader2, X } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestAccountSidebar from '../../component/Bussiness/ServiceRequestAccountSidebar';
import CreditPricingPackageCard from '../../component/Bussiness/CreditPricingPackageCard';
import CreditPackageConfirmModal from '../../component/Bussiness/CreditPackageConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { creditPricingIntroStyles } from '../../utils/creditPricingStyles';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { BUSINESS_HOMEPAGE_SHELL_STYLES, CARD, PAGE_FONT } from '../../utils/businessHomepageShell';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

export default function CreditTopUpRequest() {
  const { language } = useLanguage();
  const scoutCopy = useMemo(() => getScoutWorkspaceCopy(language).onboarding.direct, [language]);
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
      <style>{creditPricingIntroStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-y-auto bg-[#f4f6f8] lg:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-y-auto p-2 sm:p-2.5 lg:overflow-hidden">
          <nav className="mb-2 flex shrink-0 flex-wrap items-center gap-1 text-[10px] text-slate-500 sm:text-[11px]">
            <Link to="/business/service-requests" className="font-medium text-[#0077B6] hover:underline">
              Yêu cầu dịch vụ
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-700">Nạp credit</span>
          </nav>

          {successMsg ? (
            <div className="mb-2 flex shrink-0 items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              <span>{successMsg}</span>
              <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className={`${CARD} flex flex-col p-3.5 sm:p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto business-homepage-scroll`}>
              <div className="shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                    <Coins className="h-3.5 w-3.5 text-[#0077B6]" strokeWidth={2} />
                  </div>
                  <h1 className="text-base font-bold text-slate-900 sm:text-[17px]">Yêu cầu nạp credit</h1>
                </div>
                <div className="mt-1.5 space-y-1">
                  {scoutCopy.creditIntroLines.map((line) => (
                    <p key={line} className="text-[10px] leading-snug text-slate-600 sm:text-[11px]">{line}</p>
                  ))}
                </div>
              </div>

              <div className="credit-pricing-intro-shell mt-3.5 flex flex-col gap-2 sm:gap-2.5 lg:min-h-0 lg:flex-1">
                <p className="shrink-0 text-[11px] font-bold text-slate-900 sm:text-xs">{scoutCopy.creditPackagesTitle}</p>
                {error ? (
                  <p className="shrink-0 text-[10px] text-rose-600 sm:text-[11px]">{error}</p>
                ) : null}
                <div className="credit-pricing-panel">
                  <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3 lg:gap-3">
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
                <p className="mt-1 shrink-0 text-[9px] leading-snug text-slate-500 sm:text-[10px]">
                  {scoutCopy.creditPackagesNote}
                </p>
              </div>
            </div>

            <ServiceRequestAccountSidebar dashboard={dashboard} />
          </div>
        </div>
      </div>

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
