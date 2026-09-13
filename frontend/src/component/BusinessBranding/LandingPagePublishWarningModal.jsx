import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { formatPublishReadinessIssue } from '../../utils/landingPagePublishReadiness';
import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from '../../utils/businessUiFont';

export default function LandingPagePublishWarningModal({
  open,
  issues = [],
  copy,
  publishing,
  onClose,
  onEdit,
  onPublishAnyway,
}) {
  if (!open) return null;

  return createPortal(
    <>
      <style>{BUSINESS_UI_FONT_IMPORT}</style>
      <div
        className="fixed inset-0 z-[10040] flex items-center justify-center p-4"
        style={{ fontFamily: BUSINESS_UI_FONT }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-publish-warn-title"
      >
        <button
          type="button"
          aria-label={copy.closeDialog}
          className="absolute inset-0 bg-slate-900/45"
          onClick={onClose}
        />
        <div className="relative flex max-h-[min(85vh,520px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
          <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3 pr-10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0">
              <h2 id="lp-publish-warn-title" className="text-sm font-bold text-slate-900">
                {copy.title}
              </h2>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{copy.body}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/80 hover:text-slate-600"
              aria-label={copy.closeDialog}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto px-4 py-3 text-[11px] leading-snug text-slate-700">
            {issues.map((issue, idx) => (
              <li key={`${issue.sectionId}-${issue.type}-${idx}`} className="mb-1.5 flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden />
                <span>{formatPublishReadinessIssue(issue, copy)}</span>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 gap-2 border-t border-slate-100 p-4">
            <button
              type="button"
              disabled={publishing}
              onClick={onEdit}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {copy.backToEdit}
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={onPublishAnyway}
              className="flex-1 rounded-lg bg-amber-600 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {copy.publishAnyway}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
