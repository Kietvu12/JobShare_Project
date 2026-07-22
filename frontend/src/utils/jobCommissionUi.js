/**
 * API có thể trả jobCommissionType (camel) hoặc job_commission_type (snake).
 * Nếu chỉ đọc một kiểu, job percent bị coi nhầm là fixed → % campaign không áp vào effectivePercent (list 30% / detail 40%).
 */
export function normalizeJobCommissionType(job) {
  const raw = job?.jobCommissionType ?? job?.job_commission_type ?? 'fixed';
  const s = String(raw).toLowerCase();
  if (s === 'percent' || s === 'percentage') return 'percent';
  return 'fixed';
}

/**
 * Lấy % campaign từ job: duyệt mọi dòng job_campaigns (không chỉ [0] — thứ tự JOIN có thể
 * khiến phần tử đầu không có object campaign/percent dù job vẫn thuộc campaign).
 */
export function resolveCampaignPercentFromJob(job) {
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

const COMMISSION_TYPE_IDS = [1, 2, 3, 4];

const tidOf = (jv) => Number(jv?.typeId ?? jv?.id_typename ?? jv?.type?.id ?? 0);
const vidOf = (jv) => Number(jv?.valueId ?? jv?.valueRef?.id ?? 0);
const tnameOf = (jv) => String(jv?.type?.typename || '').toLowerCase();

/** Dòng job_values có % hoặc số tiền phí đã nhập (field `value`). */
export function hasJobValueCommissionAmount(jv) {
  const v = jv?.value;
  return v !== null && v !== undefined && String(v).trim() !== '';
}

export function hasJobValueCollaboratorDisplay(jv) {
  return Boolean(String(jv?.viewOnCollaborator ?? jv?.view_on_collaborator ?? '').trim());
}

/** valueId 34 — chỉ là phí hiển thị khi admin/CTV đã nhập nội dung. */
export function isActiveContactCommissionJobValue(jv) {
  return vidOf(jv) === 34 && (hasJobValueCommissionAmount(jv) || hasJobValueCollaboratorDisplay(jv));
}

/**
 * Lọc job_values dùng để hiển thị/tính phí.
 * Bao gồm cả điều kiện tùy chỉnh (vd. thời gian gia nhập) khi đã có `value`.
 * Bỏ qua valueId=34 rỗng (tránh fallback "Liên hệ" oan).
 */
export function filterJobValuesForCommission(allJobValues) {
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

/** Ẩn cột tên điều kiện phí (chỉ hiện số tiền/%). */
export function shouldHideCommissionConditionLabel(jobValuesForCommission) {
  const rows = Array.isArray(jobValuesForCommission) ? jobValuesForCommission : [];
  return rows.some((jv) => {
    const tid = tidOf(jv);
    const valueId = vidOf(jv);
    const val = jv.value;
    const numVal = val !== null && val !== undefined && val !== '' ? Number(val) : null;
    if (valueId === 34 && isActiveContactCommissionJobValue(jv)) return true;
    return tid === 2 && (valueId === 6 || valueId === 7 || numVal === 6 || numVal === 7);
  });
}

/**
 * valueId 6/7 (Trực tiếp cho CTV): phí cố định hiển thị đúng số đã nhập, không nhân % level CTV.
 */
export function isDirectFixedCtvCommissionJobValue(jv, job) {
  if (normalizeJobCommissionType(job) !== 'fixed') return false;
  const vid = vidOf(jv);
  if (vid === 6 || vid === 7) return true;
  const name = String(
    jv?.valueRef?.valuename ?? jv?.valueRef?.valuenameEn ?? jv?.valueRef?.name ?? ''
  ).toLowerCase();
  return name.includes('trực tiếp') || name.includes('direct');
}

/** Hệ số nhân khi hiển thị phí cho CTV (admin luôn = 1). */
export function resolveCtvCommissionDisplayMultiplier(jv, job, rankMultiplier, useAdminAPI) {
  if (useAdminAPI) return 1;
  if (isDirectFixedCtvCommissionJobValue(jv, job)) return 1;
  return rankMultiplier;
}

export function isDirectFixedCtvCommissionJob(job) {
  const rows = filterJobValuesForCommission(job?.jobValues || job?.profits || []);
  const primary = pickPrimaryCommissionJobValue(rows);
  return Boolean(primary && isDirectFixedCtvCommissionJobValue(primary, job));
}

/** Nhãn banner phí trên card/chi tiết job (admin vs CTV, theo loại job value). */
export function resolveCommissionBannerLabel(job, { useAdminAPI, language = 'vi' } = {}) {
  const lang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi';
  const directCtv = isDirectFixedCtvCommissionJob(job);

  if (useAdminAPI) {
    if (directCtv) {
      if (lang === 'en') return 'Direct referral fee for CTV';
      if (lang === 'ja') return 'CTVへの直接紹介料';
      return 'Phí giới thiệu trực tiếp cho CTV';
    }
    if (lang === 'en') return 'Referral fee (JS receives)';
    if (lang === 'ja') return '紹介料（JS受取）';
    return 'Phí giới thiệu JobShare nhận từ khách hàng';
  }

  if (lang === 'en') return 'Estimated referral fee for you';
  if (lang === 'ja') return '想定紹介料（あなた）';
  return 'Phí giới thiệu dự kiến của bạn';
}

/**
 * Dòng job_values dùng để suy % phí / campaign — không dùng phần tử [0] vì filter có cả JLPT (type 1)
 * thường đứng trước dòng phí (type 2) → nhầm value 30 (JLPT) thay vì % campaign 40.
 */
/** Chỉ lưu job_values có dữ liệu phí (tránh dòng valueId=34 rỗng sau auto-expand type). */
export function isPersistableJobValue(jv) {
  if (jv?.typeId == null || String(jv.typeId).trim() === '') return false;
  if (jv?.valueId == null || String(jv.valueId).trim() === '') return false;
  if (hasJobValueCommissionAmount(jv) || hasJobValueCollaboratorDisplay(jv)) return true;
  const tid = tidOf(jv);
  const vid = vidOf(jv);
  return tid === 2 && (vid === 6 || vid === 7);
}

export function pickPrimaryCommissionJobValue(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const v34 = rows.find((jv) => isActiveContactCommissionJobValue(jv));
  if (v34) return v34;

  const feeRow = rows.find(
    (jv) =>
      (tidOf(jv) === 2 ||
        tnameOf(jv) === 'phí' ||
        tnameOf(jv) === 'commission' ||
        vidOf(jv) === 6 ||
        vidOf(jv) === 7) &&
      hasJobValueCommissionAmount(jv)
  );
  if (feeRow) return feeRow;

  const customRow = rows.find(
    (jv) =>
      hasJobValueCommissionAmount(jv) &&
      !COMMISSION_TYPE_IDS.includes(tidOf(jv)) &&
      vidOf(jv) !== 34
  );
  if (customRow) return customRow;

  const jlptTier = rows.find(
    (jv) => COMMISSION_TYPE_IDS.includes(tidOf(jv)) && tidOf(jv) !== 2 && hasJobValueCommissionAmount(jv)
  );
  if (jlptTier) return jlptTier;

  return rows.find((jv) => hasJobValueCommissionAmount(jv)) ?? rows[0];
}

/** Nhãn phí đọc từ job (điều kiện phí khi tạo JD) — dùng modal đăng sàn CTV */
export function formatJobCommissionSummary(job, language = 'vi') {
  const contactLabel = language === 'en' ? 'Contact' : language === 'ja' ? 'お問い合わせ' : 'Liên hệ';
  if (!job) return contactLabel;

  const campaignPct = resolveCampaignPercentFromJob(job);
  if (campaignPct != null && campaignPct > 0) {
    return language === 'en'
      ? `Campaign: ${campaignPct}% of annual income`
      : `Campaign: ${campaignPct}% thu nhập năm`;
  }

  const commissionType = normalizeJobCommissionType(job);
  const rows = filterJobValuesForCommission(job.jobValues || job.profits || []);
  if (!rows.length) return contactLabel;

  return rows
    .map((jv) => {
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
        return language === 'en' ? `${label}: ${num}% of annual income` : `${label}: ${num}% thu nhập năm`;
      }
      return `${label}: ${Number(num).toLocaleString('vi-VN')} Y`;
    })
    .join('\n');
}
