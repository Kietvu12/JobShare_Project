/** Scout page onboarding & shared labels */

import { getJlptDisplay } from '../../utils/cvFixedCertDisplay.js';

const scoutCardsVi = [
  {
    num: '01',
    title: 'Scout Trực Tiếp',
    subtitle: 'Tự chủ tìm kiếm & tiếp cận ứng viên',
    variant: 'brandLight',
    mode: 'credit',
    painPoint: 'Khó tìm đủ ứng viên phù hợp trong thời gian ngắn',
    solution: 'Tự tìm kiếm và tiếp cận ứng viên từ kho hồ sơ chất lượng',
    features: [
      'Tìm kiếm AI theo kỹ năng & vị trí',
      'Xem hồ sơ ẩn danh trước khi unlock',
      'Chủ động chat & tiếp cận ứng viên',
    ],
    suitableFor: 'Doanh nghiệp chủ động tìm ứng viên',
    footerNote: 'Chỉ từ 1,000 credit · 1 credit = 1 lượt mở hồ sơ',
  },
  {
    num: '02',
    title: 'Scout Ủy Thác',
    subtitle: 'WS hỗ trợ tìm kiếm & tiếp cận ứng viên',
    variant: 'neutral',
    mode: 'performance',
    painPoint: 'Bận rộn, thiếu thời gian sàng lọc và tiếp cận ứng viên',
    solution: 'Workstation tìm kiếm, đánh giá và tiếp cận ứng viên thay bạn',
    features: [
      'WS chủ động tìm & gửi ứng viên theo JD',
      'WS trao đổi điều kiện & sắp xếp phỏng vấn',
      'Gợi ý thay thế khi cần',
    ],
    suitableFor: 'Doanh nghiệp bận rộn, thiếu thời gian tuyển dụng',
    slaLine: 'WS phản hồi ứng viên đầu tiên trong 48h',
    footerNote: 'Không tốn credit mở hồ sơ · Phí 20% khi giới thiệu việc làm thành công',
  },
];

const scoutCardsEn = [
  {
    num: '01',
    title: 'Direct Scout',
    subtitle: 'Self-service search & outreach',
    variant: 'brandLight',
    mode: 'credit',
    painPoint: 'Hard to find enough qualified candidates quickly',
    solution: 'Search and reach candidates from a quality talent pool',
    features: [
      'AI search by skills & role',
      'Preview anonymous profiles before unlock',
      'Proactively chat & engage candidates',
    ],
    suitableFor: 'Companies that actively source candidates',
    footerNote: 'From 1,000 credits · 1 credit = 1 profile unlock',
  },
  {
    num: '02',
    title: 'Managed Scout',
    subtitle: 'WS handles search & outreach',
    variant: 'neutral',
    mode: 'performance',
    painPoint: 'Too busy to screen and reach out to candidates',
    solution: 'Work Station finds, evaluates, and engages candidates for you',
    features: [
      'WS proactively finds & sends candidates per JD',
      'WS negotiates terms & schedules interviews',
      'Replacement suggestions when needed',
    ],
    suitableFor: 'Busy teams with limited hiring bandwidth',
    slaLine: 'WS responds to first candidate within 48h',
    footerNote: 'No unlock credits · 20% fee on successful placement',
  },
];

const scoutCardsJa = [
  {
    num: '01',
    title: 'ダイレクトスカウト',
    subtitle: '自社で候補者を探索・接触',
    variant: 'brandLight',
    mode: 'credit',
    painPoint: '短期間で十分な候補者を見つけにくい',
    solution: '質の高い候補者DBから自社で検索・接触',
    features: [
      'スキル・職種に基づくAI検索',
      'アンロック前に匿名プロフィールを確認',
      '能動的にチャット・スカウト',
    ],
    suitableFor: '自社で候補者探索する企業',
    footerNote: '1,000クレジットから · 1クレジット = 1プロフィール開示',
  },
  {
    num: '02',
    title: '委託スカウト',
    subtitle: 'WSが探索・接触を代行',
    variant: 'neutral',
    mode: 'performance',
    painPoint: '選考・接触の時間が足りない',
    solution: 'Work Stationが候補者の探索・評価・接触を代行',
    features: [
      'WSがJDに合う候補者を能動的に提案',
      'WSが条件調整・面接設定',
      '必要時に代替候補を提案',
    ],
    suitableFor: '採用リソースが限られる企業',
    slaLine: 'WSが最初の候補者に48時間以内に対応',
    footerNote: '開示クレジット不要 · 成功時20%手数料',
  },
];

export const scoutI18n = {
  vi: {
    suitableFor: 'Phù hợp:',
    startWith: (title) => `Bắt đầu với ${title}`,
    notifications: 'Thông báo',
    newsInsights: 'Tin tức & Insights',
    sampleNotifications: [
      { dot: 'bg-[#0077B6]', text: 'Có 3 ứng viên mới phù hợp với Mechanical Engineer', time: '10 phút trước' },
      { dot: 'bg-[#0077B6]', text: 'WS đã gửi 5 ứng viên gợi ý cho IT Developer', time: '1 giờ trước' },
      { dot: 'bg-slate-400', text: 'Ứng viên T.N.H đã trả lời tin nhắn', time: '2 giờ trước' },
      { dot: 'bg-rose-500', text: 'Credit Scout sắp hết — nạp thêm để tiếp tục unlock', time: '3 giờ trước', warn: true },
    ],
    sampleNews: [
      { title: 'Báo cáo thị trường lao động IT Nhật Bản Q2/2024', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
      { title: '5 cách tiếp cận ứng viên kỹ thuật hiệu quả qua Scout', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
    ],
    chips: {
      experience: 'Kinh nghiệm',
      location: 'Khu vực',
      salary: 'Lương',
    },
    listCard: {
      position: 'Vị trí mong muốn',
      match: 'Điểm phù hợp AI',
      skills: 'Kỹ năng',
      searchHit: 'Khớp tìm kiếm',
    },
    newBadge: 'Mới',
    solutionCards: scoutCardsVi,
    filters: {
      japaneseLevel: 'Trình độ tiếng Nhật',
      japaneseLevelPlaceholder: 'Chọn trình độ tiếng Nhật',
      experience: 'Số năm kinh nghiệm',
      experienceAll: 'Tất cả kinh nghiệm',
      visa: 'Tình trạng visa',
      visaAll: 'Tất cả tư cách lưu trú',
      location: 'Địa điểm hiện tại',
      locationPlaceholder: 'Chọn khu vực (Việt Nam / Nhật Bản...)',
      locationModalTitle: 'Chọn khu vực',
      jobCategory: 'Ngành nghề',
      jobCategoryPlaceholder: 'Chọn ngành nghề',
      salary: 'Mức lương mong muốn (VNĐ)',
      salaryFrom: 'Từ',
      salaryTo: 'Đến',
      keyword: 'Từ khóa',
      keywordPlaceholder: 'Nhập từ khóa: React Developer, Sales...',
    },
    experienceSeniority: (level, years) => `${level} · ${years} năm`,
    anonymousCandidate: 'Ứng viên ẩn danh',
    hoverTip: {
      skills: 'Kỹ năng',
      education: 'Học vấn',
      workExperience: 'Kinh nghiệm làm việc',
      workExperienceAnonymous: ' (ẩn danh)',
      clickHint: 'Bấm để xem chi tiết trong tab mới',
    },
    matchBadge: {
      title: 'Điểm phù hợp AI',
      label: (n) => `${n}% match`,
    },
    conversationLevel: {
      native: 'Native',
      business: 'Business',
      conversational: 'Hội thoại',
    },
  },
  en: {
    suitableFor: 'Best for:',
    startWith: (title) => `Start with ${title}`,
    notifications: 'Notifications',
    newsInsights: 'News & Insights',
    sampleNotifications: [
      { dot: 'bg-[#0077B6]', text: '3 new candidates match Mechanical Engineer', time: '10 min ago' },
      { dot: 'bg-[#0077B6]', text: 'WS sent 5 suggested candidates for IT Developer', time: '1 hr ago' },
      { dot: 'bg-slate-400', text: 'Candidate T.N.H replied to your message', time: '2 hr ago' },
      { dot: 'bg-rose-500', text: 'Scout credits running low — top up to keep unlocking', time: '3 hr ago', warn: true },
    ],
    sampleNews: [
      { title: 'Japan IT Labor Market Report Q2/2024', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
      { title: '5 effective ways to reach technical candidates via Scout', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
    ],
    chips: {
      experience: 'Experience',
      location: 'Location',
      salary: 'Salary',
    },
    listCard: {
      position: 'Desired role',
      match: 'AI match score',
      skills: 'Skills',
      searchHit: 'Search match',
    },
    newBadge: 'New',
    solutionCards: scoutCardsEn,
    filters: {
      japaneseLevel: 'Japanese level',
      japaneseLevelPlaceholder: 'Select Japanese level',
      experience: 'Years of experience',
      experienceAll: 'All experience',
      visa: 'Visa status',
      visaAll: 'All residence statuses',
      location: 'Current location',
      locationPlaceholder: 'Select region (Vietnam / Japan...)',
      locationModalTitle: 'Select region',
      jobCategory: 'Job category',
      jobCategoryPlaceholder: 'Select job category',
      salary: 'Expected salary (VND)',
      salaryFrom: 'From',
      salaryTo: 'To',
      keyword: 'Keyword',
      keywordPlaceholder: 'Enter keyword: React Developer, Sales...',
    },
    experienceSeniority: (level, years) => `${level} · ${years} yr${years === 1 ? '' : 's'}`,
    anonymousCandidate: 'Anonymous candidate',
    hoverTip: {
      skills: 'Skills',
      education: 'Education',
      workExperience: 'Work experience',
      workExperienceAnonymous: ' (anonymous)',
      clickHint: 'Click to open details in a new tab',
    },
    matchBadge: {
      title: 'AI match score',
      label: (n) => `${n}% match`,
    },
    conversationLevel: {
      native: 'Native',
      business: 'Business',
      conversational: 'Conversational',
    },
  },
  ja: {
    suitableFor: 'こんな企業向け:',
    startWith: (title) => `${title}を始める`,
    notifications: '通知',
    newsInsights: 'ニュース & Insights',
    sampleNotifications: [
      { dot: 'bg-[#0077B6]', text: 'Mechanical Engineerに合う新規候補者3名', time: '10分前' },
      { dot: 'bg-[#0077B6]', text: 'WSがIT Developer向けに候補者5名を提案', time: '1時間前' },
      { dot: 'bg-slate-400', text: '候補者T.N.Hがメッセージに返信', time: '2時間前' },
      { dot: 'bg-rose-500', text: 'スカウトクレジット残量わずか — チャージして続行', time: '3時間前', warn: true },
    ],
    sampleNews: [
      { title: '日本IT労働市場レポート 2024年Q2', date: '20/05/2024', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop' },
      { title: 'Scoutで技術候補者に効果的にアプローチする5つの方法', date: '18/05/2024', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=150&fit=crop' },
    ],
    chips: {
      experience: '経験',
      location: '地域',
      salary: '給与',
    },
    listCard: {
      position: '希望ポジション',
      match: 'AIマッチスコア',
      skills: 'スキル',
      searchHit: '検索一致',
    },
    newBadge: '新着',
    solutionCards: scoutCardsJa,
    filters: {
      japaneseLevel: '日本語レベル',
      japaneseLevelPlaceholder: '日本語レベルを選択',
      experience: '経験年数',
      experienceAll: 'すべての経験',
      visa: 'ビザ状況',
      visaAll: 'すべての在留資格',
      location: '現在地',
      locationPlaceholder: '地域を選択（ベトナム / 日本...）',
      locationModalTitle: '地域を選択',
      jobCategory: '職種',
      jobCategoryPlaceholder: '職種を選択',
      salary: '希望年収（VND）',
      salaryFrom: '下限',
      salaryTo: '上限',
      keyword: 'キーワード',
      keywordPlaceholder: 'キーワード入力: React Developer, Sales...',
    },
    experienceSeniority: (level, years) => `${level} · ${years}年`,
    anonymousCandidate: '匿名候補者',
    hoverTip: {
      skills: 'スキル',
      education: '学歴',
      workExperience: '職歴',
      workExperienceAnonymous: '（匿名）',
      clickHint: 'クリックで新しいタブに詳細を表示',
    },
    matchBadge: {
      title: 'AIマッチスコア',
      label: (n) => `Match ${n}%`,
    },
    conversationLevel: {
      native: 'ネイティブ',
      business: 'ビジネス',
      conversational: '会話',
    },
  },
};

export function getScoutSolutionCards(language) {
  return scoutI18n[language]?.solutionCards || scoutI18n.vi.solutionCards;
}

export function getScoutSolutionCard(language, mode) {
  return getScoutSolutionCards(language).find((card) => card.mode === mode) || null;
}

export function getScoutSampleNotifications(language) {
  return scoutI18n[language]?.sampleNotifications || scoutI18n.vi.sampleNotifications;
}

export function getScoutSampleNews(language) {
  return scoutI18n[language]?.sampleNews || scoutI18n.vi.sampleNews;
}

const SCOUT_VISA_LABELS = {
  vi: {
    '1': 'Visa kỹ sư / tri thức nhân văn / nghiệp vụ quốc tế',
    '2': 'Visa kỹ năng đặc định',
    '3': 'Visa du học',
    '4': 'Visa vĩnh trú',
    '5': 'Visa vợ/chồng người Nhật',
    '6': 'Visa cư trú dài hạn',
    '7': 'Không yêu cầu',
    '8': 'Visa lao động trình độ cao',
    '9': 'Visa kỹ năng (lao động tay nghề)',
    '10': 'Visa gia đình (phụ thuộc)',
    '11': 'Visa ngắn hạn',
    '12': 'Visa chuyển công tác nội bộ',
    '13': 'Visa biểu diễn / giải trí',
    '14': 'Visa thực tập sinh kỹ năng',
    '15': 'Visa vợ/chồng của người vĩnh trú',
  },
  en: {
    '1': 'Engineer / Specialist in Humanities / International Services',
    '2': 'Specified Skilled Worker',
    '3': 'Student',
    '4': 'Permanent Resident',
    '5': 'Spouse of Japanese National',
    '6': 'Long-term Resident',
    '7': 'Not required',
    '8': 'Highly Skilled Professional',
    '9': 'Skilled Labor',
    '10': 'Dependent',
    '11': 'Short-term Stay',
    '12': 'Intra-company Transferee',
    '13': 'Entertainer',
    '14': 'Technical Intern Training',
    '15': 'Spouse of Permanent Resident',
  },
  ja: {
    '1': '技術・人文知識・国際業務',
    '2': '特定技能',
    '3': '留学',
    '4': '永住者',
    '5': '日本人の配偶者等',
    '6': '定住者',
    '7': '不要',
    '8': '高度専門職',
    '9': '技能',
    '10': '家族滞在',
    '11': '短期滞在',
    '12': '企業内転勤',
    '13': '興行',
    '14': '技能実習',
    '15': '永住者の配偶者等',
  },
};

const VISA_FILTER_VALUES = ['3', '1', '2', '9', '8', '12', '13', '14', '10', '5', '15', '6', '4', '11', '7'];

export function getScoutFilterCopy(language) {
  return scoutI18n[language]?.filters || scoutI18n.vi.filters;
}

export function getScoutVisaFilterOptions(language = 'vi') {
  const lang = scoutI18n[language] ? language : 'vi';
  const labels = SCOUT_VISA_LABELS[lang] || SCOUT_VISA_LABELS.vi;
  return VISA_FILTER_VALUES.map((value) => ({
    value,
    label: labels[value] || value,
  }));
}

export function formatScoutExperienceSeniorityLocalized(years, language = 'vi') {
  const n = Number(years);
  if (!Number.isFinite(n) || n <= 0) return '—';
  let level = 'Junior';
  if (language === 'ja') {
    if (n >= 6) level = 'シニア';
    else if (n >= 3) level = 'ミドル';
    else level = 'ジュニア';
  } else if (language === 'en') {
    if (n >= 6) level = 'Senior';
    else if (n >= 3) level = 'Mid';
    else level = 'Junior';
  } else {
    if (n >= 6) level = 'Senior';
    else if (n >= 3) level = 'Mid';
    else level = 'Junior';
  }
  const copy = scoutI18n[language] || scoutI18n.vi;
  return copy.experienceSeniority(level, n);
}

function resolveScoutLang(language) {
  return scoutI18n[language] ? language : 'vi';
}

export function getLocalizedScoutDisplayName(candidate, language = 'vi') {
  const copy = scoutI18n[resolveScoutLang(language)];
  const fallback = copy.anonymousCandidate;
  if (!candidate) return fallback;
  if (candidate.isUnlocked && candidate.name) return candidate.name;
  if (candidate.name && !candidate.anonymousName) return candidate.name;
  // Server always sends Vietnamese ANONYMOUS_LABEL — use UI locale instead.
  return fallback;
}

function formatLocalizedConversationLevel(value, language = 'vi') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  const levels = scoutI18n[resolveScoutLang(language)].conversationLevel;
  if (n === 1) return levels.native;
  if (n === 2) return levels.business;
  if (n === 3) return levels.conversational;
  return '';
}

export function formatScoutLanguageSummaryLocalized(candidate, language = 'vi') {
  const parts = [];
  const jlpt = getJlptDisplay(candidate?.jlptLevel);
  if (jlpt) parts.push(jlpt);
  const jpConv = formatLocalizedConversationLevel(candidate?.jpConversationLevel, language);
  if (jpConv) parts.push(`JP ${jpConv}`);
  const enConv = formatLocalizedConversationLevel(candidate?.enConversationLevel, language);
  if (enConv) parts.push(`EN ${enConv}`);
  return parts.length ? parts.join(' · ') : '—';
}

export function getScoutHoverTipCopy(language = 'vi') {
  return scoutI18n[resolveScoutLang(language)].hoverTip;
}

export function getScoutMatchBadgeCopy(language = 'vi') {
  return scoutI18n[resolveScoutLang(language)].matchBadge;
}
