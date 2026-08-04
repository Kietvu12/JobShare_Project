import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins, ClipboardList, Layers } from 'lucide-react';
import { CARD } from '../../utils/businessHomepageShell';

const SUMMARY_META = [
  { icon: Coins, bg: '#e8f4fa', color: '#0077B6' },
  { icon: Coins, bg: '#e0f2fe', color: '#0369a1' },
  { icon: ClipboardList, bg: '#dcfce7', color: '#16a34a' },
  { icon: Layers, bg: '#e8f4fa', color: '#0077B6' },
];

export default function ServiceRequestAccountSidebar({ dashboard }) {
  const navigate = useNavigate();

  const summaryItems = useMemo(() => {
    const s = dashboard?.summary;
    if (!s) return [];
    return [
      { label: 'Credit hiện tại', value: s.creditLabel || `${s.credit} credit` },
      { label: 'Đã dùng trong tháng', value: s.creditUsedThisMonthLabel || `${s.creditUsedThisMonth} credit` },
      { label: 'Yêu cầu đang xử lý', value: String(s.processingRequestsCount ?? 0) },
      { label: 'Dịch vụ đang hoạt động', value: String(s.activeServicesCount ?? 0) },
    ];
  }, [dashboard]);

  const recentRequests = dashboard?.recentRequests || [];

  return (
    <aside className="flex min-h-0 flex-col gap-2 lg:h-full lg:overflow-hidden">
      <div className={`${CARD} shrink-0 p-2.5 sm:p-3`}>
        <h3 className="mb-2 text-[11px] font-bold text-slate-900 sm:text-xs">Tổng quan tài khoản</h3>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-1">
          {summaryItems.map((item, i) => {
            const meta = SUMMARY_META[i] || SUMMARY_META[0];
            const Icon = meta.icon;
            return (
              <li key={item.label} className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7"
                  style={{ background: meta.bg }}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: meta.color }} />
                </div>
                <span className="min-w-0 flex-1 text-[9px] leading-snug text-slate-500 sm:text-[10px]">{item.label}</span>
                <span className="shrink-0 text-[10px] font-bold text-slate-900 sm:text-[11px]">{item.value}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${CARD} flex min-h-0 flex-1 flex-col p-2.5 sm:p-3 lg:overflow-hidden`}>
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-900 sm:text-xs">Yêu cầu gần đây</h3>
          <button
            type="button"
            onClick={() => navigate('/business/billing')}
            className="inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 text-[9px] font-semibold text-[#0077B6] hover:underline sm:text-[10px]"
          >
            Xem tất cả <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="business-homepage-scroll min-h-0 flex-1 space-y-2 overflow-y-auto sm:space-y-2.5">
          {recentRequests.length === 0 ? (
            <p className="text-[10px] text-slate-400">Chưa có yêu cầu.</p>
          ) : recentRequests.slice(0, 8).map((req) => (
            <div key={req.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-[#0077B6]">{req.id}</div>
                  <div className="mt-0.5 text-[10px] font-medium leading-snug text-slate-800">{req.title}</div>
                  {req.sub ? <div className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-400">{req.sub}</div> : null}
                </div>
                <span className="shrink-0 text-[9px] text-slate-400">{req.date}</span>
              </div>
              <span
                className="mt-1.5 inline-block rounded-full px-2 py-px text-[9px] font-semibold sm:text-[10px]"
                style={{ background: req.statusBg, color: req.statusColor }}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/business/billing')}
          className="mt-2 w-full shrink-0 rounded-lg border border-slate-200 bg-slate-50 py-2 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          Xem tất cả yêu cầu
        </button>
      </div>
    </aside>
  );
}
