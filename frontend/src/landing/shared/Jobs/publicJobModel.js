import { detailCopy, RECRUITMENT_TYPE_LABELS } from './publicJobCopy';

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

export function pickSalary(job, lang, type = 'yearly') {
  const ranges = job?.salaryRanges || [];
  const row = ranges.find((r) => r.type === type) || ranges[0];
  if (!row) return '';
  return ownLangThenLocalized(row, 'salaryRange', lang);
}

export function displaySalary(job, lang) {
  const yearly = pickSalary(job, lang, 'yearly');
  const monthly = pickSalary(job, lang, 'monthly');
  if (yearly && monthly) return { primary: yearly, secondary: monthly, primaryLabel: 'yearly' };
  if (yearly) return { primary: yearly, secondary: '', primaryLabel: 'yearly' };
  if (monthly) return { primary: monthly, secondary: '', primaryLabel: 'monthly' };
  return { primary: '', secondary: '', primaryLabel: 'yearly' };
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

const TONE_BY_ROOT = {
  11: 'sales',
  51: 'admin',
  79: 'it',
  112: 'embedded',
  137: 'mechanical',
  190: 'chemical',
  225: 'construction',
};

export function categoryTone(jobCategoryId) {
  const id = Number(jobCategoryId);
  if (TONE_BY_ROOT[id]) return TONE_BY_ROOT[id];
  return 'other';
}

const TONE_CLASS = {
  sales: 'border-l-[#e85d04]',
  admin: 'border-l-[#6a4c93]',
  it: 'border-l-[#0077b6]',
  embedded: 'border-l-[#2a9d8f]',
  mechanical: 'border-l-[#606c38]',
  chemical: 'border-l-[#9b2226]',
  construction: 'border-l-[#bc6c25]',
  other: 'border-l-[#be1824]',
};

export function toneBorderClass(job) {
  const catId = job?.jobCategoryId ?? job?.category?.id;
  return TONE_CLASS[categoryTone(catId)] || TONE_CLASS.other;
}

const WORK_BENEFIT_PATTERN =
  /^(thời gian làm việc|thời gian nghỉ|làm thêm giờ|ngày nghỉ|chi tiết ngày nghỉ|phụ cấp làm thêm|working hours|work hours|break time|overtime|days off|holiday details|勤務時間|休憩時間|残業|休日|休日の詳細)/i;

/** Build detail sections from API job (mirrors Job Detail V2 `sourceSections`). */
export function buildJobDetailSections(job, lang) {
  if (job?.jobDetailSections) return job.jobDetailSections;

  const t = detailCopy(lang);
  const requirements = (job?.requirements || [])
    .map((r) => ({ ...r, text: requirementText(r, lang) }))
    .filter((r) => r.text);

  const grouped = ['required', 'preferred']
    .map((status) => ({
      label: status === 'required' ? t.required : t.preferred,
      items: requirements.filter((r) => r.status === status).map((r) => r.text),
    }))
    .filter((g) => g.items.length);

  const overviewText =
    localizedField(job, 'jobDescription', lang)
    || localizedField(job, 'jobContent', lang)
    || localizedField(job, 'description', lang);

  const benefitsRaw = Array.isArray(job?.benefits)
    ? job.benefits.map((x) => ({
        label: localizedField(x, 'name', lang),
        text: localizedField(x, 'description', lang) || localizedField(x, 'content', lang),
        items: Array.isArray(x.items) ? x.items : null,
      }))
    : [];

  const workBenefits = benefitsRaw.filter((b) => WORK_BENEFIT_PATTERN.test(b.label || ''));
  const otherBenefits = benefitsRaw.filter((b) => !WORK_BENEFIT_PATTERN.test(b.label || ''));

  const processText =
    localizedField(job, 'interviewProcess', lang) || localizedField(job, 'recruitmentProcess', lang);

  const companyText = localizedField(job?.recruitingCompany, 'description', lang);

  return {
    overview: overviewText ? { text: overviewText, label: '' } : null,
    requirements: grouped,
    workBenefits,
    benefits: otherBenefits,
    process: processText ? { text: processText } : null,
    company: companyText
      ? { text: companyText, info: companyName(job, lang), sectors: [] }
      : null,
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
