import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ClientHealthMetrics } from '@/features/clients/components'
import { ClientInfoDisplay } from '@/features/clients/components/ClientInfoDisplay'
import ContractManager from '@/features/clients/components/ContractManager'
import { InstallmentManager } from '@/features/clients/components/InstallmentManager'
import { PaymentStatusCard } from '@/features/payments/components/PaymentStatusCard'
import { InstagramGrid } from '@/features/social/InstagramGrid'
import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import type { Finance, Media, Meeting, Task } from '@prisma/client'
import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  Users
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
  const canViewAmounts = isOwner

  // Buscar dados detalhados para os relatórios
  const [tasks, finances, media, meetings]: [Task[], Finance[], Media[], Meeting[]] = await Promise.all([
    prisma.task.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.finance.findMany({ where: { clientId: id }, orderBy: { date: 'desc' } }),
    prisma.media.findMany({ where: { clientId: id } }),
    prisma.meeting.findMany({ where: { clientId: id }, orderBy: { startTime: 'desc' }, take: 10 }),
  ])

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress' || t.status === 'in-progress').length,
    pending: tasks.filter((t) => t.status === 'todo' || t.status === 'pending').length,
    completionRate:
      tasks.length > 0
        ? Math.round(
          (tasks.filter((t) => t.status === 'done' || t.status === 'completed').length / tasks.length) * 100
        )
        : 0,
  }

  const financeStats = {
    income: finances.filter((f) => f.type === 'income').reduce((sum, f) => sum + Number(f.amount), 0),
    expense: finances.filter((f) => f.type === 'expense').reduce((sum, f) => sum + Number(f.amount), 0),
    balance: 0,
    transactions: finances.length,
  }
  financeStats.balance = financeStats.income - financeStats.expense

  const mediaStats = {
    total: media.length,
    images: media.filter((m) => m.type === 'image').length,
    videos: media.filter((m) => m.type === 'video').length,
    documents: media.filter((m) => m.type === 'document').length,
  }

  const meetingStats = {
    total: meetings.length,
    upcoming: meetings.filter((m) => new Date(m.startTime) > new Date()).length,
    past: meetings.filter((m) => new Date(m.startTime) <= new Date()).length,
  }

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
      <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
        {/* Top: Client Info & Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <ClientInfoDisplay client={client} canEdit={isOwner} />
            {/* {isOwner && (
              <ClientHealthCardWrapper metrics={healthMetrics} canViewAmounts={canViewAmounts} />
            )}
            {isOwner && (
              <ClientBottlenecksCard metrics={healthMetrics} canViewAmounts={canViewAmounts} />
            )} */}
            {/* Instagram Feed moved to bottom section */}
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
              <PaymentStatusCard
                clientId={client.id}
                clientName={client.name}
                canEdit={isOwner}
              />
            )}

            {isOwner && (
              <InstallmentManager clientId={client.id} canEdit={isOwner} />
            )}
          </div>
          <div className="space-y-6">
            {/* Stat Cards */}
            {dash && (
              <>
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
              </>
            )}
            {/* Metadata Card */}
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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <CardTitle>Biblioteca de Mídia</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">{mediaStats.images}</div>
                    <p className="text-xs text-slate-600 mt-1">Imagens</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-pink-50 border border-pink-200">
                    <div className="text-3xl font-bold text-pink-600">{mediaStats.videos}</div>
                    <p className="text-xs text-slate-600 mt-1">Vídeos</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="text-3xl font-bold text-indigo-600">{mediaStats.documents}</div>
                    <p className="text-xs text-slate-600 mt-1">Documentos</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-slate-100 border border-slate-200 text-center">
                  <p className="text-2xl font-bold text-slate-900">{mediaStats.total}</p>
                  <p className="text-xs text-slate-600 mt-1">Total de arquivos</p>
                </div>
              </CardContent>
            </Card>
          </div>


        </div>
        {/* Estatísticas e Conteúdo */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Task Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600" />
                <CardTitle>Desempenho de Tarefas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Concluídas</span>
                  <span className="text-sm font-bold text-green-600">{taskStats.completed}</span>
                </div>
                <ProgressBar value={taskStats.completed} max={taskStats.total} color="green" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Em Progresso</span>
                  <span className="text-sm font-bold text-blue-600">{taskStats.inProgress}</span>
                </div>
                <ProgressBar value={taskStats.inProgress} max={taskStats.total} color="blue" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Pendentes</span>
                  <span className="text-sm font-bold text-amber-600">{taskStats.pending}</span>
                </div>
                <ProgressBar value={taskStats.pending} max={taskStats.total} color="amber" />
              </div>
            </CardContent>
          </Card>

          {/* Media Stats */}


        </div>

        {/* Reuniões e Social */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meeting Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>Histórico de Reuniões</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{meetingStats.upcoming}</div>
                  <p className="text-xs text-slate-600 mt-1">Próximas</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-3xl font-bold text-slate-600">{meetingStats.past}</div>
                  <p className="text-xs text-slate-600 mt-1">Realizadas</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 text-center">
                <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {meetingStats.total}
                </p>
                <p className="text-xs text-slate-600 mt-1">Total de reuniões</p>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Feed */}
          <div>
            <InstagramGrid clientId={client.id} />
          </div>
        </div>

        {/* Summary */}
        {isOwner && (
          <Card className="relative overflow-hidden border-2 border-slate-200/60 shadow-xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_100%] animate-gradient" />
            <CardHeader>
              <CardTitle className="text-xl">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Status Geral do Projeto</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${taskStats.completionRate >= 75 ? 'bg-green-500' :
                      taskStats.completionRate >= 50 ? 'bg-blue-500' :
                        taskStats.completionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    <span className="text-base font-semibold text-slate-900">
                      {taskStats.completionRate >= 75 ? 'Excelente' :
                        taskStats.completionRate >= 50 ? 'Bom' :
                          taskStats.completionRate >= 25 ? 'Regular' : 'Precisa Atenção'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Saúde Financeira</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${financeStats.balance >= (client.contract_value ? Number(client.contract_value) * 0.5 : 1000) ? 'bg-green-500' :
                      financeStats.balance >= 0 ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                    <span className="text-base font-semibold text-slate-900">
                      {financeStats.balance >= (client.contract_value ? Number(client.contract_value) * 0.5 : 1000) ? 'Lucrativo' :
                        financeStats.balance >= 0 ? 'Equilibrado' : 'Deficitário'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cliente ativo há <strong>{healthMetrics.daysActive} dias</strong> com <strong>{taskStats.completionRate}%</strong> de taxa de conclusão de tarefas.
                  {canViewAmounts ? (
                    financeStats.balance >= 0 ? (
                      <> Apresenta balanço financeiro positivo de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.balance)}</strong>.</>
                    ) : (
                      <> Atenção: balanço financeiro negativo de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(financeStats.balance))}</strong>.</>
                    )
                  ) : (
                    financeStats.balance >= 0 ? (
                      <> Apresenta balanço financeiro positivo.</>
                    ) : (
                      <> Atenção: balanço financeiro negativo.</>
                    )
                  )}
                  {' '}Possui <strong>{mediaStats.total} arquivos</strong> na biblioteca de mídia e <strong>{meetingStats.total} reuniões</strong> registradas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

