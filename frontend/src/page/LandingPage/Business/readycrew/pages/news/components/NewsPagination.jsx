import { getHomeNewsCopy } from '../../../../../../../i18n/businessApp/homeNews'
import { useLanguage } from '../../../../../../../context/LanguageContext'

export default function NewsPagination({ page, setPage, pagination }) {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)
  const { pages, hasNext, nextPage } = pagination || { pages: [], hasNext: false, nextPage: null }

  if (!pages.length) return null

  const goToPage = (next) => {
    setPage(next)
    window.scrollTo(0, 0)
  }

  return (
    <div className="page-news-pagination m-pagination-wrapper">
      <div className="page-news-pagination__contents m-pagination">
        <nav className="navigation pagination" aria-label={copy.paginationAria}>
          <h2 className="screen-reader-text">{copy.paginationScreenReader}</h2>
          <div className="nav-links">
            <ul className="page-numbers">
              {pages.map((item, index) => {
                if (item.type === 'dots') {
                  return (
                    <li key={`dots-${index}`}>
                      <span className="page-numbers dots">…</span>
                    </li>
                  )
                }
                if (item.current) {
                  return (
                    <li key={`page-${item.page}`}>
                      <span aria-current="page" className="page-numbers current">
                        {item.page}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={`page-${item.page}`}>
                    <button type="button" className="page-numbers" onClick={() => goToPage(item.page)}>
                      {item.page}
                    </button>
                  </li>
                )
              })}
              {hasNext && nextPage ? (
                <li>
                  <button
                    type="button"
                    className="next page-numbers"
                    aria-label={`Page ${nextPage}`}
                    onClick={() => goToPage(nextPage)}
                  />
                </li>
              ) : null}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}
