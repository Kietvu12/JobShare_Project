import { useEffect, useMemo } from 'react'
import {
  replaceMainOpenTag,
  rewriteJobShareTemplateHtml,
  scrollBusinessLandingToTop,
} from '../../lib/templateHtml'
import '../home/jobshare-v2/jobshare-home-v2.js'

import contentJa from '../../../../templates/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/integration/content-ja.html?raw'
import contentEn from '../../../../templates/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/integration/content-en.html?raw'
import contentVi from '../../../../templates/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/JobShare_Business_About_Us_V5_JA_EN_VI_20261008/integration/content-vi.html?raw'

const CONTENT_BY_LOCALE = { ja: contentJa, en: contentEn, vi: contentVi }
const ABOUT_MAIN = 'class="jsb-v2 jsb-v3 jsb-v4 jsb-v5 jsb-about jobshare-template-page" id="jobshare-business-v2"'

/** HTML template About Us V5 theo locale; link doanh nghiệp trỏ về `basePath` (mặc định `/{lang}/business`). */
export function useJobShareAboutHtml(locale, basePath) {
  const lang = CONTENT_BY_LOCALE[locale] ? locale : 'vi'
  const businessBase = basePath || `/${lang}/business`

  return useMemo(() => {
    const rewritten = rewriteJobShareTemplateHtml(CONTENT_BY_LOCALE[lang], {
      locale: lang,
      basePath: businessBase,
      assetBase: '/landing/business/templates/about/',
    })
    return replaceMainOpenTag(rewritten, `${ABOUT_MAIN} lang="${lang}"`)
  }, [businessBase, lang])
}

/** Chạy hiệu ứng của template trên `<main id="jobshare-business-v2">` trong `getRoot()`. */
export function useJobShareAboutEffects(html, getRoot) {
  useEffect(() => {
    scrollBusinessLandingToTop()
    document.querySelector('.js-loading')?.classList.add('is-loaded')
    const root = getRoot()
    const cleanup = root ? window.initJobShareHomeV2?.(root) : undefined
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [html, getRoot])
}
