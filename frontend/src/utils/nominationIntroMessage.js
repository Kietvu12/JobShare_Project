export const NOMINATION_INTRO_MARKER_RE = /^\[\[nomination-intro:(vi|en|ja)\]\]/;

const LEGACY_VI_PREFIX = 'Cảm ơn bạn đã tiến cử';

export function parseNominationIntroMessage(content) {
  const raw = String(content ?? '');
  const markerMatch = raw.match(/^\[\[nomination-intro:(vi|en|ja)\]\]([\s\S]*)$/);
  if (markerMatch) {
    return {
      isIntro: true,
      locale: markerMatch[1],
      displayText: markerMatch[2].trim(),
    };
  }
  if (raw.trim().startsWith(LEGACY_VI_PREFIX)) {
    return {
      isIntro: true,
      locale: 'vi',
      displayText: raw.trim(),
    };
  }
  return { isIntro: false, locale: null, displayText: raw };
}

export function resolveNominationIntroLocale(language) {
  return ['vi', 'en', 'ja'].includes(language) ? language : 'vi';
}

/** Chỉ hiển thị 1 tin intro theo ngôn ngữ UI; tin intro ngôn ngữ khác vẫn lưu DB. */
export function filterNominationIntroMessagesForLocale(messages, language) {
  const locale = resolveNominationIntroLocale(language);
  return (messages || []).filter((message) => {
    const parsed = parseNominationIntroMessage(message?.content);
    if (!parsed.isIntro) return true;
    return parsed.locale === locale;
  });
}

export function getNominationIntroDisplayContent(content) {
  return parseNominationIntroMessage(content).displayText;
}

export function isNominationIntroMessage(content) {
  return parseNominationIntroMessage(content).isIntro;
}
