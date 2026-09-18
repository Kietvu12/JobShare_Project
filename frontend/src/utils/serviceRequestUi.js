import { BRAND, CARD } from './businessHomepageShell.js';
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from './businessHomepageTypography.js';

export {
  BRAND,
  CARD,
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  BUSINESS_UI_FONT,
  BUSINESS_HP_TEXT,
};

export const SR_PAGE_STYLES = BUSINESS_HOMEPAGE_PAGE_BASE_STYLES;

export const SR_SHELL = 'business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]';
export const SR_INNER = 'business-homepage-ui business-app-ui flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4';
export const SR_INNER_SCROLL = 'business-homepage-ui business-app-ui flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:overflow-hidden';

export const SR_BREADCRUMB = BUSINESS_HP_TEXT.meta;
export const SR_BREADCRUMB_CURRENT = `font-semibold text-slate-700 ${BUSINESS_HP_TEXT.meta}`;
export const SR_PAGE_TITLE = BUSINESS_HP_TEXT.title;
export const SR_SECTION = BUSINESS_HP_TEXT.section;
export const SR_BODY = BUSINESS_HP_TEXT.body;
export const SR_BODY_LG = BUSINESS_HP_TEXT.bodyLg;
export const SR_CAPTION = BUSINESS_HP_TEXT.caption;
export const SR_LINK = BUSINESS_HP_TEXT.link;
export const SR_BTN_CARD = `inline-flex w-fit items-center rounded-lg border border-[#0077B6]/35 bg-white px-3 py-2 transition-colors hover:bg-[#e8f4fa] ${BUSINESS_HP_TEXT.button} text-[#0077B6]`;
export const SR_BTN_PRIMARY = `inline-flex w-fit items-center justify-center rounded-lg px-4 py-2.5 text-white disabled:opacity-60 ${BUSINESS_HP_TEXT.buttonPrimary}`;
export const SR_BTN_OUTLINE = `inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 transition-colors hover:bg-slate-50 ${BUSINESS_HP_TEXT.button}`;
export const SR_INTAKE_CARD = `${CARD} flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5`;
export const SR_CHECK = `mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0077B6] font-bold text-white ${BUSINESS_HP_TEXT.micro}`;
export const SR_SUCCESS_BANNER = `mb-2 flex shrink-0 items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 font-medium text-emerald-800 ${BUSINESS_HP_TEXT.body}`;
export const SR_CATALOG_PANEL = `${CARD} business-homepage-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4`;
export const SR_CATALOG_GRID =
  'sr-catalog-grid grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:gap-4';
export const SR_SERVICE_CARD =
  `${CARD} flex flex-col gap-3 p-4 transition-shadow hover:shadow-md sm:gap-3.5 sm:p-5`;
export const SR_SERVICE_CARD_TITLE = BUSINESS_HP_TEXT.title;
export const SR_SERVICE_CARD_DESC = `${BUSINESS_HP_TEXT.bodyLg} min-h-0 flex-1 leading-relaxed text-slate-600`;
export const SR_SERVICE_CARD_BTN = `mt-1 shrink-0 inline-flex w-full items-center justify-center rounded-lg border border-[#0077B6]/35 bg-white px-4 py-2.5 text-center font-bold leading-snug transition-colors hover:bg-[#e8f4fa] sm:mt-2 ${BUSINESS_HP_TEXT.buttonPrimary} !text-[#0077B6]`;

export const SR_CATALOG_LAYOUT_STYLES = `
  .sr-catalog-grid {
    align-items: stretch;
  }
`;
