import SiteLink from '../../../components/layout/SiteLink'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeProposalCopy, getProposalItems } from '../../../../../../../i18n/businessApp/homeProposal'

function BgArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

export default function HomeProposal() {
  const { language } = useLanguage()
  const copy = getHomeProposalCopy(language)
  const items = getProposalItems(language)
  const isJapanese = language === 'ja'

  return (
    <section className={`front-page-proposal l-section${isJapanese ? '' : ` front-page-proposal--${language}`}`}>
      <div className="front-page-proposal__contents l-contents">
        <h2
          className={`front-page-proposal__main-text${isJapanese ? '' : ' front-page-proposal__main-text--i18n'}`}
        >
          {copy.titleLine1}
          <br />
          <span className="c-text-red-4">{copy.titleHighlight1}</span>
          {copy.titleMid}
          <span className="c-text-red-4">{copy.titleHighlight2}</span>
        </h2>
        <SiteLink className="front-page-proposal__btn o-btn-border--gray m-btn-bg-arrow" to="/proposal/">
          <span
            className={`front-page-news__anchor-text m-btn-bg-arrow__text${isJapanese ? '' : ' front-page-proposal__btn-text--i18n'}`}
          >
            {copy.viewAllBtn}
          </span>
          <BgArrow />
        </SiteLink>
        <div className="front-page-proposal__body front-page-proposal__body--2x2">
          {items.map((item) => (
            <SiteLink key={item.href} className="front-page-proposal__item" to={item.href}>
              <div className="front-page-proposal__item-header">
                <div className={`front-page-proposal__icon front-page-proposal__icon--${item.iconVariant}`}>
                  <img src={item.iconSrc} alt="" />
                </div>
                <div className="front-page-proposal__item-text">
                  <h3
                    className={`front-page-proposal__subject c-text-red-4${isJapanese ? '' : ' front-page-proposal__subject--i18n'}`}
                  >
                    {item.subject}
                  </h3>
                  <p
                    className={`front-page-proposal__subject-jp${isJapanese ? '' : ' front-page-proposal__subject-jp--i18n'}`}
                  >
                    {item.subjectSubtitle}
                  </p>
                </div>
              </div>
              <ol className="front-page-proposal__tag">
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className={`front-page-proposal__tag-text${isJapanese ? '' : ' front-page-proposal__tag-text--i18n'}`}
                  >
                    {tag}
                  </li>
                ))}
              </ol>
            </SiteLink>
          ))}
        </div>
      </div>
    </section>
  )
}
