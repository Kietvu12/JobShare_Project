import React, { useRef } from 'react';
import { ImagePlus, X, Paperclip } from 'lucide-react';
import { canSendSupportChatMessage } from '../../utils/publicSupportChatUi';

const VARIANTS = {
  default: {
    attachBtn:
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50',
    attachIcon: 'h-4 w-4',
    textarea:
      'h-9 min-h-9 max-h-24 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg border border-slate-200 px-3 py-2 text-sm leading-snug outline-none focus:border-red-400 disabled:opacity-60',
    sendBtn:
      'flex h-9 shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50',
    attachmentChip: 'text-xs',
    rowGap: 'gap-2',
  },
  compact: {
    attachBtn:
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#6b7280] hover:bg-[#fafafa] disabled:opacity-50',
    attachIcon: 'h-3.5 w-3.5',
    textarea:
      'h-8 min-h-8 max-h-20 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-2.5 py-1.5 text-[10px] leading-snug text-[#111827] outline-none focus:border-[#d1d5db] focus:bg-white disabled:opacity-60',
    sendBtn:
      'flex h-8 shrink-0 items-center justify-center rounded-full bg-[#ED212F] px-3 text-[10px] font-semibold text-white shadow-sm disabled:opacity-50',
    attachmentChip: 'text-[9px]',
    rowGap: 'gap-1.5',
  },
};

/**
 * Ô nhập tin chat hỗ trợ: Enter xuống dòng, Ctrl/Cmd+Enter gửi, đính kèm ảnh/tệp.
 */
export default function PublicSupportChatComposer({
  value,
  onChange,
  onSend,
  sending = false,
  disabled = false,
  placeholder = 'Nhập tin nhắn…',
  sendLabel = 'Gửi',
  attachment = null,
  onAttachmentChange,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar',
  className = '',
  variant = 'default',
}) {
  const fileInputRef = useRef(null);
  const canSend = canSendSupportChatMessage(value, attachment) && !sending && !disabled;
  const styles = VARIANTS[variant] || VARIANTS.default;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSend) onSend?.();
    }
  };

  const pickFile = () => {
    if (!disabled && !sending) fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {attachment && (
        <div
          className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-700 ${styles.attachmentChip}`}
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
          <button
            type="button"
            onClick={() => onAttachmentChange?.(null)}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
            aria-label="Xóa tệp đính kèm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className={`flex items-center ${styles.rowGap}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onAttachmentChange?.(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || sending}
          className={styles.attachBtn}
          title="Đính kèm ảnh hoặc tệp"
        >
          <ImagePlus className={styles.attachIcon} />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled || sending}
          placeholder={`${placeholder} (Ctrl+Enter gửi)`}
          className={styles.textarea}
        />
        <button type="button" disabled={!canSend} onClick={() => onSend?.()} className={styles.sendBtn}>
          {sendLabel}
        </button>
      </div>
    </div>
  );
}
