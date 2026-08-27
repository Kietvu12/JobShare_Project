import React from 'react';
import { X, FileText } from 'lucide-react';
import { PaymentTypeIcon } from './BillingPaymentDetailPanel';

function formatRequestContent(row) {
  if (!row) return '—';
  if (row.candidate && row.candidate !== '—') return row.candidate;
  if (row.jd && row.jd !== '—') return row.jd;
  return '—';
}

export default function BillingRequestDetailPanel({ request, onClose }) {
  if (!request) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <FileText className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">Chi tiết yêu cầu</p>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">
          Chọn một yêu cầu trong danh sách để xem chi tiết.
        </p>
      </aside>
    );
  }

  const content = formatRequestContent(request);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-[10px] shadow-sm sm:text-[11px]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-900 sm:text-xs">{request.requestCode}</div>
          <span
            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]"
            style={{ background: request.statusBg, color: request.statusColor }}
          >
            {request.status}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1 hover:bg-slate-100">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      <div className="billing-detail-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
        <div className="mb-3 flex items-center gap-2">
          <PaymentTypeIcon type={request.type} />
          <div>
            <div className="font-semibold text-slate-800">{request.type}</div>
            <div className="text-[9px] text-slate-400 sm:text-[10px]">Loại yêu cầu</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {[
            ['Nội dung', content],
            ['JD / Vị trí', request.jd && request.jd !== '—' ? request.jd : '—'],
            ['WS xử lý', request.ws || 'JobShare WS'],
            ['Ngày tạo', request.created || '—'],
            ['Cập nhật', request.updated || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 leading-snug">
              <span className="w-24 shrink-0 text-[9px] text-slate-500 sm:w-28 sm:text-[10px]">{label}</span>
              <span className="min-w-0 flex-1 font-medium text-slate-800">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
