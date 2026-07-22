/**
 * Chuỗi lương dạng min–max hoặc text tự do — giữ nguyên; đơn vị tiền xử lý ở jobSalaryCurrency.
 */

/**
 * @param {string} [value]
 * @returns {string}
 */
export function formatSalaryValueWithJlptIfRange(value) {
  const s = String(value ?? '').trim();
  if (!s) return s;
  if (/\bJLPT\s*$/i.test(s)) return s;
  return s;
}
