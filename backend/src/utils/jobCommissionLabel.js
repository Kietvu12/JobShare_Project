/**
 * Hiển thị điều kiện phí từ job (jobCommissionType + jobValues) — đồng bộ AddJobPage / jobCommissionUi.js
 */

const COMMISSION_TYPE_IDS = [1, 2, 3, 4];

const tidOf = (jv) => Number(jv?.typeId ?? jv?.id_typename ?? jv?.type?.id ?? 0);
const vidOf = (jv) => Number(jv?.valueId ?? jv?.valueRef?.id ?? 0);
const tnameOf = (jv) => String(jv?.type?.typename || '').toLowerCase();

function hasJobValueCommissionAmount(jv) {
  const v = jv?.value;
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function hasJobValueCollaboratorDisplay(jv) {
  return Boolean(String(jv?.viewOnCollaborator ?? jv?.view_on_collaborator ?? '').trim());
}

function isActiveContactCommissionJobValue(jv) {
  return vidOf(jv) === 34 && (hasJobValueCommissionAmount(jv) || hasJobValueCollaboratorDisplay(jv));
}

function filterJobValuesForCommission(allJobValues) {
  const rows = Array.isArray(allJobValues) ? allJobValues : [];
  return rows.filter((jv) => {
    const tid = tidOf(jv);
    const tname = tnameOf(jv);
    const vid = vidOf(jv);

    if (vid === 34) return isActiveContactCommissionJobValue(jv);
    if (tid === 2 || tname === 'phí' || tname === 'commission') {
      return hasJobValueCommissionAmount(jv) || vid === 6 || vid === 7;
    }
    if (COMMISSION_TYPE_IDS.includes(tid)) {
      return hasJobValueCommissionAmount(jv);
    }
    if (jv.type?.cvField && hasJobValueCommissionAmount(jv)) return true;
    if (hasJobValueCommissionAmount(jv) && jv.typeId != null && jv.valueId != null) return true;
    return false;
  });
}

function normalizeJobCommissionType(job) {
  const raw = job?.jobCommissionType ?? job?.job_commission_type ?? 'fixed';
  const s = String(raw).toLowerCase();
  if (s === 'percent' || s === 'percentage') return 'percent';
  return 'fixed';
}

function resolveCampaignPercentFromJob(job) {
  const rows = job?.jobCampaigns ?? job?.job_campaigns ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (const jc of rows) {
    if (!jc) continue;
    const c = jc.campaign ?? jc.Campaign;
    const raw = c != null ? c.percent : null;
    if (raw == null || raw === '') continue;
    const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : parseFloat(String(raw));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function formatTierLine(jv, commissionType) {
  const typeName = jv.type?.typename || jv.type?.name || 'Phí';
  const valueRefName = jv.valueRef?.valuename || jv.valueRef?.name || '';
  const label = valueRefName ? `${typeName}: ${valueRefName}` : typeName;
  const raw = jv.value;
  if (raw == null || raw === '') {
    const display = String(jv.viewOnCollaborator ?? jv.view_on_collaborator ?? '').trim();
    return display ? `${label}: ${display}` : label;
  }
  const num = parseFloat(String(raw));
  if (!Number.isFinite(num)) return `${label}: ${raw}`;
  if (commissionType === 'percent') {
    return `${label}: ${num}% thu nhập năm`;
  }
  return `${label}: ${Number(num).toLocaleString('vi-VN')} Y`;
}

/**
 * @param {object} job - Job có jobCommissionType, jobValues (kèm type, valueRef)
 * @returns {string} Nhãn phí nhiều dòng hoặc "Liên hệ"
 */
export function formatJobCommissionLabel(job) {
  const j = job?.toJSON ? job.toJSON() : job;
  if (!j) return 'Liên hệ';

  const campaignPct = resolveCampaignPercentFromJob(j);
  if (campaignPct != null && campaignPct > 0) {
    return `Campaign: ${campaignPct}% thu nhập năm`;
  }

  const commissionType = normalizeJobCommissionType(j);
  const rows = filterJobValuesForCommission(j.jobValues || []);
  if (!rows.length) return 'Liên hệ';

  return rows.map((jv) => formatTierLine(jv, commissionType)).join('\n');
}

export default formatJobCommissionLabel;
