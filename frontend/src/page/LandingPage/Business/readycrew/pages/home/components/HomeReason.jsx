import SiteLink from '../../../components/layout/SiteLink'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeReasonCopy, getReasonItems } from '../../../../../../../i18n/businessApp/homeReason'

const JA_SUBJECT_STYLE = {
  fontSize: 'clamp(18px, 2.4vw, 26px)',
}

function ReasonSubject({ lines, isJapanese }) {
  return (
    <h3
      className={`front-page-reason__subject${isJapanese ? '' : ' front-page-reason__subject--i18n'}`}
      style={isJapanese ? JA_SUBJECT_STYLE : undefined}
    >
      {lines.map((line, index) => (
        <span key={`${line.text}-${index}`}>
          {line.highlight ? <span className="c-text-red-4">{line.text}</span> : line.text}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </h3>
  )
}

export default function HomeReason() {
  const { language } = useLanguage()
  const copy = getHomeReasonCopy(language)
  const items = getReasonItems(language)
  const isJapanese = language === 'ja'

  return (
    <>
      <div className="js-scroll-target js-scroll-target--more" id="reason" />
      <section className={`front-page-reason l-section${isJapanese ? '' : ` front-page-reason--${language}`}`}>
        <div className="front-page-reason__contents l-contents">
          <header className="front-page-reason__header m-section-header">
            <h2
              className={`front-page-reason__main-text o-section-heading${isJapanese ? '' : ' front-page-reason__main-text--i18n'}`}
            >
              {copy.titlePrefix}
              <span className="c-text-red-4">{copy.titleHighlight}</span>
            </h2>
          </header>
          <div className="front-page-reason__body">
            {items.map((item) => (
              <div key={item.num} className="front-page-reason__item">
                {item.num === '01' ? <a id="price" className="o-anchor-target js-anchor-target" /> : null}
                <p className="front-page-reason__num">{item.num}</p>
                <div
                  className={`front-page-reason__text-area${item.num !== '03' ? ' u-border-bottom-absolute' : ''}`}
                >
                  <ReasonSubject lines={item.subjectLines} isJapanese={isJapanese} />
                  <p className={`front-page-reason__desc${isJapanese ? '' : ' front-page-reason__desc--i18n'}`}>
                    {item.desc}
                  </p>
                  <div className="front-page-reason__btn">
                    {item.buttons.map((button) => (
                      <SiteLink
                        key={button.className}
                        className={`${button.className} front-page-reason__contact-subject o-btn-bg o-btn-bg--red`}
                        to={button.href}
                      >
                        <p
                          className={`front-page-reason__contact-subject-text o-btn-bg__text${isJapanese ? '' : ' front-page-reason__contact-subject-text--i18n'}`}
                        >
                          {button.label}
                        </p>
                      </SiteLink>
                    ))}
                  </div>
                </div>
                <div className="front-page-reason__picture">
                  <img src={item.image} loading="lazy" alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
