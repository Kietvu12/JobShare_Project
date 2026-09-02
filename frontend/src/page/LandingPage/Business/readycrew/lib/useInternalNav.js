import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeInternalPath, stripBusinessLandingBase, toBusinessLandingPath } from '../../businessLandingBase';
import { isInternalNavPath } from '../data/routes';

export function useInternalNav(ref, basePath, enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;

    const onClick = (e) => {
      const anchor = e.target?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
      if (anchor.getAttribute('target') === '_blank') return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const internal = normalizeInternalPath(stripBusinessLandingBase(url.pathname, basePath));
        if (!isInternalNavPath(internal)) return;
        e.preventDefault();
        navigate(toBusinessLandingPath(internal, basePath) + url.search + url.hash);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [navigate, enabled, ref, basePath]);
}
