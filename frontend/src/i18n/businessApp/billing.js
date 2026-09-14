/** Billing page strings */

export const billingI18n = {
  vi: {
    title: 'Thanh toán & Hóa đơn',
    subtitle: 'Quản lý yêu cầu thanh toán và hóa đơn',
    loadFailed: 'Không tải được dữ liệu thanh toán',
    tabPayments: 'Thanh toán',
    tabInvoices: 'Hóa đơn',
    paymentTabs: {
      all: 'Tất cả',
      unpaid: 'Chờ thanh toán',
      processing: 'Đang xác nhận',
      overdue: 'Quá hạn',
    },
    paymentSummary: {
      unpaid: 'Chờ thanh toán',
      processing: 'Đang xác nhận',
      overdue: 'Quá hạn',
      totalDue: 'Tổng cần thanh toán',
    },
    invoiceSummary: {
      monthlyCount: 'Hóa đơn tháng này',
      monthlyValue: 'Tổng giá trị',
      paidTotal: 'Đã thanh toán',
      invoiceCount: 'Số hóa đơn',
    },
    paymentSearchPlaceholder: 'Tìm theo mã thanh toán, loại phí, nội dung...',
    invoiceSearchPlaceholder: 'Tìm theo số hóa đơn, nội dung...',
    clearFilterTitle: 'Xóa bộ lọc',
    emptyPayments: 'Chưa có yêu cầu thanh toán nào từ WS.',
    emptyInvoices: 'Chưa có hóa đơn đã thanh toán.',
    paymentTableHeaders: ['Mã thanh toán', 'Loại phí', 'Nội dung', 'Số tiền', 'Hạn thanh toán', 'Trạng thái', 'Thao tác'],
    invoiceTableHeaders: ['Số hóa đơn', 'Nội dung', 'Số tiền', 'Ngày phát hành', 'Ngày thanh toán', 'Trạng thái', 'Tải hóa đơn'],
    perPage: (n) => `${n} / trang`,
    confirmPaid: 'Xác nhận đã thanh toán',
    confirmPaidSuccess: 'Đã gửi xác nhận. WS sẽ kiểm tra và hoàn tất.',
    downloadVoucher: 'Tải chứng từ',
    viewDetail: 'Xem chi tiết',
    viewInvoice: 'Xem hóa đơn',
    downloadPdf: 'Tải PDF',
  },
  en: {
    title: 'Billing & Invoices',
    subtitle: 'Manage payment requests and invoices',
    loadFailed: 'Could not load billing data',
    tabPayments: 'Payments',
    tabInvoices: 'Invoices',
    paymentTabs: {
      all: 'All',
      unpaid: 'Awaiting payment',
      processing: 'Confirming',
      overdue: 'Overdue',
    },
    paymentSummary: {
      unpaid: 'Awaiting payment',
      processing: 'Confirming',
      overdue: 'Overdue',
      totalDue: 'Total due',
    },
    invoiceSummary: {
      monthlyCount: 'Invoices this month',
      monthlyValue: 'Total value',
      paidTotal: 'Paid',
      invoiceCount: 'Invoice count',
    },
    paymentSearchPlaceholder: 'Search payment ID, fee type, content...',
    invoiceSearchPlaceholder: 'Search invoice no., content...',
    clearFilterTitle: 'Clear filters',
    emptyPayments: 'No payment requests from WS yet.',
    emptyInvoices: 'No paid invoices yet.',
    paymentTableHeaders: ['Payment ID', 'Fee type', 'Content', 'Amount', 'Due date', 'Status', 'Actions'],
    invoiceTableHeaders: ['Invoice no.', 'Content', 'Amount', 'Issued', 'Paid on', 'Status', 'Download'],
    perPage: (n) => `${n} / page`,
    confirmPaid: 'Confirm payment sent',
    confirmPaidSuccess: 'Confirmation sent. WS will verify and complete.',
    downloadVoucher: 'Download voucher',
    viewDetail: 'View details',
    viewInvoice: 'View invoice',
    downloadPdf: 'Download PDF',
  },
  ja: {
    title: '請求・支払い',
    subtitle: '支払いリクエストと請求書を管理',
    loadFailed: '請求データを読み込めませんでした',
    tabPayments: '支払い',
    tabInvoices: '請求書',
    paymentTabs: {
      all: 'すべて',
      unpaid: '支払い待ち',
      processing: '確認中',
      overdue: '期限超過',
    },
    paymentSummary: {
      unpaid: '支払い待ち',
      processing: '確認中',
      overdue: '期限超過',
      totalDue: '支払い総額',
    },
    invoiceSummary: {
      monthlyCount: '今月の請求書',
      monthlyValue: '合計金額',
      paidTotal: '支払済',
      invoiceCount: '請求書数',
    },
    paymentSearchPlaceholder: '支払いID、料金種別、内容で検索...',
    invoiceSearchPlaceholder: '請求書番号、内容で検索...',
    clearFilterTitle: 'フィルターをクリア',
    emptyPayments: 'WSからの支払い依頼はまだありません。',
    emptyInvoices: '支払済みの請求書はまだありません。',
    paymentTableHeaders: ['支払いID', '料金種別', '内容', '金額', '期限', 'ステータス', '操作'],
    invoiceTableHeaders: ['請求書番号', '内容', '金額', '発行日', '支払日', 'ステータス', 'ダウンロード'],
    perPage: (n) => `${n} / ページ`,
    confirmPaid: '支払い済みを確認',
    confirmPaidSuccess: '確認を送信しました。WSが検証して完了します。',
    downloadVoucher: '証憑をダウンロード',
    viewDetail: '詳細を見る',
    viewInvoice: '請求書を見る',
    downloadPdf: 'PDFをダウンロード',
  },
};

export function getBillingPaymentTabs(language) {
  const t = billingI18n[language]?.paymentTabs || billingI18n.vi.paymentTabs;
  return [
    { key: 'all', label: t.all },
    { key: 'unpaid', label: t.unpaid },
    { key: 'processing', label: t.processing },
    { key: 'overdue', label: t.overdue },
  ];
}

export function getBillingInvoiceTabs(language) {
  const t = billingI18n[language]?.paymentTabs || billingI18n.vi.paymentTabs;
  return [{ key: 'all', label: t.all }];
}

/** @deprecated service-order tabs removed from billing page */
export function getBillingRequestTabs(language) {
  return getBillingPaymentTabs(language);
}
