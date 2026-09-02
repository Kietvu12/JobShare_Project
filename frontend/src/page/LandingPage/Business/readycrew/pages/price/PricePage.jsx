import CelebrityVideosSection from './components/CelebrityVideosSection'
import FooterTopSection from './components/FooterTopSection'
import PriceAboutSection from './components/PriceAboutSection'
import PriceFaqSection from './components/PriceFaqSection'
import PriceFlowSection from './components/PriceFlowSection'
import PriceMechanismSection from './components/PriceMechanismSection'
import PricePointsSection from './components/PricePointsSection'
import PriceProposalSection from './components/PriceProposalSection'
import PriceResultsSection from './components/PriceResultsSection'
import PriceVisual from './components/PriceVisual'
import { usePricePage } from './hooks/usePricePage'
import './price.css'

export default function PricePage() {
  usePricePage()

  return (
    <article>
      <div className="page-price">
        <PriceVisual />
        <PriceAboutSection />
        <PricePointsSection />
        <PriceResultsSection />
        <PriceMechanismSection />
        <PriceFlowSection />
        <PriceProposalSection />
        <CelebrityVideosSection />
        <PriceFaqSection />
      </div>
      <FooterTopSection />
    </article>
  )
}
