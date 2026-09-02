import BrandLogo from './BrandLogo'
import { COMPANY_INFO, FOOTER_SITEMAP_LINKS, LEGAL_LINKS, MOBILE_SITEMAP_LINKS, SOCIAL_LINKS } from './data/navData'
import { ArrowIcon, FacebookIcon, InstagramIcon, NoteIcon, PhoneIcon, TwitterIcon } from './icons'
import SiteLink from './SiteLink'

function SitemapList({ items, listClass }) {
  return (
    <ol className={listClass}>
      {items.map((item) => (
        <li key={item.path + item.en} className="common-nav-sitemap__item">
          <SiteLink to={item.path} className="common-nav-sitemap__anchor">
            <span className="common-nav-sitemap__jp">
              {item.jp}
              {item.sub ? (
                <>
                  {'\u2002'}
                  <br className="n-br" />
                  <small>{item.sub}</small>
                </>
              ) : null}
            </span>
            <span className="common-nav-sitemap__en">{item.en}</span>
          </SiteLink>
        </li>
      ))}
    </ol>
  )
}

function CommonNavInfo() {
  return (
    <div className="common-nav-info">
      <p className="common-nav-info__logo">
        <BrandLogo className="common-nav-info__logo-body" />
      </p>
      <dl className="common-nav-info__detail">
        <dt className="common-nav-info__corp">
          <span className="common-nav-info__corp--small">運営会社</span>
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
            <span className="o-anchor-text__text">Corporate Site</span>
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
            <span className="o-anchor-text__text">Recruiting Site</span>
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

function CommonNavContact() {
  return (
    <div className="common-nav__contact">
      <div className="common-nav__btn-group">
        <SiteLink to="/inquiry_docs_rc/" className="common-nav__contact-btn o-btn-bg m-element-side-space">
          <span className="common-nav__btn-text o-btn-bg__text">資料ダウンロード</span>
        </SiteLink>
        <SiteLink to="/contact_rc/" className="common-nav__contact-btn o-btn-border m-element-side-space">
          <span className="common-nav__btn-text o-btn-border__text">お問い合わせ</span>
        </SiteLink>
      </div>
      <a className="common-nav__tel" href={`tel:${COMPANY_INFO.tel}`}>
        <span className="common-nav__tel-icon">
          <PhoneIcon className="common-nav__tel-icon-body" />
        </span>
        <span className="common-nav__tel-text">{COMPANY_INFO.tel}</span>
        <span className="common-nav__time">{COMPANY_INFO.hours}</span>
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
  const sitemapLinks = variant === 'mobile' ? MOBILE_SITEMAP_LINKS : FOOTER_SITEMAP_LINKS
  const listClass = variant === 'mobile' ? 'common-nav-sitemap__list-ham' : 'common-nav-sitemap__list'

  return (
    <>
      <div className="common-nav-row">
        <div className="common-nav-sitemap">
          <SitemapList items={sitemapLinks} listClass={listClass} />
        </div>
        <CommonNavInfo />
        <CommonNavLower />
        <CommonNavContact />
      </div>
      <CommonNavSns />
      <p className="common-nav-copyright">© FRONTIER Co. Ltd. All Rights Reserved.</p>
    </>
  )
}
