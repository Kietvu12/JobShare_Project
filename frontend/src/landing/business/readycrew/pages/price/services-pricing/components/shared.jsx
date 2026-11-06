import { Link } from 'react-router-dom';

export function Arrow() {
  return <span aria-hidden="true">→</span>;
}

/** Cuộn tới section trong trang mà không đổi URL (header landing fixed, trang có thể cuộn trong #root). */
export function scrollToSection(event, id) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function SectionLink({ to, className, children }) {
  return (
    <a className={className} href={`#${to}`} onClick={(event) => scrollToSection(event, to)}>
      {children}
    </a>
  );
}

export function ButtonLink({ to, variant, children }) {
  return (
    <Link className={`btn btn-${variant}`} to={to}>
      {children} <Arrow />
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, lead }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lead ? <p>{lead}</p> : null}
    </div>
  );
}
