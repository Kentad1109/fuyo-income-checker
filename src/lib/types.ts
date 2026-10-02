// 金額はすべて円単位の整数で扱う（浮動小数点誤差を避けるため小数は扱わない）

export interface Employer {
  id: string
  name: string
  hourlyWage: number
}

export interface MonthRecord {
  id: string // "2026-01" 形式
  year: number
  month: number // 1-12
  amounts: Record<string, number> // employerId -> 円
  other: number // その他収入（円）
}

export interface Settings {
  thresholdYen: number // 扶養管理ライン
  monthlyWarningLine: number // 月額注意ライン
  consecutiveMonthsWarning: number // 連続注意月数
  employers: Employer[]
}

export interface AppData {
  settings: Settings
  months: MonthRecord[]
}

export interface MonthlySimulationPlan {
  monthId: string // 対象月 "2026-10"
  hoursByEmployer: Record<string, number>
}
