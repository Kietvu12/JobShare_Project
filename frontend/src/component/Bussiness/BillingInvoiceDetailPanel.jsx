import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { PaymentTypeIcon, formatPaymentDescription } from './BillingPaymentDetailPanel';
import {
  BILL_AMOUNT_BOX,
  BILL_AMOUNT_VALUE,
  BILL_BADGE,
  BILL_BTN_OUTLINE,
  BILL_BTN_PRIMARY,
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
  BRAND,
} from '../../utils/billingUi';

export default function BillingInvoiceDetailPanel({ invoice, onClose, copy = {} }) {
  if (!invoice) {
    return (
      <aside className={BILL_PANEL_EMPTY}>
        <FileText className="mb-2 h-9 w-9 text-slate-300 sm:h-10 sm:w-10" />
        <p className={BILL_PANEL_EMPTY_TITLE}>Chi tiết hóa đơn</p>
        <p className={`mt-2 ${BILL_PANEL_EMPTY_DESC}`}>
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
    <aside className={BILL_PANEL}>
      <div className={BILL_PANEL_HEAD}>
        <div className="min-w-0">
          <div className={BILL_PANEL_TITLE}>{invoice.invoiceCode}</div>
          <span
            className={`mt-1 inline-block ${BILL_BADGE}`}
            style={{ background: invoice.statusBg, color: invoice.statusColor }}
          >
            {invoice.statusLabel}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1.5 hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className={BILL_PANEL_SCROLL}>
        <div className="mb-4 flex items-center gap-2.5">
          <PaymentTypeIcon type={invoice.type} />
          <div>
            <div className={`font-semibold text-slate-800 ${BILL_DETAIL_BODY}`}>{invoice.type}</div>
            <div className={BILL_DETAIL_CAPTION}>Loại phí</div>
          </div>
        </div>

        <p className={`mb-4 leading-snug text-slate-700 ${BILL_DETAIL_BODY}`}>{content}</p>

        <div className={`${BILL_AMOUNT_BOX} mb-4`}>
          <div className={BILL_DETAIL_CAPTION}>Số tiền đã thanh toán</div>
          <div className={`mt-1 text-emerald-700 ${BILL_AMOUNT_VALUE}`}>{invoice.amount}</div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPdf}
            disabled={!pdfUrl}
            className={`${BILL_BTN_OUTLINE} disabled:opacity-50`}
          >
            {copy.viewInvoice || 'Xem hóa đơn'}
          </button>
          <button
            type="button"
            onClick={openPdf}
            disabled={!pdfUrl}
            className={`${BILL_BTN_PRIMARY} disabled:opacity-50`}
            style={{ background: BRAND }}
          >
            <Download className="h-3.5 w-3.5" />
            {copy.downloadPdf || 'Tải PDF'}
          </button>
        </div>

        <div className="space-y-2">
          {[
            ['Ngày phát hành', invoice.issuedAt || invoice.createdAt],
            ['Ngày thanh toán', invoice.paidAt],
            ['Mã thanh toán gốc', invoice.paymentCode],
            ['JD / ứng viên', invoice.candidateName && invoice.jdTitle
              ? `${invoice.candidateName} · ${invoice.jdTitle}`
              : invoice.jdTitle || invoice.candidateName || '—'],
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
