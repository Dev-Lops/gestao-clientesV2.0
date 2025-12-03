'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BillingTabs } from './BillingTabs'

export type TabKey = 'resumo' | 'faturas' | 'lancamentos' | 'projecao' | 'fixas'

interface BillingContentProps {
  initialTab?: TabKey
}

export function BillingContent({ initialTab = 'resumo' }: BillingContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize from URL or prop
  const urlTab = searchParams.get('tab') as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab || initialTab)

  // Sync with URL changes (e.g., from pagination)
  useEffect(() => {
    // Only sync if we're on the billing page
    if (!pathname.includes('/billing')) return

    const urlTab = searchParams.get('tab') as TabKey | null
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, activeTab, pathname])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    // Only update URL if we're on the billing page
    if (!pathname.includes('/billing')) return

    // Update URL to preserve tab across page reloads
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <BillingTabs initialTab={activeTab} onTabChange={handleTabChange} />
      <div data-active-tab={activeTab} className="hidden" />
    </>
  )
}
