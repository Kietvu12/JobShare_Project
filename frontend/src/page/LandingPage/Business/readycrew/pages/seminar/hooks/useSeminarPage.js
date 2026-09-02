import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const SEMINAR_PAGE_TITLE = 'セミナー・イベント | JobShare for Business'

export function useSeminarPage() {
  useEffect(() => {
    document.title = SEMINAR_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/page-seminar.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
