import { describe, expect, it } from 'vitest'
import { createDefaultData, EMPLOYER_A_ID, EMPLOYER_R_ID } from './defaultData'
import {
  buildCumulativeSeries,
  findConsecutiveRuns,
  getRiskLevel,
  getRollingTwelveMonths,
  hasConsecutiveWarning,
  monthTotal,
  overAmount,
  projectMultiMonthPlan,
  remainingHours,
  remainingHoursByEmployer,
  remainingToThreshold,
  simulateHours,
  simulationAdditionalTotal,
  sumMonths,
} from './calculations'

describe('monthTotal', () => {
  it('勤務先の金額とその他を合算する', () => {
    const data = createDefaultData()
    const jan = data.months.find((m) => m.id === '2026-01')!
    expect(monthTotal(jan)).toBe(100_345 + 24_597)
  })

  it('その他のみの月も計算できる', () => {
    const data = createDefaultData()
    const dec = data.months.find((m) => m.id === '2025-12')!
    expect(monthTotal(dec)).toBe(34_935)
  })
})

describe('初期データの年間合計', () => {
  it('全10か月の合計が正しい', () => {
    const data = createDefaultData()
    const total = sumMonths(data.months)
    const expected =
      34_935 +
      (100_345 + 24_597) +
      (105_591 + 54_467) +
      (122_862 + 65_950) +
      (74_716 + 26_777) +
      (81_135 + 51_191) +
      (64_613 + 53_000) +
      (48_088 + 262_670) +
      (65_777 + 53_119) +
      (85_000 + 21_760)
    expect(total).toBe(expected)
  })
})

describe('getRollingTwelveMonths', () => {
  it('基準月2026年11月なら2025年12月〜2026年11月が対象になる', () => {
    const data = createDefaultData()
    const rolling = getRollingTwelveMonths(data.months, 2026, 11)
    const ids = rolling.map((m) => m.id).sort()
    // データ上は2025-12から2026-09までしか存在しないため、その全件が含まれる
    expect(ids).toEqual(
      [
        '2025-12',
        '2026-01',
        '2026-02',
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
        '2026-09',
      ].sort(),
    )
  })

  it('基準月2026年12月だと2025年12月が範囲から外れる', () => {
    const data = createDefaultData()
    const rolling = getRollingTwelveMonths(data.months, 2026, 12)
    const ids = rolling.map((m) => m.id)
    expect(ids).not.toContain('2025-12')
    expect(ids).toContain('2026-01')
  })
})

describe('remainingToThreshold / overAmount', () => {
  it('残額は150万円から現在の合計を引いた額', () => {
    expect(remainingToThreshold(1_396_593, 1_500_000)).toBe(103_407)
  })

  it('超過時は残額0、超過額はプラスの値になる', () => {
    expect(remainingToThreshold(1_534_200, 1_500_000)).toBe(0)
    expect(overAmount(1_534_200, 1_500_000)).toBe(34_200)
  })

  it('超過していない場合の超過額は0', () => {
    expect(overAmount(1_000_000, 1_500_000)).toBe(0)
  })
})

describe('remainingHours / remainingHoursByEmployer', () => {
  it('残額÷時給で残り時間を計算する', () => {
    expect(remainingHours(128_000, 1_280)).toBe(100)
  })

  it('時給が異なる勤務先ごとに残り時間を計算する', () => {
    const employers = [
      { id: 'a', name: 'A', hourlyWage: 1000 },
      { id: 'b', name: 'B', hourlyWage: 2000 },
    ]
    const result = remainingHoursByEmployer(employers, 100_000)
    expect(result.find((r) => r.employer.id === 'a')?.hours).toBe(100)
    expect(result.find((r) => r.employer.id === 'b')?.hours).toBe(50)
  })
})

describe('getRiskLevel', () => {
  it('70%未満は余裕あり', () => {
    expect(getRiskLevel(1_000_000, 1_500_000)).toBe('safe')
  })

  it('70%以上90%未満は注意', () => {
    expect(getRiskLevel(1_200_000, 1_500_000)).toBe('caution')
  })

  it('90%以上100%未満はかなり注意', () => {
    expect(getRiskLevel(1_400_000, 1_500_000)).toBe('high-caution')
  })

  it('ちょうど到達は到達', () => {
    expect(getRiskLevel(1_500_000, 1_500_000)).toBe('reached')
  })

  it('超過は超過', () => {
    expect(getRiskLevel(1_600_000, 1_500_000)).toBe('over')
  })
})

describe('simulateHours / simulationAdditionalTotal', () => {
  it('時給×時間で各勤務先の金額を計算する', () => {
    const employers = [
      { id: EMPLOYER_A_ID, name: '保険会社A', hourlyWage: 1280 },
      { id: EMPLOYER_R_ID, name: '旅行会社R', hourlyWage: 1280 },
    ]
    const result = simulateHours(employers, { [EMPLOYER_A_ID]: 20, [EMPLOYER_R_ID]: 30 })
    expect(result.find((r) => r.employer.id === EMPLOYER_A_ID)?.amount).toBe(25_600)
    expect(result.find((r) => r.employer.id === EMPLOYER_R_ID)?.amount).toBe(38_400)
    expect(simulationAdditionalTotal(result)).toBe(64_000)
  })
})

describe('findConsecutiveRuns / hasConsecutiveWarning', () => {
  it('125,000円以上が連続する月を検出する', () => {
    const months = [
      { id: '2026-01', year: 2026, month: 1, amounts: {}, other: 130_000 },
      { id: '2026-02', year: 2026, month: 2, amounts: {}, other: 130_000 },
      { id: '2026-03', year: 2026, month: 3, amounts: {}, other: 130_000 },
      { id: '2026-04', year: 2026, month: 4, amounts: {}, other: 50_000 },
    ]
    const runs = findConsecutiveRuns(months, 125_000)
    expect(runs).toHaveLength(1)
    expect(runs[0].monthIds).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('3か月連続未満なら警告は出ない', () => {
    const months = [
      { id: '2026-01', year: 2026, month: 1, amounts: {}, other: 130_000 },
      { id: '2026-02', year: 2026, month: 2, amounts: {}, other: 130_000 },
      { id: '2026-03', year: 2026, month: 3, amounts: {}, other: 50_000 },
    ]
    expect(hasConsecutiveWarning(months, 125_000, 3)).toHaveLength(0)
  })

  it('3か月連続で125,000円以上なら警告が出る', () => {
    const months = [
      { id: '2026-01', year: 2026, month: 1, amounts: {}, other: 130_000 },
      { id: '2026-02', year: 2026, month: 2, amounts: {}, other: 130_000 },
      { id: '2026-03', year: 2026, month: 3, amounts: {}, other: 130_000 },
    ]
    expect(hasConsecutiveWarning(months, 125_000, 3)).toHaveLength(1)
  })

  it('月が歴の上で連続していない場合はリセットされる', () => {
    const months = [
      { id: '2026-01', year: 2026, month: 1, amounts: {}, other: 130_000 },
      { id: '2026-03', year: 2026, month: 3, amounts: {}, other: 130_000 },
      { id: '2026-04', year: 2026, month: 4, amounts: {}, other: 130_000 },
    ]
    expect(hasConsecutiveWarning(months, 125_000, 3)).toHaveLength(0)
  })

  it('初期データでは7月が突出していても連続注意月数には達しない', () => {
    const data = createDefaultData()
    // 7月(310,758)・初期データ中で125,000円を超えるのは7月のみ連続しないことを確認
    const runs = hasConsecutiveWarning(data.months, 125_000, 3)
    expect(runs).toHaveLength(0)
  })
})

describe('projectMultiMonthPlan', () => {
  it('計画月を時系列順に累積する', () => {
    const result = projectMultiMonthPlan(1_000_000, [
      { monthId: '2026-11', additionalAmount: 50_000 },
      { monthId: '2026-10', additionalAmount: 30_000 },
      { monthId: '2026-12', additionalAmount: 20_000 },
    ])
    expect(result.map((r) => r.monthId)).toEqual(['2026-10', '2026-11', '2026-12'])
    expect(result.map((r) => r.cumulativeTotal)).toEqual([1_030_000, 1_080_000, 1_100_000])
  })
})

describe('buildCumulativeSeries', () => {
  it('月ごとの累積収入を時系列で返す', () => {
    const data = createDefaultData()
    const series = buildCumulativeSeries(data.months)
    expect(series[0].monthId).toBe('2025-12')
    expect(series[series.length - 1].monthId).toBe('2026-09')
    expect(series[series.length - 1].cumulative).toBe(sumMonths(data.months))
  })
})
