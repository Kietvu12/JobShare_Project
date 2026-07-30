import React, { useEffect, useMemo, useState } from 'react';
import { isPersistableJobValue } from '../../utils/jobCommissionUi';
import {
  DIRECT_REFERRAL_LABEL,
  SIMPLE_FEE_MODES,
  parseJobCommissionToSimple,
  syncSimpleCommissionState,
} from '../../utils/businessSimpleCommission';
import {
  formatFixedAmountWithCurrency,
  getJobCurrencyShortLabel,
} from '../../utils/jobSalaryCurrency';

const FEE_MODE_SELECT_OPTIONS = [
  { value: SIMPLE_FEE_MODES.PERCENT_ANNUAL, label: '% thu nhập năm' },
  { value: SIMPLE_FEE_MODES.FIXED, label: 'Số tiền cố định' },
  { value: SIMPLE_FEE_MODES.MONTHLY_SALARY, label: 'Tháng lương' },
];

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[11px] sm:text-xs text-slate-900 outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/25';

/**
 * Cài đặt phí giới thiệu nhân sự (tối giản) — doanh nghiệp / đưa job lên sàn CTV.
 */
export default function JobCommissionEditor({
  jobCommissionType,
  onCommissionTypeChange,
  jobValues,
  onJobValuesChange,
  salaryCurrency = 'JPY',
  onSalaryCurrencyChange: _onSalaryCurrencyChange,
  commissionSeedJob = null,
}) {
  const seedKey = commissionSeedJob?.id ?? commissionSeedJob?.jobId ?? null;

  const initial = useMemo(
    () => parseJobCommissionToSimple(commissionSeedJob || { jobCommissionType, jobValues }),
    [seedKey, commissionSeedJob, jobCommissionType, jobValues],
  );

  const [feeMode, setFeeMode] = useState(initial.feeMode);
  const [amount, setAmount] = useState(initial.amount);

  useEffect(() => {
    if (!commissionSeedJob) return;
    const parsed = parseJobCommissionToSimple(commissionSeedJob);
    setFeeMode(parsed.feeMode);
    setAmount(parsed.amount);
    syncSimpleCommissionState(
      parsed.feeMode,
      parsed.amount,
      { viewOnCollaborator: parsed.viewOnCollaborator || '' },
      onCommissionTypeChange,
      onJobValuesChange,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const applyPayload = (nextMode, nextAmount) => {
    syncSimpleCommissionState(
      nextMode,
      nextAmount,
      { viewOnCollaborator: '' },
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

  const valuePlaceholder = feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL
    ? 'VD: 30'
    : feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY
      ? 'VD: 1 hoặc 1.5'
      : 'VD: 500000';

  const valueHint = feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL && amount
    ? `${amount}% thu nhập năm`
    : feeMode === SIMPLE_FEE_MODES.FIXED && amount
      ? formatFixedAmountWithCurrency(amount, salaryCurrency)
      : feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY && amount
        ? `≈ ${amount} tháng lương`
        : null;

  return (
    <div className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4 space-y-3">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-800 sm:text-[13px]">Phí giới thiệu nhân sự</div>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug sm:text-[11px]">
          {DIRECT_REFERRAL_LABEL}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
        <div className="min-w-0">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 sm:text-xs">
            Giá trị phí <span className="text-red-500">*</span>
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
            placeholder={valuePlaceholder}
            className={inputClass}
          />
          {feeMode === SIMPLE_FEE_MODES.FIXED ? (
            <p className="text-[10px] text-slate-400 mt-1">
              Đơn vị: {getJobCurrencyShortLabel(salaryCurrency)} (theo JD)
            </p>
          ) : null}
          {valueHint ? (
            <p className="text-[10px] text-slate-500 mt-1">{valueHint}</p>
          ) : null}
        </div>

        <div className="min-w-0">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 sm:text-xs">
            Kiểu phí <span className="text-red-500">*</span>
          </label>
          <select
            value={feeMode}
            onChange={(e) => handleModeChange(e.target.value)}
            className={inputClass}
          >
            {FEE_MODE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

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
