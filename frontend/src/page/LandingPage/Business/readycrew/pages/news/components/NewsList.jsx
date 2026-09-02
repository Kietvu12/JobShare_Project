import { NEWS_ITEMS } from '../data/newsItems'
import NewsListItem from './NewsListItem'
import NewsPagination from './NewsPagination'

export default function NewsList() {
  return (
    <>
      <div className="page-news-list__body">
        {NEWS_ITEMS.map((item) => (
          <NewsListItem key={item.href} item={item} />
        ))}
      </div>
      <NewsPagination />
    </>
  )
}
