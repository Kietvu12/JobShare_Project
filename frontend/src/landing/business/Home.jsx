import { Route, Routes, useLocation } from 'react-router-dom';
import { BusinessLandingProvider } from './BusinessLandingContext';
import BusinessLandingStyles from './BusinessLandingStyles';
import { resolveBusinessLandingBase } from './businessLandingBase';
import Layout from './readycrew/components/layout/Layout';
import { ROUTES } from './readycrew/data/routes';
import HomePage from './readycrew/pages/home/HomePage';
import DocumentPage from './readycrew/pages/document/DocumentPage';
import JobShareNewsV2 from './readycrew/pages/news/JobShareNewsV2';
import JobShareSeminarV2 from './readycrew/pages/seminar/JobShareSeminarV2';
import JobShareAboutV5 from './readycrew/pages/about/JobShareAboutV5';
import MangaPage from './readycrew/pages/manga/MangaPage';
import ProposalPage from './readycrew/pages/proposal/ProposalPage';
import PricePage from './readycrew/pages/price/PricePage';
import ResultsPage from './readycrew/pages/results/ResultsPage';
import SitePage, { SitePageNotFound } from './readycrew/pages/SitePage';
import DownloadPage from './readycrew/pages/download/DownloadPage';
import ContactPage from './readycrew/pages/contact/ContactPage';
import PublicBlogListPage from '../../page/LandingPage/PublicBlogListPage';
import BlogDetailPage from '../../page/BlogDetailPage';
import './businessTailwindRem.css';

const REACT_PAGE_KEYS = new Set([
  'index',
  'price',
  'results',
  'proposal',
  'manga',
  'seminar',
  'document',
  'news',
  'about-us',
  'download',
  'inquiry_docs_rc',
  'contact_rc',
]);

export default function BusinessLandingHome() {
  const { pathname } = useLocation();
  const basePath = resolveBusinessLandingBase(pathname);

  const legacyRoutes = ROUTES.filter(({ key }) => !REACT_PAGE_KEYS.has(key));

  return (
    <BusinessLandingProvider basePath={basePath}>
      <BusinessLandingStyles />
      <Routes>
        <Route element={<Layout />}>
          {legacyRoutes.map(({ path, key }) => (
            <Route
              key={key}
              path={path.slice(1)}
              element={<SitePage pageKey={key} />}
            />
          ))}
          <Route index element={<HomePage />} />
          <Route path="price" element={<PricePage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="proposal" element={<ProposalPage />} />
          <Route path="manga" element={<MangaPage />} />
          <Route path="seminar" element={<JobShareSeminarV2 />} />
          <Route path="document" element={<DocumentPage />} />
          <Route path="news" element={<JobShareNewsV2 />} />
          <Route path="blog" element={<div className="business-tw-px flex flex-1 flex-col"><PublicBlogListPage /></div>} />
          <Route path="blog/:postSlug" element={<div className="business-tw-px business-blog-detail flex flex-1 flex-col"><BlogDetailPage /></div>} />
          <Route path="about-us" element={<JobShareAboutV5 />} />
          <Route path="download" element={<DownloadPage />} />
          <Route path="inquiry_docs_rc" element={<DownloadPage />} />
          <Route path="contact_rc" element={<ContactPage />} />
          <Route path="*" element={<SitePageNotFound />} />
        </Route>
      </Routes>
    </BusinessLandingProvider>
  );
}
