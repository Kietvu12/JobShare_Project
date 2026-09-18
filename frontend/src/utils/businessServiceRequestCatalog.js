import {
  Coins,
  LayoutTemplate,
  Megaphone,
  Users,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { getServiceRequestFields } from '../i18n/businessApp/serviceRequests.js';

/** Catalog meta (icons, routes) — copy from i18n. */
export const BUSINESS_SERVICE_REQUEST_CATALOG_BASE = [
  {
    key: 'credit_topup',
    icon: Coins,
    iconBg: '#e8f4fa',
    iconColor: '#0077B6',
    requiresAmount: true,
    apiType: 'credit',
    detailPath: '/business/service-requests/credit',
  },
  {
    key: 'landing_page_premium',
    icon: LayoutTemplate,
    iconBg: '#fce7f3',
    iconColor: '#db2777',
    apiType: 'service',
    detailPath: '/business/service-requests/landing-page',
  },
  {
    key: 'recruitment_ads',
    icon: Megaphone,
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    apiType: 'service',
    detailPath: '/business/service-requests/recruitment-ads',
  },
  {
    key: 'seminar_campaign',
    icon: Users,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    apiType: 'service',
    detailPath: '/business/service-requests/seminar-campaign',
  },
  {
    key: 'company_profile',
    icon: Building2,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    apiType: 'service',
    detailPath: '/business/service-requests/company-profile',
  },
  {
    key: 'other_service',
    icon: MoreHorizontal,
    iconBg: '#f1f5f9',
    iconColor: '#64748b',
    apiType: 'service',
  },
];

function mergeServiceCopy(base, language) {
  const fields = getServiceRequestFields(base.key, language) || {};
  return {
    ...base,
    title: fields.title || '',
    shortDesc: fields.shortDesc || '',
    description: fields.description || '',
    ctaLabel: fields.ctaLabel || '',
    breadcrumb: fields.breadcrumb,
  };
}

export function getBusinessServiceRequestCatalog(language = 'vi') {
  return BUSINESS_SERVICE_REQUEST_CATALOG_BASE.map((item) => mergeServiceCopy(item, language));
}

/** @deprecated use getBusinessServiceRequestCatalog(language) */
export const BUSINESS_SERVICE_REQUEST_CATALOG = getBusinessServiceRequestCatalog('vi');

export function getServiceByKey(key, language = 'vi') {
  return getBusinessServiceRequestCatalog(language).find((s) => s.key === key) || null;
}
