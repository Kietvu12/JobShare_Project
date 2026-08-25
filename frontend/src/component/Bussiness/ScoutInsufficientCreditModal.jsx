import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import CreditPackagesPricingPanel from './CreditPackagesPricingPanel';
import { getScoutWorkspaceCopy } from '../../i18n/businessApp/scoutWorkspace';
import { BUSINESS_UI_FONT, BUSINESS_UI_TYPOGRAPHY_STYLES } from '../../utils/businessUiFont';

const creditPricingModalStyles = `
  ${BUSINESS_UI_TYPOGRAPHY_STYLES}
  .credit-pricing-modal-shell {
    font-family: ${BUSINESS_UI_FONT};
  }
  .credit-pricing-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .credit-pricing-modal-scroll::-webkit-scrollbar { width: 4px; }
  .credit-pricing-modal-scroll::-webkit-scrollbar-track { background: transparent; }
  .credit-pricing-modal-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
  .credit-pricing-panel .credit-pricing-price {
    font-size: clamp(1.375rem, 4vw, var(--biz-fs-stat));
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  @media (min-width: 640px) {
    .credit-pricing-panel .credit-pricing-price {
      font-size: clamp(1.5rem, 3vw, 1.75rem);
    }
  }
  @media (min-width: 1536px) {
    .credit-pricing-panel .credit-pricing-price {
      font-size: 2.75rem;
    }
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .credit-pricing-modal-scroll {
      padding-top: 1.5rem !important;
      padding-bottom: 1.5rem !important;
    }
    .credit-pricing-modal-shell.business-app-ui {
      --biz-fs-title: 1.0625rem;
      --biz-fs-section: 0.75rem;
      --biz-fs-body: 0.75rem;
      --biz-fs-caption: 0.6875rem;
      --biz-fs-micro: 0.625rem;
      --biz-fs-stat: 0.9375rem;
    }
    .credit-pricing-panel .credit-pricing-price {
      font-size: 1.375rem;
    }
  }
  .credit-pricing-card-featured .biz-ui-section,
  .credit-pricing-card-featured .credit-pricing-price {
    color: #ffffff;
  }
  .credit-pricing-card-featured .biz-ui-body:not(.credit-pricing-cta) {
    color: rgba(255, 255, 255, 0.95);
  }
  .credit-pricing-card-featured .credit-pricing-cta {
    color: #0f172a;
  }
  .credit-pricing-card-featured .biz-ui-caption {
    color: rgba(255, 255, 255, 0.88);
  }
  .credit-pricing-card-featured .biz-ui-micro {
    color: rgba(255, 255, 255, 0.72);
  }
`;

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
