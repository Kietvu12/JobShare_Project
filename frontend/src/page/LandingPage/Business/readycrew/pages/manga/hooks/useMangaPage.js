import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const MANGA_PAGE_TITLE = 'マンガで知るReady Crew | Ready Crew（レディクル）'

export function useMangaPage() {
  useEffect(() => {
    document.title = MANGA_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts()
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
