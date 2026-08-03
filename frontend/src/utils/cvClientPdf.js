import { domToCanvas } from 'modern-screenshot';
import {
  CV_PDF_PAGE_WIDTH_MM,
  CV_PDF_HORIZONTAL_PADDING_PX,
  addPagedCanvasToPdf,
  buildCapturePaginationPlan,
  createPdfFromCanvas,
  mmToPx,
} from './cvPdfPagination.js';

/** ~CV_PDF_PAGE_WIDTH_MM @ 96dpi — bề ngang trang PDF khi capture (gồm padding hai lề). */
export const CV_PDF_CAPTURE_WIDTH_PX = Math.round(mmToPx(CV_PDF_PAGE_WIDTH_MM));

/** Bù thêm chiều cao capture — viền dưới 1px của bảng cuối hay bị cắt khi domToCanvas. */
export const CV_PDF_CAPTURE_BORDER_BLEED_PX = 8;

/** Đẩy layer capture ra ngoài viewport — vẫn layout/paint cho modern-screenshot. */
export const CV_PDF_CAPTURE_OFFSCREEN_TRANSFORM = 'translateX(-200vw)';

/** Cỡ chữ nội dung bảng 職務経歴書 — đồng nhất khi capture PDF. */
const CV_PDF_SHOKUMU_TABLE_FONT_SIZE = '11px';

export const CV_TEMPLATE_DIR_MAP = {
  common: 'Common',
  cv_it: 'IT',
  cv_technical: 'Technical',
};

export function resolveCvTemplatesForSave({ isAdmin, isApplicantProfile, cvTemplate }) {
  if (isApplicantProfile) {
    const tpl = cvTemplate || 'common';
    return CV_TEMPLATE_DIR_MAP[tpl] ? [tpl] : ['common'];
  }
  if (isAdmin) {
    return ['common', 'cv_it', 'cv_technical'];
  }
  return ['common', 'cv_it', 'cv_technical'];
}

export async function waitForDocumentFonts() {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    /* ignore */
  }
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

export function hasElementLayout(el) {
  if (!el?.isConnected) return false;
  const { width, height } = measureCaptureDimensions(el, { prepare: false });
  return width >= 8 && height >= 8;
}

const captureUiRestoreByElement = new WeakMap();

const CV_PDF_ACTION_BUTTON_RE =
  /行を追加|挿入|削除|プロジェクト|ブロックを表示|Xóa|Xem preview|preview|Tải ảnh|Upload|アップロード|追加/i;

/** Nút chọn giá trị (男/女, 有/無) — giữ lại trong PDF, không coi là nút thao tác. */
function isCvPdfSelectionButton(btn) {
  const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
  return text === '男' || text === '女' || text === '有' || text === '無';
}

/** Nút thêm/xóa/chèn/preview trong bảng — ẩn khi xuất PDF. */
function isCvPdfActionButton(btn) {
  if (!(btn instanceof HTMLButtonElement)) return false;
  if (btn.closest('.cv-pdf-hide')) return true;
  if (isCvPdfSelectionButton(btn)) return false;

  const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
  const meta = `${text} ${btn.getAttribute('aria-label') || ''} ${btn.getAttribute('title') || ''}`;
  if (CV_PDF_ACTION_BUTTON_RE.test(meta)) return true;
  if (/\brose-500\b|\brose-600\b|\btext-rose-/.test(btn.className)) return true;
  if (btn.querySelector('svg[class*="lucide-trash"], svg[class*="lucide-plus"]')) return true;

  return false;
}

/** Hàng chỉ chứa nút thêm/chèn — ẩn cả hàng. Không ẩn hàng có input/contenteditable (vd. 資格・免許). */
function isCvPdfActionRow(tr) {
  if (!(tr instanceof HTMLTableRowElement)) return false;
  if (tr.closest('.cv-pdf-hide')) return false;

  if (tr.querySelector('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]')) {
    return false;
  }

  const buttons = Array.from(tr.querySelectorAll('button'));
  if (!buttons.length) return false;

  const rowText = (tr.textContent || '').replace(/\s+/g, ' ').trim();
  if (/^挿入$/.test(rowText) && buttons.length === 1) return true;
  if (/行を追加/.test(rowText) && buttons.length === 1 && buttons.every(isCvPdfActionButton)) return true;

  return buttons.length > 0 && buttons.every(isCvPdfActionButton)
    && /^(行を追加|挿入|プロジェクトを追加|削除|追加)$/.test(rowText);
}

/** Thay checkbox bằng ■/□ — modern-screenshot thường không vẽ trạng thái checked. */
function enhanceCheckboxForPdfCapture(input) {
  if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return null;
  if (input.closest('.cv-pdf-hide')) return null;

  const marker = document.createElement('span');
  marker.dataset.cvPdfCheckboxMarker = '1';
  marker.setAttribute('aria-hidden', 'true');
  marker.textContent = input.checked ? '■' : '□';
  Object.assign(marker.style, {
    display: 'inline-block',
    width: '11px',
    height: '11px',
    lineHeight: '11px',
    fontSize: '10px',
    textAlign: 'center',
    verticalAlign: 'middle',
    flexShrink: '0',
    color: '#1f2937',
    fontFamily: '"MS PMincho", "MS Mincho", "Yu Mincho", serif',
  });

  const prev = {
    visibility: input.style.visibility,
    width: input.style.width,
    height: input.style.height,
    margin: input.style.margin,
    padding: input.style.padding,
    opacity: input.style.opacity,
    position: input.style.position,
  };

  input.dataset.cvPdfCheckboxEnhanced = '1';
  input.style.visibility = 'hidden';
  input.style.width = '0';
  input.style.height = '0';
  input.style.margin = '0';
  input.style.padding = '0';
  input.style.opacity = '0';
  input.style.position = 'absolute';

  input.parentNode?.insertBefore(marker, input);

  return () => {
    marker.remove();
    delete input.dataset.cvPdfCheckboxEnhanced;
    input.style.visibility = prev.visibility;
    input.style.width = prev.width;
    input.style.height = prev.height;
    input.style.margin = prev.margin;
    input.style.padding = prev.padding;
    input.style.opacity = prev.opacity;
    input.style.position = prev.position;
  };
}

/** modern-screenshot thường không vẽ value của input text — thay bằng span trước khi chụp. */
function enhanceTextInputForPdfCapture(input) {
  if (!(input instanceof HTMLInputElement)) return null;
  const type = (input.type || 'text').toLowerCase();
  if (type === 'file' || type === 'checkbox' || type === 'radio' || type === 'hidden') return null;
  if (input.closest('.cv-pdf-hide')) return null;

  const value = String(input.value || '').trim();
  const marker = document.createElement('span');
  marker.dataset.cvPdfInputMarker = '1';
  marker.setAttribute('aria-hidden', 'true');
  marker.textContent = value || input.placeholder || '';
  Object.assign(marker.style, {
    display: 'inline-block',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: 'transparent',
    font: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    color: value ? '#1f2937' : '#9ca3af',
    verticalAlign: 'baseline',
    minWidth: '0',
    textAlign: input.className.includes('text-center') ? 'center' : 'left',
  });
  if (input.className.includes('w-14')) marker.style.width = '3.5em';
  else if (input.className.includes('w-12')) marker.style.width = '3em';
  else if (input.closest('[data-cv-shokumu-period], .whitespace-nowrap')) {
    marker.style.whiteSpace = 'nowrap';
    marker.style.wordBreak = 'normal';
    marker.style.display = 'inline';
  } else if (input.className.includes('flex-1') || input.className.includes('min-w-[10rem]')) {
    marker.style.flex = '1 1 auto';
    marker.style.minWidth = '8rem';
  }

  const prev = {
    visibility: input.style.visibility,
    width: input.style.width,
    height: input.style.height,
    margin: input.style.margin,
    padding: input.style.padding,
    opacity: input.style.opacity,
    position: input.style.position,
  };

  input.dataset.cvPdfInputEnhanced = '1';
  input.style.visibility = 'hidden';
  input.style.width = '0';
  input.style.height = '0';
  input.style.margin = '0';
  input.style.padding = '0';
  input.style.opacity = '0';
  input.style.position = 'absolute';

  input.parentNode?.insertBefore(marker, input);

  return () => {
    marker.remove();
    delete input.dataset.cvPdfInputEnhanced;
    input.style.visibility = prev.visibility;
    input.style.width = prev.width;
    input.style.height = prev.height;
    input.style.margin = prev.margin;
    input.style.padding = prev.padding;
    input.style.opacity = prev.opacity;
    input.style.position = prev.position;
  };
}

function readContentEditableCaptureText(el) {
  if (!el) return '';
  const raw = (el.innerText || el.textContent || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
  return raw.trimEnd();
}

function resolveCvPdfCaptureFont(el, cs) {
  const templateRoot = el.closest('.cv-template-body, [data-cv-pdf-section]');
  const bodyCs = templateRoot ? getComputedStyle(templateRoot) : cs;
  return {
    fontFamily: bodyCs.fontFamily || cs.fontFamily,
    fontSize: cs.fontSize || bodyCs.fontSize,
    lineHeight: cs.lineHeight || bodyCs.lineHeight,
  };
}

function isInsideShokumuTable(el) {
  return Boolean(el?.closest?.('[data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap'));
}

function resolveCvPdfContentFontSize(el, fonts) {
  if (isInsideShokumuTable(el)) return CV_PDF_SHOKUMU_TABLE_FONT_SIZE;
  return fonts.fontSize;
}

/** modern-screenshot hay vẽ trùng chữ / lệch đậm nhạt với contentEditable — thay bằng span tĩnh. */
function enhanceContentEditableForPdfCapture(el) {
  if (!(el instanceof HTMLElement) || !el.isContentEditable) return null;
  if (el.closest('.cv-pdf-hide')) return null;
  if (el.dataset.cvPdfEditableEnhanced === '1') return null;

  const parent = el.parentNode;
  if (!parent) return null;

  const text = readContentEditableCaptureText(el);
  const cs = getComputedStyle(el);
  const fonts = resolveCvPdfCaptureFont(el, cs);
  const inDateInline = el.closest('.cv-pdf-date-inline');
  const isBlock = !inDateInline && cs.display === 'block';

  const marker = document.createElement('span');
  marker.dataset.cvPdfEditableMarker = '1';
  marker.textContent = text;
  Object.assign(marker.style, {
    display: inDateInline ? 'inline' : (isBlock ? 'block' : 'inline-block'),
    whiteSpace: inDateInline ? 'nowrap' : (cs.whiteSpace === 'normal' ? 'pre-wrap' : (cs.whiteSpace || 'pre-wrap')),
    wordBreak: 'break-word',
    background: 'transparent',
    fontFamily: fonts.fontFamily,
    fontSize: resolveCvPdfContentFontSize(el, fonts),
    lineHeight: fonts.lineHeight,
    fontWeight: '400',
    fontStyle: 'normal',
    color: '#1f2937',
    textAlign: cs.textAlign,
    verticalAlign: 'baseline',
    minWidth: '0',
    boxSizing: 'border-box',
    WebkitFontSmoothing: 'antialiased',
  });
  if (isBlock || el.classList.contains('w-full')) marker.style.width = '100%';
  if (el.classList.contains('text-center')) marker.style.textAlign = 'center';
  if (el.classList.contains('text-right')) marker.style.textAlign = 'right';
  if (el.style.width) marker.style.width = el.style.width;
  if (cs.minHeight && cs.minHeight !== '0px') marker.style.minHeight = cs.minHeight;

  el.dataset.cvPdfEditableEnhanced = '1';
  el.contentEditable = 'false';
  parent.replaceChild(marker, el);

  return () => {
    if (marker.parentNode === parent) parent.replaceChild(el, marker);
    delete el.dataset.cvPdfEditableEnhanced;
    el.contentEditable = 'true';
  };
}

/** Nhóm nút chọn (男/女, 有/無) → chỉ hiện giá trị đang chọn, cùng độ đậm. */
function enhanceCvSelectionButtonsForPdfCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  const groups = new Map();
  root.querySelectorAll('button').forEach((btn) => {
    if (!isCvPdfSelectionButton(btn)) return;
    const parent = btn.parentElement;
    if (!parent) return;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(btn);
  });

  groups.forEach((buttons, parent) => {
    parent.querySelectorAll(':scope > span').forEach((sep) => {
      if ((sep.textContent || '').trim() === '・') hideNodeForPdfCapture(sep, restoreFns);
    });

    const selected = buttons.find(
      (btn) => /\bfont-semibold\b/.test(btn.className) || /\btext-gray-900\b/.test(btn.className)
    );

    buttons.forEach((btn) => hideNodeForPdfCapture(btn, restoreFns));

    if (selected) {
      const span = document.createElement('span');
      span.dataset.cvPdfSelectionValue = '1';
      span.textContent = (selected.textContent || '').replace(/\s+/g, ' ').trim();
      Object.assign(span.style, {
        fontWeight: '400',
        color: '#1f2937',
        fontSize: getComputedStyle(selected).fontSize,
      });
      parent.appendChild(span);
      restoreFns.push(() => span.remove());
    }
  });
}

function hideNodeForPdfCapture(node, restoreFns) {
  if (!(node instanceof HTMLElement) || node.dataset.cvPdfHiddenUi === '1') return;
  const prevDisplay = node.style.display;
  node.dataset.cvPdfHiddenUi = '1';
  node.style.display = 'none';
  restoreFns.push(() => {
    node.style.display = prevDisplay;
    delete node.dataset.cvPdfHiddenUi;
  });
}

const SCROLL_OVERFLOW_RE = /auto|scroll|overlay/i;

function isScrollContainer(el) {
  if (!(el instanceof HTMLElement)) return false;
  const cs = getComputedStyle(el);
  return SCROLL_OVERFLOW_RE.test(`${cs.overflow} ${cs.overflowX} ${cs.overflowY}`);
}

function resetElementScrollPositions(root) {
  if (!(root instanceof HTMLElement)) return [];
  const restoreFns = [];
  let node = root;
  while (node && node !== document.documentElement) {
    if (!(node instanceof HTMLElement)) {
      node = node.parentElement;
      continue;
    }
    const prevLeft = node.scrollLeft;
    const prevTop = node.scrollTop;
    if (prevLeft || prevTop) {
      node.scrollLeft = 0;
      node.scrollTop = 0;
      restoreFns.push(() => {
        node.scrollLeft = prevLeft;
        node.scrollTop = prevTop;
      });
    }
    node = node.parentElement;
  }
  return restoreFns;
}

/** Gỡ overflow scroll/hidden + ẩn scrollbar trước khi chụp DOM → tránh thanh scroll / cắt ngang trong PDF. */
function suppressScrollbarsForCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  root.dataset.cvPdfCaptureRoot = '1';
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-cv-pdf-scroll-fix', '1');
  styleEl.textContent = `
    [data-cv-pdf-capture-root], [data-cv-pdf-capture-root] * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    [data-cv-pdf-capture-root]::-webkit-scrollbar,
    [data-cv-pdf-capture-root] *::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    [data-cv-pdf-capture-root] .cv-resizable-table-wrap,
    [data-cv-pdf-capture-root] .cv-template-body {
      overflow: visible !important;
      overflow-x: visible !important;
      overflow-y: visible !important;
      max-width: none !important;
    }
    [data-cv-pdf-capture-root] table {
      border-collapse: collapse !important;
    }
    [data-cv-pdf-capture-root] tr {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
    }
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] tr {
      height: initial !important;
      min-height: initial !important;
      max-height: initial !important;
    }
    [data-cv-pdf-capture-root] td,
    [data-cv-pdf-capture-root] th {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      vertical-align: middle !important;
      padding-top: 6px !important;
      padding-bottom: 6px !important;
    }
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] td,
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] th {
      height: initial !important;
      min-height: 38px !important;
      max-height: initial !important;
      padding-top: 7px !important;
      padding-bottom: 7px !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] tbody tr:first-child td,
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] tbody tr:first-child th {
      min-height: initial !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
    }
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] td[style*="e2efd9"],
    [data-cv-pdf-capture-root] [data-cv-layout-key$="::personalGrid_v3"] th[style*="e2efd9"] {
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
    [data-cv-pdf-capture-root] td:not(.whitespace-nowrap):not([data-cv-shokumu-period]),
    [data-cv-pdf-capture-root] th:not(.whitespace-nowrap) {
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    [data-cv-pdf-capture-root] td.whitespace-nowrap,
    [data-cv-pdf-capture-root] [data-cv-shokumu-period],
    [data-cv-pdf-capture-root] [data-cv-pdf-period-flat] {
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      white-space: nowrap !important;
    }
    [data-cv-pdf-capture-root] .cv-resizable-table-wrap {
      overflow: visible !important;
      max-width: 100% !important;
    }
    [data-cv-pdf-capture-root] .cv-resizable-table-wrap table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-root] [data-cv-pdf-keep-structure] {
      border: 1px solid #1f2937 !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-root] [data-cv-shokumu-cert-list],
    [data-cv-pdf-capture-root] [data-cv-pdf-cert-flat] {
      border: none !important;
    }
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap td,
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap th,
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap td *,
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap th *,
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-editable-marker],
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-period-flat],
    [data-cv-pdf-capture-root] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-flat-cell] {
      font-size: 11px !important;
    }
    [data-cv-pdf-capture-root] [data-cv-pdf-flat-cell] {
      font-weight: 400 !important;
      color: #1f2937 !important;
      -webkit-font-smoothing: auto !important;
    }
    [data-cv-pdf-capture-root] .cv-resizable-table-wrap [role="separator"] {
      display: none !important;
    }
    [data-cv-pdf-capture-root] select {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    [data-cv-pdf-capture-root] .cv-pdf-hide,
    [data-cv-pdf-capture-root] tr[data-cv-pdf-hidden-row="1"] {
      display: none !important;
    }
    [data-cv-pdf-capture-root] .cv-pdf-date-inline {
      flex-wrap: nowrap !important;
      white-space: nowrap !important;
    }
  `;
  document.head.appendChild(styleEl);
  restoreFns.push(() => {
    delete root.dataset.cvPdfCaptureRoot;
    styleEl.remove();
  });

  resetElementScrollPositions(root).reverse().forEach((fn) => restoreFns.push(fn));

  const patchNode = (node) => {
    if (!(node instanceof HTMLElement) || node.dataset.cvPdfScrollPatched === '1') return;
    node.dataset.cvPdfScrollPatched = '1';

    const cs = getComputedStyle(node);
    const prev = {
      overflow: node.style.overflow,
      overflowX: node.style.overflowX,
      overflowY: node.style.overflowY,
      maxHeight: node.style.maxHeight,
      maxWidth: node.style.maxWidth,
      height: node.style.height,
    };
    restoreFns.push(() => {
      node.style.overflow = prev.overflow;
      node.style.overflowX = prev.overflowX;
      node.style.overflowY = prev.overflowY;
      node.style.maxHeight = prev.maxHeight;
      node.style.maxWidth = prev.maxWidth;
      node.style.height = prev.height;
      delete node.dataset.cvPdfScrollPatched;
    });

    const scrollClass = /overflow-(x-auto|y-auto|auto|scroll|hidden|x-hidden)/.test(node.className);
    const hidesOverflow = cs.overflowX === 'hidden' || cs.overflow === 'hidden';

    if (node === root) {
      node.style.overflow = 'visible';
      node.style.overflowX = 'visible';
      node.style.overflowY = 'visible';
      node.style.paddingBottom = '4px';
      return;
    }

    if (isScrollContainer(node) || scrollClass || hidesOverflow || node.classList.contains('cv-resizable-table-wrap')) {
      node.style.overflow = 'visible';
      node.style.overflowX = 'visible';
      node.style.overflowY = 'visible';
      node.style.maxHeight = 'none';
      node.style.maxWidth = 'none';
      if (/overflow-y-auto|overflow-auto|min-h-0/.test(node.className)) {
        node.style.height = 'auto';
      }
    }
  };

  patchNode(root);
  root.querySelectorAll('*').forEach(patchNode);
}

function suppressScrollableAncestors(element, restoreFns) {
  let node = element?.parentElement;
  while (node && node !== document.documentElement) {
    if (!(node instanceof HTMLElement) || node.dataset.cvPdfScrollPatched === '1') {
      node = node.parentElement;
      continue;
    }

    const cs = getComputedStyle(node);
    const scrollClass = /overflow-(x-auto|y-auto|auto|scroll|hidden)/.test(node.className);
    const isHiddenOverflow = cs.overflow === 'hidden' || cs.overflowY === 'hidden';

    if (isScrollContainer(node) || scrollClass || isHiddenOverflow) {
      node.dataset.cvPdfScrollPatched = '1';
      const prev = {
        overflow: node.style.overflow,
        overflowY: node.style.overflowY,
        overflowX: node.style.overflowX,
        maxHeight: node.style.maxHeight,
        height: node.style.height,
        paddingBottom: node.style.paddingBottom,
      };
      restoreFns.push(() => {
        node.style.overflow = prev.overflow;
        node.style.overflowY = prev.overflowY;
        node.style.overflowX = prev.overflowX;
        node.style.maxHeight = prev.maxHeight;
        node.style.height = prev.height;
        node.style.paddingBottom = prev.paddingBottom;
        delete node.dataset.cvPdfScrollPatched;
      });
      node.style.overflow = 'visible';
      node.style.overflowY = 'visible';
      node.style.overflowX = 'visible';
      node.style.maxHeight = 'none';
      node.style.height = 'auto';
      if (isHiddenOverflow) {
        node.style.paddingBottom = '4px';
      }
    }
    node = node.parentElement;
  }
}

/** Gỡ chiều cao hàng cố định (kéo resize) — tránh nội dung tràn đè bảng bên dưới khi chụp. */
function forceAutoTableLayoutForCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;
  root.querySelectorAll('tr').forEach((tr) => {
    if (isPersonalGridEl(tr)) return;
    const prev = {
      height: tr.style.height,
      minHeight: tr.style.minHeight,
      maxHeight: tr.style.maxHeight,
    };
    tr.style.setProperty('height', 'auto', 'important');
    tr.style.setProperty('min-height', '0', 'important');
    tr.style.setProperty('max-height', 'none', 'important');
    if (restoreFns) {
      restoreFns.push(() => {
        tr.style.height = prev.height;
        tr.style.minHeight = prev.minHeight;
        tr.style.maxHeight = prev.maxHeight;
      });
    }
  });
  root.querySelectorAll('td, th').forEach((cell) => {
    if (isPersonalGridEl(cell)) return;
    const prev = {
      height: cell.style.height,
      minHeight: cell.style.minHeight,
      maxHeight: cell.style.maxHeight,
      overflow: cell.style.overflow,
    };
    cell.style.setProperty('height', 'auto', 'important');
    cell.style.setProperty('min-height', '0', 'important');
    cell.style.setProperty('max-height', 'none', 'important');
    cell.style.setProperty('overflow', 'visible', 'important');
    if (restoreFns) {
      restoreFns.push(() => {
        cell.style.height = prev.height;
        cell.style.minHeight = prev.minHeight;
        cell.style.maxHeight = prev.maxHeight;
        cell.style.overflow = prev.overflow;
      });
    }
  });
}

/** personalGrid_v3 — giữ layout preview (không ghi đè % cột khi capture PDF). */
function isPersonalGridEl(el) {
  return Boolean(el?.closest?.('[data-cv-layout-key$="::personalGrid_v3"]'));
}

function applyFixedCertTablePdfLayout(root, restoreFns) {
  // Client PDF: giữ layout giống preview — không ẩn dòng cert theo backend HTML.
  if (root?.hasAttribute?.('data-cv-pdf-section') || root?.closest?.('.cv-pdf-capture-layer')) return;
  const wrap = root.querySelector('[data-cv-fixed-cert-table]');
  if (!wrap) return;

  let visibleKinds = [];
  try {
    visibleKinds = JSON.parse(wrap.dataset.cvFixedCertVisible || '[]');
  } catch {
    visibleKinds = [];
  }

  if (!visibleKinds.length) {
    hideNodeForPdfCapture(wrap, restoreFns);
    return;
  }

  wrap.querySelectorAll('[data-cv-cert-row-kind]').forEach((row) => {
    const kind = row.dataset.cvCertRowKind;
    if (!visibleKinds.includes(kind)) {
      hideNodeForPdfCapture(row, restoreFns);
    }
  });
}

const CV_PDF_FLAT_CELL_SKIP_SELECTOR = [
  'img',
  '.cv-pdf-date-inline',
  'input[type="file"]',
  'label',
  'select',
  '[data-cv-pdf-keep-structure]',
].join(', ');

function shouldSkipCvPdfFlatCell(cell) {
  if (!(cell instanceof HTMLTableCellElement)) return true;
  if (cell.closest('.cv-pdf-hide, tr.cv-pdf-hide, [data-cv-pdf-hidden-row="1"]')) return true;
  if (cell.hasAttribute('data-cv-pdf-keep-structure')) return true;
  if (cell.querySelector('[data-cv-pdf-keep-structure]')) return true;
  if (cell.hasAttribute('data-cv-shokumu-period')) return true;
  if (cell.querySelector(CV_PDF_FLAT_CELL_SKIP_SELECTOR)) return true;
  if (cell.querySelector('[data-cv-shokumu-cert-list], [data-cv-pdf-cert-flat]')) return true;
  if (cell.querySelector('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])')) return true;
  if (cell.querySelector('ul, ol')) return true;
  if (cell.querySelector('.inline-flex, .flex, .grid')) return true;
  if (cell.querySelectorAll('[contenteditable]').length > 1) return true;
  if (cell.colSpan > 1) return true;
  const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text || text === '以上') return true;
  return false;
}

function normalizeShokumuPeriodCaptureText(raw) {
  return String(raw || '')
    .replace(/\r\n?/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s+(年)/g, '$1$2')
    .replace(/(年)\s+(\d)/g, '$1$2')
    .replace(/(\d)\s+(月)/g, '$1$2')
    .replace(/(月)\s+(～)/g, '$1$2')
    .replace(/(～)\s+(\d)/g, '$1$2')
    .replace(/\s+現在\s*$/g, ' 現在')
    .trim();
}

function readShokumuPeriodCellText(cell) {
  const scratch = cell.cloneNode(true);
  scratch.querySelectorAll('button').forEach((btn) => {
    const label = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    if (label === '現在') {
      btn.replaceWith(document.createTextNode('現在'));
    } else {
      btn.remove();
    }
  });
  return normalizeShokumuPeriodCaptureText(scratch.innerText || '');
}

/** 職務経歴: gộp ô kỳ công việc (input 年/月) thành một dòng — tránh xuống dòng từng ký tự khi capture. */
function flattenShokumuPeriodCellsForPdfCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll('[data-cv-shokumu-period]').forEach((cell) => {
    const preset = (cell.getAttribute('data-cv-period-display') || '').trim();
    const text = preset || readShokumuPeriodCellText(cell);
    if (!text) return;

    const templateBody = root.querySelector('.cv-template-body') || root;
    const fonts = resolveCvPdfCaptureFont(cell, getComputedStyle(cell));
    const flat = document.createElement('span');
    flat.dataset.cvPdfPeriodFlat = '1';
    flat.textContent = text;
    Object.assign(flat.style, {
      whiteSpace: 'nowrap',
      fontFamily: fonts.fontFamily,
      fontSize: CV_PDF_SHOKUMU_TABLE_FONT_SIZE,
      fontWeight: '400',
      color: '#1f2937',
      letterSpacing: 0,
    });

    const prevHtml = cell.innerHTML;
    const prevWhiteSpace = cell.style.whiteSpace;
    cell.innerHTML = '';
    cell.style.whiteSpace = 'nowrap';
    cell.appendChild(flat);
    restoreFns.push(() => {
      cell.innerHTML = prevHtml;
      cell.style.whiteSpace = prevWhiteSpace;
    });
  });
}

function normalizeShokumuCertRowText(raw) {
  return String(raw || '')
    .replace(/\r\n?/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '（')
    .replace(/\s+\)/g, '）')
    .replace(/\(\s*(\d)/g, '（$1')
    .replace(/(\d)\s+年/g, '$1年')
    .replace(/年\s+(\d)/g, '年$1')
    .replace(/(\d)\s+月/g, '$1月')
    .trim();
}

function readShokumuCertRowText(row) {
  const extract = (node) => {
    const scratch = node.cloneNode(true);
    scratch.querySelectorAll('button, .cv-pdf-hide').forEach((el) => el.remove());
    scratch.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])').forEach((input) => {
      const val = String(input.value || '').trim();
      input.replaceWith(document.createTextNode(val));
    });
    return normalizeShokumuCertRowText(scratch.textContent || scratch.innerText || '');
  };

  return extract(row) || normalizeShokumuCertRowText(row.textContent || row.innerText || '');
}

/** 職務経歴 資格・免許: gộp flex (・name（年月）) thành khối text — tránh PDF xuống dòng từng ký tự / mất nội dung. */
function flattenShokumuCertRowsForPdfCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  const templateBody = root.querySelector('.cv-template-body') || root;
  const fonts = resolveCvPdfCaptureFont(templateBody, getComputedStyle(templateBody));

  root.querySelectorAll('[data-cv-shokumu-cert-list]').forEach((list) => {
    const lines = [];
    list.querySelectorAll('[data-cv-shokumu-cert-row]').forEach((row) => {
      const line = readShokumuCertRowText(row);
      if (line) lines.push(line);
    });
    if (!lines.length) return;

    const prevHtml = list.innerHTML;

    const flat = document.createElement('div');
    flat.dataset.cvPdfCertFlat = '1';
    flat.textContent = lines.join('\n');
    Object.assign(flat.style, {
      display: 'block',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontFamily: fonts.fontFamily,
      fontSize: CV_PDF_SHOKUMU_TABLE_FONT_SIZE,
      fontWeight: '400',
      color: '#1f2937',
      lineHeight: '1.5',
      margin: '0',
      padding: '0',
      minHeight: '1.5em',
      border: 'none',
    });

    list.innerHTML = '';
    list.appendChild(flat);
    restoreFns.push(() => {
      list.innerHTML = prevHtml;
    });
  });
}

/** 職務経歴書: ép cỡ chữ đồng nhất trong các bảng — tránh text-xs / text-[10px] lệch nhau khi PDF. */
function normalizeShokumuTableFontSizesForPdfCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  const section = root.matches('[data-cv-pdf-section="shokumu"]')
    ? root
    : root.querySelector('[data-cv-pdf-section="shokumu"]');
  if (!section) return;

  section.querySelectorAll('.cv-resizable-table-wrap td, .cv-resizable-table-wrap th').forEach((cell) => {
    const prev = cell.style.fontSize;
    cell.style.fontSize = CV_PDF_SHOKUMU_TABLE_FONT_SIZE;
    restoreFns.push(() => {
      cell.style.fontSize = prev;
    });

    cell.querySelectorAll('[data-cv-pdf-editable-marker], [data-cv-pdf-period-flat], [data-cv-pdf-flat-cell]').forEach((node) => {
      const prevNode = node.style.fontSize;
      node.style.fontSize = CV_PDF_SHOKUMU_TABLE_FONT_SIZE;
      restoreFns.push(() => {
        node.style.fontSize = prevNode;
      });
    });
  });
}

function normalizeCvPdfFlatCellText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\n+(入学|卒業|入社|退社|現在に至る)\s*$/gm, ' $1')
    .replace(/([：:])\n+/g, '$1 ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Gộp mỗi ô bảng CV thành một khối chữ — tránh marker contentEditable + suffix 入学/卒業 lệch đậm nhạt. */
function flattenCvPdfTableCellsForCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  const templateBody = root.querySelector('.cv-template-body') || root;
  const fonts = resolveCvPdfCaptureFont(templateBody, getComputedStyle(templateBody));

  root.querySelectorAll('.cv-resizable-table-wrap td').forEach((cell) => {
    if (shouldSkipCvPdfFlatCell(cell)) return;

    const text = normalizeCvPdfFlatCellText(cell.innerText || '');
    if (!text) return;

    const prevHtml = cell.innerHTML;
    const cs = getComputedStyle(cell);
    const textAlign = cs.textAlign === 'center' || cell.classList.contains('text-center')
      ? 'center'
      : (cs.textAlign === 'right' || cell.classList.contains('text-right') ? 'right' : 'left');

    const flat = document.createElement('div');
    flat.dataset.cvPdfFlatCell = '1';
    flat.textContent = text;
    Object.assign(flat.style, {
      fontFamily: fonts.fontFamily,
      fontSize: fonts.fontSize || '11px',
      lineHeight: '1.5',
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#1f2937',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      textAlign,
      padding: '0',
      margin: '0',
      background: 'transparent',
    });

    cell.innerHTML = '';
    cell.appendChild(flat);
    restoreFns.push(() => {
      cell.innerHTML = prevHtml;
    });
  });
}

function flattenDateTripletsForPdfCapture(root, restoreFns) {
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll('.cv-template-date-triplet').forEach((wrap) => {
    const text = (wrap.innerText || '')
      .replace(/\r\n?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return;

    const fonts = resolveCvPdfCaptureFont(wrap, getComputedStyle(wrap));
    const flat = document.createElement('span');
    flat.dataset.cvPdfDateFlat = '1';
    flat.textContent = text;
    Object.assign(flat.style, {
      whiteSpace: 'nowrap',
      fontFamily: fonts.fontFamily,
      fontSize: fonts.fontSize || '10px',
      fontWeight: '400',
      color: '#1f2937',
      letterSpacing: 0,
    });

    const prevHtml = wrap.innerHTML;
    const prevWhiteSpace = wrap.style.whiteSpace;
    wrap.innerHTML = '';
    wrap.style.whiteSpace = 'nowrap';
    wrap.appendChild(flat);
    restoreFns.push(() => {
      wrap.innerHTML = prevHtml;
      wrap.style.whiteSpace = prevWhiteSpace;
    });
  });
}

function preparePdfCaptureUi(root) {
  const restoreFns = [];

  applyFixedCertTablePdfLayout(root, restoreFns);

  flattenShokumuCertRowsForPdfCapture(root, restoreFns);

  root.querySelectorAll('.cv-pdf-hide').forEach((node) => {
    hideNodeForPdfCapture(node, restoreFns);
  });

  root.querySelectorAll('input[type="file"]').forEach((input) => {
    hideNodeForPdfCapture(input, restoreFns);
    const label = input.closest('label');
    if (label) hideNodeForPdfCapture(label, restoreFns);
  });

  flattenDateTripletsForPdfCapture(root, restoreFns);

  root.querySelectorAll('tr').forEach((tr) => {
    if (!isCvPdfActionRow(tr)) return;
    const prevDisplay = tr.style.display;
    tr.dataset.cvPdfHiddenRow = '1';
    tr.style.display = 'none';
    restoreFns.push(() => {
      tr.style.display = prevDisplay;
      delete tr.dataset.cvPdfHiddenRow;
    });
  });

  root.querySelectorAll('button').forEach((btn) => {
    if (!isCvPdfActionButton(btn)) return;
    const prevDisplay = btn.style.display;
    btn.dataset.cvPdfHiddenBtn = '1';
    btn.style.display = 'none';
    restoreFns.push(() => {
      btn.style.display = prevDisplay;
      delete btn.dataset.cvPdfHiddenBtn;
    });
  });

  flattenShokumuPeriodCellsForPdfCapture(root, restoreFns);

  root.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const restore = enhanceCheckboxForPdfCapture(input);
    if (restore) restoreFns.push(restore);
  });

  root.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])').forEach((input) => {
    const restore = enhanceTextInputForPdfCapture(input);
    if (restore) restoreFns.push(restore);
  });

  root.querySelectorAll('[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]').forEach((node) => {
    const restore = enhanceContentEditableForPdfCapture(node);
    if (restore) restoreFns.push(restore);
  });

  enhanceCvSelectionButtonsForPdfCapture(root, restoreFns);

  forceAutoTableLayoutForCapture(root, restoreFns);

  flattenCvPdfTableCellsForCapture(root, restoreFns);

  normalizeShokumuTableFontSizesForPdfCapture(root, restoreFns);

  return () => {
    restoreFns.reverse().forEach((fn) => fn());
  };
}

function prepareElementForCapture(elements) {
  (elements || []).forEach((el) => {
    if (!el?.style) return;
    el.dataset.cvPdfPrevWidth = el.dataset.cvPdfPrevWidth || '1';
    el.style.width = `${CV_PDF_CAPTURE_WIDTH_PX}px`;
    el.style.maxWidth = `${CV_PDF_CAPTURE_WIDTH_PX}px`;
    el.style.boxSizing = 'border-box';
    el.style.paddingLeft = `${CV_PDF_HORIZONTAL_PADDING_PX}px`;
    el.style.paddingRight = `${CV_PDF_HORIZONTAL_PADDING_PX}px`;
    el.style.paddingBottom = '4px';
    el.style.height = 'auto';
    el.style.minHeight = '0';
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
    el.querySelectorAll('[role="separator"]').forEach((node) => {
      node.dataset.cvPdfHiddenSep = '1';
      node.style.visibility = 'hidden';
    });

    const scrollRestoreFns = [];
    suppressScrollbarsForCapture(el, scrollRestoreFns);
    const restoreUi = preparePdfCaptureUi(el);
    captureUiRestoreByElement.set(el, () => {
      restoreUi();
      scrollRestoreFns.reverse().forEach((fn) => fn());
    });
  });
}

function restoreElementAfterCapture(elements) {
  (elements || []).forEach((el) => {
    if (!el?.style) return;
    const restoreUi = captureUiRestoreByElement.get(el);
    if (restoreUi) {
      restoreUi();
      captureUiRestoreByElement.delete(el);
    }
    if (el.dataset.cvPdfPrevWidth) {
      el.style.width = '';
      delete el.dataset.cvPdfPrevWidth;
    }
    el.style.maxWidth = '';
    el.style.boxSizing = '';
    el.style.paddingLeft = '';
    el.style.paddingRight = '';
    el.style.paddingBottom = '';
    el.style.height = '';
    el.style.minHeight = '';
    el.style.maxHeight = '';
    el.style.overflow = '';
    el.querySelectorAll('[data-cv-pdf-hidden-sep="1"]').forEach((node) => {
      node.style.visibility = '';
      delete node.dataset.cvPdfHiddenSep;
    });
  });
}

function measureCaptureDimensions(element, { prepare = true } = {}) {
  if (!element) return { width: 0, height: 0 };
  if (prepare) prepareElementForCapture([element]);

  const width = CV_PDF_CAPTURE_WIDTH_PX;

  let height = Math.max(element.scrollHeight, element.offsetHeight, element.clientHeight);
  if (height < 8) {
    const rect = element.getBoundingClientRect();
    height = Math.max(height, rect.height);
  }
  if (height < 8) {
    for (const node of element.querySelectorAll('*')) {
      if (!(node instanceof HTMLElement)) continue;
      const h = Math.max(
        node.scrollHeight,
        node.offsetHeight,
        node.clientHeight,
        node.getBoundingClientRect().height
      );
      if (h > height) height = h;
    }
  }

  return {
    width,
    height: Math.max(Math.ceil(height), 0) + CV_PDF_CAPTURE_BORDER_BLEED_PX,
  };
}

export async function waitForElementLayout(elements, maxMs = 5000) {
  const list = (elements || []).filter(Boolean);
  if (!list.length) return false;

  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const ready = list.every((el) => hasElementLayout(el));
    if (ready) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return list.every((el) => hasElementLayout(el));
}

/** Đợi section DOM có layout — chỉ đọc, không mutate DOM React. */
export async function waitForCvPdfSectionElements(getElements, parts = ['rirekisho', 'shokumu'], _layerRoot = null, maxMs = 10000) {
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    const elements = typeof getElements === 'function' ? getElements() : null;
    if (Array.isArray(elements) && elements.length === parts.length) {
      const ready = elements.every((el) => el?.isConnected && hasElementLayout(el));
      if (ready) return elements;
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }

  const elements = typeof getElements === 'function' ? getElements() : null;
  if (!Array.isArray(elements) || elements.length !== parts.length) return null;
  return elements.every((el) => el?.isConnected && hasElementLayout(el)) ? elements : null;
}

/** @deprecated dùng waitForCvPdfSectionElements */
export async function waitForCvPdfSectionRefs(refs, parts = ['rirekisho', 'shokumu'], maxMs = 8000) {
  return waitForCvPdfSectionElements(
    () => {
      const list = parts.map((part) => refs?.[part]?.current).filter(Boolean);
      return list.length === parts.length ? list : null;
    },
    parts,
    refs?.[parts[0]]?.current?.closest?.('.cv-pdf-capture-layer') || null,
    maxMs
  );
}

function waitForImagesLoaded(root, timeoutMs = 8000) {
  const images = Array.from(root.querySelectorAll('img'));
  if (!images.length) return Promise.resolve();
  return Promise.race([
    Promise.all(
      images.map(
        (img) => new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        })
      )
    ),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function shouldIncludeNodeForCvCapture(node) {
  if (node.nodeType !== 1) return true;
  const el = node;
  const tag = el.tagName?.toUpperCase?.() || '';
  if (tag === 'IFRAME' || tag === 'VIDEO') return false;
  if (el.closest?.('[data-cv-preview-modal]')) return false;
  if (el.classList?.contains('cv-pdf-hide')) return false;
  if (el.dataset.cvPdfHiddenUi === '1') return false;
  if (tag === 'INPUT' && el.type === 'file') return false;
  if (tag === 'LABEL' && el.querySelector('input[type="file"]')) return false;
  if (tag === 'BUTTON' && isCvPdfActionButton(el)) return false;
  if (el.closest?.('[data-cv-pdf-hidden-row="1"], [data-cv-pdf-hidden-btn="1"]')) return false;
  if (tag === 'INPUT' && el.type === 'checkbox' && el.dataset.cvPdfCheckboxEnhanced === '1') return false;
  if (tag === 'INPUT' && el.dataset.cvPdfInputEnhanced === '1') return false;
  if (el.dataset.cvPdfEditableEnhanced === '1') return false;
  return true;
}

/** Chuẩn bị layer capture để đo layout/chụp — luôn ngoài màn hình, không flash lên UI. */
async function withVisibleCaptureLayer(element, layerRoot, run) {
  const layer = (layerRoot instanceof Element ? layerRoot : null)
    || element?.closest?.('.cv-pdf-capture-layer');
  if (!layer || typeof run !== 'function') return run?.();

  const prev = {
    transform: layer.style.transform,
    left: layer.style.left,
    top: layer.style.top,
    zIndex: layer.style.zIndex,
    visibility: layer.style.visibility,
    opacity: layer.style.opacity,
    pointerEvents: layer.style.pointerEvents,
  };

  layer.style.transform = CV_PDF_CAPTURE_OFFSCREEN_TRANSFORM;
  layer.style.left = '0px';
  layer.style.top = '0px';
  layer.style.zIndex = '-1';
  layer.style.visibility = 'visible';
  layer.style.opacity = '1';
  layer.style.pointerEvents = 'none';

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return await run();
  } finally {
    layer.style.transform = prev.transform;
    layer.style.left = prev.left;
    layer.style.top = prev.top;
    layer.style.zIndex = prev.zIndex;
    layer.style.visibility = prev.visibility;
    layer.style.opacity = prev.opacity;
    layer.style.pointerEvents = prev.pointerEvents;
  }
}

/** Clone section DOM — mọi chỉnh sửa phục vụ PDF chỉ trên bản sao, không phá cây DOM React. */
function mountCaptureClone(element) {
  const sandbox = document.createElement('div');
  sandbox.className = 'cv-pdf-capture-sandbox';
  sandbox.setAttribute('data-cv-pdf-capture-sandbox', '1');
  sandbox.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${CV_PDF_CAPTURE_WIDTH_PX}px`,
    `transform:${CV_PDF_CAPTURE_OFFSCREEN_TRANSFORM}`,
    'visibility:visible',
    'opacity:1',
    'pointer-events:none',
    'z-index:-1',
    'background:#ffffff',
    'overflow:visible',
  ].join(';');

  const clone = element.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  }

  sandbox.appendChild(clone);
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    [data-cv-pdf-capture-sandbox] .cv-template-body {
      font-family: 'MS Mincho', 'MS 明朝', 'Yu Mincho', 'Hiragino Mincho ProN', serif !important;
      font-weight: 400 !important;
    }
    [data-cv-pdf-capture-sandbox] .cv-template-body .font-bold,
    [data-cv-pdf-capture-sandbox] .cv-template-body h2 {
      font-weight: 700 !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-flat-cell],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-editable-marker],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-date-flat] {
      font-weight: 400 !important;
    }
    [data-cv-pdf-capture-sandbox] .cv-pdf-date-inline,
    [data-cv-pdf-capture-sandbox] .cv-template-date-triplet {
      flex-wrap: nowrap !important;
      white-space: nowrap !important;
      font-size: 10px !important;
    }
    [data-cv-pdf-capture-sandbox] .cv-template-date-triplet [contenteditable] {
      display: inline !important;
      width: auto !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-layout-key$="::personalGrid_v3"] td {
      overflow: visible !important;
      min-height: 38px !important;
      padding-top: 7px !important;
      padding-bottom: 7px !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-layout-key$="::personalGrid_v3"] tbody tr:first-child td {
      min-height: initial !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-layout-key$="::personalGrid_v3"] td[style*="e2efd9"] {
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-layout-key$="::personalGrid_v3"] .cv-template-date-triplet,
    [data-cv-pdf-capture-sandbox] [data-cv-layout-key$="::personalGrid_v3"] [data-cv-pdf-date-flat] {
      font-size: 11px !important;
      letter-spacing: 0 !important;
    }
    [data-cv-pdf-capture-sandbox] td.whitespace-nowrap,
    [data-cv-pdf-capture-sandbox] [data-cv-shokumu-period],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-period-flat] {
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      white-space: nowrap !important;
    }
    [data-cv-pdf-capture-sandbox] .cv-resizable-table-wrap {
      overflow: visible !important;
      max-width: 100% !important;
    }
    [data-cv-pdf-capture-sandbox] .cv-resizable-table-wrap table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-keep-structure] {
      border: 1px solid #1f2937 !important;
      box-sizing: border-box !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-shokumu-cert-list],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-cert-flat] {
      border: none !important;
    }
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap td,
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap th,
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap td *,
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap th *,
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-editable-marker],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-period-flat],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-flat-cell],
    [data-cv-pdf-capture-sandbox] [data-cv-pdf-section="shokumu"] .cv-resizable-table-wrap [data-cv-pdf-cert-flat] {
      font-size: 11px !important;
    }
  `;
  sandbox.appendChild(styleEl);
  document.body.appendChild(sandbox);
  return { sandbox, clone };
}

function unmountCaptureClone(sandbox) {
  sandbox?.remove();
}

async function captureElementToCanvas(element, scale = 2) {
  if (!element) {
    throw new Error('Thiếu phần tử DOM để xuất PDF');
  }

  await waitForDocumentFonts();

  const { sandbox, clone } = mountCaptureClone(element);
  try {
    prepareElementForCapture([clone]);
    await waitForImagesLoaded(clone);
    void clone.offsetHeight;
    let layoutReady = await waitForElementLayout([clone]);
    if (!layoutReady) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      void clone.offsetHeight;
      layoutReady = await waitForElementLayout([clone], 2500);
    }
    if (!layoutReady) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      void clone.offsetHeight;
      layoutReady = await waitForElementLayout([clone], 3000);
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    forceAutoTableLayoutForCapture(clone);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    let { width, height } = measureCaptureDimensions(clone, { prepare: false });
    if (height < 8) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      void clone.offsetHeight;
      ({ width, height } = measureCaptureDimensions(clone, { prepare: false }));
    }
    if (height < 8) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      void clone.offsetHeight;
      ({ width, height } = measureCaptureDimensions(clone, { prepare: false }));
    }

    if (!layoutReady || height < 8 || width < 8) {
      throw new Error('Nội dung CV chưa sẵn sàng để xuất PDF. Vui lòng thử lại sau vài giây.');
    }

    const canvas = await domToCanvas(clone, {
      scale,
      width,
      height,
      backgroundColor: '#ffffff',
      filter: shouldIncludeNodeForCvCapture,
      fetch: {
        requestInit: { cache: 'no-cache' },
      },
      fetchFn: async (url) => {
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;
        try {
          const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
          if (!res.ok) return false;
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return false;
        }
      },
    });

    if (!canvas || canvas.width < 8 || canvas.height < 8) {
      throw new Error('Không chụp được nội dung CV. Vui lòng thử lại.');
    }

    const paginationPlan = buildCapturePaginationPlan(clone, canvas, scale);
    return { canvas, paginationPlan };
  } finally {
    restoreElementAfterCapture([clone]);
    unmountCaptureClone(sandbox);
  }
}

/** Một section DOM → PDF blob (có thể nhiều trang nếu nội dung dài). */
export async function elementToPdfBlob(element, options = {}) {
  if (!element) {
    throw new Error('Thiếu phần tử DOM để xuất PDF');
  }
  const scale = options.scale ?? 2;
  const retries = options.retries ?? 2;
  const retryable = /chưa sẵn sàng|Không chụp được/;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { canvas, paginationPlan } = await captureElementToCanvas(element, scale);
      return createPdfFromCanvas(canvas, paginationPlan, scale).output('blob');
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !retryable.test(error?.message || '')) throw error;
      await waitForDocumentFonts();
      await new Promise((resolve) => setTimeout(resolve, 400 + attempt * 450));
      void element.offsetHeight;
    }
  }

  throw lastError;
}

/** Nhiều section → một PDF (mỗi section bắt đầu trang mới nếu cần). */
export async function elementsToPdfBlob(elements, options = {}) {
  const parts = (elements || []).filter(Boolean);
  if (!parts.length) {
    throw new Error('Không có nội dung để xuất PDF');
  }
  if (parts.length === 1) {
    return elementToPdfBlob(parts[0], options);
  }

  const scale = options.scale ?? 2;
  let pdf = null;

  for (let i = 0; i < parts.length; i++) {
    const { canvas, paginationPlan } = await captureElementToCanvas(parts[i], scale);
    if (!pdf) {
      pdf = createPdfFromCanvas(canvas, paginationPlan, scale);
    } else {
      addPagedCanvasToPdf(pdf, canvas, paginationPlan, scale, { addPageFirst: true });
    }
  }

  return pdf.output('blob');
}

export function buildCvTemplatePdfManifest(entries) {
  return entries.map(({ cvTemplate, part }) => ({
    cvTemplate,
    part,
    dir: CV_TEMPLATE_DIR_MAP[cvTemplate] || 'Common',
  }));
}

export function appendCvTemplatePdfsToFormData(formData, pdfEntries) {
  const manifest = buildCvTemplatePdfManifest(pdfEntries);
  formData.append('cvTemplatePdfManifest', JSON.stringify(manifest));
  pdfEntries.forEach((entry) => {
    const filename = entry.part === 'shokumu' ? 'cv-shokumu.pdf' : 'cv-rirekisho.pdf';
    const file = new File([entry.blob], filename, { type: 'application/pdf' });
    formData.append('cvTemplatePdf', file);
  });
  return manifest;
}
