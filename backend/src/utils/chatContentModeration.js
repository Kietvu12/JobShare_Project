/** Tin nhắn 3 bên: chặn CTV / DN / ứng viên gửi thông tin liên hệ trực tiếp (kiểu Shopee). */

export const CHAT_CONTACT_BLOCK_MESSAGE =
  'Không được gửi email, số điện thoại, số tài khoản hoặc thông tin liên hệ trực tiếp trong tin nhắn. Vui lòng trao đổi qua nền tảng JobShare.';

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EMAIL_OBFUSCATED_RE =
  /\b[a-z0-9._%+-]+\s*(?:\[at\]|@|\(at\)|\bat\b)\s*[a-z0-9.-]+\s*(?:\[dot\]|\.|\(dot\)|\bdot\b)\s*[a-z]{2,}\b/i;

const VN_PHONE_RE =
  /(?:\+?\s*84|0)\s*[.\-]?\s*(?:3|5|7|8|9)\s*[.\-]?\s*\d{3}\s*[.\-]?\s*\d{3}\s*[.\-]?\s*\d{3}/;
const JP_PHONE_RE =
  /(?:\+?\s*81|0)\s*[.\-]?\s*(?:\d{1,4}\s*[.\-]?\s*){2,3}\d{2,4}/;
const PHONE_KEYWORD_RE =
  /(?:điện\s*thoại|dien\s*thoai|sđt|sdt|phone|tel|mobile|hotline|zalo\s*số|zalo\s*so)\s*[:\s]?\s*[\d\s.\-+()]{8,}/i;

const BANK_KEYWORD_RE =
  /(?:stk|số\s*tk|so\s*tk|tài\s*khoản|tai\s*khoan|account\s*number|iban|swift|momo|vietcombank|techcombank|bidv|agribank|mb\s*bank|vpbank|acb|sacombank|tpbank)/i;
const BANK_DIGITS_RE = /\d{8,20}/;

const SOCIAL_CONTACT_RE =
  /(?:zalo|telegram|whatsapp|viber|line\s*id|facebook|fb\.me|m\.me|t\.me)\s*[:\s@]?\s*[@\w\d._-]{3,}/i;

function hasEmail(text) {
  return EMAIL_RE.test(text) || EMAIL_OBFUSCATED_RE.test(text);
}

function hasPhone(text) {
  return VN_PHONE_RE.test(text) || JP_PHONE_RE.test(text) || PHONE_KEYWORD_RE.test(text);
}

function hasBankAccount(text) {
  if (!BANK_DIGITS_RE.test(text)) return false;
  if (BANK_KEYWORD_RE.test(text)) return true;
  const digits = text.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 20 && !VN_PHONE_RE.test(text);
}

function hasSocialContact(text) {
  return SOCIAL_CONTACT_RE.test(text);
}

export function detectBlockedContactInfo(content) {
  const text = String(content || '').trim();
  if (!text || text === '[Attachment]') return null;

  if (hasEmail(text)) return 'email';
  if (hasPhone(text)) return 'phone';
  if (hasBankAccount(text)) return 'bank';
  if (hasSocialContact(text)) return 'social';
  return null;
}

export function assertNominationChatContentAllowed(content, { skipModeration = false } = {}) {
  if (skipModeration) return;
  const blockedType = detectBlockedContactInfo(content);
  if (!blockedType) return;

  const error = new Error(CHAT_CONTACT_BLOCK_MESSAGE);
  error.statusCode = 400;
  error.code = 'CHAT_CONTACT_INFO_BLOCKED';
  error.blockedType = blockedType;
  throw error;
}
