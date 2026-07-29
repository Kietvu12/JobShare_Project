const PARSE_JD_API_URL = 'https://ws-jobshare.com/api_ai/v2/parser/jd';
const PARSE_JD_FILE_FIELD = 'file';

function formatParseError(data, status) {
  const detail = data?.detail;
  const msg = data?.message || data?.error;
  const detailStr = Array.isArray(detail)
    ? detail.map((d) => d.msg || d.loc?.join?.('.') || JSON.stringify(d)).join('; ')
    : typeof detail === 'string'
      ? detail
      : detail != null ? JSON.stringify(detail) : '';
  return [msg, detailStr].filter(Boolean).join(' — ') || `HTTP ${status}`;
}

/**
 * Upload JD file và gọi API parse. Trả về object JD đã parse (data.data hoặc data).
 */
export async function parseJdFile(file, signal) {
  if (!file || (file.size !== undefined && file.size <= 0)) {
    throw new Error('File không hợp lệ');
  }
  const formDataUpload = new FormData();
  formDataUpload.append(PARSE_JD_FILE_FIELD, file);
  const res = await fetch(PARSE_JD_API_URL, {
    method: 'POST',
    body: formDataUpload,
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatParseError(data, res.status));
  }
  return data?.data ?? data;
}

export const JD_PARSE_ACCEPT = '.pdf,.doc,.docx';

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
