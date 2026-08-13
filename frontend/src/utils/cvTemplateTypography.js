/** Kích cỡ chữ CV IT/Technical — đồng bộ preview, form, PDF capture. */
export const CV_TPL_FONT_BODY = '15px';
export const CV_TPL_FONT_DENSE = '15px';
export const CV_TPL_FONT_LABEL = '14px';
export const CV_TPL_FONT_TITLE = '19px';
export const CV_PDF_TABLE_FONT_SIZE = '15px';
/** Ô checkbox PDF — vẽ bằng border/fill, không dùng glyph ■ (glyph hay bé hơn em-box). */
export const CV_PDF_CHECKBOX_MARKER_PX = '16px';
export const CV_PDF_CHECKBOX_BORDER_PX = '1.5px';
export const CV_TPL_CHECKBOX_INPUT_PX = '15px';

export const CV_TPL_BODY_STYLE = {
  fontSize: CV_TPL_FONT_BODY,
  color: '#1f2937',
  fontFamily: "'MS Mincho', 'MS 明朝', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
};

export const CV_TPL_TABLE_STYLE = {
  fontSize: CV_TPL_FONT_BODY,
  color: '#1f2937',
  borderColor: '#1f2937',
};

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
      fontSize: '11px',
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
      font-family: 'MS Mincho', 'MS 明朝', 'Yu Mincho', 'Hiragino Mincho ProN', serif !important;
      font-weight: 400 !important;
      font-size: ${CV_TPL_FONT_BODY} !important;
      line-height: 1.45 !important;
    }
    ${rootSelector} .cv-template-body .font-bold,
    ${rootSelector} .cv-template-body h2 {
      font-weight: 700 !important;
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
    ${rootSelector} [data-cv-layout-key$="::certificates_v2"] td,
    ${rootSelector} [data-cv-layout-key$="::certificates_v2"] th,
    ${rootSelector} [data-cv-layout-key$="::certificates_v2"] td * {
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
    ${rootSelector} label:has(input[type="checkbox"]),
    ${rootSelector} label:has([data-cv-pdf-checkbox-marker="1"]) {
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
      flex-wrap: wrap !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 0.5rem 1rem !important;
    }
    ${rootSelector} .cv-pdf-date-inline,
    ${rootSelector} .cv-template-date-triplet,
    ${rootSelector} [data-cv-pdf-date-flat="1"] {
      font-size: ${CV_TPL_FONT_BODY} !important;
    }
  `;
}
