"use client";
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card';
import { DashboardNotes } from '@/features/dashboard/components/DashboardNotes';
import { MonthlyCalendar } from '@/features/dashboard/components/MonthlyCalendar';
import { AppRole } from '@/lib/permissions';
import { DashboardData } from '@/modules/dashboard/domain/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Calendar, CheckCircle2, Clock, ListTodo, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
interface DashboardClientProps { initialData: DashboardData; initialMonthKey: string; role: AppRole | null }

export function DashboardClient({ initialData, initialMonthKey, role }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [monthKey, setMonthKey] = useState(initialMonthKey)
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Sync state when server data changes (after router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const m = searchParams?.get('month')
    if (m && m !== monthKey) {
      setMonthKey(m)
    }
    // deliberate exclusion of monthKey from deps to avoid cascade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Refetch when month changes (progressively enhance server prefetched data)
  useEffect(() => {
    if (!monthKey || !data) return
    setLoadingMonth(true)
    fetch(`/api/dashboard?month=${encodeURIComponent(monthKey)}`)
      .then(r => r.ok ? r.json() : Promise.reject('Falha ao atualizar mês'))
      .then(j => setData(j))
      .catch(() => {/* ignore */ })
      .finally(() => setLoadingMonth(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  if (!data) {
    return <div className="p-8">Falha ao carregar</div>
  }

  const tasks = data.tasks
  const clients = data.clients
  const metrics = data.metrics
  const totalClients = metrics?.totals.clients ?? clients.length
  const totalTasks = metrics?.totals.tasks ?? tasks.length
  
  // Normalize status checking
  const isPendingStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'TODO' || normalized === 'PENDING'
  }
  const isInProgressStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'IN_PROGRESS' || normalized === 'REVIEW'
  }
  const isDoneStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'DONE' || normalized === 'CANCELLED'
  }
  
  // Count from full metrics instead of limited array samples
  const pendingTasks = tasks.filter(t => isPendingStatus(t.status))
  const inProgressTasks = tasks.filter(t => isInProgressStatus(t.status))
  const completedTasks = tasks.filter(t => isDoneStatus(t.status))
  
  // Calculate totals from metrics when available (more accurate)
  const totalPendingTasks = metrics?.taskAggByClient 
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.pending, 0)
    : pendingTasks.length
  const totalInProgressTasks = metrics?.taskAggByClient 
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.inProgress, 0)
    : inProgressTasks.length
  const totalCompletedTasks = metrics?.taskAggByClient 
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.done, 0)
    : completedTasks.length
  
  const priorities = pendingTasks.slice(0, 6)
  const completedPercent = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0

  return (
    <div className="page-background">
      <div className="page-shell py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

        {/* Header */}
        <motion.div
          className="glass-surface-strong border border-slate-200/80 dark:border-slate-800/70 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-100 dark:ring-indigo-500/30">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Visão Geral
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                  Painel de Gestão
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Olá, {data.user.name || 'Usuário'}! Aqui está um resumo do seu negócio.
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-auto"
            >
              <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                <div className="glass-surface px-4 sm:px-5 py-3 flex items-center gap-3 border border-slate-200/70 dark:border-slate-800/60 shadow-sm">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Hoje</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KpiGrid columns={4} className="card-grid">
            <KpiCard
              variant="blue"
              icon={Users}
              value={totalClients}
              label="Total de Clientes"
              description="Base de clientes"
            />
            <KpiCard
              variant="amber"
              icon={ListTodo}
              value={totalPendingTasks}
              label="Tarefas Pendentes"
              description="Requerem atenção"
            />
            <KpiCard
              variant="indigo"
              icon={Activity}
              value={totalInProgressTasks}
              label="Em Progresso"
              description="Do total de tarefas"
            />
            <KpiCard
              variant="emerald"
              icon={CheckCircle2}
              value={totalCompletedTasks}
              label="Concluídas"
              description={`${completedPercent}% taxa de conclusão`}
              progress={completedPercent}
            />
          </KpiGrid>
        </motion.section>




        {/* Grid: Calendário + Notas */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Calendário (2/3) */}
          <div className="lg:col-span-2">
            {data.activities && (
              <Card variant="elevated" hover className="h-full border border-slate-200/80 dark:border-slate-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-500/30">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Calendário de Atividades</CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhe entregas e compromissos do mês</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <MonthlyCalendar
                    key={monthKey}
                    activities={data.activities.map(a => ({
                      ...a,
                      description: a.description === null ? undefined : a.description,
                    })) as typeof data.activities}
                    initialMonth={(() => {
                      const [y, m] = monthKey.split('-').map(Number);
                      return new Date(y, (m || 1) - 1, 1)
                    })()}
                    onMonthChange={(d) => {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const value = `${d.getFullYear()}-${mm}`;
                      setMonthKey(value);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('month', value);
                        window.history.replaceState(null, '', url.toString());
                      } catch { }
                    }}
                    userRole={role}
                  />
                  {loadingMonth && (
                    <p className="text-xs mt-2 text-slate-600 dark:text-slate-400 animate-pulse">
                      Atualizando mês...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notas Rápidas (1/3) */}
          <div className="lg:col-span-1">
            <DashboardNotes
              initialNotes={(data.notes || []).map((note) => {
                const n = note as unknown as { title?: string; color?: string; position?: number }
                return {
                  id: note.id,
                  title: n.title ?? "",
                  content: note.content,
                  color: n.color ?? "yellow",
                  position: n.position ?? 0,
                  createdAt: note.createdAt,
                  updatedAt: note.updatedAt || note.createdAt,
                }
              })}
            />
          </div>
        </motion.div>

        {/* Grid: Métricas + Tarefas */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Métricas (2/3) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Métricas Detalhadas */}
            {metrics && (
              <Card variant="elevated" hover className="border border-slate-200/80 dark:border-slate-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 ring-1 ring-purple-100 dark:ring-purple-500/30">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Métricas do Negócio</CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Insights automáticos sobre clientes e tarefas</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {metrics.mostPendingClient && (
                    <div className="p-3 sm:p-4 rounded-xl glass-surface border border-amber-200/70 dark:border-amber-800/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Mais Tarefas Pendentes</h4>
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {metrics.mostPendingClient.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {metrics.mostPendingClient.pending} tarefas aguardando
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-100 dark:ring-amber-500/30">
                          <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {metrics.mostUrgentClient && (
                    <div className="p-3 sm:p-4 rounded-xl glass-surface border border-red-200/70 dark:border-red-800/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Mais Tarefas Urgentes</h4>
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {metrics.mostUrgentClient.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {metrics.mostUrgentClient.urgent} tarefas urgentes
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-1 ring-rose-100 dark:ring-rose-500/30">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 rounded-xl glass-surface border border-blue-200/70 dark:border-blue-800/60">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-300">
                          {metrics.totals.clients}
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider">
                          Clientes
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-xl glass-surface border border-purple-200/70 dark:border-purple-800/60">
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300">
                          {metrics.totals.tasks}
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider">
                          Tarefas
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-4 sm:space-y-6">

            {/* Tarefas Mais Urgentes */}
            {metrics && metrics.urgentTasks.length > 0 && (
              <Card variant="elevated" hover className="border border-red-200/70 dark:border-red-800/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 ring-1 ring-red-100 dark:ring-red-500/30">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Tarefas Mais Urgentes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.urgentTasks.slice(0, 4).map(t => (
                      <Link
                        key={t.id}
                        href={`/clients/${t.client.id}/tasks`}
                        className="block p-2.5 sm:p-3 rounded-lg glass-surface border border-red-200/70 dark:border-red-800/60 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 hover:-translate-y-0.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              <h4 className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                                {t.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                              {t.client.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Score: {t.urgencyScore.toFixed(0)}</span>
                              {t.dueDate && (
                                <span>• {new Date(t.dueDate).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold uppercase shrink-0">
                            {t.priority}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {metrics.urgentTasks.length > 4 && (
                    <Link
                      href="/clients"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      Ver todas as tarefas urgentes
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tarefas Prioritárias */}
            {priorities.length > 0 && (
              <Card variant="elevated" hover className="border border-amber-200/70 dark:border-amber-800/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-100 dark:ring-amber-500/30">
                      <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Tarefas Prioritárias</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {priorities.slice(0, 6).map(task => (
                      <Link
                        key={task.id}
                        href={`/clients/${task.client.id}/tasks`}
                        className="block p-2.5 sm:p-3 rounded-lg glass-surface border border-amber-200/70 dark:border-amber-800/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 hover:-translate-y-0.5 group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                            {task.title}
                          </h4>
                          <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase shrink-0">
                            {task.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {task.client.name}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  )
}