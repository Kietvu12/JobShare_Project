export default function DocumentVisual() {
  return (
    <div className="page-document-visual l-article-mv">
      <div className="page-document-visual__contents l-article-mv__contents">
        <h1 className="page-document-visual__page-title l-article-mv__title">
          <span className="page-document-visual__page-title-jp l-article-mv__title-jp">お役立ち資料</span>
        </h1>
        <picture className="page-document-visual__picture l-article-mv__picture">
          <img
            className="page-document-visual__picture-body l-article-mv__picture-body"
            src="/landing/business/assets/images/pages/page-document-visual.png"
            alt=""
          />
        </picture>
        <div className="page-document-visual__catch-block l-article-mv__catch-block">
          <h2 className="page-document-visual__catch l-article-mv__catch">
            ReadyCrew（レディクル）だからこそ
            <br />
            持っている情報をご用意
            <br />
            各フォームからいつでもダウンロードができます。
          </h2>
        </div>
      </div>
    </div>
  )
}
