import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  Edit,
  ExternalLink,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
  XCircle,
} from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const STATUS_OPTIONS = [
  { value: '0', label: 'Chờ duyệt', dot: '#94a3b8' },
  { value: '1', label: 'Hoạt động', dot: '#10b981' },
  { value: '2', label: 'Từ chối', dot: '#ef4444' },
  { value: '3', label: 'Tạm khóa', dot: '#f59e0b' },
];

function statusBadge(status) {
  const n = Number(status);
  if (n === 1) return { text: 'Hoạt động', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
  if (n === 2) return { text: 'Từ chối', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
  if (n === 3) return { text: 'Tạm khóa', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
  return { text: 'Chờ duyệt', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
}

export default function AdminBusinessesPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const [searchParams] = useSearchParams();
  const headerSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(headerSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [hoveredResetButton, setHoveredResetButton] = useState(false);
  const [hoveredRefreshButton, setHoveredRefreshButton] = useState(false);
  const [hoveredAddButton, setHoveredAddButton] = useState(false);
  const [hoveredPaginationNavButton, setHoveredPaginationNavButton] = useState(null);
  const [hoveredPaginationButtonIndex, setHoveredPaginationButtonIndex] = useState(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [hoveredIdLinkIndex, setHoveredIdLinkIndex] = useState(null);
  const [hoveredNameLinkIndex, setHoveredNameLinkIndex] = useState(null);
  const [hoveredViewButtonIndex, setHoveredViewButtonIndex] = useState(null);
  const [hoveredEditButtonIndex, setHoveredEditButtonIndex] = useState(null);
  const [hoveredDeleteButtonIndex, setHoveredDeleteButtonIndex] = useState(null);
  const [hoveredApproveButtonIndex, setHoveredApproveButtonIndex] = useState(null);
  const [hoveredRejectButtonIndex, setHoveredRejectButtonIndex] = useState(null);
  const [hoveredLockButtonIndex, setHoveredLockButtonIndex] = useState(null);

  useEffect(() => {
    setSearchQuery(headerSearch);
    setCurrentPage(1);
  }, [headerSearch]);

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'id',
        sortOrder: 'DESC',
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== '') params.status = statusFilter;
      const res = await apiService.getAdminBusinesses(params);
      if (res?.success) {
        setBusinesses(res.data?.businesses || []);
        setPagination(res.data?.pagination || { total: 0, totalPages: 0, limit: itemsPerPage });
        setSelectedRows(new Set());
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Không tải được danh sách doanh nghiệp');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, itemsPerPage]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const totalPages = pagination.totalPages || 0;
  const totalItems = pagination.total || 0;

  const dateLocale = language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'vi-VN';
  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString(dateLocale);
    } catch {
      return '—';
    }
  };

  const statusFilterLabel = statusFilter === ''
    ? (t.allStatus || 'Tất cả trạng thái')
    : (STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || t.status);

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
    setIsStatusFilterOpen(false);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(businesses.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index) => {
    const next = new Set(selectedRows);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedRows(next);
  };

  const handleUpdateStatus = async (biz, newStatus, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoadingId(biz.id);
    try {
      const res = await apiService.updateAdminBusiness(biz.id, { status: newStatus });
      if (res?.success) {
        await loadBusinesses();
      } else {
        alert(res?.message || 'Cập nhật trạng thái thất bại');
      }
    } catch (err) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = (biz, e) => {
    e?.stopPropagation?.();
    handleUpdateStatus(biz, 1, `Duyệt tài khoản "${biz.companyName}"?`);
  };

  const handleReject = (biz, e) => {
    e?.stopPropagation?.();
    handleUpdateStatus(biz, 2, `Từ chối tài khoản "${biz.companyName}"?`);
  };

  const handleLock = (biz, e) => {
    e?.stopPropagation?.();
    handleUpdateStatus(biz, 3, `Tạm khóa tài khoản "${biz.companyName}"?`);
  };

  const handleUnlock = (biz, e) => {
    e?.stopPropagation?.();
    handleUpdateStatus(biz, 1, `Mở khóa tài khoản "${biz.companyName}"?`);
  };

  const handleDelete = async (biz, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Xóa tài khoản "${biz.companyName}"?`)) return;
    setActionLoadingId(biz.id);
    try {
      const res = await apiService.deleteAdminBusiness(biz.id);
      if (res?.success) loadBusinesses();
      else alert(res?.message || 'Xóa thất bại');
    } catch (err) {
      alert(err.message || 'Xóa thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (biz) => {
    const badge = statusBadge(biz.status);
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
      >
        {Number(biz.status) === 1 && <CheckCircle className="h-3 w-3" />}
        {Number(biz.status) === 2 && <XCircle className="h-3 w-3" />}
        {Number(biz.status) === 3 && <Lock className="h-3 w-3" />}
        {badge.text}
      </span>
    );
  };

  const renderQuickStatusActions = (biz, index, compact = false) => {
    const busy = actionLoadingId === biz.id;
    const n = Number(biz.status);

    if (n === 0) {
      return (
        <div className={`inline-flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
          <button
            type="button"
            disabled={busy}
            title="Duyệt"
            onClick={(e) => handleApprove(biz, e)}
            onMouseEnter={() => setHoveredApproveButtonIndex(index)}
            onMouseLeave={() => setHoveredApproveButtonIndex(null)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: hoveredApproveButtonIndex === index ? '#bbf7d0' : '#dcfce7',
              color: '#166534',
            }}
          >
            <CheckCircle className="h-3 w-3" />
            {!compact && 'Duyệt'}
          </button>
          <button
            type="button"
            disabled={busy}
            title="Từ chối"
            onClick={(e) => handleReject(biz, e)}
            onMouseEnter={() => setHoveredRejectButtonIndex(index)}
            onMouseLeave={() => setHoveredRejectButtonIndex(null)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: hoveredRejectButtonIndex === index ? '#fecaca' : '#fee2e2',
              color: '#991b1b',
            }}
          >
            <XCircle className="h-3 w-3" />
            {!compact && 'Từ chối'}
          </button>
        </div>
      );
    }

    if (n === 1) {
      return (
        <button
          type="button"
          disabled={busy}
          title="Tạm khóa"
          onClick={(e) => handleLock(biz, e)}
          onMouseEnter={() => setHoveredLockButtonIndex(index)}
          onMouseLeave={() => setHoveredLockButtonIndex(null)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50"
          style={{
            backgroundColor: hoveredLockButtonIndex === index ? '#fde68a' : '#fef3c7',
            color: '#b45309',
          }}
        >
          <Lock className="h-3 w-3" />
          {!compact && 'Khóa'}
        </button>
      );
    }

    if (n === 3 || n === 2) {
      return (
        <button
          type="button"
          disabled={busy}
          title="Kích hoạt lại"
          onClick={(e) => handleUnlock(biz, e)}
          onMouseEnter={() => setHoveredApproveButtonIndex(index)}
          onMouseLeave={() => setHoveredApproveButtonIndex(null)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50"
          style={{
            backgroundColor: hoveredApproveButtonIndex === index ? '#bbf7d0' : '#dcfce7',
            color: '#166534',
          }}
        >
          <Unlock className="h-3 w-3" />
          {!compact && 'Kích hoạt'}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter */}
      <div className="px-2 sm:px-3 py-1.5 mb-1.5 flex-shrink-0">
        <div className="flex w-full items-center gap-2.5 flex-wrap justify-between">
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-white px-3 py-1.5 text-[11px] sm:min-w-[220px] sm:text-[13px]">
            <Search className="w-3.5 h-3.5 mr-2 flex-shrink-0" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={t.adminBusinessSearchPlaceholder || 'Tìm theo tên, email, MST...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent outline-none text-[11px] sm:text-[13px]"
              style={{ border: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/business-accounts/create')}
            onMouseEnter={() => setHoveredAddButton(true)}
            onMouseLeave={() => setHoveredAddButton(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] sm:hidden"
            style={{ backgroundColor: hoveredAddButton ? '#b91c1c' : '#dc2626', color: 'white' }}
            aria-label={t.adminBusinessCreate || 'Thêm doanh nghiệp'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            onMouseEnter={() => setHoveredResetButton(true)}
            onMouseLeave={() => setHoveredResetButton(false)}
            className="inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-semibold sm:hidden"
            style={{ backgroundColor: hoveredResetButton ? '#e5e7eb' : '#f3f4f6', color: '#374151' }}
          >
            {t.resetButton || t.reset || 'Reset'}
          </button>

          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2.5 sm:overflow-visible sm:pb-0">
            <button
              type="button"
              onClick={handleReset}
              onMouseEnter={() => setHoveredResetButton(true)}
              onMouseLeave={() => setHoveredResetButton(false)}
              className="hidden px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors sm:inline-flex"
              style={{ backgroundColor: hoveredResetButton ? '#e5e7eb' : '#f3f4f6', color: '#374151' }}
            >
              {t.resetButton || t.reset || 'Reset'}
            </button>

            <button
              type="button"
              onClick={loadBusinesses}
              onMouseEnter={() => setHoveredRefreshButton(true)}
              onMouseLeave={() => setHoveredRefreshButton(false)}
              className="px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              style={{ backgroundColor: hoveredRefreshButton ? '#e5e7eb' : '#f3f4f6', color: '#374151' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="sm:hidden">Làm mới</span>
              <span className="hidden sm:inline">{t.refreshButton || 'Làm mới'}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusFilterOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[10px] sm:text-xs font-semibold whitespace-nowrap shrink-0"
                style={{
                  color: statusFilter !== '' ? '#1d4ed8' : '#374151',
                  backgroundColor: statusFilter !== '' ? '#eff6ff' : 'white',
                  border: statusFilter !== '' ? '1px solid #bfdbfe' : '1px solid transparent',
                }}
              >
                {statusFilterLabel}
                <ChevronDown className="w-3 h-3" />
              </button>
              {isStatusFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} aria-hidden />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white p-3 z-20 text-[11px] sm:text-xs" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="business-status"
                          checked={statusFilter === ''}
                          onChange={() => { setStatusFilter(''); setCurrentPage(1); setIsStatusFilterOpen(false); }}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: '#2563eb' }}
                        />
                        <span>{t.allStatus || 'Tất cả trạng thái'}</span>
                      </label>
                      {STATUS_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="business-status"
                            checked={statusFilter === opt.value}
                            onChange={() => { setStatusFilter(opt.value); setCurrentPage(1); setIsStatusFilterOpen(false); }}
                            className="w-3.5 h-3.5"
                            style={{ accentColor: '#2563eb' }}
                          />
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.dot }} />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/business-accounts/create')}
              onMouseEnter={() => setHoveredAddButton(true)}
              onMouseLeave={() => setHoveredAddButton(false)}
              className="hidden sm:inline-flex px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold items-center gap-1.5 transition-colors"
              style={{ backgroundColor: hoveredAddButton ? '#b91c1c' : '#dc2626', color: 'white' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {t.adminBusinessCreate || 'Thêm doanh nghiệp'}
            </button>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 sm:px-3 mb-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || loading}
            onMouseEnter={() => !(currentPage === 1 || loading) && setHoveredPaginationNavButton('first')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="w-7 h-7 border rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'first' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: (currentPage === 1 || loading) ? 0.5 : 1,
              cursor: (currentPage === 1 || loading) ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            onMouseEnter={() => !(currentPage === 1 || loading) && setHoveredPaginationNavButton('prev')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="w-7 h-7 border rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'prev' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: (currentPage === 1 || loading) ? 0.5 : 1,
              cursor: (currentPage === 1 || loading) ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {[...Array(Math.min(7, Math.max(totalPages, 1)))].map((_, i) => {
            let pageNum;
            if (totalPages <= 7) pageNum = i + 1;
            else if (currentPage <= 4) pageNum = i + 1;
            else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = currentPage - 3 + i;
            if (pageNum < 1 || pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                disabled={loading}
                onMouseEnter={() => !loading && currentPage !== pageNum && setHoveredPaginationButtonIndex(pageNum)}
                onMouseLeave={() => setHoveredPaginationButtonIndex(null)}
                className="w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: currentPage === pageNum ? '#2563eb' : (hoveredPaginationButtonIndex === pageNum ? '#f9fafb' : 'white'),
                  border: currentPage === pageNum ? 'none' : '1px solid #d1d5db',
                  color: currentPage === pageNum ? 'white' : '#374151',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={currentPage >= totalPages || loading || totalPages === 0}
            onMouseEnter={() => !(currentPage >= totalPages || loading) && setHoveredPaginationNavButton('next')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="w-7 h-7 border rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'next' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: (currentPage >= totalPages || loading || totalPages === 0) ? 0.5 : 1,
              cursor: (currentPage >= totalPages || loading || totalPages === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages || 1)}
            disabled={currentPage >= totalPages || loading || totalPages === 0}
            onMouseEnter={() => !(currentPage >= totalPages || loading) && setHoveredPaginationNavButton('last')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="w-7 h-7 border rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'last' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: (currentPage >= totalPages || loading || totalPages === 0) ? 0.5 : 1,
              cursor: (currentPage >= totalPages || loading || totalPages === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            disabled={loading}
            className="px-2 py-0.5 border rounded-full text-[10px] font-semibold"
            style={{ borderColor: '#d1d5db', color: '#374151', outline: 'none', opacity: loading ? 0.5 : 1 }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-[10px] font-semibold" style={{ color: '#374151' }}>
            {totalItems} {t.itemsCount || t.items || 'mục'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-lg border min-h-0 relative" style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2563eb' }} />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: '#6b7280' }}>
            {t.adminBusinessEmpty || 'Chưa có tài khoản doanh nghiệp'}
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-2 p-2 sm:hidden">
              {businesses.map((biz, index) => (
                <div key={`mobile-${biz.id}`} className="rounded-xl border bg-white p-2.5" style={{ borderColor: '#e5e7eb' }}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => handleSelectRow(index)}
                        className="w-3.5 h-3.5 rounded"
                        style={{ accentColor: '#2563eb' }}
                      />
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                        className="font-medium text-[10px] flex items-center gap-1 truncate"
                        style={{ color: '#2563eb' }}
                      >
                        #{biz.id}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                    {renderStatusBadge(biz)}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[10px]" style={{ backgroundColor: '#2563eb' }}>
                      {biz.companyName?.charAt(0)?.toUpperCase() || 'B'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold" style={{ color: '#111827' }}>{biz.companyName}</p>
                      <p className="truncate text-[10px]" style={{ color: '#6b7280' }}>{biz.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]" style={{ color: '#374151' }}>
                    <span>MST:</span>
                    <span className="text-right">{biz.taxCode || '—'}</span>
                    <span>Credit:</span>
                    <span className="text-right font-semibold" style={{ color: '#6d28d9' }}>{(biz.credit ?? 0).toLocaleString()}</span>
                    <span>{t.colCreatedAt || 'Ngày tạo'}:</span>
                    <span className="text-right">{formatDate(biz.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-1.5" style={{ borderColor: '#f3f4f6' }}>
                    {renderQuickStatusActions(biz, index, true)}
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => navigate(`/admin/business-accounts/${biz.id}`)} className="p-1 rounded" style={{ color: '#2563eb' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => navigate(`/admin/business-accounts/${biz.id}`)} className="p-1 rounded" style={{ color: '#4b5563' }}>
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={(e) => handleDelete(biz, e)} className="p-1 rounded" style={{ color: '#dc2626' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th className="px-2 py-1.5 text-center text-[10px] font-bold border-b w-10" style={{ color: '#111827', borderColor: '#e5e7eb' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === businesses.length && businesses.length > 0}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: '#2563eb' }}
                    />
                  </th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>{t.colId || 'ID'}</th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>{t.colCompanyName || 'Tên DN'}</th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>Email</th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>MST</th>
                  <th className="px-2.5 py-1.5 text-right text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>Credit</th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>{t.colStatus || 'Trạng thái'}</th>
                  <th className="px-2.5 py-1.5 text-left text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>{t.colCreatedAt || 'Ngày tạo'}</th>
                  <th className="px-2.5 py-1.5 text-center text-[10px] font-bold border-b" style={{ color: '#111827', borderColor: '#e5e7eb' }}>{t.colActions || 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                {businesses.map((biz, index) => (
                  <tr
                    key={biz.id}
                    className="transition-colors"
                    onMouseEnter={() => setHoveredRowIndex(index)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                    style={{ backgroundColor: hoveredRowIndex === index ? '#f9fafb' : 'transparent' }}
                  >
                    <td className="px-2.5 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => handleSelectRow(index)}
                        className="w-3.5 h-3.5 rounded"
                        style={{ accentColor: '#2563eb' }}
                      />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                        onMouseEnter={() => setHoveredIdLinkIndex(index)}
                        onMouseLeave={() => setHoveredIdLinkIndex(null)}
                        className="font-medium text-[10px] flex items-center gap-1"
                        style={{ color: hoveredIdLinkIndex === index ? '#1e40af' : '#2563eb' }}
                      >
                        {biz.id}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[10px] shrink-0" style={{ backgroundColor: '#2563eb' }}>
                          {biz.companyName?.charAt(0)?.toUpperCase() || 'B'}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                            onMouseEnter={() => setHoveredNameLinkIndex(index)}
                            onMouseLeave={() => setHoveredNameLinkIndex(null)}
                            className="text-[10px] font-semibold truncate block max-w-[180px] text-left"
                            style={{ color: hoveredNameLinkIndex === index ? '#2563eb' : '#111827' }}
                          >
                            {biz.companyName}
                          </button>
                          {biz.contactName && (
                            <div className="text-[10px] truncate" style={{ color: '#6b7280' }}>{biz.contactName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 text-[10px]" style={{ color: '#374151' }}>{biz.email}</td>
                    <td className="px-2.5 py-1.5 text-[10px]" style={{ color: '#374151' }}>{biz.taxCode || '—'}</td>
                    <td className="px-2.5 py-1.5 text-right text-[10px] font-semibold" style={{ color: '#6d28d9' }}>
                      <span className="inline-flex items-center justify-end gap-0.5">
                        <Coins className="h-3 w-3" />
                        {(biz.credit ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex flex-col gap-1 items-start">
                        {renderStatusBadge(biz)}
                        {renderQuickStatusActions(biz, index, true)}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 text-[10px]" style={{ color: '#374151' }}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" style={{ color: '#9ca3af' }} />
                        {formatDate(biz.createdAt)}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                          onMouseEnter={() => setHoveredViewButtonIndex(index)}
                          onMouseLeave={() => setHoveredViewButtonIndex(null)}
                          className="p-1 rounded transition-colors"
                          style={{
                            color: hoveredViewButtonIndex === index ? '#1e40af' : '#2563eb',
                            backgroundColor: hoveredViewButtonIndex === index ? '#eff6ff' : 'transparent',
                          }}
                          title={t.viewDetailTooltip || 'Chi tiết'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                          onMouseEnter={() => setHoveredEditButtonIndex(index)}
                          onMouseLeave={() => setHoveredEditButtonIndex(null)}
                          className="p-1 rounded transition-colors"
                          style={{
                            color: hoveredEditButtonIndex === index ? '#1f2937' : '#4b5563',
                            backgroundColor: hoveredEditButtonIndex === index ? '#f3f4f6' : 'transparent',
                          }}
                          title={t.edit || 'Sửa'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(biz, e)}
                          disabled={actionLoadingId === biz.id}
                          onMouseEnter={() => setHoveredDeleteButtonIndex(index)}
                          onMouseLeave={() => setHoveredDeleteButtonIndex(null)}
                          className="p-1 rounded transition-colors disabled:opacity-50"
                          style={{
                            color: hoveredDeleteButtonIndex === index ? '#991b1b' : '#dc2626',
                            backgroundColor: hoveredDeleteButtonIndex === index ? '#fef2f2' : 'transparent',
                          }}
                          title={t.delete || 'Xóa'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
