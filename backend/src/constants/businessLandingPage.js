/** business_landing_pages.status */
export const LANDING_PAGE_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  CLOSED: 3,
};

export const LANDING_PAGE_STATUS_LABELS = {
  0: 'Nháp',
  1: 'Đang hoạt động',
  2: 'Tạm dừng',
  3: 'Đã đóng',
};

export const LANDING_PAGE_ACTIVITY_TYPES = {
  CREATED: 'created',
  PUBLISHED: 'published',
  PAUSED: 'paused',
  CLOSED: 'closed',
  FORM_SUBMITTED: 'form_submitted',
  VIEW_MILESTONE: 'view_milestone',
};

/** Map template cũ (classic/modern/minimal) sang template mới */
const LEGACY_TEMPLATE_MAP = {
  classic: 'tp_lp3_biz_movie1',
  modern: 'tp_lp3_home_slide',
  minimal: 'tp_biz62_skyblue',
};

/**
 * Template HTML trong frontend/template/
 * folder = tên thư mục, layout = nhóm render React
 */
export const LANDING_PAGE_TEMPLATES = [
  {
    key: 'tp_lp3_biz_movie1',
    folder: 'tp_lp3_biz_movie1',
    name: 'LP Video — Doanh nghiệp',
    description: 'Landing page hero video, phù hợp quảng cáo tuyển dụng',
    previewColor: '#2563eb',
    layout: 'lp3',
    heroMedia: 'video',
    category: 'landing',
  },
  {
    key: 'tp_lp3_clinic_slide',
    folder: 'tp_lp3_clinic_slide',
    name: 'LP Slide — Phòng khám / Y tế',
    description: 'Slideshow hero, layout LP chuyên nghiệp',
    previewColor: '#0d9488',
    layout: 'lp3',
    heroMedia: 'slide',
    category: 'landing',
  },
  {
    key: 'tp_lp3_home_slide',
    folder: 'tp_lp3_home_slide',
    name: 'LP Slide — Tổng quan',
    description: 'Slideshow hero, đa mục đích tuyển dụng',
    previewColor: '#7c3aed',
    layout: 'lp3',
    heroMedia: 'slide',
    category: 'landing',
  },
  {
    key: 'tp_biz65_navy',
    folder: 'tp_biz65_navy',
    name: 'Biz 65 — Navy',
    description: 'Corporate slideshow, tông navy',
    previewColor: '#1e3a5f',
    layout: 'biz65',
    category: 'corporate',
  },
  {
    key: 'tp_biz65_skyblue',
    folder: 'tp_biz65_skyblue',
    name: 'Biz 65 — Sky Blue',
    description: 'Corporate slideshow, tông xanh nhạt',
    previewColor: '#0284c7',
    layout: 'biz65',
    category: 'corporate',
  },
  {
    key: 'tp_biz64_blue',
    folder: 'tp_biz64_blue',
    name: 'Biz 64 — Blue',
    description: 'Corporate hero slide, tông xanh dương',
    previewColor: '#2563eb',
    layout: 'biz64',
    category: 'corporate',
  },
  {
    key: 'tp_biz64_navy',
    folder: 'tp_biz64_navy',
    name: 'Biz 64 — Navy',
    description: 'Corporate hero slide, tông navy',
    previewColor: '#1e293b',
    layout: 'biz64',
    category: 'corporate',
  },
  {
    key: 'tp_biz64_green',
    folder: 'tp_biz64_green',
    name: 'Biz 64 — Green',
    description: 'Corporate hero slide, tông xanh lá',
    previewColor: '#059669',
    layout: 'biz64',
    category: 'corporate',
  },
  {
    key: 'tp_biz62_skyblue',
    folder: 'tp_biz62_skyblue',
    name: 'Biz 62 — Sky Blue',
    description: 'Corporate tối giản, slideshow hero',
    previewColor: '#38bdf8',
    layout: 'biz62',
    category: 'corporate',
  },
  {
    key: 'tp_seikotsu1_navy',
    folder: 'tp_seikotsu1_navy',
    name: 'Seikotsu — Navy',
    description: 'Landing page chuyên nghiệp, hero slide',
    previewColor: '#334155',
    layout: 'seikotsu',
    category: 'specialty',
  },
];

export function getLandingPageTemplate(key) {
  const normalized = LEGACY_TEMPLATE_MAP[key] || key;
  return LANDING_PAGE_TEMPLATES.find((t) => t.key === normalized) || LANDING_PAGE_TEMPLATES[0];
}

export function getPublicLandingPagePath(slug) {
  return `/lp/${slug}`;
}

export function getTemplateAssetBase(templateKey) {
  const tpl = getLandingPageTemplate(templateKey);
  return `/template/${tpl.folder}`;
}
