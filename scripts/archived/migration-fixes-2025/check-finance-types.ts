import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkTypes() {
  const res = await pool.query(
    'SELECT DISTINCT type FROM "Finance" ORDER BY type'
  )
  console.log('\nTipos distintos em Finance:')
  res.rows.forEach((r) => console.log(' -', r.type))

  // Contar por tipo
  const counts = await pool.query(
    'SELECT type, COUNT(*) as count FROM "Finance" GROUP BY type'
  )
  console.log('\nContagem por tipo:')
  counts.rows.forEach((r) => console.log(` - ${r.type}: ${r.count} registros`))

  await pool.end()
}

checkTypes().catch(console.error)
