import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

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
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  optionSize = 'compact',
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState(null);

  const normalizedValue = value == null ? '' : String(value);
  const selectedOption = options.find((opt) => String(opt.value) === normalizedValue);
  const displayLabel = selectedOption?.label || placeholder;

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => String(opt.label || '').toLowerCase().includes(q));
  }, [options, searchable, searchQuery]);

  const optionTextClass = optionSize === 'comfortable'
    ? 'text-sm leading-snug'
    : 'text-[9px] leading-snug';

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
    if (!open) {
      setSearchQuery('');
      return undefined;
    }
    updatePanelPosition();
    if (searchable) {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
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
  }, [open, searchable]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setSearchQuery('');
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
          className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {searchable ? (
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
              <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`min-w-0 flex-1 bg-transparent outline-none ${optionSize === 'comfortable' ? 'text-sm' : 'text-[9px]'}`}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ) : null}
          <div className="overflow-y-auto overflow-x-hidden py-1" style={{ maxHeight: searchable ? panelStyle.maxHeight - 52 : panelStyle.maxHeight }}>
          {filteredOptions.length === 0 ? (
            <div className={`px-3 py-2 text-gray-400 ${optionTextClass}`}>
              Không tìm thấy kết quả
            </div>
          ) : filteredOptions.map((opt) => {
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
                className={`flex w-full items-start gap-1.5 px-2 py-1.5 text-left ${optionTextClass} transition-colors ${
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
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
