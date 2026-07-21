import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Loader2, CheckCircle, XCircle, Building2, FileText, Clock,
} from 'lucide-react';
import apiService from '../../services/api';

const STATUS_META = {
  pending: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  approved: { label: 'Đã duyệt', color: '#059669', bg: '#d1fae5' },
  rejected: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Đã hủy', color: '#64748b', bg: '#f1f5f9' },
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

const ScoutPerformanceRequestsPage = ({ variant = 'admin' }) => {
  const isAdmin = variant === 'admin';
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('requestId');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [actionId, setActionId] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, id: null, action: null, note: '' });

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 20, status: statusFilter || undefined, search: searchQuery || undefined };
      const res = isAdmin
        ? await apiService.getAdminScoutPerformanceRequests(params)
        : await apiService.getCtvScoutPerformanceRequests(params);

      if (res?.success && res.data) {
        setRequests(res.data.requests || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 0 });
      } else {
        setRequests([]);
        setError(res?.message || 'Không tải được danh sách yêu cầu');
      }
    } catch (e) {
      console.error(e);
      setRequests([]);
      setError('Không tải được danh sách yêu cầu Scout Performance');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, statusFilter, searchQuery]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests],
  );

  const runAction = async (id, action, note) => {
    setActionId(id);
    try {
      const res = action === 'approve'
        ? (isAdmin
          ? await apiService.approveAdminScoutPerformanceRequest(id, { note })
          : await apiService.approveCtvScoutPerformanceRequest(id, { note }))
        : (isAdmin
          ? await apiService.rejectAdminScoutPerformanceRequest(id, { note })
          : await apiService.rejectCtvScoutPerformanceRequest(id, { note }));

      if (res?.success) {
        alert(res.message || 'Đã xử lý yêu cầu');
        setNoteModal({ open: false, id: null, action: null, note: '' });
        loadList();
      } else {
        alert(res?.message || 'Xử lý thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Xử lý thất bại');
    } finally {
      setActionId(null);
    }
  };

  const openNoteModal = (id, action) => {
    setNoteModal({ open: true, id, action, note: '' });
  };

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">Yêu cầu Scout Performance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Doanh nghiệp gửi yêu cầu mở hồ sơ Scout qua Admin/CTV (không trừ credit). Duyệt để mở liên hệ ứng viên.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm doanh nghiệp, mã CV, vị trí..."
            className="bg-transparent outline-none text-xs w-full text-slate-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
        {statusFilter === 'pending' && pagination.total > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            {pagination.total} chờ duyệt
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Không có yêu cầu Scout Performance
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((req) => {
            const st = STATUS_META[req.status] || STATUS_META.pending;
            const isHighlighted = highlightId && String(req.id) === String(highlightId);
            return (
              <div
                key={req.id}
                className={`bg-white rounded-xl border p-3 ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800">#{req.id}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold">{req.business?.companyName || '—'}</span>
                      {req.business?.contactName ? (
                        <span className="text-slate-400">· {req.business.contactName}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <span>
                        {req.cv?.code || `CV #${req.cvId}`}
                        {req.cv?.name ? ` · ${req.cv.name}` : ''}
                        {req.cv?.desiredPosition ? ` · ${req.cv.desiredPosition}` : ''}
                      </span>
                    </div>
                    {req.message && (
                      <div className="text-[11px] text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1">
                        Ghi chú DN: {req.message}
                      </div>
                    )}
                    {req.adminNote && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Phản hồi: {req.adminNote}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <Clock className="w-3 h-3" />
                      Gửi: {formatDate(req.requestedAt)}
                      {req.handledAt ? ` · Xử lý: ${formatDate(req.handledAt)}` : ''}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => openNoteModal(req.id, 'approve')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => openNoteModal(req.id, 'reject')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs px-2 py-1 border rounded disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs text-slate-500">{page}/{pagination.totalPages}</span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs px-2 py-1 border rounded disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}

      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {noteModal.action === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </h3>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal((m) => ({ ...m, note: e.target.value }))}
              placeholder="Ghi chú (tuỳ chọn)"
              rows={3}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-3 outline-none focus:border-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModal({ open: false, id: null, action: null, note: '' })}
                className="text-xs px-3 py-1.5 border rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionId != null}
                onClick={() => runAction(noteModal.id, noteModal.action, noteModal.note)}
                className="text-xs px-3 py-1.5 rounded-lg text-white bg-blue-600 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutPerformanceRequestsPage;
