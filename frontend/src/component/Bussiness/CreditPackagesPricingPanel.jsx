import React, { useState } from 'react';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import apiService from '../../services/api';
import CreditPricingPackageCard from './CreditPricingPackageCard';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

export default function CreditPackagesPricingPanel({ language = 'vi', onSuccess }) {
  const directCopy = getScoutWorkspaceCopy(language).onboarding.direct;
  const modalCopy = directCopy.pricingModal;
  const priceLocale = getPriceLocale(language);
  const [submittingKey, setSubmittingKey] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChoose = async (key) => {
    const pkg = getCreditPackageByKey(key);
    if (!pkg) {
      setError(directCopy.selectPackageError);
      return;
    }

    setSubmittingKey(key);
    setError('');
    try {
      const res = await apiService.createBusinessCreditRequest({
        amount: pkg.credits,
        note: `Gói ${pkg.name} — ${formatCreditAmount(pkg.credits)} (${formatYenAmount(pkg.priceYen)})`,
      });
      if (res?.success) {
        const code = res.data?.request?.requestCode || res.data?.requestCode || '';
        setSuccessMsg(directCopy.topUpSuccess(code));
        onSuccess?.(res.data);
      } else {
        setError(res?.message || directCopy.selectPackageError);
      }
    } catch (err) {
      setError(err?.message || directCopy.selectPackageError);
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <div className="credit-pricing-panel w-full">
      <div className="text-center">
        <p className="biz-ui-micro font-bold uppercase tracking-[0.18em] text-[#0077B6] sm:tracking-[0.2em]">
          {modalCopy.eyebrow}
        </p>
        <h2 className="biz-ui-title mx-auto mt-2 max-w-3xl leading-snug sm:mt-3">
          {modalCopy.headline}
        </h2>
        <p className="biz-ui-body mx-auto mt-2 max-w-2xl text-slate-600">
          {directCopy.insufficientCreditMessage}
        </p>
      </div>

      {successMsg ? (
        <div className="biz-ui-body mx-auto mt-5 max-w-3xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center font-medium text-emerald-800 sm:mt-6">
          {successMsg}
        </div>
      ) : null}

      {error ? (
        <div className="biz-ui-body mx-auto mt-5 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center font-medium text-rose-700 sm:mt-6">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-3 items-stretch gap-1.5 sm:mt-6 sm:gap-3 md:gap-4 2xl:mt-8 2xl:gap-5">
        {BUSINESS_CREDIT_PACKAGES.map((pkg) => {
          const pkgCopy = directCopy.pricingPackages?.[pkg.key] || {
            description: '',
            features: [],
          };
          return (
            <CreditPricingPackageCard
              key={pkg.key}
              pkg={pkg}
              featured={pkg.key === FEATURED_CREDIT_PACKAGE_KEY}
              modalCopy={modalCopy}
              pkgCopy={pkgCopy}
              onChoose={handleChoose}
              submitting={!!submittingKey}
              submittingKey={submittingKey}
              submitCopy={directCopy}
              priceLocale={priceLocale}
              compact
            />
          );
        })}
      </div>

      <p className="biz-ui-caption mx-auto mt-4 max-w-3xl text-center sm:mt-5 2xl:mt-6">
        {directCopy.creditPackagesNote}
      </p>
    </div>
  );
}
