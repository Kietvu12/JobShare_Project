import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { switchLocaleInPathname } from '../../../../utils/localeRoutes';
import { BUSINESS_LANGUAGES } from '../i18n/businessLandingI18n';

export default function BusinessLanguageSwitcher({ compact = false, className = '' }) {
  const { language, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const active = BUSINESS_LANGUAGES.find((l) => l.code === language) || BUSINESS_LANGUAGES[2];

  const handleChange = (langCode) => {
    changeLanguage(langCode);
    const nextPath = switchLocaleInPathname(location.pathname, langCode);
    const nextUrl = `${nextPath}${location.search}${location.hash}`;
    if (nextUrl !== `${location.pathname}${location.search}${location.hash}`) {
      navigate(nextUrl, { replace: true });
    }
    setOpen(false);
  };

  if (compact) {
    return (
      <div ref={ref} className={`relative inline-flex ${className}`}>
        <div className="inline-flex rounded-[4px] border border-[#d3d6d8] overflow-hidden bg-white">
          {BUSINESS_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleChange(lang.code)}
              className={`px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
                language === lang.code
                  ? 'bg-[#0576b6] text-white'
                  : 'text-[#282c32] hover:bg-[#f0f7fb] hover:text-[#0576b6]'
              }`}
              aria-label={lang.label}
              aria-pressed={language === lang.code}
            >
              {lang.short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-[4px] border-2 border-[#0576b6] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#0576b6] hover:bg-[#0576b6] hover:text-white transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{active.short}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[148px] overflow-hidden rounded-[6px] border border-[#d3d6d8] bg-white py-1 shadow-lg"
        >
          {BUSINESS_LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={language === lang.code}>
              <button
                type="button"
                onClick={() => handleChange(lang.code)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] font-bold transition-colors ${
                  language === lang.code
                    ? 'bg-[#f0f7fb] text-[#0576b6]'
                    : 'text-[#282c32] hover:bg-[#f8f9fa]'
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-[11px] font-extrabold opacity-60">{lang.short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
