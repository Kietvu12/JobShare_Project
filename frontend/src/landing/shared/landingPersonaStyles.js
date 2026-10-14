/** Vite-injected `<style data-vite-dev-id="...">` / prod `<link href="...">` for persona shells. */
const LANDING_STYLE_PATTERNS = {
  candidate: [
    /candidate-styles\.scoped/i,
    /candidate-v1-overrides/i,
    /JobShare_Candidate_V1_1[^/]*\/fonts\.css/i,
  ],
  collaborator: [
    /collaborator-styles\.scoped/i,
    /collaborator-v3-overrides/i,
    /JobShare_Collaborator_V3[^/]*\/fonts\.css/i,
  ],
  jobsV3: [/jobs-v3-styles\.scoped/i, /jobs-v3-overrides/i],
  /** Template / login — vẫn inject global unlayered (styles.css) */
  legacyGlobal: [
    /\/templates\/JobShare_[^"'\\]+[/\\]styles\.css/i,
    /JobShare_Candidate_Login/i,
    /JobShare_Login_V1/i,
    /JobShare_Business_Login/i,
  ],
};

function styleTagMatches(id, patterns) {
  return patterns.some((re) => re.test(id));
}

/**
 * Chỉ gỡ CSS template chưa scope (styles.css login cũ).
 * CSS đã prefix `#candidate-site-root` / `#collaborator-site-root` phải giữ lại:
 * Vite inject một lần; xóa thẻ `<style>` rồi `import()` lại không gắn lại → lần vào sau bị mất style đến khi reload.
 */
export function purgeLandingPersonaStyles(scope = 'legacyGlobal') {
  const patternList =
    scope === 'all'
      ? [
          ...LANDING_STYLE_PATTERNS.candidate,
          ...LANDING_STYLE_PATTERNS.collaborator,
          ...LANDING_STYLE_PATTERNS.jobsV3,
          ...LANDING_STYLE_PATTERNS.legacyGlobal,
        ]
      : LANDING_STYLE_PATTERNS[scope] || [];

  document
    .querySelectorAll('style[data-vite-dev-id], link[rel="stylesheet"][href]')
    .forEach((el) => {
      const id = el.getAttribute('data-vite-dev-id') || el.getAttribute('href') || '';
      if (styleTagMatches(id, patternList)) {
        el.remove();
      }
    });
}
