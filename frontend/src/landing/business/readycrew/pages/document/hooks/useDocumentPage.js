import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const DOCUMENT_PAGE_TITLE = 'お役立ち資料 | Ready Crew（レディクル）'

const DOCUMENT_CSS = '/landing/business/assets/css/document.css'

export function useDocumentPage() {
  useEffect(() => {
    document.title = DOCUMENT_PAGE_TITLE
    window.scrollTo(0, 0)

    let cssLink = null
    if (!document.querySelector(`link[data-page-css="${DOCUMENT_CSS}"]`)) {
      cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = DOCUMENT_CSS
      cssLink.setAttribute('data-page-css', DOCUMENT_CSS)
      document.head.appendChild(cssLink)
    }

    ensureSiteScripts(['/landing/business/assets/js/infinite-scroll.pkgd.min.js', '/landing/business/assets/js/document-scroll.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)

    return () => {
      cssLink?.remove()
    }
  }, [])
}
