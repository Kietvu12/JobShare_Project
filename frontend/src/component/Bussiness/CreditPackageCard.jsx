import React from 'react';
import { formatCreditAmount, formatYenAmount } from '../../utils/businessCreditPackages';

function CreditStackIcon({ color, className = '' }) {
  return (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-8 w-10 shrink-0 sm:h-9 sm:w-11 xl:h-14 xl:w-[4.25rem] ${className}`}
      aria-hidden
    >
      <ellipse cx="24" cy="30" rx="18" ry="6" fill={color} opacity="0.35" />
      <ellipse cx="24" cy="22" rx="18" ry="6" fill={color} opacity="0.6" />
      <ellipse cx="24" cy="14" rx="18" ry="6" fill={color} />
    </svg>
  );
}

export default function CreditPackageCard({ pkg, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.key)}
      className={`flex h-full w-full min-w-0 min-h-[196px] flex-col items-center justify-center rounded-xl border bg-white px-2.5 py-7 text-center transition-all sm:min-h-[208px] sm:px-3 sm:py-8 xl:min-h-[228px] xl:py-9 ${
        selected
          ? 'border-[#0077B6] ring-2 ring-[#0077B6]/15'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <CreditStackIcon color={pkg.accent} className="mb-2.5 sm:mb-3" />

      <div className="flex w-full min-w-0 flex-col items-center gap-1">
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span className="text-[11px] font-bold sm:text-xs" style={{ color: pkg.accent }}>
            {pkg.name}
          </span>
          {pkg.discountLabel ? (
            <span
              className="rounded-full px-1.5 py-px text-[9px] font-semibold sm:text-[10px]"
              style={{
                background: pkg.discountBadgeBg || pkg.iconBg || '#dcfce7',
                color: pkg.discountBadgeColor || pkg.accent,
              }}
            >
              {pkg.discountLabel}
            </span>
          ) : null}
        </div>

        <span className="text-[10px] font-medium text-slate-800 sm:text-[11px]">
          {formatCreditAmount(pkg.credits)}
        </span>

        <span className="mt-1.5 text-sm font-bold leading-tight text-slate-900 sm:mt-2 sm:text-base xl:mt-2.5 xl:text-lg">
          {formatYenAmount(pkg.priceYen)}
        </span>

        {pkg.originalPriceYen ? (
          <span className="text-[9px] text-slate-400 line-through sm:text-[10px]">
            {formatYenAmount(pkg.originalPriceYen)}
          </span>
        ) : (
          <span className="h-[1em] text-[9px] text-transparent" aria-hidden>—</span>
        )}

        <span className="mt-0.5 px-1 text-[9px] leading-snug text-slate-500 sm:text-[10px]">
          (tương đương {pkg.profileOpens} lần mở hồ sơ)
        </span>
      </div>
    </button>
  );
}
