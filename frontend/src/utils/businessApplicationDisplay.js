import {
  getApplicationSourceLabel,
  applicationsI18n,
} from '../i18n/businessApp/applications.js';
import { getLocalizedJobTitle } from '../i18n/businessApp/jdBuilder.js';
import { getDateLocale } from '../i18n/businessApp/jobs.js';
import { formatBusinessRelativeTime } from '../i18n/businessApp/index.js';
import { getJobApplicationStatusLabelByLanguage } from './jobApplicationStatus.js';
import { getBusinessStatusLabel } from './businessApplicationStatusFlow.js';

const NOMINATED_BY_VI_KEYS = {
  'Doanh nghiệp': 'business',
  'WS Admin': 'wsAdmin',
  'Ứng viên tự ứng tuyển': 'selfApplied',
};

export function getNominatedByLabel(value, language = 'vi') {
  if (!value) return '—';
  const copy = applicationsI18n[language]?.nominatedBy || applicationsI18n.vi.nominatedBy;
  const key = NOMINATED_BY_VI_KEYS[value];
  if (key && copy[key]) return copy[key];
  return value;
}

export function formatApplicationDateLocalized(value, language = 'vi') {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(getDateLocale(language));
  } catch {
    return '—';
  }
}

export function formatApplicationDateTimeLocalized(value, language = 'vi') {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(getDateLocale(language), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** Một dòng ngày + giờ (bảng Quản lý ứng viên — tránh wrap giữa giờ và ngày). */
export function formatApplicationInterviewDateLocalized(value, language = 'vi') {
  if (!value) return '—';
  try {
    const d = new Date(value);
    const locale = getDateLocale(language);
    const dateStr = d.toLocaleDateString(locale);
    const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} · ${timeStr}`;
  } catch {
    return '—';
  }
}

export function formatApplicationRelativeTimeLocalized(value, language = 'vi') {
  return formatBusinessRelativeTime(value, language);
}

/**
 * @param {Record<string|number, object>} [jobById]
 */
export function localizeApplication(app, language = 'vi', jobById = {}) {
  if (!app) return app;
  const job = jobById[app.jobId] ?? jobById[String(app.jobId)];
  const jobTitle = job ? getLocalizedJobTitle(job, language) : app.jobTitle;

  return {
    ...app,
    jobTitle,
    statusLabel: getBusinessStatusLabel(app.status, app.sourceType, language),
    sourceLabel: getApplicationSourceLabel(app.sourceType, language),
    nominatedBy: getNominatedByLabel(app.nominatedBy, language),
  };
}

export function localizeApplications(applications, language = 'vi', jobById = {}) {
  return (applications || []).map((app) => localizeApplication(app, language, jobById));
}

export function localizeApplicationStats(stats, language = 'vi') {
  if (!stats) return stats;
  return {
    ...stats,
    bySource: (stats.bySource || []).map((item) => ({
      ...item,
      label: getApplicationSourceLabel(item.sourceType, language),
    })),
  };
}

export function buildJobByIdMap(jobs = []) {
  const map = {};
  jobs.forEach((job) => {
    if (job?.id != null) map[job.id] = job;
  });
  return map;
}

const EXISTING_NOMINATION_COPY = {
  vi: { id: 'Mã đơn', job: 'JD', status: 'Trạng thái' },
  en: { id: 'Application ID', job: 'JD', status: 'Status' },
  ja: { id: '推薦ID', job: 'JD', status: 'ステータス' },
};

/** Mô tả đơn tiến cử đã tồn tại (409) — hiển thị trong alert/modal. */
export function buildExistingNominationNoticeBody(existingApplication, language = 'vi') {
  if (!existingApplication?.id) return '';
  const c = EXISTING_NOMINATION_COPY[language] || EXISTING_NOMINATION_COPY.vi;
  const jobTitle = getLocalizedJobTitle(existingApplication.job, language)
    || existingApplication.job?.title
    || '—';
  const statusLabel = existingApplication.statusLabel
    || getJobApplicationStatusLabelByLanguage(existingApplication.status, language);
  return `${c.id}: #${existingApplication.id}\n${c.job}: ${jobTitle}\n${c.status}: ${statusLabel}`;
}
