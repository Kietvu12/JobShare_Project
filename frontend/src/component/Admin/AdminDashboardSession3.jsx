import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import {
  CheckSquare,
  XCircle,
  MoreVertical,
  Calendar,
  PieChart as PieChartIcon,
  ChevronDown,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';

const PaymentMonthPickerInput = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-red-200 bg-white hover:bg-red-50 hover:border-red-400 transition-colors text-[10px] sm:text-[11px]"
  >
    <Calendar className="w-3 h-3 text-red-500" />
    <span className="text-gray-900 min-w-[56px] text-center">
      {value || 'MM.YYYY'}
    </span>
    <ChevronDown className="w-3 h-3 text-red-400" />
  </button>
));

const AdminDashboardSession3 = () => {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const l = (vi, en, ja) => (language === 'en' ? en : language === 'ja' ? ja : vi);

  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [pieMonth, setPieMonth] = useState(() => new Date());

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAdminPaymentRequests({
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        });
        const rows =
          response?.data?.rows ||
          response?.data?.paymentRequests ||
          response?.data ||
          [];
        setAllRequests(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error('Error loading payment requests:', err);
        setError(t.errorLoadingData || 'Không thể tải dữ liệu yêu cầu thanh toán');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentRequests();
  }, [language, t]);

  const refreshAfterAction = async () => {
    try {
      const response = await apiService.getAdminPaymentRequests({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      const rows =
        response?.data?.rows ||
        response?.data?.paymentRequests ||
        response?.data ||
        [];
      setAllRequests(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Error refreshing payment requests:', err);
    }
  };

  const handleApprove = async (request) => {
    try {
      setActionLoadingId(request.id);
      await apiService.approvePaymentRequest(request.id, '');
      await refreshAfterAction();
    } catch (err) {
      console.error('Approve payment request error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (request) => {
    try {
      setActionLoadingId(request.id);
      await apiService.rejectPaymentRequest(request.id, 'Rejected by admin', '');
      await refreshAfterAction();
    } catch (err) {
      console.error('Reject payment request error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const quickRequests = useMemo(
    () => allRequests.slice(0, 6),
    [allRequests]
  );

  const getPaymentStatusMeta = (status) => {
    const s = normalizePaymentStatus(status);
    if (s === 0) {
      return {
        label: l('Chờ duyệt', 'Pending', '承認待ち'),
        colorClass: 'bg-amber-50 text-amber-700',
      };
    }
    if (s === 1) {
      return {
        label: l('Đã duyệt', 'Approved', '承認済み'),
        colorClass: 'bg-emerald-50 text-emerald-700',
      };
    }
    if (s === 2) {
      return {
        label: l('Từ chối', 'Rejected', '拒否'),
        colorClass: 'bg-red-50 text-red-600',
      };
    }
    if (s === 3) {
      return {
        label: l('Đã thanh toán', 'Paid', '支払済み'),
        colorClass: 'bg-green-50 text-green-700',
      };
    }
    return {
      label: l('Không xác định', 'Unknown', '不明'),
      colorClass: 'bg-gray-100 text-gray-600',
    };
  };

  const normalizePaymentStatus = (status) => {
    if (status === null || status === undefined) return -1;
    if (typeof status === 'number' && Number.isFinite(status)) return status;
    const raw = String(status).trim().toLowerCase();
    if (raw === 'pending') return 0;
    if (raw === 'approved') return 1;
    if (raw === 'rejected') return 2;
    if (raw === 'paid') return 3;
    const num = Number(raw);
    return Number.isFinite(num) ? num : -1;
  };

  const pieData = useMemo(() => {
    const target = new Date(pieMonth.getFullYear(), pieMonth.getMonth(), 1);
    const month = target.getMonth();
    const year = target.getFullYear();
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    allRequests.forEach((req) => {
      const createdDateRaw = req.createdAt || req.created_at;
      const d = new Date(createdDateRaw);
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const status = normalizePaymentStatus(req.status);
      if (status === 1 || status === 3) {
        approved += 1;
      } else if (status === 0) {
        pending += 1;
      } else if (status === 2) {
        rejected += 1;
      }
    });

    const total = approved + pending + rejected;
    const pct = (n) => (total ? (n / total) * 100 : 0);
    const approvedPct = pct(approved);
    const pendingPct = pct(pending);
    const rejectedPct = total ? 100 - approvedPct - pendingPct : 0;

    const gradient = total
      ? `conic-gradient(
      #2563EB 0 ${approvedPct}%,
      #111827 ${approvedPct}% ${approvedPct + pendingPct}%,
      #DC2626 ${approvedPct + pendingPct}% 100%
    )`
      : 'conic-gradient(#e5e7eb 0 100%)';

    return {
      total,
      approved,
      pending,
      rejected,
      approvedPct,
      pendingPct,
      rejectedPct,
      gradient,
    };
  }, [allRequests, pieMonth]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 mt-2 sm:mt-3 md:mt-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm animate-pulse ${i === 1 ? 'lg:col-span-2' : ''}`}
          >
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 sm:mt-3 md:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 text-[9px] sm:text-[10px]">
      {/* Card 1: Phê duyệt nhanh đơn thanh toán (chiếm 2 phần) */}
      <div className="lg:col-span-2 bg-white rounded-sm sm:rounded-md p-2 sm:p-2.5 md:p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-900">
              {l('Phê duyệt nhanh đơn thanh toán', 'Quick payment approval', '支払い申請クイック承認')}
            </h3>
            <p className="text-[8px] sm:text-[9px] text-gray-500">
              {l('Danh sách yêu cầu thanh toán mới nhất', 'Latest payment requests', '最新の支払い申請一覧')}
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <p className="text-xs sm:text-sm text-red-500 mb-3">{error}</p>
        )}

        {quickRequests.length === 0 ? (
          <div className="px-2 sm:px-3 py-4 text-center text-xs text-gray-500">
            {l('Không có yêu cầu thanh toán nào', 'No payment requests', '支払い申請はありません')}
          </div>
        ) : (
          <div className="space-y-2">
            {quickRequests.map((req) => {
              const collaborator = req.collaborator || {};
              const job = req.jobApplication?.job || req.jobApplication || {};
              const jobTitle = l(job.title, job.titleEn || job.title, job.titleJp || job.title);
              const createdRaw = req.createdAt || req.created_at;
              const created = createdRaw
                ? new Date(createdRaw).toLocaleDateString(l('vi-VN', 'en-GB', 'ja-JP'))
                : '';
              const status = req.status;
              const statusMeta = getPaymentStatusMeta(status);
              const canApproveOrReject = status === 0;

              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-gray-100 p-2 sm:p-2.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {collaborator.name || l('Không rõ', 'Unknown', '不明')}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {collaborator.code || collaborator.email || '--'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.colorClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <p className="text-gray-600 truncate">
                      <span className="font-medium text-gray-700">{l('Job', 'Job', '求人')}:</span> {jobTitle || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">{l('Ngày tạo', 'Created', '作成日')}:</span> {created || '--'}
                    </p>
                    <p className="text-gray-900 font-semibold sm:col-span-2">
                      {Number(req.amount || 0).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={!canApproveOrReject || actionLoadingId === req.id}
                      onClick={() => handleApprove(req)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                        canApproveOrReject
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>{l('Duyệt', 'Approve', '承認')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!canApproveOrReject || actionLoadingId === req.id}
                      onClick={() => handleReject(req)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                        canApproveOrReject
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>{l('Từ chối', 'Reject', '拒否')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 2: Trạng thái yêu cầu theo tháng — cao bằng card phê duyệt (grid stretch) */}
      <div className="bg-white rounded-sm sm:rounded-md p-2 sm:p-2.5 md:p-3 border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h3 className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-900">
              {l('Trạng thái', 'Status', 'ステータス')}
            </h3>
            <p className="text-[8px] sm:text-[9px] text-gray-500">
              {l('Theo tháng được chọn', 'For selected month', '選択した月')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <PieChartIcon className="w-3.5 h-3.5 text-gray-400" />
            <DatePicker
              selected={pieMonth}
              onChange={(date) => {
                if (date) {
                  setPieMonth(date);
                }
              }}
              dateFormat="MM.yyyy"
              showMonthYearPicker
              showPopperArrow={false}
              customInput={<PaymentMonthPickerInput />}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
          <div
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full shadow-sm flex items-center justify-center"
            style={{ backgroundImage: pieData.gradient }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">{pieData.total}</span>
              <span className="text-[9px] text-gray-500">{l('Yêu cầu', 'Requests', '申請')}</span>
            </div>
          </div>

          {pieData.total ? (
            <ul className="w-full max-w-[240px] space-y-1.5 text-[11px]">
              {[
                ['#2563EB', l('Đã duyệt', 'Approved', '承認済み'), pieData.approved, pieData.approvedPct],
                ['#111827', l('Chờ duyệt', 'Pending', '承認待ち'), pieData.pending, pieData.pendingPct],
                ['#DC2626', l('Từ chối', 'Rejected', '拒否'), pieData.rejected, pieData.rejectedPct],
              ].map(([color, label, count, pct]) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-1.5"
                >
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-500">
              {l('Không có yêu cầu trong tháng này', 'No requests this month', 'この月の申請はありません')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSession3;

