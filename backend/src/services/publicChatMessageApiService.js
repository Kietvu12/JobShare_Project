import {
  uploadBufferToS3,
  buildPublicChatAttachmentKey,
  getSignedUrlForFile,
  makeDownloadDisposition,
} from './s3Service.js';
import { enrichPublicChatMessage } from './publicChatReadService.js';

export async function serializePublicChatMessageForApi(message, session) {
  const base = enrichPublicChatMessage(message, session);
  const attachmentKey = message.attachmentKey ?? message.attachment_key;
  if (attachmentKey) {
    const attachmentName = message.attachmentName ?? message.attachment_name ?? 'attachment';
    const disposition = makeDownloadDisposition(attachmentName);
    base.attachmentUrl = await getSignedUrlForFile(attachmentKey, 'download', disposition);
    base.attachmentName = attachmentName;
    base.attachmentMimeType = message.attachmentMimeType ?? message.attachment_mime_type ?? null;
    base.attachmentSize = message.attachmentSize ?? message.attachment_size ?? null;
  }
  return base;
}

export async function serializePublicChatMessagesForApi(messages, session) {
  return Promise.all((messages || []).map((m) => serializePublicChatMessageForApi(m, session)));
}

/**
 * @param {object} opts
 * @param {'ctv'|'candidate'} opts.kind
 * @param {import('sequelize').Model} opts.MessageModel
 * @param {import('sequelize').Model} opts.session
 * @param {'visitor'|'admin'} opts.senderType
 * @param {number|null} opts.adminId
 * @param {string} opts.body
 * @param {Express.Multer.File|null} opts.file
 */
export async function createPublicChatMessageRecord({
  kind,
  MessageModel,
  session,
  senderType,
  adminId = null,
  body = '',
  file = null,
}) {
  const text = typeof body === 'string' ? body.trim() : '';
  let attachmentName = null;
  let attachmentKey = null;
  let attachmentMimeType = null;
  let attachmentSize = null;

  if (file?.buffer) {
    attachmentName = file.originalname || 'attachment';
    attachmentMimeType = file.mimetype || 'application/octet-stream';
    attachmentSize = file.size || 0;
    attachmentKey = buildPublicChatAttachmentKey(kind, session.id, attachmentName);
    await uploadBufferToS3(file.buffer, attachmentKey, attachmentMimeType);
  }

  if (!text && !attachmentKey) {
    const err = new Error('Nội dung tin nhắn hoặc tệp đính kèm không được để trống');
    err.statusCode = 400;
    throw err;
  }

  const msg = await MessageModel.create({
    sessionId: session.id,
    senderType,
    adminId: senderType === 'admin' ? adminId : null,
    body: (text || attachmentName || '').slice(0, 8000),
    attachmentName,
    attachmentKey,
    attachmentMimeType,
    attachmentSize,
  });

  return msg;
}

export function buildPublicChatPreview(message) {
  if (!message) return '';
  const attachmentName = message.attachmentName ?? message.attachment_name;
  const mime = String(message.attachmentMimeType ?? message.attachment_mime_type ?? '').toLowerCase();
  if (attachmentName) {
    if (mime.startsWith('image/')) return '📷 Ảnh';
    return `📎 ${attachmentName}`;
  }
  return String(message.body || '').slice(0, 160);
}
