import React from 'react';
import {
  ArrowRight, Building2, Calendar, Info, Loader2, MapPin, Search, Sparkles, Star, Target, User,
} from 'lucide-react';

function truncateText(text, maxLen = 96) {
  const t = String(text ?? '').trim();
  if (!t) return '—';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

export function pickShortSkillLabels(skills, maxTags = 4) {
  const raw = (skills || []).flatMap((s) => {
    const str = String(s ?? '').trim();
    if (!str) return [];
    if (str.length > 56) return [];
    return str.split(/[,、|/·]/).map((x) => x.trim()).filter(Boolean);
  });
  const uniq = [];
  raw.forEach((tag) => {
    const cleaned = tag.length > 32 ? `${tag.slice(0, 32)}…` : tag;
    if (cleaned.length >= 2 && !uniq.includes(cleaned)) uniq.push(cleaned);
  });
  return uniq.slice(0, maxTags);
}

export function getHealthRatingBadgeClass(rating) {
  const r = String(rating || '').toLowerCase();
  if (r.includes('tốt') || r === 'excellent' || r.includes('良好')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (r.includes('khá') || r === 'good' || r.includes('やや')) {
    return 'bg-sky-100 text-sky-800';
  }
  if (r.includes('trung bình') || r === 'average' || r === '普通') {
    return 'bg-amber-100 text-amber-800';
  }
  if (r.includes('cải thiện') || r.includes('improvement') || r.includes('改善')) {
    return 'bg-orange-100 text-orange-800';
  }
  if (r.includes('chưa') || r.includes('no data') || r.includes('データ')) {
    return 'bg-slate-100 text-slate-600';
  }
  return 'bg-slate-100 text-slate-600';
}

export function HealthOverviewGrid({ cards, title = 'Recruitment Health' }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-1.5">
        <h2 className="text-xs font-semibold text-slate-800 sm:text-sm">{title}</h2>
        <span className="text-[10px] text-slate-400">Di chuột vào điểm để xem cách tính</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-1.5 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const showScore = c.showScore !== false;
          return (
            <div
              key={c.label}
              className="min-w-0 rounded-md border border-slate-100 bg-slate-50/50 p-1.5"
              title={c.tooltip || ''}
            >
              <div className="mb-0.5 flex min-w-0 items-center gap-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                  <Icon className="h-3 w-3" />
                </div>
                <span className="truncate text-[10px] font-medium text-slate-600">{c.label}</span>
              </div>
              {showScore ? (
                <p className="text-sm font-bold leading-none text-indigo-600">
                  {c.score}
                  <span className="text-[10px] font-normal text-slate-500">/100</span>
                </p>
              ) : (
                <p className="text-[11px] font-semibold leading-snug text-slate-600">{c.scoreDisplay}</p>
              )}
              <span className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-semibold ${getHealthRatingBadgeClass(c.rating)}`}>
                {c.rating}
              </span>
              {c.lines?.filter(Boolean).slice(0, 2).map((line) => (
                <p key={line} className="mt-0.5 truncate text-[10px] leading-snug text-slate-500">{line}</p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AiMatchOverviewCard({
  matchLoading,
  matchedTotal,
  matchError,
  matchStats,
  aiInsights,
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5">
        <Target className="h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
        <span className="text-xs font-semibold text-slate-800">AI gợi ý ứng viên</span>
        <span className="ml-auto rounded-full bg-[#0077B6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0077B6]">
          Scout
        </span>
      </div>
      <div className="min-w-0 space-y-2 p-2.5">
        <p className="text-xs font-semibold text-slate-900 sm:text-sm">
          {matchLoading
            ? 'Đang phân tích ứng viên phù hợp...'
            : `Có ${matchedTotal.toLocaleString('vi-VN')} hồ sơ phù hợp với JD này`}
        </p>
        {matchError ? (
          <p className="rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
            {matchError}
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-1.5">
          {matchStats.map((m) => (
            <div key={m.label} className="min-w-0 rounded-md bg-slate-50 px-1.5 py-1">
              <p className="text-sm font-bold text-slate-900">{matchLoading ? '…' : m.value}</p>
              <p className="line-clamp-2 text-[10px] leading-snug text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-slate-100 pt-1.5">
          {aiInsights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="grid grid-cols-1 items-start gap-0.5 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-2">
                <span className="flex min-w-0 items-center gap-1 text-[10px] text-slate-500">
                  <Icon className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span
                  className={`min-w-0 break-words text-[11px] font-medium line-clamp-2 sm:text-right ${item.valueColor ? '' : 'text-slate-800'}`}
                  style={item.valueColor ? { color: item.valueColor } : undefined}
                >
                  {truncateText(item.value, 120)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TopCandidatesOverview({
  matchLoading,
  topCandidates,
  onViewAll,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-1.5">
        <h2 className="text-xs font-semibold text-slate-800 sm:text-sm">Top ứng viên phù hợp</h2>
        <Info className="h-3 w-3 shrink-0 text-slate-300" />
      </div>
      <div className="p-2.5">
        {matchLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang tải gợi ý AI...
          </div>
        ) : topCandidates.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-slate-500">Chưa có ứng viên phù hợp hoặc JD chưa đồng bộ vector.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {topCandidates.map((c, i) => {
              const tags = pickShortSkillLabels(c.skills, 4);
              return (
                <li
                  key={c.id || i}
                  className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 p-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{c.name}</p>
                        <p className="line-clamp-1 text-[10px] text-slate-500">{truncateText(c.role, 80)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {c.match}% match
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {c.exp}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </span>
                  </div>
                  {tags.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tags.map((sk) => (
                        <span key={sk} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                          {sk}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 rounded-lg border border-[#0077B6]/25 bg-[#0077B6]/5 px-2.5 py-1 text-[11px] font-semibold text-[#0077B6] transition-colors hover:bg-[#0077B6]/10"
          >
            Xem tất cả ứng viên match
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

const SERVICE_STATUS_ACTIVE = 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80';
const SERVICE_STATUS_IDLE = 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80';

export function ServicesActivityOverview({ serviceButtons, activities }) {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <h2 className="mb-2 text-xs font-semibold text-slate-800 sm:text-sm">Dịch vụ cho JD này</h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {serviceButtons.map((sv) => {
            const Icon = sv.icon;
            const active = sv.active;
            return (
              <button
                key={sv.id}
                type="button"
                onClick={sv.onClick}
                className="flex flex-col items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-left transition hover:border-[#0077B6]/30 hover:bg-[#f8fbfd]"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${sv.iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${sv.iconColor}`} />
                  </span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? SERVICE_STATUS_ACTIVE : SERVICE_STATUS_IDLE}`}>
                    {active ? 'Đang dùng' : 'Chưa dùng'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold leading-snug text-slate-800">{sv.label}</span>
                {sv.hint ? (
                  <span className="text-[10px] leading-snug text-slate-500">{sv.hint}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <h2 className="mb-2 text-xs font-semibold text-slate-800 sm:text-sm">Hoạt động gần đây</h2>
        {activities.length === 0 ? (
          <p className="text-[11px] text-slate-500">Chưa có hoạt động.</p>
        ) : (
          <ul className="max-h-36 space-y-1.5 overflow-y-auto">
            {activities.map((a) => {
              const Icon = a.icon;
              return (
                <li key={`${a.text}-${a.time}`} className="flex min-w-0 items-start justify-between gap-2">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${a.iconBg}`}>
                      <Icon className={`h-3 w-3 ${a.iconColor}`} />
                    </span>
                    <span className="text-[11px] leading-snug text-slate-600">{a.text}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-400">{a.time}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export const SERVICE_ICON_MAP = {
  scout: { icon: Search, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
  branding: { icon: Star, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  marketplace: { icon: Building2, iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
};
