import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import apiService from '../../services/api';
import { isPersistableJobValue } from '../../utils/jobCommissionUi';

/**
 * Cài đặt phí giới thiệu (jobCommissionType + jobValues) — dùng khi đưa job lên sàn CTV.
 * Rút gọn từ AddJobPage «Cài đặt phí» (không CRUD Type/Value).
 */
export default function JobCommissionEditor({
  jobCommissionType,
  onCommissionTypeChange,
  jobValues,
  onJobValuesChange,
  seedTypes = [],
  seedValuesByType = {},
}) {
  const [types, setTypes] = useState([]);
  const [valuesByType, setValuesByType] = useState({});
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesLoadFailed, setTypesLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingTypes(true);
    setTypesLoadFailed(false);
    apiService
      .getBusinessCommissionTypes()
      .then((res) => {
        if (!mounted) return;
        const loaded = res?.data?.types || [];
        setTypes(loaded.length ? loaded : seedTypes);
        if (!loaded.length && seedTypes.length) setTypesLoadFailed(true);
      })
      .catch(() => {
        if (!mounted) return;
        setTypes(seedTypes);
        setTypesLoadFailed(true);
      })
      .finally(() => {
        if (mounted) setLoadingTypes(false);
      });
    return () => {
      mounted = false;
    };
  }, [seedTypes]);

  useEffect(() => {
    if (Object.keys(seedValuesByType).length) {
      setValuesByType((prev) => ({ ...seedValuesByType, ...prev }));
    }
  }, [seedValuesByType]);

  useEffect(() => {
    const typeIds = [...new Set((jobValues || []).map((jv) => jv.typeId).filter(Boolean))];
    typeIds.forEach(async (typeId) => {
      if (valuesByType[typeId]?.length) return;
      if (seedValuesByType[typeId]?.length) {
        setValuesByType((prev) => ({ ...prev, [typeId]: seedValuesByType[typeId] }));
        return;
      }
      try {
        const res = await apiService.getBusinessValuesByType(typeId);
        setValuesByType((prev) => ({ ...prev, [typeId]: res?.data?.values || [] }));
      } catch {
        setValuesByType((prev) => ({ ...prev, [typeId]: seedValuesByType[typeId] || [] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobValues, seedValuesByType]);

  const setRow = (index, patch) => {
    const next = [...jobValues];
    next[index] = { ...next[index], ...patch };
    onJobValuesChange(next);
  };

  const addRow = () => {
    onJobValuesChange([
      ...jobValues,
      { typeId: '', valueId: '', value: '', isRequired: false, viewOnCollaborator: '' },
    ]);
  };

  const removeRow = (index) => {
    onJobValuesChange(jobValues.filter((_, i) => i !== index));
  };

  const pickTypeName = (type) => type?.typename || `Type #${type?.id}`;
  const pickValueName = (value) => value?.valuename || `Value #${value?.id}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-1">Cài đặt phí giới thiệu</div>
        <p className="text-[10px] text-slate-500">
          Phí thưởng CTV — giống phần &quot;Cài đặt phí&quot; khi tạo job. Bắt buộc khi đưa lên sàn.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Loại hoa hồng <span className="text-red-500">*</span>
        </label>
        <select
          value={jobCommissionType}
          onChange={(e) => onCommissionTypeChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="fixed">Số tiền cố định</option>
          <option value="percent">Phần trăm</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1">
          {jobCommissionType === 'fixed'
            ? 'Giá trị hiểu là số tiền cố định (Y). Ví dụ: 50000000 = 50 triệu Y'
            : 'Giá trị hiểu là phần trăm (%). Ví dụ: 30 = 30%'}
        </p>
      </div>

      {loadingTypes && <p className="text-[10px] text-slate-400">Đang tải Type/Value...</p>}
      {typesLoadFailed && (
        <p className="text-[10px] text-amber-600">
          Không tải được danh mục phí từ API. Đang dùng dữ liệu từ JD (nếu có). Chạy backend local hoặc deploy backend mới để chọn đầy đủ Type/Value.
        </p>
      )}

      {jobValues.map((jv, index) => (
        <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Job Value #{index + 1}</span>
            <button type="button" onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={jv.typeId ?? ''}
                onChange={async (e) => {
                  const selectedTypeId = e.target.value ? parseInt(e.target.value, 10) : '';
                  if (selectedTypeId) {
                    const response = await apiService.getBusinessValuesByType(selectedTypeId);
                    const valuesForType = response?.data?.values || [];
                    setValuesByType((prev) => ({ ...prev, [selectedTypeId]: valuesForType }));
                    if (selectedTypeId === 2) {
                      setRow(index, { typeId: selectedTypeId, valueId: '', value: jv.value ?? '' });
                    } else if (valuesForType.length > 0) {
                      const without = jobValues.filter((_, i) => i !== index);
                      const cards = valuesForType.map((value) => ({
                        typeId: selectedTypeId,
                        valueId: value.id,
                        value: '',
                        isRequired: false,
                        viewOnCollaborator: '',
                      }));
                      without.splice(index, 0, ...cards);
                      onJobValuesChange(without);
                    } else {
                      setRow(index, { typeId: selectedTypeId, valueId: '', value: jv.value ?? '' });
                    }
                  } else {
                    setRow(index, { typeId: '', valueId: '', value: jv.value ?? '' });
                  }
                }}
                className="w-full border rounded px-2 py-1.5 text-xs"
              >
                <option value="">Chọn Type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {pickTypeName(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Value</label>
              <select
                value={jv.valueId ?? ''}
                onChange={(e) =>
                  setRow(index, {
                    valueId: e.target.value ? parseInt(e.target.value, 10) : '',
                  })
                }
                disabled={!jv.typeId}
                className="w-full border rounded px-2 py-1.5 text-xs disabled:bg-slate-100"
              >
                <option value="">Chọn Value{jv.typeId === 2 ? ' *' : ''}</option>
                {(valuesByType[jv.typeId] || []).map((value) => (
                  <option key={value.id} value={value.id}>
                    {pickValueName(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giá trị cụ thể
              {jobCommissionType === 'fixed' && <span className="text-slate-400 ml-1">(Y)</span>}
              {jobCommissionType === 'percent' && <span className="text-slate-400 ml-1">(%)</span>}
            </label>
            {Number(jv.typeId) === 7 && Number(jv.valueId) === 34 ? (
              <input
                type="text"
                value={jv.value || ''}
                onChange={(e) => setRow(index, { value: e.target.value })}
                placeholder="VD: 01 tháng lương nhân viên"
                className="w-full border rounded px-2 py-1.5 text-xs"
              />
            ) : (
              <input
                type="number"
                step={jobCommissionType === 'percent' ? '0.01' : '1'}
                min="0"
                max={jobCommissionType === 'percent' ? '100' : undefined}
                value={jv.value || ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (jobCommissionType === 'percent' && inputValue && parseFloat(inputValue) > 100) {
                    alert('Phần trăm không được vượt quá 100%');
                    return;
                  }
                  setRow(index, { value: inputValue });
                }}
                placeholder={jobCommissionType === 'fixed' ? 'VD: 50000000 (Y)' : 'VD: 30 (%)'}
                className="w-full border rounded px-2 py-1.5 text-xs"
              />
            )}
          </div>
          {Number(jv.typeId) === 7 && Number(jv.valueId) === 34 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giá trị hiển thị cho CTV <span className="text-slate-400">(Y)</span>
              </label>
              <input
                type="text"
                value={jv.viewOnCollaborator || ''}
                onChange={(e) => setRow(index, { viewOnCollaborator: e.target.value })}
                placeholder="VD: 300000 hoặc 300000 - 400000"
                className="w-full border rounded px-2 py-1.5 text-xs"
              />
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={!!jv.isRequired}
              onChange={(e) => setRow(index, { isRequired: e.target.checked })}
              className="rounded border-slate-300"
            />
            Bắt buộc
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        <Plus className="w-3.5 h-3.5" />
        Thêm Job Value
      </button>

      {!jobValues.some(isPersistableJobValue) && (
        <p className="text-[10px] text-amber-600">Cần ít nhất một dòng phí có Type/Value và giá trị.</p>
      )}
    </div>
  );
}

export function validateCommissionForMarketplace(jobCommissionType, jobValues) {
  if (!jobCommissionType) return 'Chọn loại hoa hồng';
  const persistable = (jobValues || []).filter(isPersistableJobValue);
  if (!persistable.length) return 'Thêm ít nhất một dòng phí giới thiệu';
  for (const jv of persistable) {
    if (Number(jv.typeId) === 2 && !jv.valueId) return 'Type bắt buộc cần chọn Value';
    if (jv.value != null && String(jv.value).trim() !== '') {
      const n = parseFloat(jv.value);
      if (Number.isFinite(n) && n < 0) return 'Giá trị phí phải ≥ 0';
      if (jobCommissionType === 'percent' && Number.isFinite(n) && n > 100) {
        return 'Phần trăm không được vượt quá 100%';
      }
    }
  }
  return null;
}
