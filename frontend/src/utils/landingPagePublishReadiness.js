/** Phát hiện nội dung mẫu / chưa hoàn thiện trước khi publish landing page Free */

const TEXT_SAMPLE_PATTERNS = [
  { id: 'lorem', re: /lorem\s+ipsum/i },
  { id: 'sampleCompany', re: /SAMPLE COMPANY/i },
  { id: 'sampleJa', re: /サンプル(?:テキスト|カンパニー)/ },
  { id: 'placeholderJaQuestion', re: /ここに質問を書きます/ },
  { id: 'placeholderJaAnswer', re: /ここに回答を書きます/ },
  { id: 'placeholderJaBody', re: /ここに説明など入れて下さい/ },
  { id: 'placeholderDate', re: /2000\/00\/00/ },
  { id: 'placeholderHeading', re: /^見出し$/m },
];

const DEMO_IMAGE_PATTERNS = [
  /\/template\//i,
  /(^|["'])images\/(?:mainimg|logo|photo|sample)/i,
  /placeholder\.(jpg|png|webp)/i,
  /picsum\.photos/i,
  /placehold\.co/i,
  /via\.placeholder\.com/i,
];

function issueKey(pageId, sectionId, type) {
  return `${pageId || ''}:${sectionId || ''}:${type}`;
}

function scanTextBlob(blob, meta, issues, seen) {
  if (!blob || typeof blob !== 'string') return;
  TEXT_SAMPLE_PATTERNS.forEach((p) => {
    if (!p.re.test(blob)) return;
    const key = issueKey(meta.pageId, meta.sectionId, p.id);
    if (seen.has(key)) return;
    seen.add(key);
    issues.push({
      type: p.id,
      pageId: meta.pageId,
      pageTitle: meta.pageTitle,
      sectionId: meta.sectionId,
      sectionLabel: meta.sectionLabel,
    });
  });
  DEMO_IMAGE_PATTERNS.forEach((re) => {
    if (!re.test(blob)) return;
    const key = issueKey(meta.pageId, meta.sectionId, 'demoImage');
    if (seen.has(key)) return;
    seen.add(key);
    issues.push({
      type: 'demoImage',
      pageId: meta.pageId,
      pageTitle: meta.pageTitle,
      sectionId: meta.sectionId,
      sectionLabel: meta.sectionLabel,
    });
  });
}

function scanReactSectionProps(section, meta, issues, seen) {
  const p = section.props || {};
  if (section.type === 'hero') {
    if (!String(p.headline || '').trim()) {
      const key = issueKey(meta.pageId, section.id, 'emptyHeroHeadline');
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({ type: 'emptyField', ...meta, sectionId: section.id, sectionLabel: meta.sectionLabel, field: 'headline' });
      }
    }
  }
  if (section.type === 'form' && !String(p.title || '').trim()) {
    const key = issueKey(meta.pageId, section.id, 'emptyFormTitle');
    if (!seen.has(key)) {
      seen.add(key);
      issues.push({ type: 'emptyField', ...meta, sectionId: section.id, sectionLabel: meta.sectionLabel, field: 'title' });
    }
  }
}

/**
 * @returns {{ issues: Array<{ type: string, pageTitle?: string, sectionLabel?: string, sectionId?: string }>, sectionIds: Set<string> }}
 */
export function scanLandingPagePublishReadiness(content, { pageTitle: landingTitle } = {}) {
  const issues = [];
  const seen = new Set();

  if (!content || typeof content !== 'object') {
    return { issues, sectionIds: new Set() };
  }

  const companyNames = [
    content.companyName,
    content.sharedBlocks?.companyName,
    content.sharedBlocks?.logoText,
  ].filter(Boolean);

  companyNames.forEach((name) => {
    if (/SAMPLE COMPANY/i.test(String(name))) {
      const key = issueKey('', '', 'sampleCompanyGlobal');
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({
          type: 'sampleCompany',
          pageTitle: landingTitle || 'Trang',
          sectionLabel: 'Tên công ty / Logo',
          sectionId: null,
        });
      }
    }
  });

  if (!String(landingTitle || '').trim()) {
    const key = issueKey('', '', 'emptyLandingTitle');
    if (!seen.has(key)) {
      seen.add(key);
      issues.push({
        type: 'emptyField',
        pageTitle: 'Trang',
        sectionLabel: 'Tiêu đề landing page',
        sectionId: null,
        field: 'title',
      });
    }
  }

  const pages = Array.isArray(content.pages) ? content.pages : [];
  pages.forEach((page) => {
    const pageTitle = page.title || page.slug || 'Trang';
    const pageId = page.id;
    (page.sections || []).forEach((section) => {
      if (section.visible === false || section.decorative) return;
      const sectionLabel = section.label || section.type || section.id || 'Section';
      const meta = { pageId, pageTitle, sectionId: section.id, sectionLabel };
      const blob = JSON.stringify(section.overrides ?? section.props ?? section);
      scanTextBlob(blob, meta, issues, seen);
      if (section.props && !section.overrides) {
        scanReactSectionProps(section, meta, issues, seen);
      }
    });
  });

  // Legacy editor shape (hero + sections object)
  if (content.hero) {
    const blob = JSON.stringify(content.hero);
    scanTextBlob(blob, { pageTitle: landingTitle || 'Trang', sectionLabel: 'Hero', sectionId: '__legacy_hero__' }, issues, seen);
  }
  if (content.sections) {
    const blob = JSON.stringify(content.sections);
    scanTextBlob(blob, { pageTitle: landingTitle || 'Trang', sectionLabel: 'Nội dung', sectionId: '__legacy_sections__' }, issues, seen);
  }

  const sectionIds = new Set(issues.map((i) => i.sectionId).filter(Boolean));
  return { issues, sectionIds };
}

export function formatPublishReadinessIssue(issue, copy) {
  const labels = copy?.issueTypes || {};
  const base = labels[issue.type] || labels.sampleText || issue.type;
  const where = [issue.pageTitle, issue.sectionLabel].filter(Boolean).join(' · ');
  return where ? `${where}: ${base}` : base;
}
