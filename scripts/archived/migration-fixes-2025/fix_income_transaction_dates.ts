import { TransactionSubtype, TransactionType } from '@prisma/client'
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

/**
 * Alinha a data das transações de receita (INVOICE_PAYMENT)
 * com a data de pagamento da fatura (paidAt) ou dueDate.
 *
 * Uso:
 * pnpm tsx scripts/fix_income_transaction_dates.ts <orgId> [--year 2025] [--months 10,11] [--dry-run]
 */
async function run(
  orgId: string,
  opts: { year?: number; months?: number[]; dryRun?: boolean }
) {
  const { year, months, dryRun } = opts

  type Row = {
    txId: string
    txDate: Date
    invoiceId: string
    paidAt: Date | null
    dueDate: Date
    number: string
    clientName: string | null
  }

  const rows: Row[] = []

  if (year && months && months.length > 0) {
    for (const m of months) {
      const start = new Date(year, m - 1, 1, 0, 0, 0, 0)
      const last = new Date(year, m, 0)
      const end = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate(),
        23,
        59,
        59,
        999
      )

      const res = await prisma.$queryRaw<Row[]>`
        SELECT 
          t.id as "txId",
          t.date as "txDate",
          i.id as "invoiceId",
          i."paidAt" as "paidAt",
          i."dueDate" as "dueDate",
          i.number as "number",
          c.name as "clientName"
        FROM "Transaction" t
        JOIN "Invoice" i ON i.id = t."invoiceId"
        LEFT JOIN "Client" c ON c.id = i."clientId"
        WHERE t."orgId" = ${orgId}
          AND t.type = ${TransactionType.INCOME}
          AND t.subtype = ${TransactionSubtype.INVOICE_PAYMENT}
          AND t."deletedAt" IS NULL
          AND i.status = 'PAID'
          AND i."paidAt" IS NOT NULL
          AND i."paidAt" >= ${start} AND i."paidAt" <= ${end}
      `
      rows.push(...res)
    }
  } else {
    const res = await prisma.$queryRaw<Row[]>`
      SELECT 
        t.id as "txId",
        t.date as "txDate",
        i.id as "invoiceId",
        i."paidAt" as "paidAt",
        i."dueDate" as "dueDate",
        i.number as "number",
        c.name as "clientName"
      FROM "Transaction" t
      JOIN "Invoice" i ON i.id = t."invoiceId"
      LEFT JOIN "Client" c ON c.id = i."clientId"
      WHERE t."orgId" = ${orgId}
        AND t.type = ${TransactionType.INCOME}
        AND t.subtype = ${TransactionSubtype.INVOICE_PAYMENT}
        AND t."deletedAt" IS NULL
        AND i.status = 'PAID'
        AND i."paidAt" IS NOT NULL
    `
    rows.push(...res)
  }

  console.log(`Encontradas ${rows.length} transações para verificar.`)

  let updated = 0
  let skipped = 0
  for (const r of rows) {
    const shouldDate = r.paidAt ?? r.dueDate
    if (!shouldDate) {
      skipped++
      continue
    }
    // Se diferente de dia (data) que deveria ser
    const txD = new Date(r.txDate)
    const sd = new Date(shouldDate)
    if (txD.getTime() === sd.getTime()) {
      skipped++
      continue
    }

    if (dryRun) {
      console.log(
        `[DRY-RUN] Atualizaria ${r.number} (${r.clientName || 'Cliente'}) -> ${txD.toISOString().slice(0, 10)} => ${sd.toISOString().slice(0, 10)}`
      )
      updated++
      continue
    }

    await prisma.transaction.update({
      where: { id: r.txId },
      data: { date: sd },
    })
    updated++
  }

  console.log(`\nResumo:`)
  console.log(`  Atualizadas: ${updated}`)
  console.log(`  Sem mudança: ${skipped}`)
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
      'Uso: pnpm tsx scripts/fix_income_transaction_dates.ts <orgId> [--year 2025] [--months 10,11] [--dry-run]'
    )
    process.exit(1)
  }
  return { orgId, year, months, dryRun }
}

async function main() {
  const { orgId, year, months, dryRun } = parseArgs(process.argv)
  try {
    await run(orgId, { year, months, dryRun })
  } finally {
    await prisma.$disconnect()
  }
}

main()
