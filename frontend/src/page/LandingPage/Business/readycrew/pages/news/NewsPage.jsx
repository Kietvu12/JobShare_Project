import { useLanguage } from '../../../../../../context/LanguageContext'
import { getHomeNewsCopy } from '../../../../../../i18n/businessApp/homeNews'
import NewsFooterTop from './components/NewsFooterTop'
import NewsList from './components/NewsList'
import NewsTabs from './components/NewsTabs'
import NewsVisual from './components/NewsVisual'
import { useBusinessLandingNews } from './hooks/useBusinessLandingNews'
import { useNewsPage } from './hooks/useNewsPage'
import './news.css'

export default function NewsPage() {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)
  const news = useBusinessLandingNews()

  useNewsPage(copy.pageTitle)

  return (
    <article>
      <div className="page-news">
        <NewsVisual />
        <section className="page-news-list l-section">
          <div className="page-news-list__wrapper l-wrapper--on-bg-white-sp">
            <div className="page-news-list__contents l-contents--medium l-contents--sp-full">
              <NewsTabs
                categories={news.categories}
                categoryId={news.categoryId}
                onSelectCategory={news.setCategoryId}
              />
              <NewsList
                posts={news.posts}
                loading={news.loading}
                page={news.page}
                setPage={news.setPage}
                pagination={news.pagination}
              />
            </div>
          </div>
        </section>
      </div>
      <NewsFooterTop />
    </article>
  )
}
