import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Thông báo trượt vào từ bên phải (góc dưới), có nút đóng X.
 */
export default function SlideInNotice({
  open,
  onClose,
  title,
  message,
  actionLabel,
  onAction,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[10050]"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto fixed bottom-4 right-4 w-[min(100vw-2rem,380px)] transform transition-all duration-300 ease-out ${
          visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="absolute left-0 top-0 h-full w-1 bg-red-600" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-4 py-3 pr-10">
            {title ? (
              <div className="text-sm font-bold text-slate-900">{title}</div>
            ) : null}
            {message ? (
              <p className="mt-1 text-sm leading-snug text-slate-600">{message}</p>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
