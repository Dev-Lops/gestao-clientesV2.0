import { config } from 'dotenv'
import { Pool } from 'pg'

config({ debug: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function validateBillingValues() {
  console.log('\n=== VALIDAÇÃO DOS VALORES DO BILLING ===\n')

  const orgId = 'cmi3s1whv0002cmpwzddysc4j'
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

  console.log(
    `Mês atual: ${currentMonth.toLocaleDateString('pt-BR')} até ${currentMonthEnd.toLocaleDateString('pt-BR')}\n`
  )

  // 1. Payments do mês atual
  const paymentsMonthResult = await pool.query(
    `SELECT id, amount, "invoiceId", "paidAt" 
     FROM "Payment" 
     WHERE "orgId" = $1 
     AND "paidAt" >= $2 
     AND "paidAt" <= $3
     ORDER BY "paidAt"`,
    [orgId, currentMonth, currentMonthEnd]
  )

  console.log('PAYMENTS DO MÊS ATUAL:')
  let paymentsMonthTotal = 0
  for (const p of paymentsMonthResult.rows) {
    console.log(
      `  ${new Date(p.paidAt).toLocaleDateString('pt-BR')} - R$ ${Number(p.amount).toFixed(2)} ${p.invoiceId ? `(Invoice: ${p.invoiceId})` : '(sem invoice)'}`
    )
    paymentsMonthTotal += Number(p.amount)
  }
  console.log(`Total Payments Mês: R$ ${paymentsMonthTotal.toFixed(2)}\n`)

  // 2. Finance Income do mês atual
  const financeIncomeMonthResult = await pool.query(
    `SELECT f.id, f.amount, f."invoiceId", f.date, f.description, c.name as client_name
     FROM "Finance" f
     LEFT JOIN "Client" c ON f."clientId" = c.id
     WHERE f."orgId" = $1 
     AND f.type = 'income'
     AND f.date >= $2 
     AND f.date <= $3
     ORDER BY f.date`,
    [orgId, currentMonth, currentMonthEnd]
  )

  console.log('FINANCE INCOME DO MÊS ATUAL:')
  let financeIncomeMonthTotal = 0
  for (const f of financeIncomeMonthResult.rows) {
    console.log(
      `  ${new Date(f.date).toLocaleDateString('pt-BR')} - ${f.client_name || 'SEM CLIENTE'} - R$ ${Number(f.amount).toFixed(2)} - ${f.description} ${f.invoiceId ? `(Invoice: ${f.invoiceId})` : ''}`
    )
    financeIncomeMonthTotal += Number(f.amount)
  }
  console.log(
    `Total Finance Income Mês: R$ ${financeIncomeMonthTotal.toFixed(2)}\n`
  )

  // 3. Deduplicação do mês
  console.log('DEDUPLICAÇÃO DO MÊS:')
  const revenueMap = new Map<string, number>()

  for (const f of financeIncomeMonthResult.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(f.amount))
  }

  for (const p of paymentsMonthResult.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && revenueMap.has(`inv:${p.invoiceId}`)) {
      console.log(
        `  ⚠️ Payment ${p.id} ignorado (duplicado com Finance via invoice ${p.invoiceId})`
      )
      continue
    }
    revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.amount))
  }

  const incomeMonth = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)
  console.log(
    `\n✅ Receita do Mês (deduplicated): R$ ${incomeMonth.toFixed(2)}\n`
  )

  // 4. Despesas do mês
  const expensesMonthResult = await pool.query(
    `SELECT amount, date, description 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND type = 'expense'
     AND date >= $2 
     AND date <= $3
     ORDER BY date`,
    [orgId, currentMonth, currentMonthEnd]
  )

  console.log('DESPESAS DO MÊS ATUAL:')
  let expenseMonth = 0
  for (const e of expensesMonthResult.rows) {
    console.log(
      `  ${new Date(e.date).toLocaleDateString('pt-BR')} - R$ ${Number(e.amount).toFixed(2)} - ${e.description}`
    )
    expenseMonth += Number(e.amount)
  }
  console.log(`Total Despesas Mês: R$ ${expenseMonth.toFixed(2)}\n`)

  const netMonth = incomeMonth - expenseMonth
  console.log(`💰 Saldo do Mês: R$ ${netMonth.toFixed(2)}\n`)

  console.log('='.repeat(60))
  console.log('\n=== VALORES TOTAIS (TODO O HISTÓRICO) ===\n')

  // 5. Todos os Payments
  const allPaymentsResult = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Payment" 
     WHERE "orgId" = $1`,
    [orgId]
  )

  let allPaymentsTotal = 0
  for (const p of allPaymentsResult.rows) {
    allPaymentsTotal += Number(p.amount)
  }
  console.log(
    `Total de todos os Payments: R$ ${allPaymentsTotal.toFixed(2)} (${allPaymentsResult.rows.length} registros)`
  )

  // 6. Todos os Finance Income
  const allFinanceIncomeResult = await pool.query(
    `SELECT id, amount, "invoiceId" 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND type = 'income'`,
    [orgId]
  )

  let allFinanceIncomeTotal = 0
  for (const f of allFinanceIncomeResult.rows) {
    allFinanceIncomeTotal += Number(f.amount)
  }
  console.log(
    `Total de todos os Finance Income: R$ ${allFinanceIncomeTotal.toFixed(2)} (${allFinanceIncomeResult.rows.length} registros)\n`
  )

  // 7. Deduplicação total
  console.log('DEDUPLICAÇÃO TOTAL:')
  const totalRevenueMap = new Map<string, number>()

  for (const f of allFinanceIncomeResult.rows) {
    const key = f.invoiceId ? `inv:${f.invoiceId}` : `fin:${f.id}`
    totalRevenueMap.set(key, (totalRevenueMap.get(key) || 0) + Number(f.amount))
  }

  let duplicatedPayments = 0
  for (const p of allPaymentsResult.rows) {
    const key = p.invoiceId ? `inv:${p.invoiceId}` : `pay:${p.id}`
    if (p.invoiceId && totalRevenueMap.has(`inv:${p.invoiceId}`)) {
      duplicatedPayments++
      continue
    }
    totalRevenueMap.set(key, (totalRevenueMap.get(key) || 0) + Number(p.amount))
  }

  const totalIncome = Array.from(totalRevenueMap.values()).reduce(
    (s, v) => s + v,
    0
  )
  console.log(
    `  ⚠️ ${duplicatedPayments} payments ignorados (duplicados via invoiceId)`
  )
  console.log(
    `\n✅ Receita Total (deduplicated): R$ ${totalIncome.toFixed(2)}\n`
  )

  // 8. Todas as despesas
  const allExpensesResult = await pool.query(
    `SELECT amount 
     FROM "Finance" 
     WHERE "orgId" = $1 
     AND type = 'expense'`,
    [orgId]
  )

  let totalExpense = 0
  for (const e of allExpensesResult.rows) {
    totalExpense += Number(e.amount)
  }
  console.log(
    `Total de todas as Despesas: R$ ${totalExpense.toFixed(2)} (${allExpensesResult.rows.length} registros)`
  )

  const totalNet = totalIncome - totalExpense
  console.log(`\n💰 Saldo Total: R$ ${totalNet.toFixed(2)}\n`)

  console.log('='.repeat(60))
  console.log('\n📊 RESUMO PARA OS CARDS:\n')
  console.log(`Card "Saldo do mês": R$ ${netMonth.toFixed(2)}`)
  console.log(`Card "Saldo Total" → Receitas: R$ ${totalIncome.toFixed(2)}`)
  console.log(`Card "Saldo Total" → Despesas: R$ ${totalExpense.toFixed(2)}`)
  console.log(`Card "Saldo Total" → Líquido: R$ ${totalNet.toFixed(2)}`)
  console.log('\n')

  await pool.end()
}

validateBillingValues().catch(console.error)
