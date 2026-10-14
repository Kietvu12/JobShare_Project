export default function PriceVisual() {
  return (
    <div className="page-price-visual l-article-mv">
      <div className="page-price-visual__contents l-article-mv__contents">
        <h1 className="page-price-visual__page-title l-article-mv__title">
          <span className="page-price-visual__page-title-jp l-article-mv__title-jp">
            JobShare Businessとは
          </span>
        </h1>
        <picture className="page-price-visual__picture l-article-mv__picture">
          <source media="(max-width:767px)" srcSet="/landing/business/assets/images/pages/page-price-visual-sp.png" />
          <img
            className="page-price-visual__picture-body l-article-mv__picture-body"
            src="/landing/business/assets/images/pages/page-price-visual.png"
            alt=""
          />
        </picture>
        <div className="page-price-visual__catch-block l-article-mv__catch-block">
          <p className="page-price-visual__catch--small l-article-mv__catch-small">
            専任スタッフが採用課題に合わせて最適な方法をご提案します。
          </p>
          <h2 className="page-price-visual__catch l-article-mv__catch">
            JobShare Businessは、
            <br />
            外国人高度人材の採用を支援する
            <br />
            企業向け採用プラットフォームです！
          </h2>
          <p className="page-price-visual__catch--small l-article-mv__catch-xs">
            企業登録・求人作成などの基本機能は無料。必要なサービスだけを選択してご利用いただけます。
          </p>
        </div>
      </div>
    </div>
  )
}
