"use client"

import { useUser } from '@/context/UserContext'
import { useState } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useUser()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((s) => !s)
  const closeSidebar = () => setIsSidebarOpen(false)

  // While loading, render nothing to avoid flicker
  if (loading) return <>{children}</>

  // If user not authenticated, render children only
  if (!user) return <>{children}</>

  // Layout fixo: Sidebar nunca rola, main ocupa todo espaço e rola
  return (
    <div className="w-screen h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      <Navbar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 h-0 pt-16 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto min-h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
