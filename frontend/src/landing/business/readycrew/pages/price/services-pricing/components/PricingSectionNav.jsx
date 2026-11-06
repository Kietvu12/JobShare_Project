import { SectionLink } from './shared';

export default function PricingSectionNav({ copy }) {
  const items = [
    { id: 'services', label: `01 · ${copy.serviceTitle}` },
    { id: 'fees', label: `02 · ${copy.navPrice}` },
    { id: 'simulator', label: '03 · FEE SIMULATOR' },
  ];

  return (
    <div className="section-nav">
      <div className="wrap">
        {items.map((item) => (
          <SectionLink key={item.id} to={item.id}>
            {item.label}
          </SectionLink>
        ))}
      </div>
    </div>
  );
}
