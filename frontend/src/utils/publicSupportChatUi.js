/** Preview one dòng trong danh sách phiên chat. */
export function buildMessagePreview(message) {
  if (!message) return '';
  if (message.attachmentName) {
    const mime = String(message.attachmentMimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return '📷 Ảnh';
    return `📎 ${message.attachmentName}`;
  }
  const body = String(message.body || '').trim();
  if (!body && message.attachmentUrl) return '📎 Tệp đính kèm';
  return body.slice(0, 160);
}

/** Gộp tin realtime vào state, tránh trùng id hoặc bản optimistic. */
export function appendUniqueChatMessage(prev, incoming) {
  if (!incoming) return prev;
  const list = Array.isArray(prev) ? prev : [];
  const mid = incoming.id;
  if (mid != null && list.some((m) => Number(m.id) === Number(mid))) return list;

  const body = String(incoming.body || '').trim();
  const createdTs = incoming.createdAt ? new Date(incoming.createdAt).getTime() : Date.now();
  if (mid == null && (body || incoming.attachmentName)) {
    const dup = list.some((m) => {
      if (m.senderType !== incoming.senderType) return false;
      const mTs = m.createdAt ? new Date(m.createdAt).getTime() : 0;
      if (Math.abs(mTs - createdTs) > 5000) return false;
      if (body && String(m.body || '').trim() === body) return true;
      if (incoming.attachmentName && m.attachmentName === incoming.attachmentName) return true;
      return false;
    });
    if (dup) return list;
  }
  return [...list, incoming];
}

export function isImageAttachment(message) {
  const mime = String(message?.attachmentMimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const name = String(message?.attachmentName || '').toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
}

export function canSendSupportChatMessage(text, attachment) {
  return Boolean(String(text || '').trim() || attachment);
}
