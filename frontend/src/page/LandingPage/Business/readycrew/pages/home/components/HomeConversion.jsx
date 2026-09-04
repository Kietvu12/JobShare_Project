import { ArrowIcon } from '../../../components/layout/icons'
import SiteLink from '../../../components/layout/SiteLink'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeConversionCopy } from '../../../../../../../i18n/businessApp/homeConversion'
import conversionModelImage from '../../../../../../../../middle_model_icon.png'

export default function HomeConversion() {
  const { language } = useLanguage()
  const copy = getHomeConversionCopy(language)
  const isJapanese = language === 'ja'

  return (
    <section className={`front-page-conversion l-section${isJapanese ? '' : ` front-page-conversion--${language}`}`}>
      <div className="m-conversion-bnr">
        <div className="m-conversion-bnr__contents ">
          <div className="m-conversion-bnr__row">
            <div className="m-conversion-bnr__text-area">
              <p
                className={`m-conversion-bnr__sub-text${isJapanese ? '' : ' m-conversion-bnr__sub-text--i18n'}`}
              >
                {copy.subText}
              </p>
              <p
                className={`m-conversion-bnr__main-text${isJapanese ? '' : ' m-conversion-bnr__main-text--i18n'}`}
              >
                {copy.mainTitleLines.map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {line}
                    {index < copy.mainTitleLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
              <SiteLink className="m-conversion-bnr__wrapper u-hover-wrapper" to="/inquiry_docs_rc/">
                <p className="m-conversion-bnr__btn o-btn-bg u-inner-hover-btn-white-border u-hover-none">
                  <span
                    className={`m-conversion-bnr__btn-text u-inner-hover-text-effect u-font-sp-large${isJapanese ? '' : ' m-conversion-bnr__btn-text--i18n'}`}
                  >
                    {copy.cta}
                  </span>
                </p>
              </SiteLink>
              <SiteLink to="/partner/" className="header-sub__anchor o-anchor-text">
                <span className="o-anchor-text__icon--white">
                  <ArrowIcon />
                </span>
                <span
                  className={`o-anchor-text__text c-text-white${isJapanese ? '' : ' m-conversion-bnr__partner-link--i18n'}`}
                >
                  {copy.partnerLink}
                </span>
              </SiteLink>
            </div>
            <picture className="m-conversion-bnr__picture">
              <img
                className="m-conversion-bnr__picture-body"
                src={conversionModelImage}
                alt={copy.imageAlt}
                loading="lazy"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  )
}
