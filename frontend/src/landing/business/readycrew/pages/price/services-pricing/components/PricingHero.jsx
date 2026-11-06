import heroImage from '../assets/services-consultation.webp';
import { Arrow, ButtonLink, SectionLink } from './shared';

function HeroTitle({ title }) {
  if (!Array.isArray(title)) return <h1>{title}</h1>;
  return (
    <h1>
      {title.map((phrase, i) => (
        <span key={phrase}>
          {i > 0 ? ' ' : null}
          <span className="phrase">{phrase}</span>
        </span>
      ))}
    </h1>
  );
}

export default function PricingHero({ copy, links }) {
  return (
    <section className="price-hero">
      <div className="wrap hero-grid">
        <div>
          <p className="eyebrow">{copy.kicker}</p>
          <HeroTitle title={copy.heroTitle} />
          <p className="hero-lead">{copy.heroLead}</p>
          <div className="actions">
            <SectionLink className="btn btn-yellow" to="simulator">
              {copy.simulate} <Arrow />
            </SectionLink>
            <ButtonLink to={links.contact} variant="white">
              {copy.consult}
            </ButtonLink>
          </div>
        </div>
        <figure>
          <img src={heroImage} alt={copy.heroAlt} width="1200" height="675" />
          <figcaption>JOBSHARE BUSINESS · WORK STATION</figcaption>
        </figure>
      </div>
    </section>
  );
}
