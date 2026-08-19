/** Candidate list & unlocked profile detail — Business portal */

import { getDateLocale } from './jobs.js';

const LIST_FILTER_ALL = 'all';

const pipelineMeta = {
  vi: {
    new: { label: 'Mới', color: '#10b981', bg: '#d1fae5' },
    processing: { label: 'Đang xử lý', color: '#ea580c', bg: '#fed7aa' },
    interview: { label: 'Phỏng vấn', color: '#f59e0b', bg: '#fef3c7' },
    hired: { label: 'Đã tuyển', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'Không phù hợp', color: '#b45309', bg: '#fef3c7' },
    contact: { label: 'Liên hệ', color: '#4f46e5', bg: '#e0e7ff' },
  },
  en: {
    new: { label: 'New', color: '#10b981', bg: '#d1fae5' },
    processing: { label: 'In progress', color: '#ea580c', bg: '#fed7aa' },
    interview: { label: 'Interview', color: '#f59e0b', bg: '#fef3c7' },
    hired: { label: 'Hired', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'Not a fit', color: '#b45309', bg: '#fef3c7' },
    contact: { label: 'Contacted', color: '#4f46e5', bg: '#e0e7ff' },
  },
  ja: {
    new: { label: '新規', color: '#10b981', bg: '#d1fae5' },
    processing: { label: '対応中', color: '#ea580c', bg: '#fed7aa' },
    interview: { label: '面接', color: '#f59e0b', bg: '#fef3c7' },
    hired: { label: '採用', color: '#059669', bg: '#d1fae5' },
    rejected: { label: '不適合', color: '#b45309', bg: '#fef3c7' },
    contact: { label: '連絡済', color: '#4f46e5', bg: '#e0e7ff' },
  },
};

const unlockMeta = {
  vi: {
    scout_credit: { label: 'Scout Credit', color: '#3b82f6' },
    scout_performance: { label: 'Scout Performance', color: '#f59e0b' },
  },
  en: {
    scout_credit: { label: 'Scout Credit', color: '#3b82f6' },
    scout_performance: { label: 'Scout Performance', color: '#f59e0b' },
  },
  ja: {
    scout_credit: { label: 'Scout Credit', color: '#3b82f6' },
    scout_performance: { label: 'Scout Performance', color: '#f59e0b' },
  },
};

const perfRequestMeta = {
  vi: {
    pending: { label: 'Chờ WS duyệt', color: '#d97706', bg: '#fef3c7' },
    approved: { label: 'WS đã gửi gợi ý', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'WS từ chối', color: '#dc2626', bg: '#fee2e2' },
    cancelled: { label: 'Đã hủy', color: '#64748b', bg: '#f1f5f9' },
  },
  en: {
    pending: { label: 'Awaiting WS review', color: '#d97706', bg: '#fef3c7' },
    approved: { label: 'WS sent recommendations', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'WS declined', color: '#dc2626', bg: '#fee2e2' },
    cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9' },
  },
  ja: {
    pending: { label: 'WS承認待ち', color: '#d97706', bg: '#fef3c7' },
    approved: { label: 'WSが候補者を提案', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'WS却下', color: '#dc2626', bg: '#fee2e2' },
    cancelled: { label: 'キャンセル', color: '#64748b', bg: '#f1f5f9' },
  },
};

const perfExploreMeta = {
  vi: {
    interested: { label: 'Đang làm việc với WS', color: '#4f46e5', bg: '#e0e7ff' },
    declined: { label: 'Không tìm hiểu thêm', color: '#64748b', bg: '#f1f5f9' },
  },
  en: {
    interested: { label: 'Working with WS', color: '#4f46e5', bg: '#e0e7ff' },
    declined: { label: 'Not exploring further', color: '#64748b', bg: '#f1f5f9' },
  },
  ja: {
    interested: { label: 'WSと連携中', color: '#4f46e5', bg: '#e0e7ff' },
    declined: { label: '追加確認なし', color: '#64748b', bg: '#f1f5f9' },
  },
};

const perfStatusLabels = {
  vi: {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
  },
  en: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  },
  ja: {
    pending: '承認待ち',
    approved: '承認済',
    rejected: '却下',
    cancelled: 'キャンセル',
  },
};

export const candidatesI18n = {
  vi: {
    list: {
      emptyBody: 'Có vẻ bạn chưa mở hồ sơ ứng viên nào. Hãy dùng Scout Credit hoặc Scout Performance trên Workstation để tìm ứng viên phù hợp.',
      emptyCta: 'Tìm ứng viên trên Scout',
      unlockSourceLabel: 'Nguồn mở hồ sơ',
      unlockSourceAll: 'Tất cả nguồn mở hồ sơ',
      filtersTitle: 'Bộ lọc tìm kiếm',
      clearConditions: 'Xóa điều kiện',
      searchCount: (n) => `Tìm ${n} hồ sơ`,
      locationModalTitle: 'Chọn khu vực',
      loading: 'Đang tải...',
      loadingList: 'Đang tải danh sách...',
      openedCount: (n) => `${n} hồ sơ đã mở`,
      clickHint: 'Bấm vào hồ sơ để xem chi tiết trong tab mới',
      emptyAll: 'Không tìm thấy ứng viên phù hợp.',
      emptyScoutCredit: 'Không tìm thấy ứng viên Scout Credit.',
      emptyScoutPerformance: 'Không tìm thấy ứng viên Scout Performance.',
      loadError: 'Không tải được danh sách ứng viên',
    },
    detail: {
      backToList: 'Quay lại danh sách',
      loadingDetail: 'Đang tải chi tiết...',
      selectHint: 'Chọn ứng viên ở danh sách bên trái để xem hồ sơ',
      notFound: 'Không tìm thấy hồ sơ ứng viên',
      invalidId: 'ID ứng viên không hợp lệ',
      attachError: 'Không thể thêm vào tiến cử',
      loadError: 'Không tải được hồ sơ ứng viên',
      overview: 'Tổng quan',
      profileInfo: 'Thông tin hồ sơ',
      unlockedBadge: 'Đã mở',
      cvCode: (code) => `Mã CV: ${code}`,
      unlockedLine: (source, date) => `${source} · Mở ${date}`,
      moreActions: 'Thêm',
      fields: {
        email: 'Email',
        phone: 'Số điện thoại',
        furigana: 'Furigana',
        birthDate: 'Ngày sinh',
        gender: 'Giới tính',
        desiredLocation: 'Địa điểm mong muốn',
        experience: 'Kinh nghiệm',
        desiredPosition: 'Vị trí mong muốn',
        desiredSalary: 'Mức lương mong muốn',
        jlptLanguages: 'JLPT / Ngoại ngữ',
        residenceStatus: 'Tư cách lưu trú',
        visaExpiry: 'Ngày hết hạn visa',
        currentResidence: 'Nơi cư trú hiện tại',
        passport: 'Hộ chiếu',
        currentSalary: 'Lương hiện tại',
        desiredSalarySection: 'Lương mong muốn',
      },
      sections: {
        pr: 'PR / Giới thiệu',
        skills: 'Kỹ năng',
        education: 'Học vấn',
        workHistory: 'Lịch sử công việc',
        certificates: 'Chứng chỉ',
        visaResidence: 'Visa & cư trú',
        salary: 'Lương',
        motivation: 'Động lực',
      },
      metrics: {
        approachStatus: 'Trạng thái tiếp cận',
        wsRequest: 'Yêu cầu WS',
        experience: 'Kinh nghiệm',
        profileUnlock: 'Mở hồ sơ',
        creditUsed: 'Credit đã dùng',
        overview: 'Tổng quan',
        pipeline: 'Pipeline',
        scoutCredit: 'Scout Credit',
        recommendations: (n) => `${n} gợi ý`,
      },
      matchedJobs: {
        title: 'JD phù hợp',
        subtitle: 'Gợi ý từ AI theo hồ sơ ứng viên và JD của doanh nghiệp',
        analyzing: 'Đang phân tích...',
        loadError: 'Không tải được gợi ý JD phù hợp',
        empty: 'Chưa có JD phù hợp (match ≥ 40%)',
        match: (score) => `Match ${score}%`,
        jobCode: (code) => `Mã: ${code}`,
        adding: 'Đang thêm...',
        added: 'Đã thêm tiến cử',
        addToPipeline: 'Thêm vào tiến cử',
      },
      sidebar: {
        perfWsTitle: 'Scout Performance · WS',
        noPerfRequest: 'Chưa có yêu cầu WS gắn với hồ sơ này.',
        requestLabel: 'Yêu cầu',
        recommendationsSuffix: (n) => `${n} gợi ý`,
        workingWithWs: 'Làm việc với WS',
        findingSimilar: 'WS đang tìm ứng viên tương tự cho bạn',
        reviewingRequest: 'WS đang xem xét yêu cầu của bạn',
        explorePrompt: 'WS có gợi ý phù hợp. Bạn có muốn WS hỗ trợ thêm về ứng viên này?',
        exploreYes: 'Có — WS hỗ trợ liên hệ',
        exploreNo: 'Không, cảm ơn',
        viewOnScout: 'Xem gợi ý trên Scout',
        chatWithWs: 'Chat với WS',
        statusTitle: 'Trạng thái',
        approachTitle: 'Trạng thái tiếp cận',
        perfFeeNote: 'Gói Scout Performance · Phí 20% khi tuyển thành công',
        creditCostNote: (cost) => `Chi phí mở: ${cost ?? '—'} credit`,
        activity: 'Hoạt động',
        callPhone: (phone) => `Gọi ${phone}`,
        noPhone: 'Không có SĐT',
        email: 'Email',
        noEmail: 'Không có email',
        findMoreOnScout: 'Tìm thêm trên Scout',
      },
      timeline: {
        unlockProfile: (source) => `Mở hồ sơ Scout (${source})`,
        addToCandidates: 'Thêm vào hồ sơ ứng viên',
        perfRequest: (status) => `Yêu cầu Scout Performance (${status})`,
        wsHandled: 'WS xử lý yêu cầu',
        businessInterested: 'DN xác nhận quan tâm — WS đang hỗ trợ liên hệ',
        findingSimilar: 'WS đang tìm thêm ứng viên tương tự',
      },
    },
    format: {
      gender: { male: 'Nam', female: 'Nữ', other: 'Khác' },
      yes: 'Có',
      no: 'Không',
      years: (n) => `${n} năm`,
      age: (n) => `${n} tuổi`,
    },
  },
  en: {
    list: {
      emptyBody: 'You have not unlocked any candidate profiles yet. Use Scout Credit or Scout Performance on Workstation to find matching talent.',
      emptyCta: 'Find candidates on Scout',
      unlockSourceLabel: 'Unlock source',
      unlockSourceAll: 'All unlock sources',
      filtersTitle: 'Search filters',
      clearConditions: 'Clear conditions',
      searchCount: (n) => `Search ${n} profiles`,
      locationModalTitle: 'Select region',
      loading: 'Loading...',
      loadingList: 'Loading list...',
      openedCount: (n) => `${n} unlocked profiles`,
      clickHint: 'Click a profile to open details in a new tab',
      emptyAll: 'No matching candidates found.',
      emptyScoutCredit: 'No Scout Credit candidates found.',
      emptyScoutPerformance: 'No Scout Performance candidates found.',
      loadError: 'Could not load candidate list',
    },
    detail: {
      backToList: 'Back to list',
      loadingDetail: 'Loading profile...',
      selectHint: 'Select a candidate from the list to view their profile',
      notFound: 'Candidate profile not found',
      invalidId: 'Invalid candidate ID',
      attachError: 'Could not add to pipeline',
      loadError: 'Could not load candidate profile',
      overview: 'Overview',
      profileInfo: 'Profile details',
      unlockedBadge: 'Unlocked',
      cvCode: (code) => `CV code: ${code}`,
      unlockedLine: (source, date) => `${source} · Unlocked ${date}`,
      moreActions: 'More',
      fields: {
        email: 'Email',
        phone: 'Phone',
        furigana: 'Furigana',
        birthDate: 'Date of birth',
        gender: 'Gender',
        desiredLocation: 'Preferred location',
        experience: 'Experience',
        desiredPosition: 'Desired role',
        desiredSalary: 'Expected salary',
        jlptLanguages: 'JLPT / Languages',
        residenceStatus: 'Residence status',
        visaExpiry: 'Visa expiry',
        currentResidence: 'Current residence',
        passport: 'Passport',
        currentSalary: 'Current salary',
        desiredSalarySection: 'Expected salary',
      },
      sections: {
        pr: 'PR / Introduction',
        skills: 'Skills',
        education: 'Education',
        workHistory: 'Work history',
        certificates: 'Certificates',
        visaResidence: 'Visa & residence',
        salary: 'Salary',
        motivation: 'Motivation',
      },
      metrics: {
        approachStatus: 'Approach status',
        wsRequest: 'WS request',
        experience: 'Experience',
        profileUnlock: 'Profile unlocked',
        creditUsed: 'Credits used',
        overview: 'Overview',
        pipeline: 'Pipeline',
        scoutCredit: 'Scout Credit',
        recommendations: (n) => `${n} recommendations`,
      },
      matchedJobs: {
        title: 'Matching JDs',
        subtitle: 'AI suggestions based on this profile and your job descriptions',
        analyzing: 'Analyzing...',
        loadError: 'Could not load matching JD suggestions',
        empty: 'No matching JDs yet (match ≥ 40%)',
        match: (score) => `Match ${score}%`,
        jobCode: (code) => `Code: ${code}`,
        adding: 'Adding...',
        added: 'Added to pipeline',
        addToPipeline: 'Add to pipeline',
      },
      sidebar: {
        perfWsTitle: 'Scout Performance · WS',
        noPerfRequest: 'No WS request linked to this profile yet.',
        requestLabel: 'Request',
        recommendationsSuffix: (n) => `${n} recommendations`,
        workingWithWs: 'Working with WS',
        findingSimilar: 'WS is finding similar candidates for you',
        reviewingRequest: 'WS is reviewing your request',
        explorePrompt: 'WS has a good match. Would you like WS to help you reach out about this candidate?',
        exploreYes: 'Yes — WS helps with outreach',
        exploreNo: 'No, thanks',
        viewOnScout: 'View suggestions on Scout',
        chatWithWs: 'Chat with WS',
        statusTitle: 'Status',
        approachTitle: 'Approach status',
        perfFeeNote: 'Scout Performance · 20% fee on successful hire',
        creditCostNote: (cost) => `Unlock cost: ${cost ?? '—'} credits`,
        activity: 'Activity',
        callPhone: (phone) => `Call ${phone}`,
        noPhone: 'No phone number',
        email: 'Email',
        noEmail: 'No email',
        findMoreOnScout: 'Find more on Scout',
      },
      timeline: {
        unlockProfile: (source) => `Unlocked Scout profile (${source})`,
        addToCandidates: 'Added to candidate list',
        perfRequest: (status) => `Scout Performance request (${status})`,
        wsHandled: 'WS handled request',
        businessInterested: 'Company confirmed interest — WS is helping with outreach',
        findingSimilar: 'WS is finding more similar candidates',
      },
    },
    format: {
      gender: { male: 'Male', female: 'Female', other: 'Other' },
      yes: 'Yes',
      no: 'No',
      years: (n) => `${n} yr${n === 1 ? '' : 's'}`,
      age: (n) => `${n} yrs old`,
    },
  },
  ja: {
    list: {
      emptyBody: 'まだ候補者プロフィールを開いていません。WorkstationのScout CreditまたはScout Performanceで候補者を探してください。',
      emptyCta: 'Scoutで候補者を探す',
      unlockSourceLabel: 'プロフィール開示元',
      unlockSourceAll: 'すべての開示元',
      filtersTitle: '検索フィルター',
      clearConditions: '条件をクリア',
      searchCount: (n) => `${n}件を検索`,
      locationModalTitle: '地域を選択',
      loading: '読み込み中...',
      loadingList: 'リストを読み込み中...',
      openedCount: (n) => `開示済み ${n}件`,
      clickHint: 'プロフィールをクリックすると新しいタブで詳細が開きます',
      emptyAll: '該当する候補者が見つかりません。',
      emptyScoutCredit: 'Scout Creditの候補者が見つかりません。',
      emptyScoutPerformance: 'Scout Performanceの候補者が見つかりません。',
      loadError: '候補者リストを読み込めませんでした',
    },
    detail: {
      backToList: 'リストに戻る',
      loadingDetail: '詳細を読み込み中...',
      selectHint: '左のリストから候補者を選択してプロフィールを表示',
      notFound: '候補者プロフィールが見つかりません',
      invalidId: '候補者IDが無効です',
      attachError: '選考パイプラインに追加できませんでした',
      loadError: '候補者プロフィールを読み込めませんでした',
      overview: '概要',
      profileInfo: 'プロフィール情報',
      unlockedBadge: '開示済',
      cvCode: (code) => `CVコード: ${code}`,
      unlockedLine: (source, date) => `${source} · 開示 ${date}`,
      moreActions: 'その他',
      fields: {
        email: 'Email',
        phone: '電話番号',
        furigana: 'フリガナ',
        birthDate: '生年月日',
        gender: '性別',
        desiredLocation: '希望勤務地',
        experience: '経験',
        desiredPosition: '希望職種',
        desiredSalary: '希望年収',
        jlptLanguages: 'JLPT / 語学',
        residenceStatus: '在留資格',
        visaExpiry: 'ビザ有効期限',
        currentResidence: '現住所',
        passport: 'パスポート',
        currentSalary: '現年収',
        desiredSalarySection: '希望年収',
      },
      sections: {
        pr: 'PR / 自己紹介',
        skills: 'スキル',
        education: '学歴',
        workHistory: '職歴',
        certificates: '資格',
        visaResidence: 'ビザ・在留',
        salary: '年収',
        motivation: '志望動機',
      },
      metrics: {
        approachStatus: 'アプローチ状況',
        wsRequest: 'WSリクエスト',
        experience: '経験',
        profileUnlock: 'プロフィール開示',
        creditUsed: '使用クレジット',
        overview: '概要',
        pipeline: 'Pipeline',
        scoutCredit: 'Scout Credit',
        recommendations: (n) => `提案 ${n}件`,
      },
      matchedJobs: {
        title: 'マッチするJD',
        subtitle: '候補者プロフィールと貴社JDに基づくAI提案',
        analyzing: '分析中...',
        loadError: 'マッチJD提案を読み込めませんでした',
        empty: 'マッチするJDはありません（match ≥ 40%）',
        match: (score) => `Match ${score}%`,
        jobCode: (code) => `コード: ${code}`,
        adding: '追加中...',
        added: '選考に追加済',
        addToPipeline: '選考に追加',
      },
      sidebar: {
        perfWsTitle: 'Scout Performance · WS',
        noPerfRequest: 'このプロフィールに紐づくWSリクエストはありません。',
        requestLabel: 'リクエスト',
        recommendationsSuffix: (n) => `提案 ${n}件`,
        workingWithWs: 'WSと連携',
        findingSimilar: 'WSが類似候補者を探しています',
        reviewingRequest: 'WSがリクエストを確認中です',
        explorePrompt: 'WSから適合する提案があります。この候補者についてWSのサポートを希望しますか？',
        exploreYes: 'はい — WSが連絡をサポート',
        exploreNo: 'いいえ、結構です',
        viewOnScout: 'Scoutで提案を見る',
        chatWithWs: 'WSとチャット',
        statusTitle: 'ステータス',
        approachTitle: 'アプローチ状況',
        perfFeeNote: 'Scout Performance · 採用成功時20%手数料',
        creditCostNote: (cost) => `開示コスト: ${cost ?? '—'} credit`,
        activity: 'アクティビティ',
        callPhone: (phone) => `${phone}に電話`,
        noPhone: '電話番号なし',
        email: 'Email',
        noEmail: 'メールなし',
        findMoreOnScout: 'Scoutでさらに探す',
      },
      timeline: {
        unlockProfile: (source) => `Scoutプロフィール開示 (${source})`,
        addToCandidates: '候補者リストに追加',
        perfRequest: (status) => `Scout Performanceリクエスト (${status})`,
        wsHandled: 'WSがリクエストを処理',
        businessInterested: '企業が関心を確認 — WSが連絡をサポート中',
        findingSimilar: 'WSが類似候補者を追加探索中',
      },
    },
    format: {
      gender: { male: '男性', female: '女性', other: 'その他' },
      yes: 'はい',
      no: 'いいえ',
      years: (n) => `${n}年`,
      age: (n) => `${n}歳`,
    },
  },
};

function resolveLang(language) {
  return candidatesI18n[language] ? language : 'vi';
}

export function getCandidateCopy(language) {
  return candidatesI18n[resolveLang(language)];
}

export function getCandidateUnlockSourceOptions(language) {
  const lang = resolveLang(language);
  const list = getCandidateCopy(lang).list;
  const unlock = unlockMeta[lang];
  return [
    { value: LIST_FILTER_ALL, label: list.unlockSourceAll },
    { value: 'scout_credit', label: unlock.scout_credit.label },
    { value: 'scout_performance', label: unlock.scout_performance.label },
  ];
}

export function getCandidateListFilterEmptyText(filterId, language) {
  const list = getCandidateCopy(language).list;
  if (filterId === 'scout_credit') return list.emptyScoutCredit;
  if (filterId === 'scout_performance') return list.emptyScoutPerformance;
  return list.emptyAll;
}

export function getLocalizedScoutPipelineMeta(status, language = 'vi') {
  const lang = resolveLang(language);
  const map = pipelineMeta[lang];
  return map[status] || map.new;
}

export function getLocalizedScoutUnlockSourceMeta(unlockType, language = 'vi') {
  const lang = resolveLang(language);
  const map = unlockMeta[lang];
  return map[unlockType] || map.scout_credit;
}

export function getLocalizedScoutPerformanceRequestMeta(status, language = 'vi') {
  const lang = resolveLang(language);
  const map = perfRequestMeta[lang];
  return map[status] || map.pending;
}

export function getLocalizedScoutPerformanceExploreMeta(exploreStatus, language = 'vi') {
  if (!exploreStatus) return null;
  const lang = resolveLang(language);
  const map = perfExploreMeta[lang];
  return map[exploreStatus] || null;
}

export function getLocalizedScoutPerformanceRequestStatusLabel(status, language = 'vi') {
  const lang = resolveLang(language);
  const map = perfStatusLabels[lang];
  return map[status] || status || '—';
}

export function formatCandidateGender(value, language = 'vi') {
  const g = getCandidateCopy(language).format.gender;
  const n = Number(value);
  if (n === 1) return g.male;
  if (n === 2) return g.female;
  if (n === 3) return g.other;
  return value || '—';
}

export function formatCandidateYesNo(value, language = 'vi') {
  const f = getCandidateCopy(language).format;
  const n = Number(value);
  if (n === 1) return f.yes;
  if (n === 0) return f.no;
  return value == null || value === '' ? '—' : String(value);
}

export function formatCandidateExperienceYears(years, language = 'vi') {
  const n = Number(years);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return getCandidateCopy(language).format.years(n);
}

export function formatCandidateAgeGender(candidate, language = 'vi') {
  const gender = formatCandidateGender(candidate?.gender, language);
  let agePart = '';
  if (candidate?.birthDate) {
    const birth = new Date(candidate.birthDate);
    if (!Number.isNaN(birth.getTime())) {
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age > 0) agePart = getCandidateCopy(language).format.age(age);
    }
  }
  return [gender !== '—' ? gender : null, agePart].filter(Boolean).join(', ') || '—';
}

export function formatCandidateListDate(value, language = 'vi') {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(getDateLocale(language));
  } catch {
    return '—';
  }
}

export function formatCandidateNumber(n, language = 'vi') {
  return Number(n || 0).toLocaleString(getDateLocale(language));
}
