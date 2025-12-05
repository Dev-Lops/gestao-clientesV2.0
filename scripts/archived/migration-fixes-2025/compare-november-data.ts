import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function compareNovemberData() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('     COMPARANDO FINANCE vs PAYMENTS - NOVEMBRO 2025')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('📊 FINANCE DE NOVEMBRO:\n')
  const finance = await pool.query(
    `SELECT f.amount, f.description, c.name as client_name, f.date, f."invoiceId"
     FROM "Finance" f
     LEFT JOIN "Client" c ON f."clientId" = c.id
     WHERE f."orgId" = $1
     AND UPPER(f.type) = 'INCOME'
     AND f.date >= '2025-11-01'
     AND f.date <= '2025-11-30T23:59:59'
     ORDER BY f.date`,
    [orgId]
  )

  for (const f of finance.rows) {
    const date = new Date(f.date).toLocaleDateString('pt-BR')
    console.log(
      `  ${date} - ${f.client_name || 'SEM CLIENTE'} - R$ ${Number(f.amount).toFixed(2)} - ${f.description}`
    )
  }

  console.log(
    `\nTotal Finance: R$ ${finance.rows.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)}`
  )

  console.log('\n' + '─'.repeat(60))
  console.log('\n💳 PAYMENTS DE NOVEMBRO:\n')

  const payments = await pool.query(
    `SELECT p.amount, p."paidAt", c.name as client_name, i.number, p."invoiceId"
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-11-01'
     AND p."paidAt" <= '2025-11-30T23:59:59'
     ORDER BY p."paidAt"`,
    [orgId]
  )

  for (const p of payments.rows) {
    const date = new Date(p.paidAt).toLocaleDateString('pt-BR')
    console.log(
      `  ${date} - ${p.client_name} - R$ ${Number(p.amount).toFixed(2)} - ${p.number}`
    )
  }

  console.log(
    `\nTotal Payments: R$ ${payments.rows.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)}`
  )

  console.log('\n' + '═'.repeat(60))
  console.log('\n🔍 ANÁLISE:\n')

  // Verificar se há Finance de Dra. Alexandra
  const alexandraFinance = finance.rows.filter(
    (f) => f.client_name && f.client_name.toLowerCase().includes('alexandra')
  )
  console.log(`Finance de Dra. Alexandra: ${alexandraFinance.length} registros`)
  alexandraFinance.forEach((f) => {
    console.log(`  → R$ ${Number(f.amount).toFixed(2)} - ${f.description}`)
  })

  // Verificar se há Finance de Ariane
  const arianeFinance = finance.rows.filter(
    (f) =>
      (f.client_name && f.client_name.toLowerCase().includes('ariane')) ||
      (f.description && f.description.toLowerCase().includes('ariane'))
  )
  console.log(`\nFinance de Ariane: ${arianeFinance.length} registros`)
  arianeFinance.forEach((f) => {
    console.log(`  → R$ ${Number(f.amount).toFixed(2)} - ${f.description}`)
  })

  console.log('\n' + '═'.repeat(60))
  console.log('\n💡 CONCLUSÃO:\n')

  const totalAlexandraPayments = payments.rows
    .filter(
      (p) => p.client_name && p.client_name.toLowerCase().includes('alexandra')
    )
    .reduce((s, p) => s + Number(p.amount), 0)

  const totalArianePayments = payments.rows
    .filter(
      (p) => p.client_name && p.client_name.toLowerCase().includes('ariane')
    )
    .reduce((s, p) => s + Number(p.amount), 0)

  console.log(
    `Payments de Dra. Alexandra: R$ ${totalAlexandraPayments.toFixed(2)} (2 parcelas)`
  )
  console.log(
    `Finance de Dra. Alexandra: R$ ${alexandraFinance.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
  )

  console.log(`\nPayments de Ariane: R$ ${totalArianePayments.toFixed(2)}`)
  console.log(
    `Finance de Ariane: R$ ${arianeFinance.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
  )

  if (alexandraFinance.length > 0 && totalAlexandraPayments > 0) {
    console.log('\n⚠️  Dra. Alexandra tem AMBOS Finance E Payments!')
    console.log('   Verificando se estão linkados pela invoiceId...')

    for (const p of payments.rows.filter(
      (p) => p.client_name && p.client_name.toLowerCase().includes('alexandra')
    )) {
      const hasFinance = finance.rows.some((f) => f.invoiceId === p.invoiceId)
      if (!hasFinance) {
        console.log(
          `   ⚠️  Payment de R$ ${Number(p.amount).toFixed(2)} NÃO está linkado a Finance`
        )
        console.log(`      Este valor está sendo SOMADO incorretamente!`)
      }
    }
  }

  if (arianeFinance.length > 0 && totalArianePayments > 0) {
    console.log('\n⚠️  Ariane tem AMBOS Finance E Payments!')
    console.log('   Verificando se estão linkados pela invoiceId...')

    const arianePayment = payments.rows.find(
      (p) => p.client_name && p.client_name.toLowerCase().includes('ariane')
    )
    if (arianePayment) {
      const hasFinance = finance.rows.some(
        (f) => f.invoiceId === arianePayment.invoiceId
      )
      if (!hasFinance) {
        console.log(
          `   ⚠️  Payment de R$ ${Number(arianePayment.amount).toFixed(2)} NÃO está linkado a Finance`
        )
        console.log(`      Este valor está sendo SOMADO incorretamente!`)
      } else {
        console.log(
          `   ✅ Payment está linkado a Finance - deduplicação funcionará`
        )
      }
    }
  }

  console.log('\n')
  await pool.end()
}

compareNovemberData().catch(console.error)
