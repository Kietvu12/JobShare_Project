import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import apiService from '../../services/api';

const BRAND = '#0077B6';

export default function ServiceRequestModal({
  open,
  service,
  onClose,
  onSuccess,
  currentCredit,
}) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
      setAmount('');
      setError('');
      setSubmitting(false);
    }
  }, [open, service?.key]);

  if (!open || !service) return null;

  const Icon = service.icon;
  const isCredit = service.apiType === 'credit';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isCredit) {
        const creditAmount = Math.trunc(Number(amount));
        if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
          setError('Vui lòng nhập số credit cần nạp (lớn hơn 0).');
          setSubmitting(false);
          return;
        }
        const res = await apiService.createBusinessCreditRequest({
          amount: creditAmount,
          note: note.trim() || undefined,
        });
        if (res?.success) {
          onSuccess?.(res.data, service);
          onClose();
        } else {
          setError(res?.message || 'Không thể gửi yêu cầu nạp credit');
        }
      } else {
        const res = await apiService.createBusinessServiceRequest({
          serviceKey: service.key,
          serviceTitle: service.title,
          note: note.trim() || undefined,
        });
        if (res?.success) {
          onSuccess?.(res.data, service);
          onClose();
        } else {
          setError(res?.message || 'Không thể gửi yêu cầu dịch vụ');
        }
      }
    } catch (err) {
      setError(err?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: service.iconBg }}
          >
            <Icon className="h-5 w-5" style={{ color: service.iconColor }} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="biz-ui-section text-slate-900">{service.title}</h2>
            {isCredit && currentCredit != null ? (
              <p className="biz-ui-caption mt-0.5 text-slate-500">
                Credit hiện tại:{' '}
                <span className="font-semibold text-slate-700">
                  {Number(currentCredit).toLocaleString('vi-VN')}
                </span>
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
          <p className="biz-ui-body leading-relaxed text-slate-600 whitespace-pre-wrap">
            {service.description}
          </p>

          {isCredit ? (
            <label className="block">
              <span className="biz-ui-caption mb-1 block font-semibold text-slate-700">Số credit cần nạp</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 2000"
                className="biz-ui-body w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6]"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="biz-ui-caption mb-1 block font-semibold text-slate-700">
              Ghi chú / mô tả thêm {isCredit ? '(tuỳ chọn)' : ''}
            </span>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isCredit
                  ? 'VD: Cần nạp gấp cho chiến dịch Scout tháng này…'
                  : 'Mô tả nhu cầu, timeline, ngân sách dự kiến (nếu có)…'
              }
              className="biz-ui-body w-full resize-none rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#0077B6] focus:ring-1 focus:ring-[#0077B6]"
            />
          </label>

          {error ? (
            <p className="biz-ui-caption rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="biz-ui-body flex-1 rounded-lg border border-slate-200 bg-white py-2 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="biz-ui-body flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-bold text-white disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
