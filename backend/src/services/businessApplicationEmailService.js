import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailService from './emailService.js';
import { getObjectStream, isFolderPath, isS3Key } from './s3Service.js';
import { resolveCvFileForView } from '../utils/cvStorageResolver.js';
import { Business, CVStorage, Job, JobApplication } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function guessContentType(filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.doc') return 'application/msword';
  if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

async function streamToBuffer(stream) {
  if (!stream) return null;
  if (Buffer.isBuffer(stream)) return stream;
  if (typeof stream.transformToByteArray === 'function') {
    return Buffer.from(await stream.transformToByteArray());
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Resolve file CV dùng để đính kèm email (ưu tiên cvPath trên đơn → original → template).
 */
async function resolveCvAttachment(cv, cvPath) {
  if (!cv && !cvPath) return null;

  let resolved = null;
  const normalized = String(cvPath || '').replace(/\\/g, '/').trim();

  if (normalized && !isFolderPath(normalized)) {
    resolved = { pathOrKey: normalized, isS3: isS3Key(normalized) };
  } else if (normalized && isFolderPath(normalized)) {
    if (normalized.includes('CV_original')) {
      resolved = await resolveCvFileForView(
        { cvOriginalPath: normalized },
        'cvOriginalPath',
        { index: 0 },
        BACKEND_ROOT,
      );
    } else if (normalized.includes('CV_Template')) {
      const base = normalized.replace(/\/(Common|IT|Technical)\/?$/, '');
      const templateMatch = normalized.match(/\/(Common|IT|Technical)(?:\/|$)/);
      resolved = await resolveCvFileForView(
        { curriculumVitae: base },
        'curriculumVitae',
        { template: templateMatch?.[1] || 'Common', document: 'rirekisho' },
        BACKEND_ROOT,
      );
    }
  }

  if (!resolved && cv) {
    resolved =
      (await resolveCvFileForView(cv, 'cvOriginalPath', { index: 0 }, BACKEND_ROOT))
      || (await resolveCvFileForView(cv, 'curriculumVitae', { template: 'Common', document: 'rirekisho' }, BACKEND_ROOT));
  }

  if (!resolved?.pathOrKey) return null;

  const filename = path.basename(resolved.pathOrKey) || 'cv.pdf';
  const contentType = guessContentType(filename);

  if (resolved.isS3) {
    const obj = await getObjectStream(resolved.pathOrKey);
    if (!obj?.Body) return null;
    const content = await streamToBuffer(obj.Body);
    if (!content?.length) return null;
    return { filename, content, contentType };
  }

  const localPath = path.isAbsolute(resolved.pathOrKey)
    ? resolved.pathOrKey
    : path.join(BACKEND_ROOT, resolved.pathOrKey.replace(/^\//, ''));
  if (!fs.existsSync(localPath)) return null;
  return { filename, path: localPath, contentType };
}

/**
 * Gửi email thông báo đơn ứng tuyển mới + đính kèm CV tới doanh nghiệp sở hữu job.
 * Fire-and-forget an toàn: không throw ra ngoài nếu thiếu email/CV.
 */
export async function sendBusinessNewApplicationWithCv({
  jobApplicationId,
  jobId = null,
  businessId = null,
  candidateName = null,
  jobTitleVi = null,
  jobTitleEn = null,
  jobTitleJp = null,
} = {}) {
  try {
    let application = null;
    if (jobApplicationId) {
      application = await JobApplication.findByPk(jobApplicationId, {
        include: [
          {
            model: Job,
            as: 'job',
            required: false,
            attributes: ['id', 'jobCode', 'title', 'titleEn', 'titleJp', 'businessId'],
          },
          {
            model: CVStorage,
            as: 'cv',
            required: false,
            attributes: ['id', 'name', 'code', 'cvOriginalPath', 'curriculumVitae'],
          },
        ],
      });
    }

    const job =
      application?.job
      || (jobId ? await Job.findByPk(jobId, {
        attributes: ['id', 'jobCode', 'title', 'titleEn', 'titleJp', 'businessId'],
      }) : null);

    const resolvedBusinessId = businessId || job?.businessId || application?.job?.businessId;
    if (!resolvedBusinessId) {
      return { skipped: true, reason: 'not_business_job' };
    }

    const business = await Business.findByPk(resolvedBusinessId, {
      attributes: ['id', 'companyName', 'contactEmail', 'email', 'contactName'],
    });
    if (!business) {
      return { skipped: true, reason: 'business_not_found' };
    }

    const to = String(business.contactEmail || business.email || '').trim();
    if (!to) {
      console.warn(`[businessApplicationEmail] Business #${resolvedBusinessId} không có email nhận`);
      return { skipped: true, reason: 'no_email' };
    }

    const cv = application?.cv
      || (application?.cvId
        ? await CVStorage.findByPk(application.cvId, {
          attributes: ['id', 'name', 'code', 'cvOriginalPath', 'curriculumVitae'],
        })
        : null);

    const attachment = await resolveCvAttachment(cv, application?.cvPath);
    const attachments = attachment ? [attachment] : [];

    const appCode = application?.id != null ? String(application.id) : 'N/A';
    const jobCode = job?.jobCode || (job?.id != null ? String(job.id) : 'N/A');
    const name = candidateName || cv?.name || 'Ứng viên';
    const titleVi = jobTitleVi || job?.title || 'N/A';
    const titleEn = jobTitleEn || job?.titleEn || titleVi;
    const titleJp = jobTitleJp || job?.titleJp || titleVi;
    const detailUrl = `${FRONTEND_URL}/business/applications`;
    const company = business.companyName || 'Doanh nghiệp';

    const subject = `[JobShare] Đơn ứng tuyển mới #${appCode} — ${titleVi}`;
    const text = `Xin chào ${company},

Bạn có đơn ứng tuyển mới trên JobShare.

- Mã đơn: ${appCode}
- Ứng viên: ${name}
- Vị trí: ${titleVi} / ${titleEn} / ${titleJp}
- Mã JD: ${jobCode}

${attachments.length ? 'CV đính kèm trong email này.' : 'CV chưa đính kèm được — vui lòng xem trong hệ thống.'}

Xem chi tiết: ${detailUrl}

Workstation JobShare
`;

    const safeCompany = escapeHtml(company);
    const safeName = escapeHtml(name);
    const safeApp = escapeHtml(appCode);
    const safeJobCode = escapeHtml(jobCode);
    const safeTitleVi = escapeHtml(titleVi);
    const safeTitleEn = escapeHtml(titleEn);
    const safeTitleJp = escapeHtml(titleJp);
    const safeUrl = escapeHtml(detailUrl);

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.55;">
        <p>Xin chào <strong>${safeCompany}</strong>,</p>
        <p>Bạn có <strong>đơn ứng tuyển mới</strong> trên JobShare.</p>
        <ul>
          <li>Mã đơn: <strong>${safeApp}</strong></li>
          <li>Ứng viên: <strong>${safeName}</strong></li>
          <li>Vị trí: ${safeTitleVi} / ${safeTitleEn} / ${safeTitleJp}</li>
          <li>Mã JD: ${safeJobCode}</li>
        </ul>
        <p>${attachments.length
          ? 'CV của ứng viên được đính kèm trong email này.'
          : 'Không đính kèm được file CV — vui lòng mở hệ thống để xem.'}</p>
        <p><a href="${safeUrl}" style="color:#0077B6;">Xem đơn ứng tuyển trên JobShare</a></p>
        <p style="margin-top:16px;font-weight:700;">Workstation JobShare</p>
      </div>
    `;

    await emailService.sendEmail({ to, subject, text, html, attachments });
    return { success: true, to, attached: attachments.length > 0 };
  } catch (err) {
    console.error('[businessApplicationEmail] send failed:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

export default {
  sendBusinessNewApplicationWithCv,
};
