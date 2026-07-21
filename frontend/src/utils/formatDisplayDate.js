/**
 * Định dạng ngày hiển thị theo ngôn ngữ UI.
 * - vi: DD/MM/YYYY (vi-VN)
 * - en: MM/DD/YYYY (en-US)
 * - ja: YYYY年M月D日 (chuẩn hiển thị tiếng Nhật, ví dụ 2026年7月9日)
 */
export function formatDisplayDate(dateString, language = 'vi') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const lang = String(language || 'vi').toLowerCase();

  if (lang === 'ja') {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}年${m}月${d}日`;
  }

  const locale = lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export function jobCreatedUpdatedLabels(language = 'vi') {
  const lang = String(language || 'vi').toLowerCase();
  if (lang === 'en') {
    return { created: 'Date created:', updated: 'Date updated:' };
  }
  if (lang === 'ja') {
    return { created: '作成日:', updated: '更新日:' };
  }
  return { created: 'Ngày tạo:', updated: 'Ngày cập nhật:' };
}
