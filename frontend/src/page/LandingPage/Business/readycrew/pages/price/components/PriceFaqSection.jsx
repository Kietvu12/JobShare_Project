import { FAQ_ITEMS } from '../data/faqItems'

export default function PriceFaqSection() {
  return (
    <section className="page-partner-faq l-section">
      <div className="page-partner-faq__contents l-contents">
        <header className="page-partner-faq__header m-contents-header">
          <p className="page-partner-faq__sub-text m-contents-header__sub">Q &amp; A</p>
          <h2 className="page-partner-faq__main-text m-contents-header__main">よくある質問</h2>
        </header>
        <div className="page-partner-faq__body">
          {FAQ_ITEMS.map((item) => (
            <dl key={item.question} className="page-partner-faq__item">
              <dt className="page-partner-faq__question js-faq-accordion-question u-hover-wrapper">
                <p className="page-partner-faq__icon">Q.</p>
                <h3 className="page-partner-faq__subject js-faq-accordion-subject">
                  <span className="u-inner-hover-line js-faq-accordion-subject-text">{item.question}</span>
                </h3>
              </dt>
              <dd className="page-partner-faq__answer js-faq-accordion-answer u-hover-wrapper">
                <p
                  className="page-partner-faq__answer-desc js-faq-accordion-answer-desc--bold"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </dd>
            </dl>
          ))}
        </div>
      </div>
    </section>
  )
}
