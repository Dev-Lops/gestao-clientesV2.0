import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import React from 'react'

export interface MetricCardProps {
  /**
   * Main value to display (e.g., "R$ 45.280")
   */
  value: string | React.ReactNode

  /**
   * Label below value
   */
  label: string

  /**
   * Optional description or subtitle
   */
  description?: string

  /**
   * Icon component to display in the top-right
   */
  icon?: LucideIcon

  /**
   * Color variant for styling
   */
  variant?: 'emerald' | 'blue' | 'purple' | 'orange' | 'red' | 'pink' | 'amber'

  /**
   * Trend indicator - positive or negative
   */
  trend?: 'up' | 'down' | 'neutral'

  /**
   * Trend percentage (e.g., "+12%", "-5%")
   */
  trendValue?: string

  /**
   * Loading state
   */
  isLoading?: boolean

  /**
   * Optional className
   */
  className?: string

  /**
   * Additional actions (e.g., a button)
   */
  actions?: React.ReactNode

  /**
   * Progress value (0-100) - if provided, shows a progress bar
   */
  progress?: number
}

const variantClasses = {
  emerald: {
    bg: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5',
    iconBg: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5',
    iconBg: 'from-blue-500 to-cyan-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5',
    iconBg: 'from-purple-500 to-pink-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5',
    iconBg: 'from-orange-500 to-amber-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'from-red-500/10 to-pink-500/10 dark:from-red-500/5 dark:to-pink-500/5',
    iconBg: 'from-red-500 to-pink-500',
    text: 'text-red-600 dark:text-red-400',
  },
  pink: {
    bg: 'from-pink-500/10 to-rose-500/10 dark:from-pink-500/5 dark:to-rose-500/5',
    iconBg: 'from-pink-500 to-rose-500',
    text: 'text-pink-600 dark:text-pink-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:to-yellow-500/5',
    iconBg: 'from-amber-500 to-yellow-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
}

/**
 * MetricCard Component
 * 
 * Display KPI metrics with optional trends, icons, and progress bars
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   value="R$ 45.280"
 *   label="Receita do Mês"
 *   description="↑ 12% vs mês anterior"
 *   icon={DollarSign}
 *   variant="emerald"
 *   trend="up"
 *   trendValue="+12%"
 * />
 * ```
 */
export function MetricCard({
  value,
  label,
  description,
  icon: Icon,
  variant = 'blue',
  trend,
  trendValue,
  isLoading,
  className,
  actions,
  progress,
}: MetricCardProps) {
  const colors = variantClasses[variant]

  return (
    <Card className={cn('relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow', className)}>
      {/* Gradient background */}
      <div
        className={cn(
          'absolute inset-0 opacity-50 dark:opacity-30',
          `bg-gradient-to-br ${colors.bg}`
        )}
      />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                `bg-gradient-to-br ${colors.iconBg}`
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Value */}
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {value}
              </div>
              {trend && trendValue && (
                <div className={cn('flex items-center gap-1 text-xs font-semibold')}>
                  {trend === 'up' && (
                    <>
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {trendValue}
                      </span>
                    </>
                  )}
                  {trend === 'down' && (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        {trendValue}
                      </span>
                    </>
                  )}
                  {trend === 'neutral' && (
                    <span className="text-muted-foreground">{trendValue}</span>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar (optional) */}
            {progress !== undefined && (
              <div className="mt-3 space-y-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', colors.text)}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {progress.toFixed(0)}%
                </div>
              </div>
            )}

            {/* Actions (optional) */}
            {actions && <div className="mt-2 pt-2 border-t border-border/50">{actions}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
