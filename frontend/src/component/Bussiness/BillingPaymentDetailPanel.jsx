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

const BRAND = '#0077B6';

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
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  state === 'done'
                    ? 'bg-emerald-500 text-white'
                    : state === 'current'
                      ? 'text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
                style={state === 'current' ? { background: BRAND } : undefined}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.step || index + 1}
              </div>
              {!isLast ? <div className="my-0.5 w-px flex-1 min-h-[12px] bg-slate-200" /> : null}
            </div>
            <div className={`pb-3 ${isLast ? 'pb-0' : ''}`}>
              <div
                className={`text-[10px] font-semibold leading-snug sm:text-[11px] ${
                  state === 'current' ? 'text-[#0077B6]' : state === 'done' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.title || copy.title}
              </div>
              <p className="mt-0.5 text-[9px] leading-snug text-slate-500 sm:text-[10px]">{copy.hint}</p>
              {timeLabel ? (
                <p className="mt-0.5 text-[9px] font-medium text-slate-600">{timeLabel}</p>
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
      <aside className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <FileText className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">Chi tiết yêu cầu thanh toán</p>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">
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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-[10px] shadow-sm sm:text-[11px]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-900 sm:text-xs">{payment.paymentCode}</div>
          <span
            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]"
            style={{ background: payment.statusBg, color: payment.statusColor }}
          >
            {payment.statusLabel}
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border-0 bg-slate-50 p-1 hover:bg-slate-100">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      <div className="billing-detail-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
        <div className="mb-3 flex items-center gap-2">
          <PaymentTypeIcon type={payment.type} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-800">{payment.feeType || payment.type}</div>
            <div className="text-[9px] text-slate-400 sm:text-[10px]">Loại phí</div>
          </div>
        </div>

        <p className="mb-3 text-[10px] leading-snug text-slate-700 sm:text-[11px]">{descriptionLabel}</p>

        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
          <div className="text-[9px] text-slate-500">Số tiền & hạn thanh toán</div>
          <div className="mt-0.5 text-sm font-bold text-rose-600">{payment.amount}</div>
          <div className="mt-0.5 text-[10px] font-medium text-slate-700">Hạn: {payment.deadline}</div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-700 hover:bg-slate-50 sm:text-[10px]"
          >
            {copy.viewDetail || 'Xem chi tiết'}
          </button>
          {canConfirm ? (
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-white disabled:opacity-60 sm:text-[10px]"
              style={{ background: BRAND }}
            >
              {confirming ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {copy.confirmPaid || 'Xác nhận đã thanh toán'}
            </button>
          ) : null}
          {primaryAttachment ? (
            <button
              type="button"
              onClick={() => openAttachment(primaryAttachment)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-[#0077B6] hover:bg-slate-50 sm:text-[10px]"
            >
              <Download className="h-3 w-3" />
              {copy.downloadVoucher || 'Tải chứng từ'}
            </button>
          ) : null}
        </div>

        <div className="mb-3 space-y-1.5 rounded-lg border border-slate-100 px-0.5 py-0.5">
          {[
            ['Dịch vụ / phí', payment.type],
            ['JD liên quan', payment.jdTitle || payment.jobCode || '—'],
            ['Ứng viên', payment.candidateName || '—'],
            ['Căn cứ phí', payment.feeBasis || '—'],
            ['Trạng thái thanh toán', payment.statusLabel],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 leading-snug">
              <span className="w-28 shrink-0 text-[9px] text-slate-500 sm:text-[10px]">{label}</span>
              <span className="min-w-0 flex-1 font-medium text-slate-800">{value || '—'}</span>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <div className="mb-2 text-[10px] font-bold text-slate-800 sm:text-[11px]">Quy trình xử lý</div>
          <PaymentPipelineVertical pipeline={payment.pipeline} />
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold text-slate-800 sm:text-[11px]">File / chứng từ (WS)</div>
          {attachments.length === 0 ? (
            <p className="text-[9px] text-slate-400 sm:text-[10px]">Chưa có file đính kèm trên yêu cầu này.</p>
          ) : (
            <ul className="space-y-1">
              {attachments.map((file) => (
                <li key={file.url || file.name}>
                  <button
                    type="button"
                    onClick={() => openAttachment(file)}
                    className="inline-flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-[9px] font-medium text-[#0077B6] hover:bg-slate-100 sm:text-[10px]"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
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
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${className}`}
      style={{ background: meta.bg }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} strokeWidth={2} />
    </div>
  );
}
