import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileWarning,
  FilePenLine,
  FileCheck2,
  Wallet,
  ChevronRight,
  Filter,
  Search,
  ChevronDown,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import apiService from '../../services/api';
import BillingPaymentDetailPanel, { PaymentTypeIcon } from '../../component/Bussiness/BillingPaymentDetailPanel';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
const BRAND = '#0077B6';
const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm';

const billingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .billing-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .billing-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .billing-scroll, .billing-detail-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;

const PAYMENT_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unpaid', label: 'Thanh toán cần xử lý' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'draft', label: 'Draft' },
];

const PROCESS_STEPS = [
  'Workstation tạo yêu cầu',
  'Doanh nghiệp nhận thông báo',
  'Trao đổi & xác nhận',
  'Xác nhận thanh toán',
];

function SummaryCard({ icon: Icon, iconBg, iconColor, title, value, subValue, linkLabel, onLink, accent }) {
  return (
    <div className={`${CARD} p-2.5`}>
      <div className="flex items-start gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: iconBg }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="text-[9px] leading-tight text-slate-500 sm:text-[10px]">{title}</div>
            {linkLabel ? (
              <button
                type="button"
                onClick={onLink}
                className="inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 text-[9px] font-semibold leading-none text-[#0077B6] hover:underline sm:text-[10px]"
              >
                {linkLabel} <ChevronRight className="h-2.5 w-2.5" />
              </button>
            ) : null}
          </div>
          <div className="mt-0.5 text-sm font-bold leading-tight sm:text-base" style={{ color: accent || '#0f172a' }}>
            {value}
          </div>
          {subValue ? (
            <div className="mt-0.5 text-[9px] font-medium leading-snug text-slate-600 sm:text-[10px]">{subValue}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [tabCounts, setTabCounts] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getBusinessBillingDashboard();
      if (res?.success) setDashboard(res.data);
      else setError(res?.message || 'Không tải được dữ liệu thanh toán');
    } catch (e) {
      setError(e?.message || 'Không tải được dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res = await apiService.getBusinessBillingInvoices({
        page,
        limit,
        tab: activeTab === 'all' ? undefined : activeTab,
        search: search || undefined,
      });
      if (res?.success) {
        const rows = res.data?.payments || res.data?.invoices || [];
        setPayments(rows);
        setPagination(res.data?.pagination || null);
        setTabCounts(res.data?.tabCounts || {});
      }
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [page, limit, activeTab, search]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const paymentSummary = dashboard?.paymentSummary;
  const totalPages = pagination?.totalPages || 1;

  const pageNumbers = useMemo(() => {
    const pages = [];
    const max = Math.min(totalPages, 5);
    for (let i = 1; i <= max; i += 1) pages.push(i);
    return pages;
  }, [totalPages]);

  const paymentTabs = PAYMENT_TABS.map((tab) => ({
    ...tab,
    count: tabCounts[tab.key] ?? 0,
  }));

  const handleSummaryFilter = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  if (loading && !dashboard) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 bg-[#f4f6f8] text-sm text-slate-500"
        style={{ fontFamily: PAGE_FONT }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
        Đang tải...
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <style>{billingStyles}</style>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3">
        {error ? (
          <div className={`${CARD} shrink-0 p-2.5 text-[11px] text-amber-800`}>{error}</div>
        ) : null}

        {successMsg ? (
          <div className={`${CARD} flex shrink-0 items-start justify-between gap-2 border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-800`}>
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-slate-900 sm:text-[17px]">Thanh toán & Hóa đơn</h1>
            <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Quản lý yêu cầu thanh toán và hóa đơn</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/business/service-requests')}
            className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-white sm:text-[11px]"
            style={{ background: BRAND }}
          >
            Tạo yêu cầu dịch vụ
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={FileWarning}
            iconBg="#fee2e2"
            iconColor="#dc2626"
            accent="#dc2626"
            title="Invoice chưa thanh toán"
            value={paymentSummary?.unpaid?.count ?? 0}
            subValue={paymentSummary?.unpaid?.amountLabel || '0 VND'}
            linkLabel="Xem chi tiết"
            onLink={() => handleSummaryFilter('unpaid')}
          />
          <SummaryCard
            icon={FilePenLine}
            iconBg="#ffedd5"
            iconColor="#ea580c"
            accent="#ea580c"
            title="Đang xử lý"
            value={paymentSummary?.processing?.count ?? 0}
            subValue={paymentSummary?.processing?.amountLabel || '0 VND'}
            linkLabel="Xem chi tiết"
            onLink={() => handleSummaryFilter('processing')}
          />
          <SummaryCard
            icon={FileCheck2}
            iconBg="#dcfce7"
            iconColor="#16a34a"
            accent="#16a34a"
            title="Đã thanh toán"
            value={paymentSummary?.paid?.count ?? 0}
            subValue={paymentSummary?.paid?.amountLabel || '0 VND'}
            linkLabel="Xem chi tiết"
            onLink={() => handleSummaryFilter('paid')}
          />
          <SummaryCard
            icon={Wallet}
            iconBg="#e8f4fa"
            iconColor="#0077B6"
            accent="#0077B6"
            title="Chi phí tháng này"
            value={paymentSummary?.monthlyCost?.amountLabel || '0 VND'}
            subValue={
              <span className="inline-flex items-center gap-1">
                So với tháng trước
                {paymentSummary?.monthlyCost?.changeDirection === 'down' ? (
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                )}
                {Math.abs(paymentSummary?.monthlyCost?.changePercent ?? 0)}%
              </span>
            }
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            <div className={`${CARD} flex min-h-0 flex-1 flex-col overflow-hidden p-3`}>
              <div className="mb-2 flex shrink-0 flex-wrap gap-1.5">
                {paymentTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setActiveTab(tab.key); setPage(1); }}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors sm:text-[11px] ${
                      activeTab === tab.key
                        ? 'bg-[#0077B6] text-white'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}{tab.key !== 'all' ? ` (${tab.count})` : ''}
                  </button>
                ))}
              </div>

              <div className="mb-2 flex shrink-0 gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo mã thanh toán, loại, nội dung..."
                    className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none sm:text-[11px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  className="flex shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50"
                  title="Xóa bộ lọc"
                >
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>

              <div className="billing-scroll relative min-h-0 flex-1 overflow-auto">
                {paymentsLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
                  </div>
                ) : null}
                <table className="w-full min-w-[720px] border-collapse text-[10px] sm:text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-white">
                    <tr className="border-b border-slate-200 text-left text-[10px] font-semibold text-slate-400">
                      {['Payment ID', 'Loại thanh toán', 'Liên quan', 'Số tiền', 'Deadline', 'Trạng thái', ''].map((h) => (
                        <th key={h || 'action'} className="px-2 py-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-8 text-center text-[11px] text-slate-400">
                          Chưa có yêu cầu thanh toán nào.
                        </td>
                      </tr>
                    ) : payments.map((row) => {
                      const isSelected = selectedPayment?.id === row.id;
                      return (
                        <tr
                          key={row.id || row.paymentCode}
                          onClick={() => setSelectedPayment(row)}
                          className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                            isSelected ? 'bg-[#e8f4fa]/60' : ''
                          }`}
                        >
                          <td className="px-2 py-2 align-top">
                            <div className="font-semibold text-[#0077B6]">{row.paymentCode}</div>
                            <div className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">{row.createdAt}</div>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="flex items-center gap-1.5">
                              <PaymentTypeIcon type={row.type} />
                              <span className="font-medium text-slate-800">{row.type}</span>
                            </div>
                          </td>
                          <td className="max-w-[160px] truncate px-2 py-2 align-top text-slate-600">{row.related}</td>
                          <td className="whitespace-nowrap px-2 py-2 align-top font-semibold text-slate-900">{row.amount}</td>
                          <td className="whitespace-nowrap px-2 py-2 align-top text-slate-600">{row.deadline}</td>
                          <td className="px-2 py-2 align-top">
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px]"
                              style={{ background: row.statusBg, color: row.statusColor }}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <div className="text-[10px] text-slate-500 sm:text-[11px]">
                  {pagination
                    ? `Hiển thị ${pagination.from} – ${pagination.to} trên ${pagination.total} kết quả`
                    : '—'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`flex h-7 min-w-7 items-center justify-center rounded-lg border px-1.5 text-[10px] font-semibold ${
                        page === p
                          ? 'border-[#0077B6] bg-[#0077B6] text-white'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 5 ? (
                    <span className="text-xs text-slate-400">+</span>
                  ) : null}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <select
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                      className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs text-slate-600"
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>{n} / trang</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`${CARD} shrink-0 p-3`}>
              <h3 className="mb-3 text-[11px] font-bold text-slate-800 sm:text-xs">Quy trình yêu cầu thanh toán</h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step} className="flex items-start gap-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: BRAND }}
                    >
                      {index + 1}
                    </div>
                    <p className="pt-0.5 text-[10px] leading-snug text-slate-600 sm:text-[11px]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BillingPaymentDetailPanel
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        </div>
      </div>
    </div>
  );
}
