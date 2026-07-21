/**
 * Định dạng kỳ thời gian kiểu Nhật cho CV (職務経歴 / 学歴).
 * Ví dụ: `2020 年 4 月～2024 年 5 月`, `2020 年 4 月～現在`
 */

export function parseApiDateToYearMonth(dateStr) {
  if (dateStr == null || dateStr === '') return { year: '', month: '' };
  const s = String(dateStr).trim();
  if (!s) return { year: '', month: '' };
  if (/^(Nay|現在|present|current)$/i.test(s) || s.includes('現在')) return { year: '', month: '' };

  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) return { year: yearOnly[1], month: '' };

  const iso = s.match(/^(\d{4})[-](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (iso) return { year: iso[1], month: String(parseInt(iso[2], 10)) };

  const slash = s.match(/^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?/);
  if (slash) return { year: slash[1], month: String(parseInt(slash[2], 10)) };

  const rev = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (rev) return { year: rev[2], month: String(parseInt(rev[1], 10)) };

  const jp = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*(?:月)?/);
  if (jp) return { year: jp[1], month: String(parseInt(jp[2], 10)) };

  return { year: '', month: '' };
}

export function isEndDateCurrent(endDate) {
  if (endDate == null || endDate === '') return false;
  const s = String(endDate).trim();
  const lower = s.toLowerCase();
  return s === '現在' || lower === 'đến nay' || lower === 'present' || lower === 'current' || s.includes('現在');
}

/** Tách chuỗi period `2020/4～2024/5` hoặc `2020 年 4 月～2024 年 5 月`. */
export function splitWorkPeriodRange(period) {
  if (period == null || period === '') return ['', ''];
  const normalized = String(period).replace(/\u301c|\uff5e|\u223c/g, '~').trim();
  const parts = normalized.split(/\s*~\s*/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  return [parts[0] || '', ''];
}

function formatYearMonthPartJa(ym) {
  if (!ym) return '';
  const y = String(ym.year ?? '').trim();
  const m = String(ym.month ?? '').trim();
  if (y && m) return `${y} 年 ${m} 月`;
  if (y) return `${y} 年`;
  if (m) return `${m} 月`;
  return '';
}

function hasYearMonth(ym) {
  return Boolean(ym && (String(ym.year ?? '').trim() || String(ym.month ?? '').trim()));
}

/** 職務経歴「期間」— `2020 年 4 月～2024 年 5 月` (full-width ～). */
export function formatShokumuPeriodRangeJa(startRaw, endRaw) {
  const startYm = parseApiDateToYearMonth(String(startRaw || '').trim());
  const endStr = String(endRaw || '').trim();
  const endCurrent = isEndDateCurrent(endStr);
  const endYm = endCurrent ? null : parseApiDateToYearMonth(endStr);
  const startPart = formatYearMonthPartJa(startYm);
  const endPart = endYm ? formatYearMonthPartJa(endYm) : '';
  const startOk = hasYearMonth(startYm);
  const endOk = Boolean(endPart);

  if (startOk && endCurrent) return `${startPart}～現在`;
  if (startOk && endOk) return `${startPart}～${endPart}`;
  if (startOk) return startPart;
  if (endOk) return endPart;
  return '';
}

function normalizeExistingJaPeriod(period) {
  const s = String(period || '').trim();
  if (!s) return '';
  if (/年/.test(s) && /[～~]/.test(s)) {
    return s.replace(/~/g, '～').replace(/\u301c/g, '～').replace(/\s*-\s*/g, '～');
  }
  return '';
}

/** Lấy kỳ làm việc từ object workExperiences (start_date/end_date hoặc startYear/endYear). */
export function formatWorkExperiencePeriodJa(work = {}) {
  if (!work || typeof work !== 'object') return '—';

  const existing = normalizeExistingJaPeriod(work.period);
  if (existing) return existing;

  const endCurrent =
    work.endCurrent === true ||
    work.end_current === true ||
    isEndDateCurrent(work.end_date || work.period_end || work.endDate);

  let startRaw = work.start_date || work.period_start || work.startDate || '';
  let endRaw = endCurrent ? '現在' : (work.end_date || work.period_end || work.endDate || '');

  if ((!startRaw || (!endRaw && !endCurrent)) && work.period) {
    const [startFromPeriod, endFromPeriod] = splitWorkPeriodRange(work.period);
    startRaw = startRaw || startFromPeriod;
    if (!endCurrent) endRaw = endRaw || endFromPeriod;
  }

  if (!startRaw && (work.startYear != null || work.startMonth != null)) {
    startRaw = [work.startYear, work.startMonth].filter((v) => v != null && String(v).trim() !== '').join('/');
  }
  if (!endRaw && !endCurrent && (work.endYear != null || work.endMonth != null)) {
    endRaw = [work.endYear, work.endMonth].filter((v) => v != null && String(v).trim() !== '').join('/');
  }

  const formatted = formatShokumuPeriodRangeJa(startRaw, endCurrent ? '現在' : endRaw);
  return formatted || '—';
}

/** 学歴 — 入学年月～卒業年月 */
export function formatEducationPeriodJa(edu = {}) {
  if (!edu || typeof edu !== 'object') return '—';

  const startRaw =
    edu.start_date ||
    (edu.year != null && String(edu.year).trim() !== ''
      ? `${edu.year}${edu.month ? `/${edu.month}` : ''}`
      : '');

  const endRaw =
    edu.end_date ||
    (edu.endYear != null && String(edu.endYear).trim() !== ''
      ? `${edu.endYear}${edu.endMonth ? `/${edu.endMonth}` : ''}`
      : '');

  const formatted = formatShokumuPeriodRangeJa(startRaw, endRaw);
  return formatted || '—';
}

/** Dự án trong 職務経歴 */
export function formatProjectPeriodJa(project = {}) {
  if (!project || typeof project !== 'object') return '—';

  const existing = normalizeExistingJaPeriod(project.period);
  if (existing) return existing;

  const endCurrent = isEndDateCurrent(project.end_date || project.period_end);
  let startRaw = project.start_date || project.period_start || '';
  let endRaw = endCurrent ? '現在' : (project.end_date || project.period_end || '');

  if ((!startRaw || (!endRaw && !endCurrent)) && project.period) {
    const [s, e] = splitWorkPeriodRange(project.period);
    startRaw = startRaw || s;
    if (!endCurrent) endRaw = endRaw || e;
  }

  if (!startRaw && (project.startYear != null || project.startMonth != null)) {
    startRaw = [project.startYear, project.startMonth].filter((v) => v != null && String(v).trim() !== '').join('/');
  }
  if (!endRaw && !endCurrent && (project.endYear != null || project.endMonth != null)) {
    endRaw = [project.endYear, project.endMonth].filter((v) => v != null && String(v).trim() !== '').join('/');
  }

  const formatted = formatShokumuPeriodRangeJa(startRaw, endCurrent ? '現在' : endRaw);
  return formatted || '—';
}
