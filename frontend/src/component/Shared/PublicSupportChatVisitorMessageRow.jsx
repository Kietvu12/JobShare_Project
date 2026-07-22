import React from 'react';
import PublicSupportChatMessageBody from './PublicSupportChatMessageBody';
import {
  formatSupportChatMessageTime,
  messageHasAttachment,
  resolveVisitorSideChatStatus,
} from '../../utils/publicSupportChatUi';

export default function PublicSupportChatVisitorMessageRow({
  message,
  displayName,
  agentMetaLabel,
  renderTextBody,
}) {
  if (!message) return null;

  const isVisitor = message.senderType === 'visitor';
  const sentAtLabel = formatSupportChatMessageTime(message.createdAt || message.created_at);
  const statusLabel = resolveVisitorSideChatStatus(message);
  const hasAttachment = messageHasAttachment(message);

  return (
    <div>
      <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[92%] rounded-xl px-2 py-1.5 text-[10px] leading-snug ${
            isVisitor
              ? 'bg-[#ED212F] text-white'
              : 'border border-[#ececec] bg-white text-[#1f2937] shadow-sm'
          }`}
        >
          {hasAttachment ? (
            <PublicSupportChatMessageBody
              message={message}
              className="whitespace-pre-wrap break-words text-[10px]"
            />
          ) : (
            renderTextBody?.(message.body, { isVisitorBubble: isVisitor }) ?? message.body
          )}
        </div>
      </div>
      <p
        className={`mt-0.5 text-[9px] text-[#9ca3af] ${isVisitor ? 'text-right' : ''}`}
      >
        {isVisitor ? displayName : agentMetaLabel}
        {sentAtLabel ? <> • {sentAtLabel}</> : null}
        {statusLabel ? (
          <>
            {' '}
            •{' '}
            <span
              className={
                isVisitor && !message.isReadByAdmin ? 'font-semibold text-[#ED212F]' : ''
              }
            >
              {statusLabel}
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
