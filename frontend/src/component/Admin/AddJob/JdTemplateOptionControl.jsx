import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export const JD_TEMPLATE_EXP_YEARS_OPTIONS = {
  vi: [
    { value: 'Không yêu cầu', label: 'Không yêu cầu' },
    { value: 'Không cần kinh nghiệm', label: 'Không cần kinh nghiệm' },
    { value: '1 năm trở lên', label: '1 năm trở lên' },
    { value: '2 năm trở lên', label: '2 năm trở lên' },
    { value: '3 năm trở lên', label: '3 năm trở lên' },
    { value: '5 năm trở lên', label: '5 năm trở lên' },
    { value: '10 năm trở lên', label: '10 năm trở lên' },
  ],
  en: [
    { value: 'No requirement', label: 'No requirement' },
    { value: 'No experience required', label: 'No experience required' },
    { value: '1+ years', label: '1+ years' },
    { value: '2+ years', label: '2+ years' },
    { value: '3+ years', label: '3+ years' },
    { value: '5+ years', label: '5+ years' },
    { value: '10+ years', label: '10+ years' },
  ],
  jp: [
    { value: '不問', label: '不問' },
    { value: '未経験可', label: '未経験可' },
    { value: '1年以上', label: '1年以上' },
    { value: '2年以上', label: '2年以上' },
    { value: '3年以上', label: '3年以上' },
    { value: '5年以上', label: '5年以上' },
    { value: '10年以上', label: '10年以上' },
  ],
};

/** Typography tokens for all template option controls (select + custom dropdowns). */
export function getJdTemplateOptionTypography(compactPreview) {
  return {
    /** In compact preview, font size comes from CSS `--jd-fs-body` on `.jd-template-option-control`. */
    useThemeFontSize: !!compactPreview,
    fontSize: compactPreview ? undefined : '12px',
    lineHeight: '1.35',
    chevronClass: compactPreview ? 'h-2.5 w-2.5' : 'h-3 w-3',
    padClass: compactPreview ? 'py-0 px-1' : 'py-0.5 px-1.5',
  };
}

function optionControlStyle(typo) {
  if (!typo) return undefined;
  if (typo.useThemeFontSize) return { lineHeight: typo.lineHeight };
  return { fontSize: typo.fontSize, lineHeight: typo.lineHeight };
}

export { optionControlStyle as jdTemplateOptionControlStyle };

const PANEL_VIEWPORT_MARGIN = 8;
const PANEL_MIN_WIDTH = 240;
const PANEL_PREFERRED_WIDTH = 300;

function computeDropdownPanelLayout(triggerRect) {
  const vw = window.innerWidth;
  const maxWidth = vw - PANEL_VIEWPORT_MARGIN * 2;
  let width = Math.min(
    Math.max(triggerRect.width, PANEL_MIN_WIDTH, PANEL_PREFERRED_WIDTH),
    maxWidth,
  );
  let left = triggerRect.left;
  if (left + width > vw - PANEL_VIEWPORT_MARGIN) {
    left = vw - PANEL_VIEWPORT_MARGIN - width;
  }
  if (left < PANEL_VIEWPORT_MARGIN) {
    left = PANEL_VIEWPORT_MARGIN;
    width = Math.min(width, vw - PANEL_VIEWPORT_MARGIN * 2);
  }
  return { left, width };
}

export function JdTemplateMultiDropdown({
  values,
  onChange,
  options,
  placeholder = '—',
  className = '',
  emptyLabel,
  typography,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);

  const selected = Array.isArray(values) ? values : [];
  const selectedSet = new Set(selected);
  const typo = typography || getJdTemplateOptionTypography(false);

  const updatePanelPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const { left, width } = computeDropdownPanelLayout(rect);
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left,
      width,
      maxWidth: width,
      boxSizing: 'border-box',
      zIndex: 10060,
      fontSize: computed.fontSize,
      lineHeight: computed.lineHeight || typo.lineHeight || '1.35',
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePanelPosition();
    const onScroll = () => updatePanelPosition();
    const onResize = () => updatePanelPosition();
    const onDoc = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  const summary = () => {
    if (!selected.length) return emptyLabel || placeholder;
    if (selected.length === 1) {
      const opt = options.find((o) => o.value === selected[0]);
      return opt?.label || selected[0];
    }
    return `${selected.length} ${placeholder === '—' ? 'mục' : 'selected'}`;
  };

  const toggle = (value) => {
    const next = selectedSet.has(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  const controlStyle = optionControlStyle(typo);
  const checkboxSize = panelStyle?.fontSize || typo.fontSize || '12px';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`jd-template-option-control ${className} flex w-full items-center justify-between gap-1 text-left font-normal`}
        style={controlStyle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{summary()}</span>
        <ChevronDown className={`${typo.chevronClass} shrink-0 opacity-50`} strokeWidth={2} />
      </button>
      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="jd-template-option-panel max-h-44 overflow-y-auto overflow-x-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg text-slate-900"
        >
          {options.map((opt) => {
            const checked = selectedSet.has(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-2 px-2 py-1 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  style={{ width: checkboxSize, height: checkboxSize, minWidth: checkboxSize }}
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                />
                <span className="min-w-0 flex-1 break-words leading-[inherit]">{opt.label}</span>
              </label>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

export function JdTemplatePickerButton({
  label,
  placeholder = '—',
  className = '',
  onClick,
  typography,
}) {
  const typo = typography || getJdTemplateOptionTypography(false);
  return (
    <button
      type="button"
      className={`jd-template-option-control ${className} flex w-full items-center justify-between gap-1 text-left font-normal`}
      style={optionControlStyle(typo)}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1 truncate">{label || placeholder}</span>
      <ChevronDown className={`${typo.chevronClass} shrink-0 opacity-50`} strokeWidth={2} />
    </button>
  );
}
