import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import {
  BUSINESS_HP_TEXT,
  CARD,
  SR_BODY,
  SR_CAPTION,
  SR_LINK,
  SR_SECTION,
} from '../../utils/serviceRequestUi';
import { getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';

const RECENT_LIMIT = 5;

function RequestRow({ req }) {
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-[#0077B6] ${BUSINESS_HP_TEXT.caption}`}>{req.id}</div>
          <div className={`mt-0.5 font-medium leading-snug text-slate-800 ${SR_BODY}`}>{req.title}</div>
          {req.sub ? (
            <div className={`mt-0.5 line-clamp-2 leading-snug ${SR_CAPTION}`}>{req.sub}</div>
          ) : null}
        </div>
        <span className={`shrink-0 ${SR_CAPTION}`}>{req.date}</span>
      </div>
      <span
        className={`mt-2 inline-block rounded-full px-2 py-0.5 font-semibold ${BUSINESS_HP_TEXT.micro}`}
        style={{ background: req.statusBg, color: req.statusColor }}
      >
        {req.status}
      </span>
    </div>
  );
}

export default function ServiceRequestAccountSidebar({ dashboard, language = 'vi' }) {
  const navigate = useNavigate();
  const [allOpen, setAllOpen] = useState(false);
  const t = useMemo(() => getServiceRequestsCopy(language).sidebar, [language]);

  const recentRequests = dashboard?.recentRequests || [];
  const preview = recentRequests.slice(0, RECENT_LIMIT);
  const creditLine = useMemo(() => {
    const s = dashboard?.summary;
    if (!s) return null;
    const credit = s.creditLabel || `${s.credit ?? 0} credit`;
    const processing = s.processingRequestsCount ?? 0;
    return `${credit} · ${t.processing(processing)}`;
  }, [dashboard, t]);

  return (
    <>
      <aside className="flex min-h-0 flex-col gap-3 lg:h-full lg:min-h-0">
        {creditLine ? (
          <p className={`shrink-0 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 ${SR_BODY}`}>
            <span className="font-semibold text-slate-800">{t.account}</span> {creditLine}
          </p>
        ) : null}

        <div className={`${CARD} flex min-h-0 flex-1 flex-col p-4 sm:p-5`}>
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-2">
            <h3 className={SR_SECTION}>{t.recentTitle}</h3>
            {recentRequests.length > 0 ? (
              <button
                type="button"
                onClick={() => setAllOpen(true)}
                className={`inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 hover:underline ${SR_LINK}`}
              >
                {t.viewAll} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="business-homepage-scroll min-h-0 flex-1 space-y-0 overflow-y-auto">
            {preview.length === 0 ? (
              <p className={SR_CAPTION}>{t.empty}</p>
            ) : (
              preview.map((req) => <RequestRow key={req.id} req={req} />)
            )}
          </div>
          {recentRequests.length > 0 && recentRequests.length <= RECENT_LIMIT ? (
            <button
              type="button"
              onClick={() => navigate('/business/billing')}
              className={`mt-2.5 shrink-0 self-start hover:underline ${SR_LINK}`}
            >
              {t.billingLink}
            </button>
          ) : null}
        </div>
      </aside>

      {allOpen ? (
        <div
          className="business-app-ui fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
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
              <h2 id="all-requests-title" className={SR_SECTION}>
                {t.allModalTitle}
              </h2>
              <button type="button" onClick={() => setAllOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="business-homepage-scroll min-h-0 flex-1 overflow-y-auto px-4 py-2">
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
                className={`w-full rounded-lg bg-[#0077B6] py-2.5 text-white hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
              >
                {t.billingCta}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
