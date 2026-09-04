const PRIMARY_NAV_PATHS = ['/price', '/proposal', '/seminar', '/news', '/about-us']

/** @deprecated Use getLandingHeaderCopy() for localized labels */
const PRIMARY_NAV_LINKS = [
  { path: '/price', label: 'JobShare Businessとは', en: 'About JobShare Business' },
  { path: '/proposal', label: '各サービス', en: 'Services' },
  { path: '/seminar', label: 'セミナー・イベント', en: 'Seminar・Event' },
  { path: '/news', label: 'ニュース', en: 'News' },
  { path: '/about-us', label: '会社概要', en: 'Company Profile' },
]

export { PRIMARY_NAV_PATHS }

export const HEADER_NAV_LINKS = PRIMARY_NAV_LINKS.map(({ path, label }) => ({ path, label }))

export const MOBILE_SITEMAP_LINKS = PRIMARY_NAV_LINKS.map(({ path, label, en }) => ({
  path,
  jp: label,
  en,
}))

export const FOOTER_SITEMAP_LINKS = PRIMARY_NAV_LINKS.map(({ path, label, en }) => ({
  path,
  jp: label,
  en,
}))

export const LEGAL_LINKS = []

export const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/ReadyCrew', label: 'Facebook' },
  { href: 'https://twitter.com/readycrew1111', label: 'Twitter' },
  { href: 'https://www.instagram.com/saiyo_readycrew/', label: 'Instagram' },
  { href: 'https://note.com/rc_marketing', label: 'note' },
]

export const COMPANY_INFO = {
  name: 'フロンティア株式会社',
  address: ['〒150-6017', '東京都渋谷区恵比寿4丁目20番3号', '恵比寿ガーデンプレイスタワー17階'],
  tel: '080-9441-1975',
  hours: '10:00 〜 18:00 (平日)',
}
