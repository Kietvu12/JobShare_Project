import { NEWS_TABS } from '../data/newsTabs'

export default function NewsTabs() {
  return (
    <div className="page-news-tab">
      <ol className="page-news-tab__list">
        {NEWS_TABS.map((tab) => (
          <li key={tab.href} className="page-news-tab__category">
            <a
              className={tab.isAll ? `page-news-tab__all${tab.active ? ' page-news-tab__all--current' : ''}` : 'page-news-tab__anchor'}
              href={tab.href}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
