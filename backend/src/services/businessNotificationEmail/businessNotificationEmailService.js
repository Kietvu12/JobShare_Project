import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import emailService from '../emailService.js'
import { Business } from '../../models/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:5173').replace(/\/+$/, '')

const templatesPath = path.join(__dirname, 'templates.generated.json')
const TEMPLATES = JSON.parse(fs.readFileSync(templatesPath, 'utf8'))

const FOOTER = {
  ja: '本メールはJobShare Businessから自動送信されています。\n本メールに心当たりがない場合は、破棄していただきますようお願いいたします。\n\nJobShare Business\nWorkstation',
  en: 'This is an automated email from JobShare Business.\nIf you believe you received this email by mistake, please disregard it.\n\nJobShare Business\nWorkstation',
}

const sentEventKeys = new Map()
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

function pruneIdempotency() {
  const now = Date.now()
  for (const [k, ts] of sentEventKeys) {
    if (now - ts > IDEMPOTENCY_TTL_MS) sentEventKeys.delete(k)
  }
}

export function resolveBusinessLocale(input) {
  const l = String(input || '').toLowerCase()
  if (l === 'ja' || l === 'jp') return 'ja'
  if (l === 'en') return 'en'
  return 'ja'
}

function cleanLocaleText(text) {
  return String(text || '')
    .replace(/^EN:\s*\n?/i, '')
    .replace(/^JP:\s*\n?/i, '')
    .replace(/^—$/i, '')
    .trim()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function interpolate(template, vars) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key]
    return v == null ? '' : String(v)
  })
}

function resolveCtaUrl(template, locale, vars) {
  const ctaJa = cleanLocaleText(template.cta?.ja)
  const ctaEn = cleanLocaleText(template.cta?.en)
  if (!ctaJa && !ctaEn) return null

  let route = String(template.ctaRoute || '').trim()
  const suggested = route.match(/Suggested:\s*(\S+)/i)
  if (suggested) route = suggested[1]
  if (!route || /^Public/i.test(route) || /Không bắt buộc/i.test(route) || /^Optional/i.test(route)) {
    route = `/${locale === 'ja' ? 'ja' : 'en'}/business`
  }
  route = route.replace(/\{lang\}/g, locale === 'ja' ? 'ja' : 'en')
  route = interpolate(route, vars)
  if (/^https?:\/\//i.test(route)) return route
  if (route.startsWith('/')) return `${FRONTEND_URL}${route}`
  return null
}

function pickLocaleBlock(block, locale) {
  if (!block) return ''
  const raw = locale === 'en' ? block.en : block.ja
  const fallback = locale === 'en' ? block.ja : block.en
  return cleanLocaleText(raw || fallback)
}

function buildHtml({ subject, bodyText, ctaLabel, ctaUrl, locale }) {
  const bodyHtml = escapeHtml(bodyText).replace(/\n/g, '<br/>')
  const footer = FOOTER[locale] || FOOTER.ja
  const ctaBlock = ctaUrl && ctaLabel
    ? `<p style="margin:24px 0"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0077B6;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${escapeHtml(ctaLabel)}</a></p>`
    : ''

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#1e293b;max-width:640px">
      <p style="margin:0 0 16px;font-size:13px;color:#64748b">JobShare Business</p>
      <div>${bodyHtml}</div>
      ${ctaBlock}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;white-space:pre-line">${escapeHtml(footer)}</p>
    </div>
  `.trim()
}

export async function resolveBusinessRecipientEmail(businessId) {
  if (!businessId) return null
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'email', 'contactEmail', 'companyName', 'contactName', 'contactNameJp', 'contactNameEn', 'credit'],
  })
  if (!business) return null
  const to = String(business.contactEmail || business.email || '').trim()
  if (!to) return null
  return {
    to,
    business,
    company_name: business.companyName || '',
    user_name: business.contactName || business.contactNameJp || business.companyName || '',
  }
}

/**
 * @param {object} opts
 * @param {string} opts.templateKey
 * @param {string} [opts.to]
 * @param {number} [opts.businessId]
 * @param {string} [opts.locale]
 * @param {Record<string, string|number>} [opts.vars]
 * @param {string} [opts.eventId] idempotency key
 * @param {object[]} [opts.attachments]
 */
export async function sendBusinessNotificationEmail({
  templateKey,
  to,
  businessId,
  locale = 'ja',
  vars = {},
  eventId,
  attachments,
  skipIdempotency = false,
}) {
  const template = TEMPLATES[templateKey]
  if (!template) {
    console.warn('[businessNotificationEmail] Unknown template:', templateKey)
    return { skipped: true, reason: 'unknown_template' }
  }

  if (eventId && !skipIdempotency) {
    pruneIdempotency()
    const idemKey = `${templateKey}:${eventId}`
    if (sentEventKeys.has(idemKey)) return { skipped: true, reason: 'duplicate_event' }
    sentEventKeys.set(idemKey, Date.now())
  }

  const lang = resolveBusinessLocale(locale)
  let recipient = to
  const mergedVars = { ...vars, lang }

  if (!recipient && businessId) {
    const resolved = await resolveBusinessRecipientEmail(businessId)
    if (!resolved) return { skipped: true, reason: 'no_recipient' }
    recipient = resolved.to
    mergedVars.company_name = mergedVars.company_name ?? resolved.company_name
    mergedVars.user_name = mergedVars.user_name ?? resolved.user_name
  }

  if (!recipient) return { skipped: true, reason: 'no_recipient' }

  const subject = interpolate(pickLocaleBlock(template.subject, lang), mergedVars)
  const bodyText = interpolate(pickLocaleBlock(template.body, lang), mergedVars)
  const ctaLabel = interpolate(pickLocaleBlock(template.cta, lang), mergedVars)
  const ctaUrl = resolveCtaUrl(template, lang, mergedVars)

  const html = buildHtml({ subject, bodyText, ctaLabel, ctaUrl, locale: lang })
  const text = `${bodyText}${ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : ''}\n\n${FOOTER[lang]}`

  await emailService.sendEmail({
    to: recipient,
    subject,
    text,
    html,
    attachments: attachments || undefined,
  })

  return { success: true, to: recipient, templateKey }
}

export function fireBusinessNotificationEmail(promise) {
  Promise.resolve(promise).catch((err) => {
    console.error('[businessNotificationEmail]', err?.message || err)
  })
}

export { TEMPLATES, FRONTEND_URL }
