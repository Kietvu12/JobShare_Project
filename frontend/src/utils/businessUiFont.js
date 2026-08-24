/** Font stack dùng chung Business portal (sidebar, header, modal, …) */
export const BUSINESS_UI_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";

export const BUSINESS_UI_FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
`;

/**
 * Typography scale thống nhất toàn bộ Business portal.
 * - title: tiêu đề trang
 * - section: tiêu đề khối / modal
 * - body: nội dung chính (mặc định)
 * - caption: mô tả phụ, label form
 * - micro: badge, meta, footnote
 * - nav: menu sidebar
 * - stat: số liệu nổi bật (chart, credit)
 */
export const BUSINESS_UI_TYPOGRAPHY_STYLES = `
  ${BUSINESS_UI_FONT_IMPORT}
  .business-app-ui,
  .business-sidebar-ui {
    --biz-fs-title: 1.125rem;
    --biz-fs-section: 0.8125rem;
    --biz-fs-body: 0.8125rem;
    --biz-fs-caption: 0.75rem;
    --biz-fs-micro: 0.6875rem;
    --biz-fs-nav: 0.8125rem;
    --biz-fs-stat: 1rem;
    font-size: var(--biz-fs-body);
    line-height: 1.45;
    color: #334155;
  }
  @media (min-width: 640px) {
    .business-app-ui,
    .business-sidebar-ui {
      --biz-fs-title: 1.25rem;
      --biz-fs-section: 0.875rem;
      --biz-fs-body: 0.875rem;
      --biz-fs-caption: 0.8125rem;
      --biz-fs-micro: 0.75rem;
      --biz-fs-nav: 0.875rem;
      --biz-fs-stat: 1.125rem;
    }
  }

  .biz-ui-title { font-size: var(--biz-fs-title); line-height: 1.3; font-weight: 700; color: #0f172a; }
  .biz-ui-section { font-size: var(--biz-fs-section); line-height: 1.45; font-weight: 700; color: #1e293b; }
  .biz-ui-body { font-size: var(--biz-fs-body); line-height: 1.45; color: #334155; }
  .biz-ui-caption { font-size: var(--biz-fs-caption); line-height: 1.5; color: #64748b; }
  .biz-ui-micro { font-size: var(--biz-fs-micro); line-height: 1.45; color: #64748b; }
  .biz-ui-nav { font-size: var(--biz-fs-nav); line-height: 1.35; }
  .biz-ui-stat { font-size: var(--biz-fs-stat); line-height: 1.2; font-weight: 700; color: #0f172a; }

  .business-app-ui .hp-title { font-size: var(--biz-fs-title); line-height: 1.3; font-weight: 700; color: #0f172a; }
  .business-app-ui .hp-desc,
  .business-app-ui .hp-body { font-size: var(--biz-fs-body); line-height: 1.65; color: #334155; }
  .business-app-ui .hp-section { font-size: var(--biz-fs-section); line-height: 1.45; font-weight: 700; color: #1e293b; }
  .business-app-ui .hp-caption { font-size: var(--biz-fs-caption); line-height: 1.5; color: #64748b; }
`;
