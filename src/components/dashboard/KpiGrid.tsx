import { cn } from '@/lib/utils'
import React from 'react'

export interface KpiGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
}

/**
 * KpiGrid Component
 * 
 * Responsive grid container for displaying KPI cards
 * 
 * @example
 * ```tsx
 * <KpiGrid columns={4} gap="md">
 *   <KpiCard variant="emerald" icon={DollarSign} value="$45,280" label="Receita do Mês" />
 *   <KpiCard variant="blue" icon={Users} value="24" label="Clientes Ativos" />
 *   <KpiCard variant="purple" icon={TrendingUp} value="12%" label="Crescimento" />
 *   <KpiCard variant="orange" icon={AlertCircle} value="3" label="Atenção" />
 * </KpiGrid>
 * ```
 */
export function KpiGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}
