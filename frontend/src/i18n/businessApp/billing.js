/** Billing page strings */

export const billingI18n = {
  vi: {
    title: 'Thanh toán & Hóa đơn',
    subtitle: 'Quản lý yêu cầu thanh toán và hóa đơn',
    createServiceRequest: 'Tạo yêu cầu dịch vụ',
    loadFailed: 'Không tải được dữ liệu thanh toán',
    tabs: {
      all: 'Tất cả',
      unpaid: 'Thanh toán cần xử lý',
      processing: 'Đang xử lý',
      paid: 'Đã thanh toán',
      draft: 'Draft',
    },
    summary: {
      unpaid: 'Invoice chưa thanh toán',
      processing: 'Đang xử lý',
      paid: 'Đã thanh toán',
      monthlyCost: 'Chi phí tháng này',
      vsLastMonth: 'So với tháng trước',
    },
    searchPlaceholder: 'Tìm theo mã thanh toán, loại, nội dung...',
    clearFilterTitle: 'Xóa bộ lọc',
    emptyPayments: 'Chưa có yêu cầu thanh toán nào.',
    tableHeaders: ['Payment ID', 'Loại thanh toán', 'Liên quan', 'Số tiền', 'Deadline', 'Trạng thái', ''],
    processSteps: [
      'Workstation tạo yêu cầu',
      'Doanh nghiệp nhận thông báo',
      'Trao đổi & xác nhận',
      'Xác nhận thanh toán',
    ],
    processTitle: 'Quy trình thanh toán',
    perPage: (n) => `${n} / trang`,
  },
  en: {
    title: 'Billing & Invoices',
    subtitle: 'Manage payment requests and invoices',
    createServiceRequest: 'Create service request',
    loadFailed: 'Could not load billing data',
    tabs: {
      all: 'All',
      unpaid: 'Needs payment',
      processing: 'Processing',
      paid: 'Paid',
      draft: 'Draft',
    },
    summary: {
      unpaid: 'Unpaid invoices',
      processing: 'Processing',
      paid: 'Paid',
      monthlyCost: 'Cost this month',
      vsLastMonth: 'vs last month',
    },
    searchPlaceholder: 'Search by payment ID, type, content...',
    clearFilterTitle: 'Clear filters',
    emptyPayments: 'No payment requests yet.',
    tableHeaders: ['Payment ID', 'Payment type', 'Related', 'Amount', 'Deadline', 'Status', ''],
    processSteps: [
      'Work Station creates request',
      'Company receives notification',
      'Discuss & confirm',
      'Confirm payment',
    ],
    processTitle: 'Payment process',
    perPage: (n) => `${n} / page`,
  },
  ja: {
    title: '請求・支払い',
    subtitle: '支払いリクエストと請求書を管理',
    createServiceRequest: 'サービスリクエスト作成',
    loadFailed: '請求データを読み込めませんでした',
    tabs: {
      all: 'すべて',
      unpaid: '未払い',
      processing: '処理中',
      paid: '支払済み',
      draft: 'Draft',
    },
    summary: {
      unpaid: '未払い請求書',
      processing: '処理中',
      paid: '支払済み',
      monthlyCost: '今月の費用',
      vsLastMonth: '前月比',
    },
    searchPlaceholder: '支払いID、種別、内容で検索...',
    clearFilterTitle: 'フィルターをクリア',
    emptyPayments: '支払いリクエストはありません。',
    tableHeaders: ['Payment ID', '支払い種別', '関連', '金額', '期限', 'ステータス', ''],
    processSteps: [
      'Work Stationがリクエスト作成',
      '企業が通知を受信',
      'やり取り・確認',
      '支払い確認',
    ],
    processTitle: '支払いフロー',
    perPage: (n) => `${n} / ページ`,
  },
};

export function getBillingPaymentTabs(language) {
  const t = billingI18n[language]?.tabs || billingI18n.vi.tabs;
  return [
    { key: 'all', label: t.all },
    { key: 'unpaid', label: t.unpaid },
    { key: 'processing', label: t.processing },
    { key: 'paid', label: t.paid },
    { key: 'draft', label: t.draft },
  ];
}
