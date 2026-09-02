import { Link } from 'react-router-dom';
import { normalizeInternalPath, stripBusinessLandingBase, toBusinessLandingPath } from '../../../businessLandingBase';
import { isInternalNavPath } from '../../data/routes';
import { useBusinessLandingBase } from '../../../BusinessLandingContext';

export default function SiteLink({ to, className, children, target, rel }) {
  const basePath = useBusinessLandingBase();

  if (target === '_blank' || to.startsWith('tel:') || to.startsWith('mailto:') || to.startsWith('http')) {
    return (
      <a href={to} className={className} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  const path = normalizeInternalPath(stripBusinessLandingBase(new URL(to, window.location.origin).pathname, basePath));
  if (isInternalNavPath(path)) {
    return (
      <Link to={toBusinessLandingPath(path, basePath)} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
}
