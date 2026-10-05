import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export function useHomePage() {
  useEffect(() => {
    window.scrollTo(0, 0)

    ensureSiteScripts(['/landing/business/assets/js/front-page.js'])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
