import { formatCvYearMonthJa } from './cvJpDateDisplay.js';

/** Đồng bộ logic backend cvTemplateHtml.js — bảng 保有資格・免許等 (IT/Technical). */

export function getJlptDisplay(jlptLevel) {
  const raw = jlptLevel != null ? String(jlptLevel).trim() : '';
  if (!raw) return '';
  return raw.startsWith('N') ? raw : `N${raw}`;
}

export function getFixedCertYearMonth(formData, kind) {
  if (kind === 'jlpt') return formatCvYearMonthJa(formData.jlptAcquiredYear, formData.jlptAcquiredMonth) || '';
  if (kind === 'toeic') return formatCvYearMonthJa(formData.toeicYear, formData.toeicMonth) || '';
  if (kind === 'ielts') return formatCvYearMonthJa(formData.ieltsYear, formData.ieltsMonth) || '';
  if (kind === 'driving') return formatCvYearMonthJa(formData.drivingLicenseYear, formData.drivingLicenseMonth) || '';
  return '';
}

export function hasFixedCertData(formData, kind) {
  const jlptDisplay = getJlptDisplay(formData?.jlptLevel);
  if (kind === 'jlpt') return Boolean(jlptDisplay || getFixedCertYearMonth(formData, 'jlpt'));
  if (kind === 'toeic') return Boolean(String(formData?.toeicScore || '').trim() || getFixedCertYearMonth(formData, 'toeic'));
  if (kind === 'ielts') return Boolean(String(formData?.ieltsScore || '').trim() || getFixedCertYearMonth(formData, 'ielts'));
  if (kind === 'driving') return Boolean(String(formData?.hasDrivingLicense || '').trim() || getFixedCertYearMonth(formData, 'driving'));
  return false;
}

export const FIXED_CERT_KINDS = ['jlpt', 'toeic', 'ielts', 'driving'];

export function getFixedCertVisibleKinds(formData) {
  return FIXED_CERT_KINDS.filter((kind) => hasFixedCertData(formData, kind));
}

export function getFixedCertTitleRowSpan(formData) {
  return getFixedCertVisibleKinds(formData).length + 1;
}

export function isDrivingLicenseYes(value) {
  return value === '1' || value === 'true' || value === '有る';
}

export function isDrivingLicenseNo(value) {
  return value === '0' || value === 'false' || value === '無し';
}

export function formatJlptLevelMark(jlptDisplay, level) {
  return jlptDisplay === level ? `■ ${level}` : `□ ${level}`;
}

export function formatDrivingLicenseMark(value, label) {
  const yes = label === '有る';
  const checked = yes ? isDrivingLicenseYes(value) : isDrivingLicenseNo(value);
  return checked ? `■ ${label}` : `□ ${label}`;
}

export function formatToeicScoreDisplay(score) {
  const s = String(score || '').trim();
  return s ? `TOEIC ${s}点` : 'TOEIC （　　　点）';
}

export function formatIeltsScoreDisplay(score) {
  const s = String(score || '').trim();
  return s ? `IELTS ${s}点` : 'IELTS （　　　点）';
}
