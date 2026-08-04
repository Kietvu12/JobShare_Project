import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { JAPAN_REGIONS, JAPAN_PREFECTURES, fetchJapanCitiesByPrefecture } from '../../utils/japanLocationData';
import {
  ALL_JAPAN_PREFECTURES_KEY,
  ALL_JAPAN_REGIONS_KEY,
  WORK_LOCATION_COUNTRY_KEYS,
  WORK_LOCATION_VIETNAM_PROVINCES,
  createEmptyJapanSelectionDraft,
  createEmptyWorkLocationDraft,
  createJapanPrefectureEntry,
  createJapanRegionEntry,
  deriveJapanSelectionDraftFromLocations,
  workLocationCountryLabel,
} from '../../utils/workLocationFilter';

export default function WorkLocationFilterModal({
  open,
  onClose,
  value = [],
  onConfirm,
  language = 'vi',
  rightPanelTitle,
}) {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [draftLocations, setDraftLocations] = useState(createEmptyWorkLocationDraft);
  const [japanFilterRegion, setJapanFilterRegion] = useState(null);
  const [japanFilterPrefecture, setJapanFilterPrefecture] = useState(null);
  const [japanSelectionDraft, setJapanSelectionDraft] = useState(createEmptyJapanSelectionDraft);
  const [japanFilterData, setJapanFilterData] = useState({ flat: [], tree: [] });
  const [japanPrefectureCache, setJapanPrefectureCache] = useState({});
  const [japanFilterLoading, setJapanFilterLoading] = useState(false);
  const [japanBulkLoading, setJapanBulkLoading] = useState(null);

  const resetState = useCallback(() => {
    setSelectedCountries([]);
    setDraftLocations(createEmptyWorkLocationDraft());
    setJapanFilterRegion(null);
    setJapanFilterPrefecture(null);
    setJapanSelectionDraft(createEmptyJapanSelectionDraft());
    setJapanFilterData({ flat: [], tree: [] });
    setJapanPrefectureCache({});
    setJapanFilterLoading(false);
    setJapanBulkLoading(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const nextDraftLocations = Array.isArray(value) ? [...value] : [];
    const countries = Array.from(new Set(nextDraftLocations.map((loc) => loc?.country).filter(Boolean)));
    const hasJapan = countries.includes('Japan');
    const nextJapanSelectionDraft = hasJapan
      ? deriveJapanSelectionDraftFromLocations(nextDraftLocations)
      : createEmptyJapanSelectionDraft();

    setSelectedCountries(countries);
    setDraftLocations(nextDraftLocations);
    setJapanSelectionDraft(nextJapanSelectionDraft);
    setJapanFilterRegion(nextJapanSelectionDraft.regions[0] || null);
    setJapanFilterPrefecture(nextJapanSelectionDraft.prefectures[0] || null);
    setJapanFilterData({ flat: [], tree: [] });
    setJapanFilterLoading(false);
    setJapanBulkLoading(null);
  }, [open, value]);

  useEffect(() => {
    if (!selectedCountries.includes('Japan')) {
      setJapanFilterRegion(null);
      setJapanFilterPrefecture(null);
      setJapanFilterData({ flat: [], tree: [] });
    }
  }, [selectedCountries]);

  const loadJapanPrefectureData = async (prefCode) => {
    if (japanPrefectureCache[prefCode]) return japanPrefectureCache[prefCode];
    const data = (await fetchJapanCitiesByPrefecture(prefCode)) || { flat: [], tree: [] };
    setJapanPrefectureCache((prev) => (prev[prefCode] ? prev : { ...prev, [prefCode]: data }));
    return data;
  };

  useEffect(() => {
    if (!japanFilterPrefecture || japanFilterPrefecture === ALL_JAPAN_PREFECTURES_KEY) {
      setJapanFilterData({ flat: [], tree: [] });
      return;
    }
    let cancelled = false;
    setJapanFilterLoading(true);
    loadJapanPrefectureData(japanFilterPrefecture)
      .then((r) => {
        if (!cancelled) setJapanFilterData(r || { flat: [], tree: [] });
      })
      .catch(() => {
        if (!cancelled) setJapanFilterData({ flat: [], tree: [] });
      })
      .finally(() => {
        if (!cancelled) setJapanFilterLoading(false);
      });
    return () => { cancelled = true; };
  }, [japanFilterPrefecture]);

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.(draftLocations);
    resetState();
    onClose?.();
  };

  const toggleCountry = (country) => {
    setSelectedCountries((prev) => {
      if (prev.includes(country)) {
        setDraftLocations((prevLocations) => prevLocations.filter((loc) => loc.country !== country));
        return prev.filter((c) => c !== country);
      }
      return [...prev, country];
    });
  };

  const toggleLocation = (location, country) => {
    setDraftLocations((prev) => {
      const existingIndex = prev.findIndex((loc) => loc.country === country && loc.location === location);
      if (existingIndex >= 0) return prev.filter((_, index) => index !== existingIndex);
      return [...prev, { country, location }];
    });
  };

  const getVietnamLocationSet = (locationsSource = draftLocations) =>
    new Set(locationsSource.filter((l) => l.country === 'Vietnam').map((l) => l.location));

  const toggleJapanLocationEntry = ({ location, locationJp, jpId, locationLevel = 'ward', searchTerm }) => {
    setDraftLocations((prev) => {
      const idx = prev.findIndex((l) => l.country === 'Japan' && (jpId ? l.jpId === jpId : l.location === location));
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, {
        country: 'Japan',
        location,
        locationJp,
        jpId,
        locationLevel,
        searchTerm: searchTerm || locationJp || location,
      }];
    });
  };

  const applyJapanLocationBulk = (add, locObjs) => {
    setDraftLocations((prev) => {
      const ids = new Set(locObjs.map((l) => l.id));
      let next = [...prev];
      if (add) {
        const have = new Set(next.filter((l) => l.country === 'Japan').map((l) => l.jpId));
        locObjs.forEach((loc) => {
          if (!have.has(loc.id)) {
            next.push({
              country: 'Japan',
              location: loc.alpha,
              locationJp: loc.ja,
              jpId: loc.id,
              locationLevel: loc.locationLevel || 'ward',
              searchTerm: loc.searchTerm || loc.ja || loc.alpha,
            });
            have.add(loc.id);
          }
        });
      } else {
        next = next.filter((l) => l.country !== 'Japan' || !ids.has(l.jpId));
      }
      return next;
    });
  };

  const getJapanRegionIdsForPanel = () => {
    if (japanSelectionDraft.allRegions) return JAPAN_REGIONS.map((region) => region.id);
    if (japanSelectionDraft.regions.length > 0) return japanSelectionDraft.regions;
    if (japanFilterRegion === ALL_JAPAN_REGIONS_KEY) return JAPAN_REGIONS.map((region) => region.id);
    return japanFilterRegion ? [japanFilterRegion] : [];
  };

  const getJapanPrefectureCodesForPanel = () => {
    const regionIds = getJapanRegionIdsForPanel();
    return Array.from(new Set(regionIds.flatMap(
      (regionId) => JAPAN_REGIONS.find((region) => region.id === regionId)?.prefectureCodes || [],
    )));
  };

  const isJapanPrefectureChecked = (prefCode) => japanSelectionDraft.prefectures.includes(prefCode);
  const isJapanRegionChecked = (regionId) =>
    japanSelectionDraft.allRegions || japanSelectionDraft.regions.includes(regionId);
  const areAllPrefecturesChecked = (prefCodes) =>
    Array.isArray(prefCodes) && prefCodes.length > 0 && prefCodes.every((code) => isJapanPrefectureChecked(code));

  const getJapanTargetPrefectureCodesForWardPanel = () => {
    if (japanSelectionDraft.prefectures.length > 0) return japanSelectionDraft.prefectures;
    if (japanFilterPrefecture === ALL_JAPAN_PREFECTURES_KEY) return getJapanPrefectureCodesForPanel();
    return japanFilterPrefecture ? [japanFilterPrefecture] : [];
  };

  const selectAllPrefecture = async (prefCode, add) => {
    setJapanBulkLoading(`pref-${prefCode}`);
    try {
      const regionId = JAPAN_REGIONS.find((region) => region.prefectureCodes.includes(prefCode))?.id || null;
      if (add && regionId) {
        setJapanFilterRegion(regionId);
        setJapanFilterPrefecture(prefCode);
      }
      setJapanSelectionDraft((prev) => ({
        ...prev,
        prefectures: add
          ? Array.from(new Set([...prev.prefectures, prefCode]))
          : prev.prefectures.filter((code) => code !== prefCode),
      }));
      const prefEntry = createJapanPrefectureEntry(prefCode, language);
      if (prefEntry) {
        setDraftLocations((prev) => {
          const exists = prev.some((loc) => loc.country === 'Japan' && loc.jpId === prefEntry.jpId);
          if (add && !exists) return [...prev, prefEntry];
          if (!add && exists) return prev.filter((loc) => !(loc.country === 'Japan' && loc.jpId === prefEntry.jpId));
          return prev;
        });
      }
      if (!add && japanFilterPrefecture === prefCode) setJapanFilterPrefecture(null);
    } catch { /* ignore */ }
    setJapanBulkLoading(null);
  };

  const selectAllPrefecturesInPanel = async (prefCodes, add) => {
    if (!Array.isArray(prefCodes) || prefCodes.length === 0) return;
    setJapanBulkLoading('pref-panel');
    try {
      if (add) setJapanFilterPrefecture(ALL_JAPAN_PREFECTURES_KEY);
      else if (japanFilterPrefecture === ALL_JAPAN_PREFECTURES_KEY) setJapanFilterPrefecture(null);
      setJapanSelectionDraft((prev) => ({
        ...prev,
        prefectures: add
          ? Array.from(new Set([...prev.prefectures, ...prefCodes]))
          : prev.prefectures.filter((code) => !prefCodes.includes(code)),
      }));
      setDraftLocations((prev) => {
        let next = [...prev];
        prefCodes.forEach((prefCode) => {
          const prefEntry = createJapanPrefectureEntry(prefCode, language);
          if (!prefEntry) return;
          const exists = next.some((loc) => loc.country === 'Japan' && loc.jpId === prefEntry.jpId);
          if (add && !exists) next.push(prefEntry);
          if (!add && exists) next = next.filter((loc) => !(loc.country === 'Japan' && loc.jpId === prefEntry.jpId));
        });
        return next;
      });
    } catch { /* ignore */ }
    setJapanBulkLoading(null);
  };

  const selectAllRegion = async (regionId, add) => {
    const region = JAPAN_REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    setJapanBulkLoading(`reg-${regionId}`);
    if (add) {
      setJapanFilterRegion(regionId);
      setJapanFilterPrefecture(ALL_JAPAN_PREFECTURES_KEY);
    } else if (japanFilterRegion === regionId) {
      setJapanFilterPrefecture(null);
    }
    setJapanSelectionDraft((prev) => ({
      allRegions: prev.allRegions && add,
      regions: add ? Array.from(new Set([...prev.regions, regionId])) : prev.regions.filter((id) => id !== regionId),
      prefectures: prev.prefectures,
    }));
    const regionEntry = createJapanRegionEntry(region, language);
    setDraftLocations((prev) => {
      const exists = prev.some((loc) => loc.country === 'Japan' && loc.jpId === regionEntry.jpId);
      if (add && !exists) return [...prev, regionEntry];
      if (!add && exists) return prev.filter((loc) => !(loc.country === 'Japan' && loc.jpId === regionEntry.jpId));
      return prev;
    });
    setJapanBulkLoading(null);
  };

  const selectAllJapanLocations = async (add) => {
    setJapanBulkLoading('all-japan');
    try {
      if (add) {
        setJapanFilterRegion(ALL_JAPAN_REGIONS_KEY);
        setJapanFilterPrefecture(ALL_JAPAN_PREFECTURES_KEY);
      } else {
        setJapanFilterRegion(null);
        setJapanFilterPrefecture(null);
      }
      setJapanSelectionDraft({
        allRegions: add,
        regions: add ? JAPAN_REGIONS.map((region) => region.id) : [],
        prefectures: japanSelectionDraft.prefectures,
      });
      setDraftLocations((prev) => {
        let next = [...prev];
        JAPAN_REGIONS.forEach((region) => {
          const regionEntry = createJapanRegionEntry(region, language);
          const exists = next.some((loc) => loc.country === 'Japan' && loc.jpId === regionEntry.jpId);
          if (add && !exists) next.push(regionEntry);
          if (!add && exists) next = next.filter((loc) => !(loc.country === 'Japan' && loc.jpId === regionEntry.jpId));
        });
        return next;
      });
    } catch { /* ignore */ }
    setJapanBulkLoading(null);
  };

  const rightTitle = rightPanelTitle || (language === 'vi'
    ? 'Chọn địa điểm làm việc'
    : language === 'en'
      ? 'Select work location'
      : '勤務地を選択');

  const wardPanelContent = useMemo(() => {
    if (japanFilterLoading) return <div className="text-xs text-gray-500 p-2">Loading…</div>;
    const targetPrefCodes = getJapanTargetPrefectureCodesForWardPanel();
    if (targetPrefCodes.length === 0) {
      return (
        <div className="text-xs text-gray-400 p-2">
          {language === 'vi' ? 'Chọn vùng và tỉnh' : language === 'en' ? 'Select region & prefecture' : '地域と都道府県を選んでください'}
        </div>
      );
    }

    const selectedIds = new Set(
      draftLocations.filter((l) => l.country === 'Japan').map((l) => l.jpId || `${l.location}_Japan`),
    );

    const prefSections = targetPrefCodes.map((prefCode) => {
      const tree = prefCode === japanFilterPrefecture && japanFilterPrefecture && japanFilterPrefecture !== ALL_JAPAN_PREFECTURES_KEY
        ? japanFilterData.tree || []
        : japanPrefectureCache[prefCode]?.tree || [];
      const pref = JAPAN_PREFECTURES[prefCode];
      const prefJa = pref?.ja || '';
      const prefEn = pref?.en || '';
      const toR = (kana, fb) => (kana ? kana : fb);
      const makeLoc = (nameJa, nameKana) => {
        const ja = `${prefJa} ${nameJa}`.trim();
        const alpha = `${prefEn} ${nameJa}`.trim();
        const id = `${prefCode}|${nameJa}`;
        return { id, ja, alpha };
      };
      const allLocs = tree.flatMap((c) =>
        c.standalone
          ? [makeLoc(c.name, c.nameKana)]
          : (c.wards || []).map((w) => makeLoc(w.fullName, w.fullNameKana)),
      );
      return { prefCode, prefJa, prefEn, tree, allLocs, makeLoc, toR };
    }).filter((section) => section.allLocs.length > 0);

    const mergedAllLocs = prefSections.flatMap((section) => section.allLocs);
    if (mergedAllLocs.length === 0) {
      return (
        <div className="text-xs text-gray-400 p-2">
          {language === 'vi' ? 'Không có dữ liệu' : language === 'en' ? 'No data' : 'データがありません'}
        </div>
      );
    }

    const allOn = mergedAllLocs.every((loc) => selectedIds.has(loc.id));
    return (
      <>
        <label className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
          <input
            type="checkbox"
            checked={allOn}
            onChange={(e) => applyJapanLocationBulk(e.target.checked, mergedAllLocs)}
            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
          />
          <span className="text-xs font-medium">
            {language === 'vi' ? 'Tất cả' : language === 'en' ? 'All' : 'すべて'}
          </span>
        </label>
        {prefSections.map((section) => (
          <div key={section.prefCode} className="mb-2 last:mb-0">
            {targetPrefCodes.length > 1 && (
              <div className="text-xs font-semibold text-gray-800 px-1 py-1">{language === 'ja' ? section.prefJa : section.prefEn}</div>
            )}
            {section.tree.map((city) => {
              const cityLocs = city.standalone
                ? [section.makeLoc(city.name, city.nameKana)]
                : (city.wards || []).map((w) => section.makeLoc(w.fullName, w.fullNameKana));
              const cityOn = cityLocs.length > 0 && cityLocs.every((l) => selectedIds.has(l.id));
              return (
                <div key={`${section.prefCode}-${city.name}`}>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cityOn}
                      onChange={(e) => applyJapanLocationBulk(e.target.checked, cityLocs)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-800">{city.name}</span>
                  </label>
                  {city.wards && city.wards.length > 0 && (
                    <div className="ml-3 pl-2 border-l border-gray-200">
                      {city.wards.map((w) => {
                        const loc = section.makeLoc(w.fullName, w.fullNameKana);
                        const on = selectedIds.has(loc.id);
                        return (
                          <label key={`${section.prefCode}-${w.fullName}`} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleJapanLocationEntry({
                                location: loc.alpha,
                                locationJp: loc.ja,
                                jpId: loc.id,
                              })}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                            />
                            <span className="text-xs text-gray-700">{w.fullName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </>
    );
  }, [
    draftLocations,
    japanFilterData.tree,
    japanFilterLoading,
    japanFilterPrefecture,
    japanPrefectureCache,
    language,
  ]);

  if (!open) return null;

  const prefCodesForPanel = getJapanPrefectureCodesForPanel();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={handleClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-shrink-0 flex-col border-b border-gray-200 lg:w-[220px] lg:border-b-0 lg:border-r">
          <div className="flex h-11 items-center justify-between border-b border-gray-200 px-4">
            <h3 className="text-base font-semibold text-gray-900">
              {language === 'vi' ? 'Chọn quốc gia' : language === 'en' ? 'Select Country' : '国を選択'}
            </h3>
            <button type="button" onClick={handleClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-2">
              {WORK_LOCATION_COUNTRY_KEYS.map((country) => (
                <label key={country} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country)}
                    onChange={() => toggleCountry(country)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-900">{workLocationCountryLabel(country, language)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 items-center border-b border-gray-200 px-4">
            <h3 className="text-base font-semibold text-gray-900">{rightTitle}</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {selectedCountries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {language === 'vi' ? 'Vui lòng chọn quốc gia trước' : language === 'en' ? 'Please select a country first' : 'まず国を選択してください'}
              </div>
            ) : (
              <div className="space-y-6">
                {selectedCountries.includes('Vietnam') && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-800">{workLocationCountryLabel('Vietnam', language)}</h4>
                    <div className="max-h-[36vh] overflow-y-auto rounded-lg border border-gray-100 p-2 space-y-0.5">
                      {(() => {
                        const selectedVietnamLocations = getVietnamLocationSet();
                        const allSelected = WORK_LOCATION_VIETNAM_PROVINCES.every((p) => selectedVietnamLocations.has(p));
                        return (
                          <label className="mb-1 flex cursor-pointer items-center gap-2 border-b border-gray-100 p-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => {
                                setDraftLocations((prev) => {
                                  const withoutVN = prev.filter((l) => l.country !== 'Vietnam');
                                  if (e.target.checked) {
                                    return [...withoutVN, ...WORK_LOCATION_VIETNAM_PROVINCES.map((p) => ({ country: 'Vietnam', location: p }))];
                                  }
                                  return withoutVN;
                                });
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs font-medium text-gray-900">{language === 'vi' ? 'Tất cả' : language === 'en' ? 'All' : 'すべて'}</span>
                          </label>
                        );
                      })()}
                      {WORK_LOCATION_VIETNAM_PROVINCES.map((province) => (
                        <label key={province} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={draftLocations.some((l) => l.country === 'Vietnam' && l.location === province)}
                            onChange={() => toggleLocation(province, 'Vietnam')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-xs text-gray-900">{province}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCountries.includes('Japan') && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-gray-800">{workLocationCountryLabel('Japan', language)}</h4>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="flex min-h-[240px] flex-col overflow-hidden rounded-lg border lg:h-[42vh]">
                        <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-3 py-2 text-[10px] font-semibold text-gray-700">
                          {language === 'vi' ? 'Vùng' : language === 'en' ? 'Region' : '地域'}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          <label className="mb-1 flex cursor-pointer items-center gap-2 border-b border-gray-200 pb-1.5 p-1.5 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={japanSelectionDraft.allRegions}
                              disabled={!!japanBulkLoading}
                              onChange={(e) => selectAllJapanLocations(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs font-medium text-gray-900">{language === 'vi' ? 'Tất cả' : language === 'en' ? 'All' : 'すべて'}</span>
                          </label>
                          {JAPAN_REGIONS.map((reg) => (
                            <div key={reg.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isJapanRegionChecked(reg.id)}
                                disabled={japanBulkLoading === `reg-${reg.id}`}
                                onChange={(e) => selectAllRegion(reg.id, e.target.checked)}
                                className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600"
                              />
                              <button
                                type="button"
                                onClick={() => { setJapanFilterRegion(reg.id); setJapanFilterPrefecture(null); }}
                                className={`flex-1 cursor-pointer rounded px-1 py-1 text-left text-xs ${japanFilterRegion === reg.id ? 'bg-blue-50 font-medium text-blue-800' : 'text-gray-800'}`}
                              >
                                {language === 'ja' ? reg.ja : reg.en}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex min-h-[240px] flex-col overflow-hidden rounded-lg border lg:h-[42vh]">
                        <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-3 py-2 text-[10px] font-semibold text-gray-700">
                          {language === 'vi' ? 'Tỉnh / thành' : language === 'en' ? 'Prefecture' : '都道府県'}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          {prefCodesForPanel.length === 0 ? (
                            <div className="p-2 text-xs text-gray-400">{language === 'vi' ? 'Chọn vùng trước' : 'Select a region'}</div>
                          ) : (
                            <>
                              <label className="mb-1 flex cursor-pointer items-center gap-2 border-b border-gray-200 pb-1.5 p-1.5 hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={areAllPrefecturesChecked(prefCodesForPanel)}
                                  disabled={!!japanBulkLoading}
                                  onChange={(e) => selectAllPrefecturesInPanel(prefCodesForPanel, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-xs font-medium text-blue-800">{language === 'vi' ? 'Tất cả' : 'All'}</span>
                              </label>
                              {prefCodesForPanel.map((code) => {
                                const pref = JAPAN_PREFECTURES[code];
                                if (!pref) return null;
                                return (
                                  <div key={code} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={isJapanPrefectureChecked(code)}
                                      disabled={japanBulkLoading === `pref-${code}`}
                                      onChange={(e) => selectAllPrefecture(code, e.target.checked)}
                                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setJapanFilterPrefecture(code)}
                                      className={`flex-1 cursor-pointer rounded px-1 py-1 text-left text-xs ${japanFilterPrefecture === code ? 'bg-blue-50 font-medium text-blue-800' : 'text-gray-800'}`}
                                    >
                                      {language === 'ja' ? pref.ja : pref.en}
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex min-h-[240px] flex-col overflow-hidden rounded-lg border lg:h-[42vh]">
                        <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-3 py-2 text-[10px] font-semibold text-gray-700">
                          {language === 'vi' ? 'Phường / quận' : language === 'en' ? 'City / ward' : '市区町村'}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">{wardPanelContent}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              {language === 'vi' ? 'Xác nhận' : language === 'en' ? 'Confirm' : '確認'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
