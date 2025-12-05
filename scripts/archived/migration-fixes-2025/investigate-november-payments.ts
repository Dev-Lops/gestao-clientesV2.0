import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function investigateNovemberPayments() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('            INVESTIGANDO PAYMENTS DE NOVEMBRO')
  console.log('═══════════════════════════════════════════════════════════\n')

  const payments = await pool.query(
    `SELECT p.id, p.amount, p."paidAt", p."invoiceId", i.number as invoice_number, c.name as client_name
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-11-01'
     AND p."paidAt" <= '2025-11-30T23:59:59'
     ORDER BY p."paidAt"`,
    [orgId]
  )

  console.log(`Total: ${payments.rows.length} payments\n`)

  let totalPayments = 0
  let includedPayments = 0
  let ignoredPayments = 0

  for (const p of payments.rows) {
    console.log(`Payment ID: ${p.id}`)
    console.log(`  Data: ${new Date(p.paidAt).toLocaleDateString('pt-BR')}`)
    console.log(`  Valor: R$ ${Number(p.amount).toFixed(2)}`)
    console.log(`  Cliente: ${p.client_name || 'N/A'}`)
    console.log(
      `  Invoice: ${p.invoice_number || 'N/A'} (${p.invoiceId ? p.invoiceId.substring(0, 8) + '...' : 'sem invoice'})`
    )

    totalPayments += Number(p.amount)

    // Verificar se tem Finance
    const finance = await pool.query(
      `SELECT id, amount, description
       FROM "Finance"
       WHERE "orgId" = $1
       AND "invoiceId" = $2
       AND UPPER(type) = 'INCOME'`,
      [orgId, p.invoiceId]
    )

    if (finance.rows.length > 0) {
      console.log(
        `  ⚠️  TEM Finance correspondente - será IGNORADO na deduplicação`
      )
      console.log(`      Finance: ${finance.rows[0].description}`)
      ignoredPayments += Number(p.amount)
    } else {
      console.log(`  ✅ NÃO tem Finance - será INCLUÍDO na deduplicação`)
      includedPayments += Number(p.amount)
    }
    console.log('')
  }

  console.log('═'.repeat(60))
  console.log('\n📊 RESUMO DOS PAYMENTS DE NOVEMBRO:\n')
  console.log(`   Total de Payments: ${payments.rows.length}`)
  console.log(`   Valor total: R$ ${totalPayments.toFixed(2)}`)
  console.log(`   Incluídos (sem Finance): R$ ${includedPayments.toFixed(2)}`)
  console.log(`   Ignorados (com Finance): R$ ${ignoredPayments.toFixed(2)}`)

  // Verificar Finance de Novembro
  const financeIncome = await pool.query(
    `SELECT id, amount, description, "invoiceId"
     FROM "Finance"
     WHERE "orgId" = $1
     AND UPPER(type) = 'INCOME'
     AND date >= '2025-11-01'
     AND date <= '2025-11-30T23:59:59'`,
    [orgId]
  )

  console.log('\n📊 FINANCE INCOME DE NOVEMBRO:\n')
  console.log(`   Total de registros: ${financeIncome.rows.length}`)
  let totalFinance = 0
  for (const f of financeIncome.rows) {
    console.log(`   R$ ${Number(f.amount).toFixed(2)} - ${f.description}`)
    totalFinance += Number(f.amount)
  }
  console.log(`   Total Finance: R$ ${totalFinance.toFixed(2)}`)

  const expectedTotal = totalFinance + includedPayments
  console.log('\n═'.repeat(60))
  console.log(`\n💰 RECEITA TOTAL ESPERADA PARA NOVEMBRO:`)
  console.log(`   Finance Income: R$ ${totalFinance.toFixed(2)}`)
  console.log(`   + Payments sem Finance: R$ ${includedPayments.toFixed(2)}`)
  console.log(`   ════════════════════════════════════`)
  console.log(`   TOTAL: R$ ${expectedTotal.toFixed(2)}\n`)

  await pool.end()
}

investigateNovemberPayments().catch(console.error)
