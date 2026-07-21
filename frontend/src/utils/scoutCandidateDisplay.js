import {
  formatEducationPeriodJa,
  formatProjectPeriodJa,
  formatWorkExperiencePeriodJa,
} from './cvJapanesePeriod.js';

const RESIDENCE_STATUS_LABELS = {
  '1': '技術・人文知識・国際業務',
  '2': '特定技能',
  '3': '留学',
  '4': '永住者',
  '5': '日本人の配偶者等',
  '6': '定住者',
  '7': '不要',
  '8': '高度専門職',
  '9': '技能',
  '10': '家族滞在',
  '11': '短期滞在',
  '12': '企業内転勤',
  '13': '興行',
  '14': '技能実習',
  '15': '永住者の配偶者等',
};

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [trimmed];
    }
  }
  if (typeof value === 'object') return [value];
  return [];
}

function flattenWorkExperienceList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return flattenWorkExperienceList(parsed);
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object') {
    const shokumu = Array.isArray(raw.shokumu_job_history) ? raw.shokumu_job_history : [];
    const rirekisho = Array.isArray(raw.rirekisho_work_history) ? raw.rirekisho_work_history : [];
    if (shokumu.length || rirekisho.length) return [...shokumu, ...rirekisho];
  }
  return [];
}

export function normalizeScoutEducations(raw) {
  const list = toArray(raw);
  return list
    .map((edu) => {
      const content = edu?.content || [edu?.school_name, edu?.major].filter(Boolean).join(' - ') || '—';
      const period = formatEducationPeriodJa(edu);
      return { content, period };
    })
    .filter((edu) => edu.content !== '—' || (edu.period && edu.period !== '—'));
}

export function normalizeScoutWorkExperiences(raw) {
  const list = flattenWorkExperienceList(raw);

  return list
    .map((work) => ({
      companyName: work?.company_name || work?.companyName || '—',
      period: formatWorkExperiencePeriodJa(work),
      description: work?.description || work?.department_role || work?.business_purpose || work?.scale_role || '—',
      projects: Array.isArray(work?.projects)
        ? work.projects.map((project) => ({
            name: project?.project_name || project?.name || '—',
            role: project?.role || project?.project_role || '',
            period: formatProjectPeriodJa(project),
            description: project?.description || project?.responsibilities || '',
            tools: Array.isArray(project?.tools) ? project.tools.filter(Boolean).join(', ') : (project?.tools_tech || ''),
          }))
        : [],
    }))
    .filter((work) => work.companyName !== '—' || (work.period && work.period !== '—') || work.description !== '—' || work.projects.length > 0);
}

export function normalizeScoutCertificates(raw) {
  return toArray(raw)
    .map((item) => {
      if (typeof item === 'string') return { name: item };
      return {
        name: item?.name || item?.certificateName || item?.title || '—',
        year: item?.year || item?.issuedYear || null,
      };
    })
    .filter((c) => c.name && c.name !== '—');
}

export function getScoutResidenceStatusLabel(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  return RESIDENCE_STATUS_LABELS[raw] || raw;
}

export function formatScoutGender(value) {
  const n = Number(value);
  if (n === 1) return 'Nam';
  if (n === 2) return 'Nữ';
  if (n === 3) return 'Khác';
  return value || '—';
}

export function formatScoutYesNo(value) {
  const n = Number(value);
  if (n === 1) return 'Có';
  if (n === 0) return 'Không';
  return value == null || value === '' ? '—' : String(value);
}

export function formatScoutDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return String(value);
  }
}

export function formatScoutIncome(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isFinite(n)) return `${n}万円`;
  return String(value);
}

export const SCOUT_PERFORMANCE_REQUEST_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

export const SCOUT_PIPELINE_LABELS = {
  new: { label: 'Mới', color: '#10b981', bg: '#d1fae5' },
  processing: { label: 'Đang xử lý', color: '#ea580c', bg: '#fed7aa' },
  interview: { label: 'Phỏng vấn', color: '#f59e0b', bg: '#fef3c7' },
  hired: { label: 'Đã tuyển', color: '#059669', bg: '#d1fae5' },
  rejected: { label: 'Không phù hợp', color: '#b45309', bg: '#fef3c7' },
  contact: { label: 'Liên hệ', color: '#4f46e5', bg: '#e0e7ff' },
};

export const SCOUT_UNLOCK_SOURCE_LABELS = {
  scout_credit: { label: 'Scout Credit', color: '#3b82f6' },
  scout_performance: { label: 'Scout Performance', color: '#f59e0b' },
};

export function getScoutPipelineMeta(status) {
  return SCOUT_PIPELINE_LABELS[status] || SCOUT_PIPELINE_LABELS.new;
}

export function getScoutUnlockSourceMeta(unlockType) {
  return SCOUT_UNLOCK_SOURCE_LABELS[unlockType] || SCOUT_UNLOCK_SOURCE_LABELS.scout_credit;
}

export function formatScoutExperienceYears(years) {
  const n = Number(years);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n} năm`;
}

export function getScoutSkillTags(candidate) {
  const raw = candidate?.technicalSkills;
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        // fall through
      }
    }
    return trimmed.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function getScoutDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh';
  if (candidate.name) return candidate.name;
  return candidate.anonymousName || 'Ứng viên ẩn danh';
}

export function getScoutPrSummary(candidate) {
  return candidate?.scoutPublicSummary || candidate?.careerSummary || candidate?.strengths || '';
}

export function formatScoutAgeGender(candidate) {
  const gender = formatScoutGender(candidate?.gender);
  let agePart = '';
  if (candidate?.birthDate) {
    const birth = new Date(candidate.birthDate);
    if (!Number.isNaN(birth.getTime())) {
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age > 0) agePart = `${age} tuổi`;
    }
  }
  return [gender !== '—' ? gender : null, agePart].filter(Boolean).join(', ') || '—';
}
