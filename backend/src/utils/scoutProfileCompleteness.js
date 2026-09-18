/**
 * Kiểm tra hồ sơ đủ thông tin để đưa lên sàn Scout (sau Scout dự bị).
 */

function hasText(value) {
  return value != null && String(value).trim().length > 0;
}

function parseJsonArray(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @typedef {{ key: string, label: string }} ScoutProfileFieldReq */

export const SCOUT_PROFILE_REQUIRED_FOR_LISTING = [
  { key: 'name', label: 'Họ tên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'desiredPosition', label: 'Vị trí mong muốn' },
  { key: 'jobCategoryId', label: 'Ngành nghề / job category' },
  { key: 'jlptLevel', label: 'JLPT / trình độ tiếng Nhật' },
  { key: 'careerSummary', label: 'Tóm tắt kinh nghiệm (careerSummary hoặc scoutPublicSummary)' },
  { key: 'educations', label: 'Học vấn' },
  { key: 'workExperiences', label: 'Kinh nghiệm làm việc' },
  { key: 'desiredWorkLocation', label: 'Địa điểm làm việc mong muốn' },
];

/**
 * @param {object} cv
 * @returns {{ complete: boolean, missing: ScoutProfileFieldReq[], percent: number }}
 */
export function assessScoutProfileCompleteness(cv) {
  if (!cv) {
    return { complete: false, missing: [...SCOUT_PROFILE_REQUIRED_FOR_LISTING], percent: 0 };
  }

  const missing = [];

  for (const req of SCOUT_PROFILE_REQUIRED_FOR_LISTING) {
    if (req.key === 'careerSummary') {
      const ok =
        hasText(cv.careerSummary) ||
        hasText(cv.scoutPublicSummary) ||
        hasText(cv.strengths) ||
        hasText(cv.motivation);
      if (!ok) missing.push(req);
      continue;
    }
    if (req.key === 'educations' || req.key === 'workExperiences') {
      const arr = parseJsonArray(cv[req.key]);
      if (!arr.length) missing.push(req);
      continue;
    }
    if (req.key === 'jobCategoryId') {
      const id = cv.jobCategoryId ?? cv.job_category_id;
      if (id == null || id === '') missing.push(req);
      continue;
    }
    if (!hasText(cv[req.key])) missing.push(req);
  }

  const total = SCOUT_PROFILE_REQUIRED_FOR_LISTING.length;
  const filled = total - missing.length;
  const percent = total ? Math.round((filled / total) * 100) : 0;

  return {
    complete: missing.length === 0,
    missing,
    percent,
  };
}

export default { assessScoutProfileCompleteness, SCOUT_PROFILE_REQUIRED_FOR_LISTING };
