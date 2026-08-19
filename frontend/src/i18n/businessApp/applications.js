/** Job applications page strings */

export const applicationsI18n = {
  vi: {
    title: 'Quản lý tiến cử',
    subtitle: 'Theo dõi đơn tiến cử vào JD của doanh nghiệp từ Scout Credit, Sàn CTV và các nguồn khác',
    tabs: {
      all: 'Tất cả',
      ws_ctv: 'Tiến cử (WS/CTV)',
      scout_credit: 'Scout Credit',
      hired: 'Đã tuyển dụng',
      rejected: 'Không phù hợp',
      other: 'Khác',
    },
    stats: {
      total: 'Tổng ứng viên vào JD',
      wsCtv: 'Tiến cử (WS/CTV, Sàn CTV)',
      scoutCredit: 'Scout Credit',
      hired: 'Đã tuyển dụng',
      pipeline: 'Đang xử lý',
    },
    stageLabels: {
      processing: 'Đang xử lý',
      interview: 'Phỏng vấn',
      waiting: 'Chờ kết quả',
      success: 'Thành công',
      rejected: 'Không phù hợp',
      cancelled: 'Đã hủy',
    },
    kanban: {
      new: 'Mới',
      screening: 'Sàng lọc',
      shortlist: 'Shortlist',
      interview: 'Phỏng vấn',
      offer: 'Offer',
      hired: 'Đã tuyển',
    },
    sources: {
      all: 'Nguồn: Tất cả',
      ctv_marketplace: 'Sàn CTV',
      ctv_nomination: 'Tiến cử CTV',
      scout_performance: 'Scout Performance',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'Khác',
    },
    filters: {
      searchPlaceholder: 'Tìm ứng viên, JD...',
      allJobs: 'JD: Tất cả',
      allStatus: 'Trạng thái: Tất cả',
    },
    view: {
      list: 'Danh sách',
      kanban: 'Kanban pipeline',
    },
    loading: 'Đang tải đơn tiến cử...',
    empty: 'Chưa có đơn tiến cử phù hợp',
    sidebar: {
      notifications: 'Thông báo gần đây',
      pipeline: 'Pipeline theo giai đoạn',
      noNotifications: 'Không có thông báo mới',
      noData: 'Chưa có dữ liệu',
      noActivity: 'Chưa có hoạt động',
      sourceRatio: 'Tỷ lệ nguồn ứng viên',
      statusBreakdown: 'Trạng thái tiến cử',
      recentActivity: 'Hoạt động gần đây',
      total: 'Tổng',
    },
    table: {
      candidate: 'Ứng viên',
      job: 'JD / Vị trí',
      source: 'Nguồn',
      nominatedBy: 'Tiến cử bởi',
      status: 'Trạng thái',
      appliedAt: 'Ngày tiến cử',
    },
    kanbanUpdating: 'Đang cập nhật...',
    nominatedBy: {
      business: 'Doanh nghiệp',
      wsAdmin: 'WS Admin',
      selfApplied: 'Ứng viên tự ứng tuyển',
    },
    pagination: {
      showing: (start, end, total) => `${start} - ${end} / ${total} tiến cử`,
    },
    unreadMessages: (n) => `${n} tin mới`,
  },
  en: {
    title: 'Application management',
    subtitle: 'Track nominations to your JDs from Scout Credit, CTV Marketplace, and other sources',
    tabs: {
      all: 'All',
      ws_ctv: 'Referrals (WS/CTV)',
      scout_credit: 'Scout Credit',
      hired: 'Hired',
      rejected: 'Not a fit',
      other: 'Other',
    },
    stats: {
      total: 'Total candidates on JDs',
      wsCtv: 'Referrals (WS/CTV, Marketplace)',
      scoutCredit: 'Scout Credit',
      hired: 'Hired',
      pipeline: 'In pipeline',
    },
    stageLabels: {
      processing: 'In progress',
      interview: 'Interview',
      waiting: 'Awaiting result',
      success: 'Success',
      rejected: 'Not a fit',
      cancelled: 'Cancelled',
    },
    kanban: {
      new: 'New',
      screening: 'Screening',
      shortlist: 'Shortlist',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
    },
    sources: {
      all: 'Source: All',
      ctv_marketplace: 'CTV Marketplace',
      ctv_nomination: 'CTV referral',
      scout_performance: 'Scout Performance',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'Other',
    },
    filters: {
      searchPlaceholder: 'Search candidate, JD...',
      allJobs: 'JD: All',
      allStatus: 'Status: All',
    },
    view: {
      list: 'List',
      kanban: 'Kanban pipeline',
    },
    loading: 'Loading applications...',
    empty: 'No matching applications',
    sidebar: {
      notifications: 'Recent notifications',
      pipeline: 'Pipeline by stage',
      noNotifications: 'No new notifications',
      noData: 'No data yet',
      noActivity: 'No activity yet',
      sourceRatio: 'Candidate source mix',
      statusBreakdown: 'Application status',
      recentActivity: 'Recent activity',
      total: 'Total',
    },
    table: {
      candidate: 'Candidate',
      job: 'JD / Role',
      source: 'Source',
      nominatedBy: 'Nominated by',
      status: 'Status',
      appliedAt: 'Applied',
    },
    kanbanUpdating: 'Updating...',
    nominatedBy: {
      business: 'Business',
      wsAdmin: 'WS Admin',
      selfApplied: 'Self-applied',
    },
    pagination: {
      showing: (start, end, total) => `${start} - ${end} / ${total} applications`,
    },
    unreadMessages: (n) => `${n} new message${n === 1 ? '' : 's'}`,
  },
  ja: {
    title: '推薦管理',
    subtitle: 'Scout Credit、CTVマーケットなど各ソースからのJD推薦を追跡',
    tabs: {
      all: 'すべて',
      ws_ctv: '推薦（WS/CTV）',
      scout_credit: 'Scout Credit',
      hired: '採用済み',
      rejected: '不適合',
      other: 'その他',
    },
    stats: {
      total: 'JDへの候補者合計',
      wsCtv: '推薦（WS/CTV、マーケット）',
      scoutCredit: 'Scout Credit',
      hired: '採用済み',
      pipeline: '処理中',
    },
    stageLabels: {
      processing: '処理中',
      interview: '面接',
      waiting: '結果待ち',
      success: '成功',
      rejected: '不適合',
      cancelled: 'キャンセル',
    },
    kanban: {
      new: '新規',
      screening: '選考',
      shortlist: 'Shortlist',
      interview: '面接',
      offer: 'Offer',
      hired: '採用',
    },
    sources: {
      all: 'ソース: すべて',
      ctv_marketplace: 'CTVマーケット',
      ctv_nomination: 'CTV推薦',
      scout_performance: 'Scout Performance',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'その他',
    },
    filters: {
      searchPlaceholder: '候補者、JDを検索...',
      allJobs: 'JD: すべて',
      allStatus: 'ステータス: すべて',
    },
    view: {
      list: 'リスト',
      kanban: 'Kanban pipeline',
    },
    loading: '推薦を読み込み中...',
    empty: '該当する推薦がありません',
    sidebar: {
      notifications: '最近の通知',
      pipeline: 'ステージ別パイプライン',
      noNotifications: '新しい通知はありません',
      noData: 'データがありません',
      noActivity: 'アクティビティがありません',
      sourceRatio: '候補者ソース比率',
      statusBreakdown: '推薦ステータス',
      recentActivity: '最近のアクティビティ',
      total: '合計',
    },
    table: {
      candidate: '候補者',
      job: 'JD / ポジション',
      source: 'ソース',
      nominatedBy: '推薦者',
      status: 'ステータス',
      appliedAt: '推薦日',
    },
    kanbanUpdating: '更新中...',
    nominatedBy: {
      business: '企業',
      wsAdmin: 'WS Admin',
      selfApplied: '本人応募',
    },
    pagination: {
      showing: (start, end, total) => `${start} - ${end} / ${total} 件`,
    },
    unreadMessages: (n) => `新着 ${n} 件`,
  },
};

export function getApplicationTabs(language) {
  const t = applicationsI18n[language]?.tabs || applicationsI18n.vi.tabs;
  return [
    { key: 'all', label: t.all },
    { key: 'ws_ctv', label: t.ws_ctv },
    { key: 'scout_credit', label: t.scout_credit },
    { key: 'hired', label: t.hired },
    { key: 'rejected', label: t.rejected },
    { key: 'other', label: t.other },
  ];
}

export function getApplicationSourceOptions(language) {
  const s = applicationsI18n[language]?.sources || applicationsI18n.vi.sources;
  return [
    { value: '', label: s.all },
    { value: 'ctv_marketplace', label: s.ctv_marketplace },
    { value: 'ctv_nomination', label: s.ctv_nomination },
    { value: 'scout_performance', label: s.scout_performance },
    { value: 'scout_credit', label: s.scout_credit },
    { value: 'landing', label: s.landing },
    { value: 'other', label: s.other },
  ];
}

export function getKanbanColumns(language) {
  const k = applicationsI18n[language]?.kanban || applicationsI18n.vi.kanban;
  return [
    { id: 'new', label: k.new, defaultStatus: 2, statuses: [2] },
    { id: 'screening', label: k.screening, defaultStatus: 3, statuses: [3] },
    { id: 'shortlist', label: k.shortlist, defaultStatus: 5, statuses: [5] },
    { id: 'interview', label: k.interview, defaultStatus: 8, statuses: [7, 8, 9] },
    { id: 'offer', label: k.offer, defaultStatus: 11, statuses: [11, 12] },
    { id: 'hired', label: k.hired, defaultStatus: 14, statuses: [14, 15] },
  ];
}

export function getApplicationStageLabels(language) {
  return applicationsI18n[language]?.stageLabels || applicationsI18n.vi.stageLabels;
}

export function getApplicationSourceLabel(sourceType, language = 'vi') {
  const s = applicationsI18n[language]?.sources || applicationsI18n.vi.sources;
  return s[sourceType] || s.other;
}
