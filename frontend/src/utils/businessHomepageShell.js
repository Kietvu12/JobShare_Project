import { BUSINESS_UI_FONT, BUSINESS_UI_FONT_IMPORT } from './businessUiFont.js';

export const PAGE_FONT = BUSINESS_UI_FONT;
export const BRAND = '#0077B6';
export const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm';

/** Shell + zoom — cùng pattern Message.jsx / Homepage.jsx */
export const BUSINESS_HOMEPAGE_SHELL_STYLES = `
  ${BUSINESS_UI_FONT_IMPORT}
  .business-homepage-scroll::-webkit-scrollbar { width: 5px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .business-homepage-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-shell { --hp-zoom: 1; }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
      height: calc(100% / var(--hp-zoom));
    }
  }

  .hp-title { font-size: 1.125rem; line-height: 1.3; font-weight: 700; color: #0f172a; }
  @media (min-width: 640px) { .hp-title { font-size: 1.25rem; } }
  .hp-desc { font-size: 0.75rem; line-height: 1.65; color: #64748b; }
  @media (min-width: 640px) { .hp-desc { font-size: 0.8125rem; } }
  .hp-section { font-size: 0.8125rem; line-height: 1.45; font-weight: 700; color: #1e293b; }
  @media (min-width: 640px) { .hp-section { font-size: 0.875rem; } }
  .hp-body { font-size: 0.75rem; line-height: 1.65; }
  @media (min-width: 640px) { .hp-body { font-size: 0.8125rem; } }
  .hp-caption { font-size: 0.6875rem; line-height: 1.5; }
  @media (min-width: 640px) { .hp-caption { font-size: 0.75rem; } }
`;
