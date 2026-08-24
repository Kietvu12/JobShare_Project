import { formatCvYearMonthJa } from './cvJpDateDisplay.js';

/** Số ô 名称+取得年月 bên phải bảng 保有資格 (mỗi hàng dữ liệu một ô). */
export const OTHER_LANG_CERT_SLOT_COUNT = 4;

export function normalizeOtherLanguageCerts(raw) {
  const list = Array.isArray(raw) ? raw : [];
  /** Layout cũ: 3 slot (TOEIC/IELTS/免許) → thêm slot 0 cho hàng 日本語検定. */
  const migrated = list.length === 3 ? [{ name: '', year: '', month: '' }, ...list] : list;
  return Array.from({ length: OTHER_LANG_CERT_SLOT_COUNT }, (_, i) => {
    const item = migrated[i] && typeof migrated[i] === 'object' ? migrated[i] : {};
    return {
      name: item.name != null ? String(item.name) : '',
      year: item.year != null ? String(item.year) : '',
      month: item.month != null ? String(item.month) : '',
    };
  });
}

export function readOtherLanguageCerts(formData) {
  if (Array.isArray(formData?.otherLanguageCerts)) {
    return normalizeOtherLanguageCerts(formData.otherLanguageCerts);
  }
  const layout = formData?.cvTableLayout;
  if (layout && typeof layout === 'object' && Array.isArray(layout.otherLanguageCerts)) {
    return normalizeOtherLanguageCerts(layout.otherLanguageCerts);
  }
  return normalizeOtherLanguageCerts([]);
}

export function hasOtherLangCertData(cert) {
  if (!cert || typeof cert !== 'object') return false;
  return Boolean(
    String(cert.name || '').trim()
    || String(cert.year || '').trim()
    || String(cert.month || '').trim(),
  );
}

export function hasAnyOtherLangCertData(formData) {
  return readOtherLanguageCerts(formData).some(hasOtherLangCertData);
}

export function getOtherLangCertYearMonth(cert) {
  return formatCvYearMonthJa(cert?.year, cert?.month) || '';
}
