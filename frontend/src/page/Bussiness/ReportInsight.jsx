import React, { useState } from 'react'
import {
  Calendar, ChevronDown, Download, FileText, TrendingUp, TrendingDown, ArrowRight, ArrowDownRight,
} from 'lucide-react'
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

const trendData = [
  { date: '01/05', jd: 18, tiencu: 38, phongvan: 12, tuyendung: 4 },
  { date: '07/05', jd: 22, tiencu: 45, phongvan: 18, tuyendung: 6 },
  { date: '14/05', jd: 25, tiencu: 52, phongvan: 22, tuyendung: 8 },
  { date: '21/05', jd: 26, tiencu: 60, phongvan: 30, tuyendung: 10 },
  { date: '28/05', jd: 28, tiencu: 68, phongvan: 46, tuyendung: 12 },
]

const metrics = [
  { label: 'Tổng JD đã đăng', value: '28', change: '+12% so với kỳ trước', up: true, icon: FileText, color: INSIGHTS_SERIES[0].color, bg: '#e8f4fa', sparkline: trendData.map((d) => d.jd), sparkGradId: 'kpi-spark-jd' },
  { label: 'Tổng tiến cử nhận được', value: '156', change: '+18% so với kỳ trước', up: true, icon: TrendingUp, color: INSIGHTS_SERIES[1].color, bg: '#e0f2fe', sparkline: trendData.map((d) => d.tiencu), sparkGradId: 'kpi-spark-tiencu' },
  { label: 'Ứng viên vào vòng phỏng vấn', value: '46', change: '+15% so với kỳ trước', up: true, icon: TrendingUp, color: INSIGHTS_SERIES[2].color, bg: '#f0f9ff', sparkline: trendData.map((d) => d.phongvan), sparkGradId: 'kpi-spark-pv' },
  { label: 'Tuyển thành công', value: '12', change: '+20% so với kỳ trước', up: true, icon: TrendingUp, color: INSIGHTS_SERIES[3].color, bg: '#e0f2fe', sparkline: trendData.map((d) => d.tuyendung), sparkGradId: 'kpi-spark-hire' },
  { label: 'Chi phí tuyển dụng (VNĐ)', value: '240,000,000đ', change: '-8% so với kỳ trước', up: false, icon: FileText, color: '#ca8a04', bg: '#fefce8', sparkline: [260, 255, 248, 245, 240], sparkGradId: 'kpi-spark-cost' },
]

const funnelData = [
  { name: 'JD đã đăng', value: 28, percent: '100%' },
  { name: 'Tiến cử nhận được', value: 156, percent: '71.4%' },
  { name: 'Vào phỏng vấn', value: 46, percent: '29.5%' },
  { name: 'Tuyển thành công', value: 12, percent: '29.3%' },
]

const insights = [
  { icon: '📊', title: 'Tỷ lệ tuyển thành công tăng 20%', desc: 'So với kỳ trước, hiệu quả tuyển dụng của bạn đang cải thiện tích cực.' },
  { icon: '🎯', title: 'Frontend Developer là vị trí hiệu quả nhất', desc: 'Tỷ lệ chuyển đổi đạt 35% vượt mức trung bình.' },
  { icon: '⏱️', title: 'Thời gian tuyển dụng trung bình giảm 8 ngày', desc: 'Từ 32 ngày xuống còn 24 ngày.' },
  { icon: '👥', title: 'Nguồn CTV mang lại nhiều ứng viên chất lượng nhất', desc: 'Nhóm CTV đã mang lại 65% tổng số ứng viên đạt chất lượng.' },
]

const deptData = [
  { name: 'IT', value: 5 },
  { name: 'Sales', value: 3 },
  { name: 'Marketing', value: 2 },
  { name: 'Finance', value: 1 },
  { name: 'Operations', value: 1 },
]

const sourceData = [
  { name: 'CTV (HR Partner)', value: 7, percent: '58%' },
  { name: 'Scout (Mở bảng credit)', value: 3, percent: '25%' },
  { name: 'Website công ty', value: 1, percent: '8%' },
  { name: 'Quảng cáo tuyển dụng', value: 1, percent: '8%' },
]
const maxSource = Math.max(...sourceData.map((s) => s.value))

const topPositions = [
  { name: 'Frontend Developer', rate: '35%', hires: 5, trend: [22, 26, 28, 32, 35] },
  { name: 'QA Engineer', rate: '32%', hires: 3, trend: [20, 24, 27, 30, 32] },
  { name: 'Product Owner', rate: '30%', hires: 2, trend: [18, 22, 24, 28, 30] },
  { name: 'DevOps Engineer', rate: '28%', hires: 1, trend: [15, 18, 22, 25, 28] },
  { name: 'Data Analyst', rate: '25%', hires: 1, trend: [12, 16, 18, 22, 25] },
]

const jdTable = [
  { jd: 'Frontend Developer (FE-2405)', dept: 'IT', tiencu: 28, phongvan: 10, tuyendung: 5, rate: '35%', status: 'Đang tuyển' },
  { jd: 'QA Engineer (QA-2405)', dept: 'IT', tiencu: 24, phongvan: 8, tuyendung: 3, rate: '32%', status: 'Đang tuyển' },
  { jd: 'Product Owner (PO-2405)', dept: 'Product', tiencu: 18, phongvan: 6, tuyendung: 2, rate: '30%', status: 'Đang tuyển' },
  { jd: 'DevOps Engineer (DO-2405)', dept: 'IT', tiencu: 12, phongvan: 3, tuyendung: 1, rate: '28%', status: 'Đang tuyển' },
  { jd: 'Data Analyst (DA-2405)', dept: 'Data', tiencu: 14, phongvan: 4, tuyendung: 1, rate: '25%', status: 'Tạm dừng' },
]

const timeToHireData = [
  { date: '01/05', days: 32 },
  { date: '07/05', days: 30 },
  { date: '14/05', days: 28 },
  { date: '21/05', days: 26 },
  { date: '28/05', days: 24 },
]

const customReports = [
  { title: 'Báo cáo hiệu quả tuyển dụng tổng quan', updated: '31/05/2024' },
  { title: 'Báo cáo chi phí tuyển dụng', updated: '31/05/2024' },
  { title: 'Báo cáo nguồn ứng viên', updated: '31/05/2024' },
  { title: 'Báo cáo JD theo phòng ban', updated: '31/05/2024' },
]

const statusColors = {
  'Đang tuyển': 'bg-emerald-100 text-emerald-700',
  'Tạm dừng': 'bg-amber-100 text-amber-700',
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
  const [trendPeriod, setTrendPeriod] = useState('Tuần')

  return (
  <>
    <style>{insightStyles}</style>
    <div
      className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-200/90 bg-white px-3 py-2.5 sm:px-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 sm:text-base">Reports &amp; Insights</h1>
              <p className="text-[10px] text-slate-500 sm:text-[11px]">
                Dữ liệu tổng quan và phân tích hiệu quả tuyển dụng trên JobShare
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/40 sm:text-[11px]"
              >
                <Calendar className="h-3 w-3 text-slate-400" />
                01/05/2024 – 31/05/2024
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
                <InsightsDonutChart data={funnelData} centerLabel="Tỷ lệ chung" centerValue="29.3%" height={140} />
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
                <p className="mt-2 inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-600 sm:text-[9px]">
                  <TrendingUp className="h-2.5 w-2.5" />
                  5.2% so với kỳ trước
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
                <InsightsBarChart data={deptData} height={168} />
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
                  {sourceData.map((s, i) => (
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
                      {topPositions.map((p) => (
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
                  <table className="w-full min-w-[520px] border-collapse text-[9px] sm:text-[10px]">
                    <thead>
                      <tr className="text-[8px] uppercase tracking-wide text-slate-400 sm:text-[9px]">
                        {['JD', 'Phòng ban', 'Tiến cử', 'PV', 'Tuyển', 'Tỷ lệ', 'Trạng thái'].map((h) => (
                          <th
                            key={h}
                            className={`px-1 pb-2 font-semibold ${h === 'JD' || h === 'Phòng ban' ? 'text-left' : 'text-right'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jdTable.map((row) => (
                        <tr key={row.jd} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-1 py-2 font-medium text-slate-800">{row.jd}</td>
                          <td className="px-1 py-2 text-slate-500">{row.dept}</td>
                          <td className="px-1 py-2 text-right tabular-nums">{row.tiencu}</td>
                          <td className="px-1 py-2 text-right tabular-nums">{row.phongvan}</td>
                          <td className="px-1 py-2 text-right tabular-nums">{row.tuyendung}</td>
                          <td className="px-1 py-2 text-right">{row.rate}</td>
                          <td className="px-1 py-2 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold sm:text-[9px] ${statusColors[row.status]}`}>
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
                <p className="text-lg font-bold text-slate-900 sm:text-xl">24 ngày</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-600 sm:text-[9px]">
                  <TrendingDown className="h-2.5 w-2.5" />
                  8 ngày so với kỳ trước
                </p>
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
        </div>
      </div>
    </div>
  </>
  )
}

export default ReportInsight
