import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import CreditPackagesPricingPanel from './CreditPackagesPricingPanel';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { creditPricingModalStyles } from '../../utils/creditPricingStyles';

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
    <>
      <style>{creditPricingModalStyles}</style>
      <div
        className="credit-pricing-modal-overlay fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-3 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scout-insufficient-credit-title"
        onClick={onClose}
      >
      <div
        className="credit-pricing-modal-shell business-app-ui relative flex max-h-[min(94dvh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:right-4 sm:top-4"
          aria-label={copy.modalClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="credit-pricing-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10 xl:py-12">
          <h2 id="scout-insufficient-credit-title" className="sr-only">
            {copy.insufficientCreditTitle}
          </h2>
          <CreditPackagesPricingPanel
            language={language}
            onSuccess={(data) => {
              onTopUpSuccess?.(data);
            }}
          />
        </div>
      </div>
    </div>
    </>,
    document.body,
  );
}
