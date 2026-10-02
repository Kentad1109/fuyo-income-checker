import { useMemo, useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { currentMonthId } from './lib/dateUtils'
import { getRollingTwelveMonths, parseMonthId, sumMonths } from './lib/calculations'
import { BottomNav, type TabKey } from './components/BottomNav'
import { HomeScreen } from './components/HomeScreen'
import { MonthsScreen } from './components/MonthsScreen'
import { SimulationScreen } from './components/SimulationScreen'
import { ChartScreen } from './components/ChartScreen'
import { SettingsScreen } from './components/SettingsScreen'

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function App() {
  const { data, updateMonth, addMonth, removeMonth, updateSettings, updateEmployer, reset, exportJson, importJson } =
    useAppData()
  const [tab, setTab] = useState<TabKey>('home')
  const [baseMonthId, setBaseMonthId] = useState(currentMonthId())

  const { year, month } = parseMonthId(baseMonthId)
  const currentTotal = useMemo(
    () => sumMonths(getRollingTwelveMonths(data.months, year, month)),
    [data.months, year, month],
  )

  const handleApplyToMonth = (monthId: string, additionalAmounts: Record<string, number>) => {
    const existing = data.months.find((m) => m.id === monthId)
    if (existing) {
      updateMonth(monthId, (rec) => ({
        ...rec,
        amounts: Object.fromEntries(
          Object.entries(rec.amounts).map(([k, v]) => [k, v + (additionalAmounts[k] ?? 0)]),
        ),
      }))
    } else {
      const { year: y, month: m } = parseMonthId(monthId)
      addMonth({ id: monthId, year: y, month: m, amounts: { ...additionalAmounts }, other: 0 })
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 dark:bg-neutral-950">
      {tab === 'home' && (
        <HomeScreen data={data} baseMonthId={baseMonthId} onChangeBaseMonth={setBaseMonthId} />
      )}
      {tab === 'months' && (
        <MonthsScreen
          data={data}
          onUpdateMonth={(id, rec) => updateMonth(id, () => rec)}
          onAddMonth={addMonth}
          onRemoveMonth={removeMonth}
        />
      )}
      {tab === 'simulation' && (
        <SimulationScreen data={data} currentTotal={currentTotal} onApplyToMonth={handleApplyToMonth} />
      )}
      {tab === 'chart' && (
        <ChartScreen data={data} baseMonthId={baseMonthId} onChangeBaseMonth={setBaseMonthId} />
      )}
      {tab === 'settings' && (
        <SettingsScreen
          data={data}
          onUpdateSettings={(patch) => updateSettings((s) => ({ ...s, ...patch }))}
          onUpdateEmployerWage={(id, wage) => updateEmployer(id, { hourlyWage: wage })}
          onReset={reset}
          onExport={() => downloadJson(exportJson(), `fuyo-income-backup-${currentMonthId()}.json`)}
          onImport={importJson}
        />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
