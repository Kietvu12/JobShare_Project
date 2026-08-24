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
        <h3 className="biz-ui-section mb-2 text-slate-900">Tổng quan tài khoản</h3>
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
                <span className="biz-ui-caption min-w-0 flex-1 leading-snug text-slate-500">{item.label}</span>
                <span className="biz-ui-body shrink-0 font-bold text-slate-900">{item.value}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${CARD} flex min-h-0 flex-1 flex-col p-2.5 sm:p-3 lg:overflow-hidden`}>
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <h3 className="biz-ui-section text-slate-900">Yêu cầu gần đây</h3>
          <button
            type="button"
            onClick={() => navigate('/business/billing')}
            className="biz-ui-caption inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 font-semibold text-[#0077B6] hover:underline"
          >
            Xem tất cả <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="business-homepage-scroll min-h-0 flex-1 space-y-2 overflow-y-auto sm:space-y-2.5">
          {recentRequests.length === 0 ? (
            <p className="biz-ui-caption text-slate-400">Chưa có yêu cầu.</p>
          ) : recentRequests.slice(0, 8).map((req) => (
            <div key={req.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="biz-ui-caption font-semibold text-[#0077B6]">{req.id}</div>
                  <div className="biz-ui-caption mt-0.5 font-medium leading-snug text-slate-800">{req.title}</div>
                  {req.sub ? <div className="biz-ui-micro mt-0.5 line-clamp-2 leading-snug text-slate-400">{req.sub}</div> : null}
                </div>
                <span className="biz-ui-micro shrink-0 text-slate-400">{req.date}</span>
              </div>
              <span
                className="biz-ui-micro mt-1.5 inline-block rounded-full px-2 py-px font-semibold"
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
          className="biz-ui-caption mt-2 w-full shrink-0 rounded-lg border border-slate-200 bg-slate-50 py-2 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          Xem tất cả yêu cầu
        </button>
      </div>
    </aside>
  );
}
