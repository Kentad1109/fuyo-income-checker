import { useRef, useState } from 'react'
import type { AppData } from '../lib/types'

export function SettingsScreen({
  data,
  onUpdateSettings,
  onUpdateEmployerWage,
  onReset,
  onExport,
  onImport,
}: {
  data: AppData
  onUpdateSettings: (patch: Partial<AppData['settings']>) => void
  onUpdateEmployerWage: (employerId: string, wage: number) => void
  onReset: () => void
  onExport: () => void
  onImport: (json: string) => void
}) {
  const { settings } = data
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(String(reader.result))
        setImportError(null)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 2000)
      } catch {
        setImportError('読み込みに失敗しました。ファイル形式を確認してください。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (window.confirm('初期データに戻します。現在の入力内容は失われます。よろしいですか？')) {
      onReset()
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-5">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">設定</h2>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">管理ライン</p>
        <label className="flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          扶養管理ライン（円）
          <input
            type="number"
            inputMode="numeric"
            value={settings.thresholdYen}
            onChange={(e) => onUpdateSettings({ thresholdYen: Number(e.target.value) || 0 })}
            className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          月額注意ライン（円）
          <input
            type="number"
            inputMode="numeric"
            value={settings.monthlyWarningLine}
            onChange={(e) => onUpdateSettings({ monthlyWarningLine: Number(e.target.value) || 0 })}
            className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          連続注意月数（か月）
          <input
            type="number"
            inputMode="numeric"
            value={settings.consecutiveMonthsWarning}
            onChange={(e) => onUpdateSettings({ consecutiveMonthsWarning: Number(e.target.value) || 1 })}
            className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">時給設定</p>
        {settings.employers.map((e) => (
          <label
            key={e.id}
            className="mt-1 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400"
          >
            {e.name}時給（円）
            <input
              type="number"
              inputMode="numeric"
              value={e.hourlyWage}
              onChange={(ev) => onUpdateEmployerWage(e.id, Number(ev.target.value) || 0)}
              className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">データのバックアップ</p>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-bold text-neutral-700 active:scale-95 dark:border-neutral-700 dark:text-neutral-300"
          >
            データを書き出す
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-bold text-neutral-700 active:scale-95 dark:border-neutral-700 dark:text-neutral-300"
          >
            データを読み込む
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        {importSuccess && <p className="mt-2 text-sm font-semibold text-emerald-600">読み込みました</p>}
        {importError && <p className="mt-2 text-sm font-semibold text-red-600">{importError}</p>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <p className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">リセット</p>
        <button
          onClick={handleReset}
          className="w-full rounded-full bg-red-600 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          初期データに戻す
        </button>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-neutral-400">
        ※ このアプリは個人での収入管理・シミュレーションを目的としたものです。実際の扶養認定は勤務先・保険者の判断によります。
      </p>
    </div>
  )
}
