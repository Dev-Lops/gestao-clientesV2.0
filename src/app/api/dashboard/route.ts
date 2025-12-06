import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Helper para mapear status/urgência
function isPending(status: string) {
  return ['pending', 'todo'].includes(status)
}
function isInProgress(status: string) {
  return ['in_progress', 'in-progress'].includes(status)
}
function isDone(status: string) {
  return ['done', 'completed'].includes(status)
}
function computeUrgency(t: {
  dueDate: Date | null
  priority: string
  status: string
}) {
  if (isDone(t.status)) return 0
  let score = 0
  if (t.priority === 'high') score += 3
  else if (t.priority === 'medium') score += 2
  else score += 1
  if (t.dueDate) {
    const diffMs = t.dueDate.getTime() - Date.now()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays <= 0)
      score += 4 // atraso
    else if (diffDays <= 1) score += 3
    else if (diffDays <= 3) score += 2
    else if (diffDays <= 7) score += 1
  }
  return score
}

export async function GET(req: NextRequest) {
  try {
    const r = req
    const guard = guardAccess(r)
    if (guard) return guard
    const cookieStore = await cookies()
    const token = cookieStore.get('auth')?.value

    if (!token) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return applySecurityHeaders(r, res)
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid

    // Busca o usuário e sua org
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: { memberships: { include: { org: true } } },
    })

    if (!user || user.memberships.length === 0) {
      const res = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
      return applySecurityHeaders(r, res)
    }

    const orgId = user.memberships[0].orgId

    // Tasks otimizadas com select apenas dos campos necessários
    const [
      clients,
      tasks,
      meetings,
      finances,
      dashboardEvents,
      dashboardNotes,
    ] = await Promise.all([
      prisma.client.findMany({
        where: {
          orgId,
          deletedAt: null, // Excluir soft-deleted
        },
        orderBy: { createdAt: 'desc' },
        // Sem limite - retorna TODOS os clientes
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: {
          orgId,
          deletedAt: null, // Excluir soft-deleted
        },
        orderBy: { createdAt: 'desc' },
        // Sem limite - retorna TODAS as tarefas
        select: {
          id: true,
          title: true,
          status: true,
          description: true,
          createdAt: true,
          priority: true,
          dueDate: true,
          clientId: true,
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.meeting.findMany({
        where: { client: { orgId } },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          clientId: true,
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.findMany({
        where: { orgId },
        select: {
          clientId: true,
          type: true,
          amount: true,
        },
      }),
      prisma.dashboardEvent.findMany({
        where: { orgId },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          color: true,
        },
      }),
      prisma.dashboardNote.findMany({
        where: { orgId },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          content: true,
          color: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    // Agregações
    const taskAggByClient: Record<
      string,
      {
        total: number
        pending: number
        inProgress: number
        done: number
        urgent: number
        name: string
      }
    > = {}
    let mostPendingClient: {
      clientId: string
      pending: number
      name: string
    } | null = null
    let mostUrgentClient: {
      clientId: string
      urgent: number
      name: string
    } | null = null

    const urgentTasks: Array<{
      id: string
      title: string
      status: string
      description: string | null
      createdAt: Date
      priority: string
      dueDate: Date | null
      clientId: string
      client: { id: string; name: string }
      urgencyScore: number
    }> = []

    for (const t of tasks) {
      const key = t.clientId
      if (!taskAggByClient[key]) {
        taskAggByClient[key] = {
          total: 0,
          pending: 0,
          inProgress: 0,
          done: 0,
          urgent: 0,
          name: t.client.name,
        }
      }
      const bucket = taskAggByClient[key]
      bucket.total += 1
      if (isPending(t.status)) bucket.pending += 1
      else if (isInProgress(t.status)) bucket.inProgress += 1
      else if (isDone(t.status)) bucket.done += 1

      const urgencyScore = computeUrgency({
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })
      if (urgencyScore >= 5) {
        // threshold "urgente"
        bucket.urgent += 1
        urgentTasks.push({
          id: t.id,
          title: t.title,
          status: t.status,
          description: t.description,
          createdAt: t.createdAt,
          priority: t.priority,
          dueDate: t.dueDate,
          clientId: t.clientId,
          client: t.client,
          urgencyScore,
        })
      }

      if (!mostPendingClient || bucket.pending > mostPendingClient.pending) {
        mostPendingClient = {
          clientId: key,
          pending: bucket.pending,
          name: bucket.name,
        }
      }
      if (!mostUrgentClient || bucket.urgent > mostUrgentClient.urgent) {
        mostUrgentClient = {
          clientId: key,
          urgent: bucket.urgent,
          name: bucket.name,
        }
      }
    }

    urgentTasks.sort((a, b) => b.urgencyScore - a.urgencyScore)

    // Calcular métricas de saúde dos clientes
    const clientsHealth = clients.map((client) => {
      const clientTasks = tasks.filter((t) => t.clientId === client.id)
      const total = clientTasks.length
      const pending = clientTasks.filter((t) => isPending(t.status)).length
      const completed = clientTasks.filter((t) => isDone(t.status)).length
      const overdue = clientTasks.filter(
        (t) =>
          !isDone(t.status) && t.dueDate && t.dueDate.getTime() < Date.now()
      ).length

      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0

      // Calcular saldo financeiro
      const clientFinances = finances.filter((f) => f.clientId === client.id)
      const balance = clientFinances.reduce((acc, f) => {
        return acc + (f.type === 'INCOME' ? f.amount : -f.amount)
      }, 0)

      // Calcular dias ativos
      const daysActive = Math.floor(
        (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        clientId: client.id,
        clientName: client.name,
        completionRate,
        balance,
        daysActive,
        tasksTotal: total,
        tasksCompleted: completed,
        tasksPending: pending,
        tasksOverdue: overdue,
      }
    })

    // Determinar intervalo mensal (default: mês atual) ou por query param ?month=YYYY-MM ou ?start&end
    const url = new URL(req.url)
    const monthParam = url.searchParams.get('month') // YYYY-MM
    const rangeStartParam = url.searchParams.get('start')
    const rangeEndParam = url.searchParams.get('end')

    let rangeStart: Date
    let rangeEnd: Date
    if (rangeStartParam && rangeEndParam) {
      const rs = new Date(rangeStartParam)
      const re = new Date(rangeEndParam)
      if (!Number.isNaN(rs.getTime()) && !Number.isNaN(re.getTime())) {
        rangeStart = rs
        rangeEnd = re
      } else {
        throw new Error('Invalid start/end query params')
      }
    } else if (monthParam) {
      const [y, m] = monthParam.split('-').map((n) => Number(n))
      const year = Number.isFinite(y) ? y : new Date().getFullYear()
      const monthIdx = Number.isFinite(m) ? m - 1 : new Date().getMonth()
      rangeStart = new Date(year, monthIdx, 1, 0, 0, 0, 0)
      rangeEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999)
    } else {
      const now = new Date()
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      rangeEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    }

    // Preparar atividades para o calendário (reuniões + tarefas com prazo + eventos), filtradas pelo mês
    const activitiesAll = [
      ...meetings.map((m) => ({
        id: m.id,
        title: m.title,
        type: 'meeting' as const,
        date: m.startTime,
        clientId: m.clientId,
        clientName: m.client.name,
      })),
      ...tasks
        .filter((t) => t.dueDate)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: 'task' as const,
          date: t.dueDate!,
          clientId: t.clientId,
          clientName: t.client.name,
          status: t.status,
        })),
      ...dashboardEvents.map((e) => ({
        id: e.id,
        title: e.title,
        type: 'event' as const,
        date: e.date,
        description: e.description,
        color: e.color,
      })),
    ]

    const activities = activitiesAll
      .filter((a) => a.date >= rangeStart && a.date <= rangeEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calcular dados financeiros dos últimos 6 meses para gráficos
    const financialData: Array<{
      month: string
      receitas: number
      despesas: number
      saldo: number
    }> = []

    // Buscar despesas recorrentes ativas ANTES do loop
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        orgId,
        active: true,
        deletedAt: null,
      },
      select: {
        id: true,
        amount: true,
        cycle: true,
      },
    })

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        1,
        0,
        0,
        0
      )
      const monthEnd = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      )

      // Buscar todas as receitas (incluindo pagamentos de faturas) no mês
      // NOTA: type: INCOME já inclui subtype INVOICE_PAYMENT (não duplicar!)
      const monthIncome = await prisma.transaction.findMany({
        where: {
          orgId,
          type: 'INCOME',
          date: { gte: monthStart, lte: monthEnd },
        },
        select: {
          amount: true,
        },
      })

      // Buscar despesas no mês (transaction type = EXPENSE)
      const monthExpenses = await prisma.transaction.findMany({
        where: {
          orgId,
          type: 'EXPENSE',
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          amount: true,
        },
      })

      const receitas = monthIncome.reduce((sum, i) => sum + i.amount, 0)
      const transactionExpenses = monthExpenses.reduce(
        (sum, e) => sum + e.amount,
        0
      )

      // Adicionar despesas recorrentes MONTHLY
      const monthlyRecurringExpense = recurringExpenses
        .filter((r) => r.cycle === 'MONTHLY')
        .reduce((sum, r) => sum + r.amount, 0)

      const despesas = transactionExpenses + monthlyRecurringExpense
      const saldo = receitas - despesas

      financialData.push({
        month: targetMonth.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        receitas,
        despesas,
        saldo,
      })
    }

    const res = NextResponse.json({
      clients,
      tasks,
      metrics: {
        totals: {
          clients: clients.length,
          tasks: tasks.length,
        },
        mostPendingClient,
        mostUrgentClient,
        urgentTasks: urgentTasks.slice(0, 15),
        taskAggByClient,
      },
      clientsHealth,
      activities,
      financialData,
      notes: dashboardNotes,
      events: dashboardEvents,
      user: { id: user.id, name: user.name, email: user.email },
    })
    return applySecurityHeaders(r, res)
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    const res = NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}
