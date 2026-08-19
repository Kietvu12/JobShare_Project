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
  language = 'vi',
}) {
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

      <FilterBlock icon={Languages} label={f.japaneseLevel} compact>
        <FilterSelectDropdown
          value={scoutFilters.japaneseLevel || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, japaneseLevel: next }))}
          options={japaneseLevelOptions}
          placeholder={f.japaneseLevelPlaceholder}
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>

      <FilterBlock icon={UserCheck} label={f.experience} compact>
        <FilterSelectDropdown
          value={scoutFilters.experience || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, experience: next }))}
          options={experienceOptions}
          placeholder={f.experienceAll}
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>

      <FilterBlock icon={IdCard} label={f.visa} compact>
        <FilterSelectDropdown
          value={scoutFilters.visa || ''}
          onChange={(next) => setScoutFilters((prev) => ({ ...prev, visa: next }))}
          options={visaOptions}
          placeholder={f.visaAll}
          className={SCOUT_FILTER_INPUT_CLASS}
          maxPanelHeight={220}
        />
      </FilterBlock>

      <FilterBlock icon={MapPin} label={f.location} compact>
        <FilterPickerRow
          value={locationDisplay}
          placeholder={f.locationPlaceholder}
          onOpen={onOpenLocationModal}
        />
      </FilterBlock>

      <FilterBlock icon={Building2} label={f.jobCategory} compact>
        <FilterPickerRow
          value={scoutFilters.jobCategoryLabel || ''}
          placeholder={f.jobCategoryPlaceholder}
          onOpen={onOpenJobCategoryModal}
        />
      </FilterBlock>

      <FilterBlock icon={DollarSign} label={f.salary} compact>
        <div className="flex min-w-0 items-center gap-1">
          <input
            type="number"
            value={scoutFilters.salaryMin}
            onChange={(e) => setScoutFilters((prev) => ({
              ...prev,
              salaryMin: e.target.value ? Number(e.target.value) : '',
            }))}
            placeholder={f.salaryFrom}
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
            placeholder={f.salaryTo}
            className={`min-w-0 flex-1 ${SCOUT_FILTER_INPUT_CLASS}`}
          />
        </div>
      </FilterBlock>

      <FilterBlock icon={Search} label={f.keyword} compact>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={f.keywordPlaceholder}
          className={SCOUT_FILTER_INPUT_CLASS}
        />
      </FilterBlock>
    </div>
  )
}
