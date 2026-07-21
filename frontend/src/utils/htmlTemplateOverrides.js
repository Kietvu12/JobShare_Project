import { getTemplatePageRegistry, getTemplatePage } from '../constants/templatePageRegistry';
import { isStoredMediaKey, normalizePostImageUrl } from '../services/api';

/** Resolve đường dẫn ảnh template hoặc media đã upload (S3 / uploads) → URL hiển thị */
export function resolveTemplateAssetUrl(templateFolder, path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const trimmed = path.replace(/^\/+/, '');
  if (
    path.startsWith('/uploads/landing-pages/')
    || isStoredMediaKey(trimmed)
  ) {
    return normalizePostImageUrl(path);
  }
  if (path.startsWith('/api/')) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}${path}`;
  }
  if (path.startsWith('/')) return path;
  return `/template/${templateFolder}/${path.replace(/^\.\//, '')}`;
}

/** Key lưu màu chữ theo field */
export function styleFieldKey(field, index) {
  return index != null && index !== '' ? `${field}@${index}` : field;
}

export function getFieldColor(section, field, index) {
  const styles = section.overrides?.fieldStyles || section.fieldStyles || {};
  return styles[styleFieldKey(field, index)] || styles[field] || '';
}

function applyElementColor(el, section, field, index) {
  const color = getFieldColor(section, field, index);
  if (color && el) el.style.color = color;
}

function textToHtml(text = '') {
  return String(text).replace(/\n/g, '<br>');
}

/** Chuẩn hóa heading từ nhiều format registry (main/sub, en/ja, string) */
export function normalizeHeading(heading) {
  if (!heading) return { main: '', sub: '' };
  if (typeof heading === 'string') return { main: heading, sub: '' };
  return {
    main: heading.main ?? heading.en ?? heading.title ?? '',
    sub: heading.sub ?? heading.ja ?? heading.subtitle ?? '',
    decorImage: heading.decorImage ?? '',
  };
}

function replaceMainTextBefore(el, main, beforeNode) {
  if (main == null) return;
  for (const child of [...el.childNodes]) {
    if (child === beforeNode) break;
    el.removeChild(child);
  }
  el.insertBefore(el.ownerDocument.createTextNode(String(main)), beforeNode);
}

function ensureHeadingMainStyles(doc) {
  if (!doc?.head) return;
  let style = doc.getElementById('wjs-heading-main-style');
  if (style) return;
  style = doc.createElement('style');
  style.id = 'wjs-heading-main-style';
  style.textContent = `
    main h2 span.wjs-heading-main {
      font-size: inherit;
      opacity: 1;
      font-weight: inherit;
      letter-spacing: inherit;
    }
  `;
  doc.head.appendChild(style);
}

function setHeading(el, heading, section = null) {
  if (!el || !heading) return;
  const { main, sub } = normalizeHeading(heading);
  if (main == null && sub == null) return;

  const applyHeadingColors = () => {
    if (!section) return;
    const mainTarget = el.querySelector('span.wjs-heading-main') || el;
    applyElementColor(mainTarget, section, 'heading.main');
    const subTarget = el.querySelector('span.small, span.hosoku')
      || (el.classList.contains('c') ? el.querySelector(':scope > span:not(.wjs-heading-main)') : null);
    if (subTarget) applyElementColor(subTarget, section, 'heading.sub');
  };

  // kaishaintro: h2.c — JP main (text node) + EN trong span
  if (el.classList.contains('c')) {
    const subSpan = el.querySelector(':scope > span:not(.wjs-heading-main)');
    if (subSpan) {
      replaceMainTextBefore(el, main, subSpan);
      if (sub != null) subSpan.textContent = sub;
      applyHeadingColors();
      return;
    }
    const mainOnly = el.querySelector(':scope > span.wjs-heading-main');
    if (mainOnly) {
      if (main != null) mainOnly.innerHTML = textToHtml(main);
      applyHeadingColors();
      return;
    }
  }

  // kaishaintro solutions: h2 có div/img — giữ text node, không bọc span
  const decorBlock = el.querySelector(':scope > div');
  if (decorBlock && !el.classList.contains('c')) {
    if (main != null) replaceMainTextBefore(el, main, decorBlock);
    applyHeadingColors();
    return;
  }

  const mainEl = el.querySelector('span.wjs-heading-main') || el.querySelector('span.fade-in-text');
  const subEl = el.querySelector('span.small, span.hosoku');
  if (mainEl && mainEl !== el && subEl) {
    if (main != null) mainEl.innerHTML = textToHtml(main);
    if (sub != null) subEl.textContent = sub;
    if (section) {
      applyElementColor(mainEl, section, 'heading.main');
      applyElementColor(subEl, section, 'heading.sub');
    }
    return;
  }
  if (mainEl && mainEl !== el && (mainEl.classList.contains('wjs-heading-main') || mainEl.classList.contains('fade-in-text'))) {
    if (main != null) mainEl.innerHTML = textToHtml(main);
    if (subEl && sub != null) subEl.textContent = sub;
    if (section) applyElementColor(mainEl, section, 'heading.main');
    return;
  }
  if (sub) {
    el.innerHTML = `${textToHtml(main || '')}<span class="small">${sub}</span>`;
    if (section) {
      applyElementColor(el, section, 'heading.main');
      const s = el.querySelector('span');
      if (s) applyElementColor(s, section, 'heading.sub');
    }
    return;
  }
  if (main != null) {
    const structural = el.querySelector(':scope > div, :scope > img');
    if (structural) {
      replaceMainTextBefore(el, main, structural);
    } else {
      el.innerHTML = textToHtml(main);
    }
    applyHeadingColors();
  }
}

/** Mảng override đôi khi có lỗ (null) sau inline edit index lệch — chuẩn hóa để UI không crash. */
function denseItemArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => (item && typeof item === 'object' ? item : {}));
}

/** Ưu tiên override có phần tử; mảng rỗng [] không chặn fallback registry/defaultSlides. */
function pickItemArray(overrideArr, ...fallbacks) {
  if (Array.isArray(overrideArr) && overrideArr.length) return overrideArr;
  for (const fb of fallbacks) {
    if (Array.isArray(fb) && fb.length) return fb;
  }
  return [];
}

/** Ảnh hero mặc định — lp_recruite/custom.css */
const RECRUIT_HERO_DEFAULT_IMAGES = [
  { image: 'img/00_01.jpg', position: 'right 20% top 50%' },
  { image: 'img/00_02.jpg', position: 'right 30% top 50%' },
  { image: 'img/00_03.jpg', position: 'right 25% top 50%' },
];

/** Gộp defaults từ registry section + overrides đã lưu */
export function getEffectiveSection(section) {
  if (!section) return {};
  const ov = section.overrides || {};
  let headingSource = {};
  if (typeof section.heading === 'string') headingSource = { main: section.heading };
  else if (section.heading && typeof section.heading === 'object') headingSource = { ...section.heading };
  if (typeof ov.heading === 'string') headingSource = { ...headingSource, main: ov.heading };
  else if (ov.heading && typeof ov.heading === 'object') headingSource = { ...headingSource, ...ov.heading };
  const heading = normalizeHeading(headingSource);
  const registryHeading = normalizeHeading(
    typeof section.heading === 'string' ? { main: section.heading } : section.heading,
  );
  if (!heading.main && registryHeading.main) heading.main = registryHeading.main;
  if (!heading.sub && registryHeading.sub) heading.sub = registryHeading.sub;
  const buttons = ov.buttons ?? section.buttons ?? (
    section.buttonText ? [{ text: section.buttonText, href: section.buttonLink || '#' }] : []
  );
  return {
    ...section,
    heading,
    body: ov.body ?? section.body ?? '',
    slides: denseItemArray(pickItemArray(ov.slides, section.slides, section.defaultSlides)),
    slide: { ...(section.defaultSlide || section.slide || {}), ...(ov.slide || {}) },
    items: denseItemArray(ov.items ?? section.items ?? []),
    steps: denseItemArray(ov.steps ?? section.steps ?? []),
    buttons,
    address: ov.address ?? section.address ?? '',
    phone: ov.phone ?? section.phone ?? '',
    hours: ov.hours ?? section.hours ?? '',
    listLink: ov.listLink ?? section.listLink ?? '',
    image: ov.image ?? section.image ?? '',
    plans: denseItemArray(ov.plans ?? section.plans ?? []),
    rows: denseItemArray(ov.rows ?? section.rows ?? []),
    caption: ov.caption ?? section.caption ?? '',
    moreLink: ov.moreLink ?? section.moreLink ?? null,
    sectionLabel: ov.sectionLabel ?? section.sectionLabel ?? '',
    copyHeadline: ov.copyHeadline ?? section.copyHeadline ?? '',
    copyBody: ov.copyBody ?? section.copyBody ?? '',
    entryTitle: ov.entryTitle ?? section.entryTitle ?? '',
    email: ov.email ?? section.email ?? '',
    phone: ov.phone ?? section.phone ?? '',
    intro: ov.intro ?? section.intro ?? '',
    footnote: ov.footnote ?? section.footnote ?? '',
    fieldStyles: ov.fieldStyles ?? section.fieldStyles ?? {},
  };
}

/** Khởi tạo overrides đầy đủ từ registry (lần đầu tạo / merge) */
export function seedHtmlSectionOverrides(section) {
  const existing = section.overrides || {};
  const seeded = { ...existing };

  const seedIfEmpty = (key, value) => {
    const isEmptyArray = Array.isArray(seeded[key]) && seeded[key].length === 0;
    const shouldSeed = seeded[key] == null || (key === 'slides' && isEmptyArray);
    if (!shouldSeed || value == null) return;
    if (Array.isArray(value)) {
      if (value.length) seeded[key] = JSON.parse(JSON.stringify(value));
    } else if (typeof value === 'object') {
      seeded[key] = { ...value };
    } else {
      seeded[key] = value;
    }
  };

  seedIfEmpty('heading', section.heading);
  seedIfEmpty('body', section.body);
  seedIfEmpty('items', section.items);
  seedIfEmpty('steps', section.steps);
  seedIfEmpty('buttons', section.buttons || (section.buttonText ? [{ text: section.buttonText, href: section.buttonLink }] : undefined));
  seedIfEmpty('slides', section.defaultSlides || section.slides);
  seedIfEmpty('slide', section.defaultSlide || section.slide);
  seedIfEmpty('address', section.address);
  seedIfEmpty('phone', section.phone);
  seedIfEmpty('hours', section.hours);
  seedIfEmpty('listLink', section.listLink);
  seedIfEmpty('image', section.image);
  seedIfEmpty('plans', section.plans);
  seedIfEmpty('rows', section.rows);
  seedIfEmpty('caption', section.caption);
  seedIfEmpty('moreLink', section.moreLink);
  seedIfEmpty('sectionLabel', section.sectionLabel);
  seedIfEmpty('copyHeadline', section.copyHeadline);
  seedIfEmpty('copyBody', section.copyBody);
  seedIfEmpty('entryTitle', section.entryTitle);
  seedIfEmpty('email', section.email);
  seedIfEmpty('intro', section.intro);
  seedIfEmpty('footnote', section.footnote);
  seedIfEmpty('phone', section.phone);

  return { ...section, overrides: seeded };
}

export function seedHtmlPageSections(sections = []) {
  return sections.map(seedHtmlSectionOverrides);
}

function setNodeVisible(el, visible) {
  if (!el) return;
  if (visible) {
    if (el.getAttribute('data-wjs-hidden')) {
      el.style.display = '';
      el.removeAttribute('data-wjs-hidden');
    }
  } else {
    el.style.display = 'none';
    el.setAttribute('data-wjs-hidden', '1');
  }
}

function syncIndexedNodes(nodes, activeCount) {
  nodes.forEach((el, i) => setNodeVisible(el, i < activeCount));
}

function applyHeroSlideshow(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '#mainimg');
  if (!root) return;

  (data.slides || []).forEach((slide, i) => {
    const cls = slide.slideClass || `slide${i + 1}`;
    const el = root.querySelector(`.${cls}`) || root.querySelectorAll('.slide')[i];
    if (!el) return;

    if (slide.imageUrl || slide.image) {
      const url = resolveTemplateAssetUrl(folder, slide.imageUrl || slide.image);
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }

    const h = el.querySelector('h1, h2') || el.querySelector('div h1, div h2');
    if (h && slide.headline != null) h.innerHTML = textToHtml(slide.headline);
    applyElementColor(h, data, 'slides.headline', i);

    const bodyP = el.querySelector('p:not(.btn-border-radius):not(.btn)');
    if (bodyP && slide.body != null) bodyP.innerHTML = textToHtml(slide.body);
    applyElementColor(bodyP, data, 'slides.body', i);

    const cta = el.querySelector('.btn-border-radius a, .btn a, p.btn a');
    if (cta && slide.ctaText != null) cta.textContent = slide.ctaText;
  });
  syncIndexedNodes(root.querySelectorAll('.slide'), (data.slides || []).length);
}

function applyHeroSlide(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '.mainimg');
  if (!root) return;

  const slideEl = root.querySelector(`.slide.${data.slide.slideClass || 'img1'}`)
    || root.querySelector('.slide')
    || root;

  const h2 = slideEl.querySelector('.text h2, h2') || root.querySelector(':scope > .text h1, :scope > .text h2');
  if (h2) {
    const headline = data.slide.headline || '';
    const sub = data.slide.subheadline || data.slide.subtitle || '';
    const lines = headline.split('\n');
    if (h2.tagName === 'H1') {
      h2.innerHTML = textToHtml(headline);
    } else {
      h2.innerHTML = `${lines.join('<br>')}${sub ? `<span>${sub}</span>` : ''}`;
    }
    applyElementColor(h2, data, 'slide.headline');
    const subSpan = h2.querySelector('span');
    if (subSpan) applyElementColor(subSpan, data, 'slide.subheadline');
  } else {
    const textP = slideEl.querySelector('.text > p, .text p');
    if (textP && data.slide.headline != null) {
      textP.innerHTML = textToHtml(data.slide.headline);
      applyElementColor(textP, data, 'slide.headline');
    }
  }

  const textRoot = slideEl.querySelector('.text') || root.querySelector(':scope > .text') || slideEl;

  const bodyP = textRoot.querySelector('p:not(.btn)') || slideEl.querySelector('.text p.mb1rem, .text p');
  if (bodyP && data.slide.body != null && h2) bodyP.innerHTML = textToHtml(data.slide.body);
  if (bodyP && data.slide.body != null && !h2 && data.slide.headline == null) bodyP.innerHTML = textToHtml(data.slide.body);
  if (bodyP && h2) applyElementColor(bodyP, data, 'slide.body');

  const btns = textRoot.querySelectorAll('.btn-container .btn a, .btn-container a, .btn a');
  if (btns[0] && data.slide.ctaPrimary != null) {
    const icon0 = btns[0].querySelector('i');
    const iconCls0 = data.slide.ctaPrimaryIcon || icon0?.className || 'fa-regular fa-envelope';
    btns[0].innerHTML = `<i class="${iconCls0}"></i>${data.slide.ctaPrimary}`;
  }
  if (btns[1] && data.slide.ctaSecondary != null) {
    const icon1 = btns[1].querySelector('i');
    const iconCls1 = data.slide.ctaSecondaryIcon || icon1?.className || 'fa-regular fa-file-lines';
    btns[1].innerHTML = `<i class="${iconCls1}"></i>${data.slide.ctaSecondary}`;
  }
  if (btns[0] && data.slide.ctaPrimaryHref) btns[0].href = data.slide.ctaPrimaryHref;
  if (btns[1] && data.slide.ctaSecondaryHref) btns[1].href = data.slide.ctaSecondaryHref;

  const img = slideEl.querySelector('picture img, img');
  if (img) {
    if (data.slide.imageHidden || data.slide.image === '') {
      img.style.display = 'none';
      const pic = img.closest('picture');
      if (pic) pic.style.display = 'none';
    } else if (data.slide.image || data.slide.imageUrl) {
      img.style.display = '';
      img.src = resolveTemplateAssetUrl(folder, data.slide.image || data.slide.imageUrl);
    }
  }
  const source = slideEl.querySelector('picture source');
  if (source && (data.slide.imageMobile || data.slide.image)) {
    source.srcset = resolveTemplateAssetUrl(folder, data.slide.imageMobile || data.slide.image);
  }
  if (!img && (data.slide.image || data.slide.imageUrl)) {
    const url = resolveTemplateAssetUrl(folder, data.slide.image || data.slide.imageUrl);
    root.style.backgroundImage = `url("${url}")`;
    root.style.backgroundSize = 'cover';
    root.style.backgroundPosition = 'center center';
    root.style.backgroundRepeat = 'no-repeat';
  }
}

/** tp_biz65: text tách khỏi slideshow (.mainimg > .text + .image > .slide) */
function applyHeroBiz65(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '.mainimg');
  if (!root) return;

  const textBox = root.querySelector(':scope > .text');
  const h1 = textBox?.querySelector('h1, h2');
  if (h1 && data.slide?.headline != null) {
    h1.innerHTML = textToHtml(data.slide.headline);
    applyElementColor(h1, data, 'slide.headline');
  }
  const bodyP = textBox?.querySelector('p:not(.btn)');
  if (bodyP && data.slide?.body != null) {
    bodyP.innerHTML = textToHtml(data.slide.body);
    applyElementColor(bodyP, data, 'slide.body');
  }

  const setCta = (link, text, href) => {
    if (!link || text == null) return;
    const svg = link.querySelector('svg');
    const icon = link.querySelector('i');
    link.textContent = text;
    if (svg) link.appendChild(svg);
    if (icon) link.prepend(icon);
    if (href) link.href = href;
  };
  const ctaLinks = textBox?.querySelectorAll('.btn-container .btn a, .btn-container a') || [];
  setCta(ctaLinks[0], data.slide?.ctaPrimary, data.slide?.ctaPrimaryHref);
  setCta(ctaLinks[1], data.slide?.ctaSecondary, data.slide?.ctaSecondaryHref);

  const slides = data.slides?.length ? data.slides : [];
  slides.forEach((slide, i) => {
    const cls = slide.slideClass || `img${i + 1}`;
    const el = root.querySelector(`.image .slide.${cls}`) || root.querySelectorAll('.image .slide')[i];
    if (!el) return;
    const img = el.querySelector('picture img, img');
    if (img && (slide.image || slide.imageUrl)) {
      img.style.display = '';
      img.src = resolveTemplateAssetUrl(folder, slide.image || slide.imageUrl);
    }
    const source = el.querySelector('picture source');
    if (source && (slide.imageMobile || slide.image)) {
      source.srcset = resolveTemplateAssetUrl(folder, slide.imageMobile || slide.image);
    }
  });
  syncIndexedNodes(root.querySelectorAll('.image .slide'), slides.length || root.querySelectorAll('.image .slide').length);
}

function applySectionHeading(doc, section) {
  const data = getEffectiveSection(section);
  if (!data.heading?.main && !data.heading?.sub) return;

  const root = section.selector ? doc.querySelector(section.selector) : null;
  const anchorSec = section.anchor ? doc.getElementById(section.anchor) : null;
  const h = (root?.tagName?.match(/^H[1-6]$/) ? root : null)
    || root?.querySelector('h2, h3')
    || root?.closest('section')?.querySelector('h2, h3')
    || anchorSec?.querySelector('h2, h3');
  setHeading(h, data.heading, data);
}

function applyListGridHeading(doc, section) {
  const data = getEffectiveSection(section);
  if (!data.heading?.main && !data.heading?.sub) return;
  const sec = section.anchor ? doc.getElementById(section.anchor) : doc.querySelector(section.selector)?.closest('section');
  const h2 = sec?.querySelector('h2.bg-slideup');
  if (!h2) return;
  const en = h2.querySelector('.en-text');
  const jp = h2.querySelector('.jp-text');
  if (jp && data.heading.main != null) jp.textContent = data.heading.main;
  if (en && data.heading.sub != null) en.textContent = data.heading.sub;
}

function applyIconList(doc, section, folder) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const sec = root.closest('section') || root.parentElement;
  if (data.heading?.decorImage) {
    const decorImg = sec?.querySelector('h2 > div img');
    if (decorImg) {
      decorImg.src = resolveTemplateAssetUrl(folder, data.heading.decorImage);
    }
  }

  const intro = sec?.querySelector('p.c');
  if (intro && data.intro != null) intro.textContent = data.intro;

  const lists = root.querySelectorAll('.list');
  if (lists.length) {
    (data.items || []).forEach((item, i) => {
      const el = lists[i];
      if (!el) return;
      const faIcon = el.querySelector(':scope > i, h4 i, .text i, .image.icon i, .image i');
      if (faIcon && item.icon) faIcon.className = item.icon;
      const h4 = el.querySelector('h4');
      if (h4 && item.title != null) {
        if (item.titleHtml) h4.innerHTML = item.titleHtml;
        else h4.textContent = item.title;
      }
      const p = el.querySelector('.text-parts p, .text p, p:not(.btn):not(.btn1)');
      if (p && item.body != null) p.textContent = item.body;
      const link = el.querySelector('.btn a, p.btn a, p.btn1 a');
      if (link) {
        if (item.linkText != null) link.textContent = item.linkText;
        if (item.href) link.href = item.href;
      }
      const img = el.querySelector('figure.icon img, figure img');
      if (img && (item.image || item.imageUrl)) {
        img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
        if (item.title) img.alt = item.title;
        img.style.display = '';
      }
    });
    syncIndexedNodes(lists, (data.items || []).length);
    return;
  }

  const h4s = root.querySelectorAll(':scope > h4, h4');
  (data.items || []).forEach((item, i) => {
    const h4 = h4s[i];
    if (!h4) return;
    if (item.title != null) h4.textContent = item.title;
    const p = h4.nextElementSibling?.tagName === 'P' ? h4.nextElementSibling : null;
    if (p && item.body != null) p.textContent = item.body;
  });
}

function applyListGrid(doc, section, folder) {
  applyListGridHeading(doc, section);
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const lists = root.querySelectorAll('.list');
  if (lists.length) {
    (data.items || []).forEach((item, i) => {
      const el = lists[i];
      if (!el) return;
      const h4 = el.querySelector('.text h4, h4');
      if (h4 && item.title != null) h4.textContent = item.title;
      const p = el.querySelector('.text p, .text-parts p, p:not(.btn):not(.btn1)');
      if (p && item.body != null) p.textContent = item.body;
      const link = el.querySelector('.btn a, p.btn a, p.btn1 a');
      if (link) {
        if (item.linkText != null) link.textContent = item.linkText;
        if (item.href) link.href = item.href;
      }
      const img = el.querySelector('figure img, img');
      if (img && (item.image || item.imageUrl)) {
        img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
        if (item.title) img.alt = item.title;
      }
    });
    syncIndexedNodes(lists, (data.items || []).length);
    const moreLink = root.closest('section')?.querySelector('p.btn1 a, .btn1 a');
    if (moreLink && data.moreLink) {
      if (data.moreLink.text != null) moreLink.textContent = data.moreLink.text;
      if (data.moreLink.href) moreLink.href = data.moreLink.href;
    }
    return;
  }

  const blocks = root.querySelectorAll(':scope > div, .grid_2 > div');
  (data.items || []).forEach((item, i) => {
    const el = blocks[i];
    if (!el) return;
    const img = el.querySelector('img');
    const p = el.querySelector('p');
    if (img && (item.image || item.imageUrl)) img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
    if (p && (item.title != null || item.body != null)) p.textContent = item.title || item.body || '';
  });
  syncIndexedNodes(blocks, (data.items || []).length);
}

function applyTextImage(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const h = root.querySelector('h1, h2');
  if (h && (data.heading?.main || data.title)) {
    const main = data.heading?.main || data.title || '';
    const sub = data.heading?.sub || data.subtitle || '';
    if (h.tagName === 'H1') {
      h.innerHTML = textToHtml(main);
    } else {
      h.innerHTML = `${textToHtml(main)}${sub ? `<span>${sub}</span>` : ''}`;
    }
  }

  const body = root.querySelector('p.small, .text > p:not(.btn), .text p, p');
  if (body && data.body != null) body.innerHTML = textToHtml(data.body);

  const singleBtn = root.querySelector('.btn a, .btn-arrow a, p.btn a');
  if (singleBtn && data.buttonText != null) singleBtn.textContent = data.buttonText;
  if (singleBtn && data.buttonLink) singleBtn.href = data.buttonLink;

  const ctaLinks = root.querySelectorAll('.btn-container .btn a, .btn-container a');
  (data.buttons || []).forEach((btn, i) => {
    const link = ctaLinks[i];
    if (!link) return;
    if (btn.text != null) link.textContent = btn.text;
    if (btn.href) link.href = btn.href;
  });

  const img = root.querySelector('.image img, img');
  if (img) {
    if (data.imageHidden || data.image === '') {
      img.style.display = 'none';
    } else if (data.image || data.imageUrl) {
      img.style.display = '';
      img.src = resolveTemplateAssetUrl(folder, data.image || data.imageUrl);
    }
  }
}

function applyTextImageAlternate(doc, section, folder) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const lists = root.querySelectorAll('.list');
  (data.items || []).forEach((item, i) => {
    const el = lists[i];
    if (!el) return;
    const h4 = el.querySelector('h4');
    if (h4 && item.title != null) {
      const sub = item.subtitle ? `<span>${item.subtitle}</span>` : '';
      h4.innerHTML = `${item.title}${sub}`;
    }
    const ps = el.querySelectorAll('.text p');
    if (ps.length && item.body != null) ps[0].innerHTML = textToHtml(item.body);
    const img = el.querySelector('figure img, img');
    if (img && (item.image || item.imageUrl)) {
      img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
    }
  });
  syncIndexedNodes(lists, (data.items || []).length);
}

function applyServiceGrid(doc, section, folder) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const lists = root.querySelectorAll('.list');
  (data.items || []).forEach((item, i) => {
    const el = lists[i];
    if (!el) return;
    const img = el.querySelector('figure img, img');
    if (img && (item.image || item.imageUrl)) img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
    const h4 = el.querySelector('h4');
    if (h4 && item.title != null) {
      h4.innerHTML = `${item.title}${item.subtitle ? `<span>${item.subtitle}</span>` : ''}`;
    }
    const p = el.querySelector('p');
    if (p && item.body != null) p.textContent = item.body;
  });
  syncIndexedNodes(lists, (data.items || []).length);
}

function applyStepList(doc, section) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const sec = root.closest('section') || root.parentElement;
  const intro = sec?.querySelector('p.c');
  if (intro && data.intro != null) intro.textContent = data.intro;
  const footnote = sec?.querySelector('p.c.small, p.small');
  if (footnote && data.footnote != null) footnote.textContent = data.footnote;

  const items = root.querySelectorAll('li, .list, .work_flow_box > div, :scope > div');
  (data.steps || data.items || []).forEach((step, i) => {
    const el = items[i];
    if (!el) return;
    const icon = el.querySelector('.image i, h4 i, h3 i');
    if (icon && step.icon) icon.className = step.icon;
    const h4 = el.querySelector('h4, h3');
    if (h4 && step.title != null) {
      const stepSpan = h4.querySelector('span');
      if (stepSpan) {
        if (step.step != null) stepSpan.textContent = String(step.step).replace(/^Step\s*/i, '');
        const titleText = h4.cloneNode(true);
        titleText.querySelector('span')?.remove();
        const existingTitle = titleText.textContent?.trim();
        if (step.title !== existingTitle) {
          h4.innerHTML = '';
          h4.appendChild(stepSpan);
          h4.append(document.createTextNode(step.title));
        }
      } else {
        h4.textContent = step.title;
      }
    }
    const p = el.querySelector('p');
    if (p && step.body != null) p.textContent = step.body;
    const num = el.querySelector('.num, .step-num, .no');
    if (num && step.step != null) num.textContent = step.step;
  });
  syncIndexedNodes(items, (data.steps || data.items || []).length);
}

function applyFlowBoxes(doc, section) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const boxes = root.querySelectorAll('.flow-box');
  (data.steps || []).forEach((step, i) => {
    const el = boxes[i];
    if (!el) return;
    const stepNum = el.querySelector('.step-num');
    if (stepNum && step.step) stepNum.textContent = step.step;
    const titleH3 = el.querySelector('.title h3');
    if (titleH3 && step.title != null) {
      titleH3.innerHTML = `${step.title}${step.subtitle ? `<span>${step.subtitle}</span>` : ''}`;
    }
    const textH3 = el.querySelector('.text h3');
    if (textH3 && step.lead != null) textH3.textContent = step.lead;
    const p = el.querySelector('.text p');
    if (p && step.body != null) p.textContent = step.body;
  });
  syncIndexedNodes(boxes, (data.steps || []).length);
}

function applyFaq(doc, section) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const dts = root.querySelectorAll('dt');
  (data.items || []).forEach((item, i) => {
    if (dts[i] && item.question != null) dts[i].textContent = item.question;
    const dd = dts[i]?.nextElementSibling;
    if (dd?.tagName === 'DD' && item.answer != null) dd.innerHTML = textToHtml(item.answer);
  });
  dts.forEach((dt, i) => {
    const dd = dt.nextElementSibling?.tagName === 'DD' ? dt.nextElementSibling : null;
    const visible = i < (data.items || []).length;
    setNodeVisible(dt, visible);
    setNodeVisible(dd, visible);
  });
}

function applyTestimonials(doc, section, folder) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const lists = root.querySelectorAll('.list');
  if (lists.length) {
    (data.items || []).forEach((item, i) => {
      const el = lists[i];
      if (!el) return;
      const h4 = el.querySelector('h4');
      if (h4 && item.title != null) h4.textContent = item.title;
      const p = el.querySelector('p.text, .text > p:not(.name)');
      if (p && item.body != null) p.textContent = item.body;
      const name = el.querySelector('p.name, .name');
      if (name && item.name != null) name.textContent = item.name;
      const img = el.querySelector('figure img, img');
      if (img && (item.image || item.imageUrl)) {
        img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
      }
    });
    syncIndexedNodes(lists, (data.items || []).length);
    const moreLink = root.closest('section')?.querySelector('p.btn1 a, .btn1 a');
    if (moreLink && data.moreLink) {
      if (data.moreLink.text != null) moreLink.textContent = data.moreLink.text;
      if (data.moreLink.href) moreLink.href = data.moreLink.href;
    }
    return;
  }

  const voiceBox = root.querySelector('.order1, .people_voice_box > div');
  const item = (data.items || [])[0];
  if (voiceBox && item) {
    const h2 = voiceBox.querySelector('h2');
    const ps = voiceBox.querySelectorAll('p');
    const name = voiceBox.querySelector('.people_voice_name');
    if (h2 && item.title != null) h2.innerHTML = textToHtml(item.title);
    if (ps[0] && item.body != null) ps[0].textContent = item.body;
    if (name && item.name != null) name.innerHTML = item.name.replace(/さん$/, '') + '<span>さん</span>';
    const img = root.querySelector('img');
    if (img && (item.image || item.imageUrl)) img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
  }
}

function applyAnnouncement(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '.new-top');
  if (!root) return;
  const h2 = root.querySelector('h2');
  if (h2 && data.heading) setHeading(h2, data.heading, data);
  const p = root.querySelector('p.text, p');
  if (p && data.body != null) p.textContent = data.body;
  const link = root.querySelector('.new-list a, a');
  if (link && data.listLink) link.href = data.listLink;
}

function applyDualCta(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const blocks = root.querySelectorAll('.list');
  (data.buttons || []).forEach((btn, i) => {
    const block = blocks[i];
    const link = block?.querySelector('a') || root.querySelectorAll('a')[i];
    if (!link) return;
    if (btn.text != null) {
      const icon = link.querySelector('i');
      link.textContent = btn.text;
      if (icon) link.prepend(icon);
    }
    if (btn.href) link.href = btn.href;
    const sub = block?.querySelector('.sub-text, h4 .sub-text');
    const main = block?.querySelector('.main-text, h4 .main-text');
    if (sub && btn.subText != null) sub.textContent = btn.subText;
    if (main && btn.mainText != null) main.textContent = btn.mainText;
  });
}

function applyPricingTable(doc, section) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  const table = root?.querySelector('table.plan, table.ta1.plan, table');
  if (!table) return;

  const plans = data.plans || [];
  const headerRow = table.querySelector('tr');
  if (headerRow && plans.length) {
    const ths = headerRow.querySelectorAll('th');
    plans.forEach((plan, i) => {
      const th = ths[i + 1];
      if (!th) return;
      const icon = th.querySelector('i');
      if (icon && plan.icon) icon.className = plan.icon;
      const nameNode = th.childNodes[0]?.nodeType === 3 ? th.childNodes[0] : th.querySelector('i')?.nextSibling;
      if (plan.name != null) {
        if (icon) {
          th.childNodes.forEach((n) => { if (n.nodeType === 3) n.textContent = plan.name; });
        } else {
          th.innerHTML = `${plan.name}${th.querySelector('span')?.outerHTML || ''}`;
        }
      }
      const priceSpan = th.querySelector('span > span.small, span.small');
      if (priceSpan?.parentElement && plan.price != null) {
        priceSpan.parentElement.innerHTML = `<span class="small">￥</span>${plan.price}`;
      }
      const badge = th.querySelector('.osusume');
      if (badge && plan.badge != null) badge.textContent = plan.badge;
    });
  }

  const rows = table.querySelectorAll('tr');
  (data.rows || []).forEach((row, ri) => {
    const tr = rows[ri + 1];
    if (!tr) return;
    const tds = tr.querySelectorAll('td, th');
    if (tds[0] && row.label != null) tds[0].textContent = row.label;
    (row.values || []).forEach((val, ci) => {
      if (tds[ci + 1] && val != null) tds[ci + 1].textContent = val;
    });
  });
}

function applyCompanyProfile(doc, section) {
  applySectionHeading(doc, section);
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;

  const table = root.matches?.('table') ? root : root.querySelector('table');
  if (data.caption != null && table) {
    const cap = table.querySelector('caption');
    if (cap) cap.textContent = data.caption;
  }

  const trs = root.querySelectorAll('table tr');
  (data.rows || []).forEach((row, i) => {
    const tr = trs[i];
    if (!tr) return;
    const th = tr.querySelector('th');
    const td = tr.querySelector('td');
    if (th && row.label != null) th.textContent = row.label;
    if (td && row.value != null) td.innerHTML = textToHtml(row.value);
  });
  trs.forEach((tr, i) => setNodeVisible(tr, i < (data.rows || []).length));
}

function applyThumbnailMarquee(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = section.selector
    ? doc.querySelector(section.selector)
    : doc.querySelector('section.padding-lr0');
  if (!root) return;
  const imgs = root.querySelectorAll('img');
  (data.items || []).forEach((item, i) => {
    const img = imgs[i];
    if (!img || (!item.image && !item.imageUrl)) return;
    img.src = resolveTemplateAssetUrl(folder, item.image || item.imageUrl);
  });
}

function applyRecruitHero(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '.slide_hero');
  if (!root) return;
  const slide = data.slide || {};
  const box = root.querySelector('.slide_hero_catchcopy');
  const h2 = box?.querySelector('h2');
  const h3 = box?.querySelector('h3');
  const p = box?.querySelector('p');
  if (h2 && slide.headline != null) h2.innerHTML = textToHtml(slide.headline);
  if (h3 && slide.subheadline != null) h3.innerHTML = textToHtml(slide.subheadline);
  if (p && slide.body != null) p.innerHTML = textToHtml(slide.body);

  const slides = data.slides || [];
  const imgEls = root.querySelectorAll('.slide_hero_img');
  imgEls.forEach((el, i) => {
    const item = slides[i] || {};
    const fallback = RECRUIT_HERO_DEFAULT_IMAGES[i];
    const raw = item.image || item.imageUrl || fallback?.image;
    if (!raw) return;
    const url = resolveTemplateAssetUrl(folder, raw);
    if (!url) return;
    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = fallback?.position || 'center';
    el.style.backgroundRepeat = 'no-repeat';
  });
}

function applyRecruitPage(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector) || (section.anchor ? doc.getElementById(section.anchor) : null);
  if (!root) return;
  const h3 = root.querySelector('.title_box h3');
  const h2 = root.querySelector('.title_box h2');
  if (h3 && data.sectionLabel != null) h3.textContent = data.sectionLabel;
  if (h2 && (data.heading?.main || data.heading?.sub)) {
    const sub = data.heading.sub ? `<span>${data.heading.sub}</span>` : '';
    h2.innerHTML = `${data.heading.main || ''}${sub}`;
  }
  const copyH2 = root.querySelector('.copy h2');
  const copyP = root.querySelector('.copy p');
  if (copyH2 && data.copyHeadline != null) copyH2.textContent = data.copyHeadline;
  if (copyP && data.copyBody != null) copyP.innerHTML = textToHtml(data.copyBody);
  const eyeCatch = root.querySelector('.eye_catch');
  if (eyeCatch && (data.image || data.imageUrl)) {
    const url = resolveTemplateAssetUrl(folder, data.image || data.imageUrl);
    eyeCatch.style.backgroundImage = `url("${url}")`;
    eyeCatch.style.backgroundSize = 'cover';
    eyeCatch.style.backgroundPosition = eyeCatch.style.backgroundPosition || 'center';
    eyeCatch.style.backgroundRepeat = 'no-repeat';
  }
}

function applyRecruitNews(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '.news_block');
  const ps = root?.querySelectorAll('.news_box p');
  if (ps?.[0] && data.heading?.main != null) ps[0].textContent = data.heading.main;
  if (ps?.[1] && data.body != null) ps[1].textContent = data.body;
}

function applyRecruitStats(doc, section, folder) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const items = root.querySelectorAll('.data_box > div, :scope > div');
  (data.items || []).forEach((item, i) => {
    const el = items[i];
    if (!el) return;
    const h4 = el.querySelector('h4');
    const p = el.querySelector('p.count, p');
    const unit = el.querySelector('span');
    const img = el.querySelector('img');
    if (h4 && item.title != null) h4.textContent = item.title;
    if (p && item.value != null) {
      p.textContent = item.value;
      if (item.valueTarget != null) p.setAttribute('data-target', String(item.valueTarget));
    }
    if (unit && item.unit != null) unit.textContent = item.unit;
    if (img && item.image) img.src = resolveTemplateAssetUrl(folder, item.image);
  });
  syncIndexedNodes(items, (data.items || []).length);
}

function applyRecruitQA(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const h4s = root.querySelectorAll('h4');
  (data.items || []).forEach((item, i) => {
    const h4 = h4s[i];
    if (!h4) return;
    if (item.question != null) h4.textContent = item.question;
    const p = h4.nextElementSibling?.tagName === 'P' ? h4.nextElementSibling : null;
    if (p && item.answer != null) p.innerHTML = textToHtml(item.answer);
  });
}

function applyRecruitTimeline(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const rows = root.querySelectorAll('tr');
  (data.items || []).forEach((item, i) => {
    const tr = rows[i];
    if (!tr) return;
    const th = tr.querySelector('th h4, th');
    const tdTitle = tr.querySelector('td h4');
    const tdP = tr.querySelector('td p');
    if (th && item.time != null) th.textContent = item.time;
    if (tdTitle && item.title != null) tdTitle.textContent = item.title;
    if (tdP && item.body != null) tdP.innerHTML = textToHtml(item.body);
  });
  syncIndexedNodes(rows, (data.items || []).length);
}

function applyRecruitEntry(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '#entry');
  if (!root) return;
  const h2 = root.querySelector('h2');
  const h3 = root.querySelector('.entry_box h3');
  const p = root.querySelector('.entry_box > p');
  if (h2 && data.entryTitle != null) h2.textContent = data.entryTitle;
  if (h3 && data.heading?.main != null) h3.textContent = data.heading.main;
  if (p && data.body != null) p.innerHTML = textToHtml(data.body);
  const links = root.querySelectorAll('.entry_link a');
  (data.buttons || []).forEach((btn, i) => {
    const a = links[i];
    if (!a) return;
    const arrow = a.querySelector('span.anime_updown');
    const desc = a.querySelector('p');
    if (btn.label != null) {
      const textNode = [...a.childNodes].find((n) => n.nodeType === 3);
      if (textNode) textNode.textContent = btn.label;
      else if (arrow) arrow.after(document.createTextNode(btn.label));
    }
    if (desc && btn.description != null) desc.textContent = btn.description;
    if (btn.href) a.href = btn.href;
  });
  const email = root.querySelector('.entry_email');
  const tel = root.querySelector('.entry_tel');
  if (email && data.email != null) email.innerHTML = data.email;
  if (tel && data.phone != null) tel.innerHTML = data.phone;
}

function applyCtaBanner(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const h2 = root.querySelector('h2');
  if (h2 && data.heading?.main) h2.textContent = data.heading.main;
  const p = root.querySelector('p');
  if (p && data.body) p.textContent = data.body;
  const link = root.querySelector('.btn a, a');
  const btn = data.buttons?.[0];
  if (link && btn) {
    if (btn.text != null) link.textContent = btn.text;
    if (btn.href) link.href = btn.href;
  }
}

function applyNewsList(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector);
  if (!root) return;
  const sec = root.closest('section');
  const h2 = sec?.querySelector('h2') || root.previousElementSibling;
  if (h2?.tagName === 'H2' && data.heading) setHeading(h2, data.heading, data);

  const dts = root.querySelectorAll('dt');
  (data.items || []).forEach((item, i) => {
    if (!dts[i]) return;
    const tag = dts[i].querySelector('span');
    const dateText = item.date || '';
    if (tag) {
      dts[i].childNodes[0].textContent = dateText;
      if (item.tag != null) tag.textContent = item.tag;
      if (item.tagClass) tag.className = item.tagClass;
    } else {
      dts[i].textContent = dateText;
    }
    const dd = dts[i].nextElementSibling;
    if (dd?.tagName === 'DD' && item.body != null) dd.innerHTML = textToHtml(item.body);
  });
  dts.forEach((dt, i) => {
    const dd = dt.nextElementSibling?.tagName === 'DD' ? dt.nextElementSibling : null;
    const visible = i < (data.items || []).length;
    setNodeVisible(dt, visible);
    setNodeVisible(dd, visible);
  });
}

function applyFooterAccess(doc, section) {
  const data = getEffectiveSection(section);
  const root = doc.querySelector(section.selector || '#footer');
  if (!root) return;

  const footer1 = root.querySelector('.footer1');
  if (footer1) {
    const ps = footer1.querySelectorAll('p');
    if (ps[1] && data.address) {
      const lines = [data.address, data.phone ? `代表電話：${data.phone}` : '', data.hours || ''].filter(Boolean);
      ps[1].innerHTML = lines.join('<br>');
    }
  }
}

function applySectionToDom(doc, section, templateFolder) {
  if (section.visible === false) {
    hideSectionInDom(doc, section);
    return;
  }
  showSectionInDom(doc, section);

  switch (section.type) {
    case 'hero_slideshow':
      applyHeroSlideshow(doc, section, templateFolder);
      break;
    case 'hero_slide':
      applyHeroSlide(doc, section, templateFolder);
      break;
    case 'hero_biz65':
      applyHeroBiz65(doc, section, templateFolder);
      break;
    case 'icon_list':
      applyIconList(doc, section, templateFolder);
      break;
    case 'list_grid':
      applyListGrid(doc, section, templateFolder);
      break;
    case 'text_image':
      applyTextImage(doc, section, templateFolder);
      break;
    case 'text_image_alternate':
      applyTextImageAlternate(doc, section, templateFolder);
      break;
    case 'service_grid':
      applyServiceGrid(doc, section, templateFolder);
      break;
    case 'step_list':
      applyStepList(doc, section);
      break;
    case 'flow_boxes':
      applyFlowBoxes(doc, section);
      break;
    case 'faq_accordion':
      applyFaq(doc, section);
      break;
    case 'testimonials_scroll':
    case 'testimonials_carousel':
      applyTestimonials(doc, section, templateFolder);
      break;
    case 'announcement_bar':
      applyAnnouncement(doc, section);
      break;
    case 'dual_cta':
    case 'contact_cta':
      applyDualCta(doc, section);
      break;
    case 'cta_banner':
      applyCtaBanner(doc, section);
      break;
    case 'news_list':
      applyNewsList(doc, section);
      break;
    case 'pricing_table':
      applyPricingTable(doc, section);
      break;
    case 'company_profile':
      applyCompanyProfile(doc, section);
      break;
    case 'recruit_hero':
      applyRecruitHero(doc, section, templateFolder);
      break;
    case 'recruit_page':
      applyRecruitPage(doc, section, templateFolder);
      break;
    case 'recruit_news':
      applyRecruitNews(doc, section);
      break;
    case 'recruit_stats':
      applyRecruitStats(doc, section, templateFolder);
      break;
    case 'recruit_qa':
      applyRecruitQA(doc, section);
      break;
    case 'recruit_timeline':
      applyRecruitTimeline(doc, section);
      break;
    case 'recruit_entry':
      applyRecruitEntry(doc, section);
      break;
    case 'footer_access':
    case 'access_map':
      applyFooterAccess(doc, section);
      break;
    case 'thumbnail_marquee':
      applyThumbnailMarquee(doc, section, templateFolder);
      break;
    default:
      break;
  }
}

export function applyGlobalHtmlOverrides(doc, templateFolder, globals = {}) {
  const {
    companyName,
    announcement,
    theme,
    globalNav,
    pages,
    currentTemplatePageId,
    logoText,
    sharedBlocks,
  } = globals;

  const header = sharedBlocks?.header || {};
  const logoSel = header.logoSelector || '#logo a, h1.logo a, h1#logo a';
  const logoEl = doc.querySelector(logoSel);
  const displayName = logoText || companyName;

  if (displayName && logoEl) {
    const h1Company = logoEl.querySelector('h1.company_name') || doc.querySelector('h1.company_name');
    if (h1Company) {
      const subText = sharedBlocks?.logoSubtext || h1Company.querySelector('span')?.textContent || 'RECRUIT SITE';
      h1Company.innerHTML = `${displayName}<span>${subText}</span>`;
    } else if (logoEl.querySelector('img')) {
      logoEl.querySelector('img').alt = displayName;
    } else {
      logoEl.textContent = displayName;
    }
  }

  const logoHidden = globals.sharedBlocks?.logoHidden || globals.logoHidden;
  if (logoHidden) {
    doc.querySelectorAll('#logo img, h1.logo img, .logo img, h1#logo img').forEach((img) => {
      img.style.display = 'none';
    });
  } else {
    const logoImage = sharedBlocks?.logoImage;
    if (logoImage) {
      const logoUrl = resolveTemplateAssetUrl(templateFolder, logoImage);
      doc.querySelectorAll('#logo img, h1.logo img, .logo img, h1#logo img').forEach((img) => {
        img.src = logoUrl;
        img.style.display = '';
      });
    }
  }

  if (companyName) {
    doc.querySelectorAll('#logo img, h1.logo img, .logo img, h1#logo img').forEach((img) => {
      img.alt = companyName;
    });
    doc.querySelectorAll('footer small, footer .copyright').forEach((el) => {
      if (el.textContent.includes('Copyright')) {
        const templateLink = el.querySelector('a[href*="saiyodesign"]');
        const suffix = templateLink ? templateLink.outerHTML : '';
        el.innerHTML = `Copyright ©${companyName}. All Rights Reserved. ${suffix}`.trim();
      }
    });
  }

  if (globalNav?.length && pages?.length) {
    applyTemplateNav(doc, globalNav, pages, {
      currentTemplatePageId,
      header,
      registryNav: globals.registryNav || [],
    });
  }

  if (announcement) {
    const bar = doc.querySelector('.new-top p.text');
    if (bar) bar.textContent = announcement;
  }

  if (theme?.primaryColor) {
    let style = doc.getElementById('wjs-theme-override');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'wjs-theme-override';
      doc.head.appendChild(style);
    }
    if (String(templateFolder || '').includes('lp_recruite')) {
      style.textContent = `:root {
        --key_color_text: ${theme.primaryColor};
        --key_color_back: ${theme.primaryColor};
      }`;
    } else {
      style.textContent = `:root { --primary-color: ${theme.primaryColor}; }
      a, .btn a { color: ${theme.primaryColor}; }`;
    }
  }
}

function hideSectionInDom(doc, section) {
  const nodes = getSectionDomNodes(doc, section);
  nodes.forEach((el) => {
    el.style.display = 'none';
    el.setAttribute('data-wjs-hidden', '1');
  });
}

function showSectionInDom(doc, section) {
  const nodes = getSectionDomNodes(doc, section);
  nodes.forEach((el) => {
    if (el.getAttribute('data-wjs-hidden')) {
      el.style.display = '';
      el.removeAttribute('data-wjs-hidden');
    }
  });
}

function getSectionDomNodes(doc, section) {
  if (!section?.selector && !section?.anchor) return [];
  const root = section.selector ? doc.querySelector(section.selector) : null;
  const anchor = section.anchor ? doc.getElementById(section.anchor) : null;
  const block = (root?.closest('section') || anchor?.closest('section') || anchor || root);
  return block ? [block] : [];
}

function applySectionVisualOrder(doc, sections = []) {
  const visible = sections.filter((s) => s.visible !== false && !s.decorative);
  visible.forEach((section, order) => {
    getSectionDomNodes(doc, section).forEach((el) => {
      const parent = el.parentElement;
      if (parent) {
        parent.style.display = parent.style.display || '';
        if (!parent.style.flexDirection && parent.tagName === 'MAIN') {
          parent.style.display = 'flex';
          parent.style.flexDirection = 'column';
        }
      }
      el.style.order = String(order);
    });
  });
}

/** lp_recruite: fade_in / curtain cần .show từ JS gốc — trong iframe builder scroll không chạy hết */
export function applyRecruitPreviewFixes(doc, { builderPreview = false } = {}) {
  if (!doc?.head) return;

  const main = doc.querySelector('main.container, main');
  if (main) {
    main.style.removeProperty('display');
    main.style.removeProperty('flex-direction');
    main.querySelectorAll('[style*="order"]').forEach((el) => {
      el.style.removeProperty('order');
    });
  }

  const builderCss = builderPreview ? `
    html, body {
      overflow-x: hidden !important;
    }
    .slide_hero {
      height: clamp(480px, 56vw, 680px) !important;
    }
    section.page_block,
    .page_box {
      overflow: visible !important;
    }
    .page_box .eye_catch,
    .page_box h3 {
      margin-right: 0 !important;
      padding-right: 0 !important;
    }
    .page_box h3 {
      z-index: 0 !important;
    }
    .page_box .copy {
      position: relative;
      z-index: 1;
    }
  ` : '';

  let style = doc.getElementById('wjs-recruit-preview-fix');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'wjs-recruit-preview-fix';
    doc.head.appendChild(style);
  }
  style.textContent = `
    ${builderCss}
    .slide_hero_img {
      z-index: 0 !important;
      animation: none !important;
      opacity: 0 !important;
      transform: none !important;
    }
    .slide_hero_img:nth-child(2) {
      opacity: 1 !important;
      z-index: 0 !important;
    }
    .slide_hero_box {
      z-index: 1 !important;
      position: relative;
      pointer-events: none;
      background: transparent !important;
    }
    .slide_hero_catchcopy {
      pointer-events: auto;
      z-index: 3;
    }
    .slide_hero_catchcopy h2,
    .slide_hero_catchcopy h3,
    .slide_hero_catchcopy p {
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      color: #fff !important;
    }
    .slide_hero_catchcopy .wjs-editable.wjs-editable-heading {
      display: revert;
    }
    .slide_hero_catchcopy h2.wjs-editable {
      display: inline-block !important;
    }
    .slide_hero_catchcopy .wjs-editable:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    .fade_in.curtain {
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      z-index: 0 !important;
    }
    .fade_in.curtain:before {
      display: none !important;
    }
    .fade_in.up:not(.count),
    .fade_in.right:not(.count),
    .fade_in.default {
      opacity: 1 !important;
      transform: none !important;
    }
    .slide_hero_catchcopy .fade_in.right {
      opacity: 1 !important;
      transform: none !important;
    }
  `;
  doc.querySelectorAll('.fade_in').forEach((el) => {
    el.classList.add('show');
  });
  try {
    doc.defaultView?.dispatchEvent?.(new Event('scroll'));
  } catch {
    // ignore
  }
}

/** Public: bỏ animation inview (opacity 0) — scroll trang ngoài không kích hoạt inview trong iframe */
export function applyPublicViewFixes(doc) {
  if (!doc?.head) return;
  let style = doc.getElementById('wjs-public-fix');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'wjs-public-fix';
    doc.head.appendChild(style);
  }
  style.textContent = `
    .up, .down, .blur, .transform1, .transform2, .transform3,
    .upstyle, .downstyle, .blurstyle, .transform1style, .transform2style, .transform3style {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      bottom: 0 !important;
      top: 0 !important;
    }
    .inview { opacity: 1 !important; }
  `;
  const fx = ['up', 'down', 'transform1', 'transform2', 'transform3', 'blur'];
  fx.forEach((name) => {
    doc.querySelectorAll(`.${name}`).forEach((el) => {
      el.classList.add(`${name}style`);
      el.style.opacity = '1';
    });
  });
}

/** Cập nhật thẻ title/description trong HTML gốc (SEO trong iframe preview) */
export function applyDocumentMeta(doc, { title, description } = {}) {
  if (!doc) return;
  if (title) {
    const t = doc.querySelector('title');
    if (t) t.textContent = title;
  }
  if (description != null) {
    let meta = doc.querySelector('meta[name="description"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.setAttribute('name', 'description');
      doc.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }
}

export function applyTemplateNav(doc, globalNav = [], pages = [], { currentTemplatePageId, header = {}, registryNav = [] } = {}) {
  const navSelectors = [
    header.navSelector,
    'header nav > ul',
    '#menubar nav > ul',
  ].filter(Boolean);

  const uls = [];
  navSelectors.forEach((sel) => {
    const el = doc.querySelector(sel);
    if (el && !uls.includes(el)) uls.push(el);
  });
  if (!uls.length) return;

  const homePage = pages.find((p) => p.isHome) || pages[0];
  const currentTpl = currentTemplatePageId || homePage?.templatePageId || 'index';

  const buildItems = () => globalNav.map((navItem) => {
    const tplPageId = navItem.templatePageId || navItem.pageId;
    const page = pages.find((p) => p.id === navItem.pageId)
      || pages.find((p) => p.templatePageId === tplPageId);
    if (!page) return null;

    const regNav = registryNav.find((n) => n.pageId === page.templatePageId || n.pageId === tplPageId);
    const anchor = navItem.anchor || regNav?.anchor;
    const label = navItem.label || page.title || 'Page';

    let href = '#';
    if (page.templatePageId === currentTpl) {
      href = anchor ? `#${anchor}` : (page.isHome ? '#' : '#top');
    } else {
      const file = page.sourceFile || `${page.templatePageId}.html`;
      href = anchor ? `${file}#${anchor}` : file;
    }

    return { label, href };
  }).filter(Boolean);

  const items = buildItems();
  uls.forEach((ul) => {
    ul.innerHTML = '';
    items.forEach(({ label, href }) => {
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.textContent = label;
      a.href = href;
      li.appendChild(a);
      ul.appendChild(li);
    });
  });
}

/**
 * Inject nội dung đã chỉnh vào document iframe HTML gốc.
 */
export function applyHtmlTemplateOverrides(doc, {
  templateKey,
  sections = [],
  globals = {},
  publicView = false,
  applyVisualOrder = true,
  documentMeta = null,
  builderPreview = false,
}) {
  if (!doc) return;
  ensureHeadingMainStyles(doc);
  const reg = getTemplatePageRegistry(templateKey);
  const folder = reg?.folder || templateKey;

  applyGlobalHtmlOverrides(doc, folder, {
    ...globals,
    registryNav: getTemplatePageRegistry(templateKey)?.nav || [],
  });

  sections.forEach((section) => {
    applySectionToDom(doc, getEffectiveSection(section), folder);
  });

  /* lp_recruite dùng grid page_block — flex+order trên <main> làm vỡ bố cục 2 cột */
  const skipVisualOrder = reg?.layout === 'recruit';
  if (applyVisualOrder && !skipVisualOrder) {
    applySectionVisualOrder(doc, sections);
  }

  if (reg?.layout === 'recruit') {
    applyRecruitPreviewFixes(doc, { builderPreview });
  }

  if (documentMeta) {
    applyDocumentMeta(doc, documentMeta);
  }

  if (publicView || builderPreview) {
    applyPublicViewFixes(doc);
  }
}

/** Resolve ref: 'sharedBlocks.hero' → dữ liệu block đầy đủ */
export function resolveSectionRef(section, templateKey) {
  if (!section?.ref) return section;
  const reg = getTemplatePageRegistry(templateKey);
  if (!reg) return section;
  const val = section.ref.split('.').reduce((obj, key) => obj?.[key], reg);
  if (!val) return section;
  return {
    ...val,
    ...section,
    id: section.id,
    label: section.label || val.label,
    type: section.type || val.type,
  };
}

/** Gộp section registry + dữ liệu đã lưu (builder / public) */
export function mergePageSections(page, templateKey) {
  const regPage = getTemplatePage(templateKey, page?.templatePageId);
  if (!regPage) return page?.sections || [];

  const regSections = regPage.sections || [];
  const savedSections = page.sections || [];
  const savedById = Object.fromEntries(savedSections.map((s) => [s.id, s]));
  const regIds = new Set(regSections.map((s) => s.id));

  const mergeOne = (saved, regSec) => seedHtmlSectionOverrides(resolveSectionRef({
    ...regSec,
    ...(saved || {}),
    id: regSec.id,
    type: (saved?.type === 'hero_slide' && regSec.type && regSec.type !== 'hero_slide')
      ? regSec.type
      : (saved?.type === 'hero_biz65' && regSec.type && regSec.type !== 'hero_biz65')
        ? regSec.type
        : (saved?.type || regSec.type),
    label: saved?.label || regSec.label,
    visible: saved?.visible ?? true,
    overrides: {
      ...(regSec.overrides || {}),
      ...(saved?.overrides || {}),
    },
  }, templateKey));

  const isPartialSave = savedSections.length > 0
    && savedSections.length < regSections.length
    && savedSections.every((s) => regIds.has(s.id));

  if (isPartialSave || savedSections.length === 0) {
    const merged = regSections.map((regSec) => mergeOne(savedById[regSec.id], regSec));
    const extras = savedSections.filter((s) => !regIds.has(s.id));
    extras.forEach((saved) => {
      const proto = regSections.find((s) => s.type === saved.type);
      merged.push(mergeOne(saved, proto || saved));
    });
    return merged;
  }

  return savedSections.map((saved) => {
    const regSec = regSections.find((s) => s.id === saved.id)
      || regSections.find((s) => s.type === saved.type);
    return mergeOne(saved, regSec || saved);
  });
}

/** Gộp registry sections + overrides đã lưu khi load builder / public */
export function mergeHtmlTemplateContent(content) {
  const templateKey = content.templateKey;
  const mergedPages = (content.pages || []).map((page) => {
    const regPage = getTemplatePage(templateKey, page.templatePageId);
    if (!regPage) return page;

    return {
      ...page,
      sourceFile: page.sourceFile || regPage.file,
      title: page.title || regPage.title,
      layout: page.layout || regPage.layout,
      sections: mergePageSections(page, templateKey),
    };
  });
  return { ...content, pages: mergedPages };
}
