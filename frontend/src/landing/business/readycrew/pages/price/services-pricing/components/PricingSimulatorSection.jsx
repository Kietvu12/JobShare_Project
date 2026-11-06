import { useFeeSimulator } from '../hooks/useFeeSimulator';
import FeeResultCard from './FeeResultCard';
import FeeSimulatorForm from './FeeSimulatorForm';
import { ButtonLink, SectionHeading } from './shared';

const RESULT_KEYS = ['direct', 'managed', 'partner'];

export default function PricingSimulatorSection({ copy, lang, links }) {
  const simulator = useFeeSimulator(copy, lang);
  const { result, hasErrors, copyResult, copyStatus, n, yen } = simulator;

  return (
    <section id="simulator" className="section wrap">
      <SectionHeading eyebrow="FEE SIMULATOR" title={copy.simTitle} lead={copy.simLead} />
      <div className="sim-grid">
        <FeeSimulatorForm copy={copy} simulator={simulator} />
        <div className="results">
          <div className="result-heading">
            <h3>{copy.resultTitle}</h3>
            <span className="tag">{copy.referenceBadge}</span>
          </div>
          <div id="results">
            {hasErrors
              ? null
              : RESULT_KEYS.map((key, i) => (
                  <FeeResultCard
                    key={key}
                    index={i}
                    data={result[key]}
                    state={result.state}
                    copy={copy}
                    n={n}
                    yen={yen}
                  />
                ))}
          </div>
          <p className="note">{copy.simNote}</p>
          <div className="result-actions">
            <button type="button" className="btn btn-outline" disabled={hasErrors} onClick={copyResult}>
              {copy.copy}
            </button>
            <ButtonLink to={links.contact} variant="blue">
              {copy.askResult}
            </ButtonLink>
          </div>
          <p id="copy-status" role="status">
            {copyStatus}
          </p>
        </div>
      </div>
    </section>
  );
}
