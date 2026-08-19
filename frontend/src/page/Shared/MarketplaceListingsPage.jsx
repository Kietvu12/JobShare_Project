import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const STATUS_STYLE = {
  0: { color: '#64748b', bg: '#f1f5f9' },
  1: { color: '#d97706', bg: '#fef3c7' },
  2: { color: '#2563eb', bg: '#dbeafe' },
  3: { color: '#059669', bg: '#d1fae5' },
  4: { color: '#64748b', bg: '#f1f5f9' },
  5: { color: '#dc2626', bg: '#fee2e2' },
  6: { color: '#dc2626', bg: '#fee2e2' },
};

const DATE_LOCALE = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP' };

function getListingStatusMeta(status, t) {
  const labelMap = {
    0: t.adminCandidateSharingStatusDraft,
    1: t.adminCandidateSharingStatusPending,
    2: t.adminCandidateSharingStatusApproved,
    3: t.adminCandidateSharingStatusPublished,
    4: t.adminCandidateSharingStatusPaused,
    5: t.adminCandidateSharingStatusClosed,
    6: t.adminCandidateSharingStatusRejected,
  };
  const num = Number(status);
  return {
    label: labelMap[num] || labelMap[1],
    ...(STATUS_STYLE[num] || STATUS_STYLE[1]),
  };
}

function formatDate(value, language) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(DATE_LOCALE[language] || 'vi-VN');
  } catch {
    return '—';
  }
}

const MarketplaceListingsPage = ({ variant = 'admin' }) => {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language] || translations.vi, [language]);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('listingId');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('1');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [actionId, setActionId] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, id: null, action: null, note: '', reason: '', platformFeePercent: '20' });

  const statusFilters = useMemo(() => ([
    { v: '1', l: t.adminCandidateSharingFilterPending },
    { v: '3', l: t.adminCandidateSharingFilterRunning },
    { v: '4', l: t.adminCandidateSharingFilterPaused },
    { v: '', l: t.adminCandidateSharingFilterAll },
  ]), [t]);

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
        const fee = parseFloat(String(noteModal.platformFeePercent).replace(',', '.'));
        if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
          alert(t.adminCandidateSharingFeeInvalid);
          setActionId(null);
          return;
        }
        res = await apiService.approveAdminCandidateSharingListing(noteModal.id, {
          adminNote: noteModal.note,
          platformFeePercent: fee,
        });
      } else {
        res = await apiService.rejectAdminCandidateSharingListing(noteModal.id, {
          rejectionReason: noteModal.reason,
          adminNote: noteModal.note,
        });
      }
      if (res?.success) {
        setNoteModal({ open: false, id: null, action: null, note: '', reason: '', platformFeePercent: '20' });
        loadList();
      } else {
        alert(res?.message || t.adminCandidateSharingActionFailed);
      }
    } catch (e) {
      console.error(e);
      alert(t.adminCandidateSharingActionFailed);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">{t.adminCandidateSharingTitle}</h1>
      <p className="text-sm text-slate-500 mb-4">{t.adminCandidateSharingSubtitle}</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
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
          <Loader2 className="w-5 h-5 animate-spin" /> {t.adminCandidateSharingLoading}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t.adminCandidateSharingEmpty}</div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => {
            const st = getListingStatusMeta(item.status, t);
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
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3 h-3" />
                      {item.business?.companyName || '—'}
                    </div>
                    <div className="text-xs text-slate-600 mt-2 whitespace-pre-line">{item.feeLabel}</div>
                    <div className="text-xs text-slate-400 mt-1 flex gap-3 flex-wrap">
                      <span>{t.adminCandidateSharingHeadcount}: {item.headcount}</span>
                      <span>{t.adminCandidateSharingDeadline}: {item.recruitmentDeadline || '—'}</span>
                      <span>{t.adminCandidateSharingSubmitted}: {formatDate(item.submittedAt, language)}</span>
                    </div>
                  </div>
                  {item.status === 1 && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => setNoteModal({
                          open: true,
                          id: item.id,
                          action: 'approve',
                          note: '',
                          reason: '',
                          platformFeePercent: String(item.platformFeePercent ?? 20),
                        })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {t.adminCandidateSharingApprovePublish}
                      </button>
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => setNoteModal({ open: true, id: item.id, action: 'reject', note: '', reason: '' })}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t.adminCandidateSharingReject}
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
              {noteModal.action === 'approve' ? t.adminCandidateSharingModalApproveTitle : t.adminCandidateSharingModalRejectTitle}
            </h3>
            {noteModal.action === 'approve' && (
              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.adminCandidateSharingPlatformFeeLabel}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={noteModal.platformFeePercent}
                  onChange={(e) => setNoteModal((m) => ({ ...m, platformFeePercent: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            {noteModal.action === 'reject' && (
              <textarea
                rows={2}
                placeholder={t.adminCandidateSharingRejectReasonPlaceholder}
                value={noteModal.reason}
                onChange={(e) => setNoteModal((m) => ({ ...m, reason: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              />
            )}
            <textarea
              rows={2}
              placeholder={t.adminCandidateSharingNotePlaceholder}
              value={noteModal.note}
              onChange={(e) => setNoteModal((m) => ({ ...m, note: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNoteModal({ open: false, id: null, action: null, note: '', reason: '', platformFeePercent: '20' })} className="text-sm px-3 py-1.5 border rounded-lg">{t.adminCandidateSharingCancel}</button>
              <button type="button" onClick={handleAction} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white">{t.adminCandidateSharingConfirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceListingsPage;
