import React, { useMemo } from 'react'
import {
  Search, UserCheck, MapPin, DollarSign, Languages, Plus, Building2, IdCard,
} from 'lucide-react'
import FilterBlock from '../Shared/FilterBlock'
import FilterSelectDropdown from '../Shared/FilterSelectDropdown'
import {
  EXPERIENCE_YEARS_OPTIONS,
  JAPANESE_LEVEL_FILTER_OPTIONS,
  getLocalizedOptionLabel,
} from '../../utils/scoutFilterOptions'
import { getWorkLocationsDisplayText } from '../../utils/workLocationFilter'
import {
  getScoutFilterCopy,
  getScoutVisaFilterOptions,
} from '../../i18n/businessAppI18n'

export const SCOUT_FILTER_INPUT_CLASS =
  'scout-cand-meta w-full h-8 min-h-8 px-2.5 border border-gray-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]/25 focus:border-transparent'

export const SCOUT_FILTER_PICKER_BTN_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-300 transition-colors hover:bg-gray-50'

const SCOUT_FILTER_LABEL_CLASS = 'scout-cand-caption font-medium text-gray-700 leading-snug'

function FilterPickerRow({ value, placeholder, onOpen, inputClassName, pickerBtnClassName }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        readOnly
        value={value}
        placeholder={placeholder}
        onClick={onOpen}
        className={`min-w-0 flex-1 cursor-pointer bg-gray-50 ${inputClassName || SCOUT_FILTER_INPUT_CLASS}`}
      />
      <button type="button" onClick={onOpen} className={pickerBtnClassName || SCOUT_FILTER_PICKER_BTN_CLASS}>
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
  language = 'vi',
  inputClassName = SCOUT_FILTER_INPUT_CLASS,
  pickerBtnClassName = SCOUT_FILTER_PICKER_BTN_CLASS,
  filterLabelClassName = SCOUT_FILTER_LABEL_CLASS,
  fieldMinHeightClass = 'min-h-8',
  dropdownOptionSize = 'compact',
  salarySepClassName = 'scout-cand-caption shrink-0 text-gray-500',
}) {
  const filterBlockProps = {
    labelClassName: filterLabelClassName,
    fieldMinHeightClass,
  };
  const f = useMemo(() => getScoutFilterCopy(language), [language])

  const japaneseLevelOptions = useMemo(() => [
    { value: '', label: f.japaneseLevelPlaceholder },
    ...JAPANESE_LEVEL_FILTER_OPTIONS.map((opt) => ({
      value: opt.value,
      label: getLocalizedOptionLabel(opt, language),
    })),
  ], [f.japaneseLevelPlaceholder, language])

  const experienceOptions = useMemo(() => [
    { value: '', label: f.experienceAll },
    ...EXPERIENCE_YEARS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: getLocalizedOptionLabel(opt, language),
    })),
  ], [f.experienceAll, language])

  const visaOptions = useMemo(() => [
    { value: '', label: f.visaAll },
    ...getScoutVisaFilterOptions(language).map((opt) => ({ value: opt.value, label: opt.label })),
  ], [f.visaAll, language])

  const locationDisplay = useMemo(
    () => getWorkLocationsDisplayText(scoutFilters.locations, language),
    [scoutFilters.locations, language],
  )

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {leadingBlock}

      <FilterBlock icon={Languages} label={f.japaneseLevel} compact {...filterBlockProps}>
        <FilterSelectDropdown
          value={scoutFilters.japaneseLevel || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, japaneseLevel: next }))}
          options={japaneseLevelOptions}
          placeholder={f.japaneseLevelPlaceholder}
          className={inputClassName}
          optionSize={dropdownOptionSize}
        />
      </FilterBlock>

      <FilterBlock icon={UserCheck} label={f.experience} compact {...filterBlockProps}>
        <FilterSelectDropdown
          value={scoutFilters.experience || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, experience: next }))}
          options={experienceOptions}
          placeholder={f.experienceAll}
          className={inputClassName}
          optionSize={dropdownOptionSize}
        />
      </FilterBlock>

      <FilterBlock icon={IdCard} label={f.visa} compact {...filterBlockProps}>
        <FilterSelectDropdown
          value={scoutFilters.visa || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, visa: next }))}
          options={visaOptions}
          placeholder={f.visaAll}
          className={inputClassName}
          optionSize={dropdownOptionSize}
          maxPanelHeight={220}
        />
      </FilterBlock>

      <FilterBlock icon={MapPin} label={f.location} compact {...filterBlockProps}>
        <FilterPickerRow
          value={locationDisplay}
          placeholder={f.locationPlaceholder}
          onOpen={onOpenLocationModal}
          inputClassName={inputClassName}
          pickerBtnClassName={pickerBtnClassName}
        />
      </FilterBlock>

      <FilterBlock icon={Building2} label={f.jobCategory} compact {...filterBlockProps}>
        <FilterPickerRow
          value={scoutFilters.jobCategoryLabel || ''}
          placeholder={f.jobCategoryPlaceholder}
          onOpen={onOpenJobCategoryModal}
          inputClassName={inputClassName}
          pickerBtnClassName={pickerBtnClassName}
        />
      </FilterBlock>

      <FilterBlock icon={DollarSign} label={f.salary} compact {...filterBlockProps}>
        <div className="flex min-w-0 items-center gap-1">
          <input
            type="number"
            value={scoutFilters.salaryMin}
            onChange={(e) => setScoutFilters((prev) => ({
              ...prev,
              salaryMin: e.target.value ? Number(e.target.value) : '',
            }))}
            placeholder={f.salaryFrom}
            className={`min-w-0 flex-1 ${inputClassName}`}
          />
          <span className={salarySepClassName}>~</span>
          <input
            type="number"
            value={scoutFilters.salaryMax}
            onChange={(e) => setScoutFilters((prev) => ({
              ...prev,
              salaryMax: e.target.value ? Number(e.target.value) : '',
            }))}
            placeholder={f.salaryTo}
            className={`min-w-0 flex-1 ${inputClassName}`}
          />
        </div>
      </FilterBlock>

      <FilterBlock icon={Search} label={f.keyword} compact {...filterBlockProps}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={f.keywordPlaceholder}
          className={inputClassName}
        />
      </FilterBlock>
    </div>
  )
}
