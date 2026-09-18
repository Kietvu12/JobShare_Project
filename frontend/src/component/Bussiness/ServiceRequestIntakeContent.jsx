import React from 'react';
import { Download, FileText, Gift } from 'lucide-react';
import {
  BRAND,
  SR_BODY,
  SR_BTN_OUTLINE,
  SR_BTN_PRIMARY,
  SR_CAPTION,
  SR_CHECK,
  SR_PAGE_TITLE,
  SR_SECTION,
} from '../../utils/serviceRequestUi';

export default function ServiceRequestIntakeContent({
  icon: Icon,
  title,
  intro = [],
  benefitsTitle,
  benefits = [],
  docDescription,
  docHref,
  docDownloadLabel,
  error,
  submitting,
  onSubmit,
  submitLabel = 'Gửi yêu cầu →',
  submittingLabel = 'Đang gửi…',
  docSectionTitle = 'Tài liệu giới thiệu chi tiết',
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 sm:gap-5">
      <header className="flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="h-4 w-4 text-slate-600" strokeWidth={2} />
          </div>
          <h1 className={`leading-snug ${SR_PAGE_TITLE}`}>{title}</h1>
        </div>
        <div className="flex flex-col gap-2">
          {intro.map((para) => (
            <p key={para} className={`leading-relaxed text-slate-600 ${SR_BODY}`}>
              {para}
            </p>
          ))}
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col gap-3 border-t border-slate-100 py-4">
        <div className="flex shrink-0 items-center gap-2">
          <Gift className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
          <h2 className={`leading-snug ${SR_SECTION}`}>{benefitsTitle}</h2>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-2">
          {benefits.map((item) => (
            <li key={item} className={`flex items-start gap-2.5 leading-relaxed ${SR_BODY}`}>
              <span className={SR_CHECK}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex shrink-0 flex-col gap-3 border-t border-slate-100 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
          <h2 className={`leading-snug ${SR_SECTION}`}>{docSectionTitle}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`min-w-0 flex-1 leading-relaxed text-slate-600 ${SR_BODY}`}>
            {docDescription}
          </p>
          {docHref ? (
            <a href={docHref} download className={SR_BTN_OUTLINE}>
              <Download className="h-4 w-4 shrink-0 text-[#0077B6]" />
              <span>{docDownloadLabel}</span>
            </a>
          ) : null}
        </div>
      </section>

      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4">
        {error ? <p className={`text-rose-600 ${SR_BODY}`}>{error}</p> : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={SR_BTN_PRIMARY}
          style={{ background: BRAND }}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
