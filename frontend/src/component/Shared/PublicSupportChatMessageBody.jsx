import React from 'react';
import { isImageAttachment } from '../../utils/publicSupportChatUi';

export default function PublicSupportChatMessageBody({ message, className = 'whitespace-pre-wrap break-words' }) {
  if (!message) return null;
  const body = String(message.body || '').trim();
  const attachmentName = String(message.attachmentName || '').trim();
  const bodyIsOnlyFilename = attachmentName && body === attachmentName;
  const showBody = body && !bodyIsOnlyFilename;

  return (
    <div className="space-y-1">
      {showBody ? <div className={className}>{message.body}</div> : null}
      {message.attachmentUrl ? (
        isImageAttachment(message) ? (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={message.attachmentUrl}
              alt={message.attachmentName || 'attachment'}
              className="max-h-48 max-w-full rounded-lg object-contain"
            />
          </a>
        ) : (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            📎 {message.attachmentName || 'Tệp đính kèm'}
          </a>
        )
      ) : attachmentName ? (
        isImageAttachment(message) ? (
          <span className="inline-flex items-center gap-1 text-xs">📷 {attachmentName}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs">📎 {attachmentName}</span>
        )
      ) : null}
    </div>
  );
}
