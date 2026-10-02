import { useMemo, useState } from 'react'
import type { AppData, MonthRecord } from '../lib/types'
import { monthTotal, isOverMonthlyLine } from '../lib/calculations'
import { formatMonthLabel } from '../lib/format'
import { MonthEditor } from './MonthEditor'

function formatYenPlain(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`
}

export function MonthsScreen({
  data,
  onUpdateMonth,
  onAddMonth,
  onRemoveMonth,
}: {
  data: AppData
  onUpdateMonth: (id: string, rec: MonthRecord) => void
  onAddMonth: (rec: MonthRecord) => void
  onRemoveMonth: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const sorted = useMemo(
    () => [...data.months].sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month)),
    [data.months],
  )

  const existingIds = new Set(data.months.map((m) => m.id))

  return (
    <div className="flex flex-col gap-3 px-4 pb-24 pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">月別収入</h2>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white active:scale-95 dark:bg-neutral-100 dark:text-neutral-900"
        >
          ＋ 月を追加
        </button>
      </div>

      {adding && (
        <MonthEditor
          employers={data.settings.employers}
          mode="add"
          existingIds={existingIds}
          onCancel={() => setAdding(false)}
          onSave={(rec) => {
            onAddMonth(rec)
            setAdding(false)
          }}
        />
      )}

      {sorted.map((rec) => {
        const total = monthTotal(rec)
        const warn = isOverMonthlyLine(rec, data.settings.monthlyWarningLine)
        if (editingId === rec.id) {
          return (
            <MonthEditor
              key={rec.id}
              employers={data.settings.employers}
              mode="edit"
              initial={rec}
              existingIds={existingIds}
              onCancel={() => setEditingId(null)}
              onSave={(updated) => {
                onUpdateMonth(rec.id, updated)
                setEditingId(null)
              }}
              onDelete={() => {
                onRemoveMonth(rec.id)
                setEditingId(null)
              }}
            />
          )
        }
        return (
          <div
            key={rec.id}
            className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-neutral-900 dark:text-neutral-50">
                {formatMonthLabel(rec.id)}
                {warn && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                    {data.settings.monthlyWarningLine.toLocaleString('ja-JP')}円以上
                  </span>
                )}
              </p>
              <button
                onClick={() => setEditingId(rec.id)}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 active:scale-95 dark:border-neutral-700 dark:text-neutral-300"
              >
                編集
              </button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              {data.settings.employers.map((emp) => (
                <div key={emp.id} className="flex justify-between">
                  <span>{emp.name}</span>
                  <span>{formatYenPlain(rec.amounts[emp.id] ?? 0)}</span>
                </div>
              ))}
              {rec.other !== 0 && (
                <div className="flex justify-between">
                  <span>その他</span>
                  <span>{formatYenPlain(rec.other)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">
              <span>合計</span>
              <span>{formatYenPlain(total)}</span>
            </div>
          </div>
        )
      })}

      {sorted.length === 0 && (
        <p className="py-10 text-center text-sm text-neutral-400">まだ月のデータがありません</p>
      )}
    </div>
  )
}
