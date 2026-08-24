import {
  JAPAN_REGIONS,
  JAPAN_PREFECTURES,
  kanaToRomaji,
} from './japanLocationData';

export const getJapanWorkingLocationJpId = (wl) =>
  wl?.jpId || (wl?.location && wl?.country ? `${wl.location}_${wl.country}` : '');

export function parseJapanWorkingLocationJpId(jpId) {
  if (!jpId || typeof jpId !== 'string') return null;
  if (jpId.startsWith('region|')) return { level: 'region', regionId: jpId.slice(7) };
  if (jpId.startsWith('pref|')) return { level: 'prefecture', prefCode: jpId.slice(5) };
  if (jpId.startsWith('city|')) {
    const parts = jpId.split('|');
    return { level: 'city', prefCode: parts[1], cityName: parts.slice(2).join('|') };
  }
  const idx = jpId.indexOf('|');
  if (idx > 0) return { level: 'ward', prefCode: jpId.slice(0, idx), nameJa: jpId.slice(idx + 1) };
  return null;
}

export const createAddJobJapanRegionEntry = (region, languageTab) => ({
  location: languageTab === 'jp' ? region.ja : region.en,
  locationJp: region.ja,
  country: 'Japan',
  jpId: `region|${region.id}`,
  locationLevel: 'region',
  searchTerm: region.ja,
});

export const createAddJobJapanPrefectureEntry = (prefCode, languageTab) => {
  const pref = JAPAN_PREFECTURES[prefCode];
  if (!pref) return null;
  return {
    location: languageTab === 'jp' ? pref.ja : pref.en,
    locationJp: pref.ja,
    country: 'Japan',
    jpId: `pref|${prefCode}`,
    locationLevel: 'prefecture',
    searchTerm: pref.ja,
  };
};

export const createAddJobJapanCityEntry = (prefCode, city, languageTab) => {
  const pref = JAPAN_PREFECTURES[prefCode];
  const ja = city?.name || '';
  if (!ja) return null;
  const alpha =
    languageTab === 'jp' ? ja : (city?.nameKana ? kanaToRomaji(city.nameKana) : ja);
  return {
    location: alpha,
    locationJp: ja,
    country: 'Japan',
    jpId: `city|${prefCode}|${ja}`,
    locationLevel: 'city',
    searchTerm: ja,
    parentPrefectureJp: pref?.ja || '',
    parentPrefectureEn: pref?.en || '',
  };
};

export const createAddJobJapanWardEntry = (prefCode, nameJa, nameKana, languageTab) => {
  const pref = JAPAN_PREFECTURES[prefCode];
  const prefJa = pref?.ja || '';
  const prefEn = pref?.en || '';
  const toRomaji = (kana, fallback) => (kana ? kanaToRomaji(kana) : fallback);
  const ja = String(nameJa || '').trim();
  const alpha = (languageTab === 'jp' ? ja : toRomaji(nameKana, nameJa)).trim();
  return {
    location: alpha,
    locationJp: ja,
    country: 'Japan',
    jpId: `${prefCode}|${ja}`,
    locationLevel: 'ward',
    searchTerm: ja,
    parentPrefectureJp: prefJa,
    parentPrefectureEn: prefEn,
  };
};

export function collectCityLeafJpIds(prefCode, city) {
  const ids = new Set();
  if (!city) return ids;
  if (city.standalone) ids.add(`${prefCode}|${city.name}`);
  else for (const ward of city.wards || []) ids.add(`${prefCode}|${ward.fullName}`);
  return ids;
}

export function collectPrefectureLeafJpIds(prefCode, tree) {
  const ids = new Set();
  for (const city of tree || []) {
    collectCityLeafJpIds(prefCode, city).forEach((id) => ids.add(id));
  }
  return ids;
}

function isSetFullySelected(required, selected) {
  if (!required?.size) return false;
  for (const id of required) {
    if (!selected.has(id)) return false;
  }
  return true;
}

export function isPrefectureFullySelected(prefCode, selectedIds, prefectureTrees) {
  const prefJpId = `pref|${prefCode}`;
  if (selectedIds.has(prefJpId)) return true;
  const tree = prefectureTrees?.[prefCode];
  if (!tree?.length) return false;
  const leaves = collectPrefectureLeafJpIds(prefCode, tree);
  return isSetFullySelected(leaves, selectedIds);
}

export function isRegionFullySelected(region, selectedIds, prefectureTrees) {
  const regionJpId = `region|${region.id}`;
  if (selectedIds.has(regionJpId)) return true;
  if (!region.prefectureCodes.length) return false;
  return region.prefectureCodes.every((prefCode) =>
    isPrefectureFullySelected(prefCode, selectedIds, prefectureTrees)
  );
}

function collectRegionMemberJpIds(region, selectedIds, prefectureTrees) {
  const members = new Set();
  const regionJpId = `region|${region.id}`;
  if (selectedIds.has(regionJpId)) members.add(regionJpId);
  region.prefectureCodes.forEach((prefCode) => {
    const prefJpId = `pref|${prefCode}`;
    if (selectedIds.has(prefJpId)) {
      members.add(prefJpId);
      return;
    }
    const tree = prefectureTrees?.[prefCode];
    if (tree?.length) {
      collectPrefectureLeafJpIds(prefCode, tree).forEach((id) => {
        if (selectedIds.has(id)) members.add(id);
      });
    }
  });
  return members;
}

function collectPrefectureMemberJpIds(prefCode, selectedIds, prefectureTrees) {
  const members = new Set();
  const prefJpId = `pref|${prefCode}`;
  if (selectedIds.has(prefJpId)) {
    members.add(prefJpId);
    return members;
  }
  const tree = prefectureTrees?.[prefCode];
  if (tree?.length) {
    collectPrefectureLeafJpIds(prefCode, tree).forEach((id) => {
      if (selectedIds.has(id)) members.add(id);
    });
  }
  return members;
}

/**
 * Gom địa điểm Nhật Bản: nếu chọn hết con của vùng/tỉnh/thành phố thì chỉ hiển thị tên vùng cha.
 * @returns {Array} mỗi phần tử có `_collapseMemberJpIds` để xóa đúng nhóm khi cần.
 */
export function collapseJapanWorkingLocationsForDisplay(
  workingLocations,
  languageTab,
  prefectureTrees = {}
) {
  const locs = Array.isArray(workingLocations) ? workingLocations : [];
  const nonJapan = [];
  const japanById = new Map();
  const japanWithoutId = [];

  locs.forEach((wl) => {
    if (wl?.country !== 'Japan') {
      nonJapan.push(wl);
      return;
    }
    if (wl.jpId) japanById.set(wl.jpId, wl);
    else japanWithoutId.push(wl);
  });

  const selectedIds = new Set(japanById.keys());
  if (!selectedIds.size) return [...nonJapan, ...japanWithoutId];

  const consumed = new Set();
  const collapsedJapan = [];

  const pushEntry = (entry, memberJpIds) => {
    if (!entry?.jpId) return;
    const members = (memberJpIds || [entry.jpId]).filter(Boolean);
    if (members.every((id) => consumed.has(id))) return;
    collapsedJapan.push({
      ...entry,
      _collapseMemberJpIds: members,
    });
    members.forEach((id) => consumed.add(id));
  };

  JAPAN_REGIONS.forEach((region) => {
    if (!isRegionFullySelected(region, selectedIds, prefectureTrees)) return;
    const members = [...collectRegionMemberJpIds(region, selectedIds, prefectureTrees)];
    if (!members.length && selectedIds.has(`region|${region.id}`)) {
      members.push(`region|${region.id}`);
    }
    pushEntry(createAddJobJapanRegionEntry(region, languageTab), members);
  });

  const prefsInCollapsedRegions = new Set();
  collapsedJapan.forEach((entry) => {
    const parsed = parseJapanWorkingLocationJpId(entry.jpId);
    if (parsed?.level !== 'region') return;
    const region = JAPAN_REGIONS.find((r) => r.id === parsed.regionId);
    region?.prefectureCodes.forEach((code) => prefsInCollapsedRegions.add(code));
  });

  const prefCodesToProcess = new Set();
  selectedIds.forEach((jpId) => {
    const parsed = parseJapanWorkingLocationJpId(jpId);
    if (parsed?.level === 'prefecture') prefCodesToProcess.add(parsed.prefCode);
    if (parsed?.level === 'ward') prefCodesToProcess.add(parsed.prefCode);
    if (parsed?.level === 'city') prefCodesToProcess.add(parsed.prefCode);
  });

  [...prefCodesToProcess].sort().forEach((prefCode) => {
    if (prefsInCollapsedRegions.has(prefCode)) return;

    const tree = prefectureTrees?.[prefCode] || [];
    const prefEntry = createAddJobJapanPrefectureEntry(prefCode, languageTab);
    if (!prefEntry) return;

    if (isPrefectureFullySelected(prefCode, selectedIds, prefectureTrees)) {
      const members = [...collectPrefectureMemberJpIds(prefCode, selectedIds, prefectureTrees)];
      pushEntry(prefEntry, members);
      return;
    }

    if (!tree.length) {
      selectedIds.forEach((jpId) => {
        const parsed = parseJapanWorkingLocationJpId(jpId);
        if (parsed?.level === 'ward' && parsed.prefCode === prefCode && !consumed.has(jpId)) {
          pushEntry(japanById.get(jpId), [jpId]);
        }
        if (parsed?.level === 'prefecture' && parsed.prefCode === prefCode && !consumed.has(jpId)) {
          pushEntry(japanById.get(jpId), [jpId]);
        }
      });
      return;
    }

    tree.forEach((city) => {
      const cityLeaves = collectCityLeafJpIds(prefCode, city);
      const citySelected = [...cityLeaves].filter((id) => selectedIds.has(id));
      if (!citySelected.length) return;

      if (isSetFullySelected(cityLeaves, selectedIds)) {
        const cityEntry = createAddJobJapanCityEntry(prefCode, city, languageTab);
        if (cityEntry) pushEntry(cityEntry, [...cityLeaves]);
      } else {
        citySelected.forEach((jpId) => {
          if (!consumed.has(jpId)) pushEntry(japanById.get(jpId), [jpId]);
        });
      }
    });
  });

  japanById.forEach((wl, jpId) => {
    if (consumed.has(jpId)) return;
    pushEntry(wl, [jpId]);
  });

  return [...nonJapan, ...collapsedJapan, ...japanWithoutId];
}

/** Chuẩn hóa state: thay nhiều phường/xã bằng mục cha khi đã chọn đủ. */
export function normalizeJapanWorkingLocations(workingLocations, languageTab, prefectureTrees = {}) {
  const collapsed = collapseJapanWorkingLocationsForDisplay(
    workingLocations,
    languageTab,
    prefectureTrees
  );
  const normalized = collapsed.map(({ _collapseMemberJpIds, ...entry }) => entry);

  const stripMeta = (list) =>
    (list || []).map(({ _collapseMemberJpIds, ...entry }) => entry);

  const before = JSON.stringify(stripMeta(workingLocations));
  const after = JSON.stringify(normalized);
  return before === after ? workingLocations : normalized;
}

export function removeJapanWorkingLocationsByMemberJpIds(workingLocations, memberJpIds) {
  const removeIds = new Set(memberJpIds || []);
  if (!removeIds.size) return workingLocations;
  return (workingLocations || []).filter((wl) => {
    if (wl?.country !== 'Japan') return true;
    const jpId = getJapanWorkingLocationJpId(wl);
    return !removeIds.has(jpId);
  });
}

/** Prefecture codes cần tải cây địa điểm để gom hiển thị. */
export function collectJapanPrefectureCodesForCollapse(workingLocations) {
  const codes = new Set();
  (workingLocations || []).forEach((wl) => {
    if (wl?.country !== 'Japan') return;
    const parsed = parseJapanWorkingLocationJpId(wl.jpId);
    if (parsed?.level === 'ward' || parsed?.level === 'city') codes.add(parsed.prefCode);
    if (parsed?.level === 'prefecture') codes.add(parsed.prefCode);
  });
  return [...codes];
}
