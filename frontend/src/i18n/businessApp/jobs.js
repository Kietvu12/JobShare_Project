/** Job management page strings */

export const jobsI18n = {
  vi: {
    title: 'Quản lý JD',
    subtitle: 'Quản lý các vị trí tuyển dụng và theo dõi tình trạng tuyển dụng',
    breadcrumb: {
      home: 'Trang chủ',
      current: 'Quản lý việc làm',
    },
    createJd: 'Tạo JD mới',
    createShort: 'Tạo mới',
    searchPlaceholder: 'Tìm kiếm theo tên vị trí, mã JD, từ khóa...',
    filters: {
      status: 'Trạng thái',
      category: 'Ngành nghề',
      location: 'Địa điểm làm việc',
      date: 'Ngày cập nhật',
      allStatus: 'Tất cả trạng thái',
      allCategory: 'Tất cả ngành nghề',
      searchCategory: 'Tìm ngành nghề...',
      allLocation: 'Tất cả địa điểm',
      searchLocation: 'Tìm địa điểm...',
      allTime: 'Tất cả thời gian',
      last7d: '7 ngày qua',
      last30d: '30 ngày qua',
      last90d: '90 ngày qua',
    },
    tabs: {
      all: 'Tất cả',
      recruiting: 'Đang tuyển',
      draft: 'Nháp',
      paused: 'Tạm dừng',
      closed: 'Đã đóng',
    },
    sort: {
      updated: 'Mới cập nhật',
      created: 'Mới tạo',
      title: 'Tên JD',
    },
    status: {
      recruiting: 'Đang tuyển',
      draft: 'Nháp',
      paused: 'Tạm dừng',
      closed: 'Đã đóng',
      unknown: 'Không xác định',
    },
    recruitmentType: {
      1: 'Chính thức',
      2: 'Hợp đồng',
      3: 'Phái cử',
      4: 'Bán thời gian',
      5: 'Uỷ thác',
      default: 'Chính thức',
    },
    metrics: {
      candidates: 'Ứng viên',
      referrals: 'Tiến cử',
      interviews: 'Phỏng vấn',
      hired: 'Tuyển thành công',
    },
    table: {
      name: 'Tên JD',
      salary: 'Mức lương',
      status: 'Trạng thái',
      location: 'Địa điểm',
      referrals: 'Tiến cử',
      updated: 'Cập nhật',
      actions: 'Thao tác',
      selectAll: 'Chọn tất cả',
      selectRow: 'Chọn dòng',
    },
    menu: {
      view: 'Xem chi tiết',
      edit: 'Sửa JD',
      duplicate: 'Sao chép JD',
      pause: 'Tạm dừng',
      close: 'Đóng JD',
      delete: 'Xóa JD',
    },
    draft: {
      defaultTitle: 'JD mới',
      badge: 'Nháp chat',
      hint: 'Phiên chat chưa lưu thành JD · Bấm để tiếp tục tạo',
    },
    empty: {
      title: 'Chưa có JD nào',
      hint: 'Bấm "Tạo JD mới" để bắt đầu với AI Assistant',
    },
    alerts: {
      pauseFailed: 'Không thể tạm dừng JD',
      closeFailed: 'Không thể đóng JD',
      closeConfirm: (title) => `Đóng JD "${title}"?`,
      deleteFailed: 'Không thể xóa JD',
      deleteConfirm: (title) => `Bạn có chắc muốn xóa JD "${title}"?\n\nLưu ý: Không thể xóa JD đã có đơn ứng tuyển/tiến cử. Hãy đóng JD trước nếu cần.`,
      draftDeleteFailed: 'Không thể xóa nháp chat',
      draftDeleteConfirm: (title) => `Xóa nháp chat "${title}"?\n\nPhiên chat chưa lưu sẽ bị xóa vĩnh viễn.`,
    },
  },
  en: {
    title: 'Job descriptions',
    subtitle: 'Manage open roles and track hiring progress',
    breadcrumb: {
      home: 'Home',
      current: 'Job management',
    },
    createJd: 'Create new JD',
    createShort: 'Create new',
    searchPlaceholder: 'Search by role, JD code, keywords...',
    filters: {
      status: 'Status',
      category: 'Industry',
      location: 'Work location',
      date: 'Updated date',
      allStatus: 'All statuses',
      allCategory: 'All industries',
      searchCategory: 'Search industry...',
      allLocation: 'All locations',
      searchLocation: 'Search location...',
      allTime: 'All time',
      last7d: 'Last 7 days',
      last30d: 'Last 30 days',
      last90d: 'Last 90 days',
    },
    tabs: {
      all: 'All',
      recruiting: 'Open',
      draft: 'Draft',
      paused: 'Paused',
      closed: 'Closed',
    },
    sort: {
      updated: 'Recently updated',
      created: 'Recently created',
      title: 'JD title',
    },
    status: {
      recruiting: 'Open',
      draft: 'Draft',
      paused: 'Paused',
      closed: 'Closed',
      unknown: 'Unknown',
    },
    recruitmentType: {
      1: 'Full-time',
      2: 'Contract',
      3: 'Dispatch',
      4: 'Part-time',
      5: 'Outsourced',
      default: 'Full-time',
    },
    metrics: {
      candidates: 'Candidates',
      referrals: 'Referrals',
      interviews: 'Interviews',
      hired: 'Hired',
    },
    table: {
      name: 'JD title',
      salary: 'Salary',
      status: 'Status',
      location: 'Location',
      referrals: 'Referrals',
      updated: 'Updated',
      actions: 'Actions',
      selectAll: 'Select all',
      selectRow: 'Select row',
    },
    menu: {
      view: 'View details',
      edit: 'Edit JD',
      duplicate: 'Duplicate JD',
      pause: 'Pause',
      close: 'Close JD',
      delete: 'Delete JD',
    },
    draft: {
      defaultTitle: 'New JD',
      badge: 'Chat draft',
      hint: 'Unsaved chat session · Click to continue creating',
    },
    empty: {
      title: 'No job descriptions yet',
      hint: 'Click "Create new JD" to get started with AI Assistant',
    },
    alerts: {
      pauseFailed: 'Could not pause JD',
      closeFailed: 'Could not close JD',
      closeConfirm: (title) => `Close JD "${title}"?`,
      deleteFailed: 'Could not delete JD',
      deleteConfirm: (title) => `Delete JD "${title}"?\n\nNote: JDs with applications or referrals cannot be deleted. Close the JD first if needed.`,
      draftDeleteFailed: 'Could not delete chat draft',
      draftDeleteConfirm: (title) => `Delete chat draft "${title}"?\n\nThis unsaved session will be permanently removed.`,
    },
  },
  ja: {
    title: 'JD管理',
    subtitle: '求人票を管理し、採用状況を追跡',
    breadcrumb: {
      home: 'ホーム',
      current: '求人管理',
    },
    createJd: '新規JD作成',
    createShort: '新規作成',
    searchPlaceholder: '職種名、JDコード、キーワードで検索...',
    filters: {
      status: 'ステータス',
      category: '業種',
      location: '勤務地',
      date: '更新日',
      allStatus: 'すべてのステータス',
      allCategory: 'すべての業種',
      searchCategory: '業種を検索...',
      allLocation: 'すべての勤務地',
      searchLocation: '勤務地を検索...',
      allTime: 'すべての期間',
      last7d: '過去7日',
      last30d: '過去30日',
      last90d: '過去90日',
    },
    tabs: {
      all: 'すべて',
      recruiting: '募集中',
      draft: '下書き',
      paused: '一時停止',
      closed: '終了',
    },
    sort: {
      updated: '更新が新しい順',
      created: '作成が新しい順',
      title: 'JD名',
    },
    status: {
      recruiting: '募集中',
      draft: '下書き',
      paused: '一時停止',
      closed: '終了',
      unknown: '不明',
    },
    recruitmentType: {
      1: '正社員',
      2: '契約',
      3: '派遣',
      4: 'パート',
      5: '委託',
      default: '正社員',
    },
    metrics: {
      candidates: '候補者',
      referrals: '推薦',
      interviews: '面接',
      hired: '採用成功',
    },
    table: {
      name: 'JD名',
      salary: '給与',
      status: 'ステータス',
      location: '勤務地',
      referrals: '推薦',
      updated: '更新日',
      actions: '操作',
      selectAll: 'すべて選択',
      selectRow: '行を選択',
    },
    menu: {
      view: '詳細を見る',
      edit: 'JDを編集',
      duplicate: 'JDを複製',
      pause: '一時停止',
      close: 'JDを終了',
      delete: 'JDを削除',
    },
    draft: {
      defaultTitle: '新規JD',
      badge: 'チャット下書き',
      hint: '未保存のチャットセッション · クリックして続行',
    },
    empty: {
      title: 'JDがありません',
      hint: '「新規JD作成」でAIアシスタントを開始',
    },
    alerts: {
      pauseFailed: 'JDを一時停止できませんでした',
      closeFailed: 'JDを終了できませんでした',
      closeConfirm: (title) => `JD「${title}」を終了しますか？`,
      deleteFailed: 'JDを削除できませんでした',
      deleteConfirm: (title) => `JD「${title}」を削除しますか？\n\n注意：応募・推薦があるJDは削除できません。必要に応じて先にJDを終了してください。`,
      draftDeleteFailed: 'チャット下書きを削除できませんでした',
      draftDeleteConfirm: (title) => `チャット下書き「${title}」を削除しますか？\n\n未保存のセッションは完全に削除されます。`,
    },
  },
};

export function getJobStatusTabs(language) {
  const t = jobsI18n[language]?.tabs || jobsI18n.vi.tabs;
  return [
    { id: 'all', label: t.all },
    { id: 'recruiting', label: t.recruiting, statuses: [1] },
    { id: 'draft', label: t.draft, statuses: [0] },
    { id: 'paused', label: t.paused, statuses: [] },
    { id: 'closed', label: t.closed, statuses: [2, 3] },
  ];
}

export function getJobSortOptions(language) {
  const t = jobsI18n[language]?.sort || jobsI18n.vi.sort;
  return [
    { value: 'updated', label: t.updated },
    { value: 'created', label: t.created },
    { value: 'title', label: t.title },
  ];
}

export function getJobStatusFilterOptions(language) {
  const tabs = jobsI18n[language]?.tabs || jobsI18n.vi.tabs;
  const f = jobsI18n[language]?.filters || jobsI18n.vi.filters;
  return [
    { value: 'all', label: f.allStatus },
    { value: 'recruiting', label: tabs.recruiting },
    { value: 'draft', label: tabs.draft },
    { value: 'paused', label: tabs.paused },
    { value: 'closed', label: tabs.closed },
  ];
}

export function getJobDateFilterOptions(language) {
  const f = jobsI18n[language]?.filters || jobsI18n.vi.filters;
  return [
    { value: '', label: f.allTime },
    { value: '7d', label: f.last7d },
    { value: '30d', label: f.last30d },
    { value: '90d', label: f.last90d },
  ];
}

export function getJobStatusMeta(status, language = 'vi') {
  const s = jobsI18n[language]?.status || jobsI18n.vi.status;
  const n = Number(status);
  if (n === 1) return { label: s.recruiting, color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  if (n === 0) return { label: s.draft, color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
  if (n === 4) return { label: s.paused, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  if (n === 2 || n === 3) return { label: s.closed, color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
  return { label: s.unknown, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
}

export function getRecruitmentLabel(job, language = 'vi') {
  const map = jobsI18n[language]?.recruitmentType || jobsI18n.vi.recruitmentType;
  const t = Number(job?.recruitmentType ?? job?.recruitment_type);
  return map[t] || map.default;
}

export function getJobRowMenuItems(jobsCopy) {
  return [
    { id: 'view', label: jobsCopy.menu.view },
    { id: 'edit', label: jobsCopy.menu.edit },
    { id: 'duplicate', label: jobsCopy.menu.duplicate },
    { id: 'pause', label: jobsCopy.menu.pause, hiddenStatus: (s) => Number(s) !== 1 },
    { id: 'close', label: jobsCopy.menu.close, hiddenStatus: (s) => Number(s) === 2 || Number(s) === 3 },
    { id: 'delete', label: jobsCopy.menu.delete, danger: true },
  ];
}

export function getDateLocale(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}
