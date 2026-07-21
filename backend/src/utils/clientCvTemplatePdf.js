/**
 * Nhận PDF template do client gửi lên và lưu snapshot (S3 / local).
 */
import path from 'path';
import fs from 'fs/promises';
import {
  s3Enabled,
  buildCvTemplateFolderKey,
  buildCvTemplateFileKey,
  uploadBufferToS3,
} from '../services/s3Service.js';

export function parseClientCvTemplatePdfManifest(rawData) {
  const raw = rawData?.cvTemplatePdfManifest;
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readUploadBuffer(file) {
  if (!file) return null;
  if (file.buffer?.length) return file.buffer;
  if (file.path) {
    try {
      return await fs.readFile(file.path);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {import('../models/index.js').CVStorage} cv
 * @param {object} opts
 * @param {string} opts.dateTime
 * @param {Array<{ cvTemplate?: string, part?: string, dir?: string }>} opts.manifest
 * @param {Array} opts.pdfFiles multer files (field cvTemplatePdf)
 * @param {string} opts.backendRoot
 * @param {string} opts.uploadDir
 * @param {string} [opts.logPrefix]
 * @returns {Promise<boolean>} true nếu đã lưu ít nhất một file
 */
export async function saveClientCvTemplatePdfsForCv(cv, opts) {
  const {
    dateTime,
    manifest = [],
    pdfFiles = [],
    backendRoot,
    uploadDir,
    logPrefix = '[clientCvPdf]',
  } = opts;

  if (!manifest.length || !pdfFiles.length) return false;

  let savedCount = 0;

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const file = pdfFiles[i];
    if (!entry || !file) continue;

    const part = String(entry.part || '').trim();
    const templateDir = String(entry.dir || '').trim();
    if (!templateDir || (part !== 'rirekisho' && part !== 'shokumu')) continue;

    const filename = part === 'shokumu' ? 'cv-shokumu.pdf' : 'cv-rirekisho.pdf';
    const buffer = await readUploadBuffer(file);
    if (!buffer?.length) {
      console.warn(`${logPrefix} File PDF rỗng: ${templateDir}/${filename}`);
      continue;
    }

    try {
      if (s3Enabled()) {
        const key = buildCvTemplateFileKey(cv.id, dateTime, templateDir, filename);
        await uploadBufferToS3(buffer, key, 'application/pdf');
      } else {
        const subDir = path.join(uploadDir, String(cv.id), dateTime, 'CV_Template', templateDir);
        await fs.mkdir(subDir, { recursive: true });
        await fs.writeFile(path.join(subDir, filename), buffer);
      }
      savedCount += 1;
    } catch (e) {
      console.warn(`${logPrefix} Lưu ${templateDir}/${filename} thất bại:`, e.message);
    }

    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }
  }

  if (!savedCount) return false;

  if (s3Enabled()) {
    cv.curriculumVitae = buildCvTemplateFolderKey(cv.id, dateTime);
  } else {
    const tplDir = path.join(uploadDir, String(cv.id), dateTime, 'CV_Template');
    cv.curriculumVitae = path.relative(backendRoot, tplDir);
  }
  await cv.save();
  return true;
}

export function hasClientCvTemplatePdfUpload(rawData, reqFiles) {
  const manifest = parseClientCvTemplatePdfManifest(rawData);
  const files = reqFiles?.cvTemplatePdf;
  return manifest.length > 0 && Array.isArray(files) && files.length > 0;
}
