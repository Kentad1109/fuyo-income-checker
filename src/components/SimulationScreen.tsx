import { useMemo, useState } from 'react'
import type { AppData } from '../lib/types'
import {
  formatYen,
  projectMultiMonthPlan,
  remainingToThreshold,
  simulateHours,
  simulationAdditionalTotal,
} from '../lib/calculations'
import { formatMonthLabel } from '../lib/format'
import { currentMonthId } from '../lib/dateUtils'
import { MonthPicker } from './MonthPicker'

interface PlanRow {
  key: string
  monthId: string
  hours: Record<string, string>
}

export function SimulationScreen({
  data,
  currentTotal,
  onApplyToMonth,
}: {
  data: AppData
  currentTotal: number
  onApplyToMonth: (monthId: string, additionalAmounts: Record<string, number>) => void
}) {
  const { settings, months } = data
  const threshold = settings.thresholdYen

  // --- 単発シミュレーション ---
  const [hours, setHours] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const e of settings.employers) init[e.id] = '0'
    return init
  })

  const numericHours = useMemo(() => {
    const result: Record<string, number> = {}
    for (const e of settings.employers) {
      const n = Number(hours[e.id])
      result[e.id] = Number.isFinite(n) && n > 0 ? n : 0
    }
    return result
  }, [hours, settings.employers])

  const simResults = useMemo(
    () => simulateHours(settings.employers, numericHours),
    [settings.employers, numericHours],
  )
  const additionalTotal = simulationAdditionalTotal(simResults)
  const simulatedTotal = currentTotal + additionalTotal
  const simulatedRemaining = remainingToThreshold(simulatedTotal, threshold)

  const existingMonths = useMemo(
    () => [...months].sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month)),
    [months],
  )
  const [applyTarget, setApplyTarget] = useState(existingMonths[0]?.id ?? currentMonthId())
  const [applied, setApplied] = useState(false)

  const handleApply = () => {
    const amounts: Record<string, number> = {}
    for (const r of simResults) amounts[r.employer.id] = r.amount
    onApplyToMonth(applyTarget, amounts)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  // --- 複数月の勤務予定シミュレーション ---
  const [plans, setPlans] = useState<PlanRow[]>([])

  const addPlanRow = () => {
    const hoursInit: Record<string, string> = {}
    for (const e of settings.employers) hoursInit[e.id] = '0'
    setPlans((prev) => [
      ...prev,
      { key: `${Date.now()}-${prev.length}`, monthId: currentMonthId(), hours: hoursInit },
    ])
  }

  const updatePlanMonth = (key: string, monthId: string) => {
    setPlans((prev) => prev.map((p) => (p.key === key ? { ...p, monthId } : p)))
  }
  const updatePlanHours = (key: string, employerId: string, value: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.key === key ? { ...p, hours: { ...p.hours, [employerId]: value } } : p)),
    )
  }
  const removePlanRow = (key: string) => {
    setPlans((prev) => prev.filter((p) => p.key !== key))
  }

  const projection = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const p of plans) {
      const nums: Record<string, number> = {}
      for (const e of settings.employers) {
        const n = Number(p.hours[e.id])
        nums[e.id] = Number.isFinite(n) && n > 0 ? n : 0
      }
      const results = simulateHours(settings.employers, nums)
      const add = simulationAdditionalTotal(results)
      byMonth.set(p.monthId, (byMonth.get(p.monthId) ?? 0) + add)
    }
    const planInputs = [...byMonth.entries()].map(([monthId, additionalAmount]) => ({
      monthId,
      additionalAmount,
    }))
    return projectMultiMonthPlan(currentTotal, planInputs)
  }, [plans, settings.employers, currentTotal])

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-5">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">これから働く時間をシミュレーション</h2>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="flex flex-col gap-4">
          {settings.employers.map((e) => {
            const r = simResults.find((x) => x.employer.id === e.id)
            return (
              <div key={e.id}>
                <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {e.name}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={hours[e.id]}
                      onChange={(ev) => setHours((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                      className="w-24 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                    <span>時間</span>
                  </div>
                </label>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {(numericHours[e.id] ?? 0).toLocaleString('ja-JP')}時間 × {e.hourlyWage.toLocaleString('ja-JP')}円 ={' '}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {formatYen(r?.amount ?? 0)}
                  </span>
                </p>
              </div>
            )
          })}

          <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <span>追加収入</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-50">{formatYen(additionalTotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <span>シミュレーション後の合計</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-50">{formatYen(simulatedTotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <span>{threshold.toLocaleString('ja-JP')}円まで</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-50">
                {simulatedRemaining > 0 ? `あと${formatYen(simulatedRemaining)}` : 'オーバー'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <MonthPicker label="反映先" value={applyTarget} onChange={setApplyTarget} />
            <button
              onClick={handleApply}
              disabled={additionalTotal === 0}
              className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-bold text-white disabled:opacity-40 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {applied ? '反映しました ✓' : '実績に反映'}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">
            ※ シミュレーション値は実績とは別です。「実績に反映」を押した月にのみ加算されます。
          </p>
        </div>
      </div>

      <h2 className="mt-2 text-lg font-bold text-neutral-900 dark:text-neutral-50">月ごとの勤務予定シミュレーション</h2>
      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="flex flex-col gap-3">
          {plans.map((p) => (
            <div key={p.key} className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <MonthPicker value={p.monthId} onChange={(id) => updatePlanMonth(p.key, id)} />
                <button
                  onClick={() => removePlanRow(p.key)}
                  className="text-sm font-semibold text-red-600"
                >
                  削除
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {settings.employers.map((e) => (
                  <label key={e.id} className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {e.name}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={p.hours[e.id] ?? '0'}
                      onChange={(ev) => updatePlanHours(p.key, e.id, ev.target.value)}
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={addPlanRow}
            className="rounded-full border border-dashed border-neutral-300 py-2.5 text-sm font-semibold text-neutral-600 active:scale-95 dark:border-neutral-700 dark:text-neutral-400"
          >
            ＋ 月を追加
          </button>

          {projection.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">現在</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-50">{formatYen(currentTotal)}</span>
              </div>
              {projection.map((p) => (
                <div
                  key={p.monthId}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800"
                >
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {formatMonthLabel(p.monthId)}終了時
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-50">
                    {formatYen(p.cumulativeTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
