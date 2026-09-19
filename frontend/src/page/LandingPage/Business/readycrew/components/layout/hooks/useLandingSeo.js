import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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

/**
 * Meta SEO theo route/ngôn ngữ cho /{lang}/business/*.
 * Chỉ ghi đè khi đang ở URL có locale; trả lại giá trị cũ khi rời landing.
 */
export function useLandingSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const locale = getLocaleFromPathname(pathname)
    if (!locale || !pathname.startsWith(`/${locale}/business`)) return undefined

    const sub = pathname.slice(`/${locale}/business`.length)
    const isHome = !sub || sub === '/'
    const seo = landingSeoI18n[locale]
    const url = buildLandingSeoUrl(locale, sub)
    const restores = []
    const prevTitle = document.title

    // Title các trang con do hook riêng của trang đặt; chỉ đặt cho trang chủ landing.
    if (isHome) document.title = seo.title

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

    // hreflang: thay thế toàn bộ bộ cũ bằng bộ của trang landing hiện tại
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
      document.title = prevTitle
    }
  }, [pathname])
}
