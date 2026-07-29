import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import {
  Bot, FileText, Languages, Loader2, Plus, Save, Send, Sparkles, User,
} from 'lucide-react';
import apiService from '../../services/api';
import useBusinessUser from '../../hooks/useBusinessUser';
import JdTemplate from '../Admin/AddJob/JdTemplate';
import BusinessJobDetailEmbed from './BusinessJobDetailEmbed';
import {
  JD_LANGUAGE_TABS,
  applyTranslatedJd,
  buildJdTranslationPayload,
  translateJdViaApi,
} from '../../utils/jdTranslation';
import {
  buildBusinessJobPayloadFromFormState,
  wrapBusinessJobPayloadWithJdFile,
} from '../../utils/buildBusinessJobPayloadFromFormState';
import {
  createJobBuilderThreadId,
  fileToStoredJd,
  storedJdToFile,
  upsertJobBuilderThread,
} from '../../utils/jobBuilderThreadStorage';
import { JD_PARSE_ACCEPT, formatFileSize, parseJdFile } from '../../utils/parseJdFile';
import {
  SIMPLE_FEE_MODES,
  simpleCommissionToPayload,
} from '../../utils/businessSimpleCommission';
import JobCommissionEditor from './JobCommissionEditor';

export const JD_BUILDER_SESSION_KEY = 'wjs_jd_builder_session_id';

function readStoredSessionId() {
  try {
    return sessionStorage.getItem(JD_BUILDER_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

function storeSessionId(id) {
  try {
    if (id) sessionStorage.setItem(JD_BUILDER_SESSION_KEY, id);
    else sessionStorage.removeItem(JD_BUILDER_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mergeServerMessages(prev, serverMessages) {
  const localOnly = prev.filter((m) => m.localOnly);
  const server = (serverMessages || []).map((m) => ({ ...m, localOnly: false }));
  const combined = [...server];
  localOnly.forEach((lm) => {
    if (!combined.some((m) => m.id === lm.id)) combined.push(lm);
  });
  return combined.sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

const JobAiBuilderPanel = forwardRef(function JobAiBuilderPanel({
  embedded = false,
  activeThreadId: activeThreadIdProp = null,
  savedJobId: savedJobIdProp = null,
  onJobSaved,
  onThreadPersist,
}, ref) {
  const { companyName, user: businessUser } = useBusinessUser();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const parseAbortRef = useRef(null);
  const sessionStartedRef = useRef(false);

  const emptyState = createEmptyJdFormState();
  const [formData, setFormData] = useState(emptyState.formData);
  const [recruitingCompany, setRecruitingCompany] = useState(emptyState.recruitingCompany);
  const [workingLocations, setWorkingLocations] = useState(emptyState.workingLocations);
  const [workingLocationDetails, setWorkingLocationDetails] = useState(emptyState.workingLocationDetails);
  const [salaryRanges, setSalaryRanges] = useState(emptyState.salaryRanges);
  const [salaryRangeDetails, setSalaryRangeDetails] = useState(emptyState.salaryRangeDetails);
  const [overtimeAllowances, setOvertimeAllowances] = useState(emptyState.overtimeAllowances);
  const [overtimeAllowanceDetails, setOvertimeAllowanceDetails] = useState(emptyState.overtimeAllowanceDetails);
  const [requirements, setRequirements] = useState(emptyState.requirements);
  const [workingHours, setWorkingHours] = useState(emptyState.workingHours);
  const [workingHourDetails, setWorkingHourDetails] = useState(emptyState.workingHourDetails);
  const [jobBenefitRows, setJobBenefitRows] = useState(emptyState.jobBenefitRows);
  const [highlightKeys, setHighlightKeys] = useState(emptyState.highlightKeys);
  const [jobValues, setJobValues] = useState(() => simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '').jobValues);
  const [languageTab, setLanguageTab] = useState('vi');
  const [categories, setCategories] = useState([]);
  const [jdTemplateSyncKey, setJdTemplateSyncKey] = useState(0);

  const formDataRef = useRef(formData);
  const recruitingCompanyRef = useRef(recruitingCompany);
  const workingLocationsRef = useRef(workingLocations);
  const highlightKeysRef = useRef(highlightKeys);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { recruitingCompanyRef.current = recruitingCompany; }, [recruitingCompany]);
  useEffect(() => { workingLocationsRef.current = workingLocations; }, [workingLocations]);
  useEffect(() => { highlightKeysRef.current = highlightKeys; }, [highlightKeys]);

  const [sessionId, setSessionId] = useState(() => readStoredSessionId());
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [canFinalize, setCanFinalize] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [translatingInputs, setTranslatingInputs] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rightTab, setRightTab] = useState('template');
  const [activeThreadId, setActiveThreadId] = useState(activeThreadIdProp || null);
  const [savedJobId, setSavedJobId] = useState(savedJobIdProp || null);
  const [jdOriginalFile, setJdOriginalFile] = useState(null);
  const [jdOriginalStored, setJdOriginalStored] = useState(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  useEffect(() => { if (activeThreadIdProp) setActiveThreadId(activeThreadIdProp); }, [activeThreadIdProp]);
  useEffect(() => { if (savedJobIdProp != null) setSavedJobId(savedJobIdProp); }, [savedJobIdProp]);

  const getFormSnapshot = useCallback(() => ({
    formData,
    recruitingCompany,
    workingLocations,
    workingLocationDetails,
    salaryRanges,
    salaryRangeDetails,
    overtimeAllowances,
    overtimeAllowanceDetails,
    requirements,
    workingHours,
    workingHourDetails,
    jobBenefitRows,
    highlightKeys,
    jobValues,
    languageTab,
  }), [
    formData, recruitingCompany, workingLocations, workingLocationDetails,
    salaryRanges, salaryRangeDetails, overtimeAllowances, overtimeAllowanceDetails,
    requirements, workingHours, workingHourDetails, jobBenefitRows, highlightKeys, jobValues, languageTab,
  ]);

  const buildThreadPayload = useCallback(async (overrides = {}) => {
    const title = formData.title || formData.titleEn || formData.titleJp || 'JD mới';
    let storedJd = jdOriginalStored;
    if (jdOriginalFile && !storedJd) {
      storedJd = await fileToStoredJd(jdOriginalFile);
    }
    return {
      id: activeThreadId || createJobBuilderThreadId(),
      jobId: savedJobId,
      title,
      messages,
      sessionId,
      formSnapshot: getFormSnapshot(),
      jdOriginalStored: storedJd,
      ...overrides,
    };
  }, [activeThreadId, savedJobId, formData, messages, sessionId, getFormSnapshot, jdOriginalFile, jdOriginalStored]);

  const persistThread = useCallback(async (overrides = {}) => {
    const payload = await buildThreadPayload(overrides);
    if (!activeThreadId) setActiveThreadId(payload.id);
    const saved = upsertJobBuilderThread(payload);
    onThreadPersist?.(saved);
    return saved;
  }, [activeThreadId, buildThreadPayload, onThreadPersist]);

  useEffect(() => {
    if (bootLoading) return undefined;
    const timer = setTimeout(() => {
      if (messages.length > 0 || formData.title) {
        persistThread().catch(() => {});
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [bootLoading, messages, formData, persistThread]);

  const applyFormSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    if (snapshot.formData) setFormData(snapshot.formData);
    if (snapshot.recruitingCompany) setRecruitingCompany(snapshot.recruitingCompany);
    if (snapshot.workingLocations) setWorkingLocations(snapshot.workingLocations);
    if (snapshot.workingLocationDetails) setWorkingLocationDetails(snapshot.workingLocationDetails);
    if (snapshot.salaryRanges) setSalaryRanges(snapshot.salaryRanges);
    if (snapshot.salaryRangeDetails) setSalaryRangeDetails(snapshot.salaryRangeDetails);
    if (snapshot.overtimeAllowances) setOvertimeAllowances(snapshot.overtimeAllowances);
    if (snapshot.overtimeAllowanceDetails) setOvertimeAllowanceDetails(snapshot.overtimeAllowanceDetails);
    if (snapshot.requirements) setRequirements(snapshot.requirements);
    if (snapshot.workingHours) setWorkingHours(snapshot.workingHours);
    if (snapshot.workingHourDetails) setWorkingHourDetails(snapshot.workingHourDetails);
    if (snapshot.jobBenefitRows) setJobBenefitRows(snapshot.jobBenefitRows);
    if (snapshot.highlightKeys) setHighlightKeys(snapshot.highlightKeys);
    if (snapshot.jobValues) setJobValues(snapshot.jobValues);
    if (snapshot.languageTab) setLanguageTab(snapshot.languageTab);
    setJdTemplateSyncKey((k) => k + 1);
  }, []);

  const formSetters = {
    setLanguageTab,
    setFormData,
    setRecruitingCompany,
    setWorkingLocations,
    setWorkingLocationDetails,
    setSalaryRanges,
    setSalaryRangeDetails,
    setRequirements,
    setWorkingHours,
    setWorkingHourDetails,
    setOvertimeAllowances,
    setOvertimeAllowanceDetails,
    setJobBenefitRows,
    setHighlightKeys,
    setJdTemplateSyncKey,
  };

  const applyDraftToPreview = useCallback((draft) => {
    const j = normalizeJdDraft(draft);
    if (!j || !Object.keys(j).length) return;
    const patch = applyParsedJdToFormState(j, {
      prevFormData: formDataRef.current,
      prevRecruitingCompany: recruitingCompanyRef.current,
      prevWorkingLocations: workingLocationsRef.current,
      prevHighlightKeys: highlightKeysRef.current,
    });
    applyJdFormStatePatch(formSetters, patch);
  }, []);

  const applySessionResponse = useCallback((data) => {
    if (data?.session_id) {
      setSessionId(data.session_id);
      storeSessionId(data.session_id);
    }
    if (Array.isArray(data?.messages) && data.messages.length) {
      setMessages((prev) => mergeServerMessages(prev, data.messages));
    } else if (data?.reply) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === data.reply) return prev;
        return [...prev, {
          id: createMessageId(),
          role: 'assistant',
          kind: 'text',
          content: data.reply,
          ts: Date.now(),
        }];
      });
    }
    setQuickReplies(Array.isArray(data?.quick_replies) ? data.quick_replies : []);
    setMissingFields(Array.isArray(data?.missing_fields) ? data.missing_fields : []);
    setCanFinalize(Boolean(data?.can_finalize));
    if (data?.draft) applyDraftToPreview(data.draft);
  }, [applyDraftToPreview]);

  const startSession = useCallback(async () => {
    if (sessionStartedRef.current && sessionId) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiService.jdBuilderStart({
        company_name: companyName || businessUser?.companyName || 'Doanh nghiệp',
        locale: 'vi',
        initial_brief: 'Xin chào, tôi muốn tạo JD tuyển dụng mới.',
      });
      sessionStartedRef.current = true;
      if (data?.reply) {
        setMessages([{
          id: createMessageId(),
          role: 'assistant',
          kind: 'text',
          content: data.reply,
          ts: Date.now(),
        }]);
      }
      applySessionResponse(data);
    } catch (err) {
      setError(err?.message || 'Không thể bắt đầu phiên chat.');
      sessionStartedRef.current = false;
    } finally {
      setLoading(false);
      setBootLoading(false);
    }
  }, [applySessionResponse, businessUser?.companyName, companyName, sessionId]);

  const applySessionResponseRef = useRef(applySessionResponse);
  const startSessionRef = useRef(startSession);
  useEffect(() => { applySessionResponseRef.current = applySessionResponse; }, [applySessionResponse]);
  useEffect(() => { startSessionRef.current = startSession; }, [startSession]);

  const loadThread = useCallback(async (thread) => {
    if (!thread) return;
    setError('');
    setBootLoading(false);
    setActiveThreadId(thread.id);
    setSavedJobId(thread.jobId || null);
    applyFormSnapshot(thread.formSnapshot);
    setJdOriginalStored(thread.jdOriginalStored || null);
    setJdOriginalFile(storedJdToFile(thread.jdOriginalStored));
    setRightTab(thread.jobId ? 'detail' : 'template');

    const storedMessages = Array.isArray(thread.messages) ? thread.messages : [];
    if (thread.sessionId) {
      setSessionId(thread.sessionId);
      storeSessionId(thread.sessionId);
      sessionStartedRef.current = true;
      try {
        const data = await apiService.jdBuilderGetSession(thread.sessionId);
        applySessionResponseRef.current(data);
        setMessages(mergeServerMessages(storedMessages, data?.messages));
      } catch {
        storeSessionId('');
        setSessionId('');
        sessionStartedRef.current = false;
        setMessages(storedMessages);
        if (storedMessages.length === 0) await startSessionRef.current();
      }
    } else {
      setMessages(storedMessages);
      storeSessionId('');
      setSessionId('');
      sessionStartedRef.current = false;
      if (storedMessages.length === 0) await startSessionRef.current();
    }
  }, [applyFormSnapshot]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const treeResponse = await apiService.getCTVJobCategoryTree();
        if (!cancelled && treeResponse?.success && treeResponse?.data?.tree?.length) {
          const flatten = (cats) => {
            const result = [];
            const seen = new Set();
            const visit = (list) => {
              (list || []).forEach((cat) => {
                if (cat && !seen.has(cat.id)) {
                  seen.add(cat.id);
                  result.push(cat);
                }
                if (cat?.children?.length) visit(cat.children);
              });
            };
            visit(cats);
            return result;
          };
          setCategories(flatten(treeResponse.data.tree));
        }
      } catch {
        /* optional */
      }

      if (embedded) {
        if (!cancelled) setBootLoading(false);
        return;
      }

      const stored = readStoredSessionId();
      if (stored) {
        try {
          const data = await apiService.jdBuilderGetSession(stored);
          if (cancelled) return;
          sessionStartedRef.current = true;
          applySessionResponse(data);
        } catch {
          storeSessionId('');
          setSessionId('');
          if (!cancelled) await startSession();
        }
      } else if (!cancelled) {
        await startSession();
      }

      if (!cancelled) setBootLoading(false);
    };
    boot();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!businessUser) return;
    setRecruitingCompany((prev) => ({
      ...prev,
      companyName: prev.companyName || businessUser.companyName || '',
      companyNameEn: prev.companyNameEn || businessUser.companyNameEn || '',
      companyNameJp: prev.companyNameJp || businessUser.companyNameJp || '',
      headquarters: prev.headquarters || businessUser.address || '',
      headquartersEn: prev.headquartersEn || businessUser.addressEn || '',
      headquartersJp: prev.headquartersJp || businessUser.addressJp || '',
    }));
  }, [businessUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, parseLoading]);

  const sendMessage = async (text) => {
    const message = String(text ?? '').trim();
    if (!message || !sessionId || loading || parseLoading) return;
    setError('');
    setInput('');
    setMessages((prev) => [...prev, {
      id: createMessageId(),
      role: 'user',
      kind: 'text',
      content: message,
      ts: Date.now(),
    }]);
    setLoading(true);
    try {
      const data = await apiService.jdBuilderChat({ session_id: sessionId, message });
      applySessionResponse(data);
    } catch (err) {
      setError(err?.message || 'Gửi tin nhắn thất bại.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUploadClick = () => {
    if (parseLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e) => {
    const input = e.target;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file || (file.size !== undefined && file.size <= 0)) return;

    parseAbortRef.current?.abort();
    const ac = new AbortController();
    parseAbortRef.current = ac;

    const uploadMsgId = createMessageId();
    const fileLabel = file.name || 'JD file';
    const sizeLabel = formatFileSize(file.size);

    setError('');
    setMessages((prev) => [...prev, {
      id: uploadMsgId,
      role: 'user',
      kind: 'file_upload',
      localOnly: true,
      fileName: fileLabel,
      fileSize: file.size,
      status: 'parsing',
      content: `Đã tải lên: ${fileLabel}${sizeLabel ? ` (${sizeLabel})` : ''}`,
      ts: Date.now(),
    }]);
    setParseLoading(true);

    try {
      const parsed = await parseJdFile(file, ac.signal);
      applyDraftToPreview(parsed);
      setJdOriginalFile(file);
      const stored = await fileToStoredJd(file);
      setJdOriginalStored(stored);

      setMessages((prev) => prev.map((m) => (
        m.id === uploadMsgId ? { ...m, status: 'done' } : m
      )));

      const titleHint = parsed?.title?.vi || parsed?.title || parsed?.title_vi || '';
      setMessages((prev) => [...prev, {
        id: createMessageId(),
        role: 'assistant',
        kind: 'parse_result',
        localOnly: true,
        success: true,
        content: titleHint
          ? `Đã phân tích JD thành công từ file "${fileLabel}".\nVị trí: ${titleHint}\nBấm Lưu job để lưu JD, chat và file gốc.`
          : `Đã phân tích JD thành công từ file "${fileLabel}".\nBấm Lưu job để lưu JD, chat và file gốc.`,
        ts: Date.now(),
      }]);
      setRightTab('template');
    } catch (err) {
      const aborted =
        err?.name === 'AbortError' ||
        ac.signal.aborted ||
        (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
      if (aborted) return;

      setMessages((prev) => prev.map((m) => (
        m.id === uploadMsgId ? { ...m, status: 'error' } : m
      )));
      setMessages((prev) => [...prev, {
        id: createMessageId(),
        role: 'assistant',
        kind: 'parse_result',
        localOnly: true,
        success: false,
        content: `Không thể phân tích file "${fileLabel}".\n${err?.message || 'Vui lòng thử lại với file PDF/DOC/DOCX khác.'}`,
        ts: Date.now(),
      }]);
    } finally {
      if (parseAbortRef.current === ac) {
        parseAbortRef.current = null;
        setParseLoading(false);
      }
    }
  };

  const handleSaveJob = async () => {
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const snapshot = getFormSnapshot();
      const requestData = buildBusinessJobPayloadFromFormState(snapshot, { status: 0 });
      let jdFile = jdOriginalFile;
      if (!jdFile && jdOriginalStored) {
        jdFile = storedJdToFile(jdOriginalStored);
      }
      const payload = wrapBusinessJobPayloadWithJdFile(requestData, jdFile);
      const response = savedJobId
        ? await apiService.updateBusinessJob(savedJobId, payload)
        : await apiService.createBusinessJob(payload);

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể lưu job');
      }

      const newJobId = savedJobId || response.data?.job?.id;
      if (newJobId) {
        const isCreate = !savedJobId;
        apiService.syncJobVector(newJobId).catch(() => {});
        setSavedJobId(newJobId);
        const thread = await persistThread({ jobId: newJobId });
        onJobSaved?.({ jobId: newJobId, thread, isCreate });
        setDetailRefreshKey((k) => k + 1);
        setRightTab('detail');
      }
    } catch (err) {
      setError(err?.message || 'Không thể lưu job');
    } finally {
      setSaving(false);
    }
  };

  const handleNewSession = useCallback(async () => {
    parseAbortRef.current?.abort();
    parseAbortRef.current = null;
    setParseLoading(false);
    storeSessionId('');
    setSessionId('');
    sessionStartedRef.current = false;
    setMessages([]);
    setQuickReplies([]);
    setMissingFields([]);
    setCanFinalize(false);
    setError('');
    setActiveThreadId(null);
    setSavedJobId(null);
    setJdOriginalFile(null);
    setJdOriginalStored(null);
    const fresh = createEmptyJdFormState();
    setFormData(fresh.formData);
    setRecruitingCompany({
      ...fresh.recruitingCompany,
      companyName: businessUser?.companyName || companyName || '',
      companyNameEn: businessUser?.companyNameEn || '',
      companyNameJp: businessUser?.companyNameJp || '',
      headquarters: businessUser?.address || '',
      headquartersEn: businessUser?.addressEn || '',
      headquartersJp: businessUser?.addressJp || '',
    });
    setWorkingLocations(fresh.workingLocations);
    setWorkingLocationDetails(fresh.workingLocationDetails);
    setSalaryRanges(fresh.salaryRanges);
    setSalaryRangeDetails(fresh.salaryRangeDetails);
    setRequirements(fresh.requirements);
    setWorkingHours(fresh.workingHours);
    setWorkingHourDetails(fresh.workingHourDetails);
    setOvertimeAllowances(fresh.overtimeAllowances);
    setOvertimeAllowanceDetails(fresh.overtimeAllowanceDetails);
    setJobBenefitRows(fresh.jobBenefitRows);
    setHighlightKeys(fresh.highlightKeys);
    setJobValues(simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '').jobValues);
    setFormData((prev) => ({ ...prev, jobCommissionType: 'percent' }));
    setJdTemplateSyncKey((k) => k + 1);
    setRightTab('template');
    await startSession();
    inputRef.current?.focus();
  }, [businessUser, companyName, startSession]);

  useImperativeHandle(ref, () => ({
    startNewSession: handleNewSession,
    loadThread,
  }), [handleNewSession, loadThread]);

  const handleTranslateCurrentTabInputs = useCallback(async () => {
    try {
      setTranslatingInputs(true);
      setError('');
      const payload = buildJdTranslationPayload({
        languageTab,
        formData: formDataRef.current,
        recruitingCompany: recruitingCompanyRef.current,
        highlightKeys,
        jobBenefitRows,
        requirements,
        workingHourDetails,
        workingHours,
        workingLocations,
        workingLocationDetails,
        salaryRanges,
        salaryRangeDetails,
        overtimeAllowanceDetails,
      });
      const translated = await translateJdViaApi(payload);
      applyTranslatedJd(translated, {
        setFormData,
        setRecruitingCompany,
        setRequirements,
        setWorkingLocationDetails,
        setSalaryRangeDetails,
        setWorkingHours,
        setOvertimeAllowanceDetails,
        setJobBenefitRows,
        setLanguageTab,
        setHighlightKeys,
        setJdTemplateSyncKey,
        getFormData: () => formDataRef.current,
      });
    } catch (err) {
      console.error('Translate JD inputs error:', err);
      setError(err?.message || 'Không dịch được dữ liệu.');
    } finally {
      setTranslatingInputs(false);
    }
  }, [
    languageTab,
    highlightKeys,
    jobBenefitRows,
    requirements,
    workingHourDetails,
    workingHours,
    workingLocations,
    workingLocationDetails,
    salaryRanges,
    salaryRangeDetails,
    overtimeAllowanceDetails,
  ]);

  if (bootLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang khởi tạo trợ lý AI...
      </div>
    );
  }

  const showEmptyGreeting = messages.length === 0 && !loading && !parseLoading;
  const compactUi = Boolean(embedded);

  const renderMessageContent = (msg) => {
    if (msg.kind === 'file_upload') {
      return (
        <div className="flex items-start gap-2">
          <div className={`${compactUi ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center shrink-0 ${
            msg.status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
          }`}
          >
            {msg.status === 'parsing'
              ? <Loader2 className={`${compactUi ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
              : <FileText className={`${compactUi ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
          </div>
          <div className="min-w-0">
            <p className={`font-medium text-slate-800 ${compactUi ? 'text-[12px]' : ''}`}>{msg.fileName || 'JD file'}</p>
            {msg.fileSize ? (
              <p className="text-[10px] text-slate-400 mt-0.5">{formatFileSize(msg.fileSize)}</p>
            ) : null}
            <p className={`${compactUi ? 'text-[11px]' : 'text-[12px]'} text-slate-600 mt-0.5`}>{msg.content}</p>
            {msg.status === 'parsing' && (
              <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang phân tích file...
              </p>
            )}
            {msg.status === 'done' && (
              <p className="text-[11px] text-emerald-600 mt-1">Phân tích hoàn tất</p>
            )}
            {msg.status === 'error' && (
              <p className="text-[11px] text-rose-600 mt-1">Phân tích thất bại</p>
            )}
          </div>
        </div>
      );
    }

    if (msg.kind === 'parse_result') {
      return (
        <div className={`${compactUi ? 'rounded-lg px-2.5 py-1.5' : 'rounded-xl px-3 py-2'} ${
          msg.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
        }`}
        >
          <p className={`${compactUi ? 'text-[11px]' : 'text-[13px]'} leading-relaxed whitespace-pre-wrap ${
            msg.success ? 'text-emerald-900' : 'text-rose-900'
          }`}
          >
            {msg.content}
          </p>
        </div>
      );
    }

    return msg.content;
  };

  return (
    <div className={`flex flex-col h-full min-h-0 min-w-0 overflow-hidden ${embedded ? 'bg-white' : ''}`}>
      {/* Toolbar */}
      <div className={`shrink-0 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-100 bg-white ${
        compactUi ? 'px-2 py-1.5' : 'px-2 py-2 lg:px-3 lg:py-2.5 gap-y-1.5 lg:gap-x-3 lg:gap-y-2'
      }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className={`font-semibold text-slate-800 flex items-center gap-1 ${
            compactUi ? 'text-xs' : 'text-xs lg:text-base lg:gap-1.5'
          }`}
          >
            <Sparkles className={`${compactUi ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 lg:w-4 lg:h-4'} text-violet-500 shrink-0`} />
            Tạo JD với AI
          </h2>
          <p className={`text-slate-500 truncate ${compactUi ? 'text-[9px]' : 'text-[10px] lg:text-xs'}`}>
            Chat với AI · xem trước template · lưu JD
          </p>
        </div>
        <div className={`flex flex-wrap items-center justify-end shrink-0 ${compactUi ? 'gap-1' : 'gap-1 lg:gap-2'}`}>
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setRightTab('chat')}
              className={`px-2 py-0.5 font-semibold rounded-md transition-colors lg:hidden ${
                compactUi ? 'text-[9px]' : 'text-[9px] lg:text-[10px] lg:px-2.5 lg:py-1'
              } ${rightTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setRightTab('template')}
              className={`px-2 py-0.5 font-semibold rounded-md transition-colors ${
                compactUi ? 'text-[9px]' : 'text-[9px] lg:text-[10px] lg:px-2.5 lg:py-1'
              } ${rightTab === 'template' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Template
            </button>
            <button
              type="button"
              onClick={() => setRightTab('detail')}
              className={`px-2 py-0.5 font-semibold rounded-md transition-colors ${
                compactUi ? 'text-[9px]' : 'text-[9px] lg:text-[10px] lg:px-2.5 lg:py-1'
              } ${rightTab === 'detail' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Chi tiết job
            </button>
          </div>
          <button
            type="button"
            onClick={handleNewSession}
            disabled={loading || parseLoading || saving || translatingInputs}
            className={`font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 ${
              compactUi ? 'text-[9px] px-1 py-0.5' : 'text-[9px] lg:text-[10px] px-1.5 py-0.5 lg:px-2 lg:py-1'
            }`}
          >
            Phiên mới
          </button>
          <button
            type="button"
            disabled={saving || parseLoading}
            onClick={handleSaveJob}
            className={`inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold ${
              compactUi ? 'text-[10px] py-1 px-2' : 'text-[10px] lg:text-xs py-1.5 px-2 lg:py-2 lg:px-3 lg:rounded-lg'
            }`}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Lưu job
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 mx-3 mt-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[11px] px-3 py-2">
          {error}
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="shrink-0 mx-3 mt-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-[10px] px-3 py-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="font-semibold">Còn thiếu:</span>
          {missingFields.map((f) => (
            <span key={f}>• {f}</span>
          ))}
        </div>
      )}

      {/* Desktop: chat | template/detail — preview rộng hơn chat */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 gap-0 overflow-hidden ${
        compactUi
          ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]'
          : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
      }`}
      >
        {/* Chat column */}
        <div className={`flex flex-col min-h-0 min-w-0 border-r border-slate-100 ${
          rightTab !== 'chat' ? 'hidden lg:flex' : 'flex'
        }`}
        >
          <div className={`flex-1 min-h-0 overflow-y-auto ${compactUi ? 'px-2.5 py-2.5' : 'px-2 py-3 lg:px-4 lg:py-5'}`}>
            {showEmptyGreeting ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 lg:px-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-3 lg:mb-4">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h3 className="text-base lg:text-xl font-semibold text-slate-800 mb-1.5 lg:mb-2">Bắt đầu từ đâu?</h3>
                <p className="text-xs lg:text-sm text-slate-500 max-w-md leading-relaxed">
                  Mô tả vị trí cần tuyển, dán JD gốc hoặc trả lời câu hỏi của AI.
                  JD được cập nhật trực tiếp ở tab Template.
                </p>
              </div>
            ) : (
              <div className={`w-full ${compactUi ? 'space-y-2' : 'space-y-2.5 lg:space-y-4'} ${embedded ? '' : 'max-w-2xl mx-auto'}`}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const bubblePad = compactUi ? 'px-2.5 py-1.5 rounded-lg' : 'px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl lg:rounded-2xl';
                  const msgText = compactUi ? 'text-[11px]' : 'text-[12px] lg:text-[13px]';
                  const avatar = compactUi ? 'w-6 h-6' : 'w-7 h-7 lg:w-8 lg:h-8';
                  const iconInAvatar = compactUi ? 'w-3 h-3' : 'w-3.5 h-3.5 lg:w-4 lg:h-4';
                  return (
                    <div key={msg.id || msg.content} className={`flex gap-1.5 ${compactUi ? '' : 'lg:gap-3'} ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`${avatar} rounded-full flex items-center justify-center shrink-0 ${
                          isUser ? 'bg-slate-800 text-white' : 'bg-violet-100 text-violet-600'
                        }`}
                      >
                        {isUser ? <User className={iconInAvatar} /> : <Bot className={iconInAvatar} />}
                      </div>
                      <div
                        className={`max-w-[85%] ${msgText} leading-relaxed whitespace-pre-wrap ${
                          msg.kind === 'parse_result'
                            ? 'w-full max-w-full'
                            : isUser
                              ? `${bubblePad} bg-slate-100 text-slate-800`
                              : `${bubblePad} bg-transparent text-slate-800`
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-2 lg:gap-3 items-center text-slate-400 text-[11px] lg:text-[12px] w-full">
                    <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" />
                    AI đang suy nghĩ...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {quickReplies.length > 0 && (
            <div className="shrink-0 px-2 lg:px-4 pb-1.5 lg:pb-2 flex flex-wrap gap-1 lg:gap-1.5 justify-center">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(q)}
                  className="text-[10px] lg:text-[11px] font-medium px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ChatGPT-style input pill */}
          <div className={`shrink-0 ${compactUi ? 'p-2 pt-0.5' : 'p-2 pt-0.5 lg:p-3 lg:pt-1'}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept={JD_PARSE_ACCEPT}
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className={`w-full flex items-end gap-1.5 border border-slate-200 bg-white shadow-sm focus-within:border-slate-300 focus-within:shadow-md transition-shadow ${
              compactUi ? 'rounded-2xl px-2 py-1.5' : 'rounded-2xl lg:rounded-3xl px-2 py-1.5 lg:px-3 lg:py-2 gap-1.5 lg:gap-2'
            } ${embedded ? '' : 'max-w-2xl mx-auto'}`}
            >
              <button
                type="button"
                onClick={handleFileUploadClick}
                disabled={parseLoading}
                className={`${compactUi ? 'w-7 h-7' : 'w-7 h-7 lg:w-8 lg:h-8'} rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0 disabled:opacity-40`}
                title="Tải file JD (PDF, DOC, DOCX)"
              >
                {parseLoading ? <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" /> : <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Mô tả vị trí cần tuyển..."
                disabled={parseLoading}
                className={`flex-1 resize-none bg-transparent outline-none text-slate-800 placeholder:text-slate-400 max-h-28 disabled:opacity-50 ${
                  compactUi ? 'text-[11px] py-1' : 'text-[12px] lg:text-[13px] py-1 lg:py-1.5'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              <button
                type="button"
                disabled={loading || parseLoading || !input.trim() || !sessionId}
                onClick={() => sendMessage(input)}
                className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
              >
                <Send className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
              </button>
            </div>
            <p className="text-center text-[8px] lg:text-[9px] text-slate-400 mt-1 lg:mt-2 leading-tight px-1">
              Enter để gửi · Shift+Enter xuống dòng · Nút + để tải JD (PDF/DOC/DOCX)
            </p>
          </div>
        </div>

        {/* Template / job detail column */}
        <div className={`flex flex-col min-h-0 min-w-0 bg-slate-50/50 ${
          rightTab === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}
        >
          {rightTab === 'detail' ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <BusinessJobDetailEmbed key={`${savedJobId || 'new'}-${detailRefreshKey}`} jobId={savedJobId} />
            </div>
          ) : (
            <>
              <div className={`shrink-0 border-b border-slate-100 bg-white space-y-1.5 ${compactUi ? 'px-2 py-1.5' : 'px-2 py-1.5 lg:px-3 lg:py-2 lg:space-y-2'}`}>
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`font-bold text-slate-700 ${compactUi ? 'text-[10px]' : 'text-[10px] lg:text-[11px]'}`}>Xem trước JD</span>
                  <span className={`text-slate-400 ${compactUi ? 'text-[8px]' : 'text-[8px] lg:text-[9px]'}`}>Cập nhật theo chat</span>
                </div>
                <div
                  className={`flex flex-wrap items-center ${compactUi ? 'gap-1' : 'gap-1.5 lg:gap-2'}`}
                  role="tablist"
                  aria-label={languageTab === 'jp' ? 'フォーム言語' : 'Form language'}
                >
                  <div className="flex min-w-0 flex-1 basis-[min(100%,14rem)] gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {JD_LANGUAGE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={languageTab === tab.id}
                        onClick={() => setLanguageTab(tab.id)}
                        className={`min-w-0 flex-1 px-1.5 py-1 lg:px-2 lg:py-1.5 rounded-md text-[9px] lg:text-[10px] font-semibold transition-colors ${
                          languageTab === tab.id
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleTranslateCurrentTabInputs}
                    disabled={translatingInputs || parseLoading}
                    className="shrink-0 px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md lg:rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-[9px] lg:text-[10px] font-semibold flex items-center gap-1 lg:gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    title={
                      languageTab === 'jp'
                        ? '現在のタブから他の2言語へ入力欄を翻訳'
                        : languageTab === 'en'
                          ? 'Translate input fields from current tab to the other two tabs'
                          : 'Dịch các ô nhập từ tab hiện tại sang 2 tab còn lại'
                    }
                  >
                    {translatingInputs
                      ? <Loader2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 animate-spin shrink-0" />
                      : <Languages className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />}
                    <span>
                      {translatingInputs
                        ? (languageTab === 'jp' ? '翻訳中...' : languageTab === 'en' ? 'Translating...' : 'Đang dịch...')
                        : (languageTab === 'jp' ? '翻訳' : languageTab === 'en' ? 'Translate' : 'Dịch')}
                    </span>
                  </button>
                </div>
              </div>
              <div className="shrink-0 px-2 lg:px-3 pt-2 pb-1 border-b border-slate-100 bg-slate-50/80">
                <JobCommissionEditor
                  jobCommissionType={formData.jobCommissionType || 'percent'}
                  onCommissionTypeChange={(v) => setFormData((prev) => ({ ...prev, jobCommissionType: v }))}
                  jobValues={jobValues}
                  onJobValuesChange={setJobValues}
                  commissionSeedJob={savedJobId ? { id: savedJobId, jobCommissionType: formData.jobCommissionType, jobValues } : null}
                  salaryCurrency={formData.salaryCurrency}
                  onSalaryCurrencyChange={(v) => setFormData((prev) => ({ ...prev, salaryCurrency: v }))}
                />
              </div>
              <div className={`flex-1 overflow-y-auto min-h-0 min-w-0 bg-white ${compactUi ? '[zoom:0.92]' : ''}`}>
                <JdTemplate
                  key={jdTemplateSyncKey}
                  lang={languageTab}
                  formData={formData}
                  setFormData={setFormData}
                  recruitingCompany={recruitingCompany}
                  setRecruitingCompany={setRecruitingCompany}
                  categories={categories}
                  jobValues={[]}
                  workingLocations={workingLocations}
                  setWorkingLocations={setWorkingLocations}
                  salaryRanges={salaryRanges}
                  setSalaryRanges={setSalaryRanges}
                  salaryRangeDetails={salaryRangeDetails}
                  setSalaryRangeDetails={setSalaryRangeDetails}
                  workingLocationDetails={workingLocationDetails}
                  setWorkingLocationDetails={setWorkingLocationDetails}
                  overtimeAllowances={overtimeAllowances}
                  overtimeAllowanceDetails={overtimeAllowanceDetails}
                  setOvertimeAllowanceDetails={setOvertimeAllowanceDetails}
                  requirements={requirements}
                  setRequirements={setRequirements}
                  workingHours={workingHours}
                  workingHourDetails={workingHourDetails}
                  setWorkingHourDetails={setWorkingHourDetails}
                  jobBenefitRows={jobBenefitRows}
                  setJobBenefitRows={setJobBenefitRows}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default JobAiBuilderPanel;
