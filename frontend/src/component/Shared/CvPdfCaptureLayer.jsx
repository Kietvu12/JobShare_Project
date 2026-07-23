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
    await new Promise((resolve) => setTimeout(resolve, 1200));
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

  const getVisibleSectionsIfReady = useCallback((tpl) => {
    const resolver = resolveVisibleSectionRef.current;
    if (typeof resolver !== 'function') return null;

    const elR = resolver(tpl, 'rirekisho');
    const elS = resolver(tpl, 'shokumu');
    const panel = elR?.closest('#add-candidate-panel-preview');
    const panelInner = panel?.querySelector('.cv-preview-scroll');
    const panelWidth = panelInner?.clientWidth || panel?.clientWidth || 0;
    if (panelWidth > 0 && panelWidth < CV_PDF_CAPTURE_WIDTH_PX * 0.92) return null;
    if (!elR?.isConnected || !elS?.isConnected) return null;
    if (!hasElementLayout(elR) || !hasElementLayout(elS)) return null;
    return { rirekisho: elR, shokumu: elS };
  }, []);

  const tryCaptureVisibleSection = useCallback(async (tpl, part) => {
    const sections = getVisibleSectionsIfReady(tpl);
    const el = sections?.[part];
    if (!el) return null;

    await waitForDocumentFonts();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      return await elementToPdfBlob(el);
    } catch (error) {
      console.warn(`Visible CV section capture failed (${tpl}/${part}), fallback to capture layer:`, error);
      return null;
    }
  }, [getVisibleSectionsIfReady]);

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

      await waitForDocumentFonts();
      const results = [];

      for (const tpl of keys) {
        const visible = getVisibleSectionsIfReady(tpl);
        let capturedFromVisible = false;

        if (visible) {
          try {
            for (const part of ['rirekisho', 'shokumu']) {
              const el = visible[part];
              if (!el) throw new Error(`Missing visible section ${part}`);
              const blob = await elementToPdfBlob(el);
              results.push({
                cvTemplate: tpl,
                part,
                dir: CV_TEMPLATE_DIR_MAP[tpl],
                blob,
              });
            }
            capturedFromVisible = true;
          } catch (error) {
            console.warn(`Visible CV save capture failed (${tpl}), fallback to capture layer:`, error);
            for (let i = results.length - 1; i >= 0; i -= 1) {
              if (results[i].cvTemplate === tpl) results.splice(i, 1);
            }
          }
        }

        if (capturedFromVisible) continue;

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
        const visiblePdf = await tryCaptureVisibleSection(tpl, 'rirekisho');
        if (visiblePdf) return visiblePdf;
        return captureFromLayer(tpl, ['rirekisho']);
      }
      if (tab === 'shokumu') {
        const visiblePdf = await tryCaptureVisibleSection(tpl, 'shokumu');
        if (visiblePdf) return visiblePdf;
        return captureFromLayer(tpl, ['shokumu']);
      }

      const visible = getVisibleSectionsIfReady(tpl);
      if (visible?.rirekisho && visible?.shokumu) {
        try {
          return await elementsToPdfBlob([visible.rirekisho, visible.shokumu]);
        } catch (error) {
          console.warn('Visible CV full capture failed, fallback to capture layer:', error);
        }
      }
      return captureFromLayer(tpl, ['rirekisho', 'shokumu']);
    },
  }), [captureFromLayer, ensureLayerSectionsReady, getVisibleSectionsIfReady, mountForCapture, tryCaptureVisibleSection, unmountAfterCapture]);

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
