import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { ensurePdfJsWorker, pdfjsLib } from '../../utils/pdfJsWorker.js';

const MAX_PIXEL_RATIO = 3;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;
const WIDTH_EPS = 8;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

async function loadPdfDocument(url) {
  await ensurePdfJsWorker();
  if (url.startsWith('blob:')) {
    const data = await fetch(url).then((res) => res.arrayBuffer());
    return pdfjsLib.getDocument({ data }).promise;
  }
  return pdfjsLib.getDocument({ url }).promise;
}

/** Render PDF blob/data URL on canvas — fit width mặc định, có zoom in/out. */
export default function PdfBlobViewer({ url, className = '', style }) {
  const scrollRef = useRef(null);
  const pdfDocRef = useRef(null);
  const loadedUrlRef = useRef(null);
  const widthRef = useRef(0);
  const renderGenRef = useRef(0);

  const [initialLoading, setInitialLoading] = useState(Boolean(url));
  const [renderTick, setRenderTick] = useState(0);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);

  const bumpRender = useCallback(() => {
    setRenderTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return undefined;
    const node = scrollRef.current;
    let timer = null;

    const applyWidth = (nextWidth) => {
      const w = Math.floor(nextWidth);
      if (Math.abs(w - widthRef.current) < WIDTH_EPS) return;
      widthRef.current = w;
      bumpRender();
    };

    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(timer);
      timer = setTimeout(() => applyWidth(entry.contentRect.width), 120);
    });
    ro.observe(node);
    applyWidth(node.clientWidth);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [bumpRender]);

  useEffect(() => {
    setZoom(1);
  }, [url]);

  useEffect(() => {
    if (!url) {
      pdfDocRef.current = null;
      loadedUrlRef.current = null;
      setInitialLoading(false);
      setError(null);
      if (scrollRef.current) scrollRef.current.replaceChildren();
      return undefined;
    }

    let cancelled = false;
    setInitialLoading(true);
    setError(null);

    (async () => {
      try {
        if (loadedUrlRef.current !== url) {
          pdfDocRef.current?.destroy?.();
          pdfDocRef.current = await loadPdfDocument(url);
          loadedUrlRef.current = url;
        }
        if (cancelled) return;
        setInitialLoading(false);
        bumpRender();
      } catch (e) {
        if (!cancelled) {
          pdfDocRef.current = null;
          loadedUrlRef.current = null;
          setError(e?.message || 'Không thể tải PDF');
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, bumpRender]);

  useEffect(() => {
    const pdf = pdfDocRef.current;
    const container = scrollRef.current;
    if (!pdf || !container || initialLoading) return undefined;

    const gen = renderGenRef.current + 1;
    renderGenRef.current = gen;
    let cancelled = false;

    (async () => {
      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (cancelled || renderGenRef.current !== gen) return;

        const width = widthRef.current || container.clientWidth || 800;
        const maxWidth = Math.max(width - 32, 200);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        const fragment = document.createDocumentFragment();

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (cancelled || renderGenRef.current !== gen) return;
          const page = await pdf.getPage(pageNum);
          if (cancelled || renderGenRef.current !== gen) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = maxWidth / baseViewport.width;
          const displayScale = fitScale * zoom;
          const renderScale = displayScale * pixelRatio;
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          const displayWidth = Math.floor(viewport.width / pixelRatio);
          const displayHeight = Math.floor(viewport.height / pixelRatio);
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;
          canvas.className = 'mx-auto block bg-white mb-4 shadow-sm';

          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
            intent: 'print',
          }).promise;
          if (cancelled || renderGenRef.current !== gen) return;
          fragment.appendChild(canvas);
        }

        if (cancelled || renderGenRef.current !== gen) return;
        container.replaceChildren(fragment);
      } catch (e) {
        if (!cancelled && renderGenRef.current === gen) {
          setError(e?.message || 'Không thể hiển thị PDF');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialLoading, renderTick, zoom]);

  const changeZoom = useCallback((delta) => {
    setZoom((prev) => clampZoom(Number((prev + delta).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleWheel = useCallback((event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    changeZoom(delta);
  }, [changeZoom]);

  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`} style={style}>
      <div
        className="flex flex-shrink-0 items-center justify-center gap-1 border-b px-3 py-1.5"
        style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
      >
        <button
          type="button"
          onClick={() => changeZoom(-ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM || initialLoading}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          title="Thu nhỏ (Ctrl + cuộn)"
          aria-label="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-gray-700">
          {zoomLabel}
        </span>
        <button
          type="button"
          onClick={() => changeZoom(ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM || initialLoading}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          title="Phóng to (Ctrl + cuộn)"
          aria-label="Phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          disabled={initialLoading || zoom === 1}
          className="ml-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40 inline-flex items-center gap-1"
          title="Vừa khung"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Vừa khung
        </button>
      </div>

      {initialLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
            style={{ borderColor: '#2563eb' }}
          />
        </div>
      )}
      {error && (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-red-600">{error}</div>
      )}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto bg-neutral-100 p-4"
        onWheel={handleWheel}
      />
    </div>
  );
}
