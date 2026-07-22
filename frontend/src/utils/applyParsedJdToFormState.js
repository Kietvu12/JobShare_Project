import { BUSINESS_SECTOR_OPTIONS } from './businessSectorOptions';
import { JOB_HIGHLIGHT_OPTIONS } from './jobHighlightOptions';
import { normalizeJobSalaryCurrency } from './jobSalaryCurrency.js';
import { normalizeNumberOfHiresStored } from './numberOfHiresOptions';

function jdDescriptionToText(desc, lang) {
  if (desc == null) return '';
  if (typeof desc === 'string') return desc;
  if (Array.isArray(desc)) {
    return desc.map((x) => String(x).trim()).filter(Boolean).join('\n');
  }
  if (typeof desc === 'object') {
    let v;
    if (lang === 'vi') v = desc.vi;
    else if (lang === 'en') v = desc.en;
    else v = desc.ja ?? desc.jp;
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join('\n');
    if (v != null && v !== '') return String(v);
    return '';
  }
  return String(desc);
}

function jdLocalizedRequirementRows(obj, reqType, status) {
  if (obj == null) return [];
  if (Array.isArray(obj)) {
    return obj
      .map((t) => {
        if (t == null) return null;
        if (typeof t === 'string' || typeof t === 'number') {
          return { content: String(t), contentEn: '', contentJp: '', type: reqType, status };
        }
        if (typeof t === 'object') {
          return {
            content: String(t.vi ?? t.en ?? '').trim(),
            contentEn: String(t.en ?? '').trim(),
            contentJp: String(t.ja ?? t.jp ?? '').trim(),
            type: reqType,
            status,
          };
        }
        return { content: String(t), contentEn: '', contentJp: '', type: reqType, status };
      })
      .filter((r) => r && (r.content || r.contentEn || r.contentJp));
  }
  if (typeof obj === 'object') {
    const vi = obj.vi;
    const en = obj.en;
    const ja = obj.ja ?? obj.jp;
    const viA = Array.isArray(vi);
    const enA = Array.isArray(en);
    const jaA = Array.isArray(ja);
    if (viA || enA || jaA) {
      const n = Math.max(
        viA ? vi.length : vi != null && vi !== '' ? 1 : 0,
        enA ? en.length : en != null && en !== '' ? 1 : 0,
        jaA ? ja.length : ja != null && ja !== '' ? 1 : 0,
      );
      const rows = [];
      for (let i = 0; i < n; i++) {
        rows.push({
          content: viA ? String(vi[i] ?? '').trim() : i === 0 ? String(vi ?? '').trim() : '',
          contentEn: enA ? String(en[i] ?? '').trim() : i === 0 ? String(en ?? '').trim() : '',
          contentJp: jaA ? String(ja[i] ?? '').trim() : i === 0 ? String(ja ?? '').trim() : '',
          type: reqType,
          status,
        });
      }
      return rows.filter((r) => r.content || r.contentEn || r.contentJp);
    }
    return [
      {
        content: String(vi ?? en ?? '').trim(),
        contentEn: String(en ?? '').trim(),
        contentJp: String(ja ?? '').trim(),
        type: reqType,
        status,
      },
    ].filter((r) => r.content || r.contentEn || r.contentJp);
  }
  return [];
}

function jdLocationEntriesFromRaw(locRaw) {
  if (locRaw == null) return [];
  if (Array.isArray(locRaw)) return locRaw;
  if (typeof locRaw === 'string') return [{ vi: locRaw, en: '', ja: '' }];
  if (typeof locRaw === 'object') {
    const vi = locRaw.vi;
    const en = locRaw.en;
    const ja = locRaw.ja ?? locRaw.jp;
    const viA = Array.isArray(vi);
    const enA = Array.isArray(en);
    const jaA = Array.isArray(ja);
    if (viA || enA || jaA) {
      const n = Math.max(
        viA ? vi.length : vi != null && vi !== '' ? 1 : 0,
        enA ? en.length : en != null && en !== '' ? 1 : 0,
        jaA ? ja.length : ja != null && ja !== '' ? 1 : 0,
      );
      const rows = [];
      for (let i = 0; i < n; i++) {
        rows.push({
          vi: viA ? String(vi[i] ?? '').trim() : i === 0 ? String(vi ?? '').trim() : '',
          en: enA ? String(en[i] ?? '').trim() : i === 0 ? String(en ?? '').trim() : '',
          ja: jaA ? String(ja[i] ?? '').trim() : i === 0 ? String(ja ?? '').trim() : '',
        });
      }
      return rows.filter((r) => r.vi || r.en || r.ja);
    }
    return [
      {
        vi: vi != null ? String(vi).trim() : '',
        en: en != null ? String(en).trim() : '',
        ja: ja != null ? String(ja).trim() : '',
      },
    ].filter((r) => r.vi || r.en || r.ja);
  }
  return [];
}

function formatJdSalaryAmount(val, currency) {
  if (val == null || val === '') return '';
  const cur = currency || 'JPY';
  const raw = String(val).replace(/,/g, '').trim();
  const n = Number(raw);
  if (Number.isFinite(n)) return `${n.toLocaleString('en-US')} ${cur}`.trim();
  return `${String(val).trim()} ${cur}`.trim();
}

function normalizeWorkingLocationField(loc) {
  if (loc == null || loc === '') return '';
  if (typeof loc === 'string') return loc.trim();
  if (typeof loc === 'object') {
    const s = loc.vi ?? loc.en ?? loc.name ?? loc.ja ?? loc.jp;
    return s != null ? String(s).trim() : '';
  }
  return String(loc).trim();
}

function getWorkingLocationsNumberOfHires(locs) {
  const raw =
    (locs || []).find((wl) => wl?.numberOfHires != null && String(wl.numberOfHires).trim() !== '')?.numberOfHires || '';
  return normalizeNumberOfHiresStored(raw);
}

function generateSlug(title) {
  if (!title) return '';
  return String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function localizedTextRow(value, isViTab, isEnTab) {
  const text = value == null ? '' : String(value).trim();
  if (!text) return null;
  if (isViTab) return { content: text, contentEn: '', contentJp: '' };
  if (isEnTab) return { content: '', contentEn: text, contentJp: '' };
  return { content: '', contentEn: '', contentJp: text };
}

function localizedRows(value, reqType, status, isViTab, isEnTab) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return null;
        if (typeof item === 'object') {
          return {
            content: String(item.vi ?? '').trim(),
            contentEn: String(item.en ?? '').trim(),
            contentJp: String(item.ja ?? item.jp ?? '').trim(),
            type: reqType,
            status,
          };
        }
        const text = String(item).trim();
        if (!text) return null;
        if (isViTab) return { content: text, contentEn: '', contentJp: '', type: reqType, status };
        if (isEnTab) return { content: '', contentEn: text, contentJp: '', type: reqType, status };
        return { content: '', contentEn: '', contentJp: text, type: reqType, status };
      })
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return jdLocalizedRequirementRows(value, reqType, status);
  }
  const row = localizedTextRow(value, isViTab, isEnTab);
  return row ? [{ ...row, type: reqType, status }] : [];
}

export function normalizeJdDraft(draft) {
  if (!draft || typeof draft !== 'object') return {};
  if (draft.jd && typeof draft.jd === 'object' && !Array.isArray(draft.jd)) return draft.jd;
  return draft;
}

export function createEmptyJdFormState() {
  return {
    formData: {
      jobCode: '',
      title: '',
      titleEn: '',
      titleJp: '',
      slug: '',
      description: '',
      descriptionEn: '',
      descriptionJp: '',
      categoryId: '',
      businessSectorKey: '',
      numberOfHires: '',
      numberOfHiresEn: '',
      numberOfHiresJp: '',
      bonus: '',
      bonusEn: '',
      bonusJp: '',
      salaryCurrency: 'JPY',
      salaryReview: '',
      salaryReviewEn: '',
      salaryReviewJp: '',
      socialInsurance: '',
      socialInsuranceEn: '',
      socialInsuranceJp: '',
      transportation: '',
      transportationEn: '',
      transportationJp: '',
      breakTime: '',
      breakTimeEn: '',
      breakTimeJp: '',
      overtime: '',
      overtimeEn: '',
      overtimeJp: '',
      holidays: '',
      holidaysEn: '',
      holidaysJp: '',
      holidayDetails: '',
      holidayDetailsEn: '',
      holidayDetailsJp: '',
      recruitmentType: '',
      residenceStatus: '',
      residenceStatusEn: '',
      residenceStatusJp: '',
      contractPeriod: '',
      contractPeriodEn: '',
      contractPeriodJp: '',
      probationPeriod: '',
      probationPeriodEn: '',
      probationPeriodJp: '',
      probationDetail: '',
      probationDetailEn: '',
      probationDetailJp: '',
      recruitmentProcess: '',
      recruitmentProcessEn: '',
      recruitmentProcessJp: '',
      transferAbility: '',
      transferAbilityEn: '',
      transferAbilityJp: '',
      highlights: '',
    },
    recruitingCompany: {
      companyName: '',
      companyNameEn: '',
      companyNameJp: '',
      revenue: '',
      revenueEn: '',
      revenueJp: '',
      numberOfEmployees: '',
      numberOfEmployeesEn: '',
      numberOfEmployeesJp: '',
      headquarters: '',
      headquartersEn: '',
      headquartersJp: '',
      companyIntroduction: '',
      companyIntroductionEn: '',
      companyIntroductionJp: '',
      investmentCapital: '',
      investmentCapitalEn: '',
      investmentCapitalJp: '',
      establishedDate: '',
      establishedDateEn: '',
      establishedDateJp: '',
    },
    workingLocations: [],
    workingLocationDetails: [],
    salaryRanges: [
      { salaryRange: '', salaryRangeEn: '', salaryRangeJp: '', type: 'yearly' },
      { salaryRange: '', salaryRangeEn: '', salaryRangeJp: '', type: 'monthly' },
    ],
    salaryRangeDetails: [],
    overtimeAllowances: [],
    overtimeAllowanceDetails: [],
    requirements: [],
    workingHours: [],
    workingHourDetails: [],
    jobBenefitRows: [],
    highlightKeys: [],
    languageTab: 'vi',
  };
}

/**
 * Map JSON JD (parse API / JD Builder draft) → state cho JdTemplate & AddJobPage.
 * Logic khớp parseJdFileAndApplyForm trong AddJobPage.
 */
export function applyParsedJdToFormState(j, options = {}) {
  const prevFormData = options.prevFormData || {};
  const prevRecruitingCompany = options.prevRecruitingCompany || {};
  const prevWorkingLocations = options.prevWorkingLocations || [];
  const prevHighlightKeys = options.prevHighlightKeys || [];

  const rawContentLanguage = String(j.content_language || j.contentLanguage || '').toLowerCase();
  const contentLanguage = rawContentLanguage === 'ja'
    ? 'jp'
    : ['vi', 'en', 'jp'].includes(rawContentLanguage)
      ? rawContentLanguage
      : 'vi';
  const isViTab = contentLanguage === 'vi';
  const isEnTab = contentLanguage === 'en';
  const isJpTab = contentLanguage === 'jp';

  const titleValue = String(j.job_title ?? '').trim();
  const businessSectorKey = (() => {
    const raw = j.industry;
    const idx = Number(raw);
    if (Number.isInteger(idx) && idx > 0 && idx <= BUSINESS_SECTOR_OPTIONS.length) {
      return BUSINESS_SECTOR_OPTIONS[idx - 1]?.key || '';
    }
    return raw != null && raw !== '' ? String(raw) : '';
  })();
  const categoryId = j.job_category != null && j.job_category !== '' ? String(j.job_category) : '';
  const visaVi = j.visa_status?.vi ?? j.visa_status ?? '';
  const visaEn = j.visa_status?.en ?? '';
  const visaJp = j.visa_status?.ja ?? j.visa_status?.jp ?? '';
  const employmentType = j.employment_type != null && j.employment_type !== '' ? String(j.employment_type) : '';
  const headcount = j.headcount;
  let numberOfHires = '';
  if (headcount != null && headcount !== '') {
    const n = Number(headcount);
    if (n >= 1 && n <= 5) {
      numberOfHires = n <= 9 ? `0${n}` : String(n);
    } else {
      numberOfHires = String(headcount);
    }
  }

  const descRaw = j.description ?? '';
  const descVi = isViTab ? String(descRaw) : '';
  const descEn = isEnTab ? String(descRaw) : '';
  const descJp = isJpTab ? String(descRaw) : '';

  const mustRows = localizedRows(j.requirements_must, 'technique', 'required', isViTab, isEnTab);
  const prefRows = localizedRows(j.requirements_preferred, 'education', 'preferred', isViTab, isEnTab);

  const salary = j.salary ?? {};
  const bonusDetailsRaw = salary.bonus_details;
  const bonusText = typeof bonusDetailsRaw === 'object' && bonusDetailsRaw !== null && !Array.isArray(bonusDetailsRaw)
    ? [bonusDetailsRaw.vi, bonusDetailsRaw.en, bonusDetailsRaw.ja].filter(Boolean).join('\n')
    : [bonusDetailsRaw].flat().filter(Boolean).join('\n');
  const raiseDetailsRaw = salary.raise_details;
  const raiseText = typeof raiseDetailsRaw === 'object' && raiseDetailsRaw !== null && !Array.isArray(raiseDetailsRaw)
    ? [raiseDetailsRaw.vi, raiseDetailsRaw.en, raiseDetailsRaw.ja].filter(Boolean).join('\n')
    : [raiseDetailsRaw].flat().filter(Boolean).join('\n');
  const currency = normalizeJobSalaryCurrency(salary.currency);
  const yearlySal = salary.yearly_salary ?? salary.yearly ?? salary.yearlySalary;
  const monthlySal = salary.monthly_salary ?? salary.monthly ?? salary.monthlySalary;
  const salaryMin = salary.min_salary ?? salary.min;
  const salaryMax = salary.max_salary ?? salary.max;
  const yStr = formatJdSalaryAmount(yearlySal, currency);
  const mStr = formatJdSalaryAmount(monthlySal, currency);
  let salaryRanges = null;
  const salaryRangeDetails = [];
  if (yStr || mStr) {
    salaryRanges = [
      { salaryRange: yStr || '', salaryRangeEn: yStr || '', salaryRangeJp: yStr || '', type: 'yearly' },
      { salaryRange: mStr || '', salaryRangeEn: mStr || '', salaryRangeJp: mStr || '', type: 'monthly' },
    ];
  } else if (salaryMin != null || salaryMax != null) {
    const rangeLabel = [salaryMin, salaryMax].filter((v) => v != null && v !== '').join(' - ');
    if (rangeLabel) {
      const isYear = (salary.period ?? 'monthly') === 'yearly';
      salaryRanges = isYear
        ? [
            { salaryRange: rangeLabel, salaryRangeEn: rangeLabel, salaryRangeJp: rangeLabel, type: 'yearly' },
            { salaryRange: '', salaryRangeEn: '', salaryRangeJp: '', type: 'monthly' },
          ]
        : [
            { salaryRange: '', salaryRangeEn: '', salaryRangeJp: '', type: 'yearly' },
            { salaryRange: rangeLabel, salaryRangeEn: rangeLabel, salaryRangeJp: rangeLabel, type: 'monthly' },
          ];
    }
  }
  const sd = salary.salary_details;
  if (sd != null && (typeof sd === 'object' || Array.isArray(sd))) {
    salaryRangeDetails.push({
      content: jdDescriptionToText(sd, 'vi'),
      contentEn: jdDescriptionToText(sd, 'en'),
      contentJp: jdDescriptionToText(sd, 'jp'),
    });
  }

  const locEntries = jdLocationEntriesFromRaw(j.location);
  const preservedNumberOfHires = getWorkingLocationsNumberOfHires(prevWorkingLocations);
  const chosenNumberOfHires =
    normalizeNumberOfHiresStored(prevFormData.numberOfHires || '') ||
    normalizeNumberOfHiresStored(numberOfHires || '') ||
    preservedNumberOfHires ||
    '';
  const workingLocations =
    locEntries.length > 0
      ? locEntries.map((row) => ({
          location:
            normalizeWorkingLocationField(row.vi) ||
            normalizeWorkingLocationField(row.en) ||
            normalizeWorkingLocationField(row.ja) ||
            '',
          country: 'Japan',
          numberOfHires: chosenNumberOfHires,
        }))
      : chosenNumberOfHires
        ? [{ location: '', country: 'Japan', numberOfHires: chosenNumberOfHires }]
        : [];
  const workingLocationDetails =
    locEntries.length > 0
      ? locEntries.map((row) => ({
          content: row.vi != null ? String(row.vi).trim() : '',
          contentEn: row.en != null ? String(row.en).trim() : '',
          contentJp: row.ja != null ? String(row.ja).trim() : '',
        }))
      : workingLocations.map(() => ({ content: '', contentEn: '', contentJp: '' }));

  const requirements = [...mustRows, ...prefRows];
  if (j.experience_job || j.experience_industry) {
    requirements.unshift({
      content: [j.experience_job, j.experience_industry].filter(Boolean).join(' '),
      contentEn: '',
      contentJp: '',
      type: 'experience',
      status: 'required',
    });
  }

  const featuresVi = Array.isArray(j.features?.vi) ? j.features.vi : Array.isArray(j.features) ? j.features : j.features ? [j.features] : [];
  const featuresEn = Array.isArray(j.features?.en) ? j.features.en : [];
  const featuresJp = Array.isArray(j.features?.ja) ? j.features.ja : Array.isArray(j.features?.jp) ? j.features.jp : [];
  const highlightKeys = [];
  for (const opt of JOB_HIGHLIGHT_OPTIONS) {
    const matchVi = featuresVi.some((f) => String(f).includes(opt.vi));
    const matchEn = featuresEn.some((f) => String(f).includes(opt.en));
    const matchJp = featuresJp.some((f) => String(f).includes(opt.jp));
    if (matchVi || matchEn || matchJp) highlightKeys.push(opt.key);
  }

  const company = j.company ?? {};
  const benefitsList = Array.isArray(j.benefits) ? j.benefits : [];
  const jobBenefitRows = benefitsList.map((b, index) => {
    const text = typeof b === 'string' ? String(b).trim() : String(b?.content ?? b?.content_vi ?? b?.contentVi ?? '').trim();
    const item = { id: b?.id ?? index, content: '', contentEn: '', contentJp: '' };
    if (isEnTab) item.contentEn = text;
    else if (isJpTab) item.contentJp = text;
    else item.content = text;
    return item;
  });

  const holidaysObj = j.holidays;
  const holidaysVi = isViTab ? String(holidaysObj ?? '') : '';
  const holidaysEn = isEnTab ? String(holidaysObj ?? '') : '';
  const holidaysJp = isJpTab ? String(holidaysObj ?? '') : '';
  const holidayDetailsRaw = j.holiday_detail ?? j.holiday_details ?? j.holidays_details;
  const probationObj = j.probation;
  const recruitmentProcessRaw = j.recruitment_process;
  const socialInsuranceRaw = j.social_insurance;
  const transportationRaw = j.transportation;
  const breakTimeRaw = j.rest_time;
  const overtimeRaw = j.overtime_details;
  const contractPeriodRaw = j.contract_period;

  const formData = {
    ...prevFormData,
    jobCode: (j.job_code ?? prevFormData.jobCode) || '',
    title: isViTab ? titleValue || prevFormData.title : prevFormData.title,
    titleEn: isEnTab ? titleValue || prevFormData.titleEn : prevFormData.titleEn,
    titleJp: isJpTab ? titleValue || prevFormData.titleJp : prevFormData.titleJp,
    slug: isViTab && titleValue ? generateSlug(titleValue) : prevFormData.slug,
    description: isViTab ? descVi || prevFormData.description : prevFormData.description,
    descriptionEn: isEnTab ? descEn || prevFormData.descriptionEn : prevFormData.descriptionEn,
    descriptionJp: isJpTab ? descJp || prevFormData.descriptionJp : prevFormData.descriptionJp,
    businessSectorKey: businessSectorKey || prevFormData.businessSectorKey,
    categoryId: categoryId || prevFormData.categoryId,
    recruitmentType: employmentType || prevFormData.recruitmentType,
    numberOfHires: isViTab ? chosenNumberOfHires || prevFormData.numberOfHires : prevFormData.numberOfHires,
    numberOfHiresEn: isEnTab ? chosenNumberOfHires || prevFormData.numberOfHiresEn : prevFormData.numberOfHiresEn,
    numberOfHiresJp: isJpTab ? chosenNumberOfHires || prevFormData.numberOfHiresJp : prevFormData.numberOfHiresJp,
    residenceStatus: isViTab ? String(visaVi || prevFormData.residenceStatus || '') : prevFormData.residenceStatus,
    residenceStatusEn: isEnTab ? String(visaEn || prevFormData.residenceStatusEn || '') : prevFormData.residenceStatusEn,
    residenceStatusJp: isJpTab ? String(visaJp || prevFormData.residenceStatusJp || '') : prevFormData.residenceStatusJp,
    bonus: isViTab ? bonusText || prevFormData.bonus : prevFormData.bonus,
    bonusEn: isEnTab ? bonusText || prevFormData.bonusEn : prevFormData.bonusEn,
    bonusJp: isJpTab ? bonusText || prevFormData.bonusJp : prevFormData.bonusJp,
    salaryCurrency: currency || prevFormData.salaryCurrency || 'JPY',
    salaryReview: isViTab ? raiseText || prevFormData.salaryReview : prevFormData.salaryReview,
    salaryReviewEn: isEnTab ? raiseText || prevFormData.salaryReviewEn : prevFormData.salaryReviewEn,
    salaryReviewJp: isJpTab ? raiseText || prevFormData.salaryReviewJp : prevFormData.salaryReviewJp,
    socialInsurance: isViTab ? String(socialInsuranceRaw ?? prevFormData.socialInsurance ?? '') : prevFormData.socialInsurance,
    socialInsuranceEn: isEnTab ? String(socialInsuranceRaw ?? prevFormData.socialInsuranceEn ?? '') : prevFormData.socialInsuranceEn,
    socialInsuranceJp: isJpTab ? String(socialInsuranceRaw ?? prevFormData.socialInsuranceJp ?? '') : prevFormData.socialInsuranceJp,
    transportation: isViTab ? String(transportationRaw ?? prevFormData.transportation ?? '') : prevFormData.transportation,
    transportationEn: isEnTab ? String(transportationRaw ?? prevFormData.transportationEn ?? '') : prevFormData.transportationEn,
    transportationJp: isJpTab ? String(transportationRaw ?? prevFormData.transportationJp ?? '') : prevFormData.transportationJp,
    breakTime: isViTab ? String(breakTimeRaw ?? prevFormData.breakTime ?? '') : prevFormData.breakTime,
    breakTimeEn: isEnTab ? String(breakTimeRaw ?? prevFormData.breakTimeEn ?? '') : prevFormData.breakTimeEn,
    breakTimeJp: isJpTab ? String(breakTimeRaw ?? prevFormData.breakTimeJp ?? '') : prevFormData.breakTimeJp,
    overtime: isViTab ? String(overtimeRaw ?? prevFormData.overtime ?? '') : prevFormData.overtime,
    overtimeEn: isEnTab ? String(overtimeRaw ?? prevFormData.overtimeEn ?? '') : prevFormData.overtimeEn,
    overtimeJp: isJpTab ? String(overtimeRaw ?? prevFormData.overtimeJp ?? '') : prevFormData.overtimeJp,
    contractPeriod: isViTab ? String(contractPeriodRaw ?? prevFormData.contractPeriod ?? '') : prevFormData.contractPeriod,
    contractPeriodEn: isEnTab ? String(contractPeriodRaw ?? prevFormData.contractPeriodEn ?? '') : prevFormData.contractPeriodEn,
    contractPeriodJp: isJpTab ? String(contractPeriodRaw ?? prevFormData.contractPeriodJp ?? '') : prevFormData.contractPeriodJp,
    holidays: isViTab ? holidaysVi || prevFormData.holidays : prevFormData.holidays,
    holidaysEn: isEnTab ? holidaysEn || prevFormData.holidaysEn : prevFormData.holidaysEn,
    holidaysJp: isJpTab ? holidaysJp || prevFormData.holidaysJp : prevFormData.holidaysJp,
    holidayDetails: isViTab ? String(holidayDetailsRaw ?? prevFormData.holidayDetails ?? '').trim() : prevFormData.holidayDetails,
    holidayDetailsEn: isEnTab ? String(holidayDetailsRaw ?? prevFormData.holidayDetailsEn ?? '').trim() : prevFormData.holidayDetailsEn,
    holidayDetailsJp: isJpTab ? String(holidayDetailsRaw ?? prevFormData.holidayDetailsJp ?? '').trim() : prevFormData.holidayDetailsJp,
    probationPeriod: isViTab ? String(probationObj ?? prevFormData.probationPeriod ?? '') : prevFormData.probationPeriod,
    probationPeriodEn: isEnTab ? String(probationObj ?? prevFormData.probationPeriodEn ?? '') : prevFormData.probationPeriodEn,
    probationPeriodJp: isJpTab ? String(probationObj ?? prevFormData.probationPeriodJp ?? '') : prevFormData.probationPeriodJp,
    probationDetail: isViTab ? String(j.probation_detail ?? probationObj ?? prevFormData.probationDetail ?? '') : prevFormData.probationDetail,
    probationDetailEn: isEnTab ? String(j.probation_detail ?? probationObj ?? prevFormData.probationDetailEn ?? '') : prevFormData.probationDetailEn,
    probationDetailJp: isJpTab ? String(j.probation_detail ?? probationObj ?? prevFormData.probationDetailJp ?? '') : prevFormData.probationDetailJp,
    recruitmentProcess: isViTab ? String(recruitmentProcessRaw ?? prevFormData.recruitmentProcess ?? '') : prevFormData.recruitmentProcess,
    recruitmentProcessEn: isEnTab ? String(recruitmentProcessRaw ?? prevFormData.recruitmentProcessEn ?? '') : prevFormData.recruitmentProcessEn,
    recruitmentProcessJp: isJpTab ? String(recruitmentProcessRaw ?? prevFormData.recruitmentProcessJp ?? '') : prevFormData.recruitmentProcessJp,
    highlights: highlightKeys.length ? JSON.stringify(highlightKeys) : prevFormData.highlights,
  };

  let workingHours = [];
  let workingHourDetails = [];
  const whRaw = j.working_hours;
  if (whRaw) {
    const whList = Array.isArray(whRaw) ? whRaw : [whRaw];
    workingHours = whList.map((w) => {
      if (w == null) return { workingHours: '' };
      if (typeof w === 'string' || typeof w === 'number') return { workingHours: String(w).trim() };
      if (typeof w === 'object') {
        return { workingHours: String(w.vi ?? w.en ?? w.text ?? '').trim() };
      }
      return { workingHours: String(w).trim() };
    });
    workingHourDetails = whList.map((w) => {
      if (w == null) return { content: '', contentEn: '', contentJp: '' };
      if (typeof w === 'string' || typeof w === 'number') {
        const s = String(w).trim();
        return { content: s, contentEn: s, contentJp: s };
      }
      if (typeof w === 'object') {
        return {
          content: String(w.vi ?? '').trim(),
          contentEn: String(w.en ?? '').trim(),
          contentJp: String(w.ja ?? w.jp ?? '').trim(),
        };
      }
      const s = String(w).trim();
      return { content: s, contentEn: s, contentJp: s };
    });
  }

  let overtimeAllowances = [];
  let overtimeAllowanceDetails = [];
  if (overtimeRaw) {
    const otList = Array.isArray(overtimeRaw) ? overtimeRaw : [overtimeRaw];
    overtimeAllowances = otList.map((o) => ({
      overtimeAllowanceRange: typeof o === 'string' ? o : (o?.vi ?? o?.en ?? o?.text ?? ''),
    }));
    overtimeAllowanceDetails = otList.map((o) => {
      if (typeof o === 'object' && o != null) {
        return { content: String(o.vi ?? o.en ?? ''), contentEn: String(o.en ?? ''), contentJp: String(o.ja ?? o.jp ?? '') };
      }
      return { content: String(o ?? ''), contentEn: '', contentJp: '' };
    });
  }

  const overviewObj = company.overview ?? company.introduction;
  const headquarterObj = company.headquarter ?? company.headquarters;
  const companyNameRaw = String(company.name ?? '').trim();
  const companyNameEnRaw = String(company.nameEn ?? company.name_en ?? '').trim();
  const companyNameJpRaw = String(company.nameJp ?? company.name_jp ?? '').trim();
  const companyIntroRaw = String(overviewObj ?? '').trim();
  const headquarterRaw = String(headquarterObj ?? '').trim();

  const recruitingCompany = {
    ...prevRecruitingCompany,
    companyName: isViTab ? companyNameRaw || prevRecruitingCompany.companyName || '' : prevRecruitingCompany.companyName,
    companyNameEn: isEnTab ? companyNameRaw || companyNameEnRaw || prevRecruitingCompany.companyNameEn || '' : prevRecruitingCompany.companyNameEn,
    companyNameJp: isJpTab ? companyNameRaw || companyNameJpRaw || prevRecruitingCompany.companyNameJp || '' : prevRecruitingCompany.companyNameJp,
    companyIntroduction: isViTab ? companyIntroRaw || prevRecruitingCompany.companyIntroduction || '' : prevRecruitingCompany.companyIntroduction,
    companyIntroductionEn: isEnTab ? companyIntroRaw || prevRecruitingCompany.companyIntroductionEn || '' : prevRecruitingCompany.companyIntroductionEn,
    companyIntroductionJp: isJpTab ? companyIntroRaw || prevRecruitingCompany.companyIntroductionJp || '' : prevRecruitingCompany.companyIntroductionJp,
    headquarters: isViTab ? headquarterRaw || prevRecruitingCompany.headquarters || '' : prevRecruitingCompany.headquarters,
    headquartersEn: isEnTab ? headquarterRaw || prevRecruitingCompany.headquartersEn || '' : prevRecruitingCompany.headquartersEn,
    headquartersJp: isJpTab ? headquarterRaw || prevRecruitingCompany.headquartersJp || '' : prevRecruitingCompany.headquartersJp,
    numberOfEmployees: isViTab
      ? (company.employee_count != null ? String(company.employee_count) : prevRecruitingCompany.numberOfEmployees ?? '')
      : prevRecruitingCompany.numberOfEmployees,
    numberOfEmployeesEn: isEnTab
      ? (company.employee_count != null ? String(company.employee_count) : prevRecruitingCompany.numberOfEmployeesEn ?? '')
      : prevRecruitingCompany.numberOfEmployeesEn,
    numberOfEmployeesJp: isJpTab
      ? (company.employee_count != null ? String(company.employee_count) : prevRecruitingCompany.numberOfEmployeesJp ?? '')
      : prevRecruitingCompany.numberOfEmployeesJp,
    establishedDate: isViTab
      ? (company.established_year != null ? String(company.established_year) : prevRecruitingCompany.establishedDate ?? '')
      : prevRecruitingCompany.establishedDate,
    establishedDateEn: isEnTab
      ? (company.established_year != null ? String(company.established_year) : prevRecruitingCompany.establishedDateEn ?? '')
      : prevRecruitingCompany.establishedDateEn,
    establishedDateJp: isJpTab
      ? (company.established_year != null ? String(company.established_year) : prevRecruitingCompany.establishedDateJp ?? '')
      : prevRecruitingCompany.establishedDateJp,
    investmentCapital: isViTab
      ? (company.capital != null ? String(company.capital) : prevRecruitingCompany.investmentCapital ?? '')
      : prevRecruitingCompany.investmentCapital,
    investmentCapitalEn: isEnTab
      ? (company.capital != null ? String(company.capital) : prevRecruitingCompany.investmentCapitalEn ?? '')
      : prevRecruitingCompany.investmentCapitalEn,
    investmentCapitalJp: isJpTab
      ? (company.capital != null ? String(company.capital) : prevRecruitingCompany.investmentCapitalJp ?? '')
      : prevRecruitingCompany.investmentCapitalJp,
    revenue: isViTab
      ? (company.revenue != null ? String(company.revenue) : prevRecruitingCompany.revenue ?? '')
      : prevRecruitingCompany.revenue,
    revenueEn: isEnTab
      ? (company.revenue != null ? String(company.revenue) : prevRecruitingCompany.revenueEn ?? '')
      : prevRecruitingCompany.revenueEn,
    revenueJp: isJpTab
      ? (company.revenue != null ? String(company.revenue) : prevRecruitingCompany.revenueJp ?? '')
      : prevRecruitingCompany.revenueJp,
  };

  return {
    languageTab: contentLanguage,
    formData,
    recruitingCompany,
    workingLocations: workingLocations.length ? workingLocations : prevWorkingLocations,
    workingLocationDetails: workingLocationDetails.length ? workingLocationDetails : [],
    salaryRanges: salaryRanges || undefined,
    salaryRangeDetails: salaryRangeDetails.length ? salaryRangeDetails : undefined,
    requirements: requirements.length ? requirements : undefined,
    workingHours: workingHours.length ? workingHours : undefined,
    workingHourDetails: workingHourDetails.length ? workingHourDetails : undefined,
    overtimeAllowances: overtimeAllowances.length ? overtimeAllowances : undefined,
    overtimeAllowanceDetails: overtimeAllowanceDetails.length ? overtimeAllowanceDetails : undefined,
    jobBenefitRows: jobBenefitRows.length ? jobBenefitRows : undefined,
    highlightKeys: highlightKeys.length ? highlightKeys : prevHighlightKeys,
  };
}

export function applyMultilingualJdOutputToFormState(jdOutput, prevState = {}) {
  let acc = {
    formData: prevState.formData || createEmptyJdFormState().formData,
    recruitingCompany: prevState.recruitingCompany || createEmptyJdFormState().recruitingCompany,
    workingLocations: prevState.workingLocations || [],
    workingLocationDetails: prevState.workingLocationDetails || [],
    salaryRanges: prevState.salaryRanges,
    salaryRangeDetails: prevState.salaryRangeDetails || [],
    requirements: prevState.requirements,
    workingHours: prevState.workingHours,
    workingHourDetails: prevState.workingHourDetails,
    overtimeAllowances: prevState.overtimeAllowances,
    overtimeAllowanceDetails: prevState.overtimeAllowanceDetails,
    jobBenefitRows: prevState.jobBenefitRows,
    highlightKeys: prevState.highlightKeys || [],
    languageTab: 'vi',
  };

  const langs = [
    ['vi', jdOutput?.vi],
    ['en', jdOutput?.en],
    ['jp', jdOutput?.jp],
  ];

  for (const [lang, jd] of langs) {
    if (!jd || typeof jd !== 'object') continue;
    const patch = applyParsedJdToFormState(
      { ...jd, content_language: lang === 'jp' ? 'ja' : lang },
      {
        prevFormData: acc.formData,
        prevRecruitingCompany: acc.recruitingCompany,
        prevWorkingLocations: acc.workingLocations,
        prevHighlightKeys: acc.highlightKeys,
      },
    );
    acc = {
      ...acc,
      ...patch,
      formData: patch.formData,
      recruitingCompany: patch.recruitingCompany,
      workingLocations: patch.workingLocations ?? acc.workingLocations,
      highlightKeys: patch.highlightKeys ?? acc.highlightKeys,
      salaryRanges: patch.salaryRanges ?? acc.salaryRanges,
      salaryRangeDetails: patch.salaryRangeDetails ?? acc.salaryRangeDetails,
      requirements: patch.requirements ?? acc.requirements,
      workingHours: patch.workingHours ?? acc.workingHours,
      workingHourDetails: patch.workingHourDetails ?? acc.workingHourDetails,
      overtimeAllowances: patch.overtimeAllowances ?? acc.overtimeAllowances,
      overtimeAllowanceDetails: patch.overtimeAllowanceDetails ?? acc.overtimeAllowanceDetails,
      jobBenefitRows: patch.jobBenefitRows ?? acc.jobBenefitRows,
      workingLocationDetails: patch.workingLocationDetails?.length
        ? patch.workingLocationDetails
        : acc.workingLocationDetails,
    };
  }

  acc.languageTab = 'vi';
  return acc;
}

/** Áp patch từ applyParsedJdToFormState lên React setState (JdBuilderChatPage / AddJobPage). */
export function applyJdFormStatePatch(setters, patch, { mergeArrays = true } = {}) {
  if (!patch) return;
  if (patch.languageTab && setters.setLanguageTab) setters.setLanguageTab(patch.languageTab);
  if (patch.formData && setters.setFormData) setters.setFormData(patch.formData);
  if (patch.recruitingCompany && setters.setRecruitingCompany) setters.setRecruitingCompany(patch.recruitingCompany);
  if (patch.highlightKeys && setters.setHighlightKeys) setters.setHighlightKeys(patch.highlightKeys);
  if (patch.workingLocations && setters.setWorkingLocations) setters.setWorkingLocations(patch.workingLocations);
  if (patch.workingLocationDetails && setters.setWorkingLocationDetails) setters.setWorkingLocationDetails(patch.workingLocationDetails);
  if (patch.salaryRanges && setters.setSalaryRanges) setters.setSalaryRanges(patch.salaryRanges);
  if (patch.salaryRangeDetails && setters.setSalaryRangeDetails) setters.setSalaryRangeDetails(patch.salaryRangeDetails);
  if (patch.requirements && setters.setRequirements) {
    setters.setRequirements(patch.requirements);
  } else if (!mergeArrays && patch.requirements === undefined && setters.setRequirements) {
    /* keep */
  }
  if (patch.workingHours && setters.setWorkingHours) setters.setWorkingHours(patch.workingHours);
  if (patch.workingHourDetails && setters.setWorkingHourDetails) setters.setWorkingHourDetails(patch.workingHourDetails);
  if (patch.overtimeAllowances && setters.setOvertimeAllowances) setters.setOvertimeAllowances(patch.overtimeAllowances);
  if (patch.overtimeAllowanceDetails && setters.setOvertimeAllowanceDetails) {
    setters.setOvertimeAllowanceDetails(patch.overtimeAllowanceDetails);
  }
  if (patch.jobBenefitRows && setters.setJobBenefitRows) setters.setJobBenefitRows(patch.jobBenefitRows);
  if (setters.setJdTemplateSyncKey) setters.setJdTemplateSyncKey((k) => k + 1);
}
