export type TabKey = 'home' | 'months' | 'simulation' | 'chart' | 'settings'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: 'ホーム', icon: '🏠' },
  { key: 'months', label: '月別', icon: '🗒️' },
  { key: 'simulation', label: 'シミュレーション', icon: '🧮' },
  { key: 'chart', label: 'グラフ', icon: '📊' },
  { key: 'settings', label: '設定', icon: '⚙️' },
]

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-md justify-between px-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              active === tab.key
                ? 'text-neutral-900 dark:text-neutral-50'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
