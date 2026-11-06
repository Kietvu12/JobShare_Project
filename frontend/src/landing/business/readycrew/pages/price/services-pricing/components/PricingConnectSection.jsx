import { ButtonLink } from './shared';

const PHONE_DISPLAY = '080-9441-1975';
const PHONE_TEL = '+818094411975';

export default function PricingConnectSection({ copy, links }) {
  return (
    <section className="price-connect">
      <div className="wrap">
        <p className="kicker">LET’S CONNECT</p>
        <h2>{copy.finalTitle}</h2>
        <p>{copy.finalLead}</p>
        <div className="price-connect-actions">
          <ButtonLink to={links.docs} variant="yellow">
            {copy.download}
          </ButtonLink>
          <ButtonLink to={links.contact} variant="white">
            {copy.consult}
          </ButtonLink>
        </div>
        <div className="price-connect-phone">
          <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
          <span>{copy.hours}</span>
        </div>
      </div>
    </section>
  );
}
