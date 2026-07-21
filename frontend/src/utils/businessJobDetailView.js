import { JOB_HIGHLIGHT_OPTIONS } from './jobHighlightOptions';

const REQUIREMENT_TYPE_LABELS = {
  technique: 'Kỹ thuật / chuyên môn',
  experience: 'Kinh nghiệm',
  language: 'Ngoại ngữ',
  certification: 'Chứng chỉ',
  education: 'Học vấn',
  skill: 'Kỹ năng',
  other: 'Khác',
};

const SALARY_TYPE_LABELS = {
  yearly: 'Thu nhập năm',
  monthly: 'Lương tháng',
  hourly: 'Lương giờ',
};

export function stripHtml(html) {
  if (!html) return '';
  const raw = String(html);
  if (!raw.includes('<')) return raw.trim();
  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = raw;
  tmp.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  tmp.querySelectorAll('p, li').forEach((el) => {
    const text = el.textContent?.trim();
    if (text) el.replaceWith(`${el.tagName === 'LI' ? '• ' : ''}${text}\n`);
    else el.remove();
  });
  return (tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

export function pickJobText(vi, en, jp) {
  return stripHtml(vi || en || jp || '').trim();
}

function field(job, viKey, enKey, jpKey) {
  return pickJobText(job?.[viKey], job?.[enKey], job?.[jpKey]);
}

function parseHighlights(job) {
  const raw = job?.highlights ?? job?.highlight ?? '';
  const labelByKey = Object.fromEntries(JOB_HIGHLIGHT_OPTIONS.map((o) => [o.key, o.vi]));
  const labelByText = Object.fromEntries(
    JOB_HIGHLIGHT_OPTIONS.flatMap((o) => [[o.vi, o.vi], [o.en, o.en], [o.jp, o.jp]]),
  );
  let tokens = [];
  if (Array.isArray(raw)) tokens = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        tokens = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        tokens = [trimmed];
      }
    } else {
      tokens = trimmed.split(/[\n,|]+/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return tokens
    .map((token) => {
      const cleaned = String(token).trim().replace(/^"|"$/g, '');
      return labelByKey[cleaned] || labelByText[cleaned] || cleaned;
    })
    .filter(Boolean);
}

function parseRequirements(job) {
  return (job?.requirements || [])
    .map((req) => ({
      type: req.type || 'other',
      typeLabel: REQUIREMENT_TYPE_LABELS[req.type] || req.type || 'Yêu cầu',
      content: pickJobText(req.content, req.contentEn || req.content_en, req.contentJp || req.content_jp),
      status: req.status,
    }))
    .filter((r) => r.content);
}

function parseSalaryRanges(job) {
  return (job?.salaryRanges || [])
    .map((sr) => {
      const text = pickJobText(
        sr.salaryRange ?? sr.salary_range,
        sr.salaryRangeEn ?? sr.salary_range_en,
        sr.salaryRangeJp ?? sr.salary_range_jp,
      );
      if (!text) return null;
      const type = String(sr.type || '').toLowerCase();
      const label = SALARY_TYPE_LABELS[type] || (type.includes('month') ? 'Lương tháng' : type.includes('year') ? 'Thu nhập năm' : 'Mức lương');
      return `${label}: ${text}`;
    })
    .filter(Boolean);
}

function parseDetailLines(items, pickFn) {
  return (items || [])
    .map((item) => pickFn(item))
    .filter(Boolean);
}

function parseWorkingHours(job) {
  const fromDetails = parseDetailLines(job.workingHourDetails, (d) => pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp));
  if (fromDetails.length) return fromDetails;
  return (job.workingHours || [])
    .map((wh) => pickJobText(wh.workingHours, wh.workingHoursEn || wh.working_hours_en, wh.workingHoursJp || wh.working_hours_jp))
    .filter(Boolean);
}

function parseWorkingLocations(job) {
  const fromDetails = parseDetailLines(job.workingLocationDetails, (d) => pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp));
  if (fromDetails.length) return fromDetails;
  return (job.workingLocations || [])
    .map((loc) => pickJobText(loc.workingLocation, loc.workingLocationEn || loc.working_location_en, loc.workingLocationJp || loc.working_location_jp))
    .filter(Boolean);
}

function parseBenefitsTable(job) {
  return (job?.benefits || [])
    .map((b) => pickJobText(b.content, b.contentEn || b.content_en, b.contentJp || b.content_jp))
    .filter(Boolean);
}

function parsePolicyFields(job, entries) {
  return entries
    .map(([label, vi, en, jp]) => {
      const text = pickJobText(vi, en, jp);
      return text ? { label, text } : null;
    })
    .filter(Boolean);
}

/** @returns {{ description: object, requirements: object, benefits: object }} */
export function buildBusinessJobDetailTabs(job) {
  if (!job) {
    return { description: { sections: [] }, requirements: { sections: [] }, benefits: { sections: [] } };
  }

  const highlights = parseHighlights(job);
  const requirements = parseRequirements(job);
  const required = requirements.filter((r) => r.status === 'required');
  const preferred = requirements.filter((r) => r.status !== 'required');

  const descriptionSections = [
    { label: 'Mô tả công việc', type: 'text', value: field(job, 'description', 'descriptionEn', 'descriptionJp') },
    { label: 'Lý do tuyển dụng', type: 'text', value: field(job, 'recruitmentReason', 'recruitmentReasonEn', 'recruitmentReasonJp') },
    { label: 'Số lượng tuyển', type: 'text', value: field(job, 'numberOfHires', 'numberOfHiresEn', 'numberOfHiresJp') },
    { label: 'Quy trình tuyển dụng', type: 'text', value: field(job, 'recruitmentProcess', 'recruitmentProcessEn', 'recruitmentProcessJp') },
    { label: 'Thời gian làm việc', type: 'list', items: parseWorkingHours(job) },
    { label: 'Địa điểm làm việc', type: 'list', items: parseWorkingLocations(job) },
    { label: 'Điểm nổi bật', type: 'tags', items: highlights },
  ].filter((s) => (s.type === 'text' ? s.value : (s.items?.length > 0)));

  const requirementsSections = [
    { label: 'Độ tuổi', type: 'text', value: job.ageRange || job.age_range || '' },
    { label: 'Quốc tịch', type: 'text', value: job.nationality || '' },
    { label: 'Trình độ học vấn', type: 'text', value: job.educationLevel || job.education_level || '' },
    { label: 'Giới tính', type: 'text', value: job.gender || '' },
    { label: 'Tình trạng visa / cư trú', type: 'text', value: field(job, 'residenceStatus', 'residenceStatusEn', 'residenceStatusJp') },
    { label: 'Thời hạn hợp đồng', type: 'text', value: field(job, 'contractPeriod', 'contractPeriodEn', 'contractPeriodJp') },
    { label: 'Thời gian thử việc', type: 'text', value: field(job, 'probationPeriod', 'probationPeriodEn', 'probationPeriodJp') },
    { label: 'Chi tiết thử việc', type: 'text', value: field(job, 'probationDetail', 'probationDetailEn', 'probationDetailJp') },
    { label: 'Khả năng luân chuyển', type: 'text', value: field(job, 'transferAbility', 'transferAbilityEn', 'transferAbilityJp') },
    {
      label: 'Yêu cầu bắt buộc',
      type: 'grouped',
      groups: Object.entries(
        required.reduce((acc, r) => {
          const key = r.typeLabel;
          if (!acc[key]) acc[key] = [];
          acc[key].push(r.content);
          return acc;
        }, {}),
      ).map(([groupLabel, items]) => ({ groupLabel, items })),
    },
    {
      label: 'Yêu cầu ưu tiên',
      type: 'grouped',
      groups: Object.entries(
        preferred.reduce((acc, r) => {
          const key = r.typeLabel;
          if (!acc[key]) acc[key] = [];
          acc[key].push(r.content);
          return acc;
        }, {}),
      ).map(([groupLabel, items]) => ({ groupLabel, items })),
    },
  ].filter((s) => {
    if (s.type === 'text') return Boolean(s.value);
    if (s.type === 'grouped') return s.groups?.some((g) => g.items?.length);
    return false;
  });

  const welfareBlocks = parsePolicyFields(job, [
    ['Bảo hiểm xã hội', job.socialInsurance, job.socialInsuranceEn || job.social_insurance_en, job.socialInsuranceJp || job.social_insurance_jp],
    ['Phụ cấp di chuyển', job.transportation, job.transportationEn || job.transportation_en, job.transportationJp || job.transportation_jp],
    ['Thưởng', job.bonus, job.bonusEn || job.bonus_en, job.bonusJp || job.bonus_jp],
    ['Tăng lương', job.salaryReview, job.salaryReviewEn || job.salary_review_en, job.salaryReviewJp || job.salary_review_jp],
  ]);

  const scheduleBlocks = parsePolicyFields(job, [
    ['Giờ nghỉ', job.breakTime, job.breakTimeEn || job.break_time_en, job.breakTimeJp || job.break_time_jp],
    ['Làm thêm giờ', job.overtime, job.overtimeEn || job.overtime_en, job.overtimeJp || job.overtime_jp],
    ['Ngày nghỉ', job.holidays, job.holidaysEn || job.holidays_en, job.holidaysJp || job.holidays_jp],
    ['Chi tiết ngày nghỉ', job.holidayDetails, job.holidayDetailsEn || job.holiday_details_en, job.holidayDetailsJp || job.holiday_details_jp],
  ]);

  const salaryDetails = parseDetailLines(job.salaryRangeDetails, (d) => pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp));
  const overtimeDetails = parseDetailLines(job.overtimeAllowanceDetails, (d) => pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp));
  const benefitLines = parseBenefitsTable(job);

  const benefitsSections = [
    { label: 'Mức lương', type: 'list', items: parseSalaryRanges(job) },
    { label: 'Chi tiết lương', type: 'list', items: salaryDetails },
    { label: 'Phúc lợi & đãi ngộ', type: 'blocks', blocks: welfareBlocks },
    { label: 'Thời gian & nghỉ phép', type: 'blocks', blocks: scheduleBlocks },
    { label: 'Phụ cấp làm thêm', type: 'list', items: overtimeDetails },
    { label: 'Quyền lợi khác', type: 'list', items: benefitLines },
  ].filter((s) => {
    if (s.type === 'list') return s.items?.length > 0;
    if (s.type === 'blocks') return s.blocks?.length > 0;
    return false;
  });

  return {
    description: { sections: descriptionSections },
    requirements: { sections: requirementsSections },
    benefits: { sections: benefitsSections },
  };
}
