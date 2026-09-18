import { getJobApplicationStatus } from '../constants/jobApplicationStatus.js';

function pickJobSummary(job) {
  if (!job) return null;
  const json = job?.toJSON ? job.toJSON() : job;
  return {
    id: json.id,
    title: json.title || null,
    titleEn: json.titleEn || json.title_en || null,
    titleJp: json.titleJp || json.title_jp || null,
    jobCode: json.jobCode || json.job_code || null,
    status: json.status ?? null,
  };
}

/**
 * Payload gọn cho UI khi báo đơn tiến cử đã tồn tại.
 */
export function formatJobApplicationSummary(application, jobOverride = null) {
  if (!application) return null;
  const json = application?.toJSON ? application.toJSON() : application;
  const statusMeta = getJobApplicationStatus(json.status);
  const collaboratorId = json.collaboratorId ?? json.collaborator_id ?? null;
  const job = pickJobSummary(jobOverride || json.job);

  return {
    id: json.id,
    status: json.status,
    statusLabel: statusMeta.label,
    statusCategory: statusMeta.category,
    appliedAt: json.appliedAt || json.applied_at || null,
    memo: json.memo || null,
    cvId: json.cvId ?? json.cv_id ?? null,
    cvCode: json.cvCode ?? json.cv_code ?? null,
    jobId: json.jobId ?? json.job_id ?? null,
    collaboratorId,
    createdByBusiness: collaboratorId == null,
    job,
  };
}
