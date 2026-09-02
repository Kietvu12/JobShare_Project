import { NEWS_PAGINATION } from '../data/pagination'

export default function NewsPagination() {
  return (
    <div className="page-news-pagination m-pagination-wrapper">
      <div className="page-news-pagination__contents m-pagination">
        <nav className="navigation pagination" aria-label="投稿のページ送り">
          <h2 className="screen-reader-text">投稿のページ送り</h2>
          <div className="nav-links">
            <ul className="page-numbers">
              {NEWS_PAGINATION.pages.map((item, index) => {
                if ('type' in item && item.type === 'dots') {
                  return (
                    <li key={`dots-${index}`}>
                      <span className="page-numbers dots">…</span>
                    </li>
                  )
                }
                if ('current' in item && item.current) {
                  return (
                    <li key={`page-${item.page}`}>
                      <span aria-current="page" className="page-numbers current">
                        {item.page}
                      </span>
                    </li>
                  )
                }
                if ('page' in item && 'href' in item) {
                  return (
                    <li key={`page-${item.page}`}>
                      <a className="page-numbers" href={item.href}>
                        {item.page}
                      </a>
                    </li>
                  )
                }
                return null
              })}
              <li>
                <a className="next page-numbers" href={NEWS_PAGINATION.nextHref} />
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}
