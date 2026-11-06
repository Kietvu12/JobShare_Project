import { ButtonLink, SectionHeading } from './shared';

function ServiceCard({ service, index }) {
  return (
    <article className="service">
      <div className="service-top">
        <span className="number">{String(index + 1).padStart(2, '0')}</span>
        <span className="tag">{service.tag}</span>
      </div>
      <p className="eyebrow">{service.en}</p>
      <h3>{service.name}</h3>
      <p>{service.desc}</p>
      <ul>
        {service.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="service-fee">
        <strong>{service.fee}</strong>
        <span>{service.detail}</span>
      </div>
    </article>
  );
}

export default function PricingServicesSection({ copy, links }) {
  return (
    <section id="services" className="section wrap">
      <SectionHeading eyebrow="OUR SERVICES" title={copy.serviceTitle} lead={copy.serviceLead} />
      <div className="free-strip">
        <div>
          <strong>{copy.freeTitle}</strong>
          <p>{copy.freeText}</p>
        </div>
        <ButtonLink to={links.register} variant="blue">
          {copy.register}
        </ButtonLink>
      </div>
      <div className="services-grid">
        {copy.services.map((service, i) => (
          <ServiceCard key={service.en} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
