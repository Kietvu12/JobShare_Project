/** Locale nội dung đang xem/sửa trong builder (đồng bộ với LanguageContext) */
let activeEditorContentLocale = 'vi';

export function normalizeEditorContentLocale(language) {
  if (language === 'en' || language === 'ja') return language;
  return 'vi';
}

export function setEditorContentLocale(language) {
  activeEditorContentLocale = normalizeEditorContentLocale(language);
}

export function getEditorContentLocale() {
  return activeEditorContentLocale;
}
