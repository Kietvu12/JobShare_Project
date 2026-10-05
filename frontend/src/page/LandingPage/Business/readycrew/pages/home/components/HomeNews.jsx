import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiService from '../../../../../../../services/api'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeNewsCopy } from '../../../../../../../i18n/businessApp/homeNews'
import { useBusinessLandingBase } from '../../../../BusinessLandingContext'
import { toBusinessLandingPath } from '../../../../businessLandingBase'
import {
  formatPublicPostDate,
  getPostDetailHref,
  pickPublicPostCategoryLabel,
  pickPublicPostTitle,
} from '../../../../../../../utils/publicPostDisplay'

function BgArrow() {
  return (
    <div className="m-btn-bg-arrow__inner">
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--first" />
      <span className="m-btn-bg-arrow__arrow m-btn-bg-arrow__arrow--second" />
    </div>
  )
}

function formatNewsDateDot(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function HomeNews() {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)
  const basePath = useBusinessLandingBase()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await apiService.getPublicPosts({
          page: 1,
          limit: 5,
          sortBy: 'publishedAt',
          sortOrder: 'DESC',
          surface: 'business',
        })
        const list = res?.data?.posts || []
        if (!cancelled) setPosts(Array.isArray(list) ? list.slice(0, 5) : [])
      } catch {
        if (!cancelled) setPosts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const blogListPath = toBusinessLandingPath('/blog', basePath)

  return (
    <section className="front-page-news l-section">
      <div className="front-page-news__contents l-contents">
        <header className="front-page-news__header m-section-header">
          <h2 className="o-section-heading">{copy.heading}</h2>
        </header>
        <div className="front-page-news__body">
          <div className="front-page-news__list">
            {loading ? (
              [0, 1, 2].map((k) => (
                <div key={`news-skel-${k}`} className="front-page-news__item" aria-hidden>
                  <div className="front-page-news__anchor">
                    <p className="front-page-news__date">&nbsp;</p>
                    <p className="front-page-news__category">&nbsp;</p>
                    <p className="front-page-news__title">&nbsp;</p>
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <p className="front-page-news__empty">{copy.empty}</p>
            ) : (
              posts.map((post) => {
                const published = post.publishedAt || post.published_at || post.createdAt || post.created_at
                const dateIso = published ? new Date(published).toISOString().slice(0, 10) : ''
                const dateLabel =
                  language === 'ja' ? formatNewsDateDot(published) : formatPublicPostDate(published, language)
                const title = pickPublicPostTitle(post, language)
                const category = pickPublicPostCategoryLabel(post, language, copy.categoryFallback)
                const detailPath = toBusinessLandingPath(getPostDetailHref(post, ''), basePath)
                return (
                  <div key={post.id} className="front-page-news__item u-hover-wrapper">
                    <Link className="front-page-news__anchor" to={detailPath}>
                      <p className="front-page-news__date" dateTime={dateIso}>
                        {dateLabel}
                      </p>
                      <p className="front-page-news__category">{category}</p>
                      <p className="front-page-news__title u-inner-hover-text-red">
                        <span className="u-inner-hover-red-line">{title}</span>
                      </p>
                    </Link>
                  </div>
                )
              })
            )}
          </div>
          <Link className="front-page-news__large-btn o-btn-border--gray m-btn-bg-arrow" to={blogListPath}>
            <span className="front-page-news__anchor-text m-btn-bg-arrow__text">{copy.viewAll}</span>
            <BgArrow />
          </Link>
        </div>
      </div>
    </section>
  )
}
