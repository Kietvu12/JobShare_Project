import heroBadgeVi from '../../assets/template_business/hero_icon_VN.png'
import heroBadgeEn from '../../assets/template_business/hero_icon_eng.png'
import heroBadgeJa from '../../assets/template_business/hero_icon_JP.png'

export const homeVisualBadgeImages = {
  vi: heroBadgeVi,
  en: heroBadgeEn,
  ja: heroBadgeJa,
}

export const homeVisualI18n = {
  vi: {
    subText: 'Nền tảng tuyển dụng nhân tài quốc tế',
    mainTitleLines: ['Tuyển người giỏi từ nước ngoài', 'linh hoạt và hiệu quả hơn'],
    descLines: [
      'JobShare Business giúp doanh nghiệp tuyển kỹ sư và chuyên gia nước ngoài.',
      'Đăng tin, tìm ứng viên, scout hay ủy thác tuyển dụng — chọn cách phù hợp với bạn.',
    ],
    btnDownloadLines: ['Tải tài liệu'],
    btnRegisterLines: ['Đăng ký miễn phí'],
    btnConsultLines: ['Tư vấn tuyển dụng'],
    heroAlt: 'Bảng điều khiển JobShare Business',
    badgeAlt: '40.000+ hồ sơ kỹ thuật, 500+ đối tác HR, nền tảng AI tuyển dụng đầu tiên Đông Nam Á',
    caption: 'Số liệu tham khảo đến 6/2026.',
  },
  en: {
    subText: 'Foreign high-skilled talent hiring platform',
    mainTitleLines: ['Recruit high-skilled foreign talent,', 'more freely. More reliably.'],
    descLines: [
      'JobShare Business helps companies hire foreign engineers and highly skilled professionals.',
      'Post jobs, search candidates, scout, outsource hiring, or work with partners — choose what fits your needs.',
    ],
    btnDownloadLines: ['Download', 'brochure'],
    btnRegisterLines: ['Register for', 'free'],
    btnConsultLines: ['Book a', 'consultation'],
    heroAlt: 'JobShare Business dashboard',
    badgeAlt:
      '40,000+ technical talent profiles, 500+ HR partners, Southeast Asia\'s first AI recruitment platform',
    caption: '*Based on JobShare data as of June 2026.',
  },
  ja: {
    subText: '外国人高度人材採用プラットフォーム',
    mainTitleLines: ['外国人高度人材の採用を、', 'もっと自由に。もっと確実に。'],
    descLines: [
      'JobShare Businessは、',
      '外国人エンジニア・高度人材の採用を支援する',
      '企業向け採用プラットフォームです。',
      '求人作成、候補者検索、スカウト、採用代行、採用広報、採用パートナー連携まで、',
      '採用課題に合った方法を選択できます。',
    ],
    descMobileSplitAt: {
      3: ['求人作成、候補者検索、スカウト、採用代行、', '採用広報、採用パートナー連携まで、'],
    },
    btnDownloadLines: ['サービス資料を', 'ダウンロード'],
    btnRegisterLines: ['無料で', '企業登録する'],
    btnConsultLines: ['採用について', '相談する'],
    heroAlt: 'JobShare Business ダッシュボード',
    badgeAlt:
      '技術系外国人材データベース40,000+ HRパートナーネットワーク500+ 東南アジア初AI外国人採用プラットフォーム',
    caption: '※掲載数値は、2026年6月時点におけるJobShareの運営実績および登録データをもとに算出しています。',
  },
}

export function getHomeVisualCopy(language) {
  return homeVisualI18n[language] || homeVisualI18n.vi
}

export function getHomeVisualBadgeImage(language) {
  return homeVisualBadgeImages[language] || homeVisualBadgeImages.vi
}
