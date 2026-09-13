/** Job applications page strings */

export const applicationsI18n = {
  vi: {
    title: 'Quản lý ứng viên',
    subtitle: 'Theo dõi ứng viên theo JD từ Scout Credit, Scout Ủy Thác và Sàn CTV — cập nhật quy trình tuyển chọn',
    breadcrumb: {
      home: 'Trang chủ',
      current: 'Quản lý ứng viên',
    },
    tabs: {
      all: 'Tất cả',
      ws_ctv: 'Tiến cử (WS/CTV)',
      scout_credit: 'Scout Credit',
      hired: 'Đã tuyển dụng',
      rejected: 'Không phù hợp',
      other: 'Khác',
    },
    stats: {
      total: 'Tổng',
      processing: 'Đang xử lý',
      interview: 'Phỏng vấn',
      success: 'Thành công',
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
      ctv_nomination: 'Sàn CTV',
      scout_performance: 'Scout Ủy Thác',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'Khác',
    },
    filters: {
      searchPlaceholder: 'Tìm ứng viên, JD...',
      allJobs: 'JD: Tất cả',
      allStatus: 'Trạng thái: Tất cả',
      appliedFrom: 'Từ ngày',
      appliedTo: 'Đến ngày',
    },
    view: {
      list: 'Danh sách',
      kanban: 'Quy trình tuyển chọn',
    },
    loading: 'Đang tải danh sách ứng viên...',
    empty: 'Chưa có ứng viên phù hợp',
    sidebar: {
      notifications: 'Thông báo gần đây',
      selectionProcess: 'Quy trình tuyển chọn',
      noNotifications: 'Không có thông báo mới',
      noData: 'Chưa có dữ liệu',
      noActivity: 'Chưa có hoạt động',
      sourceRatio: 'Tỷ lệ nguồn',
      statusBreakdown: 'Trạng thái',
      recentActivity: 'Hoạt động gần đây',
      viewAllActivity: 'Xem tất cả',
      total: 'Tổng',
    },
    table: {
      candidate: 'Ứng viên',
      job: 'JD / Vị trí',
      source: 'Nguồn',
      status: 'Trạng thái',
      appliedAt: 'Ngày ứng tuyển',
      interviewDate: 'Ngày phỏng vấn',
    },
    profileReview: {
      title: 'Đánh giá hồ sơ',
      pass: 'Đạt hồ sơ',
      fail: 'Không đạt hồ sơ',
      failConfirmTitle: 'Xác nhận không đạt hồ sơ',
      failConfirmBody: 'Ứng viên sẽ kết thúc quy trình tuyển chọn tại JD này.',
      failReasonPlaceholder: 'Lý do không đạt (tuỳ chọn)',
      cancel: 'Hủy',
      confirmFail: 'Xác nhận không đạt',
      wsTrackingOnly: 'Trạng thái Scout Ủy Thác trước tiến cử do WS xử lý — doanh nghiệp chỉ theo dõi.',
    },
    kanbanUpdating: 'Đang cập nhật...',
    nominatedBy: {
      business: 'Doanh nghiệp',
      wsAdmin: 'WS Admin',
      selfApplied: 'Ứng viên tự ứng tuyển',
    },
    pagination: {
      showing: (start, end, total) => `${start} - ${end} / ${total} ứng viên`,
    },
    unreadMessages: (n) => `${n} tin mới`,
  },
  en: {
    title: 'Candidate selection',
    subtitle: 'Track candidates by JD from Scout Credit, Scout Performance, and CTV Marketplace — update the selection process',
    breadcrumb: {
      home: 'Home',
      current: 'Candidate selection',
    },
    tabs: {
      all: 'All',
      ws_ctv: 'Referrals (WS/CTV)',
      scout_credit: 'Scout Credit',
      hired: 'Hired',
      rejected: 'Not a fit',
      other: 'Other',
    },
    stats: {
      total: 'Total',
      processing: 'In progress',
      interview: 'Interview',
      success: 'Success',
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
      scout_performance: 'Scout Performance (delegated)',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'Other',
    },
    filters: {
      searchPlaceholder: 'Search candidate, JD...',
      allJobs: 'JD: All',
      allStatus: 'Status: All',
      appliedFrom: 'From date',
      appliedTo: 'To date',
    },
    view: {
      list: 'List',
      kanban: 'Selection process',
    },
    loading: 'Loading candidates...',
    empty: 'No matching candidates',
    sidebar: {
      notifications: 'Recent notifications',
      selectionProcess: 'Selection process',
      noNotifications: 'No new notifications',
      noData: 'No data yet',
      noActivity: 'No activity yet',
      sourceRatio: 'Source mix',
      statusBreakdown: 'Status',
      recentActivity: 'Recent activity',
      viewAllActivity: 'View all',
      total: 'Total',
    },
    table: {
      candidate: 'Candidate',
      job: 'JD / Role',
      source: 'Source',
      status: 'Status',
      appliedAt: 'Applied',
      interviewDate: 'Interview date',
    },
    profileReview: {
      title: 'Profile review',
      pass: 'Pass screening',
      fail: 'Fail screening',
      failConfirmTitle: 'Confirm profile rejection',
      failConfirmBody: 'This candidate will exit the selection process for this JD.',
      failReasonPlaceholder: 'Reason (optional)',
      cancel: 'Cancel',
      confirmFail: 'Confirm rejection',
      wsTrackingOnly: 'Pre-nomination Scout Performance steps are handled by WS — view only for your company.',
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
    title: '選考管理',
    subtitle: 'Scout Credit・Scout委託・CTVマーケット各ソースの候補者をJD別に追跡し、選考プロセスを更新',
    breadcrumb: {
      home: 'ホーム',
      current: '選考管理',
    },
    tabs: {
      all: 'すべて',
      ws_ctv: '推薦（WS/CTV）',
      scout_credit: 'Scout Credit',
      hired: '採用済み',
      rejected: '不適合',
      other: 'その他',
    },
    stats: {
      total: '合計',
      processing: '処理中',
      interview: '面接',
      success: '成功',
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
      scout_performance: 'Scout委託',
      scout_credit: 'Scout Credit',
      landing: 'Branding LP',
      other: 'その他',
    },
    filters: {
      searchPlaceholder: '候補者、JDを検索...',
      allJobs: 'JD: すべて',
      allStatus: 'ステータス: すべて',
      appliedFrom: '開始日',
      appliedTo: '終了日',
    },
    view: {
      list: 'リスト',
      kanban: '選考プロセス',
    },
    loading: '候補者を読み込み中...',
    empty: '該当する候補者がありません',
    sidebar: {
      notifications: '最近の通知',
      selectionProcess: '選考プロセス',
      noNotifications: '新しい通知はありません',
      noData: 'データがありません',
      noActivity: 'アクティビティがありません',
      sourceRatio: 'ソース比率',
      statusBreakdown: 'ステータス',
      recentActivity: '最近のアクティビティ',
      viewAllActivity: 'すべて見る',
      total: '合計',
    },
    table: {
      candidate: '候補者',
      job: 'JD / ポジション',
      source: 'ソース',
      status: 'ステータス',
      appliedAt: '応募日',
      interviewDate: '面接日',
    },
    profileReview: {
      title: '書類評価',
      pass: '書類合格',
      fail: '書類不合格',
      failConfirmTitle: '書類不合格の確認',
      failConfirmBody: 'このJDでの選考プロセスを終了します。',
      failReasonPlaceholder: '理由（任意）',
      cancel: 'キャンセル',
      confirmFail: '不合格を確定',
      wsTrackingOnly: 'Scout委託の推薦前ステータスはWSが処理します — 企業は閲覧のみです。',
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
    { value: 'scout_credit', label: s.scout_credit },
    { value: 'scout_performance', label: s.scout_performance },
    { value: 'ctv_marketplace', label: s.ctv_marketplace },
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

export function getApplicationProfileReviewCopy(language) {
  return applicationsI18n[language]?.profileReview || applicationsI18n.vi.profileReview;
}

export function getApplicationSourceLabel(sourceType, language = 'vi') {
  const s = applicationsI18n[language]?.sources || applicationsI18n.vi.sources;
  return s[sourceType] || s.other;
}
