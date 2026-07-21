import { getEffectiveSection, normalizeHeading, getFieldColor, styleFieldKey } from './htmlTemplateOverrides';
import { closestFromEvent, eventTargetElement, wjsDebug } from './wjsBuilderDebug';
import { clearWjsMediaDragPayload, readWjsMediaDropUrl } from './wjsMediaDragStore';

export const INLINE_EDITOR_CSS = `
.wjs-editable {
  outline: 2px dashed transparent;
  outline-offset: 2px;
  cursor: text;
  transition: outline-color 0.15s, background 0.15s;
  border-radius: 2px;
}
.wjs-editable:hover {
  outline-color: rgba(37, 99, 235, 0.45);
  background: rgba(37, 99, 235, 0.06);
}
.wjs-editable.wjs-editable-heading {
  outline-offset: 4px;
  min-height: 1em;
  display: block;
  min-width: 0;
  cursor: text !important;
  pointer-events: auto !important;
  position: relative;
  z-index: 2;
}
main h2 span.wjs-editable.wjs-heading-main {
  font-size: inherit !important;
  opacity: 1 !important;
  font-weight: inherit !important;
  letter-spacing: inherit !important;
}
.wjs-section-picker {
  cursor: default;
}
.wjs-editable.wjs-editable-heading:hover {
  outline-color: rgba(37, 99, 235, 0.65);
  background: rgba(37, 99, 235, 0.1);
}
.wjs-editable:focus {
  outline: 2px solid #2563eb;
  background: rgba(37, 99, 235, 0.08);
}
.wjs-editable-img {
  outline: 2px dashed transparent;
  outline-offset: 2px;
  cursor: pointer;
  transition: outline-color 0.15s;
}
.wjs-editable-img:hover {
  outline-color: rgba(217, 119, 6, 0.7);
}
.wjs-section-active .wjs-editable,
.wjs-section-active .wjs-editable-img {
  outline-color: rgba(37, 99, 235, 0.35);
}
.wjs-editable-bg {
  position: relative;
  cursor: pointer;
}
.wjs-editable-bg::after {
  content: '🖼 Click đổi ảnh nền';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}
.wjs-editable-bg:hover::after { opacity: 1; }
.wjs-section-picker {
  position: relative;
  transition: outline 0.15s;
}
.wjs-section-picker:hover {
  outline: 2px dashed rgba(99, 102, 241, 0.35);
  outline-offset: 2px;
}
.wjs-section-picker.wjs-section-active-picker {
  outline: 2px solid rgba(37, 99, 235, 0.75);
  outline-offset: 2px;
}
.wjs-logo-text {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 4px;
  line-height: 1.2;
  color: inherit;
}
.wjs-deletable-block {
  position: relative !important;
  overflow: visible !important;
}
.wjs-block-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 9999;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #ef4444;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  padding: 0;
  pointer-events: auto;
}
.wjs-deletable-block:hover .wjs-block-delete,
.wjs-deletable-block:focus-within .wjs-block-delete {
  opacity: 1;
  transform: scale(1.05);
}
.wjs-block-delete:hover {
  background: #dc2626;
}
.wjs-editable-icon {
  outline: 2px dashed rgba(217, 119, 6, 0.5);
  outline-offset: 2px;
  cursor: help;
}
.wjs-editable-img-wrap {
  position: relative !important;
  display: inline-block;
}
.wjs-img-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 9999;
}
.wjs-img-drop-zone.wjs-drop-active,
body.wjs-external-drag-over .wjs-editable-img,
body.wjs-external-drag-over .wjs-editable-bg,
body.wjs-external-drag-over .wjs-img-drop-zone {
  outline: 3px dashed #2563eb !important;
  outline-offset: 3px;
  background: rgba(37, 99, 235, 0.08) !important;
}
body.wjs-external-drag-over::after {
  content: 'Thả ảnh vào vùng được highlight';
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 8px;
  z-index: 99999;
  pointer-events: none;
}
`;

function getEditableFieldValue(el) {
  if (el.dataset.wjsField === 'heading.main' && /^H[1-6]$/i.test(el.tagName)) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(':scope > div, :scope > img, [contenteditable="false"]').forEach((n) => n.remove());
    return htmlToPlain(clone.innerHTML);
  }
  return htmlToPlain(el.innerHTML);
}

function htmlToPlain(html = '') {
  const tmp = html.replace(/<br\s*\/?>/gi, '\n');
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return tmp.replace(/<[^>]+>/g, '');
  div.innerHTML = tmp;
  return (div.textContent || div.innerText || '').trim();
}

function markText(el, sectionId, field, index, { color, isHeading = false } = {}) {
  if (!el || el.classList.contains('wjs-editable')) return;
  if (el.closest('.wjs-editable[data-wjs-field]')) return;
  if (el.querySelector('.wjs-editable[data-wjs-field]')) return;
  if (/^H[1-6]$/i.test(el.tagName) && el.querySelector(':scope > div, :scope > img')) return;
  el.setAttribute('data-wjs-section', sectionId);
  el.setAttribute('data-wjs-field', field);
  if (index != null) el.setAttribute('data-wjs-index', String(index));
  el.setAttribute('contenteditable', 'true');
  el.setAttribute('spellcheck', 'false');
  el.classList.add('wjs-editable');
  if (isHeading || /^h[1-6]$/i.test(el.tagName)) {
    el.classList.add('wjs-editable-heading');
  }
  if (color) el.style.color = color;
}

/** Chỉ blur phần tử đang focus — không reset hàng loạt contenteditable (gây mất edit). */
export function releaseInlineEditorState(doc) {
  if (!doc) return;
  try {
    const active = doc.activeElement;
    if (active?.classList?.contains('wjs-editable')) {
      active.blur();
    }
  } catch {
    // ignore
  }
}

/** Tách main/sub trong heading — tránh contenteditable lồng nhau (gây đơ trình duyệt). */
function getOrCreateHeadingMainSpan(heading, subEl) {
  const existing = heading.querySelector(':scope > span.wjs-heading-main');
  if (existing) return existing;

  const doc = heading.ownerDocument;
  const mainSpan = doc.createElement('span');
  mainSpan.className = 'wjs-heading-main';

  const toMove = [];
  for (const child of heading.childNodes) {
    if (child === subEl) break;
    if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) continue;
    toMove.push(child);
  }

  if (toMove.length === 0) {
    heading.insertBefore(mainSpan, subEl);
    return mainSpan;
  }

  toMove.forEach((n) => mainSpan.appendChild(n));
  heading.insertBefore(mainSpan, subEl);
  return mainSpan;
}

function markHeadingWithOptionalSub(heading, sectionId, mainField, subField, {
  mainColor,
  subColor,
  isHeading = true,
  subSelector = ':scope > span:not(.wjs-heading-main)',
  index = undefined,
} = {}) {
  if (!heading) return;
  const subEl = subField ? heading.querySelector(subSelector) : null;
  if (subEl && subField) {
    const mainSpan = getOrCreateHeadingMainSpan(heading, subEl);
    markText(mainSpan, sectionId, mainField, index, { color: mainColor, isHeading: true });
    markText(subEl, sectionId, subField, index, { color: subColor, isHeading: true });
  } else {
    markText(heading, sectionId, mainField, index, { color: mainColor, isHeading: true });
  }
}

function markImage(el, sectionId, field, index) {
  if (!el) return;
  const host = el.parentElement;
  if (host && !host.classList.contains('wjs-editable-img-wrap')) {
    host.classList.add('wjs-editable-img-wrap');
    if (!host.querySelector(':scope > .wjs-img-delete')) {
      const btn = el.ownerDocument.createElement('button');
      btn.type = 'button';
      btn.className = 'wjs-block-delete wjs-img-delete';
      btn.title = 'Xóa ảnh';
      btn.setAttribute('aria-label', 'Xóa ảnh');
      btn.setAttribute('data-wjs-img-delete', '1');
      btn.textContent = '×';
      host.appendChild(btn);
    }
  }
  el.setAttribute('data-wjs-section', sectionId);
  el.setAttribute('data-wjs-field', field);
  el.setAttribute('data-wjs-type', 'image');
  if (index != null) el.setAttribute('data-wjs-index', String(index));
  el.classList.add('wjs-editable-img');
}

function markBgSlide(el, sectionId, field, index) {
  if (!el) return;
  el.setAttribute('data-wjs-section', sectionId);
  el.setAttribute('data-wjs-field', field);
  el.setAttribute('data-wjs-type', 'bg-image');
  if (index != null) el.setAttribute('data-wjs-index', String(index));
  el.classList.add('wjs-editable-bg');
}

/** Chuẩn bị DOM template trước khi bật inline edit (tránh script fade-in phá contenteditable) */
export function prepareDocForInlineEdit(doc) {
  if (!doc?.body) return;
  doc.body.classList.add('wjs-builder-edit');

  let style = doc.getElementById('wjs-builder-edit-style');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'wjs-builder-edit-style';
    style.textContent = `
      body.wjs-builder-edit .fade-in-text { visibility: visible !important; }
      body.wjs-builder-edit .fade-in-text .char { animation: none !important; opacity: 1 !important; display: inline !important; }
      body.wjs-builder-edit .fade_in,
      body.wjs-builder-edit .fade_in.right,
      body.wjs-builder-edit .fade_in.up,
      body.wjs-builder-edit .fade_in.curtain { opacity: 1 !important; transform: none !important; visibility: visible !important; }
      body.wjs-builder-edit .fade_in.curtain { z-index: 0 !important; }
      body.wjs-builder-edit .fade_in.curtain:before { display: none !important; }
      body.wjs-builder-edit .slide_hero_img {
        z-index: 0 !important;
        animation: none !important;
        opacity: 0 !important;
        transform: none !important;
      }
      body.wjs-builder-edit .slide_hero_img:nth-child(2) {
        opacity: 1 !important;
        z-index: 0 !important;
      }
      body.wjs-builder-edit .slide_hero_box {
        z-index: 1 !important;
        position: relative;
        pointer-events: none;
        background: transparent !important;
      }
      body.wjs-builder-edit .slide_hero_catchcopy h2,
      body.wjs-builder-edit .slide_hero_catchcopy h3,
      body.wjs-builder-edit .slide_hero_catchcopy p {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        color: #fff !important;
      }
      body.wjs-builder-edit .slide_hero_catchcopy h2.wjs-editable { display: inline-block !important; }
      body.wjs-builder-edit .slide_hero {
        height: clamp(480px, 56vw, 680px) !important;
      }
      body.wjs-builder-edit html,
      body.wjs-builder-edit {
        overflow-x: hidden !important;
      }
      body.wjs-builder-edit section.page_block,
      body.wjs-builder-edit .page_box {
        overflow: visible !important;
      }
      body.wjs-builder-edit #mainimg.wjs-editable-bg {
        position: relative;
      }
      body.wjs-builder-edit .slide_hero_img.wjs-editable-bg {
        z-index: 0 !important;
      }
      body.wjs-builder-edit .slide_hero_img.wjs-editable-bg:nth-child(2) {
        opacity: 1 !important;
      }
      body.wjs-builder-edit .page_box .eye_catch.wjs-editable-bg {
        min-height: 120px;
        margin-right: 0 !important;
        padding-right: 0 !important;
      }
      body.wjs-builder-edit .page_box h3 {
        margin-right: 0 !important;
        padding-right: 0 !important;
      }
      body.wjs-builder-edit .page_box h3 {
        z-index: 0 !important;
      }
      body.wjs-builder-edit .page_box .copy {
        position: relative;
        z-index: 1;
      }
      body.wjs-builder-edit * { user-select: text; }
      body.wjs-builder-edit,
      body.wjs-builder-edit main,
      body.wjs-builder-edit section {
        overflow-x: visible !important;
      }
      body.wjs-builder-edit #menubar_hdr {
        transform: none !important;
        right: 0 !important;
      }
      body.wjs-builder-edit main h2 > div,
      body.wjs-builder-edit main h2 > div img {
        pointer-events: none !important;
      }
      body.wjs-builder-edit main h2.wjs-section-heading,
      body.wjs-builder-edit main h2.wjs-section-heading span.wjs-editable {
        pointer-events: auto !important;
      }
      main h2 span.wjs-heading-main,
      main h2 span.wjs-editable.wjs-heading-main {
        font-size: inherit !important;
        opacity: 1 !important;
        font-weight: inherit !important;
        letter-spacing: inherit !important;
      }
    `;
    doc.head.appendChild(style);
  }

  doc.querySelectorAll('.fade-in-text').forEach((el) => {
    if (el.querySelector('.char')) {
      const plain = el.textContent || '';
      el.innerHTML = plain;
    }
    el.classList.remove('fade-in-text');
  });

  doc.querySelectorAll('.fade_in').forEach((el) => {
    el.classList.add('show');
  });
}

function findSectionHeading(doc, section) {
  const root = section.selector ? doc.querySelector(section.selector) : null;
  const anchorSec = section.anchor ? doc.getElementById(section.anchor) : null;
  const parentSection = root?.closest('section') || anchorSec;

  if (root?.tagName?.match(/^H[1-6]$/i)) return root;

  // h2 thường là con trực tiếp của <section>, không nằm trong .list-grid1
  const directH = parentSection?.querySelector(':scope > h2, :scope > h3, :scope > h2.c, :scope > h2.c');
  if (directH) return directH;

  return anchorSec?.querySelector('h2, h3')
    || root?.closest('section')?.querySelector('h2, h3')
    || root?.querySelector('h2, h3');
}

function markSectionHeading(doc, section) {
  const h = findSectionHeading(doc, section);
  if (!h) return;
  h.classList.add('wjs-section-heading');
  const sid = section.id;
  const mainColor = getFieldColor(section, 'heading.main');
  const subColor = getFieldColor(section, 'heading.sub');

  // Portfolio / list_grid: h2.bg-slideup — JP + EN trong div.image
  if (h.classList.contains('bg-slideup')) {
    const jp = h.querySelector('.jp-text');
    const en = h.querySelector('.en-text');
    if (jp) markText(jp, sid, 'heading.main', null, { color: mainColor, isHeading: true });
    if (en) markText(en, sid, 'heading.sub', null, { color: subColor, isHeading: true });
    return;
  }

  // kaishaintro: h2.c — tiêu đề JP + phụ đề EN trong span
  const enSubSpan = h.querySelector(':scope > span:not(.wjs-heading-main)');
  if (h.classList.contains('c') && enSubSpan) {
    markHeadingWithOptionalSub(h, sid, 'heading.main', 'heading.sub', {
      subSelector: ':scope > span:not(.wjs-heading-main)',
      mainColor,
      subColor,
    });
    return;
  }

  // kaishaintro solutions: h2 có div/img trang trí — sửa chữ + ảnh trang trí
  const decorBlock = h.querySelector(':scope > div');
  if (decorBlock && !h.classList.contains('c') && !h.querySelector('.jp-text, .en-text, :scope > span:not(.wjs-heading-main)')) {
    const mainSpan = getOrCreateHeadingMainSpan(h, decorBlock);
    markText(mainSpan, sid, 'heading.main', null, { color: mainColor, isHeading: true });
    const decorImg = decorBlock.querySelector('img');
    if (decorImg) markImage(decorImg, sid, 'heading.decorImage');
    return;
  }

  const mainEl = h.querySelector('span.fade-in-text, span.wjs-heading-main');
  const subEl = h.querySelector('span.small, span.hosoku');
  if (mainEl && subEl) {
    markText(mainEl, sid, 'heading.main', null, { color: mainColor, isHeading: true });
    markText(subEl, sid, 'heading.sub', null, { color: subColor, isHeading: true });
  } else if (mainEl && mainEl !== h) {
    markText(mainEl, sid, 'heading.main', null, { color: mainColor, isHeading: true });
    if (subEl) markText(subEl, sid, 'heading.sub', null, { color: subColor, isHeading: true });
  } else if (subEl) {
    markText(subEl, sid, 'heading.sub', null, { color: subColor, isHeading: true });
    const mainSpan = getOrCreateHeadingMainSpan(h, subEl);
    markText(mainSpan, sid, 'heading.main', null, { color: mainColor, isHeading: true });
  } else {
    markText(h, sid, 'heading.main', null, { color: mainColor, isHeading: true });
  }
}

function markDecorativeSectionImages(doc, section) {
  const sid = section.id;
  if (section.type === 'thumbnail_marquee') {
    const root = section.selector
      ? doc.querySelector(section.selector)
      : doc.querySelector('section.padding-lr0');
    root?.querySelectorAll('img').forEach((img, i) => {
      markImage(img, sid, 'items.image', i);
    });
  }
}

function markEditableSection(doc, section) {
  if (section.visible === false) return;
  if (section.decorative) {
    markDecorativeSectionImages(doc, section);
    return;
  }
  const sid = section.id;

  switch (section.type) {
    case 'hero_slideshow': {
      const root = doc.querySelector(section.selector || '#mainimg');
      if (!root) break;
      root.querySelectorAll('.slide').forEach((el, i) => {
        markBgSlide(el, sid, 'slides.image', i);
        const h = el.querySelector('h1, h2');
        if (h) markText(h, sid, 'slides.headline', i, { color: getFieldColor(section, 'slides.headline', i), isHeading: true });
        const inner = el.querySelector('div');
        if (!h && inner) {
          const h1 = inner.querySelector('h1, h2');
          if (h1) markText(h1, sid, 'slides.headline', i, { color: getFieldColor(section, 'slides.headline', i), isHeading: true });
        }
        const p = el.querySelector('p:not(.btn-border-radius):not(.btn)');
        if (p) markText(p, sid, 'slides.body', i, { color: getFieldColor(section, 'slides.body', i) });
        const cta = el.querySelector('.btn-border-radius a, .btn a, p.btn-border-radius a');
        if (cta) markText(cta, sid, 'slides.ctaText', i, { color: getFieldColor(section, 'slides.ctaText', i) });
      });
      break;
    }
    case 'hero_slide': {
      const root = doc.querySelector(section.selector || '.mainimg');
      const slideEl = root?.querySelector('.slide') || root;
      if (!slideEl) break;
      const h2 = slideEl.querySelector('.text h2, h2') || root?.querySelector(':scope > .text h1, :scope > .text h2');
      if (h2) {
        markHeadingWithOptionalSub(h2, sid, 'slide.headline', 'slide.subheadline', {
          mainColor: getFieldColor(section, 'slide.headline'),
          subColor: getFieldColor(section, 'slide.subheadline'),
        });
      } else {
        const textP = slideEl.querySelector('.text > p, .text p');
        if (textP) markText(textP, sid, 'slide.headline', null, { color: getFieldColor(section, 'slide.headline') });
      }
      const bodyP = (root?.querySelector(':scope > .text') || slideEl)?.querySelector('p:not(.btn)');
      if (bodyP) markText(bodyP, sid, 'slide.body');
      (root?.querySelectorAll('.btn-container .btn a, .btn-container a') || slideEl.querySelectorAll('.btn-container .btn a, .btn a')).forEach((a, i) => {
        markText(a, sid, i === 0 ? 'slide.ctaPrimary' : 'slide.ctaSecondary');
      });
      root?.querySelectorAll('.image .slide picture img, .image .slide img, .slide picture img, .slide img').forEach((img, i) => {
        markImage(img, sid, 'slides.image', i);
      });
      const img = slideEl.querySelector('picture img, img');
      if (img) {
        markImage(img, sid, 'slide.image');
      } else if (root && !root.querySelector('[data-wjs-type="image"]')) {
        markBgSlide(root, sid, 'slide.image');
      }
      break;
    }
    case 'hero_biz65': {
      const root = doc.querySelector(section.selector || '.mainimg');
      const textBox = root?.querySelector(':scope > .text');
      const h1 = textBox?.querySelector('h1, h2');
      if (h1) markText(h1, sid, 'slide.headline', null, { isHeading: true });
      const bodyP = textBox?.querySelector('p:not(.btn)');
      if (bodyP) markText(bodyP, sid, 'slide.body');
      textBox?.querySelectorAll('.btn-container .btn a, .btn-container a').forEach((a, i) => {
        markText(a, sid, i === 0 ? 'slide.ctaPrimary' : 'slide.ctaSecondary');
      });
      root?.querySelectorAll('.image .slide picture img, .image .slide img').forEach((img, i) => {
        markImage(img, sid, 'slides.image', i);
      });
      break;
    }
    case 'announcement_bar': {
      const root = doc.querySelector(section.selector || '.new-top');
      if (!root) break;
      const h2 = root.querySelector('h2');
      if (h2) markText(h2, sid, 'heading');
      const p = root.querySelector('p.text, p');
      if (p) markText(p, sid, 'body');
      break;
    }
    case 'icon_list':
    case 'list_grid': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((el, i) => {
        const h4 = el.querySelector('.text h4, h4');
        if (h4) markText(h4, sid, 'items.title', i, { color: getFieldColor(section, 'items.title', i) });
        const p = el.querySelector('.text p, .text-parts p, p:not(.btn):not(.btn1):not(.name)');
        if (p) markText(p, sid, 'items.body', i);
        const link = el.querySelector('.btn a, p.btn a, p.btn1 a');
        if (link) markText(link, sid, 'items.linkText', i);
        const img = el.querySelector('figure.icon img, figure img');
        if (img) markImage(img, sid, 'items.image', i);
        const faIcon = el.querySelector(':scope > i, h4 i, .text i, .image.icon i, .image i');
        if (faIcon && faIcon.tagName === 'I') {
          faIcon.classList.add('wjs-editable-icon');
          faIcon.title = 'Icon — sửa class ở panel phải';
        }
      });
      const moreLink = root?.closest('section')?.querySelector('p.btn1 a, .btn1 a');
      if (moreLink) markText(moreLink, sid, 'moreLink.text');
      break;
    }
    case 'service_grid': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((el, i) => {
        const h4 = el.querySelector('h4');
        if (h4) {
          markHeadingWithOptionalSub(h4, sid, 'items.title', 'items.subtitle', {
            subSelector: ':scope > span',
            mainColor: getFieldColor(section, 'items.title', i),
            subColor: getFieldColor(section, 'items.subtitle', i),
            index: i,
          });
        }
        const p = el.querySelector('p');
        if (p) markText(p, sid, 'items.body', i);
        const img = el.querySelector('figure img, img');
        if (img) markImage(img, sid, 'items.image', i);
      });
      break;
    }
    case 'text_image': {
      const root = doc.querySelector(section.selector);
      if (!root) break;
      const h2 = root.querySelector('h2');
      if (h2) {
        markHeadingWithOptionalSub(h2, sid, 'heading.main', 'heading.sub');
      }
      const body = root.querySelector('p.small, .text p, p');
      if (body) markText(body, sid, 'body');
      const img = root.querySelector('.image img, img');
      if (img) markImage(img, sid, 'image');
      break;
    }
    case 'text_image_alternate': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((el, i) => {
        const h4 = el.querySelector('h4');
        if (h4) {
          markHeadingWithOptionalSub(h4, sid, 'items.title', 'items.subtitle', {
            subSelector: ':scope > span',
            mainColor: getFieldColor(section, 'items.title', i),
            subColor: getFieldColor(section, 'items.subtitle', i),
            index: i,
          });
        }
        const p = el.querySelector('.text p');
        if (p) markText(p, sid, 'items.body', i);
        const img = el.querySelector('figure img, img');
        if (img) markImage(img, sid, 'items.image', i);
      });
      break;
    }
    case 'step_list': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('li, .list').forEach((el, i) => {
        const h4 = el.querySelector('h4, h3');
        if (h4) markText(h4, sid, 'steps.title', i);
        const p = el.querySelector('p');
        if (p) markText(p, sid, 'steps.body', i);
        const icon = el.querySelector('h4 i, h3 i');
        if (icon) {
          icon.classList.add('wjs-editable-icon');
          icon.title = 'Icon FontAwesome — sửa ở panel phải';
        }
      });
      break;
    }
    case 'flow_boxes': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.flow-box').forEach((el, i) => {
        const titleH3 = el.querySelector('.title h3');
        if (titleH3) markText(titleH3, sid, 'steps.title', i);
        const p = el.querySelector('.text p');
        if (p) markText(p, sid, 'steps.body', i);
      });
      break;
    }
    case 'faq_accordion': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('dt').forEach((dt, i) => {
        markText(dt, sid, 'items.question', i);
        const dd = dt.nextElementSibling;
        if (dd?.tagName === 'DD') markText(dd, sid, 'items.answer', i);
      });
      break;
    }
    case 'testimonials_scroll':
    case 'testimonials_carousel': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((el, i) => {
        const h4 = el.querySelector('h4');
        if (h4) markText(h4, sid, 'items.title', i);
        const p = el.querySelector('p.text, .text > p:not(.name)');
        if (p) markText(p, sid, 'items.body', i);
        const name = el.querySelector('p.name, .name');
        if (name) markText(name, sid, 'items.name', i);
        const img = el.querySelector('figure img, img');
        if (img) markImage(img, sid, 'items.image', i);
      });
      const moreLink = root?.closest('section')?.querySelector('p.btn1 a, .btn1 a');
      if (moreLink) markText(moreLink, sid, 'moreLink.text');
      break;
    }
    case 'news_list': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('dd').forEach((dd, i) => {
        markText(dd, sid, 'items.body', i, { color: getFieldColor(section, 'items.body', i) });
      });
      break;
    }
    case 'cta_banner': {
      const root = doc.querySelector(section.selector);
      const h2 = root?.querySelector('h2');
      if (h2) markText(h2, sid, 'heading.main');
      const p = root?.querySelector('p');
      if (p) markText(p, sid, 'body');
      root?.querySelectorAll('.btn a, a').forEach((a, i) => {
        markText(a, sid, 'buttons.text', i);
      });
      break;
    }
    case 'dual_cta':
    case 'contact_cta': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((block, i) => {
        const sub = block.querySelector('.sub-text, h4 .sub-text');
        const main = block.querySelector('.main-text, h4 .main-text');
        if (sub) markText(sub, sid, 'buttons.subText', i);
        if (main) markText(main, sid, 'buttons.mainText', i);
        const a = block.querySelector('a');
        if (a) markText(a, sid, 'buttons.text', i);
      });
      root?.querySelectorAll('a').forEach((a, i) => {
        if (!a.closest('.list')) markText(a, sid, 'buttons.text', i);
      });
      break;
    }
    case 'pricing_table': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      const table = root?.querySelector('table');
      table?.querySelectorAll('tr').forEach((tr, ri) => {
        tr.querySelectorAll('th, td').forEach((cell, ci) => {
          markText(cell, sid, ri === 0 ? 'plans.header' : 'rows.cell', ri === 0 ? ci : `${ri - 1}-${ci}`);
        });
      });
      break;
    }
    case 'company_profile': {
      markSectionHeading(doc, section);
      const root = doc.querySelector(section.selector);
      const cap = root?.querySelector('caption');
      if (cap) markText(cap, sid, 'caption');
      root?.querySelectorAll('table tr').forEach((tr, i) => {
        const th = tr.querySelector('th');
        const td = tr.querySelector('td');
        if (th) markText(th, sid, 'rows.label', i);
        if (td) markText(td, sid, 'rows.value', i);
      });
      break;
    }
    case 'recruit_hero': {
      const root = doc.querySelector(section.selector || '.slide_hero');
      const box = root?.querySelector('.slide_hero_catchcopy');
      const h2 = box?.querySelector('h2');
      const h3 = box?.querySelector('h3');
      const p = box?.querySelector('p');
      if (h2) markText(h2, sid, 'slide.headline', null, { isHeading: true });
      if (h3) markText(h3, sid, 'slide.subheadline', null, { isHeading: true });
      if (p) markText(p, sid, 'slide.body');
      root?.querySelectorAll('.slide_hero_img').forEach((el, i) => {
        markBgSlide(el, sid, 'slides.image', i);
      });
      break;
    }
    case 'recruit_news': {
      const root = doc.querySelector(section.selector || '.news_block');
      const ps = root?.querySelectorAll('.news_box p');
      if (ps?.[0]) markText(ps[0], sid, 'heading.main');
      if (ps?.[1]) markText(ps[1], sid, 'body');
      break;
    }
    case 'recruit_page': {
      const root = doc.querySelector(section.selector) || (section.anchor ? doc.getElementById(section.anchor) : null);
      const h3 = root?.querySelector('.title_box h3');
      const h2 = root?.querySelector('.title_box h2');
      const copyH2 = root?.querySelector('.copy h2');
      const copyP = root?.querySelector('.copy p');
      if (h3) markText(h3, sid, 'sectionLabel');
      if (h2) {
        markHeadingWithOptionalSub(h2, sid, 'heading.main', 'heading.sub', { isHeading: true });
      }
      if (copyH2) markText(copyH2, sid, 'copyHeadline', null, { isHeading: true });
      if (copyP) markText(copyP, sid, 'copyBody');
      const eyeCatch = root?.querySelector('.eye_catch');
      if (eyeCatch) markBgSlide(eyeCatch, sid, 'image');
      break;
    }
    case 'recruit_stats': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.data_box > div').forEach((el, i) => {
        const h4 = el.querySelector('h4');
        const p = el.querySelector('p.count');
        const img = el.querySelector('img');
        if (h4) markText(h4, sid, 'items.title', i);
        if (p) markText(p, sid, 'items.value', i);
        if (img) markImage(img, sid, 'items.image', i);
      });
      break;
    }
    case 'recruit_qa': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('h4').forEach((h4, i) => {
        markText(h4, sid, 'items.question', i);
        const p = h4.nextElementSibling?.tagName === 'P' ? h4.nextElementSibling : null;
        if (p) markText(p, sid, 'items.answer', i);
      });
      break;
    }
    case 'recruit_timeline': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('tr').forEach((tr, i) => {
        const th = tr.querySelector('th h4, th');
        const tdTitle = tr.querySelector('td h4');
        const tdP = tr.querySelector('td p');
        if (th) markText(th, sid, 'items.time', i);
        if (tdTitle) markText(tdTitle, sid, 'items.title', i);
        if (tdP) markText(tdP, sid, 'items.body', i);
      });
      break;
    }
    case 'recruit_entry': {
      const root = doc.querySelector(section.selector || '#entry');
      const h2 = root?.querySelector('h2');
      const h3 = root?.querySelector('.entry_box h3');
      const p = root?.querySelector('.entry_box > p');
      if (h2) markText(h2, sid, 'entryTitle');
      if (h3) markText(h3, sid, 'heading.main', null, { isHeading: true });
      if (p) markText(p, sid, 'body');
      root?.querySelectorAll('.entry_link a').forEach((a, i) => markText(a, sid, 'buttons.label', i));
      const email = root?.querySelector('.entry_email');
      const tel = root?.querySelector('.entry_tel');
      if (email) markText(email, sid, 'email');
      if (tel) markText(tel, sid, 'phone');
      break;
    }
    case 'footer_access':
    case 'access_map': {
      const root = doc.querySelector(section.selector || '#footer');
      const footer1 = root?.querySelector('.footer1');
      const p = footer1?.querySelectorAll('p')?.[1];
      if (p) markText(p, sid, 'address');
      break;
    }
    default:
      break;
  }
}

/** Tránh sparse array (null khi JSON.stringify) khi ghi theo index. */
function setIndexedItem(arr, idx, patch) {
  const next = [...arr];
  while (next.length <= idx) next.push({});
  next[idx] = { ...(next[idx] || {}), ...patch };
  return next;
}

/** Cập nhật overrides từ chỉnh sửa trực tiếp trên preview */
export function patchSectionFromInlineEdit(section, { field, index, value, imageUrl, editType }) {
  const effective = getEffectiveSection(section);
  const ov = JSON.parse(JSON.stringify(section.overrides || {}));

  if (editType === 'color') {
    ov.fieldStyles = { ...(ov.fieldStyles || {}), [styleFieldKey(field, index)]: value };
    return { ...section, overrides: ov };
  }

  if (editType === 'clear-image') {
    if (field === 'logoImage') {
      ov.logoImage = '';
      ov.logoHidden = true;
    } else if (field === 'image' || field === 'heading.decorImage') {
      if (field === 'heading.decorImage') {
        const h = normalizeHeading(ov.heading || effective.heading || {});
        h.decorImage = '';
        ov.heading = h;
      } else {
        ov.image = '';
        ov.imageHidden = true;
      }
    } else if (field.startsWith('slide.')) {
      const key = field.split('.')[1];
      ov.slide = { ...(ov.slide || effective.slide || {}), [key]: '', [`${key}Hidden`]: true };
    } else if (field.startsWith('slides.')) {
      const [, itemKey] = field.split('.');
      ov.slides = setIndexedItem(ov.slides || effective.slides || [], Number(index), {
        [itemKey]: '',
        hidden: true,
      });
    } else if (field.startsWith('items.')) {
      const itemKey = field.split('.')[1];
      ov.items = setIndexedItem(ov.items || effective.items || [], Number(index), {
        [itemKey]: '',
        hidden: itemKey === 'image',
      });
    }
    return { ...section, overrides: ov };
  }

  const setItemField = (arrKey, itemKey, val) => {
    const idx = Number(index);
    const base = ov[arrKey] || effective[arrKey] || [];
    const arr = [...base];
    while (arr.length <= idx) arr.push({});
    arr[idx] = { ...(arr[idx] || effective[arrKey]?.[idx] || {}), [itemKey]: val };
    ov[arrKey] = arr;
  };

  if (field === 'heading' || field === 'heading.main' || field === 'heading.sub') {
    const h = normalizeHeading(ov.heading || effective.heading || {});
    if (field === 'heading' || field === 'heading.main') h.main = value;
    if (field === 'heading.sub') h.sub = value;
    ov.heading = h;
  } else if (field === 'heading.decorImage') {
    const h = normalizeHeading(ov.heading || effective.heading || {});
    h.decorImage = imageUrl || value;
    ov.heading = h;
  } else if (field === 'body') {
    ov.body = value;
  } else if (field === 'sectionLabel') {
    ov.sectionLabel = value;
  } else if (field === 'copyHeadline') {
    ov.copyHeadline = value;
  } else if (field === 'copyBody') {
    ov.copyBody = value;
  } else if (field === 'entryTitle') {
    ov.entryTitle = value;
  } else if (field === 'email') {
    ov.email = value;
  } else if (field === 'phone') {
    ov.phone = value;
  } else if (field === 'address') {
    ov.address = value;
  } else if (field === 'image') {
    ov.image = imageUrl || value;
  } else if (field.startsWith('slide.')) {
    const key = field.split('.')[1];
    ov.slide = { ...(ov.slide || effective.slide || {}), [key]: imageUrl || value };
  } else if (field.startsWith('slides.')) {
    const [, itemKey] = field.split('.');
    ov.slides = setIndexedItem(ov.slides || effective.slides || [], Number(index), {
      [itemKey]: itemKey === 'image' ? (imageUrl || value) : value,
    });
  } else if (field.startsWith('items.')) {
    const itemKey = field.split('.')[1];
    setItemField('items', itemKey, itemKey === 'image' ? (imageUrl || value) : value);
  } else if (field.startsWith('steps.')) {
    const itemKey = field.split('.')[1];
    setItemField('steps', itemKey, value);
  } else if (field.startsWith('buttons.')) {
    const itemKey = field.split('.')[1];
    if (itemKey === 'text' || itemKey === 'href' || itemKey === 'subText' || itemKey === 'mainText' || itemKey === 'label' || itemKey === 'description') {
      setItemField('buttons', itemKey, value);
    }
  } else if (field === 'moreLink.text') {
    ov.moreLink = { ...(ov.moreLink || effective.moreLink || {}), text: value };
  } else if (field === 'caption') {
    ov.caption = value;
  } else if (field.startsWith('rows.')) {
    const parts = field.split('.');
    const subKey = parts[1];
    if (subKey === 'label' || subKey === 'value') {
      ov.rows = setIndexedItem(ov.rows || effective.rows || [], Number(index), { [subKey]: value });
    }
  } else if (field.startsWith('items.') && field.endsWith('.name')) {
    setItemField('items', 'name', value);
  }

  return { ...section, overrides: ov };
}

/** Xóa 1 khối element (mục list, bước, slide, FAQ…) từ preview */
export function patchSectionFromInlineDelete(section, { blockKey, index }) {
  const effective = getEffectiveSection(section);
  const ov = JSON.parse(JSON.stringify(section.overrides || {}));
  const arr = [...(ov[blockKey] || effective[blockKey] || [])];
  const idx = Number(index);
  if (idx < 0 || idx >= arr.length) return section;
  if (arr.length <= 1) return section;
  arr.splice(idx, 1);
  ov[blockKey] = arr;
  return { ...section, overrides: ov };
}

function attachDeletableBlocks(doc, section) {
  if (section.visible === false || section.decorative) return;
  const sid = section.id;

  const markBlock = (el, blockKey, index) => {
    if (!el) return;
    el.classList.add('wjs-deletable-block');
    el.setAttribute('data-wjs-section', sid);
    el.setAttribute('data-wjs-block-key', blockKey);
    el.setAttribute('data-wjs-block-index', String(index));
    let btn = el.querySelector(':scope > .wjs-block-delete');
    if (!btn) {
      btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'wjs-block-delete';
      btn.title = 'Xóa khối này';
      btn.setAttribute('aria-label', 'Xóa');
      btn.textContent = '×';
      el.appendChild(btn);
    }
  };

  switch (section.type) {
    case 'hero_slideshow': {
      const root = doc.querySelector(section.selector || '#mainimg');
      root?.querySelectorAll('.slide').forEach((el, i) => markBlock(el, 'slides', i));
      break;
    }
    case 'icon_list':
    case 'list_grid':
    case 'service_grid':
    case 'text_image_alternate':
    case 'testimonials_scroll':
    case 'testimonials_carousel': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.list').forEach((el, i) => markBlock(el, 'items', i));
      break;
    }
    case 'step_list': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('li, .list').forEach((el, i) => markBlock(el, 'steps', i));
      break;
    }
    case 'flow_boxes': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('.flow-box').forEach((el, i) => markBlock(el, 'steps', i));
      break;
    }
    case 'faq_accordion':
    case 'news_list': {
      const root = doc.querySelector(section.selector);
      root?.querySelectorAll('dt').forEach((el, i) => markBlock(el, 'items', i));
      break;
    }
    default:
      break;
  }
}

function attachImageDropZones(doc, { onImageFileDrop, onMediaDrop }) {
  const bind = (el) => {
    if (!el || el.dataset.wjsDropBound) return;
    el.dataset.wjsDropBound = '1';
    el.classList.add('wjs-img-drop-zone');
    const onOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      el.classList.add('wjs-drop-active');
    };
    const onLeave = () => el.classList.remove('wjs-drop-active');
    const onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('wjs-drop-active');
      const payload = {
        sectionId: el.dataset.wjsSection,
        field: el.dataset.wjsField,
        index: el.dataset.wjsIndex != null ? Number(el.dataset.wjsIndex) : undefined,
        element: el,
      };
      const mediaUrl = readWjsMediaDropUrl(e.dataTransfer);
      if (mediaUrl) {
        clearWjsMediaDragPayload();
        onMediaDrop?.({ ...payload, url: mediaUrl });
        return;
      }
      const file = e.dataTransfer.files?.[0];
      if (file?.type?.startsWith('image/')) {
        onImageFileDrop?.({ ...payload, file });
      }
    };
    el.addEventListener('dragover', onOver);
    el.addEventListener('dragleave', onLeave);
    el.addEventListener('drop', onDrop);
  };
  doc.querySelectorAll('[data-wjs-type="image"], [data-wjs-type="bg-image"]').forEach(bind);
}

function attachSectionPickers(doc, sections) {
  sections.forEach((section) => {
    if (section.visible === false || section.decorative) return;
    const root = section.selector ? doc.querySelector(section.selector) : null;
    const anchor = section.anchor ? doc.getElementById(section.anchor) : null;
    const block = root?.closest('section') || anchor || root || root?.parentElement;
    if (!block) return;
    block.setAttribute('data-wjs-section-picker', section.id);
    block.classList.add('wjs-section-picker');
  });
}

function markSiteHeader(doc, globals = {}) {
  const header = globals.sharedBlocks?.header || {};
  const logoSel = header.logoSelector || '#logo a, h1.logo a, h1#logo a, h1.logo a';
  const logoLink = doc.querySelector(logoSel);
  if (!logoLink) return;

  const displayName = globals.logoText || globals.companyName || '';
  const logoType = header.logoType || (logoLink.querySelector('img') ? 'image' : 'text');

  /* lp_recruite: logo nằm trong h1.company_name bên trong thẻ a */
  const recruitH1 = logoLink.querySelector('h1.company_name') || doc.querySelector('h1.company_name');
  if (recruitH1 && logoLink.closest('.company_name_box')) {
    if (displayName) {
      const subText = globals.logoSubtext
        || recruitH1.querySelector('span')?.textContent
        || 'RECRUIT SITE';
      recruitH1.innerHTML = `${displayName}<span>${subText}</span>`;
    }
    markText(recruitH1, '__header__', 'logoText', null, { isHeading: true });
    return;
  }

  if (logoType === 'image') {
    const img = logoLink.querySelector('img');
    if (img) {
      if (displayName) img.alt = displayName;
      markImage(img, '__header__', 'logoImage', null);
    }
    const host = logoLink.closest('h1.logo, #logo, h1#logo') || logoLink.parentElement;
    let label = host?.querySelector('.wjs-logo-text');
    if (!label && host) {
      label = doc.createElement('span');
      label.className = 'wjs-logo-text';
      host.appendChild(label);
    }
    if (label) {
      label.textContent = displayName || img?.alt || 'Tên công ty';
      markText(label, '__header__', 'logoText', null, { isHeading: true });
    }
  } else {
    if (displayName) logoLink.textContent = displayName;
    markText(logoLink, '__header__', 'logoText', null, {
      color: globals.logoColor || '',
      isHeading: true,
    });
  }
}

export function highlightSelectedSection(doc, selectedSectionId) {
  doc.querySelectorAll('[data-wjs-section]').forEach((el) => {
    el.classList.toggle('wjs-section-active', el.dataset.wjsSection === selectedSectionId);
  });
  doc.querySelectorAll('[data-wjs-section-picker]').forEach((el) => {
    el.classList.toggle('wjs-section-active-picker', el.dataset.wjsSectionPicker === selectedSectionId);
  });
}

export function setupInlineEditor(doc, {
  sections = [],
  selectedSectionId,
  getSelectedSectionId,
  globals = {},
  onSelectSection,
  onSectionEdit,
  onImageClick,
  onTextFocus,
  onHeaderEdit,
  onBlockDelete,
  onImageFileDrop,
  onMediaDrop,
}) {
  if (!doc) return () => {};

  prepareDocForInlineEdit(doc);

  let style = doc.getElementById('wjs-inline-editor-style');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'wjs-inline-editor-style';
    style.textContent = INLINE_EDITOR_CSS;
    doc.head.appendChild(style);
  }

  sections.forEach((s) => markEditableSection(doc, s));
  sections.forEach((s) => attachDeletableBlocks(doc, s));
  attachImageDropZones(doc, { onImageFileDrop, onMediaDrop });
  attachSectionPickers(doc, sections);
  markSiteHeader(doc, globals);
  highlightSelectedSection(doc, selectedSectionId);

  wjsDebug('inline', 'setupInlineEditor', {
    sections: sections.length,
    editableCount: doc.querySelectorAll('.wjs-editable[data-wjs-field]').length,
    selectedSectionId,
  });

  const onFocusIn = (e) => {
    const editable = closestFromEvent(e, '.wjs-editable[data-wjs-field]');
    const sectionEl = editable?.closest('[data-wjs-section]') || closestFromEvent(e, '[data-wjs-section]');
    const sectionId = sectionEl?.dataset?.wjsSection;
    const currentSelected = getSelectedSectionId?.() ?? selectedSectionId;
    if (sectionId && sectionId !== currentSelected) {
      wjsDebug('inline', 'focusin selectSection', sectionId);
      onSelectSection?.(sectionId);
    }

    if (editable && onTextFocus) {
      const rect = editable.getBoundingClientRect();
      const currentColor = editable.style.color
        || doc.defaultView?.getComputedStyle(editable).color
        || '#000000';
      onTextFocus({
        sectionId: editable.dataset.wjsSection,
        field: editable.dataset.wjsField,
        index: editable.dataset.wjsIndex != null ? Number(editable.dataset.wjsIndex) : undefined,
        currentColor: rgbToHex(currentColor),
        element: editable,
        rect,
      });
    }
  };

  const onBlur = (e) => {
    const el = closestFromEvent(e, '.wjs-editable[data-wjs-field]');
    if (!el) return;
    const value = getEditableFieldValue(el);
    const payload = {
      sectionId: el.dataset.wjsSection,
      field: el.dataset.wjsField,
      index: el.dataset.wjsIndex != null ? Number(el.dataset.wjsIndex) : undefined,
      value,
      editType: 'text',
    };
    wjsDebug('inline', 'blur save', payload);
    if (el.dataset.wjsSection === '__header__') {
      onHeaderEdit?.(payload);
    } else {
      onSectionEdit?.(payload);
    }
  };

  const onSectionPickClick = (e) => {
    if (closestFromEvent(e, '.wjs-block-delete, .wjs-deletable-block .wjs-block-delete')) return;
    if (closestFromEvent(e, '.wjs-editable, .wjs-editable-img, .wjs-editable-bg')) return;
    const picker = closestFromEvent(e, '[data-wjs-section-picker]');
    if (!picker) return;
    onSelectSection?.(picker.dataset.wjsSectionPicker);
  };

  const onBlockDeleteClick = (e) => {
    const btn = closestFromEvent(e, '.wjs-block-delete, .wjs-img-delete');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    if (btn.hasAttribute('data-wjs-img-delete')) {
      const wrap = btn.closest('.wjs-editable-img-wrap');
      const img = wrap?.querySelector('img.wjs-editable-img, [data-wjs-type="image"]');
      if (!img) return;
      const sectionId = img.dataset.wjsSection;
      const field = img.dataset.wjsField;
      const index = img.dataset.wjsIndex != null ? Number(img.dataset.wjsIndex) : undefined;
      if (!sectionId || !field) return;
      if (!window.confirm('Xóa ảnh này khỏi giao diện?')) return;
      img.style.display = 'none';
      onSelectSection?.(sectionId);
      if (sectionId === '__header__') {
        onHeaderEdit?.({ field: 'logoImage', value: '', editType: 'clear-image' });
      } else {
        onSectionEdit?.({ sectionId, field, index, value: '', editType: 'clear-image' });
      }
      return;
    }

    const block = btn.closest('.wjs-deletable-block');
    if (!block) return;
    const sectionId = block.dataset.wjsSection;
    const blockKey = block.dataset.wjsBlockKey;
    const index = Number(block.dataset.wjsBlockIndex);
    if (!sectionId || !blockKey || Number.isNaN(index)) return;
    onSelectSection?.(sectionId);
    onBlockDelete?.({ sectionId, blockKey, index });
  };

  const onClick = (e) => {
    if (closestFromEvent(e, '.wjs-block-delete, .wjs-img-delete')) return;
    const bg = closestFromEvent(e, '[data-wjs-type="bg-image"]');
    const img = closestFromEvent(e, '[data-wjs-type="image"]');
    const target = bg || img;
    if (!target) return;
    wjsDebug('inline', 'image click', {
      sectionId: target.dataset.wjsSection,
      field: target.dataset.wjsField,
      targetTag: eventTargetElement(e)?.tagName,
    });
    e.preventDefault();
    e.stopPropagation();
    onSelectSection?.(target.dataset.wjsSection);
    onImageClick?.({
      sectionId: target.dataset.wjsSection,
      field: target.dataset.wjsField,
      index: target.dataset.wjsIndex != null ? Number(target.dataset.wjsIndex) : undefined,
      currentUrl: img?.src || target.style.backgroundImage?.replace(/^url\(["']?|["']?\)$/g, '') || '',
      element: target,
    });
  };

  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('blur', onBlur, true);
  doc.addEventListener('click', onClick, true);
  doc.addEventListener('click', onSectionPickClick);
  doc.addEventListener('click', onBlockDeleteClick, true);

  return () => {
    wjsDebug('inline', 'cleanup setupInlineEditor');
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('blur', onBlur, true);
    doc.removeEventListener('click', onClick, true);
    doc.removeEventListener('click', onSectionPickClick);
    doc.removeEventListener('click', onBlockDeleteClick, true);
    doc.querySelectorAll('.wjs-block-delete').forEach((el) => el.remove());
    doc.querySelectorAll('.wjs-editable-img-wrap').forEach((el) => {
      el.classList.remove('wjs-editable-img-wrap');
    });
    doc.querySelectorAll('.wjs-deletable-block').forEach((el) => {
      el.classList.remove('wjs-deletable-block');
      el.removeAttribute('data-wjs-block-key');
      el.removeAttribute('data-wjs-block-index');
    });
    doc.querySelectorAll('.wjs-img-drop-zone').forEach((el) => {
      el.classList.remove('wjs-img-drop-zone', 'wjs-drop-active');
      el.removeAttribute('data-wjs-drop-bound');
    });
    doc.body?.classList.remove('wjs-external-drag-over');
    doc.querySelectorAll('.wjs-section-picker').forEach((el) => {
      el.classList.remove('wjs-section-picker', 'wjs-section-active-picker');
      el.removeAttribute('data-wjs-section-picker');
    });
    doc.querySelectorAll('.wjs-editable, .wjs-editable-img, .wjs-editable-bg').forEach((el) => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('tabindex');
      el.removeAttribute('data-wjs-section');
      el.removeAttribute('data-wjs-field');
      el.removeAttribute('data-wjs-index');
      el.removeAttribute('data-wjs-type');
      el.classList.remove(
        'wjs-editable', 'wjs-editable-img', 'wjs-editable-bg', 'wjs-section-active',
        'wjs-editable-heading', 'wjs-section-heading',
      );
    });
  };
}

function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  const hex = (n) => Number(n).toString(16).padStart(2, '0');
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

export { htmlToPlain, rgbToHex };
