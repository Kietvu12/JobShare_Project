import { toBusinessLandingPath } from '../../businessLandingBase'

export function resolveBusinessLocale(basePath) {
  const match = String(basePath || '').match(/^\/(vi|en|ja)\/business/)
  return match?.[1] || 'vi'
}

export function scrollBusinessLandingToTop() {
  window.scrollTo(0, 0)
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
  const root = document.getElementById('root')
  if (root) root.scrollTop = 0
}

export function rewriteJobShareTemplateHtml(html, { locale, basePath, assetBase }) {
  let out = String(html || '')
  out = out.replace(
    /https:\/\/(?:test\.)?ws-jobshare\.com\/(?:vi|en|ja)\/business\/(contact_rc|inquiry_docs_rc)/g,
    (_, page) => toBusinessLandingPath(`/${page}`, basePath),
  )
  out = out.replace(
    /https:\/\/(?:test\.)?ws-jobshare\.com\/business\/register\?lang=(?:vi|en|ja)/g,
    `/business/register?lang=${locale}`,
  )
  out = out.replace(
    /https:\/\/(?:test\.)?ws-jobshare\.com\/business\/login\?lang=(?:vi|en|ja)/g,
    `/business/login?lang=${locale}`,
  )
  out = out.replace(
    /https:\/\/(?:test\.)?ws-jobshare\.com\/(?:vi|en|ja)\/business\/blog\//g,
    `${toBusinessLandingPath('/blog', basePath)}/`,
  )
  out = out.replaceAll(
    'src="assets/city-photo-bg.png"',
    'src="/landing/business/templates/shared/city-photo-bg.png"',
  )
  if (assetBase) out = out.replaceAll('src="assets/', `src="${assetBase}`)
  return out
}

export function replaceMainOpenTag(html, attrs) {
  if (/^<main\b/.test(html)) return html.replace(/^<main\b[^>]*>/, `<main ${attrs}>`)
  return `<main ${attrs}>${html}</main>`
}
