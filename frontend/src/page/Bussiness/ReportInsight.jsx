import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ChevronDown, Download, FileText, TrendingUp, TrendingDown, ArrowDownRight, Loader2,
} from 'lucide-react'
import apiService from '../../services/api'
import {
  ChartLegendRow,
  ChartPeriodPills,
  INSIGHTS_BRAND,
  INSIGHTS_DONUT_COLORS,
  InsightsBarChart,
  InsightsDonutChart,
  InsightsSingleAreaChart,
  InsightsTrendAreaChart,
  KpiSparkline,
  TableSparkline,
} from '../../component/Bussiness/businessInsightsChartTheme'
import { useLanguage } from '../../context/LanguageContext'
import { getBusinessAppCopy } from '../../i18n/businessAppI18n'
import {
  getBusinessInsightsCopy,
  getInsightsChartSeries,
  getInsightsPeriodOptions,
  localizeInsightsFunnel,
  getInsightsJobStatusLabel,
  formatInsightsRecruitmentCost,
  localizeInsightsDeptName,
} from '../../i18n/businessApp/businessInsights.js'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder.js'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import { CARD } from '../../utils/businessHomepageShell'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography'

const insightStyles = BUSINESS_HOMEPAGE_PAGE_BASE_STYLES

const INSIGHTS_TABLE_HEAD = `border-b border-slate-200 uppercase tracking-wide text-slate-500 font-semibold ${BUSINESS_HP_TEXT.caption}`
const INSIGHTS_TABLE = `w-full border-collapse ${BUSINESS_HP_TEXT.body}`
const INSIGHTS_TOOLBAR_BTN = `inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50 sm:px-2.5 sm:py-1.5 ${BUSINESS_HP_TEXT.button}`
const INSIGHTS_PRIMARY_BTN = `inline-flex items-center gap-1 rounded-lg bg-[#0077B6] px-2.5 py-1 text-white shadow-sm hover:bg-[#006399] sm:px-3 sm:py-1.5 ${BUSINESS_HP_TEXT.buttonPrimary}`
const INSIGHTS_STATUS_BADGE = `${BUSINESS_HP_TEXT.micro} font-semibold`
const INSIGHTS_EMPTY = `py-10 text-center text-slate-400 ${BUSINESS_HP_TEXT.body}`
const INSIGHTS_CHANGE = `${BUSINESS_HP_TEXT.caption} font-semibold`
const INSIGHTS_DETAIL_TAB = `shrink-0 border-b-2 px-2 py-1.5 font-semibold transition-colors sm:px-3 sm:py-2 ${BUSINESS_HP_TEXT.button}`

function jobStatusBadgeClass(statusCode) {
  const n = Number(statusCode)
  if (n === 1) return 'bg-emerald-100 text-emerald-700'
  if (n === 0) return 'bg-amber-100 text-amber-700'
  if (n === 2 || n === 3) return 'bg-slate-100 text-slate-600'
  return 'bg-slate-100 text-slate-600'
}

function formatLocalizedJdLabel(row, language) {
  const title = getLocalizedJobTitle(
    { title: row.title, titleEn: row.titleEn, titleJp: row.titleJp, id: row.jobId },
    language,
  ) || row.jd
  const code = row.jobCode ? ` (${row.jobCode})` : ''
  if (row.title || row.titleEn || row.titleJp) return `${title}${code}`
  return row.jd
}

function Panel({ title, action, children, className = '', bodyClass = '', fill = false }) {
  return (
    <section
      className={`${CARD} p-2.5 sm:p-3 ${fill ? 'flex min-h-0 flex-col' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          {title ? <h3 className={BUSINESS_HP_TEXT.section}>{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className={fill ? `flex min-h-0 flex-1 flex-col ${bodyClass}` : bodyClass}>{children}</div>
    </section>
  )
}

const ReportInsight = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useMemo(() => getBusinessAppCopy(language), [language])
  const ins = useMemo(() => getBusinessInsightsCopy(language), [language])
  const chartSeries = useMemo(() => getInsightsChartSeries(language), [language])
  const periodOptions = useMemo(() => getInsightsPeriodOptions(language), [language])
  const detailTabs = useMemo(() => ([
    { id: 'dept', label: ins.tabDept },
    { id: 'time', label: ins.tabTime },
    { id: 'positions', label: ins.tabPositions },
    { id: 'jd', label: ins.tabJd },
  ]), [ins])
  const [trendPeriod, setTrendPeriod] = useState('month')
  const [detailTab, setDetailTab] = useState('dept')
  const [showCustomReports, setShowCustomReports] = useState(false)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiService.getBusinessInsightsReport({
        period: trendPeriod || 'month',
        lang: language,
      })
      if (res?.success) {
        setReport(res.data)
      } else {
        setError(res?.message || ins.loadError)
      }
    } catch (e) {
      setError(e?.message || ins.loadError)
    } finally {
      setLoading(false)
    }
  }, [trendPeriod, language, ins.loadError])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  useEffect(() => {
    if (detailTab === 'source') setDetailTab('dept')
  }, [detailTab])

  const funnelData = useMemo(
    () => localizeInsightsFunnel(report?.funnel || [], language),
    [report?.funnel, language],
  )

  const trendData = report?.trend || []
  const insights = (report?.highlights || []).slice(0, 3)
  const deptData = report?.deptData || []
  const topPositions = report?.topPositions || []
  const jdTable = report?.jdTable || []
  const timeToHireData = report?.timeToHire?.series || []
  const customReports = report?.customReports || []

  const metrics = useMemo(() => {
    const kpis = report?.kpis
    if (!kpis) return []
    const fmtChange = (n) => ins.vsPrevious(n)
    const sparks = kpis.sparklines || {}
    const series = chartSeries
    return [
      {
        label: ins.kpiTotalJobs,
        value: String(kpis.totalJobs ?? 0),
        change: fmtChange(kpis.changes?.totalJobs ?? 0),
        up: (kpis.changes?.totalJobs ?? 0) >= 0,
        icon: FileText,
        color: series[0]?.color,
        bg: '#e8f4fa',
        sparkline: sparks.totalJobs || [],
        sparkGradId: 'kpi-spark-jd',
      },
      {
        label: ins.kpiTotalNominations,
        value: String(kpis.totalNominations ?? 0),
        change: fmtChange(kpis.changes?.totalNominations ?? 0),
        up: (kpis.changes?.totalNominations ?? 0) >= 0,
        icon: TrendingUp,
        color: series[1]?.color,
        bg: '#e0f2fe',
        sparkline: sparks.totalNominations || [],
        sparkGradId: 'kpi-spark-tiencu',
      },
      {
        label: ins.kpiInterviews,
        value: String(kpis.interviewCount ?? 0),
        change: fmtChange(kpis.changes?.interviewCount ?? 0),
        up: (kpis.changes?.interviewCount ?? 0) >= 0,
        icon: TrendingUp,
        color: series[2]?.color,
        bg: '#f0f9ff',
        sparkline: sparks.interviewCount || [],
        sparkGradId: 'kpi-spark-pv',
      },
      {
        label: ins.kpiHired,
        value: String(kpis.hiredCount ?? 0),
        change: fmtChange(kpis.changes?.hiredCount ?? 0),
        up: (kpis.changes?.hiredCount ?? 0) >= 0,
        icon: TrendingUp,
        color: series[3]?.color,
        bg: '#e0f2fe',
        sparkline: sparks.hiredCount || [],
        sparkGradId: 'kpi-spark-hire',
      },
      {
        label: ins.kpiRecruitmentCost,
        value: formatInsightsRecruitmentCost(kpis.recruitmentCostVnd, language),
        change: fmtChange(kpis.changes?.recruitmentCostVnd ?? 0),
        up: (kpis.changes?.recruitmentCostVnd ?? 0) <= 0,
        icon: FileText,
        color: '#ca8a04',
        bg: '#fefce8',
        sparkline: sparks.recruitmentCostVnd || [],
        sparkGradId: 'kpi-spark-cost',
      },
    ]
  }, [report, ins, chartSeries, language])

  const dateRangeLabel = report?.dateRange?.label || '—'
  const funnelCenter = report?.funnelConversionRate || '0%'
  const funnelChange = report?.funnelConversionChange ?? 0
  const avgTimeToHire = report?.timeToHire?.avgDays ?? 0
  const timeToHireChange = report?.timeToHire?.changeDays ?? 0

  const renderDetailTab = () => {
    switch (detailTab) {
      case 'dept':
        return deptData.length === 0 ? (
          <p className={INSIGHTS_EMPTY}>{ins.emptyDept}</p>
        ) : (
          <InsightsBarChart
            data={deptData.map((d) => ({ ...d, name: localizeInsightsDeptName(d.name, language) }))}
            height={280}
            barLabel={ins.barHires}
          />
        )
      case 'time':
        return (
          <div className="py-2">
            <p className={`tabular-nums ${BUSINESS_HP_TEXT.stat}`}>
              {avgTimeToHire > 0 ? ins.daysUnit(avgTimeToHire) : '—'}
            </p>
            <p className={`mt-0.5 ${BUSINESS_HP_TEXT.caption}`}>{ins.avgTimeToHire}</p>
            {timeToHireChange !== 0 ? (
              <p className={`mt-1.5 inline-flex items-center gap-1 ${INSIGHTS_CHANGE} ${timeToHireChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {timeToHireChange > 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {ins.vsPreviousDays(timeToHireChange)}
              </p>
            ) : null}
            <div className="mt-3">
              <InsightsSingleAreaChart data={timeToHireData} dataKey="days" name={ins.chartDays} height={220} />
            </div>
          </div>
        )
      case 'positions':
        return (
          <div className="overflow-x-auto">
            <table className={`${INSIGHTS_TABLE} min-w-[480px]`}>
              <thead>
                <tr className={INSIGHTS_TABLE_HEAD}>
                  <th className="pb-2 text-left font-semibold">{ins.tablePosition}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableConversion}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableHires}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableTrend}</th>
                </tr>
              </thead>
              <tbody>
                {topPositions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">{ins.tableEmpty}</td>
                  </tr>
                ) : topPositions.map((p) => (
                  <tr key={p.jobId || p.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-800">
                      {getLocalizedJobTitle(
                        { title: p.title || p.name, titleEn: p.titleEn, titleJp: p.titleJp, id: p.jobId },
                        language,
                      ) || p.name}
                    </td>
                    <td className="py-2 text-right text-slate-700">{p.rate}</td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{p.hires}</td>
                    <td className="py-2 text-right">
                      <TableSparkline values={p.trend} color={INSIGHTS_BRAND} width={88} height={32} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'jd':
      default:
        return (
          <div className="overflow-x-auto">
            <table className={`${INSIGHTS_TABLE} min-w-[720px]`}>
              <thead>
                <tr className={INSIGHTS_TABLE_HEAD}>
                  <th className="pb-2 pr-2 text-left font-semibold">{ins.tableJd}</th>
                  <th className="pb-2 pr-2 text-left font-semibold">{ins.tableDepartment}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableNomination}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableInterview}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableHires}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableRate}</th>
                  <th className="pb-2 text-right font-semibold">{ins.tableStatus}</th>
                </tr>
              </thead>
              <tbody>
                {jdTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">{ins.emptyJd}</td>
                  </tr>
                ) : jdTable.map((row) => (
                  <tr key={row.jobId || row.jd} className="border-b border-slate-100 hover:bg-slate-50/60 last:border-0">
                    <td className="max-w-[220px] truncate py-2 pr-2 font-medium text-slate-800" title={formatLocalizedJdLabel(row, language)}>
                      {formatLocalizedJdLabel(row, language)}
                    </td>
                    <td className="max-w-[140px] truncate py-2 pr-2 text-slate-600" title={row.dept}>
                      {row.dept}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.tiencu}</td>
                    <td className="py-2 text-right tabular-nums">{row.phongvan}</td>
                    <td className="py-2 text-right tabular-nums">{row.tuyendung}</td>
                    <td className="py-2 text-right">{row.rate}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 ${INSIGHTS_STATUS_BADGE} ${jobStatusBadgeClass(row.statusCode ?? row.status)}`}>
                        {row.statusCode != null
                          ? getInsightsJobStatusLabel(row.statusCode, language)
                          : row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
    }
  }

  return (
  <>
    <style>{insightStyles}</style>
    <div
      className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: BUSINESS_UI_FONT }}
    >
      <div className="business-homepage-ui business-app-ui flex h-full min-h-0 flex-1 flex-col overflow-hidden p-2.5 sm:p-3">
        <div className="mb-2 shrink-0">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className={BUSINESS_HP_TEXT.meta}>
                <button type="button" onClick={() => navigate('/business')} className="transition hover:text-[#0077B6]">
                  {copy.jobs.breadcrumb.home}
                </button>
                <span className="mx-1.5 text-slate-400">&gt;</span>
                <span className="font-medium text-slate-700">{ins.pageTitle}</span>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChartPeriodPills value={trendPeriod} onChange={setTrendPeriod} options={periodOptions} />
              <button type="button" className={INSIGHTS_TOOLBAR_BTN}>
                <Calendar className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                {dateRangeLabel}
              </button>
              <button type="button" className={INSIGHTS_TOOLBAR_BTN}>
                {ins.allDepartments}
                <ChevronDown className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCustomReports((v) => !v)}
                  className={INSIGHTS_TOOLBAR_BTN}
                >
                  <FileText className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                  {ins.customReports}
                </button>
                {showCustomReports && customReports.length > 0 ? (
                  <div className="absolute right-0 top-full z-30 mt-1 min-w-[14rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {customReports.map((r) => (
                      <button
                        key={r.title}
                        type="button"
                        className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-slate-50 ${BUSINESS_HP_TEXT.body}`}
                      >
                        <span className="min-w-0 truncate font-medium text-slate-800">{r.title}</span>
                        <Download className="h-3 w-3 shrink-0 text-slate-400 sm:h-3.5 sm:w-3.5" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className={INSIGHTS_PRIMARY_BTN}
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {ins.exportReport}
              </button>
            </div>
          </div>
        </div>

        <BusinessQuickActionsPageLayout onNavigate={navigate} className="min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
            <span className={BUSINESS_HP_TEXT.body}>{ins.loading}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
            <p className={`text-rose-600 ${BUSINESS_HP_TEXT.body}`}>{error}</p>
            <button
              type="button"
              onClick={loadReport}
              className={`rounded-lg bg-[#0077B6] px-3 py-1.5 text-white hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
            >
              {ins.retry}
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2.5 sm:gap-3">
            {/* Tầng 1 — KPI */}
            <section aria-label={ins.ariaKpi}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {metrics.map((m) => {
                  const Icon = m.icon
                  return (
                    <div key={m.label} className={`${CARD} flex flex-col p-2.5`}>
                      <div className="flex items-start gap-2">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ background: m.bg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: m.color }} strokeWidth={2} />
                        </div>
                        <p className={`font-medium leading-snug text-slate-500 ${BUSINESS_HP_TEXT.caption}`}>{m.label}</p>
                      </div>
                      <p className={`mt-1 tabular-nums ${BUSINESS_HP_TEXT.stat}`}>{m.value}</p>
                      <p
                        className={`mt-0.5 inline-flex items-center gap-0.5 ${INSIGHTS_CHANGE} ${
                          m.up ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.up ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        <span className="line-clamp-2">{m.change}</span>
                      </p>
                      <KpiSparkline
                        data={m.sparkline}
                        color={m.color}
                        gradientId={m.sparkGradId}
                        height={32}
                      />
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Tầng 2 — Biểu đồ chính + conversion + insights */}
            <section aria-label={ins.ariaCharts} className="grid grid-cols-1 items-stretch gap-2.5 xl:grid-cols-12 xl:gap-3">
              <Panel fill className="min-h-0 xl:col-span-8" title={ins.chartOverview}>
                <ChartLegendRow
                  items={chartSeries.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  className="mb-2 shrink-0"
                />
                <InsightsTrendAreaChart data={trendData} fill series={chartSeries} />
              </Panel>

              <div className="flex min-h-0 flex-col gap-2.5 xl:col-span-4 xl:gap-3">
                <Panel title={ins.chartConversion}>
                  <InsightsDonutChart data={funnelData} centerLabel={ins.conversionOverall} centerValue={funnelCenter} height={150} />
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {funnelData.map((d, i) => (
                      <li key={d.name} className={`flex items-center justify-between ${BUSINESS_HP_TEXT.body}`}>
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-800">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: INSIGHTS_DONUT_COLORS[i % INSIGHTS_DONUT_COLORS.length] }} />
                          <span className="truncate">{d.name}</span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-slate-600">
                          {d.value} ({d.percent})
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-2 inline-flex items-center gap-1 ${INSIGHTS_CHANGE} ${funnelChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {funnelChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {ins.vsPreviousPctPoints(funnelChange)}
                  </p>
                </Panel>

                <Panel title={ins.highlightsTitle}>
                  <ul className="flex flex-col gap-2.5">
                    {insights.length === 0 ? (
                      <li className={`text-slate-400 ${BUSINESS_HP_TEXT.body}`}>{ins.highlightsEmpty}</li>
                    ) : insights.map((ins) => (
                      <li key={ins.title} className="flex gap-2 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-sm">
                          {ins.icon}
                        </span>
                        <span className="min-w-0">
                          <p className={`font-semibold leading-snug text-slate-900 ${BUSINESS_HP_TEXT.body}`}>{ins.title}</p>
                          <p className={`mt-0.5 leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.caption}`}>{ins.desc}</p>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </section>

            {/* Tầng 3 — Phân tích chi tiết (tab) */}
            <section aria-label={ins.ariaDetail}>
              <Panel title={ins.detailAnalysis}>
                <div className="mb-3 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id)}
                      className={`${INSIGHTS_DETAIL_TAB} ${
                        detailTab === tab.id
                          ? 'border-[#0077B6] text-[#0077B6]'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {renderDetailTab()}
              </Panel>
            </section>
          </div>
        )}
        </BusinessQuickActionsPageLayout>
      </div>
    </div>
  </>
  )
}

export default ReportInsight
