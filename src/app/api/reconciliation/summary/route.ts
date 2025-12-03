import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Basic reconciliation summary:
  // - count of PAID invoices without linked finance
  // - count of finance incomes without invoiceId
  // - totals per current month for payments vs finances
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  )

  const [paidInvoices, financeWithoutInvoice, monthPayments, monthFinances] =
    await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: 'PAID',
          OR: [{ payments: { none: {} } }, { finances: { none: {} } }],
        },
        select: { id: true },
      }),
      prisma.finance.count({
        where: { type: 'income', invoiceId: null },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.finance.aggregate({
        _sum: { amount: true },
        where: { type: 'income', date: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ])

  const summary = {
    invoicesPaidWithoutLinks: paidInvoices.length,
    financesIncomeWithoutInvoiceId: financeWithoutInvoice,
    currentMonth: {
      paymentsTotal: monthPayments._sum.amount || 0,
      financesIncomeTotal: monthFinances._sum.amount || 0,
      delta:
        (monthPayments._sum.amount || 0) - (monthFinances._sum.amount || 0),
    },
  }

  const guard = guardAccess(req as any)
  if (guard) return guard
  const res = NextResponse.json(summary)
  return applySecurityHeaders(req as any, res)
}
