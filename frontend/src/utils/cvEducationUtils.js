/** Tính 年数 từ 入学年月 / 卒業年月 (làm tròn theo năm). */
export function calculateEducationYearsFromDates(edu) {
  const startY = parseInt(String(edu?.year ?? '').replace(/\D/g, ''), 10);
  const startM = parseInt(String(edu?.month ?? '').replace(/\D/g, ''), 10) || 1;
  const endY = parseInt(String(edu?.endYear ?? '').replace(/\D/g, ''), 10);
  const endM = parseInt(String(edu?.endMonth ?? '').replace(/\D/g, ''), 10) || 1;
  if (!Number.isFinite(startY) || startY < 1000 || !Number.isFinite(endY) || endY < 1000) return '';
  const clampMonth = (m) => Math.min(12, Math.max(1, m));
  const diffMonths = (endY * 12 + clampMonth(endM)) - (startY * 12 + clampMonth(startM));
  if (diffMonths <= 0) return '';
  const years = Math.round(diffMonths / 12);
  return years > 0 ? String(years) : '';
}

export function withEducationYearsCalculated(edu) {
  const years = calculateEducationYearsFromDates(edu);
  return { ...(edu || {}), years };
}
