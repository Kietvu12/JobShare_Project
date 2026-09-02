import BrandLogo from '../../../components/layout/BrandLogo'

export default function SeminarVisual() {
  return (
    <div className="page-news-visual l-article-mv-plus-lower">
      <div className="page-news-visual__contents l-article-mv__contents">
        <h1 className="page-news-visual__page-title l-article-mv__title">
          <span className="page-news-visual__page-title-jp l-article-mv__title-jp">セミナー・イベント</span>
        </h1>
        <div className="page-news-visual__images">
          <div className="page-news-visual__logo">
            <BrandLogo className="page-news-visual__logo-body" />
          </div>
          <div className="page-news-visual__picture">
            <img className="page-news-visual__picture-body" src="/landing/business/assets/images/pages/page-news-visual.png" alt="" />
          </div>
          <div className="page-news-visual__caption">
            <p className="page-news-visual__caption-sub-text">外国人高度人材採用プラットフォーム</p>
            <p className="page-news-visual__caption-main-text">JobShare Business</p>
          </div>
        </div>
      </div>
      <div className="page-news-visual-marquee">
        <div className="page-news-visual-marquee__body js-logo-marquee">
          <p className="page-news-visual-marquee__text">
            <span className="page-news-visual-marquee__text-en">JobShare for Business</span>
            <span className="page-news-visual-marquee__text-en">JobShare for Business</span>
          </p>
        </div>
      </div>
    </div>
  )
}
