import { localizedJobValueLabel } from './jobValueLocalizedLabel.js';

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

const feeValueNameOf = (jv) =>
  String(
    jv?.valueRef?.valuename ??
      jv?.valueRef?.valuenameEn ??
      jv?.valueRef?.valuename_en ??
      jv?.valueRef?.valuenameJp ??
      jv?.valueRef?.valuename_jp ??
      jv?.valueRef?.name ??
      ''
  ).toLowerCase();

/** Phí qua sàn JobShare (vd. «Phí thông qua sàn») — không phải phí trực tiếp cho CTV. */
export function isPlatformFeeJobValue(jv) {
  const name = feeValueNameOf(jv);
  if (
    name.includes('thông qua sàn') ||
    name.includes('qua sàn') ||
    name.includes('through platform') ||
    name.includes('jobshare nhận') ||
    name.includes('sàn ctv')
  ) {
    return true;
  }
  const vid = vidOf(jv);
  if (vid === 6 && !name.includes('trực tiếp') && !name.includes('direct')) {
    return true;
  }
  return false;
}

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
 * Lọc job_values hiển thị trên banner phí (card/chi tiết) — giữ đủ mọi điều kiện.
 */
export function filterJobValuesForCommissionBannerDisplay(allJobValues) {
  return filterJobValuesForCommission(allJobValues);
}

/**
 * Lọc job_values dùng để hiển thị/tính phí CTV.
 * Bao gồm cả điều kiện tùy chỉnh (vd. thời gian gia nhập) khi đã có `value`.
 * Bỏ qua valueId=34 rỗng (tránh fallback "Liên hệ" oan).
 */
export function filterJobValuesForCtvCommissionDisplay(allJobValues) {
  return filterJobValuesForCommissionBannerDisplay(allJobValues);
}

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
export function shouldHideCommissionConditionLabel(jobValuesForCommission, job = null) {
  const rows = Array.isArray(jobValuesForCommission) ? jobValuesForCommission : [];
  return rows.some((jv) => {
    if (vidOf(jv) === 34 && isActiveContactCommissionJobValue(jv)) return true;
    if (job && isDirectFixedCtvCommissionJobValue(jv, job)) return true;
    if (isPlatformFeeJobValue(jv)) return rows.length === 1;
    const name = feeValueNameOf(jv);
    if (name.includes('trực tiếp') || name.includes('direct')) return true;
    return vidOf(jv) === 7;
  });
}

/** Banner 1 dòng (không tách điều kiện) — chỉ khi có đúng 1 tier và tier đó thuộc loại ẩn nhãn. */
export function shouldUseCollapsedCommissionBanner(jobValuesForCommission, job = null) {
  const rows = Array.isArray(jobValuesForCommission) ? jobValuesForCommission : [];
  if (rows.length !== 1) return false;
  return shouldHideCommissionConditionLabel(rows, job);
}

/**
 * Phí cố định trực tiếp cho CTV: hiển thị đúng số đã nhập, không nhân % level CTV.
 * valueId 6 mặc định là phí qua sàn — chỉ coi trực tiếp khi tên ghi rõ hoặc valueId 7 (legacy).
 */
export function isDirectFixedCtvCommissionJobValue(jv, job) {
  if (normalizeJobCommissionType(job) !== 'fixed') return false;
  if (isPlatformFeeJobValue(jv)) return false;
  const name = feeValueNameOf(jv);
  if (name.includes('trực tiếp') || name.includes('direct')) return true;
  return vidOf(jv) === 7;
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

function resolveCommissionUiLang(language) {
  if (language === 'en') return 'en';
  if (language === 'ja' || language === 'jp') return 'ja';
  return 'vi';
}

function commissionContactLabel(language) {
  const lang = resolveCommissionUiLang(language);
  if (lang === 'en') return 'Contact';
  if (lang === 'ja') return 'お問い合わせ';
  return 'Liên hệ';
}

function commissionTypeDisplayName(type, language) {
  const raw = String(type?.typename || type?.name || '').trim();
  const lang = resolveCommissionUiLang(language);
  const lower = raw.toLowerCase();
  if (lang === 'en') {
    if (!raw || lower === 'phí' || lower === 'commission') return 'Fee';
    return raw;
  }
  if (lang === 'ja') {
    if (!raw || lower === 'phí' || lower === 'commission') return '手数料';
    return raw;
  }
  return raw || 'Phí';
}

function formatCommissionAmount(num, commissionType, language) {
  const lang = resolveCommissionUiLang(language);
  if (commissionType === 'percent') {
    if (lang === 'en') return `${num}% of first-year income`;
    if (lang === 'ja') return `${num}%（初年度年収）`;
    return `${num}% thu nhập năm đầu`;
  }
  const locale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';
  const suffix = lang === 'en' ? ' JPY (fixed)' : lang === 'ja' ? ' 円（固定）' : 'đ (cố định)';
  return `${Number(num).toLocaleString(locale)}${suffix}`;
}

/** Nhãn phí đọc từ job (điều kiện phí khi tạo JD) — dùng modal đăng sàn CTV */
export function formatJobCommissionSummary(job, language = 'vi') {
  const contactLabel = commissionContactLabel(language);
  if (!job) return contactLabel;

  const lang = resolveCommissionUiLang(language);
  const campaignPct = resolveCampaignPercentFromJob(job);
  if (campaignPct != null && campaignPct > 0) {
    if (lang === 'en') return `Campaign: ${campaignPct}% of first-year income`;
    if (lang === 'ja') return `キャンペーン: 初年度年収の${campaignPct}%`;
    return `Campaign: ${campaignPct}% thu nhập năm`;
  }

  const commissionType = normalizeJobCommissionType(job);
  const rows = filterJobValuesForCommission(job.jobValues || job.profits || []);
  if (!rows.length) return contactLabel;

  return rows
    .map((jv) => {
      const typeName = commissionTypeDisplayName(jv.type, language);
      const valueRefName = localizedJobValueLabel(lang, jv.valueRef || jv.value_ref);
      const label = valueRefName ? `${typeName}: ${valueRefName}` : typeName;
      const raw = jv.value;
      if (raw == null || raw === '') {
        const display = String(jv.viewOnCollaborator ?? jv.view_on_collaborator ?? '').trim();
        return display ? `${label}: ${display}` : label;
      }
      const num = parseFloat(String(raw));
      if (!Number.isFinite(num)) return `${label}: ${raw}`;
      return `${label}: ${formatCommissionAmount(num, commissionType, language)}`;
    })
    .join('\n');
}

/** Thu nhỏ chữ tên điều kiện phí khi quá dài — tránh cắt bằng line-clamp. */
export function commissionTierLabelFontClass(text) {
  const len = String(text ?? '').trim().length;
  if (len > 36) return 'text-[8px] sm:text-[9px]';
  if (len > 24) return 'text-[9px] sm:text-[10px]';
  if (len > 16) return 'text-[9px] sm:text-[10px]';
  return 'text-[10px] sm:text-[11px]';
}
