import { BRAND, CARD } from './businessHomepageShell.js';
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from './businessHomepageTypography.js';

export {
  BRAND,
  CARD,
  BUSINESS_UI_FONT,
  BUSINESS_HP_TEXT,
};

export const BILL_SCROLL_STYLES = `
  .business-app-ui .billing-table-ui {
    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
  .business-app-ui .billing-table-ui th {
    font-size: 0.625rem;
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  @media (min-width: 640px) {
    .business-app-ui .billing-table-ui th {
      font-size: 0.6875rem;
    }
  }
`;

export const BILL_PAGE_STYLES = `${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}${BILL_SCROLL_STYLES}`;

export const BILL_SHELL = 'business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]';
export const BILL_INNER = 'business-homepage-ui business-app-ui flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4';
export const BILL_CARD = `${CARD}`;
export const BILL_BREADCRUMB = BUSINESS_HP_TEXT.meta;
export const BILL_BREADCRUMB_CURRENT = `font-semibold text-slate-700 ${BUSINESS_HP_TEXT.meta}`;
export const BILL_SUBTITLE = BUSINESS_HP_TEXT.caption;
export const BILL_MAIN_TAB = `border-b-2 px-2 pb-2.5 font-semibold transition-colors sm:px-3 sm:pb-3 ${BUSINESS_HP_TEXT.button}`;
export const BILL_ALERT = `${BILL_CARD} shrink-0 p-3 ${BUSINESS_HP_TEXT.body}`;
export const BILL_SUCCESS = `${BILL_ALERT} flex items-start justify-between gap-2 border-emerald-200 bg-emerald-50 text-emerald-800`;
export const BILL_SUMMARY_CARD = `${BILL_CARD} p-3 sm:p-4`;
export const BILL_SUMMARY_LABEL = BUSINESS_HP_TEXT.caption;
export const BILL_SUMMARY_VALUE = BUSINESS_HP_TEXT.stat;
export const BILL_SUMMARY_SUB = BUSINESS_HP_TEXT.body;
export const BILL_SUMMARY_LINK = BUSINESS_HP_TEXT.link;
export const BILL_FILTER_PILL = `rounded-full px-3 py-1.5 font-semibold transition-colors ${BUSINESS_HP_TEXT.button}`;
export const BILL_SEARCH_WRAP = 'flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5';
export const BILL_SEARCH_INPUT = `min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-slate-400 ${BUSINESS_HP_TEXT.body}`;
export const BILL_TABLE = 'billing-table-ui w-full border-collapse';
export const BILL_TH = 'px-3 py-1.5 sm:px-4 sm:py-2';
export const BILL_TD = 'px-3 py-2.5 align-top sm:px-4 sm:py-3';
export const BILL_CODE = `font-semibold text-[#0077B6] ${BUSINESS_HP_TEXT.body}`;
export const BILL_BADGE = `inline-block rounded-full px-2 py-0.5 font-semibold ${BUSINESS_HP_TEXT.micro}`;
export const BILL_LINK = BUSINESS_HP_TEXT.link;
export const BILL_EMPTY = `text-center text-slate-400 ${BUSINESS_HP_TEXT.body}`;
export const BILL_PAGINATION = BUSINESS_HP_TEXT.caption;
export const BILL_PAGE_BTN = `flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-semibold ${BUSINESS_HP_TEXT.button}`;

export const BILL_PANEL = `${BILL_CARD} business-app-ui flex h-full min-h-0 flex-col overflow-hidden shadow-sm`;
export const BILL_PANEL_EMPTY = `${BILL_PANEL} items-center justify-center p-6 text-center`;
export const BILL_PANEL_HEAD = 'flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3';
export const BILL_PANEL_SCROLL = 'billing-detail-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:py-4';
export const BILL_PANEL_TITLE = BUSINESS_HP_TEXT.section;
export const BILL_PANEL_EMPTY_TITLE = `font-semibold text-slate-700 ${BUSINESS_HP_TEXT.bodyLg}`;
export const BILL_PANEL_EMPTY_DESC = BUSINESS_HP_TEXT.body;
export const BILL_DETAIL_SECTION = BUSINESS_HP_TEXT.section;
export const BILL_DETAIL_BODY = BUSINESS_HP_TEXT.body;
export const BILL_DETAIL_CAPTION = BUSINESS_HP_TEXT.caption;
export const BILL_DETAIL_LABEL = `w-28 shrink-0 sm:w-32 ${BUSINESS_HP_TEXT.caption}`;
export const BILL_DETAIL_VALUE = `min-w-0 flex-1 font-medium text-slate-800 ${BUSINESS_HP_TEXT.body}`;
export const BILL_AMOUNT_BOX = 'mb-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:px-4 sm:py-3';
export const BILL_AMOUNT_VALUE = `${BUSINESS_HP_TEXT.stat}`;
export const BILL_BTN_OUTLINE = `rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 ${BUSINESS_HP_TEXT.button}`;
export const BILL_BTN_PRIMARY = `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-bold text-white disabled:opacity-60 ${BUSINESS_HP_TEXT.buttonPrimary}`;
export const BILL_BTN_LINK = `inline-flex items-center gap-1 font-semibold text-[#0077B6] hover:bg-slate-50 ${BUSINESS_HP_TEXT.button}`;
