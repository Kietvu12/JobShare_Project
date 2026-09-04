export const homeCorporationI18n = {
  vi: {
    titleLines: [
      'Hỗ trợ tuyển nhân tài quốc tế trong cơ khí, điện tử, IT, xây dựng và nhiều lĩnh vực khác.',
      'Gợi ý ứng viên phù hợp với nhu cầu tuyển dụng của doanh nghiệp bạn.',
    ],
  },
  en: {
    titleLines: [
      'High-skilled foreign talent across machinery, electronics, IT, architecture, and more.',
      'We propose candidates matched to your hiring needs.',
    ],
  },
  ja: {
    titleLines: [
      '機械・電気電子・IT・建築など、',
      '幅広い分野の外国人高度人材に対応。',
      '企業ごとの採用ニーズに合った',
      '人材をご提案します。',
    ],
    mobileBreakAfter: [0, 2],
    alwaysBreakAfter: [1],
  },
}

export function getHomeCorporationCopy(language) {
  return homeCorporationI18n[language] || homeCorporationI18n.vi
}
