import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'

    console.log('\n=== LIMPANDO DADOS DUPLICADOS DE OUTUBRO 2025 ===\n')

    // Deletar APENAS as entradas que foram importadas pelo script
    // (aquelas com valores > 0)
    const deleteResult = await pool.query(
      `
      DELETE FROM "Finance"
      WHERE "orgId" = $1
        AND date >= '2025-10-01'::date
        AND date < '2025-11-01'::date
        AND amount > 0
      RETURNING id
    `,
      [orgId]
    )

    console.log(`✅ Deletados ${deleteResult.rowCount} registros com valores`)

    // Verificar quantos registros com amount=0 sobraram
    const zeroRecords = await pool.query(
      `
      SELECT COUNT(*) as total FROM "Finance"
      WHERE "orgId" = $1
        AND date >= '2025-10-01'::date
        AND date < '2025-11-01'::date
    `,
      [orgId]
    )

    console.log(
      `Registros com amount=0 restantes: ${zeroRecords.rows[0].total}`
    )

    console.log('\n✅ Limpeza concluída!')
    console.log(
      'Agora você pode executar: npx tsx scripts/import-october-2025.ts'
    )
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await pool.end()
  }
}

main()
