import KnownMoreSection from './components/KnownMoreSection'
import ResultsCaseList from './components/ResultsCaseList'
import ResultsDownloadButton from './components/ResultsDownloadButton'
import ResultsFooterTop from './components/ResultsFooterTop'
import ResultsPickupSlider from './components/ResultsPickupSlider'
import ResultsSearch from './components/ResultsSearch'
import ResultsVisual from './components/ResultsVisual'
import { useResultsPage } from './hooks/useResultsPage'

export default function ResultsPage() {
  useResultsPage()

  return (
    <article>
      <div className="page-results">
        <ResultsVisual />
        <ResultsPickupSlider />
        <ResultsDownloadButton />

        <div className="page-results-container l-two-column-side-menu" id="search">
          <div className="l-contents--xlarge">
            <ResultsSearch />
            <ResultsCaseList />
          </div>
        </div>
      </div>

      <KnownMoreSection />
      <ResultsFooterTop />
    </article>
  )
}
