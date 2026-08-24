import apiService from '../services/api';

export const JD_PARSE_ACCEPT = '.pdf,.doc,.docx';

export function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload JD file tới POST /v3/jd và trả về object JD đã parse.
 * @param {File|Blob} file
 * @param {AbortSignal} [signal]
 */
export async function parseJdFile(file, signal) {
  return apiService.parseJdFromFile(file, { signal });
}
