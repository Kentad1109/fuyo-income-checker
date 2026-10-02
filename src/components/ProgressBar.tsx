import type { RiskLevel } from '../lib/calculations'

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: 'bg-emerald-500',
  caution: 'bg-amber-500',
  'high-caution': 'bg-orange-500',
  reached: 'bg-red-500',
  over: 'bg-red-600',
}

export function ProgressBar({ percent, risk }: { percent: number; risk: RiskLevel }) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  return (
    <div className="w-full">
      <div className="h-4 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${RISK_COLORS[risk]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
