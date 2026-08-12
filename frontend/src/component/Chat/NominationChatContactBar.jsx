import React from 'react';
import { Phone } from 'lucide-react';
import {
  WS_SUPPORT_PHONE_DISPLAY,
  WS_SUPPORT_PHONE_TEL,
  formatPhoneTel,
} from '../../utils/wsSupportContact';

export default function NominationChatContactBar({ responsibleContact = null }) {
  const wsPhone = responsibleContact?.wsPhone || WS_SUPPORT_PHONE_DISPLAY;
  const wsPhoneTel = responsibleContact?.wsPhoneTel || WS_SUPPORT_PHONE_TEL;
  const adminName = responsibleContact?.adminName;
  const adminPhone = responsibleContact?.adminPhone;
  const adminPhoneTel = formatPhoneTel(adminPhone);

  return (
    <div className="shrink-0 border-b border-[#0077B6]/15 bg-[#e8f4fa] px-3 py-2 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-relaxed text-[#006399]">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          SĐT phụ trách WS:
          <a
            href={`tel:${wsPhoneTel}`}
            className="font-bold underline decoration-[#0077B6]/35 underline-offset-2 hover:text-[#0077B6]"
          >
            {wsPhone}
          </a>
        </span>
        {adminName && adminPhone ? (
          <span className="text-slate-600">
            Admin phụ trách — {adminName}:{' '}
            <a
              href={`tel:${adminPhoneTel}`}
              className="font-semibold text-[#006399] underline decoration-[#0077B6]/25 underline-offset-2 hover:text-[#0077B6]"
            >
              {adminPhone}
            </a>
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
        Liên hệ trực tiếp khi cần. Xác nhận tuyển thành công vẫn thực hiện trên sàn để có căn cứ thanh toán &amp; chia phí.
      </p>
    </div>
  );
}
