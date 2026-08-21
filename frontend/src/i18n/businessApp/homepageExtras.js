/** Homepage solution cards & sample news */

const solutionCardsVi = [
  {
    num: '01',
    tagId: 'direct-scout',
    title: 'Scout Trực Tiếp',
    subtitle: 'Tự chủ tìm kiếm ứng viên',
    variant: 'brandLight',
    painPoint: 'Khó tìm đủ ứng viên phù hợp trong thời gian ngắn',
    solution: 'Tự tìm kiếm và tiếp cận ứng viên từ kho hồ sơ chất lượng',
    features: [
      'Tìm kiếm AI theo kỹ năng & vị trí',
      'Xem hồ sơ ẩn danh trước khi unlock',
      'Chủ động chat & tiếp cận ứng viên',
    ],
    suitableFor: 'Doanh nghiệp chủ động tìm ứng viên',
    path: '/business/scout/direct',
  },
  {
    num: '02',
    tagId: 'managed-scout',
    title: 'Scout Ủy Thác',
    subtitle: 'WS hỗ trợ tìm & tiếp cận',
    variant: 'neutral',
    painPoint: 'Bận rộn, thiếu thời gian sàng lọc và tiếp cận ứng viên',
    solution: 'Workstation tìm kiếm, đánh giá và tiếp cận ứng viên thay bạn',
    features: [
      'WS chủ động tìm & gửi ứng viên theo JD',
      'WS trao đổi điều kiện & sắp xếp phỏng vấn',
      'Báo cáo tiến độ minh bạch thường xuyên',
    ],
    suitableFor: 'Doanh nghiệp bận rộn, thiếu thời gian tuyển dụng',
    path: '/business/scout/managed',
  },
  {
    num: '03',
    tagId: 'employer-branding',
    title: 'Thương hiệu Tuyển dụng',
    subtitle: 'Thương hiệu tuyển dụng',
    variant: 'primary',
    painPoint: 'Ứng viên chất lượng không biết đến thương hiệu tuyển dụng của bạn',
    solution: 'Xây dựng trang tuyển dụng chuyên nghiệp và quảng bá đa kênh',
    features: [
      'Thiết kế landing page tuyển dụng chuyên nghiệp',
      'Quản lý & đăng tin tuyển dụng đa kênh',
      'Báo cáo phân tích hiệu quả thương hiệu',
    ],
    suitableFor: 'Doanh nghiệp muốn nâng cao thương hiệu tuyển dụng',
    path: '/business/saiyo',
  },
  {
    num: '04',
    tagId: 'hr-partner-network',
    title: 'Mạng lưới Đối tác Tuyển dụng',
    subtitle: 'Mạng lưới mở rộng',
    variant: 'neutral',
    painPoint: 'Cần tuyển số lượng lớn nhưng kênh tuyển dụng hiện tại quá hẹp',
    solution: 'Mở rộng kênh qua mạng lưới CTV HR Partner trên toàn quốc',
    features: [
      'Tiếp cận mạng lưới CTV HR Partner rộng khắp',
      'Nhận ứng viên đề cử chất lượng theo job',
      'Thanh toán theo kết quả ứng viên đạt yêu cầu',
    ],
    suitableFor: 'Doanh nghiệp tuyển số lượng lớn hoặc mở rộng kênh nhanh',
    path: '/business/candidate-sharing',
  },
];

const solutionCardsEn = [
  {
    num: '01',
    tagId: 'direct-scout',
    title: 'Direct Scout',
    subtitle: 'Self-service candidate search',
    variant: 'brandLight',
    painPoint: 'Hard to find enough qualified candidates quickly',
    solution: 'Search and reach candidates from a quality talent pool',
    features: [
      'AI search by skills & role',
      'Preview anonymous profiles before unlock',
      'Proactively chat & engage candidates',
    ],
    suitableFor: 'Companies that actively source candidates',
    path: '/business/scout/direct',
  },
  {
    num: '02',
    tagId: 'managed-scout',
    title: 'Managed Scout',
    subtitle: 'WS handles search & outreach',
    variant: 'neutral',
    painPoint: 'Too busy to screen and reach out to candidates',
    solution: 'Work Station finds, evaluates, and engages candidates for you',
    features: [
      'WS proactively finds & sends candidates per JD',
      'WS negotiates terms & schedules interviews',
      'Regular transparent progress reports',
    ],
    suitableFor: 'Busy teams with limited hiring bandwidth',
    path: '/business/scout/managed',
  },
  {
    num: '03',
    tagId: 'employer-branding',
    title: 'Employer Branding',
    subtitle: 'Build your hiring brand',
    variant: 'primary',
    painPoint: 'Quality candidates do not know your employer brand',
    solution: 'Build a professional careers page and promote across channels',
    features: [
      'Professional careers landing page',
      'Multi-channel job posting management',
      'Brand performance analytics',
    ],
    suitableFor: 'Companies strengthening employer brand',
    path: '/business/saiyo',
  },
  {
    num: '04',
    tagId: 'hr-partner-network',
    title: 'HR Partner Network',
    subtitle: 'Expand your channels',
    variant: 'neutral',
    painPoint: 'Need volume hiring but current channels are too narrow',
    solution: 'Expand via nationwide CTV HR Partner network',
    features: [
      'Access a broad CTV HR Partner network',
      'Receive quality referrals per job',
      'Pay for successful candidate outcomes',
    ],
    suitableFor: 'High-volume or fast channel expansion hiring',
    path: '/business/candidate-sharing',
  },
];

const solutionCardsJa = [
  {
    num: '01',
    tagId: 'direct-scout',
    title: 'ダイレクトスカウト',
    subtitle: '自社で候補者を探索',
    variant: 'brandLight',
    painPoint: '短期間で十分な候補者を見つけにくい',
    solution: '質の高い候補者DBから自社で検索・接触',
    features: [
      'スキル・職種に基づくAI検索',
      'アンロック前に匿名プロフィールを確認',
      '能動的にチャット・スカウト',
    ],
    suitableFor: '自社で候補者探索する企業',
    path: '/business/scout/direct',
  },
  {
    num: '02',
    tagId: 'managed-scout',
    title: '委託スカウト',
    subtitle: 'WSが探索・接触を代行',
    variant: 'neutral',
    painPoint: '選考・接触の時間が足りない',
    solution: 'Work Stationが候補者の探索・評価・接触を代行',
    features: [
      'WSがJDに合う候補者を能動的に提案',
      'WSが条件調整・面接設定',
      '定期的な透明な進捗レポート',
    ],
    suitableFor: '採用リソースが限られる企業',
    path: '/business/scout/managed',
  },
  {
    num: '03',
    tagId: 'employer-branding',
    title: '採用ブランディング',
    subtitle: '採用ブランドを構築',
    variant: 'primary',
    painPoint: '優秀な候補者に自社の採用ブランドが知られていない',
    solution: 'プロの採用ページを構築し多チャネルで発信',
    features: [
      'プロ品質の採用LP',
      'マルチチャネル求人管理',
      'ブランド効果分析レポート',
    ],
    suitableFor: '採用ブランド強化を目指す企業',
    path: '/business/saiyo',
  },
  {
    num: '04',
    tagId: 'hr-partner-network',
    title: 'HRパートナーネットワーク',
    subtitle: 'チャネル拡大',
    variant: 'neutral',
    painPoint: '大量採用が必要だが既存チャネルが限定的',
    solution: '全国のCTV HRパートナーネットワークでチャネル拡大',
    features: [
      '広範なCTV HRパートナーにアクセス',
      '求人ごとに質の高い推薦を受領',
      '成果に応じた支払い',
    ],
    suitableFor: '大量採用・迅速なチャネル拡大',
    path: '/business/candidate-sharing',
  },
];

const newsVi = [
  {
    title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024',
    date: '20/05/2024',
    img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
  },
  {
    title: '5 cách thu hút ứng viên kỹ thuật hiệu quả',
    date: '18/05/2024',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop',
  },
];

const newsEn = [
  {
    title: 'Japan IT Labor Market Report Q2/2024',
    date: '20/05/2024',
    img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
  },
  {
    title: '5 ways to attract technical candidates effectively',
    date: '18/05/2024',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop',
  },
];

const newsJa = [
  {
    title: '日本IT労働市場レポート 2024年Q2',
    date: '20/05/2024',
    img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
  },
  {
    title: '技術候補者を効果的に惹きつける5つの方法',
    date: '18/05/2024',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop',
  },
];

export const homepageExtrasI18n = {
  vi: { solutionCards: solutionCardsVi, news: newsVi },
  en: { solutionCards: solutionCardsEn, news: newsEn },
  ja: { solutionCards: solutionCardsJa, news: newsJa },
};
