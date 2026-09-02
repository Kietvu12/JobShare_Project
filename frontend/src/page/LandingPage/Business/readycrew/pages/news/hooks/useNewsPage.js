import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const NEWS_PAGE_TITLE = 'ニュース | Ready Crew（レディクル）'

export function useNewsPage() {
  useEffect(() => {
    document.title = NEWS_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/page-news.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
