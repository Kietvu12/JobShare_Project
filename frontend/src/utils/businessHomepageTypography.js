/**
 * Design tokens Business portal — lấy scale typography từ Homepage.jsx làm chuẩn.
 *
 * Map Tailwind Homepage → CSS variables:
 * - display (h1 chào):     text-xl / sm:text-2xl
 * - title (h2 khối lớn):   text-base / sm:text-lg
 * - section (tiêu đề panel): text-sm / sm:text-base
 * - body (mặc định UI):    text-xs / sm:text-sm
 * - body-lg (đoạn nổi):    text-sm / sm:text-base
 * - caption (label phụ):   text-xs / sm:text-sm, màu slate-500
 * - meta (ngày, breadcrumb): text-xs / sm:text-sm
 * - micro (badge nhỏ):     text-xs / sm:text-sm
 * - stat (số nổi bật):    text-base / sm:text-lg
 *
 * JD builder / chi tiết job dùng thêm --biz-hp-jd-title / --biz-hp-jd-body (alias body/title).
 */

export const BUSINESS_UI_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

export const BUSINESS_UI_FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
`;

/** Giá trị rem (mobile-first). Dùng khi cần logic JS. */
export const BUSINESS_HP_TYPOGRAPHY_TOKENS = {
  display: { base: '1.25rem', sm: '1.5rem' },
  title: { base: '1rem', sm: '1.125rem' },
  section: { base: '0.875rem', sm: '1rem' },
  body: { base: '0.75rem', sm: '0.875rem' },
  bodyLg: { base: '0.875rem', sm: '1rem' },
  caption: { base: '0.75rem', sm: '0.875rem' },
  meta: { base: '0.75rem', sm: '0.875rem' },
  micro: { base: '0.75rem', sm: '0.875rem' },
  stat: { base: '1rem', sm: '1.125rem' },
  jdTitle: { base: '0.875rem', sm: '1rem' },
  jdBody: { base: '0.75rem', sm: '0.875rem' },
};

/** Class Tailwind tương đương — dùng trực tiếp trong JSX. */
export const BUSINESS_HP_TEXT = {
  display: 'text-xl font-bold leading-tight text-slate-900 sm:text-2xl',
  title: 'text-base font-bold text-slate-900 sm:text-lg',
  section: 'text-sm font-bold text-slate-900 sm:text-base',
  body: 'text-xs text-slate-700 sm:text-sm',
  bodyLg: 'text-sm text-slate-700 sm:text-base',
  caption: 'text-xs text-slate-500 sm:text-sm',
  meta: 'text-xs text-slate-500 sm:text-sm',
  micro: 'text-xs text-slate-500 sm:text-sm',
  stat: 'text-base font-bold text-slate-900 sm:text-lg',
  link: 'text-xs font-semibold text-[#0077B6] hover:underline sm:text-sm',
  button: 'text-xs font-semibold sm:text-sm',
  buttonPrimary: 'text-xs font-bold sm:text-sm',
};

/** Zoom viewport — giống Homepage.jsx */
export const BUSINESS_HP_ZOOM_STYLES = `
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-homepage-shell { --hp-zoom: 0.84; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) and (min-height: 900px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui {
    zoom: var(--hp-zoom);
  }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
`;

/** Scroll kit: frontend/src/styles/wjsScrollKit.css (import trong index.css). */
export const BUSINESS_HP_SCROLL_STYLES = '';

/**
 * Biến CSS gắn trên .business-homepage-ui và .business-app-ui (portal business).
 * Alias --biz-fs-* giữ tương thích code cũ (.biz-ui-title, …).
 */
export const BUSINESS_HP_TYPOGRAPHY_VAR_STYLES = `
  .business-homepage-ui,
  .business-app-ui,
  .business-sidebar-ui {
    --biz-hp-display: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.display.base};
    --biz-hp-title: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.title.base};
    --biz-hp-section: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.section.base};
    --biz-hp-body: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.body.base};
    --biz-hp-body-lg: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.bodyLg.base};
    --biz-hp-caption: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.caption.base};
    --biz-hp-meta: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.meta.base};
    --biz-hp-micro: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.micro.base};
    --biz-hp-stat: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.stat.base};
    --biz-hp-jd-title: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.jdTitle.base};
    --biz-hp-jd-body: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.jdBody.base};

    --biz-fs-title: var(--biz-hp-display);
    --biz-fs-section: var(--biz-hp-section);
    --biz-fs-body: var(--biz-hp-body);
    --biz-fs-caption: var(--biz-hp-caption);
    --biz-fs-micro: var(--biz-hp-micro);
    --biz-fs-nav: var(--biz-hp-body);
    --biz-fs-stat: var(--biz-hp-stat);

    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
  @media (min-width: 640px) {
    .business-homepage-ui,
    .business-app-ui,
    .business-sidebar-ui {
      --biz-hp-display: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.display.sm};
      --biz-hp-title: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.title.sm};
      --biz-hp-section: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.section.sm};
      --biz-hp-body: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.body.sm};
      --biz-hp-body-lg: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.bodyLg.sm};
      --biz-hp-caption: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.caption.sm};
      --biz-hp-meta: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.meta.sm};
      --biz-hp-micro: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.micro.sm};
      --biz-hp-stat: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.stat.sm};
      --biz-hp-jd-title: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.jdTitle.sm};
      --biz-hp-jd-body: ${BUSINESS_HP_TYPOGRAPHY_TOKENS.jdBody.sm};
    }
  }

  .biz-hp-display { font-size: var(--biz-hp-display); line-height: 1.25; font-weight: 700; color: #0f172a; }
  .biz-hp-title { font-size: var(--biz-hp-title); line-height: 1.3; font-weight: 700; color: #0f172a; }
  .biz-hp-section { font-size: var(--biz-hp-section); line-height: 1.4; font-weight: 700; color: #0f172a; }
  .biz-hp-body { font-size: var(--biz-hp-body); line-height: 1.5; color: #334155; }
  .biz-hp-body-lg { font-size: var(--biz-hp-body-lg); line-height: 1.5; color: #334155; }
  .biz-hp-caption { font-size: var(--biz-hp-caption); line-height: 1.5; color: #64748b; }
  .biz-hp-meta { font-size: var(--biz-hp-meta); line-height: 1.5; color: #64748b; }
  .biz-hp-micro { font-size: var(--biz-hp-micro); line-height: 1.45; color: #64748b; }
  .biz-hp-stat { font-size: var(--biz-hp-stat); line-height: 1.2; font-weight: 700; color: #0f172a; }

  .biz-ui-title { font-size: var(--biz-hp-display); line-height: 1.25; font-weight: 700; color: #0f172a; }
  .biz-ui-section { font-size: var(--biz-hp-section); line-height: 1.4; font-weight: 700; color: #1e293b; }
  .biz-ui-body { font-size: var(--biz-hp-body); line-height: 1.5; color: #334155; }
  .biz-ui-caption { font-size: var(--biz-hp-caption); line-height: 1.5; color: #64748b; }
  .biz-ui-micro { font-size: var(--biz-hp-micro); line-height: 1.45; color: #64748b; }
  .biz-ui-nav { font-size: var(--biz-hp-body); line-height: 1.35; }
  .biz-ui-stat { font-size: var(--biz-hp-stat); line-height: 1.2; font-weight: 700; color: #0f172a; }

  .business-app-ui .hp-title { font-size: var(--biz-hp-display); line-height: 1.25; font-weight: 700; color: #0f172a; }
  .business-app-ui .hp-section { font-size: var(--biz-hp-section); line-height: 1.4; font-weight: 700; color: #1e293b; }
  .business-app-ui .hp-desc,
  .business-app-ui .hp-body { font-size: var(--biz-hp-body-lg); line-height: 1.55; color: #334155; }
  .business-app-ui .hp-caption { font-size: var(--biz-hp-caption); line-height: 1.5; color: #64748b; }

  .business-homepage-ui .biz-jd-title,
  .business-app-ui .biz-jd-title {
    font-size: var(--biz-hp-jd-title);
    line-height: 1.35;
    font-weight: 700;
    color: #0f172a;
  }
  .business-homepage-ui .biz-jd-body,
  .business-app-ui .biz-jd-body {
    font-size: var(--biz-hp-jd-body);
    line-height: 1.5;
    color: #334155;
  }
  .business-homepage-ui .biz-jd-muted,
  .business-app-ui .biz-jd-muted {
    font-size: var(--biz-hp-jd-body);
    line-height: 1.5;
    color: #64748b;
  }
  .business-homepage-ui .biz-jd-label,
  .business-app-ui .biz-jd-label {
    font-size: var(--biz-hp-jd-title);
    line-height: 1.35;
    font-weight: 600;
    color: #475569;
  }

  .business-homepage-ui,
  .business-app-ui {
    --biz-hp-jd-icon: 16px;
    --biz-hp-jd-icon-hit: 28px;
  }
  @media (min-width: 640px) {
    .business-homepage-ui,
    .business-app-ui {
      --biz-hp-jd-icon: 17px;
      --biz-hp-jd-icon-hit: 32px;
    }
  }
  .business-homepage-ui .biz-jd-icon,
  .business-app-ui .biz-jd-icon {
    width: var(--biz-hp-jd-icon);
    height: var(--biz-hp-jd-icon);
    flex-shrink: 0;
  }
  .business-homepage-ui .biz-jd-icon-hit,
  .business-app-ui .biz-jd-icon-hit {
    width: var(--biz-hp-jd-icon-hit);
    height: var(--biz-hp-jd-icon-hit);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .business-homepage-ui .biz-jd-icon-hit > svg,
  .business-app-ui .biz-jd-icon-hit > svg {
    width: var(--biz-hp-jd-icon);
    height: var(--biz-hp-jd-icon);
  }
`;

/** Shell + zoom + scrollbar — dùng chung JobManagement, JobDetail, JD builder, … */
export const BUSINESS_HOMEPAGE_SHELL_STYLES = `
  ${BUSINESS_UI_FONT_IMPORT}
  ${BUSINESS_HP_SCROLL_STYLES}
  ${BUSINESS_HP_ZOOM_STYLES}
`;

/** Typography + utility classes — inject cùng layout business hoặc từng trang. */
export const BUSINESS_HOMEPAGE_TYPOGRAPHY_STYLES = `
  ${BUSINESS_UI_FONT_IMPORT}
  ${BUSINESS_HP_TYPOGRAPHY_VAR_STYLES}
`;

/** Gói đầy đủ cho trang dashboard (Homepage). */
export const BUSINESS_HOMEPAGE_PAGE_BASE_STYLES = `
  ${BUSINESS_HOMEPAGE_SHELL_STYLES}
  ${BUSINESS_HP_TYPOGRAPHY_VAR_STYLES}
`;
