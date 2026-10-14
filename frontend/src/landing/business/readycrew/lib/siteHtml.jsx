import parse, { domToReact, Element as HtmlElement } from 'html-react-parser';
import { Link } from 'react-router-dom';
import { normalizeInternalPath, stripBusinessLandingBase, toBusinessLandingPath } from '../../businessLandingBase';
import { isInternalNavPath } from '../data/routes';

export function createSiteHtmlHelpers(basePath) {
  function resolveInternalLink(pathname) {
    const internal = normalizeInternalPath(stripBusinessLandingBase(pathname, basePath));
    if (!isInternalNavPath(internal)) return null;
    return toBusinessLandingPath(internal, basePath);
  }

  function rewriteSiteLinks(domNode) {
    if (!(domNode instanceof HtmlElement)) return undefined;

    if (domNode.name === 'a') {
      const href = domNode.attribs.href;
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return undefined;
      if (domNode.attribs.target === '_blank') return undefined;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return undefined;

        const target = resolveInternalLink(url.pathname);
        if (!target) return undefined;

        return (
          <Link to={target + url.search + url.hash} className={domNode.attribs.class}>
            {domToReact(domNode.children, { replace: rewriteSiteLinks })}
          </Link>
        );
      } catch {
        return undefined;
      }
    }

    if (domNode.name === 'script') {
      return <></>;
    }

    return undefined;
  }

  function parseSiteHtml(html) {
    return parse(html, { replace: rewriteSiteLinks });
  }

  return { parseSiteHtml, rewriteSiteLinks };
}

const CORE_SCRIPTS = [
  '/landing/business/assets/js/jquery-3.7.1.min.js',
  '/landing/business/assets/js/jquery.easing.min.js',
  '/landing/business/assets/js/slick.min.js',
  '/landing/business/assets/js/jquery.jscroll.min.js',
  '/landing/business/assets/js/picturefill.min.js',
  '/landing/business/assets/js/imagesloaded.pkgd.min.js',
  '/landing/business/assets/js/jquery.waypoints.min.js',
  '/landing/business/assets/js/jquery.matchHeight-min.js',
  '/landing/business/assets/js/jquery.counterup-2.0.js',
  '/landing/business/assets/js/smooth-scroll.polyfills.min.js',
  '/landing/business/assets/js/swiper-bundle.min.js',
  '/landing/business/assets/js/jquery.marquee.min.js',
  '/landing/business/assets/js/simplebar.min.js',
  '/landing/business/assets/js/vivus.min.js',
  '/landing/business/assets/js/clipboard.min.js',
  '/landing/business/assets/js/app.js',
];

export async function ensureSiteScripts(extra = []) {
  const all = [...CORE_SCRIPTS, ...extra.filter((s) => !CORE_SCRIPTS.includes(s))];

  for (const src of all) {
    if (document.querySelector(`script[data-site-script="${src}"]`)) continue;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-site-script', src);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(src));
      document.body.appendChild(script);
    });
  }

  window.dispatchEvent(new Event('load'));
}
