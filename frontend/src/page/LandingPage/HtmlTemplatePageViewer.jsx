import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTemplatePageRegistry, getTemplatePagePreviewUrl } from '../../constants/templatePageRegistry';
import { applyHtmlTemplateOverrides, resolveTemplateAssetUrl } from '../../utils/htmlTemplateOverrides';
import { highlightSelectedSection, setupInlineEditor } from '../../utils/htmlTemplateInlineEditor';
import { wirePreviewNavigation } from '../../utils/htmlTemplatePreviewNav';
import { wjsDebug } from '../../utils/wjsBuilderDebug';
import { normalizePostImageUrl } from '../../services/api';
import { clearWjsMediaDragPayload, readWjsMediaDropUrl } from '../../utils/wjsMediaDragStore';

/**
 * Hiển thị trang HTML gốc qua iframe.
 * editable=true → click trực tiếp trên preview để sửa text/ảnh.
 */
export default function HtmlTemplatePageViewer({
  templateKey,
  pageId,
  className = '',
  title,
  sections = [],
  globals = {},
  editable = false,
  selectedSectionId = null,
  scrollToSectionId = null,
  onSelectSection,
  onSectionEdit,
  onHeaderEdit,
  onBlockDelete,
  onImageFileDrop,
  onMediaDrop,
  syncKey = 0,
  autoHeight = false,
  documentMeta = null,
  onNavigatePage = null,
  onScrollToSection = null,
  onScrollToSectionComplete = null,
}) {
  const iframeRef = useRef(null);
  const cleanupRef = useRef(null);
  const navCleanupRef = useRef(null);
  const isTypingRef = useRef(false);
  const skipReinjectRef = useRef(false);
  const prevSyncKeyRef = useRef(syncKey);
  const bindTimersRef = useRef([]);
  const [imgEditor, setImgEditor] = useState(null);
  const [textToolbar, setTextToolbar] = useState(null);
  const [externalDragOver, setExternalDragOver] = useState(false);
  const textToolbarRef = useRef(null);

  const registry = getTemplatePageRegistry(templateKey);
  const src = useMemo(
    () => getTemplatePagePreviewUrl(templateKey, pageId),
    [templateKey, pageId],
  );

  const sectionsRef = useRef(sections);
  const globalsRef = useRef(globals);
  sectionsRef.current = sections;
  globalsRef.current = globals;

  const documentMetaRef = useRef(documentMeta);
  documentMetaRef.current = documentMeta;

  const resizeIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;

    /* Builder: iframe = full trang, scroll ở khung ngoài — tránh cắt section giữa viewport */
    if (editable || autoHeight) {
      const h = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body.scrollHeight || 0,
        doc.documentElement?.offsetHeight || 0,
      );
      iframe.style.height = `${Math.max(h, 320)}px`;
      return;
    }

    iframe.style.height = '';
    iframe.style.minHeight = '640px';
  }, [autoHeight, editable]);

  const schedulePublicFixes = useCallback((doc) => {
    if (editable || !doc) return;
    const run = () => {
      try {
        applyHtmlTemplateOverrides(doc, {
          templateKey,
          sections: sectionsRef.current,
          globals: globalsRef.current,
          publicView: true,
          applyVisualOrder: true,
          documentMeta: documentMetaRef.current,
          builderPreview: false,
        });
        resizeIframe();
      } catch {
        // ignore
      }
    };
    run();
    [100, 400, 1000].forEach((ms) => {
      bindTimersRef.current.push(setTimeout(run, ms));
    });
  }, [editable, templateKey, resizeIframe]);

  const callbacksRef = useRef({
    onSelectSection, onSectionEdit, onHeaderEdit, onBlockDelete, onImageFileDrop, onMediaDrop,
    onNavigatePage, onScrollToSection,
  });
  callbacksRef.current = {
    onSelectSection, onSectionEdit, onHeaderEdit, onBlockDelete, onImageFileDrop, onMediaDrop,
    onNavigatePage, onScrollToSection,
  };

  const resolveMediaDisplayUrl = useCallback((storeValue) => {
    if (!storeValue) return '';
    const folder = registry?.folder || '';
    return resolveTemplateAssetUrl(folder, storeValue)
      || normalizePostImageUrl(storeValue)
      || storeValue;
  }, [registry?.folder]);

  const applyMediaToElement = useCallback((target, storeValue) => {
    if (!target || !storeValue) return;
    const displayUrl = resolveMediaDisplayUrl(storeValue);
    const sectionId = target.dataset.wjsSection;
    const field = target.dataset.wjsField;
    const index = target.dataset.wjsIndex != null ? Number(target.dataset.wjsIndex) : undefined;

    if (target.classList.contains('wjs-editable-bg') || target.dataset.wjsType === 'bg-image') {
      target.style.backgroundImage = `url("${displayUrl}")`;
    } else if (target.tagName === 'IMG') {
      target.src = displayUrl;
      target.style.display = '';
    }

    skipReinjectRef.current = true;
    isTypingRef.current = false;
    callbacksRef.current.onSelectSection?.(sectionId);
    const payload = {
      sectionId,
      field,
      index,
      value: storeValue,
      imageUrl: storeValue,
    };
    if (sectionId === '__header__') {
      callbacksRef.current.onHeaderEdit?.({ field: 'logoImage', value: storeValue, imageUrl: storeValue });
    } else {
      callbacksRef.current.onSectionEdit?.(payload);
    }
  }, [resolveMediaDisplayUrl]);

  const findImageTargetAtPoint = useCallback((clientX, clientY) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return null;
    const rect = iframe.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const hit = doc.elementFromPoint(x, y);
    const direct = hit?.closest('[data-wjs-type="image"], [data-wjs-type="bg-image"], .wjs-editable-img');
    if (direct) return direct;

    const zones = [...doc.querySelectorAll('[data-wjs-type="bg-image"]')];
    for (const zone of zones) {
      const zr = zone.getBoundingClientRect();
      if (
        clientX >= zr.left
        && clientX <= zr.right
        && clientY >= zr.top
        && clientY <= zr.bottom
      ) {
        return zone;
      }
    }
    return null;
  }, []);

  const clearBindTimers = () => {
    bindTimersRef.current.forEach(clearTimeout);
    bindTimersRef.current = [];
  };

  const bindGenerationRef = useRef(0);
  const selectedSectionIdRef = useRef(selectedSectionId);
  selectedSectionIdRef.current = selectedSectionId;

  const bindInlineEditors = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !editable) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const gen = ++bindGenerationRef.current;
      wjsDebug('viewer', 'bindInlineEditors start', { gen, sections: sectionsRef.current?.length });
      cleanupRef.current?.();
      cleanupRef.current = setupInlineEditor(doc, {
        sections: sectionsRef.current,
        globals: globalsRef.current,
        selectedSectionId: selectedSectionIdRef.current,
        getSelectedSectionId: () => selectedSectionIdRef.current,
        onSelectSection: (id) => callbacksRef.current.onSelectSection?.(id),
        onSectionEdit: (payload) => {
          skipReinjectRef.current = true;
          callbacksRef.current.onSectionEdit?.(payload);
        },
        onHeaderEdit: (payload) => {
          skipReinjectRef.current = true;
          callbacksRef.current.onHeaderEdit?.(payload);
        },
        onImageClick: (payload) => {
          isTypingRef.current = false;
          setTextToolbar(null);
          const iframeRect = iframe.getBoundingClientRect();
          const elRect = payload.element?.getBoundingClientRect?.() || { top: 80, left: 20, width: 200, height: 120 };
          setImgEditor({
            ...payload,
            top: iframeRect.top + elRect.top + window.scrollY,
            left: iframeRect.left + elRect.left + window.scrollX,
          });
        },
        onTextFocus: (payload) => {
          setImgEditor(null);
          const iframeRect = iframe.getBoundingClientRect();
          textToolbarRef.current = payload.element;
          setTextToolbar({
            ...payload,
            top: iframeRect.top + payload.rect.top + window.scrollY - 44,
            left: iframeRect.left + payload.rect.left + window.scrollX,
          });
        },
        onBlockDelete: (payload) => {
          callbacksRef.current.onBlockDelete?.(payload);
        },
        onImageFileDrop: (payload) => {
          callbacksRef.current.onImageFileDrop?.(payload);
        },
        onMediaDrop: (payload) => {
          applyMediaToElement(payload.element, payload.url);
          callbacksRef.current.onMediaDrop?.(payload);
        },
      });
      if (gen !== bindGenerationRef.current) return;
      highlightSelectedSection(doc, selectedSectionIdRef.current);
      wjsDebug('viewer', 'bindInlineEditors done', {
        gen,
        editableCount: doc.querySelectorAll('.wjs-editable[data-wjs-field]').length,
      });
    } catch (err) {
      wjsDebug('viewer', 'bindInlineEditors error', err);
    }
  }, [editable, applyMediaToElement]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.body.classList.toggle('wjs-external-drag-over', externalDragOver);
  }, [externalDragOver]);

  const handleWrapperDragEnter = (e) => {
    if (
      e.dataTransfer.types.includes('application/x-wjs-media-url')
      || e.dataTransfer.types.includes('text/plain')
      || e.dataTransfer.types.includes('Files')
    ) {
      setExternalDragOver(true);
    }
  };

  const handleWrapperDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setExternalDragOver(false);
      clearWjsMediaDragPayload();
    }
  };

  const handleWrapperDrop = async (e) => {
    e.preventDefault();
    setExternalDragOver(false);
    clearWjsMediaDragPayload();
    const target = findImageTargetAtPoint(e.clientX, e.clientY);
    if (!target) return;

    const mediaUrl = readWjsMediaDropUrl(e.dataTransfer);
    if (mediaUrl) {
      applyMediaToElement(target, mediaUrl);
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith('image/')) {
      callbacksRef.current.onImageFileDrop?.({
        sectionId: target.dataset.wjsSection,
        field: target.dataset.wjsField,
        index: target.dataset.wjsIndex != null ? Number(target.dataset.wjsIndex) : undefined,
        element: target,
        file,
      });
    }
  };

  const closeImgEditor = useCallback(() => {
    setImgEditor(null);
    isTypingRef.current = false;
    skipReinjectRef.current = false;
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.activeElement?.blur) doc.activeElement.blur();
      bindInlineEditors();
    } catch {
      // ignore
    }
  }, [bindInlineEditors]);

  const scheduleBind = useCallback(() => {
    clearBindTimers();
    bindInlineEditors();
    bindTimersRef.current.push(setTimeout(() => {
      bindInlineEditors();
    }, 400));
  }, [bindInlineEditors]);

  const wireNav = useCallback((doc) => {
    if (!doc) return;
    navCleanupRef.current?.();
    navCleanupRef.current = wirePreviewNavigation(doc, {
      editable,
      pages: globalsRef.current?.pages || [],
      sections: sectionsRef.current || [],
      onNavigatePage: (payload) => callbacksRef.current.onNavigatePage?.(payload),
      onScrollToSection: (sectionId) => callbacksRef.current.onScrollToSection?.(sectionId),
    });
  }, [editable]);

  const fullInject = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      wjsDebug('viewer', 'fullInject', {
        templateKey,
        sections: sectionsRef.current?.length,
        syncKey,
      });
      applyHtmlTemplateOverrides(doc, {
        templateKey,
        sections: sectionsRef.current,
        globals: globalsRef.current,
        publicView: !editable,
        applyVisualOrder: true,
        documentMeta: documentMetaRef.current,
        builderPreview: editable,
      });
      if (editable) {
        scheduleBind();
      } else {
        schedulePublicFixes(doc);
      }
      wireNav(doc);
      resizeIframe();
    } catch {
      // cross-origin
    }
  }, [templateKey, editable, scheduleBind, resizeIframe, schedulePublicFixes, wireNav]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const onLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        fullInject();

        doc.querySelectorAll('form').forEach((f) => {
          f.addEventListener('submit', (e) => e.preventDefault());
        });

        if (editable) {
          doc.addEventListener('focusin', (e) => {
            if (e.target.closest('.wjs-editable[data-wjs-field]')) {
              isTypingRef.current = true;
            }
          });
          doc.addEventListener('focusout', (e) => {
            setTimeout(() => {
              const active = iframe.contentDocument?.activeElement;
              if (!active?.closest?.('.wjs-editable[data-wjs-field]')) {
                isTypingRef.current = false;
              }
            }, 80);
          });
        }
      } catch {
        // fallback
      }
    };

    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
      clearBindTimers();
      cleanupRef.current?.();
      navCleanupRef.current?.();
    };
  }, [src, templateKey, editable, fullInject]);

  // Re-inject: panel syncKey luôn ép refresh; inline edit dùng skipReinject
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;

    const panelForced = prevSyncKeyRef.current !== syncKey;
    prevSyncKeyRef.current = syncKey;

    if (panelForced) {
      wjsDebug('viewer', 'reinject panel syncKey', { syncKey });
      isTypingRef.current = false;
      skipReinjectRef.current = false;
      try {
        iframe.contentDocument?.activeElement?.blur?.();
      } catch {
        // ignore
      }
      fullInject();
      resizeIframe();
      return;
    }

    if (skipReinjectRef.current) {
      wjsDebug('viewer', 'reinject skipped (inline edit)');
      skipReinjectRef.current = false;
      return;
    }
    if (isTypingRef.current) {
      wjsDebug('viewer', 'reinject skipped (isTyping)');
      return;
    }
    const active = iframeRef.current?.contentDocument?.activeElement;
    if (active?.classList?.contains('wjs-editable')) {
      wjsDebug('viewer', 'reinject skipped (active editable)');
      return;
    }
    wjsDebug('viewer', 'reinject globals change');
    fullInject();
    resizeIframe();
  }, [syncKey, globals, fullInject, resizeIframe]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const notifyIframeResize = () => {
      resizeIframe();
      try {
        const win = iframe.contentWindow;
        win?.dispatchEvent?.(new Event('resize'));
        win?.jQuery?.(win).trigger?.('resize');
      } catch {
        // ignore
      }
    };

    const ro = new ResizeObserver(() => notifyIframeResize());
    ro.observe(iframe);
    return () => ro.disconnect();
  }, [resizeIframe]);

  useEffect(() => {
    if (!editable) return undefined;
    const onWinResize = () => resizeIframe();
    window.addEventListener('resize', onWinResize);
    return () => window.removeEventListener('resize', onWinResize);
  }, [editable, resizeIframe]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !editable) return;
    highlightSelectedSection(doc, selectedSectionId);
  }, [selectedSectionId, editable]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !editable || !scrollToSectionId) return;
    const target = doc.querySelector(`[data-wjs-section-picker="${scrollToSectionId}"]`)
      || doc.querySelector(`[data-wjs-section="${scrollToSectionId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    onScrollToSectionComplete?.();
  }, [scrollToSectionId, editable, onScrollToSectionComplete]);

  useEffect(() => {
    if (!editable) return undefined;
    const onDocClick = () => {
      setTimeout(() => {
        const active = iframeRef.current?.contentDocument?.activeElement;
        if (!active?.classList?.contains('wjs-editable')) setTextToolbar(null);
      }, 120);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [editable]);

  const applyTextColor = (color) => {
    if (!textToolbar) return;
    const { element, field, index, sectionId } = textToolbar;
    if (element) element.style.color = color;
    skipReinjectRef.current = true;
    callbacksRef.current.onSectionEdit?.({
      sectionId,
      field,
      index,
      value: color,
      editType: 'color',
    });
    setTextToolbar((t) => (t ? { ...t, currentColor: color } : null));
  };

  const clearImage = () => {
    if (!imgEditor) return;
    const { element, field, index, sectionId } = imgEditor;
    if (element) element.style.display = 'none';
    skipReinjectRef.current = true;
    isTypingRef.current = false;
    if (sectionId === '__header__') {
      callbacksRef.current.onHeaderEdit?.({ field: 'logoImage', value: '', editType: 'clear-image' });
    } else {
      callbacksRef.current.onSectionEdit?.({
        sectionId,
        field,
        index,
        value: '',
        editType: 'clear-image',
      });
    }
    closeImgEditor();
  };

  const applyImageUrl = (url) => {
    if (!imgEditor) return;
    const { element, field, index, sectionId } = imgEditor;

    if (element) {
      const displayUrl = resolveMediaDisplayUrl(url);
      if (field?.includes('image') && element.classList.contains('wjs-editable-bg')) {
        element.style.backgroundImage = `url("${displayUrl}")`;
      } else if (element.tagName === 'IMG') {
        element.src = displayUrl;
        element.style.display = '';
      }
    }

    skipReinjectRef.current = true;
    callbacksRef.current.onSectionEdit?.({
      sectionId,
      field,
      index,
      value: url,
      imageUrl: url,
    });
    setImgEditor(null);
    isTypingRef.current = false;
  };

  if (!registry || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-500 text-sm ${className}`}>
        Không tìm thấy trang template
      </div>
    );
  }

  return (
    <div
      className={`relative ${externalDragOver ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
      onDragEnter={editable ? handleWrapperDragEnter : undefined}
      onDragLeave={editable ? handleWrapperDragLeave : undefined}
      onDragOver={editable ? (e) => {
        if (
          e.dataTransfer.types.includes('application/x-wjs-media-url')
          || e.dataTransfer.types.includes('text/plain')
          || e.dataTransfer.types.includes('Files')
        ) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      } : undefined}
      onDrop={editable ? handleWrapperDrop : undefined}
    >
      {editable && (
        <div className="px-3 py-1.5 bg-blue-600 text-white text-[10px] flex items-center gap-2">
          <span className="font-semibold">Chế độ sửa trực tiếp</span>
          <span className="opacity-80">— Kéo ảnh từ thư viện thả vào vùng ảnh · Click ảnh đổi URL</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        title={title || `Template ${templateKey} — ${pageId}`}
        className={`w-full border-0 bg-white block ${editable ? 'rounded-lg' : ''} ${className}`}
        style={{
          display: 'block',
          minHeight: editable || autoHeight ? 320 : 640,
          pointerEvents: externalDragOver ? 'none' : undefined,
        }}
        scrolling={editable || autoHeight ? 'no' : undefined}
        sandbox="allow-scripts allow-same-origin"
      />

      {textToolbar && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 px-2 py-1.5 flex items-center gap-2"
          style={{
            top: Math.max(8, textToolbar.top),
            left: Math.min(textToolbar.left, window.innerWidth - 200),
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="text-[10px] text-slate-500 whitespace-nowrap">Màu chữ</span>
          <input
            type="color"
            value={textToolbar.currentColor || '#000000'}
            onChange={(e) => applyTextColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            title="Đổi màu chữ"
          />
          <input
            type="text"
            value={textToolbar.currentColor || '#000000'}
            onChange={(e) => applyTextColor(e.target.value)}
            className="w-20 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono"
          />
        </div>
      )}

      {imgEditor && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-72"
          style={{ top: imgEditor.top, left: Math.min(imgEditor.left, window.innerWidth - 300) }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] font-bold text-slate-500 mb-2">Đổi ảnh</div>
          <input
            autoFocus
            defaultValue={imgEditor.currentUrl || ''}
            id="wjs-img-url-input"
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mb-2"
            placeholder="images/photo.jpg hoặc URL đầy đủ"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyImageUrl(e.target.value);
              if (e.key === 'Escape') closeImgEditor();
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-lg min-w-[80px]"
              onClick={() => {
                const input = document.getElementById('wjs-img-url-input');
                applyImageUrl(input?.value || '');
              }}
            >
              Áp dụng
            </button>
            <label className="text-xs py-1.5 px-3 border rounded-lg text-slate-600 cursor-pointer hover:bg-slate-50">
              Tải lên
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !imgEditor) return;
                  callbacksRef.current.onImageFileDrop?.({
                    sectionId: imgEditor.sectionId,
                    field: imgEditor.field,
                    index: imgEditor.index,
                    element: imgEditor.element,
                    file,
                  });
                  closeImgEditor();
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              onClick={clearImage}
            >
              Xóa ảnh
            </button>
            <button
              type="button"
              className="text-xs py-1.5 px-3 border rounded-lg text-slate-600"
              onClick={closeImgEditor}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
