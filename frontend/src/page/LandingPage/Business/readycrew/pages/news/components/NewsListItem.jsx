
export default function NewsListItem({ item }) {
  return (
    <div className="page-news-list__item u-hover-wrapper">
      <a className="page-news-list__anchor" href={item.href}>
        <p className="page-news-list__date">{item.date}</p>
        <p className="page-news-list__category">{item.category}</p>
        <p className="page-news-list__title u-inner-hover-text-red">
          <span className="u-inner-hover-red-line">{item.title}</span>
        </p>
      </a>
    </div>
  )
}
