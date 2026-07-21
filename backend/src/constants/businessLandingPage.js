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
  minimal: 'do_lp_kaishaintro',
  tp_biz65_skyblue: 'xanh_lp_business_skyblue',
  tp_biz64_blue: 'xanh_lp_business_kaishaintro',
};

/**
 * Template HTML trong frontend/template/
 * folder = tên thư mục, layout = nhóm render React
 */
export const LANDING_PAGE_TEMPLATES = [
  {
    key: 'lp_recruite',
    folder: 'lp_recruite/lp_a01',
    name: 'LP Recruite — Tuyển dụng',
    description: 'Site tuyển dụng — company, work, people, recruit, entry',
    previewColor: '#0f766e',
    layout: 'recruit',
    category: 'recruitment',
  },
  {
    key: 'do_lp_kaishaintro',
    folder: 'đ\u006f\u0309_LP_kaishaintro',
    name: 'LP Kaisha Intro — Đỏ',
    description: 'Landing giới thiệu công ty / WEB制作 — hero, testimonial, portfolio, pricing, FAQ',
    previewColor: '#dc2626',
    layout: 'biz63',
    category: 'landing',
  },
  {
    key: 'xanh_dark_lp_kaishaintro',
    folder: 'xanh \u0111a\u0323\u0302m_to\u0302\u0301i_LP_business_kaishaintro',
    name: 'LP Kaisha Intro — Xanh đậm',
    description: 'Corporate tp_biz65 — hero slideshow, services, workflow, news',
    previewColor: '#1e3a5f',
    layout: 'biz65',
    category: 'landing',
  },
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
    key: 'xanh_lp_business_skyblue',
    folder: 'xanh_LP_business/tp_biz65_skyblue',
    name: 'LP Business — Sky Blue',
    description: 'Corporate tp_biz65 — hero slideshow, services, workflow, news',
    previewColor: '#0284c7',
    layout: 'biz65',
    category: 'landing',
  },
  {
    key: 'xanh_lp_business_kaishaintro',
    folder: 'xanh_LP_business_kaishaintro',
    name: 'LP Kaisha Intro — Xanh',
    description: 'Corporate tp_biz64 — hero slide, services, workflow, FAQ, news',
    previewColor: '#1962bf',
    layout: 'biz64',
    category: 'landing',
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
