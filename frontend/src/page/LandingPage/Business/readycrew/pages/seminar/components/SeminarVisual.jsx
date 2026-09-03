import BrandLogo from '../../../components/layout/BrandLogo'
import seminarModelImage from '../../../../../../../../middle_model_icon.png'

const MARQUEE_TEXT = 'JobShare for Business'
const MARQUEE_ITEMS = Array.from({ length: 4 }, (_, index) => `${MARQUEE_TEXT}-${index}`)

export default function SeminarVisual() {
  return (
    <div className="page-news-visual l-article-mv-plus-lower seminar-visual">
      <div className="page-news-visual__contents l-article-mv__contents">
        <h1 className="page-news-visual__page-title l-article-mv__title">
          <span className="page-news-visual__page-title-jp l-article-mv__title-jp">セミナー・イベント</span>
        </h1>
        <div className="page-news-visual__images">
          <div className="page-news-visual__logo">
            <BrandLogo className="page-news-visual__logo-body seminar-visual__brand" />
          </div>
          <div className="page-news-visual__picture">
            <img
              className="page-news-visual__picture-body seminar-visual__picture-body"
              src={seminarModelImage}
              alt="JobShare Business 採用支援"
            />
          </div>
          <div className="page-news-visual__caption">
            <p className="page-news-visual__caption-sub-text">外国人高度人材採用プラットフォーム</p>
            <p className="page-news-visual__caption-main-text">JobShare Business</p>
          </div>
        </div>
      </div>
      <div className="page-news-visual-marquee seminar-visual-marquee" aria-hidden="true">
        <div className="seminar-visual-marquee__track">
          {MARQUEE_ITEMS.map((key) => (
            <span key={key} className="page-news-visual-marquee__text-en">
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
