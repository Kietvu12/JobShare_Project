/** Shared navbar links for JobShare Business landing (header, footer, hamburger). */
export const NAV_BASE = '/landing/business';

export const NAV_ITEMS = [
  {
    jp: 'JobShare Businessとは',
    en: 'About',
    href: `${NAV_BASE}/about`,
    headerTarget: ' target="_top"',
  },
  {
    jp: '各サービス',
    en: 'Services',
    href: `${NAV_BASE}/services`,
    headerTarget: ' target="_top"',
  },
  {
    jp: 'セミナー・イベント',
    en: 'Seminar・Event',
    href: `${NAV_BASE}/seminar`,
    headerTarget: ' target="_top"',
  },
  {
    jp: 'ニュース',
    en: 'News',
    href: `${NAV_BASE}/news`,
    headerTarget: ' target="_top"',
  },
  {
    jp: '会社概要',
    en: 'Company',
    href: `${NAV_BASE}/about-us`,
    headerTarget: ' target="_top"',
  },
];

export const SUBPAGE_SOURCES = [
  { outFile: 'about.html', sourceFile: 'about.html', page: 'about' },
  { outFile: 'services.html', sourceFile: 'services.html', page: 'services' },
  { outFile: 'seminar.html', sourceFile: 'seminar.html', page: 'seminar' },
  { outFile: 'news.html', sourceFile: 'news.html', page: 'news' },
  { outFile: 'news-detail.html', sourceFile: 'news-detail.html', page: 'news-detail' },
];
