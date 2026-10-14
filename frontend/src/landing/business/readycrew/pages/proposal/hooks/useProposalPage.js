import { useEffect } from 'react'
import { ensureSiteScripts } from '../../../lib/siteHtml'

export const PROPOSAL_PAGE_TITLE = '各サービス | JobShare for Business'

export function useProposalPage() {
  useEffect(() => {
    document.title = PROPOSAL_PAGE_TITLE
    window.scrollTo(0, 0)

    ensureSiteScripts()
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])
}
