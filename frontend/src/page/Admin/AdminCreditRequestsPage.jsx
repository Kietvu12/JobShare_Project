import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Loader2, CheckCircle, XCircle, Building2, Coins, Clock,
  Pencil, Trash2,
} from 'lucide-react';
import apiService from '../../services/api';

const STATUS_META = {
  pending: { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  approved: { label: 'Đã duyệt', color: '#059669', bg: '#d1fae5' },
  rejected: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Đã hủy', color: '#64748b', bg: '#f1f5f9' },
};

const PAYMENT_LABELS = {
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

function CreditEditModal({ open, request, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && request) {
      setAmount(String(request.amount || ''));
      setNote(request.note || '');
      setPaymentMethod(request.paymentMethod || 'bank_transfer');
      setError('');
    }
  }, [open, request]);

  if (!open || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const creditAmount = Math.trunc(Number(amount));
    if (!creditAmount || creditAmount <= 0) {
      setError('Số credit phải lớn hơn 0');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.updateAdminCreditRequest(request.id, {
        amount: creditAmount,
        note: note.trim() || undefined,
        paymentMethod,
      });
      if (res?.success) {
        onSaved?.();
        onClose();
      } else {
        setError(res?.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Sửa yêu cầu {request.requestCode}</h3>
        <p className="text-xs text-slate-500 mb-3">{request.business?.companyName || '—'}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">Số credit *</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">Phương thức thanh toán</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg p-2 outline-none"
            >
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">Ghi chú DN</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="text-xs border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-400 resize-y"
            />
          </label>
          {error && <div className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 border rounded-lg">Hủy</button>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded-lg text-white bg-blue-600 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminCreditRequestsPage = () => {
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
  const [editModal, setEditModal] = useState({ open: false, request: null });

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getAdminCreditRequests({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      if (res?.success && res.data) {
        setRequests(res.data.requests || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 0 });
      } else {
        setRequests([]);
        setError(res?.message || 'Không tải được danh sách');
      }
    } catch (e) {
      console.error(e);
      setRequests([]);
      setError('Không tải được danh sách yêu cầu nạp credit');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

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

  const runAction = async (id, action, note) => {
    setActionId(id);
    try {
      const res = action === 'approve'
        ? await apiService.approveAdminCreditRequest(id, { adminNote: note })
        : await apiService.rejectAdminCreditRequest(id, { adminNote: note });

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

  const handleCancel = async (req) => {
    if (!window.confirm(`Hủy yêu cầu ${req.requestCode}?`)) return;
    setActionId(req.id);
    try {
      const res = await apiService.deleteAdminCreditRequest(req.id);
      if (res?.success) {
        alert(res.message || 'Đã hủy yêu cầu');
        loadList();
      } else {
        alert(res?.message || 'Hủy thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Hủy thất bại');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">Yêu cầu nạp credit (Doanh nghiệp)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Doanh nghiệp gửi yêu cầu nạp credit qua portal Business. Duyệt để cộng credit vào tài khoản.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm doanh nghiệp, email..."
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
          <option value="cancelled">Đã hủy</option>
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
          Không có yêu cầu nạp credit
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
                      <span className="text-xs font-bold text-slate-800">{req.requestCode}</span>
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
                      {req.business?.email ? (
                        <span className="text-slate-400">· {req.business.email}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold">
                        {Number(req.amount || 0).toLocaleString('vi-VN')} credit
                      </span>
                      <span className="text-slate-400">
                        · {PAYMENT_LABELS[req.paymentMethod] || req.paymentMethod || '—'}
                      </span>
                      {req.business?.credit != null && (
                        <span className="text-slate-400">
                          · Hiện có: {Number(req.business.credit).toLocaleString('vi-VN')} credit
                        </span>
                      )}
                    </div>
                    {req.note && (
                      <div className="text-[11px] text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1">
                        Ghi chú DN: {req.note}
                      </div>
                    )}
                    {req.adminNote && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Phản hồi admin: {req.adminNote}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <Clock className="w-3 h-3" />
                      Gửi: {formatDate(req.requestedAt)}
                      {req.handledAt ? ` · Xử lý: ${formatDate(req.handledAt)}` : ''}
                      {req.handledByAdmin?.name ? ` · ${req.handledByAdmin.name}` : ''}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => setEditModal({ open: true, request: req })}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => handleCancel(req)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => setNoteModal({ open: true, id: req.id, action: 'approve', note: '' })}
                        className="flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={actionId === req.id}
                        onClick={() => setNoteModal({ open: true, id: req.id, action: 'reject', note: '' })}
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
              {noteModal.action === 'approve' ? 'Duyệt yêu cầu nạp credit' : 'Từ chối yêu cầu'}
            </h3>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal((m) => ({ ...m, note: e.target.value }))}
              placeholder="Ghi chú admin (tuỳ chọn)"
              rows={3}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-3 outline-none focus:border-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModal({ open: false, id: null, action: null, note: '' })}
                className="text-xs px-3 py-1.5 border rounded-lg"
              >
                Đóng
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

      <CreditEditModal
        open={editModal.open}
        request={editModal.request}
        onClose={() => setEditModal({ open: false, request: null })}
        onSaved={loadList}
      />
    </div>
  );
};

export default AdminCreditRequestsPage;
