import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronUp, Copy, ExternalLink, GripVertical,
  Loader2, Plus, Save, Send, Trash2,
} from 'lucide-react';
import apiService from '../../services/api';
import CompanyLandingRenderer from '../LandingPage/CompanyLandingRenderer';
import HtmlTemplatePageViewer from '../LandingPage/HtmlTemplatePageViewer';
import HtmlSectionPropsEditor from '../../component/BusinessBranding/HtmlSectionPropsEditor';
import { wjsDebug } from '../../utils/wjsBuilderDebug';
import MediaLibraryPanel from '../../component/BusinessBranding/MediaLibraryPanel';
import LandingPageSeoPanel from '../../component/BusinessBranding/LandingPageSeoPanel';
import PreviewViewportFrame from '../../component/BusinessBranding/PreviewViewportFrame';
import { getTemplatePage, getTemplatePageRegistry } from '../../constants/templatePageRegistry';
import { getLandingPageTemplate } from '../../constants/landingPageTemplates';
import { patchSectionFromInlineEdit, patchSectionFromInlineDelete } from '../../utils/htmlTemplateInlineEditor';
import { patchSectionFromInlineEditForLocale } from '../../utils/landingPageContentLocale';
import { normalizeEditorContentLocale } from '../../utils/landingPageEditorContentLocale';
import {
  patchPageTitleForLocale,
  patchSeoInLocalePack,
  resolveGlobalNavForLocale,
  resolvePageTitleForLocale,
  resolveSectionSidebarLabel,
  resolveSeoForLocale,
} from '../../utils/landingPageLocaleSeed';
import { mergePageSections } from '../../utils/htmlTemplateOverrides';
import {
  appendGlobalNavItem,
  buildHtmlPageFromRegistry,
  createHtmlSectionFromTemplate,
  duplicateHtmlSection,
  getAvailableSectionTypesForPage,
  getAvailableTemplatePages,
  reorderArray,
} from '../../utils/htmlBuilderHelpers';
import {
  SECTION_TYPES,
  createDefaultSection,
  createPageId,
  isCompanyBuilderContent,
  isHtmlBuilderContent,
  mergeHtmlTemplateContent,
} from '../../utils/companyLandingPageSchema';
import { scanLandingPagePublishReadiness } from '../../utils/landingPagePublishReadiness';
import LandingPagePublishWarningModal from '../../component/BusinessBranding/LandingPagePublishWarningModal';
import { useLanguage } from '../../context/LanguageContext';
import { getBrandingCopy, getLandingPageStatusMeta } from '../../i18n/businessAppI18n';
import BusinessAppLanguageSwitcher from '../../component/Layout/BusinessAppLanguageSwitcher';
import {
  LandingPageEditorUiProvider,
  useLandingPageEditorUi,
} from '../../context/LandingPageEditorUiContext';

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-semibold text-slate-600 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputCls(extra = '') {
  return `w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs ${extra}`;
}

function NavActionEditor({ value, onChange, pages, sections, ui }) {
  const sf = ui.sectionForm;
  const action = value || { type: 'anchor', target: '' };
  const set = (patch) => onChange({ ...action, ...patch });

  return (
    <div className="space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-[10px] font-bold text-slate-500 uppercase">{sf.navigation}</div>
      <select value={action.type || 'anchor'} onChange={(e) => set({ type: e.target.value, target: '' })} className={inputCls()}>
        {ui.navActions.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
      </select>
      {action.type === 'page' && (
        <select value={action.target || ''} onChange={(e) => set({ target: e.target.value })} className={inputCls()}>
          <option value="">{sf.selectPage}</option>
          {(pages || []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      )}
      {action.type === 'url' && (
        <input value={action.target || ''} onChange={(e) => set({ target: e.target.value })} placeholder="https://..." className={inputCls()} />
      )}
      {(action.type === 'anchor' || action.type === 'scroll') && (
        <select value={action.target || ''} onChange={(e) => set({ target: e.target.value })} className={inputCls()}>
          <option value="">{sf.selectSection}</option>
          {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.type} ({s.id.slice(-6)})</option>)}
        </select>
      )}
    </div>
  );
}

function SectionPropsEditor({ section, onChange, pages, allSections, ui }) {
  const sf = ui.sectionForm;
  const p = section.props || {};
  const setProp = (key, val) => onChange({ ...section, props: { ...p, [key]: val } });

  switch (section.type) {
    case 'hero':
      return (
        <>
          <Field label={sf.headline}><input value={p.headline || ''} onChange={(e) => setProp('headline', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.description}><textarea rows={2} value={p.subheadline || ''} onChange={(e) => setProp('subheadline', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.ctaText}><input value={p.ctaText || ''} onChange={(e) => setProp('ctaText', e.target.value)} className={inputCls()} /></Field>
          <NavActionEditor value={p.ctaAction} onChange={(v) => setProp('ctaAction', v)} pages={pages} sections={allSections} ui={ui} />
          <Field label={sf.mediaType}>
            <select value={p.mediaType || 'image'} onChange={(e) => setProp('mediaType', e.target.value)} className={inputCls()}>
              <option value="image">{sf.bgImage}</option>
              <option value="video">{sf.bgVideo}</option>
            </select>
          </Field>
          {p.mediaType === 'video' ? (
            <>
              <Field label={sf.videoUrl}><input value={p.videoUrl || ''} onChange={(e) => setProp('videoUrl', e.target.value)} className={inputCls()} /></Field>
              <Field label={sf.poster}><input value={p.posterUrl || ''} onChange={(e) => setProp('posterUrl', e.target.value)} className={inputCls()} /></Field>
            </>
          ) : (
            <Field label={sf.bgImageUrl}><input value={p.imageUrl || ''} onChange={(e) => setProp('imageUrl', e.target.value)} className={inputCls()} /></Field>
          )}
          <Field label={sf.overlayOpacity}>
            <input type="number" min={0} max={1} step={0.05} value={p.overlayOpacity ?? 0.35} onChange={(e) => setProp('overlayOpacity', Number(e.target.value))} className={inputCls()} />
          </Field>
        </>
      );
    case 'text_image':
      return (
        <>
          <Field label={sf.headline}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.subtitle}><input value={p.subtitle || ''} onChange={(e) => setProp('subtitle', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.body}><textarea rows={4} value={p.body || ''} onChange={(e) => setProp('body', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.imageUrl}><input value={p.imageUrl || ''} onChange={(e) => setProp('imageUrl', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.imagePosition}>
            <select value={p.imagePosition || 'right'} onChange={(e) => setProp('imagePosition', e.target.value)} className={inputCls()}>
              <option value="right">{sf.imageRight}</option>
              <option value="left">{sf.imageLeft}</option>
            </select>
          </Field>
        </>
      );
    case 'features':
      return (
        <>
          <Field label={sf.sectionTitle}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          {(p.items || []).map((item, i) => (
            <div key={i} className="mb-2 p-2 border rounded-lg">
              <Field label={sf.itemTitle(i + 1)}><input value={item.title || ''} onChange={(e) => {
                const items = [...(p.items || [])];
                items[i] = { ...items[i], title: e.target.value };
                setProp('items', items);
              }} className={inputCls()} /></Field>
              <Field label={sf.description}><textarea rows={2} value={item.body || ''} onChange={(e) => {
                const items = [...(p.items || [])];
                items[i] = { ...items[i], body: e.target.value };
                setProp('items', items);
              }} className={inputCls()} /></Field>
            </div>
          ))}
          <button type="button" onClick={() => setProp('items', [...(p.items || []), { title: sf.newItemTitle, body: '' }])} className="text-[10px] text-blue-600 font-semibold">{sf.addItem}</button>
        </>
      );
    case 'gallery':
      return (
        <>
          <Field label={sf.headline}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          {(p.images || []).map((img, i) => (
            <div key={i} className="mb-2 p-2 border rounded-lg">
              <Field label={`${sf.imageUrl} ${i + 1}`}><input value={img.url || ''} onChange={(e) => {
                const images = [...(p.images || [])];
                images[i] = { ...images[i], url: e.target.value };
                setProp('images', images);
              }} className={inputCls()} /></Field>
              <Field label={sf.caption}><input value={img.caption || ''} onChange={(e) => {
                const images = [...(p.images || [])];
                images[i] = { ...images[i], caption: e.target.value };
                setProp('images', images);
              }} className={inputCls()} /></Field>
            </div>
          ))}
          <button type="button" onClick={() => setProp('images', [...(p.images || []), { url: '', caption: '' }])} className="text-[10px] text-blue-600 font-semibold">{sf.addImage}</button>
        </>
      );
    case 'video':
      return (
        <>
          <Field label={sf.headline}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.videoUrl}><input value={p.videoUrl || ''} onChange={(e) => setProp('videoUrl', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.poster}><input value={p.posterUrl || ''} onChange={(e) => setProp('posterUrl', e.target.value)} className={inputCls()} /></Field>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={!!p.autoplay} onChange={(e) => setProp('autoplay', e.target.checked)} />
            {sf.autoplayMuted}
          </label>
        </>
      );
    case 'cta':
      return (
        <>
          <Field label={sf.headline}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.body}><textarea rows={2} value={p.body || ''} onChange={(e) => setProp('body', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.button}><input value={p.buttonText || ''} onChange={(e) => setProp('buttonText', e.target.value)} className={inputCls()} /></Field>
          <NavActionEditor value={p.buttonAction} onChange={(v) => setProp('buttonAction', v)} pages={pages} sections={allSections} ui={ui} />
          <Field label={sf.bgColor}><input type="color" value={p.backgroundColor || '#2563eb'} onChange={(e) => setProp('backgroundColor', e.target.value)} className="w-full h-8 rounded cursor-pointer" /></Field>
        </>
      );
    case 'form':
      return (
        <>
          <Field label={sf.formTitle}><input value={p.title || ''} onChange={(e) => setProp('title', e.target.value)} className={inputCls()} /></Field>
          <Field label={sf.submitText}><input value={p.submitText || ''} onChange={(e) => setProp('submitText', e.target.value)} className={inputCls()} /></Field>
        </>
      );
    case 'spacer':
      return (
        <Field label={sf.heightPx}>
          <input type="number" min={8} max={200} value={p.height || 48} onChange={(e) => setProp('height', Number(e.target.value))} className={inputCls()} />
        </Field>
      );
    default:
      return <p className="text-xs text-slate-400">{ui.noProps}</p>;
  }
}

function BusinessLandingPageBuilderPage() {
  const { pageId } = useParams();
  const { language } = useLanguage();
  const contentLocale = normalizeEditorContentLocale(language);
  const brandingCopy = useMemo(() => getBrandingCopy(language), [language]);
  const lpCopy = useLandingPageEditorUi();
  const publishReadinessCopy = brandingCopy.publishReadiness;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [metaImage, setMetaImage] = useState('');
  const [activePageId, setActivePageId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [showSeo, setShowSeo] = useState(false);
  const [previewForm, setPreviewForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [panelSyncKey, setPanelSyncKey] = useState(0);
  const [scrollToSectionId, setScrollToSectionId] = useState(null);
  const [dragSectionId, setDragSectionId] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [publishWarningOpen, setPublishWarningOpen] = useState(false);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getBusinessLandingPageById(pageId);
      if (res?.success && res.data?.landingPage) {
        const lp = res.data.landingPage;
        if (!isCompanyBuilderContent(lp.content)) {
          window.location.replace(`/business/saiyo/pages/${pageId}/edit`);
          return;
        }
        setPage(lp);
        setTitle(lp.title || '');
        let loadedContent = lp.content || {};
        const effectiveTemplateKey = lp.templateKey || loadedContent.templateKey;
        if (effectiveTemplateKey && loadedContent.templateKey !== effectiveTemplateKey) {
          loadedContent = { ...loadedContent, templateKey: effectiveTemplateKey };
        }
        const flatSeo = {
          metaTitle: lp.metaTitle || '',
          metaDescription: lp.metaDescription || '',
          metaKeywords: lp.metaKeywords || '',
          ogTitle: lp.ogTitle || '',
          ogDescription: lp.ogDescription || '',
        };
        if (loadedContent.renderMode === 'html' && effectiveTemplateKey) {
          loadedContent = mergeHtmlTemplateContent(loadedContent, flatSeo);
        }
        wjsDebug('builder', 'loadPage', {
          pageId: lp.id,
          templateKey: loadedContent.templateKey,
          dbTemplateKey: lp.templateKey,
          folder: loadedContent.theme?.folder,
        });
        setContent(loadedContent);
        setMetaTitle(lp.metaTitle || '');
        setMetaDescription(lp.metaDescription || '');
        setMetaKeywords(lp.metaKeywords || '');
        setOgTitle(lp.ogTitle || '');
        setOgDescription(lp.ogDescription || '');
        setMetaImage(lp.metaImage || '');
        const firstPage = loadedContent.pages?.[0];
        if (firstPage) {
          setActivePageId(firstPage.id);
          const mergedSections = loadedContent.renderMode === 'html'
            ? mergePageSections(firstPage, loadedContent.templateKey)
            : (firstPage.sections || []);
          setSelectedSectionId(mergedSections[0]?.id || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const pages = content?.pages || [];
  const htmlMode = isHtmlBuilderContent(content);

  useEffect(() => {
    if (htmlMode) setPanelSyncKey((k) => k + 1);
  }, [contentLocale, htmlMode]);
  const templateKey = content?.templateKey || page?.templateKey;
  const activeTemplateMeta = templateKey ? getLandingPageTemplate(templateKey) : null;
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const registryPage = htmlMode && activePage?.templatePageId
    ? getTemplatePage(templateKey, activePage.templatePageId)
    : null;
  const displaySections = htmlMode && activePage
    ? mergePageSections(activePage, templateKey)
    : (activePage?.sections || []);
  const visibleSections = htmlMode
    ? displaySections.filter((s) => s.visible !== false && !s.decorative)
    : displaySections;
  const hiddenSections = htmlMode
    ? displaySections.filter((s) => s.visible === false)
    : [];
  const isHeaderSelected = selectedSectionId === '__header__';
  const selectedSection = isHeaderSelected
    ? null
    : (displaySections.find((s) => s.id === selectedSectionId) || null);

  const previewData = useMemo(() => {
    if (!page || !content) return null;
    return { ...page, content };
  }, [page, content]);

  const publishScan = useMemo(
    () => scanLandingPagePublishReadiness(content, { pageTitle: title }),
    [content, title],
  );
  const incompleteSectionIds = publishScan.sectionIds;
  const headerNeedsReview = publishScan.issues.some((i) => i.type === 'sampleCompany' && !i.sectionId);

  const templateRegistry = htmlMode ? getTemplatePageRegistry(templateKey) : null;
  const htmlGlobals = useMemo(() => {
    const localePack = content?.localePack;
    const packSite = localePack?.[contentLocale];
    const announcement = packSite?.announcement ?? content?.announcement;
    const globalNav = resolveGlobalNavForLocale(
      content?.globalNav || [],
      contentLocale,
      localePack,
    );
    return {
      companyName: content?.companyName,
      logoText: content?.sharedBlocks?.logoText || content?.companyName,
      logoHidden: content?.sharedBlocks?.logoHidden,
      announcement,
      theme: content?.theme,
      globalNav,
      pages: content?.pages,
      currentTemplatePageId: activePage?.templatePageId,
      registryNav: templateRegistry?.nav || [],
      sharedBlocks: {
        ...templateRegistry?.sharedBlocks,
        ...content?.sharedBlocks,
      },
    };
  }, [
    content?.companyName,
    content?.sharedBlocks,
    content?.announcement,
    content?.theme,
    content?.globalNav,
    content?.pages,
    content?.localePack,
    contentLocale,
    activePage?.templatePageId,
    templateRegistry,
  ]);

  const updateContent = (patch) => setContent((prev) => ({ ...prev, ...patch }));

  const updatePage = (pageIdToUpdate, patch) => {
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages || []).map((p) => (p.id === pageIdToUpdate ? { ...p, ...patch } : p)),
    }));
  };

  const getEditablePageSections = () => {
    if (!activePage) return [];
    return htmlMode ? mergePageSections(activePage, templateKey) : (activePage.sections || []);
  };

  const savePageSections = (sections) => {
    if (!activePage) return;
    updatePage(activePage.id, { sections });
  };

  const updateSection = (sectionId, patch) => {
    if (!activePage) return;
    const updated = getEditablePageSections().map((s) => (
      s.id === sectionId ? { ...s, ...patch } : s
    ));
    savePageSections(updated);
  };

  const isBuiltInRegistrySection = (sectionId) => {
    const regPage = getTemplatePage(templateKey, activePage?.templatePageId);
    return (regPage?.sections || []).some((s) => s.id === sectionId);
  };

  const bumpPreview = () => setPanelSyncKey((k) => k + 1);

  const handleInlineBlockDelete = (payload) => {
    const { sectionId, blockKey, index } = payload;
    const sec = displaySections.find((s) => s.id === sectionId);
    if (!sec) return;
    if (!window.confirm(lpCopy.alerts.deleteBlock)) return;
    const next = patchSectionFromInlineDelete(sec, { blockKey, index });
    if (next === sec) {
      window.alert(lpCopy.alerts.keepOneBlock);
      return;
    }
    updateSection(sectionId, next);
    selectSection(sectionId);
    bumpPreview();
  };

  const handleInlineSectionEdit = (payload) => {
    const { sectionId } = payload;
    const sec = displaySections.find((s) => s.id === sectionId);
    if (!sec) {
      wjsDebug('builder', 'inline edit — section not found', sectionId);
      return;
    }
    const next = patchSectionFromInlineEditForLocale(
      sec,
      payload,
      contentLocale,
      patchSectionFromInlineEdit,
    );
    wjsDebug('builder', 'inline edit', { sectionId, field: payload.field, editType: payload.editType });
    updateSection(sectionId, next);
    const isImageEdit = payload.editType === 'clear-image'
      || payload.imageUrl
      || (payload.field && String(payload.field).includes('image'));
    if (isImageEdit) bumpPreview();
  };

  const moveSection = (sectionId, dir) => {
    if (!activePage) return;
    const sections = [...getEditablePageSections()];
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= sections.length) return;
    savePageSections(reorderArray(sections, idx, next));
    if (htmlMode) bumpPreview();
  };

  const selectSection = (sectionId, { scroll = false } = {}) => {
    setSelectedSectionId(sectionId);
    if (scroll) setScrollToSectionId(sectionId);
  };

  const handlePreviewNavigate = ({ pageId, anchor }) => {
    if (pageId && pageId !== activePageId) {
      setActivePageId(pageId);
      if (anchor) {
        const targetPage = pages.find((p) => p.id === pageId);
        const regPage = targetPage ? getTemplatePage(templateKey, targetPage.templatePageId) : null;
        const sec = regPage?.sections?.find((s) => s.anchor === anchor);
        if (sec) {
          setTimeout(() => selectSection(sec.id, { scroll: true }), 400);
        }
      }
      return;
    }
    if (anchor) {
      const sec = displaySections.find((s) => s.anchor === anchor);
      if (sec) selectSection(sec.id, { scroll: true });
    }
  };

  const handleHeaderEdit = (payload) => {
    if (payload.field === 'logoText') {
      updateContent({
        companyName: payload.value,
        sharedBlocks: {
          ...(content.sharedBlocks || {}),
          logoText: payload.value,
        },
      });
      bumpPreview();
    }
    if (payload.editType === 'clear-image') {
      updateContent({
        sharedBlocks: {
          ...(content.sharedBlocks || {}),
          logoImage: '',
          logoHidden: true,
        },
      });
      bumpPreview();
      return;
    }
    if (payload.field === 'logoImage' || payload.imageUrl) {
      updateContent({
        sharedBlocks: {
          ...(content.sharedBlocks || {}),
          logoImage: payload.imageUrl || payload.value || '',
          logoHidden: false,
        },
      });
      bumpPreview();
    }
  };

  const addMediaAsset = (item) => {
    const asset = {
      id: item.key || `media_${Date.now()}`,
      key: item.key,
      url: item.url,
      name: item.name || 'Ảnh',
    };
    const exists = (content.mediaAssets || []).some((a) => a.key === asset.key);
    if (exists) return;
    updateContent({ mediaAssets: [...(content.mediaAssets || []), asset] });
  };

  const handleMediaUpload = async (file) => {
    setMediaUploading(true);
    try {
      const res = await apiService.uploadBusinessLandingPageMedia(pageId, file);
      if (res?.success && res.data) {
        addMediaAsset(res.data);
      } else {
        window.alert(res?.message || lpCopy.uploadFailed);
      }
    } catch (e) {
      console.error(e);
      window.alert(lpCopy.uploadFailed);
    } finally {
      setMediaUploading(false);
    }
  };

  const handleImageFileDrop = async (payload) => {
    const { file, sectionId, field, index } = payload;
    if (!file) return;
    setMediaUploading(true);
    try {
      const res = await apiService.uploadBusinessLandingPageMedia(pageId, file);
      if (!res?.success || !res.data) {
        window.alert(res?.message || lpCopy.uploadFailed);
        return;
      }
      addMediaAsset(res.data);
      const storeValue = res.data.key || res.data.url;
      if (sectionId === '__header__') {
        handleHeaderEdit({ field: 'logoImage', imageUrl: storeValue, value: storeValue });
      } else {
        const sec = displaySections.find((s) => s.id === sectionId);
        if (!sec) return;
        const next = patchSectionFromInlineEdit(sec, {
          sectionId,
          field,
          index,
          value: storeValue,
          imageUrl: storeValue,
        });
        updateSection(sectionId, next);
        bumpPreview();
      }
      selectSection(sectionId);
    } catch (e) {
      console.error(e);
      window.alert(lpCopy.uploadFailed);
    } finally {
      setMediaUploading(false);
    }
  };

  const removeSection = (sectionId) => {
    if (!activePage) return;
    const merged = getEditablePageSections();
    const builtIn = htmlMode && isBuiltInRegistrySection(sectionId);

    if (builtIn) {
      if (!window.confirm(lpCopy.alerts.hideSection)) return;
      savePageSections(merged.map((s) => (s.id === sectionId ? { ...s, visible: false } : s)));
    } else if (htmlMode) {
      if (!window.confirm(lpCopy.alerts.deleteSectionFromPage)) return;
      savePageSections(merged.filter((s) => s.id !== sectionId));
    } else {
      if (!window.confirm(lpCopy.alerts.deleteSection)) return;
      const sections = merged.filter((s) => s.id !== sectionId);
      savePageSections(sections);
    }

    bumpPreview();
    if (selectedSectionId === sectionId) {
      const remaining = merged.filter((s) => s.id !== sectionId && s.visible !== false && !s.decorative);
      selectSection(remaining[0]?.id || null);
    }
  };

  const restoreSection = (sectionId) => {
    updateSection(sectionId, { visible: true });
    bumpPreview();
  };

  const duplicateSection = (sectionId) => {
    if (!activePage) return;
    const sec = getEditablePageSections().find((s) => s.id === sectionId);
    if (!sec) return;
    const dup = duplicateHtmlSection(sec);
    const sections = [...getEditablePageSections()];
    const idx = sections.findIndex((s) => s.id === sectionId);
    sections.splice(idx + 1, 0, dup);
    savePageSections(sections);
    selectSection(dup.id);
    bumpPreview();
  };

  const addHtmlSection = () => {
    if (!activePage?.templatePageId) return;
    const types = getAvailableSectionTypesForPage(templateKey, activePage.templatePageId);
    if (!types.length) return;
    const typeLines = types.map((t, i) => `${i + 1}. ${t.label}`).join('\n');
    const raw = types.length === 1 ? '1' : window.prompt(lpCopy.alerts.pickSectionType(typeLines), '1');
    const picked = types[Number(raw) - 1]?.type;
    if (!picked) return;
    const sec = createHtmlSectionFromTemplate(templateKey, activePage.templatePageId, picked);
    if (!sec) return;
    savePageSections([...getEditablePageSections(), sec]);
    selectSection(sec.id);
    bumpPreview();
  };

  const addHtmlPage = () => {
    const available = getAvailableTemplatePages(templateKey, pages);
    if (!available.length) {
      window.alert(lpCopy.alerts.allTemplatePagesAdded);
      return;
    }
    const label = available.map((p, i) => `${i + 1}. ${p.title} (${p.file})`).join('\n');
    const pick = Number(window.prompt(lpCopy.alerts.pickTemplatePage(label), '1')) - 1;
    const tpl = available[pick];
    if (!tpl) return;
    const newPage = buildHtmlPageFromRegistry(templateKey, tpl.id, { companyName: content.companyName });
    if (!newPage) return;
    updateContent({
      pages: [...pages, newPage],
      globalNav: appendGlobalNavItem(content.globalNav || [], newPage, tpl.titleJa || tpl.title),
    });
    setActivePageId(newPage.id);
    selectSection(newPage.sections?.[0]?.id || null);
    bumpPreview();
  };

  const handleSectionDrop = (targetSectionId) => {
    if (!dragSectionId || !activePage || dragSectionId === targetSectionId) return;
    const sections = [...getEditablePageSections()];
    const from = sections.findIndex((s) => s.id === dragSectionId);
    const to = sections.findIndex((s) => s.id === targetSectionId);
    if (from < 0 || to < 0) return;
    savePageSections(reorderArray(sections, from, to));
    setDragSectionId(null);
    bumpPreview();
  };

  const addSection = (type) => {
    if (!activePage) return;
    const sec = createDefaultSection(type);
    updatePage(activePage.id, { sections: [...(activePage.sections || []), sec] });
    setSelectedSectionId(sec.id);
  };

  const addPage = () => {
    const id = createPageId();
    const slug = `page-${pages.length + 1}`;
    const newPage = {
      id,
      slug,
      title: `Trang ${pages.length + 1}`,
      isHome: false,
      sections: [createDefaultSection('hero')],
    };
    const nextPages = [...pages, newPage];
    updateContent({
      pages: nextPages,
      globalNav: [
        ...(content.globalNav || []),
        { pageId: id, label: newPage.title, slug },
      ],
    });
    setActivePageId(id);
    setSelectedSectionId(newPage.sections[0].id);
  };

  const seoPayload = {
    metaTitle,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    metaImage,
  };

  const panelSeo = useMemo(
    () => resolveSeoForLocale(content, contentLocale, seoPayload),
    [content, contentLocale, metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription],
  );

  const handleSeoChange = (patch) => {
    setContent((prev) => (prev ? patchSeoInLocalePack(prev, contentLocale, patch) : prev));
    if (contentLocale === 'vi') {
      if (patch.metaTitle != null) setMetaTitle(patch.metaTitle);
      if (patch.metaDescription != null) setMetaDescription(patch.metaDescription);
      if (patch.metaKeywords != null) setMetaKeywords(patch.metaKeywords);
      if (patch.ogTitle != null) setOgTitle(patch.ogTitle);
      if (patch.ogDescription != null) setOgDescription(patch.ogDescription);
    }
    if (patch.metaImage != null) setMetaImage(patch.metaImage);
    if (htmlMode) bumpPreview();
  };

  const handleOgImageUpload = async (file) => {
    setMediaUploading(true);
    try {
      const res = await apiService.uploadBusinessLandingPageMedia(pageId, file);
      if (res?.success && res.data) {
        const storeValue = res.data.key || res.data.url;
        setMetaImage(storeValue);
        addMediaAsset(res.data);
      } else {
        window.alert(res?.message || lpCopy.uploadFailed);
      }
    } catch (e) {
      console.error(e);
      window.alert(lpCopy.uploadFailed);
    } finally {
      setMediaUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiService.updateBusinessLandingPage(pageId, {
        title,
        content,
        ...seoPayload,
        regenerateSeo: false,
      });
      if (res?.success) {
        setPage(res.data.landingPage);
      } else {
        alert(res?.message || lpCopy.saveFailed);
      }
    } catch (e) {
      console.error(e);
      alert(lpCopy.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const runPublish = async () => {
    setPublishing(true);
    try {
      await apiService.updateBusinessLandingPage(pageId, { title, content, ...seoPayload });
      const res = await apiService.publishBusinessLandingPage(pageId);
      if (res?.success) {
        setPage(res.data.landingPage);
        setPublishWarningOpen(false);
        alert(lpCopy.publishedShort);
      } else {
        alert(res?.message || lpCopy.publishFailed);
      }
    } catch (e) {
      console.error(e);
      alert(lpCopy.publishFailed);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = () => {
    const { issues } = scanLandingPagePublishReadiness(content, { pageTitle: title });
    if (issues.length > 0) {
      setPublishWarningOpen(true);
      return;
    }
    if (!window.confirm(lpCopy.publishSiteConfirm)) return;
    runPublish();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {lpCopy.loadingBuilder}
      </div>
    );
  }

  if (!page || !content) {
    return (
      <div className="p-6 text-center text-slate-500">
        {lpCopy.notFound}
        <Link to="/business/saiyo" className="block mt-2 text-blue-600 text-sm">{lpCopy.backSaiyo}</Link>
      </div>
    );
  }

  const st = getLandingPageStatusMeta(page.status, language);
  const publicUrl = `${window.location.origin}${page.publicPath || `/lp/${page.slug}`}`;
  const previewPageSlug = activePage?.isHome ? '' : (activePage?.slug || '');

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <Link to="/business/saiyo" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-sm font-bold border-0 focus:ring-0 bg-transparent text-slate-800"
          placeholder={lpCopy.pageNamePlaceholder}
        />
        <BusinessAppLanguageSwitcher dense showLabel label={lpCopy.uiLanguageLabel} />
        {htmlMode && activeTemplateMeta && (
          <span
            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color: activeTemplateMeta.previewColor,
              borderColor: `${activeTemplateMeta.previewColor}44`,
              background: `${activeTemplateMeta.previewColor}12`,
            }}
            title={`templateKey: ${templateKey}`}
          >
            {activeTemplateMeta.name}
          </span>
        )}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
          {st.label}
        </span>
        {page.status === 1 && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> {lpCopy.publicLink}
          </a>
        )}
        <button type="button" onClick={() => setShowSeo((v) => !v)} className="text-[10px] px-2 py-1 border rounded-lg text-slate-600" title={lpCopy.seoHint}>
          {lpCopy.seo}
        </button>
        <button type="button" disabled={saving} onClick={handleSave} className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg disabled:opacity-50">
          <Save className="w-3.5 h-3.5" />
          {saving ? lpCopy.saving : lpCopy.save}
        </button>
        <button type="button" disabled={publishing} onClick={handlePublish} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          <Send className="w-3.5 h-3.5" />
          {publishing ? lpCopy.publishing : lpCopy.publish}
        </button>
      </header>

      {showSeo && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-2 text-[10px] text-amber-800">
          {lpCopy.seoHint}
        </div>
      )}

      {publishScan.issues.length > 0 && (
        <div className="shrink-0 border-b border-amber-100 bg-amber-50/90 px-4 py-1.5 text-[10px] text-amber-900">
          {publishReadinessCopy.editorBanner(publishScan.issues.length)}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Left: pages + sections */}
        <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{lpCopy.pages}</span>
              <button
                type="button"
                onClick={htmlMode ? addHtmlPage : addPage}
                className="p-0.5 text-blue-600"
                title={htmlMode ? lpCopy.addPageFromTemplate : lpCopy.addPage}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePageId(p.id);
                  const reg = htmlMode ? getTemplatePage(templateKey, p.templatePageId) : null;
                  const secs = p.sections?.length ? p.sections : (reg?.sections || []);
                  const first = secs.find((s) => s.visible !== false && !s.decorative) || secs[0];
                  selectSection(first?.id || null);
                  if (htmlMode) bumpPreview();
                }}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg mb-0.5 ${activePageId === p.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {resolvePageTitleForLocale(p, contentLocale)}{p.isHome ? lpCopy.homeSuffix : ''}
                {htmlMode && p.sourceFile && (
                  <span className="block text-[9px] text-slate-400 font-normal">{p.sourceFile}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{lpCopy.sections}</span>
              {htmlMode && (
                <button type="button" onClick={addHtmlSection} className="p-0.5 text-blue-600" title={lpCopy.addSection}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {htmlMode && (
              <div
                className={`flex items-center gap-1 mb-1 rounded-lg border ${isHeaderSelected ? 'border-blue-400 bg-blue-50' : headerNeedsReview ? 'border-amber-300 bg-amber-50/80' : 'border-slate-100'}`}
              >
                <button
                  type="button"
                  onClick={() => selectSection('__header__', { scroll: true })}
                  className="flex-1 text-left text-[11px] px-2 py-1.5 truncate"
                >
                  {lpCopy.logoHeader}
                  {headerNeedsReview ? (
                    <span className="ml-1 text-[9px] font-bold text-amber-600">{publishReadinessCopy.sectionFlag}</span>
                  ) : null}
                </button>
              </div>
            )}

            {visibleSections.map((s) => {
              const meta = SECTION_TYPES.find((t) => t.type === s.type);
              return (
                <div
                  key={s.id}
                  draggable={htmlMode}
                  onDragStart={htmlMode ? () => setDragSectionId(s.id) : undefined}
                  onDragOver={htmlMode ? (e) => e.preventDefault() : undefined}
                  onDrop={htmlMode ? () => handleSectionDrop(s.id) : undefined}
                  className={`flex items-center gap-0.5 mb-1 rounded-lg border ${selectedSectionId === s.id ? 'border-blue-400 bg-blue-50' : incompleteSectionIds.has(s.id) ? 'border-amber-300 bg-amber-50/70' : 'border-slate-100'} ${htmlMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {htmlMode && <GripVertical className="w-3 h-3 text-slate-300 shrink-0 ml-0.5" />}
                  <button type="button" onClick={() => selectSection(s.id, { scroll: true })} className="flex-1 text-left text-[11px] px-1 py-1.5 truncate">
                    {resolveSectionSidebarLabel(s, templateKey, contentLocale, meta?.label || s.type)}
                    {incompleteSectionIds.has(s.id) ? (
                      <span className="ml-1 text-[9px] font-bold text-amber-600">{publishReadinessCopy.sectionFlag}</span>
                    ) : null}
                  </button>
                  <button type="button" onClick={() => moveSection(s.id, -1)} className="p-0.5 text-slate-400 hover:text-slate-600" title={lpCopy.moveUp}>
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveSection(s.id, 1)} className="p-0.5 text-slate-400 hover:text-slate-600" title={lpCopy.moveDown}>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {htmlMode && (
                    <button type="button" onClick={() => duplicateSection(s.id)} className="p-0.5 text-slate-400 hover:text-blue-600" title={lpCopy.duplicate}>
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                  <button type="button" onClick={() => removeSection(s.id)} className="p-0.5 text-red-400 hover:text-red-600" title={htmlMode ? lpCopy.hideSection : lpCopy.deleteSection}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {htmlMode && hiddenSections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{lpCopy.hiddenSections}</span>
                {hiddenSections.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 mb-1 rounded-lg border border-dashed border-slate-200 opacity-60">
                    <span className="flex-1 text-[10px] px-2 py-1 truncate text-slate-500">
                      {resolveSectionSidebarLabel(s, templateKey, contentLocale, s.type)}
                    </span>
                    <button type="button" onClick={() => { restoreSection(s.id); selectSection(s.id, { scroll: true }); }} className="text-[9px] px-1.5 py-0.5 text-blue-600">
                      {lpCopy.showSection}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!htmlMode && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {SECTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => addSection(t.type)}
                  className="text-[9px] px-1 py-1 border border-dashed border-slate-200 rounded text-slate-500 hover:border-blue-300 hover:text-blue-600"
                >
                  + {t.label}
                </button>
              ))}
            </div>
            )}
            {htmlMode && registryPage && (
              <p className="mt-2 text-[9px] text-slate-400 leading-relaxed">
                {lpCopy.dragHintRegistry(registryPage.file)}
              </p>
            )}
          </div>
        </aside>

        {/* Center: preview */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-200">
          <PreviewViewportFrame
            title={lpCopy.previewPageTitle(activePage?.title)}
            storageKey={`wjs-lp-preview-width-${pageId}`}
          >
            {htmlMode && activePage?.templatePageId ? (
              <HtmlTemplatePageViewer
                templateKey={templateKey}
                pageId={activePage.templatePageId}
                title={resolvePageTitleForLocale(activePage, contentLocale)}
                sections={displaySections}
                globals={htmlGlobals}
                contentLocale={contentLocale}
                editable
                selectedSectionId={selectedSectionId}
                scrollToSectionId={scrollToSectionId}
                onSelectSection={selectSection}
                onSectionEdit={handleInlineSectionEdit}
                onHeaderEdit={handleHeaderEdit}
                onBlockDelete={handleInlineBlockDelete}
                onImageFileDrop={handleImageFileDrop}
                syncKey={panelSyncKey}
                onNavigatePage={handlePreviewNavigate}
                onScrollToSection={(id) => selectSection(id, { scroll: true })}
                onScrollToSectionComplete={() => setScrollToSectionId(null)}
              />
            ) : (
              <CompanyLandingRenderer
                data={previewData}
                pageSlug={previewPageSlug}
                preview
                form={previewForm}
                setForm={setPreviewForm}
                onSubmit={(e) => e.preventDefault()}
              />
            )}
          </PreviewViewportFrame>
        </main>

        {/* Right: properties */}
        <aside className="w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto p-3">
          <LandingPageSeoPanel
            metaTitle={panelSeo.metaTitle}
            metaDescription={panelSeo.metaDescription}
            metaKeywords={panelSeo.metaKeywords}
            ogTitle={panelSeo.ogTitle}
            ogDescription={panelSeo.ogDescription}
            metaImage={metaImage}
            onChange={handleSeoChange}
            onUploadOgImage={handleOgImageUpload}
            uploading={mediaUploading}
          />

          {activePage && (
            <div className="mb-4 pb-3 border-b">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{lpCopy.editingPage}</div>
              <Field label={lpCopy.pageTitle}>
                <input
                  value={resolvePageTitleForLocale(activePage, contentLocale)}
                  onChange={(e) => {
                    setContent((prev) => patchPageTitleForLocale(prev, activePage.id, contentLocale, e.target.value));
                    if (contentLocale === 'vi') {
                      updatePage(activePage.id, { title: e.target.value });
                    } else if (contentLocale === 'ja') {
                      updatePage(activePage.id, { titleJa: e.target.value });
                    }
                    bumpPreview();
                  }}
                  className={inputCls()}
                />
              </Field>
              {!activePage.isHome && (
                <Field label={lpCopy.pageSlug}>
                  <input value={activePage.slug || ''} onChange={(e) => updatePage(activePage.id, { slug: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })} className={inputCls()} />
                </Field>
              )}
            </div>
          )}

          <div className="mb-4 pb-3 border-b">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{lpCopy.siteWide}</div>
            <Field label={lpCopy.companyDisplayName}>
              <input
                value={content.companyName || ''}
                onChange={(e) => {
                  updateContent({
                    companyName: e.target.value,
                    sharedBlocks: {
                      ...(content.sharedBlocks || {}),
                      logoText: e.target.value,
                    },
                  });
                  if (htmlMode) bumpPreview();
                }}
                className={inputCls()}
              />
            </Field>
            <Field label={lpCopy.announcement}>
              <input value={content.announcement || ''} onChange={(e) => updateContent({ announcement: e.target.value })} className={inputCls()} />
            </Field>
            <Field label={lpCopy.primaryColor}>
              <input type="color" value={content.theme?.primaryColor || '#2563eb'} onChange={(e) => updateContent({ theme: { ...content.theme, primaryColor: e.target.value } })} className="w-full h-8 rounded cursor-pointer" />
            </Field>
          </div>

          {isHeaderSelected && htmlMode ? (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{lpCopy.logoPanelTitle}</div>
              <p className="text-[10px] text-blue-600 bg-blue-50 rounded-lg px-2 py-1.5 mb-3 leading-relaxed">
                {lpCopy.logoPanelHint}
              </p>
              <Field label={lpCopy.logoText}>
                <input
                  value={content.sharedBlocks?.logoText || content.companyName || ''}
                  onChange={(e) => {
                  handleHeaderEdit({ field: 'logoText', value: e.target.value });
                }}
                  className={inputCls()}
                />
              </Field>
              <div className="mt-4 pt-3 border-t">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{lpCopy.globalNav}</div>
                {(content.globalNav || []).map((nav, i) => {
                  const navPage = pages.find((p) => p.id === nav.pageId);
                  return (
                    <div key={nav.pageId || i} className="mb-2 p-2 border rounded-lg bg-slate-50">
                      <Field label={lpCopy.navLabel}>
                        <input
                          value={nav.label || ''}
                          onChange={(e) => {
                            const globalNav = [...(content.globalNav || [])];
                            globalNav[i] = { ...globalNav[i], label: e.target.value };
                            updateContent({ globalNav });
                            bumpPreview();
                          }}
                          className={inputCls()}
                        />
                      </Field>
                      <p className="text-[9px] text-slate-400 mb-1">{lpCopy.navPagePrefix(navPage?.title || nav.templatePageId)}</p>
                      <Field label={lpCopy.navAnchor} hint={lpCopy.navAnchorHint}>
                        <input
                          value={nav.anchor || ''}
                          onChange={(e) => {
                            const globalNav = [...(content.globalNav || [])];
                            globalNav[i] = { ...globalNav[i], anchor: e.target.value.replace(/^#/, '') || null };
                            updateContent({ globalNav });
                            bumpPreview();
                          }}
                          className={inputCls()}
                          placeholder="koe, plan, flow..."
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </>
          ) : selectedSection ? (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                {resolveSectionSidebarLabel(
                  selectedSection,
                  templateKey,
                  contentLocale,
                  SECTION_TYPES.find((t) => t.type === selectedSection.type)?.label || selectedSection.type,
                )}
              </div>
              {htmlMode ? (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedSection.visible !== false}
                      onChange={(e) => {
                        updateSection(selectedSection.id, { visible: e.target.checked });
                        bumpPreview();
                      }}
                    />
                    {lpCopy.showSectionOnPage}
                  </label>
                  <p className="text-[10px] text-blue-600 bg-blue-50 rounded-lg px-2 py-1.5 mb-3 leading-relaxed">
                    {lpCopy.inlineHintExtended}
                  </p>
                  <HtmlSectionPropsEditor
                    section={selectedSection}
                    templateFolder={templateRegistry?.folder}
                    onChange={(next) => {
                      updateSection(selectedSection.id, next);
                      setPanelSyncKey((k) => k + 1);
                    }}
                  />
                </>
              ) : (
                <>
              <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                <input type="checkbox" checked={selectedSection.visible !== false} onChange={(e) => updateSection(selectedSection.id, { visible: e.target.checked })} />
                {lpCopy.showSectionShort}
              </label>
              <Field label={lpCopy.motion}>
                <select value={selectedSection.motion || 'none'} onChange={(e) => updateSection(selectedSection.id, { motion: e.target.value })} className={inputCls()}>
                  {lpCopy.motionPresets.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
              <SectionPropsEditor
                section={selectedSection}
                onChange={(next) => updateSection(selectedSection.id, next)}
                pages={pages}
                allSections={activePage?.sections || []}
                ui={lpCopy}
              />
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">{lpCopy.selectSection}</p>
          )}

          {htmlMode && (
            <MediaLibraryPanel
              assets={content?.mediaAssets || []}
              onUpload={handleMediaUpload}
              uploading={mediaUploading}
            />
          )}
        </aside>
      </div>

      <LandingPagePublishWarningModal
        open={publishWarningOpen}
        issues={publishScan.issues}
        copy={publishReadinessCopy}
        publishing={publishing}
        onClose={() => setPublishWarningOpen(false)}
        onEdit={() => setPublishWarningOpen(false)}
        onPublishAnyway={runPublish}
      />
    </div>
  );
}

export default function BusinessLandingPageBuilder() {
  return (
    <LandingPageEditorUiProvider>
      <BusinessLandingPageBuilderPage />
    </LandingPageEditorUiProvider>
  );
}
