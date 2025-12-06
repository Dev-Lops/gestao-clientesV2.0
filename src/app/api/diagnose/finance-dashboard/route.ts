import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import { ReportingService } from '@/domain/reports/ReportingService'
import { prisma } from '@/lib/prisma'
import { TransactionStatus, TransactionType } from '@prisma/client'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request, {
      allowedRoles: ['OWNER'],
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context

    // Mês atual
    const now = new Date()
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    )
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    )

    // 1. Transações confirmadas do período
    const confirmedIncomes = await prisma.transaction.aggregate({
      where: {
        orgId,
        type: TransactionType.INCOME,
        status: TransactionStatus.CONFIRMED,
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
      _count: true,
    })

    const confirmedExpenses = await prisma.transaction.aggregate({
      where: {
        orgId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.CONFIRMED,
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
      _count: true,
    })

    // 2. Invoices do período
    const openInvoices = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: 'OPEN',
        deletedAt: null,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    const overdueInvoices = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: 'OVERDUE',
        deletedAt: null,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    const paidInvoices = await prisma.invoice.aggregate({
      where: {
        orgId,
        status: 'PAID',
        deletedAt: null,
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    })

    // 3. Dados da API
    const dashboard = await ReportingService.getDashboard(
      orgId,
      monthStart,
      monthEnd
    )

    // 4. Cálculos de validação
    const transactionSum =
      (confirmedIncomes._sum.amount || 0) - (confirmedExpenses._sum.amount || 0)
    const invoiceSum =
      (openInvoices._sum.total || 0) + (overdueInvoices._sum.total || 0)
    const expectedLucroPrevisto =
      invoiceSum - (confirmedExpenses._sum.amount || 0)

    const cashMatch =
      Math.abs(
        transactionSum - (dashboard.projections?.cashOnHandMonthly || 0)
      ) < 0.01
    const lucroPrevisoMatch =
      Math.abs(
        expectedLucroPrevisto - (dashboard.projections?.projectedNetProfit || 0)
      ) < 0.01

    return ApiResponseHandler.success({
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      },
      transactions: {
        confirmed_incomes: {
          amount: confirmedIncomes._sum.amount || 0,
          count: confirmedIncomes._count,
        },
        confirmed_expenses: {
          amount: confirmedExpenses._sum.amount || 0,
          count: confirmedExpenses._count,
        },
      },
      invoices: {
        open: {
          amount: openInvoices._sum.total || 0,
          count: openInvoices._count,
        },
        overdue: {
          amount: overdueInvoices._sum.total || 0,
          count: overdueInvoices._count,
        },
        paid: {
          amount: paidInvoices._sum.total || 0,
          count: paidInvoices._count,
        },
      },
      dashboard_api: {
        receitas: dashboard.financial.totalIncome,
        despesas: dashboard.financial.totalExpense,
        lucro_liquido: dashboard.financial.netProfit,
        pending_income: dashboard.financial.pendingIncome,
        pending_expense: dashboard.financial.pendingExpense,
        lucro_previsto: dashboard.projections?.projectedNetProfit,
        em_caixa: dashboard.projections?.cashOnHandMonthly,
        a_receber: dashboard.invoices.totalReceivable,
      },
      validations: {
        cash_calculation_correct: cashMatch,
        lucro_previsto_calculation_correct: lucroPrevisoMatch,
        expected_em_caixa: transactionSum,
        expected_lucro_previsto: expectedLucroPrevisto,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return ApiResponseHandler.error(error, 'Erro ao diagnosticar financeiro')
  }
}
