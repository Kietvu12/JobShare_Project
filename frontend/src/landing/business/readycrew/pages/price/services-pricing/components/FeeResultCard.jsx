import { PRICING_CONFIG } from '../lib/pricingConfig';
import { formatBudgetStatus } from '../lib/format';

const NOTE_KEYS = ['directNote', 'managedNote', 'partnerNote'];

function CalcLine({ label, value }) {
  return (
    <div className="calc-line">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Amount({ min, max, yen }) {
  if (min === max) return <span className="money-token">{yen(min)}</span>;
  return (
    <>
      <span className="money-token">{yen(min)}</span>
      <span aria-hidden="true">–</span>
      <span className="money-token">{yen(max)}</span>
    </>
  );
}

function CalculationLines({ index, data, state, copy, n, yen }) {
  const { creditsPerUnlock, partnerPlatformPercent } = PRICING_CONFIG;
  if (index === 0) {
    return (
      <>
        <CalcLine
          label={copy.needed}
          value={`${n(data.opens)} × ${creditsPerUnlock} = ${n(data.opens * creditsPerUnlock)} ${copy.credits}`}
        />
        <CalcLine label={copy.purchase} value={data.items.map((p) => `${p.name} × ${p.count}`).join(' + ')} />
        <CalcLine label={copy.unused} value={`${n(data.remaining)} ${copy.credits}`} />
      </>
    );
  }
  if (index === 1) {
    const [low, high] = data.rates;
    return (
      <CalcLine
        label={copy.formula}
        value={`${n(state.headcount)} × ${yen(state.income)} × ${low}${high !== low ? `–${high}` : ''}%`}
      />
    );
  }
  return (
    <>
      <CalcLine label={copy.formula} value={`${n(state.headcount)} × ${yen(state.partner)}`} />
      <CalcLine label={copy.partnerNet} value={`${copy.perHire}: ${yen(data.net)}`} />
      <CalcLine
        label={copy.platformFee}
        value={`${copy.perHire}: ${yen(data.platform)} (${partnerPlatformPercent}%)`}
      />
    </>
  );
}

export default function FeeResultCard({ index, data, state, copy, n, yen }) {
  const service = copy.services[index];
  return (
    <article className="result-card">
      <div className="result-main">
        <div className="result-title">
          <span className="number">{String(index + 1).padStart(2, '0')}</span>
          <h4>{service.name}</h4>
        </div>
        <small>
          {copy.total} · {index === 0 ? copy.prepaid : copy.success}
        </small>
        <div className="result-amount">
          <strong>
            <Amount min={data.min} max={data.max} yen={yen} />
          </strong>
          <span className={`status ${data.status.kind}`}>{formatBudgetStatus(data.status, copy, yen)}</span>
        </div>
        <p className="result-note">{copy[NOTE_KEYS[index]]}</p>
      </div>
      <details className="calculation">
        <summary>{copy.formula}</summary>
        <dl>
          <CalculationLines index={index} data={data} state={state} copy={copy} n={n} yen={yen} />
        </dl>
      </details>
    </article>
  );
}
