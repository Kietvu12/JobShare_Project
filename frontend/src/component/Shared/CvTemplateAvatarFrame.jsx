import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_AVATAR_FRAME,
  clampAvatarScale,
  getCoverBaseSize,
  normalizeAvatarFrame,
} from '../../utils/cvAvatarFrameUtils.js';

/**
 * Khung ảnh chân dung trên CV template — kéo để di chuyển, cuộn chuột / kéo góc để phóng to.
 * Transform lưu trong formData.cvTableLayout.avatarFrame.
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
  const containerRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [dragMode, setDragMode] = useState(null);
  const dragStartRef = useRef(null);
  const prevSrcRef = useRef(src);
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;
  const currentFrame = normalizeAvatarFrame(frame);

  useEffect(() => {
    if (src !== prevSrcRef.current) {
      prevSrcRef.current = src;
      onFrameChangeRef.current?.({ ...DEFAULT_AVATAR_FRAME });
    }
  }, [src]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setContainerSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const commitFrame = useCallback(
    (patch) => {
      if (typeof onFrameChange !== 'function') return;
      onFrameChange({ ...currentFrame, ...patch });
    },
    [currentFrame, onFrameChange]
  );

  useEffect(() => {
    if (!dragMode) return undefined;
    const onMove = (e) => {
      const start = dragStartRef.current;
      if (!start) return;
      if (dragMode === 'pan') {
        commitFrame({
          x: start.frameX + (e.clientX - start.x),
          y: start.frameY + (e.clientY - start.y),
        });
      } else if (dragMode === 'resize') {
        const delta = (e.clientX - start.x + e.clientY - start.y) / 80;
        commitFrame({ scale: clampAvatarScale(start.scale + delta) });
      }
    };
    const onUp = () => {
      setDragMode(null);
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragMode, commitFrame]);

  const onPanStart = (e) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    setDragMode('pan');
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      frameX: currentFrame.x,
      frameY: currentFrame.y,
    };
  };

  const onResizeStart = (e) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDragMode('resize');
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scale: currentFrame.scale,
    };
  };

  const onWheel = (e) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = -e.deltaY * 0.002;
    commitFrame({ scale: clampAvatarScale(currentFrame.scale * (1 + delta)) });
  };

  const coverBase = getCoverBaseSize(
    naturalSize?.w,
    naturalSize?.h,
    containerSize.w,
    containerSize.h
  );
  const displayW = coverBase.w * currentFrame.scale;
  const displayH = coverBase.h * currentFrame.scale;
  const hasLayout = naturalSize && containerSize.w > 0 && containerSize.h > 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-white ${className}`.trim()}
      style={{ width, height, ...style }}
      title={interactive ? 'Kéo để di chuyển · Cuộn chuột hoặc kéo góc để phóng to' : undefined}
      onWheel={interactive ? onWheel : undefined}
    >
      {src ? (
        <>
          <img
            src={src}
            alt="avatar"
            draggable={false}
            onLoad={(e) => {
              setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
            }}
            onMouseDown={interactive ? onPanStart : undefined}
            style={
              hasLayout
                ? {
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${displayW}px`,
                    height: `${displayH}px`,
                    transform: `translate(calc(-50% + ${currentFrame.x}px), calc(-50% + ${currentFrame.y}px))`,
                    maxWidth: 'none',
                    display: 'block',
                    cursor: interactive ? (dragMode === 'pan' ? 'grabbing' : 'grab') : 'default',
                    userSelect: 'none',
                  }
                : {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }
            }
          />
          {interactive && hasLayout ? (
            <div
              role="presentation"
              className="absolute bottom-0 right-0 z-10 h-3 w-3 cursor-nwse-resize border border-white bg-slate-600/80 shadow-sm cv-pdf-hide"
              onMouseDown={onResizeStart}
              title="Kéo để phóng to / thu nhỏ"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
