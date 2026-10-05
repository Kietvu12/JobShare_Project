import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailService from './emailService.js';
import config from '../config/index.js';
import { notifyBrochureDownloaded } from './businessNotificationEmail/businessNotificationEmailHooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_FILENAME = 'JobShare_Business_Service_Guide.pdf';

function resolveLang(lang) {
  const l = String(lang || '').toLowerCase();
  if (l === 'ja' || l === 'jp') return 'ja';
  if (l === 'en') return 'en';
  return 'vi';
}

/** Tìm PDF trên disk — hỗ trợ deploy monorepo (CWD khác nhau) và BUSINESS_DOCUMENT_PDF_PATH */
export function resolveBusinessDocumentPdfPath() {
  const cwd = process.cwd();
  const candidates = [
    config.businessDocumentPdfPath,
    path.join(__dirname, '../../assets/business', PDF_FILENAME),
    path.join(cwd, 'assets/business', PDF_FILENAME),
    path.join(cwd, 'backend/assets/business', PDF_FILENAME),
    path.join(cwd, '../backend/assets/business', PDF_FILENAME),
    path.join(cwd, 'frontend/public/documents', PDF_FILENAME),
    path.join(cwd, '../frontend/public/documents', PDF_FILENAME),
    path.join(__dirname, '../../../../frontend/public/documents', PDF_FILENAME),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

function readPdfBuffer() {
  const pdfPath = resolveBusinessDocumentPdfPath();
  if (!pdfPath) {
    const err = new Error('Document file is not available');
    err.code = 'BUSINESS_DOCUMENT_PDF_MISSING';
    throw err;
  }
  return fs.readFileSync(pdfPath);
}

export async function sendBusinessDocumentDownloadEmail({
  company,
  email,
  business,
  lang = 'vi',
}) {
  const language = resolveLang(lang);
  const pdfBuffer = readPdfBuffer();
  const attachments = [{
    filename: PDF_FILENAME,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }];

  await notifyBrochureDownloaded({
    email,
    company,
    userName: company,
    lang: language,
    attachments,
  });

  const notifyTo = config.email?.businessDocumentLeadEmail || config.email?.from;
  if (notifyTo && notifyTo !== email) {
    await emailService.sendEmail({
      to: notifyTo,
      subject: `[Lead] Business document download — ${company}`,
      html: `<p><strong>Company:</strong> ${company}<br><strong>Email:</strong> ${email}<br><strong>Business:</strong> ${business}<br><strong>Lang:</strong> ${language}</p>`,
    }).catch(() => {});
  }

  return {
    downloadUrl: '/documents/JobShare_Business_Service_Guide.pdf',
    fileName: PDF_FILENAME,
  };
}
