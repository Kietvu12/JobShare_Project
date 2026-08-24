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
`;
