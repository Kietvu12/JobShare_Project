import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import CreditPricingPackageCard from './CreditPricingPackageCard';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { creditPricingIntroStyles } from '../../utils/creditPricingStyles';
import apiService from '../../services/api';

const BRAND = '#0077B6';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

export default function ScoutCreditPackagesIntro({
  language = 'vi',
  showIntro = true,
  showSubmit = true,
  compact = false,
  onSuccess,
}) {
  const copy = getScoutWorkspaceCopy(language).onboarding.direct;
  const modalCopy = copy.pricingModal;
  const priceLocale = getPriceLocale(language);
  const [selectedKey, setSelectedKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    const pkg = getCreditPackageByKey(selectedKey);
    if (!pkg) {
      setError(copy.selectPackageError);
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
        setSuccessMsg(copy.topUpSuccess(code));
        setSelectedKey(null);
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

  return (
    <>
      <style>{creditPricingIntroStyles}</style>
      <div className="credit-pricing-intro-shell w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-3 sm:px-4 sm:py-3.5">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">{copy.creditPackagesTitle}</h2>
          {showIntro ? (
            <div className="biz-ui-body mt-2.5 max-w-3xl space-y-2 text-slate-600 sm:leading-relaxed">
              {copy.creditIntroLines.map((line) => (
                <p key={line} className="leading-relaxed">{line}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`px-3 sm:px-4 ${compact ? 'py-2.5' : 'py-3.5'}`}>
          {successMsg ? (
            <div className="biz-ui-caption mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-medium text-emerald-800">
              {successMsg}
            </div>
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
                    selected={selectedKey === pkg.key}
                    modalCopy={modalCopy}
                    pkgCopy={pkgCopy}
                    onChoose={setSelectedKey}
                    submitting={submitting}
                    submittingKey={submitting ? selectedKey : null}
                    submitCopy={copy}
                    priceLocale={priceLocale}
                    compact={compact}
                  />
                );
              })}
            </div>
          </div>

          {showSubmit ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="biz-ui-micro min-w-0 flex-1 leading-snug text-slate-500">
                {copy.creditPackagesNote}
              </p>
              <div className="flex w-full shrink-0 flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                {error ? (
                  <p className="biz-ui-micro text-rose-600 sm:text-right">{error}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="biz-ui-body inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-60 sm:w-auto"
                  style={{ background: BRAND }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {copy.submittingTopUp}
                    </>
                  ) : (
                    <>
                      {copy.submitTopUpRequest}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
