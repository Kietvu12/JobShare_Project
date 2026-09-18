/** cv_storages.scout_status — đồng bộ backend/src/constants/scoutCredit.js */
export const SCOUT_LISTING_STATUS = {
  OFF: 0,
  LISTED: 1,
  SUSPENDED: 2,
  RESERVE: 3,
};

export function getScoutStatusValue(candidate) {
  const raw = candidate?.scoutStatus ?? candidate?.scout_status;
  const n = Number(raw);
  return Number.isFinite(n) ? n : SCOUT_LISTING_STATUS.OFF;
}

export function isScoutListed(candidate) {
  return getScoutStatusValue(candidate) === SCOUT_LISTING_STATUS.LISTED;
}

export function canCandidateBeListedOnScout(candidate) {
  if (!candidate) return false;
  const status = Number(candidate.status);
  if (status !== 1) return false;
  if (candidate.isDuplicate) return false;
  if (candidate.duplicateWithCvId != null && !candidate.isDuplicate) return false;
  return true;
}

export function getScoutStatusLabel(candidate, language = 'vi') {
  const value = getScoutStatusValue(candidate);
  const labels = {
    vi: { 0: 'Chưa Scout', 1: 'Đang Scout', 2: 'Tạm gỡ Scout', 3: 'Scout dự bị' },
    en: { 0: 'Not on Scout', 1: 'On Scout', 2: 'Scout suspended', 3: 'Scout reserve' },
    ja: { 0: 'Scout未掲載', 1: 'Scout掲載中', 2: 'Scout一時停止', 3: 'Scout予備' },
  };
  const map = labels[language] || labels.vi;
  return map[value] ?? map[0];
}

export function getScoutStatusStyle(candidate) {
  const value = getScoutStatusValue(candidate);
  if (value === SCOUT_LISTING_STATUS.LISTED) {
    return { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' };
  }
  if (value === SCOUT_LISTING_STATUS.SUSPENDED) {
    return { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
  }
  if (value === SCOUT_LISTING_STATUS.RESERVE) {
    return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
  }
  return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
}

export function hasScoutPerformanceTag(candidate) {
  const raw = candidate?.scoutPerformanceTaggedAt ?? candidate?.scout_performance_tagged_at;
  if (!raw) return false;
  const d = new Date(raw);
  return !Number.isNaN(d.getTime());
}

export function getScoutPerformanceTagStyle() {
  return { bg: '#fffbeb', color: '#b45309', border: '#fcd34d' };
}

export function getScoutPerformanceTagLabel(language = 'vi') {
  const labels = {
    vi: 'Scout ủy thác',
    en: 'Managed Scout',
    ja: 'Scout委託',
  };
  return labels[language] || labels.vi;
}
