/** Meta SEO cho landing /{lang}/business (chỉ dùng bởi useLandingSeo). */
const SITE = 'https://ws-jobshare.com'

export const OG_LOCALE = { vi: 'vi_VN', en: 'en_US', ja: 'ja_JP' }

export const landingSeoI18n = {
  vi: {
    title: 'JobShare Business | Nền tảng tuyển dụng kỹ sư & nhân sự nước ngoài cho doanh nghiệp Nhật Bản',
    description:
      'JobShare Business giúp doanh nghiệp tuyển kỹ sư và chuyên gia nước ngoài trên một nền tảng: đăng tin, tìm ứng viên, scout, ủy thác tuyển dụng và thương hiệu tuyển dụng.',
  },
  en: {
    title: 'JobShare Business | Foreign Engineer & Talent Hiring Platform for Companies in Japan',
    description:
      'JobShare Business helps companies hire foreign engineers and specialists in one place: job posting, candidate search, scouting, managed recruiting, Collaborator marketplace and employer branding.',
  },
  ja: {
    title: 'JobShare Business | 外国人エンジニア・高度人材の採用支援プラットフォーム',
    description:
      'JobShare Businessは、外国人エンジニア・高度人材の採用を一つに。求人作成、候補者検索、スカウト、おまかせスカウト、採用パートナーマーケット、採用ブランディングまで企業の採用課題に合わせてご利用いただけます。',
  },
}

export function buildLandingSeoUrl(locale, subPath = '') {
  const rest = subPath && subPath !== '/' ? subPath.replace(/\/+$/, '') : ''
  return `${SITE}/${locale}/business${rest}`
}
