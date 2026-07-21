import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Monitor, Smartphone, Tablet } from 'lucide-react';

const PRESETS = [
  { id: 'full', label: '100%', width: null, icon: Monitor },
  { id: 'desktop', label: '1280', width: 1280, icon: Monitor },
  { id: 'tablet', label: '768', width: 768, icon: Tablet },
  { id: 'mobile', label: '375', width: 375, icon: Smartphone },
];

const MIN_W = 280;
const MAX_W = 1600;

export default function PreviewViewportFrame({
  title,
  children,
  storageKey = 'wjs-preview-width',
}) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const [frameWidth, setFrameWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === 'full') return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= MIN_W ? n : null;
    } catch {
      return null;
    }
  });
  const [activePreset, setActivePreset] = useState(() => (frameWidth == null ? 'full' : 'custom'));
  const [dragging, setDragging] = useState(false);
  const [maxWidth, setMaxWidth] = useState(MAX_W);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      setMaxWidth(Math.max(MIN_W, el.clientWidth - 48));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const persistWidth = useCallback((w, presetId) => {
    try {
      if (w == null) localStorage.setItem(storageKey, 'full');
      else localStorage.setItem(storageKey, String(Math.round(w)));
    } catch {
      // ignore
    }
    setActivePreset(presetId || 'custom');
  }, [storageKey]);

  const applyWidth = useCallback((w, presetId) => {
    if (w == null) {
      setFrameWidth(null);
      persistWidth(null, presetId || 'full');
      return;
    }
    const clamped = Math.min(maxWidth, Math.max(MIN_W, w));
    setFrameWidth(clamped);
    persistWidth(clamped, presetId || 'custom');
  }, [maxWidth, persistWidth]);

  const startDrag = useCallback((side, clientX) => {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    dragRef.current = { side, startW: rect.width, startX: clientX };
    setDragging(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = e.clientX - d.startX;
      const newW = d.side === 'right' ? d.startW + delta : d.startW - delta;
      applyWidth(newW, 'custom');
    };

    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, applyWidth]);

  const widthLabel = frameWidth == null
    ? `${containerRef.current?.clientWidth ? Math.min(containerRef.current.clientWidth - 48, maxWidth) : '—'}px (full)`
    : `${Math.round(frameWidth)}px`;

  return (
    <div ref={containerRef} className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-700 text-white text-[10px] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{title}</span>
          <span className="opacity-70 hidden sm:inline">· Kéo cạnh trái/phải để đổi chiều ngang</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="opacity-80 mr-1 tabular-nums">{widthLabel}</span>
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                title={`${p.label}px`}
                onClick={() => applyWidth(p.width, p.id)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                  active ? 'bg-blue-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 overflow-auto p-4 flex justify-center ${dragging ? 'select-none' : ''}`}>
        <div
          ref={frameRef}
          className="relative bg-white shadow-lg rounded-lg overflow-visible border border-slate-200 shrink-0 transition-[width] duration-75"
          style={{ width: frameWidth == null ? '100%' : `${frameWidth}px`, maxWidth: '100%' }}
        >
          {/* Handle trái */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Kéo để đổi chiều rộng"
            onMouseDown={(e) => { e.preventDefault(); startDrag('left', e.clientX); }}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 flex items-center justify-center group hover:bg-blue-500/20"
          >
            <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
          </div>

          {children}

          {/* Handle phải */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Kéo để đổi chiều rộng"
            onMouseDown={(e) => { e.preventDefault(); startDrag('right', e.clientX); }}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 flex items-center justify-center group hover:bg-blue-500/20"
          >
            <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
