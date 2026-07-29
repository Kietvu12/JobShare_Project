import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Users, Briefcase, FilePlus2, X, ChevronRight } from 'lucide-react'

const NEXT_STEP_OPTIONS = [
  {
    num: '①',
    label: 'Tìm ứng viên bằng Scout Credit',
    icon: Search,
    btnClass: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
  },
  {
    num: '②',
    label: 'Nhờ WS Scout Performance',
    icon: Users,
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500',
  },
  {
    num: '③',
    label: 'Đăng lên Sàn HR Partner',
    icon: Briefcase,
    btnClass: 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500',
  },
  {
    num: '④',
    label: 'Tạo Landing Page tuyển dụng',
    icon: FilePlus2,
    btnClass: 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500',
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
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-created-next-steps-title"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-5 pt-6 pb-5 sm:px-6 sm:pt-7 sm:pb-6">
          <p className="text-center text-base sm:text-lg font-bold text-slate-800 pr-8">
            🎉 JD đã được tạo thành công.
          </p>
          <p
            id="job-created-next-steps-title"
            className="text-center text-sm text-slate-600 mt-2 mb-5"
          >
            Tiếp theo bạn muốn làm gì?
          </p>

          <div className="flex flex-col gap-2.5">
            {NEXT_STEP_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.num}
                  type="button"
                  onClick={() => onSelect?.(opt.num, jobId)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-white text-sm font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${opt.btnClass}`}
                >
                  <span className="shrink-0 text-xs font-bold opacity-90 tabular-nums">{opt.num}</span>
                  <Icon className="w-4 h-4 shrink-0 opacity-95" aria-hidden />
                  <span className="flex-1 min-w-0 leading-snug">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 py-2"
          >
            Ở lại trang quản lý JD
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export { NEXT_STEP_OPTIONS }
