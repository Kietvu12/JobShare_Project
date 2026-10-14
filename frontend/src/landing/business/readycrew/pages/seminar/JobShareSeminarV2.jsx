import { useEffect, useMemo } from 'react'
import { useBusinessLandingBase } from '../../../BusinessLandingContext'
import {
  replaceMainOpenTag,
  resolveBusinessLocale,
  rewriteJobShareTemplateHtml,
  scrollBusinessLandingToTop,
} from '../../lib/templateHtml'
import '../home/jobshare-v2/jobshare-home-v2.css'
import '../about/about-us.page.css'
import './seminar.page.css'
import '../jobshare-template-host.css'
import { initJobShareSeminar } from './seminar.page.js'

import contentJa from '../../../../templates/JobShare_Business_Seminar_V2_20261008/JobShare_Business_Seminar_V2_20261008/integration/content-ja.html?raw'
import contentEn from '../../../../templates/JobShare_Business_Seminar_V2_20261008/JobShare_Business_Seminar_V2_20261008/integration/content-en.html?raw'
import contentVi from '../../../../templates/JobShare_Business_Seminar_V2_20261008/JobShare_Business_Seminar_V2_20261008/integration/content-vi.html?raw'

const CONTENT_BY_LOCALE = { ja: contentJa, en: contentEn, vi: contentVi }

export default function JobShareSeminarV2() {
  const basePath = useBusinessLandingBase()
  const locale = resolveBusinessLocale(basePath)

  const html = useMemo(() => {
    const source = CONTENT_BY_LOCALE[locale] || CONTENT_BY_LOCALE.vi
    const rewritten = rewriteJobShareTemplateHtml(source, {
      locale,
      basePath,
      assetBase: '/landing/business/templates/seminar/',
    })
    return replaceMainOpenTag(
      rewritten,
      `id="content" class="jsb-v2 jsb-v3 jsb-v4 jsb-v5 jsb-about jsb-seminar jobshare-template-page" lang="${locale}"`,
    )
  }, [basePath, locale])

  useEffect(() => {
    scrollBusinessLandingToTop()
    document.querySelector('.js-loading')?.classList.add('is-loaded')
    const root = document.querySelector('.jsb-seminar')
    return initJobShareSeminar(root)
  }, [html])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
