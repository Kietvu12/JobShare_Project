/** Lưới cố định 使用可能ツール・ソフトウェア等枠 — CV Technical (履歴書). */

/** 学習した: 2 cột × 4 hàng */
export const TECH_LEARNED_TOOLS_GRID = [
  ['AutoCAD', 'CATIA'],
  ['I-DEAS', 'SolidWorks'],
  ['PLC', 'C++'],
  ['NX', 'Java'],
];

/** 業務で利用した: 2 cột × 4 hàng */
export const TECH_EXPERIENCE_TOOLS_GRID = [
  ['AutoCAD', 'CATIA'],
  ['I-DEAS', 'SolidWorks'],
  ['PLC', 'CADAM'],
  ['NX', 'BOM'],
];

export const TECH_TOOLS_GRID_ROW_COUNT = TECH_LEARNED_TOOLS_GRID.length;

/** 9 cột: tiêu đề | (tên|note)×2 learned | (tên|note)×2 experienced */
export const TECH_TOOLS_TABLE_COL_PERCENTS = [8, 10, 4, 10, 4, 10, 4, 10, 4];

/** Danh sách gộp — đồng bộ dropdown AddCandidateForm */
export const TECHNICAL_TOOLS_ALL = [
  ...new Set([
    ...TECH_LEARNED_TOOLS_GRID.flat(),
    ...TECH_EXPERIENCE_TOOLS_GRID.flat().filter(Boolean),
  ]),
];
