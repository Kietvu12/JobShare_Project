/**
 * Lưu CV gốc (snapshot) + sinh PDF template — dùng chung cho createCV và bulk import.
 * Caller chịu trách nhiệm xóa file tạm trên đĩa (multer disk) sau khi gọi xong.
 */
import path from 'path';
import fs from 'fs/promises';
import {
  s3Enabled,
  getCvSnapshotDateTime,
  buildCvOriginalFolderKey,
  buildCvTemplateFolderKey,
  buildCvTemplateFileKey,
  uploadCvOriginalsToSnapshot,
  uploadCvAvatarToSnapshot,
  uploadBufferToS3
} from './s3Service.js';
import { generateCvRirekishoPdfBuffer, generateCvShokumuPdfBuffer } from './cvPdfService.js';
import { saveClientCvTemplatePdfsForCv } from '../utils/clientCvTemplatePdf.js';
import { enqueueCvVectorSync } from './cvVectorSyncService.js';
import { Collaborator, Admin } from '../models/index.js';
import { toSafeStorageFilename } from '../utils/uploadFilename.js';

const templateList = [
  { cvTemplate: 'common', dir: 'Common' },
  { cvTemplate: 'cv_it', dir: 'IT' },
  { cvTemplate: 'cv_technical', dir: 'Technical' }
];

function parseDataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const mime = m[1].split(';')[0].trim();
    const buffer = Buffer.from(m[2], 'base64');
    if (!buffer.length) return null;
    return { mime, buffer };
  } catch {
    return null;
  }
}

/**
 * Lưu ảnh chân dung vào snapshot (S3: CV_avatar/…; local: …/CV_avatar/profile_photo.*)
 */
export async function saveCvAvatarForSnapshot(cv, dateTime, avatarDataUrl, backendRoot, uploadDir) {
  if (!avatarDataUrl || typeof avatarDataUrl !== 'string' || !avatarDataUrl.startsWith('data:image/')) {
    return;
  }
  const parsed = parseDataUrlToBuffer(avatarDataUrl);
  if (!parsed?.buffer?.length) return;
  try {
    if (s3Enabled()) {
      cv.avatarPhotoPath = await uploadCvAvatarToSnapshot(cv.id, dateTime, parsed.buffer, parsed.mime);
    } else {
      const avatarDir = path.join(uploadDir, String(cv.id), dateTime, 'CV_avatar');
      await fs.mkdir(avatarDir, { recursive: true });
      const ext = parsed.mime.includes('png')
        ? '.png'
        : parsed.mime.includes('webp')
          ? '.webp'
          : parsed.mime.includes('gif')
            ? '.gif'
            : '.jpg';
      const dest = path.join(avatarDir, `profile_photo${ext}`);
      await fs.writeFile(dest, parsed.buffer);
      cv.avatarPhotoPath = path.relative(backendRoot, dest).replace(/\\/g, '/');
    }
    await cv.save();
  } catch (e) {
    console.warn('[saveCvAvatarForSnapshot]', e.message);
  }
}

function toSafeUploadName(originalname, index, usedNames) {
  return toSafeStorageFilename(originalname, index, usedNames).storageName;
}

async function persistCvOriginalFiles(cv, dateTime, files, backendRoot, uploadDir, logPrefix) {
  if (files.length) {
    try {
      if (s3Enabled()) {
        cv.cvOriginalPath = await uploadCvOriginalsToSnapshot(cv.id, dateTime, files);
      } else {
        const snapshotDir = path.join(uploadDir, String(cv.id), dateTime);
        const origDir = path.join(snapshotDir, 'CV_original');
        await fs.mkdir(origDir, { recursive: true });
        const usedNames = new Set();
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const dest = path.join(origDir, toSafeUploadName(f.originalname, i, usedNames));
          if (f.path) await fs.copyFile(f.path, dest);
          else if (f.buffer) await fs.writeFile(dest, f.buffer);
        }
        cv.cvOriginalPath = path.relative(backendRoot, origDir);
      }
      await cv.save();
    } catch (e) {
      console.warn(`${logPrefix} Lưu CV gốc thất bại:`, e.message);
    }
    return;
  }

  if (s3Enabled()) {
    cv.cvOriginalPath = buildCvOriginalFolderKey(cv.id, dateTime);
  } else {
    const snapshotDir = path.join(uploadDir, String(cv.id), dateTime);
    const origDir = path.join(snapshotDir, 'CV_original');
    await fs.mkdir(origDir, { recursive: true });
    cv.cvOriginalPath = path.relative(backendRoot, origDir);
  }
  await cv.save();
}

async function generateServerCvTemplatePdfs(cv, opts) {
  const {
    dateTime,
    avatarDataUrl = '',
    templateList: tplList = templateList,
    backendRoot,
    uploadDir,
    logPrefix = '[cvSnapshot]',
  } = opts;

  if (s3Enabled()) {
    for (const { cvTemplate: tpl, dir: templateDir } of tplList) {
      try {
        const rirekishoBuffer = await generateCvRirekishoPdfBuffer(cv, { avatarDataUrl, cvTemplate: tpl });
        if (rirekishoBuffer) {
          const key = buildCvTemplateFileKey(cv.id, dateTime, templateDir, 'cv-rirekisho.pdf');
          await uploadBufferToS3(rirekishoBuffer, key, 'application/pdf');
        }
        const shokumuBuffer = await generateCvShokumuPdfBuffer(cv, { avatarDataUrl, cvTemplate: tpl });
        if (shokumuBuffer) {
          const key = buildCvTemplateFileKey(cv.id, dateTime, templateDir, 'cv-shokumu.pdf');
          await uploadBufferToS3(shokumuBuffer, key, 'application/pdf');
        }
      } catch (e) {
        console.warn(`${logPrefix} PDF ${templateDir} thất bại:`, e.message);
      }
    }
    cv.curriculumVitae = buildCvTemplateFolderKey(cv.id, dateTime);
  } else {
    const snapshotDir = path.join(uploadDir, String(cv.id), dateTime);
    const tplDir = path.join(snapshotDir, 'CV_Template');
    for (const { cvTemplate: tpl, dir: templateDir } of tplList) {
      const subDir = path.join(tplDir, templateDir);
      await fs.mkdir(subDir, { recursive: true });
      try {
        const rirekishoBuffer = await generateCvRirekishoPdfBuffer(cv, { avatarDataUrl, cvTemplate: tpl });
        if (rirekishoBuffer) await fs.writeFile(path.join(subDir, 'cv-rirekisho.pdf'), rirekishoBuffer);
        const shokumuBuffer = await generateCvShokumuPdfBuffer(cv, { avatarDataUrl, cvTemplate: tpl });
        if (shokumuBuffer) await fs.writeFile(path.join(subDir, 'cv-shokumu.pdf'), shokumuBuffer);
      } catch (e) {
        console.warn(`${logPrefix} PDF ${templateDir} thất bại:`, e.message);
      }
    }
    cv.curriculumVitae = path.relative(backendRoot, tplDir);
  }
  await cv.save();
}

/**
 * Lưu PDF template: ưu tiên file client upload; fallback sinh server (bulk import).
 */
export async function persistCvTemplatePdfsForSnapshot(cv, opts) {
  const {
    dateTime,
    skipPdfGeneration = false,
    avatarDataUrl = '',
    clientPdfManifest = [],
    clientPdfFiles = [],
    templateList: tplList = templateList,
    backendRoot,
    uploadDir,
    logPrefix = '[cvSnapshot]',
  } = opts;

  if (skipPdfGeneration) return false;

  const savedClient = await saveClientCvTemplatePdfsForCv(cv, {
    dateTime,
    manifest: clientPdfManifest,
    pdfFiles: clientPdfFiles,
    backendRoot,
    uploadDir,
    logPrefix,
  });
  if (savedClient) return true;

  await generateServerCvTemplatePdfs(cv, {
    dateTime,
    avatarDataUrl,
    templateList: tplList,
    backendRoot,
    uploadDir,
    logPrefix,
  });
  return Boolean(cv.curriculumVitae);
}

/**
 * Quick create: chỉ lưu file CV gốc (không avatar, không PDF template).
 */
export async function saveCvOriginalsOnlyForCv(cv, opts) {
  const {
    cvFiles = [],
    backendRoot,
    uploadDir,
    logPrefix = '[cvSnapshot]',
    dateTime = getCvSnapshotDateTime(),
  } = opts;
  const files = Array.isArray(cvFiles) ? cvFiles.filter(Boolean) : [];
  await persistCvOriginalFiles(cv, dateTime, files, backendRoot, uploadDir, logPrefix);
  return dateTime;
}

/**
 * Quick create: đánh dấu hồ sơ sẵn sàng parse AI + đồng bộ vector.
 */
export async function markCvReadyForQuickCreateParse(cv) {
  cv.isParse = true;
  cv.completionState = 'ready_for_parse';
  cv.vectorSyncStatus = 'vector_pending';
  cv.vectorSyncRequestedAt = new Date();
  cv.vectorSyncCompletedAt = null;
  cv.vectorSyncLastError = null;
  await cv.save();
  await enqueueCvVectorSync(cv.id);
  await cv.reload();
}

/**
 * @param {import('../models/index.js').CVStorage} cv
 * @param {object} opts
 * @param {Array<{ buffer?: Buffer, path?: string, originalname?: string, mimetype?: string }>} [opts.cvFiles]
 * @param {string} [opts.avatarDataUrl]
 * @param {string} opts.backendRoot
 * @param {string} opts.uploadDir - thư mục gốc uploads/cvs (local)
 * @param {string} [opts.logPrefix]
 */
export async function saveCvOriginalsAndTemplatesForCv(cv, opts) {
  const {
    cvFiles = [],
    avatarDataUrl = '',
    backendRoot,
    uploadDir,
    logPrefix = '[cvSnapshot]',
    skipPdfGeneration = false,
    clientPdfManifest = [],
    clientPdfFiles = [],
    templateList: tplList = templateList,
  } = opts;

  const dateTime = getCvSnapshotDateTime();
  await saveCvAvatarForSnapshot(cv, dateTime, avatarDataUrl, backendRoot, uploadDir);
  const files = Array.isArray(cvFiles) ? cvFiles.filter(Boolean) : [];
  await persistCvOriginalFiles(cv, dateTime, files, backendRoot, uploadDir, logPrefix);

  try {
    if (!skipPdfGeneration) {
      await persistCvTemplatePdfsForSnapshot(cv, {
        dateTime,
        skipPdfGeneration: false,
        avatarDataUrl,
        clientPdfManifest,
        clientPdfFiles,
        templateList: tplList,
        backendRoot,
        uploadDir,
        logPrefix,
      });
    }
    if (cv.curriculumVitae) {
      await cv.save();
      await cv.reload({
        include: [
          { model: Collaborator, as: 'collaborator', required: false },
          { model: Admin, as: 'admin', required: false }
        ]
      });
    }
  } catch (e) {
    console.warn(`${logPrefix} Không thể tạo PDF template:`, e.message);
  }
}
