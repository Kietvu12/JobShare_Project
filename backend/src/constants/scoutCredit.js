/**
 * Scout — sàn hồ sơ ẩn danh cho doanh nghiệp.
 * Admin / CTV đưa CV hợp lệ lên scout_status = LISTED.
 * Doanh nghiệp trả credit (Scout Credit) để xem thông tin liên hệ.
 */

/** cv_storages.scout_status */
export const SCOUT_LISTING_STATUS = {
  OFF: 0,
  LISTED: 1,
  SUSPENDED: 2,
};

export const SCOUT_LISTING_STATUS_LABELS = {
  0: 'Chưa đăng Scout',
  1: 'Đang trên sàn Scout',
  2: 'Tạm gỡ Scout',
};

/** business_scout_performance_requests.status */
export const SCOUT_PERFORMANCE_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const SCOUT_PERFORMANCE_REQUEST_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

/** business_scout_unlocks.unlock_type / business_saved_candidates.source */
export const SCOUT_UNLOCK_TYPES = {
  SCOUT_CREDIT: 'scout_credit',
  SCOUT_PERFORMANCE: 'scout_performance',
};

/** business_credit_histories.reference_type khi trừ credit mở khóa */
export const SCOUT_CREDIT_REFERENCE_TYPE = 'scout_unlock';

/** Mặc định — đồng bộ scout_settings.scout_credit_cost */
export const DEFAULT_SCOUT_CREDIT_COST = 5;

/** scout_listing_logs.action */
export const SCOUT_LISTING_ACTIONS = {
  LIST: 'list',
  UNLIST: 'unlist',
  SUSPEND: 'suspend',
};

/** business_saved_candidates.pipeline_status */
export const BUSINESS_CANDIDATE_PIPELINE = {
  NEW: 'new',
  PROCESSING: 'processing',
  INTERVIEW: 'interview',
  HIRED: 'hired',
  REJECTED: 'rejected',
  CONTACT: 'contact',
};

export const BUSINESS_CANDIDATE_PIPELINE_LABELS = {
  [BUSINESS_CANDIDATE_PIPELINE.NEW]: 'Mới',
  [BUSINESS_CANDIDATE_PIPELINE.PROCESSING]: 'Đang xử lý',
  [BUSINESS_CANDIDATE_PIPELINE.INTERVIEW]: 'Phỏng vấn',
  [BUSINESS_CANDIDATE_PIPELINE.HIRED]: 'Đã tuyển',
  [BUSINESS_CANDIDATE_PIPELINE.REJECTED]: 'Không phù hợp',
  [BUSINESS_CANDIDATE_PIPELINE.CONTACT]: 'Liên hệ',
};

export function getBusinessCandidatePipelineLabel(status) {
  const key = String(status || '').trim();
  return BUSINESS_CANDIDATE_PIPELINE_LABELS[key] || key || '—';
}

export const BUSINESS_CANDIDATE_PIPELINE_VALUES = Object.values(BUSINESS_CANDIDATE_PIPELINE);

/**
 * CV có thể đưa lên Scout không (ngoài scout_status).
 * @param {object} cv — cv_storages row
 */
export function canCvBeListedOnScout(cv) {
  if (!cv) return false;
  const status = Number(cv.status);
  if (status !== 1) return false;
  if (cv.isDuplicate) return false;
  if (cv.duplicateWithCvId != null && !cv.isDuplicate) return false;
  return true;
}

/**
 * Field hiển thị công khai trên sàn (ẩn danh) — không gồm email, phone, địa chỉ chi tiết.
 */
export const SCOUT_PUBLIC_CV_FIELDS = [
  'code',
  'desiredPosition',
  'desiredWorkLocation',
  'desiredIncome',
  'experienceYears',
  'jlptLevel',
  'jpConversationLevel',
  'enConversationLevel',
  'technicalSkills',
  'careerSummary',
  'strengths',
  'motivation',
  'educations',
  'workExperiences',
  'certificates',
  'learnedTools',
  'experienceTools',
  'scoutPublicSummary',
  'jobCategoryId',
];

/** Liên hệ trực tiếp — ẩn với Scout Performance (WS điều phối) */
export const SCOUT_CONTACT_CV_FIELDS = ['email', 'phone'];

/** Field chỉ hiện sau khi doanh nghiệp mở khóa Scout Credit */
export const SCOUT_PRIVATE_CV_FIELDS = [
  'name',
  'furigana',
  'email',
  'phone',
  'birthDate',
  'gender',
  'addressOrigin',
  'addressCurrent',
  'postalCode',
  'passport',
  'currentResidence',
  'jpResidenceStatus',
  'visaExpirationDate',
  'otherCountry',
  'currentIncome',
  'spouse',
  'curriculumVitae',
  'cvOriginalPath',
  'cvCareerHistoryPath',
  'avatarPhotoPath',
];

/** Private fields cho Scout Performance — có profile, không email/SĐT */
export const SCOUT_PERFORMANCE_PRIVATE_CV_FIELDS = SCOUT_PRIVATE_CV_FIELDS.filter(
  (f) => !SCOUT_CONTACT_CV_FIELDS.includes(f),
);

/** Scout Performance — DN phản hồi CTA */
export const SCOUT_PERFORMANCE_EXPLORE_STATUS = {
  INTERESTED: 'interested',
  DECLINED: 'declined',
};

/** Nguồn gợi ý ứng viên */
export const SCOUT_PERFORMANCE_RECOMMENDATION_SOURCES = {
  SCOUT: 'scout',
  CTV: 'ctv',
  SYSTEM: 'system',
};

/** Học vấn, kinh nghiệm, chứng chỉ — chỉ hiện sau khi mở khóa (ẩn khi chưa mở) */
export const SCOUT_UNLOCKED_PROFILE_FIELDS = [
  'educations',
  'workExperiences',
  'certificates',
  'learnedTools',
  'experienceTools',
  'careerSummary',
  'strengths',
  'motivation',
  'otherConversationLevel',
  'specialization',
  'qualification',
];
