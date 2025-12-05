import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkMissingFinanceRecords() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('    VERIFICANDO PAYMENTS SEM FINANCE CORRESPONDENTE')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Buscar todos os Payments de Dezembro
  const payments = await pool.query(
    `SELECT p.id, p.amount, p."invoiceId", p."paidAt", i.number as invoice_number
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-12-01'
     AND p."paidAt" < '2026-01-01'
     ORDER BY p."paidAt"`,
    [orgId]
  )

  console.log(`📋 Total de Payments em Dezembro: ${payments.rows.length}\n`)

  for (const payment of payments.rows) {
    console.log(`\n💳 Payment ID: ${payment.id}`)
    console.log(
      `   Data: ${new Date(payment.paidAt).toLocaleDateString('pt-BR')}`
    )
    console.log(`   Valor: R$ ${Number(payment.amount).toFixed(2)}`)
    console.log(
      `   Invoice: ${payment.invoice_number || 'N/A'} (${payment.invoiceId || 'sem invoice'})`
    )

    // Verificar se há Finance correspondente
    const financeByInvoice = await pool.query(
      `SELECT id, amount, description, date
       FROM "Finance"
       WHERE "orgId" = $1
       AND "invoiceId" = $2
       AND UPPER(type) = 'INCOME'`,
      [orgId, payment.invoiceId]
    )

    if (financeByInvoice.rows.length > 0) {
      console.log(`   ✅ Finance encontrado via invoiceId:`)
      financeByInvoice.rows.forEach((f) => {
        console.log(`      - ID: ${f.id}`)
        console.log(`        Valor: R$ ${Number(f.amount).toFixed(2)}`)
        console.log(`        Descrição: ${f.description}`)
      })
    } else {
      console.log(`   ⚠️  NENHUM Finance encontrado para este Payment!`)
      console.log(`   💡 Este Payment NÃO será contabilizado no saldo do mês`)
      console.log(`   📝 Mas será incluído no cálculo com deduplicação`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('                  RESUMO DA ANÁLISE')
  console.log('='.repeat(60) + '\n')

  // Calcular o que deve aparecer no card "Saldo do mês"
  const paymentsMonth = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Payment" 
     WHERE "orgId" = $1 
     AND "paidAt" >= '2025-12-01' 
     AND "paidAt" < '2026-01-01'`,
    [orgId]
  )

  const financeIncomeMonth = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'INCOME'
     AND date >= '2025-12-01' 
     AND date < '2026-01-01'`,
    [orgId]
  )

  console.log(`Payments em Dezembro: ${paymentsMonth.rows.length}`)
  console.log(`Finance Income em Dezembro: ${financeIncomeMonth.rows.length}\n`)

  // Deduplicação (lógica do código)
  const revenueMap = new Map<string, number>()

  // Finance tem prioridade
  for (const f of financeIncomeMonth.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(f.amount))
  }

  // Payments só são incluídos se não houver Finance para a mesma invoice
  for (const p of paymentsMonth.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && revenueMap.has(`inv:${p.invoiceId}`)) {
      console.log(
        `⚠️  Payment ${p.id.substring(0, 8)} IGNORADO (já existe Finance para invoice ${p.invoiceId.substring(0, 8)})`
      )
      continue
    }
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.amount))
    console.log(
      `✅ Payment ${p.id.substring(0, 8)} INCLUÍDO (R$ ${Number(p.amount).toFixed(2)})`
    )
  }

  const incomeMonth = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)

  const expensesMonth = await pool.query(
    `SELECT amount 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'EXPENSE'
     AND date >= '2025-12-01' 
     AND date < '2026-01-01'`,
    [orgId]
  )

  const expenseMonth = expensesMonth.rows.reduce(
    (s, r) => s + Number(r.amount),
    0
  )
  const netMonth = incomeMonth - expenseMonth

  console.log('\n' + '='.repeat(60))
  console.log('📊 VALORES FINAIS PARA DEZEMBRO:\n')
  console.log(`   Receitas (com deduplicação): R$ ${incomeMonth.toFixed(2)}`)
  console.log(`   Despesas: R$ ${expenseMonth.toFixed(2)}`)
  console.log(`   Saldo do mês: R$ ${netMonth.toFixed(2)}`)
  console.log('='.repeat(60) + '\n')

  // Verificar se os R$ 600 do Payment estão sendo contabilizados
  const payment600 = paymentsMonth.rows.find((p) => Number(p.amount) === 600)
  if (payment600) {
    const hasFinance = financeIncomeMonth.rows.some(
      (f) => f.invoiceId === payment600.invoiceId
    )
    console.log(`\n🔍 Payment de R$ 600.00:`)
    console.log(`   Invoice ID: ${payment600.invoiceId}`)
    console.log(`   Tem Finance correspondente? ${hasFinance ? 'SIM' : 'NÃO'}`)

    if (!hasFinance) {
      console.log(`   ✅ Será incluído no cálculo (R$ 600.00)`)
    } else {
      console.log(`   ⚠️  Será IGNORADO (Finance já contabiliza)`)
    }
  }

  await pool.end()
}

checkMissingFinanceRecords().catch(console.error)
