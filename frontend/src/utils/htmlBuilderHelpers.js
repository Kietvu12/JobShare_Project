import { getTemplatePageRegistry, getTemplatePages, getTemplatePage } from '../constants/templatePageRegistry';
import { createPageId, createSectionId } from './companyLandingPageSchema';
import {
  seedHtmlSectionOverrides,
  resolveSectionRef,
} from './htmlTemplateOverrides';

export function duplicateHtmlSection(section) {
  const clone = JSON.parse(JSON.stringify(section));
  clone.id = createSectionId(section.type || 'sec');
  clone.visible = true;
  if (clone.overrides) {
    clone.overrides = { ...clone.overrides };
  }
  return clone;
}

/** Tạo section mới từ registry template (cùng loại có sẵn trên trang) */
export function createHtmlSectionFromTemplate(templateKey, templatePageId, sectionType) {
  const regPage = getTemplatePage(templateKey, templatePageId);
  const proto = (regPage?.sections || []).find((s) => s.type === sectionType);
  if (!proto) return null;
  const base = resolveSectionRef({
    ...proto,
    id: createSectionId(sectionType),
    visible: true,
    overrides: {},
  }, templateKey);
  return seedHtmlSectionOverrides(base);
}

/** Danh sách loại section có thể thêm trên trang template hiện tại */
export function getAvailableSectionTypesForPage(templateKey, templatePageId) {
  const regPage = getTemplatePage(templateKey, templatePageId);
  if (!regPage) return [];
  const types = new Map();
  (regPage.sections || []).forEach((s) => {
    if (!s.decorative) types.set(s.type, s.label || s.type);
  });
  return [...types.entries()].map(([type, label]) => ({ type, label }));
}

/** Trang registry chưa có trong site */
export function getAvailableTemplatePages(templateKey, existingPages = []) {
  const used = new Set(existingPages.map((p) => p.templatePageId));
  return getTemplatePages(templateKey, { includeVariants: false })
    .filter((p) => p.category === 'main' && !used.has(p.id));
}

/** Thêm trang từ registry */
export function buildHtmlPageFromRegistry(templateKey, templatePageId, business = {}) {
  const reg = getTemplatePageRegistry(templateKey);
  const tplPage = getTemplatePage(templateKey, templatePageId);
  if (!reg || !tplPage) return null;

  const companyName = business.companyName || 'SAMPLE COMPANY';
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
        slide: { ...reg.sharedBlocks.hero.defaultSlide, headline: companyName },
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
}

/** Đồng bộ globalNav khi thêm/xóa trang */
export function appendGlobalNavItem(globalNav = [], page, label) {
  const exists = globalNav.some((n) => n.pageId === page.id);
  if (exists) return globalNav;
  return [
    ...globalNav,
    {
      pageId: page.id,
      templatePageId: page.templatePageId,
      label: label || page.title,
      slug: page.slug || '',
    },
  ];
}

export function removeGlobalNavItem(globalNav = [], pageId) {
  return globalNav.filter((n) => n.pageId !== pageId);
}

export function reorderArray(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
