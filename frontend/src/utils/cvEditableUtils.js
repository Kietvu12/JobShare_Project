/** Đọc nội dung contentEditable — giữ xuống dòng (innerText + chuẩn hóa \\n). */
export function readContentEditableText(el, multiline = true) {
  if (!el) return '';
  const raw = multiline ? (el.innerText || el.textContent || '') : (el.textContent || '');
  return String(raw).replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trimEnd();
}

/** Đọc và trim toàn bộ (dùng cho ngày tháng, số). */
export function readContentEditableTextTrimmed(el) {
  return String(el?.textContent || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim();
}

/** Chuỗi hiển thị khi blur — giữ \\n, placeholder khi trống. */
export function displayEditableScalarText(stored, emptyPlaceholder = '　') {
  const s = String(stored ?? '').replace(/\r\n?/g, '\n');
  if (!s.trim()) return emptyPlaceholder;
  return s.trimEnd() || emptyPlaceholder;
}

export function mergeEditableBlurHandler(baseOnBlur, customOnBlur) {
  if (!customOnBlur) return baseOnBlur;
  if (!baseOnBlur) return customOnBlur;
  return (e) => {
    customOnBlur(e);
    baseOnBlur(e);
  };
}

/** Blur ô đang focus trong panel preview CV để đồng bộ state trước lưu/preview. */
export async function flushActiveCvContentEditable() {
  const panel = document.getElementById('add-candidate-panel-preview');
  const ae = document.activeElement;
  if (ae?.isContentEditable && (!panel || panel.contains(ae))) {
    ae.blur();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 0));
  }
}

/** Gỡ mọi patch overflow do capture PDF (kể cả ancestor ngoài panel preview). */
export function restoreCvPreviewScrollPanel() {
  document.querySelectorAll('[data-cv-pdf-scroll-patched="1"]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.overflow = '';
    node.style.overflowX = '';
    node.style.overflowY = '';
    node.style.maxHeight = '';
    node.style.height = '';
    delete node.dataset.cvPdfScrollPatched;
  });
  document.querySelectorAll('[data-cv-pdf-capture-root="1"]').forEach((node) => {
    delete node.dataset.cvPdfCaptureRoot;
  });
  document.querySelectorAll('style[data-cv-pdf-scroll-fix="1"]').forEach((el) => el.remove());

  const panel = document.getElementById('add-candidate-panel-preview');
  if (panel) {
    panel.querySelectorAll('.overflow-y-auto, .overflow-auto, .overflow-hidden').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.style.overflow = '';
      node.style.overflowX = '';
      node.style.overflowY = '';
      node.style.height = '';
      node.style.maxHeight = '';
    });
  }

  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}
