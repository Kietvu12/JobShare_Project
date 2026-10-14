import MangaFooterTop from './components/MangaFooterTop'
import MangaMainSection from './components/MangaMainSection'
import MangaVisual from './components/MangaVisual'
import { useMangaPage } from './hooks/useMangaPage'

export default function MangaPage() {
  useMangaPage()

  return (
    <article>
      <div className="page-manga">
        <MangaVisual />
        <MangaMainSection />
      </div>
      <MangaFooterTop />
    </article>
  )
}
