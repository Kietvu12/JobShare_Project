import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeCorporationCopy } from '../../../../../../../i18n/businessApp/homeCorporation'
import { CorporationLogos } from '../data/corporation-logos'

export default function HomeCorporation() {
  const { language } = useLanguage()
  const copy = getHomeCorporationCopy(language)
  const isJapanese = language === 'ja'

  return (
    <section
      className={`front-page-corporation l-section--small${isJapanese ? '' : ` front-page-corporation--${language}`}`}
    >
      <div className="front-page-corporation__upper l-wrapper--large-on-bg">
        <div className="front-page-corporation__contents">
          <div className="front-page-corporation-slider js-corp-marquee">
            <div className="front-page-corporation-slider__wrapper js-corp-marquee__wrapper">
              {CorporationLogos.map((logo, index) => (
                <div key={`${logo.src}-${index}`} className="front-page-corporation-slider__item js-corp-marquee__item">
                  <img
                    className="front-page-corporation-slider__item-body js-corp-marquee__item-body"
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="front-page-corporation__lower">
        <div className="front-page-corporation__lower-contents l-contents--large">
          <h2
            className={`front-page-corporation__main-text${isJapanese ? '' : ' front-page-corporation__main-text--i18n'}`}
          >
            {copy.titleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}
                {copy.alwaysBreakAfter?.includes(index) ? <br /> : null}
                {copy.mobileBreakAfter?.includes(index) ? <br className="u-br-sp" /> : null}
                {!isJapanese && index < copy.titleLines.length - 1 && !copy.alwaysBreakAfter?.includes(index) ? (
                  <br />
                ) : null}
              </span>
            ))}
          </h2>
        </div>
      </div>
    </section>
  )
}
