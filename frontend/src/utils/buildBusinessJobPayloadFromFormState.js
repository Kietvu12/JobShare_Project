import { normalizeJobSalaryCurrency } from './jobSalaryCurrency.js';
import { isPersistableJobValue } from './jobCommissionUi.js';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || `jd-${Date.now()}`;
}

function filterRows(rows, fields = ['content', 'contentEn', 'contentJp']) {
  return (rows || [])
    .filter((row) => fields.some((f) => String(row?.[f] || '').trim()))
    .map((row) => {
      if (fields.includes('workingHours')) {
        const workingHours = row.workingHours || null;
        const workingHoursEn = row.workingHoursEn || null;
        const workingHoursJp = row.workingHoursJp || null;
        const primary = workingHours || workingHoursEn || workingHoursJp;
        return {
          workingHours: workingHours || primary,
          workingHoursEn,
          workingHoursJp,
        };
      }
      const content = String(row.content ?? '').trim();
      const contentEn = String(row.contentEn ?? '').trim() || null;
      const contentJp = String(row.contentJp ?? '').trim() || null;
      const primary = content || contentEn || contentJp || '';
      return {
        content: primary,
        contentEn,
        contentJp,
      };
    })
    .filter((row) => {
      if (fields.includes('workingHours')) {
        return row.workingHours || row.workingHoursEn || row.workingHoursJp;
      }
      return Boolean(row.content || row.contentEn || row.contentJp);
    });
}

/**
 * Payload JSON cho createBusinessJob / updateBusinessJob (không gồm file JD gốc).
 */
export function buildBusinessJobPayloadFromFormState(snapshot, options = {}) {
  const {
    formData = {},
    recruitingCompany = {},
    workingLocations = [],
    workingLocationDetails = [],
    salaryRanges = [],
    salaryRangeDetails = [],
    overtimeAllowances = [],
    overtimeAllowanceDetails = [],
    requirements = [],
    workingHours = [],
    workingHourDetails = [],
    jobBenefitRows = [],
    highlightKeys = [],
  } = snapshot || {};

  const title = String(formData.title || formData.titleEn || formData.titleJp || '').trim();
  if (!title) {
    throw new Error('Vui lòng nhập tiêu đề JD (tab Tiếng Việt hoặc dịch) trước khi lưu.');
  }

  const jobCode = String(formData.jobCode || '').trim() || `JD-${Date.now()}`;
  const categoryId = parseInt(formData.categoryId, 10);

  return {
    jobCode,
    jobCategoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null,
    businessSectorKey: formData.businessSectorKey || null,
    title: formData.title || title,
    titleEn: formData.titleEn || null,
    titleJp: formData.titleJp || null,
    slug: formData.slug || slugify(title),
    description: formData.description || null,
    descriptionEn: formData.descriptionEn || null,
    descriptionJp: formData.descriptionJp || null,
    bonus: formData.bonus || null,
    bonusEn: formData.bonusEn || null,
    bonusJp: formData.bonusJp || null,
    salaryCurrency: normalizeJobSalaryCurrency(formData.salaryCurrency),
    salaryReview: formData.salaryReview || null,
    salaryReviewEn: formData.salaryReviewEn || null,
    salaryReviewJp: formData.salaryReviewJp || null,
    holidays: formData.holidays || null,
    holidaysEn: formData.holidaysEn || null,
    holidaysJp: formData.holidaysJp || null,
    holidayDetails: formData.holidayDetails || null,
    holidayDetailsEn: formData.holidayDetailsEn || null,
    holidayDetailsJp: formData.holidayDetailsJp || null,
    socialInsurance: formData.socialInsurance || null,
    socialInsuranceEn: formData.socialInsuranceEn || null,
    socialInsuranceJp: formData.socialInsuranceJp || null,
    transportation: formData.transportation || null,
    transportationEn: formData.transportationEn || null,
    transportationJp: formData.transportationJp || null,
    breakTime: formData.breakTime || null,
    breakTimeEn: formData.breakTimeEn || null,
    breakTimeJp: formData.breakTimeJp || null,
    recruitmentType: formData.recruitmentType ? parseInt(formData.recruitmentType, 10) : null,
    residenceStatuses: Array.isArray(formData.residenceStatuses) ? JSON.stringify(formData.residenceStatuses) : null,
    residenceStatus: formData.residenceStatus || null,
    numberOfHires: formData.numberOfHires || null,
    probationPeriod: formData.probationPeriod || null,
    probationDetail: formData.probationDetail || null,
    recruitmentProcess: formData.recruitmentProcess || null,
    highlights: highlightKeys?.length ? JSON.stringify(highlightKeys) : (formData.highlights || null),
    status:
      options?.status != null && options?.status !== ''
        ? parseInt(options.status, 10)
        : (formData.status != null && formData.status !== ''
          ? parseInt(formData.status, 10)
          : 0),
    isPinned: false,
    isHot: false,
    jobCommissionType: formData.jobCommissionType || 'fixed',
    workingLocations: (workingLocations || [])
      .map((wl) => {
        const location = String(
          wl.location || wl.locationEn || wl.locationJp || '',
        ).trim();
        return {
          location,
          country: wl.country || null,
          locationEn: wl.locationEn || null,
          locationJp: wl.locationJp || null,
          countryEn: wl.countryEn || null,
          countryJp: wl.countryJp || null,
          numberOfHires: wl.numberOfHires || null,
          jpId: wl.jpId || null,
        };
      })
      .filter((wl) => Boolean(wl.location)),
    workingLocationDetails: filterRows(workingLocationDetails),
    salaryRanges: (salaryRanges || []).filter((sr) =>
      sr.salaryRange || sr.salaryRangeEn || sr.salaryRangeJp,
    ),
    salaryRangeDetails: filterRows(salaryRangeDetails),
    overtimeAllowances: (overtimeAllowances || []).filter((row) =>
      row.content || row.contentEn || row.contentJp,
    ),
    overtimeAllowanceDetails: filterRows(overtimeAllowanceDetails),
    requirements: (requirements || [])
      .filter((req) => req.content || req.contentEn || req.contentJp)
      .map((req) => {
        const content = String(req.content ?? '').trim();
        const contentEn = String(req.contentEn ?? '').trim() || null;
        const contentJp = String(req.contentJp ?? '').trim() || null;
        const primary = content || contentEn || contentJp;
        if (!primary) return null;
        return {
          content: content || contentEn || contentJp,
          contentEn,
          contentJp,
          type: req.type || null,
          status: req.status || null,
        };
      })
      .filter(Boolean),
    workingHours: filterRows(workingHours, ['workingHours', 'workingHoursEn', 'workingHoursJp']),
    workingHourDetails: filterRows(workingHourDetails),
    benefits: filterRows(jobBenefitRows),
    recruitingCompany: [
      recruitingCompany.companyName,
      recruitingCompany.companyNameEn,
      recruitingCompany.companyNameJp,
    ].some((v) => String(v || '').trim())
      ? {
        companyName: recruitingCompany.companyName || null,
        companyNameEn: recruitingCompany.companyNameEn || null,
        companyNameJp: recruitingCompany.companyNameJp || null,
        headquarters: recruitingCompany.headquarters || null,
        headquartersEn: recruitingCompany.headquartersEn || null,
        headquartersJp: recruitingCompany.headquartersJp || null,
        companyIntroduction: recruitingCompany.companyIntroduction || null,
        companyIntroductionEn: recruitingCompany.companyIntroductionEn || null,
        companyIntroductionJp: recruitingCompany.companyIntroductionJp || null,
        revenue: recruitingCompany.revenue || null,
        numberOfEmployees: recruitingCompany.numberOfEmployees || null,
        investmentCapital: recruitingCompany.investmentCapital || null,
        establishedDate: recruitingCompany.establishedDate || null,
      }
      : null,
    jobValues: (snapshot.jobValues || [])
      .filter(isPersistableJobValue)
      .map((jv) => ({
        typeId: jv.typeId ? parseInt(jv.typeId, 10) : null,
        valueId: jv.valueId ? parseInt(jv.valueId, 10) : null,
        value: jv.value != null && String(jv.value).trim() !== '' ? String(jv.value).trim() : null,
        isRequired: !!jv.isRequired,
        viewOnCollaborator: jv.viewOnCollaborator || null,
      })),
    jobPickupIds: [],
    campaignIds: [],
  };
}

export function wrapBusinessJobPayloadWithJdFile(requestData, jdFile) {
  if (!jdFile) return requestData;
  const fd = new FormData();
  fd.append('data', JSON.stringify(requestData));
  fd.append('jdOriginalFile', jdFile, jdFile.name);
  return fd;
}
