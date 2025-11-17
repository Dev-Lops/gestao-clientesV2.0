import {
  calculateFinanceNet,
  calculatePercentageChange,
  getMeetingsToday,
  getTimeWindows,
} from '@/core/domain/analytics'
import { computeTaskStats, getUrgentTasks } from '@/core/domain/taskImportance'
import { prisma } from '@/lib/prisma'

export interface ClientDashboardResult {
  client: {
    id: string
    name: string
    status: string
    plan: string | null
    mainChannel: string | null
  }
  counts: {
    tasks: {
      total: number
      todo: number
      inProgress: number
      done: number
      overdue: number
    }
    brandings: number
    media: number
    mediaByType: {
      images: number
      videos: number
      documents: number
    }
    strategies: number
    meetings: {
      total: number
      upcoming: number
      past: number
      scheduledToday: number
    }
    finance: {
      income: number
      expense: number
      net: number
    }
  }
  trends?: {
    tasksCreated30dPct: number
    meetings30dPct: number
    media30dPct: number
    financeNet30dPct: number
  }
  urgentTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: Date | null
    urgencyScore: number
    createdAt: Date
    description: string | null
  }>
  meetings: Array<{
    id: string
    title: string
    startTime: Date
    endTime: Date
    status: string
  }>
}

/**
 * Busca dados base do cliente e valida acesso da org
 */

interface FinanceRow {
  id: string
  amount: number
  date: Date
  type: string
  category?: string | null
  description?: string | null
  createdAt?: Date
}

async function fetchClientBase(orgId: string, clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      status: true,
      plan: true,
      mainChannel: true,
      orgId: true,
    },
  })

  if (!client || client.orgId !== orgId) return null

  return client
}

/**
 * Busca counts agregados de forma paralela
 */
async function fetchAggregateCounts(clientId: string) {
  const [
    brandingCount,
    mediaCount,
    mediaTypeGroups,
    strategyCount,
    meetingsTotal,
  ] = await Promise.all([
    prisma.branding.count({ where: { clientId } }),
    prisma.media.count({ where: { clientId } }),
    prisma.media.groupBy({
      by: ['type'],
      where: { clientId },
      _count: { _all: true },
    }),
    prisma.strategy.count({ where: { clientId } }),
    prisma.meeting.count({ where: { clientId } }),
  ])

  const mediaByType = {
    images: mediaTypeGroups.find((g) => g.type === 'image')?._count._all ?? 0,
    videos: mediaTypeGroups.find((g) => g.type === 'video')?._count._all ?? 0,
    documents:
      mediaTypeGroups.find((g) => g.type === 'document')?._count._all ?? 0,
  }

  return {
    brandings: brandingCount,
    media: mediaCount,
    mediaByType,
    strategies: strategyCount,
    meetingsTotal,
  }
}

/**
 * Busca dados temporais (tasks, meetings, finance)
 */
async function fetchTimeBasedData(clientId: string, now: Date) {
  const [tasks, meetingsUpcoming, financeRows] = await Promise.all([
    prisma.task.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.meeting.findMany({
      where: { clientId, status: 'scheduled', startTime: { gt: now } },
      orderBy: { startTime: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    }),
    prisma.finance.findMany({
      where: { clientId },
      select: { id: true, type: true, amount: true, date: true },
    }),
  ])

  return { tasks, meetingsUpcoming, financeRows }
}

/**
 * Calcula contadores de meetings (upcoming/past/today)
 */
async function fetchMeetingCounts(clientId: string, now: Date) {
  const [upcomingCount, pastCount] = await Promise.all([
    prisma.meeting.count({
      where: { clientId, startTime: { gt: now } },
    }),
    prisma.meeting.count({
      where: { clientId, startTime: { lte: now } },
    }),
  ])

  return { upcomingCount, pastCount }
}

/**
 * Calcula tendências de 30 dias
 */
async function fetchTrends(
  clientId: string,
  financeRows: FinanceRow[],
  now: Date
) {
  const windows = getTimeWindows(now, 30)

  const [
    tasksCreatedCurrent,
    tasksCreatedPrev,
    meetings30Current,
    meetings30Prev,
    media30Current,
    media30Prev,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        clientId,
        createdAt: { gte: windows.current.start, lt: windows.current.end },
      },
    }),
    prisma.task.count({
      where: {
        clientId,
        createdAt: { gte: windows.previous.start, lt: windows.previous.end },
      },
    }),
    prisma.meeting.count({
      where: {
        clientId,
        startTime: { gte: windows.current.start, lt: windows.current.end },
      },
    }),
    prisma.meeting.count({
      where: {
        clientId,
        startTime: { gte: windows.previous.start, lt: windows.previous.end },
      },
    }),
    prisma.media.count({
      where: {
        clientId,
        createdAt: { gte: windows.current.start, lt: windows.current.end },
      },
    }),
    prisma.media.count({
      where: {
        clientId,
        createdAt: { gte: windows.previous.start, lt: windows.previous.end },
      },
    }),
  ])

  const financeNetCurrent = calculateFinanceNet(
    financeRows,
    windows.current
  ).net
  const financeNetPrev = calculateFinanceNet(financeRows, windows.previous).net

  return {
    tasksCreated30dPct: calculatePercentageChange(
      tasksCreatedCurrent,
      tasksCreatedPrev
    ),
    meetings30dPct: calculatePercentageChange(
      meetings30Current,
      meetings30Prev
    ),
    media30dPct: calculatePercentageChange(media30Current, media30Prev),
    financeNet30dPct: calculatePercentageChange(
      financeNetCurrent,
      financeNetPrev
    ),
  }
}

/**
 * Obtém dashboard completo do cliente com dados agregados e análises
 */
export async function getClientDashboard(
  orgId: string,
  clientId: string
): Promise<ClientDashboardResult | null> {
  const now = new Date()

  // 1. Valida acesso e busca cliente
  const client = await fetchClientBase(orgId, clientId)
  if (!client) return null

  // 2. Busca dados em paralelo
  const [aggregates, timeData, meetingCounts] = await Promise.all([
    fetchAggregateCounts(clientId),
    fetchTimeBasedData(clientId, now),
    fetchMeetingCounts(clientId, now),
  ])

  const { tasks, meetingsUpcoming, financeRows } = timeData

  // 3. Calcula estatísticas de tarefas usando helpers de domínio
  const taskStats = computeTaskStats(tasks, now)
  const urgentTasks = getUrgentTasks(tasks, 5, 20, now)

  // 4. Calcula finances
  const financeNet = calculateFinanceNet(financeRows)
  const scheduledToday = getMeetingsToday(meetingsUpcoming, now)

  // 5. Calcula tendências
  const trends = await fetchTrends(clientId, financeRows, now)

  return {
    client: {
      id: client.id,
      name: client.name,
      status: client.status,
      plan: client.plan ?? null,
      mainChannel: client.mainChannel ?? null,
    },
    counts: {
      tasks: taskStats,
      brandings: aggregates.brandings,
      media: aggregates.media,
      mediaByType: aggregates.mediaByType,
      strategies: aggregates.strategies,
      meetings: {
        total: aggregates.meetingsTotal,
        upcoming: meetingCounts.upcomingCount,
        past: meetingCounts.pastCount,
        scheduledToday,
      },
      finance: financeNet,
    },
    urgentTasks,
    trends,
    meetings: meetingsUpcoming,
  }
}
