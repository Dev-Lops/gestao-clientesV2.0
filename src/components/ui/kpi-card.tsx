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
    card: 'border-emerald-200/70 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/80 to-green-50/70 dark:from-emerald-950/40 dark:to-green-950/30 shadow-[0_12px_30px_rgba(16,185,129,0.12)]',
    icon: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-200',
    progress: 'bg-emerald-500',
  },
  blue: {
    card: 'border-blue-200/70 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/30 shadow-[0_12px_30px_rgba(59,130,246,0.12)]',
    icon: 'bg-blue-100/80 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-300',
    value: 'text-blue-700 dark:text-blue-200',
    progress: 'bg-blue-500',
  },
  purple: {
    card: 'border-purple-200/70 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/80 to-pink-50/70 dark:from-purple-950/40 dark:to-pink-950/30 shadow-[0_12px_30px_rgba(139,92,246,0.12)]',
    icon: 'bg-purple-100/80 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-200',
    value: 'text-purple-700 dark:text-purple-200',
    progress: 'bg-purple-500',
  },
  amber: {
    card: 'border-amber-200/70 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/85 to-orange-50/75 dark:from-amber-950/40 dark:to-orange-950/30 shadow-[0_12px_30px_rgba(245,158,11,0.12)]',
    icon: 'bg-amber-100/80 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-200',
    value: 'text-amber-700 dark:text-amber-100',
    progress: 'bg-amber-500',
  },
  red: {
    card: 'border-red-200/70 dark:border-red-800/60 bg-gradient-to-br from-red-50/85 to-rose-50/75 dark:from-red-950/40 dark:to-rose-950/30 shadow-[0_12px_30px_rgba(239,68,68,0.12)]',
    icon: 'bg-red-100/80 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-200',
    value: 'text-red-700 dark:text-red-200',
    progress: 'bg-red-500',
  },
  indigo: {
    card: 'border-indigo-200/70 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/85 to-blue-50/75 dark:from-indigo-950/40 dark:to-blue-950/30 shadow-[0_12px_30px_rgba(79,70,229,0.12)]',
    icon: 'bg-indigo-100/80 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-200',
    value: 'text-indigo-700 dark:text-indigo-200',
    progress: 'bg-indigo-500',
  },
  pink: {
    card: 'border-pink-200/70 dark:border-pink-800/60 bg-gradient-to-br from-pink-50/85 to-rose-50/75 dark:from-pink-950/40 dark:to-rose-950/30 shadow-[0_12px_30px_rgba(236,72,153,0.12)]',
    icon: 'bg-pink-100/80 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-200',
    value: 'text-pink-700 dark:text-pink-200',
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
          'group relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 h-full min-h-[180px] sm:min-h-[190px] flex flex-col justify-between backdrop-blur',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:via-white/10 before:to-transparent before:pointer-events-none',
          'after:absolute after:inset-x-6 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent dark:after:via-white/10',
          styles.card,
          interactive && 'hover:shadow-xl hover:-translate-y-0.5 cursor-default',
          className
        )}
        {...props}
      >
        {/* Header com ícone e valor */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div
            className={cn(
              'p-2.5 rounded-xl transition-transform shadow-sm',
              styles.icon,
              interactive && 'group-hover:scale-110'
            )}
          >
            <Icon className={cn('h-5 w-5', styles.iconColor)} />
          </div>
          <span className={cn('text-3xl font-black tracking-tight', styles.value)}>
            {value}
          </span>
        </div>

        {/* Label e descrição */}
        <div className="space-y-1 relative z-10">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </p>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {description}
            </p>
          )}
        </div>

        {/* Progress bar opcional */}
        {typeof progress === 'number' && (
          <div className="mt-4 relative z-10">
            <div className="h-2 w-full bg-white/60 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500 shadow-sm', styles.progress)}
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
