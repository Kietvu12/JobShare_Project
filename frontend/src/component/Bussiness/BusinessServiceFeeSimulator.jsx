import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, ChevronRight, RotateCcw } from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getServiceFeeSimulatorCopy } from '../../i18n/businessApp/serviceFeeSimulator.js';
import { formatYenAmount, formatCreditAmount } from '../../utils/businessCreditPackages.js';
import {
  getDefaultCreditsPerUnlock,
  simulateServiceFees,
  SIMULATOR_MARKETPLACE_PLATFORM_FEE_PERCENT,
  SIMULATOR_SERVICE_PATHS,
} from '../../utils/businessServiceFeeSimulator.js';
import { BUSINESS_HP_TEXT } from '../../utils/businessHomepageTypography';

/** Màu nhận diện từng dịch vụ (giống Fee Simulator của trang Dịch vụ & Chi phí). */
const SERVICE_META = {
  scout_credit: { accent: '#006aab', tint: '#edf7fd', upfront: true },
  scout_performance: { accent: '#06766b', tint: '#edf8f5', upfront: false },
  ctv_marketplace: { accent: '#60529a', tint: '#f5f2fb', upfront: false },
};

const LEVELS = ['junior', 'mid', 'senior'];
const DEFAULTS = {
  headcount: 1,
  annualIncome: 5000000,
  level: 'mid',
  budget: 1000000,
  ctvFeePerHire: 500000,
  opensPerHire: 20,
};

const FIELD_WRAP =
  'flex items-center overflow-hidden rounded border border-[#b7cdd9] bg-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0077B6]';
const FIELD_INPUT =
  'h-11 w-full min-w-0 border-0 bg-transparent px-3 text-[17px] font-semibold tabular-nums text-[#112f3d] outline-none';
const LABEL = 'mb-1.5 block text-[13px] font-bold leading-snug text-[#112f3d]';
const HINT = 'mt-1 text-[11px] leading-relaxed text-[#526b78]';

function localeOf(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

function YenInput({ id, value, onChange, language, unit }) {
  return (
    <div className={FIELD_WRAP}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value ? Number(value).toLocaleString(localeOf(language)) : value === 0 ? '0' : ''}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
          onChange(digits ? Number(digits) : 0);
        }}
        className={FIELD_INPUT}
      />
      <span className="whitespace-nowrap pr-3 text-xs text-[#526b78]">{unit}</span>
    </div>
  );
}

function IntInput({ id, value, onChange, unit, min = 1, max = 999 }) {
  return (
    <div className={FIELD_WRAP}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value || ''}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0);
        }}
        onBlur={() => {
          if (!value || value < min) onChange(min);
        }}
        className={FIELD_INPUT}
      />
      <span className="whitespace-nowrap pr-3 text-xs text-[#526b78]">{unit}</span>
    </div>
  );
}

function BudgetStatus({ status, t, yen }) {
  if (!status || status.key === 'none') return null;
  const tone = status.key === 'within' ? 'bg-[#eaf5ef] text-[#276148]' : 'bg-[#fff4df] text-[#805b1a]';
  const label =
    status.key === 'within'
      ? t.budgetWithin(yen(status.diff))
      : status.key === 'partial'
        ? t.budgetPartial(yen(status.diff))
        : t.budgetOver(yen(status.diff));
  return <span className={`inline-block rounded px-2.5 py-1 text-[11px] font-bold leading-relaxed ${tone}`}>{label}</span>;
}

function ResultCard({ index, result, t, yen, language, isCheapest, onOpen }) {
  const meta = SERVICE_META[result.key];
  const hasValue = result.total > 0;
  const lines = [];
  let amount = hasValue ? [yen(result.total)] : ['—'];
  let perHire = hasValue ? t.perHire(yen(result.perHire)) : '';

  if (result.key === 'scout_credit') {
    lines.push(
      t.creditDetail(result.totalOpens.toLocaleString(localeOf(language)), formatCreditAmount(result.creditsNeeded, language)),
    );
    if (result.packages.length) {
      lines.push(t.creditPackages(result.packages.map((p) => `${p.name} × ${p.count}`).join(' + ')));
    }
    if (result.affordableOpens != null) {
      lines.push(t.creditAffordable(result.affordableOpens.toLocaleString(localeOf(language))));
    }
  } else if (result.key === 'scout_performance') {
    if (hasValue && result.min !== result.max) {
      amount = [yen(result.min), yen(result.max)];
      perHire = t.perHireRange(yen(result.perHireMin), yen(result.perHireMax));
    } else if (hasValue) {
      perHire = t.perHire(yen(result.perHireMin));
    }
    lines.push(t.managedDetail(result.feeMin, result.feeMax));
  } else {
    lines.push(
      hasValue
        ? t.ctvDetail(yen(result.collaboratorPerHire), yen(result.platformFeePerHire), result.platformFeePercent)
        : t.ctvMissingFee,
    );
  }

  const note = { scout_credit: t.creditNote, scout_performance: t.managedNote, ctv_marketplace: t.ctvNote }[result.key];

  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-[5px] border border-[#c8dce7] border-t-4 bg-white ${
        isCheapest ? 'ring-2 ring-emerald-300' : ''
      }`}
      style={{ borderTopColor: meta.accent }}
    >
      <div className="flex flex-1 flex-col px-4 pb-3.5 pt-4" style={{ background: `linear-gradient(${meta.tint}, #fff 85%)` }}>
        <div className="mb-2.5 flex items-start gap-2">
          <span className="shrink-0 text-base font-medium leading-relaxed" style={{ color: meta.accent }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h4 className="min-w-0 flex-1 text-[17px] font-bold leading-normal" style={{ color: meta.accent }}>
            {t.services[result.key]}
          </h4>
        </div>
        <small className="text-[11px] text-[#526b78]">
          {t.estimatedTotal} · {meta.upfront ? t.payUpfront : t.payOnSuccess}
        </small>
        <p
          className={`mt-1 flex flex-wrap items-baseline gap-x-1.5 font-semibold leading-tight tracking-tight tabular-nums ${
            amount.length > 1 ? 'text-[22px] sm:text-[24px]' : 'text-[26px] sm:text-[28px]'
          }`}
          style={{ color: meta.accent }}
        >
          {amount.map((part, i) => (
            <React.Fragment key={part + i}>
              {i > 0 ? <span aria-hidden="true">–</span> : null}
              <span className="whitespace-nowrap">{part}</span>
            </React.Fragment>
          ))}
        </p>
        {perHire ? <p className="mt-0.5 text-xs font-semibold tabular-nums text-[#2f4d5c]">{perHire}</p> : null}
        {isCheapest || hasValue ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isCheapest ? (
              <span className="inline-block rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold leading-relaxed text-white">
                {t.cheapest}
              </span>
            ) : null}
            {hasValue ? <BudgetStatus status={result.budget} t={t} yen={yen} /> : null}
          </div>
        ) : null}
        <p className="mt-2.5 text-xs leading-relaxed text-[#526b78]">{note}</p>
      </div>

      <details className="group border-t border-[#dce8ee] bg-white px-4 py-2.5 text-xs">
        <summary
          className="flex cursor-pointer list-none items-center gap-1 font-bold [&::-webkit-details-marker]:hidden"
          style={{ color: meta.accent }}
        >
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          {t.formula}
        </summary>
        <ul className="mt-2 space-y-1.5 text-[#2f4d5c]">
          {lines.map((line) => (
            <li key={line} className="break-words leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </details>

      <div className="border-t border-[#dce8ee] bg-white p-3">
        <button
          type="button"
          onClick={() => onOpen(SIMULATOR_SERVICE_PATHS[result.key])}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: meta.accent }}
        >
          {t.cta[result.key]}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

/**
 * So sánh chi phí ước tính giữa Scout Credit / Scout Ủy Thác / Sàn CTV theo ngân sách DN nhập.
 */
export default function BusinessServiceFeeSimulator({ className = '', onNavigate, highlight = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useMemo(() => getServiceFeeSimulatorCopy(language), [language]);

  const [headcount, setHeadcount] = useState(DEFAULTS.headcount);
  const [annualIncome, setAnnualIncome] = useState(DEFAULTS.annualIncome);
  const [level, setLevel] = useState(DEFAULTS.level);
  const [budget, setBudget] = useState(DEFAULTS.budget);
  const [ctvFeePerHire, setCtvFeePerHire] = useState(DEFAULTS.ctvFeePerHire);
  const [opensPerHire, setOpensPerHire] = useState(DEFAULTS.opensPerHire);
  const [creditsPerUnlock, setCreditsPerUnlock] = useState(getDefaultCreditsPerUnlock());

  useEffect(() => {
    let cancelled = false;
    apiService.getBusinessScoutSettings?.()
      .then((res) => {
        const cost = Number(res?.data?.scoutCreditCost);
        if (!cancelled && Number.isFinite(cost) && cost > 0) setCreditsPerUnlock(cost);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const simulation = useMemo(
    () =>
      simulateServiceFees({
        headcount,
        annualIncome,
        level,
        budget,
        ctvFeePerHire,
        opensPerHire,
        creditsPerUnlock,
      }),
    [headcount, annualIncome, level, budget, ctvFeePerHire, opensPerHire, creditsPerUnlock],
  );

  const yen = (v) => formatYenAmount(Math.round(Number(v) || 0), language);
  const ctvResult = simulation.results.find((r) => r.key === 'ctv_marketplace');
  const openPath = (path) => (onNavigate ? onNavigate(path) : navigate(path));

  const reset = () => {
    setHeadcount(DEFAULTS.headcount);
    setAnnualIncome(DEFAULTS.annualIncome);
    setLevel(DEFAULTS.level);
    setBudget(DEFAULTS.budget);
    setCtvFeePerHire(DEFAULTS.ctvFeePerHire);
    setOpensPerHire(DEFAULTS.opensPerHire);
  };

  return (
    <section
      className={`w-full rounded-xl p-4 sm:p-5 ${
        highlight
          ? 'border border-[#0077B6]/25 bg-gradient-to-br from-[#e3f1f9] via-[#eef7fc] to-[#f5f0ff] shadow-md shadow-[#0077B6]/10'
          : 'border border-slate-200 bg-white'
      } ${className}`}
    >
      <header className="mb-4 flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            highlight ? 'bg-[#0077B6] shadow-sm shadow-[#0077B6]/30' : 'bg-[#e8f4fa]'
          }`}
        >
          <Calculator className={`h-[1.125rem] w-[1.125rem] ${highlight ? 'text-white' : 'text-[#0077B6]'}`} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#0077B6]">Fee simulator</p>
          <h2 className={BUSINESS_HP_TEXT.title}>{t.title}</h2>
          <p className={`mt-0.5 leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>{t.subtitle}</p>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-[#cbdfe9] bg-[#f7fafc] shadow-[0_8px_30px_#063c5610]">
        <div className="border-b border-[#cbdfe9] bg-[#eaf4fa] px-4 pb-3 pt-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#112f3d]">{t.inputTitle}</h3>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[#0077B6] hover:underline"
            >
              {t.reset}
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[0.7fr_1.1fr_1.1fr_0.9fr]">
            <div className="min-w-0">
              <label htmlFor="fee-sim-headcount" className={LABEL}>
                {t.inputHeadcount}
              </label>
              <IntInput id="fee-sim-headcount" value={headcount} onChange={setHeadcount} max={500} unit={t.unitPeople} />
            </div>
            <div className="min-w-0">
              <label htmlFor="fee-sim-income" className={LABEL}>
                {t.inputAnnualIncome}
              </label>
              <YenInput id="fee-sim-income" value={annualIncome} onChange={setAnnualIncome} language={language} unit="JPY" />
            </div>
            <div className="min-w-0">
              <label htmlFor="fee-sim-budget" className={LABEL}>
                {t.inputBudget}
              </label>
              <YenInput id="fee-sim-budget" value={budget} onChange={setBudget} language={language} unit="JPY" />
              <p className={HINT}>{t.budgetHint}</p>
            </div>
            <div className="min-w-0">
              <label htmlFor="fee-sim-level" className={LABEL}>
                {t.inputLevel}
              </label>
              <select
                id="fee-sim-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-11 w-full rounded border border-[#b7cdd9] bg-white px-3 text-[17px] font-semibold text-[#112f3d] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#0077B6]"
              >
                {LEVELS.map((key) => (
                  <option key={key} value={key}>
                    {t.levels[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <details className="group mt-2">
            <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 py-1.5 text-xs font-bold text-[#005b8d] [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
              {t.advanced}
            </summary>
            <div className="mt-2 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="fee-sim-opens" className={LABEL}>
                  {t.inputOpens}
                </label>
                <IntInput id="fee-sim-opens" value={opensPerHire} onChange={setOpensPerHire} max={999} unit={t.unitProfiles} />
                <p className={HINT}>{t.inputOpensHint(creditsPerUnlock)}</p>
              </div>
              <div className="min-w-0">
                <label htmlFor="fee-sim-ctv" className={LABEL}>
                  {t.inputCtvFee}
                </label>
                <YenInput id="fee-sim-ctv" value={ctvFeePerHire} onChange={setCtvFeePerHire} language={language} unit="JPY" />
                <p className={`${HINT} flex flex-wrap gap-x-2`}>
                  {ctvResult?.percentOfIncome != null && ctvFeePerHire > 0 ? (
                    <span>{t.ctvFeeOfIncome(ctvResult.percentOfIncome)}</span>
                  ) : null}
                  {ctvResult?.maxFeeForBudget ? (
                    <button
                      type="button"
                      onClick={() => setCtvFeePerHire(ctvResult.maxFeeForBudget)}
                      className="font-semibold text-[#0077B6] hover:underline"
                    >
                      {t.useMaxCtvFee(yen(ctvResult.maxFeeForBudget))}
                    </button>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#cbdfe9] pt-3 text-[11px] text-[#526b78]">
              <strong className="text-xs text-[#112f3d]">{t.assumptionsTitle}</strong>
              <span>{t.assumptionRates}</span>
              <span>{t.assumptionPlatform(SIMULATOR_MARKETPLACE_PLATFORM_FEE_PERCENT)}</span>
              <span>{t.assumptionCredit(creditsPerUnlock)}</span>
            </div>
          </details>
        </div>

        <div className="px-4 pb-4 pt-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[#112f3d]">{t.resultTitle}</h3>
            <span className="rounded bg-[#eaf5fb] px-2.5 py-1 text-[11px] font-bold text-[#005b8d]">{t.referenceBadge}</span>
          </div>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            {simulation.results.map((result, index) => (
              <ResultCard
                key={result.key}
                index={index}
                result={result}
                t={t}
                yen={yen}
                language={language}
                isCheapest={simulation.cheapestKey === result.key}
                onOpen={openPath}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#526b78]">{t.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
