import {
  applyMultilingualJdOutputToFormState,
  applyParsedJdToFormState,
  createEmptyJdFormState,
  normalizeJdDraft,
} from './applyParsedJdToFormState';

const SESSION_PREFILL_KEY = 'wjs_jd_builder_prefill';

export function saveJdBuilderPrefill(finalizeResult) {
  if (!finalizeResult) return;
  try {
    sessionStorage.setItem(SESSION_PREFILL_KEY, JSON.stringify(finalizeResult));
  } catch {
    /* ignore quota */
  }
}

export function consumeJdBuilderPrefill() {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_PREFILL_KEY);
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_PREFILL_KEY);
    return null;
  }
}

/**
 * Chuyển kết quả finalize/translate JD Builder → patch cho AddJobPage (business).
 * Dùng cùng logic mapping với parse JD.
 */
export function buildAddJobPatchFromJdBuilder(finalizeResult) {
  const empty = createEmptyJdFormState();
  const jdOutput = finalizeResult?.jd_output;

  let state;
  if (jdOutput && (jdOutput.vi || jdOutput.en || jdOutput.jp)) {
    state = applyMultilingualJdOutputToFormState(jdOutput, empty);
  } else {
    const jd = normalizeJdDraft(finalizeResult?.jd || finalizeResult);
    state = applyParsedJdToFormState(jd, {
      prevFormData: empty.formData,
      prevRecruitingCompany: empty.recruitingCompany,
      prevWorkingLocations: empty.workingLocations,
      prevHighlightKeys: empty.highlightKeys,
    });
  }

  return {
    languageTab: state.languageTab || 'vi',
    formDataPatch: state.formData || empty.formData,
    recruitingCompanyPatch: state.recruitingCompany || empty.recruitingCompany,
    requirements: state.requirements || [],
    workingLocations: state.workingLocations || [],
    workingLocationDetails: state.workingLocationDetails || [],
    salaryRanges: state.salaryRanges,
    salaryRangeDetails: state.salaryRangeDetails || [],
    workingHours: state.workingHours,
    workingHourDetails: state.workingHourDetails,
    overtimeAllowances: state.overtimeAllowances,
    overtimeAllowanceDetails: state.overtimeAllowanceDetails,
    jobBenefitRows: state.jobBenefitRows,
    highlightKeys: state.highlightKeys || [],
  };
}
