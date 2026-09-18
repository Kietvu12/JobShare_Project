import React, { useEffect, useMemo, useState } from 'react';
import { getServiceRequestsCopy } from '../../i18n/businessApp/serviceRequests';
import { formatCreditPanelNumber } from '../../i18n/businessApp/messages';
import { Loader2, X } from 'lucide-react';
import apiService from '../../services/api';
import {
  BRAND,
  BUSINESS_HP_TEXT,
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  SR_BODY,
  SR_CAPTION,
  SR_SECTION,
} from '../../utils/serviceRequestUi';

export default function ServiceRequestModal({
  open,
  service,
  onClose,
  onSuccess,
  currentCredit,
  language = 'vi',
}) {
  const m = useMemo(() => getServiceRequestsCopy(language).modal, [language]);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
      setAmount('');
      setError('');
      setSubmitting(false);
    }
  }, [open, service?.key]);

  if (!open || !service) return null;

  const Icon = service.icon;
  const isCredit = service.apiType === 'credit';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isCredit) {
        const creditAmount = Math.trunc(Number(amount));
        if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
          setError(m.errAmount);
          setSubmitting(false);
          return;
        }
        const res = await apiService.createBusinessCreditRequest({
          amount: creditAmount,
          note: note.trim() || undefined,
        });
        if (res?.success) {
          onSuccess?.(res.data, service);
          onClose();
        } else {
          setError(res?.message || m.errCredit);
        }
      } else {
        const res = await apiService.createBusinessServiceRequest({
          serviceKey: service.key,
          serviceTitle: service.title,
          note: note.trim() || undefined,
        });
        if (res?.success) {
          onSuccess?.(res.data, service);
          onClose();
        } else {
          setError(res?.message || m.errService);
        }
      }
    } catch (err) {
      setError(err?.message || m.errGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = `w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6] ${SR_BODY}`;

  return (
    <>
      <style>{BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES}</style>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="business-app-ui w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: service.iconBg }}
            >
              <Icon className="h-5 w-5" style={{ color: service.iconColor }} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={SR_SECTION}>{service.title}</h2>
              {isCredit && currentCredit != null ? (
                <p className={`mt-0.5 ${SR_CAPTION}`}>
                  {m.currentCredit}{' '}
                  <span className="font-semibold text-slate-700">
                    {formatCreditPanelNumber(currentCredit, language)}
                  </span>
                </p>
              ) : null}
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5">
            <p className={`leading-relaxed text-slate-600 whitespace-pre-wrap ${SR_BODY}`}>
              {service.description}
            </p>

            {isCredit ? (
              <label className="block">
                <span className={`mb-1.5 block font-semibold text-slate-700 ${SR_CAPTION}`}>{m.amountLabel}</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={m.amountPlaceholder}
                  className={fieldClass}
                />
              </label>
            ) : null}

            <label className="block">
              <span className={`mb-1.5 block font-semibold text-slate-700 ${SR_CAPTION}`}>
                {m.noteLabel} {isCredit ? m.noteOptional : ''}
              </span>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isCredit
                    ? m.notePlaceholderCredit
                    : m.notePlaceholderService
                }
                className={`${fieldClass} resize-none`}
              />
            </label>

            {error ? (
              <p className={`rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 ${SR_CAPTION}`}>
                {error}
              </p>
            ) : null}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 rounded-lg border border-slate-200 bg-white py-2.5 font-semibold text-slate-600 hover:bg-slate-50 ${BUSINESS_HP_TEXT.button}`}
              >
                {m.close}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 font-bold text-white disabled:opacity-60 ${BUSINESS_HP_TEXT.buttonPrimary}`}
                style={{ background: BRAND }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {m.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
