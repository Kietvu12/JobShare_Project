import { detailCopy, RECRUITMENT_TYPE_LABELS } from './publicJobCopy';
import { isLanguageNeutralSalary, SALARY_RANGE_MAX_LENGTH } from '../../../utils/jobSalaryText';

const LANG_SUFFIX = { en: 'En', ja: 'Jp', vi: '' };

/** @param {string} lang vi | en | ja */
export function localizedField(obj, field, lang) {
  if (!obj) return '';
  const suffix = LANG_SUFFIX[lang] ?? '';
  const localizedKey = suffix ? `${field}${suffix}` : field;
  const localizedVal = obj[localizedKey];
  if (typeof localizedVal === 'string' && localizedVal.trim()) return localizedVal.trim();
  const base = obj[field];
  return typeof base === 'string' ? base.trim() : '';
}

/** `*Localized` từ API theo `lang` của request (mặc định vi) — chỉ dùng khi thiếu trường riêng của ngôn ngữ đang xem. */
function ownLangThenLocalized(obj, field, lang) {
  if (!obj) return '';
  const suffix = LANG_SUFFIX[lang] ?? '';
  const own = suffix ? obj[`${field}${suffix}`] : obj[field];
  if (typeof own === 'string' && own.trim()) return own.trim();
  const fromApi = obj[`${field}Localized`];
  if (typeof fromApi === 'string' && fromApi.trim()) return fromApi.trim();
  return localizedField(obj, field, lang);
}

export function requirementText(req, lang) {
  return ownLangThenLocalized(req, 'content', lang);
}

export { SALARY_RANGE_MAX_LENGTH };

/** «Mức lương» đúng ngôn ngữ đang xem; bản tiếng Việt chỉ dùng thay khi không chứa chữ. */
export function salaryRangeText(row, lang) {
  if (!row) return '';
  const suffix = LANG_SUFFIX[lang] ?? '';
  const own = suffix ? row[`salaryRange${suffix}`] : row.salaryRange;
  if (typeof own === 'string' && own.trim()) return own.trim();
  const base = typeof row.salaryRange === 'string' ? row.salaryRange.trim() : '';
  return base && isLanguageNeutralSalary(base) ? base : '';
}

/** «Chi tiết mức lương» đúng ngôn ngữ đang xem (giữ xuống dòng). */
export function salaryDetailText(job, lang) {
  const raw = job?.salaryRangeDetails;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const suffix = LANG_SUFFIX[lang] ?? '';
  return rows
    .map((r) => (suffix ? r?.[`content${suffix}`] : r?.content))
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim())
    .join('\n');
}

export function pickSalary(job, lang, type = 'yearly') {
  const ranges = job?.salaryRanges || [];
  const typed = ranges.filter((r) => r.type === type);
  for (const row of typed.length ? typed : ranges) {
    const text = salaryRangeText(row, lang);
    if (text) return text;
  }
  return '';
}

export function displaySalary(job, lang) {
  const detail = salaryDetailText(job, lang);
  const usable = (text) => text && !(detail && text.length > SALARY_RANGE_MAX_LENGTH);
  const yearly = pickSalary(job, lang, 'yearly');
  const monthly = pickSalary(job, lang, 'monthly');
  if (usable(yearly) && usable(monthly) && yearly !== monthly) {
    return { primary: yearly, secondary: monthly, primaryLabel: 'yearly' };
  }
  if (usable(yearly)) return { primary: yearly, secondary: '', primaryLabel: 'yearly' };
  if (usable(monthly)) return { primary: monthly, secondary: '', primaryLabel: 'monthly' };

  if (detail) return { primary: detail, secondary: '', primaryLabel: 'detail' };

  const fallback = ownLangThenLocalized((job?.salaryRanges || [])[0], 'salaryRange', lang);
  return { primary: fallback, secondary: '', primaryLabel: 'yearly' };
}

export function jobLocations(job, lang) {
  const rows = job?.workingLocations || [];
  const parts = rows
    .map((loc) => localizedField(loc, 'location', lang) || loc.locationLocalized || '')
    .filter(Boolean);
  return [...new Set(parts)].join(' · ');
}

export function categoryName(job, lang) {
  return localizedField(job?.category, 'name', lang) || '';
}

export function companyName(job, lang) {
  return localizedField(job?.recruitingCompany, 'companyName', lang) || '';
}

export function recruitmentLabel(type, lang) {
  const map = RECRUITMENT_TYPE_LABELS[lang] || RECRUITMENT_TYPE_LABELS.vi;
  return map[Number(type)] || '';
}

export function formatJobDate(iso, lang) {
  if (!iso) return '';
  try {
    const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-GB' : 'vi-VN';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

const toRows = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/** Chỉ đúng ngôn ngữ đang xem, không lùi về tiếng Việt (giống trang chi tiết nội bộ). */
function ownText(obj, field, lang) {
  const suffix = LANG_SUFFIX[lang] ?? '';
  const value = obj?.[suffix ? `${field}${suffix}` : field];
  return typeof value === 'string' ? value.trim() : '';
}

/** Nội dung các bảng `*Details` (mỗi dòng một mục), theo đúng ngôn ngữ đang xem. */
function detailLines(rows, lang) {
  return toRows(rows)
    .map((r) => ownText(r, 'content', lang))
    .filter(Boolean)
    .flatMap((text) => text.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Nơi làm việc: bảng `workingLocations` (danh sách) hoặc `workingLocationDetails` (trang chi tiết). */
export function jobWorkLocation(job, lang) {
  const fromDetails = toRows(job?.workingLocationDetails)
    .map((r) => ownLangThenLocalized(r, 'content', lang))
    .filter(Boolean)
    .flatMap((text) => text.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
  return jobLocations(job, lang) || fromDetails.join(' · ');
}

/** Các mục của trang chi tiết — cùng nguồn dữ liệu và nhãn với trang chi tiết nội bộ (Job Detail V2). */
export function buildJobDetailSections(job, lang) {
  const t = detailCopy(lang);
  const field = (key) => ownText(job, key, lang);
  const row = (label, text) => (text ? { label, text } : null);
  const listRow = (label, items) => (items.length ? { label, items } : null);

  const requirements = (job?.requirements || [])
    .map((r) => ({ status: r.status, text: requirementText(r, lang) }))
    .filter((r) => r.text);
  const groups = ['required', 'preferred']
    .map((status) => ({
      required: status === 'required',
      label: status === 'required' ? t.required : t.preferred,
      items: requirements.filter((r) => r.status === status).map((r) => r.text),
    }))
    .filter((g) => g.items.length);

  const smokingPolicies = toRows(job?.smokingPolicies).map((p) => (p.allow ? t.smokingAllow : t.smokingDeny));

  const workRows = [
    listRow(t.workingHours, detailLines(job?.workingHourDetails, lang)),
    row(t.breakTime, field('breakTime')),
    row(t.overtime, field('overtime')),
    listRow(t.overtimeAllowance, detailLines(job?.overtimeAllowanceDetails, lang)),
    row(t.holidays, field('holidays')),
    row(t.holidayDetails, field('holidayDetails')),
  ].filter(Boolean);

  const benefitRows = [
    row(t.socialInsurance, field('socialInsurance')),
    row(t.transportation, field('transportation')),
    row(t.bonus, field('bonus')),
    row(t.salaryReview, field('salaryReview')),
    listRow(t.benefitList, detailLines(job?.benefits, lang)),
    listRow(t.smoking, smokingPolicies),
    listRow(t.smokingDetail, detailLines(job?.smokingPolicyDetails, lang)),
  ].filter(Boolean);

  const processBlocks = [
    row(t.reasonLabel, field('recruitmentReason')),
    row(t.processLabel, field('recruitmentProcess') || field('interviewProcess')),
  ].filter(Boolean);

  const company = job?.recruitingCompany;
  const companyInfo = [
    companyName(job, lang),
    ...[
      [t.revenue, 'revenue'],
      [t.employees, 'numberOfEmployees'],
      [t.headquarters, 'headquarters'],
      [t.established, 'establishedDate'],
    ]
      .map(([label, key]) => {
        const value = ownText(company, key, lang);
        return value ? `${label} ${value}` : '';
      }),
  ]
    .filter(Boolean)
    .join('\n');
  const companyText = ownText(company, 'companyIntroduction', lang);
  const overviewText =
    localizedField(job, 'description', lang)
    || localizedField(job, 'jobDescription', lang)
    || localizedField(job, 'jobContent', lang);

  return {
    overview: overviewText ? { label: t.jobContent, text: overviewText } : null,
    requirements: groups,
    workRows,
    benefitRows,
    process: processBlocks.length ? processBlocks : null,
    company: companyInfo || companyText ? { info: companyInfo, text: companyText } : null,
  };
}

export function parseJobsListResponse(response) {
  if (!response?.success) {
    const err = new Error(response?.message || 'Request failed');
    err.api = response;
    throw err;
  }
  return {
    jobs: response.data?.jobs ?? [],
    pagination: response.data?.pagination ?? {},
  };
}

export function parseJobDetailResponse(response) {
  if (!response?.success || !response.data?.job) {
    const err = new Error(response?.message || 'Job not found');
    err.status = 404;
    throw err;
  }
  return response.data.job;
}
