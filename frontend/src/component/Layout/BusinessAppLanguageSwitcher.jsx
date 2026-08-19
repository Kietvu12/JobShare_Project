import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BUSINESS_APP_LANGUAGES } from '../../i18n/businessAppI18n';

/**
 * Language switcher for authenticated Business portal (/business/*).
 * Persists via LanguageContext + localStorage (routes are not locale-prefixed).
 */
export default function BusinessAppLanguageSwitcher({
  compact = true,
  collapsed = false,
  showLabel = false,
  label = '',
  className = '',
}) {
  const { language, changeLanguage } = useLanguage();

  const activeClass = 'bg-[#0077B6] text-white shadow-sm';
  const idleClass = 'text-slate-600 hover:bg-white hover:text-[#0077B6]';

  if (collapsed) {
    return (
      <div
        className={`flex flex-col items-center gap-1 ${className}`}
        role="group"
        aria-label={label || 'Language'}
      >
        {BUSINESS_APP_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[8px] font-bold uppercase transition-colors ${
              language === lang.code ? activeClass : 'text-slate-500 hover:bg-[#e8f4fa] hover:text-[#0077B6]'
            }`}
            aria-label={lang.label}
            aria-pressed={language === lang.code}
            title={lang.label}
          >
            {lang.short}
          </button>
        ))}
      </div>
    );
  }

  if (!compact) {
    return (
      <div className={className}>
        {showLabel && label ? (
          <p className="mb-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        ) : null}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[#0077B6]" aria-hidden />
          <div className="inline-flex rounded-md bg-slate-50 p-0.5">
            {BUSINESS_APP_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                  language === lang.code ? activeClass : idleClass
                }`}
                aria-label={lang.label}
                aria-pressed={language === lang.code}
              >
                {lang.short}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && label ? (
        <p className="mb-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      ) : null}
      <div
        className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        role="group"
        aria-label={label || 'Language'}
      >
        {BUSINESS_APP_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
              language === lang.code ? activeClass : idleClass
            }`}
            aria-label={lang.label}
            aria-pressed={language === lang.code}
            title={lang.label}
          >
            {lang.short}
          </button>
        ))}
      </div>
    </div>
  );
}
