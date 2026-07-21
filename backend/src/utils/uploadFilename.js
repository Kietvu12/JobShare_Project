import path from 'path';

/** Dấu hiệu UTF-8 bị đọc nhầm thành Latin-1 (Multer/busboy). */
const MOJIBAKE_PATTERN = /(?:Ã[\x80-\xBF]|Â[\x80-\xBF]){2,}/;

export const ORIGINAL_FILENAME_META_KEY = 'original-name-b64';

/**
 * Khôi phục tên file UTF-8 từ multer (mặc định coi bytes filename là latin1).
 */
export function normalizeUploadOriginalName(originalname) {
  if (originalname == null) return '';
  let raw = String(originalname).trim();
  if (!raw) return '';

  if (/%[0-9a-fA-F]{2}/.test(raw)) {
    try {
      const decoded = decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
      if (decoded) raw = decoded;
    } catch {
      // keep raw
    }
  }

  const decodeLatin1AsUtf8 = (value) => {
    try {
      return Buffer.from(value, 'latin1').toString('utf8').trim();
    } catch {
      return value;
    }
  };

  if (/[^\u0000-\u007f]/.test(raw) || MOJIBAKE_PATTERN.test(raw)) {
    const decoded = decodeLatin1AsUtf8(raw);
    if (decoded && !decoded.includes('\uFFFD')) {
      const decodedBetter = !MOJIBAKE_PATTERN.test(decoded)
        || (MOJIBAKE_PATTERN.test(raw) && decoded.length < raw.length);
      if (decodedBetter) raw = decoded;
    }
  }

  return raw.normalize('NFC');
}

export function sanitizeUploadBasename(originalname) {
  const rawBase = path.basename(normalizeUploadOriginalName(originalname));
  return rawBase
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_STORAGE_BASENAME_LEN = 200;

function truncateBasenamePreservingExt(name, maxLen) {
  const value = String(name || '').trim();
  if (value.length <= maxLen) return value;
  const ext = path.extname(value);
  const stem = ext ? value.slice(0, -ext.length) : value;
  const maxStem = Math.max(1, maxLen - ext.length);
  return `${stem.slice(0, maxStem)}${ext}`;
}

/**
 * Tên lưu trên S3 / đĩa và tên hiển thị/tải xuống — giữ tên gốc (UTF-8, đã sanitize).
 * Trùng tên trong cùng snapshot: thêm hậu tố ` (2)`, ` (3)`, …
 */
export function toSafeStorageFilename(originalname, index = 0, usedNames = new Set()) {
  let baseName = sanitizeUploadBasename(originalname) || `cv-original-${index + 1}.pdf`;
  baseName = truncateBasenamePreservingExt(baseName, MAX_STORAGE_BASENAME_LEN);

  let storageName = baseName;
  let suffix = 2;
  while (usedNames.has(storageName.toLowerCase())) {
    const ext = path.extname(baseName);
    const stem = ext ? baseName.slice(0, -ext.length) : baseName;
    storageName = `${stem} (${suffix})${ext}`;
    suffix += 1;
  }
  usedNames.add(storageName.toLowerCase());
  return { storageName, displayName: storageName };
}

export function encodeOriginalFilenameMetadata(displayName) {
  const name = String(displayName || '').trim();
  if (!name) return undefined;
  return Buffer.from(name, 'utf8').toString('base64');
}

export function decodeOriginalFilenameMetadata(value) {
  if (!value) return '';
  try {
    return Buffer.from(String(value), 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
}

/** Tên hiển thị khi list file — ưu tiên metadata, fallback sửa mojibake legacy. */
export function displayStoredUploadFilename(storedBasename, metadataOriginalName = '') {
  const fromMeta = String(metadataOriginalName || '').trim();
  if (fromMeta) return fromMeta;

  const base = path.basename(String(storedBasename || ''));
  const fixed = normalizeUploadOriginalName(base);

  if (MOJIBAKE_PATTERN.test(fixed) && fixed.length > 64) {
    const ext = path.extname(base) || '.pdf';
    if (/^cv-original-\d+/i.test(base)) return base;
    return `cv-original${ext}`;
  }

  return fixed || base;
}
