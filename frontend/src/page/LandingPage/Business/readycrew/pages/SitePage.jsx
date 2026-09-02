import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PAGES } from '../content/pages';
import { createSiteHtmlHelpers, ensureSiteScripts } from '../lib/siteHtml';
import { useInternalNav } from '../lib/useInternalNav';
import { useBusinessLandingBase } from '../../BusinessLandingContext';

export default function SitePage({ pageKey }) {
  const page = PAGES[pageKey];
  const ref = useRef(null);
  const basePath = useBusinessLandingBase();
  const { parseSiteHtml } = useMemo(() => createSiteHtmlHelpers(basePath), [basePath]);
  useInternalNav(ref, basePath);

  useEffect(() => {
    document.title = page.title;
    window.scrollTo(0, 0);

    ensureSiteScripts(page.extraScripts ?? [])
      .then(() => {
        document.querySelector('.js-loading')?.classList.add('is-loaded');
      })
      .catch(() => undefined);
  }, [page]);

  return (
    <div ref={ref} className="site-page">
      {parseSiteHtml(page.html)}
    </div>
  );
}

export function SitePageNotFound() {
  const basePath = useBusinessLandingBase();
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: '"Noto Sans JP", sans-serif' }}>
      <h1>ページが見つかりません</h1>
      <p style={{ marginTop: 16, color: '#666' }}>お探しのページは存在しないか、移動した可能性があります。</p>
      <Link to={basePath} style={{ display: 'inline-block', marginTop: 24, color: '#0576b6' }}>
        トップページへ
      </Link>
    </div>
  );
}
