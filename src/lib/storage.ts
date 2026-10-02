import type { AppData } from './types'
import { createDefaultData } from './defaultData'

const STORAGE_KEY = 'fuyo-income-checker:data:v1'

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.settings || !Array.isArray(parsed.months)) return createDefaultData()
    return parsed
  } catch {
    return createDefaultData()
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetAppData(): AppData {
  const fresh = createDefaultData()
  saveAppData(fresh)
  return fresh
}

export function exportAppDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function importAppDataFromJson(json: string): AppData {
  const parsed = JSON.parse(json) as AppData
  if (!parsed.settings || !Array.isArray(parsed.months)) {
    throw new Error('データ形式が不正です')
  }
  return parsed
}
