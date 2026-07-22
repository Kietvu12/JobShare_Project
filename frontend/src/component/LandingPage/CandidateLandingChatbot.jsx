import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCandidateAuth } from '../../context/CandidateAuthContext';
import apiService from '../../services/api';
import LegalPoliciesSlidePanel from '../Shared/LegalPoliciesSlidePanel';
import { createReconnectingEventSource, parsePublicChatSseEvent } from '../../utils/publicChatSse';
import { appendUniqueChatMessage, canSendSupportChatMessage } from '../../utils/publicSupportChatUi';
import PublicSupportChatComposer from '../Shared/PublicSupportChatComposer';
import PublicSupportChatMessageBody from '../Shared/PublicSupportChatMessageBody';

const LS_TOKEN = 'candidate_landing_public_chat_token';
const LS_NAME = 'candidate_landing_visitor_name';

/** Inbox Facebook JobShare — cập nhật URL fanpage khi có. */
const FACEBOOK_JOBSHERE_URL = 'https://www.facebook.com/';

const linkInBubbleClass =
  'text-[10px] font-semibold !text-[#2563eb] underline decoration-1 underline-offset-1 hover:!text-[#1d4ed8]';

const COPY = {
  vi: {
    title: 'Hỗ trợ ứng viên',
    subtitle: 'Có thể chuyển sang tư vấn trực tiếp với đội ngũ',
    openAria: 'Mở chat hỗ trợ',
    close: 'Đóng',
    back: 'Quay lại',
    yourName: 'Tên gọi (tuỳ chọn)',
    agentMeta: 'JobShare • Hỗ trợ',
    greeting: (name) =>
      `Xin chào ${name}! Chọn một trong các câu hỏi gợi ý bên dưới để xem trả lời. Muốn trò chuyện trực tiếp với admin, hãy mở tab «Chat với admin».`,
    opt1: 'Thông tin việc làm mới nhất',
    opt2: 'Cách ứng tuyển qua JobShare',
    opt3: 'Cần tư vấn trực tiếp',
    jobsLinkLabel: 'danh sách việc làm',
    opt1ReplyBefore:
      'Hiện tại JobShare có rất nhiều vị trí kỹ sư chất lượng tại Nhật và Việt Nam. Bạn có thể xem danh sách và lọc theo ngành nghề tại đây: ',
    opt1ReplyAfter: ' Chúc bạn sớm tìm được công việc ưng ý!',
    opt2Reply:
      'Rất đơn giản! Bạn chỉ cần chọn công việc phù hợp, nhấn «Ứng tuyển» và tải lên CV của mình. Hệ thống sẽ gửi thông báo qua mail ngay khi hồ sơ của bạn được duyệt. Sau đó Workstation JobShare sẽ liên lạc với bạn để hỗ trợ tiến cử trong thời gian sớm nhất.',
    opt3ContactIntro:
      'Để được hỗ trợ chuyên sâu về hồ sơ hoặc phỏng vấn, bạn vui lòng liên hệ:',
    opt3HotlineVn: '(+84) 972899728',
    opt3HotlineJp: '(+81) 9094411975',
    opt3Facebook: 'Inbox Facebook JobShare',
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
    privacyPolicyLink: 'Chính sách bảo vệ dữ liệu & quyền riêng tư',
  },
  en: {
    title: 'Candidate support',
    subtitle: 'Our team can help you directly',
    openAria: 'Open support chat',
    close: 'Close',
    back: 'Back',
    yourName: 'Your name (optional)',
    agentMeta: 'JobShare • Support',
    greeting: (name) =>
      `Hello ${name}! Tap a suggested question below to see the answer. For live chat with our team, open the «Chat with admin» tab.`,
    opt1: 'Latest job openings',
    opt2: 'How to apply via JobShare',
    opt3: 'Direct consultation',
    jobsLinkLabel: 'job listings',
    opt1ReplyBefore:
      'JobShare offers many quality engineering roles in Japan and Vietnam. Browse and filter by industry here: ',
    opt1ReplyAfter: ' We wish you the best in finding the right role!',
    opt2Reply:
      "It's easy: pick a suitable job, tap «Apply», and upload your CV. You'll get an email when your profile is reviewed. Workstation JobShare will then reach out to support your referral as soon as possible.",
    opt3ContactIntro: 'For in-depth help with your profile or interviews, contact us:',
    opt3HotlineVn: '(+84) 972899728',
    opt3HotlineJp: '(+81) 9094411975',
    opt3Facebook: 'JobShare Facebook inbox',
    placeholderFirst: 'Type your message…',
    startChat: 'Send & start chat',
    chatPlaceholder: 'Type a message…',
    send: 'Send',
    guest: 'there',
    connecting: 'Connecting…',
    tabHome: 'Quick picks',
    tabMessages: 'Chat with admin',
    chatWithAdminTitle: 'Chat with admin',
    chatWithAdminSubtitle: 'Live team support',
    chatWithAdminHint: 'Optional name and your first message — our team will reply.',
    privacyPolicyLink: 'Data protection & privacy policy',
  },
  ja: {
    title: '求職者サポート',
    subtitle: 'チームによるサポートも可能です',
    openAria: 'サポートチャットを開く',
    close: '閉じる',
    back: '戻る',
    yourName: 'お名前（任意）',
    agentMeta: 'JobShare • サポート',
    greeting: (name) =>
      `${name}さん、下の質問から選ぶと回答が表示されます。担当者とチャットするには「管理者チャット」タブへ。`,
    opt1: '最新の求人情報',
    opt2: 'JobShareでの応募方法',
    opt3: '直接の相談',
    jobsLinkLabel: '求人一覧',
    opt1ReplyBefore:
      'JobShareでは日本・ベトナム向けの質の高いエンジニア求人が多数あります。業種で絞り込みはこちら：',
    opt1ReplyAfter: ' ぜひお気に入りの求人が見つかりますように。',
    opt2Reply:
      '適した求人を選び、「応募」を押してCVをアップロードするだけです。書類確認後、メールでお知らせします。その後、Workstation JobShareからご連絡し、紹介フォローを早急にサポートします。',
    opt3ContactIntro: '書類や面接について詳しく相談したい場合はこちらへ：',
    opt3HotlineVn: '(+84) 972899728',
    opt3HotlineJp: '(+81) 9094411975',
    opt3Facebook: 'Facebook（JobShare）',
    placeholderFirst: 'メッセージを入力…',
    startChat: '送信してチャット開始',
    chatPlaceholder: 'メッセージ…',
    send: '送信',
    guest: 'ゲスト',
    connecting: '接続中…',
    tabHome: 'クイック',
    tabMessages: '管理者チャット',
    chatWithAdminTitle: '管理者チャット',
    chatWithAdminSubtitle: '担当者とやり取り',
    chatWithAdminHint: 'お名前（任意）と最初のメッセージを入力してください。',
    privacyPolicyLink: 'データ保護・プライバシーポリシー',
  },
};

const chipClassName =
  'inline-flex max-w-[100%] rounded-xl border border-[#e8e4dc] bg-white px-2 py-1.5 text-left text-[9px] font-medium leading-tight !text-[#92400e] shadow-sm transition hover:border-[#d6d0c4] hover:bg-[#fffefb] whitespace-normal text-balance';

/** Chip nút gợi ý — viền nhạt, chữ amber như reference */
function SuggestionChip({ children, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`${chipClassName} ${className}`}>
      {children}
    </button>
  );
}

function ChipLink({ href, download, children, target, rel, className }) {
  return (
    <a
      href={href}
      download={download}
      target={target}
      rel={rel}
      className={className != null && className !== '' ? className : chipClassName}
    >
      {children}
    </a>
  );
}

function CandidateLandingChatbot() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const { applicant } = useCandidateAuth();
  const jobsLinkPrefix = pathname.startsWith('/landing/candidate') ? '/landing/candidate' : '/candidate';
  const t = COPY[language] || COPY.vi;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('home');
  /** Luồng chat trực tiếp: menu = chưa gửi tin đầu; live = đã có phiên */
  const [step, setStep] = useState('menu');
  /** Tab Gợi ý: mỗi lần chọn chip append một lượt (opt1|2|3), không thay thế luồng */
  const [scriptTurns, setScriptTurns] = useState([]);
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem(LS_NAME) || '');
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem(LS_TOKEN) || '');
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveInput, setLiveInput] = useState('');
  const [liveAttachment, setLiveAttachment] = useState(null);
  const [firstLiveInput, setFirstLiveInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 12, y: 12 };
    return { x: window.innerWidth - 76, y: window.innerHeight - 76 };
  });
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [buttonDragStart, setButtonDragStart] = useState({ x: 0, y: 0 });
  const [dragMoved, setDragMoved] = useState(false);
  const messagesEndRef = useRef(null);
  const scriptThreadEndRef = useRef(null);
  const esRef = useRef(null);
  const buttonRef = useRef(null);
  const prevApplicantIdRef = useRef(applicant?.id ?? null);

  const hasLiveThread = step === 'live' || liveMessages.length > 0;
  const fabGap = 8;
  const getFabSize = useCallback(
    () => (typeof window === 'undefined' ? 60 : window.innerWidth < 640 ? 56 : 60),
    []
  );
  const clampFabPosition = useCallback(
    (x, y, isOpen) => {
      if (typeof window === 'undefined') return { x, y };
      const fab = getFabSize();
      const side = window.innerWidth < 640 ? 8 : 12;
      const bottomOffset = window.innerWidth < 1024 ? 88 : 32;
      const innerW = window.innerWidth;
      const innerH = window.innerHeight;

      let nx = x;
      let ny = y;

      if (!isOpen) {
        return {
          x: Math.max(side, Math.min(nx, innerW - fab - side)),
          y: Math.max(side, Math.min(ny, innerH - fab - bottomOffset)),
        };
      }

      const panelW = Math.min(400, innerW - 2 * side);
      const panelH = Math.min(520, Math.max(220, innerH - side - bottomOffset - fab - fabGap - side));

      for (let iter = 0; iter < 8; iter++) {
        const fabLeft = nx;
        const fabTop = ny;
        const fabRight = nx + fab;
        const fabBottom = ny + fab;
        const panelLeft = nx + fab - panelW;
        const panelTop = ny - fabGap - panelH;
        const panelRight = panelLeft + panelW;
        const panelBottom = panelTop + panelH;

        const minX = Math.min(fabLeft, panelLeft);
        const maxX = Math.max(fabRight, panelRight);
        const minY = Math.min(fabTop, panelTop);
        const maxY = Math.max(fabBottom, panelBottom);

        let dx = 0;
        let dy = 0;
        if (minX < side) dx = side - minX;
        if (maxX + dx > innerW - side) dx = innerW - side - maxX;
        if (minY + dy < side) dy = side - minY;
        if (maxY + dy > innerH - bottomOffset) dy = innerH - bottomOffset - maxY;

        if (dx === 0 && dy === 0) break;
        nx += dx;
        ny += dy;
      }

      nx = Math.max(side, Math.min(nx, innerW - fab - side));
      ny = Math.max(side, Math.min(ny, innerH - fab - bottomOffset));

      return { x: nx, y: ny };
    },
    [getFabSize]
  );
  const handleButtonDragStart = useCallback((e) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDraggingButton(true);
    setDragMoved(false);
    setButtonDragStart({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const stopStream = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  };

  const startStream = useCallback((token) => {
    stopStream();
    if (!token) return;
    const url = apiService.getPublicCandidateChatStreamUrl(token);
    esRef.current = createReconnectingEventSource(url, {
      onEvent: (ev) => {
        const data = parsePublicChatSseEvent(ev);
        if (!data) return;
        setLiveMessages((prev) => appendUniqueChatMessage(prev, data.message));
        setStep('live');
      },
    });
  }, []);

  useEffect(() => {
    const currentAppId = applicant?.id ?? null;
    const prevAppId = prevApplicantIdRef.current;
    prevApplicantIdRef.current = currentAppId;

    const authChanged = currentAppId !== prevAppId;
    if (authChanged) {
      stopStream();
      setLiveMessages([]);
      setSessionToken('');
      setStep('menu');
      setFirstLiveInput('');
      setLiveInput('');
    }

    let cancelled = false;
    (async () => {
      try {
        if (currentAppId) {
          const sessionRes = await apiService.ensurePublicCandidateChatSession({
            visitorLabel: applicant?.name || null,
            applicantId: currentAppId,
          });
          if (cancelled || !sessionRes.success || !sessionRes.data?.sessionToken) return;
          const tok = sessionRes.data.sessionToken;
          setSessionToken(tok);
          localStorage.setItem(LS_TOKEN, tok);
          const msgRes = await apiService.getPublicCandidateChatMessages(tok);
          if (cancelled) return;
          const msgs = msgRes.success ? msgRes.data?.messages || [] : [];
          setLiveMessages(msgs);
          setStep('live');
          startStream(tok);
        } else {
          const tok = localStorage.getItem(LS_TOKEN);
          if (!tok) return;
          const res = await apiService.getPublicCandidateChatMessages(tok);
          if (cancelled || !res.success) return;
          const msgs = res.data?.messages || [];
          setLiveMessages(msgs);
          setSessionToken(tok);
          setStep('live');
          startStream(tok);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicant?.id, startStream]);

  useEffect(() => {
    localStorage.setItem(LS_NAME, visitorName);
  }, [visitorName]);

  const displayName = visitorName.trim() || t.guest;

  const scrollBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollBottom();
  }, [liveMessages]);

  useEffect(() => {
    if (tab !== 'home') return;
    scriptThreadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scriptTurns, tab]);

  useEffect(() => {
    const handleResize = () => {
      setButtonPosition((prev) => clampFabPosition(prev.x, prev.y, open));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampFabPosition, open]);

  useEffect(() => {
    setButtonPosition((prev) => clampFabPosition(prev.x, prev.y, open));
  }, [open, clampFabPosition]);

  useEffect(() => {
    if (!isDraggingButton) return undefined;

    const handleMouseMove = (e) => {
      const next = clampFabPosition(e.clientX - buttonDragStart.x, e.clientY - buttonDragStart.y, open);
      setButtonPosition(next);
      setDragMoved(true);
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const next = clampFabPosition(touch.clientX - buttonDragStart.x, touch.clientY - buttonDragStart.y, open);
      setButtonPosition(next);
      setDragMoved(true);
      e.preventDefault();
    };

    const stopDragging = () => {
      setIsDraggingButton(false);
      window.setTimeout(() => setDragMoved(false), 120);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', stopDragging);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopDragging);
    };
  }, [isDraggingButton, buttonDragStart, clampFabPosition, open]);

  useEffect(() => () => stopStream(), []);

  useEffect(() => {
    const openSupportChat = () => {
      setOpen(true);
      setTab('messages');
    };
    window.addEventListener('jobshare:open-support-chat', openSupportChat);
    return () => window.removeEventListener('jobshare:open-support-chat', openSupportChat);
  }, []);

  const ensureSession = async (tokenHint) => {
    const res = await apiService.ensurePublicCandidateChatSession({
      sessionToken: tokenHint || undefined,
      visitorLabel: visitorName.trim() || applicant?.name || null,
      applicantId: applicant?.id || undefined,
    });
    if (!res.success || !res.data?.sessionToken) throw new Error('session');
    const tok = res.data.sessionToken;
    setSessionToken(tok);
    localStorage.setItem(LS_TOKEN, tok);
    return tok;
  };

  const loadMessages = async (tok) => {
    const res = await apiService.getPublicCandidateChatMessages(tok);
    if (res.success && res.data?.messages) {
      setLiveMessages(res.data.messages);
    }
  };

  const sendLive = async () => {
    const text = liveInput.trim();
    if (!canSendSupportChatMessage(text, liveAttachment) || sending || !sessionToken) return;
    setSending(true);
    try {
      const res = await apiService.sendPublicCandidateChatMessage({
        sessionToken,
        body: text,
        attachment: liveAttachment,
      });
      if (res.success && res.data?.message) {
        setLiveMessages((prev) => appendUniqueChatMessage(prev, res.data.message));
        setLiveInput('');
        setLiveAttachment(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const submitFirstMessage = async () => {
    const text = firstLiveInput.trim();
    if (!text || sending) return;
    setSending(true);
    setConnecting(true);
    try {
      let tok = sessionToken;
      if (!tok) {
        tok = await ensureSession(null);
      } else {
        tok = await ensureSession(tok);
      }
      await apiService.sendPublicCandidateChatMessage({ sessionToken: tok, body: text });
      await loadMessages(tok);
      startStream(tok);
      setStep('live');
      setFirstLiveInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      setConnecting(false);
    }
  };

  const resetScriptThread = () => {
    setScriptTurns([]);
  };

  const appendScriptTurn = (key) => {
    setScriptTurns((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, key }]);
  };

  const goBackHeader = () => {
    if (tab === 'messages') {
      setTab('home');
      return;
    }
    if (tab === 'home' && scriptTurns.length > 0) resetScriptThread();
  };

  const showHeaderBack = tab === 'messages' || (tab === 'home' && scriptTurns.length > 0);

  /** Vùng trên: script (home) hoặc chat admin (messages) */
  const renderMessageArea = () => {
    if (tab === 'messages') {
      if (!hasLiveThread) {
        return (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pt-3 pb-2 scroll-pt-4">
            <h3 className="text-[10px] font-bold leading-tight text-[#111827]">{t.chatWithAdminTitle}</h3>
            <p className="mt-0.5 text-[9px] leading-snug text-[#6b7280]">{t.chatWithAdminHint}</p>
            <label className="mt-3 block text-[9px] font-medium uppercase tracking-wide text-[#9ca3af]">
              {t.yourName}
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e8e8ea] bg-white px-2 py-1.5 text-[10px] text-[#111827] outline-none focus:border-[#d1d5db]"
                maxLength={120}
              />
            </label>
            <textarea
              value={firstLiveInput}
              onChange={(e) => setFirstLiveInput(e.target.value)}
              rows={4}
              placeholder={t.placeholderFirst}
              aria-label={t.placeholderFirst}
              className="mt-1 w-full resize-none rounded-xl border border-[#e8e8ea] bg-white px-2 py-2 text-[10px] leading-snug text-[#111827] caret-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#d1d5db]"
            />
          </div>
        );
      }
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {connecting && (
            <p className="shrink-0 px-2 pt-2 text-center text-[9px] text-[#6b7280]">{t.connecting}</p>
          )}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pt-3 pb-2 scroll-smooth scroll-pt-2 [scrollbar-gutter:stable]">
            <div className="space-y-2">
              {liveMessages.map((m) => (
                <div key={m.id}>
                  <div
                    className={`flex ${m.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-xl px-2 py-1.5 text-[10px] leading-snug ${
                        m.senderType === 'visitor'
                          ? 'bg-[#ED212F] text-white'
                          : 'border border-[#ececec] bg-white text-[#1f2937] shadow-sm'
                      }`}
                    >
                      {m.body || m.attachmentUrl ? (
                        <PublicSupportChatMessageBody
                          message={m}
                          className="whitespace-pre-wrap break-words text-[10px]"
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-0.5 text-[9px] text-[#9ca3af]">
                    {m.senderType === 'visitor' ? displayName : t.agentMeta} •{' '}
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-px w-full shrink-0" />
            </div>
          </div>
        </div>
      );
    }

    if (tab === 'home') {
      const bubbleAgent = (body) => (
        <div className="flex w-full min-w-0 justify-start">
          <div className="max-w-[92%] rounded-xl border border-[#ececec] bg-white px-2 py-1.5 text-[10px] leading-snug !text-[#1f2937] shadow-sm [&_a]:inline [&_button]:inline [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:align-baseline">
            {body}
          </div>
        </div>
      );
      const bubbleUser = (body) => (
        <div className="flex w-full min-w-0 justify-end">
          <div className="max-w-[92%] rounded-xl bg-[#ED212F] px-2 py-1.5 text-[10px] leading-snug !text-white">
            {body}
          </div>
        </div>
      );

      const scriptQuestion = { opt1: t.opt1, opt2: t.opt2, opt3: t.opt3 };

      const scriptReplyBody = (key) => {
        switch (key) {
          case 'opt1':
            return (
              <>
                {t.opt1ReplyBefore}
                <Link to={`${jobsLinkPrefix}/jobs`} className={linkInBubbleClass}>
                  {t.jobsLinkLabel}
                </Link>
                {t.opt1ReplyAfter}
              </>
            );
          case 'opt2':
            return <span className="whitespace-normal">{t.opt2Reply}</span>;
          case 'opt3':
            return (
              <span className="block space-y-1 whitespace-normal">
                <span className="block">{t.opt3ContactIntro}</span>
                <span className="block">
                  📞 Hotline:{' '}
                  <a href="tel:+84972899728" className={linkInBubbleClass}>
                    {t.opt3HotlineVn}
                  </a>{' '}
                  (🇻🇳) —{' '}
                  <a href="tel:+819094411975" className={linkInBubbleClass}>
                    {t.opt3HotlineJp}
                  </a>{' '}
                  (🇯🇵)
                </span>
                <span className="block">
                  💬{' '}
                  <ChipLink
                    href={FACEBOOK_JOBSHERE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkInBubbleClass}
                  >
                    {t.opt3Facebook}
                  </ChipLink>
                </span>
              </span>
            );
          default:
            return null;
        }
      };

      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pt-3 pb-2 scroll-pt-4">
          <div className="space-y-2">
            {bubbleAgent(t.greeting(displayName))}

            {scriptTurns.map((turn) => (
              <React.Fragment key={turn.id}>
                {bubbleUser(scriptQuestion[turn.key])}
                {bubbleAgent(scriptReplyBody(turn.key))}
              </React.Fragment>
            ))}
            <div ref={scriptThreadEndRef} className="h-px w-full shrink-0" />
          </div>
        </div>
      );
    }

    return null;
  };

  /** Vùng dưới: chip script / nhập chat admin */
  const renderBottomPanel = () => {
    if (tab === 'messages' && hasLiveThread) {
      return (
        <div className="shrink-0 border-t border-[#ececf0] bg-white px-2 py-2">
          <PublicSupportChatComposer
            variant="compact"
            value={liveInput}
            onChange={setLiveInput}
            attachment={liveAttachment}
            onAttachmentChange={setLiveAttachment}
            onSend={sendLive}
            sending={sending}
            disabled={!sessionToken}
            placeholder={t.chatPlaceholder}
            sendLabel={t.send}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
        </div>
      );
    }

    if (tab === 'messages' && !hasLiveThread) {
      return (
        <div className="shrink-0 border-t border-[#ececf0] bg-white px-2 py-2">
          <button
            type="button"
            disabled={sending || !firstLiveInput.trim()}
            onClick={submitFirstMessage}
            className="flex w-full items-center justify-center gap-1 rounded-full bg-[#FACC15] py-2 text-[10px] font-bold leading-tight text-black shadow-lg shadow-amber-200/60 transition hover:bg-[#eab308] disabled:opacity-50"
          >
            {connecting ? t.connecting : t.startChat}
          </button>
        </div>
      );
    }

    if (tab === 'home') {
      return (
        <div className="max-h-[min(46%,260px)] min-h-[88px] shrink-0 bg-[#f2f3f5] px-2 py-1.5">
          <div className="mb-1 flex justify-center">
            <button
              type="button"
              onClick={() => setPrivacyPanelOpen(true)}
              className="text-[9px] font-semibold text-[#2563eb] underline decoration-1 underline-offset-1 hover:text-[#1d4ed8]"
            >
              {t.privacyPolicyLink}
            </button>
          </div>
          <div className="flex max-h-[min(200px,26vh)] flex-wrap content-end justify-end gap-1 overflow-y-auto pb-0.5">
            <SuggestionChip onClick={() => appendScriptTurn('opt1')}>{t.opt1}</SuggestionChip>
            <SuggestionChip onClick={() => appendScriptTurn('opt2')}>{t.opt2}</SuggestionChip>
            <SuggestionChip onClick={() => appendScriptTurn('opt3')}>{t.opt3}</SuggestionChip>
          </div>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full border border-[#e5e7eb] bg-white p-1 text-[#9ca3af] shadow-sm">
              <ChevronDown className="h-3 w-3" aria-hidden />
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        className="pointer-events-none fixed z-[60]"
        style={{
          left: buttonPosition.x,
          top: buttonPosition.y,
        }}
      >
        <div className="pointer-events-auto relative h-14 w-14 sm:h-[3.75rem] sm:w-[3.75rem]">
          {open && (
            <div
              className="absolute bottom-full right-0 z-[61] mb-2 flex h-[min(520px,calc(100dvh-7.5rem))] w-[min(calc(100vw-1rem),400px)] max-h-[min(520px,calc(100dvh-7.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e8e8ec] bg-white text-[10px] leading-snug text-[#111827] shadow-[0_12px_40px_rgba(15,23,42,0.12)] [color-scheme:light]"
              role="dialog"
              aria-label={t.title}
            >
              <header
                className="flex shrink-0 cursor-grab touch-none items-center gap-1 border-b border-[#f0f0f3] bg-white px-2 py-2 select-none active:cursor-grabbing"
                onMouseDown={handleButtonDragStart}
                onTouchStart={handleButtonDragStart}
              >
                {showHeaderBack ? (
                  <button
                    type="button"
                    onClick={goBackHeader}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#374151] hover:bg-[#f3f4f6]"
                    aria-label={t.back}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="h-7 w-7 shrink-0" aria-hidden />
                )}
                <div className="min-w-0 flex-1 text-center">
                  <h2 className="truncate text-[11px] font-bold leading-tight tracking-tight text-[#111827]">
                    {tab === 'messages' ? t.chatWithAdminTitle : t.title}
                  </h2>
                  <p className="truncate text-[9px] leading-tight text-[#6b7280]">
                    {tab === 'messages' ? t.chatWithAdminSubtitle : t.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]"
                  aria-label={t.close}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </header>

              <div className="flex shrink-0 border-b border-[#f0f0f3] bg-white px-1">
                <button
                  type="button"
                  onClick={() => setTab('home')}
                  className={`flex-1 border-b-2 py-1.5 text-center text-[9px] font-semibold leading-tight transition ${
                    tab === 'home' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9ca3af]'
                  }`}
                >
                  {t.tabHome}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('messages')}
                  className={`flex-1 border-b-2 py-1.5 text-center text-[9px] font-semibold leading-tight transition ${
                    tab === 'messages' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9ca3af]'
                  }`}
                >
                  {t.tabMessages}
                </button>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f2f3f5]">{renderMessageArea()}</div>

              {renderBottomPanel()}
            </div>
          )}

          <button
            ref={buttonRef}
            type="button"
            onMouseDown={handleButtonDragStart}
            onTouchStart={handleButtonDragStart}
            onClick={() => {
              if (dragMoved) return;
              setOpen((o) => !o);
            }}
            className="relative flex h-full w-full items-center justify-center rounded-full bg-[#FACC15] text-black shadow-lg shadow-amber-300/40 transition hover:bg-[#eab308]"
            style={{ cursor: isDraggingButton ? 'grabbing' : 'grab' }}
            aria-label={t.openAria}
          >
            {open ? <ChevronDown className="h-6 w-6 sm:h-7 sm:w-7" /> : <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />}
          </button>
        </div>
      </div>

      <LegalPoliciesSlidePanel
        open={privacyPanelOpen}
        onClose={() => setPrivacyPanelOpen(false)}
        mode="privacyOnly"
        initialTab="privacy"
      />
    </>
  );
}

export default CandidateLandingChatbot;
