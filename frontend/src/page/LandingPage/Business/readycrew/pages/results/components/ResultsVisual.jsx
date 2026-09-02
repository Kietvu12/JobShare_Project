export default function ResultsVisual() {
  return (
    <div className="page-results-visual l-article-mv">
      <div className="page-results-visual__contents l-article-mv__contents">
        <h1 className="page-results-visual__page-title l-article-mv__title">
          <span className="page-results-visual__page-title-jp l-article-mv__title-jp">導入事例</span>
        </h1>
        <picture className="page-results-visual__picture l-article-mv__picture">
          <source media="(max-width: 767px)" srcSet="/landing/business/assets/images/pages/page-results-visual-sp.png" />
          <img
            className="page-results-visual__picture-body l-article-mv__picture-body"
            src="/landing/business/assets/images/pages/page-results-visual.png"
            alt=""
          />
        </picture>
        <div className="page-results-visual__catch-block l-article-mv__catch-block">
          <h2 className="page-results-visual__catch l-article-mv__catch">
            外注先は探すから
            <br />
            見つかる時代へ。
          </h2>
        </div>
      </div>
    </div>
  )
}
