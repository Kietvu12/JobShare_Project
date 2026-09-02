import { ArrowIcon, PhoneIcon } from '../../../components/layout/icons'
import SiteLink from '../../../components/layout/SiteLink'
import { FlowSteps } from '../data/flow-steps'

export default function HomeFlow() {
  return (
    <section className="front-page-flow l-section">
      <div className="front-page-flow__target js-scroll-target" id="flow" />
      <div className="front-page-flow__contents l-contents">
        <header className="front-page-flow__header m-section-header">
          <h2 className="o-section-heading">
            JobShare Businessのご利用の流れ
            <br />
            企業登録・求人作成 → サービス選択 → 採用活動開始
          </h2>
        </header>
        <div className="front-page-flow__body">
          <div className="front-page-flow__one-column">
            {FlowSteps.map((step, index) => (
              <div key={step.step} className="front-page-flow__item">
                <div className="front-page-flow__picture">
                  <div className="front-page-flow__picture-body">
                    <img src={step.image} alt={step.imageAlt} />
                  </div>
                  {index < FlowSteps.length - 1 ? <div className="front-page-flow__arrow" /> : null}
                </div>
                <div className="front-page-flow__text-area">
                  <p className="front-page-flow__main-text-en">{step.step}</p>
                  <h3 className="front-page-flow__main-text-jp">{step.title}</h3>
                  <p
                    className="front-page-flow__desc"
                    dangerouslySetInnerHTML={{ __html: step.descHtml }}
                  />
                  {index === 0 ? (
                    <div className="front-page-flow__contact">
                      <SiteLink className="front-page-flow__contact-subject o-btn-bg o-btn-bg--red" to="/contact_rc/">
                        <p className="front-page-flow__contact-subject-text o-btn-bg__text">無料相談はこちら!</p>
                      </SiteLink>
                      <a className="front-page-flow__contact-info" href="tel:097-289-97-28">
                        <div className="front-page-flow__contact-tel">
                          <p className="front-page-flow__contact-icon">
                            <PhoneIcon />
                          </p>
                          <p className="front-page-flow__contact-tel-text">097-289-97-28</p>
                        </div>
                        <p className="front-page-flow__contact-time">10:00 〜 18:00 (平日)</p>
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="front-page-flow__lower">
            <div className="front-page-flow__tel-item">
              <a className="front-page-flow__tel m-element-side-space" href="tel:097-289-97-28">
                <span className="front-page-flow__tel-icon">
                  <PhoneIcon className="front-page-flow__tel-icon-body" />
                </span>
                <span className="front-page-flow__tel-text">097-289-97-28</span>
                <span className="front-page-flow__time">10:00 〜 18:00 (平日)</span>
              </a>
              <SiteLink to="/partner/" className="header-sub__anchor o-anchor-text">
                <span className="o-anchor-text__icon--white">
                  <ArrowIcon />
                </span>
                <span className="o-anchor-text__text c-text-white">受注企業様はこちら</span>
              </SiteLink>
            </div>
            <SiteLink
              className="front-page-flow__download-btn o-btn-bg o-btn-bg--hover-border m-element-side-space"
              to="/inquiry_docs_rc/"
            >
              <span className="front-page-flow__anchor-text o-btn-bg__text">資料ダウンロード</span>
            </SiteLink>
            <SiteLink
              className="front-page-flow__contact-btn o-btn-bg o-btn-bg--white o-btn-bg--hover-border m-element-side-space"
              to="/contact_rc/"
            >
              <span className="front-page-flow__anchor-text o-btn-bg__text">
                外注先を無料で
                <br className="br-sp" />
                相談する
              </span>
            </SiteLink>
          </div>
        </div>
      </div>
    </section>
  )
}
