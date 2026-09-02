export default function PriceMechanismSection() {
  return (
    <section className="page-price-intro l-section">
      <div className="page-price-intro__contents l-contents--medium l-contents--sp">
        <div className="page-price-intro__body">
          <div className="page-price-intro__text-area">
            <header className="page-price-intro__header m-contents-header">
              <p className="page-price-intro__sub-text m-contents-header__sub">JobShare Businessの仕組み</p>
              <h2 className="page-price-intro__main-text m-contents-header__main">
                採用課題に合う方法を
                <br />
                <span className="c-text-red-4">無料から始められる</span>仕組み
              </h2>
            </header>
            <p className="page-price-intro__desc o-desc">
              JobShare Businessでは、企業登録・求人作成などの基本機能を無料で提供しています。採用を本格的に進める際は、ご利用いただくサービス（ダイレクトスカウト・採用支援・採用代行など）に応じて料金が発生します。必要なタイミングでサービスを追加・変更できるため、無駄なく採用活動を進められます。
            </p>
          </div>
          <div className="page-price-intro__picture-area">
            <div className="page-price-intro__picture">
              <img src="/landing/business/assets/images/pages/page-price-about-01.png" alt="JobShare Business" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
