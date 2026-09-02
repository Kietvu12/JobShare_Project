import { useEffect } from 'react'
import { ensureSiteScripts } from '../../lib/siteHtml'
import CommonNavPanel from './CommonNavPanel'
import { COMPANY_INFO, HEADER_NAV_LINKS } from './data/navData'
import BrandLogo from './BrandLogo'
import { PhoneIcon } from './icons'
import SiteLink from './SiteLink'

export default function Header() {
  useEffect(() => {
    ensureSiteScripts()
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded')
      })
      .catch(() => undefined)
  }, [])

  return (
    <header className="header">
      <div className="header-sub js-loading-hide">
        <div className="header-sub__contents">
          <a href={`tel:${COMPANY_INFO.tel}`} className="header-sub__tel">
            <span className="header-sub__tel-icon">
              <PhoneIcon className="header-sub__tel-icon-body" />
            </span>
            <span className="header-sub__tel-text">{COMPANY_INFO.tel}</span>
          </a>
          <p className="header-sub__time">{COMPANY_INFO.hours}</p>
        </div>
      </div>

      <div className="header-main js-gnav js-hamburger-menu__wrapper">
        <div className="header-main__contents js-gnav-container js-hamburger-menu__container">
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
              <p className="header-main-hamburger__text js-hamburger-menu__text">Menu</p>
            </a>

            <nav className="header-nav">
              <ol className="header-nav__list">
                {HEADER_NAV_LINKS.map((item) => (
                  <li key={item.path} className="header-nav__item">
                    <SiteLink to={item.path} className="header-nav__anchor">
                      {item.label}
                    </SiteLink>
                  </li>
                ))}
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
