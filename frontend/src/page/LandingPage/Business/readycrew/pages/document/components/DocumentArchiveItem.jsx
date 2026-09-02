
export default function DocumentArchiveItem({ item }) {
  return (
    <li className="page-document-archive__item">
      <a href={item.href} className="link">
        {item.isNew && (
          <p className="new-icon">
            <span>New</span>
          </p>
        )}
        <figure className="image">
          <img src={item.image} alt="" />
        </figure>
      </a>
      <h3 className="page-document-archive__title">{item.title}</h3>
      <div className="page-document-archive__tag">
        <a href={item.tag.href}>
          <span className="c-tag">{item.tag.label}</span>
        </a>
      </div>
      <p className="page-document-archive__main-text" dangerouslySetInnerHTML={{ __html: item.description }} />
      <div className="page-document-archive__button">
        <a href={item.href} className="link-button">
          ダウンロードはこちら
        </a>
      </div>
    </li>
  )
}
