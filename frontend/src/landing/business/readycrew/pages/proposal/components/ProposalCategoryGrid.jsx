import { PROPOSAL_CATEGORIES } from '../data/proposalCategories'
import ProposalCategoryCard from './ProposalCategoryCard'

export default function ProposalCategoryGrid() {
  return (
    <section className="page-proposal-main l-section">
      <div className="page-proposal-main__contents l-contents--medium l-contents--sp">
        <h2 className="page-proposal-main___main-text o-section-heading">JobShare Businessの4つの採用サービス</h2>
        <div className="page-proposal-main__body page-proposal-main__body--2x2">
          {PROPOSAL_CATEGORIES.map((category) => (
            <ProposalCategoryCard key={category.href} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}
