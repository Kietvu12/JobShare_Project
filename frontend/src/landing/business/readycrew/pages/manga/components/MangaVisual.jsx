export default function MangaVisual() {
  return (
    <div className="page-manga-visual l-article-mv">
      <div className="page-manga-visual__contents l-article-mv__contents">
        <h1 className="page-manga-visual__page-title l-article-mv__title">
          <span className="page-manga-visual__page-title-jp l-article-mv__title-jp">マンガで知るReady Crew</span>
        </h1>
        <picture className="page-manga-visual__picture l-article-mv__picture">
          <source media="(max-width: 767px)" srcSet="/landing/business/assets/images/pages/page-manga-visual-sp.png" />
          <img
            className="page-manga-visual__picture-body l-article-mv__picture-body"
            src="/landing/business/assets/images/pages/page-manga-visual.png"
            alt=""
          />
        </picture>
        <div className="page-manga-visual__catch-block l-article-mv__catch-block">
          <h2 className="page-manga-visual__catch l-article-mv__catch">
            Ready Crewの
            <br />
            サービスのご利用例を
            <br />
            マンガでお伝えします。
          </h2>
        </div>
      </div>
    </div>
  )
}
