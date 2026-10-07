/** Business Report & Insights — VI / EN / JA */
import { formatYenAmount } from '../../utils/businessCreditPackages.js';

function resolveLang(language) {
  if (language === 'en' || language === 'ja') return language;
  return 'vi';
}

const SERIES_COLORS = {
  jd: { color: '#0077B6', gradientId: 'insights-area-jd' },
  tiencu: { color: '#38bdf8', gradientId: 'insights-area-tiencu' },
  phongvan: { color: '#0ea5e9', gradientId: 'insights-area-phongvan' },
  tuyendung: { color: '#0284c7', gradientId: 'insights-area-hire' },
};

export const insightsI18n = {
  vi: {
    pageTitle: 'Report & insight',
    loadError: 'Không tải được báo cáo',
    loading: 'Đang tải báo cáo...',
    retry: 'Thử lại',
    allDepartments: 'Tất cả phòng ban',
    customReports: 'Báo cáo tùy chỉnh',
    exportReport: 'Xuất báo cáo',
    periodWeek: 'Tuần',
    periodMonth: 'Tháng',
    periodYear: 'Năm',
    vsPrevious: (n) => `${n >= 0 ? '+' : ''}${n}% so với kỳ trước`,
    vsPreviousDays: (n) => `${Math.abs(n)} ngày so với kỳ trước`,
    vsPreviousPctPoints: (n) => `${Math.abs(n)}% so với kỳ trước`,
    daysUnit: (n) => `${n} ngày`,
    kpiTotalJobs: 'Tổng JD đã đăng',
    kpiTotalNominations: 'Tổng tiến cử nhận được',
    kpiInterviews: 'Ứng viên vào vòng phỏng vấn',
    kpiHired: 'Tuyển thành công',
    kpiRecruitmentCost: 'Chi phí tuyển dụng',
    costPerHireHint: (v) => `${v} / lượt tuyển`,
    estimatedTag: 'ước tính',
    serviceFilterAria: 'Lọc theo dịch vụ',
    services: {
      all: 'Tất cả dịch vụ',
      scout_credit: 'Scout Trực Tiếp',
      scout_performance: 'Scout Ủy Thác',
      ctv_marketplace: 'Sàn CTV',
    },
    serviceFilteredNote: (label) => `Toàn bộ số liệu bên dưới chỉ tính riêng cho ${label}.`,
    serviceClearFilter: 'Xem tất cả dịch vụ',
    compareTitle: 'So sánh hiệu quả theo dịch vụ',
    compareSubtitle: 'Kết quả tuyển dụng và chi phí bỏ ra của từng kênh trong kỳ đang xem — để quyết định rót ngân sách vào đâu.',
    compareColService: 'Dịch vụ',
    compareColJobs: 'JD sử dụng',
    compareColNominations: 'Tiến cử',
    compareColInterviews: 'Phỏng vấn',
    compareColHires: 'Tuyển thành công',
    compareColHireRate: 'Tỷ lệ tuyển',
    compareColCost: 'Chi phí',
    compareColCostPerHire: 'Chi phí / lượt tuyển',
    compareColShare: 'Tỷ trọng tuyển / chi phí',
    compareViewOnly: 'Xem riêng',
    compareBestCost: 'Chi phí/tuyển thấp nhất',
    compareBestRate: 'Tỷ lệ tuyển cao nhất',
    compareNoHire: 'Chưa có lượt tuyển',
    compareEmpty: 'Chưa có dữ liệu dịch vụ trong kỳ này.',
    compareCostNote: (a) =>
      `Cách tính chi phí: Scout Trực Tiếp = credit đã dùng để mở hồ sơ × ${a.scoutCreditYenPerCredit} yên/credit (giá gói Basic). `
      + `Sàn CTV = khoản đã quyết toán; lượt tuyển chưa quyết toán ước tính theo mức phí DN đặt trên tin (đã gồm ${a.marketplacePlatformFeePercent}% phí sàn). `
      + `Scout Ủy Thác = ước tính ${a.scoutPerformanceFeePercent}% thu nhập năm của ứng viên tuyển thành công (biểu phí 15–25%).`,
    chartOverview: 'Hiệu quả tuyển dụng tổng quan',
    chartConversion: 'Tỷ lệ chuyển đổi tuyển dụng',
    conversionOverall: 'Tỷ lệ chung',
    highlightsTitle: 'Insight nổi bật',
    highlightsEmpty: 'Chưa có insight cho kỳ này.',
    detailAnalysis: 'Phân tích chi tiết',
    tabDept: 'Theo phòng ban',
    tabSource: 'Nguồn ứng viên',
    tabTime: 'Thời gian tuyển dụng',
    tabPositions: 'Top vị trí',
    tabJd: 'Hiệu quả theo JD',
    emptyDept: 'Chưa có dữ liệu theo phòng ban',
    emptySource: 'Chưa có dữ liệu nguồn',
    avgTimeToHire: 'Thời gian tuyển dụng trung bình',
    chartDays: 'Số ngày',
    barHires: 'Tuyển thành công',
    tablePosition: 'Vị trí',
    tableConversion: 'Chuyển đổi',
    tableHires: 'Tuyển',
    tableTrend: 'Xu hướng',
    tableEmpty: 'Chưa có dữ liệu',
    tableJd: 'JD',
    tableDepartment: 'Phòng ban',
    tableNomination: 'Tiến cử',
    tableInterview: 'PV',
    tableRate: 'Tỷ lệ',
    tableStatus: 'Trạng thái',
    emptyJd: 'Chưa có JD',
    ariaKpi: 'KPI tổng quan',
    ariaCharts: 'Biểu đồ tổng quan',
    ariaDetail: 'Phân tích chi tiết',
    series: {
      jd: 'JD đã đăng',
      tiencu: 'Tiến cử nhận được',
      phongvan: 'Vào phỏng vấn',
      tuyendung: 'Tuyển thành công',
    },
    funnel: {
      jd: 'JD đã đăng',
      tiencu: 'Tiến cử nhận được',
      phongvan: 'Vào phỏng vấn',
      tuyendung: 'Tuyển thành công',
    },
    jobStatus: {
      open: 'Đang tuyển',
      paused: 'Tạm dừng',
      closed: 'Đã đóng',
      unknown: 'Không xác định',
    },
    deptOther: 'Khác',
  },
  en: {
    pageTitle: 'Reports & insights',
    loadError: 'Could not load the report',
    loading: 'Loading report...',
    retry: 'Try again',
    allDepartments: 'All departments',
    customReports: 'Custom reports',
    exportReport: 'Export report',
    periodWeek: 'Week',
    periodMonth: 'Month',
    periodYear: 'Year',
    vsPrevious: (n) => `${n >= 0 ? '+' : ''}${n}% vs previous period`,
    vsPreviousDays: (n) => `${Math.abs(n)} days vs previous period`,
    vsPreviousPctPoints: (n) => `${Math.abs(n)}% vs previous period`,
    daysUnit: (n) => `${n} days`,
    kpiTotalJobs: 'Job posts published',
    kpiTotalNominations: 'Nominations received',
    kpiInterviews: 'Candidates interviewed',
    kpiHired: 'Successful hires',
    kpiRecruitmentCost: 'Recruitment cost',
    costPerHireHint: (v) => `${v} per hire`,
    estimatedTag: 'estimated',
    serviceFilterAria: 'Filter by service',
    services: {
      all: 'All services',
      scout_credit: 'Direct Scout',
      scout_performance: 'Omakase Scout',
      ctv_marketplace: 'Collaborator Marketplace',
    },
    serviceFilteredNote: (label) => `All figures below are for ${label} only.`,
    serviceClearFilter: 'View all services',
    compareTitle: 'Performance by service',
    compareSubtitle: 'Hiring results and spend for each channel in this period — to decide where to put your budget next.',
    compareColService: 'Service',
    compareColJobs: 'Job posts',
    compareColNominations: 'Nominations',
    compareColInterviews: 'Interviews',
    compareColHires: 'Hires',
    compareColHireRate: 'Hire rate',
    compareColCost: 'Cost',
    compareColCostPerHire: 'Cost per hire',
    compareColShare: 'Share of hires / cost',
    compareViewOnly: 'View only',
    compareBestCost: 'Lowest cost per hire',
    compareBestRate: 'Highest hire rate',
    compareNoHire: 'No hires yet',
    compareEmpty: 'No service data for this period yet.',
    compareCostNote: (a) =>
      `How cost is calculated: Direct Scout = credits spent on profile unlocks × ${a.scoutCreditYenPerCredit} yen/credit (Basic package price). `
      + `Collaborator Marketplace = settled amounts; unsettled hires are estimated from the fee set on the listing (including the ${a.marketplacePlatformFeePercent}% platform fee). `
      + `Omakase Scout = estimated at ${a.scoutPerformanceFeePercent}% of the hired candidate's annual income (fee range 15–25%).`,
    chartOverview: 'Overall recruitment performance',
    chartConversion: 'Recruitment conversion funnel',
    conversionOverall: 'Overall rate',
    highlightsTitle: 'Key insights',
    highlightsEmpty: 'No insights for this period yet.',
    detailAnalysis: 'Detailed analysis',
    tabDept: 'By department',
    tabSource: 'Candidate sources',
    tabTime: 'Time to hire',
    tabPositions: 'Top roles',
    tabJd: 'Performance by JD',
    emptyDept: 'No department data yet',
    emptySource: 'No source data yet',
    avgTimeToHire: 'Average time to hire',
    chartDays: 'Days',
    barHires: 'Successful hires',
    tablePosition: 'Role',
    tableConversion: 'Conversion',
    tableHires: 'Hires',
    tableTrend: 'Trend',
    tableEmpty: 'No data yet',
    tableJd: 'JD',
    tableDepartment: 'Department',
    tableNomination: 'Nominations',
    tableInterview: 'Interviews',
    tableRate: 'Rate',
    tableStatus: 'Status',
    emptyJd: 'No job posts yet',
    ariaKpi: 'Overview KPIs',
    ariaCharts: 'Overview charts',
    ariaDetail: 'Detailed analysis',
    series: {
      jd: 'Jobs posted',
      tiencu: 'Nominations received',
      phongvan: 'Interview stage',
      tuyendung: 'Hired',
    },
    funnel: {
      jd: 'Jobs posted',
      tiencu: 'Nominations received',
      phongvan: 'Interview stage',
      tuyendung: 'Hired',
    },
    jobStatus: {
      open: 'Open',
      paused: 'Paused',
      closed: 'Closed',
      unknown: 'Unknown',
    },
    deptOther: 'Other',
  },
  ja: {
    pageTitle: 'レポート・インサイト',
    loadError: 'レポートを読み込めませんでした',
    loading: 'レポートを読み込み中...',
    retry: '再試行',
    allDepartments: '全部署',
    customReports: 'カスタムレポート',
    exportReport: 'レポートを出力',
    periodWeek: '週',
    periodMonth: '月',
    periodYear: '年',
    vsPrevious: (n) => `${n >= 0 ? '+' : ''}${n}%（前期比）`,
    vsPreviousDays: (n) => `${Math.abs(n)}日（前期比）`,
    vsPreviousPctPoints: (n) => `${Math.abs(n)}%（前期比）`,
    daysUnit: (n) => `${n}日`,
    kpiTotalJobs: '掲載JD数',
    kpiTotalNominations: '受け取った推薦数',
    kpiInterviews: '面接に進んだ候補者',
    kpiHired: '採用成功',
    kpiRecruitmentCost: '採用コスト',
    costPerHireHint: (v) => `1名あたり ${v}`,
    estimatedTag: '概算',
    serviceFilterAria: 'サービスで絞り込み',
    services: {
      all: '全サービス',
      scout_credit: 'ダイレクトスカウト',
      scout_performance: 'おまかせスカウト',
      ctv_marketplace: '採用パートナーマーケット',
    },
    serviceFilteredNote: (label) => `以下の数値はすべて「${label}」のみを集計しています。`,
    serviceClearFilter: '全サービスを表示',
    compareTitle: 'サービス別の効果比較',
    compareSubtitle: '表示期間における各チャネルの採用成果と費用。次に予算を投じる先の判断材料にご活用ください。',
    compareColService: 'サービス',
    compareColJobs: '利用JD',
    compareColNominations: '推薦',
    compareColInterviews: '面接',
    compareColHires: '採用成功',
    compareColHireRate: '採用率',
    compareColCost: '費用',
    compareColCostPerHire: '1名あたり費用',
    compareColShare: '採用 / 費用の構成比',
    compareViewOnly: '個別表示',
    compareBestCost: '1名あたり費用が最安',
    compareBestRate: '採用率が最高',
    compareNoHire: '採用実績なし',
    compareEmpty: 'この期間のサービス別データはまだありません。',
    compareCostNote: (a) =>
      `費用の算出方法：ダイレクトスカウト＝プロフィール開封に使用したクレジット × ${a.scoutCreditYenPerCredit}円/クレジット（Basicプラン価格）。`
      + `採用パートナーマーケット＝精算済み金額。未精算の採用は掲載時に設定した報酬額（プラットフォーム手数料${a.marketplacePlatformFeePercent}%込み）で概算。`
      + `おまかせスカウト＝採用者の年収 × ${a.scoutPerformanceFeePercent}%で概算（料金表15〜25%）。`,
    chartOverview: '採用パフォーマンス概要',
    chartConversion: '採用コンバージョン',
    conversionOverall: '全体率',
    highlightsTitle: '注目インサイト',
    highlightsEmpty: 'この期間のインサイトはまだありません。',
    detailAnalysis: '詳細分析',
    tabDept: '部署別',
    tabSource: '候補者ソース',
    tabTime: '採用リードタイム',
    tabPositions: 'トップポジション',
    tabJd: 'JD別効果',
    emptyDept: '部署別データがありません',
    emptySource: 'ソースデータがありません',
    avgTimeToHire: '平均採用日数',
    chartDays: '日数',
    barHires: '採用成功',
    tablePosition: 'ポジション',
    tableConversion: 'コンバージョン',
    tableHires: '採用',
    tableTrend: '推移',
    tableEmpty: 'データがありません',
    tableJd: 'JD',
    tableDepartment: '部署',
    tableNomination: '推薦',
    tableInterview: '面接',
    tableRate: '率',
    tableStatus: 'ステータス',
    emptyJd: 'JDがありません',
    ariaKpi: 'KPI概要',
    ariaCharts: '概要チャート',
    ariaDetail: '詳細分析',
    series: {
      jd: '掲載JD',
      tiencu: '推薦受付',
      phongvan: '面接',
      tuyendung: '採用成功',
    },
    funnel: {
      jd: '掲載JD',
      tiencu: '推薦受付',
      phongvan: '面接',
      tuyendung: '採用成功',
    },
    jobStatus: {
      open: '募集中',
      paused: '一時停止',
      closed: '終了',
      unknown: '不明',
    },
    deptOther: 'その他',
  },
};

export function getBusinessInsightsCopy(language = 'vi') {
  return insightsI18n[resolveLang(language)] || insightsI18n.vi;
}

export function getInsightsChartSeries(language = 'vi') {
  const copy = getBusinessInsightsCopy(language);
  return ['jd', 'tiencu', 'phongvan', 'tuyendung'].map((key) => ({
    key,
    label: copy.series[key],
    ...SERIES_COLORS[key],
  }));
}

export function getInsightsPeriodOptions(language = 'vi') {
  const copy = getBusinessInsightsCopy(language);
  return [
    { value: 'week', label: copy.periodWeek },
    { value: 'month', label: copy.periodMonth },
    { value: 'year', label: copy.periodYear },
  ];
}

const FUNNEL_ORDER = ['jd', 'tiencu', 'phongvan', 'tuyendung'];

export function localizeInsightsFunnel(funnel, language = 'vi') {
  const copy = getBusinessInsightsCopy(language);
  return (funnel || []).map((row, i) => {
    const key = row.key || FUNNEL_ORDER[i];
    return {
      ...row,
      name: key && copy.funnel[key] ? copy.funnel[key] : row.name,
    };
  });
}

export function getInsightsJobStatusLabel(statusCode, language = 'vi') {
  const copy = getBusinessInsightsCopy(language);
  const n = Number(statusCode);
  if (n === 1) return copy.jobStatus.open;
  if (n === 0) return copy.jobStatus.paused;
  if (n === 2 || n === 3) return copy.jobStatus.closed;
  return copy.jobStatus.unknown;
}

/** Map legacy Vietnamese status label from API to localized label */
const VI_STATUS_TO_CODE = {
  'Đang tuyển': 1,
  'Tạm dừng': 0,
  'Đã đóng': 2,
  'Không xác định': -1,
};

export function localizeInsightsJobStatusLabel(statusOrCode, language = 'vi') {
  if (statusOrCode != null && typeof statusOrCode === 'object' && 'statusCode' in statusOrCode) {
    return getInsightsJobStatusLabel(statusOrCode.statusCode, language);
  }
  const code = Number(statusOrCode);
  if (Number.isFinite(code) && String(statusOrCode).trim() !== '' && !VI_STATUS_TO_CODE[statusOrCode]) {
    return getInsightsJobStatusLabel(code, language);
  }
  const mapped = VI_STATUS_TO_CODE[statusOrCode];
  if (mapped !== undefined) return getInsightsJobStatusLabel(mapped === -1 ? 99 : mapped, language);
  return String(statusOrCode || getBusinessInsightsCopy(language).jobStatus.unknown);
}

export function formatInsightsRecruitmentCost(amount, language = 'vi') {
  return formatYenAmount(Math.round(Number(amount) || 0), resolveLang(language));
}

export const INSIGHTS_SERVICE_FILTERS = ['all', 'scout_credit', 'scout_performance', 'ctv_marketplace'];

export const INSIGHTS_SERVICE_COLORS = {
  scout_credit: '#3b82f6',
  scout_performance: '#f59e0b',
  ctv_marketplace: '#8b5cf6',
};

export function getInsightsServiceOptions(language = 'vi') {
  const copy = getBusinessInsightsCopy(language);
  return INSIGHTS_SERVICE_FILTERS.map((value) => ({ value, label: copy.services[value] }));
}

export function localizeInsightsDeptName(name, language = 'vi') {
  if (name === 'Khác') return getBusinessInsightsCopy(language).deptOther;
  return name;
}
