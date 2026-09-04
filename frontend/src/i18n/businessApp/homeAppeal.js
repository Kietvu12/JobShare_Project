export const homeAppealI18n = {
  vi: {
    titleLines: ['Mọi công cụ tuyển dụng nhân tài quốc tế,', 'tập trung trên một nền tảng.'],
    desc:
      'JobShare Business giúp doanh nghiệp tuyển kỹ sư và chuyên gia nước ngoài trên một hệ thống — từ đăng tin, tìm ứng viên, scout đến ủy thác tuyển dụng và employer branding. Chọn dịch vụ phù hợp quy mô và nhu cầu của bạn.',
    cta: 'Tư vấn tuyển dụng quốc tế',
    videoAlt: 'Video giới thiệu JobShare Business',
    videoBadge: 'Đang phát',
  },
  en: {
    titleLines: ['Everything for foreign hiring,', 'unified on one platform.'],
    desc:
      'JobShare Business helps companies hire foreign engineers and specialists — job posting, search, scouting, RPO, and employer branding in one place. Choose the services that fit your team and goals.',
    cta: 'Talk to us about hiring',
    videoAlt: 'JobShare Business intro video',
    videoBadge: 'Now playing',
  },
  ja: {
    titleLines: ['外国人材採用に必要なすべてを、', 'ひとつのプラットフォームに。'],
    alwaysBreakAfter: [0],
    desc:
      'JobShare Businessは、外国人高度人材の採用に必要な機能とサービスを一元化した、企業向け採用支援プラットフォームです。AIによる求人票作成、候補者検索・マッチング、スカウト、採用支援、採用ブランディング、採用パートナーネットワークまで、採用活動を一つの画面から進められます。企業ごとの採用課題や社内体制に合わせて、必要な機能・サービスだけを選択して利用できます。',
    cta: '外国人材採用について相談する',
    videoAlt: 'JobShare Business 紹介動画',
    videoBadge: 'CM放映中',
  },
}

export function getHomeAppealCopy(language) {
  return homeAppealI18n[language] || homeAppealI18n.vi
}
