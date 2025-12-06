import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import * as React from "react";

/**
 * KPI Card Component - Design System MyGest
 * Componente de KPI sofisticado com gradientes e animações
 * Baseado no design da página de info do cliente
 */

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante de cor do card
   */
  variant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'indigo' | 'pink';

  /**
   * Valor principal do KPI
   */
  value: string | number;

  /**
   * Label/título do KPI
   */
  label: string;

  /**
   * Descrição adicional ou subtítulo
   */
  description?: string;

  /**
   * Ícone do Lucide React
   */
  icon: LucideIcon;

  /**
   * Mostrar animação de hover e scale
   */
  interactive?: boolean;

  /**
   * Progress bar (0-100)
   */
  progress?: number;
}

const variantStyles = {
  emerald: {
    card: 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  blue: {
    card: 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
    progress: 'bg-blue-500',
  },
  purple: {
    card: 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
    progress: 'bg-purple-500',
  },
  amber: {
    card: 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30',
    icon: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  red: {
    card: 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/30',
    icon: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    progress: 'bg-red-500',
  },
  indigo: {
    card: 'border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/30',
    icon: 'bg-indigo-100 dark:bg-indigo-900/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400',
    progress: 'bg-indigo-500',
  },
  pink: {
    card: 'border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/30',
    icon: 'bg-pink-100 dark:bg-pink-900/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
    value: 'text-pink-600 dark:text-pink-400',
    progress: 'bg-pink-500',
  },
} as const;

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({
    className,
    variant = 'blue',
    value,
    label,
    description,
    icon: Icon,
    interactive = true,
    progress,
    ...props
  }, ref) => {
    const styles = variantStyles[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'group rounded-2xl border-2 p-6 sm:p-7 transition-all duration-200 h-full min-h-[180px] sm:min-h-[190px] flex flex-col justify-between backdrop-blur-sm',
          styles.card,
          interactive && 'hover:shadow-xl hover:scale-105 cursor-default',
          className
        )}
        {...props}
      >
        {/* Header com ícone e valor */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-2.5 rounded-xl transition-transform',
              styles.icon,
              interactive && 'group-hover:scale-110'
            )}
          >
            <Icon className={cn('h-5 w-5', styles.iconColor)} />
          </div>
          <span className={cn('text-3xl font-bold', styles.value)}>
            {value}
          </span>
        </div>

        {/* Label e descrição */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </p>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* Progress bar opcional */}
        {typeof progress === 'number' && (
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', styles.progress)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

KpiCard.displayName = "KpiCard";

/**
 * Grid de KPIs responsivo
 */
export interface KpiGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const KpiGrid = React.forwardRef<HTMLDivElement, KpiGridProps>(
  ({ className, columns = 4, children, ...props }, ref) => {
    const gridCols = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
      <div
        ref={ref}
        className={cn('grid gap-4 md:gap-5 auto-rows-[minmax(0,1fr)]', gridCols[columns], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

KpiGrid.displayName = "KpiGrid";
