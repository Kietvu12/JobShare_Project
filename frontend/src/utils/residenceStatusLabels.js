/** Tư cách lưu trú (jobs.residence_status / CV jp_residence_status) — mã → nhãn 3 ngôn ngữ. */
const RESIDENCE_STATUS_OPTIONS = [
  { value: 'engineer', vi: 'Visa kỹ sư / tri thức nhân văn / nghiệp vụ quốc tế', en: 'Engineer/Specialist in Humanities/International Services', ja: '技術・人文知識・国際業務' },
  { value: 'ssw', vi: 'Visa kỹ năng đặc định', en: 'Specified Skilled Worker', ja: '特定技能' },
  { value: 'student', vi: 'Visa du học', en: 'Student', ja: '留学' },
  { value: 'pr', vi: 'Vĩnh trú', en: 'Permanent resident', ja: '永住者' },
  { value: 'spouse', vi: 'Vợ/chồng người Nhật', en: 'Spouse of Japanese national', ja: '日本人の配偶者等' },
  { value: 'ltr', vi: 'Visa định trú', en: 'Long-term Resident', ja: '定住者' },
  { value: 'other', vi: 'Khác', en: 'Other', ja: 'その他' },
  { value: 'hsp', vi: 'Visa chuyên gia trình độ cao', en: 'Highly Skilled Professional', ja: '高度専門職' },
  { value: 'labor_skill', vi: 'Visa lao động kỹ năng', en: 'Technical Intern Training', ja: '技能実習' },
  { value: 'titp', vi: 'Thực tập sinh kỹ năng', en: 'Technical Intern Training', ja: '技能実習' },
  { value: 'dependent', vi: 'Visa phụ thuộc gia đình', en: 'Dependent', ja: '家族滞在' },
  { value: 'short', vi: 'Visa ngắn hạn', en: 'Short-term stay', ja: '短期滞在' },
  { value: 'ict', vi: 'Chuyển công tác nội bộ', en: 'Intra-company Transferee', ja: '企業内転勤' },
  { value: 'entertainer', vi: 'Biểu diễn / giải trí', en: 'Entertainer / Entertainment', ja: '興行' },
  { value: 'prspouse', vi: 'Vợ/chồng thường trú nhân', en: 'Spouse of Permanent Resident', ja: '永住者の配偶者等' },
  { value: 'no_requirement', vi: 'Không yêu cầu', en: 'No requirement', ja: '不要' },
];

/** Mã số cũ (1–15) → mã chữ. */
const LEGACY_CODES = {
  1: 'engineer', 2: 'ssw', 3: 'student', 4: 'pr', 5: 'spouse', 6: 'ltr', 7: 'other', 8: 'hsp',
  9: 'labor_skill', 10: 'dependent', 11: 'short', 12: 'ict', 13: 'entertainer', 14: 'titp', 15: 'prspouse',
};

function normalizeResidenceStatusValue(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return LEGACY_CODES[raw] || raw;
}

/** Chuỗi JSON (`["engineer"]`), chuỗi phân cách dấu phẩy, mảng hoặc giá trị đơn → danh sách mã. */
export function normalizeResidenceStatusValues(value) {
  if (!value) return [];
  const normalizeList = (items) => items.map(normalizeResidenceStatusValue).filter(Boolean);
  if (Array.isArray(value)) return normalizeList(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizeList(parsed);
      } catch {
        /* chuỗi không phải JSON — tách theo dấu phẩy */
      }
    }
    return normalizeList(trimmed.split(',').map((v) => v.replace(/["'[\]]/g, '').trim()));
  }
  return normalizeList([value]);
}

/** @param {'vi'|'en'|'ja'|'jp'} lang */
export function getResidenceStatusLabel(value, lang) {
  const code = normalizeResidenceStatusValue(value);
  const opt = RESIDENCE_STATUS_OPTIONS.find((item) => item.value === code);
  if (!opt) return String(value ?? '');
  if (lang === 'en') return opt.en;
  if (lang === 'ja' || lang === 'jp') return opt.ja;
  return opt.vi;
}
