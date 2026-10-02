import { useState } from 'react'
import type { Employer, MonthRecord } from '../lib/types'
import { monthId as buildMonthId, parseMonthId } from '../lib/calculations'

function toMonthInputValue(id: string): string {
  return id
}

export function MonthEditor({
  employers,
  mode,
  initial,
  existingIds,
  onSave,
  onCancel,
  onDelete,
}: {
  employers: Employer[]
  mode: 'add' | 'edit'
  initial?: MonthRecord
  existingIds: Set<string>
  onSave: (rec: MonthRecord) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [monthValue, setMonthValue] = useState(initial?.id ?? '')
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const e of employers) {
      init[e.id] = String(initial?.amounts[e.id] ?? 0)
    }
    return init
  })
  const [other, setOther] = useState(String(initial?.other ?? 0))
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    if (!monthValue) {
      setError('対象月を選択してください')
      return
    }
    if (mode === 'add' && existingIds.has(monthValue)) {
      setError('その月は既に登録されています')
      return
    }
    const { year, month } = parseMonthId(monthValue)
    const parsedAmounts: Record<string, number> = {}
    for (const e of employers) {
      const n = Number(amounts[e.id])
      parsedAmounts[e.id] = Number.isFinite(n) ? Math.round(n) : 0
    }
    const otherN = Number(other)
    onSave({
      id: buildMonthId(year, month),
      year,
      month,
      amounts: parsedAmounts,
      other: Number.isFinite(otherN) ? Math.round(otherN) : 0,
    })
  }

  return (
    <div className="rounded-2xl border-2 border-neutral-900 bg-white p-4 shadow-sm dark:border-neutral-100 dark:bg-neutral-900">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          対象月
          <input
            type="month"
            value={toMonthInputValue(monthValue)}
            disabled={mode === 'edit'}
            onChange={(e) => setMonthValue(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>

        {employers.map((e) => (
          <label key={e.id} className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {e.name}の金額
            <input
              type="number"
              inputMode="numeric"
              value={amounts[e.id]}
              onChange={(ev) => setAmounts((prev) => ({ ...prev, [e.id]: ev.target.value }))}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
        ))}

        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          その他の収入
          <input
            type="number"
            inputMode="numeric"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 rounded-full bg-neutral-900 py-2.5 text-sm font-bold text-white active:scale-95 dark:bg-neutral-100 dark:text-neutral-900"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-bold text-neutral-700 active:scale-95 dark:border-neutral-700 dark:text-neutral-300"
          >
            キャンセル
          </button>
        </div>
        {mode === 'edit' && onDelete && (
          <button
            onClick={onDelete}
            className="rounded-full py-2 text-sm font-semibold text-red-600 active:scale-95"
          >
            この月を削除
          </button>
        )}
      </div>
    </div>
  )
}
