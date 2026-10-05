import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarDays, X } from 'lucide-react'

const COPY = {
  vi: {
    interviewDate: { title: 'Đang xếp lịch phỏng vấn', desc: 'Chọn ngày giờ phỏng vấn. Đến ngày này trạng thái sẽ tự chuyển sang "Đang phỏng vấn".', date: 'Ngày phỏng vấn', time: 'Giờ' },
    nyushaDate: { title: 'Đã gửi offer', desc: 'Chọn ngày vào công ty dự kiến. Khi ứng viên đồng ý offer và đến ngày này, trạng thái sẽ tự chuyển sang "Đã vào công ty".', date: 'Ngày vào công ty dự kiến' },
    paymentAmount: { title: 'Đã thanh toán', desc: 'Nhập số tiền đã thanh toán.', amount: 'Số tiền thanh toán' },
    cancel: 'Huỷ',
    confirm: 'Xác nhận',
  },
  en: {
    interviewDate: { title: 'Scheduling interview', desc: 'Pick the interview date and time. On that date the status switches to "Interviewing" automatically.', date: 'Interview date', time: 'Time' },
    nyushaDate: { title: 'Offer sent', desc: 'Pick the expected start date. Once the candidate accepts and that date arrives, the status switches to "Joined company" automatically.', date: 'Expected start date' },
    paymentAmount: { title: 'Paid', desc: 'Enter the amount paid.', amount: 'Payment amount' },
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  ja: {
    interviewDate: { title: '面接日程調整中', desc: '面接日時を選択してください。当日になるとステータスが「面接中」に自動で切り替わります。', date: '面接日', time: '時間' },
    nyushaDate: { title: '内定通知済み', desc: '入社予定日を選択してください。内定承諾後、当日になると「入社済み」に自動で切り替わります。', date: '入社予定日' },
    paymentAmount: { title: '支払済み', desc: '支払金額を入力してください。', amount: '支払金額' },
    cancel: 'キャンセル',
    confirm: '確定',
  },
}

const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/15'

function todayString() {
  const d = new Date()
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function StatusDetailDialog({ requires, language, onClose }) {
  const t = COPY[language] || COPY.vi
  const c = t[requires]
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [amount, setAmount] = useState('')

  const valid = requires === 'paymentAmount'
    ? amount !== '' && Number(amount) >= 0
    : Boolean(date) && (requires !== 'interviewDate' || Boolean(time))

  const submit = () => {
    if (!valid) return
    if (requires === 'interviewDate') onClose({ interviewDate: new Date(`${date}T${time}`).toISOString() })
    else if (requires === 'nyushaDate') onClose({ nyushaDate: date })
    else onClose({ paymentAmount: Number(amount) })
  }

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={() => onClose(null)}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{c.desc}</p>
            </div>
          </div>
          <button type="button" onClick={() => onClose(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {requires === 'paymentAmount' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">{c.amount}</span>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT} autoFocus />
            </label>
          ) : (
            <div className={`grid gap-3 ${requires === 'interviewDate' ? 'grid-cols-[1fr_8rem]' : 'grid-cols-1'}`}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">{c.date}</span>
                <input type="date" min={todayString()} value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} autoFocus />
              </label>
              {requires === 'interviewDate' ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">{c.time}</span>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={INPUT} />
                </label>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => onClose(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-bold text-white hover:bg-[#006399] disabled:opacity-50"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hỏi dữ liệu bắt buộc khi chuyển trạng thái (ngày PV / ngày vào dự kiến / số tiền).
 * @param {'interviewDate'|'nyushaDate'|'paymentAmount'} requires
 * @returns {Promise<object|null>} payload bổ sung, null nếu huỷ
 */
export function openBusinessStatusDetailDialog(requires, language = 'vi') {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const close = (result) => {
      root.unmount()
      host.remove()
      resolve(result)
    }
    root.render(<StatusDetailDialog requires={requires} language={language} onClose={close} />)
  })
}
