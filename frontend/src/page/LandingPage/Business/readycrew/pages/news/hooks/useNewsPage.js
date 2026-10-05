import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export function useNewsPage(pageTitle) {
  useEffect(() => {
    if (pageTitle) document.title = pageTitle
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/page-news.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [pageTitle])
}
