import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Pencil, Upload, AlertCircle } from 'lucide-react';
import apiService from '../../services/api';
import { getScoutStatusLabel } from '../../utils/scoutStatus';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

export default function AdminScoutReservePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [relistId, setRelistId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [missingModal, setMissingModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiService.getAdminScoutReserveList({
        search: search.trim() || undefined,
        page,
        limit: 20,
      });
      if (res?.success) {
        setItems(res.data?.items || []);
        setPagination(res.data?.pagination || { total: 0, totalPages: 1 });
      } else {
        setErrorMsg(res?.message || 'Không tải được danh sách');
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRelist = async (row) => {
    const completeness = row.scoutCompleteness;
    if (!completeness?.complete) {
      setMissingModal({ cv: row, missing: completeness?.missing || [] });
      return;
    }
    setRelistId(row.id);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await apiService.relistAdminScoutReserveCv(row.id, {});
      if (res?.success) {
        setSuccessMsg(res.message || 'Đã đưa lên sàn Scout');
        await load();
      } else {
        setErrorMsg(res?.message || 'Không thể đăng Scout');
        if (res?.missing?.length) {
          setMissingModal({ cv: row, missing: res.missing });
        }
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Không thể đăng Scout');
    } finally {
      setRelistId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Scout dự bị</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Hồ sơ CTV quá hạn 6 tháng được chuyển vào danh sách dự bị. Admin bổ sung đủ thông tin bắt buộc rồi đưa lại lên sàn Scout Credit.
        </p>
      </div>

      {successMsg ? (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMsg}
        </div>
      ) : null}
      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMsg}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã, tên, email, SĐT, vị trí..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Đang tải...</span>
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Không có hồ sơ Scout dự bị.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã / ứng viên</th>
                <th className="px-4 py-3">CTV</th>
                <th className="px-4 py-3">Scout</th>
                <th className="px-4 py-3">Độ đủ thông tin</th>
                <th className="px-4 py-3">Chuyển dự bị</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const pct = row.scoutCompleteness?.percent ?? 0;
                const complete = row.scoutCompleteness?.complete;
                return (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0077B6]">{row.code || `#${row.id}`}</div>
                      <div className="text-slate-800">{row.name || '—'}</div>
                      <div className="text-xs text-slate-500">{row.desiredPosition || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.collaborator?.name || row.collaborator?.code || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {getScoutStatusLabel(row, 'vi')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{pct}%</span>
                      </div>
                      {!complete ? (
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700 hover:underline"
                          onClick={() => setMissingModal({
                            cv: row,
                            missing: row.scoutCompleteness?.missing || [],
                          })}
                        >
                          <AlertCircle className="h-3 w-3" />
                          Xem mục thiếu
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(row.scoutReserveAt || row.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/candidates/${row.id}/edit`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Bổ sung hồ sơ
                        </button>
                        <button
                          type="button"
                          disabled={relistId === row.id}
                          onClick={() => handleRelist(row)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0077B6] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#006399] disabled:opacity-60"
                        >
                          {relistId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Đăng Scout
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-slate-600">
            Trang {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      ) : null}

      {missingModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setMissingModal(null)}
          role="presentation"
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Thông tin còn thiếu — {missingModal.cv?.code || missingModal.cv?.id}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Bổ sung các mục sau trong form sửa hồ sơ, sau đó bấm «Đăng Scout».
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(missingModal.missing || []).map((m) => (
                <li key={m.key}>{m.label}</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMissingModal(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = missingModal.cv?.id;
                  setMissingModal(null);
                  if (id) navigate(`/admin/candidates/${id}/edit`);
                }}
                className="rounded-lg bg-[#0077B6] px-3 py-2 text-sm font-semibold text-white"
              >
                Mở form bổ sung
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
