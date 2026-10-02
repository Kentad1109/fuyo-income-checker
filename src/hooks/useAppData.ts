import { useCallback, useEffect, useState } from 'react'
import type { AppData, Employer, MonthRecord, Settings } from '../lib/types'
import {
  exportAppDataAsJson,
  importAppDataFromJson,
  loadAppData,
  resetAppData,
  saveAppData,
} from '../lib/storage'

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadAppData())

  useEffect(() => {
    saveAppData(data)
  }, [data])

  const updateMonth = useCallback((monthId: string, updater: (rec: MonthRecord) => MonthRecord) => {
    setData((prev) => ({
      ...prev,
      months: prev.months.map((m) => (m.id === monthId ? updater(m) : m)),
    }))
  }, [])

  const addMonth = useCallback((rec: MonthRecord) => {
    setData((prev) => {
      if (prev.months.some((m) => m.id === rec.id)) return prev
      return { ...prev, months: [...prev.months, rec] }
    })
  }, [])

  const removeMonth = useCallback((monthId: string) => {
    setData((prev) => ({ ...prev, months: prev.months.filter((m) => m.id !== monthId) }))
  }, [])

  const updateSettings = useCallback((updater: (s: Settings) => Settings) => {
    setData((prev) => ({ ...prev, settings: updater(prev.settings) }))
  }, [])

  const updateEmployer = useCallback((employerId: string, patch: Partial<Employer>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        employers: prev.settings.employers.map((e) =>
          e.id === employerId ? { ...e, ...patch } : e,
        ),
      },
    }))
  }, [])

  const reset = useCallback(() => {
    setData(resetAppData())
  }, [])

  const exportJson = useCallback(() => exportAppDataAsJson(data), [data])

  const importJson = useCallback((json: string) => {
    const imported = importAppDataFromJson(json)
    setData(imported)
  }, [])

  return {
    data,
    setData,
    updateMonth,
    addMonth,
    removeMonth,
    updateSettings,
    updateEmployer,
    reset,
    exportJson,
    importJson,
  }
}
