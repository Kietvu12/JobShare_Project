import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Khớp app.js template: `.nav.open` trên mobile. */
export function useCandidateMobileNav() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.getElementById('candidate-site-root');
    const toggle = root?.querySelector('[data-candidate-menu-toggle]');
    const nav = root?.querySelector('#main-nav.nav');
    if (!toggle || !nav) return undefined;

    const close = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const onToggle = () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
    };

    const onNavClick = (e) => {
      if (e.target.closest('a')) close();
    };

    const onDocClick = (e) => {
      if (!e.target.closest('#candidate-site-root .site-header')) close();
    };

    toggle.addEventListener('click', onToggle);
    nav.addEventListener('click', onNavClick);
    document.addEventListener('click', onDocClick);
    return () => {
      toggle.removeEventListener('click', onToggle);
      nav.removeEventListener('click', onNavClick);
      document.removeEventListener('click', onDocClick);
      close();
    };
  }, [pathname]);
}
