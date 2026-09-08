import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Coins, X } from 'lucide-react'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const COPY = {
  vi: {
    title: 'Bạn đã nạp thành công',
    body: 'Credit đã được cộng vào tài khoản của bạn. Bạn có thể bắt đầu mở hồ sơ ứng viên ngay.',
    creditLabel: 'Credit hiện tại',
    startScout: 'Bắt đầu sử dụng Scout Trực Tiếp',
    later: 'Để sau',
    close: 'Đóng',
  },
  en: {
    title: 'Top-up successful',
    body: 'Credits have been added to your account. You can start unlocking candidate profiles now.',
    creditLabel: 'Current credit',
    startScout: 'Start using Direct Scout',
    later: 'Not now',
    close: 'Close',
  },
  ja: {
    title: 'チャージが完了しました',
    body: 'クレジットがアカウントに反映されました。すぐに候補者プロフィールを開示できます。',
    creditLabel: '現在のクレジット',
    startScout: 'ダイレクトスカウトを始める',
    later: 'あとで',
    close: '閉じる',
  },
}

export default function CreditTopUpApprovedModal({
  open,
  onClose,
  onStartScout,
  credit = 0,
  language = 'vi',
}) {
  const copy = COPY[language] || COPY.vi

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-topup-approved-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label={copy.close}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" strokeWidth={2.25} />
        </div>

        <h2 id="credit-topup-approved-title" className="mt-4 text-lg font-bold text-slate-900">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.body}</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e8f4fa] bg-[#f8fbfd] px-3 py-2.5">
          <Coins className="h-4 w-4 shrink-0 text-[#0077B6]" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {copy.creditLabel}
            </div>
            <div className="text-lg font-bold text-[#0077B6]">
              {Number(credit || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {copy.later}
          </button>
          <button
            type="button"
            onClick={onStartScout}
            className="rounded-lg bg-[#0077B6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006399]"
          >
            {copy.startScout}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
