import { Link } from 'react-router-dom'
import { ArrowIcon, PhoneIcon } from '../../price/components/icons'

export default function DocumentFooterTop() {
  return (
    <section className="footer-top l-section">
      <div className="footer-top-conversion">
        <div className="footer-top-conversion__contents l-contents--large">
          <div className="footer-top-conversion__upper">
            <picture className="footer-top-conversion__picture">
              <source media="(max-width: 767px)" srcSet="/landing/business/assets/images/common/footer-top-people-sp.png" />
              <img
                className="footer-top-conversion__picture-body"
                src="/landing/business/assets/images/common/footer-top-people.png"
                alt="Ready Crew(レディクル)公式アンバサダー 広瀬アリス"
                loading="lazy"
              />
            </picture>
          </div>
          <div className="footer-top-conversion__body">
            <div className="footer-top-conversion__text-area">
              <p className="footer-top-conversion__main-text">
                ビジネスマッチングで
                <br />
                圧倒的、解決力！
              </p>
              <p className="footer-top-conversion__desc">
                ReadyCrew（レディクル）は完全無料で外注先を紹介する
                <br className="u-br-hd u-br-spu" />
                ビジネスマッチングサービスです。お気軽にお問い合わせください。
              </p>
              <div className="footer-top-conversion__contact">
                <div className="footer-top-conversion__btn-group">
                  <Link
                    className="footer-top-conversion__download-btn o-btn-bg o-btn-bg--hover-border m-element-side-space"
                    to="/inquiry_docs_rc"
                  >
                    <span className="footer-top-conversion__btn-text o-btn-bg__text">資料ダウンロード</span>
                  </Link>
                  <Link
                    className="footer-top-conversion__contact-btn o-btn-bg o-btn-bg--white m-element-side-space"
                    to="/contact_rc"
                  >
                    <span className="footer-top-conversion__btn-text o-btn-bg__text">外注先を無料で相談する</span>
                  </Link>
                </div>
                <a className="footer-top-conversion__tel" href="tel:097-289-97-28">
                  <span className="footer-top-conversion__tel-icon">
                    <PhoneIcon className="footer-top-conversion__tel-icon-body" />
                  </span>
                  <span className="footer-top-conversion__tel-text">097-289-97-28</span>
                  <span className="footer-top-conversion__time">10:00 〜 18:00 (平日)</span>
                </a>
              </div>
              <Link to="/partner" className="header-sub__anchor o-anchor-text">
                <span className="o-anchor-text__icon--white">
                  <ArrowIcon />
                </span>
                <span className="o-anchor-text__text c-text-white">受注企業様はこちら</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-top-topic-path">
        <div className="footer-top-topic-path__contents">
          <ol className="footer-top-topic-path__list">
            <li className="footer-top-topic-path__item">
              <Link className="footer-top-topic-path__anchor" to="/">
                ビジネスマッチングのレディクルTOP
              </Link>
            </li>
            <li className="footer-top-topic-path__item">
              <Link className="footer-top-topic-path__anchor" to="/news">
                ニュース
              </Link>
            </li>
            <li className="footer-top-topic-path__item">お役立ち資料</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
