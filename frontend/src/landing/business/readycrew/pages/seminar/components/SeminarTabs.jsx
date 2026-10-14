import { SEMINAR_TABS } from '../data/seminarSections'

export default function SeminarTabs() {
  return (
    <div className="page-seminar-tab">
      <ol className="page-seminar-tab__list">
        {SEMINAR_TABS.map((tab) => (
          <li key={tab.href} className="page-seminar-tab__category">
            <a className="page-seminar-tab__anchor" href={tab.href}>
              {tab.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
