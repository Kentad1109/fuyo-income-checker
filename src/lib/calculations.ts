import type { Employer, MonthRecord, Settings } from './types'

export function parseMonthId(id: string): { year: number; month: number } {
  const [y, m] = id.split('-').map(Number)
  return { year: y, month: m }
}

export function monthId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** 月の合計収入（円、整数） */
export function monthTotal(rec: MonthRecord): number {
  const employerSum = Object.values(rec.amounts).reduce((a, b) => a + b, 0)
  return employerSum + rec.other
}

/** 複数月の合計収入（円、整数） */
export function sumMonths(months: MonthRecord[]): number {
  return months.reduce((sum, m) => sum + monthTotal(m), 0)
}

/** 基準月を1つ進めた (year, month) を返す */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta
  const newYear = Math.floor(total / 12)
  const newMonth = (total % 12) + 1
  return { year: newYear, month: newMonth }
}

/**
 * 基準月を含む直近12か月分の MonthRecord を抽出する。
 * データが存在しない月は無視する（合計には影響しない）。
 */
export function getRollingTwelveMonths(
  months: MonthRecord[],
  baseYear: number,
  baseMonth: number,
): MonthRecord[] {
  const ids = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const { year, month } = addMonths(baseYear, baseMonth, -i)
    ids.add(monthId(year, month))
  }
  return months.filter((m) => ids.has(m.id))
}

/** 150万円などの基準額までの残額（0未満にはならない） */
export function remainingToThreshold(total: number, threshold: number): number {
  return Math.max(threshold - total, 0)
}

/** 基準額を超えた額（超えていなければ0） */
export function overAmount(total: number, threshold: number): number {
  return Math.max(total - threshold, 0)
}

/** 基準額に対する進捗率（%）。100を超えることもある */
export function progressPercent(total: number, threshold: number): number {
  if (threshold <= 0) return 0
  return (total / threshold) * 100
}

/** 残額から、ある時給で働ける残り時間を計算する（時間、小数1桁相当の精度） */
export function remainingHours(remainingYen: number, hourlyWage: number): number {
  if (hourlyWage <= 0) return 0
  return remainingYen / hourlyWage
}

export type RiskLevel = 'safe' | 'caution' | 'high-caution' | 'reached' | 'over'

export const RISK_LABELS: Record<RiskLevel, string> = {
  safe: '余裕あり',
  caution: '注意',
  'high-caution': 'かなり注意',
  reached: '150万円到達',
  over: '150万円超過',
}

/** 現在の収入状況から危険度（管理ラインへの距離の目安）を判定する */
export function getRiskLevel(total: number, threshold: number): RiskLevel {
  if (total > threshold) return 'over'
  if (total === threshold) return 'reached'
  const percent = progressPercent(total, threshold)
  if (percent >= 90) return 'high-caution'
  if (percent >= 70) return 'caution'
  return 'safe'
}

export interface EmployerHoursResult {
  employer: Employer
  hours: number
  amount: number
}

/** 勤務時間シミュレーション：時給×時間で各勤務先の金額を計算する */
export function simulateHours(
  employers: Employer[],
  hoursByEmployer: Record<string, number>,
): EmployerHoursResult[] {
  return employers.map((employer) => {
    const hours = hoursByEmployer[employer.id] ?? 0
    return {
      employer,
      hours,
      amount: Math.round(hours * employer.hourlyWage),
    }
  })
}

/** シミュレーション結果の追加収入合計 */
export function simulationAdditionalTotal(results: EmployerHoursResult[]): number {
  return results.reduce((sum, r) => sum + r.amount, 0)
}

/** 勤務先ごとの残り稼働可能時間（時給が異なる場合はそれぞれ別の数値になる） */
export function remainingHoursByEmployer(
  employers: Employer[],
  remainingYen: number,
): { employer: Employer; hours: number }[] {
  return employers.map((employer) => ({
    employer,
    hours: remainingHours(remainingYen, employer.hourlyWage),
  }))
}

/** 月収が注意ライン以上かどうか */
export function isOverMonthlyLine(rec: MonthRecord, line: number): boolean {
  return monthTotal(rec) >= line
}

export interface ConsecutiveRun {
  monthIds: string[]
}

/**
 * 月を年月順にソートし、注意ライン以上が連続している区間（長さ2以上）を抽出する。
 * 月同士が暦の上で連続している場合のみ「連続」とみなす。
 */
export function findConsecutiveRuns(months: MonthRecord[], line: number): ConsecutiveRun[] {
  const sorted = [...months].sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month))
  const runs: ConsecutiveRun[] = []
  let current: MonthRecord[] = []

  const flush = () => {
    if (current.length >= 2) {
      runs.push({ monthIds: current.map((m) => m.id) })
    }
    current = []
  }

  for (let i = 0; i < sorted.length; i++) {
    const rec = sorted[i]
    const over = isOverMonthlyLine(rec, line)
    if (!over) {
      flush()
      continue
    }
    if (current.length === 0) {
      current.push(rec)
    } else {
      const prev = current[current.length - 1]
      const { year, month } = addMonths(prev.year, prev.month, 1)
      if (year === rec.year && month === rec.month) {
        current.push(rec)
      } else {
        flush()
        current.push(rec)
      }
    }
  }
  flush()

  return runs
}

/** 連続注意月数以上の警告ランがあるかどうか */
export function hasConsecutiveWarning(
  months: MonthRecord[],
  line: number,
  consecutiveMonthsWarning: number,
): ConsecutiveRun[] {
  return findConsecutiveRuns(months, line).filter(
    (run) => run.monthIds.length >= consecutiveMonthsWarning,
  )
}

/** 累積収入の系列（グラフ用）：月ごとの単月合計と累積合計 */
export function buildCumulativeSeries(
  months: MonthRecord[],
): { monthId: string; monthTotal: number; cumulative: number }[] {
  const sorted = [...months].sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month))
  let cumulative = 0
  return sorted.map((rec) => {
    cumulative += monthTotal(rec)
    return { monthId: rec.id, monthTotal: monthTotal(rec), cumulative }
  })
}

/**
 * 複数月の勤務予定シミュレーションを時系列で累積する。
 * 現在の年間合計（baseTotal）から開始し、計画月を順に加算していく。
 */
export function projectMultiMonthPlan(
  baseTotal: number,
  plans: { monthId: string; additionalAmount: number }[],
): { monthId: string; cumulativeTotal: number }[] {
  const sorted = [...plans].sort((a, b) => a.monthId.localeCompare(b.monthId))
  let running = baseTotal
  return sorted.map((p) => {
    running += p.additionalAmount
    return { monthId: p.monthId, cumulativeTotal: running }
  })
}

export function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}時間`
}

export function getEmployerById(settings: Settings, id: string): Employer | undefined {
  return settings.employers.find((e) => e.id === id)
}
