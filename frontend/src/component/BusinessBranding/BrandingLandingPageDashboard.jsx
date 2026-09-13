import React from 'react';
import {
  Plus,
  Bookmark,
  BarChart3,
  Users,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { isCompanyBuilderContent } from '../../utils/companyLandingPageSchema';
import { getLandingPageStatusMeta, formatBrandingDate } from '../../i18n/businessAppI18n';
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder';

const BRAND = '#0077B6';

function formatDate(value, language) {
  return formatBrandingDate(value, language);
}

export default function BrandingLandingPageDashboard({
  copy,
  language,
  statCards,
  statsEmpty,
  hasPublishedPage,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-slate-900 sm:text-base">{copy.landingPagesManageTitle}</h2>
      <p className="text-[11px] leading-snug text-slate-600 sm:text-xs">{copy.landingPagesManageSubtitle}</p>

      {statsEmpty && !hasPublishedPage ? (
        <div className="rounded-xl border border-dashed border-[#0077B6]/35 bg-[#e8f4fa]/60 px-4 py-4 text-center sm:text-left">
          <p className="text-xs font-semibold text-slate-800 sm:text-sm">{copy.statsEmptyTitle}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">{copy.statsEmptyBody}</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
          >
            <Plus className="h-3.5 w-3.5" />
            {copy.statsEmptyCta}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          const accent = i === 0;
          return (
            <div
              key={s.label}
              className={`rounded-xl border p-3 shadow-sm ${accent ? 'border-[#cce5f0]/80 bg-[#e8f4fa]' : 'border-slate-200/90 bg-white'}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: accent ? 'rgba(0,119,182,0.12)' : `${s.color}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: accent ? BRAND : s.color }} />
                </div>
                <span className="text-[10px] font-medium leading-snug text-slate-500 sm:text-xs">{s.label}</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-slate-800">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:items-stretch">
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:min-h-[320px] lg:h-full">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'rgba(0,119,182,0.12)' }}
            >
              <Building2 className="h-5 w-5" style={{ color: BRAND }} strokeWidth={2} />
            </div>
            <h2 className="mb-1.5 text-xs font-bold text-slate-800">{copy.companyPageTitle}</h2>
            <p className="text-[10px] leading-snug text-slate-500">{copy.companyPageDesc}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-[#0077B6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
          >
            <Plus className="h-3.5 w-3.5" />
            {copy.create}
          </button>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 sm:text-sm">{copy.allLandingPages}</h2>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-[10px] font-semibold text-[#0077B6] hover:text-[#006399] sm:text-xs"
            >
              {copy.createNew}
            </button>
          </div>

          {displayPages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">{copy.noLandingPages}</div>
          ) : (
            <div className="overflow-x-auto business-homepage-scroll">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-2 text-left font-semibold">{copy.tableName}</th>
                    <th className="px-2 py-2 text-left font-semibold">{copy.tableType}</th>
                    <th className="px-2 py-2 text-center font-semibold">{copy.tableViews}</th>
                    <th className="px-2 py-2 text-center font-semibold">{copy.tableForms}</th>
                    <th className="px-2 py-2 font-semibold">{copy.tableStatus}</th>
                    <th className="px-2 py-2 text-right font-semibold">{copy.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPages.map((p) => {
                    const st = getLandingPageStatusMeta(p.status, language);
                    const typeLabel = (p.builderType === 'company' || isCompanyBuilderContent(p.content))
                      ? copy.pageTypeCompany
                      : (getLocalizedJobTitle(p.job, language) || p.job?.jobCode || copy.pageTypeRecruitment);
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-2 py-2 font-semibold text-slate-800">{p.title}</td>
                        <td className="px-2 py-2 text-slate-500">{typeLabel}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.viewsCount}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.formSubmissionsCount}</td>
                        <td className="px-2 py-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ color: st.color, background: st.bg }}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditor(p)}
                              className="rounded-md bg-[#e8f4fa] px-2 py-1 text-[10px] font-semibold text-[#0077B6] hover:bg-[#cce5f0]"
                            >
                              {copy.edit}
                            </button>
                            {p.status === 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => copyPublicLink(p)}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                                >
                                  {copy.copyLink}
                                </button>
                                <a
                                  href={p.publicPath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 no-underline hover:bg-slate-200"
                                >
                                  {copy.view}
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h2 className="mb-3 text-xs font-bold text-[#0077B6]">{copy.recentActivity}</h2>
        {activities.length === 0 ? (
          <div className="text-xs text-slate-400">{copy.noActivity}</div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex-1 text-xs text-slate-700">{a.message}</div>
                <div className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">
                  {formatDate(a.createdAt, language)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function buildBrandingStatCards(stats, copy) {
  return [
    { icon: Bookmark, value: stats.views || 0, label: copy.statViews, color: BRAND },
    { icon: BarChart3, value: stats.formSubmissions || 0, label: copy.statForms, color: '#d97706' },
    { icon: Users, value: stats.candidates || 0, label: copy.statCandidates, color: '#0d9488' },
    { icon: TrendingUp, value: `${stats.conversionRate || 0}%`, label: copy.statConversion, color: '#059669' },
  ];
}
