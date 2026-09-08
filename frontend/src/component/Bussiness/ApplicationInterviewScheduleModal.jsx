import React, { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

export default function ApplicationInterviewScheduleModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  candidateName = '',
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (!open) {
      setDate('')
      setTime('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = () => {
    if (!date || !time) return
    onSubmit?.({ date, time })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      style={{ fontFamily: BUSINESS_UI_FONT }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="pr-8 text-sm font-bold text-slate-900 sm:text-base">Tạo lịch phỏng vấn</h3>
        {candidateName ? (
          <p className="mt-1 text-xs text-slate-500">Ứng viên: {candidateName}</p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Bắt buộc tạo lịch phỏng vấn để đánh giá hồ sơ là <span className="font-semibold text-emerald-700">Đạt</span>.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Ngày phỏng vấn *</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0077B6]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Giờ phỏng vấn *</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0077B6]"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || !date || !time}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#006399] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {loading ? 'Đang lưu...' : 'Tạo lịch'}
          </button>
        </div>
      </div>
    </div>
  )
}
