import { useLanguage } from '../../../../../../../context/LanguageContext'
import { getHomeNewsCopy } from '../../../../../../../i18n/businessApp/homeNews'
import { pickPublicPostCategoryLabel } from '../../../../../../../utils/publicPostDisplay'

function categoryTabLabel(category, language, fallback) {
  if (!category) return fallback
  return pickPublicPostCategoryLabel({ category }, language, category.name || fallback)
}

export default function NewsTabs({ categories, categoryId, onSelectCategory }) {
  const { language } = useLanguage()
  const copy = getHomeNewsCopy(language)
  const isAll = !categoryId

  return (
    <div className="page-news-tab">
      <ol className="page-news-tab__list">
        <li className="page-news-tab__category">
          <button
            type="button"
            className={`page-news-tab__all${isAll ? ' page-news-tab__all--current' : ''}`}
            onClick={() => onSelectCategory('')}
          >
            {copy.tabAll}
          </button>
        </li>
        {categories.map((cat) => {
          const id = String(cat.id ?? '')
          const active = categoryId === id
          const label = categoryTabLabel(cat, language, copy.categoryFallback)
          return (
            <li key={id || label} className="page-news-tab__category">
              <button
                type="button"
                className={`page-news-tab__anchor${active ? ' page-news-tab__anchor--current' : ''}`}
                onClick={() => onSelectCategory(id)}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
