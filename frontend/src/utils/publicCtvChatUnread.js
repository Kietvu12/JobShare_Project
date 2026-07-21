import { LS_LAST_READ_ADMIN, LS_TOKEN } from './publicCtvChatUnreadKeys';

export { LS_TOKEN, LS_LAST_READ_ADMIN };

export async function fetchCtvSupportUnread(apiService) {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) {
    return { count: 0, preview: null };
  }

  try {
    const res = await apiService.getPublicCtvChatUnreadSummary(token);
    if (!res?.success) return { count: 0, preview: null };

    let unreadCount = Number(res.data?.unreadCount || 0);
    let preview = res.data?.preview || null;

    // Đồng bộ một lần: client cũ đã «đọc» qua localStorage nhưng server chưa có visitorLastSeenAt
    if (unreadCount > 0) {
      const lastReadRaw = localStorage.getItem(LS_LAST_READ_ADMIN);
      if (lastReadRaw) {
        const lastReadTs = new Date(lastReadRaw).getTime();
        if (Number.isFinite(lastReadTs)) {
          const msgsRes = await apiService.getPublicCtvChatMessages(token);
          const messages = msgsRes?.success ? msgsRes.data?.messages || [] : [];
          const clientUnread = messages.filter((m) => {
            if (m.senderType !== 'admin') return false;
            const ts = new Date(m.createdAt || m.created_at).getTime();
            return Number.isFinite(ts) && ts > lastReadTs;
          });
          if (clientUnread.length === 0) {
            await apiService.markPublicCtvChatRead(token);
            unreadCount = 0;
            preview = null;
          }
        }
      }
    }

    return { count: unreadCount, preview };
  } catch {
    return { count: 0, preview: null };
  }
}

export async function fetchAdminSupportUnread(apiService) {
  try {
    const [ctvRes, candidateRes] = await Promise.all([
      apiService.getAdminPublicCtvChatUnreadSummary(),
      apiService.getAdminPublicCandidateChatUnreadSummary(),
    ]);
    const ctv = ctvRes?.data || {};
    const candidate = candidateRes?.data || {};
    const unreadMessages =
      Number(ctv.unreadMessages || 0) + Number(candidate.unreadMessages || 0);
    const unreadSessions =
      Number(ctv.unreadSessions || 0) + Number(candidate.unreadSessions || 0);

    const senders = [...(ctv.senders || []), ...(candidate.senders || [])].sort(
      (a, b) => new Date(b.lastUnreadAt).getTime() - new Date(a.lastUnreadAt).getTime()
    );
    const first = senders[0];

    return {
      count: unreadMessages,
      unreadSessions,
      totalSenders: senders.length,
      senderLabels: senders.map((s) => s.label).filter(Boolean),
      senders,
      preview: ctv.preview || candidate.preview || null,
      visitorLabel: first?.label || ctv.visitorLabel || candidate.visitorLabel || null,
      sessionId: first?.sessionId ?? ctv.sessionId ?? candidate.sessionId ?? null,
      tab: first?.kind === 'candidate' ? 'candidate' : 'ctv',
    };
  } catch {
    return {
      count: 0,
      unreadSessions: 0,
      totalSenders: 0,
      senderLabels: [],
      senders: [],
      preview: null,
      visitorLabel: null,
      sessionId: null,
      tab: 'ctv',
    };
  }
}

const MAX_SENDER_NAMES_IN_POPUP = 4;

/** Tiêu đề popup admin: tối đa 4 tên, còn lại "và nhiều người khác chưa đọc". */
export function formatAdminUnreadPopupTitle(senderLabels = [], totalSenders = 0) {
  const labels = (senderLabels || []).filter(Boolean);
  const total = totalSenders > 0 ? totalSenders : labels.length;
  if (total <= 0) return 'Bạn có tin nhắn hỗ trợ chưa đọc';

  const shown = labels.slice(0, MAX_SENDER_NAMES_IN_POPUP);
  const nameStr = shown.join(' ');

  if (total <= MAX_SENDER_NAMES_IN_POPUP) {
    return `Bạn có tin nhắn từ ${nameStr}`;
  }
  return `Bạn có tin nhắn từ ${nameStr} và nhiều người khác chưa đọc`;
}

export const SUPPORT_CHAT_TOAST_DISMISS_KEY = 'support-chat-unread-toast-dismissed';

export function isSupportChatToastDismissed() {
  try {
    return sessionStorage.getItem(SUPPORT_CHAT_TOAST_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissSupportChatToast() {
  try {
    sessionStorage.setItem(SUPPORT_CHAT_TOAST_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}
