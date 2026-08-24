import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import deleteThreadIllustration from '../../assets/Gemini_Generated_Image_2cpmu42cpmu42cpm-Picsart-BackgroundRemover.png'

const BRAND = '#0077B6'

export default function DeleteJobBuilderThreadModal({
  open,
  threadTitle,
  linkedJobId,
  onClose,
  onConfirm,
  confirming = false,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !confirming) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, confirming])

  if (!open) return null

  const title = (threadTitle || 'Phiên chat').trim()
  const hasJob = linkedJobId != null && linkedJobId !== ''

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-job-thread-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !confirming && onClose?.()}
      />
      <div className="relative w-full max-w-[320px] rounded-2xl border border-slate-200 bg-white px-5 pb-5 pt-6 shadow-xl">
        <button
          type="button"
          onClick={() => !confirming && onClose?.()}
          disabled={confirming}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={deleteThreadIllustration}
            alt=""
            className="mb-3 h-[72px] w-auto object-contain"
            draggable={false}
          />
          <h2
            id="delete-job-thread-title"
            className="biz-ui-section leading-snug text-slate-900"
          >
            Bạn có chắc muốn xóa phiên chat này?
          </h2>
          <p className="biz-ui-body mt-2 line-clamp-3 font-medium leading-relaxed text-slate-600">
            &ldquo;{title}&rdquo;
          </p>
          <p className="biz-ui-caption mt-2 leading-relaxed text-slate-500">
            {hasJob
              ? 'Phiên chat, bản nháp local và JD đã lưu trên hệ thống sẽ bị xóa. Không thể xóa JD đã có đơn ứng tuyển/tiến cử.'
              : 'Chat và bản nháp local sẽ bị xóa. Chưa có JD lưu trên hệ thống.'}
          </p>

          <button
            type="button"
            disabled={confirming}
            onClick={() => onConfirm?.()}
            className="biz-ui-body mt-5 w-full rounded-full border-2 px-4 py-2 font-bold transition hover:bg-slate-50 disabled:opacity-60"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            {confirming ? 'Đang xóa…' : 'Có, xóa phiên'}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={() => onClose?.()}
            className="biz-ui-body mt-2.5 font-semibold disabled:opacity-50"
            style={{ color: BRAND }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
