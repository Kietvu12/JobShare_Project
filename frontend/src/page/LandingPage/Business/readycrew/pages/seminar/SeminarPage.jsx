import { SEMINAR_SECTIONS } from './data/seminarSections'
import SeminarFooterTop from './components/SeminarFooterTop'
import { SeminarSectionBlock } from './components/SeminarSection'
import SeminarTabs from './components/SeminarTabs'
import SeminarVisual from './components/SeminarVisual'
import { useSeminarPage } from './hooks/useSeminarPage'
import './seminar.css'

export default function SeminarPage() {
  useSeminarPage()

  return (
    <article>
      <div className="page-news">
        <SeminarVisual />
        <section className="page-news-list l-section">
          <div className="page-news-list__wrapper l-wrapper--on-bg-white-sp">
            <div className="page-news-list__contents l-contents--medium l-contents--sp-full">
              <SeminarTabs />
              <div className="page-seminar-list">
                {SEMINAR_SECTIONS.map((section) => (
                  <SeminarSectionBlock key={section.id} {...section} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <SeminarFooterTop />
    </article>
  )
}
