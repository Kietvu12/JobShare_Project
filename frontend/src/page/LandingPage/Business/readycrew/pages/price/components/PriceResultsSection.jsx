import { COMPANY_LOGOS, INDUSTRIES } from '../data/companyLogos'

export default function PriceResultsSection() {
  return (
    <section className="page-price-results l-section">
      <div className="page-price-results l-wrapper--on-bg">
        <h2 className="page-price-results_txt">
          外国人高度人材採用の
          <br />
          実績とノウハウを
          <br />
          蓄積してきました。
        </h2>
        <div className="media-box -num_1">
          <div
            className="media-box__content aos-init aos-animate"
            data-aos="fade-up"
            data-aos-once="true"
            data-aos-delay="200"
          >
            <h3 className="media-box__tit">導入企業</h3>
            <p className="media-box__catch">
              幅広い業種・分野の
              <br />
              企業に
              <strong className="lead__sn">ご利用</strong>
              いただいています
            </p>
            <div className="flex">
              <p className="media-box__lead">
                機械・電気電子・IT・建築など、多様な分野の外国人高度人材採用に対応。
                <br className="pc" />
                企業ごとの採用ニーズに合った人材をご提案します。
                <br className="pc" />
                JobShare Businessは、採用課題に合わせた最適な方法を一つのプラットフォームで提供します。
              </p>
              <div className="media-box__content__graph">
                <img
                  src="/landing/business/assets/images/pages/company/perf-graph.png"
                  srcSet="/landing/business/assets/images/pages/company/perf-graph@2x.png 2x"
                  alt="JobShare Business 導入実績グラフ"
                  className="media-box__content__graph__img"
                />
              </div>
            </div>
          </div>
          <div className="media-box__visual aos-init aos-animate" data-aos="fade-up" data-aos-once="true">
            <ul className="company-list">
              {COMPANY_LOGOS.map((src, index) => (
                <li key={src} className="company-list__item--img">
                  <img src={src} alt={`導入企業ロゴ ${index + 1}`} loading="lazy" />
                </li>
              ))}
            </ul>
            <div style={{ background: '#F5F5F5', padding: '2%' }}>
              <center style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>対応分野</center>
              <ul className="company-list_type">
                {INDUSTRIES.map((name) => (
                  <li key={name} className="company-list__item--txt">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
