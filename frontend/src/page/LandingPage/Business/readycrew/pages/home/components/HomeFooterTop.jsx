import { ArrowIcon, PhoneIcon } from '../../../components/layout/icons'
import SiteLink from '../../../components/layout/SiteLink'
import footerCharacterImage from '../../../../../../../assets/char.jpg'

export default function HomeFooterTop() {
  return (
    <section className="footer-top l-section">
      <div className="footer-top-conversion">
        <div className="footer-top-conversion__contents l-contents--large">
          <div className="footer-top-conversion__upper">
            <picture className="footer-top-conversion__picture">
              <img
                className="footer-top-conversion__picture-body"
                src={footerCharacterImage}
                alt="JobShare Business 採用支援"
                loading="lazy"
              />
            </picture>
          </div>
          <div className="footer-top-conversion__body">
            <div className="footer-top-conversion__text-area">
              <p className="footer-top-conversion__main-text">
                優秀な人材と出会い、
                <br />
                採用をもっとスマートに。
              </p>
              <p className="footer-top-conversion__desc">
                Workstation Jobなら、ビジネス・人材採用の手間を削減。
                <br className="u-br-hd u-br-spu" />
                優れた人材を効率的に採用するための求人プラットフォームです。
              </p>
              <div className="footer-top-conversion__contact">
                <div className="footer-top-conversion__btn-group">
                  <SiteLink
                    className="footer-top-conversion__download-btn o-btn-bg o-btn-bg--hover-border m-element-side-space"
                    to="/inquiry_docs_rc/"
                  >
                    <span className="footer-top-conversion__btn-text o-btn-bg__text">資料ダウンロード</span>
                  </SiteLink>
                  <SiteLink
                    className="footer-top-conversion__contact-btn o-btn-bg o-btn-bg--white m-element-side-space"
                    to="/business/register"
                  >
                    <span className="footer-top-conversion__btn-text o-btn-bg__text">無料で登録する</span>
                  </SiteLink>
                </div>
                <a className="footer-top-conversion__tel" href="tel:080-9441-1975">
                  <span className="footer-top-conversion__tel-icon">
                    <PhoneIcon className="footer-top-conversion__tel-icon-body" />
                  </span>
                  <span className="footer-top-conversion__tel-text">080-9441-1975</span>
                  <span className="footer-top-conversion__time">10:00 〜 18:00 (平日)</span>
                </a>
              </div>
              <SiteLink to="/partner/" className="header-sub__anchor o-anchor-text">
                <span className="o-anchor-text__icon--white">
                  <ArrowIcon />
                </span>
                <span className="o-anchor-text__text c-text-white">受注企業様はこちら</span>
              </SiteLink>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-top-topic-path">
        <div className="footer-top-topic-path__contents">
          <ol className="footer-top-topic-path__list">
            <li className="footer-top-topic-path__item">
              <a className="footer-top-topic-path__anchor" href="https://readycrew.jp">
                ビジネスマッチングのレディクルTOP
              </a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
