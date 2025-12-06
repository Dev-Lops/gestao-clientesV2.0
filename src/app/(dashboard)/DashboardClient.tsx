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
  const isPendingStatus = (s: string) => s === 'pending' || s === 'todo'
  const isInProgressStatus = (s: string) => s === 'in_progress' || s === 'in-progress'
  const isDoneStatus = (s: string) => s === 'done' || s === 'completed'
  const pendingTasks = tasks.filter(t => isPendingStatus(t.status))
  const inProgressTasks = tasks.filter(t => isInProgressStatus(t.status))
  const completedTasks = tasks.filter(t => isDoneStatus(t.status))
  const priorities = pendingTasks.slice(0, 6)
  const metrics = data.metrics
  const totalClients = metrics?.totals.clients ?? clients.length
  const totalTasks = metrics?.totals.tasks ?? tasks.length
  const completedPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  return (
    <div className="page-background">
      <div className="page-shell py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-1 sm:mb-2">
              Painel de Gestão
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Olá, {data.user.name || 'Usuário'}! Aqui está um resumo do seu negócio
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full sm:w-auto"
          >
            <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-linear-to-br from-white to-white/90 dark:from-slate-800 dark:to-slate-900 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KpiGrid columns={4}>
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
              value={pendingTasks.length}
              label="Tarefas Pendentes"
              description="Requerem atenção"
            />
            <KpiCard
              variant="indigo"
              icon={Activity}
              value={inProgressTasks.length}
              label="Em Progresso"
              description="Do total de tarefas"
            />
            <KpiCard
              variant="emerald"
              icon={CheckCircle2}
              value={completedTasks.length}
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
              <Card variant="default" hover className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-2xl h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Calendário de Atividades</CardTitle>
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
              <Card variant="default" hover className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Métricas do Negócio</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {metrics.mostPendingClient && (
                    <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 hover:scale-105 transition-all duration-200">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                            Mais Tarefas Pendentes
                          </h4>
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {metrics.mostPendingClient.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {metrics.mostPendingClient.pending} tarefas aguardando
                          </p>
                        </div>
                        <div className="p-2 bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                          <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {metrics.mostUrgentClient && (
                    <div className="p-3 sm:p-4 rounded-xl bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-2 border-red-200 dark:border-red-800 hover:scale-105 transition-all duration-200">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">
                            Mais Tarefas Urgentes
                          </h4>
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {metrics.mostUrgentClient.name}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {metrics.mostUrgentClient.urgent} tarefas urgentes
                          </p>
                        </div>
                        <div className="p-2 bg-linear-to-br from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {metrics.totals.clients}
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider">
                          Clientes
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-xl bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
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
              <Card variant="default" hover className="border-2 border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
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
                        className="block p-2 sm:p-3 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 hover:scale-105 group"
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
              <Card variant="default" hover className="border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg shadow-lg hover:scale-110 transition-transform duration-200">
                      <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
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
                        className="block p-2 sm:p-3 rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-200 hover:scale-105 group"
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