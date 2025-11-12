import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ClientHealthMetrics } from '@/features/clients/components'
import { ClientBottlenecksCard } from '@/features/clients/components/ClientBottlenecksCard'
import { ClientHealthCardWrapper } from '@/features/clients/components/ClientHealthCardWrapper'
import { ClientInfoDisplay } from '@/features/clients/components/ClientInfoDisplay'
import ContractManager from '@/features/clients/components/ContractManager'
import { InstallmentManager } from '@/features/clients/components/InstallmentManager'
import { MonthlyPaymentCard } from '@/features/clients/components/MonthlyPaymentCard'
import { InstagramGrid } from '@/features/social/InstagramGrid'
import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import {
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  TrendingUp,
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

  // Buscar dados detalhados para os relatórios
  const [tasks, finances, media, meetings] = await Promise.all([
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
            <ClientHealthCardWrapper metrics={healthMetrics} />
            <ClientBottlenecksCard metrics={healthMetrics} />
            {/* Instagram Feed */}
            <InstagramGrid clientId={client.id} />
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
              <MonthlyPaymentCard
                clientId={client.id}
                clientName={client.name}
                contractValue={client.contract_value}
                paymentDay={client.payment_day}
                isInstallment={client.is_installment}
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
          </div>
        </div>
        {/* Relatórios e Análises (conteúdo incorporado da página de relatórios) */}
        <div className="space-y-6 mt-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-2 border-blue-200/60 shadow-xl shadow-blue-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-500 to-purple-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Taxa de Conclusão</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {/* icon placeholder (was CheckCircle) */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{taskStats.completionRate}%</div>
                <p className="text-xs text-slate-500 mt-1">
                  {taskStats.completed} de {taskStats.total} tarefas
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-green-200/60 shadow-xl shadow-green-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-500 to-emerald-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Balanço Financeiro</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${financeStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {financeStats.transactions} transações
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-purple-200/60 shadow-xl shadow-purple-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 to-pink-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">ROI</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{
                  client.contract_value && financeStats.income > 0
                    ? Math.round(((financeStats.balance / Number(client.contract_value)) * 100))
                    : 0
                }%</div>
                <p className="text-xs text-slate-500 mt-1">Retorno sobre investimento</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-orange-200/60 shadow-xl shadow-orange-200/50">
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-orange-500 to-red-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Dias Ativo</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{
                  client.created_at
                    ? Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                }</div>
                <p className="text-xs text-slate-500 mt-1">Desde {new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
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

            {/* Finance Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <CardTitle>Análise Financeira</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Receitas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.income)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
                  <div>
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Despesas</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.expense)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${financeStats.balance >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
                  }`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${financeStats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>Saldo</p>
                    <p className={`text-2xl font-bold mt-1 ${financeStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.balance)}
                    </p>
                  </div>
                  <DollarSign className={`${financeStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Media Stats */}
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
          </div>

          {/* Summary */}
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
                  {financeStats.balance >= 0 ? (
                    <> Apresenta balanço financeiro positivo de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeStats.balance)}</strong>.</>
                  ) : (
                    <> Atenção: balanço financeiro negativo de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(financeStats.balance))}</strong>.</>
                  )}
                  {' '}Possui <strong>{mediaStats.total} arquivos</strong> na biblioteca de mídia e <strong>{meetingStats.total} reuniões</strong> registradas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

