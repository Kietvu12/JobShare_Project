import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import apiService from '../../services/api';
import { translations } from '../../translations/translations';
import LegalPoliciesSlidePanel from '../Shared/LegalPoliciesSlidePanel';
import { ensurePublicCtvSessionResilient } from '../../utils/publicCtvChatSession';
import { createReconnectingEventSource, parsePublicChatSseEvent } from '../../utils/publicChatSse';

const LS_TOKEN = 'ctv_landing_public_chat_token';
const LS_NAME = 'ctv_landing_visitor_name';

const FACEBOOK_JOBSHERE_URL = 'https://www.facebook.com/';

const linkInBubbleClass =
  'text-[10px] font-semibold !text-[#2563eb] underline decoration-1 underline-offset-1 hover:!text-[#1d4ed8]';

const COPY = {
  vi: {
    title: 'Hỗ trợ CTV',
    subtitle: 'Có thể chuyển sang tư vấn trực tiếp với đội ngũ',
    close: 'Đóng',
    back: 'Quay lại',
    yourName: 'Tên gọi (tuỳ chọn)',
    agentMeta: 'JobShare • Hỗ trợ',
    greeting: (name) =>
      `Xin chào ${name}! Chọn một trong các câu hỏi gợi ý bên dưới để xem trả lời. Muốn trò chuyện trực tiếp với admin, hãy mở tab «Chat với admin».`,
    opt1: 'Chính sách hoa hồng',
    opt2: 'Hướng dẫn đăng ký CTV',
    opt3: 'Lịch đào tạo/Seminar',
    opt4: 'Cần hỗ trợ trực tiếp',
    linkPolicy: 'tại đây',
    opt1ReplyLead: 'JobShare có chính sách hoa hồng hấp dẫn cho CTV khi giới thiệu ứng viên thành công. Bạn có thể xem chi tiết bảng thưởng ',
    opt1ReplyTail: ' Càng kết nối nhiều, thu nhập càng cao!',
    opt2Reply: 'Bạn chỉ cần nhấn vào nút «Đăng ký» trên thanh menu và điền đầy đủ các thông tin cần thiết. Sau khi hệ thống phê duyệt tài khoản, bạn có thể bắt đầu xem danh sách việc làm, tạo hồ sơ ứng viên và tiến cử ngay.',
    opt3ReplyLead: 'Chúng tôi thường xuyên có các buổi hướng dẫn kỹ năng cho CTV mới. Bạn có thể theo dõi các thông tin mới nhất tại mục ',
    opt3LinkNews: 'Tin tức',
    opt3ReplyTail: '.',
    opt4ContactIntro: 'Nếu cần giải đáp về kỹ thuật hoặc đối soát chi phí hoa hồng, hãy liên hệ đội ngũ hỗ trợ của chúng tôi:',
    opt4HotlineVn: '(+84) 972899728',
    opt4HotlineJp: '(+81) 9094411975',
    opt4Facebook: 'Inbox Facebook JobShare',
    placeholderFirst: 'Nhập lời nhắn của bạn…',
    startChat: 'Gửi & bắt đầu chat',
    chatPlaceholder: 'Soạn tin nhắn…',
    send: 'Gửi',
    guest: 'bạn',
    connecting: 'Đang kết nối…',
    tabHome: 'Gợi ý',
    tabMessages: 'Chat với admin',
    chatWithAdminTitle: 'Chat với admin',
    chatWithAdminSubtitle: 'Trực tiếp với đội ngũ',
    chatWithAdminHint: 'Nhập tên (tuỳ chọn) và tin nhắn đầu tiên — tư vấn viên JobShare sẽ phản hồi.',
    chatWithAdminHintAgent: 'Soạn tin nhắn đầu tiên — tên hiển thị lấy từ tài khoản CTV của bạn.',
    registeredCtvBadge: 'Đã đăng ký',
  },
  en: {},
  ja: {},
};

const chipClassName =
  'inline-flex max-w-[100%] rounded-xl border border-[#e8e4dc] bg-white px-2 py-1.5 text-left text-[9px] font-medium leading-tight !text-[#92400e] shadow-sm transition hover:border-[#d6d0c4] hover:bg-[#fffefb] whitespace-normal text-balance';

function SuggestionChip({ children, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`${chipClassName} ${className}`}>
      {children}
    </button>
  );
}

function renderChatMessageBody(body) {
  if (body == null || typeof body !== 'string') return body;
  const re = /\[\[LINK:([^|]+)\|([^\]]+)\]\]/g;
  const out = [];
  let last = 0;
  let mi = 0;
  let m;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push(<span key={`txt-${mi++}`} className="whitespace-pre-wrap break-words">{body.slice(last, m.index)}</span>);
    out.push(<Link key={`lnk-${mi++}`} to={m[1]} className={linkInBubbleClass}>{m[2]}</Link>);
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push(<span key={`txt-${mi++}`} className="whitespace-pre-wrap break-words">{body.slice(last)}</span>);
  return out.length ? <span className="inline break-words">{out}</span> : body;
}

function CollaboratorChatPopup() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const isAgentArea = pathname.startsWith('/agent');
  const t = COPY[language] || COPY.vi;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('home');
  const [launcherHidden, setLauncherHidden] = useState(true);
  const [step, setStep] = useState('menu');
  const [scriptTurns, setScriptTurns] = useState([]);
  const [visitorName, setVisitorName] = useState(() => (isAgentArea ? localStorage.getItem(LS_NAME) || '' : ''));
  const [sessionToken, setSessionToken] = useState(() => (isAgentArea ? localStorage.getItem(LS_TOKEN) || '' : ''));
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveInput, setLiveInput] = useState('');
  const [firstLiveInput, setFirstLiveInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [ctvChatRegistered, setCtvChatRegistered] = useState(false);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('commission');
  const [buttonPosition] = useState(() => ({ x: window.innerWidth - 76, y: window.innerHeight - 76 }));
  const messagesEndRef = useRef(null);
  const esRef = useRef(null);
  const openRef = useRef(open);
  const tabRef = useRef(tab);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const stopStream = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  };

  const startStream = useCallback((token) => {
    stopStream();
    if (!token) return;
    const url = apiService.getPublicCtvChatStreamUrl(token);
    esRef.current = createReconnectingEventSource(url, {
      onEvent: (ev) => {
        const data = parsePublicChatSseEvent(ev);
        if (!data) return;
        setLiveMessages((prev) => {
          if (prev.some((m) => Number(m.id) === Number(data.message.id))) return prev;
          return [...prev, data.message];
        });
        setStep('live');
        if (
          data.message?.senderType === 'admin' &&
          openRef.current &&
          tabRef.current === 'messages'
        ) {
          apiService.markPublicCtvChatRead(token).catch(() => {});
        }
      },
    });
  }, []);

  useEffect(() => () => stopStream(), []);

  /** Khôi phục phiên + SSE ngay khi mount (desktop popup luôn chạy nền). */
  useEffect(() => {
    let cancelled = false;
    const ctvToken = localStorage.getItem('token');

    (async () => {
      try {
        const lsTok = localStorage.getItem(LS_TOKEN) || '';
        let nameHint = (localStorage.getItem(LS_NAME) || '').trim();

        if (ctvToken) {
          try {
            const me = await apiService.getCTVProfile();
            if (!cancelled && me.success) {
              const c = me.data?.collaborator || me.data?.user || me.data?.ctv || me.data;
              const n = (c?.name || '').trim();
              if (n) {
                nameHint = n;
                setVisitorName(n);
                localStorage.setItem(LS_NAME, n);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (cancelled) return;

        if (ctvToken) {
          const res = await ensurePublicCtvSessionResilient({
            sessionToken: lsTok || undefined,
            visitorLabel: nameHint || undefined,
          });
          if (cancelled || !res?.success || !res.data?.sessionToken) return;
          setCtvChatRegistered(!!res.data.isRegistered);
          const effectiveTok = res.data.sessionToken;
          localStorage.setItem(LS_TOKEN, effectiveTok);
          setSessionToken(effectiveTok);
          const msgsRes = await apiService.getPublicCtvChatMessages(effectiveTok);
          if (cancelled || !msgsRes.success) return;
          setLiveMessages(msgsRes.data?.messages || []);
          setUnreadAdminCount(Number(msgsRes.data?.session?.unreadAdminCount || 0));
          setStep('live');
          startStream(effectiveTok);
          return;
        }

        if (!lsTok) return;
        const res = await apiService.getPublicCtvChatMessages(lsTok);
        if (cancelled || !res.success) return;
        setLiveMessages(res.data?.messages || []);
        setUnreadAdminCount(Number(res.data?.session?.unreadAdminCount || 0));
        setSessionToken(lsTok);
        setStep('live');
        startStream(lsTok);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startStream]);

  useEffect(() => {
    const handleOpenChat = (event) => {
      setOpen(true);
      setLauncherHidden(!!event?.detail?.hideLauncher);
      if (event?.detail?.tab) setTab(event.detail.tab);
    };
    const handleOpenAgentHomeChat = () => {
      setOpen(true);
      setLauncherHidden(true);
      setTab('messages');
    };
    window.addEventListener('jobshare:open-collaborator-chat', handleOpenChat);
    window.addEventListener('jobshare:open-agent-home-chat', handleOpenAgentHomeChat);
    return () => {
      window.removeEventListener('jobshare:open-collaborator-chat', handleOpenChat);
      window.removeEventListener('jobshare:open-agent-home-chat', handleOpenAgentHomeChat);
    };
  }, []);

  useEffect(() => {
    if (!open || tab !== 'messages') return;

    const initMessagesTab = async () => {
      try {
        const lsTok = localStorage.getItem(LS_TOKEN) || sessionToken;
        const nameHint = visitorName.trim() || localStorage.getItem(LS_NAME) || undefined;

        let tok = lsTok;
        if (!tok) {
          const res = await ensurePublicCtvSessionResilient({ visitorLabel: nameHint });
          tok = res.data?.sessionToken || '';
          if (tok) {
            localStorage.setItem(LS_TOKEN, tok);
            setSessionToken(tok);
          }
        }

        if (tok) {
          const msgsRes = await apiService.getPublicCtvChatMessages(tok);
          if (msgsRes.success) {
            setLiveMessages(msgsRes.data?.messages || []);
            setUnreadAdminCount(Number(msgsRes.data?.session?.unreadAdminCount || 0));
            setStep('live');
          }
          startStream(tok);
        }
      } catch (error) {
        console.error('Error initializing chat tab:', error);
        setStep('menu');
      }
    };

    initMessagesTab();
  }, [open, tab, sessionToken, visitorName, startStream]);

  useEffect(() => {
    if (!open || tab !== 'messages' || !sessionToken) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.markPublicCtvChatRead(sessionToken);
        if (cancelled || !res?.success) return;
        setUnreadAdminCount(0);
        window.dispatchEvent(new CustomEvent('jobshare:ctv-chat-read'));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, tab, sessionToken]);

  useEffect(() => {
    if (open && tab === 'messages') return;
    const n = liveMessages.filter((m) => m.senderType === 'admin' && m.isReadByVisitor !== true).length;
    setUnreadAdminCount(n);
  }, [liveMessages, open, tab]);

  const displayName = visitorName.trim() || t.guest;
  const scrollBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollBottom(); }, [liveMessages]);

  const goBackHeader = () => { if (tab === 'messages') setTab('home'); else if (scriptTurns.length > 0) setScriptTurns([]); };
  const showHeaderBack = tab === 'messages' || (tab === 'home' && scriptTurns.length > 0);

  const appendScriptTurn = (key) => setScriptTurns((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, key }]);

  const scriptReplyBody = (key) => {
    switch (key) {
      case 'opt1':
        return (
          <>
            {t.opt1ReplyLead}
            <button type="button" onClick={() => { setLegalInitialTab('commission'); setLegalOpen(true); }} className={linkInBubbleClass}>
              {t.linkPolicy}
            </button>
            {t.opt1ReplyTail}
          </>
        );
      case 'opt2':
        return <span className="whitespace-normal">{t.opt2Reply}</span>;
      case 'opt3':
        return <>
          {t.opt3ReplyLead}
          <Link to="#hot-news" className={linkInBubbleClass}>{t.opt3LinkNews}</Link>
          {t.opt3ReplyTail}
        </>;
      case 'opt4':
        return (
          <span className="block space-y-1 whitespace-normal">
            <span className="block">{t.opt4ContactIntro}</span>
            <span className="block">📞 Hotline: <a href="tel:+84972899728" className={linkInBubbleClass}>{t.opt4HotlineVn}</a> (🇻🇳) — <a href="tel:+819094411975" className={linkInBubbleClass}>{t.opt4HotlineJp}</a> (🇯🇵)</span>
            <span className="block">💬 <a href={FACEBOOK_JOBSHERE_URL} target="_blank" rel="noopener noreferrer" className={linkInBubbleClass}>{t.opt4Facebook}</a></span>
          </span>
        );
      default:
        return null;
    }
  };

  const sendLive = async () => {
    const text = liveInput.trim(); if (!text || sending || !sessionToken) return;
    setSending(true);
    try {
      const res = await apiService.sendPublicCtvChatMessage({ sessionToken, body: text });
      if (res.success && res.data?.message) {
        setLiveMessages((prev) => [...prev, res.data.message]); setLiveInput('');
      }
    } finally { setSending(false); }
  };

  const ensureSession = async (tokenHint) => {
    const res = await ensurePublicCtvSessionResilient({
      sessionToken: tokenHint || undefined,
      visitorLabel: visitorName.trim() || undefined,
    });
    const tok = res.data.sessionToken;
    setSessionToken(tok);
    localStorage.setItem(LS_TOKEN, tok);
    return tok;
  };

  const submitFirstMessage = async () => {
    const text = firstLiveInput.trim(); if (!text || sending) return;
    setSending(true); setConnecting(true);
    try {
      let tok = sessionToken || await ensureSession(null);
      await apiService.sendPublicCtvChatMessage({ sessionToken: tok, body: text });
      const msgsRes = await apiService.getPublicCtvChatMessages(tok);
      if (msgsRes.success) setLiveMessages(msgsRes.data?.messages || []);
      startStream(tok);
      setStep('live'); setFirstLiveInput('');
    } finally { setSending(false); setConnecting(false); }
  };

  const renderMessageArea = () => {
    if (tab === 'messages') {
      if (step !== 'live' && liveMessages.length === 0) {
        return <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8"><p className="text-center text-[10px] text-[#6b7280]">{t.connecting}</p></div>;
      }
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {connecting && <p className="shrink-0 px-2 pt-2 text-center text-[9px] text-[#6b7280]">{t.connecting}</p>}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pt-3 pb-2">
            <div className="space-y-2">
              {liveMessages.map((m) => (
                <div key={m.id}>
                  <div className={`flex ${m.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[92%] rounded-xl px-2 py-1.5 text-[10px] leading-snug ${m.senderType === 'visitor' ? 'bg-[#ED212F] text-white' : 'border border-[#ececec] bg-white text-[#1f2937] shadow-sm'}`}>
                      {renderChatMessageBody(m.body)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-px w-full shrink-0" />
            </div>
          </div>
        </div>
      );
    }
    const bubbleAgent = (body) => <div className="flex w-full justify-start"><div className="max-w-[92%] rounded-xl border border-[#ececec] bg-white px-2 py-1.5 text-[10px] leading-snug !text-[#1f2937] shadow-sm">{body}</div></div>;
    const bubbleUser = (body) => <div className="flex w-full justify-end"><div className="max-w-[92%] rounded-xl bg-[#ED212F] px-2 py-1.5 text-[10px] leading-snug !text-white">{body}</div></div>;
    return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pt-3 pb-2"><div className="space-y-2">{bubbleAgent(t.greeting(displayName))}{scriptTurns.map((turn) => <React.Fragment key={turn.id}>{bubbleUser(turn.key === 'opt1' ? t.opt1 : turn.key === 'opt2' ? t.opt2 : turn.key === 'opt3' ? t.opt3 : t.opt4)}{bubbleAgent(scriptReplyBody(turn.key))}</React.Fragment>)}<div ref={messagesEndRef} /></div></div>;
  };

  const renderBottomPanel = () => {
    if (tab === 'messages' && step === 'live') {
      return <div className="shrink-0 border-t border-[#ececf0] bg-white px-2 py-2"><div className="flex gap-1.5"><input value={liveInput} onChange={(e) => setLiveInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendLive()} placeholder={t.chatPlaceholder} className="min-w-0 flex-1 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-2.5 py-1.5 text-[10px]" /><button type="button" onClick={sendLive} className="rounded-full bg-[#ED212F] px-2.5 py-1.5 text-[10px] font-semibold text-white">{t.send}</button></div></div>;
    }
    if (tab === 'messages') return <div className="shrink-0 border-t border-[#ececf0] bg-white px-2 py-2"><button type="button" onClick={submitFirstMessage} className="flex w-full items-center justify-center gap-1 rounded-full bg-[#FACC15] py-2 text-[10px] font-bold text-black">{connecting ? t.connecting : t.startChat}</button></div>;
    return <div className="max-h-[min(46%,260px)] min-h-[88px] shrink-0 bg-[#f2f3f5] px-2 py-1.5"><div className="flex flex-wrap justify-end gap-1 overflow-y-auto"><SuggestionChip onClick={() => appendScriptTurn('opt1')}>{t.opt1}</SuggestionChip><SuggestionChip onClick={() => appendScriptTurn('opt2')}>{t.opt2}</SuggestionChip><SuggestionChip onClick={() => appendScriptTurn('opt3')}>{t.opt3}</SuggestionChip><SuggestionChip onClick={() => appendScriptTurn('opt4')}>{t.opt4}</SuggestionChip></div></div>;
  };

  return (
    <>
      <div className="fixed z-[61]" style={{ left: buttonPosition.x, top: buttonPosition.y }}>
        {open && (
          <div className="absolute bottom-[calc(100%+8px)] right-0 z-[61] flex h-[min(520px,calc(100dvh-7.5rem))] w-[min(calc(100vw-1rem),400px)] flex-col overflow-hidden rounded-2xl border border-[#e8e8ec] bg-white text-[10px] shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
            <header className="flex items-center gap-1 border-b border-[#f0f0f3] bg-white px-2 py-2">
              {showHeaderBack ? <button type="button" onClick={goBackHeader} className="flex h-7 w-7 items-center justify-center rounded-full"><ChevronLeft className="h-3.5 w-3.5" /></button> : <div className="h-7 w-7" />}
              <div className="min-w-0 flex-1 text-center"><h2 className="truncate text-[11px] font-bold">{tab === 'messages' ? t.chatWithAdminTitle : t.title}</h2><p className="truncate text-[9px] text-[#6b7280]">{tab === 'messages' ? t.chatWithAdminSubtitle : t.subtitle}</p></div>
              <button type="button" onClick={() => { setOpen(false); setLauncherHidden(false); }} className="flex h-7 w-7 items-center justify-center rounded-full"><X className="h-3.5 w-3.5" /></button>
            </header>
            <div className="flex shrink-0 border-b border-[#f0f0f3] bg-white px-1"><button type="button" onClick={() => setTab('home')} className={`flex-1 border-b-2 py-1.5 text-[9px] font-semibold ${tab === 'home' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9ca3af]'}`}>{t.tabHome}</button><button type="button" onClick={() => setTab('messages')} className={`flex-1 border-b-2 py-1.5 text-[9px] font-semibold ${tab === 'messages' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9ca3af]'}`}>{t.tabMessages}</button></div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f2f3f5]">{renderMessageArea()}</div>
            {renderBottomPanel()}
          </div>
        )}
      </div>
      <LegalPoliciesSlidePanel open={legalOpen} onClose={() => setLegalOpen(false)} mode="threeTabs" initialTab={legalInitialTab} />
    </>
  );
}

export default CollaboratorChatPopup;
