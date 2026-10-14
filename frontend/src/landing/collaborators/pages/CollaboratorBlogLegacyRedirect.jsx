import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** URL cũ `/{lang}/blog/:slug` → trang chi tiết trong shell CTV */
export default function CollaboratorBlogLegacyRedirect() {
  const { lang, postSlug } = useParams();
  return <Navigate to={`/${lang}/collaborator/blog/${postSlug}`} replace />;
}
