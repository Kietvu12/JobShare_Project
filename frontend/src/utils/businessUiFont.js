/**
 * @deprecated Prefer importing from `businessHomepageTypography.js` — file giữ re-export tương thích.
 */
export {
  BUSINESS_UI_FONT,
  BUSINESS_UI_FONT_IMPORT,
  BUSINESS_HP_TYPOGRAPHY_TOKENS,
  BUSINESS_HP_TEXT,
  BUSINESS_HP_ZOOM_STYLES,
  BUSINESS_HP_SCROLL_STYLES,
  BUSINESS_HP_TYPOGRAPHY_VAR_STYLES,
  BUSINESS_HOMEPAGE_SHELL_STYLES,
  BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES,
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
} from './businessHomepageTypography.js';

import {
  BUSINESS_UI_FONT_IMPORT,
  BUSINESS_HP_TYPOGRAPHY_VAR_STYLES,
} from './businessHomepageTypography.js';

/** Inject typography Homepage — dùng trong BusinessLayoutWrapper, modals, … */
export const BUSINESS_UI_TYPOGRAPHY_STYLES = `
  ${BUSINESS_UI_FONT_IMPORT}
  ${BUSINESS_HP_TYPOGRAPHY_VAR_STYLES}
`;
