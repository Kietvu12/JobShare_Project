import emailService from './emailService.js';
import config from '../config/index.js';
import { notifyContactReceived } from './businessNotificationEmail/businessNotificationEmailHooks.js';

function resolveLang(lang) {
  const l = String(lang || '').toLowerCase();
  if (l === 'ja' || l === 'jp') return 'ja';
  if (l === 'en') return 'en';
  return 'vi';
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function leadNotifyEmail() {
  return config.email?.businessContactLeadEmail
    || config.email?.businessDocumentLeadEmail
    || config.email?.from;
}

export async function sendBusinessContactInquiryEmail({
  company,
  email,
  business,
  message,
  lang = 'vi',
}) {
  const language = resolveLang(lang);

  await notifyContactReceived({
    email,
    company,
    userName: company,
    industry: business,
    inquiryContent: message,
    lang: language,
  });

  const notifyTo = leadNotifyEmail();
  if (notifyTo) {
    const adminHtml = `
      <p><strong>Company:</strong> ${escapeHtml(company)}<br>
      <strong>Email:</strong> ${escapeHtml(email)}<br>
      <strong>Business:</strong> ${escapeHtml(business)}<br>
      <strong>Lang:</strong> ${language}</p>
      <p style="margin-top:16px"><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:13px">${escapeHtml(message)}</pre>
    `;
    await emailService.sendEmail({
      to: notifyTo,
      subject: `[Lead] Business contact — ${company}`,
      html: adminHtml,
    }).catch(() => {});
  }

  return { ok: true };
}
