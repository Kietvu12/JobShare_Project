import * as pdfjsLib from 'pdfjs-dist';

let workerInitPromise = null;

/**
 * Khởi tạo pdf.js worker qua blob URL — không phụ thuộc MIME type server (.mjs → octet-stream).
 */
export function ensurePdfJsWorker() {
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      const current = pdfjsLib.GlobalWorkerOptions.workerSrc;
      if (typeof current === 'string' && current.startsWith('blob:')) return;

      const base = import.meta.env.BASE_URL || '/';
      const url = `${base}pdf.worker.min.js`;
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) {
        throw new Error(`Không tải được PDF worker (${res.status})`);
      }
      const blob = new Blob([await res.arrayBuffer()], { type: 'application/javascript' });
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    })();
  }
  return workerInitPromise;
}

export { pdfjsLib };
