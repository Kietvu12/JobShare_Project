import { BUSINESS_UI_FONT, BUSINESS_UI_TYPOGRAPHY_STYLES } from './businessUiFont';

export const creditPricingPanelStyles = `
  ${BUSINESS_UI_TYPOGRAPHY_STYLES}
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

export const creditPricingModalStyles = `
  ${creditPricingPanelStyles}
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
  @media (max-width: 639px) {
    .credit-pricing-modal-shell.business-app-ui {
      --biz-fs-title: 0.9375rem;
      --biz-fs-section: 0.6875rem;
      --biz-fs-body: 0.625rem;
      --biz-fs-caption: 0.5625rem;
      --biz-fs-micro: 0.5rem;
      --biz-fs-stat: 0.875rem;
    }
    .credit-pricing-modal-shell .credit-pricing-card {
      border-radius: 0.75rem;
      padding: 0.625rem !important;
    }
    .credit-pricing-modal-shell .credit-pricing-card .credit-pricing-cta {
      padding-top: 0.375rem;
      padding-bottom: 0.375rem;
      border-radius: 0.5rem;
    }
    .credit-pricing-modal-shell .credit-pricing-card-featured .biz-ui-micro.absolute {
      right: 0.375rem;
      top: 0.375rem;
      padding: 0.125rem 0.375rem;
      font-size: 0.4375rem;
      letter-spacing: 0.02em;
    }
    .credit-pricing-modal-shell .credit-pricing-panel .credit-pricing-price {
      font-size: 0.875rem;
    }
    .credit-pricing-modal-shell .credit-pricing-card ul {
      margin-top: 0.5rem;
    }
    .credit-pricing-modal-shell .credit-pricing-card ul li + li {
      margin-top: 0.25rem;
    }
    .credit-pricing-modal-shell .credit-pricing-card ul li svg {
      width: 0.625rem;
      height: 0.625rem;
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
`;

export const creditPricingIntroStyles = `
  ${creditPricingPanelStyles}
  .credit-pricing-intro-shell {
    --biz-fs-title: 1.0625rem;
    --biz-fs-section: 0.8125rem;
    --biz-fs-body: 0.75rem;
    --biz-fs-caption: 0.6875rem;
    --biz-fs-micro: 0.625rem;
    --biz-fs-stat: 1.375rem;
  }
  @media (min-width: 1280px) {
    .credit-pricing-intro-shell {
      --biz-fs-stat: 1.5rem;
    }
  }
  .credit-pricing-intro-shell .credit-pricing-card:not(.credit-pricing-card-featured),
  .credit-pricing-intro-shell .credit-pricing-card-featured {
    min-height: 0;
    transform: none;
    margin-top: 0;
    margin-bottom: 0;
  }
`;
