import { mergeOverrideLayers } from './landingPageContentLocale';
import { seedHtmlSectionOverrides, resolveSectionRef } from './htmlTemplateOverrides';
import {
  getLpRecruiteSectionLocaleOverrides,
  getLpRecruiteSectionSidebarLabel,
  getLpRecruiteSiteLocale,
  LP_RECRUITE_SITE_LOCALE,
} from '../constants/templatePageRegistry/lp_recruiteLocaleSamples';

const LOCALE_SEED_VERSION = 2;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj ?? {}));
}

function registryJaOverrides(regSection, templateKey) {
  const resolved = resolveSectionRef({ ...regSection, overrides: {} }, templateKey);
  return seedHtmlSectionOverrides(resolved).overrides || {};
}

/** Tách overrides hiện có (thường là JA) thành 3 lớp VI / EN / JA */
export function ensureSectionLocaleLayers(section, templateKey, regSection) {
  if (!section?.id || templateKey !== 'lp_recruite') return section;
  if (section._localeSeedVersion >= LOCALE_SEED_VERSION && section.overridesByLocale?.ja) {
    return section;
  }

  const jaBase = registryJaOverrides(regSection || section, templateKey);
  const existing = section.overrides || {};
  const jaLayer = mergeOverrideLayers(jaBase, existing);
  const viSample = getLpRecruiteSectionLocaleOverrides(section.id, 'vi');
  const enSample = getLpRecruiteSectionLocaleOverrides(section.id, 'en');

  return {
    ...section,
    overrides: mergeOverrideLayers(jaBase, viSample || {}),
    overridesByLocale: {
      ...(section.overridesByLocale || {}),
      ja: mergeOverrideLayers(jaBase, section.overridesByLocale?.ja || jaLayer),
      en: mergeOverrideLayers(jaBase, enSample || section.overridesByLocale?.en || {}),
    },
    _localeSeedVersion: LOCALE_SEED_VERSION,
  };
}

export function ensureContentLocalePack(content, templateKey, flatSeo = {}) {
  if (templateKey !== 'lp_recruite') return content;
  const pack = content.localePack || {};
  const nextPack = { ...pack };

  ['vi', 'en', 'ja'].forEach((loc) => {
    const sample = getLpRecruiteSiteLocale(loc);
    nextPack[loc] = {
      ...sample,
      ...(pack[loc] || {}),
      seo: {
        ...sample.seo,
        ...(pack[loc]?.seo || {}),
        ...(loc === 'vi' && !pack.vi?.seo?.metaTitle ? {
          metaTitle: flatSeo.metaTitle || sample.seo.metaTitle,
          metaDescription: flatSeo.metaDescription || sample.seo.metaDescription,
          metaKeywords: flatSeo.metaKeywords || sample.seo.metaKeywords,
          ogTitle: flatSeo.ogTitle || sample.seo.ogTitle,
          ogDescription: flatSeo.ogDescription || sample.seo.ogDescription,
        } : {}),
      },
    };
  });

  const pages = (content.pages || []).map((page) => {
    if (!page.titleByLocale) {
      const titleByLocale = {
        vi: page.title || LP_RECRUITE_SITE_LOCALE.vi.pageTitle,
        en: LP_RECRUITE_SITE_LOCALE.en.pageTitle,
        ja: page.titleJa || LP_RECRUITE_SITE_LOCALE.ja.pageTitle,
      };
      return { ...page, titleByLocale };
    }
    return page;
  });

  return {
    ...content,
    localePack: nextPack,
    pages,
  };
}

/** Menu theo locale (giữ pageId / anchor từ globalNav gốc) */
export function resolveGlobalNavForLocale(globalNav = [], contentLocale = 'vi', localePack) {
  const packNav = localePack?.[contentLocale]?.nav || getLpRecruiteSiteLocale(contentLocale).nav;
  if (!globalNav.length) {
    return packNav.map((n) => ({ label: n.label, anchor: n.anchor, pageId: null }));
  }
  return globalNav.map((item) => {
    const hit = packNav.find((n) => n.anchor && n.anchor === item.anchor);
    return hit ? { ...item, label: hit.label } : item;
  });
}

export function resolveSectionSidebarLabel(section, templateKey, contentLocale = 'vi', fallback = '') {
  if (!section) return fallback;
  if (templateKey === 'lp_recruite' && section.id) {
    const localized = getLpRecruiteSectionSidebarLabel(section.id, contentLocale, '');
    if (localized) return localized;
  }
  return fallback || section.label || section.type || '';
}

export function resolvePageTitleForLocale(page, contentLocale = 'vi') {
  if (!page) return '';
  const loc = page.titleByLocale?.[contentLocale];
  if (loc) return loc;
  if (contentLocale === 'ja') return page.titleJa || page.title || '';
  return page.title || '';
}

export function resolveSeoForLocale(content, contentLocale = 'vi', flatFallback = {}) {
  const fromPack = content?.localePack?.[contentLocale]?.seo;
  if (fromPack) {
    return {
      metaTitle: fromPack.metaTitle ?? flatFallback.metaTitle ?? '',
      metaDescription: fromPack.metaDescription ?? flatFallback.metaDescription ?? '',
      metaKeywords: fromPack.metaKeywords ?? flatFallback.metaKeywords ?? '',
      ogTitle: fromPack.ogTitle ?? flatFallback.ogTitle ?? '',
      ogDescription: fromPack.ogDescription ?? flatFallback.ogDescription ?? '',
    };
  }
  return flatFallback;
}

export function patchSeoInLocalePack(content, contentLocale, patch) {
  const pack = content.localePack || {};
  const cur = pack[contentLocale]?.seo || getLpRecruiteSiteLocale(contentLocale).seo;
  return {
    ...content,
    localePack: {
      ...pack,
      [contentLocale]: {
        ...(pack[contentLocale] || getLpRecruiteSiteLocale(contentLocale)),
        seo: { ...cur, ...patch },
      },
    },
  };
}

export function patchPageTitleForLocale(content, pageId, contentLocale, title) {
  return {
    ...content,
    pages: (content.pages || []).map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        titleByLocale: { ...(p.titleByLocale || {}), [contentLocale]: title },
        ...(contentLocale === 'vi' ? { title } : {}),
        ...(contentLocale === 'ja' ? { titleJa: title } : {}),
      };
    }),
  };
}
