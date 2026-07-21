import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, CheckCircle, XCircle, Building2, Briefcase, Clock } from 'lucide-react';
import apiService from '../../services/api';

const STATUS_META = {
  1: { label: 'Chờ WS duyệt', color: '#d97706', bg: '#fef3c7' },
  2: { label: 'Đã duyệt', color: '#2563eb', bg: '#dbeafe' },
  3: { label: 'Đang chạy', color: '#059669', bg: '#d1fae5' },
  4: { label: 'Tạm dừng', color: '#64748b', bg: '#f1f5f9' },
  5: { label: 'Đã đóng', color: '#dc2626', bg: '#fee2e2' },
  6: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

const MarketplaceListingsPage = ({ variant = 'admin' }) => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('listingId');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('1');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [actionId, setActionId] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, id: null, action: null, note: '', reason: '' });

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminCandidateSharingListings({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      if (res?.success && res.data) {
        setListings(res.data.listings || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 0 });
      } else {
        setListings([]);
      }
    } catch (e) {
      console.error(e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAction = async () => {
    if (!noteModal.id || !noteModal.action) return;
    setActionId(noteModal.id);
    try {
      let res;
      if (noteModal.action === 'approve') {
        res = await apiService.approveAdminCandidateSharingListing(noteModal.id, { adminNote: noteModal.note });
      } else {
        res = await apiService.rejectAdminCandidateSharingListing(noteModal.id, {
          rejectionReason: noteModal.reason,
          adminNote: noteModal.note,
        });
      }
      if (res?.success) {
        setNoteModal({ open: false, id: null, action: null, note: '', reason: '' });
        loadList();
      } else {
        alert(res?.message || 'Thao tác thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Thao tác thất bại');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Sàn CTV — Duyệt job doanh nghiệp</h1>
      <p className="text-sm text-slate-500 mb-4">WS duyệt job và phí thưởng trước khi publish lên mạng lưới CTV.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { v: '1', l: 'Chờ duyệt' },
          { v: '3', l: 'Đang chạy' },
          { v: '4', l: 'Tạm dừng' },
          { v: '', l: 'Tất cả' },
        ].map((f) => (
          <button
            key={f.v || 'all'}
            type="button"
            onClick={() => { setStatusFilter(f.v); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${statusFilter === f.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Không có listing</div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => {
            const st = STATUS_META[item.status] || STATUS_META[1];
            const highlighted = highlightId && String(item.id) === String(highlightId);
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-4 ${highlighted ? 'ring-2 ring-blue-400' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{item.job?.title || '—'}</span>
                      <span className="text-xs text-slate-400">({item.job?.jobCode})</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                        {item.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3 h-3" />
                      {item.business?.companyName || '—'}
                    </div>
                    <div className="text-xs text-slate-600 mt-2 whitespace-pre-line">{item.feeLabel}</div>
                    <div className="text-xs text-slate-400 mt-1 flex gap-3">
                      <span>SL tuyển: {item.headcount}</span>
                      <span>Hạn: {item.recruitmentDeadline || '—'}</span>
                      <span>Gửi: {formatDate(item.submittedAt)}</span>
                    </div>
                  </div>
                  {item.status === 1 && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => setNoteModal({ open: true, id: item.id, action: 'approve', note: '', reason: '' })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Duyệt & Publish
                      </button>
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => setNoteModal({ open: true, id: item.id, action: 'reject', note: '', reason: '' })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 shadow-xl">
            <h3 className="font-bold text-slate-800 mb-3">
              {noteModal.action === 'approve' ? 'Duyệt & publish lên sàn CTV' : 'Từ chối listing'}
            </h3>
            {noteModal.action === 'reject' && (
              <textarea
                rows={2}
                placeholder="Lý do từ chối"
                value={noteModal.reason}
                onChange={(e) => setNoteModal((m) => ({ ...m, reason: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              />
            )}
            <textarea
              rows={2}
              placeholder="Ghi chú (optional)"
              value={noteModal.note}
              onChange={(e) => setNoteModal((m) => ({ ...m, note: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNoteModal({ open: false, id: null, action: null, note: '', reason: '' })} className="text-sm px-3 py-1.5 border rounded-lg">Hủy</button>
              <button type="button" onClick={handleAction} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceListingsPage;
