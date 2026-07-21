import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SlideInNotice from './SlideInNotice';
import {
  dismissSupportChatToast,
  fetchAdminSupportUnread,
  fetchCtvSupportUnread,
  formatAdminUnreadPopupTitle,
  isSupportChatToastDismissed,
} from '../../utils/publicCtvChatUnread';

/**
 * Toast trượt vào khi admin/CTV vào hệ thống và có tin hỗ trợ chưa đọc.
 * @param {{ role: 'admin' | 'ctv' }} props
 */
export default function PublicSupportChatUnreadNotice({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(null);

  const close = useCallback(() => {
    setOpen(false);
    dismissSupportChatToast();
  }, []);

  useEffect(() => {
    if (isSupportChatToastDismissed()) return undefined;

    if (role === 'admin' && location.pathname.startsWith('/admin/public-ctv-chat')) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result =
          role === 'admin'
            ? await fetchAdminSupportUnread(apiService)
            : await fetchCtvSupportUnread(apiService);

        if (cancelled || !result?.count || result.count <= 0) return;
        if (isSupportChatToastDismissed()) return;

        setPayload(result);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, role]);

  const handleAction = () => {
    close();
    if (role === 'admin') {
      const tab = payload?.tab === 'candidate' ? 'candidate' : 'ctv';
      const sessionId = payload?.sessionId;
      const qs = new URLSearchParams({ tab });
      if (sessionId) qs.set('sessionId', String(sessionId));
      navigate(`/admin/public-ctv-chat?${qs.toString()}`);
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      navigate('/agent');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jobshare:open-agent-home-chat'));
      }, 150);
      return;
    }
    window.dispatchEvent(new CustomEvent('jobshare:open-collaborator-chat', { detail: { tab: 'messages' } }));
  };

  const title =
    role === 'admin'
      ? formatAdminUnreadPopupTitle(payload?.senderLabels, payload?.totalSenders)
      : `Admin đã gửi ${payload?.count || 0} tin nhắn mới`;

  const messageParts = [];
  if (role === 'admin' && payload?.preview) {
    messageParts.push(payload.preview);
  } else if (role === 'admin' && payload?.count) {
    messageParts.push(`${payload.count} tin nhắn đang chờ phản hồi.`);
  } else if (role === 'ctv' && payload?.preview) {
    messageParts.push(payload.preview);
  } else {
    messageParts.push('Nhấn để mở hộp tin và trả lời.');
  }

  return (
    <SlideInNotice
      open={open}
      onClose={close}
      title={title}
      message={messageParts.join(' — ')}
      actionLabel={role === 'admin' ? 'Xem tin nhắn' : 'Mở chat hỗ trợ'}
      onAction={handleAction}
    />
  );
}
