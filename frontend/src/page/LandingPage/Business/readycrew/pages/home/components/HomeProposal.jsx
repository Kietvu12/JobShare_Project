import SiteLink from '../../../components/layout/SiteLink'
import { ProposalItems } from '../data/proposal-items'

function BgArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

export default function HomeProposal() {
  return (
    <section className="front-page-proposal l-section">
      <div className="front-page-proposal__contents l-contents">
        <h2 className="front-page-proposal__main-text">
          採用課題と社内体制に合わせて
          <br />
          <span className="c-text-red-4">最適な4つの採用サービス</span>を
          <span className="c-text-red-4">ご提案</span>
        </h2>
        <SiteLink className="front-page-proposal__btn o-btn-border--gray m-btn-bg-arrow" to="/proposal/">
          <span className="front-page-news__anchor-text m-btn-bg-arrow__text">マッチング領域を全て見る</span>
          <BgArrow />
        </SiteLink>
        <div className="front-page-proposal__body front-page-proposal__body--2x2">
          {ProposalItems.map((item) => (
            <SiteLink key={item.href} className="front-page-proposal__item" to={item.href}>
              <div className="front-page-proposal__item-header">
                <div className={`front-page-proposal__icon front-page-proposal__icon--${item.iconVariant}`}>
                  <img src={item.iconSrc} alt="" />
                </div>
                <div className="front-page-proposal__item-text">
                  <h3 className="front-page-proposal__subject c-text-red-4">{item.subject}</h3>
                  <p className="front-page-proposal__subject-jp">{item.subjectJp}</p>
                </div>
              </div>
              <ol className="front-page-proposal__tag">
                {item.tags.map((tag) => (
                  <li key={tag} className="front-page-proposal__tag-text">
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
