import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import JobShareAboutIsolated from '../../shared/pages/JobShareAboutIsolated';
import { getLocaleFromPathname, publicCanonicalUrl } from '../../../utils/localeRoutes';

/** Trang Về chúng tôi CTV — dùng chung template About Us V5 với landing doanh nghiệp. */
export default function CollaboratorAboutPage() {
  const { pathname } = useLocation();

  return (
    <>
      <Helmet>
        <link rel="canonical" href={publicCanonicalUrl(pathname)} />
      </Helmet>
      <JobShareAboutIsolated locale={getLocaleFromPathname(pathname)} />
    </>
  );
}
