/**
 * Gắn sự kiện điều hướng trong iframe preview (builder).
 * - #anchor → scroll tới section
 * - contact.html / index.html → chuyển trang builder
 */
export function wirePreviewNavigation(doc, {
  editable = false,
  pages = [],
  sections = [],
  onNavigatePage,
  onScrollToSection,
} = {}) {
  if (!doc) return () => {};

  const anchorToSectionId = {};
  sections.forEach((s) => {
    if (s.anchor) anchorToSectionId[s.anchor] = s.id;
  });

  const findPageByHref = (href) => {
    const raw = (href || '').split('#')[0].replace(/^\.\//, '');
    if (!raw || raw === 'index.html') {
      return pages.find((p) => p.isHome) || pages.find((p) => p.templatePageId === 'index');
    }
    return pages.find((p) => p.sourceFile === raw)
      || pages.find((p) => `${p.templatePageId}.html` === raw)
      || pages.find((p) => p.templatePageId === raw.replace('.html', ''));
  };

  const scrollToAnchor = (anchorId) => {
    if (!anchorId) return;
    const sectionId = anchorToSectionId[anchorId];
    const target = doc.getElementById(anchorId)
      || (sectionId ? doc.querySelector(`[data-wjs-section-picker="${sectionId}"]`) : null);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (sectionId) onScrollToSection?.(sectionId);
    }
  };

  const handlers = [];

  doc.querySelectorAll('a[href]').forEach((a) => {
    const handler = (e) => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href) return;

      if (editable && a.closest('[data-wjs-field]')) return;

      if (href.startsWith('#')) {
        e.preventDefault();
        scrollToAnchor(href.slice(1));
        return;
      }

      const hashIdx = href.indexOf('#');
      const filePart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      const anchorPart = hashIdx >= 0 ? href.slice(hashIdx + 1) : '';

      if (filePart.endsWith('.html') || filePart === 'index.html') {
        e.preventDefault();
        const page = findPageByHref(filePart || 'index.html');
        if (page) {
          onNavigatePage?.({
            pageId: page.id,
            templatePageId: page.templatePageId,
            anchor: anchorPart || null,
          });
        }
        return;
      }

      if (editable && (href.startsWith('http') || href === '#')) {
        e.preventDefault();
      }
    };

    a.addEventListener('click', handler);
    handlers.push({ a, handler });
  });

  return () => {
    handlers.forEach(({ a, handler }) => a.removeEventListener('click', handler));
  };
}
