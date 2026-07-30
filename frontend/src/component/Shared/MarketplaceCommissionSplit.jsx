import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import {
  normalizeJobCommissionType,
  pickPrimaryCommissionJobValue,
} from '../../utils/jobCommissionUi';

const MARKETPLACE_FEE_I18N = {
  vi: {
    agentBar: 'Phí giới thiệu bạn dự kiến nhận được',
    customerBar: 'Phí tuyển dụng từ doanh nghiệp',
    breakdownTitle: 'Phí giới thiệu bạn nhận được cho JD này',
    customerShort: 'Phí khách hàng',
    serviceFeeLabel: 'Phí dịch vụ',
    agentShort: 'Phí bạn được nhận',
    helpAria: 'Cách tính phí giới thiệu',
  },
  en: {
    agentBar: 'Estimated referral fee for you',
    customerBar: 'Recruitment fee from client',
    breakdownTitle: 'Referral fee breakdown for this job',
    customerShort: 'Client fee',
    serviceFeeLabel: 'Service fee',
    agentShort: 'Your fee',
    helpAria: 'Referral fee calculation',
  },
  ja: {
    agentBar: '受け取れる紹介料',
    customerBar: '企業からの紹介料',
    breakdownTitle: 'この求人で受け取れる紹介料',
    customerShort: '紹介料※',
    serviceFeeLabel: 'JobShare手数料',
    agentShort: '最終受取額',
    helpAria: '紹介料の計算',
  },
};

function marketplaceFeeLabels(language) {
  return MARKETPLACE_FEE_I18N[language] || MARKETPLACE_FEE_I18N.vi;
}

function formatMarketplacePercentOfAnnual(percentNumeric, language) {
  const n = typeof percentNumeric === 'number' ? percentNumeric : parseFloat(percentNumeric);
  if (!Number.isFinite(n)) return '';
  if (n < 0) return formatMarketplacePercentOfAnnual(0, language);
  const formatted = Number.isInteger(n)
    ? n.toLocaleString('vi-VN')
    : n.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  if (language === 'en') return `${formatted}% of annual income`;
  if (language === 'ja') return `${formatted}%（年収）`;
  return `${formatted}% thu nhập năm`;
}

function MarketplaceCommissionBreakdownTooltip({ split, language }) {
  const t = marketplaceFeeLabels(language);
  const cellClass = (accent) =>
    `flex min-w-[4.5rem] flex-col items-center justify-center rounded-lg px-2 py-2 text-center sm:min-w-[5.5rem] sm:px-3 ${
      accent ? 'bg-[#DF2020] text-white' : 'bg-slate-100 text-slate-800'
    }`;
  const valueClass = (accent) =>
    `text-sm font-bold sm:text-base ${accent ? '' : 'text-[#1e3a8a]'}`;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5"
      role="tooltip"
    >
      <p className="mb-3 text-center text-[11px] font-bold leading-snug text-slate-800 sm:text-xs">
        {t.breakdownTitle}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
        <div className={cellClass(false)}>
          <div className={valueClass(false)}>{split.customerFeeText}</div>
          <div className="mt-1 text-[8px] leading-tight text-slate-500 sm:text-[9px]">{t.customerShort}</div>
        </div>
        <span className="px-0.5 text-sm font-bold text-slate-400">−</span>
        <div className={cellClass(false)}>
          <div className={valueClass(false)}>{split.serviceFeeText}</div>
          <div className="mt-1 text-[8px] leading-tight text-slate-500 sm:text-[9px]">
            {t.serviceFeeLabel}
          </div>
        </div>
        <span className="px-0.5 text-sm font-bold text-slate-400">=</span>
        <div className={cellClass(true)}>
          <div className={valueClass(true)}>{split.agentFeeText}</div>
          <div className="mt-1 text-[8px] leading-tight text-white/90 sm:text-[9px]">{t.agentShort}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phí DN và phí sàn là hai % độc lập (cùng đơn vị thu nhập năm):
 *   phí bạn nhận = phí DN − phí sàn   (vd. 35 − 20 = 15)
 * Phí cố định: trừ đúng % phí sàn khỏi số tiền DN (không nhân level ranking).
 */
export function computeMarketplaceCommissionSplit({
  job,
  useAdminAPI,
  jobValues,
  formatAmountWithCurrency,
  campaignPercent,
  language,
}) {
  if (useAdminAPI) return null;

  const isMarketplace = !!(
    job?.isMarketplace
    || job?.isDirectRecruitment
    || job?.platformFeePercent != null
    || job?.platform_fee_percent != null
    || job?.businessId != null
    || job?.business_id != null
  );
  if (!isMarketplace) return null;

  const platformPct = Number(
    job.platformFeePercent ?? job.platform_fee_percent ?? 20,
  );
  if (!Number.isFinite(platformPct)) return null;

  const rows = Array.isArray(jobValues) ? jobValues : [];
  const primary = pickPrimaryCommissionJobValue(rows) ?? rows[0] ?? null;
  const commissionType = normalizeJobCommissionType(job);

  const resolveJobPercent = () => {
    const campaignPct =
      campaignPercent != null && Number(campaignPercent) > 0 ? Number(campaignPercent) : null;
    if (campaignPct != null) return campaignPct;
    const rawPct = primary?.value != null ? parseFloat(String(primary.value)) : NaN;
    if (Number.isFinite(rawPct) && rawPct > 0) return rawPct;
    for (const jv of rows) {
      const n = jv?.value != null ? parseFloat(String(jv.value)) : NaN;
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  };

  if (commissionType === 'fixed') {
    const raw = primary?.value;
    if (raw == null || String(raw).trim() === '') return null;
    const customerAmount = parseFloat(String(raw));
    if (!Number.isFinite(customerAmount) || customerAmount <= 0) return null;
    const serviceAmount = customerAmount * (platformPct / 100);
    const agentAmount = Math.max(0, customerAmount - serviceAmount);
    return {
      displayMode: 'fixed',
      platformFeePercent: platformPct,
      customerFeeText: formatAmountWithCurrency(customerAmount),
      serviceFeeText: `${platformPct}%`,
      agentFeeText: formatAmountWithCurrency(agentAmount),
    };
  }

  // percent (mặc định cho job DN trên sàn): hiển thị %, trừ thẳng phí sàn
  const jobPercent = resolveJobPercent();
  if (!Number.isFinite(jobPercent) || jobPercent <= 0) return null;
  const agentPercent = Math.max(0, jobPercent - platformPct);
  return {
    displayMode: 'percent',
    platformFeePercent: platformPct,
    customerFeeText: formatMarketplacePercentOfAnnual(jobPercent, language),
    serviceFeeText: `${platformPct}%`,
    agentFeeText: formatMarketplacePercentOfAnnual(agentPercent, language),
  };
}

export function MarketplaceCommissionSplitPanel({ split, language }) {
  const t = marketplaceFeeLabels(language);
  const [tipOpen, setTipOpen] = useState(false);
  const helpRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [tipPos, setTipPos] = useState(null);
  const amountSize =
    split.displayMode === 'percent'
      ? 'text-[12px] sm:text-[13px]'
      : 'text-[15px] sm:text-[17px]';

  const updateTipPosition = () => {
    const el = helpRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(420, window.innerWidth - 16);
    let left = r.right - width;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
    setTipPos({
      top: r.bottom + 8,
      left,
      width,
    });
  };

  const openTip = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updateTipPosition();
    setTipOpen(true);
  };

  const closeTip = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setTipOpen(false), 120);
  };

  useEffect(() => {
    if (!tipOpen) return undefined;
    const onScrollOrResize = () => updateTipPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [tipOpen]);

  return (
    <div className="relative z-[20] flex-shrink-0 overflow-visible">
      <div className="overflow-visible shadow-sm">
        <div className="relative flex min-h-[58px] items-center overflow-visible rounded-t-md bg-[#df2020] pl-[4.75rem] pr-11 sm:pl-[5.25rem] sm:pr-12">
          <div className="absolute left-0 top-0 bottom-0 z-[1] flex w-[4.5rem] items-center justify-center border-r border-[#a01818]/40 bg-[#b01818] px-1 py-1.5 text-center text-[9px] font-semibold leading-[1.25] text-white sm:w-[5rem] sm:text-[10px]">
            {t.agentBar}
          </div>
          <div
            className={`min-w-0 flex-1 px-1 text-center font-extrabold leading-snug tracking-tight text-white ${amountSize}`}
          >
            {split.agentFeeText}
          </div>
          <div className="absolute right-1.5 top-1/2 z-[2] -translate-y-1/2">
            <button
              ref={helpRef}
              type="button"
              aria-label={t.helpAria}
              aria-expanded={tipOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/95 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              onMouseEnter={openTip}
              onMouseLeave={closeTip}
              onFocus={openTip}
              onBlur={closeTip}
            >
              <HelpCircle className="h-[22px] w-[22px]" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-[52px] items-center rounded-b-md bg-[#d8e2eb] pl-[4.75rem] sm:pl-[5.25rem]">
          <div className="absolute left-0 top-0 bottom-0 z-[1] flex w-[4.5rem] items-center justify-center border-r border-[#0d5a8a]/30 bg-[#0077B6] px-1 py-1.5 text-center text-[9px] font-semibold leading-[1.25] text-white sm:w-[5rem] sm:text-[10px]">
            {t.customerBar}
          </div>
          <div
            className={`min-w-0 flex-1 px-1 text-center font-extrabold leading-snug text-slate-900 ${amountSize}`}
          >
            {split.customerFeeText}
          </div>
        </div>
      </div>
      {tipOpen && tipPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="z-[9999]"
              style={{
                position: 'fixed',
                top: tipPos.top,
                left: tipPos.left,
                width: tipPos.width,
              }}
              onMouseEnter={openTip}
              onMouseLeave={closeTip}
            >
              <MarketplaceCommissionBreakdownTooltip split={split} language={language} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default MarketplaceCommissionSplitPanel;
