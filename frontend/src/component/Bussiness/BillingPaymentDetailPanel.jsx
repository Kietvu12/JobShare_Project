import React from 'react';
import {
  X,
  FileText,
  User,
  Coins,
  Megaphone,
  LayoutTemplate,
  CalendarDays,
  Building2,
} from 'lucide-react';

const BRAND = '#0077B6';

const TYPE_ICON_MAP = {
  'Phí giới thiệu': { icon: User, bg: '#dcfce7', color: '#16a34a' },
  'Nạp credit': { icon: Coins, bg: '#e8f4fa', color: '#0077B6' },
  'Phí quảng cáo tuyển dụng': { icon: Megaphone, bg: '#dcfce7', color: '#16a34a' },
  'Landing Page premium': { icon: LayoutTemplate, bg: '#fce7f3', color: '#db2777' },
  'Seminar / Campaign': { icon: CalendarDays, bg: '#ede9fe', color: '#7c3aed' },
  'Thiết kế profile company': { icon: Building2, bg: '#fef9c3', color: '#ca8a04' },
};

function getTypeIcon(type) {
  return TYPE_ICON_MAP[type] || { icon: FileText, bg: '#e8f4fa', color: BRAND };
}

export function formatPaymentDescription(description, related) {
  const raw = String(description || related || '').trim();
  if (!raw) return '—';
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  const visible = lines.filter((line) => !line.includes('__wjs_meta__:'));
  if (visible.length) return visible.join(' · ');
  return String(related || '—').split('\n')[0] || '—';
}

export default function BillingPaymentDetailPanel({ payment, onClose }) {
  if (!payment) {
    return (
      <aside className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <FileText className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">Chi tiết yêu cầu thanh toán</p>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">
          Chọn một dòng trong danh sách để xem thông tin yêu cầu thanh toán.
        </p>
      </aside>
    );
  }

  const descriptionLabel = formatPaymentDescription(payment.description, payment.related);

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
        <div className="space-y-3">
          <div className="space-y-1.5">
            {[
              ['Loại thanh toán', payment.type],
              ['Nguồn tạo', payment.source || 'Workstation'],
              ['Ngày tạo', payment.createdAt],
              ['Deadline', payment.deadline],
              ['Liên quan', descriptionLabel],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2 leading-snug">
                <span className="w-24 shrink-0 text-[9px] text-slate-500 sm:w-28 sm:text-[10px]">{label}</span>
                <span className="min-w-0 flex-1 font-medium text-slate-800">{value || '—'}</span>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 sm:text-[11px]">Chi tiết phí</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[9px] text-slate-400 sm:text-[10px]">
                  {['Hạng mục', 'Giá trị'].map((h) => (
                    <th key={h} className="px-2.5 py-1.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="px-2.5 py-1.5 text-slate-600">Mô tả</td>
                  <td className="px-2.5 py-1.5 text-slate-800">{descriptionLabel}</td>
                </tr>
                <tr>
                  <td className="px-2.5 py-1.5 font-semibold text-slate-800">Tổng cộng</td>
                  <td className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 sm:text-xs">{payment.amount}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
