import type { ConsecutiveRun } from '../lib/calculations'
import { formatMonthLabel } from '../lib/format'

export function ConsecutiveWarningBanner({
  runs,
  consecutiveMonthsWarning,
  monthlyWarningLine,
}: {
  runs: ConsecutiveRun[]
  consecutiveMonthsWarning: number
  monthlyWarningLine: number
}) {
  if (runs.length === 0) return null

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
      <p className="text-sm font-bold leading-relaxed">
        {consecutiveMonthsWarning}か月連続で月
        {monthlyWarningLine.toLocaleString('ja-JP')}円以上です。
        <br />
        勤務先の扶養認定ルールを確認してください。
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {runs.map((run) => (
          <li
            key={run.monthIds.join('-')}
            className="rounded-full bg-red-100 px-2.5 py-1 font-medium dark:bg-red-900/60"
          >
            {formatMonthLabel(run.monthIds[0])} 〜 {formatMonthLabel(run.monthIds[run.monthIds.length - 1])}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-red-700/80 dark:text-red-300/70">
        ※ これは管理上の目安であり、この表示だけで扶養から外れたと断定するものではありません。
      </p>
    </div>
  )
}
