import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { PaymentTypeIcon, formatPaymentDescription } from './BillingPaymentDetailPanel';

const BRAND = '#0077B6';

export default function BillingInvoiceDetailPanel({ invoice, onClose, copy = {} }) {
  if (!invoice) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <FileText className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">Chi tiết hóa đơn</p>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">
          Chọn một hóa đơn trong danh sách để xem chi tiết và tải PDF.
        </p>
      </aside>
    );
  }

  const content = formatPaymentDescription(invoice.description, invoice.related, invoice.content);
  const pdfUrl = invoice.invoicePdfUrl;

  const openPdf = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-[10px] shadow-sm sm:text-[11px]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-900 sm:text-xs">{invoice.invoiceCode}</div>
          <span
            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]"
            style={{ background: invoice.statusBg, color: invoice.statusColor }}
          >
            {invoice.statusLabel}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1 hover:bg-slate-100">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      <div className="billing-detail-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
        <div className="mb-3 flex items-center gap-2">
          <PaymentTypeIcon type={invoice.type} />
          <div>
            <div className="font-semibold text-slate-800">{invoice.type}</div>
            <div className="text-[9px] text-slate-400 sm:text-[10px]">Loại phí</div>
          </div>
        </div>

        <p className="mb-3 text-[10px] leading-snug text-slate-700 sm:text-[11px]">{content}</p>

        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
          <div className="text-[9px] text-slate-500">Số tiền đã thanh toán</div>
          <div className="mt-0.5 text-sm font-bold text-emerald-700">{invoice.amount}</div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={openPdf}
            disabled={!pdfUrl}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:text-[10px]"
          >
            {copy.viewInvoice || 'Xem hóa đơn'}
          </button>
          <button
            type="button"
            onClick={openPdf}
            disabled={!pdfUrl}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-white disabled:opacity-50 sm:text-[10px]"
            style={{ background: BRAND }}
          >
            <Download className="h-3 w-3" />
            {copy.downloadPdf || 'Tải PDF'}
          </button>
        </div>

        <div className="space-y-1.5">
          {[
            ['Ngày phát hành', invoice.issuedAt || invoice.createdAt],
            ['Ngày thanh toán', invoice.paidAt],
            ['Mã thanh toán gốc', invoice.paymentCode],
            ['JD / ứng viên', invoice.candidateName && invoice.jdTitle
              ? `${invoice.candidateName} · ${invoice.jdTitle}`
              : invoice.jdTitle || invoice.candidateName || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 leading-snug">
              <span className="w-28 shrink-0 text-[9px] text-slate-500 sm:text-[10px]">{label}</span>
              <span className="min-w-0 flex-1 font-medium text-slate-800">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
