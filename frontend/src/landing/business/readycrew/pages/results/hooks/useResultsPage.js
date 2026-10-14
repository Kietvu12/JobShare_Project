import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const RESULTS_PAGE_TITLE = '事例紹介 | Ready Crew（レディクル）'

export function useResultsPage() {
  useEffect(() => {
    document.title = RESULTS_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/archive-results.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
