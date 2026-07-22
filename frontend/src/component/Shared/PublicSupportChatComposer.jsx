import React, { useRef } from 'react';
import { ImagePlus, X, Paperclip } from 'lucide-react';
import { canSendSupportChatMessage } from '../../utils/publicSupportChatUi';

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
  attachment = null,
  onAttachmentChange,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar',
  className = '',
}) {
  const fileInputRef = useRef(null);
  const canSend = canSendSupportChatMessage(value, attachment) && !sending && !disabled;

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
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
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
      <div className="flex items-end gap-2">
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
          className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          title="Đính kèm ảnh hoặc tệp"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={disabled || sending}
          placeholder={`${placeholder} (Ctrl+Enter để gửi)`}
          className="min-h-[44px] min-w-0 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={() => onSend?.()}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
