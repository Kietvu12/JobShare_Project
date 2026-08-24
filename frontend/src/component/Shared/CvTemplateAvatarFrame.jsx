import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildAvatarFrameStyle,
  clampFrameRem,
  normalizeAvatarFrame,
  parseRemValue,
} from '../../utils/cvAvatarFrameUtils.js';

/**
 * Khung ảnh chân dung trên CV — kéo góc để đổi kích thước vùng hiển thị (khung), ảnh cover bên trong.
 * Lưu trong formData.cvTableLayout.avatarFrame: { widthRem, heightRem }.
 */
export default function CvTemplateAvatarFrame({
  src,
  frame,
  onFrameChange,
  width,
  height,
  interactive = true,
  className = '',
  style = {},
}) {
  const defaultFrame = useMemo(
    () => ({
      widthRem: parseRemValue(width) ?? 4.125,
      heightRem: parseRemValue(height) ?? 5.5,
    }),
    [width, height]
  );
  const currentFrame = normalizeAvatarFrame(frame, defaultFrame);
  const [resizing, setResizing] = useState(false);
  const dragStartRef = useRef(null);
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;

  const commitFrame = useCallback(
    (patch) => {
      if (typeof onFrameChange !== 'function') return;
      onFrameChange({ ...currentFrame, ...patch });
    },
    [currentFrame, onFrameChange]
  );

  useEffect(() => {
    if (!resizing) return undefined;
    const onMove = (e) => {
      const start = dragStartRef.current;
      if (!start) return;
      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const deltaRem = (e.clientX - start.x + e.clientY - start.y) / (2 * remPx);
      const aspect = start.widthRem / Math.max(start.heightRem, 0.01);
      const nextWidth = clampFrameRem(start.widthRem + deltaRem);
      const nextHeight = clampFrameRem(nextWidth / aspect);
      commitFrame({ widthRem: nextWidth, heightRem: nextHeight });
    };
    const onUp = () => {
      setResizing(false);
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, commitFrame]);

  const onResizeStart = (e) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      widthRem: currentFrame.widthRem,
      heightRem: currentFrame.heightRem,
    };
  };

  return (
    <div
      className={`relative overflow-hidden bg-white ${className}`.trim()}
      style={{ ...buildAvatarFrameStyle(currentFrame), ...style }}
      title={interactive ? 'Kéo góc để chỉnh kích thước khung ảnh' : undefined}
    >
      {src ? (
        <>
          <img
            src={src}
            alt="avatar"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
          {interactive ? (
            <div
              role="presentation"
              className="absolute bottom-0 right-0 z-10 h-3 w-3 cursor-nwse-resize border border-white bg-slate-600/80 shadow-sm cv-pdf-hide"
              onMouseDown={onResizeStart}
              title="Kéo góc để chỉnh kích thước khung"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
