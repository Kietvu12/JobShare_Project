import SiteLink from '../../../components/layout/SiteLink'

function LineArrow() {
  return (
    <div className="m-btn-line-arrow__inner">
      <span className="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--first u-inner-hover-arrow--first" />
      <span className="m-btn-line-arrow__arrow m-btn-line-arrow__arrow--second u-inner-hover-arrow--second" />
    </div>
  )
}

export default function ProposalCategoryCard({ category }) {
  return (
    <SiteLink className="page-proposal-main__item u-hover-wrapper" to={category.href}>
      <div className="page-proposal-main__item-header">
        <div className={`front-page-proposal__icon front-page-proposal__icon--${category.iconVariant}`}>
          <img src={category.iconSrc} alt="" />
        </div>
        <div className="page-proposal-main__item-text">
          <h3 className="page-proposal-main__subject c-text-red-4">{category.title}</h3>
          <p className="page-proposal-main__subject-jp">{category.subtitle}</p>
        </div>
      </div>
      <p className="page-proposal-main__result">{category.countLabel}</p>
      <ol className="page-proposal-main__tag">
        {category.tags.map((tag) => (
          <li key={tag} className="page-proposal-main__tag-text">
            {tag}
          </li>
        ))}
      </ol>
      <div className="page-proposal-main__btn o-btn-line m-btn-line-arrow u-inner-hover-btn-border">
        <span className="page-proposal-main__anchor-text">{category.linkLabel}</span>
        <LineArrow />
      </div>
    </SiteLink>
  )
}
