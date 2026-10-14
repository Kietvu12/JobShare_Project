import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import newsData from '../../templates/JobShare_Collaborator_V3/news.json';
import { useCollaboratorChrome } from '../context/CollaboratorChromeContext';
import {
  COLLABORATOR_HOME_IMAGES,
  COLLABORATOR_PARTNERS,
  collaboratorNewsImage,
} from '../lib/collaboratorAssets';
import {
  IconBuilding,
  IconChart,
  IconSearch,
  IconSpark,
  IconUser,
  IconUsers,
} from '../lib/collaboratorSectionIcons';
import { buildCollaboratorNavLinks } from '../lib/collaboratorNav';
import { useCollaboratorCopy } from '../lib/useCollaboratorCopy';

const PAGE_TITLE = {
  vi: 'Cộng tác viên JobShare | JobShare',
  en: 'JobShare Collaborator | JobShare',
  ja: 'JobShare コラボレーター | JobShare',
};

function formatNewsDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}.${m}.${d}`;
}

function heroLine(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function CollaboratorHomePage() {
  const { pathname } = useLocation();
  const { lang, source, ui } = useCollaboratorCopy();
  const { openContact } = useCollaboratorChrome();
  const links = buildCollaboratorNavLinks(pathname);
  const newsItems = newsData.slice(0, 3);
  const { hero, aiCv, network, support } = COLLABORATOR_HOME_IMAGES;

  const communityCards = [
    { n: '01', Icon: IconSearch, title: source.aboutCard1Title, desc: source.aboutCard1Desc },
    { n: '02', Icon: IconChart, title: source.aboutCard2Title, desc: source.aboutCard2Desc },
    { n: '03', Icon: IconSpark, title: source.aboutCard3Title, desc: source.aboutCard3Desc },
  ];

  const whyRest = [
    { n: '02', Icon: IconUser, title: source.whyCard2Title, desc: source.whyCard2Desc },
    { n: '03', Icon: IconUsers, title: source.whyCard3Title, desc: source.whyCard3Desc },
    { n: '04', Icon: IconBuilding, title: source.whyCard4Title, desc: source.whyCard4Desc },
  ];

  const guideSteps = [
    { n: '01', Icon: IconUser, title: source.guideStep1Title, desc: source.guideStep1Desc },
    { n: '02', Icon: IconSearch, title: source.guideStep2Title, desc: source.guideStep2Desc },
    { n: '03', Icon: IconChart, title: source.guideStep3Title, desc: source.guideStep3Desc },
  ];

  const features = [
    { n: '01', title: source.feature1Title, desc: source.feature1Desc, points: source.feature1Points },
    { n: '02', title: source.feature2Title, desc: source.feature2Desc, points: source.feature2Points },
    { n: '03', title: source.feature3Title, desc: source.feature3Desc, points: source.feature3Points },
    { n: '04', title: source.feature4Title, desc: source.feature4Desc, points: source.feature4Points },
  ];

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{PAGE_TITLE[lang] || PAGE_TITLE.vi}</title>
        <meta name="description" content={source.heroDesc} />
        <meta name="theme-color" content="#ed212f" />
      </Helmet>

      <section className="hero" id="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="kicker">{source.heroBadge}</p>
            <h1>
              <span className="hero-line">{heroLine(source.heroTitleRed1, source.heroTitleWhite1)}</span>
              <span className="hero-line">{heroLine(source.heroTitleWhite2, source.heroTitleRed2)}</span>
            </h1>
            <p className="hero-lead">{source.heroDesc}</p>
            <div className="actions">
              <Link to={links.register} className="btn btn-primary">
                {source.heroBtnPrimary}
              </Link>
              <a href={links.guide} className="btn btn-quiet">
                {source.heroBtnSecondary}
              </a>
            </div>
          </div>
          <figure className="hero-media">
            <img
              src={hero.src}
              alt={ui.heroAlt}
              width={hero.width}
              height={hero.height}
              fetchPriority="high"
              decoding="async"
            />
          </figure>
        </div>
      </section>

      <section className="section community" id="community">
        <div className="wrap">
          <div className="source-section-head">
            <span className="section-number" aria-hidden="true">
              01
            </span>
            <h2>
              <span className="semantic-line">{source.aboutTitleLine1}</span>
              <span className="semantic-line">{source.aboutTitleLine2}</span>
            </h2>
          </div>
          <div className="community-grid">
            {communityCards.map(({ n, Icon, title, desc }) => (
              <article key={n} className="community-card">
                <div className="card-top">
                  <span className="card-number">{n}</span>
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section why-section" id="why">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-number" aria-hidden="true">
                02
              </span>
              <h2>{source.whyTitle}</h2>
            </div>
            <p>{source.whyDesc}</p>
          </div>
          <div className="why-grid">
            <article className="why-card commission-card">
              <div className="commission-copy">
                <div className="card-top">
                  <span className="card-number">01</span>
                  <IconChart />
                </div>
                <h3>{source.whyCard1Title}</h3>
                <p>{source.whyCard1Desc}</p>
              </div>
              <div className="commission-board">
                <div className="commission-value">
                  <strong>
                    25<span>%</span>
                  </strong>
                  <p>{ui.starting}</p>
                </div>
                <span className="commission-dash" aria-hidden="true" />
                <div className="commission-value">
                  <strong>
                    50<span>%</span>
                  </strong>
                  <p>{ui.maximum}</p>
                </div>
              </div>
            </article>
            {whyRest.map(({ n, Icon, title, desc }) => (
              <article key={n} className="why-card">
                <div className="card-top">
                  <span className="card-number">{n}</span>
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section ai-section" id="ai-cv">
        <div className="wrap split">
          <figure className="media-frame">
            <img src={aiCv.src} alt={ui.aiAlt} width={aiCv.width} height={aiCv.height} loading="lazy" decoding="async" />
          </figure>
          <div className="split-copy">
            <span className="section-number" aria-hidden="true">
              03
            </span>
            <h2>{source.aiCvPromoTitle}</h2>
            <div className="actions">
              <Link to={links.register} className="btn btn-primary">
                {source.aiCvPromoCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section flow" id="guide">
        <div className="wrap">
          <div className="source-section-head">
            <span className="section-number" aria-hidden="true">
              04
            </span>
            <h2>
              <span className="semantic-line">{source.guideTitleLine1}</span>
              <span className="semantic-line">{source.guideTitleLine2}</span>
            </h2>
          </div>
          <div className="flow-board">
            {guideSteps.map(({ n, Icon, title, desc }) => (
              <article key={n} className="flow-step">
                <div className="step-top">
                  <span className="step-no">{n}</span>
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section platform" id="features">
        <div className="wrap">
          <div className="platform-intro">
            <div>
              <span className="section-number" aria-hidden="true">
                05
              </span>
              <h2>{source.featureTitle}</h2>
              <div className="actions">
                <Link to={links.register} className="btn btn-primary">
                  {source.featureCta}
                </Link>
              </div>
            </div>
            <figure className="media-frame">
              <img
                src={network.src}
                alt={ui.platformAlt}
                width={network.width}
                height={network.height}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
          <div className="features">
            {features.map((f) => (
              <article key={f.n} className="feature">
                <div className="feature-heading">
                  <span className="card-number">{f.n}</span>
                  <h3>{f.title}</h3>
                </div>
                <p>{f.desc}</p>
                <ul className="check-list">
                  {f.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section partners" id="partners">
        <div className="wrap">
          <div className="source-section-head">
            <span className="section-number" aria-hidden="true">
              06
            </span>
            <h2>
              <span className="semantic-line">{source.partnerTitleLine1}</span>
              <span className="semantic-line">{source.partnerTitleLine2}</span>
            </h2>
          </div>
          <div className="partner-grid">
            {COLLABORATOR_PARTNERS.map((partner) => (
              <div key={partner.name} className="partner" title={partner.name}>
                <img src={partner.src} alt={partner.name} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section news" id="news">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-number" aria-hidden="true">
                07
              </span>
              <h2>{source.hotNewsTitle}</h2>
            </div>
            <div>
              <p>{source.hotNewsDesc}</p>
              <Link to={links.blog} className="text-link">
                {source.hotNewsViewAll}
              </Link>
            </div>
          </div>
          <div className="news-grid">
            {newsItems.map((item) => {
              const title = item.title[lang] || item.title.vi;
              const blogPath = `${links.blog}/${encodeURIComponent(item.slug)}`;
              return (
                <Link key={item.id} to={blogPath} className="news-card">
                  <div className="news-image">
                    <img src={collaboratorNewsImage(item.image)} alt={title} loading="lazy" decoding="async" />
                  </div>
                  <div className="news-body">
                    <div className="news-meta">
                      <time dateTime={item.date}>{formatNewsDate(item.date)}</time>
                      <span>· {source.hotNewsTagFallback}</span>
                    </div>
                    <h3>{title}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="wrap faq-grid">
          <div className="faq-title">
            <span className="section-number" aria-hidden="true">
              08
            </span>
            <h2>{source.faqTitle}</h2>
          </div>
          <div className="faq-list">
            {source.faqItems.map((item) => (
              <details key={item.q}>
                <summary>
                  <span className="q" aria-hidden="true">
                    Q
                  </span>
                  <span>{item.q}</span>
                </summary>
                <div className="faq-answer">
                  {item.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)}>{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final" id="final">
        <div className="wrap">
          <div className="final-box">
            <figure className="final-media">
              <img src={support.src} alt={ui.finalAlt} width={support.width} height={support.height} loading="lazy" decoding="async" />
            </figure>
            <div className="final-copy">
              <h2>
                {source.footerCtaTitleWhite} <span>{source.footerCtaTitleRed}</span> {source.footerCtaTitleWhiteEnd}
              </h2>
              <p>{source.footerCtaDesc}</p>
              <div className="actions">
                <Link to={links.register} className="btn btn-primary">
                  {source.footerBtnPrimary}
                </Link>
                <button type="button" className="btn btn-quiet" onClick={openContact}>
                  {source.footerBtnSecondary}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
