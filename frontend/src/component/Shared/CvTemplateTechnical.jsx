import React, { useState, useCallback } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import ResizableCvTable from './ResizableCvTable';
import { cvLayoutKey } from './cvLayoutKey';
import { SupplementTplText } from './CvTemplateSupplementText.jsx';
import { CV_LINK } from './cvSupplementLinks.js';
import { SupplementMarkedText, SupplementFieldWrap } from './CandidateDetailSupplementMarks.jsx';
import {
  formatCvYearMonthJa,
  formatShokumuPeriodCell,
  formatShokumuPeriodRangeJa,
  formatCvDocumentHeaderJa,
  formatCvAnyDateJa,
} from '../../utils/cvJpDateDisplay.js';
import CvTemplateItTechnicalCertTable from './CvTemplateItTechnicalCertTable.jsx';
import CvTemplateDateTriplet from './CvTemplateDateTriplet.jsx';
import {
  displayEditableScalarText,
  readContentEditableText,
  readContentEditableTextTrimmed,
} from '../../utils/cvEditableUtils.js';

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
 *   handleAddWorkExperience, handleInsertWorkExperienceAt, handleInsertWorkExperienceBlockAt (bảng 職歴 Rirekisho)
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
  const [hoveredLearnedToolIndex, setHoveredLearnedToolIndex] = useState(null);
  const [hoveredExperienceToolIndex, setHoveredExperienceToolIndex] = useState(null);
  const [focusedInlineField, setFocusedInlineField] = useState(null);
  const startYearRefs = React.useRef([]);
  const startMonthRefs = React.useRef([]);
  const endYearRefs = React.useRef([]);
  const endMonthRefs = React.useRef([]);
  const birthDateParts = (() => {
    const raw = String(formData.birthDate || '').trim();
    const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return m ? { y: m[1], mo: String(parseInt(m[2], 10)).padStart(2, '0'), d: String(parseInt(m[3], 10)).padStart(2, '0') } : { y: '', mo: '', d: '' };
  })();
  const visaExpiryParts = (() => {
    const raw = String(formData.visaExpirationDate || '').trim();
    const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return m ? { y: m[1], mo: String(parseInt(m[2], 10)).padStart(2, '0'), d: String(parseInt(m[3], 10)).padStart(2, '0') } : { y: '', mo: '', d: '' };
  })();
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
        const next = showText;
        if (node.textContent !== next) node.textContent = next;
      },
      onFocus: (e) => {
        setFocusedInlineField(fieldKey);
        const el = e.currentTarget;
        const t = stored.trimEnd() ? stored : '';
        requestAnimationFrame(() => {
          if (el && document.activeElement === el) el.textContent = t || showText;
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
      educations: [...(prev.educations || []), { school_name: '', major: '', year: '', month: '', endYear: '', endMonth: '' }],
    }));
  };
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
    if (!year && !month) return;
    setFormData((prev) => {
      const list = [...(prev.educations || [])];
      if (!list[index]) list[index] = {};
      list[index] = { ...list[index], ...(isEnd ? { endYear: year, endMonth: month } : { year, month }) };
      return { ...prev, educations: list };
    });
  };
  const captureParts = pdfCaptureParts || ['rirekisho', 'shokumu'];
  const showRirekisho = pdfExportMode ? captureParts.includes('rirekisho') : activeTab === 'rirekisho';
  const showShokumu = pdfExportMode ? captureParts.includes('shokumu') : activeTab === 'shokumu';
  return (
    <div style={{ fontFamily: '"MS PMincho", "MS Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif' }}>
      {/* Tab buttons */}
      {!pdfExportMode && (
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
        <div className="w-full" ref={pdfSectionRefs?.rirekisho} data-cv-pdf-section="rirekisho">
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
          <div className="w-full font-bold cv-template-body" style={{ fontSize: '11px', color: '#1f2937' }}>
            <ResizableCvTable
              colPercents={colSaved('rirekisho', 'personalGrid', [7, 18, 7, 11, 6, 9, 42])}
              className="w-full border-collapse"
              style={{ borderColor: '#1f2937' }}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'personalGrid')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td colSpan={7} className="border p-2 text-center font-bold" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-rirekisho-banner" text="履歴書" supplementMarking={supplementMarking} className="select-text inline min-w-0" />
                  </td>
                </tr>
                <tr>
                  <td className="border p-1 font-medium w-16 whitespace-nowrap text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem', maxWidth: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-furigana" text="フリガナ" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('nameKana', '')} /></td>
                  <td className="border p-1 w-14 font-medium text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3.5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-seinengappi" text="生年月日" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.birthDate]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20 whitespace-nowrap" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}>
                    <CvTemplateDateTriplet
                      field="birthDate"
                      refs={{ y: birthYearRef, mo: birthMonthRef, d: birthDayRef }}
                      parts={birthDateParts}
                      errorMessage={dateFieldErrors.birthDate}
                      onCommit={commitDateField}
                      onClearError={clearDateError}
                      isBirthField
                    />
                  </td>
                  <td className="border p-1 w-12 font-medium text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-nenrei" text="年齢" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.age]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-14" style={{ borderColor: '#1f2937', maxWidth: '3.5rem' }}><span {...cvEditable('age', '')} /></td>
                  <td rowSpan={5} className="border p-2 align-middle text-center w-24" style={{ borderColor: '#1f2937', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center gap-2">
                      {currentAvatarPreview ? (
                        <div style={{ height: '7.5rem', width: '5.625rem', overflow: 'hidden', margin: '0 auto' }}>
                          <img src={currentAvatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '3/4', display: 'block' }} />
                        </div>
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
                  <td className="border p-1 font-medium w-16 whitespace-nowrap text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem', maxWidth: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-shimei" text="氏名" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKanji]} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 bg-white min-w-0" style={{ borderColor: '#1f2937' }}><span {...cvEditable('nameKanji', '')} /></td>
                  <td className="border p-1 font-medium w-14 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3.5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-gender" text="性別" supplementMarking={supplementMarking} linkedFieldKeys={['gender']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}>
                    <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" className="rounded" checked={formData.gender === '男'} onChange={() => setFormData(prev => ({ ...prev, gender: '男' }))} /> 男</label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer mt-0.5"><input type="checkbox" className="rounded" checked={formData.gender === '女'} onChange={() => setFormData(prev => ({ ...prev, gender: '女' }))} /> 女</label>
                  </td>
                  <td className="border p-1 font-medium w-16 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '4rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-passport" text="パスポート" supplementMarking={supplementMarking} linkedFieldKeys={['passport']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}>
                    <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" className="rounded" checked={formData.passport === '有' || formData.passport === '1'} onChange={() => setFormData(prev => ({ ...prev, passport: '有' }))} /> 有</label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer mt-0.5"><input type="checkbox" className="rounded" checked={formData.passport === '無' || formData.passport === '0'} onChange={() => setFormData(prev => ({ ...prev, passport: '無' }))} /> 無</label>
                  </td>
                </tr>
                <tr>
                  <td className="border p-1 font-medium w-14 whitespace-nowrap text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem', maxWidth: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-email" text="Email" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.email]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0" style={{ borderColor: '#1f2937', maxWidth: '6rem' }}><span {...cvEditable('email', '')} /></td>
                  <td className="border p-1 font-medium w-12 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-denwa" text="電話" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.phone]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}><span {...cvEditable('phone', '')} /></td>
                  <td className="border p-1 font-medium w-16 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '4rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-skypeId" text="Skype ID" supplementMarking={supplementMarking} linkedFieldKeys={['skypeId']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}><span {...cvEditable('skypeId', '')} /></td>
                </tr>
                <tr>
                  <td className="border p-1 font-medium w-14 whitespace-nowrap text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem', maxWidth: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-genju" text="現住所" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.postalCode, CV_LINK.address]} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0 text-center" style={{ borderColor: '#1f2937', maxWidth: '6rem' }}>
                    <span
                      {...cvEditable('address', 'block text-center')}
                      children={undefined}
                    >
                      {renderMarked([
                        formData.postalCode ? `〒${formData.postalCode}` : '',
                        formData.address || ''
                      ].filter(Boolean).join(' ') || '　', 'tpl-tech-genju', 'address', ['postalCode'])}
                    </span>
                  </td>
                  <td className="border p-1 font-medium w-14 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3.5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-addressOrigin" text="出身地" supplementMarking={supplementMarking} linkedFieldKeys={['addressOrigin']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}><span {...cvEditable('addressOrigin', '')} /></td>
                  <td className="border p-1 font-medium w-14 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '3.5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-hasSpouse" text="配偶者" supplementMarking={supplementMarking} linkedFieldKeys={['hasSpouse']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}>
                    <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" className="rounded" checked={formData.hasSpouse === '有'} onChange={() => setFormData(prev => ({ ...prev, hasSpouse: '有' }))} /> 有</label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer mt-0.5"><input type="checkbox" className="rounded" checked={formData.hasSpouse === '無'} onChange={() => setFormData(prev => ({ ...prev, hasSpouse: '無' }))} /> 無</label>
                  </td>
                </tr>
                <tr>
                  <td className="border p-1 font-medium w-20 whitespace-nowrap text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem', maxWidth: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-stayPurpose" text="日本滞在目的" supplementMarking={supplementMarking} linkedFieldKeys={['label-jpResidenceStatus', 'jpResidenceStatus']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white min-w-0 text-xs relative" style={{ borderColor: '#1f2937', maxWidth: '12rem' }} colSpan={3}>
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
                  <td className="border p-1 font-medium w-16 text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', maxWidth: '4rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-label-visaExpiry" text="ビザの期限" supplementMarking={supplementMarking} linkedFieldKeys={['visaExpirationDate']} className="select-text inline" />
                  </td>
                  <td className="border p-1 bg-white w-20 whitespace-nowrap" style={{ borderColor: '#1f2937', maxWidth: '5rem' }}>
                    <CvTemplateDateTriplet
                      field="visaExpirationDate"
                      refs={{ y: visaYearRef, mo: visaMonthRef, d: visaDayRef }}
                      parts={visaExpiryParts}
                      errorMessage={dateFieldErrors.visaExpirationDate}
                      onCommit={commitDateField}
                      onClearError={clearDateError}
                    />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 学歴 */}
            <ResizableCvTable
              className="w-full border-collapse mt-3 font-bold"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'education', [12, 20, 18, 18, 18, 14])}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'education')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td rowSpan={1 + Math.max(1, (formData.educations || []).length)} className="border p-2 text-center align-middle" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-education-title" text="学歴" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-education', 'education', 'education-0-content']} />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-school" text="学校名 (英語名)" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-school_name']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-major" text="学部・専攻" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-major']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-start" text="入学年月" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-year']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-end" text="卒業年月" supplementMarking={supplementMarking} linkedFieldKeys={['education-0-endYear']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-edu-h-years" text="年数" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-education']} className="select-text inline" />
                  </td>
                </tr>
                {Array.from({ length: Math.max(1, (formData.educations || []).length) }).map((_, i) => {
                  const edu = formData.educations?.[i] || {};
                  return (
                    <tr key={`gakureki-${i}`} onMouseEnter={() => setHoveredEducationIndex(i)} onMouseLeave={() => setHoveredEducationIndex(null)}>
                      <td className="border p-1.5 bg-white relative" style={{ borderColor: '#1f2937' }}>
                        {hoveredEducationIndex === i ? (
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); setFormData((prev) => ({ ...prev, educations: (prev.educations || []).filter((_, idx) => idx !== i) })); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa 学歴" aria-label="Xóa 学歴"><Trash2 className="w-3.5 h-3.5" /></button>
                        ) : null}
                        <span {...cvEditableArray('educations', i, 'school_name', 'block whitespace-pre-wrap')} />
                      </td>
                      <td className="border p-1.5 bg-white" style={{ borderColor: '#1f2937' }}>
                        <span {...cvEditableArray('educations', i, 'major', 'block whitespace-pre-wrap')} />
                      </td>
                      <td className="border p-1.5 bg-white text-center" style={{ borderColor: '#1f2937' }}>
                        <span ref={(el) => { eduYearRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block" style={{ minWidth: '2.2em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.year || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, false)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 4); moveCaretToEnd(e.currentTarget); }}>{edu.year || ''}</span><span>年</span><span ref={(el) => { eduMonthRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block ml-0.5" style={{ minWidth: '1.8em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.month || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, false)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 2); moveCaretToEnd(e.currentTarget); }}>{edu.month || ''}</span><span>月</span>
                      </td>
                      <td className="border p-1.5 bg-white text-center" style={{ borderColor: '#1f2937' }}>
                        <span ref={(el) => { eduEndYearRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block" style={{ minWidth: '2.2em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.endYear || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, true)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 4); moveCaretToEnd(e.currentTarget); }}>{edu.endYear || ''}</span><span>年</span><span ref={(el) => { eduEndMonthRefs.current[i] = el; }} contentEditable suppressContentEditableWarning tabIndex={0} className="whitespace-nowrap tabular-nums text-center inline-block ml-0.5" style={{ minWidth: '1.8em', outline: 'none' }} onFocus={(e) => { if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = edu.endMonth || ''; moveCaretToEnd(e.currentTarget); }} onBlur={() => syncEduParts(i, true)} onInput={(e) => { e.currentTarget.textContent = normalizeEduPart(e.currentTarget.textContent, 2); moveCaretToEnd(e.currentTarget); }}>{edu.endMonth || ''}</span><span>月</span>
                      </td>
                      <td className="border p-1.5 bg-white text-center" style={{ borderColor: '#1f2937' }}>　</td>
                    </tr>
                  );
                })}
              </tbody>
            </ResizableCvTable>
            <div className="mt-2 mb-2 flex justify-center"><button type="button" onMouseDown={(e) => { e.preventDefault(); addEducationRow(); }} onClick={addEducationRow} className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800"><Plus className="w-3.5 h-3.5" /> 行を追加</button></div>

            {/* 外国語の会話レベル */}
            <ResizableCvTable
              className="w-full border-collapse mt-3 font-bold"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'languages', [12, 14, 14, 14, 24, 22])}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'languages')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td rowSpan={4} className="border p-2 text-center align-middle" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-language-title" text="外国語の会話レベル" supplementMarking={supplementMarking} linkedFieldKeys={['jpConversationLevel', 'enConversationLevel', 'otherConversationLevel', 'languageSkillRemarks', 'remarks']} />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-jp" text="日本語" supplementMarking={supplementMarking} linkedFieldKeys={['jpConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-en" text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['enConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-other" text="その他 ( )" supplementMarking={supplementMarking} linkedFieldKeys={['otherConversationLevel']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '10rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-lang-h-skill-note" text="言語スキル補足説明" supplementMarking={supplementMarking} linkedFieldKeys={['languageSkillRemarks']} className="select-text inline" />
                  </td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '10rem' }}>
                    <SupplementTplText fieldKey="tpl-tech-language-remarks-title" text="備考" supplementMarking={supplementMarking} linkedFieldKeys={['remarks']} />
                  </td>
                </tr>
                {LANGUAGE_LEVEL_OPTIONS.map(({ value, label }, rowIdx) => (
                  <tr key={value}>
                    {LANGUAGE_LEVEL_FIELDS.map((field) => (
                      <td key={field} className="border p-1.5 bg-white" style={{ borderColor: '#1f2937' }}>
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded"
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
                          ・{label}
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
            />

            {/* 使用可能ツール・ソフトウェア等枠: 2 cột (学習した / 業務で利用した), dữ liệu từ 24 & 25, mỗi ô = [tên | ô nhập], không checkbox */}
            <ResizableCvTable
              className="w-full border-collapse mt-3 font-bold"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'tools', [12, 22, 22, 22, 22])}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'tools')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                {(() => {
                  const learned = formData.learnedTools || [];
                  const experienced = formData.experienceTools || [];
                  const rowCount = Math.max(1, learned.length, experienced.length);
                  const rowStyle = { borderColor: '#1f2937' };
                  const removeToolRow = (type, index) => {
                    setFormData((prev) => {
                      const toolKey = type === 'learned' ? 'learnedTools' : 'experienceTools';
                      const tools = [...(prev[toolKey] || [])];
                      const notes = prev.toolsSoftwareNotes || {};
                      const noteKey = type === 'learned' ? 'learned' : 'experienced';
                      const removedName = tools[index] || '';
                      tools.splice(index, 1);
                      const nextNotes = { ...notes, [noteKey]: { ...(notes[noteKey] || {}) } };
                      if (removedName) delete nextNotes[noteKey][removedName];
                      else delete nextNotes[noteKey][`__${type === 'learned' ? 'learned' : 'experienced'}_${index}`];
                      return { ...prev, [toolKey]: tools, toolsSoftwareNotes: nextNotes };
                    });
                  };
                  const addToolRow = (type) => {
                    setFormData((prev) => ({
                      ...prev,
                      [type === 'learned' ? 'learnedTools' : 'experienceTools']: [...(prev[type === 'learned' ? 'learnedTools' : 'experienceTools'] || []), ''],
                    }));
                  };
                  return (
                    <>
                      <tr>
                        <td rowSpan={rowCount + 2} className="border p-2 text-center align-middle" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '5rem' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-title-side" text="使用可能ツール・ソフトウェア等枠" supplementMarking={supplementMarking} linkedFieldKeys={['learnedTools', 'experienceTools', 'toolsSoftwareNotes']} className="select-text inline" />
                        </td>
                        <td colSpan={2} className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-h-learned" text="学習したツール・ソフトウェア" supplementMarking={supplementMarking} linkedFieldKeys={['learnedTools']} className="select-text inline" />
                        </td>
                        <td colSpan={2} className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                          <SupplementTplText fieldKey="tpl-tech-tools-h-exp" text="業務で利用したツール・ソフトウェア" supplementMarking={supplementMarking} linkedFieldKeys={['experienceTools']} className="select-text inline" />
                        </td>
                      </tr>
                      {Array.from({ length: rowCount }).map((_, ri) => {
                        const learnedName = learned[ri] ?? '';
                        const expName = experienced[ri] ?? '';
                        return (
                          <tr key={ri} onMouseLeave={() => { setHoveredLearnedToolIndex(null); setHoveredExperienceToolIndex(null); }}>
                            <td className="border p-1.5 bg-white text-left relative" style={{ ...rowStyle, borderRight: '2px dotted #1f2937' }} onMouseEnter={() => setHoveredLearnedToolIndex(ri)}>
                              {hoveredLearnedToolIndex === ri ? (
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); removeToolRow('learned', ri); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa hàng" aria-label="Xóa hàng"><Trash2 className="w-3.5 h-3.5" /></button>
                              ) : null}
                              <SupplementTplText fieldKey={`tpl-tech-tools-learned-name-${ri}`} text={learnedName.trim() ? learnedName : '　'} supplementMarking={supplementMarking} linkedFieldKeys={['learnedTools']} className="text-xs pl-1 select-text inline min-w-0" />
                            </td>
                            <td className="border p-1 bg-white text-center align-middle" style={{ borderColor: '#1f2937', borderLeft: '2px dotted #1f2937', minWidth: '2.5rem' }}>
                              <span
                                {...makeInlineEditable(
                                  `tools-learned-${ri}`,
                                  (formData.toolsSoftwareNotes?.learned || {})[learnedName || `__learned_${ri}`] || '',
                                  (v) => {
                                    const key = learnedName || `__learned_${ri}`;
                                    setFormData((prev) => ({
                                      ...prev,
                                      toolsSoftwareNotes: {
                                        ...(prev.toolsSoftwareNotes || {}),
                                        learned: { ...(prev.toolsSoftwareNotes?.learned || {}), [key]: v },
                                        experienced: prev.toolsSoftwareNotes?.experienced || {},
                                        experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                                      },
                                    }));
                                  },
                                  { className: 'outline-none min-h-[1.2em] block text-center text-xs w-full whitespace-pre-wrap' }
                                )}
                              />
                            </td>
                            <td className="border p-1.5 bg-white text-left relative" style={{ ...rowStyle, borderRight: '2px dotted #1f2937' }} onMouseEnter={() => setHoveredExperienceToolIndex(ri)}>
                              {hoveredExperienceToolIndex === ri ? (
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); removeToolRow('experience', ri); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa hàng" aria-label="Xóa hàng"><Trash2 className="w-3.5 h-3.5" /></button>
                              ) : null}
                              <SupplementTplText fieldKey={`tpl-tech-tools-exp-name-${ri}`} text={expName.trim() ? expName : '　'} supplementMarking={supplementMarking} linkedFieldKeys={['experienceTools']} className="text-xs pl-1 select-text inline min-w-0" />
                            </td>
                            <td className="border p-1 bg-white text-center align-middle" style={{ borderColor: '#1f2937', borderLeft: '2px dotted #1f2937', minWidth: '2.5rem' }}>
                              <span
                                {...makeInlineEditable(
                                  `tools-exp-${ri}`,
                                  (formData.toolsSoftwareNotes?.experienced || {})[expName || `__experienced_${ri}`] || '',
                                  (v) => {
                                    const key = expName || `__experienced_${ri}`;
                                    setFormData((prev) => ({
                                      ...prev,
                                      toolsSoftwareNotes: {
                                        ...(prev.toolsSoftwareNotes || {}),
                                        learned: prev.toolsSoftwareNotes?.learned || {},
                                        experienced: { ...(prev.toolsSoftwareNotes?.experienced || {}), [key]: v },
                                        experiencedOther: prev.toolsSoftwareNotes?.experiencedOther ?? '',
                                      },
                                    }));
                                  },
                                  { className: 'outline-none min-h-[1.2em] block text-center text-xs w-full whitespace-pre-wrap' }
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={4} className="border p-1 text-center bg-gray-50" style={rowStyle}>
                          <button type="button" onClick={() => addToolRow('learned')} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
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
              className="w-full border-collapse mt-3 font-bold"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'employment', [22, 20, 38, 20])}
              layoutKey={cvLayoutKey(CV_TPL, 'rirekisho', 'employment')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '10rem', maxWidth: '10rem' }}><SupplementTplText fieldKey="tpl-tech-rireki-period-h" text="期間" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-period']} /></td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', minWidth: '9rem' }}><SupplementTplText fieldKey="tpl-tech-rireki-place-h" text="勤務地" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-place']} /></td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', minWidth: '14rem' }}><SupplementTplText fieldKey="tpl-tech-rireki-company-h" text="企業名" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-company']} /></td>
                  <td className="border p-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', width: '8rem', maxWidth: '8rem' }}><SupplementTplText fieldKey="tpl-tech-rireki-role-h" text="ポジション・役割" supplementMarking={supplementMarking} linkedFieldKeys={['employment-0-description', 'employment-0-scale']} /></td>
                </tr>
                {(() => {
                  const list = formData.workExperiences || [];
                  const workCount = Math.max(1, formData.workHistoryCount ?? list.length);
                  const cellEditStyle = { outline: 'none', minHeight: '1em', minWidth: '1.5em', display: 'inline-block', cursor: 'text' };
                  return Array.from({ length: workCount }).map((_, i) => {
                    const row = list[i] || {};
                    const startRaw = row.start_date || [row.startYear, row.startMonth].filter(Boolean).join('/');
                    const endRaw = row.endCurrent ? '現在' : (row.end_date || [row.endYear, row.endMonth].filter(Boolean).join('/'));
                    const periodDisplay = formatShokumuPeriodRangeJa(startRaw, endRaw) || row.period || '';
                    const companyNameDisplay = (row.company_name || '').replace(/\s*入社\s*$|\s*退社\s*$/g, '').trim();
                    const employmentPlaceDisplay = row.employmentPlace || row.employment_place || row.work_location || row.location || '';
                    const companyRoleDisplay = row.companyRole || row.company_role || row.position_role || row.position_name || row.position || '';
                    const businessDisplay = row.business_purpose || row.business_objective || '';
                    const descriptionDisplay = row.description || '';
                    const normalizedBusinessDisplay = businessDisplay.replace(/\s+/g, ' ').trim();
                    const normalizedDescriptionDisplay = descriptionDisplay.replace(/\s+/g, ' ').trim();
                    const showDescription = normalizedDescriptionDisplay && normalizedDescriptionDisplay !== normalizedBusinessDisplay;
                    return (
                      <React.Fragment key={`shokureki-${i}`}>
                        <tr>
                          <td className="border p-1.5 bg-white text-center align-middle" style={{ borderColor: '#1f2937', width: '10rem', maxWidth: '10rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            <div className="inline-flex items-center justify-center gap-0.5 max-w-full overflow-hidden whitespace-nowrap">
                              <span
                                {...makeMarkedInlineEditable(
                                  `rireki-period-${i}`,
                                  periodDisplay,
                                  (v) => (updateEmploymentPair || updateEmployment)(i, 'period', v),
                                  renderMarked(formatShokumuPeriodCell(periodDisplay) || periodDisplay || '　', `tpl-tech-rireki-${i}-period`, `employment-${i}-period`),
                                  {
                                    onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-period`),
                                    style: cellEditStyle,
                                    className: 'min-w-0 shrink overflow-hidden whitespace-pre-wrap',
                                    multiline: true,
                                  }
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updater = updateEmploymentPair || updateEmployment;
                                  if (row.endCurrent) {
                                    updater(i, 'endCurrent', false);
                                    updater(i, 'period', '');
                                  } else {
                                    updater(i, 'endCurrent', true);
                                    updater(i, 'period', '現在');
                                  }
                                }}
                                className="shrink-0 rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              >
                                現在
                              </button>
                            </div>
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle" style={{ borderColor: '#1f2937', minWidth: '9rem' }}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-place-${i}`,
                                employmentPlaceDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'employmentPlace', v),
                                renderMarked(employmentPlaceDisplay || '　', `tpl-tech-rireki-${i}-place`, `employment-${i}-place`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-place`),
                                  style: cellEditStyle,
                                  className: 'whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle" style={{ borderColor: '#1f2937', minWidth: '14rem' }}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-company-${i}`,
                                companyNameDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'company_name', v),
                                renderMarked(companyNameDisplay || '　', `tpl-tech-rireki-${i}-company`, `employment-${i}-company`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-company`),
                                  style: cellEditStyle,
                                  className: 'whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                          <td className="border p-1.5 bg-white text-center align-middle" style={{ borderColor: '#1f2937', width: '8rem', maxWidth: '8rem' }}>
                            <span
                              {...makeMarkedInlineEditable(
                                `rireki-role-${i}`,
                                companyRoleDisplay,
                                (v) => (updateEmploymentPair || updateEmployment)(i, 'companyRole', v),
                                renderMarked(companyRoleDisplay || '　', `tpl-tech-rireki-${i}-companyRole`, `employment-${i}-companyRole`),
                                {
                                  onContextMenu: (e) => supplementMarking?.onFieldContextMenu?.(e, `employment-${i}-companyRole`),
                                  style: cellEditStyle,
                                  className: 'whitespace-pre-wrap',
                                }
                              )}
                            />
                          </td>
                        </tr>
                        {i < workCount - 1 && handleInsertWorkExperienceBlockAt && (
                          <tr>
                            <td colSpan={4} className="border p-0.5 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' }}>
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
                <tr>
                  <td colSpan={4} className="border p-1.5 font-medium text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-selfpr-title" text="自己PR (大学での成績順位、頑張ったこと、趣味等)" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-strengths', 'strengths', 'hobbiesSpecialSkills']} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-2 bg-white align-top min-h-[80px]" style={{ borderColor: '#1f2937' }}>
                    <div {...cvEditable('strengths', 'block whitespace-pre-wrap outline-none min-h-[80px]', { minHeight: '80px' })} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-1.5 font-medium text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-motivation-title" text="応募動機" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-motivation', 'motivation']} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-2 bg-white align-top" style={{ borderColor: '#1f2937', minHeight: '80px' }}>
                    <div {...cvEditable('motivation', 'block whitespace-pre-wrap outline-none min-h-[80px]', { minHeight: '80px' })} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border p-1.5 font-medium text-center" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9' }}>
                    <SupplementTplText fieldKey="tpl-tech-note-title" text="備考" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-block6-prefs', 'currentSalary', 'desiredSalary', 'desiredPosition', 'desiredLocation', 'visaExpirationDate']} />
                  </td>
                </tr>
                <tr data-cv-table-footer-row>
                  <td colSpan={4} className="border p-2 bg-white align-top" style={{ borderColor: '#1f2937', fontSize: '10px' }}>
                    <div className="space-y-1">
                      <div>・現年収: <span {...cvEditable('currentSalary', 'inline-block min-w-[6em]')} /></div>
                      <div>・希望年収: <span {...cvEditable('desiredSalary', 'inline-block min-w-[6em]')} /></div>
                      <div>・希望職種: <span {...cvEditable('desiredPosition', 'inline-block min-w-[6em]')} /></div>
                      <div>・希望勤務地: <span {...cvEditable('desiredLocation', 'inline-block min-w-[6em]')} /></div>
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
          <div className="w-full cv-template-body font-bold" style={{ fontSize: '11px', color: '#1f2937' }}>
            <div className="mb-6">
              <h2 className="text-center font-bold mb-8" style={{ fontSize: '1.25rem' }}>
                <SupplementTplText fieldKey="tpl-tech-shokumu-h2" text="職務経歴書" supplementMarking={supplementMarking} />
              </h2>
              <div className="text-right space-y-1">
                <div>現在、<span {...cvEditableWithDefault('cvDocumentDate', getDefaultCvDate(false), 'inline-block min-w-[8em]', {}, (v) => formatCvDocumentHeaderJa(String(v || '').replace(/現在$/, '')))} /></div>
                <div>氏名: <span {...cvEditable('nameKanji', '')} /> (<span {...cvEditable('nameKana', '')} />)</div>
              </div>
            </div>

            {/* 職務要約 */}
            <ResizableCvTable
              className="w-full border-collapse font-bold mt-4"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
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
                    <div className="whitespace-pre-wrap min-h-[4rem]" {...cvEditable('careerSummary', 'block')} />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 職務経歴 – Technical: editable like AddCandidateForm, with add/delete controls. */}
            <div className="mt-4">
              <div className="border p-2 text-center font-bold" style={{ borderColor: '#1f2937', backgroundColor: '#e2efd9', color: '#1f2937' }}>
                <SupplementTplText fieldKey="tpl-tech-shokumu-work-banner" text="職務経歴" supplementMarking={supplementMarking} linkedFieldKeys={['workExperiences-0-company_name']} className="select-text inline" />
              </div>
              {(() => {
                const list = formData.workExperiences || [];
                const workCount = Math.max(1, formData.workHistoryCount ?? list.length);
                const cellStyle = { outline: 'none', minHeight: '1em', minWidth: '1.5em', display: 'inline-block', cursor: 'text' };
                const formatWorkPeriodDisplay = (emp = {}) => {
                  const startLabel = emp.start_date || [emp.startYear, emp.startMonth].filter(Boolean).join('/');
                  const endLabel = emp.endCurrent ? '現在' : (emp.end_date || [emp.endYear, emp.endMonth].filter(Boolean).join('/'));
                  return formatShokumuPeriodRangeJa(startLabel, endLabel)
                    || formatShokumuPeriodCell(`${startLabel}～${endLabel}`)
                    || (startLabel && endLabel ? `${startLabel}～${endLabel}` : '')
                    || '';
                };
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
                const setWorkPeriodEnd = (index, year, month) => {
                  const y = String(year || '').trim();
                  const m = String(month || '').trim();
                  setWorkField(index, 'endYear', y);
                  setWorkField(index, 'endMonth', m);
                  setWorkField(index, 'endCurrent', !y && !m);
                  if (!y && !m) setWorkField(index, 'period', '現在');
                  else if (y && m) setWorkField(index, 'period', `${y}/${m}`);
                };
                const setWorkEndCurrent = (index, isCurrent) => {
                  if (isCurrent) {
                    setFormData((prev) => {
                      const next = [...(prev.workExperiences || [])];
                      if (!next[index]) next[index] = {};
                      next[index] = { ...next[index], endCurrent: true, endYear: '', endMonth: '', period: '現在' };
                      return { ...prev, workExperiences: next };
                    });
                  } else {
                    setFormData((prev) => {
                      const next = [...(prev.workExperiences || [])];
                      if (!next[index]) next[index] = {};
                      next[index] = { ...next[index], endCurrent: false, endYear: '', endMonth: '', period: '' };
                      return { ...prev, workExperiences: next };
                    });
                  }
                };
                const addWorkRow = () => {
                  if (handleAddWorkExperience) handleAddWorkExperience();
                  else setFormData((prev) => ({
                    ...prev,
                    workExperiences: [...(prev.workExperiences || []), { company_name: '', employmentPlace: '', companyRole: '', description: '', tools_tech: '', startYear: '', startMonth: '', endYear: '', endMonth: '', endCurrent: false, period: '' }],
                  }));
                };
                const deleteWorkRow = (index) => {
                  setFormData((prev) => {
                    const next = [...(prev.workExperiences || [])].filter((_, i) => i !== index);
                    return { ...prev, workExperiences: next, workHistoryCount: Math.max(1, next.length) };
                  });
                };
                return Array.from({ length: workCount }).map((_, i) => {
                  const emp = list[i] || {};
                  const companyDisplay = emp.company_name || emp.companyName || emp.company || emp.companyKanji || emp.companyJa || '　';
                  const placeDisplay = emp.employmentPlace || emp.employment_place || emp.work_location || emp.location || '　';
                  const roleDisplay = emp.companyRole || emp.company_role || emp.position_role || emp.position_name || emp.positionName || emp.position || emp.role || emp.jobTitle || '　';
                  const periodDisplay = formatWorkPeriodDisplay(emp) || '　';
                  const descDisplay = emp.description || '　';
                  const toolsDisplay = emp.tools_tech || '　';
                  const businessDisplay = emp.business_purpose || '　';
                  const scaleDisplay = emp.scale_role || '　';
                  const reasonDisplay = emp.reason_for_leaving || '　';
                  const showDescription = String(descDisplay || '').trim() !== String(businessDisplay || '').trim();
                  const showDelete = hoveredWorkIndex === i;
                  return (
                    <div key={`tech-work-${i}`} className="mb-2 last:mb-0" onMouseEnter={() => setHoveredWorkIndex(i)} onMouseLeave={() => setHoveredWorkIndex(null)}>
                      <ResizableCvTable
                        className="w-full border-collapse font-bold mt-0"
                        style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937', borderTopWidth: i === 0 ? undefined : 0 }}
                        colPercents={colSaved('shokumu', `workGrid:${i}`, [11, 39, 38, 12])}
                        layoutKey={cvLayoutKey(CV_TPL, 'shokumu', `workGrid:${i}`)}
                        onLayoutCommit={onCvTableLayoutCommit}
                      >
                        <tbody>
                          <tr>
                            <td className="border py-0.5 px-1.5 text-center align-middle" style={{ borderColor: '#1f2937', backgroundColor: '#e5e7eb', width: '11%', position: 'relative' }}>
                              <SupplementTplText fieldKey={`tpl-tech-shokumu-block-label-${i}`} text={`【職歴${i + 1}】`} supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-period`]} className="select-text inline text-xs" />
                              {showDelete ? (
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); deleteWorkRow(i); }} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50" title="Xóa 職務経歴" aria-label="Xóa 職務経歴">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </td>
                            <td className="border py-0.5 px-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e5e7eb', width: '40%', minWidth: '38%' }}>
                              <span {...makeInlineEditable(`shokumu-company-${i}`, emp.company_name || emp.companyName || emp.company || '', (v) => setWorkField(i, 'company_name', v), { className: 'block w-full outline-none whitespace-pre-wrap' })} />
                            </td>
                            <td className="border py-0.5 px-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e5e7eb' }}>
                              <span {...makeInlineEditable(`shokumu-role-${i}`, emp.companyRole || emp.company_role || emp.position || '', (v) => setWorkField(i, 'companyRole', v), { className: 'block w-full outline-none whitespace-pre-wrap' })} />
                            </td>
                            <td className="border py-0.5 px-1.5 text-center font-medium" style={{ borderColor: '#1f2937', backgroundColor: '#e5e7eb', width: '12%', maxWidth: '12%' }}>
                              <span {...makeInlineEditable(`shokumu-place-${i}`, emp.employmentPlace || emp.employment_place || emp.work_location || '', (v) => setWorkField(i, 'employmentPlace', v), { className: 'block w-full outline-none whitespace-pre-wrap' })} />
                            </td>
                          </tr>
                          <tr>
                            <td className="border py-0.5 px-1.5 text-center font-medium bg-white" style={{ borderColor: '#1f2937', width: '11%' }}>
                              <SupplementTplText fieldKey="tpl-tech-shokumu-period-h" text="期間" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-period`]} />
                            </td>
                            <td colSpan={2} className="border py-0.5 px-1.5 text-center font-medium bg-white" style={{ borderColor: '#1f2937', minWidth: '70%' }}>
                              <SupplementTplText fieldKey="tpl-tech-shokumu-h-desc-tech" text="業務内容" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-description`]} className="select-text inline" />
                            </td>
                            <td className="border py-0.5 px-1.5 text-center font-medium bg-white" style={{ borderColor: '#1f2937', width: '12%', maxWidth: '12%' }}>
                              <SupplementTplText fieldKey="tpl-tech-shokumu-h-tools" text="使用ツール" supplementMarking={supplementMarking} linkedFieldKeys={[`workExperiences-${i}-tools_tech`]} className="select-text inline" />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-1.5 bg-white align-middle text-center" style={{ borderColor: '#1f2937', width: '11%' }}>
                              <div className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 text-center max-w-full overflow-hidden">
                                <span
                                  {...makeInlineEditable(`shokumu-startYear-${i}`, emp.startYear || '', (v) => setWorkField(i, 'startYear', v), { className: 'inline-block min-w-[2.2em] outline-none tabular-nums', multiline: false })}
                                />
                                <span>年</span>
                                <span
                                  {...makeInlineEditable(`shokumu-startMonth-${i}`, emp.startMonth || '', (v) => setWorkField(i, 'startMonth', v), { className: 'inline-block min-w-[1.8em] outline-none tabular-nums', multiline: false })}
                                />
                                <span>月～</span>
                                {emp.endCurrent ? (
                                  <button
                                    type="button"
                                    onClick={() => setWorkEndCurrent(i, false)}
                                    className="inline-flex items-center justify-center rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    現在
                                  </button>
                                ) : (
                                  <>
                                    <span
                                      {...makeInlineEditable(`shokumu-endYear-${i}`, emp.endYear || '', (v) => {
                                        if (!v && !(emp.endMonth || '').trim()) setWorkEndCurrent(i, true);
                                        else setWorkPeriodEnd(i, v, emp.endMonth || '');
                                      }, { className: 'inline-block min-w-[2.2em] outline-none tabular-nums', multiline: false })}
                                    />
                                    <span>年</span>
                                    <span
                                      {...makeInlineEditable(`shokumu-endMonth-${i}`, emp.endMonth || '', (v) => {
                                        if (!v && !(emp.endYear || '').trim()) setWorkEndCurrent(i, true);
                                        else setWorkPeriodEnd(i, emp.endYear || '', v);
                                      }, { className: 'inline-block min-w-[1.8em] outline-none tabular-nums', multiline: false })}
                                    />
                                    <span>月</span>
                                    <button
                                      type="button"
                                      onClick={() => setWorkEndCurrent(i, true)}
                                      className="ml-1 inline-flex items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                    >
                                      現在
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td rowSpan={1} colSpan={2} className="border p-2 bg-white align-top" style={{ borderColor: '#1f2937', minWidth: '70%' }}>
                              <div className="space-y-2">
                                <div><span className="font-medium">【事業内容】</span> <span {...makeInlineEditable(`shokumu-business-${i}`, emp.business_purpose || '', (v) => setWorkField(i, 'business_purpose', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap' })} /></div>
                                {showDescription ? <div><span className="font-medium">【担当業務】</span> <span {...makeInlineEditable(`shokumu-desc-${i}`, emp.description || '', (v) => setWorkField(i, 'description', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap' })} /></div> : null}
                                <div><span className="font-medium">【規模・役割】</span> <span {...makeInlineEditable(`shokumu-scale-${i}`, emp.scale_role || '', (v) => setWorkField(i, 'scale_role', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap' })} /></div>
                                <div><span className="font-medium">【退職理由】</span> <span {...makeInlineEditable(`shokumu-reason-${i}`, emp.reason_for_leaving || '', (v) => setWorkField(i, 'reason_for_leaving', v), { className: 'inline-block min-w-0 outline-none whitespace-pre-wrap' })} /></div>
                              </div>
                            </td>
                            <td rowSpan={1} className="border p-1.5 bg-white align-top whitespace-pre-wrap" style={{ borderColor: '#1f2937', width: '12%', maxWidth: '12%', verticalAlign: 'top' }}>
                              <span {...makeInlineEditable(`shokumu-tools-${i}`, emp.tools_tech || '', (v) => setWorkField(i, 'tools_tech', v), { className: 'block w-full outline-none whitespace-pre-wrap' })} />
                            </td>
                          </tr>
                        </tbody>
                      </ResizableCvTable>
                    </div>
                  );
                });
              })()}
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (handleAddWorkExperience) handleAddWorkExperience();
                    else {
                      setFormData((prev) => ({
                        ...prev,
                        workExperiences: [...(prev.workExperiences || []), { company_name: '', employmentPlace: '', companyRole: '', description: '', tools_tech: '', startYear: '', startMonth: '', endYear: '', endMonth: '', endCurrent: false, period: '' }],
                      }));
                    }
                  }}
                  className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" /> 行を追加
                </button>
              </div>
            </div>

            {/* 活かせるスキル + 資格・免許 */}
            <ResizableCvTable
              className="w-full border-collapse font-bold mt-4 border"
              style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
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
                  <td className="border p-3 min-h-[100px] bg-white text-sm whitespace-pre-wrap align-top" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
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
                  <td className="border p-3 bg-white text-sm align-top min-h-[4rem]" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
                    <div className="space-y-2" style={{ minHeight: '4rem' }}>
                      {(formData.certificates || []).length > 0 ? (
                        (formData.certificates || []).map((cert, index) => (
                          <div key={`tech-cert-${index}`} className="flex flex-wrap items-center gap-1">
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
                        <div className="flex flex-wrap items-center gap-1 text-gray-400">
                          <span className="shrink-0">・</span>
                          <span>資格・免許</span>
                          <span className="shrink-0">（</span>
                          <span className="w-14 text-center">年</span>
                          <span className="shrink-0">年</span>
                          <span className="w-12 text-center">月</span>
                          <span className="shrink-0">月）</span>
                        </div>
                      )}
                      <div className="pt-1 flex justify-center">
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
