export default function NewsVisual() {
  return (
    <div className="page-news-visual l-article-mv-plus-lower">
      <div className="page-news-visual__contents l-article-mv__contents">
        <h1 className="page-news-visual__page-title l-article-mv__title">
          <span className="page-news-visual__page-title-jp l-article-mv__title-jp">お知らせ</span>
        </h1>
        <div className="page-news-visual__images">
          <div className="page-news-visual__logo">
            <img className="page-news-visual__logo-body" src="/landing/business/assets/images/common/common-main-text.svg" alt="Ready Crew" />
          </div>
          <div className="page-news-visual__picture">
            <img className="page-news-visual__picture-body" src="/landing/business/assets/images/pages/page-news-visual.png" alt="" />
          </div>
          <div className="page-news-visual__caption">
            <p className="page-news-visual__caption-sub-text">Ready Crew(レディクル)公式アンバサダー</p>
            <p className="page-news-visual__caption-main-text">広瀬アリス</p>
          </div>
        </div>
      </div>
      <div className="page-news-visual-marquee">
        <div className="page-news-visual-marquee__body js-logo-marquee">
          <p className="page-news-visual-marquee__text">
            <span className="page-news-visual-marquee__text-en">ReadyCrew</span>
            <span className="page-news-visual-marquee__text-en">ReadyCrew</span>
          </p>
        </div>
      </div>
    </div>
  )
}
