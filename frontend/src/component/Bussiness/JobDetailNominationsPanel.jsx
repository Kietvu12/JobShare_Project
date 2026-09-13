import React from 'react'
import { Loader2, MessageSquare, UserPlus } from 'lucide-react'
import { formatApplicationDate, formatRelativeTime, getStatusCategoryStyle } from '../../utils/businessApplicationSource'

const CTV_SOURCE_TYPES = new Set(['ctv_marketplace', 'ctv_nomination'])
const GENERIC_NOMINATOR = new Set(['Doanh nghiệp', 'WS Admin', 'Ứng viên tự ứng tuyển', 'Business', 'WS Admin', 'Self-applied'])

function getSourceSubline(app) {
  if (!CTV_SOURCE_TYPES.has(app.sourceType)) return null
  const raw = app.collaboratorName || app.ctvName || app.nominatedBy
  if (!raw || raw === '—') return null
  if (GENERIC_NOMINATOR.has(raw)) return null
  return raw
}

export default function JobDetailNominationsPanel({
  loading,
  applications,
  selectedId,
  onOpen,
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-1.5">
        <h2 className="text-xs font-semibold text-slate-800 sm:text-sm">Đơn ứng tuyển vào JD này</h2>
        <span className="rounded-full bg-[#0077B6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0077B6]">
          {applications.length}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" />
          Đang tải đơn ứng tuyển...
        </div>
      ) : applications.length === 0 ? (
        <p className="px-3 py-8 text-center text-[11px] text-slate-500">Chưa có đơn ứng tuyển cho JD này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                {['Ứng viên', 'Nguồn', 'Trạng thái', 'Ngày', ''].map((h, i) => (
                  <th key={h || `col-${i}`} className={`px-2.5 py-1.5 font-semibold ${i >= 2 ? 'text-center' : 'text-left'}`}>
                    {h === '' ? ' ' : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const stageStyle = getStatusCategoryStyle(app.statusCategory)
                const isSelected = String(selectedId) === String(app.id)
                const ctvLine = getSourceSubline(app)
                return (
                  <tr
                    key={app.id}
                    onClick={() => onOpen(app)}
                    className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-[#e8f4fa]/80' : ''
                    }`}
                  >
                    <td className="px-2.5 py-1.5">
                      <div className="text-xs font-semibold text-slate-800">{app.candidateName}</div>
                      {app.candidateEmail ? (
                        <div className="text-[10px] text-slate-500">{app.candidateEmail}</div>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-[11px] font-semibold" style={{ color: app.sourceColor }}>
                        {app.sourceLabel}
                      </span>
                      {ctvLine ? (
                        <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-slate-500">
                          <UserPlus className="h-3 w-3 shrink-0 opacity-70" />
                          <span className="truncate">{ctvLine}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-1.5 text-center">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: stageStyle.color, background: stageStyle.bg }}
                      >
                        {app.statusLabel}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-center text-[10px] text-slate-500">
                      <div>{formatApplicationDate(app.appliedAt)}</div>
                      <div className="text-[9px] text-slate-400">{formatRelativeTime(app.appliedAt)}</div>
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {app.unreadCount > 0 ? (
                          <span className="min-w-[18px] rounded-full bg-rose-500 px-1.5 py-px text-center text-[9px] font-bold text-white">
                            {app.unreadCount}
                          </span>
                        ) : null}
                        <MessageSquare className="h-3.5 w-3.5 text-[#0077B6]/70" />
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
