/** @typedef {{ widthRem: number, heightRem: number }} AvatarFrame */

export const AVATAR_FRAME_MIN_REM = 2;
export const AVATAR_FRAME_MAX_REM = 12;

/** @param {string|number|null|undefined} value */
export function parseRemValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value || '').trim().match(/^([\d.]+)\s*rem$/i);
  return match ? parseFloat(match[1]) : null;
}

export function clampFrameRem(value, min = AVATAR_FRAME_MIN_REM, max = AVATAR_FRAME_MAX_REM) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {Partial<AvatarFrame>|null|undefined} raw
 * @param {{ widthRem: number, heightRem: number }} defaults
 */
export function normalizeAvatarFrame(raw, defaults) {
  const baseW = defaults?.widthRem ?? 4.125;
  const baseH = defaults?.heightRem ?? 5.5;
  const widthRem = Number(raw?.widthRem);
  const heightRem = Number(raw?.heightRem);
  return {
    widthRem: clampFrameRem(Number.isFinite(widthRem) ? widthRem : baseW),
    heightRem: clampFrameRem(Number.isFinite(heightRem) ? heightRem : baseH),
  };
}

/** @param {{ widthRem: number, heightRem: number }} frame */
export function buildAvatarFrameStyle(frame) {
  return {
    width: `${frame.widthRem}rem`,
    height: `${frame.heightRem}rem`,
  };
}
