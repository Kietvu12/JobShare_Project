import HomeAppeal from './components/HomeAppeal'
import HomeCase from './components/HomeCase'
import HomeConversion from './components/HomeConversion'
import HomeCorporation from './components/HomeCorporation'
import HomeFaq from './components/HomeFaq'
import HomeFlow from './components/HomeFlow'
import HomeFooterTop from './components/HomeFooterTop'
import HomeNews from './components/HomeNews'
import HomeProposal from './components/HomeProposal'
import HomeReason from './components/HomeReason'
import HomeVisual from './components/HomeVisual'
import { useHomePage } from './hooks/useHomePage'

export default function HomePage() {
  useHomePage()

  return (
    <article>
      <div className="front-page">
        <HomeVisual />
        <HomeCorporation />
        <HomeAppeal />
        <HomeProposal />
        <HomeReason />
        <div className="js-loading-lazy-contents">
          <HomeConversion />
          {/* <HomeCase /> */}
          <HomeFlow />
          <HomeNews />
          <HomeFaq />
        </div>
      </div>
      <HomeFooterTop />
    </article>
  )
}
