import React from 'react';
import ResizableCvTable from './ResizableCvTable';
import { cvLayoutKey } from './cvLayoutKey';
import { SupplementTplText } from './CvTemplateSupplementText.jsx';
import { parseYearMonthFlexible } from '../../utils/cvJpDateDisplay.js';
import {
  formatDrivingLicenseMark,
  formatIeltsScoreDisplay,
  formatJlptLevelMark,
  formatToeicScoreDisplay,
  getFixedCertTitleRowSpan,
  getFixedCertVisibleKinds,
  getFixedCertYearMonth,
  getJlptDisplay,
  hasFixedCertData,
} from '../../utils/cvFixedCertDisplay.js';

const DEFAULT_CERT_COL_PERCENTS = [12, 14, 8, 8, 8, 8, 42];
const JLPT_LEVELS = ['N1', 'N2', 'N3', 'N4'];
const CELL_BORDER = { borderColor: '#1f2937' };
const HEADER_BG = { ...CELL_BORDER, backgroundColor: '#e2efd9' };

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
}) {
  const visibleKinds = getFixedCertVisibleKinds(formData);
  const jlptDisplay = getJlptDisplay(formData.jlptLevel);

  if (pdfExportMode && visibleKinds.length === 0) {
    return null;
  }

  const showJlpt = !pdfExportMode || hasFixedCertData(formData, 'jlpt');
  const showToeic = !pdfExportMode || hasFixedCertData(formData, 'toeic');
  const showIelts = !pdfExportMode || hasFixedCertData(formData, 'ielts');
  const showDriving = !pdfExportMode || hasFixedCertData(formData, 'driving');
  const titleRowSpan = pdfExportMode ? getFixedCertTitleRowSpan(formData) : 5;
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

  const YmCell = ({ kind, formFieldKey }) => {
    const text = fixedCertYearMonth(kind);
    if (pdfExportMode) {
      return (
        <td className="border p-1.5 bg-white text-center text-xs" style={CELL_BORDER}>
          {text || '　'}
        </td>
      );
    }
    return (
      <td className="border p-1.5 bg-white text-center text-xs" style={CELL_BORDER}>
        <span
          contentEditable
          suppressContentEditableWarning
          className="outline-none min-h-[1.2em] block select-text"
          onBlur={(e) => onFixedCertYearMonthBlur(kind, e.currentTarget.textContent || '')}
          onContextMenu={(e) => supplementMarking?.onFieldContextMenu?.(e, formFieldKey)}
        >
          {text || '　年　月'}
        </span>
      </td>
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
    >
    <ResizableCvTable
      className="w-full border-collapse mt-3 font-bold"
      style={{ fontSize: '11px', color: '#1f2937', borderColor: '#1f2937' }}
      colPercents={colSaved('rirekisho', 'certificates_v2', DEFAULT_CERT_COL_PERCENTS)}
      layoutKey={cvLayoutKey(cvTpl, 'rirekisho', 'certificates_v2')}
      onLayoutCommit={onCvTableLayoutCommit}
    >
      <tbody>
        <tr>
          <td
            rowSpan={titleRowSpan}
            className="border p-2 text-center align-middle"
            style={{ ...CELL_BORDER, backgroundColor: '#e2efd9', width: '5rem' }}
          >
            <SupplementTplText
              fieldKey={`tpl-${tplPrefix}-cert-title`}
              text="保有資格・免許等"
              supplementMarking={supplementMarking}
              linkedFieldKeys={['addCandidate-certificates', 'jlptLevel', 'toeicScore', 'ieltsScore', 'hasDrivingLicense']}
            />
          </td>
          <td className="border p-1.5 text-center font-medium" style={HEADER_BG} />
          <td colSpan={4} className="border p-1.5 text-center font-medium" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-name`} text="名称" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
          <td className="border p-1.5 text-center font-medium" style={HEADER_BG}>
            <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-h-ym`} text="取得年月" supplementMarking={supplementMarking} className="select-text inline" />
          </td>
        </tr>

        {showJlpt ? (
          <tr {...rowMeta('jlpt')}>
            <td className="border p-1.5 text-center align-middle bg-white whitespace-nowrap" style={CELL_BORDER}>
              <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-jlpt`} text="日本語検定" supplementMarking={supplementMarking} linkedFieldKeys={['jlptLevel']} className="select-text inline" />
            </td>
            {pdfExportMode ? (
              JLPT_LEVELS.map((n) => (
                <td key={n} className="border p-1 bg-white text-center text-xs" style={CELL_BORDER}>
                  {formatJlptLevelMark(jlptDisplay, n)}
                </td>
              ))
            ) : (
              <td colSpan={4} className="border p-1 bg-white" style={CELL_BORDER}>
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                  {JLPT_LEVELS.map((n) => (
                    <label key={n} className="flex items-center justify-center gap-0.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
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
            <YmCell kind="jlpt" formFieldKey="jlptAcquiredYear" />
          </tr>
        ) : null}

        {showToeic ? (
          <tr {...rowMeta('toeic')}>
            <td
              rowSpan={englishRowSpan}
              className="border p-1.5 text-center align-middle bg-white whitespace-nowrap"
              style={CELL_BORDER}
            >
              <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
            </td>
            <td colSpan={4} className="border p-1.5 bg-white text-center" style={CELL_BORDER}>
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
                  TOEIC ({(formData.toeicScore || '').trim() || '　　　'}点)
                </span>
              )}
            </td>
            <YmCell kind="toeic" formFieldKey="toeicYear" />
          </tr>
        ) : null}

        {showIelts ? (
          <tr {...rowMeta('ielts')}>
            {!pdfExportMode && !showToeic ? (
              <td className="border p-1.5 text-center align-middle bg-white whitespace-nowrap" style={CELL_BORDER}>
                <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
              </td>
            ) : null}
            {pdfExportMode ? (
              <td className="border p-1.5 text-center align-middle bg-white whitespace-nowrap" style={CELL_BORDER}>
                <SupplementTplText fieldKey={`tpl-${tplPrefix}-cert-row-en`} text="英語" supplementMarking={supplementMarking} linkedFieldKeys={['toeicScore', 'ieltsScore']} className="select-text inline" />
              </td>
            ) : null}
            <td colSpan={4} className="border p-1.5 bg-white text-center" style={CELL_BORDER}>
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
                  IELTS ({(formData.ieltsScore || '').trim() || '　　　'}点)
                </span>
              )}
            </td>
            <YmCell kind="ielts" formFieldKey="ieltsYear" />
          </tr>
        ) : null}

        {showDriving ? (
          <tr {...rowMeta('driving')}>
            <td className="border p-1.5 text-center align-middle bg-white whitespace-nowrap" style={CELL_BORDER}>
              <SupplementTplText
                fieldKey={`tpl-${tplPrefix}-cert-row-drive`}
                text="自動車免許"
                supplementMarking={supplementMarking}
                linkedFieldKeys={['hasDrivingLicense', 'drivingLicenseYear']}
                className="select-text inline"
              />
            </td>
            {pdfExportMode ? (
              <>
                <td colSpan={2} className="border p-1.5 bg-white text-center text-xs" style={CELL_BORDER}>
                  {formatDrivingLicenseMark(formData.hasDrivingLicense, '有る')}
                </td>
                <td colSpan={2} className="border p-1.5 bg-white text-center text-xs" style={CELL_BORDER}>
                  {formatDrivingLicenseMark(formData.hasDrivingLicense, '無し')}
                </td>
              </>
            ) : (
              <>
                <td colSpan={2} className="border p-1.5 bg-white text-center" style={CELL_BORDER}>
                  <label className="flex items-center justify-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
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
                </td>
                <td colSpan={2} className="border p-1.5 bg-white text-center" style={CELL_BORDER}>
                  <label className="flex items-center justify-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
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
                </td>
              </>
            )}
            <YmCell kind="driving" formFieldKey="drivingLicenseYear" />
          </tr>
        ) : null}
      </tbody>
    </ResizableCvTable>
    </div>
  );
}
