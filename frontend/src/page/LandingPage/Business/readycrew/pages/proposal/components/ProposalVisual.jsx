export default function ProposalVisual() {
  return (
    <div className="page-proposal-visual l-article-mv">
      <div className="page-proposal-visual__contents l-article-mv__contents">
        <h1 className="page-proposal-visual__page-title l-article-mv__title">
          <span className="page-proposal-visual__page-title-jp l-article-mv__title-jp">各サービス</span>
        </h1>
        <picture className="page-proposal-visual__picture l-article-mv__picture">
          <source media="(max-width: 767px)" srcSet="/landing/business/assets/images/pages/page-proposal-visual-sp.png" />
          <img
            className="page-proposal-visual__picture-body l-article-mv__picture-body"
            src="/landing/business/assets/images/pages/page-proposal-visual.png"
            alt=""
          />
        </picture>
        <div className="page-proposal-visual__catch-block l-article-mv__catch-block">
          <h2
            className="page-proposal-visual__catch l-article-mv__catch"
            style={{ fontSize: 'clamp(20px, 3vw, 32px)', lineHeight: 1.35 }}
          >
            JobShare Businessが提供する
            <br />
            4つの採用サービス
          </h2>
          <p className="page-proposal-visual__catch--small l-article-mv__catch-xs">
            採用課題と社内体制に合わせて、必要なサービスだけを選択できます。
            <br />
            自社で積極的に採用を進めたい企業から、採用業務をWorkstationに任せたい企業まで柔軟に対応します。
          </p>
        </div>
      </div>
    </div>
  )
}
