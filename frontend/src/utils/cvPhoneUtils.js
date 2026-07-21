/**
 * Chuẩn hóa SĐT — đồng bộ backend `cvIdentityNormalize.normalizeCvPhone`.
 * Bỏ khoảng trắng, gạch ngang, dấu chấm, ngoặc, dấu +.
 */
export function normalizeCvPhone(phone) {
  if (phone == null || phone === '') return '';
  return String(phone)
    .trim()
    .replace(/\s/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\+/g, '');
}

/** Hiển thị SĐT trên danh sách/chi tiết — chỉ chữ số, không ký tự định dạng. */
export function formatPhoneForDisplay(phone) {
  return normalizeCvPhone(phone);
}

/** Kiểm tra SĐT hợp lệ sau chuẩn hóa (rỗng = hợp lệ vì tuỳ chọn). */
export function isValidCvPhone(value) {
  const digits = normalizeCvPhone(value);
  if (!digits) return true;
  return /^\d{8,15}$/.test(digits);
}
