import {
  getLandingPageTemplate,
  LANDING_PAGE_TEMPLATES,
} from '../constants/businessLandingPage.js';
import {
  getTemplatePageRegistry,
  isHtmlTemplate,
} from '../constants/templatePageRegistry.js';

export const BUILDER_VERSION = 2;
export const BUILDER_TYPE = 'company';

function createSectionId(prefix = 'sec') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createPageId(prefix = 'page') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function defaultFormSection() {
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

function createDefaultSection(type) {
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
          body: 'Mô tả ngắn về doanh nghiệp.',
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
            { title: 'Uy tín', body: 'Cam kết chất lượng' },
            { title: 'Đổi mới', body: 'Cải tiến liên tục' },
            { title: 'Con người', body: 'Đội ngũ chuyên nghiệp' },
          ],
        },
      };
    case 'gallery':
      return {
        ...base,
        props: {
          title: 'Hình ảnh công ty',
          images: [{ url: '', caption: '' }, { url: '', caption: '' }],
        },
      };
    case 'video':
      return {
        ...base,
        props: { title: 'Video giới thiệu', videoUrl: '', posterUrl: '', autoplay: false },
      };
    case 'cta':
      return {
        ...base,
        props: {
          title: 'Sẵn sàng hợp tác?',
          body: 'Liên hệ ngay để được tư vấn.',
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

function resolveHeroSectionType(reg, tplPage) {
  const hero = reg?.sharedBlocks?.hero;
  if (hero?.type) return hero.type;
  if (reg?.layout === 'recruit') return 'recruit_hero';
  const regHero = tplPage?.sections?.find((s) => s.id === 'hero' || s.ref?.includes('hero'));
  if (regHero?.type) return regHero.type;
  if (hero?.defaultSlides) return 'hero_slideshow';
  if (hero?.defaultSlide) return 'hero_slide';
  return 'hero_slideshow';
}

export function buildCompanyContentFromTemplate(templateKey, business = {}) {
  const tpl = getLandingPageTemplate(templateKey);
  const companyName = business.companyName || 'Doanh nghiệp';

  if (isHtmlTemplate(templateKey)) {
    const reg = getTemplatePageRegistry(templateKey);
    const pages = reg.pages
      .filter((p) => !p.hidden && p.category !== 'system')
      .map((tplPage) => {
      const pageId = createPageId(tplPage.id);
      const heroType = resolveHeroSectionType(reg, tplPage);
      const heroId = tplPage.sections?.[0]?.id || 'hero';
      return {
        id: pageId,
        templatePageId: tplPage.id,
        sourceFile: tplPage.file,
        slug: tplPage.slug ?? '',
        title: tplPage.title,
        isHome: !!tplPage.isHome,
        layout: tplPage.layout || 'single-column',
        category: tplPage.category || 'main',
        hasHero: !!tplPage.hasHero,
        sections: tplPage.hasHero
          ? [{ id: heroId, type: heroType, label: 'Hero', visible: true, overrides: {} }]
          : [],
      };
    });

    return {
      version: BUILDER_VERSION,
      builderType: BUILDER_TYPE,
      renderMode: 'html',
      templateKey: tpl.key,
      layout: tpl.layout,
      theme: {
        folder: tpl.folder,
        primaryColor: tpl.previewColor || reg.previewColor || '#38bdf8',
        fontFamily: 'system-ui, sans-serif',
      },
      pages,
      globalNav: reg.nav.map((n) => {
        const page = pages.find((p) => p.templatePageId === n.pageId);
        return {
          pageId: page?.id || n.pageId,
          templatePageId: n.pageId,
          label: n.label,
          slug: page?.slug ?? '',
        };
      }),
      companyName: companyName,
      announcement: '',
      sharedBlocks: {
        companyName,
        logoText: companyName,
        hero: reg.sharedBlocks?.hero,
      },
    };
  }

  const homeId = createPageId('home');
  const aboutId = createPageId('about');

  const hero = createDefaultSection('hero');
  hero.props.headline = companyName;
  hero.props.subheadline = business.address
    ? `${companyName} — ${business.address}`
    : `Giới thiệu về ${companyName}`;

  const about = createDefaultSection('text_image');
  about.props.title = 'Về chúng tôi';
  about.props.body = `Chúng tôi là ${companyName}.`;

  const features = createDefaultSection('features');
  const form = createDefaultSection('form');
  const cta = createDefaultSection('cta');
  cta.props.buttonAction = { type: 'anchor', target: form.id };

  const pages = [
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

  return {
    version: BUILDER_VERSION,
    builderType: BUILDER_TYPE,
    renderMode: 'react',
    templateKey: tpl.key,
    layout: tpl.layout,
    theme: {
      folder: tpl.folder,
      primaryColor: tpl.previewColor || '#2563eb',
      fontFamily: 'system-ui, sans-serif',
    },
    pages,
    globalNav: pages.map((p) => ({ pageId: p.id, label: p.title, slug: p.slug })),
    companyName: business.companyName || '',
    announcement: '',
  };
}

export function isCompanyBuilderContent(content) {
  if (!content) return false;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed?.version === BUILDER_VERSION || parsed?.builderType === BUILDER_TYPE;
    } catch {
      return false;
    }
  }
  return content?.version === BUILDER_VERSION || content?.builderType === BUILDER_TYPE;
}

export { LANDING_PAGE_TEMPLATES };
