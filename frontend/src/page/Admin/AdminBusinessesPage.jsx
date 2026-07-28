import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  Edit,
  Plus,
  Search,
  Trash2,
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
  if (n === 1) return { text: 'Hoạt động', bg: '#d1fae5', color: '#047857', border: '#6ee7b7' };
  if (n === 2) return { text: 'Từ chối', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
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
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [hoveredAddButton, setHoveredAddButton] = useState(false);
  const [hoveredResetButton, setHoveredResetButton] = useState(false);
  const [hoveredPaginationNavButton, setHoveredPaginationNavButton] = useState(null);
  const [hoveredPaginationButtonIndex, setHoveredPaginationButtonIndex] = useState(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

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

  const statusFilterLabel = useMemo(() => {
    if (statusFilter === '') return t.allStatus || 'Tất cả trạng thái';
    return STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || t.status;
  }, [statusFilter, t]);

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
    setItemsPerPage(20);
  };

  const handleDelete = async (biz, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Xóa tài khoản "${biz.companyName}"?`)) return;
    try {
      const res = await apiService.deleteAdminBusiness(biz.id);
      if (res?.success) loadBusinesses();
      else alert(res?.message || 'Xóa thất bại');
    } catch (err) {
      alert(err.message || 'Xóa thất bại');
    }
  };

  const openDetail = (id) => navigate(`/admin/business-accounts/${id}`);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="w-full px-0 py-1.5 mb-1.5 flex-shrink-0 lg:py-1 lg:mb-1 xl:py-1.5 xl:mb-1.5">
        <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:gap-1.5 xl:gap-2.5">
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-white px-2.5 py-2 text-[9px] sm:min-w-[220px] sm:text-xs lg:px-2 lg:py-1.5 lg:text-[9px] xl:px-3 xl:py-2 xl:text-xs">
            <Search className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 xl:mr-2" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={t.adminBusinessSearchPlaceholder || 'Tìm theo tên, email, MST...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-[9px] outline-none placeholder:text-[9px] sm:text-xs sm:placeholder:text-xs lg:text-[9px] xl:text-xs"
              style={{ border: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/business-accounts/create')}
            onMouseEnter={() => setHoveredAddButton(true)}
            onMouseLeave={() => setHoveredAddButton(false)}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:hidden"
            style={{ backgroundColor: hoveredAddButton ? '#dc2626' : '#ef4444', color: 'white' }}
            aria-label={t.adminBusinessCreate || 'Thêm doanh nghiệp'}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-8 flex-shrink-0 items-center justify-center rounded-full px-3 text-[8px] font-semibold sm:hidden"
            style={{ backgroundColor: hoveredResetButton ? '#e5e7eb' : '#f3f4f6', color: '#374151' }}
            onMouseEnter={() => setHoveredResetButton(true)}
            onMouseLeave={() => setHoveredResetButton(false)}
          >
            {t.reset || 'Reset'}
          </button>

          <div className="flex w-full items-center justify-start gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-wrap sm:justify-end sm:gap-1.5 sm:overflow-visible sm:pb-0 lg:gap-1.5 xl:gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              onMouseEnter={() => setHoveredResetButton(true)}
              onMouseLeave={() => setHoveredResetButton(false)}
              className="hidden rounded-full px-2.5 py-1.5 text-[9px] font-semibold transition-colors sm:inline-flex sm:text-[10px] lg:px-2 lg:py-1 lg:text-[9px] xl:px-3 xl:py-1.5 xl:text-[10px]"
              style={{ backgroundColor: hoveredResetButton ? '#e5e7eb' : '#f3f4f6', color: '#374151' }}
            >
              {t.reset || 'Reset'}
            </button>

            <div className="relative">
              <button
                type="button"
                title={t.status || 'Trạng thái'}
                onClick={() => setIsStatusFilterOpen((v) => !v)}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1.5 text-[8px] font-semibold sm:text-[10px] lg:gap-1 lg:px-2 lg:py-1 lg:text-[9px] xl:gap-1.5 xl:px-3 xl:py-1.5 xl:text-[10px]"
                style={{
                  color: statusFilter !== '' ? '#1d4ed8' : '#374151',
                  backgroundColor: statusFilter !== '' ? '#eff6ff' : 'white',
                  border: statusFilter !== '' ? '1px solid #bfdbfe' : '1px solid transparent',
                }}
              >
                <span className="sm:hidden">{t.status || 'Trạng thái'}</span>
                <span className="hidden sm:inline max-w-[120px] truncate">{statusFilterLabel}</span>
                <ChevronDown className="h-2.5 w-2.5 xl:h-3 xl:w-3" />
              </button>
              {isStatusFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} aria-hidden />
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl border bg-white p-2.5 z-20 text-[9px] sm:text-[10px] lg:p-2 xl:p-3 xl:text-[10px]"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => { setStatusFilter(''); setCurrentPage(1); setIsStatusFilterOpen(false); }}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50"
                        style={{ color: statusFilter === '' ? '#1d4ed8' : '#374151', fontWeight: statusFilter === '' ? 600 : 400 }}
                      >
                        {t.allStatus || 'Tất cả trạng thái'}
                      </button>
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setIsStatusFilterOpen(false); }}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50"
                          style={{ color: statusFilter === opt.value ? '#1d4ed8' : '#374151', fontWeight: statusFilter === opt.value ? 600 : 400 }}
                        >
                          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: opt.dot }} />
                          {opt.label}
                        </button>
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
              className="hidden rounded-full px-2.5 py-1.5 text-[9px] font-semibold transition-colors sm:inline-flex sm:text-[10px] lg:px-2 lg:py-1 lg:text-[9px] xl:px-3 xl:py-1.5 xl:text-[10px]"
              style={{ backgroundColor: hoveredAddButton ? '#dc2626' : '#ef4444', color: 'white' }}
            >
              {t.adminBusinessCreate || 'Thêm doanh nghiệp'}
            </button>
          </div>
        </div>
      </div>

      {/* Pagination top */}
      <div className="mb-2 flex flex-shrink-0 flex-wrap items-center justify-between gap-y-2 xl:mb-3">
        <div className="flex items-center gap-1 xl:gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            onMouseEnter={() => currentPage !== 1 && setHoveredPaginationNavButton('first')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="px-1.5 py-1 border rounded text-xs font-semibold transition-colors lg:px-1 lg:py-0.5 lg:text-[11px] xl:text-xs"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'first' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            onMouseEnter={() => currentPage !== 1 && setHoveredPaginationNavButton('prev')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="px-1.5 py-1 border rounded text-xs font-semibold transition-colors lg:px-1 lg:py-0.5 lg:text-[11px] xl:text-xs"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'prev' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
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
                onMouseEnter={() => currentPage !== pageNum && setHoveredPaginationButtonIndex(pageNum)}
                onMouseLeave={() => setHoveredPaginationButtonIndex(null)}
                className="px-2 py-1 rounded text-xs font-semibold transition-colors lg:px-1.5 lg:py-0.5 lg:text-[11px] xl:px-2.5 xl:py-1 xl:text-xs"
                style={{
                  backgroundColor: currentPage === pageNum ? '#2563eb' : (hoveredPaginationButtonIndex === pageNum ? '#f9fafb' : 'white'),
                  border: currentPage === pageNum ? 'none' : '1px solid #d1d5db',
                  color: currentPage === pageNum ? 'white' : '#374151',
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            onMouseEnter={() => currentPage < totalPages && setHoveredPaginationNavButton('next')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="px-1.5 py-1 border rounded text-xs font-semibold transition-colors lg:px-1 lg:py-0.5 lg:text-[11px] xl:text-xs"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'next' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: currentPage >= totalPages || totalPages === 0 ? 0.5 : 1,
              cursor: currentPage >= totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages || 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            onMouseEnter={() => currentPage < totalPages && setHoveredPaginationNavButton('last')}
            onMouseLeave={() => setHoveredPaginationNavButton(null)}
            className="px-1.5 py-1 border rounded text-xs font-semibold transition-colors lg:px-1 lg:py-0.5 lg:text-[11px] xl:text-xs"
            style={{
              backgroundColor: hoveredPaginationNavButton === 'last' ? '#f9fafb' : 'white',
              borderColor: '#d1d5db', color: '#374151',
              opacity: currentPage >= totalPages || totalPages === 0 ? 0.5 : 1,
              cursor: currentPage >= totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-1 xl:gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 border rounded text-xs font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px] xl:px-2.5 xl:py-1 xl:text-xs"
            style={{ borderColor: '#d1d5db', color: '#374151', outline: 'none' }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-xs font-semibold lg:text-[11px] xl:text-xs" style={{ color: '#374151' }}>
            {totalItems} {t.items || 'mục'}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto relative">
        {/* Mobile cards */}
        <div className="space-y-3 px-0.5 pb-4 lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm" style={{ color: '#6b7280' }}>
              {t.loading || 'Đang tải...'}
            </div>
          ) : businesses.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm" style={{ color: '#6b7280' }}>
              {t.adminBusinessEmpty || 'Chưa có tài khoản doanh nghiệp'}
            </div>
          ) : (
            businesses.map((biz) => {
              const badge = statusBadge(biz.status);
              return (
                <div
                  key={biz.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(biz.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(biz.id); } }}
                  className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="font-semibold text-gray-900 truncate">{biz.companyName}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">#{biz.id} · {biz.taxCode}</p>
                      <p className="mt-1 text-sm text-gray-600 truncate">{biz.email}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
                        <Coins className="h-3.5 w-3.5" />
                        {(biz.credit ?? 0).toLocaleString()} credit
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openDetail(biz.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(biz, e)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden h-full overflow-x-auto lg:block">
          <table className="w-full table-auto border-separate [border-spacing:0_2px] xl:[border-spacing:0_4px]">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'white' }}>
              <tr>
                <th className="min-w-[48px] px-px py-1.5 text-left text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>ID</th>
                <th className="min-w-[140px] px-px py-1.5 text-left text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>{t.colCompanyName || 'Tên DN'}</th>
                <th className="min-w-[120px] px-px py-1.5 text-left text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>Email</th>
                <th className="min-w-[90px] px-px py-1.5 text-left text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>MST</th>
                <th className="min-w-[80px] px-px py-1.5 text-right text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>Credit</th>
                <th className="min-w-[90px] px-px py-1.5 text-left text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>{t.status || 'Trạng thái'}</th>
                <th className="min-w-[80px] px-px py-1.5 text-center text-[8px] font-bold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>{t.actions || 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-2 py-5 text-center text-[9px] xl:py-6 xl:text-[10px]" style={{ color: '#6b7280' }}>
                    {t.loading || 'Đang tải...'}
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-5 text-center text-[9px] xl:py-6 xl:text-[10px]" style={{ color: '#6b7280' }}>
                    {t.adminBusinessEmpty || 'Chưa có tài khoản doanh nghiệp'}
                  </td>
                </tr>
              ) : (
                businesses.map((biz, index) => {
                  const badge = statusBadge(biz.status);
                  return (
                    <tr
                      key={biz.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        backgroundColor: hoveredRowIndex === index ? '#f9fafb' : 'white',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
                      }}
                      onClick={() => openDetail(biz.id)}
                      onMouseEnter={() => setHoveredRowIndex(index)}
                      onMouseLeave={() => setHoveredRowIndex(null)}
                    >
                      <td className="px-px py-px align-middle text-[8px] xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#6b7280' }}>
                        #{biz.id}
                      </td>
                      <td className="px-px py-px align-middle text-[8px] xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#111827' }}>
                        <div className="font-medium">{biz.companyName}</div>
                        {biz.contactName && (
                          <div className="text-[8px] lg:text-[9px]" style={{ color: '#6b7280' }}>{biz.contactName}</div>
                        )}
                      </td>
                      <td className="px-px py-px align-middle text-[8px] xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#374151' }}>
                        {biz.email}
                      </td>
                      <td className="px-px py-px align-middle text-[8px] xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#374151' }}>
                        {biz.taxCode}
                      </td>
                      <td className="px-px py-px align-middle text-right text-[8px] font-semibold xl:px-0.5 lg:text-[9px] xl:text-[10px]" style={{ color: '#6d28d9' }}>
                        <span className="inline-flex items-center justify-end gap-0.5">
                          <Coins className="h-3 w-3" />
                          {(biz.credit ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-px py-px align-middle xl:px-0.5">
                        <span
                          className="inline-flex rounded px-1 py-0.5 text-[8px] font-semibold lg:text-[9px] xl:text-[10px]"
                          style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-px py-px align-middle text-center xl:px-0.5" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            title="Chi tiết"
                            onClick={() => openDetail(biz.id)}
                            className="rounded p-1 transition-colors hover:bg-gray-100"
                            style={{ color: '#4b5563' }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Xóa"
                            onClick={(e) => handleDelete(biz, e)}
                            className="rounded p-1 transition-colors hover:bg-red-50"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
