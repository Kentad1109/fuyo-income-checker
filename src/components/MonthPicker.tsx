export function MonthPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (monthId: string) => void
  label?: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
      {label && <span className="whitespace-nowrap">{label}</span>}
      <input
        type="month"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  )
}
