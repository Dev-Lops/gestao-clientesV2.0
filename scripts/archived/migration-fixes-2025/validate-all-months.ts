import { config } from 'dotenv'
import { Pool } from 'pg'

config({ debug: true })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function validateAllMonths() {
  console.log('\n=== VALIDAÇÃO COMPLETA POR MÊS ===\n')

  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  // Todos os Finance Income
  const allFinanceIncomeResult = await pool.query(
    `SELECT id, amount, "invoiceId", date, description, type
     FROM "Finance" 
     WHERE "orgId" = $1 
     ORDER BY date`,
    [orgId]
  )

  // Todos os Payments
  const allPaymentsResult = await pool.query(
    `SELECT id, amount, "invoiceId", "paidAt"
     FROM "Payment" 
     WHERE "orgId" = $1
     ORDER BY "paidAt"`,
    [orgId]
  )

  // Agrupar por mês
  const monthlyData: Record<
    string,
    {
      income: number
      expense: number
      financeCount: number
      paymentCount: number
    }
  > = {}

  for (const f of allFinanceIncomeResult.rows) {
    const date = new Date(f.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
        financeCount: 0,
        paymentCount: 0,
      }
    }

    if (f.type === 'income') {
      monthlyData[monthKey].income += Number(f.amount)
      monthlyData[monthKey].financeCount++
    } else if (f.type === 'expense') {
      monthlyData[monthKey].expense += Number(f.amount)
    }
  }

  for (const p of allPaymentsResult.rows) {
    const date = new Date(p.paidAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
        financeCount: 0,
        paymentCount: 0,
      }
    }

    monthlyData[monthKey].paymentCount++
  }

  console.log('📊 RESUMO POR MÊS (SEM DEDUPLICAÇÃO):\n')
  const sortedMonths = Object.keys(monthlyData).sort()

  for (const month of sortedMonths) {
    const data = monthlyData[month]
    const [year, monthNum] = month.split('-')
    const monthName = new Date(
      Number(year),
      Number(monthNum) - 1,
      1
    ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    console.log(`${monthName.toUpperCase()}:`)
    console.log(
      `  Finance Income: R$ ${data.income.toFixed(2)} (${data.financeCount} registros)`
    )
    console.log(`  Payments: ${data.paymentCount} registros`)
    console.log(`  Despesas: R$ ${data.expense.toFixed(2)}`)
    console.log(`  Saldo: R$ ${(data.income - data.expense).toFixed(2)}`)
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('\n💡 AGORA COM DEDUPLICAÇÃO CORRETA:\n')

  // Totais com deduplicação
  const totalRevenueMap = new Map<string, number>()

  for (const f of allFinanceIncomeResult.rows.filter(
    (r) => r.type === 'income'
  )) {
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
  const totalExpense = allFinanceIncomeResult.rows
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + Number(r.amount), 0)

  console.log(
    `Total Finance Income (todos): R$ ${allFinanceIncomeResult.rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + Number(r.amount), 0)
      .toFixed(2)}`
  )
  console.log(
    `Total Payments (todos): R$ ${allPaymentsResult.rows.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)}`
  )
  console.log(`Payments duplicados ignorados: ${duplicatedPayments}`)
  console.log(`\n✅ RECEITA TOTAL (deduplicated): R$ ${totalIncome.toFixed(2)}`)
  console.log(`✅ DESPESA TOTAL: R$ ${totalExpense.toFixed(2)}`)
  console.log(`✅ SALDO TOTAL: R$ ${(totalIncome - totalExpense).toFixed(2)}`)
  console.log('\n')

  await pool.end()
}

validateAllMonths().catch(console.error)
