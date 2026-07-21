import { Message } from '../models/index.js';

export const NOMINATION_INTRO_LOCALES = ['vi', 'en', 'ja'];

const DEFAULT_CANDIDATE = {
  vi: 'ứng viên',
  en: 'the candidate',
  ja: '候補者',
};

const buildTemplate = {
  vi: (candidate, jobTitle) => `Cảm ơn bạn đã tiến cử ${candidate} tới job: ${jobTitle}`,
  en: (candidate, jobTitle) => `Thank you for nominating ${candidate} for job: ${jobTitle}`,
  ja: (candidate, jobTitle) => `${candidate} 様を求人「${jobTitle}」にご紹介いただきありがとうございます`,
};

export function getJobTitleForLocale(job, locale) {
  if (!job) return '';
  if (locale === 'en') {
    return String(job.titleEn || job.title_en || job.title || '').trim();
  }
  if (locale === 'ja') {
    return String(job.titleJp || job.title_jp || job.title || '').trim();
  }
  return String(job.title || '').trim();
}

export function buildNominationIntroContent(locale, { candidateName, jobTitle }) {
  const lang = NOMINATION_INTRO_LOCALES.includes(locale) ? locale : 'vi';
  const candidate = String(candidateName || '').trim() || DEFAULT_CANDIDATE[lang];
  const title = String(jobTitle || '').trim() || '—';
  const body = buildTemplate[lang](candidate, title);
  return `[[nomination-intro:${lang}]]${body}`;
}

export function buildNominationIntroMessageRows({
  jobApplicationId,
  adminId = null,
  collaboratorId = null,
  cv = null,
  job = null,
}) {
  const candidateName = String(cv?.name || '').trim();
  return NOMINATION_INTRO_LOCALES.map((locale) => ({
    jobApplicationId,
    adminId,
    collaboratorId,
    senderType: 3,
    content: buildNominationIntroContent(locale, {
      candidateName,
      jobTitle: getJobTitleForLocale(job, locale),
    }),
    isReadByAdmin: true,
    isReadByCollaborator: true,
  }));
}

export async function createNominationIntroMessages(params) {
  const rows = buildNominationIntroMessageRows(params);
  await Message.bulkCreate(rows);
}
