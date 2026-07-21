import { Job } from '../models/index.js';

/** Param route có phải id số (PK) hay slug (URL chia sẻ public). */
export function isNumericJobId(value) {
  const s = String(value ?? '').trim();
  return s !== '' && /^\d+$/.test(s);
}

/**
 * Tìm job theo id hoặc slug — dùng chung applicant/ctv public routes `/jobs/:id`.
 */
export async function findJobByIdOrSlug(idOrSlug, options = {}) {
  const raw = decodeURIComponent(String(idOrSlug ?? '').trim());
  if (!raw) return null;

  if (isNumericJobId(raw)) {
    return Job.findByPk(parseInt(raw, 10), options);
  }

  return Job.findOne({
    ...options,
    where: { slug: raw },
  });
}
