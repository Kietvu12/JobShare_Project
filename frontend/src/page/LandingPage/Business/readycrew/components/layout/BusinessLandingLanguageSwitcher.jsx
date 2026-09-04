import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../../../context/LanguageContext'
import { BUSINESS_APP_LANGUAGES } from '../../../../../../i18n/businessAppI18n'
import { getLocaleFromPathname, switchLocaleInPathname } from '../../../../../../utils/localeRoutes'

export default function BusinessLandingLanguageSwitcher() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { language, changeLanguage, syncFromUrl } = useLanguage()

  const localeFromUrl = getLocaleFromPathname(pathname)
  const activeLanguage = localeFromUrl || language

  const handleChange = (lang) => {
    changeLanguage(lang)
    if (localeFromUrl) {
      navigate(switchLocaleInPathname(pathname, lang))
      return
    }
    syncFromUrl(lang)
  }

  return (
    <div className="business-landing-lang-switch" role="group" aria-label="Language">
      {BUSINESS_APP_LANGUAGES.map((lang, index) => (
        <span key={lang.code} className="business-landing-lang-switch__item">
          {index > 0 ? <span className="business-landing-lang-switch__sep" aria-hidden="true">|</span> : null}
          <button
            type="button"
            className={`business-landing-lang-switch__btn${activeLanguage === lang.code ? ' business-landing-lang-switch__btn--active' : ''}`}
            onClick={() => handleChange(lang.code)}
            aria-label={lang.label}
            aria-pressed={activeLanguage === lang.code}
          >
            {lang.short}
          </button>
        </span>
      ))}
    </div>
  )
}
