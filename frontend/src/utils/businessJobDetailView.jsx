import React from 'react';
import { JOB_HIGHLIGHT_OPTIONS } from './jobHighlightOptions';
import { getCandidateSharingJobDetailLabels } from '../i18n/businessApp/candidateSharing.js';

function resolveDetailLang(language) {
  if (language === 'en') return 'en';
  if (language === 'ja' || language === 'jp') return 'ja';
  return 'vi';
}

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

export function pickJobText(vi, en, jp, language = 'vi') {
  const lang = resolveDetailLang(language);
  if (lang === 'en') return stripHtml(en || vi || jp || '').trim();
  if (lang === 'ja') return stripHtml(jp || en || vi || '').trim();
  return stripHtml(vi || en || jp || '').trim();
}

function field(job, viKey, enKey, jpKey, language) {
  return pickJobText(job?.[viKey], job?.[enKey], job?.[jpKey], language);
}

function parseHighlights(job, language) {
  const lang = resolveDetailLang(language);
  const labelByKey = Object.fromEntries(
    JOB_HIGHLIGHT_OPTIONS.map((o) => [o.key, lang === 'en' ? o.en : lang === 'ja' ? o.jp : o.vi]),
  );
  const labelByText = Object.fromEntries(
    JOB_HIGHLIGHT_OPTIONS.flatMap((o) => [[o.vi, labelByKey[o.key]], [o.en, labelByKey[o.key]], [o.jp, labelByKey[o.key]]]),
  );
  const raw = job?.highlights ?? job?.highlight ?? '';
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

function parseRequirements(job, language) {
  const L = getCandidateSharingJobDetailLabels(language);
  const types = L.requirementTypes || {};
  return (job?.requirements || [])
    .map((req) => ({
      type: req.type || 'other',
      typeLabel: types[req.type] || req.type || L.requirementFallback,
      content: pickJobText(req.content, req.contentEn || req.content_en, req.contentJp || req.content_jp, language),
      status: req.status,
    }))
    .filter((r) => r.content);
}

function parseSalaryRanges(job, language) {
  const L = getCandidateSharingJobDetailLabels(language);
  return (job?.salaryRanges || [])
    .map((sr) => {
      const text = pickJobText(
        sr.salaryRange ?? sr.salary_range,
        sr.salaryRangeEn ?? sr.salary_range_en,
        sr.salaryRangeJp ?? sr.salary_range_jp,
        language,
      );
      if (!text) return null;
      const type = String(sr.type || '').toLowerCase();
      let label = L.salaryDefault;
      if (type === 'yearly' || type.includes('year')) label = L.salaryYearly;
      else if (type === 'monthly' || type.includes('month')) label = L.salaryMonthly;
      else if (type === 'hourly' || type.includes('hour')) label = L.salaryHourly;
      return `${label}: ${text}`;
    })
    .filter(Boolean);
}

function parseDetailLines(items, pickFn) {
  return (items || [])
    .map((item) => pickFn(item))
    .filter(Boolean);
}

function parseWorkingHours(job, language) {
  const fromDetails = parseDetailLines(job.workingHourDetails, (d) =>
    pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp, language),
  );
  if (fromDetails.length) return fromDetails;
  return (job.workingHours || [])
    .map((wh) =>
      pickJobText(wh.workingHours, wh.workingHoursEn || wh.working_hours_en, wh.workingHoursJp || wh.working_hours_jp, language),
    )
    .filter(Boolean);
}

function parseWorkingLocations(job, language) {
  const fromDetails = parseDetailLines(job.workingLocationDetails, (d) =>
    pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp, language),
  );
  if (fromDetails.length) return fromDetails;
  return (job.workingLocations || [])
    .map((loc) =>
      pickJobText(
        loc.workingLocation,
        loc.workingLocationEn || loc.working_location_en,
        loc.workingLocationJp || loc.working_location_jp,
        language,
      ),
    )
    .filter(Boolean);
}

function parseBenefitsTable(job, language) {
  return (job?.benefits || [])
    .map((b) => pickJobText(b.content, b.contentEn || b.content_en, b.contentJp || b.content_jp, language))
    .filter(Boolean);
}

function parsePolicyFields(job, entries, language) {
  return entries
    .map(([label, vi, en, jp]) => {
      const text = pickJobText(vi, en, jp, language);
      return text ? { label, text } : null;
    })
    .filter(Boolean);
}

/** @returns {{ description: object, requirements: object, benefits: object }} */
export function buildBusinessJobDetailTabs(job, language = 'vi') {
  if (!job) {
    return { description: { sections: [] }, requirements: { sections: [] }, benefits: { sections: [] } };
  }

  const L = getCandidateSharingJobDetailLabels(language);
  const highlights = parseHighlights(job, language);
  const requirements = parseRequirements(job, language);
  const required = requirements.filter((r) => r.status === 'required');
  const preferred = requirements.filter((r) => r.status !== 'required');

  const descriptionSections = [
    { label: L.jobDescription, type: 'text', value: field(job, 'description', 'descriptionEn', 'descriptionJp', language) },
    { label: L.recruitmentReason, type: 'text', value: field(job, 'recruitmentReason', 'recruitmentReasonEn', 'recruitmentReasonJp', language) },
    { label: L.numberOfHires, type: 'text', value: field(job, 'numberOfHires', 'numberOfHiresEn', 'numberOfHiresJp', language) },
    { label: L.recruitmentProcess, type: 'text', value: field(job, 'recruitmentProcess', 'recruitmentProcessEn', 'recruitmentProcessJp', language) },
    { label: L.workingHours, type: 'list', items: parseWorkingHours(job, language) },
    { label: L.workingLocation, type: 'list', items: parseWorkingLocations(job, language) },
    { label: L.highlights, type: 'tags', items: highlights },
  ].filter((s) => (s.type === 'text' ? s.value : (s.items?.length > 0)));

  const requirementsSections = [
    { label: L.ageRange, type: 'text', value: job.ageRange || job.age_range || '' },
    { label: L.nationality, type: 'text', value: job.nationality || '' },
    { label: L.educationLevel, type: 'text', value: job.educationLevel || job.education_level || '' },
    { label: L.gender, type: 'text', value: job.gender || '' },
    { label: L.residenceStatus, type: 'text', value: field(job, 'residenceStatus', 'residenceStatusEn', 'residenceStatusJp', language) },
    { label: L.contractPeriod, type: 'text', value: field(job, 'contractPeriod', 'contractPeriodEn', 'contractPeriodJp', language) },
    { label: L.probationPeriod, type: 'text', value: field(job, 'probationPeriod', 'probationPeriodEn', 'probationPeriodJp', language) },
    { label: L.probationDetail, type: 'text', value: field(job, 'probationDetail', 'probationDetailEn', 'probationDetailJp', language) },
    { label: L.transferAbility, type: 'text', value: field(job, 'transferAbility', 'transferAbilityEn', 'transferAbilityJp', language) },
    {
      label: L.requiredRequirements,
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
      label: L.preferredRequirements,
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

  const welfareBlocks = parsePolicyFields(
    job,
    [
      [L.socialInsurance, job.socialInsurance, job.socialInsuranceEn || job.social_insurance_en, job.socialInsuranceJp || job.social_insurance_jp],
      [L.transportation, job.transportation, job.transportationEn || job.transportation_en, job.transportationJp || job.transportation_jp],
      [L.bonus, job.bonus, job.bonusEn || job.bonus_en, job.bonusJp || job.bonus_jp],
      [L.salaryReview, job.salaryReview, job.salaryReviewEn || job.salary_review_en, job.salaryReviewJp || job.salary_review_jp],
    ],
    language,
  );

  const scheduleBlocks = parsePolicyFields(
    job,
    [
      [L.breakTime, job.breakTime, job.breakTimeEn || job.break_time_en, job.breakTimeJp || job.break_time_jp],
      [L.overtime, job.overtime, job.overtimeEn || job.overtime_en, job.overtimeJp || job.overtime_jp],
      [L.holidays, job.holidays, job.holidaysEn || job.holidays_en, job.holidaysJp || job.holidays_jp],
      [L.holidayDetails, job.holidayDetails, job.holidayDetailsEn || job.holiday_details_en, job.holidayDetailsJp || job.holiday_details_jp],
    ],
    language,
  );

  const salaryDetails = parseDetailLines(job.salaryRangeDetails, (d) =>
    pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp, language),
  );
  const overtimeDetails = parseDetailLines(job.overtimeAllowanceDetails, (d) =>
    pickJobText(d.content, d.contentEn || d.content_en, d.contentJp || d.content_jp, language),
  );
  const benefitLines = parseBenefitsTable(job, language);

  const benefitsSections = [
    { label: L.salaryLevel, type: 'list', items: parseSalaryRanges(job, language) },
    { label: L.salaryDetail, type: 'list', items: salaryDetails },
    { label: L.welfare, type: 'blocks', blocks: welfareBlocks },
    { label: L.schedule, type: 'blocks', blocks: scheduleBlocks },
    { label: L.overtimeAllowance, type: 'list', items: overtimeDetails },
    { label: L.otherBenefits, type: 'list', items: benefitLines },
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

function SectionBody({
  section,
  bodyClass = 'biz-jd-body text-slate-700',
  mutedClass = 'biz-jd-muted',
  variant = 'compact',
}) {
  const isLong = variant === 'long';
  const textClass = isLong
    ? 'text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]'
    : `${bodyClass} whitespace-pre-wrap leading-relaxed`;
  const listClass = isLong
    ? 'text-xs sm:text-sm text-slate-700 leading-relaxed list-disc space-y-1 pl-4 [overflow-wrap:anywhere]'
    : `${bodyClass} list-disc pl-4 space-y-0.5`;

  if (section.type === 'text') {
    return <div className={textClass}>{section.value}</div>;
  }
  if (section.type === 'list') {
    return (
      <ul className={listClass}>
        {section.items.map((item, i) => (
          <li key={i} className="break-words">{item}</li>
        ))}
      </ul>
    );
  }
  if (section.type === 'tags') {
    return (
      <div className="flex flex-wrap gap-1">
        {section.items.map((item, i) => (
          <span key={i} className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 biz-jd-body">
            {item}
          </span>
        ))}
      </div>
    );
  }
  if (section.type === 'blocks') {
    return (
      <div className={isLong ? 'space-y-4' : 'space-y-2'}>
        {section.blocks.map((b, i) => (
          <div key={i}>
            <p className={isLong ? 'mb-1 text-xs font-semibold text-slate-800 sm:text-sm' : `${mutedClass} font-medium`}>
              {b.label}
            </p>
            <p className={isLong ? textClass : `${bodyClass} whitespace-pre-wrap`}>{b.text}</p>
          </div>
        ))}
      </div>
    );
  }
  if (section.type === 'grouped') {
    return (
      <div className={isLong ? 'space-y-4' : 'space-y-2'}>
        {section.groups.filter((g) => g.items?.length).map((g, i) => (
          <div key={i}>
            <p className={isLong ? 'mb-2 text-xs font-semibold text-slate-800 sm:text-sm' : `${mutedClass} font-medium`}>
              {g.groupLabel}
            </p>
            {isLong ? (
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 [overflow-wrap:anywhere]">
                {g.items.map((line, j) => (
                  <li key={j} className="break-words leading-relaxed">
                    <span className="mr-1 text-slate-500">■</span>
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className={`${bodyClass} list-disc pl-4`}>
                {g.items.map((line, j) => (
                  <li key={j}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function buildBusinessJobDetailLongFormSections(job, language = 'vi') {
  const tabs = buildBusinessJobDetailTabs(job, language);
  return [
    ...(tabs.description?.sections || []),
    ...(tabs.requirements?.sections || []),
    ...(tabs.benefits?.sections || []),
  ];
}

/** Single scrollable JD document (business job detail tab). */
export function BusinessJobDetailLongView({ job, language = 'vi' }) {
  const sections = buildBusinessJobDetailLongFormSections(job, language);
  const emptyLabel = getCandidateSharingJobDetailLabels(language).sectionEmpty;
  if (!sections.length) {
    return (
      <p className="w-full border border-slate-200/90 bg-white px-4 py-10 text-center text-xs text-slate-500 sm:px-6 sm:text-sm lg:px-8">
        {emptyLabel}
      </p>
    );
  }
  return (
    <article className="w-full border border-slate-200/90 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <div className="w-full space-y-8">
        {sections.map((section, index) => (
          <section
            key={`${section.label}-${index}`}
            className={index < sections.length - 1 ? 'border-b border-slate-100 pb-8' : undefined}
          >
            <h3 className="mb-3 text-sm font-bold text-slate-900 sm:text-base">{section.label}</h3>
            <SectionBody section={section} variant="long" />
          </section>
        ))}
      </div>
    </article>
  );
}

/** Compact section list for embedded job detail (Job Management). */
export function BusinessJobDetailSectionList({ sections, labelClass = 'biz-jd-label', emptyMessage }) {
  if (!sections?.length) {
    return <p className="biz-jd-muted py-4 text-center">{emptyMessage || 'Chưa có nội dung.'}</p>;
  }
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <section key={section.label} className="rounded-xl border border-slate-100 bg-white px-4 py-3.5 sm:px-5 sm:py-4">
          <h3 className={`${labelClass} mb-1.5 normal-case tracking-normal text-slate-600`}>{section.label}</h3>
          <SectionBody section={section} />
        </section>
      ))}
    </div>
  );
}
