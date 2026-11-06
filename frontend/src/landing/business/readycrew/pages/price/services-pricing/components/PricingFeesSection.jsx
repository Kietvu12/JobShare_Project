import { PRICING_CONFIG } from '../lib/pricingConfig';
import { formatPackageNumber } from '../lib/format';
import { SectionHeading } from './shared';

function FeeTable({ copy }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {copy.tableHeads.map((head) => (
              <th key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {copy.services.map((service, i) => (
            <tr key={service.en}>
              <th>{service.name}</th>
              <td>{copy.feeValues[i]}</td>
              <td>{copy.feeTimes[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreditPackages({ copy }) {
  return (
    <div className="packages">
      {PRICING_CONFIG.packages.map((pkg) => (
        <div key={pkg.key} className="package">
          <span>{pkg.name}</span>
          <strong>¥{formatPackageNumber(pkg.price)}</strong>
          <p>
            {formatPackageNumber(pkg.credits)} {copy.credits}
          </p>
          <small>
            {pkg.credits / PRICING_CONFIG.creditsPerUnlock} {copy.opensUnit}
          </small>
        </div>
      ))}
    </div>
  );
}

export default function PricingFeesSection({ copy }) {
  return (
    <section id="fees" className="section fee-section">
      <div className="wrap">
        <SectionHeading eyebrow="CLEAR PRICING" title={copy.feeTitle} lead={copy.feeLead} />
        <FeeTable copy={copy} />
        <p className="note">{copy.referenceNote}</p>
        <div className="package-header">
          <h3>{copy.packageTitle}</h3>
          <span className="tag">DIRECT SCOUT</span>
        </div>
        <CreditPackages copy={copy} />
        <p className="note">{copy.packageNote}</p>
      </div>
    </section>
  );
}
