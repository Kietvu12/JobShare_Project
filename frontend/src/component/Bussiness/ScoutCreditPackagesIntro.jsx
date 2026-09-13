import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CreditPricingPackageCard from './CreditPricingPackageCard';
import CreditPackageConfirmModal from './CreditPackageConfirmModal';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { creditPricingIntroStyles } from '../../utils/creditPricingStyles';
import { formatScoutLocaleNumber } from '../../i18n/businessAppI18n';
import apiService from '../../services/api';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

export default function ScoutCreditPackagesIntro({
  language = 'vi',
  showIntro = true,
  compact = false,
  unlockCost = 5,
  creditBalance = 0,
  /** Khi user đã có credit — thu gọn, mở bằng nút Nạp thêm */
  collapsible = false,
  expanded = true,
  onToggleExpanded,
  deemphasized = false,
  onSuccess,
  sectionRef,
}) {
  const copy = getScoutWorkspaceCopy(language).onboarding.direct;
  const modalCopy = copy.pricingModal;
  const confirmCopy = copy.packageConfirm;
  const priceLocale = getPriceLocale(language);
  const [pendingKey, setPendingKey] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pendingPkg = useMemo(
    () => (pendingKey ? getCreditPackageByKey(pendingKey) : null),
    [pendingKey],
  );

  const handleChoose = (key) => {
    setError('');
    setPendingKey(key);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const pkg = getCreditPackageByKey(pendingKey);
    if (!pkg) {
      setError(copy.selectPackageError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.createBusinessCreditRequest({
        amount: pkg.credits,
        note: `Gói ${pkg.name} — ${pkg.credits} credit (${pkg.priceYen} yên)`,
      });
      if (res?.success) {
        const code = res.data?.request?.requestCode || res.data?.requestCode || '';
        setSuccessMsg(copy.topUpRequestSent(code));
        setConfirmOpen(false);
        setPendingKey(null);
        onSuccess?.(res.data);
      } else {
        setError(res?.message || copy.selectPackageError);
      }
    } catch (err) {
      setError(err?.message || copy.selectPackageError);
    } finally {
      setSubmitting(false);
    }
  };

  const showPackages = !collapsible || expanded;

  return (
    <>
      <style>{creditPricingIntroStyles}</style>
      <div
        ref={sectionRef}
        className={`credit-pricing-intro-shell w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ${
          deemphasized ? 'credit-packages-deemphasized' : ''
        }`}
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-3 sm:px-4 sm:py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{copy.creditPackagesTitle}</h2>
              {showIntro && showPackages ? (
                <div className="biz-ui-body mt-2 max-w-3xl space-y-2 text-slate-600 sm:leading-relaxed">
                  {copy.creditIntroLines.map((line) => (
                    <p key={line} className="leading-relaxed">{line}</p>
                  ))}
                </div>
              ) : null}
              {collapsible && !expanded ? (
                <p className="biz-ui-caption mt-1 text-slate-500">{copy.topUpMoreHint}</p>
              ) : null}
            </div>
            {collapsible ? (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#0077B6]/30 bg-[#e8f4fa]/50 px-2.5 py-1.5 text-xs font-semibold text-[#0077B6] hover:bg-[#e8f4fa]"
              >
                {expanded ? copy.collapsePackages : copy.topUpMore}
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            ) : null}
          </div>
        </div>

        {showPackages ? (
          <div className={`px-3 sm:px-4 ${compact ? 'py-2.5' : 'py-3.5'}`}>
            {successMsg ? (
              <div className="biz-ui-caption mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 font-medium text-sky-900">
                {successMsg}
              </div>
            ) : null}
            {error ? (
              <p className="biz-ui-caption mb-2 text-rose-600">{error}</p>
            ) : null}

            <div className="credit-pricing-panel">
              <div className={`grid grid-cols-1 items-stretch gap-3 ${
                compact ? 'sm:grid-cols-3 sm:gap-2.5' : 'lg:grid-cols-3 lg:gap-3'
              }`}>
                {BUSINESS_CREDIT_PACKAGES.map((pkg) => {
                  const pkgCopy = copy.pricingPackages?.[pkg.key] || {
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
                      submitCopy={copy}
                      priceLocale={priceLocale}
                      compact={compact}
                      interactive
                    />
                  );
                })}
              </div>
            </div>

            <p className="biz-ui-micro mt-3 leading-snug text-slate-500">
              {copy.creditPackagesNote}
              {creditBalance > 0 ? (
                <>
                  {' '}
                  {copy.currentBalanceHint(formatScoutLocaleNumber(creditBalance, language), unlockCost)}
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>

      <CreditPackageConfirmModal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={submitting}
        pkg={pendingPkg}
        unlockCost={unlockCost}
        copy={confirmCopy}
        priceLocale={priceLocale}
      />
    </>
  );
}
