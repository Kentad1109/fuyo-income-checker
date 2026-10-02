import { parseMonthId } from './calculations'

export function formatMonthLabel(monthId: string): string {
  const { year, month } = parseMonthId(monthId)
  return `${year}年${month}月`
}

export function formatMonthLabelShort(monthId: string): string {
  const { month } = parseMonthId(monthId)
  return `${month}月`
}
