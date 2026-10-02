import { useMemo } from 'react'
import type { AppData } from '../lib/types'
import {
  formatHours,
  formatYen,
  getRiskLevel,
  getRollingTwelveMonths,
  hasConsecutiveWarning,
  overAmount,
  parseMonthId,
  progressPercent,
  remainingHoursByEmployer,
  remainingToThreshold,
  sumMonths,
} from '../lib/calculations'
import { formatMonthLabel } from '../lib/format'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'
import { MonthPicker } from './MonthPicker'
import { ConsecutiveWarningBanner } from './ConsecutiveWarningBanner'

export function HomeScreen({
  data,
  baseMonthId,
  onChangeBaseMonth,
}: {
  data: AppData
  baseMonthId: string
  onChangeBaseMonth: (id: string) => void
}) {
  const { year, month } = parseMonthId(baseMonthId)
  const { settings, months } = data

  const rollingMonths = useMemo(
    () => getRollingTwelveMonths(months, year, month),
    [months, year, month],
  )
  const total = sumMonths(rollingMonths)
  const threshold = settings.thresholdYen
  const remaining = remainingToThreshold(total, threshold)
  const over = overAmount(total, threshold)
  const percent = progressPercent(total, threshold)
  const risk = getRiskLevel(total, threshold)

  const hoursByEmployer = remainingHoursByEmployer(settings.employers, remaining)
  const sameWage =
    settings.employers.length > 0 &&
    settings.employers.every((e) => e.hourlyWage === settings.employers[0].hourlyWage)

  const consecutiveRuns = useMemo(
    () => hasConsecutiveWarning(months, settings.monthlyWarningLine, settings.consecutiveMonthsWarning),
    [months, settings.monthlyWarningLine, settings.consecutiveMonthsWarning],
  )

  const windowStart = rollingMonths.length
    ? [...rollingMonths].sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month))[0]
    : undefined

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <ConsecutiveWarningBanner
        runs={consecutiveRuns}
        consecutiveMonthsWarning={settings.consecutiveMonthsWarning}
        monthlyWarningLine={settings.monthlyWarningLine}
      />

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">現在の対象収入</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {formatYen(total)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {threshold.toLocaleString('ja-JP')}円まで
            </p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {over > 0 ? `${formatYen(over)} オーバー` : `あと ${formatYen(remaining)}`}
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">あと働ける時間</p>
            {sameWage ? (
              <p className="mt-0.5 text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {formatHours(hoursByEmployer[0]?.hours ?? 0)}
              </p>
            ) : (
              <div className="mt-0.5 space-y-0.5">
                {hoursByEmployer.map(({ employer, hours }) => (
                  <p key={employer.id} className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    {employer.name}: {formatHours(hours)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {formatYen(total)} / {formatYen(threshold)}
            </span>
            <span className="font-bold text-neutral-900 dark:text-neutral-50">{percent.toFixed(1)}%</span>
          </div>
          <ProgressBar percent={percent} risk={risk} />
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge risk={risk} />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {over > 0 ? `${formatYen(over)}オーバー` : `あと${formatYen(remaining)}`}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          ※ 税制上の年収判定ではなく、扶養手当の管理ラインへの距離を示す目安です。このアプリだけで扶養の判定はできません。
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">直近12か月（基準月）</p>
          <MonthPicker value={baseMonthId} onChange={onChangeBaseMonth} />
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {windowStart ? formatMonthLabel(windowStart.id) : '―'} 〜 {formatMonthLabel(baseMonthId)} の合計を表示中
        </p>
      </div>
    </div>
  )
}
