import { ArrowIcon } from '../../../components/layout/icons'
import SiteLink from '../../../components/layout/SiteLink'
import conversionModelImage from '../../../../../../../../middle_model_icon.png'

export default function HomeConversion() {
  return (
    <section className="front-page-conversion l-section">
      <div className="m-conversion-bnr">
        <div className="m-conversion-bnr__contents ">
          {/* <p className="m-conversion-bnr__logo">
            <img src="/landing/business/assets/images/common/logo.png" alt="Ready Crew" />
          </p> */}
          <div className="m-conversion-bnr__row">
            <div className="m-conversion-bnr__text-area">
              <p className="m-conversion-bnr__sub-text">外国人エンジニア採用を、もっとシンプルに。</p>
              <p className="m-conversion-bnr__main-text">
                JobShare Businessは、優秀な人材との出会いから、
                <br />
                採用成功までを一気通貫でサポートします。
              </p>
              <SiteLink className="m-conversion-bnr__wrapper u-hover-wrapper" to="/inquiry_docs_rc/">
                <p className="m-conversion-bnr__btn o-btn-bg u-inner-hover-btn-white-border u-hover-none">
                  <span className="m-conversion-bnr__btn-text u-inner-hover-text-effect u-font-sp-large">
                    無料相談はこちら!
                  </span>
                </p>
              </SiteLink>
              <SiteLink to="/partner/" className="header-sub__anchor o-anchor-text">
                <span className="o-anchor-text__icon--white">
                  <ArrowIcon />
                </span>
                <span className="o-anchor-text__text c-text-white">受注企業様はこちら</span>
              </SiteLink>
            </div>
            <picture className="m-conversion-bnr__picture">
              <img
                className="m-conversion-bnr__picture-body"
                src={conversionModelImage}
                alt="JobShare Business 採用支援"
                loading="lazy"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  )
}
