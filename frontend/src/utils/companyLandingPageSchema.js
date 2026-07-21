import { getLandingPageTemplate } from '../constants/landingPageTemplates';
import {
  getTemplatePageRegistry,
  getTemplatePages,
  isHtmlTemplate,
} from '../constants/templatePageRegistry';
import { seedHtmlSectionOverrides, mergeHtmlTemplateContent, resolveSectionRef } from './htmlTemplateOverrides';

export const BUILDER_VERSION = 2;
export const BUILDER_TYPE = 'company';

export const SECTION_TYPES = [
  { type: 'hero', label: 'Hero', icon: '🎯' },
  { type: 'text_image', label: 'Văn bản + ảnh', icon: '📝' },
  { type: 'features', label: 'Điểm nổi bật', icon: '✨' },
  { type: 'gallery', label: 'Thư viện ảnh', icon: '🖼️' },
  { type: 'video', label: 'Video', icon: '🎬' },
  { type: 'cta', label: 'Nút hành động', icon: '👆' },
  { type: 'form', label: 'Form liên hệ', icon: '📋' },
  { type: 'spacer', label: 'Khoảng trống', icon: '↕️' },
];

export const MOTION_PRESETS = [
  { value: 'none', label: 'Không' },
  { value: 'fade-in', label: 'Fade in' },
  { value: 'slide-up', label: 'Trượt lên' },
  { value: 'slide-left', label: 'Trượt trái' },
  { value: 'zoom-in', label: 'Phóng to' },
];

export const NAV_ACTION_TYPES = [
  { value: 'page', label: 'Chuyển trang nội bộ' },
  { value: 'url', label: 'Link ngoài' },
  { value: 'anchor', label: 'Cuộn tới section' },
  { value: 'scroll', label: 'Cuộn tới ID' },
];

export function createSectionId(prefix = 'sec') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createPageId(prefix = 'page') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultFormSection() {
  return {
    title: 'Liên hệ với chúng tôi',
    submitText: 'Gửi tin nhắn',
    fields: [
      { key: 'name', label: 'Họ và tên', required: true, type: 'text' },
      { key: 'email', label: 'Email', required: true, type: 'email' },
      { key: 'phone', label: 'Số điện thoại', required: false, type: 'tel' },
      { key: 'message', label: 'Nội dung', required: false, type: 'textarea' },
    ],
  };
}

export function createDefaultSection(type) {
  const id = createSectionId();
  const base = { id, type, visible: true, motion: 'fade-in', nav: null };
  switch (type) {
    case 'hero':
      return {
        ...base,
        props: {
          headline: 'Chào mừng đến với công ty chúng tôi',
          subheadline: 'Giới thiệu thương hiệu, sứ mệnh và giá trị cốt lõi',
          ctaText: 'Tìm hiểu thêm',
          ctaAction: { type: 'anchor', target: '' },
          mediaType: 'image',
          imageUrl: '',
          videoUrl: '',
          overlayOpacity: 0.35,
        },
      };
    case 'text_image':
      return {
        ...base,
        props: {
          title: 'Về chúng tôi',
          subtitle: 'About us',
          body: 'Mô tả ngắn về doanh nghiệp, lịch sử hình thành và định hướng phát triển.',
          imageUrl: '',
          imagePosition: 'right',
        },
      };
    case 'features':
      return {
        ...base,
        props: {
          title: 'Giá trị cốt lõi',
          items: [
            { title: 'Uy tín', body: 'Cam kết chất lượng và minh bạch' },
            { title: 'Đổi mới', body: 'Không ngừng cải tiến sản phẩm dịch vụ' },
            { title: 'Con người', body: 'Đội ngũ tận tâm, chuyên nghiệp' },
          ],
        },
      };
    case 'gallery':
      return {
        ...base,
        props: {
          title: 'Hình ảnh công ty',
          images: [{ url: '', caption: '' }, { url: '', caption: '' }, { url: '', caption: '' }],
        },
      };
    case 'video':
      return {
        ...base,
        props: {
          title: 'Video giới thiệu',
          videoUrl: '',
          posterUrl: '',
          autoplay: false,
        },
      };
    case 'cta':
      return {
        ...base,
        props: {
          title: 'Sẵn sàng hợp tác?',
          body: 'Liên hệ ngay để được tư vấn chi tiết.',
          buttonText: 'Liên hệ',
          buttonAction: { type: 'anchor', target: '' },
          backgroundColor: '#2563eb',
        },
      };
    case 'form':
      return { ...base, props: defaultFormSection() };
    case 'spacer':
      return { ...base, props: { height: 48 } };
    default:
      return { ...base, props: {} };
  }
}

export { mergeHtmlTemplateContent } from './htmlTemplateOverrides';

export function buildHtmlTemplatePages(templateKey, business = {}) {
  const reg = getTemplatePageRegistry(templateKey);
  if (!reg) return [];

  const companyName = business.companyName || 'SAMPLE COMPANY';
  const mainPages = getTemplatePages(templateKey, { includeVariants: false });

  return mainPages.map((tplPage) => {
    const pageId = createPageId(tplPage.id);
    let sections = (tplPage.sections || []).map((sec) => seedHtmlSectionOverrides(resolveSectionRef({
      ...sec,
      id: sec.id || createSectionId(sec.type),
      visible: true,
      overrides: {},
    }, templateKey)));

    const heroSection = sections.find((s) => s.type === 'hero_slideshow' || s.type === 'hero_slide' || s.type === 'hero_biz65');
    if (heroSection && reg.sharedBlocks?.hero) {
      if (reg.sharedBlocks.hero.defaultSlides) {
        heroSection.overrides = {
          ...heroSection.overrides,
          slides: reg.sharedBlocks.hero.defaultSlides.map((slide) => ({
            ...slide,
            headline: slide.slideClass === 'slide1' ? companyName : slide.headline,
          })),
        };
      } else if (reg.sharedBlocks.hero.defaultSlide) {
        heroSection.overrides = {
          ...heroSection.overrides,
          slide: {
            ...reg.sharedBlocks.hero.defaultSlide,
            headline: companyName,
          },
        };
      }
      sections = sections.map((s) => (s.id === heroSection.id ? heroSection : s));
    }

    return {
      id: pageId,
      templatePageId: tplPage.id,
      sourceFile: tplPage.file,
      slug: tplPage.slug ?? '',
      title: tplPage.title,
      titleJa: tplPage.titleJa || '',
      isHome: !!tplPage.isHome,
      layout: tplPage.layout || 'single-column',
      category: tplPage.category || 'main',
      hasHero: !!tplPage.hasHero,
      sections,
    };
  });
}

export function buildDefaultPagesFromTemplate(templateKey, business = {}) {
  if (isHtmlTemplate(templateKey)) {
    return buildHtmlTemplatePages(templateKey, business);
  }

  const tpl = getLandingPageTemplate(templateKey);
  const companyName = business.companyName || 'Doanh nghiệp';
  const homeId = createPageId('home');
  const aboutId = createPageId('about');

  const hero = createDefaultSection('hero');
  hero.props.headline = companyName;
  hero.props.subheadline = business.website
    ? `Khám phá ${companyName} — ${business.address || ''}`.trim()
    : `Giới thiệu về ${companyName}`;

  const about = createDefaultSection('text_image');
  about.props.title = 'Về chúng tôi';
  about.props.body = `Chúng tôi là ${companyName}. ${business.address ? `Trụ sở: ${business.address}.` : ''} Hãy tìm hiểu thêm về văn hóa và con người tại đây.`;

  const features = createDefaultSection('features');
  const form = createDefaultSection('form');
  form.props.title = 'Liên hệ';

  const cta = createDefaultSection('cta');
  cta.props.buttonAction = { type: 'anchor', target: form.id };

  return [
    {
      id: homeId,
      slug: '',
      title: 'Trang chủ',
      isHome: true,
      sections: [hero, features, cta, form],
    },
    {
      id: aboutId,
      slug: 'about',
      title: 'Giới thiệu',
      isHome: false,
      sections: [about, createDefaultSection('gallery')],
    },
  ];
}

export function buildCompanyContentFromTemplate(templateKey, business = {}) {
  const tpl = getLandingPageTemplate(templateKey);
  const reg = getTemplatePageRegistry(templateKey);
  const pages = buildDefaultPagesFromTemplate(templateKey, business);
  const renderMode = isHtmlTemplate(templateKey) ? 'html' : 'react';

  return {
    version: BUILDER_VERSION,
    builderType: BUILDER_TYPE,
    renderMode,
    templateKey: tpl.key,
    layout: tpl.layout,
    theme: {
      folder: tpl.folder,
      primaryColor: tpl.previewColor || reg?.previewColor || '#2563eb',
      fontFamily: 'system-ui, sans-serif',
    },
    pages,
    globalNav: renderMode === 'html' && reg?.nav
      ? reg.nav
          .filter((n) => !['form', 'confirm', 'finish'].includes(n.pageId))
          .map((n) => {
            const page = pages.find((p) => p.templatePageId === n.pageId);
            return {
              pageId: page?.id || n.pageId,
              templatePageId: n.pageId,
              label: n.label,
              slug: page?.slug ?? '',
              anchor: n.anchor || null,
              href: n.href || null,
            };
          })
      : pages.map((p) => ({
        pageId: p.id,
        label: p.title,
        slug: p.slug,
      })),
    companyName: business.companyName || '',
    announcement: '',
    sharedBlocks: renderMode === 'html' && reg?.sharedBlocks
      ? {
        companyName: business.companyName || 'SAMPLE COMPANY',
        logoText: business.companyName || 'SAMPLE COMPANY',
        hero: reg.sharedBlocks.hero,
      }
      : undefined,
  };
}

export function isCompanyBuilderContent(content) {
  return content?.version === BUILDER_VERSION || content?.builderType === BUILDER_TYPE;
}

export function isHtmlBuilderContent(content) {
  return content?.renderMode === 'html';
}

export function findPageBySlug(pages, pageSlug) {
  const list = Array.isArray(pages) ? pages : [];
  if (!pageSlug) return list.find((p) => p.isHome) || list[0] || null;
  return list.find((p) => p.slug === pageSlug) || null;
}

export function findPageByTemplatePageId(pages, templatePageId) {
  return (pages || []).find((p) => p.templatePageId === templatePageId) || null;
}

export function resolveNavHref(action, siteSlug, pages) {
  if (!action?.type || !action.target) return null;
  if (action.type === 'url') return action.target;
  if (action.type === 'page') {
    const page = (pages || []).find((p) => p.id === action.target || p.slug === action.target);
    if (!page) return null;
    if (page.isHome || !page.slug) return `/lp/${siteSlug}`;
    return `/lp/${siteSlug}/${page.slug}`;
  }
  if (action.type === 'anchor' || action.type === 'scroll') {
    return `#${action.target.replace(/^#/, '')}`;
  }
  return null;
}
