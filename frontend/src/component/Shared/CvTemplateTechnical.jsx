import React, { useState, useCallback } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import ResizableCvTable from './ResizableCvTable';
import { alignRirekishoSectionColPercents, cvLayoutKey, CV_RIREKISHO_EDUCATION_COLS, CV_RIREKISHO_LANGUAGES_COLS, CV_RIREKISHO_PERSONAL_GRID_COLS, CV_RIREKISHO_TOOLS_COLS, normalizePersonalGridColPercents } from './cvLayoutKey';
import { useSyncCvRirekishoLabelColWidth } from '../../hooks/useSyncCvRirekishoLabelColWidth.js';
import { SupplementTplText } from './CvTemplateSupplementText.jsx';
import { CV_LINK } from './cvSupplementLinks.js';
import { SupplementMarkedText, SupplementFieldWrap } from './CandidateDetailSupplementMarks.jsx';
import {
  formatCvYearMonthJa,
  formatShokumuPeriodCell,
  formatShokumuPeriodRangeJa,
  formatCvDocumentHeaderJa,
  formatCvAnyDateJa,
  parseCvDateParts,
} from '../../utils/cvJpDateDisplay.js';
import CvTemplateItTechnicalCertTable from './CvTemplateItTechnicalCertTable.jsx';
import { withEducationYearsCalculated, calculateEducationYearsFromDates } from '../../utils/cvEducationUtils.js';
import CvTemplateDateTriplet from './CvTemplateDateTriplet.jsx';
import CvTemplateAvatarFrame from './CvTemplateAvatarFrame.jsx';
import {
  displayEditableScalarText,
  readContentEditableText,
  readContentEditableTextTrimmed,
} from '../../utils/cvEditableUtils.js';
import {
  TECH_EXPERIENCE_TOOLS_GRID,
  TECH_LEARNED_TOOLS_GRID,
  TECH_TOOLS_GRID_ROW_COUNT,
} from '../../constants/technicalToolsGrid.js';
import { CV_TPL_BODY_STYLE, CV_TPL_FONT_FAMILY, CV_TPL_FONT_TITLE, CV_TPL_TABLE_STYLE } from '../../utils/cvTemplateTypography.js';

const RESIDENCE_STATUS_LABELS = {
  '3': '留学',
  '1': '技術・人文知識・国際業務',
  '2': '特定技能',
  '9': '技能',
  '8': '高度専門職',
  '12': '企業内転勤',
  '13': '興行',
  '14': '技能実習',
  '10': '家族滞在',
  '5': '日本人の配偶者等',
  '15': '永住者の配偶者等',
  '6': '定住者',
  '4': '永住者',
  '11': '短期滞在',
  '7': '不要',
};
const RESIDENCE_STATUS_OPTIONS = Object.entries(RESIDENCE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

const CV_TPL = 'cv_technical';

/**
 * CvTemplateTechnical – giao diện form CV Kỹ thuật (履歴書 + 職務経歴書).
 * Rirekisho giống CV IT (trừ không bỏ bảng 使用可能ツール・ソフトウェア等枠).
 * Props:
 *   formData, setFormData
 *   activeTab (= cvTechnicalTab), setActiveTab (= setCvTechnicalTab)
 *   cvEditable, cvEditableBirthDate, cvEditableArray, cvEditableWithDefault
 *   getDefaultCvDate
 *   updateEmployment, updateEmploymentPair
 *   handleAddWorkExperience, handleInsertWorkExperienceAt, handleInsertWorkExperienceBlockAt (bảng 職歴 Rirekisho / 職務経歴 Shokumu)
 *   handleBackendPreviewWithOptions
 *   avatarPreview
 *   onAvatarFileSelect — đồng bộ ảnh với parent (preview PDF / submit)
 *   supplementMarking (optional admin)
 */
const CvTemplateTechnical = ({
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  cvEditable: cvEditableRaw,
  cvEditableBirthDate: cvEditableBirthDateRaw,
  cvEditableArray: cvEditableArrayRaw,
  cvEditableWithDefault: cvEditableWithDefaultRaw,
  getDefaultCvDate,
  updateEmployment,
  updateEmploymentPair,
  toggleShokumuCheckbox,
  handleAddWorkExperience,
  handleInsertWorkExperienceAt,
  handleInsertWorkExperienceBlockAt,
  handleBackendPreviewWithOptions,
  avatarPreview,
  onAvatarFileSelect,
  onCvTableLayoutCommit,
  supplementMarking,
  pdfExportMode = false,
  pdfSectionRefs = null,
  pdfCaptureParts = null,
  hideInternalTabs = false,
  forcedDocumentPart = null,
}) => {
  const layout = formData.cvTableLayout || {};
  const currentAvatarPreview = formData.avatarPreview || avatarPreview;
  const handleTemplateAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof onAvatarFileSelect === 'function') {
      onAvatarFileSelect(file);
      e.target.value = '';
      return;
    }
    if (typeof FileReader === 'undefined') return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setFormData((prev) => ({ ...prev, avatarPreview: result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const [hoveredEducationIndex, setHoveredEducationIndex] = useState(null);
  const [hoveredWorkIndex, setHoveredWorkIndex] = useState(null);
  const [hoveredToolExtraRowIndex, setHoveredToolExtraRowIndex] = useState(null);
  const [focusedInlineField, setFocusedInlineField] = useState(null);
  const startYearRefs = React.useRef([]);
  const startMonthRefs = React.useRef([]);
  const endYearRefs = React.useRef([]);
  const endMonthRefs = React.useRef([]);
  const shokumuStartYearRefs = React.useRef([]);
  const shokumuStartMonthRefs = React.useRef([]);
  const shokumuEndYearRefs = React.useRef([]);
  const shokumuEndMonthRefs = React.useRef([]);
  const birthDateParts = (() => {
    const raw = String(formData.birthDate || '').trim();
    const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return m ? { y: m[1], mo: String(parseInt(m[2], 10)).padStart(2, '0'), d: String(parseInt(m[3], 10)).padStart(2, '0') } : { y: '', mo: '', d: '' };
  })();
  const visaExpiryParts = parseCvDateParts(formData.visaExpirationDate);
  const birthYearRef = React.useRef(null);
  const birthMonthRef = React.useRef(null);
  const birthDayRef = React.useRef(null);
  const visaYearRef = React.useRef(null);
  const visaMonthRef = React.useRef(null);
  const visaDayRef = React.useRef(null);
  const [dateFieldErrors, setDateFieldErrors] = React.useState({ birthDate: '', visaExpirationDate: '' });
  const eduYearRefs = React.useRef([]);
  const eduMonthRefs = React.useRef([]);
  const eduEndYearRefs = React.useRef([]);
  const eduEndMonthRefs = React.useRef([]);
  const colSaved = (tab, tableId, fallback) =>
    layout[cvLayoutKey(CV_TPL, tab, tableId)]?.cols ?? fallback;
  const personalGridCols = normalizePersonalGridColPercents(
    colSaved('rirekisho', 'personalGrid_v3', CV_RIREKISHO_PERSONAL_GRID_COLS),
  );
  const sideLabelPct = personalGridCols[0] ?? CV_RIREKISHO_PERSONAL_GRID_COLS[0];
  const sectionCols = (tab, tableId, fallback) =>
    alignRirekishoSectionColPercents(colSaved(tab, tableId, fallback), sideLabelPct);
  const rirekishoBodyRef = React.useRef(null);
  useSyncCvRirekishoLabelColWidth(rirekishoBodyRef, [layout, sideLabelPct]);
  const sm = (templateFieldKey, formFieldKey) => ({ templateFieldKey, formFieldKey });
  const cvEditable = (field, className = '', style = {}, supp = null) =>
    cvEditableRaw(field, className, style, supp || sm(`tpl-it-${field}`, field));
  const cvEditableBirthDate = (className = '', style = {}, supp = null) =>
    cvEditableBirthDateRaw(className, style, supp || sm('tpl-it-birthDate', CV_LINK.birthDate));
  const cvEditableWithDefault = (
    field,
    defaultVal,
    className = '',
    style = {},
    displayTransform = (v) => v,
    supp = null
  ) =>
    cvEditableWithDefaultRaw(
      field,
      defaultVal,
      className,
      style,
      displayTransform,
      supp || sm(`tpl-tech-${field}-default`, field)
    );
  const cvEditableArray = (
    arrayName,
    index,
    subfield,
    className = '',
    style = {},
    displayValue = undefined,
    supp = null
  ) => {
    const formFieldKey = `${arrayName}-${index}-${subfield}`;
    return cvEditableArrayRaw(
      arrayName,
      index,
      subfield,
      className,
      style,
      displayValue,
      supp || sm(`tpl-tech-${formFieldKey}`, formFieldKey)
    );
  };
  const marks = formData.adminSupplementMarks || [];
  const renderMarked = (text, templateFieldKey, formFieldKey, linkedFieldKeys = []) => {
    const linked = [formFieldKey, ...linkedFieldKeys].filter(Boolean);
    if (formFieldKey && !String(formFieldKey).startsWith('label-') && !String(formFieldKey).startsWith('tpl-')) {
      linked.push(`label-${formFieldKey}`);
    }
    const inner = (
      <SupplementMarkedText
        text={String(text ?? '').trim() || '　'}
        fieldKey={templateFieldKey}
        allMarks={marks}
        linkedFieldKeys={[...new Set(linked)]}
      />
    );
    if (supplementMarking?.onFieldContextMenu && formFieldKey) {
      return (
        <SupplementFieldWrap
          fieldKey={formFieldKey}
          onContextMenu={(e) => supplementMarking.onFieldContextMenu(e, formFieldKey)}
          className="select-text inline min-w-0"
        >
          {inner}
        </SupplementFieldWrap>
      );
    }
    return <span className="select-text inline min-w-0">{inner}</span>;
  };

  /** contentEditable inline — đồng bộ ngay khi gõ, không dùng React children khi focus (tránh mất chữ khi re-render). */
  const makeInlineEditable = useCallback((fieldKey, storedValue, onCommit, options = {}) => {
    const multiline = options.multiline !== false;
    const isFocused = focusedInlineField === fieldKey;
    const stored = String(storedValue ?? '').replace(/\r\n?/g, '\n');
    const showText = displayEditableScalarText(stored, options.emptyPlaceholder ?? '　');
    const blurDisplayText =
      options.displayText != null
        ? displayEditableScalarText(String(options.displayText), options.emptyPlaceholder ?? '　')
        : showText;

    return {
      contentEditable: true,
      suppressContentEditableWarning: true,
      tabIndex: 0,
      className: options.className || '',
      style: {
        outline: 'none',
        minHeight: '1.2em',
        ...(multiline ? { whiteSpace: 'pre-wrap' } : {}),
        ...(options.style || {}),
      },
      onContextMenu: options.onContextMenu,
      ref: (node) => {
        if (!node || isFocused || document.activeElement === node) return;
        const next = blurDisplayText;
        if (node.textContent !== next) node.textContent = next;
      },
      onFocus: (e) => {
        setFocusedInlineField(fieldKey);
        const el = e.currentTarget;
        const t = stored.trim() ? stored : '';
        requestAnimationFrame(() => {
          if (el && document.activeElement === el) el.textContent = t;
        });
      },
      onInput: (e) => {
        const v = multiline
          ? readContentEditableText(e.currentTarget, true)
          : readContentEditableTextTrimmed(e.currentTarget);
        onCommit(v);
      },
      onBlur: (e) => {
        setFocusedInlineField((prev) => (prev === fieldKey ? null : prev));
        const v = multiline
          ? readContentEditableText(e.currentTarget, true)
          : readContentEditableTextTrimmed(e.currentTarget);
        onCommit(v);
      },
    };
  }, [focusedInlineField]);

  const makeMarkedInlineEditable = useCallback((fieldKey, storedValue, onCommit, markedContent, options = {}) => {
    const marks = formData.adminSupplementMarks || [];
    const useMarks = marks.length > 0 || supplementMarking?.onFieldContextMenu;
    const isFocused = focusedInlineField === fieldKey;
    const base = makeInlineEditable(fieldKey, storedValue, onCommit, options);
    return {
      ...base,
      ref: (node) => {
        if (!node) return;
        if (isFocused || document.activeElement === node) return;
        if (!isFocused && useMarks) {
          for (let c = node.firstChild; c; ) {
            const nx = c.nextSibling;
            if (c.nodeType === 3) node.removeChild(c);
            c = nx;
          }
          return;
        }
        base.ref?.(node);
      },
      children: (!isFocused && useMarks) ? markedContent : undefined,
    };
  }, [focusedInlineField, formData.adminSupplementMarks, makeInlineEditable, supplementMarking?.onFieldContextMenu]);

  const addressCombinedDisplay = [
    formData.postalCode ? `〒${formData.postalCode}` : '',
    formData.address || '',
  ].filter(Boolean).join(' ');

  const LANGUAGE_LEVEL_FIELDS = ['jpConversationLevel', 'enConversationLevel', 'otherConversationLevel'];
  const LANGUAGE_LEVEL_OPTIONS = [
    { value: 1, label: 'ネイティブ' },
    { value: 2, label: 'ビジネス' },
    { value: 3, label: '日常会話' },
  ];
  const normalizeConversationLevel = (value) => {
    if (value == null || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const normalizePart = (value, maxLen) => String(value || '').replace(/\D/g, '').slice(0, maxLen);
  const validateParts = (y, mo, d) => {
    if (!y && !mo && !d) return { ok: true, normalized: '', message: '' };
    if (y.length !== 4 || mo.length === 0 || d.length === 0) return { ok: false, message: 'Vui lòng nhập đủ năm, tháng, ngày.' };
    const yy = parseInt(y, 10), mm = parseInt(mo, 10), dd = parseInt(d, 10);
    if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd) || mm < 1 || mm > 12 || dd < 1 || dd > 31) return { ok: false, message: 'Ngày tháng không hợp lệ.' };
    const normalized = `${String(yy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const chk = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(chk.getTime()) || chk.getFullYear() !== yy || chk.getMonth() + 1 !== mm || chk.getDate() !== dd) return { ok: false, message: 'Ngày tháng không hợp lệ.' };
    return { ok: true, normalized, message: '' };
  };
  const clearDateError = (field) => setDateFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  const commitDateField = (field, refs, isBirth = false) => {
    const y = normalizePart(refs.y.current?.textContent, 4);
    const mo = normalizePart(refs.mo.current?.textContent, 2);
    const d = normalizePart(refs.d.current?.textContent, 2);
    const result = validateParts(y, mo, d);
    if (!y && !mo && !d) {
      setDateFieldErrors((prev) => ({ ...prev, [field]: '' }));
      setFormData((prev) => ({ ...prev, [field]: '', ...(isBirth ? { age: '' } : {}) }));
      return;
    }
    if (!result.ok) { setDateFieldErrors((prev) => ({ ...prev, [field]: result.message })); return; }
    setDateFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setFormData((prev) => ({ ...prev, [field]: result.normalized, ...(isBirth ? { age: '' } : {}) }));
  };
  const addEducationRow = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [...(prev.educations || []), { school_name: '', major: '', year: '', month: '', endYear: '', endMonth: '', years: '' }],
    }));
  };
  const eduTextCellClass = 'block w-full max-w-full break-words whitespace-pre-wrap text-center';
  const eduTextCellStyle = { display: 'block', width: '100%', maxWidth: '100%', wordBreak: 'keep-all', overflowWrap: 'break-word' };
  const eduWrapTdStyle = { borderColor: '#1f2937', wordBreak: 'keep-all', overflowWrap: 'break-word' };
  const syncEducationContent = (edu) => edu;
  const normalizeEduPart = (value, maxLen) => String(value || '').replace(/\D/g, '').slice(0, maxLen);
  const moveCaretToEnd = (el) => {
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {
        /* ignore */
      }
    });
  };
  const syncEduParts = (index, isEnd = false) => {
    const yearRef = isEnd ? eduEndYearRefs.current[index] : eduYearRefs.current[index];
    const monthRef = isEnd ? eduEndMonthRefs.current[index] : eduMonthRefs.current[index];
    const year = normalizeEduPart(yearRef?.textContent, 4);
    const month = normalizeEduPart(monthRef?.textContent, 2);
    setFormData((prev) => {
      const list = [...(prev.educations || [])];
      if (!list[index]) list[index] = {};
      list[index] = withEducationYearsCalculated({
        ...list[index],
        ...(isEnd ? { endYear: year, endMonth: month } : { year, month }),
      });
      return { ...prev, educations: list };
    });
  };
  const captureParts = forcedDocumentPart
    ? [forcedDocumentPart]
    : (pdfCaptureParts || ['rirekisho', 'shokumu']);
  const useCapturePartsVisibility = pdfExportMode || pdfCaptureParts != null || forcedDocumentPart != null;
  const showRirekisho = useCapturePartsVisibility ? captureParts.includes('rirekisho') : activeTab === 'rirekisho';
  const showShokumu = useCapturePartsVisibility ? captureParts.includes('shokumu') : activeTab === 'shokumu';
  return (
    <div style={{ fontFamily: CV_TPL_FONT_FAMILY }}>
      {/* Tab buttons */}
      {!pdfExportMode && !hideInternalTabs && !forcedDocumentPart && (
      <div className="flex border-b mb-2 -mt-0.5 font-bold" style={{ borderColor: '#e5e7eb' }}>
        <button
          type="button"
          onClick={() => setActiveTab('rirekisho')}
          className="flex items-center gap-1 px-3 py-1 text-xs font-bold transition-colors"
          style={{
            color: activeTab === 'rirekisho' ? '#2563eb' : '#6b7280',
            borderBottom: activeTab === 'rirekisho' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          【履歴書】フォーマット
          <ChevronDown className="w-3 h-3" style={{ color: 'inherit' }} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shokumu')}
          className="flex items-center gap-1 px-3 py-1 text-xs font-bold transition-colors"
          style={{
            color: activeTab === 'shokumu' ? '#2563eb' : '#6b7280',
            borderBottom: activeTab === 'shokumu' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          【職務経歴書】フォーマット
          <ChevronDown className="w-3 h-3" style={{ color: 'inherit' }} />
        </button>
      </div>
      )}

      {/* ===== 履歴書 (giống hệt IT) ===== */}
      {showRirekisho && (
        <div className="w-full min-w-0 max-w-full" ref={pdfSectionRefs?.rirekisho} data-cv-pdf-section="rirekisho">
          {!pdfExportMode && (
          <div className="flex items-center justify-end mb-2 cv-pdf-hide">
            <button
              type="button"
              onClick={() => handleBackendPreviewWithOptions('cv_technical', 'rirekisho')}
              className="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
              style={{ borderColor: '#d1d5db', color: '#2563eb' }}
            >
              Xem preview 【履歴書】
            </button>
          </div>
          )}
          <div ref={rirekishoBodyRef} className="w-full min-w-0 max-w-full cv-template-body" style={CV_TPL_BODY_STYLE}>
            <ResizableCvTable
              colPercents={personalGridCols}
              className="w-full border-collapse cv-personal-grid-v3"
              style={{ borderColor: '#1f2937' }}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'personalGrid_v3')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td colSpan={7} className="border p-2 text-center font-bold" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-rirekisho-banner" text="履歴書" supplementMarking={supplementMarking} className="select-text inline min-w-0" />
                  </td>
                </tr>
                <tr>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-furigana" text="フリガナ" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('nameKana', '')} /></td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-seinengappi" text="生年月日" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.birthDate]} className="select-text inline" />
                  </td>
                  <td className="border px-0.5 py-1 bg-white min-w-0 cv-personal-date-cell" style={{ borderColor: '#1f2937' }}>
                    <CvTemplateDateTriplet
                      field="birthDate"
                      refs={{ y: birthYearRef, mo: birthMonthRef, d: birthDayRef }}
                      parts={birthDateParts}
                      errorMessage={dateFieldErrors.birthDate}
                      onCommit={commitDateField}
                      onClearError={clearDateError}
                      isBirthField
                      compact
                    />
                  </td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-nenrei" text="年齢" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.age]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('age', '')} /></td>
                  <td rowSpan={5} className="border p-1 align-middle text-center cv-personal-avatar-col" style={{ borderColor: '#1f2937', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center gap-1.5">
                      {currentAvatarPreview ? (
                        <CvTemplateAvatarFrame
                          src={currentAvatarPreview}
                          frame={layout.avatarFrame}
                          onFrameChange={(nextFrame) =>
                            setFormData((prev) => ({
                              ...prev,
                              cvTableLayout: { ...(prev.cvTableLayout || {}), avatarFrame: nextFrame },
                            }))
                          }
                          width="4.125rem"
                          height="5.5rem"
                          interactive={!pdfExportMode}
                          className="mx-auto"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">&lt;顔写真&gt;</span>
                      )}
                      {!pdfExportMode && (
                      <label className="inline-flex items-center justify-center rounded border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer cv-pdf-hide">
                        <input type="file" accept="image/*" className="hidden" onChange={handleTemplateAvatarUpload} />
                        アップロード
                      </label>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-shimei" text="氏名" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKanji]} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('nameKanji', '')} /></td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-gender" text="性別" supplementMarking={supplementMarking} linkedFieldKeys={['gender']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.gender === '男'} onChange={() => setFormData(prev => ({ ...prev, gender: '男' }))} /> 男</label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.gender === '女'} onChange={() => setFormData(prev => ({ ...prev, gender: '女' }))} /> 女</label>
                    </div>
                  </td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-passport" text="パスポート" supplementMarking={supplementMarking} linkedFieldKeys={['passport']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.passport === '有' || formData.passport === '1'} onChange={() => setFormData(prev => ({ ...prev, passport: '有' }))} /> 有</label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.passport === '無' || formData.passport === '0'} onChange={() => setFormData(prev => ({ ...prev, passport: '無' }))} /> 無</label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-email" text="Email" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.email]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('email', '')} /></td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-denwa" text="電話" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.phone]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('phone', '')} /></td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-skypeId" text="Skype ID" supplementMarking={supplementMarking} linkedFieldKeys={['skypeId']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('skypeId', '')} /></td>
                </tr>
                <tr>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-genju" text="現住所" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.postalCode, CV_LINK.address]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0 text-center" style={{ borderColor: '#1f2937' }}>
                    <span
                      {...makeMarkedInlineEditable(
                        'genju-address',
                        formData.address || '',
                        (v) => setFormData((prev) => ({ ...prev, address: v || '' })),
                        renderMarked(addressCombinedDisplay || '　', 'tpl-tech-genju', 'address', ['postalCode']),
                        {
                          className: 'block text-center',
                          displayText: addressCombinedDisplay,
                          onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, 'address'),
                        }
                      )}
                    />
                  </td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-addressOrigin" text="出身地" supplementMarking={supplementMarking} linkedFieldKeys={['addressOrigin']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('addressOrigin', '')} /></td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-hasSpouse" text="配偶者" supplementMarking={supplementMarking} linkedFieldKeys={['hasSpouse']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937' }}>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.hasSpouse === '有'} onChange={() => setFormData(prev => ({ ...prev, hasSpouse: '有' }))} /> 有</label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0"><input type="checkbox" className="rounded" checked={formData.hasSpouse === '無'} onChange={() => setFormData(prev => ({ ...prev, hasSpouse: '無' }))} /> 無</label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-stayPurpose" text="日本滞在目的" supplementMarking={supplementMarking} linkedFieldKeys={['label-jpResidenceStatus', 'jpResidenceStatus']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0 text-xs relative" style={{ borderColor: '#1f2937' }} colSpan={3}>
                    <select
                      value={formData.jpResidenceStatus || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, jpResidenceStatus: e.target.value }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="日本滞在目的"
                    >
                      <option value="">選択</option>
                      {RESIDENCE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none min-h-[1.6em] flex items-center px-0.5">
                      <span className={formData.jpResidenceStatus ? 'text-gray-900' : 'text-gray-400'}>
                        {RESIDENCE_STATUS_LABELS[String(formData.jpResidenceStatus || '').trim()] || '選択'}
                      </span>
                    </div>
                  </td>
                  <td className="border px-0.5 py-1 font-normal text-center leading-tight cv-tpl-side-label whitespace-nowrap" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-visaExpiry" text="ビザの期限" supplementMarking={supplementMarking} linkedFieldKeys={['visaExpirationDate']} className="select-text inline" />
                  </td>
                  <td className="border px-0.5 py-1 bg-white min-w-0 cv-personal-date-cell" style={{ borderColor: '#1f2937' }}>
                    <CvTemplateDateTriplet
                      field="visaExpirationDate"
                      refs={{ y: visaYearRef, mo: visaMonthRef, d: visaDayRef }}
                      parts={visaExpiryParts}
                      errorMessage={dateFieldErrors.visaExpirationDate}
                      onCommit={commitDateField}
                      onClearError={clearDateError}
                      daySuffix="日"
                      compact
                    />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 学歴 */}
            <ResizableCvTable
              className="w-full border-collapse mt-3"
              style={CV_TPL_TABLE_STYLE}
              colPercents={sectionCols('rirekisho', 'education', CV_RIREKISHO_EDUCATION_COLS)}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'education')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td rowSpan={1 + Math.max(1, (formData.educations || []).length)} className="border p-2 text-center align-middle font-bold cv-tpl-section-title-col cv-tpl-side-label" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-education-title" text="学歴" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-education', 'education', 'education-0-content']} />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-school" text="学校名 (英語名)" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-school_name']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-major" text="学部・専攻" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-major']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-start" text="入学年月" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-year']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-end" text="卒業年月" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-endYear']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-years" text="年数" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-education']} className="select-text inline" />
                  </td>
                </tr>
                {Array.from({ length: Math.max(1, (formData.educations || []).length) }).map((_, i) => {
                  const edu = formData.educations?.[i] || {};
                  return (
                    <tr key={`gakureki-${i}`} onMouseEnter={() => setHoveredEducationIndex(i)} onMouseLeave={() => setHoveredEducationIndex(null)}>
                      <td className="border p-1.5 bg-white relative min-w-0 max-w-0" style={eduWrapTdStyle}>
                        {hoveredEducationIndex === i ? (
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); setFormData((prev) => ({ ...prev, educations: (prev.educations || []).filter((_, idx) => idx !== i) })); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa 学歴" aria-label="Xóa 学歴"><Trash2 className="w-3.5 h-3.5" /></button>
                        ) : null}
                        <span {...cvEditableArray('educations', i, 'school_name', eduTextCellClass, eduTextCellStyle)} />
                      </td>
                      <td className="border p-1.5 bg-white min-w-0 max-w-0" style={eduWrapTdStyle}>
                        <span {...cvEditableArray('educations', i, 'major', eduTextCellClass, eduTextCellStyle)} />
                      </td>
                      <td className="border p-1.5 bg-white text-center" style={{ borderColor: '#1f2937' }}>
                        <span ref={(el) => { eduYearRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block" style={{ minWidth: '2.2em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.year || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, false)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 4); moveCaretToEnd(e.currentTarget); }}>{edu.year || ''}</span><span>年</span><span ref={(el) => { eduMonthRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block ml-0.5" style={{ minWidth: '1.8em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.month || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, false)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 2); moveCaretToEnd(e.currentTarget); }}>{edu.month || ''}</span><span>月</span>
                      </td>
                      <td className="border p-1.5 bg-white text-center" style={{ borderColor: '#1f2937' }}>
                        <span ref={(el) => { eduEndYearRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block" style={{ minWidth: '2.2em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.endYear || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, true)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 4); moveCaretToEnd(e.currentTarget); }}>{edu.endYear || ''}</span><span>年</span><span ref={(el) => { eduEndMonthRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block ml-0.5" style={{ minWidth: '1.8em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.endMonth || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, true)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 2); moveCaretToEnd(e.currentTarget); }}>{edu.endMonth || ''}</span><span>月</span>
                      </td>
                      <td className="border p-1.5 bg-white text-center min-w-0" style={{ borderColor: '#1f2937' }}>
                        <div className="inline-flex items-center justify-center text-xs w-full tabular-nums">
                          <span>{calculateEducationYearsFromDates(edu) || '　'}</span>
                          <span className="shrink-0 select-none">年</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ResizableCvTable>
            <div className="mt-2 mb-2 flex justify-center"><button type="button" onMouseDown={(e) => { e.preventDefault(); addEducationRow(); }} onClick={addEducationRow} className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800"><Plus className="w-3.5 h-3.5" /> 行を追加</button></div>

            {/* 外国語の会話レベル */}
            <ResizableCvTable
              className="w-full border-collapse mt-3"
              style={CV_TPL_TABLE_STYLE}
              colPercents={sectionCols('rirekisho', 'languages_v2', CV_RIREKISHO_LANGUAGES_COLS)}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'languages_v2')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td rowSpan={4} className="border p-2 text-center align-middle font-bold cv-tpl-section-title-col cv-tpl-side-label" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-language-title" text="外国語の会話レベル" supplementMarking={supplementMarking} linkedFieldKeys={['jpConversationLevel', 'enConversationLevel', 'otherConversationLevel', 'languageSkillRemarks', 'remarks']} />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-jp" text="日本語" supplementMarking={supplementMarking} linkedFieldKeys={['jpConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-en" text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['enConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-other" text="その他 ( )" supplementMarking={supplementMarking} linkedFieldKeys={['otherConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '10rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-skill-note" text="言語スキル補足説明" supplementMarking={supplementMarking} linkedFieldKeys={['languageSkillRemarks']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '10rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-language-remarks-title" text="備考" supplementMarking={supplementMarking} linkedFieldKeys={['remarks']} />
                  </td>
                </tr>
                {LANGUAGE_LEVEL_OPTIONS.map(({ value, label }, rowIdx) => (
                  <tr key={value}>
                    {LANGUAGE_LEVEL_FIELDS.map((field) => (
                      <td key={field} className="border px-2 py-1.5 bg-white cv-lang-level-cell" style={{ borderColor: '#1f2937' }}>
                        <label className="cv-lang-level-option">
                          <input
                            type="checkbox"
                            className="rounded shrink-0"
                            checked={normalizeConversationLevel(formData[field]) === value}
                            onChange={() => {
                              setFormData((prev) => {
                                const current = normalizeConversationLevel(prev[field]);
                                return {
                                  ...prev,
                                  [field]: current === value ? 0 : value,
                                };
                              });
                            }}
                          />
                          {label}
                        </label>
                      </td>
                    ))}
                    {rowIdx === 0 && (
                      <>
                        <td rowSpan={3} className="border p-1.5 bg-white text-center align-middle" style={{ borderColor: '#1f2937', width: '10rem', whiteSpace: 'pre-wrap' }}><span {...cvEditable('languageSkillRemarks', '', { whiteSpace: 'pre-wrap' })} /></td>
                        <td rowSpan={3} className="border p-1.5 bg-white align-middle" style={{ borderColor: '#1f2937', width: '10rem', whiteSpace: 'pre-wrap' }}><span {...cvEditable('remarks', '')} /></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </ResizableCvTable>

            <CvTemplateItTechnicalCertTable
              tplPrefix="tech"
              cvTpl={CV_TPL}
              formData={formData}
              setFormData={setFormData}
              cvEditableArray={cvEditableArray}
              renderMarked={renderMarked}
              supplementMarking={supplementMarking}
              colSaved={colSaved}
              onCvTableLayoutCommit={onCvTableLayoutCommit}
              pdfExportMode={pdfExportMode}
              sideLabelPct={sideLabelPct}
            />

            {/* 使用可能ツール・ソフトウェア等枠: preset 2+2 cột + hàng tùy chỉnh, checkbox + ô năm */}
            <ResizableCvTable
              className="w-full border-collapse mt-3"
              style={CV_TPL_TABLE_STYLE}
              colPercents={(() => {
                const saved = sectionCols('rirekisho', 'tools_v2', CV_RIREKISHO_TOOLS_COLS);
                return saved.length === CV_RIREKISHO_TOOLS_COLS.length
                  ? saved
                  : CV_RIREKISHO_TOOLS_COLS;
              })()}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'tools_v2')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                {(() => {
                  const learned = formData.learnedTools || [];
                  const experienced = formData.experienceTools || [];
                  const rowStyle = { borderColor: '#1f2937' };
                  const presetLearnedSet = new Set(TECH_LEARNED_TOOLS_GRID.flat());
                  const presetExpSet = new Set(TECH_EXPERIENCE_TOOLS_GRID.flat());
                  const getCustomToolEntries = (list, presetSet) =>
                    (list || []).filter((t) => !presetSet.has(t));
                  const pairCustomEntries = (entries) => {
                    const pairs = [];
                    for (let i = 0; i < entries.length; i += 2) {
                      pairs.push([entries[i] ?? '', entries[i + 1] ?? '']);
                    }
                    return pairs;
                  };
                  const learnedPairs = pairCustomEntries(getCustomToolEntries(learned, presetLearnedSet));
                  const experiencedPairs = pairCustomEntries(getCustomToolEntries(experienced, presetExpSet));
                  const extraRowCount = Math.max(learnedPairs.length, experiencedPairs.length);
                  const titleRowSpan = 1 + TECH_TOOLS_GRID_ROW_COUNT + extraRowCount + 1;

                  const rebuildCustomList = (list, presetSet, pairs) => {
                    const presetItems = (list || []).filter((t) => presetSet.has(t));
                    return [...presetItems, ...pairs.flat()];
                  };

                  const customNoteKey = (type, extraIndex, slotIndex, toolName) =>
                    toolName || `__${type}_extra_${extraIndex}_${slotIndex}`;

                  const toggleTool = (type, name) => {
                    if (!name) return;
                    setFormData((prev) => {
                      const key = type === 'learned' ? 'learnedTools' : 'experienceTools';
                      const list = prev[key] || [];
                      const exists = list.includes(name);
                      return { ...prev, [key]: exists ? list.filter((t) => t !== name) : [...list, name] };
                    });
                  };

                  const addCustomToolRow = () => {
                    setFormData((prev) => ({
                      ...prev,
                      learnedTools: [...(prev.learnedTools || []), '', ''],
                      experienceTools: [...(prev.experienceTools || []), '', ''],
                    }));
                  };

                  const removeCustomToolExtraRow = (extraIndex) => {
                    setFormData((prev) => {
                      const removeSide = (list, presetSet, noteKey, type) => {
                        const pairs = pairCustomEntries(getCustomToolEntries(list, presetSet));
                        const removedPair = pairs.splice(extraIndex, 1)[0] || ['', ''];
                        const noteMap = { ...(prev.toolsSoftwareNotes?.[noteKey] || {}) };
                        removedPair.forEach((removedName, slotIndex) => {
                          if (removedName) delete noteMap[removedName];
                          delete noteMap[customNoteKey(type, extraIndex, slotIndex, removedName)];
                        });
                        return {
                          list: rebuildCustomList(list, presetSet, pairs),
                          noteMap,
                        };
                      };
                      const learnedSide = removeSide(prev.learnedTools, presetLearnedSet, 'learned', 'learned');
                      const expSide = removeSide(prev.experienceTools, presetExpSet, 'experienced', 'experience');
                      return {
                        ...prev,
                        learnedTools: learnedSide.list,
                        experienceTools: expSide.list,
                        toolsSoftwareNotes: {
                          ...(prev.toolsSoftwareNotes || {}),
                          learned: learnedSide.noteMap,
                          experienced: expSide.noteMap,
                          experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                        },
                      };
                    });
                    setHoveredToolExtraRowIndex(null);
                  };

                  const updateCustomToolName = (type, extraIndex, slotIndex, newName) => {
                    setFormData((prev) => {
                      const presetSet = type === 'learned' ? presetLearnedSet : presetExpSet;
                      const toolKey = type === 'learned' ? 'learnedTools' : 'experienceTools';
                      const noteKey = type === 'learned' ? 'learned' : 'experienced';
                      const pairs = pairCustomEntries(getCustomToolEntries(prev[toolKey], presetSet));
                      while (pairs.length <= extraIndex) pairs.push(['', '']);
                      const oldName = pairs[extraIndex][slotIndex] ?? '';
                      pairs[extraIndex][slotIndex] = newName;
                      const notes = { ...(prev.toolsSoftwareNotes || {}) };
                      const noteMap = { ...(notes[noteKey] || {}) };
                      const oldKey = customNoteKey(type, extraIndex, slotIndex, oldName);
                      const noteVal = noteMap[oldKey] ?? (oldName ? noteMap[oldName] : '') ?? '';
                      if (oldName) delete noteMap[oldName];
                      delete noteMap[oldKey];
                      const newKey = customNoteKey(type, extraIndex, slotIndex, newName);
                      if (newName.trim()) noteMap[newName] = noteVal;
                      else if (noteVal) noteMap[newKey] = noteVal;
                      return {
                        ...prev,
                        [toolKey]: rebuildCustomList(prev[toolKey], presetSet, pairs),
                        toolsSoftwareNotes: {
                          ...notes,
                          learned: noteKey === 'learned' ? noteMap : (prev.toolsSoftwareNotes?.learned || {}),
                          experienced: noteKey === 'experienced' ? noteMap : (prev.toolsSoftwareNotes?.experienced || {}),
                          experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                        },
                      };
                    });
                  };

                  const updateCustomToolNote = (type, extraIndex, slotIndex, toolName, v) => {
                    setFormData((prev) => {
                      const noteKey = type === 'learned' ? 'learned' : 'experienced';
                      const key = customNoteKey(type, extraIndex, slotIndex, toolName);
                      return {
                        ...prev,
                        toolsSoftwareNotes: {
                          ...(prev.toolsSoftwareNotes || {}),
                          learned: noteKey === 'learned'
                            ? { ...(prev.toolsSoftwareNotes?.learned || {}), [key]: v }
                            : (prev.toolsSoftwareNotes?.learned || {}),
                          experienced: noteKey === 'experienced'
                            ? { ...(prev.toolsSoftwareNotes?.experienced || {}), [key]: v }
                            : (prev.toolsSoftwareNotes?.experienced || {}),
                          experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                        },
                      };
                    });
                  };

                  const renderToolNameCell = (type, toolName, ri, ci) => {
                    const fieldPrefix = type === 'learned' ? 'learned' : 'exp';
                    const linkedKey = type === 'learned' ? 'learnedTools' : 'experienceTools';
                    if (!toolName) {
                      return (
                        <td key={`${fieldPrefix}-name-${ri}-${ci}`} className="border p-1 bg-white text-center" style={{ ...rowStyle, borderRight: '2px dotted #1f2937' }}>
                          <span className="inline-block w-[19px] h-[19px] border border-gray-800 shrink-0" aria-hidden />
                        </td>
                      );
                    }
                    const checked = (type === 'learned' ? learned : experienced).includes(toolName);
                    return (
                        <td key={`${fieldPrefix}-name-${ri}-${ci}`} className="border px-2 py-1.5 bg-white text-center" style={{ ...rowStyle, borderRight: '2px dotted #1f2937' }} data-cv-tools-name-cell="1">
                        <label className="cv-tools-option flex items-center w-full gap-1.5 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            className="rounded shrink-0 flex-none"
                            checked={checked}
                            onChange={() => toggleTool(type, toolName)}
                          />
                          <SupplementTplText
                            fieldKey={`tpl-tech-tools-${fieldPrefix}-name-${ri}-${ci}`}
                            text={toolName}
                            supplementMarking={supplementMarking}
                            linkedFieldKeys={[linkedKey]}
                            className="select-text inline min-w-0"
                          />
                        </label>
                      </td>
                    );
                  };

                  const stripToolYearNote = (v) => String(v ?? '').replace(/年\s*$/u, '').trim();
                  const toolYearNoteEditable = (fieldKey, stored, onCommit) => (
                    <div className="inline-flex items-center justify-center text-xs w-full min-w-0">
                      <span
                        {...makeInlineEditable(fieldKey, stripToolYearNote(stored), (v) => onCommit(stripToolYearNote(v)), {
                          className: 'outline-none min-h-[1.2em] text-center text-xs min-w-[0.75em] inline-block',
                          emptyPlaceholder: '',
                          multiline: false,
                        })}
                      />
                      <span className="shrink-0 select-none">年</span>
                    </div>
                  );

                  const renderToolNoteCell = (type, toolName, ri, ci) => {
                    const noteKey = type === 'learned' ? 'learned' : 'experienced';
                    const fieldPrefix = type === 'learned' ? 'learned' : 'exp';
                    const stored = toolName ? (formData.toolsSoftwareNotes?.[noteKey] || {})[toolName] || '' : '';
                    return (
                      <td key={`${fieldPrefix}-note-${ri}-${ci}`} className="border p-1 bg-white text-center align-middle" style={{ borderColor: '#1f2937', borderLeft: '2px dotted #1f2937', minWidth: '2.5rem' }}>
                        {toolName ? (
                          toolYearNoteEditable(
                            `tools-${fieldPrefix}-${ri}-${ci}`,
                            stored,
                            (v) => {
                              setFormData((prev) => ({
                                ...prev,
                                toolsSoftwareNotes: {
                                  ...(prev.toolsSoftwareNotes || {}),
                                  learned: noteKey === 'learned'
                                    ? { ...(prev.toolsSoftwareNotes?.learned || {}), [toolName]: v }
                                    : (prev.toolsSoftwareNotes?.learned || {}),
                                  experienced: noteKey === 'experienced'
                                    ? { ...(prev.toolsSoftwareNotes?.experienced || {}), [toolName]: v }
                                    : (prev.toolsSoftwareNotes?.experienced || {}),
                                  experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                                },
                              }));
                            }
                          )
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </td>
                    );
                  };

                  const renderCustomSideCells = (type, extraIndex) => {
                    const isLearned = type === 'learned';
                    const pairs = isLearned ? learnedPairs : experiencedPairs;
                    const pair = pairs[extraIndex] || ['', ''];
                    const noteKey = isLearned ? 'learned' : 'experienced';
                    const fieldPrefix = isLearned ? 'learned-extra' : 'exp-extra';

                    return [0, 1].flatMap((slotIndex) => {
                      const toolName = pair[slotIndex] ?? '';
                      const noteKeyName = customNoteKey(type, extraIndex, slotIndex, toolName);
                      const stored = (formData.toolsSoftwareNotes?.[noteKey] || {})[noteKeyName] || '';
                      const showRowDelete = isLearned && slotIndex === 0 && hoveredToolExtraRowIndex === extraIndex;
                      return [
                        <td
                          key={`${fieldPrefix}-name-${extraIndex}-${slotIndex}`}
                          className="border p-1 bg-white text-center relative"
                          style={{ ...rowStyle, borderRight: '2px dotted #1f2937', ...(showRowDelete ? { zIndex: 30 } : {}) }}
                        >
                          <div className="flex items-center justify-center gap-0.5 min-w-0">
                            {showRowDelete ? (
                              <button
                                type="button"
                                onMouseEnter={() => setHoveredToolExtraRowIndex(extraIndex)}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeCustomToolExtraRow(extraIndex); }}
                                className="shrink-0 rounded-full bg-white p-0.5 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                                style={{ zIndex: 40 }}
                                title="Xóa hàng"
                                aria-label="Xóa hàng"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            ) : null}
                            <span
                              className="min-w-0 flex-1 text-center"
                              {...makeInlineEditable(
                                `${fieldPrefix}-name-${extraIndex}-${slotIndex}`,
                                toolName,
                                (v) => updateCustomToolName(type, extraIndex, slotIndex, v),
                                { className: 'outline-none min-h-[1.2em] block text-xs w-full whitespace-pre-wrap text-center' }
                              )}
                            />
                          </div>
                        </td>,
                        <td
                          key={`${fieldPrefix}-note-${extraIndex}-${slotIndex}`}
                          className="border p-1 bg-white text-center align-middle"
                          style={{ borderColor: '#1f2937', borderLeft: '2px dotted #1f2937', minWidth: '2.5rem' }}
                        >
                          {toolYearNoteEditable(
                            `${fieldPrefix}-note-${extraIndex}-${slotIndex}`,
                            stored,
                            (v) => updateCustomToolNote(type, extraIndex, slotIndex, toolName, v)
                          )}
                        </td>,
                      ];
                    });
                  };

                  return (
                    <>
                      <tr>
                        <td rowSpan={titleRowSpan} className="border p-2 text-center align-middle font-bold cv-tpl-section-title-col cv-tpl-side-label" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-title-side" text="使用可能ツール・ソフトウェア等枠" supplementMarking={supplementMarking} linkedFieldKeys={['learnedTools', 'experienceTools', 'toolsSoftwareNotes']} className="select-text inline" />
                        </td>
                        <td colSpan={4} className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-h-learned" text="学習したツール・ソフトウェア" supplementMarking={supplementMarking} linkedFieldKeys={['learnedTools']} className="select-text inline" />
                        </td>
                        <td colSpan={4} className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-h-exp" text="業務で利用したツール・ソフトウェア" supplementMarking={supplementMarking} linkedFieldKeys={['experienceTools']} className="select-text inline" />
                        </td>
                      </tr>
                      {Array.from({ length: TECH_TOOLS_GRID_ROW_COUNT }).map((_, ri) => (
                        <tr key={`preset-${ri}`}>
                          {TECH_LEARNED_TOOLS_GRID[ri].flatMap((toolName, ci) => [
                            renderToolNameCell('learned', toolName, ri, ci),
                            renderToolNoteCell('learned', toolName, ri, ci),
                          ])}
                          {TECH_EXPERIENCE_TOOLS_GRID[ri].flatMap((toolName, ci) => [
                            renderToolNameCell('experience', toolName, ri, ci),
                            renderToolNoteCell('experience', toolName, ri, ci),
                          ])}
                        </tr>
                      ))}
                      {Array.from({ length: extraRowCount }).map((_, ei) => (
                        <tr
                          key={`extra-${ei}`}
                          className="relative"
                          onMouseEnter={() => setHoveredToolExtraRowIndex(ei)}
                          onMouseLeave={() => setHoveredToolExtraRowIndex(null)}
                        >
                          {renderCustomSideCells('learned', ei)}
                          {renderCustomSideCells('experience', ei)}
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={8} className="border p-1 text-center bg-gray-50" style={rowStyle}>
                          <button type="button" onClick={addCustomToolRow} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                            <Plus className="w-3.5 h-3.5" /> 行を追加
                          </button>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </ResizableCvTable>

            {/* Bảng 職歴 + 自己PR + 応募動機 + 備考 – giống CV IT: mặc định 1 hàng, 行を追加, 挿入, 勤務地 nhập tay */}
            <ResizableCvTable
              className="w-full border-collapse mt-3"
              style={CV_TPL_TABLE_STYLE}
              colPercents={colSaved('rirekisho', 'employment_v3', [28, 18, 30, 24])}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'employment_v3')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}><SupplementTplText fieldKey="tpl-tech-rireki-period-h" text="期間" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-period']} /></td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}><SupplementTplText fieldKey="tpl-tech-rireki-place-h" text="勤務地" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-place']} /></td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}><SupplementTplText fieldKey="tpl-tech-rireki-company-h" text="企業名" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-company']} /></td>
                  <td className="border p-1.5 text-center font-normal" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}><SupplementTplText fieldKey="tpl-tech-rireki-role-h" text="ポジション・役割" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-description', 'employment-0-scale']} /></td>
                </tr>
                {(() => {
                  const list = formData.workExperiences || [];
                  const workCount = Math.max(1, formData.workHistoryCount ?? list.length);
                  const cellEditStyle = { outline: 'none', minHeight: '1em', display: 'block', width: '100%', cursor: 'text', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' };
                  const cellWrapStyle = { borderColor: '#1f2937', wordBreak: 'keep-all', overflowWrap: 'break-word' };
                  return Array.from({ length: workCount }).map((_, i) => {
                    const row = list[i] || {};
                    const companyNameDisplay = (row.company_name || '').replace(/\s*入社\s*$|\s*退社\s*$/g, '').trim();
                    const employmentPlaceDisplay = row.employmentPlace || row.employment_place || row.work_location || row.location || '';
                    const companyRoleDisplay = row.companyRole || row.company_role || row.position_role || row.position_name || row.position || '';
                    const setWorkField = (field, value) => {
                      if (typeof updateEmploymentPair === 'function') updateEmploymentPair(i, field, value);
                      else if (typeof updateEmployment === 'function') updateEmployment(i, field, value);
                      else {
                        setFormData((prev) => {
                          const next = [...(prev.workExperiences || [])];
                          if (!next[i]) next[i] = {};
                          next[i] = { ...next[i], [field]: value };
                          return { ...prev, workExperiences: next };
                        });
                      }
                    };
                    const patchWork = (patch) => {
                      if (typeof updateEmploymentPair === 'function') updateEmploymentPair(i, patch);
                      else if (typeof updateEmployment === 'function') updateEmployment(i, patch);
                      else {
                        setFormData((prev) => {
                          const next = [...(prev.workExperiences || [])];
                          if (!next[i]) next[i] = {};
                          next[i] = { ...next[i], ...patch };
                          return { ...prev, workExperiences: next };
                        });
                      }
                    };
                    const commitStart = () => {
                      const y = String(startYearRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 4);
                      const m = String(startMonthRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 2);
                      if (!y && !m) return;
                      patchWork({ startYear: y, startMonth: m });
                    };
                    const commitEnd = () => {
                      const y = String(endYearRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 4);
                      const m = String(endMonthRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 2);
                      if (!y && !m) {
                        patchWork({ endCurrent: true, endYear: '', endMonth: '' });
                        return;
                      }
                      patchWork({ endCurrent: false, endYear: y, endMonth: m });
                    };
                    const setEndCurrent = () => {
                      patchWork({ endCurrent: true, endYear: '', endMonth: '' });
                    };
                    const periodDisplay = formatShokumuPeriodRangeJa(
                      [row.startYear, row.startMonth].filter(Boolean).join('/'),
                      row.endCurrent ? '現在' : [row.endYear, row.endMonth].filter(Boolean).join('/'),
                    );
                    return (
                      <React.Fragment key={`shokureki-${i}`}>
                        <tr>
                          <td
                            className="border p-1.5 bg-white text-center align-middle min-w-0 overflow-hidden"
                            style={{ ...cellWrapStyle, minWidth: '10.5rem' }}
                            data-cv-shokumu-period
                            data-cv-period-display={periodDisplay}
                          >
                            <div className="cv-pdf-date-inline flex flex-row flex-nowrap items-center justify-center gap-x-0.5 text-xs leading-tight mx-auto max-w-full">
                              <div className="inline-flex items-center shrink-0 gap-0.5">
                                <input
                                  ref={(el) => { if (!startYearRefs.current) startYearRefs.current = []; startYearRefs.current[i] = el; }}
                                  value={row.startYear || ''}
                                  onChange={(e) => setWorkField('startYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  onBlur={commitStart}
                                  inputMode="numeric"
                                  className="w-[2.4em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                />
                                <span>年</span>
                                <input
                                  ref={(el) => { if (!startMonthRefs.current) startMonthRefs.current = []; startMonthRefs.current[i] = el; }}
                                  value={row.startMonth || ''}
                                  onChange={(e) => setWorkField('startMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                  onBlur={commitStart}
                                  inputMode="numeric"
                                  className="w-[1.8em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                />
                                <span>月</span>
                              </div>
                              <span className="leading-none shrink-0">～</span>
                              {row.endCurrent ? (
                                <span
                                  className="inline-flex items-center justify-center rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                  {...(!pdfExportMode ? {
                                    role: 'button',
                                    tabIndex: 0,
                                    onClick: () => patchWork({ endCurrent: false }),
                                  } : {})}
                                >
                                  現在
                                </span>
                              ) : (
                                <>
                                  <div className="inline-flex items-center shrink-0 gap-0.5">
                                    <input
                                      ref={(el) => { if (!endYearRefs.current) endYearRefs.current = []; endYearRefs.current[i] = el; }}
                                      value={row.endYear || ''}
                                      onChange={(e) => setWorkField('endYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      onBlur={commitEnd}
                                      inputMode="numeric"
                                      className="w-[2.4em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                    />
                                    <span>年</span>
                                    <input
                                      ref={(el) => { if (!endMonthRefs.current) endMonthRefs.current = []; endMonthRefs.current[i] = el; }}
                                      value={row.endMonth || ''}
                                      onChange={(e) => setWorkField('endMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                      onBlur={commitEnd}
                                      inputMode="numeric"
                                      className="w-[1.8em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                    />
                                    <span>月</span>
                                  </div>
                                  <button type="button" onClick={setEndCurrent} className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800 cv-pdf-hide">現在</button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle min-w-0" style={cellWrapStyle}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-place-${i}`,
                                employmentPlaceDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'employmentPlace', v),
                                renderMarked(employmentPlaceDisplay || '　', `tpl-tech-rireki-${i}-place`, `employment-${i}-place`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-place`),
                                  style: cellEditStyle,
                                  className: 'block w-full break-words whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle min-w-0" style={cellWrapStyle}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-company-${i}`,
                                companyNameDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'company_name', v),
                                renderMarked(companyNameDisplay || '　', `tpl-tech-rireki-${i}-company`, `employment-${i}-company`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-company`),
                                  style: cellEditStyle,
                                  className: 'block w-full break-words whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle min-w-0" style={cellWrapStyle}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-role-${i}`,
                                companyRoleDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'companyRole', v),
                                renderMarked(companyRoleDisplay || '　', `tpl-tech-rireki-${i}-companyRole`, `employment-${i}-companyRole`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-companyRole`),
                                  style: cellEditStyle,
                                  className: 'block w-full break-words whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                        </tr>
                        {i < workCount - 1 && handleInsertWorkExperienceBlockAt && (
                          <tr>
                            <td colSpan={4} className="p-0.5 text-center" style={{ border: 'none', borderTop: '1px dotted #9ca3af', backgroundColor: '#f9fafb' }}>
                              <button type="button" onClick={() => handleInsertWorkExperienceBlockAt(i + 1)} className="text-xs text-amber-600 hover:text-amber-800">挿入</button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
                <tr>
                  <td colSpan={4} className="border p-1 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                    {handleAddWorkExperience && (
                      <button type="button" onClick={handleAddWorkExperience} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                        <Plus className="w-3.5 h-3.5" /> 行を追加
                      </button>
                    )}
                  </td>
                </tr>
                <tr data-cv-pdf-keep-with-next="1">
                  <td colSpan={4} className="border p-1.5 font-bold text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-selfpr-title" text="自己PR (大学での成績順位、頑張ったこと、趣味等)" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-strengths', 'strengths', 'hobbiesSpecialSkills']} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-2 bg-white align-top min-h-[80px]" style={{ borderColor: '#1f2937' }}>
                    <div {...cvEditable('strengths', 'block whitespace-pre-wrap outline-none min-h-[80px] cv-tpl-dense', { minHeight: '80px' })} />
                  </td>
                </tr>
                <tr data-cv-pdf-keep-with-next="1">
                  <td colSpan={4} className="border p-1.5 font-bold text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-motivation-title" text="応募動機" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-motivation', 'motivation']} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-2 bg-white align-top" style={{ borderColor: '#1f2937', minHeight: '80px' }}>
                    <div {...cvEditable('motivation', 'block whitespace-pre-wrap outline-none min-h-[80px] cv-tpl-dense', { minHeight: '80px' })} />
                  </td>
                </tr>
                <tr data-cv-pdf-keep-with-next="1">
                  <td colSpan={4} className="border p-1.5 font-bold text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-note-title" text="備考" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-block6-prefs', 'currentSalary', 'desiredSalary', 'desiredPosition', 'desiredLocation', 'visaExpirationDate']} />
                  </td>
                </tr>
                <tr data-cv-table-footer-row>
                  <td colSpan={4} className="border p-2 bg-white align-top min-w-0 break-words cv-tpl-note" style={{ borderColor: '#1f2937', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                    <div className="space-y-1">
                      <div className="break-words">・現年収: <span {...cvEditable('currentSalary', 'inline-block min-w-[6em] max-w-full break-words whitespace-pre-wrap', { wordBreak: 'keep-all', overflowWrap: 'break-word' })} /></div>
                      <div className="break-words">・希望年収: <span {...cvEditable('desiredSalary', 'inline-block min-w-[6em] max-w-full break-words whitespace-pre-wrap', { wordBreak: 'keep-all', overflowWrap: 'break-word' })} /></div>
                      <div className="break-words">・希望職種: <span {...cvEditable('desiredPosition', 'inline-block min-w-[6em] max-w-full break-words whitespace-pre-wrap', { wordBreak: 'keep-all', overflowWrap: 'break-word' })} /></div>
                      <div className="break-words">・希望勤務地: <span {...cvEditable('desiredLocation', 'inline-block min-w-[6em] max-w-full break-words whitespace-pre-wrap', { wordBreak: 'keep-all', overflowWrap: 'break-word' })} /></div>
                      <div>・在留資格の種類: 技術・人文知識・国際業務</div>
                      <div>・在留期間: {formatCvAnyDateJa(formData.visaExpirationDate) || '年月日'}</div>
                      <div>・在留カードに記載の就労制限:「在留資格に基づく就労活動のみ可」</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>
          </div>
        </div>
      )}

      {/* ===== 職務経歴書 (CV Kỹ thuật) ===== */}
      {showShokumu && (
        <div className="w-full" ref={pdfSectionRefs?.shokumu} data-cv-pdf-section="shokumu">
          {!pdfExportMode && (
          <div className="flex items-center justify-end mb-2 cv-pdf-hide">
            <button type="button" onClick={() => handleBackendPreviewWithOptions('cv_technical', 'shokumu')}
              className="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
              style={{ borderColor: '#d1d5db', color: '#2563eb' }}>
              Xem preview 【職務経歴書】
            </button>
          </div>
          )}
          <div className="w-full min-w-0 max-w-full cv-template-body" style={CV_TPL_BODY_STYLE}>
            <div className="mb-6">
              <h2 className="text-center font-bold mb-8" style={{ fontSize: CV_TPL_FONT_TITLE }}>
                <SupplementTplText fieldKey="tpl-tech-shokumu-h2" text="職務経歴書" supplementMarking={supplementMarking} />
              </h2>
              <div className="text-right space-y-1">
                <div>現在、<span {...cvEditableWithDefault('cvDocumentDate', getDefaultCvDate(false), 'inline-block min-w-[8em]', {}, (v) => formatCvDocumentHeaderJa(String(v || '').replace(/現在$/, '')))} /></div>
                <div>氏名: <span {...cvEditable('nameKanji', '')} /> (<span {...cvEditable('nameKana', '')} />)</div>
              </div>
            </div>

            {/* 職務要約 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={CV_TPL_TABLE_STYLE}
              colPercents={colSaved('shokumu', 'summary', [12, 88])}
              layoutKey={cvLayoutKey(CV_TPL, 'shokumu', 'summary')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-2 text-center align-middle" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '12%' }}>
                    <SupplementTplText fieldKey="tpl-tech-shokumu-summary-title" text="職務要約" supplementMarking={supplementMarking} linkedFieldKeys={['careerSummary']} className="select-text inline" />
                  </td>
                  <td className="border p-3 bg-white align-top" style={{ borderColor: '#1f2937' }}>
                    <div className="whitespace-pre-wrap min-h-[4rem] cv-tpl-dense" {...cvEditable('careerSummary', 'block')} />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 職務経歴 – Technical: một bảng thống nhất, mỗi 職歴 = 3 hàng liên tiếp */}
            {(() => {
              const list = formData.workExperiences || [];
              const workCount = Math.max(1, formData.workHistoryCount ?? list.length);
              const headerGrayStyle = { backgroundColor: '#e5e7eb', verticalAlign: 'middle' };
              const headerWhiteStyle = { backgroundColor: '#fff', verticalAlign: 'middle' };
              const bodyStyle = { backgroundColor: '#fff', verticalAlign: 'top' };
              const bodyCenterStyle = { ...bodyStyle, verticalAlign: 'middle', textAlign: 'center' };

              const setWorkField = (index, field, value) => {
                if (typeof updateEmploymentPair === 'function') {
                  updateEmploymentPair(index, field, value);
                } else if (typeof updateEmployment === 'function') {
                  updateEmployment(index, field, value);
                } else {
                  setFormData((prev) => {
                    const next = [...(prev.workExperiences || [])];
                    if (!next[index]) next[index] = {};
                    next[index] = { ...next[index], [field]: value };
                    return { ...prev, workExperiences: next };
                  });
                }
              };
              const patchWork = (index, patch) => {
                if (typeof updateEmploymentPair === 'function') {
                  updateEmploymentPair(index, patch);
                } else if (typeof updateEmployment === 'function') {
                  updateEmployment(index, patch);
                } else {
                  setFormData((prev) => {
                    const next = [...(prev.workExperiences || [])];
                    if (!next[index]) next[index] = {};
                    next[index] = { ...next[index], ...patch };
                    return { ...prev, workExperiences: next };
                  });
                }
              };
              const setWorkPeriodEnd = (index, year, month) => {
                const y = String(year || '').trim();
                const m = String(month || '').trim();
                if (!y && !m) {
                  patchWork(index, { endCurrent: true, endYear: '', endMonth: '' });
                  return;
                }
                patchWork(index, { endCurrent: false, endYear: y, endMonth: m });
              };
              const setWorkEndCurrent = (index, isCurrent) => {
                if (isCurrent) {
                  patchWork(index, { endCurrent: true, endYear: '', endMonth: '' });
                } else {
                  patchWork(index, { endCurrent: false, endYear: '', endMonth: '' });
                }
              };
              const addWorkRow = () => {
                if (handleAddWorkExperience) handleAddWorkExperience();
                else setFormData((prev) => ({
                  ...prev,
                  workExperiences: [...(prev.workExperiences || []), { company_name: '', employmentPlace: '', companyRole: '', description: '', tools_tech: '', startYear: '', startMonth: '', endYear: '', endMonth: '', endCurrent: false, period: '' }],
                }));
              };
              const insertWorkRowAt = (index) => {
                if (handleInsertWorkExperienceBlockAt) {
                  handleInsertWorkExperienceBlockAt(index);
                  return;
                }
                if (handleInsertWorkExperienceAt) {
                  handleInsertWorkExperienceAt(index);
                  return;
                }
                setFormData((prev) => {
                  const next = [...(prev.workExperiences || [])];
                  next.splice(index, 0, { company_name: '', employmentPlace: '', companyRole: '', description: '', tools_tech: '', startYear: '', startMonth: '', endYear: '', endMonth: '', endCurrent: false, period: '' });
                  return { ...prev, workExperiences: next, workHistoryCount: Math.max(1, next.length) };
                });
              };
              const deleteWorkRow = (index) => {
                setFormData((prev) => {
                  const next = [...(prev.workExperiences || [])].filter((_, i) => i !== index);
                  return { ...prev, workExperiences: next, workHistoryCount: Math.max(1, next.length) };
                });
              };

              return (
                <div className="mt-4 cv-shokumu-work-section">
                  <div className="cv-shokumu-work-banner p-2 text-center font-bold" style={{ backgroundColor: '#e2efd9', color: '#1f2937' }}>
                    <SupplementTplText fieldKey="tpl-tech-shokumu-work-banner" text="職務経歴" supplementMarking={supplementMarking} linkedFieldKeys={['workExperiences-0-company_name']} className="select-text inline" />
                  </div>
                  <ResizableCvTable
                    className="w-full border-collapse"
                    style={{ fontSize: CV_TPL_BODY_STYLE.fontSize, color: '#1f2937' }}
                    colPercents={colSaved('shokumu', 'workGrid_v1', [24, 31, 31, 14])}
                    layoutKey={cvLayoutKey(CV_TPL, 'shokumu', 'workGrid_v1')}
                    onLayoutCommit={onCvTableLayoutCommit}
                  >
                    <tbody>
                      {Array.from({ length: workCount }).map((_, i) => {
                        const emp = list[i] || {};
                        const showDescription = String(emp.description || '').trim() !== String(emp.business_purpose || '').trim();
                        const showDelete = hoveredWorkIndex === i;
                        const shokumuPeriodDisplay = formatShokumuPeriodRangeJa(
                          [emp.startYear, emp.startMonth].filter(Boolean).join('/'),
                          emp.endCurrent ? '現在' : [emp.endYear, emp.endMonth].filter(Boolean).join('/'),
                        );
                        return (
                          <React.Fragment key={`tech-work-${i}`}>
                            <tr onMouseEnter={() => setHoveredWorkIndex(i)} onMouseLeave={() => setHoveredWorkIndex(null)}>
                              <td className="py-2 px-1.5 text-center align-middle relative" style={headerGrayStyle}>
                                <SupplementTplText fieldKey={`tpl-tech-shokumu-block-label-${i}`} text={`【職歴${i + 1}】`} supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-period`]} className="select-text inline text-xs" />
                                {showDelete ? (
                                  <button type="button" onMouseDown={(e) => { e.preventDefault(); deleteWorkRow(i); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa 職務経歴" aria-label="Xóa 職務経歴">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}
                              </td>
                              <td colSpan={2} className="py-2 px-2 text-center align-middle font-normal" style={headerGrayStyle}>
                                <div className="flex flex-col items-center justify-center gap-0.5 w-full">
                                  <span {...makeInlineEditable(`shokumu-company-${i}`, emp.company_name || emp.companyName || emp.company || '', (v) => setWorkField(i, 'company_name', v), { className: 'block w-full outline-none whitespace-pre-wrap text-center' })} />
                                  {(emp.companyRole || emp.company_role || emp.position) ? (
                                    <span {...makeInlineEditable(`shokumu-role-${i}`, emp.companyRole || emp.company_role || emp.position || '', (v) => setWorkField(i, 'companyRole', v), { className: 'block w-full outline-none whitespace-pre-wrap cv-tpl-dense text-gray-700 text-center' })} />
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center align-middle font-normal" style={headerGrayStyle}>
                                <span {...makeInlineEditable(`shokumu-place-${i}`, emp.employmentPlace || emp.employment_place || emp.work_location || '', (v) => setWorkField(i, 'employmentPlace', v), { className: 'block w-full outline-none whitespace-pre-wrap text-center' })} />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-0.5 px-1.5 text-center font-normal" style={headerWhiteStyle}>
                                <SupplementTplText fieldKey="tpl-tech-shokumu-period-h" text="期間" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-period`]} />
                              </td>
                              <td colSpan={2} className="py-0.5 px-1.5 text-center font-normal" style={headerWhiteStyle}>
                                <SupplementTplText fieldKey="tpl-tech-shokumu-h-desc-tech" text="業務内容" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-description`]} className="select-text inline" />
                              </td>
                              <td className="py-0.5 px-1.5 text-center font-normal" style={headerWhiteStyle}>
                                <SupplementTplText fieldKey="tpl-tech-shokumu-h-tools" text="使用ツール" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-tools_tech`]} className="select-text inline" />
                              </td>
                            </tr>
                            <tr data-cv-work-company-last="1">
                              <td
                                className="p-2 align-middle text-center"
                                style={{ ...bodyCenterStyle, minWidth: '12.5rem', overflow: 'visible' }}
                                data-cv-shokumu-period
                                data-cv-period-display={shokumuPeriodDisplay}
                              >
                                {(() => {
                                  const commitShokumuStart = () => {
                                    const y = String(shokumuStartYearRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 4);
                                    const m = String(shokumuStartMonthRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 2);
                                    if (!y && !m) return;
                                    patchWork(i, { startYear: y, startMonth: m });
                                  };
                                  const commitShokumuEnd = () => {
                                    const y = String(shokumuEndYearRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 4);
                                    const m = String(shokumuEndMonthRefs.current[i]?.value || '').replace(/\D/g, '').slice(0, 2);
                                    if (!y && !m) {
                                      setWorkEndCurrent(i, true);
                                      return;
                                    }
                                    setWorkPeriodEnd(i, y, m);
                                  };
                                  return (
                                    <div className="cv-pdf-date-inline flex flex-col items-center justify-center gap-0.5 leading-tight mx-auto w-full">
                                      <div className="inline-flex items-center justify-center shrink-0 gap-0.5 whitespace-nowrap">
                                        <input
                                          ref={(el) => { if (!shokumuStartYearRefs.current) shokumuStartYearRefs.current = []; shokumuStartYearRefs.current[i] = el; }}
                                          value={emp.startYear || ''}
                                          onChange={(e) => setWorkField(i, 'startYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                          onBlur={commitShokumuStart}
                                          inputMode="numeric"
                                          className="w-[3em] min-w-[3em] max-w-[3em] px-0.5 text-center tabular-nums bg-transparent border-0 outline-none"
                                        />
                                        <span>年</span>
                                        <input
                                          ref={(el) => { if (!shokumuStartMonthRefs.current) shokumuStartMonthRefs.current = []; shokumuStartMonthRefs.current[i] = el; }}
                                          value={emp.startMonth || ''}
                                          onChange={(e) => setWorkField(i, 'startMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                          onBlur={commitShokumuStart}
                                          inputMode="numeric"
                                          className="w-[2em] min-w-[2em] max-w-[2em] px-0.5 text-center tabular-nums bg-transparent border-0 outline-none"
                                        />
                                        <span>月</span>
                                      </div>
                                      <div className="inline-flex items-center justify-center shrink-0 gap-0.5 whitespace-nowrap">
                                        <span className="leading-none shrink-0">～</span>
                                        {emp.endCurrent ? (
                                          <span
                                            className="inline-flex items-center justify-center rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap shrink-0"
                                            {...(!pdfExportMode ? {
                                              role: 'button',
                                              tabIndex: 0,
                                              onClick: () => setWorkEndCurrent(i, false),
                                            } : {})}
                                          >
                                            現在
                                          </span>
                                        ) : (
                                          <>
                                            <input
                                              ref={(el) => { if (!shokumuEndYearRefs.current) shokumuEndYearRefs.current = []; shokumuEndYearRefs.current[i] = el; }}
                                              value={emp.endYear || ''}
                                              onChange={(e) => setWorkField(i, 'endYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                              onBlur={commitShokumuEnd}
                                              inputMode="numeric"
                                              className="w-[3em] min-w-[3em] max-w-[3em] px-0.5 text-center tabular-nums bg-transparent border-0 outline-none"
                                            />
                                            <span>年</span>
                                            <input
                                              ref={(el) => { if (!shokumuEndMonthRefs.current) shokumuEndMonthRefs.current = []; shokumuEndMonthRefs.current[i] = el; }}
                                              value={emp.endMonth || ''}
                                              onChange={(e) => setWorkField(i, 'endMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                              onBlur={commitShokumuEnd}
                                              inputMode="numeric"
                                              className="w-[2em] min-w-[2em] max-w-[2em] px-0.5 text-center tabular-nums bg-transparent border-0 outline-none"
                                            />
                                            <span>月</span>
                                            <button type="button" onClick={() => setWorkEndCurrent(i, true)} className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800 cv-pdf-hide whitespace-nowrap shrink-0">現在</button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td colSpan={2} className="p-2 align-top" style={bodyStyle}>
                                <div className="space-y-2 text-xs">
                                  <div><span className="font-normal">【事業内容】</span> <span {...makeInlineEditable(`shokumu-business-${i}`, emp.business_purpose || '', (v) => setWorkField(i, 'business_purpose', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap', style: { wordBreak: 'keep-all', overflowWrap: 'break-word' } })} /></div>
                                  {showDescription ? <div><span className="font-normal">【担当業務】</span> <span {...makeInlineEditable(`shokumu-desc-${i}`, emp.description || '', (v) => setWorkField(i, 'description', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap', style: { wordBreak: 'keep-all', overflowWrap: 'break-word' } })} /></div> : null}
                                  <div><span className="font-normal">【規模・役割】</span> <span {...makeInlineEditable(`shokumu-scale-${i}`, emp.scale_role || '', (v) => setWorkField(i, 'scale_role', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap', style: { wordBreak: 'keep-all', overflowWrap: 'break-word' } })} /></div>
                                  <div><span className="font-normal">【退職理由】</span> <span {...makeInlineEditable(`shokumu-reason-${i}`, emp.reason_for_leaving || '', (v) => setWorkField(i, 'reason_for_leaving', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap', style: { wordBreak: 'keep-all', overflowWrap: 'break-word' } })} /></div>
                                </div>
                              </td>
                              <td className="p-1.5 align-top whitespace-pre-wrap" style={bodyStyle}>
                                <span {...makeInlineEditable(`shokumu-tools-${i}`, emp.tools_tech || '', (v) => setWorkField(i, 'tools_tech', v), { className: 'block w-full outline-none whitespace-pre-wrap break-words' })} />
                              </td>
                            </tr>
                            {i < workCount - 1 && (
                              <tr data-cv-work-insert-row>
                                <td colSpan={4} className="p-0.5 text-center">
                                  <button type="button" onClick={() => insertWorkRowAt(i + 1)} className="text-xs text-amber-600 hover:text-amber-800">挿入</button>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      <tr data-cv-work-add-row>
                        <td colSpan={4} className="p-1.5 align-middle bg-gray-50 text-center">
                          <button type="button" onClick={addWorkRow} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                            <Plus className="w-3.5 h-3.5" /> 行を追加
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </ResizableCvTable>
                </div>
              );
            })()}

            {/* 活かせるスキル + 資格・免許 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4 border"
              style={CV_TPL_TABLE_STYLE}
              colPercents={colSaved('shokumu', 'skillsCert', [100])}
              layoutKey={cvLayoutKey(CV_TPL, 'shokumu', 'skillsCert')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-2 text-center font-bold" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', color: '#1f2937' }}>
                    <SupplementTplText fieldKey="tpl-tech-shokumu-skills-title" text="活かせるスキル・経験・知識" supplementMarking={supplementMarking} linkedFieldKeys={['technicalSkills']} className="select-text inline" />
                  </td>
                </tr>
                <tr>
                  <td className="border p-3 min-h-[100px] bg-white cv-tpl-dense whitespace-pre-wrap align-top" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
                    <div className="whitespace-pre-wrap min-h-[100px]">
                      <span {...cvEditable('technicalSkills', 'inline-block min-w-0 outline-none whitespace-pre-wrap block w-full', { minHeight: '100px' })} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 text-center font-bold" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', color: '#1f2937' }}>
                    <SupplementTplText fieldKey="tpl-tech-shokumu-qual-title" text="資格・免許" supplementMarking={supplementMarking} linkedFieldKeys={['certificates', 'addCandidate-certificates']} className="select-text inline" />
                  </td>
                </tr>
                <tr>
                  <td className="border p-3 bg-white cv-tpl-dense align-top min-h-[4rem]" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
                    <div className="space-y-2" data-cv-shokumu-cert-list style={{ minHeight: '4rem' }}>
                      {(formData.certificates || []).length > 0 ? (
                        (formData.certificates || []).map((cert, index) => (
                          <div key={`tech-cert-${index}`} data-cv-shokumu-cert-row className="flex flex-wrap items-center gap-1">
                            <span className="shrink-0">・</span>
                            <span {...cvEditableArray('certificates', index, 'name', 'min-w-[10rem] flex-1 border-0 outline-none bg-transparent whitespace-pre-wrap')} />
                            <span className="shrink-0">（</span>
                            <span {...makeInlineEditable(`cert-year-${index}`, cert?.year || '', (v) => setFormData((prev) => { const next = [...(prev.certificates || [])]; next[index] = { ...(next[index] || {}), year: v }; return { ...prev, certificates: next }; }), { className: 'w-14 border-0 outline-none bg-transparent text-center', multiline: false })} />
                            <span className="shrink-0">年</span>
                            <span {...makeInlineEditable(`cert-month-${index}`, cert?.month || '', (v) => setFormData((prev) => { const next = [...(prev.certificates || [])]; next[index] = { ...(next[index] || {}), month: v }; return { ...prev, certificates: next }; }), { className: 'w-12 border-0 outline-none bg-transparent text-center', multiline: false })} />
                            <span className="shrink-0">月）</span>
                            {formData.certificates.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  certificates: (prev.certificates || []).filter((_, i) => i !== index),
                                }))}
                                className="ml-2 text-[10px] text-rose-600 hover:text-rose-700"
                              >
                                削除
                              </button>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-wrap items-center gap-1 text-gray-400" data-cv-shokumu-cert-row>
                          <span className="shrink-0">・</span>
                          <span>資格・免許</span>
                          <span className="shrink-0">（</span>
                          <span className="w-14 text-center">年</span>
                          <span className="shrink-0">年</span>
                          <span className="w-12 text-center">月</span>
                          <span className="shrink-0">月）</span>
                        </div>
                      )}
                      <div className="pt-1 flex justify-center cv-pdf-hide">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            certificates: [...(prev.certificates || []), { name: '', year: '', month: '' }],
                          }))}
                          className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="w-3.5 h-3.5" /> 行を追加
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>
          </div>
        </div>
      )}
    </div>
  );
};

export default CvTemplateTechnical;
