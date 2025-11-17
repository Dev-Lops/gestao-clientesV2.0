import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { cache } from 'react'
import {
  DashboardDataSchema,
  UrgentTaskSchema,
  type DashboardData,
} from '../domain/schema'

// Extracted logic from API route for server usage (simplified parallelization)
export const getDashboardData = cache(
  async (monthKey?: string): Promise<DashboardData> => {
    const session = await getSessionProfile()
    if (!session.orgId || !session.user) {
      throw new Error('Unauthenticated')
    }
    const orgId = session.orgId

    // Base queries
    const [clients, tasks, meetings, finances] = await Promise.all([
      prisma.client.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 200,
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
      prisma.finance.findMany({
        where: { client: { orgId } },
        select: { clientId: true, type: true, amount: true },
      }),
    ])

    const isPending = (s: string) => ['pending', 'todo'].includes(s)
    const isInProgress = (s: string) =>
      ['in_progress', 'in-progress'].includes(s)
    const isDone = (s: string) => ['done', 'completed'].includes(s)
    const computeUrgency = (t: {
      dueDate: Date | null
      priority: string
      status: string
    }) => {
      if (isDone(t.status)) return 0
      let score = 0
      if (t.priority === 'high') score += 3
      else if (t.priority === 'medium') score += 2
      else score += 1
      if (t.dueDate) {
        const diffDays = (t.dueDate.getTime() - Date.now()) / 86400000
        if (diffDays <= 0) score += 4
        else if (diffDays <= 1) score += 3
        else if (diffDays <= 3) score += 2
        else if (diffDays <= 7) score += 1
      }
      return score
    }

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
    const urgentTasks: Array<ReturnType<(typeof UrgentTaskSchema)['parse']>> =
      []

    for (const t of tasks) {
      const bucket = (taskAggByClient[t.clientId] ||= {
        total: 0,
        pending: 0,
        inProgress: 0,
        done: 0,
        urgent: 0,
        name: t.client.name,
      })
      bucket.total++
      if (isPending(t.status)) bucket.pending++
      else if (isInProgress(t.status)) bucket.inProgress++
      else if (isDone(t.status)) bucket.done++
      const urgencyScore = computeUrgency({
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })
      if (urgencyScore >= 5) {
        bucket.urgent++
        urgentTasks.push(UrgentTaskSchema.parse({ ...t, urgencyScore }))
      }
      if (!mostPendingClient || bucket.pending > mostPendingClient.pending) {
        mostPendingClient = {
          clientId: t.clientId,
          pending: bucket.pending,
          name: bucket.name,
        }
      }
      if (!mostUrgentClient || bucket.urgent > mostUrgentClient.urgent) {
        mostUrgentClient = {
          clientId: t.clientId,
          urgent: bucket.urgent,
          name: bucket.name,
        }
      }
    }
    urgentTasks.sort((a, b) => b.urgencyScore - a.urgencyScore)

    const clientsHealth = clients.map((c) => {
      const cTasks = tasks.filter((t) => t.clientId === c.id)
      const total = cTasks.length
      const completed = cTasks.filter((t) => isDone(t.status)).length
      const pending = cTasks.filter((t) => isPending(t.status)).length
      const overdue = cTasks.filter(
        (t) =>
          !isDone(t.status) && t.dueDate && t.dueDate.getTime() < Date.now()
      ).length
      const completionRate = total ? Math.round((completed / total) * 100) : 0
      const balance = finances
        .filter((f) => f.clientId === c.id)
        .reduce(
          (acc, f) => acc + (f.type === 'income' ? f.amount : -f.amount),
          0
        )
      const daysActive = Math.floor(
        (Date.now() - c.createdAt.getTime()) / 86400000
      )
      return {
        clientId: c.id,
        clientName: c.name,
        completionRate,
        balance,
        daysActive,
        tasksTotal: total,
        tasksCompleted: completed,
        tasksPending: pending,
        tasksOverdue: overdue,
      }
    })

    // Month range parsing
    let rangeStart: Date
    let rangeEnd: Date
    if (monthKey) {
      const [y, m] = monthKey.split('-').map(Number)
      const year = Number.isFinite(y) ? y : new Date().getFullYear()
      const monthIdx = Number.isFinite(m) ? m - 1 : new Date().getMonth()
      rangeStart = new Date(year, monthIdx, 1, 0, 0, 0, 0)
      rangeEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999)
    } else {
      const now = new Date()
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1)
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
    ]
    const activities = activitiesAll
      .filter((a) => a.date >= rangeStart && a.date <= rangeEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Financial last 6 months (simplified)
    const financialData: {
      month: string
      receitas: number
      despesas: number
      saldo: number
    }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        1
      )
      const monthEnd = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      )
      const payments = await prisma.payment.findMany({
        where: {
          client: { orgId },
          status: { in: ['CONFIRMED', 'VERIFIED'] },
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true },
      })
      const monthExpenses = await prisma.finance.findMany({
        where: {
          client: { orgId },
          type: 'expense',
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true },
      })
      const receitas = payments.reduce((s, p) => s + p.amount, 0)
      const despesas = monthExpenses.reduce((s, e) => s + e.amount, 0)
      financialData.push({
        month: targetMonth.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      })
    }

    const raw = {
      clients,
      tasks,
      metrics: {
        totals: { clients: clients.length, tasks: tasks.length },
        mostPendingClient,
        mostUrgentClient,
        urgentTasks: urgentTasks.slice(0, 15),
        taskAggByClient,
      },
      clientsHealth,
      activities,
      financialData,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    }
    return DashboardDataSchema.parse(raw)
  }
)
