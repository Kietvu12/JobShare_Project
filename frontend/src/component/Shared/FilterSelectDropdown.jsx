import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

const PANEL_VIEWPORT_MARGIN = 8;
const PANEL_MIN_WIDTH = 200;

function computePanelLayout(triggerRect) {
  const vw = window.innerWidth;
  const maxWidth = vw - PANEL_VIEWPORT_MARGIN * 2;
  let width = Math.min(Math.max(triggerRect.width, PANEL_MIN_WIDTH), maxWidth);
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

/**
 * Custom single-select dropdown for compact filter panels (Scout / Agent).
 */
export default function FilterSelectDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn',
  disabled = false,
  className = '',
  maxPanelHeight = 176,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);

  const normalizedValue = value == null ? '' : String(value);
  const selectedOption = options.find((opt) => String(opt.value) === normalizedValue);
  const displayLabel = selectedOption?.label || placeholder;

  const updatePanelPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { left, width } = computePanelLayout(rect);
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_VIEWPORT_MARGIN;
    const spaceAbove = rect.top - PANEL_VIEWPORT_MARGIN;
    const openUpward = spaceBelow < 120 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      maxPanelHeight,
      openUpward ? spaceAbove - 4 : spaceBelow - 4,
    );

    setPanelStyle({
      position: 'fixed',
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      left,
      width,
      maxWidth: width,
      maxHeight: Math.max(maxHeight, 80),
      boxSizing: 'border-box',
      zIndex: 10060,
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
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`flex w-full items-center justify-between gap-1 text-left font-normal disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={panelStyle}
          className="overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const optValue = String(opt.value);
            const selected = optValue === normalizedValue;
            return (
              <button
                key={optValue || '__empty__'}
                type="button"
                role="option"
                aria-selected={selected}
                title={opt.label}
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-start gap-1.5 px-2 py-1.5 text-left text-[9px] leading-snug transition-colors ${
                  selected
                    ? 'bg-[#eff6ff] text-[#1d4ed8] font-medium'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="min-w-0 flex-1 break-words">{opt.label}</span>
                {selected ? (
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#2563eb]" strokeWidth={2.5} aria-hidden />
                ) : (
                  <span className="h-3 w-3 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
