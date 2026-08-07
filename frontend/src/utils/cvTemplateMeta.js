/** @typedef {'common' | 'cv_it' | 'cv_technical'} CvTemplateId */

export const CV_TEMPLATE_IDS = ['common', 'cv_it', 'cv_technical'];

export const CV_TEMPLATE_OPTIONS = [
  {
    id: 'common',
    labelVi: 'Template chung',
    labelEn: 'Standard template',
    labelJa: '共通テンプレート',
    gradient: 'from-slate-50 to-sky-50',
    border: 'border-sky-200',
    cardHover: 'hover:border-sky-400 hover:ring-2 hover:ring-sky-300/70',
  },
  {
    id: 'cv_it',
    labelVi: 'Template IT',
    labelEn: 'IT template',
    labelJa: 'ITテンプレート',
    gradient: 'from-violet-50 to-indigo-50',
    border: 'border-violet-200',
    cardHover: 'hover:border-violet-400 hover:ring-2 hover:ring-violet-300/70',
  },
  {
    id: 'cv_technical',
    labelVi: 'Template Kỹ thuật',
    labelEn: 'Technical template',
    labelJa: '技術テンプレート',
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    cardHover: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-300/70',
  },
];

export function isCvTemplateId(value) {
  return CV_TEMPLATE_IDS.includes(value);
}

export function getCvTemplateLabel(templateId, language = 'vi') {
  const opt = CV_TEMPLATE_OPTIONS.find((o) => o.id === templateId);
  if (!opt) return templateId || '';
  if (language === 'en') return opt.labelEn;
  if (language === 'ja') return opt.labelJa;
  return opt.labelVi;
}

export function getCvTabLabel(templateId, part, language = 'vi') {
  const base = getCvTemplateLabel(templateId, language);
  const suffix =
    part === 'shokumu'
      ? language === 'en'
        ? 'Shokumu'
        : language === 'ja'
          ? '職務経歴書'
          : 'Shokumu'
      : language === 'en'
        ? 'CV'
        : language === 'ja'
          ? '履歴書'
          : 'CV';
  return `${base} - ${suffix}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} cvTableLayout
 * @returns {{ primary: CvTemplateId, active: CvTemplateId[] }}
 */
export function readCvTemplateMeta(cvTableLayout) {
  const layout = cvTableLayout && typeof cvTableLayout === 'object' ? cvTableLayout : {};
  const meta = layout.cvTemplateMeta && typeof layout.cvTemplateMeta === 'object'
    ? layout.cvTemplateMeta
    : {};
  const primary = isCvTemplateId(meta.primary) ? meta.primary : 'common';
  const activeRaw = Array.isArray(meta.active) ? meta.active.filter(isCvTemplateId) : [];
  const active = activeRaw.length ? activeRaw : [primary];
  if (!active.includes(primary)) active.unshift(primary);
  return { primary, active: [...new Set(active)] };
}

/**
 * @param {Record<string, unknown> | null | undefined} cvTableLayout
 * @param {{ primary?: CvTemplateId, active?: CvTemplateId[] }} patch
 */
export function mergeCvTemplateMeta(cvTableLayout, patch) {
  const layout = { ...(cvTableLayout && typeof cvTableLayout === 'object' ? cvTableLayout : {}) };
  const current = readCvTemplateMeta(layout);
  const primary = isCvTemplateId(patch.primary) ? patch.primary : current.primary;
  const activeInput = Array.isArray(patch.active) ? patch.active.filter(isCvTemplateId) : current.active;
  const active = activeInput.length ? [...new Set(activeInput)] : [primary];
  if (!active.includes(primary)) active.unshift(primary);
  layout.cvTemplateMeta = { primary, active };
  return layout;
}

export function hasShokumuSourceData({ formData, cvFiles, existingOriginals }) {
  const hasShokumuFile =
    (Array.isArray(cvFiles) && cvFiles.length > 1)
    || (Array.isArray(existingOriginals) && existingOriginals.some((item) => {
      const role = String(item?.role || item?.document || '').toLowerCase();
      return role.includes('shokumu') || role.includes('career');
    }));
  const workExperiences = Array.isArray(formData?.workExperiences) ? formData.workExperiences : [];
  const hasWorkContent = workExperiences.some((item) => {
    const company = String(item?.company || item?.companyName || '').trim();
    const desc = String(item?.description || item?.jobDescription || '').trim();
    const projects = Array.isArray(item?.projects) ? item.projects : [];
    return company || desc || projects.some((p) => String(p?.description || p?.name || '').trim());
  });
  const hasCareerSummary = Boolean(String(formData?.careerSummary || '').trim());
  const hasStrengths = Boolean(String(formData?.strengths || '').trim());
  return hasShokumuFile || hasWorkContent || hasCareerSummary || hasStrengths;
}

export const SHOKUMU_EMPTY_WARNING_VI =
  'Nội dung tạm thời đang trống. Vui lòng cập nhật thêm file Shokumu tại tab "Upload hồ sơ" và phân tích bằng AI để hoàn thiện';

export const SHOKUMU_EMPTY_WARNING_EN =
  'Content is temporarily empty. Please upload a Shokumu file in the "Upload profile" tab and parse with AI to complete it.';

export const SHOKUMU_EMPTY_WARNING_JA =
  '内容が一時的に空です。「プロフィールアップロード」タブで職務経歴書を追加し、AI解析で完成させてください。';

export function getShokumuEmptyWarning(language = 'vi') {
  if (language === 'en') return SHOKUMU_EMPTY_WARNING_EN;
  if (language === 'ja') return SHOKUMU_EMPTY_WARNING_JA;
  return SHOKUMU_EMPTY_WARNING_VI;
}

/** Dữ liệu tối thiểu cho API preview template — tab `all` = 履歴書 + 職務経歴書 */
export const CV_TEMPLATE_PREVIEW_MIN = {
  nameKanji: '\u3000',
  nameKana: '\u3000',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  age: '',
  gender: '',
  postalCode: '',
  educations: [],
  workExperiences: [],
  certificates: [],
  careerSummary: '',
  strengths: '',
  motivation: '',
  hobbiesSpecialSkills: '',
  cvDocumentDate: '',
  jlptLevel: '',
  technicalSkills: '',
  currentSalary: '',
  desiredSalary: '',
  desiredLocation: '',
  desiredPosition: '',
  desiredStartDate: '',
};
