export default function PriceAboutSection() {
  return (
    <section className="page-price-intro l-section">
      <div className="page-price-case__wrapper l-wrapper--on-bg">
        <div className="page-price-case__upper">
          <div className="page-price-case__contents l-contents--medium l-contents--sp">
            <div className="page-price-case__body" style={{ flexDirection: 'row-reverse' }}>
              <div className="page-price-case__text-area">
                <header className="page-price-case__header m-contents-header">
                  <p className="page-price-case__sub-text m-contents-header__sub">JobShare Businessとは、つまり。</p>
                  <h2 className="page-price-case__main-text m-contents-header__main">
                    採用課題に合わせて、最適な方法を<span style={{ color: '#0576b6' }}>「選べる」</span>
                    <br />
                    だから、外国人材採用の精度が違う。
                  </h2>
                </header>
                <p className="page-price-case__desc o-desc">
                  JobShare Businessは、外国人エンジニア・高度人材の採用を支援する企業向けプラットフォームです。
                  <br />
                  企業ごとの採用課題や社内体制に合わせて、ダイレクトスカウト・委託スカウト・採用ブランディング・HRパートナーネットワークなど、必要なサービスだけを組み合わせてご利用いただけます。
                  <br />
                  専任スタッフ（Workstation）が導入から採用成功まで伴走し、安心して採用を進められます。
                </p>
              </div>
              <div className="page-price-case__picture-area">
                <img src="/landing/business/assets/images/pages/page-price-about-02.png" alt="JobShare Business" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
