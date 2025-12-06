'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  type: 'income' | 'expense' | 'profit' | 'receivable'
  icon: React.ReactNode
  delay?: number
}

const colorSchemes = {
  income: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    bg: 'from-emerald-50/80 via-green-50/60 to-teal-50/80 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40',
    iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    valueText: 'text-emerald-900 dark:text-emerald-100',
    border: 'border-emerald-200/50 dark:border-emerald-800/50',
  },
  expense: {
    gradient: 'from-rose-500 via-red-500 to-pink-500',
    bg: 'from-rose-50/80 via-red-50/60 to-pink-50/80 dark:from-rose-950/40 dark:via-red-950/30 dark:to-pink-950/40',
    iconBg: 'bg-rose-500/20 dark:bg-rose-500/30',
    text: 'text-rose-700 dark:text-rose-400',
    valueText: 'text-rose-900 dark:text-rose-100',
    border: 'border-rose-200/50 dark:border-rose-800/50',
  },
  profit: {
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    bg: 'from-blue-50/80 via-indigo-50/60 to-violet-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/40',
    iconBg: 'bg-blue-500/20 dark:bg-blue-500/30',
    text: 'text-blue-700 dark:text-blue-400',
    valueText: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-200/50 dark:border-blue-800/50',
  },
  receivable: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    bg: 'from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40',
    iconBg: 'bg-amber-500/20 dark:bg-amber-500/30',
    text: 'text-amber-700 dark:text-amber-400',
    valueText: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-200/50 dark:border-amber-800/50',
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  type,
  icon,
  delay = 0,
}: MetricCardProps) {
  const scheme = colorSchemes[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        size="md"
        className={`relative overflow-hidden border-2 ${scheme.border} bg-gradient-to-br ${scheme.bg} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        {/* Gradient Accent */}
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${scheme.gradient}`}
        />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>

        <CardContent className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className={`text-sm font-semibold uppercase tracking-wider ${scheme.text} mb-1`}
              >
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={`p-3 rounded-xl ${scheme.iconBg} group-hover:scale-110 transition-transform duration-300`}
            >
              <div className={scheme.text}>{icon}</div>
            </div>
          </div>

          <div className="space-y-2">
            <p
              className={`text-2xl font-extrabold tracking-tight ${scheme.valueText}`}
            >
              {formatCurrency(value)}
            </p>

            {trend && (
              <div
                className={`flex items-center gap-1.5 text-sm font-medium ${trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>
                  {trend.isPositive ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
            )}
          </div>

          {/* Shine Effect on Hover (non-interactive) */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Grid pattern for background
const gridPatternStyle = `
  .bg-grid-pattern {
    background-image: linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = gridPatternStyle
  document.head.appendChild(styleSheet)
}
