import { useEffect } from 'react'
import pageTitles from '../../../content/page-titles.json'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const HOME_PAGE_TITLE = pageTitles.index

export function useHomePage() {
  useEffect(() => {
    document.title = HOME_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/front-page.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
