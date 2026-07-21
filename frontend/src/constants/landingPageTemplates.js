export const TEMPLATE_CSS_FILES = {
  tp_lp3_biz_movie1: ['css/style.css', 'css/mainimg.css', 'css/inview.css'],
  tp_lp3_clinic_slide: ['css/style.css', 'css/mainimg.css', 'css/inview.css'],
  tp_lp3_home_slide: ['css/style.css', 'css/mainimg.css', 'css/inview.css'],
  tp_biz65_navy: ['css/style.css', 'css/theme.css', 'css/inview.css'],
  tp_biz65_skyblue: ['css/style.css', 'css/theme.css', 'css/inview.css'],
  tp_biz64_blue: ['css/style.css', 'css/theme.css', 'css/inview.css'],
  tp_biz64_navy: ['css/style.css', 'css/theme.css', 'css/inview.css'],
  tp_biz64_green: ['css/style.css', 'css/theme.css', 'css/inview.css'],
  tp_biz62_skyblue: ['css/style.css', 'css/slide.css', 'css/inview.css'],
  tp_seikotsu1_navy: ['css/style.css', 'css/theme.css', 'css/inview.css'],
};

export const LEGACY_TEMPLATE_MAP = {
  classic: 'tp_lp3_biz_movie1',
  modern: 'tp_lp3_home_slide',
  minimal: 'tp_biz62_skyblue',
};

export const LANDING_PAGE_TEMPLATES = [
  {
    key: 'tp_lp3_biz_movie1',
    folder: 'tp_lp3_biz_movie1',
    name: 'LP Video — Doanh nghiệp',
    description: 'Hero video, phù hợp quảng cáo tuyển dụng',
    previewColor: '#2563eb',
    layout: 'lp3',
    heroMedia: 'video',
    category: 'landing',
    previewImage: '/template/tp_lp3_biz_movie1/images/kodawari-1.jpg',
  },
  {
    key: 'tp_lp3_clinic_slide',
    folder: 'tp_lp3_clinic_slide',
    name: 'LP Slide — Y tế',
    description: 'Slideshow hero, layout LP chuyên nghiệp',
    previewColor: '#0d9488',
    layout: 'lp3',
    heroMedia: 'slide',
    category: 'landing',
    previewImage: '/template/tp_lp3_clinic_slide/images/kodawari-1.jpg',
  },
  {
    key: 'tp_lp3_home_slide',
    folder: 'tp_lp3_home_slide',
    name: 'LP Slide — Tổng quan',
    description: 'Slideshow hero, đa mục đích',
    previewColor: '#7c3aed',
    layout: 'lp3',
    heroMedia: 'slide',
    category: 'landing',
    previewImage: '/template/tp_lp3_home_slide/images/kodawari-1.jpg',
  },
  {
    key: 'tp_biz65_navy',
    folder: 'tp_biz65_navy',
    name: 'Biz 65 — Navy',
    description: 'Corporate slideshow, tông navy',
    previewColor: '#1e3a5f',
    layout: 'biz65',
    category: 'corporate',
    previewImage: '/template/tp_biz65_navy/images/mainimg1.jpg',
  },
  {
    key: 'tp_biz65_skyblue',
    folder: 'tp_biz65_skyblue',
    name: 'Biz 65 — Sky Blue',
    description: 'Corporate slideshow, xanh nhạt',
    previewColor: '#0284c7',
    layout: 'biz65',
    category: 'corporate',
    previewImage: '/template/tp_biz65_skyblue/images/mainimg1.jpg',
  },
  {
    key: 'tp_biz64_blue',
    folder: 'tp_biz64_blue',
    name: 'Biz 64 — Blue',
    description: 'Hero slide, xanh dương',
    previewColor: '#2563eb',
    layout: 'biz64',
    category: 'corporate',
    previewImage: '/template/tp_biz64_blue/images/mainimg1.jpg',
  },
  {
    key: 'tp_biz64_navy',
    folder: 'tp_biz64_navy',
    name: 'Biz 64 — Navy',
    description: 'Hero slide, navy',
    previewColor: '#1e293b',
    layout: 'biz64',
    category: 'corporate',
    previewImage: '/template/tp_biz64_navy/images/mainimg1.jpg',
  },
  {
    key: 'tp_biz64_green',
    folder: 'tp_biz64_green',
    name: 'Biz 64 — Green',
    description: 'Hero slide, xanh lá',
    previewColor: '#059669',
    layout: 'biz64',
    category: 'corporate',
    previewImage: '/template/tp_biz64_green/images/mainimg1.jpg',
  },
  {
    key: 'tp_biz62_skyblue',
    folder: 'tp_biz62_skyblue',
    name: 'Biz 62 — Sky Blue',
    description: 'Corporate tối giản',
    previewColor: '#38bdf8',
    layout: 'biz62',
    category: 'corporate',
    previewImage: '/template/tp_biz62_skyblue/images/mainimg1.jpg',
  },
  {
    key: 'tp_seikotsu1_navy',
    folder: 'tp_seikotsu1_navy',
    name: 'Seikotsu — Navy',
    description: 'Landing chuyên nghiệp',
    previewColor: '#334155',
    layout: 'seikotsu',
    category: 'specialty',
    previewImage: '/template/tp_seikotsu1_navy/images/mainimg1.jpg',
  },
];

export function getLandingPageTemplate(key) {
  const normalized = LEGACY_TEMPLATE_MAP[key] || key;
  return LANDING_PAGE_TEMPLATES.find((t) => t.key === normalized) || LANDING_PAGE_TEMPLATES[0];
}

export function getTemplateAssetBase(templateKey) {
  const tpl = getLandingPageTemplate(templateKey);
  return `/template/${tpl.folder}`;
}

export function getTemplateCssFiles(templateKey) {
  return TEMPLATE_CSS_FILES[templateKey] || TEMPLATE_CSS_FILES.tp_lp3_biz_movie1;
}
