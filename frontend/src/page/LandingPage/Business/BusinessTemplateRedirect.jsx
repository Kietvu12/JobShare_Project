import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TEMPLATE_BASE = '/template/jobshare_business_landing';

const TEMPLATE_TO_LANDING = {
  '': '/landing/business',
  '/': '/landing/business',
  '/index.html': '/landing/business',
  '/pages/about.html': '/landing/business/about',
  '/pages/services.html': '/landing/business/services',
  '/pages/seminar.html': '/landing/business/seminar',
  '/pages/news.html': '/landing/business/news',
  '/pages/news-detail.html': '/landing/business/news/sample',
};

export default function BusinessTemplateRedirect() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const rest = pathname.startsWith(TEMPLATE_BASE)
      ? pathname.slice(TEMPLATE_BASE.length)
      : pathname;
    const target = TEMPLATE_TO_LANDING[rest] || '/landing/business';
    navigate(target, { replace: true });
  }, [pathname, navigate]);

  return null;
}
