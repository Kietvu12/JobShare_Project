/** Heuristic: message may contain a phone number (VN / international). */
export function textMayContainPhoneNumber(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  const normalized = raw.replace(/[^\d+]/g, ' ');
  if (/(?:\+84|84|0)\d{8,10}/.test(normalized.replace(/\s/g, ''))) return true;
  if (/\b\d{9,11}\b/.test(raw)) return true;
  return false;
}
