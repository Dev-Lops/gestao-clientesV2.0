'use client'

import { BibleVerseWidget } from '@/features/verses/BibleVerseWidget'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  Settings,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  badgeColor?: 'purple' | 'red' | 'blue' | 'green'
  submenu?: {
    label: string
    href: string
    badge?: number
  }[]
}

interface SidebarStats {
  role: string
  counters: {
    clients: {
      total: number
      active: number
      withBottlenecks: number
    }
    tasks: {
      total: number
      pending: number
      overdue: number
    }
    finance: {
      revenue: number
      expenses: number
      balance: number
      overdueInstallments: number
    }
    meetings: {
      upcoming: number
    }
  }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['clients'])
  const [stats, setStats] = useState<SidebarStats | null>(null)

  // Buscar estatísticas do sidebar
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/sidebar-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Erro ao buscar stats do sidebar:', error)
      }
    }

    fetchStats()
  }, [])

  // Helper para classes de badge dinâmicas
  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
      case 'purple':
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    }
  }

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Clientes',
      icon: <Users className="w-5 h-5" />,
      href: '/clients',
      badge: stats?.counters.clients.total,
      badgeColor: 'blue',
      submenu: [
        { label: 'Todos os Clientes', href: '/clients', badge: stats?.counters.clients.total },
        { label: 'Adicionar Cliente', href: '/clients/new' },
        { label: 'Gargalos', href: '/clients?filter=bottlenecks', badge: stats?.counters.clients.withBottlenecks },
      ],
    },
    {
      label: 'Financeiro',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/finance',
      badge: stats?.counters.finance.overdueInstallments,
      badgeColor: stats?.counters.finance.overdueInstallments ? 'red' : undefined,
    },
    {
      label: 'Admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin',
      badge: stats?.role === 'OWNER' ? 'OWNER' : undefined,
      badgeColor: 'purple',
    },
    {
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
      href: '/settings',
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden transform transition-transform h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:shadow-none'
        )}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Sidebar Content - compacta, sem rolagem interna */}
          <div className="flex-1 p-2 space-y-1 overflow-visible">
            {menuItems.map((item) => (
              <div key={item.label}>
                {/* Main Menu Item */}
                {item.submenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-all duration-200 text-sm',
                      isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadgeClass(item.badgeColor)}`}>
                          {item.badge}
                        </span>
                      )}
                      {expandedMenus.includes(item.label) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      'flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-all duration-200 text-sm',
                      isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadgeClass(item.badgeColor)}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {item.submenu && expandedMenus.includes(item.label) && (
                  <div className="mt-0.5 ml-4 space-y-0.5">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        onClick={() => onClose()}
                        className={cn(
                          'block px-2 py-1 rounded-lg text-xs transition-colors',
                          pathname === subitem.href
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                        )}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800">
            <BibleVerseWidget compact />
          </div>
        </div>
      </aside>
    </>
  )
}
