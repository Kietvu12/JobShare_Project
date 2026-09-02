import SiteLink from '../../../components/layout/SiteLink'

const APPEAL_VIDEO_ID = 's-qy-EaoOXg'
const APPEAL_VIDEO_THUMBNAIL = `https://img.youtube.com/vi/${APPEAL_VIDEO_ID}/maxresdefault.jpg`

export default function HomeAppeal() {
  return (
    <section className="front-page-appeal">
      <div className="front-page-appeal__contents">
        <div className="front-page-appeal__text-area">
          <h2
            className="front-page-appeal__main-text"
            style={{ fontSize: 'clamp(18px, 3.2vw, 34px)' }}
          >
            <span className="c-text-red-4">
              外国人材採用に必要なすべてを、
              <br />
              ひとつのプラットフォームに。
            </span>
          </h2>
          <p className="front-page-appeal__desc">
            JobShare Businessは、外国人高度人材の採用に必要な機能とサービスを一元化した、企業向け採用支援プラットフォームです。AIによる求人票作成、候補者検索・マッチング、スカウト、採用支援、採用ブランディング、採用パートナーネットワークまで、採用活動を一つの画面から進められます。企業ごとの採用課題や社内体制に合わせて、必要な機能・サービスだけを選択して利用できます。
          </p>
          <SiteLink to="/contact_rc2/" className="button">
            外国人材採用について相談する
            <span className="arrow" />
          </SiteLink>
        </div>

        <div className="front-page-appeal__movie-area">
          <div className="front-page-appeal-movie js-movie-gallery">
            <div className="front-page-appeal-movie__main-area js-movie-gallery-main-area">
              <div className="front-page-appeal-movie__first js-movie-gallery-first">
                <div className="front-page-appeal-movie__first-thumbnail js-movie-gallery-first-thumbnail">
                  <img
                    className="front-page-appeal-movie__first-thumbnail-body"
                    src={APPEAL_VIDEO_THUMBNAIL}
                    loading="lazy"
                    alt="JobShare Business 紹介動画"
                  />
                </div>
                <div className="front-page-appeal-movie__btn js-movie-gallery-btn" data-video-id={APPEAL_VIDEO_ID}>
                  <div className="front-page-appeal-movie__btn-inner">
                    <div className="front-page-appeal-movie__arrow--first" />
                    <div className="front-page-appeal-movie__arrow--second" />
                  </div>
                </div>
              </div>
            </div>

            <div className="js-movie-gallery-iframe-wrapper">
              <div className="js-movie-gallery-player" id="yt_player" />
            </div>
            <div className="front-page-appeal-movie__thumbnail-area">
              <span className="txt_white">CM放映中</span>
            </div>
          </div>
        </div>
      </div>
      <div className="front-page-appeal-marquee">
        <div className="front-page-appeal-marquee__body js-logo-marquee">
          <p className="front-page-appeal-marquee__text">
            <span className="front-page-appeal-marquee__text-en">JobShare for Business</span>
          </p>
        </div>
      </div>
    </section>
  )
}
