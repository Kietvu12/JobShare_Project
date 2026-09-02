import { FaqItems } from '../data/faq-items'

export default function HomeFaq() {
  return (
    <section className="front-page-faq l-section">
      <div className="front-page-faq__target js-scroll-target" id="faq" />
      <div className="front-page-faq__wrapper l-wrapper-faq--xlarge-on-bg l-wrapper--xlarge-on-bg">
        <div className="front-page-faq__contents l-contents l-contents--sp-full">
          <header className="front-page-faq__header m-section-header--large">
            <h2 className="o-section-heading">よくあるご質問｜JobShare Business</h2>
          </header>

          <div className="front-page-faq__body">
            {FaqItems.map((item) => (
              <div key={item.question} className="front-page-faq__item">
                <div className="front-page-faq__question">
                  <p className="front-page-faq__icon">Q.</p>
                  <h3 className="front-page-faq__subject">
                    <span className="u-inner-hover-line">{item.question}</span>
                  </h3>
                </div>

                <div className="front-page-faq__answer">
                  <div className="front-page-faq__anchor">
                    <p
                      className="front-page-faq__answer-desc"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
