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
  INSIGHTS_SERIES,
  InsightsBarChart,
  InsightsDonutChart,
  InsightsSingleAreaChart,
  InsightsTrendAreaChart,
  KpiSparkline,
  TableSparkline,
} from '../../component/Bussiness/businessInsightsChartTheme'
import { useLanguage } from '../../context/LanguageContext'
import { getBusinessAppCopy } from '../../i18n/businessAppI18n'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import { BUSINESS_HOMEPAGE_SHELL_STYLES, CARD, PAGE_FONT } from '../../utils/businessHomepageShell'

const insightStyles = `
  ${BUSINESS_HOMEPAGE_SHELL_STYLES}
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) { .business-homepage-shell { --hp-zoom: 0.9; } }
  @media (min-width: 1280px) and (max-width: 1535px) { .business-homepage-shell { --hp-zoom: 0.86; } }
  @media (min-width: 1024px) and (max-height: 760px) { .business-homepage-shell { --hp-zoom: 0.78; } }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) { .business-homepage-shell { --hp-zoom: 0.84; } }
  @media (min-width: 1536px) and (min-height: 861px) { .business-homepage-shell { --hp-zoom: 0.94; } }
  @media (min-width: 1920px) and (min-height: 900px) { .business-homepage-shell { --hp-zoom: 1; } }
`

const PERIOD_API = {
  Tuần: 'week',
  Tháng: 'month',
  Năm: 'year',
}

const statusColors = {
  'Đang tuyển': 'bg-emerald-100 text-emerald-700',
  'Tạm dừng': 'bg-amber-100 text-amber-700',
  'Đã đóng': 'bg-slate-100 text-slate-600',
  'Không xác định': 'bg-slate-100 text-slate-600',
}

const DETAIL_TABS = [
  { id: 'dept', label: 'Theo phòng ban' },
  { id: 'source', label: 'Nguồn ứng viên' },
  { id: 'time', label: 'Thời gian tuyển dụng' },
  { id: 'positions', label: 'Top vị trí' },
  { id: 'jd', label: 'Hiệu quả theo JD' },
]

function Panel({ title, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={`${CARD} p-2.5 sm:p-3 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          {title ? <h3 className="text-xs font-bold text-slate-900 sm:text-sm">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

const ReportInsight = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useMemo(() => getBusinessAppCopy(language), [language])
  const pageTitle = useMemo(() => ({
    vi: 'Report & insight',
    en: 'Report & insight',
    ja: 'Report & insight',
  }[language] || 'Report & insight'), [language])
  const [trendPeriod, setTrendPeriod] = useState('Tháng')
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
        period: PERIOD_API[trendPeriod] || 'month',
      })
      if (res?.success) {
        setReport(res.data)
      } else {
        setError(res?.message || 'Không tải được báo cáo')
      }
    } catch (e) {
      setError(e?.message || 'Không tải được báo cáo')
    } finally {
      setLoading(false)
    }
  }, [trendPeriod])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const trendData = report?.trend || []
  const funnelData = report?.funnel || []
  const insights = (report?.highlights || []).slice(0, 3)
  const deptData = report?.deptData || []
  const sourceData = report?.sourceData || []
  const topPositions = report?.topPositions || []
  const jdTable = report?.jdTable || []
  const timeToHireData = report?.timeToHire?.series || []
  const customReports = report?.customReports || []
  const maxSource = Math.max(1, ...sourceData.map((s) => s.value))

  const metrics = useMemo(() => {
    const kpis = report?.kpis
    if (!kpis) return []
    const fmtChange = (n) => {
      const sign = n >= 0 ? '+' : ''
      return `${sign}${n}% so với kỳ trước`
    }
    const sparks = kpis.sparklines || {}
    return [
      {
        label: 'Tổng JD đã đăng',
        value: String(kpis.totalJobs ?? 0),
        change: fmtChange(kpis.changes?.totalJobs ?? 0),
        up: (kpis.changes?.totalJobs ?? 0) >= 0,
        icon: FileText,
        color: INSIGHTS_SERIES[0].color,
        bg: '#e8f4fa',
        sparkline: sparks.totalJobs || [],
        sparkGradId: 'kpi-spark-jd',
      },
      {
        label: 'Tổng tiến cử nhận được',
        value: String(kpis.totalNominations ?? 0),
        change: fmtChange(kpis.changes?.totalNominations ?? 0),
        up: (kpis.changes?.totalNominations ?? 0) >= 0,
        icon: TrendingUp,
        color: INSIGHTS_SERIES[1].color,
        bg: '#e0f2fe',
        sparkline: sparks.totalNominations || [],
        sparkGradId: 'kpi-spark-tiencu',
      },
      {
        label: 'Ứng viên vào vòng phỏng vấn',
        value: String(kpis.interviewCount ?? 0),
        change: fmtChange(kpis.changes?.interviewCount ?? 0),
        up: (kpis.changes?.interviewCount ?? 0) >= 0,
        icon: TrendingUp,
        color: INSIGHTS_SERIES[2].color,
        bg: '#f0f9ff',
        sparkline: sparks.interviewCount || [],
        sparkGradId: 'kpi-spark-pv',
      },
      {
        label: 'Tuyển thành công',
        value: String(kpis.hiredCount ?? 0),
        change: fmtChange(kpis.changes?.hiredCount ?? 0),
        up: (kpis.changes?.hiredCount ?? 0) >= 0,
        icon: TrendingUp,
        color: INSIGHTS_SERIES[3].color,
        bg: '#e0f2fe',
        sparkline: sparks.hiredCount || [],
        sparkGradId: 'kpi-spark-hire',
      },
      {
        label: 'Chi phí tuyển dụng (VNĐ)',
        value: `${Number(kpis.recruitmentCostVnd || 0).toLocaleString('vi-VN')}đ`,
        change: fmtChange(kpis.changes?.recruitmentCostVnd ?? 0),
        up: (kpis.changes?.recruitmentCostVnd ?? 0) <= 0,
        icon: FileText,
        color: '#ca8a04',
        bg: '#fefce8',
        sparkline: sparks.recruitmentCostVnd || [],
        sparkGradId: 'kpi-spark-cost',
      },
    ]
  }, [report])

  const dateRangeLabel = report?.dateRange?.label || '—'
  const funnelCenter = report?.funnelConversionRate || '0%'
  const funnelChange = report?.funnelConversionChange ?? 0
  const avgTimeToHire = report?.timeToHire?.avgDays ?? 0
  const timeToHireChange = report?.timeToHire?.changeDays ?? 0

  const renderDetailTab = () => {
    switch (detailTab) {
      case 'dept':
        return deptData.length === 0 ? (
          <p className="py-10 text-center text-[11px] text-slate-400 sm:text-xs">Chưa có dữ liệu theo phòng ban</p>
        ) : (
          <InsightsBarChart data={deptData} height={280} />
        )
      case 'source':
        return sourceData.length === 0 ? (
          <p className="py-10 text-center text-[11px] text-slate-400 sm:text-xs">Chưa có dữ liệu nguồn</p>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-2.5 pt-1">
            {sourceData.map((s, i) => (
              <li key={s.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="font-semibold tabular-nums text-slate-700">{s.value} ({s.percent})</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.value / maxSource) * 100}%`,
                      background: `linear-gradient(90deg, ${INSIGHTS_DONUT_COLORS[i % INSIGHTS_DONUT_COLORS.length]}, ${INSIGHTS_BRAND})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )
      case 'time':
        return (
          <div className="py-2">
            <p className="text-lg font-bold text-slate-900 sm:text-xl">
              {avgTimeToHire > 0 ? `${avgTimeToHire} ngày` : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">Thời gian tuyển dụng trung bình</p>
            {timeToHireChange !== 0 ? (
              <p className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold sm:text-[11px] ${timeToHireChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {timeToHireChange > 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {Math.abs(timeToHireChange)} ngày so với kỳ trước
              </p>
            ) : null}
            <div className="mt-3">
              <InsightsSingleAreaChart data={timeToHireData} dataKey="days" name="Số ngày" height={220} />
            </div>
          </div>
        )
      case 'positions':
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 text-left font-semibold">Vị trí</th>
                  <th className="pb-2 text-right font-semibold">Chuyển đổi</th>
                  <th className="pb-2 text-right font-semibold">Tuyển</th>
                  <th className="pb-2 text-right font-semibold">Xu hướng</th>
                </tr>
              </thead>
              <tbody>
                {topPositions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">Chưa có dữ liệu</td>
                  </tr>
                ) : topPositions.map((p) => (
                  <tr key={p.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-800">{p.name}</td>
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
            <table className="w-full min-w-[720px] border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-2 text-left font-semibold">JD</th>
                  <th className="pb-2 pr-2 text-left font-semibold">Phòng ban</th>
                  <th className="pb-2 text-right font-semibold">Tiến cử</th>
                  <th className="pb-2 text-right font-semibold">PV</th>
                  <th className="pb-2 text-right font-semibold">Tuyển</th>
                  <th className="pb-2 text-right font-semibold">Tỷ lệ</th>
                  <th className="pb-2 text-right font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {jdTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Chưa có JD</td>
                  </tr>
                ) : jdTable.map((row) => (
                  <tr key={row.jd} className="border-b border-slate-100 hover:bg-slate-50/60 last:border-0">
                    <td className="max-w-[220px] truncate py-2 pr-2 font-medium text-slate-800" title={row.jd}>
                      {row.jd}
                    </td>
                    <td className="max-w-[140px] truncate py-2 pr-2 text-slate-600" title={row.dept}>
                      {row.dept}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.tiencu}</td>
                    <td className="py-2 text-right tabular-nums">{row.phongvan}</td>
                    <td className="py-2 text-right tabular-nums">{row.tuyendung}</td>
                    <td className="py-2 text-right">{row.rate}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status}
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

  const toolbarBtnClass =
    'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 sm:px-2.5 sm:py-1.5 sm:text-[11px]'

  return (
  <>
    <style>{insightStyles}</style>
    <div
      className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <div className="business-homepage-ui flex h-full min-h-0 flex-1 flex-col overflow-hidden p-2.5 sm:p-3">
        <div className="mb-2 shrink-0">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="text-[11px] text-slate-500 lg:text-xs">
                <button type="button" onClick={() => navigate('/business')} className="transition hover:text-[#0077B6]">
                  {copy.jobs.breadcrumb.home}
                </button>
                <span className="mx-1.5 text-slate-400">&gt;</span>
                <span className="font-medium text-slate-700">{pageTitle}</span>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChartPeriodPills value={trendPeriod} onChange={setTrendPeriod} />
              <button type="button" className={toolbarBtnClass}>
                <Calendar className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                {dateRangeLabel}
              </button>
              <button type="button" className={toolbarBtnClass}>
                Tất cả phòng ban
                <ChevronDown className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCustomReports((v) => !v)}
                  className={toolbarBtnClass}
                >
                  <FileText className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                  Báo cáo tùy chỉnh
                </button>
                {showCustomReports && customReports.length > 0 ? (
                  <div className="absolute right-0 top-full z-30 mt-1 min-w-[14rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {customReports.map((r) => (
                      <button
                        key={r.title}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[10px] hover:bg-slate-50 sm:text-[11px]"
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
                className="inline-flex items-center gap-1 rounded-lg bg-[#0077B6] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-[#006399] sm:px-3 sm:py-1.5 sm:text-[11px]"
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        <BusinessQuickActionsPageLayout onNavigate={navigate} className="min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
            <span className="text-[11px] sm:text-xs">Đang tải báo cáo...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
            <p className="text-[11px] text-rose-600 sm:text-xs">{error}</p>
            <button
              type="button"
              onClick={loadReport}
              className="rounded-lg bg-[#0077B6] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#006399]"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2.5 sm:gap-3">
            {/* Tầng 1 — KPI */}
            <section aria-label="KPI tổng quan">
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
                        <p className="text-[9px] font-medium leading-snug text-slate-500 sm:text-[10px]">{m.label}</p>
                      </div>
                      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base">{m.value}</p>
                      <p
                        className={`mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold sm:text-[10px] ${
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
            <section aria-label="Biểu đồ tổng quan" className="grid grid-cols-1 gap-2.5 xl:grid-cols-12 xl:gap-3">
              <Panel className="xl:col-span-8" title="Hiệu quả tuyển dụng tổng quan">
                <ChartLegendRow
                  items={INSIGHTS_SERIES.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  className="mb-2"
                />
                <InsightsTrendAreaChart data={trendData} height={260} />
              </Panel>

              <div className="flex flex-col gap-2.5 xl:col-span-4 xl:gap-3">
                <Panel title="Tỷ lệ chuyển đổi tuyển dụng">
                  <InsightsDonutChart data={funnelData} centerLabel="Tỷ lệ chung" centerValue={funnelCenter} height={150} />
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {funnelData.map((d, i) => (
                      <li key={d.name} className="flex items-center justify-between text-[11px] sm:text-xs">
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
                  <p className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold sm:text-[11px] ${funnelChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {funnelChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(funnelChange)}% so với kỳ trước
                  </p>
                </Panel>

                <Panel title="Insight nổi bật">
                  <ul className="flex flex-col gap-2.5">
                    {insights.length === 0 ? (
                      <li className="text-[11px] text-slate-400 sm:text-xs">Chưa có insight cho kỳ này.</li>
                    ) : insights.map((ins) => (
                      <li key={ins.title} className="flex gap-2 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-sm">
                          {ins.icon}
                        </span>
                        <span className="min-w-0">
                          <p className="text-[11px] font-semibold leading-snug text-slate-900 sm:text-xs">{ins.title}</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">{ins.desc}</p>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </section>

            {/* Tầng 3 — Phân tích chi tiết (tab) */}
            <section aria-label="Phân tích chi tiết">
              <Panel title="Phân tích chi tiết">
                <div className="mb-3 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0">
                  {DETAIL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id)}
                      className={`shrink-0 border-b-2 px-2 py-1.5 text-[10px] font-semibold transition-colors sm:px-3 sm:py-2 sm:text-[11px] ${
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
