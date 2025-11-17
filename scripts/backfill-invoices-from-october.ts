/**
 * Backfill invoices for payments made from October (month 10) onward that already have values registered
 * but might lack a formal invoice record following new billing flows.
 *
 * Strategy:
 * - Find all payments from 1 Oct current year where the linked invoice still exists (skip if already PAID invoice present)
 * - If payment.invoiceId references an invoice: skip (already linked)
 *   (In schema Payment requires invoiceId, so missing invoiceId payments do not exist — alternative: generate invoices for clients with payments but without an OPEN/PAID invoice in that month.)
 * - So we instead: for each client with at least one finance income (category Mensalidade) paid since Oct and NO invoice with notes period:YYYY-MM for that month
 *   create a zero-total invoice marked PAID and link a synthetic payment (0 amount) just to formalize invoice registry without duplicating value.
 * - This preserves existing finance entries and avoids double counting.
 */
import { prisma } from '@/lib/prisma'

async function main() {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 9, 1) // October is month index 9

  // Fetch all income finance rows (Mensalidade) from Oct to now grouped by client+month
  const finances = await prisma.finance.findMany({
    where: {
      type: 'income',
      category: { contains: 'Mensal', mode: 'insensitive' },
      date: { gte: start },
    },
    select: { clientId: true, orgId: true, date: true, amount: true },
  })

  const groups = new Map<
    string,
    { clientId: string; orgId: string; monthKey: string; anyDate: Date }
  >()
  for (const f of finances) {
    if (!f.clientId) continue
    const d = new Date(f.date)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const key = `${f.orgId}:${f.clientId}:${monthKey}`
    if (!groups.has(key)) {
      groups.set(key, {
        clientId: f.clientId,
        orgId: f.orgId,
        monthKey,
        anyDate: d,
      })
    }
  }

  let createdCount = 0
  for (const g of groups.values()) {
    // Check if invoice already exists for that period (using notes period tag or matching issueDate month)
    const existing = await prisma.invoice.findFirst({
      where: {
        orgId: g.orgId,
        clientId: g.clientId,
        OR: [
          { notes: { contains: `period:${g.monthKey}` } },
          {
            AND: [
              {
                issueDate: {
                  gte: new Date(
                    Number(g.monthKey.split('-')[0]),
                    Number(g.monthKey.split('-')[1]) - 1,
                    1
                  ),
                },
              },
              {
                issueDate: {
                  lt: new Date(
                    Number(g.monthKey.split('-')[0]),
                    Number(g.monthKey.split('-')[1]),
                    1
                  ),
                },
              },
            ],
          },
        ],
      },
    })
    if (existing) continue

    const issueDate = new Date(
      Number(g.monthKey.split('-')[0]),
      Number(g.monthKey.split('-')[1]) - 1,
      1
    )
    const dueDate = new Date(issueDate.getFullYear(), issueDate.getMonth(), 10)
    const number = `BF-${g.monthKey}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    await prisma.invoice.create({
      data: {
        orgId: g.orgId,
        clientId: g.clientId,
        number,
        status: 'PAID', // mark as paid since values already registered
        issueDate,
        dueDate,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        currency: 'BRL',
        notes: `Backfill ${g.monthKey} (valores já lançados) | period:${g.monthKey}`,
        // create a zero item so invoice has at least one line, optional
        items: {
          create: [
            {
              description: 'Backfill (valor já lançado) – Mensalidade',
              quantity: 1,
              unitAmount: 0,
              total: 0,
            },
          ],
        },
        payments: {
          create: [
            {
              orgId: g.orgId,
              clientId: g.clientId,
              amount: 0,
              method: 'manual',
              status: 'PAID',
              paidAt: issueDate,
              provider: 'manual',
            },
          ],
        },
      },
    })
    createdCount++
  }

  console.log(`Backfill concluído. Faturas criadas: ${createdCount}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
