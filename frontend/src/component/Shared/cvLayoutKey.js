/**
 * Khóa layout bảng — phải trùng với backend `cvTemplateHtml.js` (openFixedTable / L).
 * Format: `${template}::${tab}::${tableId}`
 */
export function cvLayoutKey(cvTemplate, tab, tableId) {
  return `${cvTemplate}::${tab}::${tableId}`;
}

/** Cột nhãn trái personalGrid (フリガナ, 氏名, Email…) — các bảng section dùng cùng %. */
export const CV_RIREKISHO_SIDE_LABEL_COL_PCT = 13;

export const CV_RIREKISHO_PERSONAL_GRID_COLS = [13, 20, 7, 19, 8, 17, 16];

/** Thu hẹp cột 顔写真 / mở rộng cột nhãn nếu layout cũ còn lưu. */
export function normalizePersonalGridColPercents(cols) {
  if (!Array.isArray(cols) || cols.length !== CV_RIREKISHO_PERSONAL_GRID_COLS.length) {
    return CV_RIREKISHO_PERSONAL_GRID_COLS;
  }
  let next = [...cols];
  const sidePct = CV_RIREKISHO_SIDE_LABEL_COL_PCT;
  if (next[0] < sidePct - 0.5) {
    const delta = sidePct - next[0];
    next[0] = sidePct;
    next[1] = Math.max(0.1, next[1] - delta * 0.45);
    next[3] = Math.max(0.1, next[3] - delta * 0.35);
    next[5] = Math.max(0.1, next[5] - delta * 0.2);
    next = normalizePercents(next);
  }
  const avatarPct = 16;
  if (next[6] <= avatarPct + 0.5) return next;
  const delta = next[6] - avatarPct;
  next[6] = avatarPct;
  next[1] += delta * 0.45;
  next[3] += delta * 0.35;
  next[5] += delta * 0.2;
  return normalizePercents(next);
}

export const CV_RIREKISHO_EDUCATION_COLS = [13, 19, 18, 18, 18, 14];
export const CV_RIREKISHO_LANGUAGES_COLS = [13, 17, 18, 18, 18, 16];
export const CV_RIREKISHO_CERT_COLS = [13, 9, 11, 11, 10, 31, 15];
export const CV_RIREKISHO_TOOLS_COLS = [13, 12, 7, 16, 7, 16, 7, 16, 6];

function normalizePercents(arr) {
  if (!arr?.length) return [];
  const sum = arr.reduce((a, b) => a + Math.max(0.1, b), 0);
  return arr.map((x) => (Math.max(0.1, x) / sum) * 100);
}

/** Ép cột 1 các bảng 学歴/外国語/資格/tools thẳng hàng với personalGrid. */
export function alignRirekishoSectionColPercents(cols, sidePct = CV_RIREKISHO_SIDE_LABEL_COL_PCT) {
  if (!Array.isArray(cols) || cols.length < 2) return cols;
  if (Math.abs(cols[0] - sidePct) < 0.05) return cols;
  const delta = sidePct - cols[0];
  const next = [...cols];
  next[0] = sidePct;
  next[1] = Math.max(0.1, next[1] + delta);
  return normalizePercents(next);
}

/** common */
export const CV_LAYOUT_COMMON_RIREKISHO = {
  personalMain: 'personalMain',
  eduWorkCert: 'eduWorkCert',
  station: 'station',
  residence: 'residence',
  prHobby: 'prHobby',
  motivation: 'motivation',
  wish: 'wish',
};
export const CV_LAYOUT_COMMON_SHOKUMU = {
  workHistory: 'workHistory',
  cert: 'cert',
};

/** cv_it | cv_technical — rirekisho */
export const CV_LAYOUT_IT_RIREKISHO = {
  personalGrid: 'personalGrid_v3',
  education: 'education',
  languages: 'languages_v2',
  certificates: 'certificates_v7',
  employment: 'employment_v3',
  itFooter: 'itFooter',
};
/** cv_technical only */
export const CV_LAYOUT_TECHNICAL_RIREKISHO = {
  tools: 'tools',
};

/** shokumu IT / Technical */
export const CV_LAYOUT_SHOKUMU = {
  summary: 'summary',
  workGrid: (idx) => `workGrid:${idx}`,
  cert: 'cert',
};
