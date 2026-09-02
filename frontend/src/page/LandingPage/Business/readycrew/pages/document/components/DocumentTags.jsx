import { DOCUMENT_TAGS } from '../data/documentTags'

export default function DocumentTags() {
  return (
    <div className="p-document-tags">
      <div className="l-inner">
        <div className="p-document-tags__content">
          <ul className="p-document-tags__list">
            {DOCUMENT_TAGS.map((tag) => (
              <li key={tag.href} className="p-document-tags__item">
                <a className={`p-document-tags__link${tag.active ? ' is-active' : ''}`} href={tag.href}>
                  {tag.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
