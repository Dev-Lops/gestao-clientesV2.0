import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function cleanDuplicates() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n=== LIMPEZA DE DUPLICADOS OUTUBRO E NOVEMBRO ===\n')

  // 1. Deletar TODOS os registros de Outubro e Novembro 2025
  const deleteOct = await pool.query(
    `DELETE FROM "Finance"
     WHERE "orgId" = $1
     AND date >= '2025-10-01' AND date < '2025-11-01'`,
    [orgId]
  )

  console.log(`✅ Deletados ${deleteOct.rowCount} registros de OUTUBRO`)

  const deleteNov = await pool.query(
    `DELETE FROM "Finance"
     WHERE "orgId" = $1
     AND date >= '2025-11-01' AND date < '2025-12-01'`,
    [orgId]
  )

  console.log(`✅ Deletados ${deleteNov.rowCount} registros de NOVEMBRO`)

  console.log(
    '\n✅ Limpeza concluída! Agora rode os scripts de importação novamente.\n'
  )

  await pool.end()
}

cleanDuplicates().catch(console.error)
