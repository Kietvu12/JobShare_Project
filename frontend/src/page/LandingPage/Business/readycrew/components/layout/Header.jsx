import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../../../context/LanguageContext'
import { getLandingHeaderCopy } from '../../../../../../i18n/businessApp/landingHeader'
import { getLocaleFromPathname } from '../../../../../../utils/localeRoutes'
import { ensureSiteScripts } from '../../lib/siteHtml'
import CommonNavPanel from './CommonNavPanel'
import BusinessLandingLanguageSwitcher from './BusinessLandingLanguageSwitcher'
import { COMPANY_INFO } from './data/navData'
import BrandLogo from './BrandLogo'
import { useHeaderPastVisual } from './hooks/useHeaderPastVisual'
import { PhoneIcon } from './icons'
import SiteLink from './SiteLink'

function HeaderNavButtonLabel({ lines, className }) {
  const safeLines = lines?.filter(Boolean)?.length ? lines.filter(Boolean) : ['']

  if (safeLines.length === 1) {
    return <span className={className}>{safeLines[0]}</span>
  }

  return (
    <span className={className}>
      {safeLines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </span>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const { language, syncFromUrl } = useLanguage()
  const copy = getLandingHeaderCopy(language)
  const pastVisual = useHeaderPastVisual(pathname)
  const localeFromUrl = getLocaleFromPathname(pathname)

  useEffect(() => {
    if (localeFromUrl) syncFromUrl(localeFromUrl)
  }, [localeFromUrl, syncFromUrl])

  useEffect(() => {
    ensureSiteScripts()
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])

  return (
    <header className={`header header--lang-${language}${pastVisual ? ' header--past-visual' : ''}`}>
      <div className="header-sub js-loading-hide">
        <div className="header-sub__contents">
          <a href={`tel:${COMPANY_INFO.tel}`} className="header-sub__tel">
            <span className="header-sub__tel-icon">
              <PhoneIcon className="header-sub__tel-icon-body" />
            </span>
            <span className="header-sub__tel-text">{COMPANY_INFO.tel}</span>
          </a>
          <BusinessLandingLanguageSwitcher />
        </div>
      </div>

      <div className="header-main js-gnav js-hamburger-menu__wrapper">
        <div
          className={`header-main__contents js-gnav-container js-hamburger-menu__container${pastVisual ? ' header-main__contents--past-visual' : ''}`}
        >
          <div className="header-main__wrapper">
            <div className="header-main__site-name">
              <h1 className="header-main__logo">
                <SiteLink to="/" className="header-main__logo-anchor">
                  <BrandLogo className="header-main__logo-body" />
                </SiteLink>
              </h1>
            </div>

            <a className="header-main-hamburger js-hamburger-menu" href="#" onClick={(e) => e.preventDefault()}>
              <div className="header-main-hamburger__icon js-hamburger-menu__icon" />
              <p className="header-main-hamburger__text js-hamburger-menu__text">{copy.menu}</p>
            </a>

            <nav className="header-nav">
              <ol className="header-nav__list">
                {copy.navLinks.map((item) => (
                  <li key={item.path} className="header-nav__item">
                    <SiteLink to={item.path} className="header-nav__anchor">
                      {item.label}
                    </SiteLink>
                  </li>
                ))}
              </ol>
              <ol className="header-nav__btn-group">
                <li className="header-nav__btn-item">
                  <SiteLink to="/business/register" className="header-nav__btn o-btn-bg">
                    <HeaderNavButtonLabel lines={copy.registerLines} className="o-btn-bg__text" />
                  </SiteLink>
                </li>
                <li className="header-nav__btn-item">
                  <SiteLink to="/business/login" className="header-nav__btn o-btn-border">
                    <HeaderNavButtonLabel lines={copy.loginLines} className="o-btn-border__text" />
                  </SiteLink>
                </li>
              </ol>
            </nav>
          </div>

          <nav className="header-sp-nav js-hamburger-menu__nav">
            <div className="header-sp-nav__wrapper js-hamburger-menu__nav-wrapper">
              <CommonNavPanel variant="mobile" />
            </div>
          </nav>
        </div>
      </div>

      <div className="js-hamburger-menu__bg" />
    </header>
  )
}
