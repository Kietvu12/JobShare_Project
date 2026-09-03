import NewsFooterTop from './components/NewsFooterTop'
import NewsList from './components/NewsList'
import NewsTabs from './components/NewsTabs'
import NewsVisual from './components/NewsVisual'
import { useNewsPage } from './hooks/useNewsPage'
import './news.css'

export default function NewsPage() {
  useNewsPage()

  return (
    <article>
      <div className="page-news">
        <NewsVisual />
        <section className="page-news-list l-section">
          <div className="page-news-list__wrapper l-wrapper--on-bg-white-sp">
            <div className="page-news-list__contents l-contents--medium l-contents--sp-full">
              <NewsTabs />
              <NewsList />
            </div>
          </div>
        </section>
      </div>
      <NewsFooterTop />
    </article>
  )
}
