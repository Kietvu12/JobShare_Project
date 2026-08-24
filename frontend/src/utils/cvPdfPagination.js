/** Lề trang PDF — đồng bộ gần backend (@page margin 10mm). */
import { jsPDF } from 'jspdf';

export const CV_PDF_MARGIN_MM = {
  top: 10,
  right: 8,
  bottom: 10,
  left: 8,
};

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
/** Khổ ngang PDF CV client-side — rộng hơn A4 để bảng/label không bị chật. */
export const CV_PDF_PAGE_WIDTH_MM = 430;
/** Chiều cao trang PDF tối đa: A4 rộng × A3 cao — nhiều nội dung/trang, ít cắt bảng. */
export const CV_PDF_PAGE_HEIGHT_MM = 420;

export const CV_PDF_CONTENT_WIDTH_MM = CV_PDF_PAGE_WIDTH_MM - CV_PDF_MARGIN_MM.left - CV_PDF_MARGIN_MM.right;
export const CV_PDF_CONTENT_HEIGHT_MM = CV_PDF_PAGE_HEIGHT_MM - CV_PDF_MARGIN_MM.top - CV_PDF_MARGIN_MM.bottom;

export function mmToPx(mm) {
  return (mm * 96) / 25.4;
}

export const CV_PDF_PAGE_CONTENT_HEIGHT_PX = Math.round(mmToPx(CV_PDF_CONTENT_HEIGHT_MM));
export const CV_PDF_HORIZONTAL_PADDING_PX = Math.round(mmToPx(CV_PDF_MARGIN_MM.left));

const BORDER_COLOR = '#1f2937';
const MIN_SLICE_PX = 16;
const EPS = 1;

function isHiddenElement(el) {
  if (!(el instanceof Element)) return true;
  if (el.classList.contains('cv-pdf-hide')) return true;
  if (el.getAttribute('role') === 'separator') return true;
  const tag = el.tagName?.toUpperCase?.() || '';
  return tag === 'SCRIPT' || tag === 'STYLE';
}

/** Các dòng chữ trong element (px, relative root top). */
function getTextLineRects(el, rootTop) {
  if (!el) return [];
  const lines = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.textContent?.replace(/\u00a0/g, ' ').trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    Array.from(range.getClientRects()).forEach((rect) => {
      if (rect.height < 0.5) return;
      lines.push({
        top: rect.top - rootTop,
        bottom: rect.bottom - rootTop,
      });
    });
  }

  lines.sort((a, b) => a.top - b.top);
  const merged = [];
  for (const line of lines) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(line.top - last.top) < 3) {
      last.bottom = Math.max(last.bottom, line.bottom);
    } else {
      merged.push({ ...line });
    }
  }
  return merged;
}

/** Hàng bảng + khối lớn ngoài bảng — đơn vị không được cắt xuyên qua. */
function collectKeepTogetherBands(root) {
  const rootTop = root.getBoundingClientRect().top;
  const bands = [];

  const addBand = (el, type) => {
    if (!el || isHiddenElement(el)) return;
    const r = el.getBoundingClientRect();
    if (r.height < 0.5) return;
    bands.push({
      top: r.top - rootTop,
      bottom: r.bottom - rootTop,
      height: r.height,
      el,
      type,
    });
  };

  root.querySelectorAll('table').forEach((table) => addBand(table, 'table'));
  root.querySelectorAll('table tr').forEach((tr) => addBand(tr, 'tr'));

  root.querySelectorAll('[data-cv-pdf-section]').forEach((section) => {
    section.querySelectorAll(':scope > div, :scope > table').forEach((child) => {
      if (child.tagName === 'TABLE') return;
      if (!child.querySelector('table')) addBand(child, 'block');
    });
  });

  // Tiêu đề section + hàng nội dung kề (自己PR / 応募動機 / 備考) — không cắt rời.
  root.querySelectorAll('[data-cv-pdf-keep-with-next]').forEach((headerEl) => {
    const next = headerEl.nextElementSibling;
    if (!(next instanceof Element) || isHiddenElement(next)) return;
    const r1 = headerEl.getBoundingClientRect();
    const r2 = next.getBoundingClientRect();
    if (r2.bottom - r1.top < 0.5) return;
    bands.push({
      top: r1.top - rootTop,
      bottom: r2.bottom - rootTop,
      height: r2.bottom - r1.top,
      el: headerEl,
      type: 'block',
    });
  });

  bands.sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  const deduped = [];
  for (const band of bands) {
    const last = deduped[deduped.length - 1];
    if (
      last
      && band.type === 'tr'
      && last.type === 'tr'
      && band.top < last.bottom - EPS
      && band.bottom > last.top + EPS
    ) {
      deduped[deduped.length - 1] = band;
      continue;
    }
    deduped.push(band);
  }

  return deduped;
}

function cutInsideBand(y, band) {
  return band.top + EPS < y && y < band.bottom - EPS;
}

function isSafeCut(y, pageStart, bands) {
  if (y <= pageStart + MIN_SLICE_PX) return false;
  // Chỉ tránh cắt xuyên hàng/block — cho phép cắt giữa bảng ở ranh giới hàng.
  return !bands.some((b) => {
    if (b.type === 'table') return false;
    return cutInsideBand(y, b);
  });
}

/** Điểm cắt tối ưu: ưu tiên lấp đầy trang, chỉ dừng ở mép dưới hàng an toàn. */
function findBestPageCut(pageStart, pageEnd, pageH, bands, rootTop) {
  if (pageEnd >= pageStart + pageH - EPS && isSafeCut(pageEnd, pageStart, bands)) {
    return pageEnd;
  }

  const rowEnds = bands
    .filter((b) => b.type === 'tr' && b.bottom <= pageEnd + EPS && b.bottom > pageStart + MIN_SLICE_PX)
    .map((b) => b.bottom)
    .filter((y) => isSafeCut(y, pageStart, bands));

  if (rowEnds.length) {
    return Math.max(...rowEnds);
  }

  const blocker = bands
    .filter((b) => b.type !== 'table' && b.top < pageEnd - EPS && b.bottom > pageEnd + EPS)
    .sort((a, b) => b.top - a.top)[0];

  if (blocker) {
    if (blocker.top > pageStart + MIN_SLICE_PX && isSafeCut(blocker.top, pageStart, bands)) {
      return blocker.top;
    }
    if (blocker.height > pageH) {
      return findLineCutInBand(blocker, pageStart, pageEnd, rootTop);
    }
  }

  if (isSafeCut(pageEnd, pageStart, bands)) {
    return pageEnd;
  }

  const nextTop = bands.find((b) => b.type !== 'table' && b.top > pageStart + MIN_SLICE_PX)?.top;
  if (nextTop != null && nextTop < pageEnd && isSafeCut(nextTop, pageStart, bands)) {
    return nextTop;
  }

  return pageEnd;
}

// FIX Bug #3: Trả về điểm cắt an toàn nhất thay vì null khi không tìm được dòng chữ.
// Nếu có dòng chữ trong khoảng → cắt sau dòng cuối cùng.
// Nếu không có dòng nào → cắt tại band.top (trước band) nếu còn chỗ,
// ngược lại chấp nhận pageEnd để tránh vòng lặp vô tận.
function findLineCutInBand(band, pageStart, pageEnd, rootTop) {
  const lines = getTextLineRects(band.el, rootTop);
  let best = null;
  for (const line of lines) {
    if (line.bottom <= pageEnd + EPS && line.bottom > pageStart + MIN_SLICE_PX) {
      if (best === null || line.bottom > best) {
        best = line.bottom;
      }
    }
  }
  if (best !== null) return best;

  // Không tìm được dòng chữ phù hợp (ô rỗng / chứa ảnh / dòng chữ đầu vượt pageEnd)
  // → cắt ngay trước band nếu còn đủ khoảng, nếu không thì cắt tại pageEnd
  if (band.top > pageStart + MIN_SLICE_PX) return band.top;
  return pageEnd;
}

function tableSplitByCut(table, cut) {
  return table.top + EPS < cut && cut < table.bottom - EPS;
}

/**
 * Tính mốc cắt dọc theo chiều cao canvas (px).
 * Ưu tiên ngắt sau hàng bảng; không cắt xuyên hàng nếu tránh được.
 */
export function computePageBreakOffsets(root, totalHeightPx, pageContentHeightPx) {
  const total = Math.max(Math.ceil(totalHeightPx), 1);
  const pageH = Math.max(pageContentHeightPx, MIN_SLICE_PX * 2);

  if (total <= pageH + EPS) {
    return [0, total];
  }

  const rootTop = root.getBoundingClientRect().top;
  const bands = collectKeepTogetherBands(root);
  const breaks = [0];
  let pageStart = 0;

  while (pageStart < total - EPS) {
    const pageEnd = Math.min(pageStart + pageH, total);
    if (pageEnd >= total - EPS) break;

    let cut = findBestPageCut(pageStart, pageEnd, pageH, bands, rootTop);

    if (cut == null || cut <= pageStart + EPS) {
      cut = pageEnd;
    }

    breaks.push(cut);
    pageStart = cut;
    if (breaks.length > 300) break;
  }

  if (breaks[breaks.length - 1] < total - EPS) {
    breaks.push(total);
  }

  return breaks;
}

export function snapshotCellRectsForPdf(root) {
  const rootRect = root.getBoundingClientRect();
  const cells = [];
  root.querySelectorAll('td, th').forEach((cell) => {
    if (isHiddenElement(cell)) return;
    const r = cell.getBoundingClientRect();
    if (r.height < 0.5 || r.width < 0.5) return;
    cells.push({
      top: r.top - rootRect.top,
      bottom: r.bottom - rootRect.top,
      left: r.left - rootRect.left,
      right: r.right - rootRect.left,
      skipBottomRepaint: Boolean(cell.closest('[data-cv-table-footer-row]')),
    });
  });
  return cells;
}

export function buildCapturePaginationPlan(root, canvas, scale) {
  const totalHeightPx = canvas.height / scale;
  return {
    breakOffsets: computePageBreakOffsets(root, totalHeightPx, CV_PDF_PAGE_CONTENT_HEIGHT_PX),
    cellSnapshots: snapshotCellRectsForPdf(root),
    totalHeightPx,
    scale,
  };
}

function cellCrossesCutY(cell, cutY) {
  return cell.top + EPS < cutY && cutY < cell.bottom - EPS;
}

/** Vẽ viền đóng khung khi ô bị chia bởi mép cắt trang. */
function paintCellCutBorders(ctx, cellSnapshots, scale, sliceTopPx, sliceHeightPx, totalHeightPx) {
  const sliceBottomPx = sliceTopPx + sliceHeightPx;
  const lineW = Math.max(2, Math.round(scale * 0.75));

  const drawH = (cutY, left, right) => {
    const y = Math.round((cutY - sliceTopPx) * scale - lineW / 2);
    const x = Math.round(left * scale);
    const w = Math.max(Math.round((right - left) * scale), 1);
    ctx.fillStyle = BORDER_COLOR;
    ctx.fillRect(x, y, w, lineW);
  };

  const drawV = (x, y0, y1) => {
    const xPx = Math.round(x * scale - lineW / 2);
    const yPx = Math.round((y0 - sliceTopPx) * scale);
    const h = Math.max(Math.round((y1 - y0) * scale), lineW);
    ctx.fillStyle = BORDER_COLOR;
    ctx.fillRect(xPx, yPx, lineW, h);
  };

  for (const cell of cellSnapshots) {
    if (cell.bottom <= sliceTopPx + EPS || cell.top >= sliceBottomPx - EPS) continue;

    const visTop = Math.max(cell.top, sliceTopPx);
    const visBottom = Math.min(cell.bottom, sliceBottomPx);
    const cutTop = sliceTopPx > EPS && cellCrossesCutY(cell, sliceTopPx);
    const cutBottom = sliceBottomPx < totalHeightPx - EPS && cellCrossesCutY(cell, sliceBottomPx);

    if (cutTop) {
      drawH(sliceTopPx, cell.left, cell.right);
      drawV(cell.left, visTop, visBottom);
      drawV(cell.right, visTop, visBottom);
    }
    if (cutBottom) {
      drawH(sliceBottomPx, cell.left, cell.right);
      if (!cutTop) {
        drawV(cell.left, visTop, visBottom);
        drawV(cell.right, visTop, visBottom);
      }
    }
  }
}

/** Trang cuối: vẽ lại viền ngang dưới ô sát đáy tài liệu (domToCanvas thường cắt 1px). */
function paintDocumentBottomEdgeBorders(ctx, cellSnapshots, scale, sliceTopPx, sliceHeightPx, totalHeightPx) {
  const sliceBottomPx = sliceTopPx + sliceHeightPx;
  if (sliceBottomPx < totalHeightPx - 3) return;
  if (!cellSnapshots?.length) return;

  const maxBottom = cellSnapshots.reduce((m, c) => Math.max(m, c.bottom), 0);
  const lineW = Math.max(2, Math.round(scale * 0.75));
  ctx.fillStyle = BORDER_COLOR;

  for (const cell of cellSnapshots) {
    if (cell.skipBottomRepaint) continue;
    if (cell.bottom < maxBottom - 2) continue;
    if (cell.bottom <= sliceTopPx + EPS || cell.top >= sliceBottomPx - EPS) continue;

    const cutY = Math.min(cell.bottom, sliceBottomPx);
    const y = Math.round((cutY - sliceTopPx) * scale - lineW / 2);
    const x = Math.round(cell.left * scale);
    const w = Math.max(Math.round((cell.right - cell.left) * scale), 1);
    ctx.fillRect(x, y, w, lineW);
  }
}

function normalizeBreakOffsets(breakOffsets, totalHeightPx) {
  const total = Math.max(Math.ceil(totalHeightPx), 1);
  let offsets = Array.isArray(breakOffsets) ? [...breakOffsets] : [0, total];
  offsets = offsets
    .map((y) => Math.max(0, Math.min(y, total)))
    .filter((y, i, arr) => i === 0 || y > arr[i - 1] + EPS);
  if (offsets[0] !== 0) offsets.unshift(0);
  if (offsets[offsets.length - 1] < total - EPS) offsets.push(total);
  return offsets;
}

function sliceTotalPageHeightMm(sliceHeightMm) {
  const body = Math.min(Math.max(sliceHeightMm, 1), CV_PDF_CONTENT_HEIGHT_MM);
  return CV_PDF_MARGIN_MM.top + body + CV_PDF_MARGIN_MM.bottom;
}

/** Kích thước trang PDF — nội dung khớp slice; ép cao tối thiểu khi trang hẹp hơn rộng (tránh PDF.js vỡ layout). */
function pdfPageFormatMm(sliceHeightMm) {
  const pageHeight = sliceTotalPageHeightMm(sliceHeightMm);
  return [CV_PDF_PAGE_WIDTH_MM, Math.max(pageHeight, CV_PDF_PAGE_WIDTH_MM + 1)];
}

function buildPdfSlices(sourceCanvas, paginationPlan, scale = 2) {
  const plan = paginationPlan || {};
  const captureScale = plan.scale || scale;
  const totalHeightPx = plan.totalHeightPx || sourceCanvas.height / captureScale;
  const breakOffsets = normalizeBreakOffsets(plan.breakOffsets, totalHeightPx);
  const cellSnapshots = plan.cellSnapshots || [];
  const contentWidthMm = CV_PDF_CONTENT_WIDTH_MM;
  const slices = [];

  for (let i = 0; i < breakOffsets.length - 1; i += 1) {
    const sliceTopPx = breakOffsets[i];
    const sliceBottomPx = breakOffsets[i + 1];
    const sliceHeightPx = sliceBottomPx - sliceTopPx;
    if (sliceHeightPx < 1) continue;

    const srcY = Math.round(sliceTopPx * captureScale);
    const srcH = Math.min(
      Math.max(Math.round(sliceHeightPx * captureScale), 1),
      Math.max(sourceCanvas.height - srcY, 1)
    );
    if (srcH < 1) continue;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = sourceCanvas.width;
    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(sourceCanvas, 0, srcY, sourceCanvas.width, srcH, 0, 0, pageCanvas.width, srcH);

    paintCellCutBorders(ctx, cellSnapshots, captureScale, sliceTopPx, sliceHeightPx, totalHeightPx);
    paintDocumentBottomEdgeBorders(ctx, cellSnapshots, captureScale, sliceTopPx, sliceHeightPx, totalHeightPx);

    const sliceHeightMm = Math.min(
      (srcH / sourceCanvas.width) * contentWidthMm,
      CV_PDF_CONTENT_HEIGHT_MM
    );

    slices.push({ pageCanvas, sliceHeightMm, sliceTopPx, sliceHeightPx });
  }

  return slices;
}

function renderSliceOnPdf(pdf, slice) {
  pdf.addImage(
    slice.pageCanvas.toDataURL('image/jpeg', 0.98),
    'JPEG',
    CV_PDF_MARGIN_MM.left,
    CV_PDF_MARGIN_MM.top,
    CV_PDF_CONTENT_WIDTH_MM,
    slice.sliceHeightMm
  );
}

/** Tạo PDF mới — mỗi trang cao vừa khít nội dung (tối đa A4×A3). */
export function createPdfFromCanvas(sourceCanvas, paginationPlan, scale = 2) {
  const slices = buildPdfSlices(sourceCanvas, paginationPlan, scale);
  if (!slices.length) {
    return new jsPDF({ unit: 'mm', compress: true, format: [CV_PDF_PAGE_WIDTH_MM, CV_PDF_PAGE_HEIGHT_MM] });
  }

  const pdf = new jsPDF({
    unit: 'mm',
    compress: true,
    format: pdfPageFormatMm(slices[0].sliceHeightMm),
  });
  renderSliceOnPdf(pdf, slices[0]);

  for (let i = 1; i < slices.length; i += 1) {
    pdf.addPage(pdfPageFormatMm(slices[i].sliceHeightMm), 'p');
    renderSliceOnPdf(pdf, slices[i]);
  }

  return pdf;
}

/**
 * Cắt canvas → thêm vào PDF có sẵn (mỗi trang cao theo nội dung).
 */
export function addPagedCanvasToPdf(pdf, sourceCanvas, paginationPlan, scale = 2, { addPageFirst = false } = {}) {
  const slices = buildPdfSlices(sourceCanvas, paginationPlan, scale);
  slices.forEach((slice, i) => {
    if (i > 0 || addPageFirst) {
      pdf.addPage(pdfPageFormatMm(slice.sliceHeightMm), 'p');
    }
    renderSliceOnPdf(pdf, slice);
  });
}

export function collectPaginationUnits(root) {
  return collectKeepTogetherBands(root);
}

export function getTextLineRectsExported(el, rootTop) {
  return getTextLineRects(el, rootTop);
}

export function paintCellCutBordersFromSnapshots(
  ctx,
  cellSnapshots,
  scale,
  sliceTopPx,
  sliceHeightPx,
  totalHeightPx
) {
  paintCellCutBorders(ctx, cellSnapshots, scale, sliceTopPx, sliceHeightPx, totalHeightPx);
}