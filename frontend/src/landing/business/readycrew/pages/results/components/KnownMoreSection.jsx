import { Link } from 'react-router-dom'
import { KNOWN_MORE_ITEMS } from '../data/pageMeta'

function LineArrowButton({ label }) {
  return (
    <div className="o-btn-line o-btn-line m-btn-line-arrow">
      <span className="m-btn-line-arrow__text">{label}</span>
      <div className="m-btn-line-arrow__inner">
        <span className="m-btn-line-arrow__arrow--first m-btn-line-arrow__arrow" />
        <span className="m-btn-line-arrow__arrow--second m-btn-line-arrow__arrow" />
      </div>
    </div>
  )
}

export default function KnownMoreSection() {
  return (
    <section className="m-known-more l-section--small l-section--sp-full">
      <div className="l-wrapper--large-on-bg">
        <div className="m-known-more__contents l-contents--large">
          <header className="m-known-more__header">
            <h2 className="m-known-more__main-text">
              Ready Crew<small>(レディクル)</small>を
              <br />
              もっと知る
            </h2>
          </header>
          <div className="m-known-more__body">
            {KNOWN_MORE_ITEMS.map((item) => {
              const isInternal = item.href.startsWith('/') && !item.href.includes('#')
              const content = (
                <>
                  <div className="m-known-more__picture u-inner-hover-zoom">
                    <img src={item.image} alt="" />
                  </div>
                  <div className="m-known-more__text">
                    <LineArrowButton label={item.label} />
                  </div>
                </>
              )

              if (isInternal) {
                return (
                  <Link key={item.href} to={item.href.replace(/\/$/, '')} className="m-known-more__item u-hover-wrapper m-btn-line-arrow-wrapper">
                    {content}
                  </Link>
                )
              }

              return (
                <a key={item.href} href={item.href} className="m-known-more__item u-hover-wrapper m-btn-line-arrow-wrapper">
                  {content}
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
