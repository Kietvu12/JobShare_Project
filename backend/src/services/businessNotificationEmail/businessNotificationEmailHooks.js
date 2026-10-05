import {
  Job,
  JobApplication,
  CVStorage,
  Collaborator,
} from '../../models/index.js'
import { getJobApplicationStatus } from '../../constants/jobApplicationStatus.js'
import {
  sendBusinessNotificationEmail,
  fireBusinessNotificationEmail,
  resolveBusinessRecipientEmail,
  FRONTEND_URL,
} from './businessNotificationEmailService.js'

const SOURCE_LABELS = {
  ja: {
    ctv_marketplace: '採用パートナーネットワーク',
    scout_credit: 'ダイレクトスカウト',
    scout_performance: 'スカウト委託',
    other: 'その他',
  },
  en: {
    ctv_marketplace: 'Recruitment Partner Network',
    scout_credit: 'Direct Scout',
    scout_performance: 'Managed Scout',
    other: 'Other',
  },
}

function statusLabel(status, locale) {
  const info = getJobApplicationStatus(Number(status))
  return info?.label || String(status)
}

function sourceLabel(sourceType, locale) {
  const map = SOURCE_LABELS[locale === 'en' ? 'en' : 'ja']
  return map[sourceType] || map.other
}

export async function notifyBrochureDownloaded({ email, company, userName, lang, attachments }) {
  return sendBusinessNotificationEmail({
    templateKey: 'BROCHURE_DOWNLOADED',
    to: email,
    locale: lang,
    vars: {
      company_name: company,
      user_name: userName || company,
      lang: lang || 'ja',
    },
    eventId: `brochure:${email}:${Date.now()}`,
    skipIdempotency: true,
    attachments,
  })
}

export async function notifyContactReceived({ email, company, userName, industry, inquiryContent, lang }) {
  return sendBusinessNotificationEmail({
    templateKey: 'CONTACT_RECEIVED',
    to: email,
    locale: lang,
    vars: {
      company_name: company,
      user_name: userName || company,
      email,
      industry: industry || '—',
      inquiry_content: inquiryContent || '',
    },
    eventId: `contact:${email}:${String(inquiryContent).slice(0, 40)}`,
  })
}

export async function notifyCompanyRegistered({ businessId, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'COMPANY_REGISTERED',
    businessId,
    locale,
    eventId: `company_registered:${businessId}`,
  })
}

export async function notifyEmailVerification({ businessId, email, userName, companyName, verificationUrl, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'EMAIL_VERIFICATION',
    to: email,
    locale,
    vars: {
      company_name: companyName,
      user_name: userName,
      verification_url: verificationUrl,
    },
    eventId: `verify:${businessId}`,
  })
}

export async function notifyPasswordReset({ businessId, email, userName, companyName, resetUrl, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'PASSWORD_RESET',
    to: email,
    locale,
    vars: {
      company_name: companyName,
      user_name: userName,
      reset_password_url: resetUrl,
    },
    eventId: `reset:${businessId}:${Date.now()}`,
    skipIdempotency: true,
  })
}

export async function notifyNewPartnerReferral({
  businessId,
  applicationId,
  candidateName,
  jobTitle,
  partnerName,
  referralId,
  locale,
  attachments,
}) {
  return sendBusinessNotificationEmail({
    templateKey: 'NEW_PARTNER_REFERRAL',
    businessId,
    locale,
    vars: {
      application_id: applicationId,
      candidate_name: candidateName,
      job_title: jobTitle,
      partner_name: partnerName,
      referral_id: referralId ?? applicationId,
    },
    eventId: `referral_new:${applicationId}`,
    attachments,
  })
}

export async function notifyDirectScoutUnlocked({ businessId, candidateId, candidateName, creditCost, locale }) {
  const biz = await resolveBusinessRecipientEmail(businessId)
  const balance = biz?.business?.credit != null ? Number(biz.business.credit) : ''
  return sendBusinessNotificationEmail({
    templateKey: 'DIRECT_SCOUT_UNLOCKED',
    businessId,
    locale,
    vars: {
      candidate_id: candidateId,
      candidate_name: candidateName,
      credit_amount: creditCost,
      current_balance: balance,
    },
    eventId: `scout_unlock:${businessId}:${candidateId}`,
  })
}

export async function notifyManagedScoutRequested({ businessId, requestId, jobTitle, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'MANAGED_SCOUT_REQUESTED',
    businessId,
    locale,
    vars: {
      request_id: requestId,
      job_title: jobTitle || '',
    },
    eventId: `managed_req:${requestId}`,
  })
}

export async function notifyFreeLpCreated({ businessId, landingPageId, pageTitle, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'FREE_LP_CREATED',
    businessId,
    locale,
    vars: {
      landing_page_id: landingPageId,
      page_title: pageTitle,
    },
    eventId: `lp_created:${landingPageId}`,
  })
}

export async function notifyLandingPagePublished({ businessId, landingPageId, pageTitle, publicUrl, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'LANDING_PAGE_PUBLISHED',
    businessId,
    locale,
    vars: {
      landing_page_id: landingPageId,
      page_title: pageTitle,
      public_url: publicUrl,
    },
    eventId: `lp_pub:${landingPageId}`,
  })
}

export async function notifyCreditTopupRequested({ businessId, requestId, amount, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'CREDIT_TOPUP_REQUESTED',
    businessId,
    locale,
    vars: {
      request_id: requestId,
      credit_amount: amount,
    },
    eventId: `credit_req:${requestId}`,
  })
}

export async function notifyCreditAdded({ businessId, amount, balanceAfter, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'CREDIT_ADDED',
    businessId,
    locale,
    vars: {
      credit_amount: amount,
      current_balance: balanceAfter,
    },
    eventId: `credit_added:${businessId}:${amount}:${balanceAfter}`,
  })
}

export async function notifyServiceRequestCreated({ businessId, requestId, serviceTitle, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'SERVICE_REQUEST_CREATED',
    businessId,
    locale,
    vars: {
      request_id: requestId,
      service_title: serviceTitle,
      service_name: serviceTitle,
    },
    eventId: `svc_req:${requestId}`,
  })
}

export async function notifyServiceRequestStatusChanged({ businessId, requestId, serviceTitle, oldStatus, newStatus, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'SERVICE_REQUEST_STATUS_CHANGED',
    businessId,
    locale,
    vars: {
      request_id: requestId,
      service_title: serviceTitle,
      service_name: serviceTitle,
      old_status: oldStatus,
      new_status: newStatus,
    },
    eventId: `svc_status:${requestId}:${newStatus}`,
  })
}

export async function notifyCandidateStatusChanged({
  businessId,
  applicationId,
  candidateName,
  jobTitle,
  sourceType,
  oldStatus,
  newStatus,
  locale,
  eventSuffix = '',
}) {
  const lang = locale === 'en' ? 'en' : 'ja'
  return sendBusinessNotificationEmail({
    templateKey: 'CANDIDATE_STATUS_CHANGED',
    businessId,
    locale: lang,
    vars: {
      application_id: applicationId,
      candidate_name: candidateName,
      job_title: jobTitle,
      candidate_source: sourceLabel(sourceType, lang),
      old_status: statusLabel(oldStatus, lang),
      new_status: statusLabel(newStatus, lang),
    },
    eventId: `app_status:${applicationId}:${oldStatus}->${newStatus}${eventSuffix}`,
  })
}

export async function notifyManagedScoutHearingAccepted({ businessId, requestId, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'MANAGED_SCOUT_HEARING_ACCEPTED',
    businessId,
    locale,
    vars: { request_id: requestId },
    eventId: `hearing_ok:${requestId}`,
  })
}

export async function notifyManagedScoutHearingDeclined({ businessId, requestId, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'MANAGED_SCOUT_HEARING_DECLINED',
    businessId,
    locale,
    vars: { request_id: requestId },
    eventId: `hearing_no:${requestId}`,
  })
}

export async function notifyManagedScoutContractCompleted({ businessId, requestId, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'MANAGED_SCOUT_CONTRACT_COMPLETED',
    businessId,
    locale,
    vars: { request_id: requestId },
    eventId: `contract_done:${requestId}`,
  })
}

export async function notifyManagedScoutFormalReferral({ businessId, applicationId, candidateName, jobTitle, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'MANAGED_SCOUT_FORMAL_REFERRAL',
    businessId,
    locale,
    vars: {
      application_id: applicationId,
      candidate_name: candidateName,
      job_title: jobTitle,
    },
    eventId: `formal_ref:${applicationId}`,
  })
}

export async function notifyReferralMessageNew({ businessId, referralId, senderName, messagePreview, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'REFERRAL_MESSAGE_NEW',
    businessId,
    locale,
    vars: {
      referral_id: referralId,
      sender_name: senderName,
      message_preview: String(messagePreview || '').slice(0, 120),
    },
    eventId: `ref_msg:${referralId}:${String(messagePreview).slice(0, 32)}`,
  })
}

export async function notifyWorkstationMessageNew({ businessId, conversationId, senderName, messagePreview, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'WORKSTATION_MESSAGE_NEW',
    businessId,
    locale,
    vars: {
      conversation_id: conversationId,
      sender_name: senderName || 'Workstation',
      message_preview: String(messagePreview || '').slice(0, 120),
    },
    eventId: `ws_msg:${conversationId}:${Date.now()}`,
    skipIdempotency: true,
  })
}

export async function notifyPartnerJobPublished({ businessId, jobId, jobTitle, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'PARTNER_JOB_PUBLISHED',
    businessId,
    locale,
    vars: { job_id: jobId, job_title: jobTitle },
    eventId: `job_pub:${jobId}`,
  })
}

export async function notifyPartnerJobRevisionRequired({ businessId, jobId, jobTitle, reason, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'PARTNER_JOB_REVISION_REQUIRED',
    businessId,
    locale,
    vars: {
      job_id: jobId,
      job_title: jobTitle,
      revision_reason: reason || '',
    },
    eventId: `job_rev:${jobId}`,
  })
}

export async function notifyPaymentRequestCreated({ businessId, paymentId, amount, dueDate, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'PAYMENT_REQUEST_CREATED',
    businessId,
    locale,
    vars: {
      payment_id: paymentId,
      amount,
      due_date: dueDate,
    },
    eventId: `pay_req:${paymentId}`,
  })
}

export async function notifyPaymentConfirmed({ businessId, paymentId, amount, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'PAYMENT_CONFIRMED',
    businessId,
    locale,
    vars: { payment_id: paymentId, amount },
    eventId: `pay_ok:${paymentId}`,
  })
}

export async function notifyInvoiceIssued({ businessId, invoiceId, invoiceCode, amount, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'INVOICE_ISSUED',
    businessId,
    locale,
    vars: {
      invoice_id: invoiceId,
      invoice_code: invoiceCode,
      amount,
    },
    eventId: `inv:${invoiceId}`,
  })
}

export async function notifyInterviewScheduleUpdated({ businessId, applicationId, candidateName, interviewAt, locale }) {
  return sendBusinessNotificationEmail({
    templateKey: 'INTERVIEW_SCHEDULE_UPDATED',
    businessId,
    locale,
    vars: {
      application_id: applicationId,
      candidate_name: candidateName,
      interview_at: interviewAt,
    },
    eventId: `interview:${applicationId}:${interviewAt}`,
  })
}

/** Load job application context for business emails */
export async function loadApplicationEmailContext(applicationId) {
  const app = await JobApplication.findByPk(applicationId, {
    include: [
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'titleEn', 'businessId'] },
      { model: CVStorage, as: 'cv', required: false, attributes: ['id', 'name'] },
      { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'code'] },
    ],
  })
  if (!app?.job?.businessId) return null
  return {
    businessId: app.job.businessId,
    applicationId: app.id,
    candidateName: app.cv?.name || 'Candidate',
    jobTitle: app.job.title || app.job.titleEn || '',
    partnerName: app.collaborator?.name || app.collaborator?.code || 'Partner',
  }
}

export async function dispatchApplicationStatusEmails({
  applicationId,
  oldStatus,
  newStatus,
  sourceType,
  changedBy = 'admin',
  interviewDate,
}) {
  if (changedBy === 'business') return

  const ctx = await loadApplicationEmailContext(applicationId)
  if (!ctx) return

  const locale = 'ja'
  const ns = Number(newStatus)
  const os = Number(oldStatus)

  if (ns === 20) {
    fireBusinessNotificationEmail(notifyManagedScoutHearingAccepted({
      businessId: ctx.businessId,
      requestId: ctx.applicationId,
      locale,
    }))
  } else if (ns === 4 && sourceType === 'scout_performance') {
    fireBusinessNotificationEmail(notifyManagedScoutHearingDeclined({
      businessId: ctx.businessId,
      requestId: ctx.applicationId,
      locale,
    }))
  } else if (ns === 23) {
    fireBusinessNotificationEmail(notifyManagedScoutFormalReferral({
      businessId: ctx.businessId,
      applicationId: ctx.applicationId,
      candidateName: ctx.candidateName,
      jobTitle: ctx.jobTitle,
      locale,
    }))
  } else if (ns === 7 && interviewDate) {
    fireBusinessNotificationEmail(notifyInterviewScheduleUpdated({
      businessId: ctx.businessId,
      applicationId: ctx.applicationId,
      candidateName: ctx.candidateName,
      interviewAt: interviewDate,
      locale,
    }))
  }

  fireBusinessNotificationEmail(notifyCandidateStatusChanged({
    ...ctx,
    sourceType,
    oldStatus: os,
    newStatus: ns,
    locale,
    eventSuffix: changedBy === 'system' ? ':auto' : '',
  }))
}

export { fireBusinessNotificationEmail, FRONTEND_URL }
