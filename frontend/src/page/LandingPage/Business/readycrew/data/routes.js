export const NAV_ROUTES = [
  '/',
  '/price',
  '/results',
  '/proposal',
  '/manga',
  '/seminar',
  '/document',
  '/news',
  '/about-us',
  '/partner',
  '/inquiry_docs_rc',
  '/contact_rc',
];

export const ROUTES = [
  { path: '/', key: 'index' },
  { path: '/price', key: 'price' },
  { path: '/results', key: 'results' },
  { path: '/proposal', key: 'proposal' },
  { path: '/manga', key: 'manga' },
  { path: '/seminar', key: 'seminar' },
  { path: '/document', key: 'document' },
  { path: '/news', key: 'news' },
  { path: '/about-us', key: 'about-us' },
  { path: '/partner', key: 'partner' },
  { path: '/inquiry_docs_rc', key: 'inquiry_docs_rc' },
  { path: '/contact_rc', key: 'contact_rc' },
];

export function normalizePath(path) {
  return String(path || '').replace(/\/+$/, '') || '/';
}

export function isInternalNavPath(path) {
  const normalized = normalizePath(path);
  return NAV_ROUTES.includes(normalized);
}
