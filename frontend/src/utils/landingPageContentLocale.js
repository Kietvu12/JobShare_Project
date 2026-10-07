/** Locale nội dung landing (HTML builder) — vi dùng overrides gốc; en/ja dùng overridesByLocale */

export const LP_CONTENT_LOCALES = ['vi', 'en', 'ja'];

const MERGE_ARRAY_KEYS = ['items', 'slides', 'steps', 'rows', 'plans', 'buttons'];

function normalizeHeadingObj(h) {
  if (!h) return {};
  if (typeof h === 'string') return { main: h };
  return { ...h };
}

export function mergeOverrideLayers(base = {}, localeLayer = {}) {
  const out = { ...base, ...localeLayer };

  MERGE_ARRAY_KEYS.forEach((key) => {
    const b = Array.isArray(base[key]) ? base[key] : [];
    const l = Array.isArray(localeLayer[key]) ? localeLayer[key] : [];
    if (!b.length && !l.length) return;
    const max = Math.max(b.length, l.length);
    out[key] = Array.from({ length: max }, (_, i) => ({
      ...(b[i] && typeof b[i] === 'object' ? b[i] : {}),
      ...(l[i] && typeof l[i] === 'object' ? l[i] : {}),
    }));
  });

  if (base.heading || localeLayer.heading) {
    out.heading = {
      ...normalizeHeadingObj(base.heading),
      ...normalizeHeadingObj(localeLayer.heading),
    };
  }

  if (base.moreLink || localeLayer.moreLink) {
    out.moreLink = { ...(base.moreLink || {}), ...(localeLayer.moreLink || {}) };
  }

  if (base.slide || localeLayer.slide) {
    out.slide = { ...(base.slide || {}), ...(localeLayer.slide || {}) };
  }

  return out;
}

export function getMergedOverrides(section, contentLocale = 'vi') {
  const base = section?.overrides || {};
  if (!contentLocale || contentLocale === 'vi') return base;
  const loc = section?.overridesByLocale?.[contentLocale] || {};
  return mergeOverrideLayers(base, loc);
}

export function isSharedInlineField(payload = {}) {
  const { field, editType, imageUrl } = payload;
  if (editType === 'clear-image') {
    return String(field || '').includes('image') || field === 'logoImage';
  }
  if (imageUrl) return true;
  if (field === 'image' || field === 'heading.decorImage') return true;
  if (field?.includes('.image')) return true;
  return false;
}

/** Ghi patch overrides từ panel props theo locale (VI = overrides gốc) */
export function applySectionOverridePatch(section, patch, contentLocale = 'vi') {
  if (!section || !patch) return section;
  if (!contentLocale || contentLocale === 'vi') {
    return {
      ...section,
      overrides: { ...(section.overrides || {}), ...patch },
    };
  }
  const prev = section.overridesByLocale?.[contentLocale] || {};
  return {
    ...section,
    overridesByLocale: {
      ...(section.overridesByLocale || {}),
      [contentLocale]: { ...prev, ...patch },
    },
  };
}

/** Ghi patch inline vào đúng lớp overrides theo locale nội dung */
export function patchSectionFromInlineEditForLocale(section, payload, contentLocale = 'vi', patchFn) {
  if (!section || typeof patchFn !== 'function') return section;
  if (contentLocale === 'vi' || isSharedInlineField(payload)) {
    return patchFn(section, payload);
  }

  const localeOverrides = section.overridesByLocale?.[contentLocale] || {};
  const patchedLocaleSection = patchFn(
    { ...section, overrides: localeOverrides },
    payload,
  );
  const nextLocaleOverrides = patchedLocaleSection.overrides || {};

  return {
    ...section,
    overridesByLocale: {
      ...(section.overridesByLocale || {}),
      [contentLocale]: nextLocaleOverrides,
    },
  };
}
