import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, createRef } from 'react';
import { flushSync } from 'react-dom';
import {
  CV_PDF_CAPTURE_WIDTH_PX,
  CV_TEMPLATE_DIR_MAP,
  elementToPdfBlob,
  elementsToPdfBlob,
  hasElementLayout,
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
 * resolveVisibleSection(tpl, part) — ưu tiên DOM preview đang hiển thị (WYSIWYG).
 */
const CvPdfCaptureLayer = forwardRef(function CvPdfCaptureLayer({ renderTemplate, resolveVisibleSection }, ref) {
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [captureParts, setCaptureParts] = useState(['rirekisho', 'shokumu']);
  const [capturing, setCapturing] = useState(false);
  const layerRef = useRef(null);
  const sectionRefsMap = useRef({});
  const resolveVisibleSectionRef = useRef(resolveVisibleSection);
  resolveVisibleSectionRef.current = resolveVisibleSection;

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
    await new Promise((resolve) => setTimeout(resolve, 800));
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

  const tryCaptureVisibleSection = useCallback(async (tpl, part) => {
    const resolver = resolveVisibleSectionRef.current;
    if (typeof resolver !== 'function') return null;
    const deadline = Date.now() + 5000;
    let el = null;
    while (Date.now() < deadline) {
      el = resolver(tpl, part);
      if (el?.isConnected && hasElementLayout(el)) break;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!el?.isConnected || !hasElementLayout(el)) return null;
    await waitForDocumentFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      return await elementToPdfBlob(el);
    } catch (error) {
      console.warn(`Visible CV section capture failed (${tpl}/${part}), fallback to capture layer:`, error);
      return null;
    }
  }, []);

  const captureFromLayer = useCallback(async (tpl, parts) => {
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
  }, [ensureLayerSectionsReady, mountForCapture, unmountAfterCapture]);

  useImperativeHandle(ref, () => ({
    async generatePdfs(templateKeys) {
      const keys = (templateKeys || []).filter((k) => CV_TEMPLATE_DIR_MAP[k]);
      if (!keys.length) return [];

      await mountForCapture(keys, ['rirekisho', 'shokumu']);
      const results = [];

      try {
        for (const tpl of keys) {
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
        }
      } finally {
        unmountAfterCapture();
      }

      return results;
    },

    async generatePreviewPdf(template, tab = 'all') {
      const tpl = CV_TEMPLATE_DIR_MAP[template] ? template : 'common';

      if (tab === 'rirekisho') {
        const visiblePdf = await tryCaptureVisibleSection(tpl, 'rirekisho');
        if (visiblePdf) return visiblePdf;
        return captureFromLayer(tpl, ['rirekisho']);
      }
      if (tab === 'shokumu') {
        const visiblePdf = await tryCaptureVisibleSection(tpl, 'shokumu');
        if (visiblePdf) return visiblePdf;
        return captureFromLayer(tpl, ['shokumu']);
      }

      const resolver = resolveVisibleSectionRef.current;
      const elR = typeof resolver === 'function' ? resolver(tpl, 'rirekisho') : null;
      const elS = typeof resolver === 'function' ? resolver(tpl, 'shokumu') : null;
      if (elR?.isConnected && elS?.isConnected && hasElementLayout(elR) && hasElementLayout(elS)) {
        try {
          return await elementsToPdfBlob([elR, elS]);
        } catch (error) {
          console.warn('Visible CV full capture failed, fallback to capture layer:', error);
        }
      }
      return captureFromLayer(tpl, ['rirekisho', 'shokumu']);
    },
  }), [captureFromLayer, ensureLayerSectionsReady, mountForCapture, tryCaptureVisibleSection, unmountAfterCapture]);

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
              pdfExportMode: true,
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
