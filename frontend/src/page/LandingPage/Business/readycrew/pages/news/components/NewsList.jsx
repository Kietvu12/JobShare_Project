import { getHomeNewsCopy } from '../../../../../../../i18n/businessApp/homeNews'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import NewsListItem from './NewsListItem'
import NewsPagination from './NewsPagination'

export default function NewsList({ posts, loading, page, setPage, pagination }) {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)

  return (
    <>
      <div className="page-news-list__body">
        {loading ? (
          [0, 1, 2, 3, 4].map((k) => (
            <div key={`news-row-skel-${k}`} className="page-news-list__item" aria-hidden>
              <div className="page-news-list__anchor">
                <p className="page-news-list__date">&nbsp;</p>
                <p className="page-news-list__category">&nbsp;</p>
                <p className="page-news-list__title">&nbsp;</p>
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <p className="page-news-list__empty">{copy.empty}</p>
        ) : (
          posts.map((post) => <NewsListItem key={post.id} post={post} />)
        )}
      </div>
      {!loading && posts.length > 0 ? (
        <NewsPagination page={page} setPage={setPage} pagination={pagination} />
      ) : null}
    </>
  )
}
