/**
 * Map AI CV parser response (v3 flat or v2 { rirekisho, shokumu_keirekisho }) -> formData.
 * Shared by AddCandidateForm and QuickCreateCandidateDrawer.
 */

function calculateAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
}

function normalizeBirthDateFromAi(value) {
  if (!value || typeof value !== 'string') return '';
  const s = String(value).trim();
  const full = s.match(/^(\d{4})[年\/-](\d{1,2})[月\/-](\d{1,2})日?$/);
  if (full) {
    const y = full[1];
    const m = String(parseInt(full[2], 10)).padStart(2, '0');
    const d = String(parseInt(full[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsedDate = new Date(s);
  if (!isNaN(parsedDate.getTime())) {
    return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
  }
  return '';
}

function inferJlptLevelFromParsed(rr, mappedCertificates) {
  if (rr.jlptLevel != null && String(rr.jlptLevel).trim() !== '') return String(rr.jlptLevel);
  const certs = mappedCertificates || rr.licenses_qualifications || [];
  for (const c of certs) {
    const name = String(c?.name || '');
    const m = name.match(/\bN\s*([1-5])\b/i) || name.match(/日本語.*?N\s*([1-5])/i);
    if (m) return m[1];
  }
  return '';
}

/** Parse API date string (e.g. "2020-04", "2020/09", "2020年4月", "2026-03-05") to { year, month } for form. */
const parseApiDateToYearMonth = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return { year: '', month: '' };
  const s = String(dateStr).trim();
  if (!s) return { year: '', month: '' };
  if (/^(Nay|現在|present|current)$/i.test(s) || s.includes('現在')) return { year: '', month: '' };
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) return { year: yearOnly[1], month: '' };
  const iso = s.match(/^(\d{4})[-](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (iso) return { year: iso[1], month: String(parseInt(iso[2], 10)) };
  const slash = s.match(/^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?/);
  if (slash) return { year: slash[1], month: String(parseInt(slash[2], 10)) };
  const rev = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (rev) return { year: rev[2], month: String(parseInt(rev[1], 10)) };
  const jp = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*(?:月)?/);
  if (jp) return { year: jp[1], month: String(parseInt(jp[2], 10)) };
  return { year: '', month: '' };
};
const extractYearMonth = parseApiDateToYearMonth;

const isEndDateCurrent = (endDate) => {
  if (endDate == null || endDate === '') return false;
  const s = String(endDate).trim();
  const lower = s.toLowerCase();
  return s === '現在' || lower === 'đến nay' || lower === 'present' || lower === 'current' || s.includes('現在');
};

/** 職務経歴「期間」— luôn hiển thị dạng `2020 年 4 月～2024 年 5 月` (full-width ～). */
const formatShokumuPeriodRangeJa = (startRaw, endRaw) => {
  const startYm = parseApiDateToYearMonth(String(startRaw || '').trim());
  const endStr = String(endRaw || '').trim();
  const endCurrent = isEndDateCurrent(endStr);
  const endYm = endCurrent ? null : parseApiDateToYearMonth(endStr);
  const part = (ym) => `${ym.year} 年 ${ym.month} 月`;
  const startOk = startYm.year !== '' && startYm.month !== '';
  const endOk = endYm && endYm.year !== '' && endYm.month !== '';
  if (startOk && endCurrent) return `${part(startYm)}～現在`;
  if (startOk && endOk) return `${part(startYm)}～${part(endYm)}`;
  if (startOk) return part(startYm);
  if (endOk) return part(endYm);
  return '';
};

/** Work period string may use ASCII ~ or Japanese～ / 〜 between start and end. */
const splitWorkPeriodRange = (period) => {
  if (period == null || period === '') return ['', ''];
  const normalized = String(period).replace(/\u301c|\uff5e|\u223c/g, '~').trim();
  const parts = normalized.split(/\s*~\s*/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  return [parts[0] || '', ''];
};

const toSchoolNameMajor = (content) => {
  const s = (content || '').trim().replace(/\s*(入学|卒業)\s*$/, '').trim();
  const parts = s.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
  return { school_name: parts[0] || '', major: parts.slice(1).join(' / ') || '', content: s };
};

const parseJsonLike = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

/** Chuẩn hóa educations lưu cũ (2 dòng 入学/卒業 mỗi trường) thành 1 dòng/trường có endYear, endMonth, school_name, major. */
const normalizeEducationsFromLegacy = (list) => {
  if (!list || !Array.isArray(list)) return [];
  const result = [];
  let pending = null; // { schoolLabel, year, month }
  for (const edu of list) {
    const content = (edu.content || '').trim();
    const year = (edu.year ?? '').toString().trim();
    const month = (edu.month ?? '').toString().trim();
    const endYear = (edu.endYear ?? '').toString().trim();
    const endMonth = (edu.endMonth ?? '').toString().trim();
    if (endYear !== '' || endMonth !== '' || !content.endsWith(' 入学') && !content.endsWith(' 卒業')) {
      if (pending) {
        const p = toSchoolNameMajor(pending.schoolLabel);
        result.push({ ...p, year: pending.year, month: pending.month, endYear: '', endMonth: '' });
        pending = null;
      }
      const schoolLabel = content.replace(/\s*(入学|卒業)\s*$/, '').trim();
      const p = toSchoolNameMajor(schoolLabel || content);
      result.push({ ...p, year, month, endYear, endMonth });
      continue;
    }
    if (content.endsWith(' 入学')) {
      if (pending) {
        const p = toSchoolNameMajor(pending.schoolLabel);
        result.push({ ...p, year: pending.year, month: pending.month, endYear: '', endMonth: '' });
      }
      pending = { schoolLabel: content.replace(/\s*入学\s*$/, '').trim(), year, month };
    } else if (content.endsWith(' 卒業')) {
      const schoolLabel = content.replace(/\s*卒業\s*$/, '').trim();
      if (pending && pending.schoolLabel === schoolLabel) {
        const p = toSchoolNameMajor(schoolLabel);
        result.push({ ...p, year: pending.year, month: pending.month, endYear: year, endMonth: month });
        pending = null;
      } else {
        if (pending) {
          const p = toSchoolNameMajor(pending.schoolLabel);
          result.push({ ...p, year: pending.year, month: pending.month, endYear: '', endMonth: '' });
        }
        pending = null;
        const p = toSchoolNameMajor(schoolLabel);
        result.push({ ...p, year: '', month: '', endYear: year, endMonth: month });
      }
    } else {
      if (pending) {
        const p = toSchoolNameMajor(pending.schoolLabel);
        result.push({ ...p, year: pending.year, month: pending.month, endYear: '', endMonth: '' });
      }
      pending = null;
      const p = toSchoolNameMajor(content);
      result.push({ ...p, year, month, endYear: '', endMonth: '' });
    }
  }
  if (pending) {
    const p = toSchoolNameMajor(pending.schoolLabel);
    result.push({ ...p, year: pending.year, month: pending.month, endYear: '', endMonth: '' });
  }
  return result;
};

/** Chuẩn hóa education từ API (cũ/mới) sang shape form: year, month, endYear, endMonth, school_name, major. */
const normalizeEducationsForForm = (raw) => {
  const parsed = parseJsonLike(raw);
  const list = Array.isArray(parsed) ? parsed : [];
  const hasNewShape = list.some((edu) => edu && typeof edu === 'object' && (edu.start_date || edu.end_date || edu.school_name || edu.major));
  if (!hasNewShape) return normalizeEducationsFromLegacy(list);
  return list.map((edu) => {
    const { year, month } = parseApiDateToYearMonth(edu?.start_date || '');
    const { year: endYear, month: endMonth } = parseApiDateToYearMonth(edu?.end_date || '');
    const school_name = (edu?.school_name || '').toString().trim();
    const major = (edu?.major || '').toString().trim();
    const content = [school_name, major].filter(Boolean).join(' / ');
    return { school_name, major, year, month, endYear, endMonth, content };
  });
};

/** 1 item = 1 kinh nghiệm với start/end tách riêng (giống học vấn). */
const normalizeWorkExperiencesFromLegacy = (list) => {
  if (!list || !Array.isArray(list)) return [];
  return list.map((we) => {
    const rawPeriod = (we.period || '').trim();
    const [startStr, endStr] = splitWorkPeriodRange(rawPeriod);
    const startYm = parseApiDateToYearMonth(we.start_date || we.period_start || startStr || '');
    const endRaw = String(we.end_date || we.period_end || endStr || '').trim();
    const endIsCurrent = isEndDateCurrent(endRaw);
    const endYm = endIsCurrent ? { year: '', month: '' } : parseApiDateToYearMonth(endRaw);
    const projects = Array.isArray(we.projects)
      ? we.projects.map(normalizeJobProjectItem).filter((p) => p.project_name || p.role || p.description || p.tools_tech || p.team_size || p.period)
      : [];
    return {
      company_name: we.company_name || '',
      employmentPlace: we.employmentPlace || we.employment_place || we.work_location || we.location || '',
      companyRole: we.companyRole || we.company_role || we.position_role || we.position_name || we.position || '',
      business_purpose: we.business_purpose || '',
      scale_role: we.scale_role || '',
      description: we.description || '',
      tools_tech: we.tools_tech || '',
      reason_for_leaving: we.reason_for_leaving || '',
      startYear: startYm.year,
      startMonth: startYm.month,
      endYear: endYm.year,
      endMonth: endYm.month,
      endCurrent: endIsCurrent,
      projects,
      // aliases for older render paths / existing API payloads
      year: startYm.year,
      month: startYm.month,
      start_date: [startYm.year, startYm.month].filter(Boolean).length ? `${startYm.year}/${startYm.month}` : '',
      end_date: endIsCurrent ? '現在' : ([endYm.year, endYm.month].filter(Boolean).length ? `${endYm.year}/${endYm.month}` : ''),
      period: formatShokumuPeriodRangeJa(
        startStr || `${startYm.year}/${startYm.month}`,
        endIsCurrent ? '現在' : (endStr || `${endYm.year}/${endYm.month}`)
      ),
    };
  });
};

const normalizeRirekishoWorkExperienceItem = (w) => {
  const startYm = parseApiDateToYearMonth(w?.start_date || w?.period || '');
  const endRaw = String(w?.end_date || '').trim();
  const endIsCurrent = isEndDateCurrent(endRaw);
  const endYm = endIsCurrent ? { year: '', month: '' } : parseApiDateToYearMonth(endRaw);
  const startDate = [startYm.year, startYm.month].filter(Boolean).length ? `${startYm.year}/${startYm.month}` : '';
  const endDate = endIsCurrent ? '現在' : ([endYm.year, endYm.month].filter(Boolean).length ? `${endYm.year}/${endYm.month}` : '');
  const projects = Array.isArray(w?.projects)
    ? w.projects
        .map(normalizeJobProjectItem)
        .filter((p) => p.project_name || p.role || p.description || p.tools_tech || p.team_size || p.period)
    : [];
  return {
    company_name: w?.company_name || '',
    employmentPlace: w?.employmentPlace || w?.employment_place || w?.work_location || w?.location || '',
    companyRole: w?.companyRole || w?.company_role || w?.position_role || w?.position_name || w?.position || '',
    business_purpose: w?.business_purpose || '',
    scale_role: w?.scale_role || w?.department_role || '',
    description: w?.description || w?.department_role || '',
    tools_tech: w?.tools_tech || '',
    reason_for_leaving: w?.reason_for_leaving || '',
    startYear: startYm.year,
    startMonth: startYm.month,
    endYear: endYm.year,
    endMonth: endYm.month,
    endCurrent: endIsCurrent,
    projects,
    year: startYm.year,
    month: startYm.month,
    start_date: startDate,
    end_date: endDate,
    period: startDate || endDate || '',
  };
};

const normalizeShokumuWorkExperienceItem = (job) => {
  const start = job?.period_start || job?.start_date || '';
  const end = job?.period_end || job?.end_date || '';
  const startYm = parseApiDateToYearMonth(start);
  const endRaw = String(end || '').trim();
  const endIsCurrent = isEndDateCurrent(endRaw);
  const endYm = endIsCurrent ? { year: '', month: '' } : parseApiDateToYearMonth(endRaw);
  const project = normalizeJobProjectItem(job);
  const projects = project.project_name || project.role || project.description || project.tools_tech || project.team_size || project.period
    ? [project]
    : [];
  return {
    company_name: job?.company_name || '',
    employmentPlace: job?.employmentPlace || job?.employment_place || job?.work_location || job?.location || '',
    companyRole: job?.companyRole || job?.company_role || job?.position_role || job?.position_name || job?.position || job?.role || '',
    business_purpose: job?.business_objective || job?.business_purpose || '',
    scale_role: job?.team_size_role || job?.scale_role || '',
    description: job?.responsibilities || job?.description || '',
    tools_tech: Array.isArray(job?.tools)
      ? job.tools.map((t) => (t == null ? '' : String(t))).filter(Boolean).join(', ')
      : (typeof job?.tools === 'string' ? job.tools : (job?.tools_tech || '')),
    reason_for_leaving: job?.reason_for_leaving || '',
    startYear: startYm.year,
    startMonth: startYm.month,
    endYear: endYm.year,
    endMonth: endYm.month,
    endCurrent: endIsCurrent,
    projects,
    year: startYm.year,
    month: startYm.month,
    start_date: [startYm.year, startYm.month].filter(Boolean).length ? `${startYm.year}/${startYm.month}` : '',
    end_date: endIsCurrent ? '現在' : ([endYm.year, endYm.month].filter(Boolean).length ? `${endYm.year}/${endYm.month}` : ''),
    period: formatShokumuPeriodRangeJa(start, endIsCurrent ? '現在' : end),
  };
};

/** Chuẩn hóa workExperiences từ API (cũ/mới) -> đúng shape form đang dùng (1 item = 1 kinh nghiệm). */
const normalizeWorkExperiencesForForm = (raw) => {
  const parsed = parseJsonLike(raw);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return normalizeWorkExperiencesFromLegacy(parsed);
  }
  if (typeof parsed !== 'object') return [];

  const rirekisho = Array.isArray(parsed.rirekisho_work_history) ? parsed.rirekisho_work_history : [];
  if (rirekisho.length > 0) {
    return rirekisho.map(normalizeRirekishoWorkExperienceItem);
  }

  const shokumu = Array.isArray(parsed.shokumu_job_history) ? parsed.shokumu_job_history : [];
  if (shokumu.length > 0) {
    return shokumu.map(normalizeShokumuWorkExperienceItem);
  }

  return [];
};

/** Match company names: rirekisho vs shokumu labels may differ (e.g. legal name vs display name). */
const stripKabushikiForMatch = (s) =>
  String(s || '')
    .replace(/\s/g, '')
    .replace(/^(株式会社|（株）|\(株\))/u, '');

const companyNamesLikelySameRirekiShokumu = (a, b) => {
  const sa = stripKabushikiForMatch(a);
  const sb = stripKabushikiForMatch(b);
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  if (sa.includes(sb) || sb.includes(sa)) return true;
  return false;
};

const normalizeJobProjectItem = (project) => {
  const startYear = String(project?.startYear ?? project?.project_start_year ?? '').trim();
  const startMonth = String(project?.startMonth ?? project?.project_start_month ?? '').trim();
  const endYear = String(project?.endYear ?? project?.project_end_year ?? '').trim();
  const endMonth = String(project?.endMonth ?? project?.project_end_month ?? '').trim();
  const period = String(project?.period || project?.project_period || '').trim();
  const [periodStartFromPeriod, periodEndFromPeriod] = splitWorkPeriodRange(period);
  const periodStart = String(project?.period_start || project?.project_period_start || project?.start_date || periodStartFromPeriod || '').trim();
  const periodEnd = String(project?.period_end || project?.project_period_end || project?.end_date || periodEndFromPeriod || '').trim();
  const roleCheckboxes = Array.isArray(project?.roleCheckboxes)
    ? project.roleCheckboxes.filter(Boolean).map((v) => String(v))
    : Array.isArray(project?.role_checkboxes)
      ? project.role_checkboxes.filter(Boolean).map((v) => String(v))
      : [];
  const processCheckboxes = Array.isArray(project?.processCheckboxes)
    ? project.processCheckboxes.filter(Boolean).map((v) => String(v))
    : Array.isArray(project?.process_checkboxes)
      ? project.process_checkboxes.filter(Boolean).map((v) => String(v))
      : [];
  return {
    project_name: String(project?.project_name || project?.name || project?.business_objective || project?.business_purpose || '').trim(),
    role: String(project?.role || project?.project_role || project?.position || '').trim(),
    roleCheckboxes,
    processCheckboxes,
    description: String(project?.description || project?.responsibilities || '').trim(),
    tools_tech: Array.isArray(project?.tools)
      ? project.tools.map((t) => (t == null ? '' : String(t))).filter(Boolean).join(', ')
      : String(project?.tools_tech || project?.tools || '').trim(),
    team_size: String(project?.team_size || project?.team || project?.team_size_role || project?.scale_role || '').trim(),
    startYear,
    startMonth,
    endYear,
    endMonth,
    period_start: periodStart,
    period_end: periodEnd,
    period: period || buildProjectPeriodText({ startYear, startMonth, endYear, endMonth }),
  };
};

const buildProjectPeriodText = (project) => {
  const start = [project?.startYear, project?.startMonth].filter(Boolean).join('/');
  const end = [project?.endYear, project?.endMonth].filter(Boolean).join('/');
  if (start && end) return `${start} ～ ${end}`;
  if (start) return start;
  if (end) return end;
  return String(project?.period || '').trim();
};

const yearMonthToComparable = (dateStr) => {
  const { year, month } = parseApiDateToYearMonth(dateStr || '');
  if (!year) return null;
  const m = parseInt(month || '1', 10) || 1;
  return parseInt(year, 10) * 12 + m;
};

/** True if shokumu job period overlaps rirekisho work_history item (year/month resolution). */
const rirekishoJobPeriodOverlaps = (w, job) => {
  const rStart = yearMonthToComparable(w.start_date);
  const rEnd = isEndDateCurrent(w.end_date) ? null : yearMonthToComparable(w.end_date);
  const jStart = yearMonthToComparable(job.period_start);
  const jEnd = isEndDateCurrent(job.period_end) ? null : yearMonthToComparable(job.period_end);
  const rLo = rStart ?? 0;
  const rHi = rEnd ?? 1e9;
  const jLo = jStart ?? 0;
  const jHi = jEnd ?? 1e9;
  return !(jHi < rLo || jLo > rHi);
};

const toolsTextFromShokumuJob = (job) => {
  if (!job) return '';
  if (Array.isArray(job.tools)) {
    return job.tools.map((t) => (t == null ? '' : String(t))).filter(Boolean).join(', ');
  }
  if (typeof job.tools === 'string' && job.tools) return job.tools;
  return job.tools_tech || '';
};

/** Merge matching job_history rows into one rirekisho work_history item (same company + overlapping period). */
const mergeShokumuDetailsOntoRirekishoItem = (w, skJobs) => {
  if (!skJobs?.length) {
    return {
      business_purpose: '',
      scale_role: w.department_role || '',
      description: '',
      tools_tech: '',
      reason_for_leaving: '',
    };
  }
  const matches = skJobs.filter(
    (job) => companyNamesLikelySameRirekiShokumu(w.company_name, job.company_name) && rirekishoJobPeriodOverlaps(w, job)
  );
  if (!matches.length) {
    return {
      business_purpose: '',
      scale_role: w.department_role || '',
      description: '',
      tools_tech: '',
      reason_for_leaving: '',
    };
  }
  const sorted = [...matches].sort((a, b) => {
    const as = yearMonthToComparable(a.period_start);
    const bs = yearMonthToComparable(b.period_start);
    return (as ?? 0) - (bs ?? 0);
  });
  const businessParts = [
    ...new Set(
      sorted
        .map((j) => (j.business_objective || j.business_purpose || '').trim())
        .filter(Boolean)
    ),
  ];
  const scaleParts = [
    ...new Set(
      sorted.map((j) => (j.team_size_role || j.scale_role || '').trim()).filter(Boolean)
    ),
  ];
  const descParts = sorted
    .map((j) => (j.responsibilities || j.description || '').trim())
    .filter(Boolean);
  const toolStrs = sorted.map((j) => toolsTextFromShokumuJob(j)).filter(Boolean);
  const reason = [...sorted].reverse().map((j) => j.reason_for_leaving).find(Boolean) || '';
  return {
    business_purpose: businessParts.join('\n'),
    scale_role: scaleParts.join('\n') || w.department_role || '',
    description: descParts.join('\n\n'),
    tools_tech: [...new Set(toolStrs.flatMap((t) => t.split(/[,、]/).map((x) => x.trim()).filter(Boolean)))].join(', '),
    reason_for_leaving: reason,
  };
};

function normalizeSalaryValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/万円/.test(raw)) return raw;
  const digits = raw.replace(/[^\d.]/g, '');
  if (!digits) return raw;
  return `${digits}万円`;
}

export const CV_AI_PARSE_BASE_URL = 'https://test.ws-jobshare.com/api_ai';
export const CV_AI_PARSE_URL = `${CV_AI_PARSE_BASE_URL}/v3/resume/cv`;

function hasV2NestedResumeShape(o) {
  if (!o || typeof o !== 'object') return false;
  return (
    o.rirekisho != null ||
    o.shokumu_keirekisho != null ||
    o.shokumuKeirekisho != null ||
    o.shokumu != null ||
    o.shokumukeirekisho != null ||
    o.shokumi_keirekisho != null
  );
}

/** API v3: flat resume object (see backend/example.json). */
function hasV3FlatResumeShape(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  if (hasV2NestedResumeShape(o)) return false;
  return (
    o.full_name != null ||
    o.education_history != null ||
    o.work_history != null ||
    o.job_history != null ||
    o.email != null
  );
}

function unwrapAiParsePayload(parsedData) {
  if (!parsedData || typeof parsedData !== 'object') return {};
  const candidates = [parsedData, parsedData.data, parsedData.resume, parsedData.result, parsedData.payload];
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      if (hasV2NestedResumeShape(c) || hasV3FlatResumeShape(c)) return c;
    }
  }
  return parsedData;
}

/** Chuẩn hóa v3 flat → shape v2 { rirekisho, shokumu_keirekisho } để tái dùng mapper hiện có. */
function normalizeV3FlatResumeToLegacyRoot(flat) {
  const f = flat || {};
  return {
    applied_position: f.applied_position ?? f.jobCategoryId,
    rirekisho: {
      creation_date: f.creation_date,
      full_name: f.full_name,
      name_furigana: f.name_furigana,
      birth_date: f.birth_date,
      age: f.age,
      gender: f.gender,
      phone: f.phone,
      email: f.email,
      postal_code: f.postal_code,
      address: f.address,
      address_furigana: f.address_furigana,
      nearest_station: f.nearest_station,
      emergency_contact_address: f.emergency_contact_address,
      residence_status: f.residence_status ?? f.current_visa_type,
      residence_expiry: f.residence_expiry,
      education_history: f.education_history,
      work_history: f.work_history,
      licenses_qualifications: f.licenses_qualifications,
      qualifications: f.qualifications,
      self_pr: f.self_pr,
      hobbies_skills: f.hobbies_skills,
      motivation: f.motivation,
      current_salary: f.current_salary,
      expected_salary: f.expected_salary,
      desired_role: f.desired_role,
      desired_location: f.desired_location,
      available_start_date: f.available_start_date,
      dependents_count: f.dependents_count,
      has_spouse: f.has_spouse,
      spouse_support_obligation: f.spouse_support_obligation,
    },
    shokumu_keirekisho: {
      creation_date: f.creation_date,
      full_name: f.full_name,
      summary: f.summary,
      job_history: f.job_history,
      skills_and_knowledge: f.skills ?? f.skills_and_knowledge,
      qualifications: f.qualifications,
      self_pr: f.career_self_pr ?? f.self_pr,
    },
  };
}

function mapQualificationsToCertificates(qualifications) {
  if (!Array.isArray(qualifications) || qualifications.length === 0) return null;
  return qualifications.map((q) => {
    if (q.year != null || q.month != null) {
      const { year, month } = parseApiDateToYearMonth(q.acquired_date || q.acquiredDate || '');
      return {
        year: q.year != null ? String(q.year) : year,
        month: q.month != null ? String(q.month) : month,
        name: q.name || '',
      };
    }
    const { year, month } = parseApiDateToYearMonth(q.acquired_date || q.acquiredDate || '');
    return { year, month, name: q.name || '' };
  });
}

/** Map API response v2 { rirekisho, shokumu_keirekisho } hoặc v3 flat -> formData. */
export function mergeResumeDataFromAi(parsedData, prev = {}) {
  const tryParseJson = (v) => {
    if (v == null) return v;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return null;
      try {
        return JSON.parse(t);
      } catch {
        return null;
      }
    }
    return v;
  };
  const firstNonEmpty = (...values) => values.find((v) => v != null && String(v).trim() !== '') || '';
  const extractYearMonth = (value) => {
    const s = String(value || '').trim();
    if (!s) return { year: '', month: '' };
    let m = s.match(/^(\d{4})[\/\-.](\d{1,2})/);
    if (m) return { year: m[1], month: String(parseInt(m[2], 10)) };
    m = s.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月?/);
    if (m) return { year: m[1], month: String(parseInt(m[2], 10)) };
    m = s.match(/^(\d{1,2})[\/\-.](\d{4})/);
    if (m) return { year: m[2], month: String(parseInt(m[1], 10)) };
    if (/^Nay|現在|present|current$/i.test(s)) return { year: '', month: '' };
    if (/^\d{4}$/.test(s)) return { year: s, month: '' };
    return { year: '', month: '' };
  };
  const normalizeWorkHistoryRows = (items) => {
    if (!Array.isArray(items)) return [];
    return items.flatMap((item) => {
      const companyName = String(item?.company_name || item?.companyName || '').trim();
      const businessPurpose = String(item?.business_objective || item?.business_purpose || '').trim();
      const departmentRole = String(item?.team_size_role || item?.scale_role || item?.department_role || '').trim();
      const startYm = extractYearMonth(item?.start_date || item?.period_start || '');
      const endRaw = String(item?.end_date || item?.period_end || '').trim();
      const endIsCurrent = /^(nay|現在|present|current)$/i.test(endRaw) || endRaw.includes('現在');
      const endYm = endIsCurrent ? { year: '', month: '' } : extractYearMonth(endRaw);
      const base = {
        business_purpose: businessPurpose,
        scale_role: departmentRole,
        description: item?.responsibilities || item?.description || '',
        tools_tech: Array.isArray(item?.tools) ? item.tools.filter(Boolean).join(', ') : (item?.tools || item?.tools_tech || ''),
        reason_for_leaving: item?.reason_for_leaving || '',
        projects: Array.isArray(item?.projects) ? item.projects.map(normalizeJobProjectItem).filter((p) => p.project_name || p.role || p.description || p.tools_tech || p.team_size || p.period) : [],
      };
      const rows = [];
      const startDate = [startYm.year, startYm.month].filter(Boolean).length ? `${startYm.year}/${startYm.month}` : '';
      const endDate = endIsCurrent ? '現在' : ([endYm.year, endYm.month].filter(Boolean).length ? `${endYm.year}/${endYm.month}` : '');
      if (companyName || startYm.year || startYm.month) {
        rows.push({
          startYear: startYm.year,
          startMonth: startYm.month,
          endYear: endYm.year,
          endMonth: endYm.month,
          endCurrent: endIsCurrent,
          year: startYm.year,
          month: startYm.month,
          start_date: startDate,
          end_date: endDate,
          period: startDate || endDate || '',
          company_name: companyName,
          ...base,
        });
      }
      return rows;
    });
  };
  /** Bản 職務経歴 chi tiết: có period_* hoặc nội dung 事業/業務, khác 職歴 ngắn của 履歴書. */
  const isShokumuJobEntryShape = (j) => {
    if (!j || typeof j !== 'object') return false;
    if (String(j.responsibilities || j.description || '').trim() !== '') return true;
    if (String(j.business_objective || j.business_purpose || '').trim() !== '') return true;
    if (j.period_start != null || j.period_end != null) return true;
    if (j.team_size_role != null || j.scale_role != null) return true;
    return false;
  };
  const firstNonEmptyJobArray = (...candidates) => {
    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) return c;
    }
    return null;
  };
  /** Một số API trả job_history là chuỗi JSON. */
  const asJobArray = (v) => {
    if (Array.isArray(v) && v.length > 0) return v;
    if (typeof v === 'string' && v.trim().startsWith('[')) {
      try {
        const a = JSON.parse(v);
        return Array.isArray(a) && a.length > 0 ? a : null;
      } catch {
        return null;
      }
    }
    return null;
  };
  /**
   * Tìm mảng 職務経歴 (chi tiết) trong object shokumu khi tên key lệch / lồng 1 tầng.
   * Không dùng root.job_history vì dễ trùng 2 mục 履歴書 職歴.
   */
  const findShokumuJobListDeep = (o, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 2) return null;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'qualifications' || k === 'skills_and_knowledge' || k === 'licenses_qualifications') continue;
      const arr = asJobArray(v);
      if (arr && arr.some(isShokumuJobEntryShape)) return arr;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const inner = findShokumuJobListDeep(v, depth + 1);
        if (inner) return inner;
      }
    }
    return null;
  };
  /** 職務経歴書 job_history: gom từ shokumu_keirekisho (ưu) + vài cách trả lệch từ parser. */
  const resolveShokumuJobList = (rootObj, shokumuObj) => {
    const fromStandard = firstNonEmptyJobArray(
      asJobArray(shokumuObj?.job_history),
      asJobArray(shokumuObj?.jobHistory)
    );
    if (fromStandard) return fromStandard;
    const fromDeep = findShokumuJobListDeep(shokumuObj);
    if (fromDeep) return fromDeep;
    const jRoot = firstNonEmptyJobArray(
      asJobArray(rootObj?.job_history),
      asJobArray(rootObj?.shokumu_job_history),
      asJobArray(rootObj?.shokumuJobHistory)
    );
    if (jRoot?.length && jRoot.every((j) => isShokumuJobEntryShape(j))) {
      return jRoot;
    }
    const wh = shokumuObj?.work_history || shokumuObj?.working_history;
    if (Array.isArray(wh) && wh.length > 0 && wh.some(isShokumuJobEntryShape)) {
      return wh;
    }
    return null;
  };
  const normalizeShokumuJobItem = (job) => {
    if (!job || typeof job !== 'object') return job;
    return {
      ...job,
      period_start: job.period_start ?? job.start_date,
      period_end: job.period_end ?? job.end_date,
    };
  };
  const hasSchemaShape = hasV2NestedResumeShape;
  const rawRoot = unwrapAiParsePayload(parsedData);
  const root = hasV3FlatResumeShape(rawRoot)
    ? normalizeV3FlatResumeToLegacyRoot(rawRoot)
    : rawRoot;
  const rrRaw = root.rirekisho;
  const rr = (() => {
    const p = tryParseJson(rrRaw);
    return p && typeof p === 'object' && !Array.isArray(p) ? p : (rrRaw && typeof rrRaw === 'object' && !Array.isArray(rrRaw) ? rrRaw : {});
  })();
  const skRaw =
    root.shokumu_keirekisho ||
    root.shokumuKeirekisho ||
    root.shokumu ||
    root.shokumukeirekisho ||
    root.shokumi_keirekisho;
  const sk = (() => {
    const p = tryParseJson(skRaw);
    if (p && typeof p === 'object' && !Array.isArray(p)) return p;
    if (skRaw && typeof skRaw === 'object' && !Array.isArray(skRaw)) return skRaw;
    return {};
  })();
  const rrWorkList = rr.work_history || rr.working_history || rr.workExperiences || rr.work_experiences;
  const skJobListRaw = resolveShokumuJobList(root, sk);
  const skJobList = skJobListRaw?.length
    ? skJobListRaw.map(normalizeShokumuJobItem)
    : null;

  /** 職務要約 — chỉ từ shokumu, không dùng rirekisho.self_pr (自己PR) */
  const shokumuSummaryForYokyu = (() => {
    if (!sk || typeof sk !== 'object') return null;
    for (const k of ['summary', 'career_summary', 'job_summary']) {
      const v = sk[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return null;
  })();

  let birthDateValue = normalizeBirthDateFromAi(rr.birth_date || '');
  if (birthDateValue && typeof birthDateValue === 'string' && !birthDateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parsedDate = new Date(birthDateValue);
    if (!isNaN(parsedDate.getTime())) {
      birthDateValue = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    } else {
      birthDateValue = '';
    }
  }
  const calculatedAge = birthDateValue
    ? calculateAge(new Date(birthDateValue))
    : (rr.age != null ? String(rr.age) : '');

  const mapSpouseFlag = (val) => {
    if (val === true) return '有';
    if (val === false) return '無';
    return '';
  };

  // education_history: 1 item = 1 dòng form. Chuẩn hóa dữ liệu dạng năm/tháng để khớp ô nhập.
  const mappedEducations = rr.education_history?.length > 0
    ? rr.education_history.map(edu => {
        const startYm = extractYearMonth(edu.start_date || '');
        const endRaw = String(edu.end_date || '').trim();
        const endIsCurrent = /^(nay|現在|present|current)$/i.test(endRaw) || endRaw.includes('現在');
        const endYm = endIsCurrent ? { year: '', month: '' } : extractYearMonth(endRaw);
        return {
          school_name: (edu.school_name || '').trim(),
          major: (edu.major || '').trim(),
          year: startYm.year,
          month: startYm.month,
          endYear: endYm.year,
          endMonth: endYm.month,
          content: [edu.school_name, edu.major].filter(Boolean).join(' / ') || ''
        };
      })
    : null;

  // licenses_qualifications (v2) hoặc qualifications (v3) -> certificates
  const mappedCertificates = rr.licenses_qualifications?.length > 0
    ? rr.licenses_qualifications.map(lic => ({
        year: lic.year != null ? String(lic.year) : '',
        month: lic.month != null ? String(lic.month) : '',
        name: lic.name || ''
      }))
    : mapQualificationsToCertificates(rr.qualifications)
      ?? mapQualificationsToCertificates(sk.qualifications);

  // work_history (rirekisho): mỗi item là 1 công ty. Mỗi công ty có thể chứa nhiều project từ shokumu.job_history.
  const workFromRirekisho = rrWorkList?.length > 0
    ? normalizeWorkHistoryRows(rrWorkList.map((w) => {
        const merged = mergeShokumuDetailsOntoRirekishoItem(w, skJobList);
        return {
          ...w,
          business_objective: merged.business_purpose,
          team_size_role: merged.scale_role,
          responsibilities: merged.description,
          tools: merged.tools_tech,
          reason_for_leaving: merged.reason_for_leaving,
          projects: Array.isArray(w?.projects) ? w.projects : [],
        };
      }))
    : null;

  const attachProjectsToWorkHistory = (workList, projectList) => {
    const works = (Array.isArray(workList) ? workList : []).map((work) => ({ ...work, projects: [] }));
    const projects = Array.isArray(projectList) ? projectList : [];
    projects.forEach((job, jobIndex) => {
      const periodStart = parseApiDateToYearMonth(job.period_start || '');
      const periodEnd = parseApiDateToYearMonth(job.period_end || '');
      const mappedProject = {
        project_name: job.project_name || job.name || job.business_objective || job.business_purpose || '',
        role: job.role || job.project_role || job.position || '',
        team_size: job.team_size || job.teamSize || job.team_size_role || job.scale_role || '',
        description: job.responsibilities || job.description || '',
        tools_tech: toolsTextFromShokumuJob(job),
        startYear: periodStart.year,
        startMonth: periodStart.month,
        endYear: periodEnd.year,
        endMonth: periodEnd.month,
        period: buildProjectPeriodText({
          startYear: periodStart.year,
          startMonth: periodStart.month,
          endYear: periodEnd.year,
          endMonth: periodEnd.month,
          period: `${job.period_start || ''} ～ ${job.period_end || ''}`,
        }),
      };
      let targetIndex = works.findIndex((work) => companyNamesLikelySameRirekiShokumu(work.company_name, job.company_name) && rirekishoJobPeriodOverlaps(work, job));
      if (targetIndex < 0) {
        const counts = works.map((w) => (w.projects || []).length);
        const minCount = counts.length ? Math.min(...counts) : 0;
        targetIndex = counts.indexOf(minCount);
      }
      if (targetIndex < 0) targetIndex = jobIndex % Math.max(1, works.length);
      if (works[targetIndex]) works[targetIndex].projects = [...(works[targetIndex].projects || []), mappedProject];
    });
    return works;
  };

  const ymToComparable = (ym) => {
    if (!ym?.year) return null;
    return parseInt(ym.year, 10) * 12 + (parseInt(ym.month || '1', 10) || 1);
  };
  const minYearMonth = (a, b) => {
    const ca = ymToComparable(a);
    const cb = ymToComparable(b);
    if (ca == null) return b;
    if (cb == null) return a;
    return ca <= cb ? a : b;
  };
  const maxYearMonth = (a, b) => {
    const ca = ymToComparable(a);
    const cb = ymToComparable(b);
    if (ca == null) return b;
    if (cb == null) return a;
    return ca >= cb ? a : b;
  };

  /**
   * Khi 履歴書.work_history rỗng nhưng 職務経歴書.job_history có dữ liệu:
   * gom theo công ty → mỗi công ty 1 block + projects từ từng dự án.
   */
  const buildWorkExperiencesWhenOnlyShokumu = (jobs) => {
    if (!jobs?.length) return null;
    const groups = [];
    jobs.forEach((job) => {
      const company = String(job.company_name || job.companyName || '').trim();
      let group = groups.find((g) => companyNamesLikelySameRirekiShokumu(g.company_name, company));
      if (!group) {
        groups.push({ company_name: company, jobs: [job] });
      } else {
        group.jobs.push(job);
      }
    });

    const syntheticRows = groups.map((g) => {
      let startYm = { year: '', month: '' };
      let endYm = { year: '', month: '' };
      let endCurrent = false;
      g.jobs.forEach((job) => {
        const s = extractYearMonth(job.period_start || job.start_date || '');
        startYm = minYearMonth(startYm, s);
        const endRaw = String(job.period_end || job.end_date || '').trim();
        if (/^(nay|現在|present|current)$/i.test(endRaw) || endRaw.includes('現在')) {
          endCurrent = true;
        } else {
          const e = extractYearMonth(endRaw);
          endYm = maxYearMonth(endYm, e);
        }
      });
      const startDate = [startYm.year, startYm.month].filter(Boolean).join('/');
      const endDate = endCurrent
        ? '現在'
        : [endYm.year, endYm.month].filter(Boolean).join('/');
      const w = {
        company_name: g.company_name,
        start_date: startDate || g.jobs[0]?.period_start || g.jobs[0]?.start_date || '',
        end_date: endDate || g.jobs[g.jobs.length - 1]?.period_end || g.jobs[g.jobs.length - 1]?.end_date || '',
      };
      const merged = mergeShokumuDetailsOntoRirekishoItem(w, g.jobs);
      return {
        ...w,
        business_objective: merged.business_purpose,
        team_size_role: merged.scale_role,
        responsibilities: merged.description,
        tools: merged.tools_tech,
        reason_for_leaving: merged.reason_for_leaving,
        projects: [],
      };
    });

    const normalized = normalizeWorkHistoryRows(syntheticRows);
    return attachProjectsToWorkHistory(normalized, jobs);
  };

  // job_history (shokumu): danh sách project / việc đã làm, sẽ được gắn vào công ty tương ứng
  const workFromShokumu = workFromRirekisho?.length > 0
    ? attachProjectsToWorkHistory(workFromRirekisho, skJobList)
    : null;
  const workFromShokumuOnly =
    !workFromRirekisho?.length && skJobList?.length > 0
      ? buildWorkExperiencesWhenOnlyShokumu(skJobList)
      : null;
  const workFromRirekishoWithProjects = workFromRirekisho?.length > 0
    ? attachProjectsToWorkHistory(workFromRirekisho, rrWorkList?.flatMap((w) => Array.isArray(w?.projects) ? w.projects : []) || [])
    : null;

  // qualifications (shokumu): [{ name, acquired_date }] -> merge into certificates if we use shokumu certs
  const certsFromShokumu = sk.qualifications?.length > 0
    ? sk.qualifications.map(q => {
        const { year, month } = parseApiDateToYearMonth(q.acquired_date || '');
        return { year, month, name: q.name || '' };
      })
    : null;
  
  return {
    ...prev,
    nameKanji: rr.full_name || prev.nameKanji,
    nameKana: rr.name_furigana || prev.nameKana,
    birthDate: birthDateValue || prev.birthDate,
    age: calculatedAge || prev.age,
    gender: rr.gender || prev.gender,
    postalCode: rr.postal_code || prev.postalCode,
    address: rr.address || prev.address,
    phone: rr.phone || prev.phone,
    email: rr.email || prev.email,
    addressOrigin: rr.emergency_contact_address || prev.addressOrigin,
    nearestStationName: rr.nearest_station || prev.nearestStationName,
    dependentsCount: rr.dependents_count != null ? String(rr.dependents_count) : prev.dependentsCount,
    hasSpouse: rr.has_spouse != null ? mapSpouseFlag(rr.has_spouse) : prev.hasSpouse,
    spouseDependent: rr.spouse_support_obligation != null ? mapSpouseFlag(rr.spouse_support_obligation) : prev.spouseDependent,
    jpResidenceStatus: rr.residence_status || prev.jpResidenceStatus,
    visaExpirationDate: rr.residence_expiry || prev.visaExpirationDate,
    stayPurpose: rr.stay_purpose || rr.stayPurpose || prev.stayPurpose,
    jpConversationLevel: rr.jp_conversation_level || rr.jpConversationLevel || prev.jpConversationLevel,
    enConversationLevel: rr.en_conversation_level || rr.enConversationLevel || prev.enConversationLevel,
    otherConversationLevel: rr.other_conversation_level || rr.otherConversationLevel || prev.otherConversationLevel,
    cvDocumentDate: rr.creation_date || sk.creation_date || prev.cvDocumentDate,

    educations: mappedEducations ?? prev.educations,
    certificates: mappedCertificates ?? (certsFromShokumu?.length ? certsFromShokumu : prev.certificates),
    workExperiences:
      workFromShokumu ??
      workFromShokumuOnly ??
      workFromRirekishoWithProjects ??
      workFromRirekisho ??
      (rrWorkList?.length > 0
        ? rrWorkList.map((w) => ({ ...w, projects: Array.isArray(w?.projects) ? w.projects : [] }))
        : skJobList?.length > 0
          ? normalizeWorkHistoryRows(skJobList)
          : prev.workExperiences),
    workHistoryCount:
      workFromShokumu?.length > 0
        ? workFromShokumu.length
        : workFromShokumuOnly?.length > 0
          ? workFromShokumuOnly.length
          : workFromRirekishoWithProjects?.length > 0
            ? workFromRirekishoWithProjects.length
            : rrWorkList?.length > 0
              ? rrWorkList.length
              : skJobList?.length > 0
                ? skJobList.length
                : prev.workHistoryCount,

    technicalSkills: sk.skills_and_knowledge?.length > 0 ? sk.skills_and_knowledge.join(', ') : prev.technicalSkills,
    careerSummary: shokumuSummaryForYokyu != null ? shokumuSummaryForYokyu : prev.careerSummary,
    strengths: rr.self_pr || sk.self_pr || prev.strengths,
    hobbiesSpecialSkills: rr.hobbies_skills || prev.hobbiesSpecialSkills,
    motivation: rr.motivation || prev.motivation,

    currentSalary: rr.current_salary != null ? String(rr.current_salary) : prev.currentSalary,
    desiredSalary: rr.expected_salary != null ? String(rr.expected_salary) : prev.desiredSalary,
    desiredPosition: rr.desired_role || prev.desiredPosition,
    desiredLocation: rr.desired_location || prev.desiredLocation,
    desiredStartDate: rr.available_start_date || prev.desiredStartDate,
    jobCategoryId: (root.applied_position != null ? String(root.applied_position) : '') || prev.jobCategoryId || '',
    jlptLevel: inferJlptLevelFromParsed(rr, mappedCertificates) || prev.jlptLevel || '',
    cvTableLayout: (() => {
      const v = root.cvTableLayout;
      if (v == null) return prev.cvTableLayout;
      if (typeof v === 'object' && !Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          const t = v.trim();
          return t ? JSON.parse(v) : prev.cvTableLayout;
        } catch {
          return prev.cvTableLayout;
        }
      }
      return prev.cvTableLayout;
    })(),
  };
}

/** Chỉ các trường hiển thị trên QuickCreate — phần còn lại giữ trong parsedFormData ngầm. */
export function mapMergedToQuickCreateVisibleForm(merged, prevVisible = {}) {
  return {
    nameKanji: merged.nameKanji || prevVisible.nameKanji || '',
    birthDate: merged.birthDate || prevVisible.birthDate || '',
    email: merged.email || prevVisible.email || '',
    phone: merged.phone || prevVisible.phone || '',
    jlptLevel: merged.jlptLevel != null && String(merged.jlptLevel).trim() !== ''
      ? String(merged.jlptLevel)
      : (prevVisible.jlptLevel || ''),
    experienceYears: merged.experienceYears != null && String(merged.experienceYears).trim() !== ''
      ? String(merged.experienceYears)
      : (prevVisible.experienceYears || ''),
    jobCategoryId: merged.jobCategoryId != null && String(merged.jobCategoryId).trim() !== ''
      ? String(merged.jobCategoryId)
      : (prevVisible.jobCategoryId || ''),
    jobCategoryLabel: prevVisible.jobCategoryLabel || '',
    currentSalary: normalizeSalaryValue(merged.currentSalary || prevVisible.currentSalary || ''),
    desiredSalary: normalizeSalaryValue(merged.desiredSalary || prevVisible.desiredSalary || ''),
    desiredPosition: merged.desiredPosition || prevVisible.desiredPosition || '',
    desiredLocation: merged.desiredLocation || prevVisible.desiredLocation || '',
    desiredStartDate: merged.desiredStartDate || prevVisible.desiredStartDate || '',
    jpResidenceStatus: merged.jpResidenceStatus != null && String(merged.jpResidenceStatus).trim() !== ''
      ? String(merged.jpResidenceStatus)
      : (prevVisible.jpResidenceStatus || ''),
  };
}

/** Gắn toàn bộ field CV (giống AddCandidateForm) vào FormData — dùng cho quick create lưu ngầm. */
export function appendFullCvFieldsToFormData(fd, data = {}) {
  const append = (key, value) => {
    if (value == null) return;
    fd.set(key, value);
  };
  const appendJson = (key, value) => {
    if (value == null) return;
    if (Array.isArray(value) && value.length === 0) return;
    fd.set(key, JSON.stringify(value));
  };

  append('nameKanji', data.nameKanji || '');
  append('nameKana', data.nameKana || '');
  append('birthDate', data.birthDate || '');
  append('age', data.age || '');
  let genderValue = data.gender || '';
  if (genderValue === '男') genderValue = '1';
  else if (genderValue === '女') genderValue = '2';
  append('gender', genderValue);
  append('postalCode', data.postalCode || '');
  append('address', data.address || '');
  append('phone', data.phone || '');
  append('email', data.email || '');
  append('addressOrigin', data.addressOrigin || '');
  if (data.nearestStationLine) append('nearestStationLine', data.nearestStationLine);
  if (data.nearestStationName) append('nearestStationName', data.nearestStationName);
  if (data.dependentsCount !== '' && data.dependentsCount != null) append('dependentsCount', String(data.dependentsCount));
  if (data.hasSpouse) append('hasSpouse', data.hasSpouse === '有' ? '1' : '0');
  if (data.spouseDependent) append('spouseDependent', data.spouseDependent === '有' ? '1' : '0');
  if (data.jpResidenceStatus) append('jpResidenceStatus', String(data.jpResidenceStatus));
  if (data.stayPurpose) append('stayPurpose', data.stayPurpose);
  if (data.jpConversationLevel !== '' && data.jpConversationLevel != null) {
    append('jpConversationLevel', String(data.jpConversationLevel));
  }
  if (data.enConversationLevel !== '' && data.enConversationLevel != null) {
    append('enConversationLevel', String(data.enConversationLevel));
  }
  if (data.otherConversationLevel !== '' && data.otherConversationLevel != null) {
    append('otherConversationLevel', String(data.otherConversationLevel));
  }
  append('visaExpirationDate', data.visaExpirationDate || '');
  appendJson('educations', data.educations);
  appendJson('workExperiences', data.workExperiences);
  appendJson('certificates', data.certificates);
  if (data.learnedTools?.length) appendJson('learnedTools', data.learnedTools);
  if (data.experienceTools?.length) appendJson('experienceTools', data.experienceTools);
  append('technicalSkills', data.technicalSkills || '');
  if (data.jlptLevel) append('jlptLevel', String(data.jlptLevel));
  if (data.experienceYears !== '' && data.experienceYears != null) {
    append('experienceYears', String(data.experienceYears));
  }
  append('careerSummary', data.careerSummary || '');
  append('strengths', data.strengths || '');
  append('motivation', data.motivation || '');
  append('hobbiesSpecialSkills', data.hobbiesSpecialSkills || '');
  append('currentSalary', data.currentSalary || '');
  append('desiredSalary', data.desiredSalary || '');
  append('desiredPosition', data.desiredPosition || '');
  append('jobCategoryId', data.jobCategoryId || '');
  append('desiredLocation', data.desiredLocation || '');
  append('desiredStartDate', data.desiredStartDate || '');
  if (data.cvTableLayout && typeof data.cvTableLayout === 'object') {
    append('cvTableLayout', JSON.stringify(data.cvTableLayout));
  }
  if (data.residence_status) append('residence_status', String(data.residence_status));
  if (data.residenceStatus) append('residenceStatus', String(data.residenceStatus));
}
