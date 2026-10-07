import React from 'react';
import { LP_CONTENT_LOCALES } from '../../utils/landingPageContentLocale';

const LABELS = { vi: 'VI', en: 'EN', ja: 'JA' };

export default function LandingPageContentLocaleSwitcher({
  value = 'vi',
  onChange,
  label = 'Nội dung',
  className = '',
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{label}</span>
      <div className="inline-flex rounded-md bg-slate-100 p-0.5">
        {LP_CONTENT_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onChange?.(code)}
            className={`min-w-[2rem] rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
              value === code
                ? 'bg-white text-[#0077B6] shadow-sm'
                : 'text-slate-600 hover:text-[#0077B6]'
            }`}
            aria-pressed={value === code}
          >
            {LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
}
