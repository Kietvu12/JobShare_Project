export function createFormatters(lang) {
  const nf = new Intl.NumberFormat(lang);
  const n = (value) => nf.format(value);
  return { n, yen: (value) => `¥${n(value)}` };
}

/** Bảng gói credit luôn hiển thị dạng 1,000 như template, không theo locale. */
export const formatPackageNumber = (value) => new Intl.NumberFormat('en-US').format(value);

export function formatBudgetStatus(status, copy, yen) {
  switch (status.kind) {
    case 'none':
      return copy.noBudget;
    case 'within':
      return `${copy.within} · ${copy.left} ${yen(status.diff)}`;
    case 'partial':
      return `${copy.partial} · ${copy.upper} +${yen(status.diff)}`;
    default:
      return `${copy.outside} · +${yen(status.diff)}`;
  }
}
