import React, { useState } from 'react';
import {
  X,
  FileText,
  User,
  Coins,
  Megaphone,
  LayoutTemplate,
  CalendarDays,
  Building2,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import apiService from '../../services/api';
import {
  BILL_AMOUNT_BOX,
  BILL_AMOUNT_VALUE,
  BILL_BADGE,
  BILL_BTN_LINK,
  BILL_BTN_OUTLINE,
  BILL_BTN_PRIMARY,
  BILL_DETAIL_BODY,
  BILL_DETAIL_CAPTION,
  BILL_DETAIL_LABEL,
  BILL_DETAIL_SECTION,
  BILL_DETAIL_VALUE,
  BILL_PANEL,
  BILL_PANEL_EMPTY,
  BILL_PANEL_EMPTY_DESC,
  BILL_PANEL_EMPTY_TITLE,
  BILL_PANEL_HEAD,
  BILL_PANEL_SCROLL,
  BILL_PANEL_TITLE,
  BRAND,
  BUSINESS_HP_TEXT,
} from '../../utils/billingUi';

const TYPE_ICON_MAP = {
  'Phí giới thiệu': { icon: User, bg: '#dcfce7', color: '#16a34a' },
  'Nạp credit': { icon: Coins, bg: '#e8f4fa', color: '#0077B6' },
  'Phí quảng cáo tuyển dụng': { icon: Megaphone, bg: '#dcfce7', color: '#16a34a' },
  'Landing Page premium': { icon: LayoutTemplate, bg: '#fce7f3', color: '#db2777' },
  'Seminar / Campaign': { icon: CalendarDays, bg: '#ede9fe', color: '#7c3aed' },
  'Thiết kế profile company': { icon: Building2, bg: '#fef9c3', color: '#ca8a04' },
};

const PIPELINE_COPY = [
  {
    title: 'WS tạo yêu cầu thanh toán',
    hint: 'Ngày tạo, nội dung phí, số tiền.',
  },
  {
    title: 'Doanh nghiệp kiểm tra',
    hint: 'Xem chi tiết và xác nhận thông tin thanh toán.',
  },
  {
    title: 'Doanh nghiệp thanh toán',
    hint: 'Xác nhận đã chuyển khoản / tải chứng từ nếu có.',
  },
  {
    title: 'WS xác nhận hoàn tất',
    hint: 'WS kiểm tra thanh toán và hoàn tất giao dịch.',
  },
];

function getTypeIcon(type) {
  return TYPE_ICON_MAP[type] || { icon: FileText, bg: '#e8f4fa', color: BRAND };
}

export function formatPaymentDescription(description, related, content) {
  if (content) return content;
  const raw = String(description || related || '').trim();
  if (!raw) return '—';
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const visible = lines.filter((line) => !line.includes('__wjs_meta__:'));
  if (visible.length) return visible.join(' · ');
  return String(related || '—').split('\n')[0] || '—';
}

function formatStepTime(at) {
  if (!at) return null;
  try {
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return null;
  }
}

function PaymentPipelineVertical({ pipeline }) {
  const steps = pipeline?.steps?.length
    ? pipeline.steps
    : PIPELINE_COPY.map((s, i) => ({ ...s, step: i + 1, state: 'pending', at: null }));

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const copy = PIPELINE_COPY[index] || {};
        const state = step.state || 'pending';
        const isLast = index === steps.length - 1;
        const timeLabel = formatStepTime(step.at);
        return (
          <div key={step.key || index} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold ${BUSINESS_HP_TEXT.button} ${
                  state === 'done'
                    ? 'bg-emerald-500 text-white'
                    : state === 'current'
                      ? 'text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
                style={state === 'current' ? { background: BRAND } : undefined}
              >
                {state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : step.step || index + 1}
              </div>
              {!isLast ? <div className="my-0.5 w-px flex-1 min-h-[14px] bg-slate-200" /> : null}
            </div>
            <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
              <div
                className={`font-semibold leading-snug ${BILL_DETAIL_BODY} ${
                  state === 'current' ? 'text-[#0077B6]' : state === 'done' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.title || copy.title}
              </div>
              <p className={`mt-1 leading-snug text-slate-500 ${BILL_DETAIL_CAPTION}`}>{copy.hint}</p>
              {timeLabel ? (
                <p className={`mt-1 font-medium text-slate-600 ${BILL_DETAIL_CAPTION}`}>{timeLabel}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BillingPaymentDetailPanel({
  payment,
  onClose,
  onConfirmed,
  copy = {},
}) {
  const [confirming, setConfirming] = useState(false);

  if (!payment) {
    return (
      <aside className={BILL_PANEL_EMPTY}>
        <FileText className="mb-2 h-9 w-9 text-slate-300 sm:h-10 sm:w-10" />
        <p className={BILL_PANEL_EMPTY_TITLE}>Chi tiết yêu cầu thanh toán</p>
        <p className={`mt-2 ${BILL_PANEL_EMPTY_DESC}`}>
          Chọn một yêu cầu trong danh sách để xem chi tiết và quy trình xử lý.
        </p>
      </aside>
    );
  }

  const descriptionLabel = formatPaymentDescription(
    payment.description,
    payment.related,
    payment.content,
  );
  const canConfirm = payment.status === 'unpaid';
  const attachments = payment.attachments || [];
  const primaryAttachment = attachments[0];

  const handleConfirm = async () => {
    if (!canConfirm || confirming) return;
    setConfirming(true);
    try {
      const res = await apiService.confirmBusinessBillingInvoicePayment(payment.id);
      if (res?.success) {
        onConfirmed?.(res.data?.payment || payment);
      }
    } finally {
      setConfirming(false);
    }
  };

  const openAttachment = (file) => {
    const url = file?.url || file?.href;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className={BILL_PANEL}>
      <div className={BILL_PANEL_HEAD}>
        <div className="min-w-0">
          <div className={BILL_PANEL_TITLE}>{payment.paymentCode}</div>
          <span
            className={`mt-1 inline-block ${BILL_BADGE}`}
            style={{ background: payment.statusBg, color: payment.statusColor }}
          >
            {payment.statusLabel}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1.5 hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className={BILL_PANEL_SCROLL}>
        <div className="mb-4 flex items-center gap-2.5">
          <PaymentTypeIcon type={payment.type} />
          <div className="min-w-0">
            <div className={`font-semibold text-slate-800 ${BILL_DETAIL_BODY}`}>{payment.feeType || payment.type}</div>
            <div className={BILL_DETAIL_CAPTION}>Loại phí</div>
          </div>
        </div>

        <p className={`mb-4 leading-snug text-slate-700 ${BILL_DETAIL_BODY}`}>{descriptionLabel}</p>

        <div className={`${BILL_AMOUNT_BOX} mb-4`}>
          <div className={BILL_DETAIL_CAPTION}>Số tiền & hạn thanh toán</div>
          <div className={`mt-1 text-rose-600 ${BILL_AMOUNT_VALUE}`}>{payment.amount}</div>
          <div className={`mt-1 font-medium text-slate-700 ${BILL_DETAIL_BODY}`}>Hạn: {payment.deadline}</div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className={BILL_BTN_OUTLINE}>
            {copy.viewDetail || 'Xem chi tiết'}
          </button>
          {canConfirm ? (
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className={BILL_BTN_PRIMARY}
              style={{ background: BRAND }}
            >
              {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {copy.confirmPaid || 'Xác nhận đã thanh toán'}
            </button>
          ) : null}
          {primaryAttachment ? (
            <button
              type="button"
              onClick={() => openAttachment(primaryAttachment)}
              className={BILL_BTN_LINK}
            >
              <Download className="h-3.5 w-3.5" />
              {copy.downloadVoucher || 'Tải chứng từ'}
            </button>
          ) : null}
        </div>

        <div className="mb-4 space-y-2 rounded-lg border border-slate-100 p-2">
          {[
            ['Dịch vụ / phí', payment.type],
            ['JD liên quan', payment.jdTitle || payment.jobCode || '—'],
            ['Ứng viên', payment.candidateName || '—'],
            ['Căn cứ phí', payment.feeBasis || '—'],
            ['Trạng thái thanh toán', payment.statusLabel],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 leading-snug">
              <span className={BILL_DETAIL_LABEL}>{label}</span>
              <span className={BILL_DETAIL_VALUE}>{value || '—'}</span>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className={`mb-3 text-slate-800 ${BILL_DETAIL_SECTION}`}>Quy trình xử lý</div>
          <PaymentPipelineVertical pipeline={payment.pipeline} />
        </div>

        <div>
          <div className={`mb-2 text-slate-800 ${BILL_DETAIL_SECTION}`}>File / chứng từ (WS)</div>
          {attachments.length === 0 ? (
            <p className={BILL_DETAIL_CAPTION}>Chưa có file đính kèm trên yêu cầu này.</p>
          ) : (
            <ul className="space-y-1.5">
              {attachments.map((file) => (
                <li key={file.url || file.name}>
                  <button
                    type="button"
                    onClick={() => openAttachment(file)}
                    className={`inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100 ${BILL_BTN_LINK}`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.name || 'Tải file'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

export function PaymentTypeIcon({ type, className = '' }) {
  const meta = getTypeIcon(type);
  const Icon = meta.icon;
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${className}`}
      style={{ background: meta.bg }}
    >
      <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" style={{ color: meta.color }} strokeWidth={2} />
    </div>
  );
}
