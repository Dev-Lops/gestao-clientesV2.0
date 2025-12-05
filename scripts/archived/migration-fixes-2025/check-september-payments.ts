import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function checkSeptemberPayments() {
  const result = await pool.query(`
    SELECT p.id, p.amount, p."paidAt", p."invoiceId", c.name as client_name
    FROM "Payment" p
    LEFT JOIN "Client" c ON p."clientId" = c.id
    WHERE p."orgId" = 'cmi3s1whv0002cmpwzddysc4j'
    AND p."paidAt" >= '2025-09-01'
    AND p."paidAt" < '2025-10-01'
    ORDER BY p."paidAt"
  `)

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('         PAYMENTS EM SETEMBRO 2025')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('Total de Payments:', result.rowCount)
  console.log('')

  let total = 0
  for (const row of result.rows) {
    console.log(
      `${row.client_name || 'Sem cliente'} - R$ ${row.amount} - ${new Date(row.paidAt).toLocaleDateString('pt-BR')} - Invoice: ${row.invoiceId || 'N/A'}`
    )
    total += parseFloat(row.amount)
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log(`Total: R$ ${total.toFixed(2)}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  await pool.end()
}

checkSeptemberPayments()
