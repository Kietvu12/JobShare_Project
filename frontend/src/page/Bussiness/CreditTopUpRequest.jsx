import React, { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestDetailLayout, {
  ServiceRequestDetailBody,
  ServiceRequestDetailHeader,
  ServiceRequestSubmitRow,
  SR_PAGE_FONT,
} from '../../component/Bussiness/ServiceRequestDetailLayout';
import {
  BUSINESS_CREDIT_PACKAGES,
  formatCreditAmount,
  formatYenAmount,
  getCreditPackageByKey,
} from '../../utils/businessCreditPackages';

function CreditPackageCard({ pkg, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.key)}
      className={`relative flex h-full min-h-0 flex-col items-center justify-between rounded-lg border bg-white px-2 py-3 text-center transition-all ${
        selected
          ? 'border-[#0077B6] ring-2 ring-[#0077B6]/15'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {pkg.discountLabel ? (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-bold text-white sm:text-xs"
          style={{ background: pkg.accent }}
        >
          {pkg.discountLabel}
        </span>
      ) : null}

      <div className="flex w-full flex-col items-center">
        <span className="text-xs font-bold" style={{ color: pkg.accent }}>
          {pkg.name}
        </span>
        <span className="mt-1 text-[10px] font-medium text-slate-800">
          {formatCreditAmount(pkg.credits)}
        </span>
        <span className="mt-1 text-sm font-bold leading-none text-slate-900">
          {formatYenAmount(pkg.priceYen)}
        </span>
        {pkg.originalPriceYen ? (
          <span className="mt-0.5 text-[10px] text-slate-400 line-through">
            {formatYenAmount(pkg.originalPriceYen)}
          </span>
        ) : (
          <span className="mt-0.5 text-[10px] text-transparent" aria-hidden>—</span>
        )}
        <span className="mt-1 text-[10px] text-slate-500">
          (~{pkg.profileOpens} lần mở hồ sơ)
        </span>
      </div>

      <div className="mt-2 flex w-full justify-center">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: pkg.iconBg }}
        >
          <Coins className="h-4 w-4" style={{ color: pkg.accent }} strokeWidth={2} />
        </div>
      </div>
    </button>
  );
}

const INTRO = [
  'Credit dùng để mở hồ sơ ứng viên trên Scout Credit. Chọn gói phù hợp với nhu cầu tuyển dụng của doanh nghiệp.',
  'Sau khi gửi yêu cầu, Workstation sẽ liên hệ xác nhận số lượng và hướng dẫn thanh toán.',
];

export default function CreditTopUpRequest() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getBusinessBillingDashboard();
      if (res?.success) setDashboard(res.data);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSubmit = async () => {
    const pkg = getCreditPackageByKey(selectedKey);
    if (!pkg) {
      setError('Vui lòng chọn gói credit trước khi gửi yêu cầu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.createBusinessCreditRequest({
        amount: pkg.credits,
        note: `Gói ${pkg.name} — ${formatCreditAmount(pkg.credits)} (${formatYenAmount(pkg.priceYen)})`,
      });
      if (res?.success) {
        const code = res.data?.request?.requestCode || res.data?.requestCode || '';
        setSuccessMsg(
          code
            ? `Đã gửi yêu cầu ${code}. WS sẽ liên hệ hướng dẫn thanh toán.`
            : 'Đã gửi yêu cầu nạp credit. WS sẽ liên hệ hướng dẫn thanh toán.',
        );
        setSelectedKey(null);
        await loadDashboard();
      } else {
        setError(res?.message || 'Không thể gửi yêu cầu nạp credit');
      }
    } catch (err) {
      setError(err?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div
        className="flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-sm text-slate-500"
        style={{ fontFamily: SR_PAGE_FONT }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
        Đang tải...
      </div>
    );
  }

  return (
    <ServiceRequestDetailLayout
      dashboard={dashboard}
      successMsg={successMsg}
      onDismissSuccess={() => setSuccessMsg('')}
    >
      <ServiceRequestDetailHeader
        icon={Coins}
        iconBg="#e8f4fa"
        iconColor="#0077B6"
        title="Yêu cầu nạp credit"
        description={INTRO}
      />

      <ServiceRequestDetailBody>
        <p className="shrink-0 text-xs font-bold text-slate-800">Thông tin các gói credit</p>
        <div className="grid min-h-0 flex-1 grid-cols-3 items-stretch gap-2">
          {BUSINESS_CREDIT_PACKAGES.map((pkg) => (
            <CreditPackageCard
              key={pkg.key}
              pkg={pkg}
              selected={selectedKey === pkg.key}
              onSelect={setSelectedKey}
            />
          ))}
        </div>
      </ServiceRequestDetailBody>

      <ServiceRequestSubmitRow
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
        notice="Lưu ý: Credit có hiệu lực ngay sau khi nạp và không có thời hạn sử dụng."
      />
    </ServiceRequestDetailLayout>
  );
}
