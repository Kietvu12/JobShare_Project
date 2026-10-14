
export default function SeminarCard({ item }) {
  return (
    <a href={item.href} className="page-seminar-list__block u-hover-wrapper">
      <div className="page-seminar-list__picture u-inner-hover-picture-zoom">
        <img src={item.image} alt="" className="page-seminar-list__img" />
        <p className="page-seminar-list__category" data-status={item.status}>
          {item.status}
        </p>
      </div>
      {item.time ? <p className="page-seminar-list__time">{item.time}</p> : <p className="page-seminar-list__time">&nbsp;</p>}
      <p className="page-seminar-list__title" dangerouslySetInnerHTML={{ __html: item.title }} />
    </a>
  )
}

function ListArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

export function SeminarSectionBlock({ id, title, listHref, listLabel, hasTagFilter, items }) {
  return (
    <div className="page-seminar-list__container">
      <div className="js-scroll-target" id={id} />
      <header className="page-seminar-list__header m-section-header--large">
        <h2 className="o-section-heading">{title}</h2>
      </header>

      {hasTagFilter && (
        <div className="page-results-search">
          <select id="seminar-tag-select" className="page-results-search__select-item" defaultValue="">
            <option value="">すべて</option>
          </select>
          <button type="button" id="seminar-tag-search-btn" className="page-results-search__btn">
            🔍 検索
          </button>
        </div>
      )}

      <div className="page-seminar-list__row">
        {items.map((item) => (
          <SeminarCard key={item.href} item={item} />
        ))}
      </div>

      <a className="page-seminar-list__btn o-btn-border--gray m-btn-bg-arrow" href={listHref}>
        <span className="front-page-news__anchor-text m-btn-bg-arrow__text">{listLabel}</span>
        <ListArrow />
      </a>
    </div>
  )
}
