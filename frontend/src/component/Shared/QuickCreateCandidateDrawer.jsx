import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, X, ChevronDown, ListTree, Search, AlertTriangle, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import JobCategoryPickerModal from './JobCategoryPickerModal.jsx';
import { CV_ORIGINAL_ACCEPT, isSupportedCvOriginalFile } from '../../utils/cvOriginalFileTypes.js';
import { formatDuplicateWithCvRef, getDuplicateOwnerDisplayLines } from '../../utils/cvDuplicateDisplay.js';
import {
  mergeResumeDataFromAi,
  mapMergedToQuickCreateVisibleForm,
  appendFullCvFieldsToFormData,
  CV_AI_PARSE_URL,
} from '../../utils/mergeResumeDataFromAi.js';

const jlptOptions = [
  { value: '', labelKey: 'addCandidateSelectJlpt', fallback: 'Chọn JLPT' },
  { value: '1', labelKey: 'addCandidateJlptN1', fallback: 'N1' },
  { value: '2', labelKey: 'addCandidateJlptN2', fallback: 'N2' },
  { value: '3', labelKey: 'addCandidateJlptN3', fallback: 'N3' },
  { value: '4', labelKey: 'addCandidateJlptN4', fallback: 'N4' },
  { value: '5', labelKey: 'addCandidateJlptN5', fallback: 'N5' },
];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isValidPhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return true; // phone optional
  if (!/^\+?[0-9()\-\s.]{8,20}$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function toDateInputValue(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFileDisplayName(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const normalized = value.replace(/\\/g, '/').split('?')[0];
    const parts = normalized.split('/').filter(Boolean);
    return parts[parts.length - 1] || normalized;
  }
  if (typeof value === 'object') {
    return (
      value.name ||
      value.fileName ||
      value.downloadFileName ||
      value.originalName ||
      value.path ||
      ''
    );
  }
  return String(value);
}

const CV_AI_PARSE_TIMEOUT_MS = 3000000;

function normalizeVietnameseText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCollaboratorSearchText(collaborator) {
  if (!collaborator) return '';
  return [
    collaborator.name,
    collaborator.companyName,
    collaborator.company_name,
    collaborator.email,
    collaborator.phone,
  ].filter(Boolean).join(' ');
}

function getCollaboratorSearchScore(query, collaborator) {
  const normalizedQuery = normalizeVietnameseText(query);
  if (!normalizedQuery) return 0;

  const searchText = getCollaboratorSearchText(collaborator);
  const normalizedSearchText = normalizeVietnameseText(searchText);
  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const compactSearch = normalizedSearchText.replace(/\s+/g, '');

  if (!compactSearch || !compactQuery) return 0;
  if (compactSearch === compactQuery) return 100;
  if (compactSearch.includes(compactQuery) || compactQuery.includes(compactSearch)) return 95;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const searchTokens = normalizedSearchText.split(' ').filter(Boolean);
  if (!queryTokens.length || !searchTokens.length) return 0;

  let total = 0;
  let matched = 0;

  for (const queryToken of queryTokens) {
    let bestTokenScore = 0;
    for (const searchToken of searchTokens) {
      if (searchToken === queryToken) {
        bestTokenScore = 1;
        break;
      }
      if (searchToken.startsWith(queryToken) || queryToken.startsWith(searchToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.9);
        continue;
      }
      if (searchToken.includes(queryToken) || queryToken.includes(searchToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.8);
        continue;
      }
      const queryCompactToken = queryToken.replace(/\s+/g, '');
      const searchCompactToken = searchToken.replace(/\s+/g, '');
      if (searchCompactToken.includes(queryCompactToken) || queryCompactToken.includes(searchCompactToken)) {
        bestTokenScore = Math.max(bestTokenScore, 0.75);
      }
    }
    if (bestTokenScore > 0) {
      total += bestTokenScore;
      matched += 1;
    }
  }

  if (!matched) return 0;

  const coverage = matched / queryTokens.length;
  const average = total / matched;
  return Math.round(coverage * average * 100);
}

function mapQuickCreateAiData(parsedData) {
  const merged = mergeResumeDataFromAi(parsedData, {});
  return { merged, visible: mapMergedToQuickCreateVisibleForm(merged, {}) };
}

export default function QuickCreateCandidateDrawer({
  open,
  onClose,
  onCreated,
  jobId = null,
  candidateId = null,
  initialCandidate = null,
  initialCvFile = null,
  mode = 'create',
  variant = 'collaborator',
  onUpdated,
  defaultFlowStep = 'upload',
}) {
  const maxCvBytes = 40 * 1024 * 1024;
  const cvFileInputRef = useRef(null);
  const shokumuFileInputRef = useRef(null);
  const parsedFormDataRef = useRef(null);
  const notify = useNotification();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const isEditMode = mode === 'edit' || !!candidateId;
  const isAdminVariant = variant === 'admin';
  const [saving, setSaving] = useState(false);
  const [jobCategoryModalOpen, setJobCategoryModalOpen] = useState(false);
  const [flowStep, setFlowStep] = useState(defaultFlowStep || 'upload');
  const [showSupplementStep, setShowSupplementStep] = useState(false);
  const [form, setForm] = useState({
    nameKanji: '',
    birthDate: '',
    email: '',
    phone: '',
    jlptLevel: '',
    experienceYears: '',
    jobCategoryId: '',
    jobCategoryLabel: '',
    currentSalary: '',
    desiredSalary: '',
    desiredPosition: '',
    desiredLocation: '',
    desiredStartDate: '',
    jpResidenceStatus: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [existingCvFileName, setExistingCvFileName] = useState('');
  const [shokumuFile, setShokumuFile] = useState(null);
  const [aiParseLoading, setAiParseLoading] = useState(false);
  const [aiParseError, setAiParseError] = useState(null);
  const [parseElapsedSec, setParseElapsedSec] = useState(0);

  useEffect(() => {
    if (!aiParseLoading) {
      setParseElapsedSec(0);
      return undefined;
    }
    setParseElapsedSec(0);
    const timerId = setInterval(() => {
      setParseElapsedSec((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [aiParseLoading]);

  const aiParseLoadingMessage = useMemo(() => {
    if (parseElapsedSec < 10) return t.addCandidateAiParsePhase1;
    if (parseElapsedSec < 20) return t.addCandidateAiParsePhase2;
    return t.addCandidateAiParsePhase3;
  }, [parseElapsedSec, t]);
  const [editSupplementFields, setEditSupplementFields] = useState({
    technicalSkills: '',
    currentSalary: '',
    desiredSalary: '',
    desiredPosition: '',
    desiredStartDate: '',
  });
  const [errors, setErrors] = useState({});
  const [collaboratorSearchQuery, setCollaboratorSearchQuery] = useState('');
  const [collaboratorOptions, setCollaboratorOptions] = useState([]);
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [collaboratorLoadingMore, setCollaboratorLoadingMore] = useState(false);
  const [collaboratorHasMore, setCollaboratorHasMore] = useState(true);
  const [collaboratorPage, setCollaboratorPage] = useState(1);
  const [collaboratorLastQuery, setCollaboratorLastQuery] = useState('');
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [collaboratorDropdownOpen, setCollaboratorDropdownOpen] = useState(false);
  const [adminDuplicateResult, setAdminDuplicateResult] = useState(null);
  const collaboratorDropdownLoadMoreRef = useRef(null);

  const drawerTitle = isEditMode
    ? (t.addCandidateTitleEdit || t.quickCreateDrawerTitleNominate || t.quickCreateDrawerTitle || 'Bổ sung thông tin hồ sơ')
    : (jobId
      ? (t.quickCreateDrawerTitleNominate || t.addCandidateNominate || t.addCandidateTitleEdit || 'Tạo hồ sơ nhanh để tiến cử')
      : (t.quickCreateDrawerTitle || t.addCandidateTitleNew || 'Tạo hồ sơ nhanh'));

  const residenceStatusOptions = useMemo(() => ([
    { value: '3', vi: 'Visa du học', en: 'Student Visa', ja: '留学' },
    { value: '1', vi: 'Visa kỹ sư / tri thức nhân văn / nghiệp vụ quốc tế', en: 'Engineer / Specialist in Humanities / International Services', ja: '技術・人文知識・国際業務' },
    { value: '2', vi: 'Visa kỹ năng đặc định', en: 'Specified Skilled Worker', ja: '特定技能' },
    { value: '9', vi: 'Visa kỹ năng (lao động tay nghề)', en: 'Skilled Worker', ja: '技能' },
    { value: '8', vi: 'Visa lao động trình độ cao', en: 'Highly Skilled Professional', ja: '高度専門職' },
    { value: '12', vi: 'Visa chuyển công tác nội bộ', en: 'Intra-company Transferee', ja: '企業内転勤' },
    { value: '13', vi: 'Visa biểu diễn / giải trí', en: 'Entertainer', ja: '興行' },
    { value: '14', vi: 'Visa thực tập sinh kỹ năng', en: 'Technical Intern Training', ja: '技能実習' },
    { value: '10', vi: 'Visa gia đình (phụ thuộc)', en: 'Dependent Visa', ja: '家族滞在' },
    { value: '5', vi: 'Visa vợ/chồng người Nhật', en: 'Spouse or Child of Japanese National', ja: '日本人の配偶者等' },
    { value: '15', vi: 'Visa vợ/chồng của người vĩnh trú', en: 'Spouse or Child of Permanent Resident', ja: '永住者の配偶者等' },
    { value: '6', vi: 'Visa cư trú dài hạn', en: 'Long-term Resident', ja: '定住者' },
    { value: '4', vi: 'Visa vĩnh trú', en: 'Permanent Resident', ja: '永住者' },
    { value: '11', vi: 'Visa ngắn hạn', en: 'Temporary Visitor', ja: '短期滞在' },
    { value: '7', vi: 'Không yêu cầu', en: 'No requirement', ja: '不要' },
  ]), []);

  const getResidenceStatusLabel = (opt) => {
    if (language === 'en') return opt.en;
    if (language === 'ja') return opt.ja;
    return opt.vi;
  };

  const collaboratorSearchText = useMemo(() => ({
    label: language === 'en' ? 'Create profile for CTV' : language === 'ja' ? 'CTVを選択して作成' : 'Chọn CTV để tạo hồ sơ',
    placeholder: language === 'en' ? 'Search CTV by name, email, phone...' : language === 'ja' ? '名前・メール・電話番号でCTVを検索...' : 'Tìm CTV theo tên, email, số điện thoại...',
    empty: language === 'en' ? 'No matching CTV found' : language === 'ja' ? '該当するCTVがありません' : 'Không tìm thấy CTV phù hợp',
    selected: language === 'en' ? 'Selected CTV' : language === 'ja' ? '選択中のCTV' : 'CTV đã chọn',
    clear: language === 'en' ? 'Clear CTV' : language === 'ja' ? 'CTVを解除' : 'Bỏ chọn CTV',
  }), [language]);

  const collaboratorDisplayName = (collaborator) => {
    if (!collaborator) return '';
    return collaborator.name || collaborator.companyName || collaborator.company_name || collaborator.email || `CTV #${collaborator.id}`;
  };

  const countryOptions = useMemo(() => ([
    { value: '日本', label: t.addCandidateJapan || 'Nhật Bản' },
    { value: 'ベトナム', label: t.addCandidateVietnam || 'Việt Nam' },
    { value: 'その他', label: t.addCandidateOtherCountryLabel || 'Quốc gia khác' },
  ]), [t]);

  const jlptOptionLabels = useMemo(() => ({
    '': t.addCandidateSelectJlpt || 'JLPTを選択',
    '1': t.addCandidateJlptN1 || 'N1',
    '2': t.addCandidateJlptN2 || 'N2',
    '3': t.addCandidateJlptN3 || 'N3',
    '4': t.addCandidateJlptN4 || 'N4',
    '5': t.addCandidateJlptN5 || 'N5',
  }), [t]);

  const defaultResidenceStatusLabel = t.addCandidateNoRequirement || 'Không yêu cầu';
  const currentLocationLabel = t.addCandidateCurrentLocationCountry || t.addCandidateLocationCountry || 'Địa điểm hiện tại';
  const supplementText = useMemo(() => ({
    title: language === 'en' ? 'Skills and preferences' : language === 'ja' ? 'スキル・希望条件' : 'Kỹ năng và mong muốn',
    editHint: language === 'en' ? 'Only shown when updating the profile.' : language === 'ja' ? 'プロフィール更新時のみ表示されます。' : 'Chỉ hiển thị khi cập nhật hồ sơ.',
    technicalSkills: language === 'en' ? 'Technical skills' : language === 'ja' ? '技術スキル' : 'Kỹ năng kỹ thuật',
    currentSalary: language === 'en' ? 'Current salary' : language === 'ja' ? '現在年収' : 'Lương hiện tại',
    desiredSalary: language === 'en' ? 'Desired salary' : language === 'ja' ? '希望年収' : 'Lương mong muốn',
    desiredPosition: language === 'en' ? 'Desired position' : language === 'ja' ? '希望職種' : 'Vị trí mong muốn',
    desiredLocation: language === 'en' ? 'Desired location' : language === 'ja' ? '希望勤務地' : 'Địa điểm mong muốn',
    desiredStartDate: language === 'en' ? 'Desired start date' : language === 'ja' ? '希望入社日' : 'Ngày bắt đầu mong muốn',
    reminderTitle: language === 'en' ? 'Reminder' : language === 'ja' ? 'リマインダー' : 'Nhắc nhở',
    reminderDesc: language === 'en' ? 'Add the following information so AI can provide the best suggestions for you.' : language === 'ja' ? 'AIが最適な提案を行えるよう、以下の情報を追加してください。' : 'Hãy bổ sung các thông tin sau để AI có thể đưa ra các gợi ý tốt nhất cho bạn nhé.',
    reminderNote: language === 'en' ? 'The more data you provide, the easier it is for AI to suggest suitable jobs, reasonable salary ranges, and ways to optimize your profile.' : language === 'ja' ? 'データが多いほど、AIはより適切な求人、妥当な給与レンジ、プロフィール改善案を提案しやすくなります。' : 'Càng có nhiều dữ liệu, AI càng dễ gợi ý việc làm phù hợp, mức lương hợp lý và hướng tối ưu hồ sơ của bạn.',
    technicalSkillsPlaceholder: language === 'en' ? 'Example: Java, React, project management, CAD...' : language === 'ja' ? '例：Java、React、プロジェクト管理、CAD...' : 'Ví dụ: Java, React, quản lý dự án, CAD...',
    currentSalaryPlaceholder: language === 'en' ? 'Example: 3,000,000' : language === 'ja' ? '例：300万円' : 'Ví dụ: 300万円',
    desiredSalaryPlaceholder: language === 'en' ? 'Example: 4,000,000' : language === 'ja' ? '例：400万円' : 'Ví dụ: 400万円',
    desiredPositionPlaceholder: language === 'en' ? 'Example: Frontend Engineer' : language === 'ja' ? '例：フロントエンドエンジニア' : 'Ví dụ: Frontend Engineer',
    desiredLocationPlaceholder: language === 'en' ? 'Example: Tokyo' : language === 'ja' ? '例：東京' : 'Ví dụ: Tokyo',
  }), [language]);

  const adminDuplicateTexts = useMemo(() => ({
    title: language === 'en'
      ? 'Duplicate profile detected'
      : language === 'ja'
        ? '重複プロフィールが検出されました'
        : 'Phát hiện hồ sơ trùng',
    matchedProfile: t.candidateDuplicateWithCvDetail || (language === 'en' ? 'Matches existing profile:' : language === 'ja' ? '重複元プロフィール：' : 'Trùng với hồ sơ:'),
    ownerTitle: language === 'en' ? 'Owner' : language === 'ja' ? '所有者' : 'Thuộc về',
    unknownOwner: t.candidateDuplicateOwnerUnknown || (language === 'en' ? 'Owner unknown' : language === 'ja' ? '所有者不明' : 'Chưa xác định CTV/ứng viên'),
    viewDuplicate: language === 'en' ? 'View matched profile' : language === 'ja' ? '重複元を見る' : 'Xem hồ sơ trùng',
    viewCreated: language === 'en' ? 'View created profile' : language === 'ja' ? '作成したプロフィールを見る' : 'Xem hồ sơ vừa tạo',
    close: t.close || t.cancel || 'Đóng',
  }), [language, t]);

  const normalizeCollaboratorList = useCallback((payload) => {
    const list = payload?.data?.collaborators || payload?.data?.items || payload?.data || [];
    return Array.isArray(list) ? list : [];
  }, []);

  const fetchCollaboratorPage = useCallback(async ({ page = 1, append = false, query = '' } = {}) => {
    const params = {
      page,
      limit: 20,
      status: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };
    const q = query.trim();
    if (q) params.search = q;
    const res = await apiService.getCollaborators(params);
    const list = normalizeCollaboratorList(res);
    const ranked = q
      ? list
          .map((collaborator, index) => ({
            collaborator,
            score: getCollaboratorSearchScore(q, collaborator),
            index,
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score || a.index - b.index)
          .map((item) => item.collaborator)
      : list;
    setCollaboratorOptions((prev) => {
      const next = append ? [...prev, ...ranked] : ranked;
      const seen = new Set();
      return next.filter((item) => {
        const key = String(item?.id ?? '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
    setCollaboratorHasMore(list.length >= params.limit);
    setCollaboratorLastQuery(q);
  }, [normalizeCollaboratorList]);

  useEffect(() => {
    if (!open || !isAdminVariant || !collaboratorDropdownOpen) return undefined;
    const timer = setTimeout(async () => {
      setCollaboratorLoading(true);
      setCollaboratorPage(1);
      setCollaboratorHasMore(true);
      try {
        await fetchCollaboratorPage({ page: 1, append: false, query: collaboratorSearchQuery });
      } catch (error) {
        console.error('Error loading collaborators:', error);
        setCollaboratorOptions([]);
        setCollaboratorHasMore(false);
      } finally {
        setCollaboratorLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [open, isAdminVariant, collaboratorDropdownOpen, collaboratorSearchQuery, fetchCollaboratorPage]);

  useEffect(() => {
    const el = collaboratorDropdownLoadMoreRef.current;
    if (!el || !collaboratorDropdownOpen || !collaboratorHasMore || collaboratorLoading || collaboratorLoadingMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      if (collaboratorLoadingMore || !collaboratorHasMore) return;
      setCollaboratorLoadingMore(true);
      const nextPage = collaboratorPage + 1;
      fetchCollaboratorPage({ page: nextPage, append: true, query: collaboratorLastQuery })
        .then(() => setCollaboratorPage(nextPage))
        .catch((error) => {
          console.error('Error loading more collaborators:', error);
          setCollaboratorHasMore(false);
        })
        .finally(() => setCollaboratorLoadingMore(false));
    }, { root: el.parentElement, threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [collaboratorDropdownOpen, collaboratorHasMore, collaboratorLoading, collaboratorLoadingMore, collaboratorPage, collaboratorLastQuery, fetchCollaboratorPage]);

  useEffect(() => {
    if (!open || !isEditMode || !initialCandidate) return;
    setForm((prev) => ({
      ...prev,
      nameKanji: initialCandidate.nameKanji || prev.nameKanji,
      birthDate: initialCandidate.birthDate || prev.birthDate,
      email: initialCandidate.email || prev.email,
      phone: initialCandidate.phone || prev.phone,
      jlptLevel: initialCandidate.jlptLevel || prev.jlptLevel,
      experienceYears: initialCandidate.experienceYears ?? prev.experienceYears,
      jobCategoryId: initialCandidate.jobCategoryId || prev.jobCategoryId,
      jobCategoryLabel: initialCandidate.jobCategoryLabel || prev.jobCategoryLabel,
      currentSalary: initialCandidate.currentSalary ?? prev.currentSalary,
      desiredSalary: initialCandidate.desiredSalary ?? prev.desiredSalary,
      desiredPosition: initialCandidate.desiredPosition ?? prev.desiredPosition,
      desiredLocation: initialCandidate.desiredLocation ?? prev.desiredLocation,
      desiredStartDate: initialCandidate.desiredStartDate ?? prev.desiredStartDate,
      jpResidenceStatus: initialCandidate.jpResidenceStatus ?? prev.jpResidenceStatus,
    }));
  }, [open, isEditMode, initialCandidate]);

  useEffect(() => {
    if (!open) return;
    if (initialCvFile && typeof initialCvFile === 'object' && initialCvFile instanceof File) {
      setCvFile(initialCvFile);
      setExistingCvFileName('');
      return;
    }
    if (initialCvFile && typeof initialCvFile === 'object') {
      setCvFile(null);
      setExistingCvFileName(getFileDisplayName(initialCvFile));
      return;
    }
    if (typeof initialCvFile === 'string') {
      setCvFile(null);
      setExistingCvFileName(getFileDisplayName(initialCvFile));
      return;
    }
    setCvFile(null);
    setExistingCvFileName('');
  }, [open, initialCvFile]);

  const resetState = () => {
    setForm({
      nameKanji: '',
      birthDate: '',
      email: '',
      phone: '',
      jlptLevel: '',
      experienceYears: '',
      jobCategoryId: '',
      jobCategoryLabel: '',
      currentSalary: '',
      desiredSalary: '',
      desiredPosition: '',
      desiredLocation: '',
      desiredStartDate: '',
      jpResidenceStatus: '',
    });
    setCvFile(null);
    setShokumuFile(null);
    setExistingCvFileName('');
    setErrors({});
    setSaving(false);
    setCollaboratorSearchQuery('');
    setCollaboratorOptions([]);
    setCollaboratorLoading(false);
    setCollaboratorLoadingMore(false);
    setCollaboratorPage(1);
    setCollaboratorHasMore(true);
    setCollaboratorLastQuery('');
    setSelectedCollaborator(null);
    setCollaboratorDropdownOpen(false);
    setAdminDuplicateResult(null);
    setAiParseLoading(false);
    setAiParseError(null);
    setParseElapsedSec(0);
    parsedFormDataRef.current = null;
    setFlowStep(defaultFlowStep || 'upload');
    setShowSupplementStep(false);
    setEditSupplementFields({
      technicalSkills: '',
      currentSalary: '',
      desiredSalary: '',
      desiredPosition: '',
      desiredStartDate: '',
    });
  };

  useEffect(() => {
    if (open) return;
    resetState();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!isEditMode) return;
    setEditSupplementFields({
      technicalSkills: initialCandidate?.technicalSkills || '',
      currentSalary: initialCandidate?.currentSalary || '',
      desiredSalary: initialCandidate?.desiredSalary || '',
      desiredPosition: initialCandidate?.desiredPosition || '',
      desiredStartDate: initialCandidate?.desiredStartDate || '',
    });
  }, [open, isEditMode, initialCandidate]);

  if (!open) return null;

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const clearFieldError = (fieldKey) => {
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const getActiveErrors = (errs = errors) =>
    Object.entries(errs).filter(([, message]) => Boolean(String(message || '').trim()));

  const cvRequiredMessage = () =>
    t.addCandidateUploadCvFile || t.addCandidateUploadCv || 'Vui lòng tải file CV (bắt buộc)';

  const validate = () => {
    const next = {};
    if (!String(form.nameKanji || '').trim()) next.nameKanji = t.requiredFields || 'Vui lòng nhập họ tên';
    if (!String(form.email || '').trim()) next.email = t.requiredFields || 'Vui lòng nhập email';
    else if (!isValidEmail(form.email)) next.email = t.invalidEmail || 'Email không hợp lệ';
    // Only name, email, and CV are required in quick create.
    if (!isEditMode) {
      // Removed from quick-create step: currentSalary, desiredSalary, desiredPosition, desiredStartDate.
    }
    if (!cvFile && !existingCvFileName) {
      next.cvFile = cvRequiredMessage();
    } else if (cvFile) {
      if (!isSupportedCvOriginalFile(cvFile)) {
        next.cvFile =
          t.invalidOriginalFile || 'Vui lòng chọn file PDF, Word, Excel, PowerPoint, ảnh (JPG/PNG/...), TXT, RTF hoặc ODT/ODS';
      } else if (cvFile.size > maxCvBytes) {
        next.cvFile = t.fileTooLarge || 'File CV tối đa 40MB';
      }
    }

    if (form.phone && !isValidPhone(form.phone)) next.phone = t.invalidPhone || 'Số điện thoại không hợp lệ';
    if (isEditMode && form.experienceYears !== '' && !/^(0|[1-9]\d*)$/.test(String(form.experienceYears).trim())) {
      next.experienceYears = t.invalidExperienceYears || 'Số năm kinh nghiệm không hợp lệ';
    }

    if (shokumuFile) {
      if (!isSupportedCvOriginalFile(shokumuFile)) {
        next.shokumuFile =
          t.invalidOriginalFile || 'Vui lòng chọn file PDF, Word, Excel, PowerPoint, ảnh (JPG/PNG/...), TXT, RTF hoặc ODT/ODS';
      } else if (shokumuFile.size > maxCvBytes) {
        next.shokumuFile = t.fileTooLargeShokumu || 'File Shokumu tối đa 40MB';
      }
    }
    setErrors(next);
    return { valid: Object.keys(next).length === 0, errors: next };
  };

  const getValidationMissingLabels = (errs = errors) => {
    const labels = [];
    if (errs.nameKanji) labels.push(t.addCandidateNameKanji || 'Họ tên');
    if (errs.birthDate) labels.push(t.addCandidateBirthDate || 'Ngày tháng năm sinh');
    if (errs.email) labels.push(t.addCandidateEmail || 'Email');
    if (errs.phone) labels.push(t.addCandidatePhone || 'Số điện thoại');
    if (errs.jobCategoryId) labels.push(t.jobCategoryLabel || 'Ngành nghề');
    if (errs.desiredLocation) labels.push(currentLocationLabel || 'Địa điểm hiện tại');
    if (errs.jpResidenceStatus) labels.push(t.jpResidenceStatus || 'Tư cách lưu trú');
    if (errs.jlptLevel) labels.push(t.addCandidateSelectJlpt || 'JLPT');
    if (errs.experienceYears) labels.push(t.experienceYears || 'Số năm kinh nghiệm');
    if (errs.cvFile) labels.push(t.addCandidateCvLabel || t.cvFile || 'File CV');
    if (errs.shokumuFile) labels.push(t.addCandidateShokumuLabel || 'Shokumu');
    return labels;
  };

  const buildValidationNotifyMessage = (validationErrors) => {
    const labels = getValidationMissingLabels(validationErrors);
    if (!labels.length) {
      return t.requiredFields || 'Vui lòng kiểm tra lại thông tin bắt buộc';
    }
    if (language === 'en') {
      return `Please complete the required fields: ${labels.join(', ')}`;
    }
    if (language === 'ja') {
      return `必須項目を入力してください: ${labels.join('、')}`;
    }
    return `Vui lòng bổ sung: ${labels.join(', ')}`;
  };

  const buildSubmitCvData = () => {
    const parsed = parsedFormDataRef.current || {};
    const visibleOverrides = {
      nameKanji: form.nameKanji || '',
      birthDate: form.birthDate || '',
      email: form.email || '',
      phone: form.phone || '',
      jlptLevel: form.jlptLevel || '',
      experienceYears: form.experienceYears ?? '',
      jobCategoryId: form.jobCategoryId || '',
      currentSalary: form.currentSalary || '',
      desiredSalary: form.desiredSalary || '',
      desiredPosition: form.desiredPosition || '',
      desiredLocation: form.desiredLocation || '',
      desiredStartDate: form.desiredStartDate || '',
      jpResidenceStatus: form.jpResidenceStatus || '',
    };
    const data = {
      ...parsed,
      ...visibleOverrides,
    };
    if (isEditMode) {
      data.technicalSkills = editSupplementFields.technicalSkills ?? data.technicalSkills ?? '';
      data.currentSalary = editSupplementFields.currentSalary ?? data.currentSalary ?? '';
      data.desiredSalary = editSupplementFields.desiredSalary ?? data.desiredSalary ?? '';
      data.desiredPosition = editSupplementFields.desiredPosition ?? data.desiredPosition ?? '';
      data.desiredStartDate = editSupplementFields.desiredStartDate ?? data.desiredStartDate ?? '';
    } else if (showSupplementStep) {
      if (editSupplementFields.technicalSkills?.trim()) {
        data.technicalSkills = editSupplementFields.technicalSkills;
      }
      if (editSupplementFields.currentSalary?.trim()) data.currentSalary = editSupplementFields.currentSalary;
      if (editSupplementFields.desiredSalary?.trim()) data.desiredSalary = editSupplementFields.desiredSalary;
      if (editSupplementFields.desiredPosition?.trim()) data.desiredPosition = editSupplementFields.desiredPosition;
      if (editSupplementFields.desiredStartDate?.trim()) data.desiredStartDate = editSupplementFields.desiredStartDate;
    }
    return data;
  };

  const createPayload = () => {
    const fd = new FormData();
    fd.append('quickCreate', '1');
    fd.append('variant', variant || 'collaborator');
    fd.append('skipPdfGeneration', '1');
    appendFullCvFieldsToFormData(fd, buildSubmitCvData());
    const jpStatus = form.jpResidenceStatus || '';
    if (jpStatus) {
      fd.set('residence_status', jpStatus);
      fd.set('residenceStatus', jpStatus);
    }
    if (isAdminVariant && selectedCollaborator?.id) {
      fd.append('collaboratorId', String(selectedCollaborator.id));
      fd.append('collaborator_id', String(selectedCollaborator.id));
    }
    if (cvFile) fd.append('cvFile', cvFile);
    if (shokumuFile) fd.append('cvFile', shokumuFile);
    return fd;
  };

  const handleCvFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setCvFile(f);
    setAiParseError(null);
    clearFieldError('cvFile');
    e.target.value = '';
  };

  const handleShokumuFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setShokumuFile(f);
    clearFieldError('shokumuFile');
    e.target.value = '';
  };

  const handleLocationChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, desiredLocation: value };
      if (value === '日本') {
        if (!next.jpResidenceStatus || next.jpResidenceStatus === '7') next.jpResidenceStatus = '';
      } else if (value === 'ベトナム' || value === 'その他') {
        next.jpResidenceStatus = '7';
      }
      return next;
    });
  };

  const removeCvFile = () => {
    setCvFile(null);
    setExistingCvFileName('');
    setAiParseError(null);
    if (cvFileInputRef.current) cvFileInputRef.current.value = '';
  };

  const removeShokumuFile = () => {
    setShokumuFile(null);
    if (shokumuFileInputRef.current) shokumuFileInputRef.current.value = '';
  };

  const mergeParsedAiDataIntoForm = (parsedData) => {
    const { merged, visible } = mapQuickCreateAiData(parsedData);
    parsedFormDataRef.current = merged;
    setForm((prev) => ({
      ...prev,
      ...visible,
      birthDate: visible.birthDate || prev.birthDate,
      email: visible.email || prev.email,
      phone: visible.phone || prev.phone,
      jpResidenceStatus: visible.jpResidenceStatus || prev.jpResidenceStatus,
      currentSalary: visible.currentSalary || prev.currentSalary,
      desiredSalary: visible.desiredSalary || prev.desiredSalary,
      desiredPosition: visible.desiredPosition || prev.desiredPosition,
      desiredLocation: visible.desiredLocation || prev.desiredLocation,
      desiredStartDate: visible.desiredStartDate || prev.desiredStartDate,
      jobCategoryLabel: visible.jobCategoryLabel || prev.jobCategoryLabel,
    }));
    setFlowStep('manual');
    return merged;
  };

  /** Danh sách file gửi parse AI — thứ tự giống AddCandidateForm: [CV/履歴書, Shokumu/職務経歴]. */
  const getParseableCvFiles = () => {
    const ordered = [cvFile, shokumuFile].filter(Boolean);
    return ordered.filter(
      (f) => isSupportedCvOriginalFile(f) && f.size <= maxCvBytes
    );
  };

  const runAiParse = async () => {
    const parseableFiles = getParseableCvFiles();
    if (!cvFile) {
      notify.warning(t.addCandidateAiParseNoFiles || 'Chưa có file CV hợp lệ để phân tích.');
      return null;
    }
    if (parseableFiles.length === 0) {
      notify.warning(t.addCandidateAiParseNoFiles || 'Chưa có file CV hợp lệ để phân tích.');
      return null;
    }
    setAiParseError(null);
    setAiParseLoading(true);
    const aiParseFailMessage =
      t.addCandidateAiParseFail ||
      'AI không thể thực hiện phân tích hồ sơ này, xin vui lòng thử lại hoặc bổ sung thủ công';
    try {
      const formDataUpload = new FormData();
      parseableFiles.forEach((file) => {
        formDataUpload.append('files', file);
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CV_AI_PARSE_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(CV_AI_PARSE_URL, {
          method: 'POST',
          body: formDataUpload,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        setAiParseError(aiParseFailMessage);
        return null;
      }
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        setAiParseError(aiParseFailMessage);
        return null;
      }
      return mergeParsedAiDataIntoForm(data);
    } catch {
      setAiParseError(aiParseFailMessage);
      return null;
    } finally {
      setAiParseLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (saving) return;
    const { valid, errors: validationErrors } = validate();
    if (!valid) {
      notify.warning(buildValidationNotifyMessage(validationErrors));
      return;
    }
    setSaving(true);
    try {
      const payload = createPayload();
      if (isEditMode) {
        payload.set('experienceYears', String(form.experienceYears ?? ''));
        payload.set('desired_work_location', form.desiredLocation ?? '');
      }
      const res = isEditMode && candidateId
        ? await apiService.updateCVStorage(candidateId, payload, { asApplicant: variant === 'applicant' })
        : await apiService.createCVStorage(payload);
      if (!res?.success) {
        notify.error(res?.message || t.quickCreateCreateFailed || 'Không tạo được hồ sơ');
        return;
      }
      const savedCv = res?.data?.cv || res?.data?.candidate || res?.data || null;
      const createdStatus = Number(savedCv?.status);
      const dupInfo = res.data?.duplicateInfo || null;
      const duplicateWithCv = dupInfo?.duplicateWithCv || savedCv?.duplicateWithCv || null;
      const isDuplicate = Boolean(
        dupInfo?.isDuplicate
        || createdStatus === 5
        || Number(savedCv?.isDuplicate) === 1
        || savedCv?.duplicateWithCvId
      );
      const isDuplicateBlocked = res?.status === 409 || dupInfo?.blocked;

      if (isEditMode) {
        notify.success(t.saved || 'Đã cập nhật thông tin');
        onUpdated?.(savedCv, dupInfo);
        window.setTimeout(() => handleClose(), 0);
        return;
      }

      if (isAdminVariant && isDuplicate) {
        const dupRef = formatDuplicateWithCvRef({
          duplicateWithCvId: dupInfo?.duplicateWithCvId || savedCv?.duplicateWithCvId,
          duplicateWithCv,
        });
        setAdminDuplicateResult({
          message: res.message,
          dupRef,
          ownerLines: getDuplicateOwnerDisplayLines(duplicateWithCv, { language, t }),
          savedCvId: savedCv?.id || null,
        });
        notify.warning(res.message || t.quickCreateSystemDuplicateWarning || 'Hồ sơ tạo mới trùng với hồ sơ khác trong hệ thống.');
        onCreated?.(savedCv, dupInfo);
        return;
      }

      if (isDuplicateBlocked) {
        notify.error(res.message || t.quickCreateDuplicateBlocked || 'Hồ sơ khởi tạo thất bại vì thông tin đã trùng với hồ sơ hợp lệ khác.');
      } else if (isDuplicate) {
        notify.error(res.message || t.quickCreateCreateFailed || 'Hồ sơ khởi tạo thất bại');
      } else {
        notify.success(t.quickCreateCreateSuccess || 'Tạo hồ sơ thành công');
      }

      onCreated?.(savedCv, dupInfo);
      window.setTimeout(() => handleClose(), 0);
    } catch (error) {
      const dup = error?.data?.data?.duplicateInfo;
      const blocked = error?.status === 409 && dup?.blocked;
      if (blocked) {
        const ownDup = dup?.ownership === 'same_collaborator' || dup?.reason === 'own_valid_cv_exists';
        if (ownDup) {
          notify.error(
            error?.message ||
            t.quickCreateOwnDuplicateWarning ||
            'Bạn đã có hồ sơ hợp lệ với cùng email hoặc số điện thoại. Vui lòng mở hồ sơ hiện có để chỉnh sửa thay vì tạo mới.'
          );
        } else {
          notify.warning(t.quickCreateSystemDuplicateWarning || 'Hồ sơ bạn tạo đã trùng với hồ sơ khác trong hệ thống. Hãy kiểm tra hoặc liên lạc với admin để được trợ giúp');
        }
      } else {
        notify.error(error?.message || t.quickCreateCreateFailed || 'Không tạo được hồ sơ');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinishNow = async () => {
    return;
  };

  const startAiFlow = async () => {
    const mapped = await runAiParse();
    if (mapped) {
      setShowSupplementStep(true);
      setFlowStep('manual');
    }
    return mapped;
  };

  const handleManualFlow = () => {
    setShowSupplementStep(true);
    setFlowStep('manual');
  };

  const handleBackToUpload = () => {
    setFlowStep('upload');
  };

  const renderCollaboratorSearchBox = () => {
    if (!isAdminVariant || isEditMode) return null;
    return (
      <div className="relative rounded-xl border border-blue-100 bg-blue-50/60 p-3">
        <label className="mb-1 block text-xs font-semibold text-gray-700">{collaboratorSearchText.label}</label>
        {selectedCollaborator ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{collaboratorDisplayName(selectedCollaborator)}</div>
              <div className="truncate text-xs text-gray-500">
                {[selectedCollaborator.email, selectedCollaborator.phone].filter(Boolean).join(' • ') || `ID: ${selectedCollaborator.id}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCollaborator(null);
                setCollaboratorSearchQuery('');
                setCollaboratorDropdownOpen(true);
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              {collaboratorSearchText.clear}
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={collaboratorSearchQuery}
              onFocus={() => setCollaboratorDropdownOpen(true)}
              onChange={(e) => {
                setCollaboratorSearchQuery(e.target.value);
                setCollaboratorDropdownOpen(true);
              }}
              placeholder={collaboratorSearchText.placeholder}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {collaboratorDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                {collaboratorLoading ? (
                  <div className="px-3 py-3 text-xs text-gray-500">{t.loading || 'Đang tải...'}</div>
                ) : collaboratorOptions.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-gray-500">{collaboratorSearchText.empty}</div>
                ) : (
                  <>
                    {collaboratorOptions.map((collaborator) => (
                      <button
                        key={collaborator.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedCollaborator(collaborator);
                          setCollaboratorSearchQuery(collaboratorDisplayName(collaborator));
                          setCollaboratorDropdownOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                      >
                        <div className="font-semibold text-gray-900">{collaboratorDisplayName(collaborator)}</div>
                        <div className="truncate text-xs text-gray-500">
                          {[collaborator.email, collaborator.phone].filter(Boolean).join(' • ') || `ID: ${collaborator.id}`}
                        </div>
                      </button>
                    ))}
                    <div ref={collaboratorDropdownLoadMoreRef} className="h-8 flex items-center justify-center text-[10px] text-gray-400">
                      {collaboratorLoadingMore ? 'Đang tải thêm...' : collaboratorHasMore ? 'Cuộn để tải thêm' : 'Hết danh sách'}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleLater = () => {
    handleClose();
  };

  const isUploadStep = flowStep === 'upload';
  const shouldShowSupplementStep = showSupplementStep || flowStep === 'manual';
  const activeValidationErrors = getActiveErrors(errors);
  const cvMissingOnManualStep = !isEditMode && !cvFile && !existingCvFileName;

  const renderAdminDuplicatePanel = () => {
    if (!adminDuplicateResult) return null;
    const { dupRef, ownerLines, savedCvId } = adminDuplicateResult;
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-900">{adminDuplicateTexts.title}</h3>
              {adminDuplicateResult.message ? (
                <p className="mt-1 text-xs text-amber-800">{adminDuplicateResult.message}</p>
              ) : null}
            </div>
            {dupRef ? (
              <div>
                <p className="text-xs font-semibold text-amber-900">{adminDuplicateTexts.matchedProfile}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/candidates/${dupRef.dupId}`)}
                  className="mt-1 text-sm font-semibold text-blue-700 underline hover:text-blue-900"
                >
                  {dupRef.profileLabel} (#{dupRef.dupId})
                </button>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-amber-900">{adminDuplicateTexts.ownerTitle}</p>
              {ownerLines.length > 0 ? (
                <ul className="mt-1 space-y-1.5 text-xs text-amber-900">
                  {ownerLines.map((line) => (
                    <li key={line.key}>
                      <span className="font-medium">{line.label}: </span>
                      {line.href ? (
                        <button
                          type="button"
                          onClick={() => navigate(line.href)}
                          className="font-semibold text-blue-700 underline hover:text-blue-900"
                        >
                          {line.value}
                        </button>
                      ) : (
                        <span>{line.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-amber-800">{adminDuplicateTexts.unknownOwner}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {dupRef ? (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/candidates/${dupRef.dupId}`)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {adminDuplicateTexts.viewDuplicate}
                </button>
              ) : null}
              {savedCvId ? (
                <button
                  type="button"
                  onClick={() => navigate(`${isAdminVariant ? '/admin' : '/agent'}/candidates/${savedCvId}/edit?view=upload`)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {adminDuplicateTexts.viewCreated}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {adminDuplicateTexts.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {aiParseLoading ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
          aria-live="polite"
          aria-busy="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-create-cv-ai-parse-loading-title"
        >
          <div className="rounded-2xl bg-white px-10 py-8 shadow-2xl flex flex-col items-center gap-4 w-max max-w-[min(96vw,52rem)] text-center">
            <Loader2
              className="h-12 w-12 animate-spin text-blue-600"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <h3
              id="quick-create-cv-ai-parse-loading-title"
              className="text-lg font-bold text-gray-900 whitespace-nowrap"
            >
              {t.addCandidateParsingCv}
            </h3>
            <p
              key={aiParseLoadingMessage}
              className="text-sm text-gray-600 leading-relaxed whitespace-nowrap transition-opacity duration-300"
            >
              {aiParseLoadingMessage}
            </p>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              {t.addCandidateAiParseLoadingHint}
            </p>
          </div>
        </div>
      ) : (
        <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-4xl max-h-[92dvh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
          <div className="flex items-start justify-between px-4 py-3 sm:px-5 sm:py-4 border-b shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{drawerTitle}</h2>
            </div>
            <button type="button" onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
            {adminDuplicateResult ? (
              renderAdminDuplicatePanel()
            ) : isUploadStep ? (
              <div className="space-y-4">
                {renderCollaboratorSearchBox()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">
                      {t.addCandidateCvLabel || 'CV'}<span className="text-red-500"> *</span>
                    </label>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      <span className="text-center">{cvFile ? (t.addCandidateChangeCvFile || 'Đổi file CV') : (t.addCandidateUploadCvFile || 'Tải lên file CV')}</span>
                      <input ref={cvFileInputRef} type="file" accept={CV_ORIGINAL_ACCEPT} className="hidden" onChange={handleCvFileChange} />
                    </label>
                    {cvFile ? <div className="mt-2 flex items-center gap-2 text-xs text-gray-700 bg-white rounded-lg px-2 py-1.5 border border-gray-100"><span className="flex-1 truncate" title={cvFile.name}>{cvFile.name}</span><span className="text-gray-400 shrink-0">{(cvFile.size / 1024).toFixed(0)} KB</span><button type="button" onClick={removeCvFile} className="p-1 rounded-md hover:bg-red-50 text-red-600 shrink-0 border border-transparent hover:border-red-100" aria-label={t.addCandidateRemoveCvFile || 'Xóa file CV'}><X className="w-4 h-4" strokeWidth={2.5} /></button></div> : existingCvFileName ? <div className="mt-2 flex items-center gap-2 text-xs text-gray-700 bg-blue-50 rounded-lg px-2 py-1.5 border border-blue-100"><span className="flex-1 truncate" title={existingCvFileName}>{existingCvFileName}</span><span className="text-blue-600 shrink-0">Đã có</span></div> : null}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateShokumuLabel || 'Shokumu'}</label>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      <span className="text-center">{shokumuFile ? (t.addCandidateChangeShokumuFile || 'Đổi file Shokumu') : (t.addCandidateUploadShokumuFile || 'Tải lên file Shokumu (tuỳ chọn)')}</span>
                      <input ref={shokumuFileInputRef} type="file" accept={CV_ORIGINAL_ACCEPT} className="hidden" onChange={handleShokumuFileChange} />
                    </label>
                    {shokumuFile ? <div className="mt-2 flex items-center gap-2 text-xs text-gray-700 bg-white rounded-lg px-2 py-1.5 border border-gray-100"><span className="flex-1 truncate" title={shokumuFile.name}>{shokumuFile.name}</span><span className="text-gray-400 shrink-0">{(shokumuFile.size / 1024).toFixed(0)} KB</span><button type="button" onClick={removeShokumuFile} className="p-1 rounded-md hover:bg-red-50 text-red-600 shrink-0 border border-transparent hover:border-red-100" aria-label={t.addCandidateRemoveShokumuFile || 'Xóa file Shokumu'}><X className="w-4 h-4" strokeWidth={2.5} /></button></div> : null}
                  </div>
                </div>

                {aiParseError ? (
                  <div
                    className="rounded-lg p-3 border flex items-start gap-2"
                    style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
                  >
                    <span className="mt-0.5 text-xs" style={{ color: '#dc2626' }} aria-hidden="true">
                      ⚠️
                    </span>
                    <p className="flex-1 text-xs font-medium" style={{ color: '#991b1b' }}>
                      {aiParseError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAiParseError(null)}
                      className="text-xs shrink-0"
                      style={{ color: '#dc2626' }}
                      aria-label={language === 'en' ? 'Dismiss' : language === 'ja' ? '閉じる' : 'Đóng'}
                    >
                      ✕
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button type="button" onClick={startAiFlow} disabled={!cvFile || aiParseLoading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                    {aiParseLoading ? (t.addCandidateParsingCv || 'Đang phân tích...') : (t.addCandidateAiParseButton || 'Phân tích AI')}
                  </button>
                  <button type="button" onClick={handleManualFlow} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    {language === 'en' ? 'Enter manually' : language === 'ja' ? '手動で入力' : 'Nhập thông tin thủ công'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{language === 'en' ? 'Manual information' : language === 'ja' ? '手動入力' : 'Nhập thông tin thủ công'}</h3>
                    <p className="text-xs text-gray-500 mt-1">{language === 'en' ? 'Review or complete the candidate profile before saving.' : language === 'ja' ? '保存前に候補者情報を確認・補完してください。' : 'Xem lại hoặc bổ sung thông tin ứng viên trước khi lưu.'}</p>
                  </div>
                  <button type="button" onClick={handleBackToUpload} className="text-xs font-semibold text-blue-600 hover:underline">{language === 'en' ? 'Back' : language === 'ja' ? '戻る' : 'Quay lại'}</button>
                </div>

                {renderCollaboratorSearchBox()}

                {activeValidationErrors.length > 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 space-y-1.5">
                    <p className="font-semibold">
                      {language === 'en'
                        ? 'Missing or invalid information:'
                        : language === 'ja'
                          ? '未入力または不正な項目:'
                          : 'Thiếu hoặc chưa hợp lệ:'}
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {activeValidationErrors.map(([fieldKey, message]) => (
                        <li key={fieldKey}>
                          {message}
                          {fieldKey === 'cvFile' ? (
                            <>
                              {' '}
                              <button
                                type="button"
                                onClick={handleBackToUpload}
                                className="font-semibold text-blue-700 underline hover:text-blue-900"
                              >
                                {language === 'en'
                                  ? 'Back to upload CV'
                                  : language === 'ja'
                                    ? 'CVアップロードに戻る'
                                    : 'Quay lại tải CV'}
                              </button>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!isEditMode ? (
                  <div className={`rounded-xl border p-3 ${cvMissingOnManualStep ? 'border-amber-300 bg-amber-50/80' : 'border-gray-200 bg-gray-50'}`}>
                    <label className="block text-xs font-semibold mb-2 text-gray-700">
                      {t.addCandidateCvLabel || 'CV'}
                      <span className="text-red-500"> *</span>
                    </label>
                    {cvFile ? (
                      <div className="flex items-center gap-2 text-xs text-gray-700 bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                        <span className="flex-1 truncate" title={cvFile.name}>{cvFile.name}</span>
                        <span className="text-gray-400 shrink-0">{(cvFile.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={removeCvFile} className="p-1 rounded-md hover:bg-red-50 text-red-600 shrink-0" aria-label={t.addCandidateRemoveCvFile || 'Xóa file CV'}>
                          <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : existingCvFileName ? (
                      <div className="text-xs text-gray-700 bg-blue-50 rounded-lg px-2 py-1.5 border border-blue-100 truncate" title={existingCvFileName}>
                        {existingCvFileName}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-amber-800 mb-2">
                          {language === 'en'
                            ? 'A CV file is required before saving the profile.'
                            : language === 'ja'
                              ? 'プロフィール保存前にCVファイルが必要です。'
                              : 'Cần có file CV trước khi lưu hồ sơ.'}
                        </p>
                        <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-white px-4 py-4 text-sm text-gray-600 cursor-pointer hover:bg-amber-50/50">
                          <Upload className="w-4 h-4 shrink-0" />
                          <span>{t.addCandidateUploadCvFile || 'Tải lên file CV'}</span>
                          <input ref={cvFileInputRef} type="file" accept={CV_ORIGINAL_ACCEPT} className="hidden" onChange={handleCvFileChange} />
                        </label>
                      </>
                    )}
                    {errors.cvFile ? <p className="mt-1.5 text-xs text-red-600">{errors.cvFile}</p> : null}
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateNameKanji || 'Họ tên'}<span className="text-red-500"> *</span></label>
                  <input
                    value={form.nameKanji}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, nameKanji: e.target.value }));
                      clearFieldError('nameKanji');
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  {errors.nameKanji ? <p className="mt-1 text-xs text-red-600">{errors.nameKanji}</p> : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateBirthDate || 'Ngày tháng năm sinh'}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="date" value={toDateInputValue(form.birthDate)} max={toDateInputValue(new Date())} onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))} className="w-full rounded-lg border pl-10 pr-3 py-2 text-sm appearance-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">Email<span className="text-red-500"> *</span></label><input type="email" value={form.email} onChange={(e) => { setForm((prev) => ({ ...prev, email: e.target.value })); clearFieldError('email'); }} className="w-full rounded-lg border px-3 py-2 text-sm" />{errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}</div>
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidatePhone || 'Số điện thoại'} <span className="font-normal text-gray-500">({t.optional || 'tuỳ chọn'})</span></label><input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />{errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateIndustry || 'Ngành nghề'}</label>
                  <button type="button" onClick={() => setJobCategoryModalOpen(true)} className="w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left hover:bg-gray-50"><span className="flex items-center gap-2 min-w-0"><ListTree className="w-4 h-4 shrink-0 text-blue-600" /><span className="truncate text-gray-800">{form.jobCategoryLabel || (t.addCandidateIndustryPlaceholder || 'Chọn ngành nghề')}</span></span><ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">{currentLocationLabel}</label><select value={form.desiredLocation} onChange={(e) => handleLocationChange(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">{t.addCandidateSelect || 'Chọn'}</option>{countryOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateResidenceStatus || 'Tư cách lưu trú'}</label><select value={form.jpResidenceStatus} onChange={(e) => setForm((prev) => ({ ...prev, jpResidenceStatus: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" disabled={form.desiredLocation === 'ベトナム' || form.desiredLocation === 'その他'}>{form.desiredLocation === '日本' ? <><option value="">{t.addCandidateSelect || 'Chọn'}</option>{residenceStatusOptions.map((opt) => <option key={opt.value} value={opt.value}>{getResidenceStatusLabel(opt)}</option>)}</> : <option value={defaultResidenceStatusLabel}>{defaultResidenceStatusLabel}</option>}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">JLPT</label><select value={form.jlptLevel} onChange={(e) => setForm((prev) => ({ ...prev, jlptLevel: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">{jlptOptions.map((opt) => <option key={opt.value} value={opt.value}>{jlptOptionLabels[opt.value] || opt.fallback}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold mb-1 text-gray-700">{t.addCandidateExpYears || 'Số năm kinh nghiệm'}</label><input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm((prev) => ({ ...prev, experienceYears: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" /></div>
                </div>
                {isEditMode || shouldShowSupplementStep ? <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5 space-y-4"><div><h3 className="text-sm font-semibold text-gray-900">{supplementText.title}</h3><p className="mt-1 text-xs text-gray-500">{supplementText.editHint}</p></div><div><label className="block text-xs font-semibold mb-1 text-gray-700">{supplementText.technicalSkills}</label><textarea value={editSupplementFields.technicalSkills} onChange={(e) => setEditSupplementFields((prev) => ({ ...prev, technicalSkills: e.target.value }))} rows={4} className="w-full rounded-lg border px-3 py-2 text-sm" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-xs font-semibold mb-1 text-gray-700">{supplementText.currentSalary}</label><input value={editSupplementFields.currentSalary} onChange={(e) => setEditSupplementFields((prev) => ({ ...prev, currentSalary: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" /></div><div><label className="block text-xs font-semibold mb-1 text-gray-700">{supplementText.desiredSalary}</label><input value={editSupplementFields.desiredSalary} onChange={(e) => setEditSupplementFields((prev) => ({ ...prev, desiredSalary: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" /></div><div><label className="block text-xs font-semibold mb-1 text-gray-700">{supplementText.desiredPosition}</label><input value={editSupplementFields.desiredPosition} onChange={(e) => setEditSupplementFields((prev) => ({ ...prev, desiredPosition: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" /></div><div><label className="block text-xs font-semibold mb-1 text-gray-700">{supplementText.desiredStartDate}</label><input type="date" value={editSupplementFields.desiredStartDate} onChange={(e) => setEditSupplementFields((prev) => ({ ...prev, desiredStartDate: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" /></div></div></div> : null}
              </form>
            )}
          </div>

          {!isUploadStep && !adminDuplicateResult ? <div className="border-t px-4 py-3 sm:px-5 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0 bg-white" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}><button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700">{t.cancel || 'Hủy'}</button><button type="button" onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-60">{saving ? (t.saving || 'Đang tạo...') : (t.addCandidateSave || 'Tạo hồ sơ')}</button></div> : null}
        </div>
      </div>
        </>
      )}

      <JobCategoryPickerModal
        open={jobCategoryModalOpen}
        onClose={() => setJobCategoryModalOpen(false)}
        useAdminAPI={false}
        language={language}
        initialLeafId={form.jobCategoryId || null}
        onConfirm={({ id, displayName }) => {
          setForm((prev) => ({
            ...prev,
            jobCategoryId: id != null ? String(id) : '',
            jobCategoryLabel: displayName || '',
          }));
        }}
      />
    </>
  );
}
