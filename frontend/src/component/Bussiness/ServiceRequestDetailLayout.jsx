import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X, Gift, FileText, Download } from 'lucide-react';
import ServiceRequestAccountSidebar from './ServiceRequestAccountSidebar';

export const SR_PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
export const SR_CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4';
export const SR_BRAND = '#0077B6';

export const SR_PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .service-req-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .service-req-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .service-req-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;

export default function ServiceRequestDetailLayout({
  dashboard,
  successMsg,
  onDismissSuccess,
  children,
}) {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8] text-[11px]"
      style={{ fontFamily: SR_PAGE_FONT }}
    >
      <style>{SR_PAGE_STYLES}</style>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 sm:p-4">
        <nav className="flex shrink-0 flex-wrap items-center gap-1 text-[11px] text-slate-500">
          <Link to="/business/service-requests" className="font-medium text-[#0077B6] hover:underline">
            Yêu cầu dịch vụ
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="font-semibold text-slate-700">Xem chi tiết</span>
        </nav>

        {successMsg ? (
          <div className={`${SR_CARD} flex shrink-0 items-start justify-between gap-2 border-emerald-200 bg-emerald-50 py-2 text-[11px] text-emerald-800`}>
            <span>{successMsg}</span>
            <button type="button" onClick={onDismissSuccess} className="border-0 bg-transparent p-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden md:grid-cols-[minmax(0,1fr)_268px] md:grid-rows-1 md:items-stretch">
          <div className={`${SR_CARD} flex h-full min-h-0 flex-col overflow-hidden`}>
            {children}
          </div>
          <ServiceRequestAccountSidebar dashboard={dashboard} />
        </div>
      </div>
    </div>
  );
}

/** Vùng giữa — chiếm hết chiều cao còn lại, chia đều cho box lợi ích / gói credit. */
export function ServiceRequestDetailBody({ children }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {children}
    </div>
  );
}

export function ServiceRequestDetailHeader({ icon: Icon, iconBg, iconColor, title, description }) {
  const paragraphs = Array.isArray(description) ? description : [description];

  return (
    <div className="mb-2 flex shrink-0 items-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold leading-snug text-slate-900">{title}</h1>
        <div className="mt-1.5 space-y-1">
          {paragraphs.filter(Boolean).map((para) => (
            <p key={para} className="text-[11px] leading-snug text-slate-600">{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServiceRequestBenefitsBox({ accent, accentBg, title, items }) {
  const bg = accentBg === '#dcfce7' ? '#f0fdf4' : accentBg === '#fce7f3' ? '#fdf2f8' : accentBg;
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border px-3 py-3 sm:px-4"
      style={{ borderColor: `${accent}40`, background: bg }}
    >
      <div className="mb-2 flex shrink-0 items-start gap-1.5">
        <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />
        <div className="text-xs font-bold leading-snug" style={{ color: accent }}>
          {title}
        </div>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1 overflow-hidden">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[11px] leading-snug text-slate-700">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: accent }}
            >
              ✓
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceRequestDocBox({ brochure, description }) {
  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-[#0077B6]/20 bg-[#e8f4fa] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
          <FileText className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0077B6]">Tài liệu giới thiệu chi tiết</div>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{description}</p>
        </div>
      </div>
      <a
        href={brochure.href}
        download
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm transition-colors hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5 text-[#0077B6]" />
        <div className="text-left">
          <div className="font-semibold text-slate-800">{brochure.label}</div>
          <div className="text-[10px] text-slate-400">{brochure.meta}</div>
        </div>
      </a>
    </div>
  );
}

export function ServiceRequestSubmitRow({ error, submitting, onSubmit, notice }) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
      {notice ? (
        <div className="min-w-0 flex-1 text-[10px] leading-snug text-slate-500">{notice}</div>
      ) : (
        <div className="hidden flex-1 sm:block" />
      )}
      <div className="flex shrink-0 flex-col items-end gap-1 sm:ml-auto">
        {error ? (
          <p className="max-w-xs text-right text-[10px] text-rose-600">{error}</p>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2 text-[11px] font-bold text-white disabled:opacity-60"
          style={{ background: SR_BRAND }}
        >
          {submitting ? 'Đang gửi…' : 'Gửi yêu cầu →'}
        </button>
      </div>
    </div>
  );
}
