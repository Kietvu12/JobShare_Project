import { Link } from 'react-router-dom'
import { PhoneIcon } from '../../price/components/icons'
import { MANGA_INTRO, MANGA_PANELS } from '../data/mangaContent'

export default function MangaMainSection() {
  const introLines = MANGA_INTRO.split('\n')

  return (
    <section className="page-manga-main l-section">
      <div className="page-manga-main__contents l-wrapper--on-bg">
        <header className="page-manga-main__header">
          <h3 className="page-manga-main__main-text">
            <img
              className="page-manga-main__main-text-body"
              src="/landing/business/assets/images/pages/page-manga-main-text.svg"
              alt="マンガで知るReady Crew"
              loading="lazy"
            />
          </h3>
          <p className="page-manga-main__sub-text">
            {introLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < introLines.length - 1 && <br />}
              </span>
            ))}
          </p>
          <div className="page-manga-main__boundary">
            <div className="page-manga-main__boundary-item" />
            <div className="page-manga-main__boundary-item" />
            <div className="page-manga-main__boundary-item" />
          </div>
        </header>

        <div className="page-manga-main__body">
          <div className="page-manga-main__images">
            {MANGA_PANELS.map((panel) => (
              <img key={panel.src} className="page-manga-main__corp-body" src={panel.src} alt={panel.alt} loading="lazy" />
            ))}
          </div>

          <div className="page-manga-fin">
            <div className="page-manga-fin-contact">
              <Link to="/contact_rc" className="o-btn-bg o-btn-bg--white page-manga-fin-contact__btn">
                <span className="o-btn-bg__text">お問い合わせ</span>
              </Link>
              <a className="m-contact__info m-contact__info--center page-manga-fin-contact__info" href="tel:080-9441-1975">
                <div className="m-contact__tel">
                  <p className="m-contact__icon--white">
                    <PhoneIcon />
                  </p>
                  <p className="m-contact__tel-text--white">080-9441-1975</p>
                </div>
                <p className="m-contact__time--white">10:00 〜 18:00 (平日)</p>
              </a>
            </div>
            <picture className="page-manga-fin__picture">
              <source media="(max-width: 767px)" srcSet="/landing/business/assets/images/pages/page-manga-fin-img-sp.png" />
              <img className="page-manga-fin__picture-body" src="/landing/business/assets/images/pages/page-manga-fin-img.png" alt="" />
            </picture>
          </div>
        </div>
      </div>
    </section>
  )
}
