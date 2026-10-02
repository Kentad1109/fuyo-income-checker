import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppData } from '../lib/types'
import { buildCumulativeSeries, formatYen, getRollingTwelveMonths, parseMonthId } from '../lib/calculations'
import { formatMonthLabelShort } from '../lib/format'
import { MonthPicker } from './MonthPicker'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4']

interface ChartRow {
  monthId: string
  label: string
  inWindow: boolean
  other: number
  [employerId: string]: string | number | boolean
}

export function ChartScreen({
  data,
  baseMonthId,
  onChangeBaseMonth,
}: {
  data: AppData
  baseMonthId: string
  onChangeBaseMonth: (id: string) => void
}) {
  const { settings, months } = data
  const { year, month } = parseMonthId(baseMonthId)

  const rollingIds = useMemo(() => {
    const rolling = getRollingTwelveMonths(months, year, month)
    return new Set(rolling.map((m) => m.id))
  }, [months, year, month])

  const sorted = useMemo(
    () => [...months].sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month)),
    [months],
  )

  const chartData = useMemo(
    () =>
      sorted.map((rec) => {
        const row: ChartRow = {
          monthId: rec.id,
          label: formatMonthLabelShort(rec.id),
          inWindow: rollingIds.has(rec.id),
          other: rec.other,
        }
        for (const e of settings.employers) {
          row[e.id] = rec.amounts[e.id] ?? 0
        }
        return row
      }),
    [sorted, settings.employers, rollingIds],
  )

  const cumulativeSeries = buildCumulativeSeries(months)
  const cumulativeMap = new Map(cumulativeSeries.map((c) => [c.monthId, c.cumulative]))
  const chartDataWithCumulative = chartData.map((row) => ({
    ...row,
    cumulative: cumulativeMap.get(row.monthId as string) ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">月別収入グラフ</h2>
        <MonthPicker value={baseMonthId} onChange={onChangeBaseMonth} label="基準月" />
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        濃い色＝直近12か月（基準月まで）の対象区間 / 薄い色＝対象外の月
      </p>

      <div className="rounded-3xl bg-white p-3 shadow-sm dark:bg-neutral-900">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartDataWithCumulative} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${Math.round(v / 10000)}万`}
              width={40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${Math.round(v / 10000)}万`}
              width={40}
              domain={[0, (dataMax: number) => Math.max(dataMax, settings.thresholdYen) * 1.08]}
            />
            <Tooltip
              formatter={(value, name) => [formatYen(Number(value)), String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {settings.employers.map((e, i) => (
              <Bar
                key={e.id}
                yAxisId="left"
                dataKey={e.id}
                name={e.name}
                stackId="income"
                fill={COLORS[i % COLORS.length]}
              >
                {chartDataWithCumulative.map((row) => (
                  <Cell key={row.monthId as string} fillOpacity={row.inWindow ? 1 : 0.35} />
                ))}
              </Bar>
            ))}
            <Bar yAxisId="left" dataKey="other" name="その他" stackId="income" fill="#a3a3a3">
              {chartDataWithCumulative.map((row) => (
                <Cell key={row.monthId as string} fillOpacity={row.inWindow ? 1 : 0.35} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="累積収入"
              stroke="#111827"
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine
              yAxisId="right"
              y={settings.thresholdYen}
              stroke="#dc2626"
              strokeDasharray="6 4"
              label={{
                value: `${Math.round(settings.thresholdYen / 10000)}万円`,
                position: 'insideTopRight',
                fill: '#dc2626',
                fontSize: 11,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
