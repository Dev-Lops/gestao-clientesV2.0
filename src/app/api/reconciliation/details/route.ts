import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // Detailed reconciliation listing for manual review
  // Expensive queries kept simple; consider pagination if dataset grows
  const invoicesPaidWithoutLinks = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      payments: { none: {} },
    },
    select: { id: true, number: true, clientId: true, total: true },
  })

  // Income finances without invoice linkage (could be manual entries)
  const orphanFinances = await prisma.finance.findMany({
    where: { type: 'income', invoiceId: null },
    select: {
      id: true,
      amount: true,
      description: true,
      clientId: true,
      date: true,
    },
    orderBy: { date: 'desc' },
    take: 200,
  })

  // Invoices with multiple finance entries (potential duplication)
  const invoicesWithMultipleFinances = await prisma.invoice.findMany({
    where: { finances: { some: {} } },
    select: {
      id: true,
      number: true,
      clientId: true,
      finances: { select: { id: true, amount: true } },
    },
  })
  const multiFinanceInvoices = invoicesWithMultipleFinances.filter(
    (i) => i.finances.length > 1
  )

  return NextResponse.json({
    invoicesPaidWithoutLinks,
    orphanFinances,
    multiFinanceInvoices,
  })
}
