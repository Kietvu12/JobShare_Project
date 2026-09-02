export default function BrandLogo({ className = '' }) {
  return (
    <span className={`business-brand-logo ${className}`.trim()} aria-label="JobShare for Business">
      JobShare for Business
    </span>
  )
}
