import { Skeleton } from "./skeleton";

/**
 * BrandingSkeleton - Loading state para BrandingManager/BrandingStudio
 */
export function BrandingSkeleton() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      <div className="relative space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>

        {/* Grid de categorias */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl p-6 shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-6 w-40 rounded-lg" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ChartSkeleton - Loading state para gráficos financeiros
 */
export function ChartSkeleton() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl p-8 shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * InstagramGridSkeleton - Loading state para grade do Instagram
 */
export function InstagramGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl overflow-hidden shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50"
          >
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * FinanceManagerSkeleton - Loading state para gerenciador financeiro
 */
export function FinanceManagerSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/20 bg-white/50 backdrop-blur-xl p-6 shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl p-6 shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50">
            <Skeleton className="h-6 w-40 rounded-lg mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-3 w-2/3 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
