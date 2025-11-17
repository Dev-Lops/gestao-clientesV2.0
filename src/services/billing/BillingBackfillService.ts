import { prisma } from '@/lib/prisma'

type BackfillMode = 'installments' | 'finance' | 'all'

export class BillingBackfillService {
  static async backfill(
    orgId: string,
    mode: BackfillMode = 'installments',
    dryRun = false
  ) {
    const result = {
      invoicesCreated: 0,
      paymentsCreated: 0,
      skipped: 0,
    }

    if (mode === 'installments' || mode === 'all') {
      const installments = await prisma.installment.findMany({
        where: { client: { orgId } },
        include: { client: true },
        orderBy: { dueDate: 'asc' },
      })

      for (const inst of installments) {
        const marker = `installment:${inst.id}`
        const exists = await prisma.invoice.findFirst({
          where: {
            orgId,
            clientId: inst.clientId,
            notes: { contains: marker },
          },
        })
        if (exists) {
          result.skipped++
          continue
        }

        const status =
          inst.status === 'CONFIRMED'
            ? 'PAID'
            : new Date(inst.dueDate) < new Date()
              ? 'OVERDUE'
              : 'OPEN'
        const number = `INV-BF-${new Date(inst.dueDate).getFullYear()}${String(new Date(inst.dueDate).getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

        if (!dryRun) {
          const created = await prisma.invoice.create({
            data: {
              orgId,
              clientId: inst.clientId,
              number,
              status,
              issueDate: new Date(inst.dueDate),
              dueDate: new Date(inst.dueDate),
              subtotal: inst.amount,
              discount: 0,
              tax: 0,
              total: inst.amount,
              currency: 'BRL',
              notes: `Backfill parcela ${inst.number} — ${inst.client.name} | ${marker}`,
              items: {
                create: [
                  {
                    description: `Parcela ${inst.number}`,
                    quantity: 1,
                    unitAmount: inst.amount,
                    total: inst.amount,
                  },
                ],
              },
            },
          })
          result.invoicesCreated++

          if (inst.status === 'CONFIRMED') {
            await prisma.payment.create({
              data: {
                orgId,
                clientId: inst.clientId,
                invoiceId: created.id,
                amount: inst.amount,
                method: 'manual',
                status: 'PAID',
                paidAt: inst.paidAt ?? new Date(),
                provider: 'legacy',
              },
            })
            result.paymentsCreated++
          }
        } else {
          // dry-run still counts as would create
          result.invoicesCreated++
          if (inst.status === 'CONFIRMED') result.paymentsCreated++
        }
      }
    }

    if (mode === 'finance' || mode === 'all') {
      // Conservative: only backfill finance incomes that clearly aren't from parcelas/mensalidade
      const finances = await prisma.finance.findMany({
        where: {
          orgId,
          type: 'income',
        },
        orderBy: { date: 'asc' },
      })

      for (const f of finances) {
        if (!f.clientId) {
          result.skipped++
          continue
        }
        const desc = (f.description || '').toLowerCase()
        if (
          desc.includes('parcela') ||
          desc.includes('mensalidade') ||
          desc.includes('pagamento fatura')
        ) {
          result.skipped++
          continue
        }
        const marker = `legacy-finance:${f.id}`
        const exists = await prisma.invoice.findFirst({
          where: { orgId, clientId: f.clientId, notes: { contains: marker } },
        })
        if (exists) {
          result.skipped++
          continue
        }

        const number = `INV-BF-${f.date.getFullYear()}${String(f.date.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

        if (!dryRun) {
          const created = await prisma.invoice.create({
            data: {
              orgId,
              clientId: f.clientId,
              number,
              status: 'PAID',
              issueDate: f.date,
              dueDate: f.date,
              subtotal: f.amount,
              discount: 0,
              tax: 0,
              total: f.amount,
              currency: 'BRL',
              notes: `Backfill receita avulsa | ${marker}`,
              items: {
                create: [
                  {
                    description: f.description || 'Receita (legado)',
                    quantity: 1,
                    unitAmount: f.amount,
                    total: f.amount,
                  },
                ],
              },
            },
          })
          await prisma.payment.create({
            data: {
              orgId,
              clientId: f.clientId,
              invoiceId: created.id,
              amount: f.amount,
              method: 'manual',
              status: 'PAID',
              paidAt: f.date,
              provider: 'legacy',
            },
          })
          result.invoicesCreated++
          result.paymentsCreated++
        } else {
          result.invoicesCreated++
          result.paymentsCreated++
        }
      }
    }

    return result
  }
}
