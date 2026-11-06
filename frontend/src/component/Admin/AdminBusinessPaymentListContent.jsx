import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import {
  Search,
  ExternalLink,
  Eye,
  CheckCircle,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const STATUS_LABELS = {
  vi: {
    unpaid: 'Chờ thanh toán',
    processing: 'Đang xác nhận',
    paid: 'Đã thanh toán',
  },
  en: {
    unpaid: 'Awaiting payment',
    processing: 'Confirming',
    paid: 'Paid',
  },
  ja: {
    unpaid: '支払い待ち',
    processing: '確認中',
    paid: '支払済み',
  },
};

function statusStyle(status) {
  switch (status) {
    case 'paid':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'processing':
      return { backgroundColor: '#ffedd5', color: '#ea580c' };
    case 'unpaid':
      return { backgroundColor: '#fee2e2', color: '#dc2626' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' };
  }
}

const AdminBusinessPaymentListContent = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const statusLabels = STATUS_LABELS[language] || STATUS_LABELS.vi;
  const dateLocale = language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'vi-VN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await apiService.getAdminBusinessReferralInvoices(params);
      if (response?.success && response.data) {
        setInvoices(response.data.invoices || []);
        setSummary(response.data.summary || null);
        setPagination(response.data.pagination || { total: 0, page: currentPage, limit: itemsPerPage, totalPages: 0 });
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setIsStatusFilterOpen(false);
    setIsDateFilterOpen(false);
  };

  const handleConfirmPaid = async () => {
    if (!confirmTarget) return;
    try {
      setConfirmLoading(true);
      const res = await apiService.confirmAdminBusinessReferralInvoicePaid(confirmTarget.id, confirmNote);
      if (res?.success) {
        alert(t.adminBusinessPaymentConfirmSuccess || 'Đã xác nhận hoàn tất thanh toán.');
        setConfirmTarget(null);
        setConfirmNote('');
        loadInvoices();
      } else {
        alert(res?.message || t.errorOccurred);
      }
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setConfirmLoading(false);
    }
  };

  const totalPages = pagination.totalPages || 0;
  const totalItems = pagination.total || 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-1.5 grid grid-cols-2 gap-1 sm:mb-2 sm:grid-cols-3 sm:gap-1.5 lg:gap-2">
        <div className="flex min-h-[44px] items-start gap-2 rounded bg-white p-2 sm:p-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px]" style={{ color: '#94a3b8' }}>{t.totalPaid}</p>
            <p className="truncate text-xs font-bold" style={{ color: '#16a34a' }}>
              {(summary?.paid?.amount || 0).toLocaleString(dateLocale)}đ
            </p>
            <p className="text-[9px]" style={{ color: '#94a3b8' }}>{summary?.paid?.count || 0} {t.paymentRequestsCount}</p>
          </div>
        </div>
        <div className="flex min-h-[44px] items-start gap-2 rounded bg-white p-2 sm:p-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#ffedd5' }}>
            <AlertCircle className="h-3.5 w-3.5" style={{ color: '#ea580c' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px]" style={{ color: '#94a3b8' }}>{t.adminBusinessPaymentStatProcessing || 'Đang xác nhận'}</p>
            <p className="truncate text-xs font-bold" style={{ color: '#ea580c' }}>
              {(summary?.processing?.amount || 0).toLocaleString(dateLocale)}đ
            </p>
            <p className="text-[9px]" style={{ color: '#94a3b8' }}>{summary?.processing?.count || 0} {t.paymentRequestsCount}</p>
          </div>
        </div>
        <div className="col-span-2 flex min-h-[44px] items-start gap-2 rounded bg-white p-2 sm:col-span-1 sm:p-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#fee2e2' }}>
            <Clock className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px]" style={{ color: '#94a3b8' }}>{t.adminBusinessPaymentStatUnpaid || 'Chờ DN thanh toán'}</p>
            <p className="truncate text-xs font-bold" style={{ color: '#dc2626' }}>
              {(summary?.unpaid?.amount || 0).toLocaleString(dateLocale)}đ
            </p>
            <p className="text-[9px]" style={{ color: '#94a3b8' }}>{summary?.unpaid?.count || 0} {t.paymentRequestsCount}</p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex-shrink-0 rounded-lg border p-2 sm:p-3" style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-full border bg-white px-3 py-1.5 text-[11px] sm:min-w-[220px] sm:text-[13px]" style={{ borderColor: '#e5e7eb' }}>
            <Search className="mr-2 h-3.5 w-3.5 shrink-0" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={t.adminBusinessPaymentSearchPlaceholder || 'Tìm mã hóa đơn, DN, ứng viên, job...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-[11px] outline-none sm:text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={handleReset} className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
              {t.resetButton || t.reset}
            </button>
            <div className="relative">
              <button type="button" onClick={() => { setIsStatusFilterOpen(!isStatusFilterOpen); setIsDateFilterOpen(false); }} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ color: '#374151' }}>
                {t.statusFilterLabel || t.statusLabel}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isStatusFilterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border bg-white p-3 text-xs" style={{ borderColor: '#e5e7eb' }}>
                  {['', 'processing', 'unpaid', 'paid'].map((val) => (
                    <label key={val || 'all'} className="mb-1.5 flex cursor-pointer items-center gap-1.5">
                      <input type="radio" name="biz-pay-status" checked={statusFilter === val} onChange={() => { setStatusFilter(val); setCurrentPage(1); setIsStatusFilterOpen(false); }} />
                      <span>{val ? statusLabels[val] : (t.allStatus || t.all)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" onClick={() => { setIsDateFilterOpen(!isDateFilterOpen); setIsStatusFilterOpen(false); }} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ color: '#374151' }}>
                {t.dateRangeShort || t.dateFromLabel}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isDateFilterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border bg-white p-3 text-xs" style={{ borderColor: '#e5e7eb' }}>
                  <label className="mb-2 block">
                    <span className="font-semibold">{t.dateFromShort || t.dateFromLabel}</span>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
                  </label>
                  <label className="block">
                    <span className="font-semibold">{t.dateToShort || t.dateToLabel}</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-1">
          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="rounded border px-1.5 py-1 text-xs disabled:opacity-50"><ChevronsLeft className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="rounded border px-1.5 py-1 text-xs disabled:opacity-50"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="px-2 text-xs font-semibold">{currentPage} / {Math.max(1, totalPages)}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="rounded border px-1.5 py-1 text-xs disabled:opacity-50"><ChevronRight className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="rounded border px-1.5 py-1 text-xs disabled:opacity-50"><ChevronsRight className="h-3.5 w-3.5" /></button>
        </div>
        <span className="text-xs font-semibold">{totalItems} {t.itemsCount || t.resultsCount}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-3" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: '#6b7280' }}>{t.adminBusinessPaymentEmpty || 'Chưa có yêu cầu phí giới thiệu doanh nghiệp.'}</div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="overflow-hidden rounded-xl border bg-white shadow-sm" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center justify-between gap-2 border-b bg-[#fafafa] p-2.5" style={{ borderColor: '#f3f4f6' }}>
                  <span className="flex items-center gap-1 truncate text-[10px] font-semibold" style={{ color: '#2563eb' }}>
                    {inv.invoiceCode}
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={statusStyle(inv.status)}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                </div>
                <div className="space-y-1.5 p-2.5 text-[10px]">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{t.colCompany || 'Doanh nghiệp'}</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold" style={{ color: '#111827' }}>
                      <Building2 className="h-2.5 w-2.5 shrink-0" style={{ color: '#9ca3af' }} />
                      {inv.businessName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{t.colCandidate}</p>
                    <p className="mt-0.5 font-semibold" style={{ color: '#111827' }}>{inv.candidateName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{t.colJob}</p>
                    <p className="mt-0.5 line-clamp-2 font-medium" style={{ color: '#111827' }}>
                      <Briefcase className="mr-0.5 inline h-2.5 w-2.5" />
                      {inv.jobTitle || inv.jobCode || '—'}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between border-t pt-1.5" style={{ borderColor: '#f3f4f6' }}>
                    <span className="text-[9px] font-semibold" style={{ color: '#6b7280' }}>{t.colAmount || t.amountLabel}</span>
                    <span className="text-xs font-bold" style={{ color: '#16a34a' }}>{(inv.amount || 0).toLocaleString(dateLocale)}đ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[9px]" style={{ color: '#6b7280' }}>
                    <span>{t.colRequestDate || t.requestDate}:</span>
                    <span className="text-right">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString(dateLocale) : '—'}</span>
                    {inv.businessConfirmedAt ? (
                      <>
                        <span>{t.adminBusinessPaymentBizConfirmed || 'DN xác nhận TT'}:</span>
                        <span className="text-right">{new Date(inv.businessConfirmedAt).toLocaleDateString(dateLocale)}</span>
                      </>
                    ) : null}
                    {inv.paidAt ? (
                      <>
                        <span>{t.colPaidDate || t.paidDate}:</span>
                        <span className="text-right">{new Date(inv.paidAt).toLocaleDateString(dateLocale)}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between border-t pt-1.5" style={{ borderColor: '#f3f4f6' }}>
                    {inv.jobApplicationId ? (
                      <button type="button" onClick={() => navigate(`/admin/nominations/${inv.jobApplicationId}`)} className="text-[9px] font-medium" style={{ color: '#2563eb' }}>
                        {t.colNomination || 'Đơn tiến cử'} #{inv.jobApplicationId}
                      </button>
                    ) : <span />}
                    <div className="flex items-center gap-1">
                      {inv.jobApplicationId && (
                        <button type="button" onClick={() => navigate(`/admin/nominations/${inv.jobApplicationId}`)} className="rounded-lg p-1" style={{ color: '#2563eb' }} title={t.viewDetailTooltip || t.viewDetail}>
                          <Eye className="h-3 w-3" />
                        </button>
                      )}
                      {inv.status === 'processing' && (
                        <button type="button" onClick={() => setConfirmTarget(inv)} className="rounded-lg p-1" style={{ color: '#16a34a' }} title={t.adminBusinessPaymentConfirmPaid || 'Xác nhận hoàn tất'}>
                          <CheckCircle className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmTarget(null)}>
          <div className="flex w-full max-w-md flex-col gap-3 rounded-lg p-4 shadow-xl" style={{ backgroundColor: 'white' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-sm font-bold">{t.adminBusinessPaymentConfirmModalTitle || 'Xác nhận đã nhận thanh toán'}</h3>
              <button type="button" onClick={() => setConfirmTarget(null)} className="rounded p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs" style={{ color: '#475569' }}>
              {confirmTarget.invoiceCode} · {confirmTarget.businessName} · {(confirmTarget.amount || 0).toLocaleString(dateLocale)}đ
            </p>
            <label className="block text-xs font-semibold">
              {t.notesOptional}
              <input type="text" value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setConfirmTarget(null)} className="rounded-lg px-4 py-2 text-xs font-semibold" style={{ backgroundColor: '#f3f4f6' }}>{t.cancel}</button>
              <button type="button" onClick={handleConfirmPaid} disabled={confirmLoading} className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#16a34a' }}>
                {confirmLoading ? t.processing : (t.confirmButton || 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusinessPaymentListContent;
