/** @typedef {{ scale: number, x: number, y: number }} AvatarFrame */

export const DEFAULT_AVATAR_FRAME = /** @type {AvatarFrame} */ ({ scale: 1, x: 0, y: 0 });

export const AVATAR_FRAME_MIN_SCALE = 1;
export const AVATAR_FRAME_MAX_SCALE = 4;

export function normalizeAvatarFrame(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AVATAR_FRAME };
  const scale = Number(raw.scale);
  const x = Number(raw.x);
  const y = Number(raw.y);
  return {
    scale: clampAvatarScale(Number.isFinite(scale) ? scale : 1),
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

export function clampAvatarScale(scale) {
  return Math.min(AVATAR_FRAME_MAX_SCALE, Math.max(AVATAR_FRAME_MIN_SCALE, scale));
}

/** Kích thước ảnh (px) để phủ kín khung — tương đương object-fit: cover. */
export function getCoverBaseSize(naturalW, naturalH, frameW, frameH) {
  if (!naturalW || !naturalH || !frameW || !frameH) {
    return { w: frameW || 0, h: frameH || 0 };
  }
  const ratio = Math.max(frameW / naturalW, frameH / naturalH);
  return { w: naturalW * ratio, h: naturalH * ratio };
}
