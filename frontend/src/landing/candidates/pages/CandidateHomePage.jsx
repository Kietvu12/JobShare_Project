import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import jobsData from '../../templates/JobShare_Candidate_V1_1_20261006/jobs.json';
import newsData from '../../templates/JobShare_Candidate_V1_1_20261006/news.json';
import { useCandidateChrome } from '../context/CandidateChromeContext';
import {
  CANDIDATE_HOME_IMAGES,
  CANDIDATE_PARTNERS,
  candidateNewsImage,
} from '../lib/candidateAssets';
import {
  CANDIDATE_FEATURED_JOBS_EXTRA_COUNT,
  CANDIDATE_HOME_PAGE_DESC,
  CANDIDATE_HOME_PAGE_TITLE,
  CANDIDATE_MORE_JOBS,
  formatCandidateNewsDate,
  slugFromCandidateNewsItem,
} from '../lib/candidateHomeMeta';
import { buildCandidateNavLinks } from '../lib/candidateNav';
import {
  IconBuilding,
  IconChart,
  IconDoc,
  IconSearch,
  IconSpark,
  IconUser,
} from '../lib/candidateSectionIcons';
import { useCandidateCopy } from '../lib/useCandidateCopy';

export default function CandidateHomePage() {
  const { pathname } = useLocation();
  const { lang, source, ui } = useCandidateCopy();
  const { openContact } = useCandidateChrome();
  const links = buildCandidateNavLinks(pathname);
  const moreJobs = CANDIDATE_MORE_JOBS[lang] || CANDIDATE_MORE_JOBS.vi;
  const { hero, aiCv, platform, careerSupport } = CANDIDATE_HOME_IMAGES;

  const communityCards = [
    { n: '01', Icon: IconSearch, title: source.aboutCard1Title, desc: source.aboutCard1Desc },
    { n: '02', Icon: IconSpark, title: source.aboutCard2Title, desc: source.aboutCard2Desc },
    { n: '03', Icon: IconChart, title: source.aboutCard3Title, desc: source.aboutCard3Desc },
  ];

  const whyCards = [
    { n: '01', Icon: IconSearch, title: source.whyCard1Title, desc: source.whyCard1Desc },
    { n: '02', Icon: IconDoc, title: source.whyCard2Title, desc: source.whyCard2Desc },
    { n: '03', Icon: IconChart, title: source.whyCard3Title, desc: source.whyCard3Desc },
    { n: '04', Icon: IconBuilding, title: source.whyCard4Title, desc: source.whyCard4Desc },
  ];

  const guideSteps = [
    { n: '01', Icon: IconSearch, title: source.guideStep1Title, desc: source.guideStep1Desc },
    { n: '02', Icon: IconUser, title: source.guideStep2Title, desc: source.guideStep2Desc },
    { n: '03', Icon: IconChart, title: source.guideStep3Title, desc: source.guideStep3Desc },
  ];

  const features = [
    { n: '01', title: source.feature1Title, points: source.feature1Points },
    { n: '02', title: source.feature2Title, points: source.feature2Points },
    { n: '03', title: source.feature3Title, points: source.feature3Points },
    { n: '04', title: source.feature4Title, points: source.feature4Points },
  ];

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{CANDIDATE_HOME_PAGE_TITLE[lang] || CANDIDATE_HOME_PAGE_TITLE.vi}</title>
        <meta name="description" content={CANDIDATE_HOME_PAGE_DESC[lang] || CANDIDATE_HOME_PAGE_DESC.vi} />
        <meta name="theme-color" content="#ed212f" />
      </Helmet>

      <section className="hero" id="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="kicker">{source.heroBadge}</p>
            <h1>
              <span className="hero-line">{source.heroTitle1}</span>
              <span className="hero-line">{source.heroTitle2}</span>
            </h1>
            <p className="hero-lead">{source.heroDesc}</p>
            <div className="actions">
              <Link to={links.jobs} className="btn btn-primary">
                {source.heroBtnPrimary}
              </Link>
              <Link to={links.profile} className="btn btn-quiet">
                {source.heroBtnSecondary}
              </Link>
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
                  <Icon  />
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
          <div className="why-grid why-grid--candidate">
            {whyCards.map(({ n, Icon, title, desc }) => (
              <article key={n} className="why-card">
                <div className="card-top">
                  <span className="card-number">{n}</span>
                  <Icon  />
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
              {source.guideTitleLine2 ? (
                <span className="semantic-line">{source.guideTitleLine2}</span>
              ) : null}
            </h2>
          </div>
          <div className="flow-board">
            {guideSteps.map(({ n, Icon, title, desc }) => (
              <article key={n} className="flow-step">
                <div className="step-top">
                  <span className="step-no">{n}</span>
                  <Icon  />
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
                <Link to={links.profile} className="btn btn-primary">
                  {source.featureCta}
                </Link>
              </div>
            </div>
            <figure className="media-frame">
              <img
                src={platform.src}
                alt={ui.platformAlt}
                width={platform.width}
                height={platform.height}
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
                <ul className="check-list">
                  {(f.points || []).map((point) => (
                    <li key={point} >
                      {point}
                    </li>
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
              {source.partnerTitleLine2 ? (
                <span className="semantic-line">{source.partnerTitleLine2}</span>
              ) : null}
            </h2>
            {source.partnerDesc ? <p className="partner-lead">{source.partnerDesc}</p> : null}
          </div>
          <div className="partner-grid">
            {CANDIDATE_PARTNERS.map((partner) => (
              <div key={partner.name} className="partner" title={partner.name}>
                <img src={partner.src} alt={partner.name} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section jobs-section" id="jobs">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-number" aria-hidden="true">
                07
              </span>
              <h2>{source.jobsTitle}</h2>
            </div>
            <div>
              <Link to={links.jobs} className="text-link">
                {source.jobsViewAll}
              </Link>
            </div>
          </div>
          <div className="jobs-grid">
            {jobsData.map((job) => (
              <Link key={job.id} to={`${links.jobs}/${job.id}`} className="job-card">
                <div className="job-card-top">
                  <span className="job-company">{job.company[lang] || job.company.vi}</span>
                  <span className="job-arrow" aria-hidden="true">
                    →
                  </span>
                </div>
                <h3>{job.title[lang] || job.title.vi}</h3>
                <div className="job-meta">
                  <span className="job-salary">{job.salary[lang] || job.salary.vi}</span>
                  <span className="job-type">{job.type[lang] || job.type.vi}</span>
                </div>
              </Link>
            ))}
            <Link
              to={links.jobs}
              className="job-more-card"
              aria-label={moreJobs.text}
            >
              <div className="job-more-top">
                <span>{moreJobs.eyebrow}</span>
                <span className="job-more-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <strong>+{CANDIDATE_FEATURED_JOBS_EXTRA_COUNT}</strong>
              <p>
                {moreJobs.text} <span aria-hidden="true">›</span>
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section news candidate-news" id="news">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-number" aria-hidden="true">
                08
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
          <div className="news-grid candidate-news-grid">
            {newsData.map((item) => {
              const title = item.title[lang] || item.title.vi;
              const category = item.category[lang] || item.category.vi;
              const slug = slugFromCandidateNewsItem(item, lang);
              const blogPath = `${links.blog}/${encodeURIComponent(slug)}`;
              return (
                <Link key={item.id} to={blogPath} className="news-card">
                  <div className="news-image">
                    <img src={candidateNewsImage(item.image)} alt={title} loading="lazy" decoding="async" />
                  </div>
                  <div className="news-body">
                    <div className="news-meta">
                      <time dateTime={item.date}>{formatCandidateNewsDate(item.date, lang)}</time>
                      <span>· {category}</span>
                    </div>
                    <h3>{title}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="final" id="final">
        <div className="wrap">
          <div className="final-box">
            <figure className="final-media">
              <img
                src={careerSupport.src}
                alt={ui.finalAlt}
                width={careerSupport.width}
                height={careerSupport.height}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <div className="final-copy">
              <h2>
                {source.footerCtaTitleWhite}{' '}
                <span>{source.footerCtaTitleRed}</span> {source.footerCtaTitleWhiteEnd}
              </h2>
              <p>{source.footerCtaDesc}</p>
              <div className="actions">
                <Link to={links.profile} className="btn btn-primary">
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
