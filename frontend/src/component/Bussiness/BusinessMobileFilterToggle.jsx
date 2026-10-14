import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const LABELS = {
  vi: 'Bộ lọc',
  en: 'Filters',
  ja: '絞り込み',
}

/** Chỉ hiện dưới lg: bật/tắt nhóm bộ lọc phụ để không chiếm hết màn hình điện thoại. */
export default function BusinessMobileFilterToggle({ open, onToggle, activeCount = 0, className = '' }) {
  const { language } = useLanguage()
  const label = LABELS[language] || LABELS.vi
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-semibold transition-colors lg:hidden ${
        open || activeCount > 0
          ? 'border-[#0077B6]/40 bg-[#f0f9ff] text-[#0077B6]'
          : 'border-slate-200 bg-white text-slate-600'
      } ${className}`}
    >
      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
      {label}
      {activeCount > 0 ? (
        <span className="rounded-full bg-[#0077B6] px-1.5 text-[11px] leading-4 text-white">{activeCount}</span>
      ) : null}
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}
