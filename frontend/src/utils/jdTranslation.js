import { jobSalaryCurrencyToJdCode } from './jobSalaryCurrency.js';

export const JD_TRANSLATE_API_URL = 'https://ws-jobshare.com/api_ai/v2/parser/jd/translate';

export const JD_LANGUAGE_TABS = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'jp', label: '日本語' },
];

/** `location` có thể là string hoặc object đa ngôn ngữ từ parse/API — chuẩn hóa trước khi .trim / gửi lưu. */
function normalizeWorkingLocationField(loc) {
  if (loc == null || loc === '') return '';
  if (typeof loc === 'string') return loc.trim();
  if (typeof loc === 'object') {
    const s = loc.vi ?? loc.en ?? loc.name ?? loc.ja ?? loc.jp;
    return s != null ? String(s).trim() : '';
  }
  return String(loc).trim();
}

export async function translateJdViaApi(payload) {
  const response = await fetch(JD_TRANSLATE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }
  return data;
}

export function buildJdTranslationPayload(ctx) {
  const {
    languageTab,
    formData,
    recruitingCompany,
    highlightKeys,
    jobBenefitRows,
    requirements,
    workingHourDetails,
    workingHours,
    workingLocations,
    workingLocationDetails,
    salaryRanges,
    salaryRangeDetails,
    overtimeAllowanceDetails,
  } = ctx;

  const sourceTab = languageTab === 'jp' ? 'jp' : languageTab === 'en' ? 'en' : 'vi';
  const suffixFor = (tab) => (tab === 'en' ? 'En' : tab === 'jp' ? 'Jp' : '');
  const sourceField = (baseField, tab = sourceTab) => `${baseField}${suffixFor(tab)}`;
  const getFormValue = (baseField, tab = sourceTab) => formData[sourceField(baseField, tab)] ?? '';
  const getRowValue = (row, baseField, tab = sourceTab) => row?.[sourceField(baseField, tab)] ?? row?.[baseField] ?? '';
  const firstNonEmpty = (...values) => values.find((v) => v != null && String(v).trim() !== '') ?? null;

  const salaryYearly = firstNonEmpty(
    salaryRanges.find((sr) => sr.type === 'yearly')?.salaryRange,
    salaryRanges.find((sr) => sr.type === 'yearly')?.salaryRangeEn,
    salaryRanges.find((sr) => sr.type === 'yearly')?.salaryRangeJp,
  );
  const salaryMonthly = firstNonEmpty(
    salaryRanges.find((sr) => sr.type === 'monthly')?.salaryRange,
    salaryRanges.find((sr) => sr.type === 'monthly')?.salaryRangeEn,
    salaryRanges.find((sr) => sr.type === 'monthly')?.salaryRangeJp,
  );

  const companyField = (baseField) => firstNonEmpty(
    recruitingCompany?.[baseField],
    recruitingCompany?.[`${baseField}En`],
    recruitingCompany?.[`${baseField}Jp`],
  );

  const sourceRequirementsMust = requirements
    .filter((req) => req.status === 'required')
    .map((req) => getRowValue(req, 'content'))
    .filter((v) => String(v).trim());
  const sourceRequirementsPreferred = requirements
    .filter((req) => req.status === 'preferred')
    .map((req) => getRowValue(req, 'content'))
    .filter((v) => String(v).trim());

  return {
    job_code: firstNonEmpty(formData.jobCode),
    job_title: firstNonEmpty(getFormValue('title')),
    content_language: sourceTab === 'jp' ? 'ja' : sourceTab,
    headcount: firstNonEmpty(getFormValue('numberOfHires')),
    experience_job: null,
    experience_industry: null,
    features: Array.isArray(highlightKeys) ? highlightKeys : [],
    description: firstNonEmpty(getFormValue('description')),
    requirements_must: sourceRequirementsMust,
    requirements_preferred: sourceRequirementsPreferred,
    salary: {
      currency: jobSalaryCurrencyToJdCode(formData.salaryCurrency),
      monthly: salaryMonthly,
      yearly: salaryYearly,
      salary_details: firstNonEmpty(
        salaryRangeDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
        salaryRangeDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
        salaryRangeDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
      ),
      bonus_details: firstNonEmpty(getFormValue('bonus')),
      raise_details: firstNonEmpty(getFormValue('salaryReview')),
    },
    location: firstNonEmpty(
      workingLocations.map((wl) => normalizeWorkingLocationField(wl.location || wl.locationEn || wl.locationJp || '')).filter(Boolean).join(', '),
    ),
    location_detail: firstNonEmpty(
      workingLocationDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
      workingLocationDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
      workingLocationDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
    ),
    working_hours: workingHours.map((row) => getRowValue(row, 'workingHours')).filter((v) => String(v).trim()),
    overtime_details: firstNonEmpty(
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
    ),
    overtime_fee: firstNonEmpty(
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
    ),
    probation_detail: firstNonEmpty(
      getFormValue('probationDetail'),
      getFormValue('probationDetailEn'),
      getFormValue('probationDetailJp'),
    ),
    rest_time: firstNonEmpty(
      getFormValue('breakTime'),
      getFormValue('breakTimeEn'),
      getFormValue('breakTimeJp'),
    ),
    overtime_fee: firstNonEmpty(
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
      overtimeAllowanceDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
    ),
    benefits: jobBenefitRows.map((row) => getRowValue(row, 'content')).filter((v) => String(v).trim()),
    holiday_detail: firstNonEmpty(getFormValue('holidayDetails')),
    working_hour_detail: firstNonEmpty(
      workingHourDetails.map((row) => getRowValue(row, 'workingHourDetail')).find((v) => String(v).trim()),
      workingHourDetails.map((row) => getRowValue(row, 'workingHourDetailEn')).find((v) => String(v).trim()),
      workingHourDetails.map((row) => getRowValue(row, 'workingHourDetailJp')).find((v) => String(v).trim()),
    ),
    location_detail: firstNonEmpty(
      workingLocationDetails.map((row) => getRowValue(row, 'content')).find((v) => String(v).trim()),
      workingLocationDetails.map((row) => getRowValue(row, 'contentEn')).find((v) => String(v).trim()),
      workingLocationDetails.map((row) => getRowValue(row, 'contentJp')).find((v) => String(v).trim()),
    ),
    social_insurance: firstNonEmpty(getFormValue('socialInsurance')),
    transportation: firstNonEmpty(getFormValue('transportation')),
    holiday_detail: firstNonEmpty(getFormValue('holidayDetails')),
    probation: firstNonEmpty(getFormValue('probationPeriod'), getFormValue('probationDetail')),
    recruitment_process: firstNonEmpty(getFormValue('recruitmentProcess')),
    company: {
      name: companyField('companyName'),
      listing_status: null,
      industry_class: null,
      revenue: companyField('revenue'),
      capital: companyField('investmentCapital'),
      employee_count: companyField('numberOfEmployees'),
      established_year: companyField('establishedDate'),
      headquarter: companyField('headquarters'),
      overview: companyField('companyIntroduction'),
    },
  };
}

export function applyTranslatedJd(translated, setters) {
  const {
    setFormData,
    setRecruitingCompany,
    setRequirements,
    setWorkingLocationDetails,
    setSalaryRangeDetails,
    setWorkingHours,
    setOvertimeAllowanceDetails,
    setJobBenefitRows,
    setLanguageTab,
    setHighlightKeys,
    setJdTemplateSyncKey,
    getFormData,
  } = setters;

  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return '';
    for (const key of keys) {
      const val = obj[key];
      if (val != null && String(val).trim() !== '') return val;
    }
    return '';
  };

  const src = {
    vi: translated?.vi || {},
    en: translated?.en || {},
    jp: translated?.jp || translated?.ja || {},
  };
  if (!Object.keys(src.vi).length && !Object.keys(src.en).length && !Object.keys(src.jp).length) {
    throw new Error('Phản hồi dịch không hợp lệ');
  }

  const text = (obj, keys) => String(pick(obj, keys) || '').trim();
  const list = (obj, key) => (Array.isArray(obj?.[key]) ? obj[key] : []);
  const toText = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
    if (typeof value === 'object') {
      return [value.content, value.contentEn, value.contentJp, value.value, value.text, value.label]
        .map((v) => (v == null ? '' : String(v).trim()))
        .find(Boolean) || '';
    }
    return String(value).trim();
  };
  const mapTriple = (viVal, enVal, jpVal) => ({
    content: String(viVal ?? '').trim(),
    contentEn: String(enVal ?? '').trim(),
    contentJp: String(jpVal ?? '').trim(),
  });

  const applyForTab = (tab, obj) => {
    const prevForm = getFormData() || {};
    const prefix = tab === 'en' ? 'En' : tab === 'jp' ? 'Jp' : '';
    setFormData((prev) => ({
      ...prev,
      jobCode: text(obj, ['job_code']) || prev.jobCode || '',
      [`title${prefix}`]: text(obj, ['job_title']) || '',
      [`description${prefix}`]: text(obj, ['description']) || '',
      [`instruction${prefix}`]: text(obj, ['instruction']) || '',
      [`recruitmentReason${prefix}`]: text(obj, ['hiring_reason']) || '',
      [`bonus${prefix}`]: text(obj?.salary, ['bonus_details']) || '',
      [`salaryReview${prefix}`]: text(obj?.salary, ['raise_details']) || '',
      [`overtimeFee${prefix}`]: text(obj, ['overtime_fee']) || text(obj, ['overtime_details']) || '',
      [`holidayDetails${prefix}`]: text(obj, ['holiday_detail', 'holiday_details', 'holidayDetails', 'holidays_details']) || '',
      [`workingHourDetail${prefix}`]: text(obj, ['working_hour_detail']) || '',
      [`locationDetail${prefix}`]: text(obj, ['location_detail', 'location_details', 'working_location_detail', 'working_location_details']) || '',
      [`salaryDetail${prefix}`]: text(obj?.salary, ['salary_details', 'salaryDetail', 'salary_detail']) || '',
      [`breakTime${prefix}`]: toText(pick(obj, ['rest_time', 'break_time', 'breakTime', 'break_time_detail', 'break_detail'])) || '',
      [`probationDetail${prefix}`]: text(obj, ['probation_detail']) || '',
      [`socialInsurance${prefix}`]: text(obj, ['social_insurance']) || '',
      [`transportation${prefix}`]: text(obj, ['transportation']) || '',
      [`probationPeriod${prefix}`]: text(obj, ['probation']) || '',
      [`recruitmentProcess${prefix}`]: text(obj, ['recruitment_process']) || '',
      [`numberOfHires${prefix}`]: String(text(obj, ['headcount']) || ''),
      businessSectorKey: prev.businessSectorKey,
      categoryId: prev.categoryId,
      recruitmentType: prev.recruitmentType,
      residenceStatus: prevForm.residenceStatus,
      residenceStatuses: prevForm.residenceStatuses,
    }));
  };

  applyForTab('vi', src.vi || {});
  applyForTab('en', src.en || {});
  applyForTab('jp', src.jp || src.ja || {});

  const mergeRows = (key, type, status) => {
    const viList = list(src.vi, key);
    const enList = list(src.en, key);
    const jpList = list(src.jp, key);
    const max = Math.max(viList.length, enList.length, jpList.length);
    const rows = [];
    for (let i = 0; i < max; i += 1) {
      const vi = viList[i] != null ? String(viList[i]).trim() : '';
      const en = enList[i] != null ? String(enList[i]).trim() : '';
      const jp = jpList[i] != null ? String(jpList[i]).trim() : '';
      if (!vi && !en && !jp) continue;
      rows.push({ content: vi, contentEn: en, contentJp: jp, type, status });
    }
    return rows;
  };

  const reqRows = [...mergeRows('requirements_must', 'technique', 'required'), ...mergeRows('requirements_preferred', 'education', 'preferred')];
  if (reqRows.length) setRequirements(reqRows);

  const locationDetailRows = mergeRows('location_detail', 'location', 'preferred');
  if (locationDetailRows.length) {
    setWorkingLocationDetails(locationDetailRows.map((row, index) => ({ id: index, content: row.content, contentEn: row.contentEn, contentJp: row.contentJp })));
  }

  const locationDetailFallback = [
    text(src.vi, ['location_detail', 'location_details', 'working_location_detail', 'working_location_details']),
    text(src.en, ['location_detail', 'location_details', 'working_location_detail', 'working_location_details']),
    text(src.jp, ['location_detail', 'location_details', 'working_location_detail', 'working_location_details']),
  ].map((v) => String(v || '').trim()).filter(Boolean);
  if (!locationDetailRows.length && locationDetailFallback.length) {
    setWorkingLocationDetails([{ id: 0, content: locationDetailFallback[0] || '', contentEn: locationDetailFallback[1] || '', contentJp: locationDetailFallback[2] || '' }]);
  }

  const salaryDetailRows = mergeRows('salary_details', 'salaryDetail', 'preferred');
  if (salaryDetailRows.length) {
    setSalaryRangeDetails(salaryDetailRows.map((row, index) => ({ id: index, content: row.content, contentEn: row.contentEn, contentJp: row.contentJp })));
  }

  const salaryDetailFallback = [
    text(src.vi?.salary, ['salary_details', 'salaryDetail', 'salary_detail']),
    text(src.en?.salary, ['salary_details', 'salaryDetail', 'salary_detail']),
    text(src.jp?.salary, ['salary_details', 'salaryDetail', 'salary_detail']),
  ].map((v) => String(v || '').trim()).filter(Boolean);
  if (!salaryDetailRows.length && salaryDetailFallback.length) {
    setSalaryRangeDetails([{ id: 0, content: salaryDetailFallback[0] || '', contentEn: salaryDetailFallback[1] || '', contentJp: salaryDetailFallback[2] || '' }]);
  }

  const workingHoursRows = mergeRows('working_hours', 'workingHour', 'preferred');
  if (workingHoursRows.length) {
    setWorkingHours(workingHoursRows.map((row, index) => ({ id: index, workingHours: row.content, workingHoursEn: row.contentEn, workingHoursJp: row.contentJp })));
  }

  const overtimeRows = mergeRows('overtime_details', 'overtime', 'preferred');
  if (overtimeRows.length) {
    setOvertimeAllowanceDetails(overtimeRows.map((row, index) => ({ id: index, content: row.content, contentEn: row.contentEn, contentJp: row.contentJp })));
  }

  const overtimeDetailFallback = [
    text(src.vi, ['overtime_details', 'overtime_fee', 'overtimeDetails']),
    text(src.en, ['overtime_details', 'overtime_fee', 'overtimeDetails']),
    text(src.jp, ['overtime_details', 'overtime_fee', 'overtimeDetails']),
  ].map((v) => String(v || '').trim()).filter(Boolean);
  if (!overtimeRows.length && overtimeDetailFallback.length) {
    setOvertimeAllowanceDetails([{ id: 0, content: overtimeDetailFallback[0] || '', contentEn: overtimeDetailFallback[1] || '', contentJp: overtimeDetailFallback[2] || '' }]);
  }

  const benefitsList = mergeRows('benefits', 'benefit', 'preferred');
  if (benefitsList.length) setJobBenefitRows(benefitsList.map((row, index) => ({ id: index, content: row.content, contentEn: row.contentEn, contentJp: row.contentJp })));

  setRecruitingCompany((prev) => ({
    ...prev,
    companyName: text(src.vi.company, ['name']) || prev.companyName || '',
    companyNameEn: text(src.en.company, ['name']) || prev.companyNameEn || '',
    companyNameJp: text(src.jp.company, ['name']) || prev.companyNameJp || '',
    companyIntroduction: text(src.vi.company, ['overview']) || prev.companyIntroduction || '',
    companyIntroductionEn: text(src.en.company, ['overview']) || prev.companyIntroductionEn || '',
    companyIntroductionJp: text(src.jp.company, ['overview']) || prev.companyIntroductionJp || '',
    headquarters: text(src.vi.company, ['headquarter']) || prev.headquarters || '',
    headquartersEn: text(src.en.company, ['headquarter']) || prev.headquartersEn || '',
    headquartersJp: text(src.jp.company, ['headquarter']) || prev.headquartersJp || '',
    numberOfEmployees: text(src.vi.company, ['employee_count']) || prev.numberOfEmployees || '',
    numberOfEmployeesEn: text(src.en.company, ['employee_count']) || prev.numberOfEmployeesEn || '',
    numberOfEmployeesJp: text(src.jp.company, ['employee_count']) || prev.numberOfEmployeesJp || '',
    establishedDate: text(src.vi.company, ['established_year']) || prev.establishedDate || '',
    establishedDateEn: text(src.en.company, ['established_year']) || prev.establishedDateEn || '',
    establishedDateJp: text(src.jp.company, ['established_year']) || prev.establishedDateJp || '',
    investmentCapital: text(src.vi.company, ['capital']) || prev.investmentCapital || '',
    investmentCapitalEn: text(src.en.company, ['capital']) || prev.investmentCapitalEn || '',
    investmentCapitalJp: text(src.jp.company, ['capital']) || prev.investmentCapitalJp || '',
    revenue: text(src.vi.company, ['revenue']) || prev.revenue || '',
    revenueEn: text(src.en.company, ['revenue']) || prev.revenueEn || '',
    revenueJp: text(src.jp.company, ['revenue']) || prev.revenueJp || '',
  }));

  setLanguageTab('vi');

  const featureKeys = Array.isArray(src.vi.features) ? src.vi.features : Array.isArray(src.en.features) ? src.en.features : Array.isArray(src.jp.features) ? src.jp.features : [];
  setHighlightKeys(featureKeys);
  setFormData((prev) => ({ ...prev, highlights: featureKeys.length ? JSON.stringify(featureKeys) : '' }));
  setJdTemplateSyncKey((k) => k + 1);
}
