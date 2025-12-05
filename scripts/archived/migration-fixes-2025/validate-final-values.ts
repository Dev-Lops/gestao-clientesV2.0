import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function validateFinalValues() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('          VALIDAÇÃO FINAL DOS VALORES DOS CARDS')
  console.log('═══════════════════════════════════════════════════════════\n')

  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  // Calcular para dezembro 2025 (mês atual)
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )

  console.log(`📅 Mês atual: DEZEMBRO 2025`)
  console.log(
    `   Período: ${currentMonth.toLocaleDateString('pt-BR')} a ${currentMonthEnd.toLocaleDateString('pt-BR')}\n`
  )

  // 1. Payments do mês
  const paymentsMonth = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Payment" 
     WHERE "orgId" = $1 
     AND "paidAt" >= $2 
     AND "paidAt" <= $3`,
    [orgId, currentMonth, currentMonthEnd]
  )

  // 2. Finance Income do mês
  const financeIncomeMonth = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'INCOME'
     AND date >= $2 
     AND date <= $3`,
    [orgId, currentMonth, currentMonthEnd]
  )

  // 3. Deduplicar receitas do mês
  const revenueMap = new Map<string, number>()

  for (const f of financeIncomeMonth.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(f.amount))
  }

  for (const p of paymentsMonth.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && revenueMap.has(`inv:${p.invoiceId}`)) continue
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.amount))
  }

  const incomeMonth = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)

  // 4. Despesas do mês
  const expensesMonth = await pool.query(
    `SELECT amount 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'EXPENSE'
     AND date >= $2 
     AND date <= $3`,
    [orgId, currentMonth, currentMonthEnd]
  )

  const expenseMonth = expensesMonth.rows.reduce(
    (s, r) => s + Number(r.amount),
    0
  )
  const netMonth = incomeMonth - expenseMonth

  console.log('💳 SALDO DO MÊS (DEZEMBRO):')
  console.log(`   Receitas: R$ ${incomeMonth.toFixed(2)}`)
  console.log(`   Despesas: R$ ${expenseMonth.toFixed(2)}`)
  console.log(`   ➜ Saldo: R$ ${netMonth.toFixed(2)}\n`)

  // 5. Totais históricos
  const allPayments = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Payment" 
     WHERE "orgId" = $1`,
    [orgId]
  )

  const allFinanceIncome = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'INCOME'`,
    [orgId]
  )

  // 6. Deduplicar receitas totais
  const totalRevenueMap = new Map<string, number>()

  for (const f of allFinanceIncome.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    totalRevenueMap.set(key, (totalRevenueMap.get(key) || 0) + Number(f.amount))
  }

  for (const p of allPayments.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && totalRevenueMap.has(`inv:${p.invoiceId}`)) continue
    totalRevenueMap.set(key, (totalRevenueMap.get(key) || 0) + Number(p.amount))
  }

  const totalIncome = Array.from(totalRevenueMap.values()).reduce(
    (s, v) => s + v,
    0
  )

  // 7. Despesas totais
  const allExpenses = await pool.query(
    `SELECT amount 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND UPPER(type) = 'EXPENSE'`,
    [orgId]
  )

  const totalExpense = allExpenses.rows.reduce(
    (s, r) => s + Number(r.amount),
    0
  )
  const totalNet = totalIncome - totalExpense

  console.log('💰 SALDO TOTAL (TODO HISTÓRICO):')
  console.log(`   Receitas: R$ ${totalIncome.toFixed(2)}`)
  console.log(`   Despesas: R$ ${totalExpense.toFixed(2)}`)
  console.log(`   ➜ Saldo: R$ ${totalNet.toFixed(2)}\n`)

  console.log('═══════════════════════════════════════════════════════════')
  console.log('                     VALORES ESPERADOS')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('📊 CARDS QUE DEVEM APARECER NA APLICAÇÃO:\n')
  console.log('   1️⃣ Card "Saldo do mês" (dezembro):')
  console.log(`      ➜ R$ ${netMonth.toFixed(2)}\n`)

  console.log('   2️⃣ Card "Saldo Total":')
  console.log(`      • Receitas: R$ ${totalIncome.toFixed(2)}`)
  console.log(`      • Despesas: R$ ${totalExpense.toFixed(2)}`)
  console.log(`      • Líquido: R$ ${totalNet.toFixed(2)}\n`)

  console.log('═══════════════════════════════════════════════════════════\n')

  // Breakdown por mês
  console.log('📈 BREAKDOWN POR MÊS:\n')

  const months = [
    { name: 'Outubro', start: '2025-10-01', end: '2025-10-31' },
    { name: 'Novembro', start: '2025-11-01', end: '2025-11-30' },
    { name: 'Dezembro', start: '2025-12-01', end: '2025-12-31' },
  ]

  for (const month of months) {
    const income = await pool.query(
      `SELECT SUM(amount) as total
       FROM "Finance"
       WHERE "orgId" = $1
       AND UPPER(type) = 'INCOME'
       AND date >= $2 AND date <= $3`,
      [orgId, month.start, month.end]
    )

    const expense = await pool.query(
      `SELECT SUM(amount) as total
       FROM "Finance"
       WHERE "orgId" = $1
       AND UPPER(type) = 'EXPENSE'
       AND date >= $2 AND date <= $3`,
      [orgId, month.start, month.end]
    )

    const incomeTotal = Number(income.rows[0]?.total || 0)
    const expenseTotal = Number(expense.rows[0]?.total || 0)
    const balance = incomeTotal - expenseTotal

    console.log(`   ${month.name}:`)
    console.log(`      Receitas: R$ ${incomeTotal.toFixed(2)}`)
    console.log(`      Despesas: R$ ${expenseTotal.toFixed(2)}`)
    console.log(`      Saldo: R$ ${balance.toFixed(2)}\n`)
  }

  await pool.end()
}

validateFinalValues().catch(console.error)
