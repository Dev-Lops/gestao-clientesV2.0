import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

/**
 * Backfill: cria transações de receita (INCOME) para faturas já pagas (PAID)
 * que ainda não possuem lançamento em `Transaction`.
 *
 * Uso:
 * pnpm tsx scripts/backfill_invoice_income_transactions.ts <orgId> [--year 2025] [--months 10,11] [--dry-run]
 */
async function backfill(
  orgId: string,
  opts: { year?: number; months?: number[]; dryRun?: boolean }
) {
  const { year, months, dryRun } = opts

  const wherePaid: any = {
    orgId,
    status: 'PAID',
    deletedAt: null,
  }

  if (year) {
    // Se ano informado e months opcional, filtra por paidAt no(s) mês(es)
    if (months && months.length > 0) {
      // Buscaremos por intervalo por mês individualmente
    } else {
      const start = new Date(year, 0, 1, 0, 0, 0, 0)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      wherePaid.paidAt = { gte: start, lte: end }
    }
  }

  const toProcess: {
    id: string
    number: string
    total: number
    paidAt: Date | null
    dueDate: Date
    clientId: string
    clientName: string
  }[] = []

  if (months && months.length > 0 && year) {
    for (const m of months) {
      const start = new Date(year, m - 1, 1, 0, 0, 0, 0)
      const lastDay = new Date(year, m, 0)
      const end = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate(),
        23,
        59,
        59,
        999
      )
      const invoices = await prisma.invoice.findMany({
        where: { ...wherePaid, paidAt: { gte: start, lte: end } },
        select: {
          id: true,
          number: true,
          total: true,
          dueDate: true,
          paidAt: true,
          clientId: true,
          client: { select: { name: true } },
        },
        orderBy: { paidAt: 'asc' },
      })
      for (const i of invoices) {
        toProcess.push({
          id: i.id,
          number: i.number,
          total: i.total,
          paidAt: i.paidAt,
          dueDate: i.dueDate,
          clientId: i.clientId,
          clientName: i.client?.name || 'Cliente',
        })
      }
    }
  } else {
    const invoices = await prisma.invoice.findMany({
      where: wherePaid,
      select: {
        id: true,
        number: true,
        total: true,
        dueDate: true,
        paidAt: true,
        clientId: true,
        client: { select: { name: true } },
      },
      orderBy: { paidAt: 'asc' },
    })
    for (const i of invoices) {
      toProcess.push({
        id: i.id,
        number: i.number,
        total: i.total,
        paidAt: i.paidAt,
        dueDate: i.dueDate,
        clientId: i.clientId,
        clientName: i.client?.name || 'Cliente',
      })
    }
  }

  console.log(`Encontradas ${toProcess.length} faturas pagas para verificar.`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const inv of toProcess) {
    try {
      const existing = await prisma.transaction.findFirst({
        where: {
          orgId,
          invoiceId: inv.id,
          type: TransactionType.INCOME,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (existing) {
        skipped++
        continue
      }

      const txDate = inv.paidAt ?? inv.dueDate

      if (dryRun) {
        console.log(
          `[DRY-RUN] Criaria INCOME para fatura ${inv.number} | ${inv.clientName} | R$ ${inv.total.toFixed(2)} | data ${txDate.toISOString().slice(0, 10)}`
        )
        created++
        continue
      }

      await prisma.transaction.create({
        data: {
          orgId,
          clientId: inv.clientId,
          invoiceId: inv.id,
          type: TransactionType.INCOME,
          subtype: TransactionSubtype.INVOICE_PAYMENT,
          amount: inv.total,
          description: `Pagamento da fatura ${inv.number} - ${inv.clientName}`,
          category: 'RECEITA_CLIENTE',
          date: txDate,
          status: TransactionStatus.CONFIRMED,
          metadata: {
            invoiceNumber: inv.number,
            clientName: inv.clientName,
            source: 'backfill',
          },
        },
      })
      created++
    } catch (e) {
      errors++
      console.error(`Erro ao criar transação para fatura ${inv.number}:`, e)
    }
  }

  console.log(`\nResumo:`)
  console.log(`  Criadas: ${created}`)
  console.log(`  Ignoradas (já tinham transação): ${skipped}`)
  console.log(`  Erros: ${errors}`)
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const orgId = args.find((a) => !a.startsWith('--'))
  const yearIdx = args.findIndex((a) => a === '--year')
  const monthsIdx = args.findIndex((a) => a === '--months')

  const year = yearIdx !== -1 ? Number(args[yearIdx + 1]) : undefined
  const months =
    monthsIdx !== -1
      ? args[monthsIdx + 1].split(',').map((m) => Number(m.trim()))
      : undefined

  if (!orgId) {
    console.error(
      'Uso: pnpm tsx scripts/backfill_invoice_income_transactions.ts <orgId> [--year 2025] [--months 10,11] [--dry-run]'
    )
    process.exit(1)
  }
  return { orgId, year, months, dryRun }
}

async function main() {
  const { orgId, year, months, dryRun } = parseArgs(process.argv)
  try {
    await backfill(orgId, { year, months, dryRun })
  } finally {
    await prisma.$disconnect()
  }
}

main()
