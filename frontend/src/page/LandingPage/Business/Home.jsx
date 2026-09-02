import { Route, Routes, useLocation } from 'react-router-dom';
import { BusinessLandingProvider } from './BusinessLandingContext';
import BusinessLandingStyles from './BusinessLandingStyles';
import { resolveBusinessLandingBase } from './businessLandingBase';
import Layout from './readycrew/components/layout/Layout';
import { ROUTES } from './readycrew/data/routes';
import HomePage from './readycrew/pages/home/HomePage';
import NewsPage from './readycrew/pages/news/NewsPage';
import DocumentPage from './readycrew/pages/document/DocumentPage';
import SeminarPage from './readycrew/pages/seminar/SeminarPage';
import MangaPage from './readycrew/pages/manga/MangaPage';
import ProposalPage from './readycrew/pages/proposal/ProposalPage';
import PricePage from './readycrew/pages/price/PricePage';
import ResultsPage from './readycrew/pages/results/ResultsPage';
import SitePage, { SitePageNotFound } from './readycrew/pages/SitePage';
import AboutUsPage from '../../Shared/AboutUsPage';

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
          <Route path="seminar" element={<SeminarPage />} />
          <Route path="document" element={<DocumentPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="about-us" element={<AboutUsPage />} />
          <Route path="*" element={<SitePageNotFound />} />
        </Route>
      </Routes>
    </BusinessLandingProvider>
  );
}
