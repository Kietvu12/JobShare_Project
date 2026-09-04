import { useEffect } from 'react';

const STYLES = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,700;0,800&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap',
  'https://use.typekit.net/ofq0clf.css',
  '/landing/business/assets/css/swiper-bundle.min.css',
  '/landing/business/assets/css/simplebar.css',
  '/landing/business/assets/css/form-cms.css',
  '/landing/business/assets/css/style.css',
];

function ensureStylesheet(href) {
  if (document.querySelector(`link[data-business-landing-style="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-business-landing-style', href);
  document.head.appendChild(link);
}

export default function BusinessLandingStyles() {
  useEffect(() => {
    STYLES.forEach(ensureStylesheet);
    document.body.classList.add('business-landing-page');
    return () => {
      document.body.classList.remove('business-landing-page');
    };
  }, []);

  return null;
}
