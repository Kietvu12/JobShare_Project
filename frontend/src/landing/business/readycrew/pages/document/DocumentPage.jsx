import DocumentArchiveList from './components/DocumentArchiveList'
import DocumentFooterTop from './components/DocumentFooterTop'
import DocumentTags from './components/DocumentTags'
import DocumentVisual from './components/DocumentVisual'
import { useDocumentPage } from './hooks/useDocumentPage'

export default function DocumentPage() {
  useDocumentPage()

  return (
    <article>
      <div className="page-document">
        <DocumentVisual />
        <div className="page-document-container">
          <div className="l-contents--xlarge">
            <div className="page-document-main">
              <DocumentTags />
              <DocumentArchiveList />
              <DocumentTags />
            </div>
          </div>
        </div>
      </div>
      <DocumentFooterTop />
    </article>
  )
}
