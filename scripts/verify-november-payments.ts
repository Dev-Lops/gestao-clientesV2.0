/**
 * Script: verify-november-payments.ts
 * Objetivo: Listar clientes/org com pagamentos (Payment.status = PAID) efetuados em novembro
 *           e validar se as faturas vinculadas:
 *             - Estão com status PAID
 *             - Possuem tag period:YYYY-11 nas notes (mensalidade)
 *           Reporta também faturas PAID em novembro sem a tag de período.
 *
 * Uso:
 *   ORG_ID=<id-da-org> pnpm exec tsx scripts/verify-november-payments.ts
 *
 * Saída:
 *   - Resumo de quantidade de pagamentos
 *   - Lista agrupada por cliente
 *   - Faturas com inconsistências
 */
import { prisma } from '@/lib/prisma'

async function main() {
  const orgId = process.env.ORG_ID
  if (!orgId) {
    console.error('Defina ORG_ID no ambiente.')
    process.exit(1)
  }

  const now = new Date()
  const year = now.getFullYear()
  const monthIndex = 10 // Novembro (0-based)
  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0)
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59)
  const periodKey = `${year}-11`

  // Pagamentos confirmados em novembro
  const payments = await prisma.payment.findMany({
    where: {
      orgId,
      status: 'PAID',
      paidAt: { gte: monthStart, lte: monthEnd },
    },
    include: { invoice: true, client: true },
    orderBy: { paidAt: 'asc' },
  })

  if (!payments.length) {
    console.log('Nenhum pagamento PAID encontrado em novembro.')
    return
  }

  // Agrupar por cliente
  const byClient = new Map<
    string,
    { clientName: string; payments: typeof payments }
  >()
  for (const p of payments) {
    const key = p.clientId
    const entry = byClient.get(key)
    if (!entry) {
      byClient.set(key, {
        clientName: p.client?.name || 'Desconhecido',
        payments: [p],
      })
    } else {
      entry.payments.push(p)
    }
  }

  // Coletar inconsistências
  const missingPeriodTag: string[] = []
  const invoiceNotPaid: string[] = []

  for (const p of payments) {
    const inv = p.invoice
    if (!inv) continue
    if (inv.status !== 'PAID') invoiceNotPaid.push(inv.number)
    if (!inv.notes || !inv.notes.includes(`period:${periodKey}`))
      missingPeriodTag.push(inv.number)
  }

  console.log(`Resumo Novembro ${periodKey}`)
  console.log(`Pagamentos PAID: ${payments.length}`)
  console.log(`Clientes envolvidos: ${byClient.size}`)
  console.log('—')

  for (const [clientId, data] of byClient.entries()) {
    const totalClient = data.payments.reduce((s, p) => s + p.amount, 0)
    console.log(
      `Cliente: ${data.clientName} (${clientId}) | Pagamentos: ${data.payments.length} | Total: R$ ${totalClient.toFixed(2)}`
    )
    for (const p of data.payments) {
      console.log(
        `  • ${p.invoice.number} valor R$ ${p.amount.toFixed(2)} paidAt=${p.paidAt?.toISOString().slice(0, 10)} statusFatura=${p.invoice.status} tagPeriod=${p.invoice.notes?.includes(`period:${periodKey}`) ? 'OK' : 'FALTA'}`
      )
    }
  }

  console.log('\nInconsistências:')
  if (!invoiceNotPaid.length && !missingPeriodTag.length) {
    console.log('Nenhuma.')
  } else {
    if (invoiceNotPaid.length) {
      console.log(`Faturas com status != PAID: ${invoiceNotPaid.join(', ')}`)
    }
    if (missingPeriodTag.length) {
      console.log(
        `Faturas sem tag period:${periodKey}: ${missingPeriodTag.join(', ')}`
      )
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
