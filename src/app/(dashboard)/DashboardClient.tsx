"use client";
import { KPICard } from '@/components/common/KPICard';
import { GradientPageHeader } from '@/components/layout/GradientPageHeader';
import { Card } from '@/components/ui/card';
import { MonthlyCalendar } from '@/features/dashboard/components/MonthlyCalendar';
import { AppRole } from '@/lib/permissions';
import { DashboardData } from '@/modules/dashboard/domain/schema';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, ListTodo, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardClientProps { initialData: DashboardData; initialMonthKey: string; role: AppRole | null }

export function DashboardClient({ initialData, initialMonthKey }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [monthKey, setMonthKey] = useState(initialMonthKey)
  const [loadingMonth, setLoadingMonth] = useState(false)

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
  }, [monthKey, data])

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

  return (
    <motion.div className="space-y-10 p-6 sm:p-10 lg:p-16 bg-linear-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 min-h-screen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <GradientPageHeader
        icon={TrendingUp}
        title="Painel de Gestão"
        subtitle={`Olá, ${data.user.name || 'Usuário'}! Aqui está um resumo do seu negócio`}
        gradient="primary"
        actions={(
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <div className="px-6 py-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-md">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </motion.div>
        )}
      />

      <section className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <KPICard
            icon={Users}
            label="Total de Clientes"
            value={clients.length}
            description="Base de clientes"
            variant="info"
            className="rounded-2xl shadow-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 min-h-[200px]"
            labelClassName="text-xl font-extrabold mb-2 text-slate-800 dark:text-slate-100"
            valueClassName="text-3xl font-extrabold mb-1 text-primary"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <KPICard
            icon={ListTodo}
            label="Tarefas Pendentes"
            value={pendingTasks.length}
            description="Requerem atenção"
            variant="warning"
            className="rounded-2xl shadow-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 min-h-[200px]"
            labelClassName=" font-extrabold mb-2 text-amber-700 dark:text-amber-300"
            valueClassName="text-3xl font-extrabold mb-1 text-amber-700 dark:text-amber-300"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <KPICard
            icon={Activity}
            label="Em Progresso"
            value={inProgressTasks.length}
            description="Do total de tarefas"
            variant="neutral"
            className="rounded-2xl shadow-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 min-h-[200px]"
            labelClassName="text-xl font-extrabold mb-2 text-blue-700 dark:text-blue-300"
            valueClassName="text-3xl font-extrabold mb-1 text-blue-700 dark:text-blue-300"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <KPICard
            icon={CheckCircle2}
            label="Concluídas"
            value={completedTasks.length}
            description="Taxa de conclusão"
            variant="success"
            className="rounded-2xl shadow-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 min-h-[200px]"
            labelClassName="text-xl font-extrabold mb-2 text-emerald-700 dark:text-emerald-300"
            valueClassName="text-3xl font-extrabold mb-1 text-emerald-700 dark:text-emerald-300"
          />
        </motion.div>
      </section>



      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-10">
          {data.activities && (
            <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900">
              <div className="p-6">
                <MonthlyCalendar key={monthKey} activities={data.activities} initialMonth={(() => { const [y, m] = monthKey.split('-').map(Number); return new Date(y, (m || 1) - 1, 1) })()} onMonthChange={(d) => { const mm = String(d.getMonth() + 1).padStart(2, '0'); const value = `${d.getFullYear()}-${mm}`; setMonthKey(value); try { const url = new URL(window.location.href); url.searchParams.set('month', value); window.history.replaceState(null, '', url.toString()); } catch { } }} />
                {loadingMonth && <p className="text-xs mt-2 text-muted-foreground">Atualizando mês...</p>}
              </div>
            </Card>
          )}

          {metrics && (
            <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900">
              <div className="p-6 space-y-6">
                {metrics.mostPendingClient && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <h4 className="text-xs font-bold mb-1">Mais Tarefas Pendentes</h4>
                    <p className="text-base font-semibold">{metrics.mostPendingClient.name}</p>
                    <p className="text-xs text-slate-600">{metrics.mostPendingClient.pending} tarefas</p>
                  </div>
                )}
                {metrics.mostUrgentClient && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <h4 className="text-xs font-bold mb-1">Mais Tarefas Urgentes</h4>
                    <p className="text-base font-semibold">{metrics.mostUrgentClient.name}</p>
                    <p className="text-xs text-slate-600">{metrics.mostUrgentClient.urgent} urgentes</p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{metrics.totals.clients}</p>
                    <p className="text-xs text-slate-600">Clientes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20">
                    <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{metrics.totals.tasks}</p>
                    <p className="text-xs text-slate-600">Tarefas</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-10">
          {/* {(role ? can(role, 'update', 'finance') : false) && data.clientsHealth && data.clientsHealth.length > 0 && (
            <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900">
              <div className="p-6">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 mb-4">
                  <button className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showOnlyIssues ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`} onClick={() => setShowOnlyIssues(true)}>Problemas</button>
                  <button className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!showOnlyIssues ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`} onClick={() => setShowOnlyIssues(false)}>Todos</button>
                </div>
                <ClientsWithBottlenecks clients={data.clientsHealth as ClientHealthMetrics[]} maxDisplay={3} showOnlyIssues={showOnlyIssues} canViewAmounts={true} />
              </div>
            </Card>
          )} */}
          {metrics && metrics.urgentTasks.length > 0 && (
            <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Tarefas Mais Urgentes</h3>
                {metrics.urgentTasks.slice(0, 4).map(t => (
                  <Link key={t.id} href={`/clients/${t.client.id}/tasks`} className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-all bg-white dark:bg-slate-800 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-5 w-5 text-red-500" />
                          <h4 className="font-semibold text-base truncate">{t.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{t.client.name}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Score: {t.urgencyScore.toFixed(0)}</span>
                          {t.dueDate && <span>{new Date(t.dueDate).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold uppercase">{t.priority}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
          {priorities.length > 0 && (
            <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg bg-white dark:bg-slate-900" aria-label="Tarefas Prioritárias" role="region">
              <div className="p-6">
                <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4" id="priorities-title">Tarefas Prioritárias</h3>
                <div className="grid gap-4 sm:grid-cols-2" aria-labelledby="priorities-title">
                  {priorities.slice(0, 6).map(task => (
                    <Link
                      key={task.id}
                      href={`/clients/${task.client.id}/tasks`}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all bg-white dark:bg-slate-800 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-label={`Tarefa: ${task.title}, Cliente: ${task.client.name}, Status: ${task.status}${task.dueDate ? ', Vencimento: ' + new Date(task.dueDate).toLocaleDateString('pt-BR') : ''}`}
                      role="link"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-base truncate">{task.title}</h4>
                        <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase">{task.status}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{task.client.name}</p>
                      {task.dueDate && <p className="text-xs text-slate-500 mt-2">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </motion.div>
  )
}

// StatCard replaced by KPICard for standardized visuals
