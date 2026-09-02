import { CorporationLogos } from '../data/corporation-logos'

export default function HomeCorporation() {
  return (
    <section className="front-page-corporation l-section--small">
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
          <h2 className="front-page-corporation__main-text">
            機械・電気電子・IT・建築など、
            <br className="u-br-sp" />
            幅広い分野の外国人高度人材に対応。
            <br />
            企業ごとの採用ニーズに合った
            <br className="u-br-sp" />
            人材をご提案します。
          </h2>
        </div>
      </div>
    </section>
  )
}
