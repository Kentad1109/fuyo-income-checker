import type { AppData, MonthRecord } from './types'

export const EMPLOYER_A_ID = 'company-a'
export const EMPLOYER_R_ID = 'company-r'

const month = (
  year: number,
  m: number,
  amounts: Record<string, number>,
  other = 0,
): MonthRecord => ({
  id: `${year}-${String(m).padStart(2, '0')}`,
  year,
  month: m,
  amounts,
  other,
})

export function createDefaultData(): AppData {
  return {
    settings: {
      thresholdYen: 1_500_000,
      monthlyWarningLine: 125_000,
      consecutiveMonthsWarning: 3,
      employers: [
        { id: EMPLOYER_R_ID, name: '旅行会社R', hourlyWage: 1280 },
        { id: EMPLOYER_A_ID, name: '保険会社A', hourlyWage: 1280 },
      ],
    },
    months: [
      month(2025, 12, {}, 34_935),
      month(2026, 1, { [EMPLOYER_R_ID]: 100_345, [EMPLOYER_A_ID]: 24_597 }),
      month(2026, 2, { [EMPLOYER_R_ID]: 105_591, [EMPLOYER_A_ID]: 54_467 }),
      month(2026, 3, { [EMPLOYER_R_ID]: 122_862, [EMPLOYER_A_ID]: 65_950 }),
      month(2026, 4, { [EMPLOYER_R_ID]: 74_716, [EMPLOYER_A_ID]: 26_777 }),
      month(2026, 5, { [EMPLOYER_R_ID]: 81_135, [EMPLOYER_A_ID]: 51_191 }),
      month(2026, 6, { [EMPLOYER_R_ID]: 64_613, [EMPLOYER_A_ID]: 53_000 }),
      month(2026, 7, { [EMPLOYER_R_ID]: 48_088, [EMPLOYER_A_ID]: 262_670 }),
      month(2026, 8, { [EMPLOYER_R_ID]: 65_777, [EMPLOYER_A_ID]: 53_119 }),
      month(2026, 9, { [EMPLOYER_R_ID]: 85_000, [EMPLOYER_A_ID]: 21_760 }),
    ],
  }
}
