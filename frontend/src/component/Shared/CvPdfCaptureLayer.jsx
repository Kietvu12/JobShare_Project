import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, createRef } from 'react';
import { flushSync } from 'react-dom';
import {
  CV_PDF_CAPTURE_WIDTH_PX,
  CV_TEMPLATE_DIR_MAP,
  elementToPdfBlob,
  elementsToPdfBlob,
  waitForDocumentFonts,
  waitForCvPdfSectionElements,
} from '../../utils/cvClientPdf.js';
const CAPTURE_LAYER_OFFSCREEN_STYLE = {
  position: 'fixed',
  left: '-12000px',
  top: 0,
  width: CV_PDF_CAPTURE_WIDTH_PX,
  visibility: 'visible',
  opacity: 1,
  zIndex: -1,
  pointerEvents: 'none',
  backgroundColor: '#ffffff',
  overflow: 'visible',
};

/**
 * Lớp render template CV để capture DOM → PDF (client-side).
 * Parent truyền renderTemplate(tpl, { pdfExportMode, pdfSectionRefs }).
 */
const CvPdfCaptureLayer = forwardRef(function CvPdfCaptureLayer({ renderTemplate }, ref) {
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [captureParts, setCaptureParts] = useState(['rirekisho', 'shokumu']);
  const [capturing, setCapturing] = useState(false);
  const layerRef = useRef(null);
  const sectionRefsMap = useRef({});

  const getSectionRefs = useCallback((tpl) => {
    if (!sectionRefsMap.current[tpl]) {
      sectionRefsMap.current[tpl] = {
        rirekisho: createRef(),
        shokumu: createRef(),
      };
    }
    return sectionRefsMap.current[tpl];
  }, []);

  const queryLayerSection = useCallback((tpl, part) => {
    const root = layerRef.current;
    if (!root) return null;
    return root.querySelector(`[data-cv-template="${tpl}"] [data-cv-pdf-section="${part}"]`);
  }, []);

  const mountForCapture = useCallback(async (templateKeys, parts = ['rirekisho', 'shokumu']) => {
    flushSync(() => {
      setActiveTemplates(templateKeys);
      setCaptureParts(parts);
      setCapturing(true);
    });
    await waitForDocumentFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, []);

  const unmountAfterCapture = useCallback(() => {
    flushSync(() => {
      setCapturing(false);
      setActiveTemplates([]);
    });
  }, []);

  const ensureLayerSectionsReady = useCallback(async (tpl, parts) => {
    const elements = await waitForCvPdfSectionElements(() => {
      const list = parts.map((part) => queryLayerSection(tpl, part)).filter(Boolean);
      return list.length === parts.length ? list : null;
    }, parts, layerRef.current);

    if (!elements?.length) {
      const label = parts.join(', ');
      throw new Error(`Không render được phần CV (${label}) để xuất PDF. Vui lòng thử lại.`);
    }
    return elements;
  }, [queryLayerSection]);

  const captureFromLayer = useCallback(async (tpl, parts) => {
    const runOnce = async () => {
      await mountForCapture([tpl], parts);
      try {
        const elements = await ensureLayerSectionsReady(tpl, parts);
        if (elements.length === 1) {
          return elementToPdfBlob(elements[0]);
        }
        return elementsToPdfBlob(elements);
      } finally {
        unmountAfterCapture();
      }
    };

    try {
      return await runOnce();
    } catch (error) {
      const msg = error?.message || '';
      if (!/chưa sẵn sàng|Không render|Không chụp được/.test(msg)) throw error;
      await waitForDocumentFonts();
      await new Promise((resolve) => setTimeout(resolve, 600));
      return runOnce();
    }
  }, [ensureLayerSectionsReady, mountForCapture, unmountAfterCapture]);

  useImperativeHandle(ref, () => ({
    async generatePdfs(templateKeys) {
      const keys = (templateKeys || []).filter((k) => CV_TEMPLATE_DIR_MAP[k]);
      if (!keys.length) return [];

      await waitForDocumentFonts();
      const results = [];

      for (const tpl of keys) {
        // Luôn capture qua offscreen layer (A4, đủ 2 tab) — tránh lệch layout/chữ khi lưu từ panel preview.
        await mountForCapture([tpl], ['rirekisho', 'shokumu']);
        try {
          const elements = await ensureLayerSectionsReady(tpl, ['rirekisho', 'shokumu']);
          for (const part of ['rirekisho', 'shokumu']) {
            const el = elements.find((node) => node.getAttribute('data-cv-pdf-section') === part);
            if (!el) continue;
            const blob = await elementToPdfBlob(el);
            results.push({
              cvTemplate: tpl,
              part,
              dir: CV_TEMPLATE_DIR_MAP[tpl],
              blob,
            });
          }
        } finally {
          unmountAfterCapture();
        }
      }

      return results;
    },

    async generatePreviewPdf(template, tab = 'all') {
      const tpl = CV_TEMPLATE_DIR_MAP[template] ? template : 'common';

      if (tab === 'rirekisho') {
        return captureFromLayer(tpl, ['rirekisho']);
      }
      if (tab === 'shokumu') {
        return captureFromLayer(tpl, ['shokumu']);
      }

      return captureFromLayer(tpl, ['rirekisho', 'shokumu']);
    },
  }), [captureFromLayer, ensureLayerSectionsReady, mountForCapture, unmountAfterCapture]);

  if (!activeTemplates.length) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="cv-pdf-capture-layer"
      style={CAPTURE_LAYER_OFFSCREEN_STYLE}
    >
      {activeTemplates.map((tpl) => (
        <div key={tpl} data-cv-template={tpl} className="cv-pdf-capture-template">
          {typeof renderTemplate === 'function'
            ? renderTemplate(tpl, {
              pdfExportMode: false,
              pdfSectionRefs: getSectionRefs(tpl),
              pdfCaptureParts: captureParts,
            })
            : null}
        </div>
      ))}
    </div>
  );
});

export default CvPdfCaptureLayer;
