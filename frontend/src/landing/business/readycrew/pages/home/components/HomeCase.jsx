import SiteLink from '../../../components/layout/SiteLink'
import { CaseItems } from '../data/case-items'
import { FeaturedCase } from '../data/featured-case'

function LineArrow() {
  return (
    <div className="m-btn-line-arrow__inner">
      <span className="o-btn-arrow__first m-btn-line-arrow__arrow u-inner-hover-arrow--first" />
      <span className="o-btn-arrow__second m-btn-line-arrow__arrow u-inner-hover-arrow--second" />
    </div>
  )
}

function BgArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

export default function HomeCase() {
  return (
    <>
      <div className="front-page-thought__target js-scroll-target js-scroll-target--more" id="thought" />
      <section className="front-page-case l-section">
        <div className="front-page-case__wrapper l-wrapper--xlarge-on-bg">
          <div className="front-page-case__contents l-contents l-contents--sp-full">
            <header className="front-page-case__header m-section-header--large">
              <h2 className="o-section-heading">
                ビジネスマッチングの
                <br />
                導入事例
              </h2>
            </header>

            <div className="front-page-case__body">
              <SiteLink className="front-page-case__large-item u-hover-wrapper" to={FeaturedCase.href}>
                <div className="front-page-case__text-area--large">
                  <p className="front-page-case__corp-name">{FeaturedCase.company}</p>
                  <h3 className="front-page-case__main-text--large">{FeaturedCase.title}</h3>
                  <p className="front-page-case__desc--large" />
                  <div className="front-page-case__btn--large o-btn-line m-btn-line-arrow u-inner-hover-btn-border">
                    <span className="front-page-case__anchor-text">事例を見る</span>
                    <LineArrow />
                  </div>
                </div>
                <div className="front-page-case__picture-area--large">
                  <div className="front-page-case__picture--large u-inner-hover-zoom">
                    <img className="front-page-case__picture-body" src={FeaturedCase.image} loading="lazy" alt="" />
                  </div>
                  <div className="front-page-case__caption">
                    <p className="front-page-case__caption-main--large">{FeaturedCase.categoryMain}</p>
                    <p className="front-page-case__caption-sub--large">{FeaturedCase.categorySub}</p>
                  </div>
                </div>
              </SiteLink>
              <div className="front-page-case__three-column">
                {CaseItems.map((item) => (
                  <SiteLink key={item.href} className="front-page-case__item u-hover-wrapper" to={item.href}>
                    <div className="front-page-case__picture-area">
                      <div className="front-page-case__picture u-inner-hover-zoom">
                        <img className="front-page-case__picture-body" src={item.image} loading="lazy" alt="" />
                      </div>
                      <div className="front-page-case__caption">
                        <p className="front-page-case__caption-main">{item.categoryMain}</p>
                        <p className="front-page-case__caption-sub">{item.categorySub}</p>
                      </div>
                    </div>
                    <div className="front-page-case__text-area">
                      <p className="front-page-case__corp-name">{item.company}</p>
                      <h3 className="front-page-case__main-text">{item.title}</h3>
                      <p className="front-page-case__desc" />
                      <div className="front-page-case__btn o-btn-line m-btn-line-arrow u-inner-hover-btn-border">
                        <span className="front-page-case__anchor-text">事例を見る</span>
                        <div className="m-btn-line-arrow__inner">
                          <span className="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--first u-inner-hover-arrow--first" />
                          <span className="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--second u-inner-hover-arrow--second" />
                        </div>
                      </div>
                    </div>
                  </SiteLink>
                ))}
              </div>
              <SiteLink className="front-page-case__large-btn o-btn-bg--white-gray m-btn-bg-arrow" to="/results/">
                <span className="front-page-case__anchor-text m-btn-bg-arrow__text">
                  レディクル ビジネスマッチングの実例
                </span>
                <BgArrow />
              </SiteLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
