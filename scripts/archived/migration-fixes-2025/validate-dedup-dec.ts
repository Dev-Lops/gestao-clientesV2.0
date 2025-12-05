import { prisma } from '../src/lib/prisma'

async function main() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'
  const monthStart = new Date('2025-12-01')
  const monthEnd = new Date('2025-12-31T23:59:59.999Z')

  const payments = await prisma.payment.findMany({
    where: {
      client: { orgId },
      status: { in: ['PAID', 'CONFIRMED', 'VERIFIED'] },
      paidAt: { gte: monthStart, lte: monthEnd },
    },
    select: { id: true, amount: true, invoiceId: true },
  })

  const monthFinancesIncome = await prisma.finance.findMany({
    where: {
      client: { orgId },
      type: 'income',
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { id: true, amount: true, invoiceId: true },
  })

  const monthExpenses = await prisma.finance.findMany({
    where: {
      client: { orgId },
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { amount: true },
  })

  const revenueMap = new Map<string, number>()

  for (const f of monthFinancesIncome) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    revenueMap.set(key, (revenueMap.get(key) || 0) + f.amount)
  }

  for (const p of payments) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && revenueMap.has(`inv:${p.invoiceId}`)) continue
    revenueMap.set(key, (revenueMap.get(key) || 0) + p.amount)
  }

  const receitas = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)
  const despesas = monthExpenses.reduce((s, e) => s + e.amount, 0)

  console.log(
    JSON.stringify(
      {
        receitas,
        despesas,
        receitasBreakdown: Array.from(revenueMap.entries()),
        payments,
        monthFinancesIncome,
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
