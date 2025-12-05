import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function checkSeptember() {
  const result = await pool.query(
    `SELECT id, type, amount, description, date, "clientId"
     FROM "Finance"
     WHERE "orgId" = 'cmi3s1whv0002cmpwzddysc4j'
     AND date >= '2025-09-01'
     AND date < '2025-10-01'
     ORDER BY date`
  )

  console.log('═══════════════════════════════════════════════════════════')
  console.log('         REGISTROS DE SETEMBRO 2025')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('Total de registros:', result.rowCount)
  console.log('')

  let totalIncome = 0
  let totalExpense = 0

  for (const row of result.rows) {
    console.log(
      `${new Date(row.date).toLocaleDateString('pt-BR')} - ${row.type} - R$ ${row.amount} - ${row.description || 'Sem descrição'}`
    )
    if (row.type === 'INCOME') totalIncome += parseFloat(row.amount)
    if (row.type === 'EXPENSE') totalExpense += parseFloat(row.amount)
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log(`Total INCOME: R$ ${totalIncome.toFixed(2)}`)
  console.log(`Total EXPENSE: R$ ${totalExpense.toFixed(2)}`)
  console.log(`Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  await pool.end()
}

checkSeptember()
