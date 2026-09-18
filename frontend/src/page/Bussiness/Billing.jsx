import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Download,
  Receipt,
} from 'lucide-react';
import apiService from '../../services/api';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';
import { useLanguage } from '../../context/LanguageContext';
import { getBillingPaymentTabs, getBillingInvoiceTabs } from '../../i18n/businessAppI18n';
import BillingPaymentDetailPanel, { PaymentTypeIcon } from '../../component/Bussiness/BillingPaymentDetailPanel';
import BillingInvoiceDetailPanel from '../../component/Bussiness/BillingInvoiceDetailPanel';
import {
  BILL_ALERT,
  BILL_BREADCRUMB,
  BILL_BREADCRUMB_CURRENT,
  BILL_BADGE,
  BILL_CARD,
  BILL_CODE,
  BILL_EMPTY,
  BILL_INNER,
  BILL_LINK,
  BILL_MAIN_TAB,
  BILL_PAGE_BTN,
  BILL_PAGE_STYLES,
  BILL_PAGINATION,
  BILL_SEARCH_INPUT,
  BILL_SHELL,
  BILL_SUCCESS,
  BILL_SUMMARY_CARD,
  BILL_SUMMARY_LABEL,
  BILL_SUMMARY_LINK,
  BILL_SUMMARY_SUB,
  BILL_SUMMARY_VALUE,
  BILL_TABLE,
  BILL_TD,
  BILL_TH,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/billingUi';

function SummaryCard({ icon: Icon, iconBg, iconColor, title, value, subValue, linkLabel, onLink, accent }) {
  return (
    <div className={BILL_SUMMARY_CARD}>
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
          style={{ background: iconBg }}
        >
          <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className={BILL_SUMMARY_LABEL}>{title}</div>
            {linkLabel ? (
              <button
                type="button"
                onClick={onLink}
                className={`inline-flex shrink-0 items-center gap-0.5 border-0 bg-transparent p-0 hover:underline ${BILL_SUMMARY_LINK}`}
              >
                {linkLabel} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className={BILL_SUMMARY_VALUE} style={{ color: accent || '#0f172a' }}>
            {value}
          </div>
          {subValue ? (
            <div className={`mt-1 ${BILL_SUMMARY_SUB}`}>{subValue}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = useBusinessAppCopy();
  const billingCopy = copy.billing;
  const commonCopy = copy.common;
  const paymentTabDefs = useMemo(() => getBillingPaymentTabs(language), [language]);
  const invoiceTabDefs = useMemo(() => getBillingInvoiceTabs(language), [language]);

  const [viewMode, setViewMode] = useState('payments');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [tabCounts, setTabCounts] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getBusinessBillingDashboard();
      if (res?.success) setDashboard(res.data);
      else setError(res?.message || billingCopy.loadFailed);
    } catch (e) {
      setError(e?.message || billingCopy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [billingCopy.loadFailed]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const scope = viewMode === 'invoices' ? 'invoices' : 'payments';
      const res = await apiService.getBusinessBillingInvoices({
        page,
        limit,
        scope,
        tab: activeTab === 'all' ? undefined : activeTab,
        search: search || undefined,
      });
      if (res?.success) {
        const list = res.data?.payments || res.data?.invoices || [];
        setRows(list);
        setPagination(res.data?.pagination || null);
        setTabCounts(res.data?.tabCounts || {});
      }
    } catch {
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [page, limit, activeTab, search, viewMode]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setActiveTab('all');
    setPage(1);
    setSearchInput('');
    setSearch('');
    setSelectedPayment(null);
    setSelectedInvoice(null);
    setFilterMenuOpen(false);
  }, [viewMode]);

  useEffect(() => {
    if (!filterMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [filterMenuOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const paymentSummary = dashboard?.paymentSummary;
  const invoiceSummary = dashboard?.invoiceArchiveSummary;
  const totalPages = pagination?.totalPages || 1;
  const hasSelection = viewMode === 'payments' ? !!selectedPayment : !!selectedInvoice;

  const pageNumbers = useMemo(() => {
    const pages = [];
    const max = Math.min(totalPages, 5);
    for (let i = 1; i <= max; i += 1) pages.push(i);
    return pages;
  }, [totalPages]);

  const filterTabs = (viewMode === 'invoices' ? invoiceTabDefs : paymentTabDefs).map((tab) => ({
    ...tab,
    count: tabCounts[tab.key] ?? 0,
  }));
  const showStatusFilter = filterTabs.length > 1;
  const hasActiveListFilters = activeTab !== 'all' || Boolean(searchInput.trim());

  const handleSummaryFilter = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  const handlePaymentConfirmed = (updated) => {
    setSuccessMsg(billingCopy.confirmPaidSuccess);
    setSelectedPayment(updated);
    loadList();
    loadDashboard();
  };

  const stopRowClick = (e) => e.stopPropagation();

  if (loading && !dashboard) {
    return (
      <div
        className={`flex h-full items-center justify-center gap-2 bg-[#f4f6f8] text-slate-500 ${BILL_BREADCRUMB}`}
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
        {commonCopy.loading}
      </div>
    );
  }

  return (
    <div className={BILL_SHELL} style={{ fontFamily: BUSINESS_UI_FONT }}>
      <style>{BILL_PAGE_STYLES}</style>

      <div className={BILL_INNER}>
        {error ? (
          <div className={`${BILL_ALERT} text-amber-800`}>{error}</div>
        ) : null}

        {successMsg ? (
          <div className={BILL_SUCCESS}>
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="border-0 bg-transparent p-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div>
            <nav aria-label="Breadcrumb" className={BILL_BREADCRUMB}>
              <button
                type="button"
                onClick={() => navigate('/business')}
                className={`transition hover:text-[#0077B6] ${BILL_LINK}`}
              >
                {copy.jobs.breadcrumb.home}
              </button>
              <span className="mx-1.5 text-slate-400">&gt;</span>
              <span className={BILL_BREADCRUMB_CURRENT}>{billingCopy.title}</span>
            </nav>
          </div>
        </header>

        <div className="flex shrink-0 gap-4 border-b border-slate-200">
          {[
            { key: 'payments', label: billingCopy.tabPayments },
            { key: 'invoices', label: billingCopy.tabInvoices },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setViewMode(item.key)}
              className={`-mb-px ${BILL_MAIN_TAB} ${
                viewMode === item.key
                  ? 'border-[#0077B6] text-[#0077B6]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {viewMode === 'payments' ? (
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryCard
              icon={FileWarning}
              iconBg="#fee2e2"
              iconColor="#dc2626"
              accent="#dc2626"
              title={billingCopy.paymentSummary.unpaid}
              value={paymentSummary?.unpaid?.count ?? 0}
              subValue={paymentSummary?.unpaid?.amountLabel}
              linkLabel={commonCopy.viewDetails}
              onLink={() => handleSummaryFilter('unpaid')}
            />
            <SummaryCard
              icon={FilePenLine}
              iconBg="#ffedd5"
              iconColor="#ea580c"
              accent="#ea580c"
              title={billingCopy.paymentSummary.processing}
              value={paymentSummary?.processing?.count ?? 0}
              subValue={paymentSummary?.processing?.amountLabel}
              linkLabel={commonCopy.viewDetails}
              onLink={() => handleSummaryFilter('processing')}
            />
            <SummaryCard
              icon={FileCheck2}
              iconBg="#fecaca"
              iconColor="#b91c1c"
              accent="#b91c1c"
              title={billingCopy.paymentSummary.overdue}
              value={paymentSummary?.overdue?.count ?? 0}
              subValue={paymentSummary?.overdue?.amountLabel}
              linkLabel={commonCopy.viewDetails}
              onLink={() => handleSummaryFilter('overdue')}
            />
            <SummaryCard
              icon={Wallet}
              iconBg="#e8f4fa"
              iconColor="#0077B6"
              accent="#0077B6"
              title={billingCopy.paymentSummary.totalDue}
              value={paymentSummary?.totalDue?.amountLabel || '0 VND'}
              subValue={`${paymentSummary?.totalDue?.count ?? 0} khoản`}
            />
          </div>
        ) : (
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryCard
              icon={Receipt}
              iconBg="#e8f4fa"
              iconColor="#0077B6"
              accent="#0077B6"
              title={billingCopy.invoiceSummary.monthlyCount}
              value={invoiceSummary?.monthlyCount?.count ?? 0}
            />
            <SummaryCard
              icon={Wallet}
              iconBg="#dcfce7"
              iconColor="#16a34a"
              accent="#16a34a"
              title={billingCopy.invoiceSummary.monthlyValue}
              value={invoiceSummary?.monthlyValue?.amountLabel || '0 VND'}
            />
            <SummaryCard
              icon={FileCheck2}
              iconBg="#dcfce7"
              iconColor="#16a34a"
              accent="#16a34a"
              title={billingCopy.invoiceSummary.paidTotal}
              value={invoiceSummary?.paidTotal?.amountLabel || '0 VND'}
            />
            <SummaryCard
              icon={FilePenLine}
              iconBg="#f1f5f9"
              iconColor="#64748b"
              title={billingCopy.invoiceSummary.invoiceCount}
              value={invoiceSummary?.invoiceCount?.count ?? 0}
            />
          </div>
        )}

        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden ${
            hasSelection ? 'xl:grid-cols-[minmax(0,1fr)_min(420px,38vw)]' : 'xl:grid-cols-[minmax(0,1fr)_300px]'
          }`}
        >
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            <div className={`${BILL_CARD} flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4`}>
              <div className="mb-2 flex min-w-0 shrink-0">
                <div className="flex min-w-0 flex-1 items-stretch rounded-lg border border-slate-200 bg-slate-50/80 focus-within:border-[#0077B6]/35 focus-within:ring-1 focus-within:ring-[#0077B6]/15">
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder={
                        viewMode === 'payments'
                          ? billingCopy.paymentSearchPlaceholder
                          : billingCopy.invoiceSearchPlaceholder
                      }
                      className={BILL_SEARCH_INPUT}
                    />
                    {hasActiveListFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          setSearch('');
                          setActiveTab('all');
                          setPage(1);
                          setFilterMenuOpen(false);
                        }}
                        className="shrink-0 rounded-md p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                        title={billingCopy.clearFilterTitle}
                        aria-label={billingCopy.clearFilterTitle}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  {showStatusFilter ? (
                    <>
                      <div className="w-px shrink-0 self-stretch bg-slate-200" aria-hidden />
                      <div className="relative shrink-0" ref={filterMenuRef}>
                        <button
                          type="button"
                          onClick={() => setFilterMenuOpen((open) => !open)}
                          aria-expanded={filterMenuOpen}
                          className={`inline-flex h-full min-h-[2.75rem] items-center gap-1.5 whitespace-nowrap bg-white/60 px-3 py-2.5 transition-colors hover:bg-white sm:px-3.5 ${BUSINESS_HP_TEXT.button} ${
                            activeTab !== 'all' ? 'text-[#0077B6]' : 'text-slate-600'
                          }`}
                        >
                          <Filter className="h-4 w-4 shrink-0" aria-hidden />
                          <span className={BILL_PAGINATION}>{billingCopy.filterButton}</span>
                          {activeTab !== 'all' ? (
                            <span className="rounded-full bg-[#0077B6] px-1.5 py-px text-[10px] font-bold leading-none text-white">
                              1
                            </span>
                          ) : null}
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                              filterMenuOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                        {filterMenuOpen ? (
                          <div
                            className="absolute right-0 top-full z-30 mt-1 min-w-[11.5rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                            role="menu"
                          >
                            <p className={`px-3 py-1.5 font-semibold uppercase tracking-wide text-slate-400 ${BILL_PAGINATION}`}>
                              {billingCopy.filterStatusHeading}
                            </p>
                            {filterTabs.map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                role="menuitemradio"
                                aria-checked={activeTab === tab.key}
                                onClick={() => {
                                  setActiveTab(tab.key);
                                  setPage(1);
                                  setFilterMenuOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 ${BILL_PAGINATION} ${
                                  activeTab === tab.key ? 'bg-[#e8f4fa]/80 font-semibold text-[#0077B6]' : 'text-slate-700'
                                }`}
                              >
                                <span>{tab.label}</span>
                                {tab.key !== 'all' ? (
                                  <span className="tabular-nums text-slate-400">{tab.count}</span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="billing-scroll relative min-h-0 flex-1 overflow-auto">
                {listLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
                  </div>
                ) : null}

                {viewMode === 'payments' ? (
                  <table className={`${BILL_TABLE} min-w-[760px]`}>
                    <thead className="sticky top-0 z-[1] bg-white">
                      <tr className="border-b border-slate-200 text-left">
                        {billingCopy.paymentTableHeaders.map((h) => (
                          <th key={h || 'action'} className={BILL_TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`${BILL_TD} py-10 ${BILL_EMPTY}`}>
                            {billingCopy.emptyPayments}
                          </td>
                        </tr>
                      ) : rows.map((row) => {
                        const isSelected = selectedPayment?.id === row.id;
                        return (
                          <tr
                            key={row.id || row.paymentCode}
                            onClick={() => setSelectedPayment(row)}
                            className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                              isSelected ? 'bg-[#e8f4fa]/60' : ''
                            }`}
                          >
                            <td className={BILL_TD}>
                              <div className={BILL_CODE}>{row.paymentCode}</div>
                            </td>
                            <td className={BILL_TD}>
                              <div className="flex items-center gap-2">
                                <PaymentTypeIcon type={row.type} />
                                <span className="font-medium text-slate-800">{row.feeType || row.type}</span>
                              </div>
                            </td>
                            <td className={`max-w-[200px] ${BILL_TD} text-slate-600`}>
                              <span className="line-clamp-2">{row.content || row.related}</span>
                            </td>
                            <td className={`whitespace-nowrap ${BILL_TD} font-semibold text-slate-900`}>{row.amount}</td>
                            <td className={`whitespace-nowrap ${BILL_TD} text-slate-600`}>{row.deadline}</td>
                            <td className={BILL_TD}>
                              <span
                                className={BILL_BADGE}
                                style={{ background: row.statusBg, color: row.statusColor }}
                              >
                                {row.statusLabel}
                              </span>
                            </td>
                            <td className={BILL_TD} onClick={stopRowClick}>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className={`${BILL_TABLE} min-w-[720px]`}>
                    <thead className="sticky top-0 z-[1] bg-white">
                      <tr className="border-b border-slate-200 text-left">
                        {billingCopy.invoiceTableHeaders.map((h) => (
                          <th key={h || 'action'} className={BILL_TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`${BILL_TD} py-10 ${BILL_EMPTY}`}>
                            {billingCopy.emptyInvoices}
                          </td>
                        </tr>
                      ) : rows.map((row) => {
                        const isSelected = selectedInvoice?.id === row.id;
                        return (
                          <tr
                            key={row.id || row.invoiceCode}
                            onClick={() => setSelectedInvoice(row)}
                            className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                              isSelected ? 'bg-[#e8f4fa]/60' : ''
                            }`}
                          >
                            <td className={`${BILL_TD} ${BILL_CODE}`}>{row.invoiceCode}</td>
                            <td className={`max-w-[200px] ${BILL_TD} text-slate-600`}>
                              <span className="line-clamp-2">{row.content || row.related}</span>
                            </td>
                            <td className={`whitespace-nowrap ${BILL_TD} font-semibold`}>{row.amount}</td>
                            <td className={`whitespace-nowrap ${BILL_TD} text-slate-600`}>{row.issuedAt}</td>
                            <td className={`whitespace-nowrap ${BILL_TD} text-slate-600`}>{row.paidAt}</td>
                            <td className={BILL_TD}>
                              <span
                                className={BILL_BADGE}
                                style={{ background: row.statusBg, color: row.statusColor }}
                              >
                                {row.statusLabel}
                              </span>
                            </td>
                            <td className={BILL_TD} onClick={stopRowClick}>
                              {row.invoicePdfUrl ? (
                                <a
                                  href={row.invoicePdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 ${BILL_LINK}`}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  PDF
                                </a>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className={BILL_PAGINATION}>
                  {pagination
                    ? commonCopy.pagination.showing(pagination.from, pagination.to, pagination.total)
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
                      className={`${BILL_PAGE_BTN} ${
                        page === p
                          ? 'border-[#0077B6] bg-[#0077B6] text-white'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 5 ? <span className="text-xs text-slate-400">+</span> : null}
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
                      className={`appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-slate-600 ${BILL_PAGINATION}`}
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>{billingCopy.perPage(n)}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {viewMode === 'payments' ? (
            <BillingPaymentDetailPanel
              payment={selectedPayment}
              onClose={() => setSelectedPayment(null)}
              onConfirmed={handlePaymentConfirmed}
              copy={billingCopy}
            />
          ) : (
            <BillingInvoiceDetailPanel
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              copy={billingCopy}
            />
          )}
        </div>
      </div>
    </div>
  );
}
