import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  X,
  Check,
  Mail,
  Phone,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

const TAB_PENDING = 'pending';
const TAB_APPROVED = 'approved';
const TAB_REJECTED = 'rejected';

const CollaboratorApprovalPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const l = (vi, en, ja) => (language === 'en' ? en : language === 'ja' ? ja : vi);
  const [activeTab, setActiveTab] = useState(TAB_PENDING);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const headerSearch = searchParams.get('search') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    // Header search sync via query string `?search=...`
    setSearchQuery(headerSearch);
    setCurrentPage(1);
  }, [headerSearch]);

  const getStatusParam = () => {
    if (activeTab === TAB_PENDING) return 0;
    if (activeTab === TAB_APPROVED) return 1;
    return null; // rejected: backend chưa hỗ trợ filter, hiển thị empty
  };

  const loadCollaborators = async () => {
    const statusParam = getStatusParam();
    if (activeTab === TAB_REJECTED) {
      setCollaborators([]);
      setPagination({ total: 0, page: 1, limit: itemsPerPage, totalPages: 0 });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusParam,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await apiService.getCollaborators(params);
      if (response.success && response.data) {
        setCollaborators(response.data.collaborators || []);
        setPagination(
          response.data.pagination || {
            total: 0,
            page: 1,
            limit: itemsPerPage,
            totalPages: 0,
          }
        );
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, [activeTab, currentPage, itemsPerPage, searchQuery]);

  const totalItems = pagination.total || 0;
  const totalPages = pagination.totalPages || 0;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(collaborators.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApproveBulk = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      alert(t.collaboratorApprovalNoSelection);
      return;
    }
    if (!window.confirm(t.collaboratorApprovalConfirmBulk.replace('{count}', ids.length))) return;
    try {
      setApproving(true);
      const response = await apiService.approveCollaboratorsBulk(ids);
      if (response.success) {
        alert(response.message || t.collaboratorApprovalSuccess);
        setSelectedIds(new Set());
        loadCollaborators();
      } else {
        alert(response.message || t.collaboratorApprovalFailure);
      }
    } catch (error) {
      alert(error.message || t.collaboratorApprovalErrorGeneric);
    } finally {
      setApproving(false);
    }
  };

  const handleApproveOne = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm(t.collaboratorApprovalConfirmOne)) return;
    try {
      setApproving(true);
      const response = await apiService.approveCollaborator(id);
      if (response.success) {
        alert(t.collaboratorApprovalSuccess);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadCollaborators();
      } else {
        alert(response.message || t.collaboratorApprovalFailure);
      }
    } catch (error) {
      alert(error.message || t.collaboratorApprovalErrorGeneric);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectOne = async (id, e) => {
    e?.stopPropagation();
    const reason = window.prompt(
      t.rejectReasonLabel || l('Lý do từ chối (tùy chọn):', 'Rejection reason (optional):', '辞退理由（任意）:'),
    );
    if (reason === null) return; // user cancelled
    try {
      setRejecting(true);
      const response = await apiService.rejectCollaborator(id, reason || undefined);
      if (response.success) {
        alert(response.message || l('Từ chối thành công.', 'Rejected successfully.', '辞退しました。'));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadCollaborators();
      } else {
        alert(response.message || l('Từ chối thất bại.', 'Rejection failed.', '辞退に失敗しました。'));
      }
    } catch (error) {
      alert(error.message || l('Có lỗi xảy ra.', 'An error occurred.', 'エラーが発生しました。'));
    } finally {
      setRejecting(false);
    }
  };

  const allSelected = collaborators.length > 0 && selectedIds.size === collaborators.length;
  const showBulkActions = activeTab === TAB_PENDING;
  const dateLocale = language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'vi-VN';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(dateLocale);
  };

  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'CV';

  const tabs = [
    { id: TAB_PENDING, label: t.tabApprovalPending },
    { id: TAB_APPROVED, label: t.tabApprovalApproved },
    { id: TAB_REJECTED, label: t.tabApprovalRejected },
  ];

  const switchTab = (id) => {
    setActiveTab(id);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const pageNumbers = (() => {
    const count = Math.min(7, totalPages);
    return [...Array(count)].map((_, i) => {
      if (totalPages <= 7 || currentPage <= 4) return i + 1;
      if (currentPage >= totalPages - 3) return totalPages - 6 + i;
      return currentPage - 3 + i;
    });
  })();

  const navButtonClass =
    'w-6 h-6 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';

  const emptyState = (text) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-center">
      <UserCheck className="w-8 h-8 text-gray-300 mb-2" />
      <p className="text-xs text-gray-500">{text}</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 border-b border-gray-200 px-2 sm:px-3 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={`-mb-px px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + bulk actions */}
      <div className="px-2 sm:px-3 py-1.5 mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap justify-between">
          <div className="flex items-stretch rounded-lg border border-red-500 bg-white w-full max-w-[500px] overflow-hidden shadow-sm">
            <div className="flex flex-1 items-center gap-2 pl-3 pr-2 py-1.5 min-w-0">
              <Search className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
              <input
                type="text"
                placeholder={t.collaboratorApprovalSearchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-0 bg-transparent outline-none text-[12px] sm:text-[13px] text-gray-700 placeholder:text-gray-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="px-4 py-1.5 bg-red-500 text-white font-semibold text-[12px] sm:text-[13px] hover:bg-red-600 transition-colors flex-shrink-0"
            >
              {l('Tìm kiếm', 'Search', '検索')}
            </button>
          </div>

          {showBulkActions && (
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              {collaborators.length > 0 && (
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500 bg-white text-[11px] sm:text-xs font-semibold text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 accent-red-600"
                  />
                  {l('Chọn tất cả', 'Select all', 'すべて選択')}
                </label>
              )}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-full border border-gray-300 bg-white text-[11px] sm:text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.collaboratorApprovalClearSelection}
                </button>
              )}
              <button
                type="button"
                onClick={handleApproveBulk}
                disabled={approving || selectedIds.size === 0}
                className="px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 text-white bg-red-600 hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                {t.collaboratorApprovalApproveSelected} ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {activeTab !== TAB_REJECTED && (
        <div className="flex items-center justify-between px-2 sm:px-3 mb-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={navButtonClass}>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={navButtonClass}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors ${
                  currentPage === pageNum
                    ? 'bg-red-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={navButtonClass}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className={navButtonClass}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 border border-gray-300 rounded-full text-[10px] font-semibold text-gray-700 outline-none focus:border-red-500"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-[10px] font-semibold text-gray-700">
              {totalItems} {activeTab === TAB_PENDING ? t.collaboratorApprovalPendingCountLabel : t.collaboratorsTotalItemsSuffix}
            </span>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 sm:px-3 pb-3 space-y-2">
        {activeTab === TAB_REJECTED ? (
          emptyState(t.noRejectedCollaborators)
        ) : loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-xs text-gray-500">
            {t.loadingData}
          </div>
        ) : collaborators.length === 0 ? (
          emptyState(activeTab === TAB_PENDING ? t.noCollaboratorsPendingApproval : t.noApprovedCollaborators)
        ) : (
          collaborators.map((c) => {
            const isSelected = selectedIds.has(c.id);
            const dateValue = activeTab === TAB_APPROVED ? c.approvedAt : c.createdAt;
            const dateLabel = activeTab === TAB_APPROVED
              ? t.approvalDateLabel
              : l('Ngày đăng ký', 'Registered', '登録日');
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/collaborators/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/admin/collaborators/${c.id}`);
                  }
                }}
                className={`group bg-white rounded-xl border px-3 sm:px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)] cursor-pointer transition-all hover:-translate-y-px ${
                  isSelected ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {/* Checkbox + avatar + name */}
                  <div className="flex items-center gap-3 min-w-0 md:w-[30%]">
                    {activeTab === TAB_PENDING && (
                      <span onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(c.id)}
                          className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                        />
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{c.name || '-'}</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 truncate"># {c.code || c.id}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="min-w-0 flex-1 rounded-lg bg-slate-50/70 border border-slate-100 px-2.5 py-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-600 min-w-0">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-600 min-w-0">
                      <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 md:w-[150px] flex-shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">{dateLabel}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-gray-800">{formatDate(dateValue)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0 md:justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/collaborators/${c.id}`)}
                      className="px-2.5 py-1 rounded-full border border-blue-200 text-[10px] sm:text-[11px] font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                    >
                      {t.viewDetailShort || t.detailLabel || t.viewDetails}
                    </button>
                    {activeTab === TAB_PENDING && (
                      <button
                        type="button"
                        onClick={(e) => handleApproveOne(c.id, e)}
                        disabled={approving}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-[11px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                        {t.approveButton || t.approve}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/collaborators/${c.id}/edit`)}
                      className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                      title={t.edit}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {activeTab === TAB_PENDING && (
                      <button
                        type="button"
                        onClick={(e) => handleRejectOne(c.id, e)}
                        disabled={rejecting}
                        className="p-1.5 rounded-full text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors disabled:opacity-50"
                        title={t.rejectButton || t.rejectTooltip}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollaboratorApprovalPage;
