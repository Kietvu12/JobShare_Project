import React, { useState } from 'react';
import { ArrowRight, Coins, Loader2 } from 'lucide-react';
import CreditPackageCard from './CreditPackageCard';
import {
  BUSINESS_CREDIT_PACKAGES,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import apiService from '../../services/api';

const BRAND = '#0077B6';

export default function ScoutCreditPackagesIntro({
  language = 'vi',
  showIntro = true,
  showSubmit = true,
  compact = false,
  onSuccess,
}) {
  const copy = getScoutWorkspaceCopy(language).onboarding.direct;
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
    <div className="w-full shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
            <Coins className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="biz-ui-section text-slate-900">{copy.creditPackagesTitle}</h2>
          </div>
        </div>
        {showIntro ? (
          <div className="biz-ui-caption mt-2 space-y-1 text-slate-600">
            {copy.creditIntroLines.map((line) => (
              <p key={line} className="leading-snug">{line}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`px-3 py-3 sm:px-4 ${compact ? 'py-2.5' : 'py-3.5'}`}>
        {successMsg ? (
          <div className="biz-ui-caption mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-medium text-emerald-800">
            {successMsg}
          </div>
        ) : null}

        <div className={`grid grid-cols-1 gap-2 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2 sm:gap-2.5 xl:grid-cols-3 xl:gap-3'}`}>
          {BUSINESS_CREDIT_PACKAGES.map((pkg) => (
            <CreditPackageCard
              key={pkg.key}
              pkg={pkg}
              selected={selectedKey === pkg.key}
              onSelect={setSelectedKey}
            />
          ))}
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
  );
}
