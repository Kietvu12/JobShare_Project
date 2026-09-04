import SiteLink from '../../../components/layout/SiteLink'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeAppealCopy } from '../../../../../../../i18n/businessApp/homeAppeal'

const APPEAL_VIDEO_ID = 's-qy-EaoOXg'
const APPEAL_VIDEO_THUMBNAIL = `https://img.youtube.com/vi/${APPEAL_VIDEO_ID}/maxresdefault.jpg`

const JA_MAIN_TEXT_STYLE = {
  fontSize: 'clamp(18px, 3.2vw, 34px)',
}

export default function HomeAppeal() {
  const { language } = useLanguage()
  const copy = getHomeAppealCopy(language)
  const isJapanese = language === 'ja'

  return (
    <section className={`front-page-appeal${isJapanese ? '' : ` front-page-appeal--${language}`}`}>
      <div className="front-page-appeal__contents">
        <div className="front-page-appeal__text-area">
          <h2
            className={`front-page-appeal__main-text${isJapanese ? '' : ' front-page-appeal__main-text--i18n'}`}
            style={isJapanese ? JA_MAIN_TEXT_STYLE : undefined}
          >
            <span className="c-text-red-4">
              {copy.titleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {copy.alwaysBreakAfter?.includes(index) ? <br /> : null}
                  {!isJapanese && index < copy.titleLines.length - 1 && !copy.alwaysBreakAfter?.includes(index) ? (
                    <br />
                  ) : null}
                </span>
              ))}
            </span>
          </h2>
          <p className={`front-page-appeal__desc${isJapanese ? '' : ' front-page-appeal__desc--i18n'}`}>
            {copy.desc}
          </p>
          <SiteLink to="/contact_rc2/" className="button">
            {copy.cta}
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
                    alt={copy.videoAlt}
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
              <span className="txt_white">{copy.videoBadge}</span>
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
