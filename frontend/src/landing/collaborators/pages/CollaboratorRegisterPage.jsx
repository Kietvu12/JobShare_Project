import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import RegisterPage from '../../../page/RegisterPage';
import { publicCanonicalUrl } from '../../../utils/localeRoutes';
import '../collaborator-register.css';

export default function CollaboratorRegisterPage() {
  const { pathname } = useLocation();

  return (
    <>
      <Helmet>
        <link rel="canonical" href={publicCanonicalUrl(pathname)} />
      </Helmet>
      <RegisterPage shell="collaborator" />
    </>
  );
}
