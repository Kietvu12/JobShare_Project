/** Shared rules for “hồ sơ thiếu thông tin để AI matching job” (list, detail, job nominate). */

export const hasCvMatchingFieldValue = (value) => {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  return String(value).trim() !== '';
};

/** CV gốc / template: chỉ cần ≥1 file (CV hoặc Shokumu), không yêu cầu cả hai. */
export const hasCvOriginalFile = (candidate = {}) => {
  if (!candidate || typeof candidate !== 'object') return false;

  if (
    hasCvMatchingFieldValue(candidate.cvFile)
    || hasCvMatchingFieldValue(candidate.originalFilePath)
  ) {
    return true;
  }

  const originalsList = candidate.originals || candidate.cvOriginals || candidate.originalFiles;
  if (Array.isArray(originalsList) && originalsList.length > 0) return true;

  const count = candidate.cvOriginalFileCount ?? candidate.cv_original_file_count;
  if (typeof count === 'number') return count > 0;

  if (candidate.hasCvOriginal === true || candidate.has_cv_original === true) return true;

  const originalPath = String(candidate.cvOriginalPath || candidate.cv_original_path || '').trim();
  if (originalPath) {
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpe?g|png|gif|webp|txt|rtf|odt|ods)$/i.test(originalPath)) {
      return true;
    }
    // Thư mục snapshot CV_original — đã upload ít nhất một file gốc
    return true;
  }

  // Template PDF: chỉ cần rirekisho HOẶC shokumu
  return (
    hasCvMatchingFieldValue(candidate.curriculumVitae)
    || hasCvMatchingFieldValue(candidate.cvCareerHistoryPath)
  );
};

export const getAiMatchingMissingFieldLabel = (fieldKey, lang, t = {}) => {
  const labels = {
    jobCategory: {
      vi: t.jobCategory || 'Ngành nghề',
      en: t.jobCategory || 'Job category',
      ja: t.jobCategory || '職種',
    },
    desiredPosition: {
      vi: t.desiredPosition || 'Vị trí mong muốn',
      en: t.desiredPosition || 'Desired position',
      ja: t.desiredPosition || '希望職種',
    },
    currentSalary: {
      vi: t.currentSalary || 'Lương hiện tại',
      en: t.currentSalary || 'Current salary',
      ja: t.currentSalary || '現在の給与',
    },
    desiredSalary: {
      vi: t.desiredSalary || 'Lương mong muốn',
      en: t.desiredSalary || 'Desired salary',
      ja: t.desiredSalary || '希望給与',
    },
    jpLevel: {
      vi: t.japaneseLevel || 'Trình độ tiếng Nhật',
      en: t.japaneseLevel || 'Japanese proficiency',
      ja: t.japaneseLevel || '日本語レベル',
    },
    experienceYears: {
      vi: t.experienceYears || 'Số năm kinh nghiệm',
      en: t.experienceYears || 'Years of experience',
      ja: t.experienceYears || '経験年数',
    },
    residenceStatus: {
      vi: t.jpResidenceStatus || 'Tư cách lưu trú',
      en: t.jpResidenceStatus || 'Residence status',
      ja: t.jpResidenceStatus || '在留資格',
    },
    cvFile: {
      vi: t.cvFile || 'File CV',
      en: t.cvFile || 'CV file',
      ja: t.cvFile || 'CVファイル',
    },
    name: {
      vi: t.name || 'Họ tên',
      en: t.name || 'Name',
      ja: t.name || '氏名',
    },
  };
  return labels[fieldKey]?.[lang] || labels[fieldKey]?.vi || fieldKey;
};

export const getAiMatchingMissingFields = (candidate = {}) => {
  const hasValue = hasCvMatchingFieldValue;
  return [
    {
      key: 'name',
      missing: !hasValue(candidate.name || candidate.fullName || candidate.nameKanji),
    },
    {
      key: 'jobCategory',
      missing: !hasValue(
        candidate.jobCategoryId
        || candidate.job_category_id
        || candidate.jobCategory?.id
        || candidate.jobCategoryName
        || candidate.job_category_name
        || candidate.categoryName
      ),
    },
    {
      key: 'desiredPosition',
      missing: !hasValue(candidate.desiredPosition || candidate.desired_position),
    },
    {
      key: 'currentSalary',
      missing: !hasValue(candidate.currentSalary || candidate.currentIncome),
    },
    {
      key: 'desiredSalary',
      missing: !hasValue(candidate.desiredSalary || candidate.desiredIncome),
    },
    {
      key: 'jpLevel',
      missing: !hasValue(
        candidate.jpLevel
        || candidate.japaneseLevel
        || candidate.n5Level
        || candidate.languageLevelJp
        || candidate.jlptLevel
      ),
    },
    {
      key: 'experienceYears',
      missing: !hasValue(
        candidate.experienceYears
        ?? candidate.yearsOfExperience
        ?? candidate.experienceYear
        ?? candidate.workExperienceYears
      ),
    },
    {
      key: 'residenceStatus',
      missing: !hasValue(
        candidate.jpResidenceStatus
        || candidate.jp_residence_status
        || candidate.residenceStatus
        || candidate.residence_status
        || candidate.visaStatus
      ),
    },
    {
      key: 'cvFile',
      missing: !hasCvOriginalFile(candidate),
    },
  ].filter((item) => item.missing);
};

export const formatAiMatchingMissingFieldsTooltip = (candidate, { language = 'vi', t = {} } = {}) => {
  const missingFields = getAiMatchingMissingFields(candidate);
  if (!missingFields.length) return '';
  const names = missingFields.map((field) => getAiMatchingMissingFieldLabel(field.key, language, t));
  const prefix = t.candidateMissingInfoTooltip || 'Hồ sơ thiếu thông tin để AI matching job';
  return `${prefix}: ${names.join(', ')}`;
};
