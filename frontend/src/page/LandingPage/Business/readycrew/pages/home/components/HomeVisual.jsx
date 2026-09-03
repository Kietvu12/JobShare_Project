import SiteLink from '../../../components/layout/SiteLink'
import heroVisualImage from '../../../../../../../assets/template_business/hero_bg_icon.png'
import heroBadgeImage from '../../../../../../../assets/template_business/hero_icon_JP.png'

export default function HomeVisual() {
  return (
    <section className="front-page-visual">
      <div className="front-page-visual__upper">
        <div className="front-page-visual__contents">
          <div className="front-page-visual__wrapper js-visual-wrapper">
            <div className="front-page-visual__text-area js-visual-text-area">
              <p
                className="front-page-visual__sub-text"
                style={{ fontSize: 'clamp(14px, 2.1vw, 28px)' }}
              >
                外国人高度人材採用プラットフォーム
              </p>
              <h2 className="front-page-visual__main-text">
                <span
                  className="front-page-visual__main-text-body"
                  style={{
                    width: 'auto',
                    maxWidth: '100%',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    fontWeight: 900,
                    color: '#fff',
                    fontSize: 'clamp(28px, 3.2vw, 44px)',
                    lineHeight: 1.45,
                    fontFeatureSettings: '"palt"',
                  }}
                >
                  外国人高度人材の採用を、
                  <br />
                  もっと自由に。もっと確実に。
                </span>
              </h2>
              <p className="front-page-visual__desc">
                JobShare Businessは、
                <br />
                外国人エンジニア・高度人材の採用を支援する
                <br />
                企業向け採用プラットフォームです。
                <br />
                求人作成、候補者検索、スカウト、採用代行、
                <br className="u-br-sp" />
                採用広報、採用パートナー連携まで、
                <br />
                採用課題に合った方法を選択できます。
              </p>
              <div className="fpv_btn_group">
                <SiteLink
                  className="fpv_btn_group_download o-btn-bg o-btn-bg--hover-border"
                  to="/inquiry_docs_rc/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text">
                    サービス資料を
                    <br />
                    ダウンロード
                  </span>
                </SiteLink>
                <SiteLink
                  className="fpv_btn_group_contact_rc o-btn-bg o-btn-bg--white o-btn-bg--hover-border"
                  to="/contact_rc/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text o-btn-bg__text--red">
                    無料で
                    <br />
                    企業登録する
                  </span>
                </SiteLink>
                <SiteLink
                  className="fpv_btn_group__contact_sl o-btn-bg o-btn-bg--white o-btn-bg--hover-border"
                  to="/sl_cp2025/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text o-btn-bg__text--red">
                    採用について
                    <br />
                    相談する
                  </span>
                </SiteLink>
              </div>
            </div>
            <div className="front-page-visual__picture-area front-page-visual__picture-area--jobshare-hero js-visual-picture-area">
              <picture className="front-page-visual__picture">
                <img
                  className="front-page-visual__picture-body"
                  src={heroVisualImage}
                  alt="JobShare Business ダッシュボード"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
      <div className="front-page-visual__lower">
        <div className="front-page-visual__contents">
          <div className="front-page-visual__badge-group">
            <img
              src={heroBadgeImage}
              alt="技術系外国人材データベース40,000+ HRパートナーネットワーク500+ 東南アジア初AI外国人採用プラットフォーム"
            />
          </div>
          <ol className="front-page-visual__caption-list">
            <li className="front-page-visual__caption">
              掲載数値は、2026年6月時点におけるJobShareの運営実績および登録データをもとに算出しています。
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
