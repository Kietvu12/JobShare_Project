import { formatCvYearMonthJa } from './cvJpDateDisplay.js';

export const OTHER_LANG_CERT_SLOT_COUNT = 4;

export function normalizeOtherLanguageCerts(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const migrated = list.length === 3 ? [{ name: '', year: '', month: '' }, ...list] : list;
  return Array.from({ length: OTHER_LANG_CERT_SLOT_COUNT }, (_, i) => {
    const item = migrated[i] && typeof migrated[i] === 'object' ? migrated[i] : {};
    return {
      name: item.name != null ? String(item.name) : '',
      year: item.year != null ? String(item.year) : '',
      month: item.month != null ? String(item.month) : '',
    };
  });
}

export function readOtherLanguageCertsFromCv(raw) {
  const layout = (() => {
    const v = raw?.cvTableLayout;
    if (v == null) return {};
    if (typeof v === 'object' && !Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const t = v.trim();
        return t ? JSON.parse(t) : {};
      } catch {
        return {};
      }
    }
    return {};
  })();
  if (Array.isArray(raw?.otherLanguageCerts)) {
    return normalizeOtherLanguageCerts(raw.otherLanguageCerts);
  }
  return normalizeOtherLanguageCerts(layout.otherLanguageCerts);
}

export function hasOtherLangCertData(cert) {
  if (!cert || typeof cert !== 'object') return false;
  return Boolean(
    String(cert.name || '').trim()
    || String(cert.year || '').trim()
    || String(cert.month || '').trim(),
  );
}

export function hasAnyOtherLangCertData(certs) {
  return normalizeOtherLanguageCerts(certs).some(hasOtherLangCertData);
}

export function getOtherLangCertYearMonth(cert) {
  return formatCvYearMonthJa(cert?.year, cert?.month) || '';
}

export function otherLangCertCellsHtml(cert, orBlank) {
  if (!hasOtherLangCertData(cert)) {
    return `
      <td style="border:1px solid #1f2937;padding:4px;text-align:center">　</td>
      <td style="border:1px solid #1f2937;padding:4px;text-align:center">　</td>`;
  }
  return `
      <td style="border:1px solid #1f2937;padding:4px;text-align:center">${orBlank(cert.name)}</td>
      <td style="border:1px solid #1f2937;padding:4px;text-align:center">${orBlank(getOtherLangCertYearMonth(cert))}</td>`;
}
