import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { formatCreditAmount, formatYenAmount } from '../../utils/businessCreditPackages';

export default function CreditPricingPackageCard({
  pkg,
  featured = false,
  selected = false,
  modalCopy,
  pkgCopy,
  onChoose,
  submitting = false,
  submittingKey = null,
  submitCopy,
  priceLocale = 'vi-VN',
  compact = false,
}) {
  const isSubmitting = submitting && submittingKey === pkg.key;

  return (
    <article
      className={`credit-pricing-card relative flex min-w-0 flex-col rounded-2xl ${
        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5 2xl:p-7'
      } ${
        featured
          ? `credit-pricing-card-featured bg-[#0077B6] text-white shadow-xl ${
              selected ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#0077B6]' : ''
            } ${compact ? '' : '2xl:-my-2 2xl:min-h-[448px] 2xl:py-8'}`
          : `border bg-white text-slate-900 shadow-lg ${
              selected
                ? 'border-[#0077B6] ring-2 ring-[#0077B6]/15'
                : 'border-slate-100'
            }`
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

      <p className={`biz-ui-caption min-h-0 ${compact ? 'mt-2' : 'mt-2 sm:mt-3 2xl:min-h-[2.75rem]'}`}>
        {pkgCopy.description}
      </p>

      <div className={compact ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5 2xl:mt-6'}>
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

      <ul className={`flex-1 space-y-2 ${compact ? 'mt-3 sm:space-y-1.5' : 'mt-4 sm:mt-5 sm:space-y-2.5 2xl:mt-6 2xl:space-y-3'}`}>
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
        className={`credit-pricing-cta biz-ui-body w-full rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? 'mt-4 py-2 sm:py-2.5' : 'mt-5 py-2.5 sm:py-3 2xl:mt-8'
        } ${
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

      <p className={`biz-ui-micro text-center font-medium ${compact ? 'mt-2.5' : 'mt-3 2xl:mt-4'}`}>
        {formatCreditAmount(pkg.credits)}
      </p>
    </article>
  );
}
