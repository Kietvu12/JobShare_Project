export const homeConversionI18n = {
  vi: {
    subText: 'Tuyển kỹ sư nước ngoài — đơn giản hơn.',
    mainTitleLines: [
      'JobShare Business đồng hành từ',
      'tìm người giỏi đến tuyển thành công.',
    ],
    cta: 'Tư vấn miễn phí',
    partnerLink: 'Dành cho doanh nghiệp đối tác',
    imageAlt: 'JobShare Business hỗ trợ tuyển dụng',
  },
  en: {
    subText: 'Foreign engineer hiring — made simpler.',
    mainTitleLines: [
      'JobShare Business supports you',
      'from great matches to successful hires.',
    ],
    cta: 'Free consultation',
    partnerLink: 'For business partners',
    imageAlt: 'JobShare Business hiring support',
  },
  ja: {
    subText: '外国人エンジニア採用を、もっとシンプルに。',
    mainTitleLines: [
      'JobShare Businessは、優秀な人材との出会いから、',
      '採用成功までを一気通貫でサポートします。',
    ],
    cta: '無料相談はこちら!',
    partnerLink: '受注企業様はこちら',
    imageAlt: 'JobShare Business 採用支援',
  },
}

export function getHomeConversionCopy(language) {
  return homeConversionI18n[language] || homeConversionI18n.vi
}
