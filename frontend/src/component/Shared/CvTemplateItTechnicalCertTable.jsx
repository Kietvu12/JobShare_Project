import React from 'react';
import ResizableCvTable from './ResizableCvTable';
import { alignRirekishoSectionColPercents, cvLayoutKey, CV_RIREKISHO_CERT_COLS, CV_RIREKISHO_SIDE_LABEL_COL_PCT } from './cvLayoutKey';
import { SupplementTplText } from './CvTemplateSupplementText.jsx';
import { parseYearMonthFlexible } from '../../utils/cvJpDateDisplay.js';
import {
  formatDrivingLicenseMark,
  formatIeltsScoreDisplay,
  formatJlptLevelMark,
  formatToeicScoreDisplay,
  getFixedCertVisibleKinds,
  getFixedCertYearMonth,
  getJlptDisplay,
  hasFixedCertData,
} from '../../utils/cvFixedCertDisplay.js';
import {
  getOtherLangCertYearMonth,
  hasAnyOtherLangCertData,
  hasOtherLangCertData,
  OTHER_LANG_CERT_SLOT_COUNT,
  readOtherLanguageCerts,
} from '../../utils/cvOtherLanguageCerts.js';
import { CV_TPL_TABLE_STYLE } from '../../utils/cvTemplateTypography.js';

/** 7 cột: title | nhãn hàng | 名称 trái (×2) | 取得年月 trái | 名称 phải | 取得年月 phải */
const DEFAULT_CERT_COL_PERCENTS = CV_RIREKISHO_CERT_COLS;
const JLPT_LEVELS = ['N1', 'N2', 'N3', 'N4'];
const CELL_BORDER = { borderColor: '#1f2937' };
const HEADER_BG = { ...CELL_BORDER, backgroundColor: '#e2efd9' };
const LEFT_NAME_COLSPAN = 2;

/** Map hàng cố định → index ô ngôn ngữ khác bên phải. */
const OTHER_LANG_SLOT_BY_ROW = {
  jlpt: 0,
  toeic: 1,
  ielts: 2,
  driving: 3,
};

/**
 * Bảng 保有資格・免許等 (IT + Technical).
 * pdfExportMode: ẩn bảng / dòng trống, hiển thị ■/□ — khớp backend cvTemplateHtml.js.
 */
export default function CvTemplateItTechnicalCertTable({
  tplPrefix,
  cvTpl,
  formData,
  setFormData,
  supplementMarking,
  colSaved,
  onCvTableLayoutCommit,
  pdfExportMode = false,
  sideLabelPct,
}) {
  const visibleKinds = getFixedCertVisibleKinds(formData);
  const otherLangCerts = readOtherLanguageCerts(formData);
  const jlptDisplay = getJlptDisplay(formData.jlptLevel);

  if (pdfExportMode && visibleKinds.length === 0 && !hasAnyOtherLangCertData(formData)) {
    return null;
  }

  const showJlpt = !pdfExportMode || hasFixedCertData(formData, 'jlpt') || hasOtherLangCertData(otherLangCerts[0]);
  const showToeic = !pdfExportMode || hasFixedCertData(formData, 'toeic') || hasOtherLangCertData(otherLangCerts[1]);
  const showIelts = !pdfExportMode || hasFixedCertData(formData, 'ielts') || hasOtherLangCertData(otherLangCerts[2]);
  const showDriving = !pdfExportMode || hasFixedCertData(formData, 'driving') || hasOtherLangCertData(otherLangCerts[3]);
  const titleRowSpan = [showJlpt, showToeic, showIelts, showDriving].filter(Boolean).length + 1;
  const englishRowSpan = !pdfExportMode && showToeic && showIelts ? 2 : 1;

  const fixedCertYearMonth = (kind) => getFixedCertYearMonth(formData, kind);

  const onFixedCertYearMonthBlur = (kind, rawText) => {
    const { year, month } = parseYearMonthFlexible(rawText);
    setFormData((prev) => {
      if (kind === 'jlpt') return { ...prev, jlptAcquiredYear: year, jlptAcquiredMonth: month };
      if (kind === 'toeic') return { ...prev, toeicYear: year, toeicMonth: month };
      if (kind === 'ielts') return { ...prev, ieltsYear: year, ieltsMonth: month };
      if (kind === 'driving') return { ...prev, drivingLicenseYear: year, drivingLicenseMonth: month };
      return prev;
    });
  };

  const updateOtherLangCert = (slotIndex, patch) => {
    setFormData((prev) => {
      const next = readOtherLanguageCerts(prev);
      next[slotIndex] = { ...next[slotIndex], ...patch };
      return { ...prev, otherLanguageCerts: next };
    });
  };

  const onOtherLangCertYearMonthBlur = (slotIndex, rawText) => {
    const { year, month } = parseYearMonthFlexible(rawText);
    updateOtherLangCert(slotIndex, { year, month });
  };

  const YmCell = ({ kind, formFieldKey, compact = false }) => {
    const text = fixedCertYearMonth(kind);
    if (pdfExportMode) {
      return (
        <td className="border px-1 py-1.5 bg-white text-center cv-cert-left-ym" style={CELL_BORDER}>
          {text || '　'}
        </td>
      );
    }
    return (
      <td className="border px-1 py-1.5 bg-white text-center cv-cert-left-ym" style={CELL_BORDER}>
        <span
          contentEditable
          suppressContentEditableWarning
          className={`outline-none block select-text ${compact ? 'min-h-[1.2em] text-[17px]' : 'min-h-[1.2em]'}`}
          onBlur={(e) => onFixedCertYearMonthBlur(kind, e.currentTarget.textContent || '')}
          onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, formFieldKey)}
        >
          {text || '　年　月'}
        </span>
      </td>
    );
  };

  const OtherLangCertCells = ({ slotIndex }) => {
    if (slotIndex == null || slotIndex < 0 || slotIndex >= OTHER_LANG_CERT_SLOT_COUNT) {
      return (
        <>
          <td className="border px-1 py-1.5 bg-gray-50 cv-cert-other-name" style={CELL_BORDER} aria-hidden="true">　</td>
          <td className="border px-1 py-1.5 bg-gray-50 text-center cv-cert-other-ym" style={CELL_BORDER} aria-hidden="true">　</td>
        </>
      );
    }

    const cert = otherLangCerts[slotIndex] || { name: '', year: '', month: '' };
    const ymText = getOtherLangCertYearMonth(cert);

    if (pdfExportMode && !hasOtherLangCertData(cert)) {
      return (
        <>
          <td className="border px-1 py-1.5 bg-white cv-cert-other-name" style={CELL_BORDER}>　</td>
          <td className="border px-1 py-1.5 bg-white text-center cv-cert-other-ym" style={CELL_BORDER}>　</td>
        </>
      );
    }

    if (pdfExportMode) {
      return (
        <>
          <td className="border px-1 py-1.5 bg-white text-center cv-cert-other-name" style={CELL_BORDER}>
            {(cert.name || '').trim() || '　'}
          </td>
          <td className="border px-1 py-1.5 bg-white text-center cv-cert-other-ym" style={CELL_BORDER}>
            {ymText || '　'}
          </td>
        </>
      );
    }

    return (
      <>
        <td className="border px-1 py-1 bg-white cv-cert-other-name" style={CELL_BORDER}>
          <input
            type="text"
            value={cert.name || ''}
            placeholder="例：中国語検定"
            className="w-full min-w-0 border-0 outline-none bg-transparent text-center px-0.5 py-0.5"
            data-cv-other-lang-cert-name={slotIndex}
            onChange={(e) => updateOtherLangCert(slotIndex, { name: e.target.value })}
            onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, `otherLanguageCert-${slotIndex}-name`)}
          />
        </td>
        <td className="border px-1 py-1 bg-white text-center cv-cert-other-ym" style={CELL_BORDER}>
          <input
            type="text"
            key={`other-ym-${slotIndex}-${cert.year}-${cert.month}`}
            defaultValue={ymText}
            placeholder="2020年5月"
            className="w-full min-w-0 border-0 outline-none bg-transparent text-center px-0.5 py-0.5 text-[17px]"
            data-cv-other-lang-cert-ym={slotIndex}
            onBlur={(e) => onOtherLangCertYearMonthBlur(slotIndex, e.target.value)}
            onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, `otherLanguageCert-${slotIndex}-year`)}
          />
        </td>
      </>
    );
  };

  const rowMeta = (kind) => ({
    'data-cv-cert-row-kind': kind,
    'data-cv-cert-has-data': hasFixedCertData(formData, kind) ? '1' : '0',
  });

  return (
    <div
      data-cv-fixed-cert-table="1"
      data-cv-fixed-cert-visible={JSON.stringify(visibleKinds)}
      data-cv-other-lang-certs={JSON.stringify(otherLangCerts)}
    >
    <ResizableCvTable
      className="w-full border-collapse mt-3"
      style={CV_TPL_TABLE_STYLE}
      colPercents={alignRirekishoSectionColPercents(
        colSaved('rirekisho', 'certificates_v7', DEFAULT_CERT_COL_PERCENTS),
        sideLabelPct ?? CV_RIREKISHO_SIDE_LABEL_COL_PCT,
      )}
      layoutKey={cvLayoutKey(cvTpl, 'rirekisho', 'certificates_v7')}
      onLayoutCommit={onCvTableLayoutCommit}
    >
      <tbody>
        <tr>
          <td
            rowSpan={titleRowSpan}
            className="border p-1.5 text-center align-middle font-bold cv-cert-title-col cv-tpl-section-title-col cv-tpl-side-label"
            style={{ ...CELL_BORDER, backgroundColor: '#e2efd9' }}
          >
            <SupplementTplText
              fieldKey={`tpl-${tplPrefix}-cert-title`}
              text="保有資格・免許等"
              supplementMarking={supplementMarking}
              linkedFieldKeys={['addCandidate-certificates', 'jlptLevel', 'toeicScore', 'ieltsScore', 'hasDrivingLicense', 'otherLanguageCerts']}
            />
          </td>
          <td className="border p-1 text-center font-normal" style={HEADER_BG} />
          <td colSpan={LEFT_NAME_COLSPAN} className="border p-1 text-center font-normal" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-name`} text="名称" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
          <td className="border p-1 text-center font-normal" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-ym`} text="取得年月" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
          <td className="border p-1 text-center font-normal" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-other-name`} text="名称" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
          <td className="border p-1 text-center font-normal" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-other-ym`} text="取得年月" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
        </tr>

        {showJlpt ? (
          <tr {...rowMeta('jlpt')}>
            <td className="border p-1 text-center align-middle bg-white whitespace-nowrap text-[17px]" style={CELL_BORDER}>
              <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-jlpt`} text="日本語検定" supplementMarking={supplementMarking} linkedFieldKeys={['jlptLevel']} className="select-text inline" />
            </td>
            {pdfExportMode ? (
              <td colSpan={LEFT_NAME_COLSPAN} className="border px-1 py-1.5 bg-white text-center text-[17px] whitespace-nowrap cv-cert-jlpt-levels" style={CELL_BORDER}>
                {JLPT_LEVELS.map((n) => formatJlptLevelMark(jlptDisplay, n)).join('　')}
              </td>
            ) : (
              <td colSpan={LEFT_NAME_COLSPAN} className="border px-1 py-1 bg-white cv-cert-jlpt-levels" style={CELL_BORDER} data-cv-cert-jlpt-cell="1">
                <div className="flex flex-nowrap justify-center gap-x-1.5 gap-y-0">
                  {JLPT_LEVELS.map((n) => (
                    <label key={n} className="flex items-center justify-center gap-0.5 cursor-pointer text-[17px]">
                      <input
                        type="checkbox"
                        className="rounded scale-90"
                        checked={(formData.jlptLevel ?? '') === n || (formData.jlptLevel ?? '') === n.replace('N', '')}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            jlptLevel: n.replace('N', ''),
                          }))
                        }
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </td>
            )}
            <YmCell kind="jlpt" formFieldKey="jlptAcquiredYear" compact />
            <OtherLangCertCells slotIndex={OTHER_LANG_SLOT_BY_ROW.jlpt} />
          </tr>
        ) : null}

        {showToeic ? (
          <tr {...rowMeta('toeic')}>
            <td
              rowSpan={englishRowSpan}
              className="border p-1 text-center align-middle bg-white whitespace-nowrap text-[17px]"
              style={CELL_BORDER}
            >
              <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
            </td>
            <td colSpan={LEFT_NAME_COLSPAN} className="border p-1 bg-white text-center text-[17px]" style={CELL_BORDER}>
              {pdfExportMode ? (
                <span>{formatToeicScoreDisplay(formData.toeicScore)}</span>
              ) : (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="outline-none min-h-[1.2em] block"
                  onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, 'toeicScore')}
                  onBlur={(e) => {
                    const m = (e.currentTarget.textContent || '').match(/(\d+)/);
                    setFormData((prev) => ({ ...prev, toeicScore: m ? m[1] : '' }));
                  }}
                >
                  TOEIC({(formData.toeicScore || '').trim() || '　'}点)
                </span>
              )}
            </td>
            <YmCell kind="toeic" formFieldKey="toeicYear" compact />
            <OtherLangCertCells slotIndex={OTHER_LANG_SLOT_BY_ROW.toeic} />
          </tr>
        ) : null}

        {showIelts ? (
          <tr {...rowMeta('ielts')}>
            {!pdfExportMode && !showToeic ? (
              <td className="border p-1 text-center align-middle bg-white whitespace-nowrap text-[17px]" style={CELL_BORDER}>
                <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
              </td>
            ) : null}
            {pdfExportMode ? (
              <td className="border p-1 text-center align-middle bg-white whitespace-nowrap text-[17px]" style={CELL_BORDER}>
                <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
              </td>
            ) : null}
            <td colSpan={LEFT_NAME_COLSPAN} className="border p-1 bg-white text-center text-[17px]" style={CELL_BORDER}>
              {pdfExportMode ? (
                <span>{formatIeltsScoreDisplay(formData.ieltsScore)}</span>
              ) : (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="outline-none min-h-[1.2em] block"
                  onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, 'ieltsScore')}
                  onBlur={(e) => {
                    const m = (e.currentTarget.textContent || '').match(/(\d+\.?\d*)/);
                    setFormData((prev) => ({ ...prev, ieltsScore: m ? m[1] : '' }));
                  }}
                >
                  IELTS({(formData.ieltsScore || '').trim() || '　'}点)
                </span>
              )}
            </td>
            <YmCell kind="ielts" formFieldKey="ieltsYear" compact />
            <OtherLangCertCells slotIndex={OTHER_LANG_SLOT_BY_ROW.ielts} />
          </tr>
        ) : null}

        {showDriving ? (
          <tr {...rowMeta('driving')}>
            <td className="border p-1 text-center align-middle bg-white whitespace-nowrap text-[17px]" style={CELL_BORDER}>
              <SupplementTplText
                fieldKey={`tpl-${tplPrefix}-cert-row-drive`}
                text="自動車免許"
                supplementMarking={supplementMarking}
                linkedFieldKeys={['hasDrivingLicense', 'drivingLicenseYear']}
                className="select-text inline"
              />
            </td>
            {pdfExportMode ? (
              <td colSpan={LEFT_NAME_COLSPAN} className="border px-1 py-1.5 bg-white text-center text-[17px]" style={CELL_BORDER}>
                {formatDrivingLicenseMark(formData.hasDrivingLicense, '有る')}　{formatDrivingLicenseMark(formData.hasDrivingLicense, '無し')}
              </td>
            ) : (
              <td colSpan={LEFT_NAME_COLSPAN} className="border px-1 py-1 bg-white text-center text-[17px]" style={CELL_BORDER}>
                <div className="flex justify-center gap-3">
                  <label className="flex items-center justify-center gap-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded scale-90"
                      checked={formData.hasDrivingLicense === '1' || formData.hasDrivingLicense === '有る'}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          hasDrivingLicense: prev.hasDrivingLicense === '1' || prev.hasDrivingLicense === '有る' ? '' : '1',
                        }))
                      }
                    />
                    有る
                  </label>
                  <label className="flex items-center justify-center gap-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded scale-90"
                      checked={formData.hasDrivingLicense === '0' || formData.hasDrivingLicense === '無し'}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          hasDrivingLicense: prev.hasDrivingLicense === '0' || prev.hasDrivingLicense === '無し' ? '' : '0',
                        }))
                      }
                    />
                    無し
                  </label>
                </div>
              </td>
            )}
            <YmCell kind="driving" formFieldKey="drivingLicenseYear" compact />
            <OtherLangCertCells slotIndex={OTHER_LANG_SLOT_BY_ROW.driving} />
          </tr>
        ) : null}
      </tbody>
    </ResizableCvTable>
    </div>
  );
}
