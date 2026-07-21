/**
 * Backend mirror — registry trang template (rút gọn cho tạo content).
 * Đồng bộ với frontend/src/constants/templatePageRegistry.
 */

import { getLandingPageTemplate } from './businessLandingPage.js';

export const DO_LP_KAISHAINTRO_FOLDER = 'đ\u006f\u0309_LP_kaishaintro';

export const DO_LP_KAISHAINTRO_PAGES = [
  { id: 'index', file: 'index.html', slug: '', title: 'Trang chủ', isHome: true, category: 'main', hasHero: true, layout: 'single-page-scroll' },
  { id: 'contact', file: 'contact.html', slug: 'contact', title: 'Liên hệ', isHome: false, category: 'main', layout: 'single-column' },
  { id: 'form', file: 'form.html', slug: 'form', title: 'Form gửi', isHome: false, category: 'form-flow', layout: 'single-column' },
  { id: 'confirm', file: 'confirm.html', slug: 'confirm', title: 'Xác nhận', isHome: false, category: 'form-flow', layout: 'single-column' },
  { id: 'finish', file: 'finish.html', slug: 'finish', title: 'Hoàn tất', isHome: false, category: 'form-flow', layout: 'single-column' },
];

export const DO_LP_KAISHAINTRO_NAV = [
  { label: 'お客様の声', pageId: 'index' },
  { label: '制作実績', pageId: 'index' },
  { label: '料金プラン', pageId: 'index' },
  { label: 'よく頂く質問', pageId: 'index' },
  { label: '制作の流れ', pageId: 'index' },
  { label: 'お問い合わせ', pageId: 'contact' },
];

export const DO_LP_KAISHAINTRO_REGISTRY = {
  templateKey: 'do_lp_kaishaintro',
  folder: DO_LP_KAISHAINTRO_FOLDER,
  renderMode: 'html',
  previewColor: '#dc2626',
  pages: DO_LP_KAISHAINTRO_PAGES,
  nav: DO_LP_KAISHAINTRO_NAV,
  sharedBlocks: {
    hero: {
      defaultSlide: {
        headline: '見る人を惹きつける、\nワンランク上の\nWEBサイトを制作',
        ctaPrimary: 'お問い合わせ',
        ctaSecondary: '資料請求',
      },
    },
  },
};

export const LP_RECRUITE_FOLDER = 'lp_recruite/lp_a01';

export const LP_RECRUITE_PAGES = [
  { id: 'index', file: 'index.html', slug: '', title: 'Trang chủ', isHome: true, category: 'main', hasHero: true, layout: 'single-page-scroll' },
];

export const LP_RECRUITE_NAV = [
  { label: '会社を知る', pageId: 'index', anchor: 'company' },
  { label: '仕事を知る', pageId: 'index', anchor: 'work' },
  { label: '人を知る', pageId: 'index', anchor: 'people' },
  { label: '採用情報', pageId: 'index', anchor: 'recruit' },
  { label: 'ENTRY', pageId: 'index', anchor: 'entry' },
];

export const LP_RECRUITE_REGISTRY = {
  templateKey: 'lp_recruite',
  folder: LP_RECRUITE_FOLDER,
  renderMode: 'html',
  previewColor: '#0f766e',
  pages: LP_RECRUITE_PAGES,
  nav: LP_RECRUITE_NAV,
  sharedBlocks: {
    hero: {
      type: 'recruit_hero',
      defaultSlide: {
        headline: '一緒に進化し続けよう',
        subheadline: 'EVOLVE\nTOGETHER',
        body: 'システムエンジニア・プログラマー募集',
      },
    },
  },
};

export const XANH_DARK_LP_KAISHAINTRO_FOLDER = 'xanh \u0111a\u0323\u0302m_to\u0302\u0301i_LP_business_kaishaintro';

export const XANH_DARK_LP_KAISHAINTRO_PAGES = [
  { id: 'index', file: 'index.html', slug: '', title: 'Trang chủ', isHome: true, category: 'main', hasHero: true, layout: 'single-page-scroll' },
  { id: 'contact', file: 'contact.html', slug: 'contact', title: 'Liên hệ', isHome: false, category: 'main', layout: 'single-column' },
];

export const XANH_DARK_LP_KAISHAINTRO_NAV = [
  { label: '私たちについて', pageId: 'index', anchor: 'link1' },
  { label: 'サービス', pageId: 'index', anchor: 'link2' },
  { label: 'プロフィール', pageId: 'index', anchor: 'link3' },
  { label: '私たちの強み', pageId: 'index', anchor: 'link4' },
  { label: 'ご支援の流れ', pageId: 'index', anchor: 'link5' },
  { label: 'お問い合わせ', pageId: 'contact', href: 'contact.html' },
];

export const XANH_DARK_LP_KAISHAINTRO_REGISTRY = {
  templateKey: 'xanh_dark_lp_kaishaintro',
  folder: XANH_DARK_LP_KAISHAINTRO_FOLDER,
  renderMode: 'html',
  previewColor: '#1e3a5f',
  pages: XANH_DARK_LP_KAISHAINTRO_PAGES,
  nav: XANH_DARK_LP_KAISHAINTRO_NAV,
  sharedBlocks: {
    hero: {
      type: 'hero_biz65',
      defaultSlide: {
        headline: '人の力で、\n未来をつくる。',
        body: '私たちは、はたらく人と企業の可能性を信じ、課題に向き合い、価値ある未来を共につくります。',
        ctaPrimary: '私たちについて',
        ctaSecondary: 'サービスを見る',
      },
      defaultSlides: [
        { slideClass: 'img1', image: 'images/mainimg1.jpg', imageMobile: 'images/mainimg1_s.jpg' },
        { slideClass: 'img2', image: 'images/mainimg2.jpg', imageMobile: 'images/mainimg2_s.jpg' },
        { slideClass: 'img3', image: 'images/mainimg3.jpg', imageMobile: 'images/mainimg3_s.jpg' },
      ],
    },
  },
};

export const XANH_LP_BUSINESS_SKYBLUE_FOLDER = 'xanh_LP_business/tp_biz65_skyblue';

export const XANH_LP_BUSINESS_SKYBLUE_PAGES = [
  { id: 'index', file: 'index.html', slug: '', title: 'Trang chủ', isHome: true, category: 'main', hasHero: true, layout: 'single-page-scroll' },
  { id: 'contact', file: 'contact.html', slug: 'contact', title: 'Liên hệ', isHome: false, category: 'main', layout: 'single-column' },
];

export const XANH_LP_BUSINESS_SKYBLUE_NAV = [
  { label: '私たちについて', pageId: 'index', anchor: 'link1' },
  { label: 'サービス', pageId: 'index', anchor: 'link2' },
  { label: 'プロフィール', pageId: 'index', anchor: 'link3' },
  { label: '私たちの強み', pageId: 'index', anchor: 'link4' },
  { label: 'ご支援の流れ', pageId: 'index', anchor: 'link5' },
  { label: 'お問い合わせ', pageId: 'contact', href: 'contact.html' },
];

export const XANH_LP_BUSINESS_SKYBLUE_REGISTRY = {
  templateKey: 'xanh_lp_business_skyblue',
  folder: XANH_LP_BUSINESS_SKYBLUE_FOLDER,
  renderMode: 'html',
  previewColor: '#0284c7',
  pages: XANH_LP_BUSINESS_SKYBLUE_PAGES,
  nav: XANH_LP_BUSINESS_SKYBLUE_NAV,
  sharedBlocks: {
    hero: {
      type: 'hero_biz65',
      defaultSlide: {
        headline: '人の力で、\n未来をつくる。',
        body: '私たちは、はたらく人と企業の可能性を信じ、課題に向き合い、価値ある未来を共につくります。',
        ctaPrimary: '私たちについて',
        ctaSecondary: 'サービスを見る',
      },
      defaultSlides: [
        { slideClass: 'img1', image: 'images/mainimg1.jpg', imageMobile: 'images/mainimg1_s.jpg' },
        { slideClass: 'img2', image: 'images/mainimg2.jpg', imageMobile: 'images/mainimg2_s.jpg' },
        { slideClass: 'img3', image: 'images/mainimg3.jpg', imageMobile: 'images/mainimg3_s.jpg' },
      ],
    },
  },
};

export const XANH_LP_BUSINESS_KAISHAINTRO_FOLDER = 'xanh_LP_business_kaishaintro';

export const XANH_LP_BUSINESS_KAISHAINTRO_PAGES = [
  { id: 'index', file: 'index.html', slug: '', title: 'Trang chủ', isHome: true, category: 'main', hasHero: true, layout: 'single-page-scroll' },
  { id: 'contact', file: 'contact.html', slug: 'contact', title: 'Liên hệ', isHome: false, category: 'main', layout: 'single-column' },
];

export const XANH_LP_BUSINESS_KAISHAINTRO_NAV = [
  { label: 'サービス', pageId: 'index', anchor: 'link1' },
  { label: '私たちについて', pageId: 'index', anchor: 'link2' },
  { label: 'サービスの流れ', pageId: 'index', anchor: 'link3' },
  { label: 'よく頂く質問', pageId: 'index', anchor: 'link4' },
  { label: 'お問い合わせ', pageId: 'contact', href: 'contact.html' },
];

export const XANH_LP_BUSINESS_KAISHAINTRO_REGISTRY = {
  templateKey: 'xanh_lp_business_kaishaintro',
  folder: XANH_LP_BUSINESS_KAISHAINTRO_FOLDER,
  renderMode: 'html',
  previewColor: '#1962bf',
  pages: XANH_LP_BUSINESS_KAISHAINTRO_PAGES,
  nav: XANH_LP_BUSINESS_KAISHAINTRO_NAV,
  sharedBlocks: {
    hero: {
      type: 'hero_slide',
      defaultSlide: {
        headline: 'ビジネスの未来を、\nともに創る。',
        subheadline: 'シンプルに、わかりやすく、成果に繋げる。',
        body: '私たちは、お客様の課題に寄り添い、最適なソリューションで持続的な成長をサポートします。',
        ctaPrimary: 'サービスを見る',
        ctaSecondary: 'お問い合わせ',
      },
    },
  },
};

const REGISTRY_MAP = {
  do_lp_kaishaintro: DO_LP_KAISHAINTRO_REGISTRY,
  lp_recruite: LP_RECRUITE_REGISTRY,
  xanh_dark_lp_kaishaintro: XANH_DARK_LP_KAISHAINTRO_REGISTRY,
  xanh_lp_business_skyblue: XANH_LP_BUSINESS_SKYBLUE_REGISTRY,
  xanh_lp_business_kaishaintro: XANH_LP_BUSINESS_KAISHAINTRO_REGISTRY,
};

export function resolveTemplateRegistryKey(templateKey) {
  if (!templateKey) return '';
  if (REGISTRY_MAP[templateKey]) return templateKey;
  const tpl = getLandingPageTemplate(templateKey);
  return tpl?.key && REGISTRY_MAP[tpl.key] ? tpl.key : templateKey;
}

export const HTML_RENDER_TEMPLATES = new Set(Object.keys(REGISTRY_MAP));

export function isHtmlTemplate(templateKey) {
  return HTML_RENDER_TEMPLATES.has(resolveTemplateRegistryKey(templateKey));
}

export function isTemplateRegistered(templateKey) {
  return !!REGISTRY_MAP[resolveTemplateRegistryKey(templateKey)];
}

export function getRegisteredTemplateKeys() {
  return Object.keys(REGISTRY_MAP);
}

export function getTemplatePageRegistry(templateKey) {
  return REGISTRY_MAP[resolveTemplateRegistryKey(templateKey)] || null;
}
