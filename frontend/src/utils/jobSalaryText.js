const CURRENCY_TOKENS = /\b(?:JPY|USD|VND|EUR)\b|[円万¥￥$]/g;

/** «Mức lương» là khoảng lương ngắn; dài hơn thế là đoạn mô tả bị nhập nhầm ô — nhường cho «Chi tiết mức lương». */
export const SALARY_RANGE_MAX_LENGTH = 60;

/** Chỉ gồm số, ký hiệu tiền tệ và dấu (vd. `250,000〜330,000`, `212.000 - 530.000 JPY`) — hiển thị được ở mọi ngôn ngữ. */
export function isLanguageNeutralSalary(text) {
  return !/\p{L}{2,}/u.test(String(text || '').replace(CURRENCY_TOKENS, ''));
}
