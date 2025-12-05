import { prisma } from '../src/lib/prisma'

/**
 * Script para corrigir data de pagamento de faturas antigas
 * Atualiza paidAt para dueDate apenas em faturas não-futuras (já vencidas ou do mês atual)
 */
async function fixInvoicePaymentDates(orgId: string, dryRun: boolean = false) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`CORREÇÃO DE DATAS DE PAGAMENTO DE FATURAS`)
  console.log(`${'='.repeat(70)}`)
  console.log(`Organização: ${orgId}`)
  console.log(`Modo: ${dryRun ? 'DRY-RUN (simulação)' : 'PRODUÇÃO'}`)
  console.log(`${'='.repeat(70)}\n`)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Buscar faturas pagas onde paidAt é diferente de dueDate
  // e dueDate é no passado ou presente (não futuras)
  const invoices = await prisma.$queryRaw<
    Array<{
      id: string
      number: string
      dueDate: Date
      paidAt: Date | null
      clientId: string
      clientName: string
    }>
  >`
    SELECT 
      i.id,
      i.number,
      i."dueDate",
      i."paidAt",
      i."clientId",
      c.name as "clientName"
    FROM "Invoice" i
    LEFT JOIN "Client" c ON c.id = i."clientId"
    WHERE i."orgId" = ${orgId}
      AND i.status = 'PAID'
      AND i."deletedAt" IS NULL
      AND i."dueDate" <= ${today}
      AND (i."paidAt" IS NULL OR i."paidAt" != i."dueDate")
    ORDER BY i."dueDate" ASC
  `

  console.log(`📊 Encontradas ${invoices.length} faturas para corrigir\n`)

  if (invoices.length === 0) {
    console.log('✅ Nenhuma fatura precisa de correção!')
    return
  }

  let updated = 0
  let errors = 0

  for (const invoice of invoices) {
    try {
      const oldPaidAt = invoice.paidAt
      const newPaidAt = invoice.dueDate

      // Verificar se realmente precisa atualizar
      if (oldPaidAt && oldPaidAt.getTime() === newPaidAt.getTime()) {
        console.log(
          `⏭️  Fatura #${invoice.number} já está correta - ${invoice.clientName}`
        )
        continue
      }

      if (!dryRun) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAt: newPaidAt,
          },
        })
      }

      console.log(
        `${dryRun ? '[DRY-RUN] ' : ''}✅ Fatura #${invoice.number} - ${invoice.clientName}`
      )
      console.log(`   Vencimento: ${newPaidAt.toISOString().split('T')[0]}`)
      if (oldPaidAt) {
        console.log(
          `   Pagamento ANTES: ${oldPaidAt.toISOString().split('T')[0]}`
        )
      }
      console.log(
        `   Pagamento DEPOIS: ${newPaidAt.toISOString().split('T')[0]}`
      )
      console.log('')

      updated++
    } catch (error) {
      console.error(`❌ Erro ao atualizar fatura #${invoice.number}:`, error)
      errors++
    }
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log(`RESUMO`)
  console.log(`${'='.repeat(70)}`)
  console.log(`✅ Atualizadas: ${updated}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📊 Total processadas: ${invoices.length}`)
  console.log(`${'='.repeat(70)}\n`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRunIdx = args.indexOf('--dry-run')
  const isDryRun = dryRunIdx !== -1

  const cleanArgs = args.filter((arg) => arg !== '--dry-run')
  const orgId = cleanArgs[0]

  if (!orgId) {
    console.error('❌ Erro: orgId é obrigatório')
    console.log(
      'Uso: pnpm tsx scripts/fix_invoice_dates.ts <orgId> [--dry-run]'
    )
    process.exit(1)
  }

  try {
    await fixInvoicePaymentDates(orgId, isDryRun)
  } catch (error) {
    console.error('❌ Erro ao corrigir datas:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
