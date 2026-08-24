import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import ScoutCreditPackagesIntro from './ScoutCreditPackagesIntro';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';

export default function ScoutInsufficientCreditModal({
  open,
  onClose,
  language = 'vi',
  onTopUpSuccess,
}) {
  const copy = getScoutWorkspaceCopy(language).onboarding.direct;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scout-insufficient-credit-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 id="scout-insufficient-credit-title" className="biz-ui-section text-slate-900">
                {copy.insufficientCreditTitle}
              </h2>
              <p className="biz-ui-body mt-1 leading-relaxed text-slate-600">
                {copy.insufficientCreditMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label={copy.modalClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <ScoutCreditPackagesIntro
            language={language}
            showIntro={false}
            showSubmit
            compact
            onSuccess={(data) => {
              onTopUpSuccess?.(data);
            }}
          />
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="biz-ui-body w-full rounded-lg border border-slate-200 bg-white py-2 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {copy.modalClose}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
