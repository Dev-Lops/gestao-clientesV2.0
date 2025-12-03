'use client'

import { useState } from 'react'

type TabKey = 'resumo' | 'faturas' | 'lancamentos' | 'projecao' | 'fixas'

interface BillingTabsProps {
  initialTab?: TabKey
  onTabChange: (tab: TabKey) => void
}

export function BillingTabs({ initialTab = 'resumo', onTabChange }: BillingTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  const tabs = [
    { key: 'resumo' as const, label: 'Resumo' },
    { key: 'faturas' as const, label: 'Faturas' },
    { key: 'lancamentos' as const, label: 'Lançamentos' },
    { key: 'projecao' as const, label: 'Projeção' },
    { key: 'fixas' as const, label: 'Despesas Fixas' },
  ]

  const handleTabClick = (tabKey: TabKey) => {
    setActiveTab(tabKey)
    onTabChange(tabKey)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => handleTabClick(t.key)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${activeTab === t.key
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
