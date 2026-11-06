import { SectionHeading } from './shared';

export default function PricingFaqSection({ copy }) {
  return (
    <section className="section faq-section">
      <div className="wrap faq-wrap">
        <SectionHeading eyebrow="QUESTIONS & ANSWERS" title={copy.faqTitle} />
        <div>
          {copy.faqs.map(([question, answer]) => (
            <details key={question} className="price-question">
              <summary>
                <span className="question-mark" aria-hidden="true">
                  Q
                </span>
                <span>{question}</span>
                <span className="question-toggle" aria-hidden="true">
                  +
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
