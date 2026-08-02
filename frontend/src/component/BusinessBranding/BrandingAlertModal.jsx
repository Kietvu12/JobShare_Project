import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import brandingAlertIcon from '../../../Gemini_Generated_Image_mc1m6rmc1m6rmc1m-Picsart-BackgroundRemover.png'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const BRAND = '#0077B6'

const VARIANT_STYLE = {
  success: {
    accent: BRAND,
    button: 'bg-[#0077B6] hover:bg-[#006399] text-white',
  },
  error: {
    accent: '#dc2626',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  info: {
    accent: BRAND,
    button: 'bg-[#0077B6] hover:bg-[#006399] text-white',
  },
}

export default function BrandingAlertModal({
  open,
  kind = 'notice',
  title = '',
  message = '',
  variant = 'info',
  confirmLabel = 'OK',
  cancelLabel = 'Hủy',
  hideCancel = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const styles = VARIANT_STYLE[variant] || VARIANT_STYLE.info
  const isConfirm = kind === 'confirm'

  const handleConfirm = () => {
    onConfirm?.()
    onClose?.()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branding-alert-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] overflow-visible rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <img
          src={brandingAlertIcon}
          alt=""
          className="pointer-events-none absolute -left-6 -top-11 z-20 h-[6.5rem] w-[6.5rem] -rotate-12 object-contain sm:h-28 sm:w-28"
          aria-hidden
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-5 pt-14 sm:px-7 sm:pt-16">
          {title ? (
            <h2
              id="branding-alert-title"
              className="pr-8 text-base font-bold leading-snug text-slate-900 sm:text-lg"
              style={{ color: styles.accent }}
            >
              {title}
            </h2>
          ) : null}

          {message ? (
            <p className={`whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600 sm:text-[15px] ${title ? 'mt-3' : 'pr-8'}`}>
              {message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4 sm:px-7">
          {isConfirm ? (
            <>
              {!hideCancel ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${styles.button}`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${styles.button}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
