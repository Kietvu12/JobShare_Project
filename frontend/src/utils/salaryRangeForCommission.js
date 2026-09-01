/**
 * Cơ sở tính % hoa hồng (campaign / job_value percent) phải là thu nhập NĂM rõ ràng.
 * Không fallback sang type month/week/day hoặc parse mơ hồ từ HTML — tránh dùng nhầm
 * "220000 - 500000" (lương tháng ¥) làm "năm" rồi bơm sai quy mô.
 */

export function isSalaryRangeYearType(sr) {
  if (!sr) return false;
  const t = (sr.type || '').toLowerCase().trim();
  const tjp = (sr.typeJp || sr.type_jp || '').trim();
  const tjpLower = tjp.toLowerCase();
  if (t === 'year' || t === 'năm' || t === 'yearly') return true;
  if (tjp === '年' || tjpLower === 'year') return true;
  return false;
}

/** Dòng salary_ranges đầu tiên có type = năm; không có thì null */
export function findYearSalaryRangeRow(salaryRanges) {
  if (!Array.isArray(salaryRanges) || salaryRanges.length === 0) return null;
  return salaryRanges.find(isSalaryRangeYearType) ?? null;
}

export function yearSalaryRangeStringForCommission(salaryRanges) {
  const row = findYearSalaryRangeRow(salaryRanges);
  if (!row) return '';
  return row.salaryRange ?? row.salary_range ?? '';
}

/**
 * Parse chuỗi lương NĂM về đơn vị yen (Y) để nhân % phí.
 * - "350-570" / "350 - 570" → 万円 (vạn yên): 3.500.000 – 5.700.000 Y
 * - "3500000-5700000" → yen gốc
 * Trước đây nhân ×1.000.000 → phí CTV cao ~100 lần.
 */
export function parseYearSalaryRangeToYen(rangeStr) {
  if (!rangeStr) return null;
  const m = String(rangeStr).trim().match(/([\d.,]+)\s*[-–—~〜～]\s*([\d.,]+)/);
  if (!m) return null;

  const parseNum = (s) => {
    const cleaned = String(s).replace(/[.,]/g, '');
    const num = parseFloat(cleaned) || 0;
    if (num <= 0) return 0;
    const digitCount = cleaned.replace(/[^0-9]/g, '').length;
    if (digitCount >= 7) return num;
    if (digitCount >= 5) return num;
    return num * 10000;
  };

  const min = parseNum(m[1]);
  const max = parseNum(m[2]);
  if (min <= 0 || max <= 0) return null;
  return { min, max };
}
