import { normalizeJobCommissionType, pickPrimaryCommissionJobValue } from './jobCommissionUi';

/** Type «Phí» — tiến cử trực tiếp với doanh nghiệp (valueId 7, không JLPT). */
export const FEE_TYPE_PHI = 2;
export const FEE_VALUE_DIRECT_TO_BUSINESS = 7;
export const FEE_TYPE_MONTHLY = 7;
export const FEE_VALUE_MONTHLY_SALARY = 34;

export const SIMPLE_FEE_MODES = {
  PERCENT_ANNUAL: 'percent_annual',
  FIXED: 'fixed_amount',
  MONTHLY_SALARY: 'monthly_salary',
};

export const DIRECT_REFERRAL_LABEL = 'Tiến cử trực tiếp với doanh nghiệp';

const EMPTY_ROW = {
  typeId: '',
  valueId: '',
  value: '',
  isRequired: false,
  viewOnCollaborator: '',
};

function parseMonthsFromValue(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const s = String(raw).trim();
  const num = parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (Number.isFinite(num)) return String(num);
  return s;
}

/**
 * Suy ra form đơn giản từ jobCommissionType + jobValues (kể cả JD cũ có JLPT).
 */
export function parseJobCommissionToSimple(jobOrType, maybeValues) {
  let jobCommissionType;
  let jobValues;
  if (jobOrType && typeof jobOrType === 'object' && !Array.isArray(jobOrType)) {
    jobCommissionType = normalizeJobCommissionType(jobOrType);
    jobValues = jobOrType.jobValues || jobOrType.profits || [];
  } else {
    jobCommissionType = normalizeJobCommissionType({ jobCommissionType: jobOrType });
    jobValues = maybeValues || [];
  }

  const rows = Array.isArray(jobValues) ? jobValues : [];
  const monthly = rows.find(
    (jv) => Number(jv.typeId) === FEE_TYPE_MONTHLY && Number(jv.valueId) === FEE_VALUE_MONTHLY_SALARY,
  );
  if (monthly && (monthly.value || monthly.viewOnCollaborator)) {
    return {
      feeMode: SIMPLE_FEE_MODES.MONTHLY_SALARY,
      amount: parseMonthsFromValue(monthly.value),
      viewOnCollaborator: monthly.viewOnCollaborator || '',
      jobCommissionType: 'fixed',
      jobValues: rows,
    };
  }

  const primary = pickPrimaryCommissionJobValue(rows);
  if (!primary || (primary.value == null || String(primary.value).trim() === '')) {
    return {
      feeMode: SIMPLE_FEE_MODES.PERCENT_ANNUAL,
      amount: '',
      viewOnCollaborator: '',
      jobCommissionType: jobCommissionType || 'percent',
      jobValues: [{ ...EMPTY_ROW }],
    };
  }

  if (jobCommissionType === 'percent') {
    return {
      feeMode: SIMPLE_FEE_MODES.PERCENT_ANNUAL,
      amount: String(primary.value).trim(),
      viewOnCollaborator: '',
      jobCommissionType: 'percent',
      jobValues: rows,
    };
  }

  return {
    feeMode: SIMPLE_FEE_MODES.FIXED,
    amount: String(primary.value).trim(),
    viewOnCollaborator: '',
    jobCommissionType: 'fixed',
    jobValues: rows,
  };
}

/** Chuyển form đơn giản → payload lưu API (một dòng phí, không JLPT). */
export function simpleCommissionToPayload(feeMode, amount, { viewOnCollaborator = '' } = {}) {
  const trimmed = amount != null ? String(amount).trim() : '';
  if (!trimmed) {
    return { jobCommissionType: 'fixed', jobValues: [{ ...EMPTY_ROW }] };
  }

  if (feeMode === SIMPLE_FEE_MODES.MONTHLY_SALARY) {
    const monthsNum = parseFloat(trimmed.replace(',', '.'));
    const label = Number.isFinite(monthsNum)
      ? `${monthsNum} tháng lương`
      : trimmed;
    return {
      jobCommissionType: 'fixed',
      jobValues: [{
        typeId: FEE_TYPE_MONTHLY,
        valueId: FEE_VALUE_MONTHLY_SALARY,
        value: label,
        viewOnCollaborator: viewOnCollaborator || '',
        isRequired: false,
      }],
    };
  }

  if (feeMode === SIMPLE_FEE_MODES.PERCENT_ANNUAL) {
    return {
      jobCommissionType: 'percent',
      jobValues: [{
        typeId: FEE_TYPE_PHI,
        valueId: FEE_VALUE_DIRECT_TO_BUSINESS,
        value: trimmed,
        isRequired: false,
        viewOnCollaborator: '',
      }],
    };
  }

  return {
    jobCommissionType: 'fixed',
    jobValues: [{
      typeId: FEE_TYPE_PHI,
      valueId: FEE_VALUE_DIRECT_TO_BUSINESS,
      value: trimmed,
      isRequired: false,
      viewOnCollaborator: '',
    }],
  };
}

export function syncSimpleCommissionState(feeMode, amount, options, onTypeChange, onValuesChange) {
  const { jobCommissionType, jobValues } = simpleCommissionToPayload(feeMode, amount, options);
  onTypeChange(jobCommissionType);
  onValuesChange(jobValues);
}
