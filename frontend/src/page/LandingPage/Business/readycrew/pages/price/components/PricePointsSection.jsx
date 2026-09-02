import { POINT_ITEMS } from '../data/pointItems'

export default function PricePointsSection() {
  return (
    <section className="page-price-point">
      <div className="page-price-point__wrapper l-wrapper--on-bg">
        <div className="page-price-point__contents l-contents--medium l-contents--sp">
          <div className="page-price-point__body">
            {POINT_ITEMS.map((item) => (
              <div key={item.title} className="page-price-point">
                <h3 className="page-price-point_ttl">{item.title}</h3>
                <div className="page-price-point_img">
                  <img src={item.image} alt="JobShare Business" loading="lazy" />
                </div>
                <p className="page-price-point_txt">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
