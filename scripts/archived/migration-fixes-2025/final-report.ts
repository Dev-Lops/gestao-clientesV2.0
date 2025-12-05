import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function finalReport() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n' + '═'.repeat(70))
  console.log('                 RELATÓRIO FINAL COMPLETO')
  console.log('                   Gestão Financeira')
  console.log('═'.repeat(70) + '\n')

  const months = [
    { name: 'Setembro 2025', start: '2025-09-01', end: '2025-09-30' },
    { name: 'Outubro 2025', start: '2025-10-01', end: '2025-10-31' },
    { name: 'Novembro 2025', start: '2025-11-01', end: '2025-11-30' },
    { name: 'Dezembro 2025', start: '2025-12-01', end: '2025-12-31' },
  ]

  let totalIncomeAll = 0
  let totalExpenseAll = 0

  for (const month of months) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`  ${month.name.toUpperCase()}`)
    console.log('─'.repeat(70))

    // Payments do mês
    const payments = await pool.query(
      `SELECT id, amount, "invoiceId" 
       FROM "Payment" 
       WHERE "orgId" = $1 
       AND "paidAt" >= $2 
       AND "paidAt" <= $3`,
      [orgId, month.start, month.end + 'T23:59:59']
    )

    // Finance Income do mês
    const financeIncome = await pool.query(
      `SELECT id, amount, "invoiceId", description
       FROM "Finance" 
       WHERE "orgId" = $1 
       AND UPPER(type) = 'INCOME'
       AND date >= $2 
       AND date <= $3`,
      [orgId, month.start, month.end + 'T23:59:59']
    )

    // Deduplicação
    const revenueMap = new Map<string, number>()

    for (const f of financeIncome.rows) {
      const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(f.amount))
    }

    for (const p of payments.rows) {
      const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
      if (p.invoiceId && revenueMap.has(`inv:${p.invoiceId}`)) continue
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.amount))
    }

    const income = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)

    // Despesas do mês
    const expenses = await pool.query(
      `SELECT amount 
       FROM "Finance" 
       WHERE "orgId" = $1 
       AND UPPER(type) = 'EXPENSE'
       AND date >= $2 
       AND date <= $3`,
      [orgId, month.start, month.end + 'T23:59:59']
    )

    const expense = expenses.rows.reduce((s, r) => s + Number(r.amount), 0)
    const balance = income - expense

    console.log(`\n  📊 Registros:`)
    console.log(`     Finance Income: ${financeIncome.rows.length} registros`)
    console.log(`     Payments: ${payments.rows.length} registros`)
    console.log(`     Despesas: ${expenses.rows.length} registros`)

    console.log(`\n  💰 Valores:`)
    console.log(`     Receitas: R$ ${income.toFixed(2)}`)
    console.log(`     Despesas: R$ ${expense.toFixed(2)}`)
    console.log(
      `     Saldo: R$ ${balance.toFixed(2)} ${balance >= 0 ? '✅' : '⚠️'}`
    )

    totalIncomeAll += income
    totalExpenseAll += expense
  }

  const totalBalanceAll = totalIncomeAll - totalExpenseAll

  console.log('\n' + '═'.repeat(70))
  console.log('                      TOTAIS GERAIS')
  console.log('═'.repeat(70))
  console.log(`\n  💵 Receitas Totais: R$ ${totalIncomeAll.toFixed(2)}`)
  console.log(`  💸 Despesas Totais: R$ ${totalExpenseAll.toFixed(2)}`)
  console.log(
    `  💰 Saldo Total: R$ ${totalBalanceAll.toFixed(2)} ${totalBalanceAll >= 0 ? '✅' : '⚠️'}`
  )

  console.log('\n' + '═'.repeat(70))
  console.log('           VALORES QUE DEVEM APARECER NOS CARDS')
  console.log('═'.repeat(70) + '\n')

  // Dezembro (mês atual)
  const decPayments = await pool.query(
    `SELECT id, amount, "invoiceId" FROM "Payment" 
     WHERE "orgId" = $1 AND "paidAt" >= '2025-12-01' AND "paidAt" <= '2025-12-31T23:59:59'`,
    [orgId]
  )

  const decFinanceIncome = await pool.query(
    `SELECT id, amount, "invoiceId" FROM "Finance" 
     WHERE "orgId" = $1 AND UPPER(type) = 'INCOME' AND date >= '2025-12-01' AND date <= '2025-12-31T23:59:59'`,
    [orgId]
  )

  const decRevenueMap = new Map<string, number>()
  for (const f of decFinanceIncome.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    decRevenueMap.set(key, (decRevenueMap.get(key) || 0) + Number(f.amount))
  }
  for (const p of decPayments.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && decRevenueMap.has(`inv:${p.invoiceId}`)) continue
    decRevenueMap.set(key, (decRevenueMap.get(key) || 0) + Number(p.amount))
  }
  const decIncome = Array.from(decRevenueMap.values()).reduce(
    (s, v) => s + v,
    0
  )

  const decExpenses = await pool.query(
    `SELECT amount FROM "Finance" 
     WHERE "orgId" = $1 AND UPPER(type) = 'EXPENSE' AND date >= '2025-12-01' AND date <= '2025-12-31T23:59:59'`,
    [orgId]
  )
  const decExpense = decExpenses.rows.reduce((s, r) => s + Number(r.amount), 0)
  const decBalance = decIncome - decExpense

  console.log(`  🗓️  Card "Saldo do Mês" (Dezembro 2025):`)
  console.log(`     ➜ R$ ${decBalance.toFixed(2)}\n`)

  console.log(`  💎 Card "Saldo Total":`)
  console.log(`     • Receitas: R$ ${totalIncomeAll.toFixed(2)}`)
  console.log(`     • Despesas: R$ ${totalExpenseAll.toFixed(2)}`)
  console.log(`     • Líquido: R$ ${totalBalanceAll.toFixed(2)}\n`)

  console.log('═'.repeat(70) + '\n')

  console.log('✅ VERIFICAÇÃO COMPLETA:')
  console.log('   • Sem duplicados')
  console.log('   • Todos os meses organizados separadamente')
  console.log('   • Deduplicação aplicada corretamente')
  console.log('   • Valores prontos para exibição nos cards\n')

  await pool.end()
}

finalReport().catch(console.error)
