import { RISK_LABELS, type RiskLevel } from '../lib/calculations'

const STYLES: Record<RiskLevel, string> = {
  safe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  caution: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'high-caution': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  reached: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  over: 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200',
}

export function StatusBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STYLES[risk]}`}
    >
      {RISK_LABELS[risk]}
    </span>
  )
}
