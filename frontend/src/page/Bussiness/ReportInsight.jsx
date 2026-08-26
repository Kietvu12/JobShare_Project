import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ChevronDown, Download, FileText, TrendingUp, TrendingDown, ArrowRight, ArrowDownRight, Loader2,
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

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = INSIGHTS_BRAND

const insightStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .insights-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .insights-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .insights-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .insights-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
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

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          {title ? <h3 className="text-xs font-bold text-slate-900 sm:text-sm">{title}</h3> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function TextLink({ children }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#0077B6] transition-colors hover:text-[#006399] sm:text-[11px]"
    >
      {children}
    </button>
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
  const insights = report?.highlights || []
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

  return (
  <>
    <style>{insightStyles}</style>
    <div
      className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Breadcrumb" className="text-[11px] text-slate-500 lg:text-xs">
              <button
                type="button"
                onClick={() => navigate('/business')}
                className="transition hover:text-[#0077B6]"
              >
                {copy.jobs.breadcrumb.home}
              </button>
              <span className="mx-1.5 text-slate-400">&gt;</span>
              <span className="font-medium text-slate-700">{pageTitle}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/40 sm:text-[11px]"
              >
                <Calendar className="h-3 w-3 text-slate-400" />
                {dateRangeLabel}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:text-[11px]"
              >
                Tất cả phòng ban
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-2 text-[10px] font-semibold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] sm:text-[11px]"
              >
                <Download className="h-3 w-3" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        <div className="insights-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
              <span className="text-sm">Đang tải báo cáo...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-4 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <button
                type="button"
                onClick={loadReport}
                className="rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#006399]"
              >
                Thử lại
              </button>
            </div>
          ) : (
          <div className="flex w-full flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-5">
              {metrics.map((m) => {
                const Icon = m.icon
                return (
                  <div
                    key={m.label}
                    className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm sm:p-3"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8"
                        style={{ background: m.bg }}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: m.color }} />
                      </div>
                      <p className="text-[9px] font-medium leading-snug text-slate-500 sm:text-[10px]">{m.label}</p>
                    </div>
                    <p className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">{m.value}</p>
                    <p
                      className={`inline-flex items-center gap-0.5 text-[8px] font-semibold sm:text-[9px] ${
                        m.up ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {m.up ? <TrendingUp className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                      {m.change}
                    </p>
                    <KpiSparkline
                      data={m.sparkline}
                      color={m.color}
                      gradientId={m.sparkGradId}
                      height={34}
                    />
                  </div>
                )
              })}
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
              <Panel
                className="xl:col-span-5"
                title="Hiệu quả tuyển dụng tổng quan"
                action={(
                  <div className="flex flex-wrap items-center gap-2">
                    <ChartPeriodPills value={trendPeriod} onChange={setTrendPeriod} />
                    <TextLink>
                      Chi tiết
                      <ChevronDown className="h-3 w-3" />
                    </TextLink>
                  </div>
                )}
              >
                <ChartLegendRow items={INSIGHTS_SERIES.map((s) => ({ key: s.key, label: s.label, color: s.color }))} className="mb-2" />
                <InsightsTrendAreaChart data={trendData} height={200} />
              </Panel>

              <Panel className="xl:col-span-3" title="Tỷ lệ chuyển đổi tuyển dụng">
                <InsightsDonutChart data={funnelData} centerLabel="Tỷ lệ chung" centerValue={funnelCenter} height={140} />
                <ul className="mt-2 flex flex-col gap-1.5">
                  {funnelData.map((d, i) => (
                    <li key={d.name} className="flex items-center justify-between text-[9px] sm:text-[10px]">
                      <span className="inline-flex items-center gap-1.5 text-slate-800">
                        <span className="h-2 w-2 rounded-full" style={{ background: INSIGHTS_DONUT_COLORS[i % INSIGHTS_DONUT_COLORS.length] }} />
                        {d.name}
                      </span>
                      <span className="font-medium text-slate-500">
                        {d.value} ({d.percent})
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={`mt-2 inline-flex items-center gap-1 text-[8px] font-semibold sm:text-[9px] ${funnelChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {funnelChange >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(funnelChange)}% so với kỳ trước
                </p>
              </Panel>

              <Panel
                className="xl:col-span-4"
                title="Insight nổi bật"
                action={(
                  <TextLink>
                    Xem tất cả
                    <ArrowRight className="h-3 w-3" />
                  </TextLink>
                )}
              >
                <ul className="flex flex-col gap-2.5">
                  {insights.map((ins) => (
                    <li key={ins.title} className="flex gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm">
                        {ins.icon}
                      </span>
                      <span className="min-w-0">
                        <p className="text-[10px] font-semibold leading-snug text-slate-800 sm:text-[11px]">{ins.title}</p>
                        <p className="text-[9px] leading-relaxed text-slate-500 sm:text-[10px]">{ins.desc}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <Panel
                className="lg:col-span-4"
                title="Hiệu quả theo phòng ban"
                action={(
                  <TextLink>
                    Theo tuyển thành công
                    <ChevronDown className="h-3 w-3" />
                  </TextLink>
                )}
              >
                {deptData.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu theo phòng ban</p>
                ) : (
                  <InsightsBarChart data={deptData} height={168} />
                )}
              </Panel>

              <Panel
                className="lg:col-span-4"
                title="Hiệu quả theo nguồn ứng viên"
                action={(
                  <TextLink>
                    Theo tuyển thành công
                    <ChevronDown className="h-3 w-3" />
                  </TextLink>
                )}
              >
                <ul className="flex flex-col gap-3 pt-1">
                  {sourceData.length === 0 ? (
                    <li className="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu nguồn</li>
                  ) : sourceData.map((s, i) => (
                    <li key={s.name}>
                      <p className="mb-1.5 text-[9px] font-medium text-slate-800 sm:text-[10px]">{s.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(s.value / maxSource) * 100}%`,
                              background: `linear-gradient(90deg, ${INSIGHTS_DONUT_COLORS[i % INSIGHTS_DONUT_COLORS.length]}, ${INSIGHTS_BRAND})`,
                            }}
                          />
                        </div>
                        <span className="min-w-[52px] text-right text-[9px] font-semibold text-slate-800 sm:text-[10px]">
                          {s.value} ({s.percent})
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel
                className="lg:col-span-4"
                title="Top vị trí tuyển dụng hiệu quả"
                action={(
                  <TextLink>
                    Xem tất cả
                    <ArrowRight className="h-3 w-3" />
                  </TextLink>
                )}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[240px] border-collapse text-[9px] sm:text-[10px]">
                    <thead>
                      <tr className="text-[8px] uppercase tracking-wide text-slate-400 sm:text-[9px]">
                        <th className="pb-2 text-left font-semibold">Vị trí</th>
                        <th className="pb-2 text-right font-semibold">Chuyển đổi</th>
                        <th className="pb-2 text-right font-semibold">Tuyển</th>
                        <th className="pb-2 text-right font-semibold">Xu hướng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPositions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">Chưa có dữ liệu</td>
                        </tr>
                      ) : topPositions.map((p) => (
                        <tr key={p.name} className="border-t border-slate-100">
                          <td className="py-2 font-medium text-slate-800">{p.name}</td>
                          <td className="py-2 text-right text-slate-700">{p.rate}</td>
                          <td className="py-2 text-right tabular-nums text-slate-700">{p.hires}</td>
                          <td className="py-2 text-right">
                            <TableSparkline values={p.trend} color={INSIGHTS_BRAND} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
              <Panel className="xl:col-span-6" title="Hiệu quả theo JD">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] table-fixed border-collapse text-[9px] sm:text-[10px]">
                    <thead>
                      <tr className="text-[8px] uppercase tracking-wide text-slate-400 sm:text-[9px]">
                        <th className="w-[34%] px-1 pb-2 text-left font-semibold">JD</th>
                        <th className="w-[22%] px-1 pb-2 text-left font-semibold">Phòng ban</th>
                        <th className="w-[8%] px-1 pb-2 text-right font-semibold">Tiến cử</th>
                        <th className="w-[7%] px-1 pb-2 text-right font-semibold">PV</th>
                        <th className="w-[8%] px-1 pb-2 text-right font-semibold">Tuyển</th>
                        <th className="w-[8%] px-1 pb-2 text-right font-semibold">Tỷ lệ</th>
                        <th className="w-[13%] px-1 pb-2 text-right font-semibold whitespace-nowrap">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jdTable.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">Chưa có JD</td>
                        </tr>
                      ) : jdTable.map((row) => (
                        <tr key={row.jd} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="max-w-0 truncate px-1 py-2 font-medium text-slate-800" title={row.jd}>
                            {row.jd}
                          </td>
                          <td className="max-w-0 truncate px-1 py-2 text-slate-500" title={row.dept}>
                            {row.dept}
                          </td>
                          <td className="px-1 py-2 text-right tabular-nums whitespace-nowrap">{row.tiencu}</td>
                          <td className="px-1 py-2 text-right tabular-nums whitespace-nowrap">{row.phongvan}</td>
                          <td className="px-1 py-2 text-right tabular-nums whitespace-nowrap">{row.tuyendung}</td>
                          <td className="px-1 py-2 text-right whitespace-nowrap">{row.rate}</td>
                          <td className="px-1 py-2 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[8px] font-semibold leading-none sm:text-[9px] ${statusColors[row.status] || 'bg-slate-100 text-slate-600'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TextLink>
                  <span className="mt-2 inline-flex items-center gap-0.5">
                    Xem tất cả JD
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </TextLink>
              </Panel>

              <Panel className="xl:col-span-3" title="Thời gian tuyển dụng trung bình">
                <p className="text-lg font-bold text-slate-900 sm:text-xl">{avgTimeToHire > 0 ? `${avgTimeToHire} ngày` : '—'}</p>
                {timeToHireChange !== 0 ? (
                  <p className={`mt-1 inline-flex items-center gap-1 text-[8px] font-semibold sm:text-[9px] ${timeToHireChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {timeToHireChange > 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                    {Math.abs(timeToHireChange)} ngày so với kỳ trước
                  </p>
                ) : null}
                <InsightsSingleAreaChart data={timeToHireData} dataKey="days" name="Số ngày" height={140} />
              </Panel>

              <Panel
                className="xl:col-span-3"
                title="Báo cáo tùy chỉnh"
                action={(
                  <TextLink>
                    Xem tất cả
                    <ArrowRight className="h-3 w-3" />
                  </TextLink>
                )}
              >
                <ul className="flex flex-col gap-2">
                  {customReports.map((r) => (
                    <li
                      key={r.title}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa] text-[#0077B6]">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-slate-800 sm:text-[11px]">{r.title}</p>
                          <p className="text-[8px] text-slate-400 sm:text-[9px]">Cập nhật: {r.updated}</p>
                        </span>
                      </div>
                      <button type="button" className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-[#0077B6]">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  </>
  )
}

export default ReportInsight
