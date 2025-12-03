import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'read', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  const url = new URL(req.url)
  const month = url.searchParams.get('month') // YYYY-MM
  const now = new Date()
  const [y, m] = (
    month ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
    .split('-')
    .map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59, 999)

  const [
    paymentsAgg,
    expensesAgg,
    paidInvoicesCount,
    overdueInvoicesCount,
    fixedExpenses,
  ] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { orgId, status: 'PAID', paidAt: { gte: start, lte: end } },
    }),
    prisma.finance.aggregate({
      _sum: { amount: true },
      where: { orgId, type: 'expense', date: { gte: start, lte: end } },
    }),
    prisma.invoice.count({
      where: {
        orgId,
        status: 'PAID',
        payments: { some: { paidAt: { gte: start, lte: end } } },
      },
    }),
    prisma.invoice.count({
      where: { orgId, status: 'OVERDUE', dueDate: { lte: end } },
    }),
    prisma.fixedExpense.findMany({ where: { orgId, active: true } }),
  ])

  const fixedMonthly = fixedExpenses
    .filter((e) => e.cycle === 'MONTHLY')
    .reduce((acc, e) => acc + e.amount, 0)

  const grossRevenue = paymentsAgg._sum.amount || 0
  const variableExpenses = expensesAgg._sum.amount || 0
  const totalExpenses = variableExpenses + fixedMonthly
  const netProfit = grossRevenue - totalExpenses

  return NextResponse.json({
    month: `${y}-${String(m).padStart(2, '0')}`,
    grossRevenue,
    variableExpenses,
    fixedMonthly,
    totalExpenses,
    netProfit,
    paidInvoicesCount,
    overdueInvoicesCount,
  })
}
