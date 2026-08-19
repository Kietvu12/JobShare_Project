/** Localized job category label from CV row or nested jobCategory/category object. */
export function getJobCategoryDisplayName(source, lang = 'vi') {
  if (!source) return '';
  const l = lang === 'jp' ? 'ja' : lang;
  const cat = source.jobCategory || source.category || source;

  const vi = String(
    source.jobCategoryName
    || source.job_category_name
    || source.categoryName
    || cat?.name
    || '',
  ).trim();
  const en = String(
    source.jobCategoryNameEn
    || source.job_category_name_en
    || cat?.nameEn
    || cat?.name_en
    || '',
  ).trim();
  const jp = String(
    source.jobCategoryNameJp
    || source.job_category_name_jp
    || cat?.nameJp
    || cat?.name_jp
    || '',
  ).trim();

  if (l === 'en') return en || vi || jp;
  if (l === 'ja') return jp || en || vi;
  return vi || en || jp;
}

/** Common employment-type phrases stored as desiredPosition (VI source text). */
const EMPLOYMENT_TYPE_LABELS = {
  1: {
    vi: 'Nhân viên chính thức',
    en: 'Full-time employee',
    ja: '正社員',
    aliases: ['Chính thức', 'Full-time', '正社員'],
  },
  2: {
    vi: 'Nhân viên hợp đồng',
    en: 'Contract employee',
    ja: '契約社員',
    aliases: ['Hợp đồng', 'Contract', '契約'],
  },
  3: {
    vi: 'Nhân viên phái cử',
    en: 'Dispatch staff',
    ja: '派遣社員',
    aliases: ['Phái cử', 'Dispatch', '派遣'],
  },
  4: {
    vi: 'Nhân viên bán thời gian',
    en: 'Part-time employee',
    ja: 'パート・アルバイト',
    aliases: ['Bán thời gian', 'Part-time', 'パート'],
  },
  5: {
    vi: 'Hợp đồng uỷ thác',
    en: 'Outsourcing contract',
    ja: '業務委託',
    aliases: ['Uỷ thác', 'Outsourced', '委託'],
  },
};

const EMPLOYMENT_TEXT_TO_CODE = (() => {
  const map = new Map();
  Object.entries(EMPLOYMENT_TYPE_LABELS).forEach(([code, row]) => {
    const keys = [row.vi, row.en, row.ja, ...(row.aliases || [])];
    keys.forEach((k) => {
      const norm = String(k || '').trim().toLowerCase();
      if (norm) map.set(norm, Number(code));
    });
  });
  return map;
})();

function resolveLang(lang) {
  if (lang === 'jp') return 'ja';
  if (lang === 'en' || lang === 'ja') return lang;
  return 'vi';
}

/** Localize known employment-type desiredPosition strings; free-text positions pass through. */
export function getLocalizedDesiredPositionText(value, language = 'vi') {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const lang = resolveLang(language);
  const code = EMPLOYMENT_TEXT_TO_CODE.get(text.toLowerCase());
  if (code && EMPLOYMENT_TYPE_LABELS[code]) {
    return EMPLOYMENT_TYPE_LABELS[code][lang] || text;
  }
  return text;
}

/**
 * Primary role line on candidate cards: desiredPosition (localized when known) or job category (nameEn/nameJp).
 */
export function getLocalizedCandidateRole(candidate, language = 'vi') {
  if (!candidate) return '—';
  const lang = resolveLang(language);
  const categoryLocalized = getJobCategoryDisplayName(candidate, lang);
  const categoryVi = String(
    candidate?.jobCategory?.name
    || candidate?.jobCategoryName
    || candidate?.job_category_name
    || '',
  ).trim();
  const desiredRaw = String(candidate?.desiredPosition || '').trim();

  if (desiredRaw) {
    const localizedDesired = getLocalizedDesiredPositionText(desiredRaw, lang);
    if (localizedDesired !== desiredRaw) return localizedDesired;
    if (categoryVi && desiredRaw === categoryVi && categoryLocalized) return categoryLocalized;
    return desiredRaw;
  }

  return categoryLocalized || '—';
}
