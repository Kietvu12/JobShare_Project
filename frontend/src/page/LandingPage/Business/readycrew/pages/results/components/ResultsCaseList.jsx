import { CASE_STUDIES } from '../data/caseStudies'
import { PAGINATION } from '../data/pageMeta'
import CaseCard from './CaseCard'
import ResultsConversion from './ResultsConversion'
import ResultsPagination from './ResultsPagination'

export default function ResultsCaseList() {
  return (
    <>
      <header className="page-results-case__header m-section-header">
        <p className="page-results-case__found-posts">
          <span className="page-results-case__found-posts-sub">
            {PAGINATION.showingFrom}~{PAGINATION.showingTo}件 ／ 全{PAGINATION.totalItems}件中 表示
          </span>
        </p>
      </header>

      <div className="page-results-main">
        <section className="page-results-case l-section--sp">
          <div className="page-results-case__contents">
            {CASE_STUDIES.map((caseStudy) => (
              <CaseCard key={caseStudy.href} caseStudy={caseStudy} />
            ))}
          </div>
        </section>

        <section className="page-results-pagination m-pagination-wrapper">
          <ResultsPagination />
          <ResultsConversion />
        </section>
      </div>
    </>
  )
}
