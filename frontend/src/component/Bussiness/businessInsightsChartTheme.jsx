import React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/** Brand + SaaS dashboard blue scale (template ảnh mẫu, gốc portal #0077B6) */
export const INSIGHTS_BRAND = '#0077B6'

export const INSIGHTS_SERIES = [
  { key: 'jd', label: 'JD đã đăng', color: '#0077B6', gradientId: 'insights-area-jd' },
  { key: 'tiencu', label: 'Tiến cử nhận được', color: '#38bdf8', gradientId: 'insights-area-tiencu' },
  { key: 'phongvan', label: 'Vào phỏng vấn', color: '#0ea5e9', gradientId: 'insights-area-phongvan' },
  { key: 'tuyendung', label: 'Tuyển thành công', color: '#0284c7', gradientId: 'insights-area-hire' },
]

export const INSIGHTS_DONUT_COLORS = ['#0077B6', '#38bdf8', '#0ea5e9', '#7dd3fc']

export const CHART_MARGIN = { top: 8, right: 12, left: 4, bottom: 0 }
export const CHART_MARGIN_BAR = { top: 20, right: 12, left: 4, bottom: 0 }

export const axisTick = { fontSize: 10, fill: '#94a3b8', fontFamily: 'inherit' }
export const gridStroke = '#eef2f6'

const tooltipBox = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  padding: '8px 10px',
  fontSize: 11,
}

export function InsightChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipBox}>
      {label ? <p className="biz-ui-caption mb-1.5 font-semibold text-slate-500">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="biz-ui-body flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: entry.color || entry.stroke || INSIGHTS_BRAND }}
              />
              {entry.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BusinessChartGradients({ ids }) {
  const list = ids?.length
    ? ids.map((id) => INSIGHTS_SERIES.find((s) => s.gradientId === id)).filter(Boolean)
    : INSIGHTS_SERIES
  return (
    <defs>
      {list.map((s) => (
        <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
          <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
        </linearGradient>
      ))}
      <linearGradient id="insights-area-time" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="insights-bar-dept" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
        <stop offset="100%" stopColor="#0077B6" stopOpacity={1} />
      </linearGradient>
    </defs>
  )
}

export function ChartLegendRow({ items, className = '' }) {
  return (
    <div className={`biz-ui-caption flex flex-wrap gap-x-4 gap-y-1 text-slate-500 ${className}`}>
      {items.map((item) => (
        <span key={item.key || item.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function ChartPeriodPills({ value, onChange, options = ['Tuần', 'Tháng', 'Năm'] }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange?.(opt)}
          className={`biz-ui-caption rounded-md px-2 py-0.5 font-semibold transition-colors ${
            value === opt ? 'bg-white text-[#0077B6] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function KpiSparkline({ data, dataKey = 'v', color = INSIGHTS_BRAND, gradientId = 'insights-spark-kpi', height = 36 }) {
  const chartData = (data || []).map((v, i) => ({ i, [dataKey]: v }))
  if (chartData.length < 2) return null
  const gradId = `${gradientId}-fill`
  return (
    <div className="mt-2 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TableSparkline({ values, color = INSIGHTS_BRAND, width = 72, height = 28 }) {
  const chartData = (values || []).map((v, i) => ({ i, v }))
  if (chartData.length < 2) return <span className="text-slate-300">—</span>
  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="none" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function InsightsTrendAreaChart({ data, height = 200 }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <BusinessChartGradients />
          <CartesianGrid stroke={gridStroke} vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} dy={4} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[0, 'auto']}
            allowDecimals={false}
            tickCount={5}
          />
          <Tooltip content={<InsightChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
          {INSIGHTS_SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#${s.gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function InsightsDonutChart({ data, centerLabel, centerValue, height = 140 }) {
  const colored = (data || []).map((d, i) => ({
    ...d,
    fill: d.color || INSIGHTS_DONUT_COLORS[i % INSIGHTS_DONUT_COLORS.length],
  }))
  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={3}
            stroke="#fff"
            strokeWidth={2}
          >
            {colored.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip content={<InsightChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel ? <span className="biz-ui-micro text-slate-400">{centerLabel}</span> : null}
          {centerValue ? <span className="biz-ui-stat text-slate-900">{centerValue}</span> : null}
        </div>
      )}
    </div>
  )
}

export function InsightsBarChart({ data, dataKey = 'value', height = 168 }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={CHART_MARGIN_BAR} barCategoryGap="28%">
          <BusinessChartGradients ids={[]} />
          <CartesianGrid stroke={gridStroke} vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<InsightChartTooltip />} cursor={{ fill: 'rgba(0,119,182,0.06)' }} />
          <Bar
            dataKey={dataKey}
            name="Tuyển thành công"
            fill="url(#insights-bar-dept)"
            radius={[8, 8, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function InsightsSingleAreaChart({ data, dataKey = 'days', name = 'Ngày', height = 140, color = '#0284c7' }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <BusinessChartGradients ids={[]} />
          <CartesianGrid stroke={gridStroke} vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<InsightChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            strokeWidth={2.5}
            fill="url(#insights-area-time)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
