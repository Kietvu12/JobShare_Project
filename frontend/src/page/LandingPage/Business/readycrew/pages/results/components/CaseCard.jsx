
export default function CaseCard({ caseStudy, variant = 'column' }) {
  const className = variant === 'pickup' ? 's-card u-hover-wrapper' : 's-card -column u-hover-wrapper'

  return (
    <a className={className} href={caseStudy.href}>
      <div className="s-card__picture-area">
        <div className="s-card__picture">
          <img className="s-card__picture-body" src={caseStudy.picture} alt={caseStudy.pictureAlt} />
        </div>
      </div>
      <div className="s-card__text-area">
        <p className="s-card__subject">{caseStudy.subject}</p>
        <div className="s-card__corp-name">
          {caseStudy.logo && (
            <figure className="logo-wrapper">
              <img className="logo" src={caseStudy.logo} alt={caseStudy.logoAlt ?? ''} />
            </figure>
          )}
          {caseStudy.company}
        </div>
        <div className="s-card__info">
          {caseStudy.industry && (
            <div className="s-card__info-industry">
              <span className="c-badge -industry">業種</span>
              <object>
                <a href={caseStudy.industry.href}>{caseStudy.industry.label}</a>
              </object>
            </div>
          )}
          {caseStudy.categories.length > 0 && (
            <div className="s-card__info-category">
              <span className="c-badge -cat">案件カテゴリ</span>
              {caseStudy.categories.map((category) => (
                <object key={category.href + category.label}>
                  <a href={category.href} className="c-badge -rounded -red">
                    {category.label}
                  </a>
                </object>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
