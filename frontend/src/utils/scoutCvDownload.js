import { openRemoteFileDownloadUrl } from './safeFileDownload';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Tải CV gốc sau khi doanh nghiệp mở khóa bằng Scout Credit.
 * @returns {Promise<number>} số file đã tải
 */
export async function downloadScoutOriginalCvFiles(apiService, cvId) {
  const { originals } = await apiService.getBusinessScoutCandidateCvFileList(cvId);
  return downloadOriginalCvFilesFromList(originals);
}

/**
 * Tải CV gốc từ đơn tiến cử (Quản lý tiến cử).
 * @returns {Promise<number>} số file đã tải
 */
export async function downloadApplicationOriginalCvFiles(apiService, applicationId) {
  const { originals } = await apiService.getBusinessApplicationCvFileList(applicationId);
  return downloadOriginalCvFilesFromList(originals);
}

async function downloadOriginalCvFilesFromList(originals) {
  const files = (originals || []).filter((f) => f?.downloadUrl);
  if (!files.length) {
    const err = new Error('NO_ORIGINAL_CV');
    err.code = 'NO_ORIGINAL_CV';
    throw err;
  }

  for (let i = 0; i < files.length; i += 1) {
    if (i > 0) await delay(400);
    openRemoteFileDownloadUrl(files[i].downloadUrl);
  }

  return files.length;
}
