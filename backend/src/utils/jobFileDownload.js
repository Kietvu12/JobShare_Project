import path from 'path';
import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import { buildJdDownloadFilename } from './jdDownloadFilename.js';
import { normalizeUploadOriginalName } from './uploadFilename.js';
import {
  isS3Key,
  getObjectStream,
  makeDownloadDisposition,
  getObjectOriginalDisplayName,
} from '../services/s3Service.js';
import { getRequestPublicBaseUrl } from './requestPublicBaseUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../../');

const JOB_FILE_ATTRS = [
  'id',
  'jobCode',
  'title',
  'titleEn',
  'titleJp',
  'jdFile',
  'jdFileEn',
  'jdFileJp',
  'jdOriginalFile',
  'jdOriginalFilename',
  'requiredCvForm',
];

export { JOB_FILE_ATTRS };

export function resolveJobFilePath(job, fileType) {
  if (fileType === 'requiredCvForm') return job.requiredCvForm ?? job.get?.('required_cv_form');
  if (fileType === 'jdFileEn') return job.jdFileEn ?? job.get?.('jd_file_en');
  if (fileType === 'jdFileJp') return job.jdFileJp ?? job.get?.('jd_file_jp');
  if (fileType === 'jdOriginalFile') return job.jdOriginalFile ?? job.get?.('jd_original_file');
  return job.jdFile ?? job.get?.('jd_file');
}

export function resolveJobDownloadFilename(job, fileType, filePath) {
  if (fileType === 'jdFile') return buildJdDownloadFilename(job.jobCode, job.title, filePath);
  if (fileType === 'jdFileEn') return buildJdDownloadFilename(job.jobCode, job.titleEn, filePath);
  if (fileType === 'jdFileJp') return buildJdDownloadFilename(job.jobCode, job.titleJp, filePath);
  if (fileType === 'requiredCvForm') return buildJdDownloadFilename(job.jobCode, job.title, filePath);
  if (fileType === 'jdOriginalFile') {
    const fromDb = job.jdOriginalFilename ?? job.get?.('jd_original_filename');
    if (fromDb) return normalizeUploadOriginalName(fromDb);
    return buildJdDownloadFilename(job.jobCode, job.title, filePath);
  }
  return buildJdDownloadFilename(job.jobCode, job.title, filePath);
}

export async function resolveJobDownloadFilenameAsync(job, fileType, filePath) {
  if (fileType !== 'jdOriginalFile') {
    return resolveJobDownloadFilename(job, fileType, filePath);
  }
  const fromDb = job.jdOriginalFilename ?? job.get?.('jd_original_filename');
  if (fromDb) return normalizeUploadOriginalName(fromDb);
  if (isS3Key(filePath)) {
    const fromS3 = await getObjectOriginalDisplayName(filePath);
    if (fromS3 && fromS3 !== path.basename(filePath)) return fromS3;
  }
  return buildJdDownloadFilename(job.jobCode, job.title, filePath);
}

function mimeFromPath(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Stream file JD (S3 hoặc local) với Content-Disposition UTF-8 đầy đủ — không qua presigned URL.
 * @returns {Promise<boolean>} true nếu đã gửi response
 */
export async function sendJobFileDownload(res, filePath, filename) {
  const name = filename || 'download.pdf';
  const disposition = makeDownloadDisposition(name);

  if (isS3Key(filePath)) {
    const streamResult = await getObjectStream(filePath);
    if (!streamResult?.Body) return false;
    res.setHeader('Content-Type', streamResult.ContentType || mimeFromPath(filePath));
    res.setHeader('Content-Disposition', disposition);
    await pipeline(streamResult.Body, res);
    return true;
  }

  const fullPath = path.join(BACKEND_ROOT, String(filePath).replace(/^\//, ''));
  const stats = await fs.stat(fullPath).catch(() => null);
  if (!stats) return false;

  res.setHeader('Content-Type', mimeFromPath(fullPath));
  res.setHeader('Content-Disposition', disposition);
  res.setHeader('Content-Length', stats.size);
  res.send(await fs.readFile(fullPath));
  return true;
}

export function buildJobDownloadApiUrl(req, jobId, fileType) {
  const apiBase = getRequestPublicBaseUrl(req);
  const mount = (req.baseUrl || '/api/ctv/jobs').replace(/\/+$/, '');
  const qs = new URLSearchParams({ fileType: String(fileType) }).toString();
  return `${apiBase}${mount}/${jobId}/download?${qs}`;
}
