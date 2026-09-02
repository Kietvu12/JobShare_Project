import { PICKUP_CASES } from '../data/pickupCases'
import CaseCard from './CaseCard'

export default function ResultsPickupSlider() {
  return (
    <section className="page-results-pickup">
      <div className="page-results-pickup__contents swiper js-pickup-slider">
        <div className="swiper-wrapper js-pickup-slider-wrapper">
          {PICKUP_CASES.map((caseStudy) => (
            <div key={caseStudy.href} className="swiper-slide js-pickup-slide">
              <CaseCard caseStudy={caseStudy} variant="pickup" />
            </div>
          ))}
        </div>
        <div className="page-results-article-pickup__next swiper-button-next js-pickup-slider-next js-pickup-slider-arrow" />
        <div className="page-results-article-pickup__prev swiper-button-prev js-pickup-slider-prev js-pickup-slider-arrow" />
        <div className="page-results-article-pickup__pagination swiper-pagination js-pickup-slider-pagination" />
      </div>
    </section>
  )
}
