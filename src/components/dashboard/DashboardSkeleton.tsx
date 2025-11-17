'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-12 mt-2" />
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Skeleton className="h-[400px] w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </Card>
      </div>

      {/* Chart Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    </div>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-3 w-12 mt-2" />
        </Card>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return <Skeleton className="h-[400px] w-full" />;
}

export function ClientsHealthSkeleton() {
  return <Skeleton className="h-[400px] w-full" />;
}

export function ChartSkeleton() {
  return (
    <div>
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
