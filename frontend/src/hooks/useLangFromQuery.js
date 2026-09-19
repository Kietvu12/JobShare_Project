import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { isSupportedLocale } from '../utils/localeRoutes'

/** Áp ngôn ngữ từ `?lang=` (link từ landing /{lang}/business) vào LanguageContext. */
export function useLangFromQuery() {
  const { language, changeLanguage } = useLanguage()

  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang')
    if (lang && isSupportedLocale(lang) && lang !== language) changeLanguage(lang)
    // Chỉ chạy khi mount: sau đó người dùng tự đổi ngôn ngữ bằng nút chọn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
