import { Collaborator, JobApplication, Job, CVStorage } from '../models/index.js';
import { collaboratorNotificationService } from './collaboratorNotificationService.js';
import { nominationEmailService } from './nominationEmailService.js';

const JOB_APP_NOTIFY_INCLUDES = [
  { model: Job, as: 'job', required: false, attributes: ['id', 'jobCode', 'title', 'titleEn', 'titleJp'] },
  { model: CVStorage, as: 'cv', required: false, attributes: ['name'] },
];

const SENDER_LABELS = {
  2: 'CTV',
  4: 'Ứng viên',
  5: 'Doanh nghiệp',
};

function pickCandidateName(jobApplication) {
  return jobApplication?.cv?.name?.trim()
    || (jobApplication?.title && String(jobApplication.title).trim())
    || 'N/A';
}

function pickNotifyMeta(jobApplication) {
  const job = jobApplication?.job || {};
  return {
    jobApplicationId: jobApplication.id,
    jobCode: job.jobCode || String(jobApplication.id),
    jobId: jobApplication.jobId || job.id || null,
    candidateName: pickCandidateName(jobApplication),
    jobTitleVi: job.title,
    jobTitleEn: job.titleEn,
    jobTitleJp: job.titleJp,
  };
}

export async function loadJobApplicationForNotify(jobApplicationId) {
  if (!jobApplicationId) return null;
  return JobApplication.findByPk(jobApplicationId, { include: JOB_APP_NOTIFY_INCLUDES });
}

/**
 * Gửi thông báo in-app + email sau khi tạo tin nhắn chat đơn tiến cử.
 * - Admin: tin từ CTV / doanh nghiệp / ứng viên
 * - CTV: tin từ admin (chat trực tiếp) hoặc doanh nghiệp
 */
export async function dispatchNominationMessageNotifications({
  message,
  jobApplication,
  messagePreview = '',
}) {
  const senderType = Number(message?.senderType);
  if (!jobApplication?.id || !senderType) return;

  const meta = pickNotifyMeta(jobApplication);
  const isApplicantThread = !!jobApplication.applicantId;
  const collaboratorId = jobApplication.collaboratorId || message.collaboratorId || null;
  const preview = String(messagePreview || message?.content || '').trim().slice(0, 200);

  if ([2, 4, 5].includes(senderType)) {
    const senderLabel = SENDER_LABELS[senderType] || 'Người gửi';
    try {
      await collaboratorNotificationService.notifyAdminsIncomingMessage({
        ...meta,
        senderLabel,
        preview,
      });
    } catch (err) {
      console.error('[nominationMessageNotify] admin in-app:', err);
    }
    try {
      await nominationEmailService.sendAdminNewNominationMessageEmail({
        ...meta,
        senderType,
        senderLabel,
      });
    } catch (err) {
      console.error('[nominationMessageNotify] admin email:', err);
    }
  }

  if (!isApplicantThread && collaboratorId && [1, 3, 5].includes(senderType)) {
    try {
      await collaboratorNotificationService.notifyIncomingMessage({
        collaboratorId,
        jobCode: meta.jobCode,
        jobId: meta.jobId,
        jobApplicationId: meta.jobApplicationId,
      });
    } catch (err) {
      console.error('[nominationMessageNotify] ctv in-app:', err);
    }

    if ([1, 5].includes(senderType)) {
      try {
        const collab = await Collaborator.findByPk(collaboratorId, { attributes: ['email'] });
        const to = collab?.email?.trim();
        if (to) {
          await nominationEmailService.sendCollaboratorAdminNewMessageEmail({
            to,
            ...meta,
          });
        }
      } catch (err) {
        console.error('[nominationMessageNotify] ctv email:', err);
      }
    }
  }
}
