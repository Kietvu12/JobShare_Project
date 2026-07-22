import { formatSalaryValueWithJlptIfRange } from './salaryDisplay.js';

/** JD Builder API currency codes (see JD_Builder_API.md). */
export const JD_CURRENCY_CODE_TO_ISO = {
  1: 'JPY',
  2: 'USD',
  3: 'VND',
};

export const JOB_SALARY_CURRENCY_TO_JD_CODE = {
  JPY: 1,
  USD: 2,
  VND: 3,
};

export const JOB_SALARY_CURRENCY_OPTIONS = [
  { value: 'JPY', label: 'JPY (Yên Nhật)' },
  { value: 'VND', label: 'VND (Việt Nam đồng)' },
  { value: 'USD', label: 'USD (Đô la Mỹ)' },
];

const VALID_CURRENCIES = new Set(['JPY', 'VND', 'USD']);

/**
 * @param {string|number|null|undefined} raw
 * @returns {'JPY'|'VND'|'USD'}
 */
export function normalizeJobSalaryCurrency(raw) {
  if (raw == null || raw === '') return 'JPY';
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim()))) {
    const mapped = JD_CURRENCY_CODE_TO_ISO[Number(raw)];
    if (mapped) return mapped;
  }
  const upper = String(raw).trim().toUpperCase();
  if (VALID_CURRENCIES.has(upper)) return upper;
  if (/\bVND\b/i.test(String(raw))) return 'VND';
  if (/\bUSD\b/i.test(String(raw))) return 'USD';
  if (/\bJPY\b/i.test(String(raw)) || /万円/u.test(String(raw))) return 'JPY';
  return 'JPY';
}

/**
 * @param {string|number|null|undefined} currency
 * @returns {number}
 */
export function jobSalaryCurrencyToJdCode(currency) {
  return JOB_SALARY_CURRENCY_TO_JD_CODE[normalizeJobSalaryCurrency(currency)] ?? 1;
}

/**
 * @param {...string} texts
 * @returns {'JPY'|'VND'|'USD'|null}
 */
export function detectCurrencyFromSalaryTexts(...texts) {
  for (const text of texts) {
    const s = String(text ?? '');
    if (/\bVND\b/i.test(s)) return 'VND';
    if (/\bUSD\b/i.test(s)) return 'USD';
    if (/\bJPY\b/i.test(s) || /万円/u.test(s)) return 'JPY';
  }
  return null;
}

/**
 * @param {object|null|undefined} job
 * @returns {'JPY'|'VND'|'USD'}
 */
export function resolveJobSalaryCurrency(job) {
  const raw = job?.salaryCurrency ?? job?.salary_currency;
  if (raw != null && String(raw).trim() !== '') {
    return normalizeJobSalaryCurrency(raw);
  }
  const ranges = job?.salaryRanges || [];
  const texts = ranges.flatMap((sr) => [
    sr?.salaryRange,
    sr?.salaryRangeEn,
    sr?.salary_range_en,
    sr?.salaryRangeJp,
    sr?.salary_range_jp,
  ]);
  return detectCurrencyFromSalaryTexts(...texts) || 'JPY';
}

/**
 * @param {string} [value]
 * @param {string} [currency]
 * @returns {string}
 */
export function appendSalaryCurrencyIfNeeded(value, currency = 'JPY') {
  const text = String(value || '').trim();
  if (!text) return '';
  const cur = normalizeJobSalaryCurrency(currency);
  const normalized = text.replace(/\s+/g, ' ');
  const hasLetters = /[A-Za-z\p{L}]/u.test(normalized);
  const alreadyHasCurrency = /\b(JPY|VND|USD|Y)\b/i.test(normalized) || /万円/u.test(normalized);
  const hasNumber = /\d/.test(normalized);
  const rangeMatch = normalized.match(/^(.+?)\s*[-–—〜～]\s*(.+?)$/);
  if (alreadyHasCurrency || !hasNumber || hasLetters) {
    return normalized;
  }
  if (rangeMatch) {
    const left = rangeMatch[1].trim();
    const right = rangeMatch[2].trim();
    return `${left} - ${right} ${cur}`;
  }
  return `${normalized} ${cur}`;
}

/**
 * @param {string} [value]
 * @param {string} [currency]
 * @returns {string}
 */
export function formatJobSalaryDisplay(value, currency = 'JPY') {
  const cur = normalizeJobSalaryCurrency(currency);
  return appendSalaryCurrencyIfNeeded(formatSalaryValueWithJlptIfRange(value, cur), cur);
}

/** Nhãn ngắn hiển thị trên form (JPY → Y theo convention cũ). */
export function getJobCurrencyShortLabel(currency = 'JPY') {
  const cur = normalizeJobSalaryCurrency(currency);
  return cur === 'JPY' ? 'Y' : cur;
}

/** Format số tiền cố định kèm đơn vị (VD: 5.000.000 VND). */
export function formatFixedAmountWithCurrency(amount, currency = 'JPY') {
  const n = parseFloat(amount);
  if (!Number.isFinite(n)) return '';
  return `${Math.round(n).toLocaleString('vi-VN')} ${getJobCurrencyShortLabel(currency)}`;
}

/** Nhãn hiển thị trên card/chi tiết (luôn ISO: JPY, VND, USD). */
export function getJobCurrencyDisplayLabel(currency = 'JPY') {
  return normalizeJobSalaryCurrency(currency);
}

/** Format phí/hoa hồng cố định kèm đơn vị job. */
export function formatCommissionAmountWithCurrency(amount, currency = 'JPY') {
  const nRaw = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(nRaw)) return '';
  return `${Math.round(nRaw).toLocaleString('vi-VN')} ${getJobCurrencyDisplayLabel(currency)}`;
}

/** Format khoảng phí/hoa hồng kèm đơn vị job. */
export function formatCommissionRangeWithCurrency(min, max, currency = 'JPY', formatFn) {
  const cur = getJobCurrencyDisplayLabel(currency);
  const fm = formatFn ? formatFn(min) : Math.round(min).toLocaleString('vi-VN');
  const fx = formatFn ? formatFn(max) : Math.round(max).toLocaleString('vi-VN');
  return `${fm} - ${fx} ${cur}`;
}
