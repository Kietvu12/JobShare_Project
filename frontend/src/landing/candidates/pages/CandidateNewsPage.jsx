import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { getLocaleFromPathname, withLocalePath } from '../../../utils/localeRoutes';
import BlogDetail from '../../shared/Blogs/BlogDetail';
import BlogsList from '../../shared/Blogs/BlogsList';
import { buildCandidateNavLinks } from '../lib/candidateNav';

const DETAIL_LIST_PATH = 'candidate/blog';

export default function CandidateNewsPage() {
  const { pathname } = useLocation();
  const locale = getLocaleFromPathname(pathname) || 'vi';
  const blogBasePath = withLocalePath(locale, '/').replace(/\/+$/, '');
  const { blog: listPath } = buildCandidateNavLinks(pathname);

  return (
    <Routes>
      <Route
        index
        element={
          <BlogsList
            blogBasePath={blogBasePath}
            detailListPath={DETAIL_LIST_PATH}
            surface="candidate"
          />
        }
      />
      <Route
        path=":postSlug"
        element={
          <BlogDetail
            surface="candidate"
            listPath={listPath}
            blogBasePath={blogBasePath}
            detailListPath={DETAIL_LIST_PATH}
          />
        }
      />
    </Routes>
  );
}
