import React, { useMemo } from 'react'
import {
  Search, UserCheck, MapPin, DollarSign, Languages, Plus, Building2, IdCard,
} from 'lucide-react'
import FilterBlock from '../Shared/FilterBlock'
import FilterSelectDropdown from '../Shared/FilterSelectDropdown'
import {
  EXPERIENCE_YEARS_OPTIONS,
  JAPANESE_LEVEL_FILTER_OPTIONS,
  SCOUT_VISA_FILTER_OPTIONS,
  getLocalizedOptionLabel,
} from '../../utils/scoutFilterOptions'
import { getWorkLocationsDisplayText } from '../../utils/workLocationFilter'

export const SCOUT_FILTER_INPUT_CLASS =
  'w-full h-[26px] px-2 py-0 text-[9px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const SCOUT_FILTER_PICKER_BTN_CLASS =
  'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-50'

function FilterPickerRow({ value, placeholder, onOpen }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        readOnly
        value={value}
        placeholder={placeholder}
        onClick={onOpen}
        className={`min-w-0 flex-1 cursor-pointer bg-gray-50 ${SCOUT_FILTER_INPUT_CLASS}`}
      />
      <button type="button" onClick={onOpen} className={SCOUT_FILTER_PICKER_BTN_CLASS}>
        <Plus className="h-3 w-3 text-gray-600" />
      </button>
    </div>
  )
}

export default function ScoutCandidateFilterFields({
  leadingBlock,
  scoutFilters,
  setScoutFilters,
  searchInput,
  setSearchInput,
  onOpenLocationModal,
  onOpenJobCategoryModal,
}) {
  const japaneseLevelOptions = useMemo(() => [
    { value: '', label: 'Chọn trình độ tiếng Nhật' },
    ...JAPANESE_LEVEL_FILTER_OPTIONS.map((opt) => ({
      value: opt.value,
      label: getLocalizedOptionLabel(opt, 'vi'),
    })),
  ], [])

  const experienceOptions = useMemo(() => [
    { value: '', label: 'Tất cả kinh nghiệm' },
    ...EXPERIENCE_YEARS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: getLocalizedOptionLabel(opt, 'vi'),
    })),
  ], [])

  const visaOptions = useMemo(() => [
    { value: '', label: 'Tất cả tư cách lưu trú' },
    ...SCOUT_VISA_FILTER_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
  ], [])

  const locationDisplay = useMemo(
    () => getWorkLocationsDisplayText(scoutFilters.locations, 'vi'),
    [scoutFilters.locations],
  )

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {leadingBlock}

      <FilterBlock icon={Languages} label="Trình độ tiếng Nhật" compact>
        <FilterSelectDropdown
          value={scoutFilters.japaneseLevel || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, japaneseLevel: next }))}
          options={japaneseLevelOptions}
          placeholder="Chọn trình độ tiếng Nhật"
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>

      <FilterBlock icon={UserCheck} label="Số năm kinh nghiệm" compact>
        <FilterSelectDropdown
          value={scoutFilters.experience || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, experience: next }))}
          options={experienceOptions}
          placeholder="Tất cả kinh nghiệm"
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>

      <FilterBlock icon={IdCard} label="Tình trạng visa" compact>
        <FilterSelectDropdown
          value={scoutFilters.visa || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, visa: next }))}
          options={visaOptions}
          placeholder="Tất cả tư cách lưu trú"
          className={SCOUT_FILTER_INPUT_CLASS}
          maxPanelHeight={220}
        />
      </FilterBlock>

      <FilterBlock icon={MapPin} label="Địa điểm hiện tại" compact>
        <FilterPickerRow
          value={locationDisplay}
          placeholder="Chọn khu vực (Việt Nam / Nhật Bản...)"
          onOpen={onOpenLocationModal}
        />
      </FilterBlock>

      <FilterBlock icon={Building2} label="Ngành nghề" compact>
        <FilterPickerRow
          value={scoutFilters.jobCategoryLabel || ''}
          placeholder="Chọn ngành nghề"
          onOpen={onOpenJobCategoryModal}
        />
      </FilterBlock>

      <FilterBlock icon={DollarSign} label="Mức lương mong muốn (VNĐ)" compact>
        <div className="flex min-w-0 items-center gap-1">
          <input
            type="number"
            value={scoutFilters.salaryMin}
            onChange={(e) => setScoutFilters((prev) => ({
              ...prev,
              salaryMin: e.target.value ? Number(e.target.value) : '',
            }))}
            placeholder="Từ"
            className={`min-w-0 flex-1 ${SCOUT_FILTER_INPUT_CLASS}`}
          />
          <span className="shrink-0 text-[9px] text-gray-500">~</span>
          <input
            type="number"
            value={scoutFilters.salaryMax}
            onChange={(e) => setScoutFilters((prev) => ({
              ...prev,
              salaryMax: e.target.value ? Number(e.target.value) : '',
            }))}
            placeholder="Đến"
            className={`min-w-0 flex-1 ${SCOUT_FILTER_INPUT_CLASS}`}
          />
        </div>
      </FilterBlock>

      <FilterBlock icon={Search} label="Từ khóa" compact>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nhập từ khóa: React Developer, Sales..."
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>
    </div>
  )
}
