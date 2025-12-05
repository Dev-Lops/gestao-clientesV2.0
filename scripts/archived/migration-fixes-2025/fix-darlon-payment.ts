import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'
    
    console.log('\n=== CORRIGINDO DEVOLUÇÃO EMPRÉSTIMO DARLON ===\n')
    
    // Buscar o registro de R$ 100 da K'Delícia em 05/11/2025
    const result = await pool.query(`
      UPDATE "Finance"
      SET 
        description = 'Devolução empréstimo Darlon',
        "clientId" = NULL,
        "updatedAt" = NOW()
      WHERE "orgId" = $1
        AND date = '2025-11-05'::date
        AND amount = 100
        AND type = 'INCOME'
      RETURNING id, description, amount
    `, [orgId])
    
    if (result.rowCount > 0) {
      console.log(`✅ Registro atualizado:`)
      console.log(`   ID: ${result.rows[0].id}`)
      console.log(`   Descrição: ${result.rows[0].description}`)
      console.log(`   Valor: R$ ${Number(result.rows[0].amount).toFixed(2)}`)
    } else {
      console.log('⚠️  Nenhum registro encontrado para atualizar')
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await pool.end()
  }
}

main()
