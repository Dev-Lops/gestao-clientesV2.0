import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkOctoberNovemberData() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n=== OUTUBRO 2025 ===\n')

  const octIncome = await pool.query(
    `SELECT date, amount, description, type
     FROM "Finance"
     WHERE "orgId" = $1
     AND UPPER(type) = 'INCOME'
     AND date >= '2025-10-01' AND date < '2025-11-01'
     ORDER BY date`,
    [orgId]
  )

  console.log(`RECEITAS OUTUBRO: ${octIncome.rows.length} registros`)
  let octIncomeTotal = 0
  for (const row of octIncome.rows) {
    console.log(
      `  ${new Date(row.date).toLocaleDateString('pt-BR')} - R$ ${Number(row.amount).toFixed(2)} - ${row.description}`
    )
    octIncomeTotal += Number(row.amount)
  }
  console.log(`Total: R$ ${octIncomeTotal.toFixed(2)}\n`)

  const octExpense = await pool.query(
    `SELECT date, amount, description, type
     FROM "Finance"
     WHERE "orgId" = $1
     AND UPPER(type) = 'EXPENSE'
     AND date >= '2025-10-01' AND date < '2025-11-01'
     ORDER BY date`,
    [orgId]
  )

  console.log(`DESPESAS OUTUBRO: ${octExpense.rows.length} registros`)
  let octExpenseTotal = 0
  for (const row of octExpense.rows) {
    console.log(
      `  ${new Date(row.date).toLocaleDateString('pt-BR')} - R$ ${Number(row.amount).toFixed(2)} - ${row.description}`
    )
    octExpenseTotal += Number(row.amount)
  }
  console.log(`Total: R$ ${octExpenseTotal.toFixed(2)}\n`)

  console.log('=== NOVEMBRO 2025 ===\n')

  const novIncome = await pool.query(
    `SELECT date, amount, description, type
     FROM "Finance"
     WHERE "orgId" = $1
     AND UPPER(type) = 'INCOME'
     AND date >= '2025-11-01' AND date < '2025-12-01'
     ORDER BY date`,
    [orgId]
  )

  console.log(`RECEITAS NOVEMBRO: ${novIncome.rows.length} registros`)
  let novIncomeTotal = 0
  for (const row of novIncome.rows) {
    console.log(
      `  ${new Date(row.date).toLocaleDateString('pt-BR')} - R$ ${Number(row.amount).toFixed(2)} - ${row.description}`
    )
    novIncomeTotal += Number(row.amount)
  }
  console.log(`Total: R$ ${novIncomeTotal.toFixed(2)}\n`)

  const novExpense = await pool.query(
    `SELECT date, amount, description, type
     FROM "Finance"
     WHERE "orgId" = $1
     AND UPPER(type) = 'EXPENSE'
     AND date >= '2025-11-01' AND date < '2025-12-01'
     ORDER BY date`,
    [orgId]
  )

  console.log(`DESPESAS NOVEMBRO: ${novExpense.rows.length} registros`)
  let novExpenseTotal = 0
  for (const row of novExpense.rows) {
    console.log(
      `  ${new Date(row.date).toLocaleDateString('pt-BR')} - R$ ${Number(row.amount).toFixed(2)} - ${row.description}`
    )
    novExpenseTotal += Number(row.amount)
  }
  console.log(`Total: R$ ${novExpenseTotal.toFixed(2)}\n`)

  console.log('=== RESUMO ===\n')
  console.log(
    `Outubro: Receitas R$ ${octIncomeTotal.toFixed(2)} - Despesas R$ ${octExpenseTotal.toFixed(2)} = Saldo R$ ${(octIncomeTotal - octExpenseTotal).toFixed(2)}`
  )
  console.log(
    `Novembro: Receitas R$ ${novIncomeTotal.toFixed(2)} - Despesas R$ ${novExpenseTotal.toFixed(2)} = Saldo R$ ${(novIncomeTotal - novExpenseTotal).toFixed(2)}`
  )
  console.log(
    `\nTotal Out+Nov: Receitas R$ ${(octIncomeTotal + novIncomeTotal).toFixed(2)} - Despesas R$ ${(octExpenseTotal + novExpenseTotal).toFixed(2)}`
  )

  await pool.end()
}

checkOctoberNovemberData().catch(console.error)
