import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  Coins,
} from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: '0', label: 'Chờ duyệt' },
  { value: '1', label: 'Hoạt động' },
  { value: '2', label: 'Từ chối' },
  { value: '3', label: 'Tạm khóa' },
];

function statusBadge(status) {
  const n = Number(status);
  if (n === 1) return { text: 'Hoạt động', className: 'bg-emerald-100 text-emerald-800' };
  if (n === 2) return { text: 'Từ chối', className: 'bg-red-100 text-red-800' };
  if (n === 3) return { text: 'Tạm khóa', className: 'bg-amber-100 text-amber-800' };
  return { text: 'Chờ duyệt', className: 'bg-slate-100 text-slate-700' };
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
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });

  useEffect(() => {
    setSearchQuery(headerSearch);
    setCurrentPage(1);
  }, [headerSearch]);

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        sortBy: 'id',
        sortOrder: 'DESC',
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== '') params.status = statusFilter;
      const res = await apiService.getAdminBusinesses(params);
      if (res?.success) {
        setBusinesses(res.data?.businesses || []);
        setPagination(res.data?.pagination || { total: 0, totalPages: 0, limit: 20 });
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Không tải được danh sách doanh nghiệp');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleDelete = async (biz) => {
    if (!window.confirm(`Xóa tài khoản "${biz.companyName}"?`)) return;
    try {
      const res = await apiService.deleteAdminBusiness(biz.id);
      if (res?.success) loadBusinesses();
      else alert(res?.message || 'Xóa thất bại');
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t.adminBusinessAccountManagement || 'Quản lý tài khoản doanh nghiệp'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t.adminBusinessAccountSubtitle || 'Tài khoản JobShare Business portal — credit & hồ sơ'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/business-accounts/create')}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          <Plus className="w-4 h-4" />
          {t.adminBusinessCreate || 'Thêm doanh nghiệp'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={t.adminBusinessSearchPlaceholder || 'Tìm theo tên, email, MST...'}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">{t.loading || 'Đang tải...'}</div>
        ) : businesses.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">{t.adminBusinessEmpty || 'Chưa có tài khoản doanh nghiệp'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t.colCompanyName || 'Tên DN'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">MST</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Credit</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t.status || 'Trạng thái'}</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">{t.actions || 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => {
                  const badge = statusBadge(biz.status);
                  return (
                    <tr key={biz.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-500">#{biz.id}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                          className="font-medium text-gray-900 hover:text-red-700 text-left"
                        >
                          {biz.companyName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{biz.email}</td>
                      <td className="px-4 py-3 text-gray-600">{biz.taxCode}</td>
                      <td className="px-4 py-3 text-right font-semibold text-violet-700">
                        <span className="inline-flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {(biz.credit ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Chi tiết"
                            onClick={() => navigate(`/admin/business-accounts/${biz.id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Xóa"
                            onClick={() => handleDelete(biz)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= pagination.totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 rounded-lg border disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
