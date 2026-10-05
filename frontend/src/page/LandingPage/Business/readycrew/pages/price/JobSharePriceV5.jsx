import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../../../context/LanguageContext';
import { getBusinessLandingPriceCopy } from '../../../../../../i18n/businessApp/businessLandingPrice';
import { homepageExtrasI18n } from '../../../../../../i18n/businessApp/homepageExtras';
import BusinessServiceFeeSimulator from '../../../../../../component/Bussiness/BusinessServiceFeeSimulator';
import { useBusinessLandingBase } from '../../../BusinessLandingContext';
import { toBusinessLandingPath } from '../../../businessLandingBase';
import './businessPriceV5.css';

const HERO_IMG = '/jobshare-home-v2/assets/recruitment-consultation.png';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L20 5" />
    </svg>
  );
}

export default function JobSharePriceV5() {
  const { language } = useLanguage();
  const basePath = useBusinessLandingBase();
  const navigate = useNavigate();
  const copy = useMemo(() => getBusinessLandingPriceCopy(language), [language]);
  const cards = useMemo(
    () => homepageExtrasI18n[language]?.solutionCards || homepageExtrasI18n.vi.solutionCards,
    [language],
  );

  const registerPath = `/business/register?lang=${language}`;
  const contactPath = toBusinessLandingPath('/contact_rc', basePath);
  const docsPath = toBusinessLandingPath('/inquiry_docs_rc', basePath);

  useEffect(() => {
    document.title = copy.metaTitle;
  }, [copy.metaTitle]);

  const onSimNavigate = (path) => {
    if (!path) return;
    navigate(path.startsWith('/') ? path : `/${path}`);
  };

  return (
    <article style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
    <div className="jp-price-page">
      <Helmet>
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
      </Helmet>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <main className="jp-page" lang={language === 'ja' ? 'ja' : language}>
        <section className="jp-hero" aria-labelledby="price-hero-title">
          <div className="jp-wrap jp-hero-inner">
            <div>
              <p className="jp-kicker" style={{ color: '#fff', opacity: 0.95 }}>{copy.kicker}</p>
              <h1 id="price-hero-title">
                {copy.heroTitle}
                <em>{copy.heroEm}</em>
              </h1>
              <p className="jp-lead">
                <span className="jp-lead-line">{copy.lead1}</span>
                <span className="jp-lead-line">{copy.lead2}</span>
              </p>
              <div className="jp-hero-note">
                <span><CheckIcon />{copy.note1}</span>
                <span><CheckIcon />{copy.note2}</span>
              </div>
            </div>
            <figure className="jp-photo">
              <img src={HERO_IMG} alt={copy.photoAlt} loading="lazy" />
              <figcaption className="jp-photo-cap">{copy.photoCap}</figcaption>
            </figure>
          </div>
        </section>

        <section className="jp-section">
          <div className="jp-wrap jp-free">
            <div>
              <h2>{copy.freeTitle}</h2>
              <p>{copy.freeBody}</p>
            </div>
            <div className="jp-free-actions">
              <Link className="jp-btn jp-btn--yellow" to={registerPath}>{copy.freeCtaRegister}</Link>
              <Link className="jp-btn jp-btn--outline" to={contactPath}>{copy.freeCtaContact}</Link>
            </div>
          </div>
        </section>

        <section className="jp-section jp-section--soft" aria-labelledby="price-services-title">
          <div className="jp-wrap">
            <header className="jp-section-head">
              <p className="jp-kicker">{copy.servicesKicker}</p>
              <h2 id="price-services-title">{copy.servicesTitle}</h2>
              <p>{copy.servicesLead}</p>
            </header>
            <div className="jp-service-grid">
              {cards.map((card) => (
                <article key={card.tagId} className="jp-service-card">
                  <div className="jp-service-num">{card.num}</div>
                  <h3>{card.title}</h3>
                  <p className="jp-service-sub">{card.subtitle}</p>
                  <ul>
                    {card.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="jp-section" aria-labelledby="price-compare-title">
          <div className="jp-wrap">
            <header className="jp-section-head">
              <p className="jp-kicker">{copy.compareKicker}</p>
              <h2 id="price-compare-title">{copy.compareTitle}</h2>
              <p>{copy.compareLead}</p>
            </header>
            <table className="jp-compare">
              <thead>
                <tr>
                  <th scope="col">{copy.compareHeadService}</th>
                  <th scope="col">{copy.compareHeadModel}</th>
                  <th scope="col">{copy.compareHeadWhen}</th>
                  <th scope="col">{copy.compareHeadFor}</th>
                </tr>
              </thead>
              <tbody>
                {copy.pricingRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.service}</strong>
                      <div style={{ marginTop: 8 }}>
                        <span className="jp-badge">{row.badge}</span>
                      </div>
                    </td>
                    <td>{row.model}</td>
                    <td>{row.when}</td>
                    <td>{row.for}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="jp-section jp-section--soft" aria-labelledby="price-sim-title">
          <div className="jp-wrap">
            <header className="jp-section-head">
              <p className="jp-kicker">{copy.simulatorKicker}</p>
              <h2 id="price-sim-title">{copy.simulatorTitle}</h2>
              <p>{copy.simulatorLead}</p>
            </header>
            <div className="jp-simulator-host">
              <BusinessServiceFeeSimulator onNavigate={onSimNavigate} />
            </div>
          </div>
        </section>

        <section className="jp-section jp-faq" aria-labelledby="price-faq-title">
          <div className="jp-wrap">
            <header className="jp-section-head">
              <p className="jp-kicker">{copy.faqKicker}</p>
              <h2 id="price-faq-title">{copy.faqTitle}</h2>
            </header>
            <div className="jp-faq-list">
              {copy.faq.map((item) => (
                <details key={item.q}>
                  <summary>
                    <span className="jp-faq-q">Q</span>
                    <span>{item.q}</span>
                    <span className="jp-faq-plus" aria-hidden="true">+</span>
                  </summary>
                  <p className="jp-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="jp-cta">
          <div className="jp-wrap jp-cta-inner">
            <div>
              <h2>{copy.ctaTitle}</h2>
              <p>{copy.ctaBody}</p>
            </div>
            <div className="jp-cta-actions">
              <Link className="jp-btn jp-btn--yellow" to={contactPath}>{copy.ctaContact}</Link>
              <Link className="jp-btn jp-btn--outline" to={docsPath}>{copy.ctaDocs}</Link>
            </div>
          </div>
        </section>
      </main>

      <div className="jp-footer-note">{copy.footer}</div>
    </div>
    </article>
  );
}
