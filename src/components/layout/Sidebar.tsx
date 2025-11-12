'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Home,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
  submenu?: {
    label: string
    href: string
  }[]
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['clients'])

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      href: '/',
    },
    {
      label: 'Clientes',
      icon: <Users className="w-5 h-5" />,
      href: '/clients',
      submenu: [
        { label: 'Todos os Clientes', href: '/clients' },
        { label: 'Adicionar Cliente', href: '/clients/new' },
        { label: 'Gargalos', href: '/clients?filter=bottlenecks' },
      ],
    },
    {
      label: 'Financeiro',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/finance',
      submenu: [
        { label: 'Visão Geral', href: '/finance' },
        { label: 'Receitas', href: '/finance?type=income' },
        { label: 'Despesas', href: '/finance?type=expense' },
      ],
    },
    {
      label: 'Relatórios',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/reports',
      submenu: [
        { label: 'Dashboard Geral', href: '/reports' },
        { label: 'Por Cliente', href: '/reports/clients' },
        { label: 'Financeiro', href: '/reports/finance' },
      ],
    },
    {
      label: 'Admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin',
      badge: 'OWNER',
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
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden',
          'lg:translate-x-0 lg:static lg:shadow-none'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.label}>
                {/* Main Menu Item */}
                {item.submenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
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
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-medium">
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
                      'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
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
                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {item.submenu && expandedMenus.includes(item.label) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 ml-6 space-y-1"
                  >
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        onClick={() => onClose()}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          pathname === subitem.href
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                        )}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-medium text-slate-900 dark:text-white mb-1">
                💡 Dica do dia
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Use atalhos de teclado para navegar mais rápido!
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
