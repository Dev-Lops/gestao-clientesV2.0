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
    `${now.getFullYear()}-${String(now.getMonth() + 1 + 1).padStart(2, '0')}`
  )
    .split('-')
    .map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59, 999)

  // Receita projetada: clientes ativos com contractValue + parcelas com dueDate no mês
  const [activeClients, installments, fixedExpenses] = await Promise.all([
    prisma.client.findMany({
      where: {
        orgId,
        status: { in: ['active', 'new'] },
        contractValue: { not: null },
      },
      select: { contractValue: true },
    }),
    prisma.installment.findMany({
      where: { client: { orgId }, dueDate: { gte: start, lte: end } },
      select: { amount: true },
    }),
    prisma.fixedExpense.findMany({ where: { orgId, active: true } }),
  ])

  const projectedRevenueFromContracts = activeClients.reduce(
    (acc, c) => acc + (c.contractValue || 0),
    0
  )
  const projectedRevenueFromInstallments = installments.reduce(
    (acc, i) => acc + i.amount,
    0
  )
  const projectedRevenue =
    projectedRevenueFromContracts + projectedRevenueFromInstallments

  const fixedMonthly = fixedExpenses
    .filter((e) => e.cycle === 'MONTHLY')
    .reduce((acc, e) => acc + e.amount, 0)
  const projectedExpenses = fixedMonthly
  const projectedNet = projectedRevenue - projectedExpenses

  return NextResponse.json({
    month: `${y}-${String(m).padStart(2, '0')}`,
    projectedRevenue,
    projectedRevenueFromContracts,
    projectedRevenueFromInstallments,
    projectedExpenses,
    projectedNet,
  })
}
