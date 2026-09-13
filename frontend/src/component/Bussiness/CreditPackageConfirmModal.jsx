import React, { useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { formatCreditAmount, formatYenAmount } from '../../utils/businessCreditPackages'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

export default function CreditPackageConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  pkg,
  unlockCost = 5,
  copy,
  priceLocale = 'vi-VN',
}) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !pkg) return null

  const opensEstimate = pkg.profileOpens
    ?? Math.max(1, Math.floor(Number(pkg.credits) / Math.max(1, Number(unlockCost))))

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{copy.confirmTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
            aria-label={copy.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">{copy.confirmSubtitle}</p>

        <dl className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{copy.packageName}</dt>
            <dd className="font-semibold text-slate-900">{pkg.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{copy.creditsAmount}</dt>
            <dd className="font-semibold text-[#0077B6]">{formatCreditAmount(pkg.credits)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{copy.priceLabel}</dt>
            <dd className="font-semibold text-slate-900">
              {Number(pkg.priceYen).toLocaleString(priceLocale)} {copy.yenUnit}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-2">
            <dt className="text-slate-500">{copy.opensEstimate}</dt>
            <dd className="font-semibold text-slate-800">
              {copy.opensEstimateValue(opensEstimate, unlockCost)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{copy.paymentTotal}</dt>
            <dd className="font-bold text-slate-900">{formatYenAmount(pkg.priceYen)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] leading-snug text-amber-800">{copy.pendingNote}</p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
