import SiteLink from '../../../components/layout/SiteLink'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeVisualBadgeImage, getHomeVisualCopy } from '../../../../../../../i18n/businessApp/homeVisual'
import heroVisualImage from '../../../../../../../assets/template_business/hero_bg_icon.png'

const JA_MAIN_TEXT_STYLE = {
  width: 'auto',
  maxWidth: '100%',
  fontFamily: '"Noto Sans JP", sans-serif',
  fontWeight: 900,
  color: '#fff',
  fontSize: 'clamp(28px, 3.2vw, 44px)',
  lineHeight: 1.45,
  fontFeatureSettings: '"palt"',
}

export default function HomeVisual() {
  const { language } = useLanguage()
  const copy = getHomeVisualCopy(language)
  const badgeImage = getHomeVisualBadgeImage(language)
  const isJapanese = language === 'ja'

  return (
    <section className={`front-page-visual${isJapanese ? '' : ` front-page-visual--${language}`}`}>
      <div className="front-page-visual__upper">
        <div className="front-page-visual__contents">
          <div className="front-page-visual__wrapper js-visual-wrapper">
            <div className="front-page-visual__text-area js-visual-text-area">
              <p
                className={`front-page-visual__sub-text${isJapanese ? '' : ' front-page-visual__sub-text--i18n'}`}
                style={isJapanese ? { fontSize: 'clamp(14px, 2.1vw, 28px)' } : undefined}
              >
                {copy.subText}
              </p>
              <h2 className="front-page-visual__main-text">
                <span
                  className={`front-page-visual__main-text-body${isJapanese ? '' : ' front-page-visual__main-text-body--i18n'}`}
                  style={isJapanese ? JA_MAIN_TEXT_STYLE : undefined}
                >
                  {copy.mainTitleLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                      {index < copy.mainTitleLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </span>
              </h2>
              <p className={`front-page-visual__desc${isJapanese ? '' : ' front-page-visual__desc--i18n'}`}>
                {copy.descLines.map((line, index) => (
                  <span key={index}>
                    {copy.descMobileSplitAt?.[index] ? (
                      <>
                        {copy.descMobileSplitAt[index][0]}
                        <br className="u-br-sp" />
                        {copy.descMobileSplitAt[index][1]}
                      </>
                    ) : (
                      line
                    )}
                    {index < copy.descLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
              <div className="fpv_btn_group">
                <SiteLink
                  className="fpv_btn_group_download o-btn-bg o-btn-bg--hover-border"
                  to="/inquiry_docs_rc/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text">
                    {copy.btnDownloadLines.map((line, index) => (
                      <span key={`${line}-${index}`}>
                        {index > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </span>
                </SiteLink>
                <SiteLink
                  className="fpv_btn_group_contact_rc o-btn-bg o-btn-bg--white o-btn-bg--hover-border"
                  to="/contact_rc/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text o-btn-bg__text--red">
                    {copy.btnRegisterLines.map((line, index) => (
                      <span key={`${line}-${index}`}>
                        {index > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </span>
                </SiteLink>
                <SiteLink
                  className="fpv_btn_group__contact_sl o-btn-bg o-btn-bg--white o-btn-bg--hover-border"
                  to="/sl_cp2025/"
                >
                  <span className="front-page-visual__btn-text o-btn-bg__text o-btn-bg__text--red">
                    {copy.btnConsultLines.map((line, index) => (
                      <span key={`${line}-${index}`}>
                        {index > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </span>
                </SiteLink>
              </div>
            </div>
            <div className="front-page-visual__picture-area front-page-visual__picture-area--jobshare-hero js-visual-picture-area">
              <picture className="front-page-visual__picture">
                <img
                  className="front-page-visual__picture-body"
                  src={heroVisualImage}
                  alt={copy.heroAlt}
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
      <div className="front-page-visual__lower">
        <div className="front-page-visual__contents">
          <div className="front-page-visual__badge-group">
            <img src={badgeImage} alt={copy.badgeAlt} />
          </div>
          <ol className="front-page-visual__caption-list">
            <li className="front-page-visual__caption">{copy.caption}</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
