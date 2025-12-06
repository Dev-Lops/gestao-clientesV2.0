'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'card' | 'circle' | 'pill'
  count?: number
  animated?: boolean
}

export function Skeleton({
  className,
  variant = 'line',
  count = 1,
  animated = true,
  ...props
}: SkeletonProps) {
  const variants = {
    line: 'h-4 rounded',
    card: 'h-24 rounded-lg',
    circle: 'h-10 w-10 rounded-full',
    pill: 'h-8 rounded-full',
  }

  const baseClass = cn(
    variants[variant],
    animated && 'animate-pulse',
    'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    className
  )

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={baseClass} {...props} />
        ))}
      </div>
    )
  }

  return <div className={baseClass} {...props} />
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border/50 shadow-lg bg-background p-6 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton variant="circle" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 pb-3 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ columns = 4, count = 4 }: { columns?: number; count?: number }) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border/50 shadow-lg bg-background p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
