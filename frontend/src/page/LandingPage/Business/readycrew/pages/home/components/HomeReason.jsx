import SiteLink from '../../../components/layout/SiteLink'
import { ReasonItems } from '../data/reason-items'

export default function HomeReason() {
  return (
    <>
      <div className="js-scroll-target js-scroll-target--more" id="reason" />
      <section className="front-page-reason l-section">
        <div className="front-page-reason__contents l-contents">
          <header className="front-page-reason__header m-section-header">
            <h2 className="front-page-reason__main-text o-section-heading">
              JobShare Businessが
              <span className="c-text-red-4">選ばれる理由</span>
            </h2>
          </header>
          <div className="front-page-reason__body">
            {ReasonItems.map((item) => (
              <div key={item.num} className="front-page-reason__item">
                {item.num === '01' ? <a id="price" className="o-anchor-target js-anchor-target" /> : null}
                <p className="front-page-reason__num">{item.num}</p>
                <div
                  className={`front-page-reason__text-area${item.num !== '03' ? ' u-border-bottom-absolute' : ''}`}
                >
                  <h3
                    className="front-page-reason__subject"
                    style={{ fontSize: 'clamp(18px, 2.4vw, 26px)' }}
                    dangerouslySetInnerHTML={{ __html: item.subjectHtml }}
                  />
                  <p className="front-page-reason__desc">{item.desc}</p>
                  <div className="front-page-reason__btn">
                    {item.buttons.map((button) => (
                      <SiteLink
                        key={button.className}
                        className={`${button.className} front-page-reason__contact-subject o-btn-bg o-btn-bg--red`}
                        to={button.href}
                      >
                        <p className="front-page-reason__contact-subject-text o-btn-bg__text">{button.label}</p>
                      </SiteLink>
                    ))}
                  </div>
                </div>
                <div className="front-page-reason__picture">
                  <img src={item.image} loading="lazy" alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
