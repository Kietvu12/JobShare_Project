import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, Users, Briefcase, FilePlus2, X, ChevronRight, CheckCircle2,
} from 'lucide-react'

const BRAND = '#0077B6'

const NEXT_STEP_OPTIONS = [
  {
    num: '①',
    label: 'Tìm ứng viên bằng Scout Credit',
    icon: Search,
  },
  {
    num: '②',
    label: 'Nhờ WS Scout Performance',
    icon: Users,
  },
  {
    num: '③',
    label: 'Đăng lên Sàn HR Partner',
    icon: Briefcase,
  },
  {
    num: '④',
    label: 'Tạo Landing Page tuyển dụng',
    icon: FilePlus2,
  },
]

export default function JobCreatedNextStepsModal({ open, jobId, onClose, onSelect }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-created-next-steps-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[340px] rounded-2xl border border-slate-200 bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="px-5 pb-5 pt-6">
          <div className="flex flex-col items-center text-center pr-6">
            <div
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#0077B6]/20 bg-[#0077B6]/5"
              aria-hidden
            >
              <CheckCircle2 className="h-5 w-5" style={{ color: BRAND }} strokeWidth={2} />
            </div>
            <h2 className="biz-ui-section leading-snug text-slate-900">
              JD đã được tạo thành công
            </h2>
            <p
              id="job-created-next-steps-title"
              className="biz-ui-body mt-1.5 font-medium leading-relaxed text-slate-600"
            >
              Tiếp theo bạn muốn làm gì?
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-1.5">
            {NEXT_STEP_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <li key={opt.num}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(opt.num, jobId)}
                    className="group w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition-colors hover:border-[#0077B6]/35 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0077B6]/40 focus-visible:ring-offset-1"
                  >
                    <span className="biz-ui-caption shrink-0 w-4 font-bold tabular-nums text-slate-400">
                      {opt.num}
                    </span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[#0077B6] group-hover:bg-[#0077B6]/5 group-hover:border-[#0077B6]/15"
                      aria-hidden
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="biz-ui-body min-w-0 flex-1 font-semibold leading-snug text-slate-800">
                      {opt.label}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-[#0077B6]"
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="biz-ui-body mt-4 w-full py-1 text-center font-semibold transition-colors hover:opacity-80"
            style={{ color: BRAND }}
          >
            Ở lại trang quản lý JD
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function navigateJobCreatedNextStep(navigate, stepNum, jobId) {
  const id = jobId != null && jobId !== '' ? String(jobId) : ''
  switch (stepNum) {
    case '①':
      navigate(id ? `/business/scout/direct?jobId=${encodeURIComponent(id)}` : '/business/scout/direct')
      break
    case '②':
      navigate(id
        ? `/business/messages?tab=ws&jobId=${encodeURIComponent(id)}`
        : '/business/messages?tab=ws')
      break
    case '③':
      navigate(id
        ? `/business/candidate-sharing?create=1&jobId=${encodeURIComponent(id)}`
        : '/business/candidate-sharing?create=1')
      break
    case '④':
      navigate('/business/saiyo', { state: id ? { openLandingCreate: true, jobId: id } : { openLandingCreate: true } })
      break
    default:
      break
  }
}

export { NEXT_STEP_OPTIONS }
