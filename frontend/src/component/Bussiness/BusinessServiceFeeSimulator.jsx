import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, Coins, UserPlus, Users2 } from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getServiceFeeSimulatorCopy } from '../../i18n/businessApp/serviceFeeSimulator.js';
import { formatYenAmount, formatCreditAmount } from '../../utils/businessCreditPackages.js';
import {
  getDefaultCreditsPerUnlock,
  simulateServiceFees,
  SIMULATOR_SERVICE_PATHS,
} from '../../utils/businessServiceFeeSimulator.js';
import { CARD } from '../../utils/businessHomepageShell';
import { BUSINESS_HP_TEXT } from '../../utils/businessHomepageTypography';

const SERVICE_META = {
  scout_credit: { icon: Coins, color: '#3b82f6', bg: '#eff6ff', upfront: true },
  scout_performance: { icon: UserPlus, color: '#f59e0b', bg: '#fffbeb', upfront: false },
  ctv_marketplace: { icon: Users2, color: '#8b5cf6', bg: '#f5f3ff', upfront: false },
};

const LEVELS = ['junior', 'mid', 'senior'];
const LEVEL_SHORT = { junior: 'Junior', mid: 'Mid', senior: 'Senior' };

const INPUT_CLASS = `w-full rounded-lg border border-slate-200 bg-white px-3 py-2 tabular-nums text-slate-900 outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/15 ${BUSINESS_HP_TEXT.body}`;
const LABEL_CLASS = 'mb-1 block text-xs font-semibold text-slate-600 sm:text-sm';

function localeOf(language) {
  if (language === 'ja') return 'ja-JP';
  if (language === 'en') return 'en-US';
  return 'vi-VN';
}

function YenInput({ id, value, onChange, language, suffix }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value ? Number(value).toLocaleString(localeOf(language)) : ''}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
          onChange(digits ? Number(digits) : 0);
        }}
        className={`${INPUT_CLASS} pr-12`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
        {suffix}
      </span>
    </div>
  );
}

function IntInput({ id, value, onChange, min = 1, max = 999 }) {
  return (
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
      onBlur={() => { if (!value || value < min) onChange(min); }}
      className={INPUT_CLASS}
    />
  );
}

function BudgetChip({ status, t, yen }) {
  if (!status || status.key === 'none') return null;
  const styles = {
    within: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    partial: 'bg-amber-50 text-amber-700 ring-amber-200',
    over: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  const label = status.key === 'within'
    ? t.budgetWithin(yen(status.diff))
    : status.key === 'partial'
      ? t.budgetPartial(yen(status.diff))
      : t.budgetOver(yen(status.diff));
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status.key]}`}>
      {label}
    </span>
  );
}

function ResultCard({ result, t, yen, language, isCheapest, onOpen }) {
  const meta = SERVICE_META[result.key];
  const Icon = meta.icon;
  const hasValue = result.total > 0;

  let totalLabel = hasValue ? yen(result.total) : '—';
  let perHireLabel = hasValue ? t.perHire(yen(result.perHire)) : '';
  const details = [];
  let note = '';

  if (result.key === 'scout_credit') {
    details.push(t.creditDetail(
      result.totalOpens.toLocaleString(localeOf(language)),
      formatCreditAmount(result.creditsNeeded, language),
    ));
    if (result.packages.length) {
      details.push(t.creditPackages(result.packages.map((p) => `${p.count}× ${p.name}`).join(' + ')));
    }
    if (result.affordableOpens != null) {
      details.push(t.creditAffordable(result.affordableOpens.toLocaleString(localeOf(language))));
    }
    note = t.creditNote;
  } else if (result.key === 'scout_performance') {
    if (hasValue && result.min !== result.max) {
      totalLabel = `${yen(result.min)} – ${yen(result.max)}`;
      perHireLabel = t.perHireRange(yen(result.perHireMin), yen(result.perHireMax));
    } else if (hasValue) {
      perHireLabel = t.perHire(yen(result.perHireMin));
    }
    details.push(t.managedDetail(result.feeMin, result.feeMax));
    note = t.managedNote;
  } else {
    if (hasValue) {
      details.push(t.ctvDetail(yen(result.collaboratorPerHire), yen(result.platformFeePerHire), result.platformFeePercent));
    } else {
      details.push(t.ctvMissingFee);
    }
    note = t.ctvNote;
  }

  return (
    <article
      className={`relative flex h-full flex-col gap-3 rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
        isCheapest ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ background: meta.color }} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: meta.bg }}>
            <Icon className="h-[1.125rem] w-[1.125rem]" style={{ color: meta.color }} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">{t.services[result.key]}</h3>
            <p className="text-xs leading-snug text-slate-500">{t.models[result.key]}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            meta.upfront ? 'bg-slate-100 text-slate-600' : 'bg-[#e8f4fa] text-[#0077B6]'
          }`}
        >
          {meta.upfront ? t.payUpfront : t.payOnSuccess}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">{t.estimatedTotal}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight text-slate-900 sm:text-xl">{totalLabel}</p>
        {perHireLabel ? <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-600 sm:text-sm">{perHireLabel}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {isCheapest ? (
          <span className="inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">{t.cheapest}</span>
        ) : null}
        {hasValue ? <BudgetChip status={result.budget} t={t} yen={yen} /> : null}
      </div>

      <ul className="flex flex-col gap-1 text-xs leading-snug text-slate-600 sm:text-sm">
        {details.map((line) => (
          <li key={line} className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <p className="mt-auto border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-500">{note}</p>

      <button
        type="button"
        onClick={() => onOpen(SIMULATOR_SERVICE_PATHS[result.key])}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:text-sm"
        style={{ background: meta.color }}
      >
        {t.cta[result.key]}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
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

  const [headcount, setHeadcount] = useState(1);
  const [annualIncome, setAnnualIncome] = useState(5000000);
  const [level, setLevel] = useState('mid');
  const [budget, setBudget] = useState(1000000);
  const [ctvFeePerHire, setCtvFeePerHire] = useState(500000);
  const [opensPerHire, setOpensPerHire] = useState(20);
  const [creditsPerUnlock, setCreditsPerUnlock] = useState(getDefaultCreditsPerUnlock());

  useEffect(() => {
    let cancelled = false;
    apiService.getBusinessScoutSettings?.()
      .then((res) => {
        const cost = Number(res?.data?.scoutCreditCost);
        if (!cancelled && Number.isFinite(cost) && cost > 0) setCreditsPerUnlock(cost);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const simulation = useMemo(
    () => simulateServiceFees({
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

  return (
    <section
      className={`w-full p-3 sm:p-4 ${
        highlight
          ? 'rounded-2xl border border-[#0077B6]/25 bg-gradient-to-br from-[#e3f1f9] via-[#eef7fc] to-[#f5f0ff] shadow-md shadow-[#0077B6]/10 sm:p-5'
          : CARD
      } ${className}`}
    >
      <header
        className={`mb-3 flex flex-col gap-1 border-b pb-3 sm:flex-row sm:items-start sm:gap-3 ${
          highlight ? 'border-[#0077B6]/15' : 'border-slate-100'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            highlight ? 'bg-[#0077B6] shadow-sm shadow-[#0077B6]/30' : 'bg-[#e8f4fa]'
          }`}
        >
          <Calculator className={`h-[1.125rem] w-[1.125rem] ${highlight ? 'text-white' : 'text-[#0077B6]'}`} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className={BUSINESS_HP_TEXT.title}>{t.title}</h2>
          <p className={`mt-0.5 leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>{t.subtitle}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <div>
          <label htmlFor="fee-sim-headcount" className={LABEL_CLASS}>{t.inputHeadcount}</label>
          <IntInput id="fee-sim-headcount" value={headcount} onChange={setHeadcount} max={500} />
        </div>
        <div>
          <label htmlFor="fee-sim-income" className={LABEL_CLASS}>{t.inputAnnualIncome}</label>
          <YenInput id="fee-sim-income" value={annualIncome} onChange={setAnnualIncome} language={language} suffix={t.yenSuffix} />
        </div>
        <div>
          <span className={LABEL_CLASS}>{t.inputLevel}</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
            {LEVELS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLevel(key)}
                title={t.levels[key]}
                className={`truncate rounded-md px-1.5 py-1.5 text-xs font-semibold transition-colors ${
                  level === key ? 'bg-white text-[#0077B6] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {LEVEL_SHORT[key]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">{t.levels[level]}</p>
        </div>
        <div>
          <label htmlFor="fee-sim-budget" className={LABEL_CLASS}>{t.inputBudget}</label>
          <YenInput id="fee-sim-budget" value={budget} onChange={setBudget} language={language} suffix={t.yenSuffix} />
        </div>
        <div>
          <label htmlFor="fee-sim-ctv" className={LABEL_CLASS}>{t.inputCtvFee}</label>
          <YenInput id="fee-sim-ctv" value={ctvFeePerHire} onChange={setCtvFeePerHire} language={language} suffix={t.yenSuffix} />
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
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
          </div>
        </div>
        <div>
          <label htmlFor="fee-sim-opens" className={LABEL_CLASS}>{t.inputOpens}</label>
          <IntInput id="fee-sim-opens" value={opensPerHire} onChange={setOpensPerHire} max={999} />
          <p className="mt-1 text-xs text-slate-500">{t.inputOpensHint(creditsPerUnlock)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {simulation.results.map((result) => (
          <ResultCard
            key={result.key}
            result={result}
            t={t}
            yen={yen}
            language={language}
            isCheapest={simulation.cheapestKey === result.key}
            onOpen={openPath}
          />
        ))}
      </div>

      <p className={`mt-3 text-xs leading-relaxed ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>{t.disclaimer}</p>
    </section>
  );
}
