import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkZeroAmounts() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  const res = await pool.query(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN amount = 0 THEN 1 ELSE 0 END) as zeros,
            SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END) as positivos
     FROM "Finance"
     WHERE "orgId" = $1
     AND date >= '2025-10-01' AND date < '2025-12-01'`,
    [orgId]
  )

  console.log('\nOUTUBRO + NOVEMBRO Finance:')
  console.log('Total registros:', res.rows[0].total)
  console.log('Com amount=0:', res.rows[0].zeros)
  console.log('Com amount>0:', res.rows[0].positivos)
  console.log('')

  // Listar alguns registros com amount=0
  const zeros = await pool.query(
    `SELECT id, date, type, amount, description, "clientId"
     FROM "Finance"
     WHERE "orgId" = $1
     AND date >= '2025-10-01' AND date < '2025-12-01'
     AND amount = 0
     LIMIT 10`,
    [orgId]
  )

  console.log('Exemplos de registros com amount=0:')
  for (const row of zeros.rows) {
    console.log(
      `  ${new Date(row.date).toLocaleDateString('pt-BR')} - ${row.type} - ${row.description}`
    )
  }

  await pool.end()
}

checkZeroAmounts().catch(console.error)
