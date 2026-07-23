import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ResizableCvTable from './ResizableCvTable';
import { cvLayoutKey } from './cvLayoutKey';
import { SupplementTplText } from './CvTemplateSupplementText.jsx';
import { CV_LINK } from './cvSupplementLinks.js';
import { formatShokumuPeriodRangeJa } from '../../utils/cvJpDateDisplay.js';

/** Chuẩn hóa birthDate từ form/API (YYYY-MM-DD, ISO datetime, gạch dọc, thiếu số 0) → { y, mo, d }. */
function parseIsoBirthParts(s) {
  const raw = String(s || '').trim();
  if (!raw) return null;
  const dOnly = raw
    .split('T')[0]
    .split(' ')[0]
    .replace(/\//g, '-');
  const m = dOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const y = m[1];
  const moNum = parseInt(m[2], 10);
  const dNum = parseInt(m[3], 10);
  if (Number.isNaN(moNum) || Number.isNaN(dNum) || moNum < 1 || moNum > 12 || dNum < 1 || dNum > 31) {
    return null;
  }
  return { y, mo: String(moNum).padStart(2, '0'), d: String(dNum).padStart(2, '0') };
}

function calculateAgeFromBirthDate(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return String(age);
}

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
function getResidenceStatusLabel(value) {
  const v = String(value ?? '').trim();
  return RESIDENCE_STATUS_LABELS[v] || v;
}

/**
 * CvTemplateCommon – giao diện form CV Template chung (履歴書 + 職務経歴書).
 * Props:
 *   formData, setFormData
 *   cvFormatTab, setCvFormatTab
 *   cvEditable, cvEditableArray, cvEditableWithDefault
 *   getDefaultCvDate
 *   handleAddEducation, handleAddWorkExperience, handleAddCertificate
 *   handleInsertEducationAt, handleInsertWorkExperienceAt, handleInsertCertificateAt
 *   handleBackendPreviewWithOptions
 *   avatarPreview
 *   onAvatarFileSelect — đồng bộ ảnh với parent (preview PDF / submit)
 *   setFormData (optional: ẩn / hiện khối 連絡先 履歴書)
 *   supplementMarking (optional admin: marks + onFieldContextMenu)
 */
const CvTemplateCommon = ({
  formData,
  setFormData,
  cvFormatTab,
  setCvFormatTab,
  cvEditable,
  cvEditableArray,
  cvEditableWithDefault,
  getDefaultCvDate,
  handleAddEducation,
  handleRemoveEducation,
  handleAddWorkExperience,
  handleRemoveWorkExperienceAt,
  handleAddCertificate,
  handleRemoveCertificate,
  handleInsertEducationAt,
  handleInsertWorkExperienceAt,
  handleInsertCertificateAt,
  handleBackendPreviewWithOptions,
  avatarPreview,
  onAvatarFileSelect,
  onCvTableLayoutCommit,
  supplementMarking,
  pdfExportMode = false,
  pdfSectionRefs = null,
  pdfCaptureParts = null,
}) => {
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
  const showRirekishoOptionalContactBlock = formData.cvTableLayout?.rirekishoOptionalContactBlockVisible !== false;
  const [optionalContactBlockActive, setOptionalContactBlockActive] = useState(false);
  const [hoveredEducationIndex, setHoveredEducationIndex] = useState(null);
  const [hoveredWorkIndex, setHoveredWorkIndex] = useState(null);
  const [hoveredCertificateIndex, setHoveredCertificateIndex] = useState(null);
  const [dateFieldErrors, setDateFieldErrors] = useState({ birthDate: '', visaExpirationDate: '' });
  const optContactRow1Ref = useRef(null);
  const optContactRow2Ref = useRef(null);
  const startYearRefs = useRef([]);
  const startMonthRefs = useRef([]);
  const endYearRefs = useRef([]);
  const endMonthRefs = useRef([]);

  useEffect(() => {
    if (!optionalContactBlockActive) return;
    const onDocMouseDown = (e) => {
      const t = e.target;
      if (optContactRow1Ref.current?.contains(t) || optContactRow2Ref.current?.contains(t)) return;
      setOptionalContactBlockActive(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [optionalContactBlockActive]);

  const hideRirekishoOptionalContactBlock = () => {
    if (typeof setFormData !== 'function') return;
    setFormData((prev) => ({
      ...prev,
      cvTableLayout: { ...(prev.cvTableLayout || {}), rirekishoOptionalContactBlockVisible: false },
      contactFurigana: '',
      contactPostalCode: '',
      contactAddress: '',
    }));
    setOptionalContactBlockActive(false);
  };

  const showRirekishoOptionalContactBlockAgain = () => {
    if (typeof setFormData !== 'function') return;
    setFormData((prev) => ({
      ...prev,
      cvTableLayout: { ...(prev.cvTableLayout || {}), rirekishoOptionalContactBlockVisible: true },
    }));
  };

  const layout = formData.cvTableLayout || {};
  const colSaved = (tab, tableId, fallback) =>
    layout[cvLayoutKey('common', tab, tableId)]?.cols ?? fallback;
  /** Khóa template + form để bôi vàng đồng bộ (admin/CTV) */
  const sm = (templateFieldKey, formFieldKey) => ({ templateFieldKey, formFieldKey });

  const birthDateParts = parseIsoBirthParts(formData.birthDate) || { y: '', mo: '', d: '' };
  const birthYearRef = useRef(null);
  const birthMonthRef = useRef(null);
  const birthDayRef = useRef(null);
  const visaExpiryParts = parseIsoBirthParts(formData.visaExpirationDate) || { y: '', mo: '', d: '' };
  const visaYearRef = useRef(null);
  const visaMonthRef = useRef(null);
  const visaDayRef = useRef(null);
  const birthDateEditableStyle = {
    display: 'inline-block',
    minWidth: '2.2em',
    outline: 'none',
    textAlign: 'center',
  };
  const normalizeBirthPart = (value, maxLen) => String(value || '').replace(/\D/g, '').slice(0, maxLen);
  const validateYmdParts = (y, mo, d) => {
    if (!y && !mo && !d) return { ok: true, normalized: '', message: '' };
    if (y.length !== 4 || mo.length === 0 || d.length === 0) return { ok: false, normalized: '', message: 'Vui lòng nhập đủ năm, tháng, ngày.' };
    const yearNum = parseInt(y, 10);
    const monthNum = parseInt(mo, 10);
    const dayNum = parseInt(d, 10);
    if (Number.isNaN(yearNum) || Number.isNaN(monthNum) || Number.isNaN(dayNum)) {
      return { ok: false, normalized: '', message: 'Ngày tháng không hợp lệ.' };
    }
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return { ok: false, normalized: '', message: 'Ngày tháng không hợp lệ.' };
    }
    const normalized = `${String(yearNum).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const check = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(check.getTime()) || check.getFullYear() !== yearNum || check.getMonth() + 1 !== monthNum || check.getDate() !== dayNum) {
      return { ok: false, normalized: '', message: 'Ngày tháng không hợp lệ.' };
    }
    return { ok: true, normalized, message: '' };
  };
  const clearDateFieldError = (field) => {
    setDateFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };
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
        // noop
      }
    });
  };
  const commitRirekishoBirthDate = () => {
    const y = normalizeBirthPart(birthYearRef.current?.textContent, 4);
    const mo = normalizeBirthPart(birthMonthRef.current?.textContent, 2);
    const d = normalizeBirthPart(birthDayRef.current?.textContent, 2);
    const result = validateYmdParts(y, mo, d);
    if (!y && !mo && !d) {
      clearDateFieldError('birthDate');
      setFormData((prev) => ({ ...prev, birthDate: '', age: '' }));
      return;
    }
    if (!result.ok) {
      setDateFieldErrors((prev) => ({ ...prev, birthDate: result.message }));
      return;
    }
    clearDateFieldError('birthDate');
    setFormData((prev) => ({
      ...prev,
      birthDate: result.normalized,
      age: calculateAgeFromBirthDate(result.normalized),
    }));
  };
  const normalizeVisaExpiryPart = (value, maxLen) => String(value || '').replace(/\D/g, '').slice(0, maxLen);
  const commitVisaExpirationDate = () => {
    const y = normalizeVisaExpiryPart(visaYearRef.current?.textContent, 4);
    const mo = normalizeVisaExpiryPart(visaMonthRef.current?.textContent, 2);
    const d = normalizeVisaExpiryPart(visaDayRef.current?.textContent, 2);
    const result = validateYmdParts(y, mo, d);
    if (!y && !mo && !d) {
      clearDateFieldError('visaExpirationDate');
      setFormData((prev) => ({ ...prev, visaExpirationDate: '' }));
      return;
    }
    if (!result.ok) {
      setDateFieldErrors((prev) => ({ ...prev, visaExpirationDate: result.message }));
      return;
    }
    clearDateFieldError('visaExpirationDate');
    setFormData((prev) => ({ ...prev, visaExpirationDate: result.normalized }));
  };

  const captureParts = pdfCaptureParts || ['rirekisho', 'shokumu'];
  const useCapturePartsVisibility = pdfExportMode || pdfCaptureParts != null;
  const showRirekisho = useCapturePartsVisibility ? captureParts.includes('rirekisho') : cvFormatTab === 'rirekisho';
  const showShokumu = useCapturePartsVisibility ? captureParts.includes('shokumu') : cvFormatTab === 'shokumu';

  return (
    <>
      {/* Tab buttons */}
      {!pdfExportMode && (
      <div className="flex border-b mb-2 -mt-0.5" style={{ borderColor: '#e5e7eb' }}>
        <button
          type="button"
          onClick={() => setCvFormatTab('rirekisho')}
          className="px-3 py-1 text-xs font-medium transition-colors"
          style={{
            color: cvFormatTab === 'rirekisho' ? '#2563eb' : '#6b7280',
            borderBottom: cvFormatTab === 'rirekisho' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          【履歴書】フォーマット
        </button>
        <button
          type="button"
          onClick={() => setCvFormatTab('shokumu')}
          className="px-3 py-1 text-xs font-medium transition-colors"
          style={{
            color: cvFormatTab === 'shokumu' ? '#2563eb' : '#6b7280',
            borderBottom: cvFormatTab === 'shokumu' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          【職務経歴書】フォーマット
        </button>
      </div>
      )}

      {/* ===== 履歴書 ===== */}
      {showRirekisho && (
        <div className="w-full min-w-0 max-w-full" ref={pdfSectionRefs?.rirekisho} data-cv-pdf-section="rirekisho">
          {!pdfExportMode && (
          <div className="flex items-center justify-end mb-2 cv-pdf-hide">
            <button
              type="button"
              onClick={() => {
                handleBackendPreviewWithOptions('common', 'rirekisho');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
              style={{ borderColor: '#d1d5db', color: '#2563eb' }}
            >
              Xem preview 【履歴書】
            </button>
          </div>
          )}
          <div
            className="mx-auto w-full min-w-0 max-w-full cv-template-body"
            style={{ fontSize: '11px', color: '#1f2937', fontFamily: "'MS Mincho', 'MS 明朝', 'Yu Mincho', 'Hiragino Mincho ProN', serif" }}
          >
            {/* Header */}
            <div className="flex w-full">
              <div className="px-3 pt-1 pb-3" style={{ width: '75%' }}>
                <div className="flex justify-start">
                  <h2 className="font-bold" style={{ fontSize: '18px', lineHeight: '1.1', transform: 'translateY(-2px)' }}>
                    <SupplementTplText fieldKey="tpl-common-rirekisho-h2" text="履歴書" supplementMarking={supplementMarking} />
                  </h2>
                </div>
                <div className="text-xs text-center mt-1">
                  <span {...cvEditableWithDefault('cvDocumentDate', getDefaultCvDate(true), 'inline-block min-w-[8em]', {}, (v) => v, sm('tpl-common-cvdocdate', 'cvDocumentDate'))} />
                </div>
              </div>
              <div style={{ width: '25%' }} />
            </div>

            {/* Bảng thông tin cá nhân */}
            <ResizableCvTable
              className="w-full border-collapse"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'personalMain', [75, 25])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'personalMain')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border align-top p-1.5" style={{ width: '75%', borderColor: '#1f2937', minHeight: '7.5rem' }}>
                    <div className="w-full min-w-0 border-b border-dotted border-gray-400 overflow-visible">
                      <div className="flex items-end gap-2 w-full min-w-0">
                        <span className="text-xs text-gray-600 flex-shrink-0 pb-[3px]">
                          <SupplementTplText fieldKey="tpl-common-furigana-h" text="ふりがな" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline min-w-0" />
                        </span>
                        <div className="flex-1 min-w-0 flex justify-center items-end">
                          <span
                            {...cvEditable(
                              'nameKana',
                              'w-full min-w-0 min-h-[1.2em] px-0.5 text-[10px] text-center block',
                              { lineHeight: '1.2' },
                              sm('tpl-common-nameKana', 'nameKana')
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2 w-full min-w-0">
                      <div className="text-xs text-gray-600 flex-shrink-0">
                        <SupplementTplText fieldKey="tpl-common-shimei-h" text="氏名" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKanji]} className="select-text inline min-w-0" />
                      </div>
                      <div className="flex-1 min-w-0 flex justify-center">
                        <span
                          {...cvEditable(
                            'nameKanji',
                            'w-full min-h-[1.8em] px-1 text-sm inline-block text-center',
                            { lineHeight: '1.2', fontSize: '15px' },
                            sm('tpl-common-nameKanji', 'nameKanji')
                          )}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="align-top border-0 border-none bg-transparent align-middle pl-2 pt-1.5" style={{ border: 'none', background: 'transparent', width: '25%' }}>
                    <div className="flex flex-col items-center gap-2">
                      {currentAvatarPreview ? (
                        <div style={{ height: '7.5rem', width: '5.625rem', overflow: 'hidden' }}>
                          <img src={currentAvatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '3/4', display: 'block' }} />
                        </div>
                      ) : null}
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
                  <td className="border px-1.5 py-2.5 align-middle" style={{ width: '75%', borderColor: '#1f2937' }}>
                    <div className="flex items-baseline gap-x-2 w-full min-w-0">
                      <span className="text-xs text-gray-600 flex-shrink-0 leading-none pr-0.5" style={{ paddingTop: '0.1em' }}>
                        <SupplementTplText fieldKey="tpl-common-birthdate-lbl" text="生年月日" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.birthDate]} className="select-text inline min-w-0" />
                      </span>
                      <div className="min-w-0 flex-1 flex justify-center">
                        {dateFieldErrors.birthDate ? (
                          <div className="absolute -mt-5 text-[10px] text-rose-600">{dateFieldErrors.birthDate}</div>
                        ) : null}
                      {(() => {
                        const parts = birthDateParts;
                        return (
                          <div
                            className="flex min-w-0 max-w-full items-baseline flex-wrap justify-center"
                            style={{ columnGap: '0.35em', rowGap: '0.15rem' }}
                            onClick={() => clearDateFieldError('birthDate')}
                          >
                            <span
                              ref={birthYearRef}
                              contentEditable
                              suppressContentEditableWarning
                              tabIndex={0}
                              className="whitespace-nowrap tabular-nums text-center"
                              style={{ ...birthDateEditableStyle, borderBottom: dateFieldErrors.birthDate ? '1px solid #ef4444' : birthDateEditableStyle.borderBottom }}
                              onFocus={(e) => {
                                if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = parts.y || '';
                                moveCaretToEnd(e.currentTarget);
                              }}
                              onBlur={() => commitRirekishoBirthDate()}
                              onInput={(e) => {
                                e.currentTarget.textContent = normalizeBirthPart(e.currentTarget.textContent, 4);
                                clearDateFieldError('birthDate');
                                moveCaretToEnd(e.currentTarget);
                              }}
                              title="YYYY"
                            >
                              {parts.y || ''}
                            </span>
                            <span className="whitespace-nowrap tabular-nums">年</span>
                            <span
                              ref={birthMonthRef}
                              contentEditable
                              suppressContentEditableWarning
                              tabIndex={0}
                              className="whitespace-nowrap tabular-nums text-center"
                              style={birthDateEditableStyle}
                              onFocus={(e) => {
                                if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = parts.mo || '';
                                moveCaretToEnd(e.currentTarget);
                              }}
                              onBlur={() => commitRirekishoBirthDate()}
                              onInput={(e) => {
                                e.currentTarget.textContent = normalizeBirthPart(e.currentTarget.textContent, 2);
                                clearDateFieldError('birthDate');
                                moveCaretToEnd(e.currentTarget);
                              }}
                              title="MM"
                            >
                              {parts.mo || ''}
                            </span>
                            <span className="whitespace-nowrap tabular-nums">月</span>
                            <span
                              ref={birthDayRef}
                              contentEditable
                              suppressContentEditableWarning
                              tabIndex={0}
                              className="whitespace-nowrap tabular-nums text-center"
                              style={birthDateEditableStyle}
                              onFocus={(e) => {
                                if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = parts.d || '';
                                moveCaretToEnd(e.currentTarget);
                              }}
                              onBlur={() => commitRirekishoBirthDate()}
                              onInput={(e) => {
                                e.currentTarget.textContent = normalizeBirthPart(e.currentTarget.textContent, 2);
                                clearDateFieldError('birthDate');
                                moveCaretToEnd(e.currentTarget);
                              }}
                              title="DD"
                            >
                              {parts.d || ''}
                            </span>
                            <span className="whitespace-nowrap tabular-nums">日生</span>
                            <span className="whitespace-nowrap ml-1">
                              <span>（満</span>
                              <span
                                className="inline-block min-w-[1.1em] px-1 text-center"
                                style={{ marginLeft: '0.35em' }}
                                {...cvEditable('age', '', {}, sm('tpl-common-age', 'age'))}
                              />
                              <span>歳）</span>
                            </span>
                          </div>
                        );
                      })()}
                      </div>
                    </div>
                  </td>
                  <td className="border align-top p-1.5" style={{ borderColor: '#1f2937' }}>
                    <div className="mb-1 text-xs text-gray-600">
                      <SupplementTplText fieldKey="tpl-common-gender-h" text="※性別" supplementMarking={supplementMarking} linkedFieldKeys={['label-gender']} className="select-text inline min-w-0" />
                    </div>
                    <div className="flex items-center justify-center gap-2 min-h-[1.6em]">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, gender: '男' }))}
                        className={formData.gender === '男' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Nam"
                      >
                        男
                      </button>
                      <span className="text-gray-400">・</span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, gender: '女' }))}
                        className={formData.gender === '女' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Nữ"
                      >
                        女
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border p-1.5 align-top" style={{ width: '75%', borderColor: '#1f2937' }}>
                    <div className="w-full min-w-0 border-b border-dotted border-gray-400 overflow-visible mb-1">
                      <div className="flex items-end gap-2 w-full min-w-0">
                        <span className="text-xs text-gray-600 flex-shrink-0 pb-[3px]">
                          <SupplementTplText fieldKey="tpl-common-addrfurigana-h" text="ふりがな" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline min-w-0" />
                        </span>
                        <div className="flex-1 min-w-0 flex justify-center items-end">
                          <span
                            {...cvEditable(
                              'addressFurigana',
                              'w-full min-w-0 min-h-[1.2em] px-0.5 text-[10px] text-center block',
                              { lineHeight: '1.2' },
                              sm('tpl-common-addressFurigana', 'addressFurigana')
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 w-full min-w-0 min-h-[3.5rem]">
                      <span className="text-xs text-gray-600 flex-shrink-0 w-[4.25rem] pt-0.5">
                        <SupplementTplText fieldKey="tpl-common-genju-h" text="現住所" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.address]} className="select-text inline min-w-0" />
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col gap-y-1.5">
                        <div className="flex w-full min-w-0 items-baseline flex-wrap gap-x-1">
                          <span className="flex-shrink-0">〒</span>
                          <span
                            className="min-w-[6em] flex-1 max-w-full px-0.5"
                            {...cvEditable('postalCode', 'text-left', {}, sm('tpl-common-postalCode', 'postalCode'))}
                          />
                        </div>
                        <div className="w-full min-h-[2em] pl-0 pr-0.5">
                          <span
                            {...cvEditable('address', 'block w-full min-h-[2em] text-left whitespace-pre-wrap', {}, sm('tpl-common-address', 'address'))}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border align-top p-1.5" style={{ borderColor: '#1f2937' }}>
                    <div className="mb-1 text-xs text-gray-600">
                      <SupplementTplText fieldKey="tpl-common-phone-h1" text="電話" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.phone]} className="select-text inline min-w-0" />
                    </div>
                    <div className="min-h-[2em] px-1" {...cvEditable('phone', '', {}, sm('tpl-common-phone', 'phone'))} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border px-1.5 py-2 align-middle" style={{ borderColor: '#1f2937' }}>
                    <div className="flex items-center w-full">
                      <span className="text-xs text-gray-600 flex-shrink-0 mr-2">
                        <SupplementTplText fieldKey="tpl-common-email-h" text="E-mail" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.email]} className="select-text inline min-w-0" />
                      </span>
                      <span className="flex-1 min-h-[1.5em] px-2" {...cvEditable('email', '', {}, sm('tpl-common-email', 'email'))} />
                    </div>
                  </td>
                </tr>
                {!showRirekishoOptionalContactBlock && setFormData && !pdfExportMode ? (
                  <tr className="cv-pdf-hide">
                    <td
                      colSpan={2}
                      className="border border-dashed px-1.5 py-1.5 align-middle"
                      style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}
                    >
                      <button
                        type="button"
                        onClick={showRirekishoOptionalContactBlockAgain}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline w-full text-left"
                      >
                        ＋ 連絡先（現住所以外）ブロックを表示
                      </button>
                    </td>
                  </tr>
                ) : null}
                {showRirekishoOptionalContactBlock ? (
                  <>
                <tr
                  ref={optContactRow1Ref}
                  onClick={() => setOptionalContactBlockActive(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setOptionalContactBlockActive(true);
                  }}
                  className="cursor-default"
                >
                  <td className="border p-1.5 align-top" style={{ width: '75%', borderColor: '#1f2937' }}>
                    <div className="w-full min-w-0 border-b border-dotted border-gray-400 overflow-visible mb-1 pr-5 relative">
                      {optionalContactBlockActive && typeof setFormData === 'function' && !pdfExportMode ? (
                        <span className="absolute right-0 top-0 z-10 flex items-center cv-pdf-hide" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={hideRirekishoOptionalContactBlock}
                            className="p-0.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="この連絡先ブロックを非表示"
                            aria-label="連絡先ブロックを削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : null}
                      <div className="flex items-end gap-2 w-full min-w-0">
                        <span className="text-xs text-gray-600 flex-shrink-0 pb-[3px]">
                          <SupplementTplText fieldKey="tpl-common-contactfurigana-h" text="ふりがな" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline min-w-0" />
                        </span>
                        <div className="flex-1 min-w-0 flex justify-center items-end pr-1">
                          <span
                            {...cvEditable(
                              'contactFurigana',
                              'w-full min-w-0 min-h-[1.2em] px-0.5 text-[10px] text-center block',
                              { lineHeight: '1.2' },
                              sm('tpl-common-contactFurigana', 'contactFurigana')
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td rowSpan={2} className="border p-1.5 align-top" style={{ borderColor: '#1f2937' }}>
                    <div className="mb-1 text-xs text-gray-600">
                      <SupplementTplText fieldKey="tpl-common-phone-h2" text="電話" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.phone]} className="select-text inline min-w-0" />
                    </div>
                    <div className="min-h-[3rem] px-1" {...cvEditable('phone', '', {}, sm('tpl-common-phone-alt', 'phone'))} />
                  </td>
                </tr>
                <tr
                  ref={optContactRow2Ref}
                  onClick={() => setOptionalContactBlockActive(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setOptionalContactBlockActive(true);
                  }}
                  className="cursor-default"
                >
                  <td className="border p-1.5 align-top" style={{ width: '75%', borderColor: '#1f2937', borderTop: 'none' }}>
                    <div className="flex items-baseline flex-wrap gap-x-1 gap-y-1">
                      <span className="text-xs text-gray-600 flex-shrink-0 w-[4.25rem]">
                        <SupplementTplText fieldKey="tpl-common-renrakusaki" text="連絡先" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.phone]} className="select-text inline min-w-0" />
                      </span>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-5 sm:ml-10">(現住所以外に連絡を希望する場合のみ記入)</span>
                    </div>
                    <div className="border-b border-dotted border-gray-400 mt-1 min-h-[1.5em] px-1 text-xs flex justify-center">
                      <div className="inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-1">
                        <span className="flex-shrink-0">〒</span>
                        <span
                          {...cvEditable('contactPostalCode', 'text-center min-w-[3.5em]', {}, sm('tpl-common-contactPostalCode', 'contactPostalCode'))}
                        />
                        <span
                          {...cvEditable('contactAddress', 'min-w-0 min-h-[1.3em] max-w-full text-center', {}, sm('tpl-common-contactAddress', 'contactAddress'))}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
                  </>
                ) : null}
              </tbody>
            </ResizableCvTable>

            {/* Bảng liền: 学歴 + 職歴 + 免許・資格 */}
            {(() => {
              const eduCount = Math.max(1, (formData.educations || []).length);
              const workCount = Math.max(1, (formData.workExperiences || []).length);
              const certCount = Math.max(1, (formData.certificates || []).length);
              return (
                <ResizableCvTable
                  className="w-full border-collapse mt-4"
                  style={{ borderColor: '#1f2937' }}
                  colPercents={colSaved('rirekisho', 'eduWorkCert', [8, 8, 84])}
                  layoutKey={cvLayoutKey('common', 'rirekisho', 'eduWorkCert')}
                  onLayoutCommit={onCvTableLayoutCommit}
                >
                  <tbody>
                    {/* 学歴 */}
                    <tr>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-year" text="年" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-month" text="月" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-edu" text="学歴" supplementMarking={supplementMarking} />
                      </th>
                    </tr>
                    {Array.from({ length: eduCount }).map((_, i) => {
                      const edu = formData.educations?.[i] || {};
                      const schoolMajor = edu.school_name
                        ? [edu.school_name, edu.major].filter(Boolean).join(' ')
                        : (edu.content || '');
                      return (
                        <React.Fragment key={`edu-${i}`}>
                          <tr
                            onMouseEnter={() => setHoveredEducationIndex(i)}
                            onMouseLeave={() => setHoveredEducationIndex(null)}
                            className="relative"
                          >
                            <td className="border p-1.5 text-center text-xs relative" style={{ borderColor: '#1f2937' }}>
                              {hoveredEducationIndex === i && handleRemoveEducation ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEducation(i)}
                                  className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                                  title="Xóa học vấn"
                                  aria-label="Xóa học vấn"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              <span {...cvEditableArray('educations', i, 'year', 'block', {}, undefined, sm(`tpl-common-edu-${i}-year`, `education-${i}-year`))} />
                            </td>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}><span {...cvEditableArray('educations', i, 'month', 'block', {}, undefined, sm(`tpl-common-edu-${i}-month`, `education-${i}-month`))} /></td>
                            <td className="border p-1.5 text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('educations', i, 'content', 'block', {}, schoolMajor, sm(`tpl-common-edu-${i}-content`, `education-${i}-content`))} /> 入学
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}><span {...cvEditableArray('educations', i, 'endYear', 'block', {}, undefined, sm(`tpl-common-edu-${i}-endYear`, `education-${i}-endYear`))} /></td>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}><span {...cvEditableArray('educations', i, 'endMonth', 'block', {}, undefined, sm(`tpl-common-edu-${i}-endMonth`, `education-${i}-endMonth`))} /></td>
                            <td className="border p-1.5 text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('educations', i, 'content', 'block', {}, schoolMajor, sm(`tpl-common-edu-${i}-content-end`, `education-${i}-content`))} /> 卒業
                            </td>
                          </tr>
                          {i < eduCount - 1 && handleInsertEducationAt && (
                            <tr>
                              <td colSpan={3} className="border p-0.5 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' }}>
                                <button type="button" onClick={() => handleInsertEducationAt(i + 1)} className="text-xs text-amber-600 hover:text-amber-800">挿入</button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr>
                      <td colSpan={3} className="border p-1 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                        <button type="button" onClick={() => handleAddEducation()} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                          <Plus className="w-3.5 h-3.5" /> 行を追加
                        </button>
                      </td>
                    </tr>
                    {/* 職歴 */}
                    <tr>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-work-year" text="年" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-work-month" text="月" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-work" text="職歴" supplementMarking={supplementMarking} />
                      </th>
                    </tr>
                    {Array.from({ length: workCount }).map((_, i) => {
                      const emp = formData.workExperiences?.[i] || {};
                      const rawName = (emp.company_name || emp.description || '').trim();
                      return (
                        <React.Fragment key={`emp-${i}`}>
                          <tr
                            onMouseEnter={() => setHoveredWorkIndex(i)}
                            onMouseLeave={() => setHoveredWorkIndex(null)}
                            className="relative"
                          >
                            <td className="border p-1.5 text-center text-xs relative" style={{ borderColor: '#1f2937' }}>
                              {hoveredWorkIndex === i && handleRemoveWorkExperienceAt ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkExperienceAt(i)}
                                  className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                                  title="Xóa 職歴"
                                  aria-label="Xóa 職歴"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              <span {...cvEditableArray('workExperiences', i, 'startYear', 'block', {}, emp.startYear || '', sm(`tpl-common-rireki-wexp-${i}-startYear`, `employment-${i}-startYear`))} />
                            </td>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('workExperiences', i, 'startMonth', 'block', {}, emp.startMonth || '', sm(`tpl-common-rireki-wexp-${i}-startMonth`, `employment-${i}-startMonth`))} />
                            </td>
                            <td className="border p-1.5 text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('workExperiences', i, 'company_name', 'block', {}, rawName, sm(`tpl-common-rireki-wexp-${i}-company`, `employment-${i}-company`))} /> 入社
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('workExperiences', i, 'endYear', 'block', {}, emp.endYear || '', sm(`tpl-common-rireki-wexp-${i}-endYear`, `employment-${i}-endYear`))} />
                            </td>
                            <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('workExperiences', i, 'endMonth', 'block', {}, emp.endMonth || '', sm(`tpl-common-rireki-wexp-${i}-endMonth`, `employment-${i}-endMonth`))} />
                            </td>
                            <td className="border p-1.5 text-xs" style={{ borderColor: '#1f2937' }}>
                              <span {...cvEditableArray('workExperiences', i, 'company_name', 'block', {}, rawName, sm(`tpl-common-rireki-wexp-${i}-company-end`, `employment-${i}-company`))} /> {emp.endCurrent ? '現在に至る' : '退社'}
                            </td>
                          </tr>
                          {i < workCount - 1 && handleInsertWorkExperienceAt && (
                            <tr>
                              <td colSpan={3} className="border p-0.5 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' }}>
                                <button type="button" onClick={() => handleInsertWorkExperienceAt(i + 1)} className="text-xs text-amber-600 hover:text-amber-800">挿入</button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr>
                      <td colSpan={3} className="border p-1 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                        <button type="button" onClick={handleAddWorkExperience} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                          <Plus className="w-3.5 h-3.5" /> 行を追加
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }} />
                      <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }} />
                      <td className="border p-1.5 text-xs text-right" style={{ borderColor: '#1f2937' }}>以上</td>
                    </tr>
                    {/* 免許・資格 */}
                    <tr>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-cert-year" text="年" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937', width: '8%' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-cert-month" text="月" supplementMarking={supplementMarking} />
                      </th>
                      <th className="border p-1.5 text-xs font-normal text-center" style={{ borderColor: '#1f2937' }}>
                        <SupplementTplText fieldKey="tpl-common-rirekisho-th-cert" text="免許・資格" supplementMarking={supplementMarking} />
                      </th>
                    </tr>
                    {Array.from({ length: certCount }).map((_, i) => (
                      <React.Fragment key={`cert-${i}`}>
                        <tr
                          onMouseEnter={() => setHoveredCertificateIndex(i)}
                          onMouseLeave={() => setHoveredCertificateIndex(null)}
                          className="relative"
                        >
                          <td className="border p-1.5 text-center text-xs relative" style={{ borderColor: '#1f2937' }}>
                            {hoveredCertificateIndex === i && typeof handleRemoveCertificate === 'function' ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveCertificate(i)}
                                className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                                title="Xóa chứng chỉ"
                                aria-label="Xóa chứng chỉ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                            <span {...cvEditableArray('certificates', i, 'year', 'block', {}, undefined, sm(`tpl-common-cert-${i}-year`, `certificate-${i}-year`))} />
                          </td>
                          <td className="border p-1.5 text-center text-xs" style={{ borderColor: '#1f2937' }}><span {...cvEditableArray('certificates', i, 'month', 'block', {}, undefined, sm(`tpl-common-cert-${i}-month`, `certificate-${i}-month`))} /></td>
                          <td className="border p-1.5 text-xs" style={{ borderColor: '#1f2937' }}><span {...cvEditableArray('certificates', i, 'name', 'block', {}, undefined, sm(`tpl-common-cert-${i}-name`, `certificate-${i}-name`))} /></td>
                        </tr>
                        {i < certCount - 1 && handleInsertCertificateAt && (
                          <tr>
                            <td colSpan={3} className="border p-0.5 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' }}>
                              <button type="button" onClick={() => handleInsertCertificateAt(i + 1)} className="text-xs text-amber-600 hover:text-amber-800">挿入</button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    <tr>
                      <td colSpan={3} className="border p-1 text-center" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                        <button type="button" onClick={handleAddCertificate} className="text-xs flex items-center justify-center gap-1 mx-auto text-blue-600 hover:text-blue-800">
                          <Plus className="w-3.5 h-3.5" /> 行を追加
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </ResizableCvTable>
              );
            })()}

            {/* 最寄り駅・扶養家族・配偶者 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'station', [28, 24, 24, 24])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'station')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 align-top" style={{ borderColor: '#1f2937', width: '28%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-station-lbl" text="現住所の最寄り駅" supplementMarking={supplementMarking} linkedFieldKeys={['label-nearestStation']} />
                    </div>
                    <div className="mt-1 text-xs min-h-[1.5em]" {...cvEditable('nearestStationName', '', {}, sm('tpl-common-nearestStationName', 'nearestStationName'))} />
                  </td>
                  <td className="border p-1.5 align-top" style={{ borderColor: '#1f2937', width: '24%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-deps-lbl" text="扶養家族数(配偶者を除く)" supplementMarking={supplementMarking} linkedFieldKeys={['label-dependentsCount']} />
                    </div>
                    <div className="mt-1 flex items-baseline justify-center">
                      <span className="text-xs" {...cvEditable('dependentsCount', '', {}, sm('tpl-common-dependentsCount', 'dependentsCount'))} />
                      <span className="text-[10px] text-gray-600 ml-0.5">人</span>
                    </div>
                  </td>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937', width: '24%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-spouse-lbl" text="配偶者" supplementMarking={supplementMarking} linkedFieldKeys={['label-hasSpouse']} />
                    </div>
                    <div className="mt-1 text-xs text-center">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, hasSpouse: '有' }))}
                        className={formData.hasSpouse === '有' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Có"
                      >
                        有
                      </button>
                      <span className="text-gray-400 mx-0.5">・</span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, hasSpouse: '無' }))}
                        className={formData.hasSpouse === '無' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Không"
                      >
                        無
                      </button>
                    </div>
                  </td>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937', width: '24%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-spouse-dep-lbl" text="配偶者の扶養義務" supplementMarking={supplementMarking} linkedFieldKeys={['label-spouseDependent']} />
                    </div>
                    <div className="mt-1 text-xs text-center">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, spouseDependent: '有' }))}
                        className={formData.spouseDependent === '有' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Có"
                      >
                        有
                      </button>
                      <span className="text-gray-400 mx-0.5">・</span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, spouseDependent: '無' }))}
                        className={formData.spouseDependent === '無' ? 'font-semibold text-gray-900 px-1 py-0.5 rounded' : 'text-gray-400 px-1 py-0.5 rounded hover:text-gray-700 hover:bg-gray-50'}
                        title="Chọn Không"
                      >
                        無
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 在留資格 | 在留期限 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'residence', [50, 50])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'residence')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937', width: '50%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-zairyu-shikaku-lbl" text="在留資格" supplementMarking={supplementMarking} linkedFieldKeys={['label-jpResidenceStatus']} />
                    </div>
                    <div className="relative mt-1 text-xs min-h-[2em]">
                      <select
                        value={formData.jpResidenceStatus || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, jpResidenceStatus: e.target.value }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="在留資格"
                      >
                        <option value="">選択</option>
                        {RESIDENCE_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none min-h-[2em] flex items-center border-b border-dotted border-gray-400 px-0.5">
                        <span className={formData.jpResidenceStatus ? 'text-gray-900' : 'text-gray-400'}>
                          {getResidenceStatusLabel(formData.jpResidenceStatus) || '選択'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="border p-1.5 align-top" style={{ borderColor: '#1f2937', width: '50%' }}>
                    <div className="text-xs text-gray-700 text-left">
                      <SupplementTplText fieldKey="tpl-common-zairyu-kigen-lbl" text="在留期限" supplementMarking={supplementMarking} linkedFieldKeys={['label-visaExpiry']} />
                    </div>
                    {dateFieldErrors.visaExpirationDate ? (
                      <div className="mt-1 text-[10px] text-rose-600">{dateFieldErrors.visaExpirationDate}</div>
                    ) : null}
                    <div className="mt-1 text-xs min-h-[2em]">
                      <div className="flex min-w-0 max-w-full items-baseline flex-wrap justify-start" style={{ columnGap: '0.35em', rowGap: '0.15rem' }}>
                        <span
                          ref={visaYearRef}
                          contentEditable
                          suppressContentEditableWarning
                          tabIndex={0}
                          className="whitespace-nowrap tabular-nums text-center"
                          style={birthDateEditableStyle}
                          onFocus={(e) => {
                            if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = visaExpiryParts.y || '';
                            moveCaretToEnd(e.currentTarget);
                          }}
                          onBlur={() => commitVisaExpirationDate()}
                          onInput={(e) => {
                            e.currentTarget.textContent = normalizeVisaExpiryPart(e.currentTarget.textContent, 4);
                            clearDateFieldError('visaExpirationDate');
                            moveCaretToEnd(e.currentTarget);
                          }}
                          title="YYYY"
                        >
                          {visaExpiryParts.y || ''}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">年</span>
                        <span
                          ref={visaMonthRef}
                          contentEditable
                          suppressContentEditableWarning
                          tabIndex={0}
                          className="whitespace-nowrap tabular-nums text-center"
                          style={birthDateEditableStyle}
                          onFocus={(e) => {
                            if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = visaExpiryParts.mo || '';
                            moveCaretToEnd(e.currentTarget);
                          }}
                          onBlur={() => commitVisaExpirationDate()}
                          onInput={(e) => {
                            e.currentTarget.textContent = normalizeVisaExpiryPart(e.currentTarget.textContent, 2);
                            clearDateFieldError('visaExpirationDate');
                            moveCaretToEnd(e.currentTarget);
                          }}
                          title="MM"
                        >
                          {visaExpiryParts.mo || ''}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">月</span>
                        <span
                          ref={visaDayRef}
                          contentEditable
                          suppressContentEditableWarning
                          tabIndex={0}
                          className="whitespace-nowrap tabular-nums text-center"
                          style={birthDateEditableStyle}
                          onFocus={(e) => {
                            if (!(e.currentTarget.textContent || '').trim()) e.currentTarget.textContent = visaExpiryParts.d || '';
                            moveCaretToEnd(e.currentTarget);
                          }}
                          onBlur={() => commitVisaExpirationDate()}
                          onInput={(e) => {
                            e.currentTarget.textContent = normalizeVisaExpiryPart(e.currentTarget.textContent, 2);
                            clearDateFieldError('visaExpirationDate');
                            moveCaretToEnd(e.currentTarget);
                          }}
                          title="DD"
                        >
                          {visaExpiryParts.d || ''}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">日生</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 自己PR | 趣味・特技 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'prHobby', [50, 50])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'prHobby')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937', width: '50%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-jikopr" text="自己PR" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-strengths']} />
                    </div>
                    <div className="mt-1 text-xs min-h-[4rem] whitespace-pre-wrap" {...cvEditable('strengths', '', {}, sm('tpl-common-strengths', 'strengths'))} />
                  </td>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937', width: '50%' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-hobby" text="趣味・特技" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-hobbies']} />
                    </div>
                    <div className="mt-1 text-xs min-h-[4rem] whitespace-pre-wrap" {...cvEditable('hobbiesSpecialSkills', '', {}, sm('tpl-common-hobbiesSpecialSkills', 'hobbiesSpecialSkills'))} />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 志望動機 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'motivation', [100])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'motivation')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937' }}>
                    <div className="text-xs text-gray-700">
                      <SupplementTplText fieldKey="tpl-common-shibo" text="志望動機" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-motivation']} />
                    </div>
                    <div className="mt-1 text-xs min-h-[5rem] whitespace-pre-wrap" {...cvEditable('motivation', '', {}, sm('tpl-common-motivation', 'motivation'))} />
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>

            {/* 本人希望記入欄 */}
            <ResizableCvTable
              className="w-full border-collapse mt-4"
              style={{ borderColor: '#1f2937' }}
              colPercents={colSaved('rirekisho', 'wish', [100])}
              layoutKey={cvLayoutKey('common', 'rirekisho', 'wish')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                <tr>
                  <td className="border p-1.5 align-top text-left" style={{ borderColor: '#1f2937' }}>
                    <div className="text-xs text-gray-700 font-medium">
                      <SupplementTplText fieldKey="tpl-common-honin-kibo" text="本人希望記入欄" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-block6-prefs']} />
                    </div>
                    <ul className="mt-1 text-xs list-none space-y-0.5 pl-0">
                      <li className="flex flex-wrap items-start gap-x-1 min-w-0"><span className="mr-1 shrink-0">-</span><span className="text-gray-600 shrink-0"><SupplementTplText fieldKey="tpl-common-gen-nenshu-lbl" text="現在年収:" supplementMarking={supplementMarking} linkedFieldKeys={['label-currentSalary']} /></span><span className="ml-1 min-w-0 break-words" {...cvEditable('currentSalary', '', {}, sm('tpl-common-currentSalary', 'currentSalary'))} /></li>
                      <li className="flex flex-wrap items-start gap-x-1 min-w-0"><span className="mr-1 shrink-0">-</span><span className="text-gray-600 shrink-0"><SupplementTplText fieldKey="tpl-common-kibo-nenshu-lbl" text="希望年収:" supplementMarking={supplementMarking} linkedFieldKeys={['label-desiredSalary']} /></span><span className="ml-1 min-w-0 break-words" {...cvEditable('desiredSalary', '', {}, sm('tpl-common-desiredSalary', 'desiredSalary'))} /></li>
                      <li className="flex flex-wrap items-start gap-x-1 min-w-0"><span className="mr-1 shrink-0">-</span><span className="text-gray-600 shrink-0"><SupplementTplText fieldKey="tpl-common-kibo-shokushu-lbl" text="希望職種:" supplementMarking={supplementMarking} linkedFieldKeys={['label-desiredPosition']} /></span><span className="ml-1 min-w-0 break-words" {...cvEditable('desiredPosition', '', {}, sm('tpl-common-desiredPosition', 'desiredPosition'))} /></li>
                      <li className="flex flex-wrap items-start gap-x-1 min-w-0"><span className="mr-1 shrink-0">-</span><span className="text-gray-600 shrink-0"><SupplementTplText fieldKey="tpl-common-kibo-kinmuchu-lbl" text="希望勤務地:" supplementMarking={supplementMarking} linkedFieldKeys={['label-desiredLocation']} /></span><span className="ml-1 min-w-0 break-words" {...cvEditable('desiredLocation', '', {}, sm('tpl-common-desiredLocation', 'desiredLocation'))} /></li>
                      <li className="flex flex-wrap items-start gap-x-1 min-w-0"><span className="mr-1 shrink-0">-</span><span className="text-gray-600 shrink-0"><SupplementTplText fieldKey="tpl-common-kibo-nyusha-lbl" text="希望入社日:" supplementMarking={supplementMarking} linkedFieldKeys={['label-desiredStartDate']} /></span><span className="ml-1 min-w-0 break-words" {...cvEditable('desiredStartDate', '', {}, sm('tpl-common-desiredStartDate', 'desiredStartDate'))} /></li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </ResizableCvTable>
          </div>
        </div>
      )}

      {/* ===== 職務経歴書 ===== */}
      {showShokumu && (
        <div className="w-full" ref={pdfSectionRefs?.shokumu} data-cv-pdf-section="shokumu">
          {!pdfExportMode && (
          <div className="flex items-center justify-end mb-2 cv-pdf-hide">
            <button
              type="button"
              onClick={() => {
                handleBackendPreviewWithOptions('common', 'shokumu');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
              style={{ borderColor: '#d1d5db', color: '#2563eb' }}
            >
              Xem preview 【職務経歴書】
            </button>
          </div>
          )}
          <div
            className="w-full"
            style={{ fontSize: '11px', color: '#1f2937', fontFamily: "'MS Mincho', 'MS 明朝', 'Yu Mincho', 'Hiragino Mincho ProN', serif" }}
          >
            <h2 className="text-center font-bold mb-4" style={{ fontSize: '18px' }}>
              <SupplementTplText fieldKey="tpl-common-shokumu-h2" text="職務経歴書" supplementMarking={supplementMarking} />
            </h2>
            <div className="flex flex-col items-end gap-1 text-xs mb-6 w-full">
              <span {...cvEditableWithDefault('cvDocumentDate', getDefaultCvDate(true), 'inline-block min-w-[8em]', {}, (v) => v, sm('tpl-common-cvdocdate-shokumu', 'cvDocumentDate'))} />
              <div className="flex justify-end flex-wrap max-w-full min-w-0 overflow-visible">
                <div className="min-w-[10em] max-w-[min(100%,28rem)] flex-shrink border-b border-dotted border-gray-400">
                  <div className="flex items-end gap-2 justify-end w-full min-w-0">
                    <span className="text-gray-600 flex-shrink-0 pb-[3px]">
                      <SupplementTplText fieldKey="tpl-common-shokumu-furigana-lbl" text="ふりがな" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKana]} className="select-text inline min-w-0" />
                    </span>
                    <span
                      {...cvEditable(
                        'nameKana',
                        'flex-1 min-w-0 block min-h-[1.2em] px-0.5 text-[10px] text-right',
                        { lineHeight: '1.2' },
                        sm('tpl-common-nameKana-shokumu', 'nameKana')
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 justify-end flex-wrap max-w-full">
                <span className="text-gray-600 flex-shrink-0">
                  <SupplementTplText fieldKey="tpl-common-shokumu-shimei-lbl" text="氏名" supplementMarking={supplementMarking} linkedFieldKeys={[CV_LINK.nameKanji]} className="select-text inline min-w-0" />
                </span>
                <span {...cvEditable('nameKanji', 'inline-block min-w-[8em] max-w-[min(100%,28rem)] text-right', { lineHeight: '1.2', fontSize: '13px' }, sm('tpl-common-nameKanji-shokumu', 'nameKanji'))} />
              </div>
            </div>

            {/* 生年月日: 職務経歴書 – 例: 1994年  11月  01日生 (満  30歳) */}
            <div className="flex justify-end w-full mb-4 max-w-full min-w-0">
              <div
                className="flex items-baseline flex-wrap justify-end text-xs w-full min-w-0"
                style={{ columnGap: '0', rowGap: '0.35rem' }}
              >
                <span className="text-gray-600 flex-shrink-0 mr-2">
                  <SupplementTplText
                    fieldKey="tpl-common-shokumu-birthdate-lbl"
                    text="生年月日"
                    supplementMarking={supplementMarking}
                    linkedFieldKeys={[CV_LINK.birthDate]}
                    className="select-text inline min-w-0"
                  />
                </span>
                {(() => {
                  const parts = parseIsoBirthParts(formData.birthDate);
                  if (!parts) {
                    return (
                      <>
                        <span
                          className="min-w-[6em] px-0.5"
                          {...cvEditable('birthDate', '', {}, sm('tpl-common-birthDate-shokumu', 'birthDate'))}
                          title="YYYY-MM-DD"
                        />
                        <span className="whitespace-nowrap">
                          <span className="ml-1">(満</span>
                          <span
                            className="inline-block min-w-[1.2em] px-0.5 text-center"
                            {...cvEditable('age', '', {}, sm('tpl-common-age-shokumu', 'age'))}
                          />
                          <span>歳)</span>
                        </span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span className="whitespace-nowrap tabular-nums" style={{ minWidth: '4.25em' }}>
                        {parts.y}年
                      </span>
                      <span className="whitespace-nowrap tabular-nums" style={{ minWidth: '2.75em' }}>
                        {String(parseInt(parts.mo, 10)).padStart(2, '0')}月
                      </span>
                      <span className="whitespace-nowrap tabular-nums">
                        {parts.d}日生
                      </span>
                      <span className="whitespace-nowrap ml-1">
                        <span>(満</span>
                        <span
                          className="inline-block min-w-[1.1em] px-1 text-center"
                          style={{ marginLeft: '0.4em' }}
                          {...cvEditable('age', '', {}, sm('tpl-common-age-shokumu', 'age'))}
                        />
                        <span>歳)</span>
                      </span>
                      <span
                        className="ml-2 pl-2 text-[9px] text-gray-500 border-b border-dotted border-gray-400 self-end leading-none pb-px"
                        title="YYYY-MM-DD"
                        {...cvEditable('birthDate', 'inline-block min-w-[5.5em] text-left', {}, sm('tpl-common-birthDate-shokumu', 'birthDate'))}
                      />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* ■職務要約 */}
            <div className="flex items-center gap-1 mb-1.5">
              <span className="inline-block w-4 h-4 leading-4 text-center text-[10px] font-bold text-black">■</span>
              <span className="text-xs font-bold">
                <SupplementTplText fieldKey="tpl-common-shokumu-yokyu-h" text="職務要約" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-career-summary']} />
              </span>
            </div>
            <div className="border min-h-[48px] p-2 text-xs whitespace-pre-wrap mb-4" style={{ borderColor: '#1f2937', backgroundColor: '#fafafa' }} {...cvEditable('careerSummary', 'block', {}, sm('tpl-common-careerSummary', 'careerSummary'))} />

            {/* ■職務経歴 */}
            <div className="mt-10 flex items-center gap-1 mb-2">
              <span className="inline-block w-4 h-4 leading-4 text-center text-[10px] font-bold text-black">■</span>
              <span className="text-xs font-bold">
                <SupplementTplText fieldKey="tpl-common-shokumu-keireki-h" text="職務経歴" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-work-exp']} />
              </span>
            </div>
            {(() => {
              const list = formData.workExperiences || [];
              const blockCount = Math.max(1, list.length);
              return (
                <ResizableCvTable
                  className="w-full border-collapse border"
                  style={{ borderColor: '#1f2937' }}
                  colPercents={colSaved('shokumu', 'workHistory', [65, 35])}
                  layoutKey={cvLayoutKey('common', 'shokumu', 'workHistory')}
                  onLayoutCommit={onCvTableLayoutCommit}
                >
                  <tbody>
                    {Array.from({ length: blockCount }).map((_, idx) => {
                      const emp = list[idx] || { start_date: '', end_date: '', company_name: '', business_purpose: '', scale_role: '', description: '', tools_tech: '' };
                      const startLabel = emp.start_date || [emp.startYear, emp.startMonth].filter(Boolean).join('/');
                      const endLabel = emp.endCurrent ? '現在' : (emp.end_date || [emp.endYear, emp.endMonth].filter(Boolean).join('/'));
                      const companyDisplay = (emp.company_name || '').replace(/\s*(退社|入社)\s*$/g, '').trim() || '株式会社○○○○○';
                      const periodDisplay = formatShokumuPeriodRangeJa(startLabel, endLabel);
                      const blockBorderBottom = idx < blockCount - 1 ? '1px solid #1f2937' : undefined;
                      const setWorkPeriodField = (field, value) => {
                        if (typeof setFormData !== 'function') return;
                        setFormData((prev) => {
                          const next = [...(prev.workExperiences || [])];
                          if (!next[idx]) next[idx] = {};
                          next[idx] = { ...next[idx], [field]: value };
                          return { ...prev, workExperiences: next };
                        });
                      };
                      const commitStartPeriod = () => {
                        const y = String(startYearRefs.current[idx]?.value || '').replace(/\D/g, '').slice(0, 4);
                        const m = String(startMonthRefs.current[idx]?.value || '').replace(/\D/g, '').slice(0, 2);
                        if (!y && !m) return;
                        setWorkPeriodField('startYear', y);
                        setWorkPeriodField('startMonth', m);
                        setWorkPeriodField('period', `${y}/${m}`);
                      };
                      const commitEndPeriod = () => {
                        const y = String(endYearRefs.current[idx]?.value || '').replace(/\D/g, '').slice(0, 4);
                        const m = String(endMonthRefs.current[idx]?.value || '').replace(/\D/g, '').slice(0, 2);
                        if (!y && !m) return;
                        setWorkPeriodField('endCurrent', false);
                        setWorkPeriodField('endYear', y);
                        setWorkPeriodField('endMonth', m);
                        setWorkPeriodField('period', `${y}/${m}`);
                      };
                      const toggleEndCurrent = () => {
                        if (emp.endCurrent) {
                          setWorkPeriodField('endCurrent', false);
                          return;
                        }
                        setWorkPeriodField('endCurrent', true);
                        setWorkPeriodField('endYear', '');
                        setWorkPeriodField('endMonth', '');
                        setWorkPeriodField('period', '現在');
                      };
                      return (
                        <React.Fragment key={idx}>
                          <tr
                            style={{ backgroundColor: '#f3f4f6' }}
                            onMouseEnter={() => setHoveredWorkIndex(idx)}
                            onMouseLeave={() => setHoveredWorkIndex(null)}
                          >
                            <td className="px-2 py-1.5 text-xs align-top border-0 whitespace-nowrap relative" style={{ borderColor: '#1f2937', width: '68%' }}>
                              {hoveredWorkIndex === idx && typeof handleRemoveWorkExperienceAt === 'function' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkExperienceAt(idx)}
                                  className="absolute right-1 top-1 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                                  title="Xóa 職務経歴"
                                  aria-label="Xóa 職務経歴"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                                <input
                                  ref={(el) => { startYearRefs.current[idx] = el; }}
                                  value={emp.startYear || ''}
                                  onChange={(e) => setWorkPeriodField('startYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  onBlur={() => {
                                    const y = String(startYearRef.current?.value || '').replace(/\D/g, '').slice(0, 4);
                                    const m = String(startMonthRef.current?.value || '').replace(/\D/g, '').slice(0, 2);
                                    if (!y && !m) return;
                                    setWorkPeriodField('startYear', y);
                                    setWorkPeriodField('startMonth', m);
                                    setWorkPeriodField('period', `${y}/${m}`);
                                  }}
                                  inputMode="numeric"
                                  className="inline-block w-[3.2em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                />
                                <span>年</span>
                                <input
                                  ref={(el) => { startMonthRefs.current[idx] = el; }}
                                  value={emp.startMonth || ''}
                                  onChange={(e) => setWorkPeriodField('startMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                  onBlur={() => {
                                    const y = String(startYearRef.current?.value || '').replace(/\D/g, '').slice(0, 4);
                                    const m = String(startMonthRef.current?.value || '').replace(/\D/g, '').slice(0, 2);
                                    if (!y && !m) return;
                                    setWorkPeriodField('startYear', y);
                                    setWorkPeriodField('startMonth', m);
                                    setWorkPeriodField('period', `${y}/${m}`);
                                  }}
                                  inputMode="numeric"
                                  className="inline-block w-[2.2em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                />
                                <span>月～</span>
                                {emp.endCurrent ? (
                                  <span className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={toggleEndCurrent}
                                      className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                    >
                                      現在
                                    </button>
                                  </span>
                                ) : (
                                  <>
                                    <input
                                      ref={(el) => { endYearRefs.current[idx] = el; }}
                                      value={emp.endYear || ''}
                                      onChange={(e) => setWorkPeriodField('endYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      onBlur={commitEndPeriod}
                                      inputMode="numeric"
                                      className="inline-block w-[3.2em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                    />
                                    <span>年</span>
                                    <input
                                      ref={(el) => { endMonthRefs.current[idx] = el; }}
                                      value={emp.endMonth || ''}
                                      onChange={(e) => setWorkPeriodField('endMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                      onBlur={commitEndPeriod}
                                      inputMode="numeric"
                                      className="inline-block w-[2.2em] min-w-0 px-0 text-center tabular-nums bg-transparent border-0 outline-none"
                                    />
                                    <span>月</span>
                                    <button type="button" onClick={toggleEndCurrent} className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-800">現在</button>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-xs align-top border-0 text-right whitespace-nowrap" style={{ borderColor: '#1f2937', width: '32%' }}>
                              <span {...cvEditableArray('workExperiences', idx, 'company_name', 'inline-block min-w-[10em] text-right', {}, companyDisplay, sm(`tpl-common-shokumu-${idx}-company`, `employment-${idx}-company`))} />
                            </td>
                          </tr>
                          <tr className="text-[9px] leading-none text-gray-700" style={{ backgroundColor: '#d1d5db' }}>
                            <td className="px-2 py-0.5 align-middle border-0 border-b border-r" style={{ borderColor: '#1f2937' }}>
                              <SupplementTplText fieldKey={`tpl-common-shokumu-${idx}-jigyo-mokuteki-lbl`} text="【事業目的】" supplementMarking={supplementMarking} linkedFieldKeys={[`employment-${idx}-business`]} className="select-text inline min-w-0 leading-none font-normal" />
                            </td>
                            <td className="px-2 py-0.5 text-right align-middle border-0 border-b" style={{ borderColor: '#1f2937' }}>
                              <SupplementTplText fieldKey={`tpl-common-shokumu-${idx}-kibo-yakuwari-lbl`} text="規模 / 役割" supplementMarking={supplementMarking} linkedFieldKeys={[`employment-${idx}-scale`]} className="select-text inline min-w-0 leading-none font-normal" />
                            </td>
                          </tr>
                          <tr style={{ borderBottom: blockBorderBottom }}>
                            <td
                              className="p-2 align-top min-w-0 border-0 border-r border-dotted"
                              style={{ borderColor: '#1f2937' }}
                            >
                              <div className="text-xs whitespace-pre-wrap min-h-[2em] mb-2" {...cvEditableArray('workExperiences', idx, 'business_purpose', 'block', {}, emp.business_purpose, sm(`tpl-common-shokumu-${idx}-business`, `employment-${idx}-business`))} />
                              <div className="text-[10px] text-gray-600 mb-0.5">
                                <SupplementTplText fieldKey={`tpl-common-shokumu-${idx}-gyomu-lbl`} text="【業務内容】" supplementMarking={supplementMarking} linkedFieldKeys={[`employment-${idx}-description`]} />
                              </div>
                              <div className="text-xs whitespace-pre-wrap min-h-[2em] mb-2" {...cvEditableArray('workExperiences', idx, 'description', 'block', {}, emp.description, sm(`tpl-common-shokumu-${idx}-desc`, `employment-${idx}-description`))} />
                              <div className="text-[10px] text-gray-600 mb-0.5">
                                <SupplementTplText fieldKey={`tpl-common-shokumu-${idx}-tool-lbl`} text="【ツール】" supplementMarking={supplementMarking} linkedFieldKeys={[`employment-${idx}-tools`]} />
                              </div>
                              <div className="text-xs whitespace-pre-wrap min-h-[1.5em]" {...cvEditableArray('workExperiences', idx, 'tools_tech', 'block', {}, emp.tools_tech, sm(`tpl-common-shokumu-${idx}-tools`, `employment-${idx}-tools`))} />
                            </td>
                            <td className="p-2 align-top border-0">
                              <div className="text-xs whitespace-pre-wrap w-full min-h-[4em]" {...cvEditableArray('workExperiences', idx, 'scale_role', 'block', { width: '100%', minHeight: '4em' }, emp.scale_role, sm(`tpl-common-shokumu-${idx}-scale`, `employment-${idx}-scale`))} />
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </ResizableCvTable>
              );
            })()}
            <div className="flex justify-center mt-2 mb-2">
              <button type="button" onClick={handleAddWorkExperience} className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800">
                <Plus className="w-3.5 h-3.5" /> 行を追加
              </button>
            </div>

            {/* ■活かせる経験・知識・技術 */}
            <div className="flex items-center gap-1 mt-6 mb-1.5">
              <span className="inline-block w-4 h-4 leading-4 text-center text-[10px] font-bold text-black">■</span>
              <span className="text-xs font-bold">
                <SupplementTplText fieldKey="tpl-common-ikasu-keiken-h" text="活かせる経験・知識・技術" supplementMarking={supplementMarking} linkedFieldKeys={['label-technicalSkills']} />
              </span>
            </div>
            <div className="border min-h-[60px] p-2 text-xs whitespace-pre-wrap mb-4" style={{ borderColor: '#1f2937', backgroundColor: '#fafafa' }} {...cvEditable('technicalSkills', 'block', {}, sm('tpl-common-technicalSkills', 'technicalSkills'))} />

            {/* ■資格 */}
            <div className="flex items-center gap-1 mb-1.5">
              <span className="inline-block w-4 h-4 leading-4 text-center text-[10px] font-bold text-black">■</span>
              <span className="text-xs font-bold">
                <SupplementTplText fieldKey="tpl-common-shokumu-shikaku-h" text="資格" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-certificates']} />
              </span>
            </div>
            <ResizableCvTable
              className="w-full border-collapse border mb-1"
              style={{ borderColor: '#1f2937', fontSize: '10px' }}
              colPercents={colSaved('shokumu', 'cert', [60, 40])}
              layoutKey={cvLayoutKey('common', 'shokumu', 'cert')}
              onLayoutCommit={onCvTableLayoutCommit}
            >
              <tbody>
                {(formData.certificates || []).map((_, i) => (
                  <tr
                    key={`cert-shokumu-${i}`}
                    onMouseEnter={() => setHoveredCertificateIndex(i)}
                    onMouseLeave={() => setHoveredCertificateIndex(null)}
                    className="relative"
                  >
                    <td className="border p-1.5 align-top relative" style={{ width: '60%', borderColor: '#1f2937' }}>
                      {hoveredCertificateIndex === i && typeof handleRemoveCertificate === 'function' ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCertificate(i)}
                          className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-rose-500 shadow border border-rose-200 hover:text-rose-700 hover:bg-rose-50"
                          title="Xóa 資格"
                          aria-label="Xóa 資格"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                      <span {...cvEditableArray('certificates', i, 'name', 'block', {}, undefined, sm(`tpl-common-cert-shokumu-${i}-name`, `certificate-${i}-name`))} />
                    </td>
                    <td className="border p-1.5 align-top whitespace-nowrap" style={{ borderColor: '#1f2937' }}>
                      <span className="inline-flex items-baseline gap-0">
                        <span {...cvEditableArray('certificates', i, 'year', 'inline-block min-w-[2.5em] text-center', { width: '2.5em' }, undefined, sm(`tpl-common-cert-shokumu-${i}-year`, `certificate-${i}-year`))} />年
                        <span {...cvEditableArray('certificates', i, 'month', 'inline-block min-w-[1.5em] text-center', { width: '1.5em' }, undefined, sm(`tpl-common-cert-shokumu-${i}-month`, `certificate-${i}-month`))} />月取得
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResizableCvTable>
            <div className="mb-4 flex justify-center">
              <button type="button" onClick={handleAddCertificate} className="text-xs flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800">
                <Plus className="w-3.5 h-3.5" /> 行を追加
              </button>
            </div>

            {/* ■自己PR */}
            <div className="flex items-center gap-1 mb-1.5">
              <span className="inline-block w-4 h-4 leading-4 text-center text-[10px] font-bold text-black">■</span>
              <span className="text-xs font-bold">
                <SupplementTplText fieldKey="tpl-common-shokumu-jikopr-h" text="自己PR" supplementMarking={supplementMarking} linkedFieldKeys={['addCandidate-strengths']} />
              </span>
            </div>
            <div className="border min-h-[80px] p-2 text-xs whitespace-pre-wrap" style={{ borderColor: '#1f2937', backgroundColor: '#fafafa' }} {...cvEditable('strengths', 'block', {}, sm('tpl-common-strengths-shokumu', 'strengths'))} />
          </div>
        </div>
      )}
    </>
  );
};

export default CvTemplateCommon;