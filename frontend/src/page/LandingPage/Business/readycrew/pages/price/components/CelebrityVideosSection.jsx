import SiteLink from '../../../components/layout/SiteLink'
import { CELEBRITY_VIDEOS } from '../data/celebrityVideos'

export default function CelebrityVideosSection() {
  return (
    <section id="rcpv-celebrity-videos" className="rcpv-wrap" aria-labelledby="rcpv-heading">
      <header className="rcpv-head">
        <span className="rcpv-eyebrow">JobShare Business Video</span>
        <h2 id="rcpv-heading" className="rcpv-title">
          <span className="c-text-red-4">動画</span>で知るJobShare Business
        </h2>
        <p className="rcpv-lead">
          プラットフォームの機能とサービスの流れを、3分でご確認いただけます。
        </p>
      </header>

      <div className="rcpv-grid" id="rcpv-grid">
        {CELEBRITY_VIDEOS.map((video) => (
          <article key={video.embedUrl} className="rcpv-card">
            <div className="rcpv-media">
              <iframe
                src={video.embedUrl}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="rcpv-body">
              <h3 className="rcpv-h3">{video.title}</h3>
              <p className="rcpv-cap">{video.caption}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="rcpv-cta">
        <SiteLink to="/contact_rc2/">外国人材採用について相談する</SiteLink>
      </div>
    </section>
  )
}
