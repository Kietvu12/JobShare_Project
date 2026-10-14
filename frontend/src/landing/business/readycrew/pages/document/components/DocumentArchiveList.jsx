import { DOCUMENT_NEXT_PAGE, DOCUMENTS } from '../data/documents'
import DocumentArchiveItem from './DocumentArchiveItem'

export default function DocumentArchiveList() {
  return (
    <>
      <ul className="page-document-archive__list">
        {DOCUMENTS.map((item) => (
          <DocumentArchiveItem key={item.href} item={item} />
        ))}
      </ul>

      <span className="next_posts_link">
        <a href={DOCUMENT_NEXT_PAGE}>次ページへ »</a>
      </span>

      <div className="c-infinite">
        <div className="scroller-status">
          <div className="infinite-scroll-request">
            <img src="/landing/business/assets/images/common/loading-circle.png" alt="" />
          </div>
          <p className="infinite-scroll-error">読み込むページがありません</p>
        </div>
      </div>
    </>
  )
}
