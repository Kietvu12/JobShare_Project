import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins, ClipboardList, Layers } from 'lucide-react';

const CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4';

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
    <aside className="flex h-full min-h-0 flex-col gap-3 text-[11px]">
      <div className={`${CARD} shrink-0`}>
        <h3 className="mb-2.5 text-xs font-bold text-slate-800">Tổng quan tài khoản</h3>
        <ul className="space-y-2">
          {summaryItems.map((item, i) => {
            const meta = SUMMARY_META[i] || SUMMARY_META[0];
            const Icon = meta.icon;
            return (
              <li key={item.label} className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: meta.bg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <span className="min-w-0 flex-1 text-[10px] text-slate-500">{item.label}</span>
                <span className="text-[10px] font-bold text-slate-900">{item.value}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${CARD} flex min-h-0 flex-1 flex-col`}>
        <div className="mb-2.5 flex shrink-0 items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">Yêu cầu gần đây</h3>
          <button
            type="button"
            onClick={() => navigate('/business/billing')}
            className="inline-flex items-center gap-0.5 border-0 bg-transparent p-0 text-[10px] font-semibold text-[#0077B6]"
          >
            Xem tất cả <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="service-req-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {recentRequests.length === 0 ? (
            <p className="text-[10px] text-slate-400">Chưa có yêu cầu.</p>
          ) : recentRequests.slice(0, 5).map((req) => (
            <div key={req.id} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-[#0077B6]">{req.id}</div>
                  <div className="text-[10px] font-medium text-slate-800">{req.title}</div>
                  {req.sub ? <div className="text-[9px] text-slate-400">{req.sub}</div> : null}
                </div>
                <span className="shrink-0 text-[9px] text-slate-400">{req.date}</span>
              </div>
              <span
                className="mt-1 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold"
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
          className="mt-2.5 shrink-0 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          Xem tất cả yêu cầu
        </button>
      </div>
    </aside>
  );
}
