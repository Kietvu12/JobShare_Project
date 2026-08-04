import {
  EXPERIENCE_YEARS_OPTIONS,
  JAPANESE_LEVEL_FILTER_OPTIONS,
} from './requirementPresetOptions';
import { candidateMatchesWorkLocationFilter } from './workLocationFilter.js';

export { EXPERIENCE_YEARS_OPTIONS, JAPANESE_LEVEL_FILTER_OPTIONS };

/** Tư cách lưu trú — đồng bộ nhãn hiển thị Scout. */
export const SCOUT_VISA_FILTER_OPTIONS = [
  { value: '3', label: 'Visa du học' },
  { value: '1', label: 'Visa kỹ sư / tri thức nhân văn / nghiệp vụ quốc tế' },
  { value: '2', label: 'Visa kỹ năng đặc định' },
  { value: '9', label: 'Visa kỹ năng (lao động tay nghề)' },
  { value: '8', label: 'Visa lao động trình độ cao' },
  { value: '12', label: 'Visa chuyển công tác nội bộ' },
  { value: '13', label: 'Visa biểu diễn / giải trí' },
  { value: '14', label: 'Visa thực tập sinh kỹ năng' },
  { value: '10', label: 'Visa gia đình (phụ thuộc)' },
  { value: '5', label: 'Visa vợ/chồng người Nhật' },
  { value: '15', label: 'Visa vợ/chồng của người vĩnh trú' },
  { value: '6', label: 'Visa cư trú dài hạn' },
  { value: '4', label: 'Visa vĩnh trú' },
  { value: '11', label: 'Visa ngắn hạn' },
  { value: '7', label: 'Không yêu cầu' },
];

export function getLocalizedOptionLabel(opt, language = 'vi') {
  if (!opt) return '';
  if (language === 'en') return opt.en || opt.label || opt.vi;
  if (language === 'ja') return opt.jp || opt.label || opt.vi;
  return opt.vi || opt.label || '';
}

const JLPT_MIN_LEVEL = {
  N1_up: 1,
  N2_up: 2,
  N3_up: 3,
  N4_up: 4,
  N5_up: 5,
};

export function passesJapaneseLevelFilter(jlptLevel, filterValue) {
  if (!filterValue || filterValue === 'none') return true;
  const maxLevel = JLPT_MIN_LEVEL[filterValue];
  if (!maxLevel) return true;
  const level = Number(jlptLevel);
  if (!Number.isFinite(level) || level < 1) return false;
  return level <= maxLevel;
}

export function passesExperienceYearsFilter(experienceYears, filterValue) {
  if (!filterValue || filterValue === 'none') return true;
  const n = Number(experienceYears);
  const exp = Number.isFinite(n) && n >= 0 ? n : 0;
  if (filterValue === 'under1') return exp < 1;
  const minYears = Number(filterValue);
  if (Number.isFinite(minYears)) return exp >= minYears;
  return true;
}

export function passesScoutCandidateFilters(candidate, filters) {
  if (!candidateMatchesWorkLocationFilter(candidate, filters.locations)) return false;
  if (filters.jobCategoryId) {
    const catId = String(candidate.jobCategoryId ?? candidate.jobCategory?.id ?? '');
    if (catId !== String(filters.jobCategoryId)) return false;
  }
  if (!passesExperienceYearsFilter(candidate.experienceYears, filters.experience)) return false;
  if (!passesJapaneseLevelFilter(candidate.jlptLevel, filters.japaneseLevel)) return false;
  if (filters.visa && String(candidate.jpResidenceStatus ?? '') !== filters.visa) return false;
  const income = Number(candidate.desiredIncome);
  if (filters.salaryMin !== '' && filters.salaryMin != null && !Number.isNaN(Number(filters.salaryMin))) {
    if (!Number.isFinite(income) || income < Number(filters.salaryMin)) return false;
  }
  if (filters.salaryMax !== '' && filters.salaryMax != null && !Number.isNaN(Number(filters.salaryMax))) {
    if (!Number.isFinite(income) || income > Number(filters.salaryMax)) return false;
  }
  return true;
}

export function getDefaultScoutFilters() {
  return {
    locations: [],
    jobCategoryId: '',
    jobCategoryLabel: '',
    experience: '',
    japaneseLevel: '',
    visa: '',
    salaryMin: '',
    salaryMax: '',
  };
}

export function hasActiveScoutFilters(filters) {
  if (!filters) return false;
  if (Array.isArray(filters.locations) && filters.locations.length > 0) return true;
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'locations') return false;
    return value !== '' && value != null;
  });
}
