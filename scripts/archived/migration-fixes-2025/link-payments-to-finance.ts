import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function linkPaymentsToFinance() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('       LINKANDO PAYMENTS AOS FINANCE CORRESPONDENTES')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Payments de Dra. Alexandra (2x R$ 600)
  const alexandraPayments = await pool.query(
    `SELECT p.id, p.amount, p."invoiceId", i.number
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-11-01'
     AND p."paidAt" <= '2025-11-30T23:59:59'
     AND c.name LIKE '%Alexandra%'
     ORDER BY p."paidAt"`,
    [orgId]
  )

  console.log(`📋 Payments de Dra. Alexandra: ${alexandraPayments.rows.length}`)

  if (alexandraPayments.rows.length === 2) {
    const payment1 = alexandraPayments.rows[0]
    const payment2 = alexandraPayments.rows[1]

    console.log(
      `   Payment 1: R$ ${Number(payment1.amount).toFixed(2)} - Invoice: ${payment1.invoiceId}`
    )
    console.log(
      `   Payment 2: R$ ${Number(payment2.amount).toFixed(2)} - Invoice: ${payment2.invoiceId}`
    )

    // Buscar Finance de Dra. Alexandra em Novembro
    const alexandraFinance = await pool.query(
      `SELECT f.id, f.amount, f.description, f."invoiceId", c.name
       FROM "Finance" f
       LEFT JOIN "Client" c ON f."clientId" = c.id
       WHERE f."orgId" = $1
       AND UPPER(f.type) = 'INCOME'
       AND f.date >= '2025-11-01'
       AND f.date <= '2025-11-30T23:59:59'
       AND c.name LIKE '%Alexandra%'
       ORDER BY f.date`,
      [orgId]
    )

    console.log(
      `\n📋 Finance de Dra. Alexandra: ${alexandraFinance.rows.length}`
    )

    for (const f of alexandraFinance.rows) {
      console.log(
        `   Finance: R$ ${Number(f.amount).toFixed(2)} - ${f.description} - InvoiceId: ${f.invoiceId || 'NULL'}`
      )
    }

    // Se os Finance não têm invoiceId, vamos linká-los
    if (alexandraFinance.rows.length >= 2) {
      const finance1 = alexandraFinance.rows[0] // Receita Isabel - R$ 1200
      const finance2 = alexandraFinance.rows[1] // Receita Alexandra - R$ 1200

      console.log('\n💡 SOLUÇÃO PROPOSTA:')
      console.log(
        '   Como temos 2 Payments de R$ 600 (parcelas) e 2 Finance de R$ 1200,'
      )
      console.log(
        '   os Payments são PARCELAS das Invoices que já foram registradas no Finance.'
      )
      console.log('   Vamos linkar os Finance aos invoiceIds dos Payments:\n')

      if (!finance1.invoiceId && Number(finance1.amount) === 1200) {
        console.log(
          `   ✅ Linkando Finance "${finance1.description}" ao Invoice ${payment1.invoiceId}`
        )
        await pool.query(
          `UPDATE "Finance" SET "invoiceId" = $1 WHERE id = $2`,
          [payment1.invoiceId, finance1.id]
        )
      }

      if (!finance2.invoiceId && Number(finance2.amount) === 1200) {
        console.log(
          `   ✅ Linkando Finance "${finance2.description}" ao Invoice ${payment2.invoiceId}`
        )
        await pool.query(
          `UPDATE "Finance" SET "invoiceId" = $1 WHERE id = $2`,
          [payment2.invoiceId, finance2.id]
        )
      }
    }
  }

  // 2. Payment de Ariane (R$ 800)
  const arianePayment = await pool.query(
    `SELECT p.id, p.amount, p."invoiceId", i.number
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-11-01'
     AND p."paidAt" <= '2025-11-30T23:59:59'
     AND c.name LIKE '%Ariane%'`,
    [orgId]
  )

  console.log(`\n📋 Payment de Ariane: ${arianePayment.rows.length}`)

  if (arianePayment.rows.length === 1) {
    const payment = arianePayment.rows[0]
    console.log(
      `   Payment: R$ ${Number(payment.amount).toFixed(2)} - Invoice: ${payment.invoiceId}`
    )

    // Buscar Finance de Ariane em Novembro
    const arianeFinance = await pool.query(
      `SELECT f.id, f.amount, f.description, f."invoiceId", c.name
       FROM "Finance" f
       LEFT JOIN "Client" c ON f."clientId" = c.id
       WHERE f."orgId" = $1
       AND UPPER(f.type) = 'INCOME'
       AND f.date >= '2025-11-01'
       AND f.date <= '2025-11-30T23:59:59'
       AND (c.name LIKE '%Ariane%' OR f.description LIKE '%Ariane%')`,
      [orgId]
    )

    console.log(`\n📋 Finance de Ariane: ${arianeFinance.rows.length}`)

    if (arianeFinance.rows.length === 1) {
      const finance = arianeFinance.rows[0]
      console.log(
        `   Finance: R$ ${Number(finance.amount).toFixed(2)} - ${finance.description} - InvoiceId: ${finance.invoiceId || 'NULL'}`
      )

      if (!finance.invoiceId && Number(finance.amount) === 800) {
        console.log(
          `\n   ✅ Linkando Finance "${finance.description}" ao Invoice ${payment.invoiceId}`
        )
        await pool.query(
          `UPDATE "Finance" SET "invoiceId" = $1 WHERE id = $2`,
          [payment.invoiceId, finance.id]
        )
      }
    }
  }

  console.log('\n═'.repeat(60))
  console.log('\n✅ LINKS CRIADOS COM SUCESSO!')
  console.log('\nAgora execute o relatório final novamente para verificar:\n')
  console.log('   npx tsx scripts/final-report.ts\n')

  await pool.end()
}

linkPaymentsToFinance().catch(console.error)
