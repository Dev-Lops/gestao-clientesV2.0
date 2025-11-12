import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientHealthMetrics } from '@/features/clients/components'
import { ClientHealthCardWrapper } from '@/features/clients/components/ClientHealthCardWrapper'
import { ClientInfoDisplay } from '@/features/clients/components/ClientInfoDisplay'
import ContractManager from '@/features/clients/components/ContractManager'
import { InstallmentManager } from '@/features/clients/components/InstallmentManager'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb, Sparkles, Video
} from 'lucide-react'

interface ClientInfoPageProps {
  params: Promise<{ id: string }>
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div
              className={`text-xs font-medium px-2 py-1 rounded ${trend === 'up'
                ? 'bg-green-100 text-green-700'
                : trend === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700'
                }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params
  const { orgId, role } = await getSessionProfile()

  if (!role) return null

  const client = await getClientById(id)

  if (!client || client.orgId !== orgId) {
    return null
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || ''

  interface ClientDashboard {
    counts: {
      tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number }
      finance: { income: number; expense: number; net: number }
      media: number
      brandings: number
      strategies: number
    }
    meetings: Array<{ id: string; title: string; startTime: string; description?: string }>
    urgentTasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: string | null
      urgencyScore: number
    }>
  }

  let dash: ClientDashboard | null = null
  try {
    const res = await fetch(`${base}/api/clients/${id}/dashboard`, {
      cache: 'no-store',
    })
    if (res.ok) dash = (await res.json()) as ClientDashboard
  } catch { }

  const isOwner = can(role, 'update', 'finance')

  // Preparar métricas para o ClientHealthCard
  const healthMetrics: ClientHealthMetrics = {
    clientId: client.id,
    clientName: client.name,
    completionRate: dash?.counts.tasks.total
      ? Math.round((dash.counts.tasks.done / dash.counts.tasks.total) * 100)
      : 0,
    balance: dash?.counts.finance.net || 0,
    daysActive: client.created_at
      ? Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    tasksTotal: dash?.counts.tasks.total || 0,
    tasksCompleted: dash?.counts.tasks.done || 0,
    tasksPending: dash?.counts.tasks.todo || 0,
    tasksOverdue: dash?.counts.tasks.overdue || 0,
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
          <div className="relative space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header padrão dashboard */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#7B61FF] flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">GESTÃO DE CLIENTES</p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{client.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1">
                    Informações detalhadas e gestão do cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="space-y-6">
              <ClientInfoDisplay client={client} canEdit={isOwner} />
              <ClientHealthCardWrapper metrics={healthMetrics} />
              {isOwner && (
                <ContractManager
                  clientId={client.id}
                  clientName={client.name}
                  contractStart={client.contract_start}
                  contractEnd={client.contract_end}
                  paymentDay={client.payment_day}
                  contractValue={client.contract_value}
                />
              )}
              {isOwner && (
                <InstallmentManager
                  clientId={client.id}
                  canEdit={isOwner}
                />
              )}
              {dash && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={FolderKanban}
                    label="Tarefas Ativas"
                    value={dash.counts.tasks.total - dash.counts.tasks.done}
                    subtitle={`${dash.counts.tasks.done} concluídas`}
                    trend={dash.counts.tasks.overdue > 0 ? 'down' : 'up'}
                  />
                  <StatCard
                    icon={ImageIcon}
                    label="Mídias"
                    value={dash.counts.media}
                    subtitle="Arquivos"
                  />
                  <StatCard
                    icon={Lightbulb}
                    label="Estratégias"
                    value={dash.counts.strategies}
                    subtitle="Documentos"
                  />
                  <StatCard
                    icon={FileText}
                    label="Brandings"
                    value={dash.counts.brandings}
                    subtitle="Materiais"
                  />
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {dash && dash.urgentTasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-red-600" />
                          Tarefas Urgentes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dash.urgentTasks.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-slate-900 truncate">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-medium ${task.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : task.priority === 'medium'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-700'
                                      }`}
                                  >
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                  </span>
                                  {task.dueDate && (
                                    <span className="text-xs text-slate-500">
                                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <div className="text-xs text-slate-500">Score</div>
                                <div className="text-lg font-bold text-red-600">
                                  {task.urgencyScore.toFixed(0)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="space-y-6">
                  {dash && dash.meetings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          Próximas Reuniões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dash.meetings.slice(0, 3).map((meeting) => (
                            <div
                              key={meeting.id}
                              className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <h4 className="font-medium text-sm text-slate-900 mb-1">
                                {meeting.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {new Date(meeting.startTime).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {meeting.description && (
                                <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                                  {meeting.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card>
                    <CardHeader>
                      <CardTitle>Metadados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Criado em
                        </div>
                        <div className="text-sm text-slate-900">
                          {formatDate(client.created_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Última atualização
                        </div>
                        <div className="text-sm text-slate-900">
                          {formatDate(client.updated_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          ID do Cliente
                        </div>
                        <div className="text-xs text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded break-all">
                          {client.id}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
