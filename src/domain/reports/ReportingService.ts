import { CostTrackingService } from '@/domain/costs/CostTrackingService'
import { prisma } from '@/lib/prisma'
import { TransactionService } from '@/services/financial/TransactionService'
import {
  ExpenseCycle,
  InvoiceStatus,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type Prisma,
} from '@prisma/client'

export class ReportingService {
  static async getDashboard(orgId: string, dateFrom?: Date, dateTo?: Date) {
    const [
      transactionSummary,
      invoiceSummary,
      overdueInvoices,
      topClientsByRevenue,
      topClientsByOverdue,
      recentTransactions,
    ] = await Promise.all([
      TransactionService.getSummary(orgId, dateFrom, dateTo),
      this.getInvoiceSummary(orgId, dateFrom, dateTo),
      this.getOverdueInvoices(orgId),
      this.getTopClientsByRevenue(orgId, dateFrom, dateTo),
      this.getTopClientsByOverdue(orgId),
      this.getRecentTransactions(orgId, 10),
    ])

    const [
      fixedMonthlyAgg,
      fixedMaterializedAgg,
      nonFixedExpenseAgg,
      cashIncomeAgg,
      cashExpenseAgg,
    ] = await Promise.all([
      prisma.recurringExpense.aggregate({
        where: {
          orgId,
          active: true,
          cycle: ExpenseCycle.MONTHLY,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          subtype: TransactionSubtype.FIXED_EXPENSE,
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && { gte: dateFrom }),
                  ...(dateTo && { lte: dateTo }),
                },
              }
            : {}),
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.EXPENSE,
          NOT: { subtype: TransactionSubtype.FIXED_EXPENSE },
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && { gte: dateFrom }),
                  ...(dateTo && { lte: dateTo }),
                },
              }
            : {}),
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.INCOME,
          date: { lte: new Date() },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.EXPENSE,
          date: { lte: new Date() },
        },
        _sum: { amount: true },
      }),
    ])

    const monthlyFixedTotal =
      (fixedMonthlyAgg._sum.amount as any)?.toNumber?.() ??
      (fixedMonthlyAgg._sum.amount || 0)
    const materializedFixedThisPeriod =
      (fixedMaterializedAgg._sum.amount as any)?.toNumber?.() ??
      (fixedMaterializedAgg._sum.amount || 0)
    const pendingFixed = Math.max(
      0,
      monthlyFixedTotal - materializedFixedThisPeriod
    )
    const openInvoicesThisPeriod =
      (invoiceSummary.open?.total || 0) + (invoiceSummary.overdue?.total || 0)
    const nonFixedExpenseThisPeriod = nonFixedExpenseAgg._sum.amount || 0
    const projectedNetProfit =
      openInvoicesThisPeriod - (nonFixedExpenseThisPeriod + pendingFixed)
    const cashOnHand =
      (cashIncomeAgg._sum.amount || 0) - (cashExpenseAgg._sum.amount || 0)

    return {
      financial: { ...transactionSummary, pendingExpense: pendingFixed },
      invoices: invoiceSummary,
      overdue: overdueInvoices,
      topClients: {
        byRevenue: topClientsByRevenue,
        byOverdue: topClientsByOverdue,
      },
      recentActivity: recentTransactions,
      projections: {
        monthlyFixedTotal,
        materializedFixedThisPeriod,
        pendingFixed,
        openInvoicesThisPeriod,
        nonFixedExpenseThisPeriod,
        cashOnHand,
        incomeToDate: cashIncomeAgg._sum.amount || 0,
        expenseToDate: cashExpenseAgg._sum.amount || 0,
        cashOnHandMonthly: (() => {
          const incomePeriod = transactionSummary.totalIncome || 0
          const expensePeriod = transactionSummary.totalExpense || 0
          return incomePeriod - expensePeriod
        })(),
        projectedNetProfit,
      },
    }
  }

  static async auditFinancial(orgId: string, year: number, months: number[]) {
    const results: Array<any> = []

    for (const month of months) {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const lastDay = new Date(year, month, 0)
      const end = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate(),
        23,
        59,
        59,
        999
      )

      const [summary, invoiceSummary] = await Promise.all([
        TransactionService.getSummary(orgId, start, end),
        this.getInvoiceSummary(orgId, start, end),
      ])

      const [
        fixedMonthlyAgg,
        fixedMaterializedAgg,
        nonFixedExpenseAgg,
        cashIncomeAgg,
        cashExpenseAgg,
      ] = await Promise.all([
        prisma.recurringExpense.aggregate({
          where: {
            orgId,
            active: true,
            cycle: ExpenseCycle.MONTHLY,
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            subtype: TransactionSubtype.FIXED_EXPENSE,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.EXPENSE,
            NOT: { subtype: TransactionSubtype.FIXED_EXPENSE },
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.INCOME,
            date: { lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.EXPENSE,
            date: { lte: end },
          },
          _sum: { amount: true },
        }),
      ])

      const fixedMonthlyTotal =
        (fixedMonthlyAgg._sum.amount as any)?.toNumber?.() ??
        (fixedMonthlyAgg._sum.amount || 0)
      const fixedMaterialized =
        (fixedMaterializedAgg._sum.amount as any)?.toNumber?.() ??
        (fixedMaterializedAgg._sum.amount || 0)
      const pendingFixed = Math.max(0, fixedMonthlyTotal - fixedMaterialized)
      const openInvoicesTotal =
        (invoiceSummary.open?.total || 0) + (invoiceSummary.overdue?.total || 0)
      const nonFixedExpenseThisPeriod =
        (nonFixedExpenseAgg._sum.amount as any)?.toNumber?.() ??
        (nonFixedExpenseAgg._sum.amount || 0)
      const projectedNetProfit =
        openInvoicesTotal - (nonFixedExpenseThisPeriod + pendingFixed)

      const periodIncome = summary.totalIncome || 0
      const periodExpense = summary.totalExpense || 0
      const periodNet = periodIncome - periodExpense
      const cashIncome = cashIncomeAgg._sum.amount || 0
      const cashExpense = cashExpenseAgg._sum.amount || 0
      const cashOnHand = cashIncome - cashExpense

      const anomalies: string[] = []
      const futureTxCount = await prisma.transaction.count({
        where: { orgId, deletedAt: null, date: { gt: end } },
      })
      if (futureTxCount > 0)
        anomalies.push(`Transações no futuro: ${futureTxCount}`)

      if (fixedMaterialized > fixedMonthlyTotal + 0.01)
        anomalies.push(
          `Fixas materializadas (${fixedMaterialized.toFixed(2)}) > fixas mensais (${fixedMonthlyTotal.toFixed(2)})`
        )

      const negativeTxCount = await prisma.transaction.count({
        where: {
          orgId,
          deletedAt: null,
          amount: { lt: 0 },
          date: { gte: start, lte: end },
        },
      })
      if (negativeTxCount > 0)
        anomalies.push(`Transações negativas no mês: ${negativeTxCount}`)

      results.push({
        month,
        cashIncome,
        cashExpense,
        cashOnHand,
        periodIncome,
        periodExpense,
        periodNet,
        fixedMonthlyTotal,
        fixedMaterialized,
        pendingFixed,
        openInvoicesTotal,
        nonFixedExpenseThisPeriod,
        projectedNetProfit,
        anomalies,
      })
    }

    return { year, months, results }
  }

  static async getInvoiceSummary(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const openWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.OPEN,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            dueDate: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const overdueWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.OVERDUE,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            dueDate: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const paidWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.PAID,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            paidAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const cancelledWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.CANCELLED,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            cancelledAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const [open, paid, overdue, cancelled] = await Promise.all([
      prisma.invoice.aggregate({
        where: openWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: paidWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: overdueWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: cancelledWhere,
        _sum: { total: true },
        _count: true,
      }),
    ])

    return {
      open: {
        count: open._count,
        total: (open._sum.total as any)?.toNumber?.() ?? (open._sum.total || 0),
      },
      paid: {
        count: paid._count,
        total: (paid._sum.total as any)?.toNumber?.() ?? (paid._sum.total || 0),
      },
      overdue: {
        count: overdue._count,
        total:
          (overdue._sum.total as any)?.toNumber?.() ??
          (overdue._sum.total || 0),
      },
      cancelled: {
        count: cancelled._count,
        total:
          (cancelled._sum.total as any)?.toNumber?.() ??
          (cancelled._sum.total || 0),
      },
      totalReceivable:
        ((open._sum.total as any)?.toNumber?.() ?? (open._sum.total || 0)) +
        ((overdue._sum.total as any)?.toNumber?.() ??
          (overdue._sum.total || 0)),
    }
  }

  static async getOverdueInvoices(orgId: string, limit: number = 10) {
    const invoices = await prisma.invoice.findMany({
      where: { orgId, status: InvoiceStatus.OVERDUE, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    })

    const now = new Date()
    return invoices.map((invoice) => ({
      ...invoice,
      daysLate: Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
  }

  static async getTopClientsByRevenue(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 10
  ) {
    const where: Prisma.TransactionWhereInput = {
      orgId,
      type: TransactionType.INCOME,
      status: TransactionStatus.CONFIRMED,
      deletedAt: null,
      clientId: { not: null },
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const transactions = await prisma.transaction.groupBy({
      by: ['clientId'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    })
    const clientIds = transactions
      .map((t) => t.clientId)
      .filter((id): id is string => id !== null)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true },
    })
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    return transactions.map((t) => ({
      clientId: t.clientId!,
      clientName: clientMap.get(t.clientId!)?.name || 'Cliente não encontrado',
      clientEmail: clientMap.get(t.clientId!)?.email,
      totalRevenue: t._sum.amount || 0,
      transactionCount: t._count,
    }))
  }

  static async getTopClientsByOverdue(orgId: string, limit: number = 10) {
    const invoices = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: { orgId, status: InvoiceStatus.OVERDUE, deletedAt: null },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    })
    const clientIds = invoices.map((i) => i.clientId)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true },
    })
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const now = new Date()
    const detailedInvoices = await prisma.invoice.findMany({
      where: {
        orgId,
        clientId: { in: clientIds },
        status: InvoiceStatus.OVERDUE,
        deletedAt: null,
      },
      select: { clientId: true, dueDate: true },
    })

    const avgDaysLateByClient = new Map<string, number>()
    clientIds.forEach((clientId) => {
      const clientInvoices = detailedInvoices.filter(
        (i) => i.clientId === clientId
      )
      if (clientInvoices.length > 0) {
        const totalDays = clientInvoices.reduce((sum, inv) => {
          const days = Math.floor(
            (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0)
        avgDaysLateByClient.set(
          clientId,
          Math.round(totalDays / clientInvoices.length)
        )
      }
    })

    return invoices.map((i) => ({
      clientId: i.clientId,
      clientName: clientMap.get(i.clientId)?.name || 'Cliente não encontrado',
      clientEmail: clientMap.get(i.clientId)?.email,
      totalOverdue: i._sum.total || 0,
      invoiceCount: i._count,
      avgDaysLate: avgDaysLateByClient.get(i.clientId) || 0,
    }))
  }

  static async getRecentTransactions(orgId: string, limit: number = 10) {
    const txs = await prisma.transaction.findMany({
      where: { orgId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return txs.map((t) => ({ ...t, dueDate: t.date }))
  }

  static async getClientAnalysis(
    clientId: string,
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const [client, margin, invoices, transactions, costSubscriptions] =
      await Promise.all([
        prisma.client.findFirst({
          where: { id: clientId, orgId },
          include: {
            installments: {
              where: { status: { not: 'CONFIRMED' } },
              orderBy: { dueDate: 'asc' },
            },
          },
        }),
        CostTrackingService.calculateClientMargin(
          clientId,
          orgId,
          dateFrom,
          dateTo
        ),
        prisma.invoice.findMany({
          where: {
            clientId,
            orgId,
            deletedAt: null,
            ...(dateFrom || dateTo
              ? {
                  issueDate: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                  },
                }
              : {}),
          },
          include: { items: true },
          orderBy: { issueDate: 'desc' },
        }),
        prisma.transaction.findMany({
          where: {
            clientId,
            orgId,
            deletedAt: null,
            ...(dateFrom || dateTo
              ? {
                  date: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                  },
                }
              : {}),
          },
          orderBy: { date: 'desc' },
        }),
        CostTrackingService.listSubscriptions({
          orgId,
          clientId,
          active: true,
        }),
      ])

    if (!client) throw new Error('Cliente não encontrado')

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        contractValue: client.contractValue,
        contractStart: client.contractStart,
        contractEnd: client.contractEnd,
        plan: client.plan,
        paymentStatus: client.paymentStatus,
      },
      financial: {
        margin,
        invoices: {
          total: invoices.length,
          open: invoices.filter((i) => i.status === InvoiceStatus.OPEN).length,
          paid: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
          overdue: invoices.filter((i) => i.status === InvoiceStatus.OVERDUE)
            .length,
          totalValue: invoices.reduce(
            (sum, i) =>
              sum +
              (typeof i.total === 'object' ? i.total.toNumber() : i.total),
            0
          ),
        },
        transactions: {
          total: transactions.length,
          income: transactions.filter((t) => t.type === TransactionType.INCOME)
            .length,
          expenses: transactions.filter(
            (t) => t.type === TransactionType.EXPENSE
          ).length,
        },
        costs: {
          subscriptions: costSubscriptions.length,
          monthlyTotal: costSubscriptions.reduce(
            (sum, s) => sum + (s.costItem?.amount || 0),
            0
          ),
        },
      },
      pendingInstallments: client.installments,
      detailedInvoices: invoices,
      detailedTransactions: transactions,
      costDetails: costSubscriptions,
    }
  }

  static async getMonthlyReport(orgId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [
      transactionSummary,
      invoicesByStatus,
      topClients,
      expensesByCategory,
    ] = await Promise.all([
      TransactionService.getSummary(orgId, startDate, endDate),
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          orgId,
          issueDate: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      this.getTopClientsByRevenue(orgId, startDate, endDate, 5),
      prisma.transaction.groupBy({
        by: ['category'],
        where: {
          orgId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.CONFIRMED,
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ])

    return {
      period: { month, year, startDate, endDate },
      summary: transactionSummary,
      invoices: invoicesByStatus.map((item) => ({
        status: item.status,
        count: item._count,
        total: item._sum.total || 0,
      })),
      topClients,
      expenseBreakdown: expensesByCategory.map((item) => ({
        category: item.category || 'Sem categoria',
        amount: item._sum.amount || 0,
        count: item._count,
      })),
    }
  }

  static async getGlobalSummary(orgId: string, year?: number) {
    const baseWhere: Prisma.TransactionWhereInput = {
      orgId,
      deletedAt: null,
      status: TransactionStatus.CONFIRMED,
    }
    const [overallIncome, overallExpense, minMax] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: baseWhere,
        _min: { date: true },
        _max: { date: true },
      }),
    ])

    const overallTotalIncome = overallIncome._sum.amount || 0
    const overallTotalExpense = overallExpense._sum.amount || 0
    const overallNet = overallTotalIncome - overallTotalExpense
    const overallMargin =
      overallTotalIncome > 0 ? (overallNet / overallTotalIncome) * 100 : 0

    const now = new Date()
    const y = year || now.getFullYear()
    const startOfYear = new Date(y, 0, 1, 0, 0, 0, 0)
    const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999)

    const monthSeries: Array<any> = []
    for (let m = 0; m < 12; m++) {
      const start = new Date(y, m, 1, 0, 0, 0, 0)
      const lastDay = new Date(y, m + 1, 0)
      const end = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate(),
        23,
        59,
        59,
        999
      )

      const [mi, me] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            ...baseWhere,
            type: TransactionType.INCOME,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            ...baseWhere,
            type: TransactionType.EXPENSE,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
      ])

      const income = mi._sum.amount || 0
      const expense = me._sum.amount || 0
      const net = income - expense
      const profitMargin = income > 0 ? (net / income) * 100 : 0

      monthSeries.push({ month: m + 1, income, expense, net, profitMargin })
    }

    const yearIncome = monthSeries.reduce((s, r) => s + r.income, 0)
    const yearExpense = monthSeries.reduce((s, r) => s + r.expense, 0)
    const yearNet = yearIncome - yearExpense
    const yearMargin = yearIncome > 0 ? (yearNet / yearIncome) * 100 : 0

    return {
      overall: {
        totalIncome: overallTotalIncome,
        incomeCount: overallIncome._count,
        totalExpense: overallTotalExpense,
        expenseCount: overallExpense._count,
        netProfit: overallNet,
        profitMargin: overallMargin,
        firstDate: minMax._min.date || null,
        lastDate: minMax._max.date || null,
      },
      year: {
        year: y,
        totalIncome: yearIncome,
        totalExpense: yearExpense,
        netProfit: yearNet,
        profitMargin: yearMargin,
      },
      monthly: monthSeries,
      period: { start: startOfYear, end: endOfYear },
    }
  }

  /**
   * Busca dados completos do dashboard de um cliente específico
   * Consolidação de todas as métricas relacionadas ao cliente
   */
  static async getClientDashboard(
    orgId: string,
    clientId: string,
    now: Date = new Date()
  ) {
    // 1. Buscar cliente
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { media: true },
    })

    if (!client || client.orgId !== orgId) {
      throw new Error('Cliente não encontrado ou sem acesso')
    }

    // 2. Buscar tarefas do cliente
    const tasks = await prisma.task.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    // 3. Buscar reuniões
    const meetings = await prisma.meeting.findMany({
      where: { clientId },
      orderBy: { startTime: 'asc' },
    })

    // 4. Buscar transações financeiras
    const transactions = await prisma.transaction.findMany({
      where: { clientId, deletedAt: null },
    })

    // 5. Buscar faturas
    const invoices = await prisma.invoice.findMany({
      where: { clientId },
    })

    // 6. Buscar mídias
    const mediaByType = await prisma.media.groupBy({
      by: ['type'],
      where: { clientId },
      _count: true,
    })

    // 7. Calcular estatísticas de tarefas
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => ['done', 'completed'].includes(t.status))
        .length,
      inProgress: tasks.filter((t) =>
        ['in_progress', 'in-progress'].includes(t.status)
      ).length,
      pending: tasks.filter((t) => ['pending', 'todo'].includes(t.status))
        .length,
      overdue: tasks.filter(
        (t) =>
          !['done', 'completed'].includes(t.status) &&
          t.dueDate &&
          t.dueDate.getTime() < now.getTime()
      ).length,
      urgent: tasks.filter((t) => {
        if (['done', 'completed'].includes(t.status)) return false
        if (t.priority !== 'HIGH' && t.priority !== 'URGENT') return false
        if (t.dueDate && t.dueDate.getTime() - now.getTime() < 86400000)
          return true // < 1 dia
        return false
      }).length,
    }

    // 8. Calcular estatísticas de reuniões
    const meetingStats = {
      total: meetings.length,
      upcoming: meetings.filter(
        (m) => new Date(m.startTime).getTime() > now.getTime()
      ).length,
      past: meetings.filter(
        (m) => new Date(m.startTime).getTime() <= now.getTime()
      ).length,
    }

    // 9. Calcular estatísticas financeiras
    const financialStats = {
      income: transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      expense: transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      net: 0, // Calculado abaixo
    }
    financialStats.net = financialStats.income - financialStats.expense

    // 10. Calcular estatísticas de mídia
    const mediaStats = {
      total: mediaByType.reduce((sum, m) => sum + m._count, 0),
      images: mediaByType.find((m) => m.type === 'image')?._count || 0,
      videos: mediaByType.find((m) => m.type === 'video')?._count || 0,
      documents: mediaByType.find((m) => m.type === 'document')?._count || 0,
    }

    // 11. Calcular tendências 30d
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const tasksLast30d = tasks.filter(
      (t) => new Date(t.createdAt).getTime() >= thirtyDaysAgo.getTime()
    )
    const meetingsLast30d = meetings.filter(
      (m) => new Date(m.startTime).getTime() >= thirtyDaysAgo.getTime()
    )
    const mediaLast30d = await prisma.media.count({
      where: {
        clientId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })
    const transactionsLast30d = transactions.filter(
      (t) => new Date(t.date).getTime() >= thirtyDaysAgo.getTime()
    )

    const trends = {
      tasksCreated30dPct:
        tasks.length > 0
          ? Math.round((tasksLast30d.length / tasks.length) * 100)
          : 0,
      meetings30dPct:
        meetings.length > 0
          ? Math.round((meetingsLast30d.length / meetings.length) * 100)
          : 0,
      media30dPct:
        mediaStats.total > 0
          ? Math.round((mediaLast30d / mediaStats.total) * 100)
          : 0,
      financeNet30dPct:
        transactions.length > 0
          ? transactionsLast30d.length > 0
            ? Math.round(
                (transactionsLast30d.length / transactions.length) * 100
              )
            : 0
          : 0,
    }

    // 12. Compilar alertas
    const alerts: Array<{
      tone: 'danger' | 'warning' | 'info'
      label: string
      href: string
    }> = []
    if (taskStats.overdue > 0) {
      alerts.push({
        tone: 'danger',
        label: `${taskStats.overdue} tarefa(s) atrasada(s)`,
        href: `/clients/${clientId}/tasks`,
      })
    }
    if (financialStats.net < 0) {
      alerts.push({
        tone: 'danger',
        label: 'Balanço financeiro negativo',
        href: `/clients/${clientId}/billing`,
      })
    }
    if (client.contractEnd) {
      const diffDays = Math.ceil(
        (new Date(client.contractEnd).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (diffDays > 0 && diffDays <= 15) {
        alerts.push({
          tone: 'warning',
          label: `Contrato vence em ${diffDays} dia(s)`,
          href: `/clients/${clientId}/billing`,
        })
      }
    }
    if (!client.instagramAccessToken) {
      alerts.push({
        tone: 'info',
        label: 'Instagram não conectado',
        href: `/clients/${clientId}/settings`,
      })
    } else if (client.instagramTokenExpiresAt) {
      const daysUntilExpiry = Math.ceil(
        (new Date(client.instagramTokenExpiresAt).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (daysUntilExpiry <= 7) {
        alerts.push({
          tone: 'warning',
          label: `Token do Instagram expira em ${daysUntilExpiry} dia(s)`,
          href: `/clients/${clientId}/settings`,
        })
      }
    }

    // 13. Tarefas urgentes
    const urgentTasks = tasks
      .filter(
        (t) =>
          !['done', 'completed'].includes(t.status) &&
          ((t.priority && (t.priority === 'HIGH' || t.priority === 'URGENT')) ||
            (t.dueDate && t.dueDate.getTime() < now.getTime()))
      )
      .sort((a, b) => {
        const aScore =
          (a.priority && (a.priority === 'HIGH' || a.priority === 'URGENT')
            ? 10
            : 0) + (a.dueDate && a.dueDate.getTime() < now.getTime() ? 5 : 0)
        const bScore =
          (b.priority && (b.priority === 'HIGH' || b.priority === 'URGENT')
            ? 10
            : 0) + (b.dueDate && b.dueDate.getTime() < now.getTime() ? 5 : 0)
        return bScore - aScore
      })
      .slice(0, 5)

    // 14. Próxima reunião agendada
    const upcomingMeetings = meetings.filter(
      (m) => new Date(m.startTime).getTime() > now.getTime()
    )
    const nextMeeting =
      upcomingMeetings.length > 0
        ? upcomingMeetings.sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )[0]
        : null

    // 15. Próximo vencimento
    let nextDueDate: Date | null = null
    if (client.paymentDay) {
      const year = now.getFullYear()
      const month = now.getMonth()
      const day = Number(client.paymentDay)
      const candidate = new Date(year, month, day)
      if (candidate >= new Date(year, month, now.getDate())) {
        nextDueDate = candidate
      } else {
        nextDueDate = new Date(year, month + 1, day)
      }
    }

    // 16. Calcular dias ativos
    const daysActive = client.createdAt
      ? Math.floor(
          (now.getTime() - new Date(client.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    return {
      client,
      tasks,
      meetings,
      transactions,
      invoices,
      counts: {
        tasks: taskStats,
        meetings: meetingStats,
        finance: {
          income: financialStats.income,
          expense: financialStats.expense,
          net: financialStats.net,
        },
        media: mediaStats,
      },
      trends,
      alerts,
      urgentTasks,
      nextMeeting,
      nextDueDate,
      daysActive,
    }
  }
}

export default ReportingService
