import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLoading() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      <div className="relative space-y-8 p-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/50 pb-2 dark:border-slate-700/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
          ))}
        </div>

        {/* Content skeleton - Grid modernizado */}
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
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Large content area skeleton */}
        <div className="rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl p-8 shadow-lg dark:border-slate-800/50 dark:bg-slate-900/50">
          <Skeleton className="h-6 w-48 rounded-lg mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
