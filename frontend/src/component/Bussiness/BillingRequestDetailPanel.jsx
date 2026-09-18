import React from 'react';
import { X, FileText } from 'lucide-react';
import { PaymentTypeIcon } from './BillingPaymentDetailPanel';
import {
  BILL_BADGE,
  BILL_DETAIL_BODY,
  BILL_DETAIL_CAPTION,
  BILL_DETAIL_LABEL,
  BILL_DETAIL_VALUE,
  BILL_PANEL,
  BILL_PANEL_EMPTY,
  BILL_PANEL_EMPTY_DESC,
  BILL_PANEL_EMPTY_TITLE,
  BILL_PANEL_HEAD,
  BILL_PANEL_SCROLL,
  BILL_PANEL_TITLE,
} from '../../utils/billingUi';

function formatRequestContent(row) {
  if (!row) return '—';
  if (row.candidate && row.candidate !== '—') return row.candidate;
  if (row.jd && row.jd !== '—') return row.jd;
  return '—';
}

export default function BillingRequestDetailPanel({ request, onClose }) {
  if (!request) {
    return (
      <aside className={BILL_PANEL_EMPTY}>
        <FileText className="mb-2 h-9 w-9 text-slate-300 sm:h-10 sm:w-10" />
        <p className={BILL_PANEL_EMPTY_TITLE}>Chi tiết yêu cầu</p>
        <p className={`mt-2 ${BILL_PANEL_EMPTY_DESC}`}>
          Chọn một yêu cầu trong danh sách để xem chi tiết.
        </p>
      </aside>
    );
  }

  const content = formatRequestContent(request);

  return (
    <aside className={BILL_PANEL}>
      <div className={BILL_PANEL_HEAD}>
        <div className="min-w-0">
          <div className={BILL_PANEL_TITLE}>{request.requestCode}</div>
          <span
            className={`mt-1 inline-block ${BILL_BADGE}`}
            style={{ background: request.statusBg, color: request.statusColor }}
          >
            {request.status}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1.5 hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className={BILL_PANEL_SCROLL}>
        <div className="mb-4 flex items-center gap-2.5">
          <PaymentTypeIcon type={request.type} />
          <div>
            <div className={`font-semibold text-slate-800 ${BILL_DETAIL_BODY}`}>{request.type}</div>
            <div className={BILL_DETAIL_CAPTION}>Loại yêu cầu</div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            ['Nội dung', content],
            ['JD / Vị trí', request.jd && request.jd !== '—' ? request.jd : '—'],
            ['WS xử lý', request.ws || 'JobShare WS'],
            ['Ngày tạo', request.created || '—'],
            ['Cập nhật', request.updated || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 leading-snug">
              <span className={BILL_DETAIL_LABEL}>{label}</span>
              <span className={BILL_DETAIL_VALUE}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
