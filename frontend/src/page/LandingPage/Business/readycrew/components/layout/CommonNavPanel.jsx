import { useLanguage } from '../../../../../../context/LanguageContext'
import { getLandingHeaderCopy } from '../../../../../../i18n/businessApp/landingHeader'
import BrandLogo from './BrandLogo'
import { COMPANY_INFO, LEGAL_LINKS, SOCIAL_LINKS } from './data/navData'
import { ArrowIcon, FacebookIcon, InstagramIcon, NoteIcon, PhoneIcon, TwitterIcon } from './icons'
import SiteLink from './SiteLink'

function SitemapList({ items, listClass }) {
  return (
    <ol className={listClass}>
      {items.map((item) => (
        <li key={item.path} className="common-nav-sitemap__item">
          <SiteLink to={item.path} className="common-nav-sitemap__anchor">
            <span className="common-nav-sitemap__jp">{item.label}</span>
          </SiteLink>
        </li>
      ))}
    </ol>
  )
}

function CommonNavInfo({ copy }) {
  return (
    <div className="common-nav-info">
      <p className="common-nav-info__logo">
        <BrandLogo className="common-nav-info__logo-body" />
      </p>
      <dl className="common-nav-info__detail">
        <dt className="common-nav-info__corp">
          <span className="common-nav-info__corp--small">{copy.operatorLabel}</span>
          <br />
          <strong className="common-nav-info__corp--bold">{COMPANY_INFO.name}</strong>
        </dt>
        <dd className="common-nav-info__desc">
          {COMPANY_INFO.address.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </dd>
      </dl>
      <ol className="common-nav-info__list">
        <li className="common-nav-info__item">
          <a
            href="https://frontier-gr.jp/"
            className="common-nav-info__anchor o-anchor-text u-font-en--bold o-anchor-text--sp-large"
            target="_blank"
            rel="noreferrer"
          >
            <span className="o-anchor-text__icon">
              <ArrowIcon />
            </span>
            <span className="o-anchor-text__text">{copy.corporateSite}</span>
          </a>
        </li>
        <li className="common-nav-info__item">
          <a
            href="https://recruit.frontier-gr.jp/"
            className="common-nav-info__anchor o-anchor-text u-font-en--bold o-anchor-text--sp-large"
            target="_blank"
            rel="noreferrer"
          >
            <span className="o-anchor-text__icon">
              <ArrowIcon />
            </span>
            <span className="o-anchor-text__text">{copy.recruitingSite}</span>
          </a>
        </li>
      </ol>
    </div>
  )
}

function CommonNavLower() {
  return (
    <div className="common-nav-lower">
      {/* <p className="common-nav-lower__catch">
        <img
          src="/landing/business/assets/images/common/common-nav-lower-catch.svg"
          alt="合う会社と、会う"
          className="common-nav-lower__catch-body"
        />
      </p> */}
      <ol className="common-nav-lower__list">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href} className="common-nav-lower__item">
            <SiteLink
              to={link.href}
              className="common-nav-lower__anchor u-hover-text-red"
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
            >
              {link.label}
            </SiteLink>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CommonNavContact({ copy }) {
  return (
    <div className="common-nav__contact">
      <div className="common-nav__btn-group">
        <SiteLink to="/inquiry_docs_rc/" className="common-nav__contact-btn o-btn-bg m-element-side-space">
          <span className="common-nav__btn-text o-btn-bg__text">{copy.downloadMaterials}</span>
        </SiteLink>
        <SiteLink to="/contact_rc/" className="common-nav__contact-btn o-btn-border m-element-side-space">
          <span className="common-nav__btn-text o-btn-border__text">{copy.contact}</span>
        </SiteLink>
      </div>
      <a className="common-nav__tel" href={`tel:${COMPANY_INFO.tel}`}>
        <span className="common-nav__tel-icon">
          <PhoneIcon className="common-nav__tel-icon-body" />
        </span>
        <span className="common-nav__tel-text">{COMPANY_INFO.tel}</span>
        <span className="common-nav__time">{copy.businessHours}</span>
      </a>
    </div>
  )
}

function CommonNavSns() {
  const icons = [FacebookIcon, TwitterIcon, InstagramIcon, NoteIcon]

  return (
    <ol className="common-nav-sns">
      {SOCIAL_LINKS.map((link, index) => {
        const Icon = icons[index]
        return (
          <li key={link.href} className="common-nav-sns__item">
            <a href={link.href} className="common-nav-sns__anchor" target="_blank" rel="noreferrer" aria-label={link.label}>
              <Icon />
            </a>
          </li>
        )
      })}
    </ol>
  )
}

export default function CommonNavPanel({ variant }) {
  const { language } = useLanguage()
  const copy = getLandingHeaderCopy(language)
  const listClass = variant === 'mobile' ? 'common-nav-sitemap__list-ham' : 'common-nav-sitemap__list'

  return (
    <>
      <div className="common-nav-row">
        <div className="common-nav-sitemap">
          <SitemapList items={copy.navLinks} listClass={listClass} />
        </div>
        <CommonNavInfo copy={copy} />
        <CommonNavLower />
        <CommonNavContact copy={copy} />
      </div>
      <CommonNavSns />
      <p className="common-nav-copyright">{copy.copyright}</p>
    </>
  )
}
