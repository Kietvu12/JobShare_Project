import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const PRICE_PAGE_TITLE = 'JobShare Businessとは | JobShare for Business'

export function usePricePage() {
  useEffect(() => {
    document.title = PRICE_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/page-price.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
