import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { useBusinessLandingBase } from '../../../../BusinessLandingContext'
import { toBusinessLandingPath } from '../../../../businessLandingBase'
import { getHomeNewsCopy } from '../../../../../../../i18n/businessApp/homeNews'
import {
  formatPublicPostDate,
  getPostDetailHref,
  pickPublicPostCategoryLabel,
  pickPublicPostTitle,
} from '../../../../../../../utils/publicPostDisplay'

function formatNewsDateDot(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function NewsListItem({ post }) {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)
  const basePath = useBusinessLandingBase()

  const published = post.publishedAt || post.published_at || post.createdAt || post.created_at
  const dateLabel =
    language === 'ja' ? formatNewsDateDot(published) : formatPublicPostDate(published, language)
  const title = pickPublicPostTitle(post, language)
  const category = pickPublicPostCategoryLabel(post, language, copy.categoryFallback)
  const detailPath = toBusinessLandingPath(getPostDetailHref(post, ''), basePath)

  return (
    <div className="page-news-list__item u-hover-wrapper">
      <Link className="page-news-list__anchor" to={detailPath}>
        <p className="page-news-list__date">{dateLabel}</p>
        <p className="page-news-list__category">{category}</p>
        <p className="page-news-list__title u-inner-hover-text-red">
          <span className="u-inner-hover-red-line">{title}</span>
        </p>
      </Link>
    </div>
  )
}
