import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  BUSINESS_CREDIT_PACKAGES,
  FEATURED_CREDIT_PACKAGE_KEY,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import apiService from '../../services/api';

function getPriceLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

function PricingPackageCard({
  pkg,
  featured,
  modalCopy,
  pkgCopy,
  onChoose,
  submitting,
  submittingKey,
  submitCopy,
  priceLocale,
}) {
  const isSubmitting = submitting && submittingKey === pkg.key;

  return (
    <article
      className={`credit-pricing-card relative flex flex-col rounded-2xl p-4 sm:p-5 2xl:p-7 ${
        featured
          ? 'credit-pricing-card-featured bg-[#0077B6] text-white shadow-xl 2xl:-my-2 2xl:min-h-[448px] 2xl:py-8'
          : 'border border-slate-100 bg-white text-slate-900 shadow-lg'
      }`}
    >
      {featured ? (
        <span className="biz-ui-micro absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 font-semibold tracking-wide backdrop-blur-sm">
          {modalCopy.bestDeal}
        </span>
      ) : null}

      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: featured ? '#ffffff' : pkg.accent }}
        />
        <h3 className="biz-ui-section">{pkg.name}</h3>
        {!featured && pkg.discountLabel ? (
          <span
            className="biz-ui-micro rounded-full px-2 py-0.5 font-bold"
            style={{
              background: pkg.discountBadgeBg || pkg.iconBg || '#dcfce7',
              color: pkg.discountBadgeColor || pkg.accent,
            }}
          >
            {pkg.discountLabel}
          </span>
        ) : null}
      </div>

      <p className="biz-ui-caption mt-2 min-h-0 sm:mt-3 2xl:min-h-[2.75rem]">
        {pkgCopy.description}
      </p>

      <div className="mt-4 sm:mt-5 2xl:mt-6">
        <div className="flex flex-wrap items-end gap-1.5">
          <span className={`credit-pricing-price ${featured ? '' : 'text-slate-900'}`}>
            {Number(pkg.priceYen).toLocaleString(priceLocale)}
          </span>
          <span className={`biz-ui-caption pb-0.5 font-semibold ${featured ? '' : 'text-slate-600'}`}>
            {modalCopy.yenUnit}
          </span>
        </div>
        <p className="biz-ui-micro mt-1.5">
          {modalCopy.priceSuffix}
        </p>
        {pkg.originalPriceYen ? (
          <p className="biz-ui-micro mt-1 line-through">
            {formatYenAmount(pkg.originalPriceYen)}
          </p>
        ) : null}
      </div>

      <ul className="mt-4 flex-1 space-y-2 sm:mt-5 sm:space-y-2.5 2xl:mt-6 2xl:space-y-3">
        {pkgCopy.features.map((feature) => (
          <li key={feature} className="biz-ui-body flex items-start gap-2">
            <Check
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${featured ? 'text-white' : 'text-[#0077B6]'}`}
              strokeWidth={2.5}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChoose(pkg.key)}
        disabled={submitting}
        className={`credit-pricing-cta biz-ui-body mt-5 w-full rounded-xl py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 2xl:mt-8 ${
          featured
            ? 'bg-white text-slate-900 hover:bg-white/95'
            : 'bg-[#0077B6] text-white hover:bg-[#006399]'
        }`}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {submitCopy.submittingTopUp}
          </span>
        ) : (
          modalCopy.choosePlan
        )}
      </button>

      <p className="biz-ui-micro mt-3 text-center font-medium 2xl:mt-4">
        {formatCreditAmount(pkg.credits)}
      </p>
    </article>
  );
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

      <div className="mt-5 grid grid-cols-1 items-stretch gap-3 sm:mt-6 sm:gap-4 2xl:mt-8 2xl:grid-cols-3 2xl:gap-5">
        {BUSINESS_CREDIT_PACKAGES.map((pkg) => {
          const pkgCopy = directCopy.pricingPackages?.[pkg.key] || {
            description: '',
            features: [],
          };
          return (
            <PricingPackageCard
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
