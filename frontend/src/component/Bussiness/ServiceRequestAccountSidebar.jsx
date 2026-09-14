import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { CARD } from '../../utils/businessHomepageShell';

const RECENT_LIMIT = 5;

function RequestRow({ req }) {
  return (
    <div className="border-b border-slate-100 py-2 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-[#0077B6]">{req.id}</div>
          <div className="mt-0.5 text-[11px] font-medium leading-snug text-slate-800">{req.title}</div>
          {req.sub ? (
            <div className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-400">{req.sub}</div>
          ) : null}
        </div>
        <span className="shrink-0 text-[9px] text-slate-400">{req.date}</span>
      </div>
      <span
        className="mt-1.5 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold"
        style={{ background: req.statusBg, color: req.statusColor }}
      >
        {req.status}
      </span>
    </div>
  );
}

export default function ServiceRequestAccountSidebar({ dashboard }) {
  const navigate = useNavigate();
  const [allOpen, setAllOpen] = useState(false);

  const recentRequests = dashboard?.recentRequests || [];
  const preview = recentRequests.slice(0, RECENT_LIMIT);
  const creditLine = useMemo(() => {
    const s = dashboard?.summary;
    if (!s) return null;
    const credit = s.creditLabel || `${s.credit ?? 0} credit`;
    const processing = s.processingRequestsCount ?? 0;
    return `${credit} · ${processing} yêu cầu đang xử lý`;
  }, [dashboard]);

  return (
    <>
      <aside className="flex min-h-0 flex-col gap-2 lg:h-full">
        {creditLine ? (
          <p className="shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-[10px] text-slate-600">
            <span className="font-semibold text-slate-800">Tài khoản:</span> {creditLine}
          </p>
        ) : null}

        <div className={`${CARD} flex min-h-0 flex-1 flex-col p-2.5 sm:p-3`}>
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900">Yêu cầu gần đây</h3>
            {recentRequests.length > 0 ? (
              <button
                type="button"
                onClick={() => setAllOpen(true)}
                className="inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 text-[10px] font-semibold text-[#0077B6] hover:underline"
              >
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <div className="business-homepage-scroll min-h-0 flex-1 space-y-0 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="text-[10px] text-slate-400">Chưa có yêu cầu. Chọn dịch vụ bên trái để bắt đầu.</p>
            ) : (
              preview.map((req) => <RequestRow key={req.id} req={req} />)
            )}
          </div>
          {recentRequests.length > 0 && recentRequests.length <= RECENT_LIMIT ? (
            <button
              type="button"
              onClick={() => navigate('/business/billing')}
              className="mt-2 shrink-0 self-start text-[10px] font-semibold text-[#0077B6] hover:underline"
            >
              Quản lý trên Billing
            </button>
          ) : null}
        </div>
      </aside>

      {allOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setAllOpen(false)}
          role="presentation"
        >
          <div
            className="flex max-h-[min(80vh,520px)] w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="all-requests-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 id="all-requests-title" className="text-sm font-bold text-slate-900">
                Tất cả yêu cầu gần đây
              </h2>
              <button type="button" onClick={() => setAllOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {recentRequests.map((req) => (
                <RequestRow key={req.id} req={req} />
              ))}
            </div>
            <div className="shrink-0 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setAllOpen(false);
                  navigate('/business/billing');
                }}
                className="w-full rounded-lg bg-[#0077B6] py-2 text-xs font-semibold text-white hover:bg-[#006399]"
              >
                Mở trang Billing &amp; yêu cầu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
