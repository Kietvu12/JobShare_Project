import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../../../../context/LanguageContext'
import { SUPPORTED_LOCALES, getLocaleFromPathname } from '../../../../../../../utils/localeRoutes'
import { OG_LOCALE, buildLandingSeoUrl, landingSeoI18n } from '../../../../../../../i18n/businessApp/landingSeo'

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  const created = !el
  const prev = el?.getAttribute('content') ?? ''
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
  return () => (created ? el.remove() : el.setAttribute('content', prev))
}

function resolveBusinessLandingSeoContext(pathname, language) {
  const localeFromPath = getLocaleFromPathname(pathname)
  if (localeFromPath && pathname.startsWith(`/${localeFromPath}/business`)) {
    return {
      locale: localeFromPath,
      basePath: `/${localeFromPath}/business`,
    }
  }
  if (pathname.startsWith('/landing/business')) {
    const locale = landingSeoI18n[language] ? language : 'vi'
    return { locale, basePath: '/landing/business' }
  }
  return null
}

/**
 * Meta SEO theo route/ngôn ngữ cho /{lang}/business/* và /landing/business/*.
 * Title trang chủ: JobShare (landingSeoI18n). Title trang con do hook từng trang đặt.
 */
export function useLandingSeo() {
  const { pathname } = useLocation()
  const { language } = useLanguage()

  useEffect(() => {
    const ctx = resolveBusinessLandingSeoContext(pathname, language)
    if (!ctx) return undefined

    const { locale, basePath } = ctx
    const sub = pathname.slice(basePath.length)
    const isHome = !sub || sub === '/'
    const seo = landingSeoI18n[locale] || landingSeoI18n.vi
    const url = buildLandingSeoUrl(locale, sub)
    const restores = []

    const applyHomeTitle = () => {
      if (isHome) document.title = seo.title
    }
    applyHomeTitle()
    // Sau mọi useEffect của trang con (vd. useHomePage cũ) trong cùng lần render
    queueMicrotask(applyHomeTitle)

    restores.push(
      setMeta('name', 'description', seo.description),
      setMeta('property', 'og:title', isHome ? seo.title : document.title),
      setMeta('property', 'og:description', seo.description),
      setMeta('property', 'og:url', url),
      setMeta('property', 'og:locale', OG_LOCALE[locale]),
      setMeta('name', 'twitter:title', isHome ? seo.title : document.title),
      setMeta('name', 'twitter:description', seo.description),
    )

    let canonical = document.head.querySelector('link[rel="canonical"]')
    const canonicalCreated = !canonical
    const prevCanonical = canonical?.getAttribute('href')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    const oldAlternates = [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')]
    const oldParents = oldAlternates.map((el) => el.parentNode)
    oldAlternates.forEach((el) => el.remove())
    const newAlternates = [...SUPPORTED_LOCALES, 'x-default'].map((code) => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'alternate')
      link.setAttribute('hreflang', code)
      link.setAttribute('href', buildLandingSeoUrl(code === 'x-default' ? 'vi' : code, sub))
      document.head.appendChild(link)
      return link
    })

    return () => {
      restores.forEach((restore) => restore())
      newAlternates.forEach((el) => el.remove())
      oldAlternates.forEach((el, i) => oldParents[i]?.appendChild(el))
      if (canonicalCreated) canonical.remove()
      else if (prevCanonical != null) canonical.setAttribute('href', prevCanonical)
    }
  }, [pathname, language])
}
