'use client'

import { AdminLink } from '@/components/AdminLink'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUser } from '@/context/UserContext'
import { ClientsWithBottlenecks, type ClientHealthMetrics } from '@/features/clients/components'
import { ActivitiesCalendar } from '@/features/dashboard/components/ActivitiesCalendar'

import { motion } from 'framer-motion'
import { Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardData {
  clients: Array<{
    id: string
    name: string
    email: string | null
    createdAt: Date
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    description: string | null
    createdAt: Date
    priority: string
    dueDate: Date | null
    client: {
      id: string
      name: string
    }
  }>
  user: {
    id: string
    name: string | null
    email: string
  }
  metrics?: {
    totals: { clients: number; tasks: number }
    mostPendingClient: { clientId: string; pending: number; name: string } | null
    mostUrgentClient: { clientId: string; urgent: number; name: string } | null
    urgentTasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: Date | null
      urgencyScore: number
      client: { id: string; name: string }
    }>
  }
  clientsHealth?: ClientHealthMetrics[]
  activities?: Array<{
    id: string
    title: string
    type: 'meeting' | 'task'
    date: Date
    clientId: string
    clientName: string
    status?: string
  }>
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <RealtimeDashboard />
    </ProtectedRoute>
  )
}

function RealtimeDashboard() {
  const { logout } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          throw new Error('Falha ao carregar dashboard')
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Error handled silently
    }
  }

  if (loading) {
    return (
      <div className="relative flex h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full border-4 border-t-transparent border-blue-600 animate-spin" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-medium mb-4">{error || 'Erro desconhecido'}</p>
        <Button onClick={() => router.push('/login')}>Voltar ao login</Button>
      </div>
    )
  }

  const { clients, tasks } = data

  // Cálculos derivados com fix status
  const isPendingStatus = (s: string) => s === 'pending' || s === 'todo'
  const isInProgressStatus = (s: string) => s === 'in_progress' || s === 'in-progress'
  const isDoneStatus = (s: string) => s === 'done' || s === 'completed'

  const pendingTasks = tasks.filter((t) => isPendingStatus(t.status))
  const inProgressTasks = tasks.filter((t) => isInProgressStatus(t.status))
  const completedTasks = tasks.filter((t) => isDoneStatus(t.status))
  const priorities = pendingTasks.slice(0, 6)

  const metrics = data.metrics

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        className="relative space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* HEADER COMPACTO */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
              <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Painel de Gestão
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {data.user.name || data.user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminLink />
            <Link href="/finance">
              <Button size="sm" variant="outline" className="backdrop-blur-sm bg-white/80">
                💰
              </Button>
            </Link>
            <Link href="/clients">
              <Button size="sm" className="bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Clientes</span>
              </Button>
            </Link>
            <Button size="sm" onClick={handleLogout} variant="ghost">
              Sair
            </Button>
          </div>
        </header>

        {/* KPIs COMPACTOS */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="👥"
            label="Clientes"
            value={clients.length}
            iconBg="from-blue-500 to-blue-600"
            textColor="text-blue-700 dark:text-blue-400"
          />
          <KpiCard
            icon="📋"
            label="Pendentes"
            value={pendingTasks.length}
            iconBg="from-amber-500 to-orange-600"
            textColor="text-amber-700 dark:text-amber-400"
          />
          <KpiCard
            icon="🔄"
            label="Em progresso"
            value={inProgressTasks.length}
            iconBg="from-purple-500 to-purple-600"
            textColor="text-purple-700 dark:text-purple-400"
          />
          <KpiCard
            icon="✅"
            label="Concluídas"
            value={completedTasks.length}
            iconBg="from-emerald-500 to-emerald-600"
            textColor="text-emerald-700 dark:text-emerald-400"
          />
        </section>

        {/* Layout em 2 colunas para desktop */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Coluna 1 - Clientes com Gargalos */}
          {data.clientsHealth && data.clientsHealth.length > 0 && (
            <ClientsWithBottlenecks clients={data.clientsHealth} maxDisplay={3} />
          )}

          {/* Coluna 2 - Calendário */}
          {data.activities && data.activities.length > 0 && (
            <ActivitiesCalendar activities={data.activities} />
          )}
        </div>

        {/* Tarefas Pendentes */}
        {priorities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Tarefas Pendentes
              </h2>
              <Link href="/clients" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">
                ver tudo →
              </Link>
            </div>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {priorities.map((task) => (
                <Card
                  key={task.id}
                  className="p-3 sm:p-4 border-l-4 border-amber-400 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{task.title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-1">
                        {task.client.name}
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase font-medium whitespace-nowrap">
                      {task.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Tarefas Urgentes (se houver) */}
        {metrics && metrics.urgentTasks.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
              Tarefas Urgentes
            </h2>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.urgentTasks.slice(0, 6).map((t) => (
                <Card key={t.id} className="p-3 sm:p-4 border-l-4 border-red-500 bg-red-50/50 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-1">{t.client.name}</p>
                      <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        Score: {t.urgencyScore.toFixed(0)}
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase font-medium whitespace-nowrap">{t.priority}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  iconBg,
  textColor,
}: {
  icon: string
  label: string
  value: number
  iconBg: string
  textColor: string
}) {
  return (
    <Card className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-md transition-all duration-200 group">
      <div className="p-4 space-y-2">
        <div className={`inline-flex w-10 h-10 rounded-lg bg-linear-to-tr ${iconBg} items-center justify-center text-xl shadow group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
        <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r ${iconBg} opacity-50`} />
    </Card>
  )
}