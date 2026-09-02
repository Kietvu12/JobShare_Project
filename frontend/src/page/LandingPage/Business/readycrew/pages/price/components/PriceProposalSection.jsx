import { PROPOSAL_ITEMS } from '../data/proposalItems'

export default function PriceProposalSection() {
  return (
    <section className="page-price-proposal l-section">
      <h2 className="o-section-heading">JobShare Businessの4つの採用サービス</h2>
      <div className="front-page-proposal__body">
        {PROPOSAL_ITEMS.map((item) => (
          <a key={item.href} className="front-page-proposal__item" href={item.href}>
            <div className="front-page-proposal__item-header">
              <div className={`front-page-proposal__icon ${item.iconClass}`}>
                <img src={item.icon} alt="" />
              </div>
              <div className="front-page-proposal__item-text">
                <h3 className="front-page-proposal__subject c-text-red-4">{item.title}</h3>
                <p className="front-page-proposal__subject-jp">{item.subtitle}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
