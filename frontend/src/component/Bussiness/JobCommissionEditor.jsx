import React, { useEffect, useMemo, useState } from 'react';
import { isPersistableJobValue } from '../../utils/jobCommissionUi';
import {
  DIRECT_REFERRAL_LABEL,
  SIMPLE_FEE_MODES,
  parseJobCommissionToSimple,
  syncSimpleCommissionState,
} from '../../utils/businessSimpleCommission';
import {
  JOB_SALARY_CURRENCY_OPTIONS,
  formatFixedAmountWithCurrency,
  getJobCurrencyShortLabel,
} from '../../utils/jobSalaryCurrency';

/**
 * Cài đặt phí giới thiệu nhân sự (tối giản) — doanh nghiệp / đưa job lên sàn CTV.
 */
export default function JobCommissionEditor({
  jobCommissionType,
  onCommissionTypeChange,
  jobValues,
  onJobValuesChange,
  salaryCurrency = 'JPY',
  onSalaryCurrencyChange,
  /** Khi đổi JD — gọi parseJobCommissionToSimple(job) từ parent */
  commissionSeedJob = null,
}) {
  const seedKey = commissionSeedJob?.id ?? commissionSeedJob?.jobId ?? null;

  const initial = useMemo(
    () => parseJobCommissionToSimple(commissionSeedJob || { jobCommissionType, jobValues }),
    [seedKey, commissionSeedJob, jobCommissionType, jobValues],
  );

  const [feeMode, setFeeMode] = useState(initial.feeMode);
  const [amount, setAmount] = useState(initial.amount);
  const [viewOnCollaborator, setViewOnCollaborator] = useState(initial.viewOnCollaborator || '');

  useEffect(() => {
    if (!commissionSeedJob) return;
    const parsed = parseJobCommissionToSimple(commissionSeedJob);
    setFeeMode(parsed.feeMode);
    setAmount(parsed.amount);
    setViewOnCollaborator(parsed.viewOnCollaborator || '');
    syncSimpleCommissionState(
      parsed.feeMode,
      parsed.amount,
      { viewOnCollaborator: parsed.viewOnCollaborator || '' },
      onCommissionTypeChange,
      onJobValuesChange,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const applyPayload = (nextMode, nextAmount, nextView = viewOnCollaborator) => {
    syncSimpleCommissionState(
      nextMode,
      nextAmount,
      { viewOnCollaborator: nextView },
      onCommissionTypeChange,
      onJobValuesChange,
    );
  };

  const handleModeChange = (mode) => {
    setFeeMode(mode);
    applyPayload(mode, amount);
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    applyPayload(feeMode, value);
  };

  const modeOptions = [
    {
      key: SIMPLE_FEE_MODES.PERCENT_ANNUAL,
      title: '% thu nhập năm',
      hint: 'Ví dụ: 30 = 30% thu nhập năm dự kiến của ứng viên',
    },
    {
      key: SIMPLE_FEE_MODES.FIXED,
      title: 'Số tiền cố định',
      hint: `Một khoản cố định (${getJobCurrencyShortLabel(salaryCurrency)}), ví dụ phí giới thiệu 500.000 ${getJobCurrencyShortLabel(salaryCurrency)}`,
    },
    {
      key: SIMPLE_FEE_MODES.MONTHLY_SALARY,
      title: 'Tháng lương',
      hint: 'Ví dụ: 1 hoặc 1.5 = tương đương 1 hoặc 1,5 tháng lương',
    },
  ];

  const amountLabel = feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL
    ? 'Phần trăm (%)'
    : feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY
      ? 'Số tháng lương'
      : `Số tiền (${getJobCurrencyShortLabel(salaryCurrency)})`;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3">
      <div>
        <div className="text-xs font-bold text-slate-800 mb-1">Phí giới thiệu nhân sự</div>
        <p className="text-[10px] text-slate-500">
          {DIRECT_REFERRAL_LABEL} — chọn một cách tính phí, không cần thiết lập điều kiện JLPT.
        </p>
      </div>

      {onSalaryCurrencyChange && feeMode === SIMPLE_FEE_MODES.FIXED && (
        <div className="pb-2 border-b border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tiền tệ</label>
          <select
            value={salaryCurrency || 'JPY'}
            onChange={(e) => onSalaryCurrencyChange(e.target.value)}
            className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {JOB_SALARY_CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-2">
          Cách tính phí <span className="text-red-500">*</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleModeChange(opt.key)}
              className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                feeMode === opt.key
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="block text-xs font-bold text-slate-800">{opt.title}</span>
              <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {amountLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type={feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY ? 'text' : 'number'}
          step={feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL ? '0.01' : feeMode === SIMPLE_FEE_MODES.FIXED ? '1' : '0.1'}
          min="0"
          max={feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL ? '100' : undefined}
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            if (feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL && v && parseFloat(v) > 100) {
              return;
            }
            handleAmountChange(v);
          }}
          placeholder={
            feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL
              ? 'VD: 30'
              : feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY
                ? 'VD: 1 hoặc 1.5'
                : `VD: 500000`
          }
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        />
        {feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL && amount && (
          <p className="text-[10px] text-slate-500 mt-1">{amount}% thu nhập năm</p>
        )}
        {feeMode === SIMPLE_FEE_MODES.FIXED && amount && (
          <p className="text-[10px] text-slate-500 mt-1">
            {formatFixedAmountWithCurrency(amount, salaryCurrency)}
          </p>
        )}
        {feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY && amount && (
          <p className="text-[10px] text-slate-500 mt-1">
            ≈ {amount} tháng lương (theo mức lương ghi trên JD)
          </p>
        )}
      </div>

      {feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mức tham chiếu hiển thị cho CTV ({getJobCurrencyShortLabel(salaryCurrency)}, tùy chọn)
          </label>
          <input
            type="text"
            value={viewOnCollaborator}
            onChange={(e) => {
              setViewOnCollaborator(e.target.value);
              applyPayload(feeMode, amount, e.target.value);
            }}
            placeholder="VD: 300000 hoặc 300000 - 400000"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>
      )}

      {!jobValues.some(isPersistableJobValue) && (
        <p className="text-[10px] text-amber-600">Nhập mức phí để tiếp tục.</p>
      )}
    </div>
  );
}

export function validateCommissionForMarketplace(jobCommissionType, jobValues) {
  if (!jobCommissionType) return 'Chọn cách tính phí giới thiệu nhân sự';
  const persistable = (jobValues || []).filter(isPersistableJobValue);
  if (!persistable.length) return 'Nhập mức phí giới thiệu nhân sự';
  for (const jv of persistable) {
    if (jv.value != null && String(jv.value).trim() !== '') {
      const isMonthly = Number(jv.typeId) === 7 && Number(jv.valueId) === 34;
      if (isMonthly) continue;
      const n = parseFloat(String(jv.value).replace(',', '.'));
      if (Number.isFinite(n) && n < 0) return 'Mức phí phải ≥ 0';
      if (jobCommissionType === 'percent' && Number.isFinite(n) && n > 100) {
        return 'Phần trăm không được vượt quá 100%';
      }
    }
  }
  return null;
}
