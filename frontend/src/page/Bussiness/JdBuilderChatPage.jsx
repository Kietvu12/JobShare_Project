import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import apiService from '../../services/api';
import useBusinessUser from '../../hooks/useBusinessUser';
import useFluidPageScale from '../../hooks/useFluidPageScale';
import JdTemplate from '../../component/Admin/AddJob/JdTemplate';
import { saveJdBuilderPrefill } from '../../utils/applyJdBuilderPrefill';
import {
  applyJdFormStatePatch,
  applyParsedJdToFormState,
  createEmptyJdFormState,
  normalizeJdDraft,
} from '../../utils/applyParsedJdToFormState';

const SESSION_ID_KEY = 'wjs_jd_builder_session_id';
const LANG_TABS = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
  { id: 'jp', label: 'JP' },
];

function readStoredSessionId() {
  try {
    return sessionStorage.getItem(SESSION_ID_KEY) || '';
  } catch {
    return '';
  }
}

function storeSessionId(id) {
  try {
    if (id) sessionStorage.setItem(SESSION_ID_KEY, id);
    else sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    /* ignore */
  }
}

const JdBuilderChatPage = () => {
  const navigate = useNavigate();
  const { companyName, user: businessUser } = useBusinessUser();
  const { hostRef, fluidStyle, isNarrow } = useFluidPageScale();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
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
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');
  const [finalizing, setFinalizing] = useState(false);

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
      setMessages(data.messages);
    } else if (data?.reply) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === data.reply) return prev;
        return [...prev, { role: 'assistant', content: data.reply }];
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
        setMessages([{ role: 'assistant', content: data.reply }]);
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
        /* categories optional for preview labels */
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
    // Chỉ boot một lần khi mount
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
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const message = String(text ?? '').trim();
    if (!message || !sessionId || loading) return;
    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const data = await apiService.jdBuilderChat({ session_id: sessionId, message });
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data?.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
      applySessionResponse(data);
    } catch (err) {
      setError(err?.message || 'Gửi tin nhắn thất bại.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFinalize = async () => {
    if (!sessionId || !canFinalize || finalizing) return;
    setError('');
    setFinalizing(true);
    try {
      const result = await apiService.jdBuilderFinalizeTranslate(sessionId);
      saveJdBuilderPrefill(result);
      storeSessionId('');
      navigate('/business/jobs/create', { state: { fromJdBuilder: true } });
    } catch (err) {
      setError(err?.message || 'Không thể chốt JD.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleNewSession = async () => {
    storeSessionId('');
    setSessionId('');
    sessionStartedRef.current = false;
    setMessages([]);
    setQuickReplies([]);
    setMissingFields([]);
    setCanFinalize(false);
    setError('');
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
    setJdTemplateSyncKey((k) => k + 1);
    await startSession();
  };

  const formLayoutGridClass = isNarrow
    ? 'grid grid-cols-1 gap-2 items-stretch min-w-0 flex-1 min-h-0'
    : 'grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 flex-1 min-h-0 overflow-hidden items-stretch min-w-0';
  const chatColumnClass = isNarrow
    ? 'min-h-0 min-w-0 flex flex-col h-[min(420px,45svh)]'
    : 'min-h-0 min-w-0 h-full flex flex-col overflow-hidden';
  const previewColumnClass = isNarrow
    ? 'flex flex-col min-h-[280px] min-w-0 flex-1 min-h-0'
    : 'flex flex-col min-h-0 min-w-0 h-full overflow-hidden';

  if (bootLoading) {
    return (
      <div className="h-[calc(100svh-4.25rem)] flex items-center justify-center text-slate-500 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang khởi tạo trợ lý AI...
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="add-job-fluid-host w-full min-w-0 flex flex-col overflow-hidden overflow-x-hidden h-[calc(100svh-4.25rem)] max-h-[calc(100svh-4.25rem)]"
      style={fluidStyle}
    >
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden gap-2 min-w-0 max-w-full px-1 pb-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/business/jobs')}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                Tạo JD với AI
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                Chat với AI bên trái — xem trước JD bên phải
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {LANG_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLanguageTab(tab.id)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                    languageTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleNewSession}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Phiên mới
            </button>
            {canFinalize && (
              <button
                type="button"
                disabled={finalizing}
                onClick={handleFinalize}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[10px] font-semibold py-1.5 px-2.5 shadow-sm"
              >
                {finalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Chốt JD
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[11px] px-3 py-2 shrink-0">
            {error}
          </div>
        )}

        {missingFields.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-[10px] px-3 py-1.5 shrink-0 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="font-semibold">Còn thiếu:</span>
            {missingFields.map((f) => (
              <span key={f}>• {f}</span>
            ))}
          </div>
        )}

        <div className={formLayoutGridClass}>
          {/* Cột trái: Chat */}
          <div className={chatColumnClass}>
            <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-3 space-y-3">
                {messages.length === 0 && !loading && (
                  <div className="text-center text-[11px] text-slate-400 py-6">
                    AI đang sẵn sàng. Hãy mô tả vị trí cần tuyển...
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={idx} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isUser ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-2 items-center text-slate-400 text-[11px]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI đang suy nghĩ...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {quickReplies.length > 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-slate-50 pt-2 shrink-0">
                  {quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={loading}
                      onClick={() => sendMessage(q)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2 border-t border-slate-100 flex gap-2 items-end shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder="Mô tả vị trí, trả lời câu hỏi của AI..."
                  className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[12px] max-h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !input.trim() || !sessionId}
                  onClick={() => sendMessage(input)}
                  className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Preview JD template */}
          <div className={previewColumnClass}>
            <div
              className="rounded-lg border overflow-hidden flex flex-col flex-1 min-h-0 h-full business-jd-preview-wrap"
              style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}
            >
              <div className="px-3 py-2 border-b border-slate-100 shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Xem trước JD</span>
                <span className="text-[9px] text-slate-400">Cập nhật theo chat</span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 min-w-0 bg-white overscroll-y-contain">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JdBuilderChatPage;
