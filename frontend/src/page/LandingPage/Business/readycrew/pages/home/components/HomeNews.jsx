import SiteLink from '../../../components/layout/SiteLink'
import { NewsItems } from '../data/news-items'

function BgArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

export default function HomeNews() {
  return (
    <section className="front-page-news l-section">
      <div className="front-page-news__contents l-contents">
        <header className="front-page-news__header m-section-header">
          <h2 className="o-section-heading">お知らせ</h2>
        </header>
        <div className="front-page-news__body">
          <div className="front-page-news__list">
            {NewsItems.map((item) => (
              <div key={item.href} className="front-page-news__item u-hover-wrapper">
                <SiteLink className="front-page-news__anchor" to={item.href}>
                  <p className="front-page-news__date" datetime={item.dateIso}>
                    {item.date}
                  </p>
                  <p className="front-page-news__category">{item.category}</p>
                  <p className="front-page-news__title u-inner-hover-text-red">
                    <span className="u-inner-hover-red-line">{item.title}</span>
                  </p>
                </SiteLink>
              </div>
            ))}
          </div>
          <SiteLink className="front-page-news__large-btn o-btn-border--gray m-btn-bg-arrow" to="/news/">
            <span className="front-page-news__anchor-text m-btn-bg-arrow__text">お知らせ一覧</span>
            <BgArrow />
          </SiteLink>
        </div>
      </div>
    </section>
  )
}
