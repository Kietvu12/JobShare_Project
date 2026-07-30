import React from 'react';
import {
  ArrowRight, Calendar, Info, Loader2, MapPin, Sparkles, Target, User,
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

export function HealthOverviewGrid({ cards, title = 'Recruitment Health' }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h2 className="biz-jd-title text-slate-800">{title}</h2>
        <Info className="biz-jd-icon text-slate-300 shrink-0" aria-hidden />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-md border border-slate-100 bg-slate-50/60 p-2 min-w-0 ${i > 0 ? 'lg:border-l lg:border-slate-100 lg:rounded-none lg:border-0 lg:bg-transparent lg:pl-3' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-1 min-w-0">
                <div className="biz-jd-icon-hit rounded-md bg-violet-50 text-violet-600 shrink-0">
                  <Icon className="biz-jd-icon" />
                </div>
                <span className="biz-jd-muted font-medium truncate">{c.label}</span>
              </div>
              <p className="biz-jd-title text-indigo-600 leading-none">
                {c.score}
                <span className="biz-jd-muted font-normal">/100</span>
              </p>
              <p className="biz-jd-body font-semibold text-amber-600 mt-0.5">{c.rating}</p>
              {c.lines?.filter(Boolean).slice(0, 2).map((line) => (
                <p key={line} className="biz-jd-muted leading-snug truncate">{line}</p>
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
    <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <Target className="biz-jd-icon text-[#0077B6] shrink-0" />
        <span className="biz-jd-body font-semibold text-slate-800">AI gợi ý ứng viên</span>
        <span className="ml-auto rounded-full bg-[#0077B6]/10 text-[#0077B6] biz-jd-body font-semibold px-2 py-0.5">
          Scout
        </span>
      </div>
      <div className="p-3 space-y-3 min-w-0">
        <p className="biz-jd-title text-slate-900">
          {matchLoading
            ? 'Đang phân tích ứng viên Scout...'
            : `Có ${matchedTotal.toLocaleString('vi-VN')} hồ sơ phù hợp với JD này`}
        </p>
        {matchError ? (
          <p className="biz-jd-body text-amber-700 rounded-md bg-amber-50 border border-amber-100 px-2 py-1.5">
            {matchError}
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          {matchStats.map((m) => (
            <div key={m.label} className="rounded-md bg-slate-50 px-2 py-1.5 min-w-0">
              <p className="biz-jd-title text-slate-900">{matchLoading ? '…' : m.value}</p>
              <p className="biz-jd-muted leading-snug line-clamp-2">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-2 space-y-2">
          {aiInsights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="grid grid-cols-1 sm:grid-cols-[minmax(0,9rem)_1fr] gap-0.5 sm:gap-2 items-start">
                <span className="biz-jd-muted flex items-center gap-1 min-w-0">
                  <Icon className="biz-jd-icon text-slate-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span
                  className={`biz-jd-body font-medium min-w-0 break-words line-clamp-2 sm:text-right ${item.valueColor ? '' : 'text-slate-800'}`}
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
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
        <h2 className="biz-jd-title text-slate-800">Top ứng viên phù hợp (ẩn danh)</h2>
        <Info className="biz-jd-icon text-slate-300 shrink-0" />
      </div>
      <div className="p-3">
        {matchLoading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-8 biz-jd-body">
            <Loader2 className="biz-jd-icon animate-spin" />
            Đang tải gợi ý AI...
          </div>
        ) : topCandidates.length === 0 ? (
          <p className="text-center biz-jd-muted py-8">Chưa có ứng viên Scout phù hợp hoặc JD chưa đồng bộ vector.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topCandidates.map((c, i) => {
              const tags = pickShortSkillLabels(c.skills, 4);
              return (
                <li
                  key={c.id || i}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 min-w-0"
                >
                  <div className="flex flex-wrap items-start gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="biz-jd-icon-hit rounded-full bg-violet-100 text-violet-600 shrink-0">
                        <User className="biz-jd-icon" />
                      </div>
                      <div className="min-w-0">
                        <p className="biz-jd-body font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="biz-jd-muted line-clamp-1">{truncateText(c.role, 80)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 biz-jd-body font-semibold px-2 py-0.5 shrink-0">
                      {c.match}% match
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 biz-jd-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="biz-jd-icon shrink-0" />
                      {c.exp}
                    </span>
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <MapPin className="biz-jd-icon shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </span>
                  </div>
                  {tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.map((sk) => (
                        <span key={sk} className="rounded bg-white border border-slate-200 text-slate-600 biz-jd-muted px-1.5 py-0.5">
                          {sk}
                        </span>
                      ))}
                      {c.extra > 0 ? (
                        <span className="rounded bg-white border border-slate-200 text-slate-500 biz-jd-muted px-1.5 py-0.5">
                          +{c.extra}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0077B6]/25 bg-[#0077B6]/5 text-[#0077B6] hover:bg-[#0077B6]/10 biz-jd-body font-semibold px-3 py-1.5 transition-colors"
          >
            Xem tất cả ứng viên match
            <ArrowRight className="biz-jd-icon" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function ServicesActivityOverview({ services, activities, jobId, navigate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="biz-jd-title text-slate-800 mb-2">Dịch vụ cho JD này</h2>
        <ul className="space-y-2">
          {services.map((sv) => {
            const Icon = sv.icon;
            return (
              <li key={sv.name} className="flex items-center gap-2 min-w-0">
                <div className={`biz-jd-icon-hit rounded-lg shrink-0 ${sv.iconBg}`}>
                  <Icon className={`biz-jd-icon ${sv.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="biz-jd-body font-semibold text-slate-800">{sv.name}</span>
                    <span className={`rounded-full biz-jd-muted font-medium px-1.5 py-0.5 ${sv.statusColor}`}>{sv.status}</span>
                  </div>
                  <p className="biz-jd-muted truncate">{sv.detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => sv.name === 'Scout Credit' && jobId && navigate(`/business/scout?jobId=${jobId}`)}
                  className="biz-jd-body font-semibold text-[#0077B6] shrink-0 hover:underline"
                >
                  {sv.action}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="biz-jd-title text-slate-800 mb-2">Hoạt động gần đây</h2>
        {activities.length === 0 ? (
          <p className="biz-jd-muted">Chưa có hoạt động.</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.text} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`biz-jd-icon-hit rounded-md shrink-0 ${a.iconBg}`}>
                      <Icon className={`biz-jd-icon ${a.iconColor}`} />
                    </span>
                    <span className="biz-jd-body text-slate-600 truncate">{a.text}</span>
                  </span>
                  <span className="biz-jd-muted shrink-0">{a.time}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
