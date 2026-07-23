import { domToCanvas } from 'modern-screenshot';
import {
  A4_WIDTH_MM,
  CV_PDF_HORIZONTAL_PADDING_PX,
  addPagedCanvasToPdf,
  buildCapturePaginationPlan,
  createPdfFromCanvas,
  mmToPx,
} from './cvPdfPagination.js';

/** ~210mm @ 96dpi — bề ngang trang A4 khi capture (gồm padding hai lề). */
export const CV_PDF_CAPTURE_WIDTH_PX = Math.round(mmToPx(A4_WIDTH_MM));

/** Bù thêm chiều cao capture — viền dưới 1px của bảng cuối hay bị cắt khi domToCanvas. */
export const CV_PDF_CAPTURE_BORDER_BLEED_PX = 8;

/** Đẩy layer capture ra ngoài viewport — vẫn layout/paint cho modern-screenshot. */
export const CV_PDF_CAPTURE_OFFSCREEN_TRANSFORM = 'translateX(-200vw)';

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

/** Nút chọn giá trị (男/女) — giữ lại trong PDF, không coi là nút thao tác. */
function isCvPdfSelectionButton(btn) {
  const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
  return text === '男' || text === '女';
}

/** Nút thêm/xóa/chèn/preview trong bảng — ẩn khi xuất PDF. */
function isCvPdfActionButton(btn) {
  if (!(btn instanceof HTMLButtonElement)) return false;
  if (btn.closest('.cv-pdf-hide')) return true;
  if (isCvPdfSelectionButton(btn)) return false;

  const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
  const meta = `${text} ${btn.getAttribute('aria-label') || ''} ${btn.getAttribute('title') || ''}`;
  if (CV_PDF_ACTION_BUTTON_RE.test(meta)) return true;
  if (text === '現在') return true;
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
  if (/^行を追加$/.test(rowText) && buttons.length === 1 && buttons.every(isCvPdfActionButton)) return true;

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
  else if (input.className.includes('flex-1') || input.className.includes('min-w-[10rem]')) {
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
    [data-cv-pdf-capture-root] td,
    [data-cv-pdf-capture-root] th {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
      vertical-align: top !important;
    }
    [data-cv-pdf-capture-root] .cv-resizable-table-wrap [role="separator"] {
      display: none !important;
    }
    [data-cv-pdf-capture-root] select {
      visibility: hidden !important;
      pointer-events: none !important;
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

function preparePdfCaptureUi(root) {
  const restoreFns = [];

  root.querySelectorAll('.cv-pdf-hide').forEach((node) => {
    hideNodeForPdfCapture(node, restoreFns);
  });

  root.querySelectorAll('input[type="file"]').forEach((input) => {
    hideNodeForPdfCapture(input, restoreFns);
    const label = input.closest('label');
    if (label) hideNodeForPdfCapture(label, restoreFns);
  });

  applyFixedCertTablePdfLayout(root, restoreFns);

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

  root.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const restore = enhanceCheckboxForPdfCapture(input);
    if (restore) restoreFns.push(restore);
  });

  root.querySelectorAll('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])').forEach((input) => {
    const restore = enhanceTextInputForPdfCapture(input);
    if (restore) restoreFns.push(restore);
  });

  forceAutoTableLayoutForCapture(root, restoreFns);

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

async function waitForElementLayout(elements, maxMs = 5000) {
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

/** Đợi section DOM có layout — dùng query trực tiếp, tránh ref React stale. */
export async function waitForCvPdfSectionElements(getElements, parts = ['rirekisho', 'shokumu'], layerRoot = null, maxMs = 10000) {
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    const elements = typeof getElements === 'function' ? getElements() : null;
    if (Array.isArray(elements) && elements.length === parts.length) {
      const ready = await withVisibleCaptureLayer(elements[0], layerRoot, async () => {
        prepareElementForCapture(elements);
        await waitForElementLayout(elements);
        return elements.every((el) => hasElementLayout(el));
      });
      restoreElementAfterCapture(elements);
      if (ready) return elements;
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }

  const elements = typeof getElements === 'function' ? getElements() : null;
  if (!Array.isArray(elements) || elements.length !== parts.length) return null;

  const ready = await withVisibleCaptureLayer(elements[0], layerRoot, async () => {
    prepareElementForCapture(elements);
    await waitForElementLayout(elements, 1500);
    return elements.every((el) => hasElementLayout(el));
  });
  restoreElementAfterCapture(elements);
  return ready ? elements : null;
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

/**
 * Capture DOM trực tiếp (giữ class + stylesheet Tailwind) qua modern-screenshot.
 */
async function captureElementToCanvas(element, scale = 2) {
  if (!element) {
    throw new Error('Thiếu phần tử DOM để xuất PDF');
  }

  await waitForDocumentFonts();

  return withVisibleCaptureLayer(element, null, async () => {
    const ancestorScrollRestoreFns = [];
    suppressScrollableAncestors(element, ancestorScrollRestoreFns);
    prepareElementForCapture([element]);
    try {
      await waitForImagesLoaded(element);
      let layoutReady = await waitForElementLayout([element]);
      if (!layoutReady) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        layoutReady = await waitForElementLayout([element], 2000);
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      forceAutoTableLayoutForCapture(element);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const { width, height } = measureCaptureDimensions(element, { prepare: false });

      if (!layoutReady || height < 8 || width < 8) {
        throw new Error('Nội dung CV chưa sẵn sàng để xuất PDF. Vui lòng thử lại sau vài giây.');
      }

      const canvas = await domToCanvas(element, {
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

      const paginationPlan = buildCapturePaginationPlan(element, canvas, scale);
      return { canvas, paginationPlan };
    } finally {
      restoreElementAfterCapture([element]);
      ancestorScrollRestoreFns.reverse().forEach((fn) => fn());
    }
  });
}

/** Một section DOM → PDF blob (có thể nhiều trang nếu nội dung dài). */
export async function elementToPdfBlob(element, options = {}) {
  if (!element) {
    throw new Error('Thiếu phần tử DOM để xuất PDF');
  }
  const scale = options.scale ?? 2;
  const { canvas, paginationPlan } = await captureElementToCanvas(element, scale);
  return createPdfFromCanvas(canvas, paginationPlan, scale).output('blob');
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
