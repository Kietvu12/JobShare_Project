import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { getLocaleFromPathname, withLocalePath } from '../../../utils/localeRoutes';
import BlogDetail from '../../shared/Blogs/BlogDetail';
import BlogsList from '../../shared/Blogs/BlogsList';
import { buildCollaboratorNavLinks } from '../lib/collaboratorNav';

const DETAIL_LIST_PATH = 'collaborator/blog';

export default function CollaboratorsNewsPage() {
  const { pathname } = useLocation();
  const locale = getLocaleFromPathname(pathname) || 'vi';
  const blogBasePath = withLocalePath(locale, '/').replace(/\/+$/, '');
  const { blog: listPath } = buildCollaboratorNavLinks(pathname);

  return (
    <Routes>
      <Route
        index
        element={
          <BlogsList
            blogBasePath={blogBasePath}
            detailListPath={DETAIL_LIST_PATH}
            surface="collaborator"
          />
        }
      />
      <Route
        path=":postSlug"
        element={
          <BlogDetail
            surface="collaborator"
            listPath={listPath}
            blogBasePath={blogBasePath}
            detailListPath={DETAIL_LIST_PATH}
          />
        }
      />
    </Routes>
  );
}
