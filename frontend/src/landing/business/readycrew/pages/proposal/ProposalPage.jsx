import ProposalCategoryGrid from './components/ProposalCategoryGrid'
import ProposalFooterTop from './components/ProposalFooterTop'
import ProposalVisual from './components/ProposalVisual'
import { useProposalPage } from './hooks/useProposalPage'

export default function ProposalPage() {
  useProposalPage()

  return (
    <article>
      <div className="page-proposal">
        <ProposalVisual />
        <ProposalCategoryGrid />
      </div>
      <ProposalFooterTop />
    </article>
  )
}
