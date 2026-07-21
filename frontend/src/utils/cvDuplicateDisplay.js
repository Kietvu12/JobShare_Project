/**
 * Hiển thị hồ sơ tham chiếu khi duplicate_with_cv_id (admin list/detail).
 */

export function getDuplicateWithCvId(candidate) {
  const v = candidate?.duplicateWithCvId ?? candidate?.duplicate_with_cv_id;
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Nhãn hiển thị hồ sơ gốc bị trùng — ưu tiên CTV + mã hồ sơ, tránh lặp tên ứng viên.
 * @param {object} ref — duplicateWithCv từ API
 * @param {number} dupId
 */
export function buildDuplicateRefDisplayLabel(ref, dupId) {
  const cvCode = (ref?.code || '').trim();
  const cvPart = cvCode || `#${dupId}`;
  const ctv = ref?.collaborator;
  const applicant = ref?.applicant;
  const admin = ref?.admin;

  if (ctv?.id) {
    const ctvLabel = [ctv.name, ctv.code ? `(${ctv.code})` : ''].filter(Boolean).join(' ').trim();
    return ctvLabel ? `${ctvLabel} — ${cvPart}` : cvPart;
  }
  if (applicant?.id) {
    const apLabel = [applicant.name, applicant.email ? `(${applicant.email})` : ''].filter(Boolean).join(' ').trim();
    return apLabel ? `${apLabel} — ${cvPart}` : cvPart;
  }
  if (admin?.id) {
    const adminLabel = admin.name || `Admin #${admin.id}`;
    return `${adminLabel} — ${cvPart}`;
  }
  const name = (ref?.name || '').trim();
  return name && name !== cvPart ? `${name} — ${cvPart}` : cvPart;
}

/**
 * @param {object} candidate — một dòng CV từ API (có thể có duplicateWithCv)
 * @param {{ language?: string, t?: object }} [opts]
 * @returns {{ dupId: number, profileLabel: string, tooltip: string, ref: object|null, ownerLines: array } | null}
 */
export function formatDuplicateWithCvRef(candidate, opts = {}) {
  const dupId = getDuplicateWithCvId(candidate);
  if (!dupId) return null;
  const ref = candidate?.duplicateWithCv;
  const ownerLines = getDuplicateOwnerDisplayLines(ref, opts);
  const profileLabel = buildDuplicateRefDisplayLabel(ref, dupId);
  const ctv = ref?.collaborator;
  const tooltip = ctv?.id
    ? `${opts.t?.colCtvName || 'Cộng tác viên'}: ${[ctv.name, ctv.code ? `(${ctv.code})` : ''].filter(Boolean).join(' ')} · ${profileLabel} (#${dupId})`
    : `${profileLabel} (#${dupId})`;
  return { dupId, profileLabel, tooltip, ref, ownerLines };
}

/** Mở trang chi tiết hồ sơ ứng viên (admin/CTV) trong tab mới. */
export function openCandidateProfileInNewTab(candidateId, { basePath = '/admin/candidates' } = {}) {
  const id = Number(candidateId);
  if (!Number.isFinite(id) || id <= 0) return;
  const path = `${String(basePath).replace(/\/$/, '')}/${id}`;
  window.open(path, '_blank', 'noopener,noreferrer');
}

/**
 * @param {object} ref — duplicateWithCv từ API
 * @param {{ language?: string, t?: object }} [opts]
 */
export function getDuplicateOwnerDisplayLines(ref, opts = {}) {
  if (!ref) return [];
  const { language = 'vi', t = {} } = opts;
  const lines = [];
  const ctv = ref.collaborator;
  const applicant = ref.applicant;
  const admin = ref.admin;

  if (ctv?.id) {
    lines.push({
      key: 'collaborator',
      label: t.colCtvName || (language === 'en' ? 'Collaborator' : language === 'ja' ? 'CTV' : 'Cộng tác viên'),
      value: [ctv.name, ctv.code ? `(${ctv.code})` : '', ctv.email ? `— ${ctv.email}` : ''].filter(Boolean).join(' ').trim(),
      href: `/admin/collaborators/${ctv.id}`,
    });
  }
  if (applicant?.id) {
    lines.push({
      key: 'applicant',
      label: t.colApplicant || (language === 'en' ? 'Applicant' : language === 'ja' ? '応募者' : 'Ứng viên landing'),
      value: [applicant.name, applicant.email ? `— ${applicant.email}` : ''].filter(Boolean).join(' ').trim(),
      href: null,
    });
  }
  if (admin?.id && !ctv?.id && !applicant?.id) {
    lines.push({
      key: 'admin',
      label: t.colAdminName || 'Admin',
      value: [admin.name, admin.email ? `— ${admin.email}` : ''].filter(Boolean).join(' ').trim(),
      href: null,
    });
  }
  return lines;
}
