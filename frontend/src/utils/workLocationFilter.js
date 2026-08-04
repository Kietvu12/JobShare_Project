import { JAPAN_REGIONS, JAPAN_PREFECTURES, kanaToRomaji } from './japanLocationData.js';

export const WORK_LOCATION_VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu',
  'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương',
  'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương',
  'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình',
  'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

export const WORK_LOCATION_COUNTRY_KEYS = ['Vietnam', 'Japan'];

export const ALL_JAPAN_REGIONS_KEY = '__ALL_JAPAN_REGIONS__';
export const ALL_JAPAN_PREFECTURES_KEY = '__ALL_JAPAN_PREFECTURES__';

export function workLocationCountryLabel(key, lang = 'vi') {
  if (key === 'Vietnam') return lang === 'en' ? 'Vietnam' : lang === 'ja' ? 'ベトナム' : 'Việt Nam';
  if (key === 'Japan') return lang === 'en' ? 'Japan' : lang === 'ja' ? '日本' : 'Nhật Bản';
  return key;
}

export function createEmptyWorkLocationDraft() {
  return [];
}

export function createEmptyJapanSelectionDraft() {
  return { allRegions: false, regions: [], prefectures: [] };
}

export function createJapanRegionEntry(region, language) {
  return {
    country: 'Japan',
    location: language === 'ja' ? region.ja : region.en,
    locationJp: region.ja,
    jpId: `region|${region.id}`,
    locationLevel: 'region',
    searchTerm: region.ja,
  };
}

export function createJapanPrefectureEntry(prefCode, language) {
  const pref = JAPAN_PREFECTURES[prefCode];
  if (!pref) return null;
  return {
    country: 'Japan',
    location: language === 'ja' ? pref.ja : pref.en,
    locationJp: pref.ja,
    jpId: `pref|${prefCode}`,
    locationLevel: 'prefecture',
    searchTerm: pref.ja,
  };
}

export function createJapanWardEntry(prefCode, nameJa, nameKana, language) {
  const pref = JAPAN_PREFECTURES[prefCode];
  const prefJa = pref?.ja || '';
  const prefEn = pref?.en || '';
  const toR = (kana, fb) => (kana ? kanaToRomaji(kana) : fb);
  const ja = `${prefJa} ${nameJa}`.trim();
  const alpha = `${prefEn} ${toR(nameKana, nameJa)}`.trim();
  return {
    country: 'Japan',
    location: language === 'ja' ? ja : alpha,
    locationJp: ja,
    jpId: `${prefCode}|${nameJa}`,
    locationLevel: 'ward',
    searchTerm: nameJa,
  };
}

export function deriveJapanSelectionDraftFromLocations(locations) {
  const regionIdsFromEntries = [];
  const prefCodesFromEntries = [];
  const selectedPrefectures = Array.from(
    new Set(
      (Array.isArray(locations) ? locations : [])
        .filter((loc) => loc?.country === 'Japan' && typeof loc?.jpId === 'string')
        .map((loc) => {
          const rawId = String(loc.jpId);
          if (rawId.startsWith('region|')) {
            regionIdsFromEntries.push(rawId.split('|')[1]);
            return null;
          }
          if (rawId.startsWith('pref|')) {
            const prefCode = rawId.split('|')[1];
            prefCodesFromEntries.push(prefCode);
            return prefCode;
          }
          return rawId.split('|')[0];
        })
        .filter(Boolean),
    ),
  );

  const selectedRegions = Array.from(new Set([
    ...regionIdsFromEntries,
    ...JAPAN_REGIONS.filter((region) =>
      region.prefectureCodes.some((prefCode) => selectedPrefectures.includes(prefCode)),
    ).map((region) => region.id),
  ]));

  return {
    allRegions: false,
    regions: selectedRegions,
    prefectures: Array.from(new Set([...prefCodesFromEntries, ...selectedPrefectures])),
  };
}

export function getWorkLocationsDisplayText(locations, language = 'vi') {
  if (!Array.isArray(locations) || locations.length === 0) return '';

  const byCountry = {};
  locations.forEach((loc) => {
    if (!byCountry[loc.country]) byCountry[loc.country] = [];
    const disp = loc.country === 'Japan' && language === 'ja' && loc.locationJp
      ? loc.locationJp
      : loc.location;
    byCountry[loc.country].push(disp);
  });

  return Object.entries(byCountry)
    .map(([country, items]) => {
      const countryLabel = workLocationCountryLabel(country, language);
      if (items.length <= 3) return `${countryLabel}: ${items.join(', ')}`;
      return `${countryLabel}: ${items.slice(0, 2).join(', ')} +${items.length - 2}`;
    })
    .join('; ');
}

const CURRENT_REGION_ALIASES = {
  Vietnam: ['việt nam', 'vietnam', 'ベトナム'],
  Japan: ['nhật bản', 'japan', '日本', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'fukuoka'],
};

function normalizeMatchText(value) {
  return String(value || '').trim().toLowerCase();
}

function haystackIncludes(haystack, needle) {
  const h = normalizeMatchText(haystack);
  const n = normalizeMatchText(needle);
  return n && h.includes(n);
}

/** Client-side filter: khớp khu vực hiện tại hoặc địa điểm làm việc mong muốn. */
export function candidateMatchesWorkLocationFilter(candidate, locations) {
  if (!Array.isArray(locations) || locations.length === 0) return true;

  const desired = candidate?.desiredWorkLocation || candidate?.desiredLocation || '';
  const currentRegion = candidate?.currentLocationRegion || '';

  return locations.some((loc) => {
    if (loc.country === 'Vietnam') {
      if (currentRegion === 'Việt Nam') return true;
      if (haystackIncludes(desired, loc.location)) return true;
      return CURRENT_REGION_ALIASES.Vietnam.some((term) => haystackIncludes(desired, term));
    }
    if (loc.country === 'Japan') {
      if (currentRegion === 'Nhật Bản' && (loc.locationLevel === 'region' || String(loc.jpId || '').startsWith('region|'))) {
        return true;
      }
      const terms = [loc.searchTerm, loc.locationJp, loc.location].filter(Boolean);
      return terms.some((term) => haystackIncludes(desired, term));
    }
    return false;
  });
}
