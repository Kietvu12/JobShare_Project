import { useEffect, useMemo, useRef } from 'react'
import { useBusinessLandingBase } from '../../../../BusinessLandingContext'
import { toBusinessLandingPath } from '../../../../businessLandingBase'
import './jobshare-home-v2.css'
import './jobshare-home-v2.js'

import contentJa from '../../../../../../../assets/JobShare_Business_Home_V6_7_Clean_Mobile_QA_Package/integration/content-ja.html?raw'
import contentEn from '../../../../../../../assets/JobShare_Business_Home_V6_7_Clean_Mobile_QA_Package/integration/content-en.html?raw'
import contentVi from '../../../../../../../assets/JobShare_Business_Home_V6_7_Clean_Mobile_QA_Package/integration/content-vi.html?raw'

const CONTENT_BY_LOCALE = {
  ja: contentJa,
  en: contentEn,
  vi: contentVi,
}

function resolveLocale(basePath) {
  const m = String(basePath || '').match(/^\/(vi|en|ja)\/business/)
  return m?.[1] || 'vi'
}

export default function JobShareHomeV2() {
  const basePath = useBusinessLandingBase()
  const containerRef = useRef(null)
  const locale = resolveLocale(basePath)

  const html = CONTENT_BY_LOCALE[locale] || CONTENT_BY_LOCALE.vi

  const routes = useMemo(() => ({
    register: `/business/register?lang=${locale}`,
    contact: toBusinessLandingPath('/contact_rc', basePath),
    documents: toBusinessLandingPath('/inquiry_docs_rc', basePath),
    services: toBusinessLandingPath('/price', basePath),
  }), [basePath, locale])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.js-loading')?.classList.add('is-loaded')
  }, [])

  useEffect(() => {
    const root = containerRef.current?.querySelector('.jsb-v2')
    const cleanup = window.initJobShareHomeV2?.(root, { routes })
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [html, routes])

  return (
    <article
      className="jobshare-home-v2-root"
      style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0, overflow: 'hidden' }}
    >
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
