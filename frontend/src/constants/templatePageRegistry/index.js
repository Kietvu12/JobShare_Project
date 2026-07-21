/**
 * Registry trang HTML template — map templateKey → cấu trúc trang/section cho builder.
 * Thêm template mới: tạo file registry riêng và đăng ký vào TEMPLATE_PAGE_REGISTRIES.
 */

import { getLandingPageTemplate } from '../landingPageTemplates';
import DO_LP_KAISHAINTRO_REGISTRY from './do_lp_kaishaintro';
import LP_RECRUITE_REGISTRY from './lp_recruite';
import XANH_DARK_LP_KAISHAINTRO_REGISTRY from './xanh_dark_lp_kaishaintro';
import XANH_LP_BUSINESS_SKYBLUE_REGISTRY from './xanh_lp_business_skyblue';
import XANH_LP_BUSINESS_KAISHAINTRO_REGISTRY from './xanh_lp_business_kaishaintro';

/** Map templateKey → registry đầy đủ */
export const TEMPLATE_PAGE_REGISTRIES = {
  do_lp_kaishaintro: DO_LP_KAISHAINTRO_REGISTRY,
  lp_recruite: LP_RECRUITE_REGISTRY,
  xanh_dark_lp_kaishaintro: XANH_DARK_LP_KAISHAINTRO_REGISTRY,
  xanh_lp_business_skyblue: XANH_LP_BUSINESS_SKYBLUE_REGISTRY,
  xanh_lp_business_kaishaintro: XANH_LP_BUSINESS_KAISHAINTRO_REGISTRY,
};

export function getTemplatePageRegistry(templateKey) {
  const resolved = resolveTemplateRegistryKey(templateKey);
  return TEMPLATE_PAGE_REGISTRIES[resolved] || null;
}

/** Chuẩn hóa templateKey (legacy alias, typo) → key registry */
export function resolveTemplateRegistryKey(templateKey) {
  if (!templateKey) return '';
  const key = String(templateKey).trim();
  if (TEMPLATE_PAGE_REGISTRIES[key]) return key;
  const tpl = getLandingPageTemplate(key);
  return tpl?.key && TEMPLATE_PAGE_REGISTRIES[tpl.key] ? tpl.key : key;
}

export function isHtmlTemplate(templateKey) {
  return HTML_RENDER_TEMPLATES.has(resolveTemplateRegistryKey(templateKey));
}

/** Template dùng render HTML gốc (iframe) thay vì React sections */
export const HTML_RENDER_TEMPLATES = new Set(
  Object.keys(TEMPLATE_PAGE_REGISTRIES).filter(
    (key) => TEMPLATE_PAGE_REGISTRIES[key]?.renderMode === 'html',
  ),
);

export function isTemplateRegistered(templateKey) {
  return !!TEMPLATE_PAGE_REGISTRIES[resolveTemplateRegistryKey(templateKey)];
}

export function getRegisteredTemplateKeys() {
  return Object.keys(TEMPLATE_PAGE_REGISTRIES);
}

export function getRegisteredLandingPageTemplates(allTemplates = []) {
  const keys = new Set(getRegisteredTemplateKeys());
  return allTemplates.filter((t) => keys.has(t.key));
}

export function getTemplatePages(templateKey, { includeVariants = false, includeHidden = false } = {}) {
  const reg = getTemplatePageRegistry(templateKey);
  if (!reg) return [];
  return reg.pages.filter((p) => {
    if (!includeHidden && p.hidden) return false;
    if (!includeVariants && p.category === 'layout-variant') return false;
    return true;
  });
}

export function getTemplatePage(templateKey, pageId) {
  const reg = getTemplatePageRegistry(templateKey);
  if (!reg) return null;
  return reg.pages.find((p) => p.id === pageId) || null;
}

export function getTemplatePagePreviewUrl(templateKey, pageId) {
  const page = getTemplatePage(templateKey, pageId);
  if (!page) return null;
  const reg = getTemplatePageRegistry(templateKey);
  if (!reg?.folder) return null;
  const folder = reg.folder.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `/template/${folder}/${encodeURIComponent(page.file)}`;
}

export function getDefaultNavFromRegistry(templateKey) {
  const reg = getTemplatePageRegistry(templateKey);
  return reg?.nav || [];
}

export {
  DO_LP_KAISHAINTRO_REGISTRY,
  LP_RECRUITE_REGISTRY,
  XANH_DARK_LP_KAISHAINTRO_REGISTRY,
  XANH_LP_BUSINESS_SKYBLUE_REGISTRY,
  XANH_LP_BUSINESS_KAISHAINTRO_REGISTRY,
};
