import React from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { formatApplicationDate, formatRelativeTime, getStatusCategoryStyle } from '../../utils/businessApplicationSource'

export default function JobDetailNominationsPanel({
  loading,
  applications,
  selectedId,
  onOpen,
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h2 className="biz-jd-title text-slate-800">Đơn tiến cử vào JD này</h2>
        <span className="rounded-full bg-[#0077B6]/10 px-2 py-0.5 biz-jd-body font-semibold text-[#0077B6]">
          {applications.length}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-500 biz-jd-body">
          <Loader2 className="biz-jd-icon animate-spin text-[#0077B6]" />
          Đang tải đơn tiến cử...
        </div>
      ) : applications.length === 0 ? (
        <p className="px-3 py-10 text-center biz-jd-muted">Chưa có đơn tiến cử cho JD này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                {['Ứng viên', 'Nguồn', 'Tiến cử bởi', 'Trạng thái', 'Ngày', ''].map((h, i) => (
                  <th key={h || `col-${i}`} className={`px-3 py-2 font-semibold ${i >= 3 ? 'text-center' : 'text-left'}`}>
                    {h === '' ? ' ' : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const stageStyle = getStatusCategoryStyle(app.statusCategory)
                const isSelected = String(selectedId) === String(app.id)
                return (
                  <tr
                    key={app.id}
                    onClick={() => onOpen(app)}
                    className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-[#e8f4fa]/80' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="biz-jd-body font-semibold text-slate-800">{app.candidateName}</div>
                      <div className="biz-jd-muted">{app.candidateEmail || '—'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="biz-jd-body font-semibold" style={{ color: app.sourceColor }}>
                        {app.sourceLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 biz-jd-body text-slate-600">{app.nominatedBy || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: stageStyle.color, background: stageStyle.bg }}
                      >
                        {app.statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center biz-jd-muted">
                      <div>{formatApplicationDate(app.appliedAt)}</div>
                      <div className="text-[10px] text-slate-400">{formatRelativeTime(app.appliedAt)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {app.unreadCount > 0 ? (
                          <span className="min-w-[18px] rounded-full bg-rose-500 px-1.5 py-px text-center text-[9px] font-bold text-white">
                            {app.unreadCount}
                          </span>
                        ) : null}
                        <MessageSquare className="biz-jd-icon text-[#0077B6]/70" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
