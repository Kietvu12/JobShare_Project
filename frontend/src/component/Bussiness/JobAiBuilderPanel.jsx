import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, FileText, Languages, Loader2, Plus, Save, Send, User,
} from 'lucide-react';
import apiService from '../../services/api';
import useBusinessUser from '../../hooks/useBusinessUser';
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy';
import { useLanguage } from '../../context/LanguageContext';
import { getJdBuilderStatusOptions } from '../../i18n/businessAppI18n';
import JdTemplate from '../Admin/AddJob/JdTemplate';
import JobCreatedNextStepsModal, { navigateJobCreatedNextStep } from './JobCreatedNextStepsModal';
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
  getCurrentBusinessUserId,
  storedJdToFile,
  upsertJobBuilderThread,
} from '../../utils/jobBuilderThreadStorage';
import { JD_PARSE_ACCEPT, formatFileSize, parseJdFile } from '../../utils/parseJdFile';
import {
  applyJdFormStatePatch,
  applyParsedJdToFormState,
  createEmptyJdFormState,
  normalizeJdDraft,
} from '../../utils/applyParsedJdToFormState';

export const JD_BUILDER_SESSION_KEY = 'wjs_jd_builder_session_id';

function jdBuilderSessionStorageKey() {
  const bid = getCurrentBusinessUserId();
  return bid ? `${JD_BUILDER_SESSION_KEY}:${bid}` : JD_BUILDER_SESSION_KEY;
}

function readStoredSessionId() {
  try {
    return sessionStorage.getItem(jdBuilderSessionStorageKey()) || '';
  } catch {
    return '';
  }
}

function storeSessionId(id) {
  try {
    const key = jdBuilderSessionStorageKey();
    if (id) sessionStorage.setItem(key, id);
    else sessionStorage.removeItem(key);
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
  hideToolbarTitle = false,
  skipAutoBoot = false,
  activeThreadId: activeThreadIdProp = null,
  savedJobId: savedJobIdProp = null,
  onJobSaved,
  onThreadPersist,
  showNextStepsOnCreate = true,
}, ref) {
  const navigate = useNavigate();
  const { companyName, user: businessUser } = useBusinessUser();
  const { language: uiLanguage } = useLanguage();
  const copy = useBusinessAppCopy();
  const jdCopy = copy.jdBuilder;
  const jdCopyRef = useRef(jdCopy);
  const jobStatusOptions = useMemo(
    () => getJdBuilderStatusOptions(uiLanguage).map((opt) => ({ value: opt.value, label: opt.label })),
    [uiLanguage],
  );
  useEffect(() => { jdCopyRef.current = jdCopy; }, [jdCopy]);
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
  const [jobValues, setJobValues] = useState([]);
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
  const [canFinalize, setCanFinalize] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [translatingInputs, setTranslatingInputs] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mobileBuilderPane, setMobileBuilderPane] = useState('chat');
  const [activeThreadId, setActiveThreadId] = useState(activeThreadIdProp || null);
  const [savedJobId, setSavedJobId] = useState(savedJobIdProp || null);
  const [jdOriginalFile, setJdOriginalFile] = useState(null);
  const [jdOriginalStored, setJdOriginalStored] = useState(null);
  const [nextStepsModal, setNextStepsModal] = useState({ open: false, jobId: null });

  useEffect(() => { if (activeThreadIdProp) setActiveThreadId(activeThreadIdProp); }, [activeThreadIdProp]);
  useEffect(() => { setSavedJobId(savedJobIdProp ?? null); }, [savedJobIdProp]);

  useEffect(() => {
    const sid = readStoredSessionId();
    setSessionId(sid);
    sessionStartedRef.current = Boolean(sid);
  }, [businessUser?.id]);

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
    const t = jdCopyRef.current;
    const title = formData.title || formData.titleEn || formData.titleJp || t.defaultTitle;
    // Auto-save không kèm file gốc (base64). Chỉ gửi khi overrides có jdOriginalStored.
    const payload = {
      id: activeThreadId || createJobBuilderThreadId(),
      jobId: savedJobId,
      title,
      messages,
      sessionId,
      formSnapshot: getFormSnapshot(),
      jdOriginalStored: null,
      ...overrides,
    };
    if (
      Object.prototype.hasOwnProperty.call(overrides, 'jdOriginalStored')
      && overrides.jdOriginalStored === undefined
      && jdOriginalFile
    ) {
      payload.jdOriginalStored = await fileToStoredJd(jdOriginalFile);
    }
    return payload;
  }, [activeThreadId, savedJobId, formData, messages, sessionId, getFormSnapshot, jdOriginalFile]);

  const persistThread = useCallback(async (overrides = {}) => {
    const payload = await buildThreadPayload(overrides);
    if (!activeThreadId) setActiveThreadId(payload.id);
    try {
      const saved = await upsertJobBuilderThread(payload);
      if (saved?.id) {
        const clientId = payload.id && String(payload.id).startsWith('thread-')
          ? String(payload.id)
          : (activeThreadId && String(activeThreadId).startsWith('thread-') ? String(activeThreadId) : null);
        setActiveThreadId(String(saved.id));
        onThreadPersist?.(clientId ? { ...saved, replaceClientId: clientId } : saved);
      } else {
        onThreadPersist?.(payload);
      }
      return saved;
    } catch (err) {
      console.error('Lưu phiên JD builder thất bại:', err);
      setError(err?.message || jdCopyRef.current.errors.saveThread);
      onThreadPersist?.({
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      throw err;
    }
  }, [activeThreadId, buildThreadPayload, onThreadPersist]);

  /**
   * Giống localStorage cũ: có box chat là phải có bản ghi ngay (không đợi tin nhắn).
   * Trả về thread đã lưu (hoặc stub local nếu API lỗi).
   */
  const ensureThreadSaved = useCallback(async (overrides = {}) => {
    const clientId = overrides.id
      || (activeThreadId && String(activeThreadId))
      || createJobBuilderThreadId();
    if (!activeThreadId || String(activeThreadId) !== String(clientId)) {
      setActiveThreadId(String(clientId));
    }

    const title =
      overrides.title
      || formDataRef.current?.title
      || formDataRef.current?.titleEn
      || formDataRef.current?.titleJp
      || jdCopyRef.current.defaultTitle;

    const optimistic = {
      id: String(clientId),
      jobId: overrides.jobId !== undefined ? overrides.jobId : savedJobId,
      title,
      messages: overrides.messages ?? messages,
      sessionId: overrides.sessionId !== undefined ? overrides.sessionId : sessionId,
      formSnapshot: overrides.formSnapshot !== undefined ? overrides.formSnapshot : getFormSnapshot(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Hiện box trên sidebar ngay lập tức
    onThreadPersist?.(optimistic);

    try {
      const saved = await upsertJobBuilderThread({
        id: clientId,
        jobId: optimistic.jobId ?? null,
        title: optimistic.title,
        messages: optimistic.messages || [],
        sessionId: optimistic.sessionId || null,
        formSnapshot: optimistic.formSnapshot,
      });
      if (saved?.id) {
        setActiveThreadId(String(saved.id));
        onThreadPersist?.({
          ...saved,
          replaceClientId: String(clientId).startsWith('thread-') ? String(clientId) : undefined,
        });
        return saved;
      }
      return optimistic;
    } catch (err) {
      console.error('ensureThreadSaved failed:', err);
      setError(err?.message || jdCopyRef.current.errors.saveThread);
      return optimistic;
    }
  }, [activeThreadId, savedJobId, messages, sessionId, getFormSnapshot, onThreadPersist]);

  useEffect(() => {
    if (bootLoading) return undefined;
    // Đã có box (activeThreadId) hoặc đang chat → auto-save như localStorage
    if (!activeThreadId && messages.length === 0 && !formData.title && !sessionId) {
      return undefined;
    }
    const timer = setTimeout(() => {
      persistThread().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [bootLoading, messages, formData, sessionId, activeThreadId, persistThread]);

  const applyFormSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    if (snapshot.formData) {
      setFormData((prev) => ({
        ...prev,
        ...snapshot.formData,
        status: snapshot.formData.status ?? prev?.status ?? 0,
      }));
    }
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
    setCanFinalize(Boolean(data?.can_finalize));
    if (data?.draft) applyDraftToPreview(data.draft);
  }, [applyDraftToPreview]);

  const startSession = useCallback(async () => {
    if (sessionStartedRef.current && sessionId) return null;
    setError('');
    setLoading(true);
    try {
      const t = jdCopyRef.current;
      const data = await apiService.jdBuilderStart({
        company_name: companyName || businessUser?.companyName || t.defaultCompany,
        locale: uiLanguage,
        initial_brief: t.ai.initialBrief,
      });
      sessionStartedRef.current = true;
      let initialMessages = [];
      if (data?.reply) {
        initialMessages = [{
          id: createMessageId(),
          role: 'assistant',
          kind: 'text',
          content: data.reply,
          ts: Date.now(),
        }];
        setMessages(initialMessages);
      }
      applySessionResponse(data);
      return { data, initialMessages, sessionId: data?.session_id || null };
    } catch (err) {
      setError(err?.message || jdCopyRef.current.errors.startChat);
      sessionStartedRef.current = false;
      return null;
    } finally {
      setLoading(false);
      setBootLoading(false);
    }
  }, [applySessionResponse, businessUser?.companyName, companyName, sessionId, uiLanguage]);

  const applySessionResponseRef = useRef(applySessionResponse);
  const startSessionRef = useRef(startSession);
  const ensureThreadSavedRef = useRef(null);
  useEffect(() => { applySessionResponseRef.current = applySessionResponse; }, [applySessionResponse]);
  useEffect(() => { startSessionRef.current = startSession; }, [startSession]);
  useEffect(() => { ensureThreadSavedRef.current = ensureThreadSaved; }, [ensureThreadSaved]);

  const loadThread = useCallback(async (thread) => {
    if (!thread) return;
    setBootLoading(true);
    setError('');
    try {
      setActiveThreadId(thread.id);
      setSavedJobId(thread.jobId || null);
      applyFormSnapshot(thread.formSnapshot);
      setJdOriginalStored(thread.jdOriginalStored || null);
      setJdOriginalFile(storedJdToFile(thread.jdOriginalStored));
      if (thread.jobId) {
        try {
          const res = await apiService.getBusinessJobById(thread.jobId);
          const st = res?.data?.job?.status;
          if (res?.success && st != null) {
            setFormData((prev) => ({ ...prev, status: st }));
          }
        } catch {
          /* giữ status từ snapshot nếu có */
        }
      }

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
    } finally {
      setBootLoading(false);
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

      if (embedded || skipAutoBoot) {
        if (!cancelled && !skipAutoBoot) setBootLoading(false);
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

      // Parent (JobManagement) quyết định loadThread / startNewSession → lưu DB.
      // Không upsert ở đây để tránh tạo phiên rác mỗi lần F5 khi đã có thread.

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
      // Lưu phiên sau mỗi tin nhắn
      persistThread().catch(() => {});
    } catch (err) {
      setError(err?.message || jdCopyRef.current.errors.sendMessage);
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
    const fileLabel = file.name || jdCopyRef.current.panel.jdFileFallback;
    const sizeLabel = formatFileSize(file.size);

    // Có box chat / bắt đầu upload = lưu DB ngay (giống localStorage)
    const uploadMsg = {
      id: uploadMsgId,
      role: 'user',
      kind: 'file_upload',
      localOnly: true,
      fileName: fileLabel,
      fileSize: file.size,
      status: 'parsing',
      content: jdCopyRef.current.messages.uploaded(fileLabel, sizeLabel),
      ts: Date.now(),
    };
    setError('');
    setMessages((prev) => [...prev, uploadMsg]);
    setParseLoading(true);

    await ensureThreadSaved({
      messages: [...messages, uploadMsg],
      title: formDataRef.current?.title || formDataRef.current?.titleJp || formDataRef.current?.titleEn || fileLabel || jdCopyRef.current.defaultTitle,
    });

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
      const msgs = jdCopyRef.current.messages;
      const successContent = titleHint
        ? msgs.parseSuccessWithTitle(fileLabel, titleHint)
        : msgs.parseSuccess(fileLabel);
      const successMsg = {
        id: createMessageId(),
        role: 'assistant',
        kind: 'parse_result',
        localOnly: true,
        success: true,
        content: successContent,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, successMsg]);

      const nextTitle =
        (typeof titleHint === 'string' && titleHint.trim())
          || formDataRef.current?.title
          || formDataRef.current?.titleJp
          || formDataRef.current?.titleEn
          || fileLabel
          || jdCopyRef.current.defaultTitle;
      const snapshot = getFormSnapshot();
      if (titleHint && typeof titleHint === 'string') {
        snapshot.formData = {
          ...(snapshot.formData || {}),
          titleJp: snapshot.formData?.titleJp || titleHint,
          title: snapshot.formData?.title || titleHint,
        };
      }
      await ensureThreadSaved({
        title: nextTitle,
        messages: [
          {
            ...uploadMsg,
            status: 'done',
          },
          successMsg,
        ],
        formSnapshot: snapshot,
      });
    } catch (err) {
      const aborted =
        err?.name === 'AbortError' ||
        ac.signal.aborted ||
        (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
      if (aborted) return;

      setMessages((prev) => prev.map((m) => (
        m.id === uploadMsgId ? { ...m, status: 'error' } : m
      )));
      const failMsg = {
        id: createMessageId(),
        role: 'assistant',
        kind: 'parse_result',
        localOnly: true,
        success: false,
        content: jdCopyRef.current.messages.parseError(
          fileLabel,
          err?.message || jdCopyRef.current.errors.parseFallback,
        ),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, failMsg]);
      await ensureThreadSaved({
        messages: [
          ...messages,
          { ...uploadMsg, status: 'error' },
          failMsg,
        ],
      }).catch(() => {});
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
      const requestData = buildBusinessJobPayloadFromFormState(snapshot);
      let jdFile = jdOriginalFile;
      if (!jdFile && jdOriginalStored) {
        jdFile = storedJdToFile(jdOriginalStored);
      }
      const payload = wrapBusinessJobPayloadWithJdFile(requestData, jdFile);
      const response = savedJobId
        ? await apiService.updateBusinessJob(savedJobId, payload)
        : await apiService.createBusinessJob(payload);

      if (!response?.success) {
        throw new Error(response?.message || jdCopyRef.current.errors.saveJob);
      }

      const newJobId = savedJobId || response.data?.job?.id;
      if (newJobId) {
        const isCreate = !savedJobId;
        apiService.syncJobVector(newJobId).catch(() => {});
        setSavedJobId(newJobId);
        const thread = await persistThread({ jobId: newJobId });
        onJobSaved?.({ jobId: newJobId, thread, isCreate });
        if (isCreate && showNextStepsOnCreate) {
          setNextStepsModal({ open: true, jobId: newJobId });
        }
      }
    } catch (err) {
      setError(err?.message || jdCopyRef.current.errors.saveJob);
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
    setCanFinalize(false);
    setError('');
    setSavedJobId(null);
    setJdOriginalFile(null);
    setJdOriginalStored(null);
    const fresh = createEmptyJdFormState();
    const recruiting = {
      ...fresh.recruitingCompany,
      companyName: businessUser?.companyName || companyName || '',
      companyNameEn: businessUser?.companyNameEn || '',
      companyNameJp: businessUser?.companyNameJp || '',
      headquarters: businessUser?.address || '',
      headquartersEn: businessUser?.addressEn || '',
      headquartersJp: businessUser?.addressJp || '',
    };
    setFormData(fresh.formData);
    setRecruitingCompany(recruiting);
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
    setJobValues([]);
    setJdTemplateSyncKey((k) => k + 1);

    // Box mới = lưu DB ngay (trước cả AI)
    const clientId = createJobBuilderThreadId();
    setActiveThreadId(clientId);
    const savedThread = await ensureThreadSaved({
      id: clientId,
      title: jdCopyRef.current.defaultTitle,
      jobId: null,
      messages: [],
      sessionId: null,
      formSnapshot: {
        formData: fresh.formData,
        recruitingCompany: recruiting,
        workingLocations: fresh.workingLocations,
        workingLocationDetails: fresh.workingLocationDetails,
        salaryRanges: fresh.salaryRanges,
        salaryRangeDetails: fresh.salaryRangeDetails,
        overtimeAllowances: fresh.overtimeAllowances,
        overtimeAllowanceDetails: fresh.overtimeAllowanceDetails,
        requirements: fresh.requirements,
        workingHours: fresh.workingHours,
        workingHourDetails: fresh.workingHourDetails,
        jobBenefitRows: fresh.jobBenefitRows,
        highlightKeys: fresh.highlightKeys,
        jobValues: [],
        languageTab: 'vi',
      },
    });

    const started = await startSession();
    if (started) {
      if (started.sessionId) {
        setSessionId(started.sessionId);
        storeSessionId(started.sessionId);
      }
      await ensureThreadSaved({
        id: savedThread?.id || clientId,
        title: jdCopyRef.current.defaultTitle,
        jobId: null,
        messages: started.initialMessages || [],
        sessionId: started.sessionId || null,
      });
    }
    inputRef.current?.focus();
    setBootLoading(false);
  }, [businessUser, companyName, startSession, ensureThreadSaved]);

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
      setError(err?.message || jdCopyRef.current.errors.translate);
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
        {jdCopy.panel.bootLoading}
      </div>
    );
  }

  const showEmptyGreeting = messages.length === 0 && !loading && !parseLoading;
  const compactUi = Boolean(embedded);
  const isEditingSavedJob = Boolean(savedJobId);
  const titleCls = compactUi ? 'biz-jd-title' : 'text-xs lg:text-base font-semibold text-slate-800';
  const bodyCls = compactUi ? 'biz-jd-body' : 'text-[12px] lg:text-[13px] text-slate-800';
  const mutedCls = compactUi ? 'biz-jd-muted' : 'text-[10px] lg:text-xs text-slate-500';
  const tabTextCls = compactUi ? 'biz-jd-body font-semibold' : 'text-[9px] lg:text-[10px] font-semibold';
  const iconCls = compactUi ? 'biz-jd-icon' : 'w-3.5 h-3.5 lg:w-4 lg:h-4';
  const hitCls = compactUi ? 'biz-jd-icon-hit' : 'w-7 h-7 lg:w-8 lg:h-8';

  const renderMessageContent = (msg) => {
    if (msg.kind === 'file_upload') {
      return (
        <div className="flex items-start gap-2">
          <div className={`${compactUi ? hitCls : 'w-9 h-9'} rounded-lg flex items-center justify-center shrink-0 border ${
            msg.status === 'error' ? 'border-rose-200 text-rose-600' : 'border-slate-200 text-[#0077B6]'
          }`}
          >
            {msg.status === 'parsing'
              ? <Loader2 className={`${iconCls} animate-spin`} />
              : <FileText className={iconCls} />}
          </div>
          <div className="min-w-0">
            <p className={`font-medium text-slate-800 ${compactUi ? bodyCls : ''}`}>{msg.fileName || jdCopy.panel.jdFileFallback}</p>
            {msg.fileSize ? (
              <p className={`${compactUi ? mutedCls : 'text-[10px] text-slate-400'} mt-0.5`}>{formatFileSize(msg.fileSize)}</p>
            ) : null}
            <p className={`${compactUi ? bodyCls : 'text-[12px] text-slate-600'} mt-0.5`}>{msg.content}</p>
            {msg.status === 'parsing' && (
              <p className={`${compactUi ? bodyCls : 'text-[11px]'} text-blue-600 mt-1 flex items-center gap-1`}>
                <Loader2 className={`${iconCls} animate-spin`} />
                {jdCopy.panel.parsingFile}
              </p>
            )}
            {msg.status === 'done' && (
              <p className={`${compactUi ? bodyCls : 'text-[11px]'} text-emerald-600 mt-1`}>{jdCopy.panel.parseDone}</p>
            )}
            {msg.status === 'error' && (
              <p className={`${compactUi ? bodyCls : 'text-[11px]'} text-rose-600 mt-1`}>{jdCopy.panel.parseFailed}</p>
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
          <p className={`${compactUi ? bodyCls : 'text-[13px]'} leading-relaxed whitespace-pre-wrap ${
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
    <>
      <JobCreatedNextStepsModal
        open={nextStepsModal.open}
        jobId={nextStepsModal.jobId}
        onClose={() => setNextStepsModal({ open: false, jobId: null })}
        onSelect={(stepNum, jobId) => {
          setNextStepsModal({ open: false, jobId: null });
          navigateJobCreatedNextStep(navigate, stepNum, jobId);
        }}
      />
    <div className={`flex flex-col h-full min-h-0 min-w-0 overflow-hidden ${embedded ? 'bg-white' : ''}`}>
      {/* Toolbar */}
      <div className={`shrink-0 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-100 bg-white ${
        compactUi ? 'px-1.5 py-1' : 'px-3 py-2 lg:px-4 lg:py-2.5 gap-y-1.5 lg:gap-x-3 lg:gap-y-2'
      }`}
      >
        {!hideToolbarTitle ? (
          <div className="min-w-0 flex-1">
            <h2 className={titleCls}>
              {isEditingSavedJob ? jdCopy.panel.editHeading : jdCopy.panel.createHeading}
            </h2>
            <p className={`truncate ${mutedCls}`}>
              {isEditingSavedJob ? jdCopy.panel.editSubheading : jdCopy.panel.createSubheading}
            </p>
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <div className={`flex flex-wrap items-center justify-end shrink-0 ${compactUi ? 'gap-1' : 'gap-1.5 lg:gap-2'}`}>
          {isEditingSavedJob && savedJobId ? (
            <button
              type="button"
              onClick={() => navigate(`/business/jobs/${savedJobId}`)}
              className={`inline-flex items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold ${
                compactUi ? `${bodyCls} py-0.5 px-1.5` : 'text-xs py-1.5 px-2.5 lg:py-2 lg:px-3'
              }`}
            >
              {jdCopy.panel.viewJobDetail}
            </button>
          ) : null}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileBuilderPane('chat')}
              className={`px-2 py-0.5 rounded-md transition-colors ${tabTextCls} ${
                mobileBuilderPane === 'chat' ? 'bg-slate-100 text-slate-800' : 'text-slate-500'
              }`}
            >
              {jdCopy.panel.chatTab}
            </button>
            <button
              type="button"
              onClick={() => setMobileBuilderPane('preview')}
              className={`px-2 py-0.5 rounded-md transition-colors ${tabTextCls} ${
                mobileBuilderPane === 'preview' ? 'bg-slate-100 text-slate-800' : 'text-slate-500'
              }`}
            >
              {jdCopy.panel.templateTab}
            </button>
          </div>
          <label className={`inline-flex items-center gap-1 shrink-0 ${compactUi ? '' : 'lg:gap-1.5'}`}>
            <span className={`${mutedCls} font-medium whitespace-nowrap hidden sm:inline`}>{jdCopy.panel.statusLabel}</span>
            <select
              value={String(formData.status ?? 0)}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: parseInt(e.target.value, 10) }))}
              className={`rounded-md border border-slate-200 bg-white text-slate-800 font-medium max-w-[9rem] truncate ${
                compactUi ? `${bodyCls} py-0.5 pl-1 pr-6` : 'text-[10px] lg:text-xs py-1 pl-1.5 pr-7 lg:py-1.5'
              }`}
              aria-label={jdCopy.panel.statusAria}
            >
              {jobStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving || parseLoading}
            onClick={handleSaveJob}
            className={`inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold ${
              compactUi ? `${bodyCls} text-white py-0.5 px-1.5` : 'text-[10px] lg:text-xs py-1.5 px-2 lg:py-2 lg:px-3 lg:rounded-lg'
            }`}
          >
            {saving ? <Loader2 className={`${iconCls} animate-spin`} /> : <Save className={iconCls} />}
            {isEditingSavedJob ? jdCopy.panel.saveUpdate : jdCopy.panel.saveCreate}
          </button>
        </div>
      </div>

      {error && (
        <div className={`shrink-0 mx-3 mt-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-3 py-2 ${compactUi ? bodyCls : 'text-[11px]'}`}>
          {error}
        </div>
      )}

      <div className={`flex-1 min-h-0 grid grid-cols-1 gap-0 overflow-hidden ${
        compactUi
          ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]'
          : 'lg:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]'
      }`}
      >
        {/* Chat column */}
        <div className={`flex h-full min-h-0 flex-col min-w-0 overflow-hidden border-r border-slate-100 ${
          mobileBuilderPane === 'preview' ? 'hidden lg:flex' : 'flex'
        }`}
        >
          <div className={`flex-1 min-h-0 overflow-y-auto ${compactUi ? 'px-2.5 py-2.5' : 'px-2 py-3 lg:px-4 lg:py-5'}`}>
            {showEmptyGreeting ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 lg:px-4">
                <h3 className={`${titleCls} mb-1.5 ${compactUi ? '' : 'lg:mb-2'}`}>
                  {isEditingSavedJob ? jdCopy.panel.greetingEdit : jdCopy.panel.greetingCreate}
                </h3>
                <p className={`${mutedCls} max-w-md leading-relaxed ${compactUi ? '' : 'text-xs lg:text-sm'}`}>
                  {isEditingSavedJob ? jdCopy.panel.greetingBodyEdit : jdCopy.panel.greetingBodyCreate}
                </p>
              </div>
            ) : (
              <div className={`w-full ${compactUi ? 'space-y-2' : 'space-y-2.5 lg:space-y-4'} ${embedded ? '' : 'max-w-2xl mx-auto'}`}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const bubblePad = compactUi ? 'px-2.5 py-1.5 rounded-lg' : 'px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl lg:rounded-2xl';
                  const msgText = compactUi ? bodyCls : 'text-[12px] lg:text-[13px] text-slate-800';
                  const avatar = compactUi ? hitCls : 'w-7 h-7 lg:w-8 lg:h-8';
                  const iconInAvatar = iconCls;
                  return (
                    <div key={msg.id || msg.content} className={`flex gap-1.5 ${compactUi ? '' : 'lg:gap-3'} ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`${avatar} rounded-full flex items-center justify-center shrink-0 border bg-transparent ${
                          isUser ? 'border-[#0077B6]/35 text-[#0077B6]' : 'border-slate-200 text-[#0077B6]'
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
                  <div className={`flex gap-2 items-center w-full ${compactUi ? `${mutedCls}` : 'text-[11px] lg:text-[12px] text-slate-400 lg:gap-3'}`}>
                    <Loader2 className={`${iconCls} animate-spin`} />
                    AI đang suy nghĩ...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {quickReplies.length > 0 && (
            <div className={`shrink-0 flex flex-wrap gap-1 justify-center ${compactUi ? 'px-2 pb-1' : 'px-2 lg:px-4 pb-1.5 lg:pb-2 lg:gap-1.5'}`}>
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(q)}
                  className={`font-medium px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm ${
                    compactUi ? bodyCls : 'text-[10px] lg:text-[11px] lg:px-3 lg:py-1.5'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ChatGPT-style input pill */}
          <div className={`shrink-0 min-w-0 ${compactUi ? 'px-2 pb-2 pt-0.5' : 'p-2 pt-0.5 lg:p-3 lg:pt-1'}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept={JD_PARSE_ACCEPT}
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className={`w-full min-w-0 ${embedded ? '' : 'max-w-2xl mx-auto'}`}>
              <div
                className={`w-full flex items-end gap-1.5 border border-slate-200 bg-white shadow-sm focus-within:border-slate-300 focus-within:shadow-md transition-shadow ${
                  compactUi ? 'rounded-2xl px-2 py-1' : 'rounded-2xl lg:rounded-3xl px-2 py-1.5 lg:px-3 lg:py-2 gap-1.5 lg:gap-2'
                }`}
              >
              <button
                type="button"
                onClick={handleFileUploadClick}
                disabled={parseLoading}
                className={`${hitCls} inline-flex items-center justify-center rounded-full shrink-0 mb-0.5 border border-slate-200 bg-transparent text-[#0077B6] hover:border-[#0077B6]/40 hover:text-[#0077B6] disabled:opacity-40 [&_svg]:block`}
                title={jdCopy.panel.uploadTitle}
              >
                {parseLoading ? <Loader2 className={`${iconCls} animate-spin`} /> : <Plus className={iconCls} />}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={jdCopy.panel.inputPlaceholder}
                disabled={parseLoading}
                className={`flex-1 min-w-0 resize-none bg-transparent outline-none placeholder:text-slate-400 max-h-28 disabled:opacity-50 leading-normal ${
                  compactUi ? `${bodyCls} text-slate-800 py-1.5` : 'text-[12px] lg:text-[13px] text-slate-800 py-1.5 lg:py-2'
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
                className={`${hitCls} inline-flex items-center justify-center rounded-full shrink-0 mb-0.5 border border-[#0077B6]/35 bg-transparent text-[#0077B6] hover:border-[#0077B6]/55 disabled:opacity-40 disabled:border-slate-200 disabled:text-slate-300 [&_svg]:block`}
              >
                <Send className={iconCls} />
              </button>
              </div>
              <p className={`text-center mt-1 lg:mt-1.5 leading-tight px-2 ${compactUi ? mutedCls : 'text-[8px] lg:text-[9px] text-slate-400'}`}>
                {jdCopy.panel.inputHint}
              </p>
            </div>
          </div>
        </div>

        {/* Template column */}
        <div className={`flex h-full min-h-0 flex-col min-w-0 bg-slate-50/50 ${
          mobileBuilderPane === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}
        >
            <>
              <div className={`shrink-0 border-b border-slate-100 bg-white space-y-1.5 ${compactUi ? 'px-2 py-1.5' : 'px-2 py-1.5 lg:px-3 lg:py-2 lg:space-y-2'}`}>
                <div className="flex items-center gap-1.5">
                  <span className={titleCls}>{isEditingSavedJob ? jdCopy.panel.previewEdit : jdCopy.panel.previewCreate}</span>
                </div>
                <div
                  className="flex w-full min-w-0 items-stretch gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                  role="tablist"
                  aria-label={jdCopy.panel.formLanguageAria}
                >
                  {JD_LANGUAGE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={languageTab === tab.id}
                      onClick={() => setLanguageTab(tab.id)}
                      className={`min-w-0 flex-1 px-1 py-0.5 lg:px-2 lg:py-1.5 rounded-md transition-colors ${tabTextCls} ${
                        languageTab === tab.id
                          ? 'bg-white shadow-sm text-[#0077B6]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <span className="w-px shrink-0 self-stretch bg-slate-200 my-0.5" aria-hidden />
                  <button
                    type="button"
                    onClick={handleTranslateCurrentTabInputs}
                    disabled={translatingInputs || parseLoading}
                    className={`shrink-0 inline-flex items-center justify-center gap-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tabTextCls} ${
                      compactUi ? 'px-1.5 py-0.5' : 'px-2 py-0.5 lg:px-2.5 lg:py-1.5'
                    } text-slate-600 hover:text-slate-900 hover:bg-white/80 [&_svg]:text-[#0077B6] ${
                      translatingInputs ? 'bg-white shadow-sm text-[#0077B6]' : ''
                    }`}
                    title={jdCopy.panel.translateTitle}
                  >
                    {translatingInputs
                      ? <Loader2 className={`${iconCls} shrink-0 animate-spin`} />
                      : <Languages className={`${iconCls} shrink-0 text-[#0077B6]`} />}
                    <span className="whitespace-nowrap">
                      {translatingInputs ? jdCopy.panel.translating : jdCopy.panel.translate}
                    </span>
                  </button>
                </div>
              </div>
              <div className={`flex-1 overflow-y-auto min-h-0 min-w-0 bg-white ${compactUi ? 'business-jd-preview-root' : ''}`}>
                <JdTemplate
                  key={jdTemplateSyncKey}
                  compactPreview={compactUi}
                  businessBranding
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
        </div>
      </div>
    </div>
    </>
  );
});

export default JobAiBuilderPanel;
