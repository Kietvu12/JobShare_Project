/** Kích cỡ chữ CV IT/Technical — đồng bộ preview, form, PDF capture. */
import '../styles/meiryo-ui.css';
import '@fontsource/noto-sans-jp/japanese-400.css';
import '@fontsource/noto-sans-jp/japanese-700.css';

export const CV_TPL_FONT_BODY = '19px';
export const CV_TPL_FONT_DENSE = '19px';
export const CV_TPL_FONT_LABEL = '18px';
/** Ô ngày trong personalGrid — vừa đủ cột, không tràn sang ô kề. */
export const CV_TPL_FONT_DATE = '18px';
export const CV_TPL_FONT_TITLE = '23px';
export const CV_PDF_TABLE_FONT_SIZE = '19px';
/** Meiryo UI only has Regular (400) and Bold (700); weight 600 forces fallback to bundled Noto Sans JP. */
export const CV_TPL_FONT_WEIGHT = 400;
export const CV_TPL_FONT_WEIGHT_BOLD = 700;
/** Meiryo UI bundled in src/assets/MeiryoUI; Noto Sans JP as glyph fallback. */
export const CV_TPL_FONT_FAMILY_MEIRYO = "'Meiryo UI', Meiryo, 'メイリオ', sans-serif";
export const CV_TPL_FONT_FAMILY_WEB = "'Noto Sans JP', sans-serif";
export const CV_TPL_FONT_FAMILY = `${CV_TPL_FONT_FAMILY_MEIRYO}, 'Noto Sans JP', sans-serif`;

let resolvedCvFontFamilyCache = null;

/** Always use bundled Meiryo UI (@font-face in meiryo-ui.css). */
export async function resolveCvTemplateFontFamily() {
  if (resolvedCvFontFamilyCache) return resolvedCvFontFamilyCache;
  resolvedCvFontFamilyCache = CV_TPL_FONT_FAMILY_MEIRYO;
  return resolvedCvFontFamilyCache;
}

export async function applyCvTemplateFontFamily(el = document.documentElement) {
  const fontFamily = await resolveCvTemplateFontFamily();
  el?.style?.setProperty('--cv-font-family', fontFamily);
  return fontFamily;
}
/** Ô checkbox PDF — vẽ bằng border/fill, không dùng glyph ■ (glyph hay bé hơn em-box). */
export const CV_PDF_CHECKBOX_MARKER_PX = '20px';
export const CV_PDF_CHECKBOX_BORDER_PX = '1.5px';
export const CV_TPL_CHECKBOX_INPUT_PX = '19px';

export const CV_TPL_BODY_STYLE = {
  fontSize: CV_TPL_FONT_BODY,
  color: '#1f2937',
  fontWeight: CV_TPL_FONT_WEIGHT,
};

export const CV_TPL_TABLE_STYLE = {
  fontSize: CV_TPL_FONT_BODY,
  color: '#1f2937',
  borderColor: '#1f2937',
};

/** Wait for bundled Meiryo UI (+ Noto fallback) before CV PDF capture. */
export async function ensureCvTemplateFontsLoaded() {
  const fontFamily = await resolveCvTemplateFontFamily();
  try {
    await applyCvTemplateFontFamily();
    if (document.fonts?.load) {
      await Promise.allSettled([
        document.fonts.load(`400 ${CV_TPL_FONT_BODY} "Meiryo UI"`),
        document.fonts.load(`700 ${CV_TPL_FONT_BODY} "Meiryo UI"`),
        document.fonts.load(`400 ${CV_TPL_FONT_BODY} "Noto Sans JP"`),
        document.fonts.load(`700 ${CV_TPL_FONT_BODY} "Noto Sans JP"`),
      ]);
    }
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    /* ignore */
  }
  return fontFamily;
}

/** Tạo ô vuông giống checkbox HTML — rõ trong PDF screenshot. */
export function createCvPdfCheckboxMarkerElement(checked = false) {
  const marker = document.createElement('span');
  marker.dataset.cvPdfCheckboxMarker = '1';
  marker.setAttribute('aria-hidden', 'true');
  Object.assign(marker.style, {
    display: 'inline-block',
    width: CV_PDF_CHECKBOX_MARKER_PX,
    height: CV_PDF_CHECKBOX_MARKER_PX,
    minWidth: CV_PDF_CHECKBOX_MARKER_PX,
    minHeight: CV_PDF_CHECKBOX_MARKER_PX,
    boxSizing: 'border-box',
    border: `${CV_PDF_CHECKBOX_BORDER_PX} solid #1f2937`,
    borderRadius: '2px',
    backgroundColor: checked ? '#1f2937' : '#ffffff',
    flexShrink: '0',
    verticalAlign: 'middle',
    position: 'relative',
    overflow: 'hidden',
  });

  if (checked) {
    const tick = document.createElement('span');
    tick.textContent = '✓';
    Object.assign(tick.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: '13px',
      lineHeight: '1',
      fontWeight: '700',
      fontFamily: 'Arial, sans-serif',
    });
    marker.appendChild(tick);
  }

  return marker;
}

/** CSS ép typography khi capture PDF (sandbox + live root). */
export function buildCvPdfCaptureTypographyCss(rootSelector) {
  return `
    ${rootSelector} .cv-template-body {
      font-family: var(--cv-font-family, ${CV_TPL_FONT_FAMILY}) !important;
      font-weight: ${CV_TPL_FONT_WEIGHT} !important;
      font-size: ${CV_TPL_FONT_BODY} !important;
      line-height: 1.45 !important;
    }
    ${rootSelector} .cv-template-body td,
    ${rootSelector} .cv-template-body th,
    ${rootSelector} .cv-template-body td *,
    ${rootSelector} .cv-template-body th *,
    ${rootSelector} .cv-template-body [contenteditable],
    ${rootSelector} .cv-template-body .font-normal,
    ${rootSelector} .cv-template-body label,
    ${rootSelector} .cv-template-body input,
    ${rootSelector} .cv-template-body select,
    ${rootSelector} .cv-template-body span {
      font-weight: ${CV_TPL_FONT_WEIGHT} !important;
    }
    ${rootSelector} .cv-template-body .font-bold,
    ${rootSelector} .cv-template-body h2 {
      font-weight: ${CV_TPL_FONT_WEIGHT_BOLD} !important;
    }
    ${rootSelector} .cv-resizable-table-wrap,
    ${rootSelector} .cv-resizable-table-wrap table {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
    }
    ${rootSelector} .cv-resizable-table-wrap td,
    ${rootSelector} .cv-resizable-table-wrap th,
    ${rootSelector} .cv-resizable-table-wrap td *,
    ${rootSelector} .cv-resizable-table-wrap th * {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
    }
    ${rootSelector} [data-cv-fixed-cert-table] table,
    ${rootSelector} [data-cv-fixed-cert-table] td,
    ${rootSelector} [data-cv-fixed-cert-table] th,
    ${rootSelector} [data-cv-fixed-cert-table] td *,
    ${rootSelector} [data-cv-layout-key$="::certificates_v7"] td,
    ${rootSelector} [data-cv-layout-key$="::certificates_v7"] th,
    ${rootSelector} [data-cv-layout-key$="::certificates_v7"] td * {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
    }
    ${rootSelector} .cv-template-body .text-xs,
    ${rootSelector} .cv-template-body .text-sm {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
      line-height: 1.35 !important;
    }
    ${rootSelector} .cv-template-body .cv-tpl-dense,
    ${rootSelector} .cv-template-body .cv-tpl-note,
    ${rootSelector} .cv-template-body [data-cv-pdf-editable-marker] {
      font-size: ${CV_TPL_FONT_DENSE} !important;
      line-height: 1.45 !important;
    }
    ${rootSelector} .cv-template-body .cv-tpl-side-label {
      font-size: ${CV_TPL_FONT_LABEL} !important;
    }
    ${rootSelector} [data-cv-layout-key$="::languages_v2"] td,
    ${rootSelector} [data-cv-layout-key$="::tools_v2"] td,
    ${rootSelector} [data-cv-tools-name-cell],
    ${rootSelector} [data-cv-fixed-cert-table] td {
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    ${rootSelector} label:has(input[type="checkbox"]):not(.cv-lang-level-option):not(.cv-tools-option),
    ${rootSelector} label:has([data-cv-pdf-checkbox-marker="1"]):not(.cv-lang-level-option):not(.cv-tools-option) {
      display: inline-flex !important;
      align-items: center !important;
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
      line-height: 1.35 !important;
      gap: 0.35rem !important;
    }
    ${rootSelector} [data-cv-pdf-checkbox-marker="1"],
    ${rootSelector} [data-cv-pdf-tools-box="1"],
    ${rootSelector} [data-cv-pdf-cert-box="1"] {
      width: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      height: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      min-width: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      min-height: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      box-sizing: border-box !important;
      border: ${CV_PDF_CHECKBOX_BORDER_PX} solid #1f2937 !important;
      border-radius: 2px !important;
      flex-shrink: 0 !important;
      display: inline-block !important;
      vertical-align: middle !important;
    }
    ${rootSelector} [data-cv-pdf-tools-flat="1"],
    ${rootSelector} [data-cv-cert-jlpt-flat="1"] > span {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.35rem !important;
    }
    ${rootSelector} [data-cv-cert-jlpt-flat="1"] {
      font-size: ${CV_PDF_TABLE_FONT_SIZE} !important;
      display: flex !important;
      flex-wrap: nowrap !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 0.35rem 0.75rem !important;
      white-space: nowrap !important;
    }
    ${rootSelector} .cv-pdf-date-inline,
    ${rootSelector} .cv-template-date-triplet,
    ${rootSelector} [data-cv-pdf-date-flat="1"] {
      font-size: ${CV_TPL_FONT_BODY} !important;
    }
    ${rootSelector} table.cv-personal-grid-v3 .cv-personal-date-cell .cv-template-date-triplet,
    ${rootSelector} table.cv-personal-grid-v3 .cv-personal-date-cell [data-cv-pdf-date-flat="1"] {
      font-size: ${CV_TPL_FONT_DATE} !important;
    }
    ${rootSelector} .cv-template-body td.bg-white:not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense):not([data-cv-tools-name-cell="1"]),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap:not(.cv-shokumu-prose) tbody td:not(.cv-shokumu-prose *):not(.cv-shokumu-work-section *):not(.cv-tpl-side-label):not(.cv-tpl-section-title-col):not(.cv-cert-title-col):not([style*="e2efd9"]):not([style*="f9fafb"]):not(.bg-gray-50):not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense):not([data-cv-tools-name-cell="1"]) {
      text-align: center !important;
      vertical-align: middle !important;
    }
    ${rootSelector} .cv-template-body td.bg-white:not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense) [contenteditable]:not(.cv-tpl-dense):not(.text-left),
    ${rootSelector} .cv-template-body td.bg-white:not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):not(.text-left),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap:not(.cv-shokumu-prose) tbody td:not(.cv-shokumu-prose *):not(.cv-shokumu-work-section *):not(.cv-tpl-side-label):not(.cv-tpl-section-title-col):not(.cv-cert-title-col):not([style*="e2efd9"]):not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense) [contenteditable]:not(.cv-tpl-dense):not(.text-left),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap:not(.cv-shokumu-prose) tbody td:not(.cv-shokumu-prose *):not(.cv-shokumu-work-section *):not(.cv-tpl-side-label):not(.cv-tpl-section-title-col):not(.cv-cert-title-col):not([style*="e2efd9"]):not(.cv-tpl-note):not(:has(.cv-tpl-dense)):not(.cv-tpl-dense) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):not(.text-left) {
      text-align: center !important;
    }
    ${rootSelector} .cv-template-body td.bg-white label.flex,
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td label.flex {
      justify-content: center !important;
    }
    ${rootSelector} .cv-template-body td.bg-white > div.flex:has(input[type="checkbox"]),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td > div.flex:has(input[type="checkbox"]) {
      justify-content: center !important;
      width: 100% !important;
    }
    ${rootSelector} .cv-template-body td.bg-white > label:has(input[type="checkbox"]):not(.cv-lang-level-option):not(.cv-tools-option),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td > label:has(input[type="checkbox"]):not(.cv-lang-level-option):not(.cv-tools-option) {
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
    }
    ${rootSelector} .cv-template-body td.cv-lang-level-cell {
      text-align: center !important;
      vertical-align: middle !important;
    }
    ${rootSelector} .cv-template-body td.cv-lang-level-cell > label.cv-lang-level-option {
      display: inline-grid !important;
      grid-template-columns: ${CV_TPL_CHECKBOX_INPUT_PX} 1fr !important;
      gap: 0.375rem !important;
      align-items: center !important;
      width: 7.75em !important;
      min-width: unset !important;
      text-align: left !important;
      white-space: nowrap !important;
    }
    ${rootSelector} .cv-template-body td.cv-lang-level-cell > label.cv-lang-level-option input[type="checkbox"] {
      width: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      min-width: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      height: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      margin: 0 !important;
    }
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] {
      text-align: left !important;
      vertical-align: middle !important;
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] > label.cv-tools-option,
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] > .cv-tools-option-empty {
      display: grid !important;
      grid-template-columns: ${CV_TPL_CHECKBOX_INPUT_PX} minmax(0, 1fr) !important;
      align-items: center !important;
      justify-items: start !important;
      column-gap: 0.375rem !important;
      width: 100% !important;
      max-width: 100% !important;
      text-align: left !important;
      white-space: nowrap !important;
      overflow: visible !important;
      min-width: 0 !important;
    }
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] > label.cv-tools-option > input[type="checkbox"] {
      grid-column: 1 !important;
      grid-row: 1 !important;
      display: inline-block !important;
      box-sizing: border-box !important;
      flex: unset !important;
      width: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      min-width: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      max-width: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      height: ${CV_TPL_CHECKBOX_INPUT_PX} !important;
      margin: 0 !important;
      padding: 0 !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: static !important;
      justify-self: start !important;
      flex-shrink: 0 !important;
      appearance: auto !important;
      -webkit-appearance: checkbox !important;
    }
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] > label.cv-tools-option > .cv-tools-option-label,
    ${rootSelector} .cv-template-body td[data-cv-tools-name-cell="1"] > label.cv-tools-option > :not(input[type="checkbox"]):not(.cv-tools-option-label) {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
      text-align: left !important;
    }
    ${rootSelector} .cv-template-body [data-cv-pdf-tools-flat] {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 0.375rem !important;
      width: 100% !important;
      text-align: left !important;
      white-space: nowrap !important;
    }
    ${rootSelector} .cv-template-body [data-cv-pdf-tools-box="1"],
    ${rootSelector} .cv-template-body [data-cv-pdf-tools-flat="1"] [data-cv-pdf-tools-box="1"] {
      flex: 0 0 ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      width: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      min-width: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
      height: ${CV_PDF_CHECKBOX_MARKER_PX} !important;
    }
    ${rootSelector} .cv-template-body td.bg-white.cv-tpl-note,
    ${rootSelector} .cv-template-body td.bg-white:has(.cv-tpl-dense),
    ${rootSelector} .cv-template-body td.bg-white.cv-tpl-dense,
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td.cv-tpl-note,
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td:has(.cv-tpl-dense),
    ${rootSelector} .cv-template-body .cv-resizable-table-wrap tbody td.cv-tpl-dense {
      text-align: left !important;
      vertical-align: top !important;
    }
    ${rootSelector} .cv-template-body .cv-tpl-dense,
    ${rootSelector} .cv-template-body td.cv-tpl-note,
    ${rootSelector} .cv-template-body td.cv-tpl-note > div,
    ${rootSelector} .cv-template-body td.cv-tpl-note > div > div,
    ${rootSelector} .cv-template-body .cv-tpl-dense[contenteditable],
    ${rootSelector} .cv-template-body td.cv-tpl-note [contenteditable],
    ${rootSelector} .cv-template-body td:has(.cv-tpl-dense) [contenteditable],
    ${rootSelector} .cv-template-body td.cv-tpl-dense [contenteditable] {
      text-align: left !important;
    }
    ${rootSelector} .cv-template-body [data-cv-shokumu-cert-list],
    ${rootSelector} .cv-template-body [data-cv-shokumu-cert-list] [data-cv-shokumu-cert-row],
    ${rootSelector} .cv-template-body [data-cv-shokumu-cert-list] input[type="text"]:not(.text-center) {
      text-align: left !important;
    }
    ${rootSelector} .cv-template-body [data-cv-shokumu-cert-list] [data-cv-shokumu-cert-row] {
      justify-content: flex-start !important;
    }
    ${rootSelector} .cv-template-body .cv-shokumu-work-section tbody td:not([data-cv-shokumu-period]),
    ${rootSelector} .cv-template-body .cv-shokumu-prose tbody td:not([data-cv-shokumu-period]),
    ${rootSelector} .cv-template-body .cv-shokumu-prose .cv-resizable-table-wrap tbody td:not([data-cv-shokumu-period]) {
      text-align: left !important;
      vertical-align: top !important;
    }
    ${rootSelector} .cv-template-body .cv-shokumu-work-section tbody td:not([data-cv-shokumu-period]) [contenteditable],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section tbody td:not([data-cv-shokumu-period]) > div,
    ${rootSelector} .cv-template-body .cv-shokumu-prose tbody td:not([data-cv-shokumu-period]) [contenteditable],
    ${rootSelector} .cv-template-body .cv-shokumu-prose .cv-resizable-table-wrap tbody td:not([data-cv-shokumu-period]) [contenteditable] {
      text-align: left !important;
    }
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-desc-cell],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-tools-cell],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-desc-cell] [contenteditable],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-tools-cell] [contenteditable],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-desc-cell] [data-cv-pdf-flat-cell],
    ${rootSelector} .cv-template-body .cv-shokumu-work-section [data-cv-shokumu-tools-cell] [data-cv-pdf-flat-cell] {
      text-align: left !important;
    }
    ${rootSelector} .cv-template-body [data-cv-shokumu-period],
    ${rootSelector} .cv-template-body td.cv-pdf-shokumu-period {
      text-align: center !important;
      vertical-align: middle !important;
    }
    ${rootSelector} .cv-template-body [data-cv-shokumu-period] .cv-pdf-date-inline,
    ${rootSelector} .cv-template-body [data-cv-shokumu-period] > span,
    ${rootSelector} .cv-template-body [data-cv-shokumu-period] input {
      text-align: center !important;
    }
    ${rootSelector} .cv-template-body [data-cv-shokumu-period] .cv-pdf-date-inline {
      margin-left: auto !important;
      margin-right: auto !important;
      justify-content: center !important;
      align-items: center !important;
    }
    ${rootSelector} .cv-template-body .cv-shokumu-work-section tbody td label.flex,
    ${rootSelector} .cv-template-body .cv-shokumu-prose .cv-resizable-table-wrap tbody td label.flex {
      justify-content: flex-start !important;
    }
    ${rootSelector} .cv-template-body .cv-personal-name-cell {
      height: 1px;
      vertical-align: top !important;
    }
    ${rootSelector} .cv-template-body .cv-personal-name-cell-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 7.5rem;
      box-sizing: border-box;
    }
    ${rootSelector} .cv-template-body .cv-personal-name-furigana {
      flex: 0 0 auto;
    }
    ${rootSelector} .cv-template-body .cv-personal-name-kanji {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: center;
    }
  `;
}
