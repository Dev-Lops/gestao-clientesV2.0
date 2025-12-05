import { randomBytes } from 'crypto'
import 'dotenv/config'
import { Pool } from 'pg'

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(12).toString('base64url').substring(0, 16)
  return `c${timestamp}${randomPart}`.substring(0, 25)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const ORG_ID = 'cmi3s1whv0002cmpwzddysc4j'

// Mapeamento de clientes baseado no backup
const CLIENT_MAP: Record<string, string> = {
  'ZL SUSHI': 'cmierdf0o000109l88m6rr6g8',
  Isabel: 'cmi3syz6o0001cmok4cu1byba', // Dra. Alexandra
  Alexandra: 'cmi3syz6o0001cmok4cu1byba', // Dra. Alexandra
  Fabiana: 'cmier7k2u000009l7gr33eq5b', // Fabiane
  Infinix: 'cmiera83e000009k4wv6adr9k',
  MANU: 'cmierg69g000209k4miawspvv', // Manu Nails Desinger
  Mané: 'cmierf04o000109k43d4ny3co', // Mané Mineira
  Ariane: 'cmihybsby000009i7v48zfqg8',
  UNIMARCAS: 'cmihygbnf000409l7ukb3ckmj',
  FABI: 'cmier7k2u000009l7gr33eq5b', // Fabiane
  Distribuidora: 'cmier93zl000009l8bg2h470k', // K´Delícia
}

// Dias de vencimento baseados nos contratos
const PAYMENT_DAYS: Record<string, number> = {
  cmierdf0o000109l88m6rr6g8: 8, // ZL SUSHI
  cmi3syz6o0001cmok4cu1byba: 1, // Dra. Alexandra (fallback, não tem paymentDay)
  cmier7k2u000009l7gr33eq5b: 11, // Fabiane
  cmiera83e000009k4wv6adr9k: 10, // Infinix
  cmierg69g000209k4miawspvv: 11, // Manu Nails Desinger
  cmierf04o000109k43d4ny3co: 25, // Mané Mineira
  cmihybsby000009i7v48zfqg8: 25, // Ariane
  cmihygbnf000409l7ukb3ckmj: 10, // UNIMARCAS
  cmier93zl000009l8bg2h470k: 5, // K´Delícia
}

interface IncomeEntry {
  clientName: string
  amount: number
  month: number // 10, 11, 12
  year: number
  description?: string
}

const INCOME_DATA: IncomeEntry[] = [
  // OUTUBRO 2025
  { clientName: 'ZL SUSHI', amount: 700, month: 10, year: 2025 },
  { clientName: 'Isabel', amount: 1200, month: 10, year: 2025 },
  { clientName: 'Alexandra', amount: 1200, month: 10, year: 2025 },
  { clientName: 'Fabiana', amount: 600, month: 10, year: 2025 },
  { clientName: 'Infinix', amount: 1200, month: 10, year: 2025 },
  { clientName: 'MANU', amount: 775, month: 10, year: 2025 },
  { clientName: 'Mané', amount: 750, month: 10, year: 2025 },

  // NOVEMBRO 2025
  { clientName: 'ZL SUSHI', amount: 700, month: 11, year: 2025 },
  { clientName: 'Isabel', amount: 1200, month: 11, year: 2025 },
  { clientName: 'Infinix', amount: 1200, month: 11, year: 2025 },
  { clientName: 'Alexandra', amount: 1200, month: 11, year: 2025 },
  { clientName: 'Ariane', amount: 800, month: 11, year: 2025 },
  { clientName: 'MANU', amount: 600, month: 11, year: 2025 },
  { clientName: 'UNIMARCAS', amount: 882, month: 11, year: 2025 },
  { clientName: 'FABI', amount: 1200, month: 11, year: 2025 },
  { clientName: 'Distribuidora', amount: 50, month: 11, year: 2025 },
  {
    clientName: 'Darlon',
    amount: 100,
    month: 11,
    year: 2025,
    description: 'Devolução',
  },

  // DEZEMBRO 2025
  { clientName: 'Alexandra', amount: 600, month: 12, year: 2025 },
  { clientName: 'Mané', amount: 750, month: 12, year: 2025 },
]

function generateInvoiceNumber(
  clientName: string,
  month: number,
  year: number
): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${year}${String(month).padStart(2, '0')}-${randomSuffix}`
}

async function recreateFinances() {
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('         RECRIAÇÃO DE FINANÇAS OUT/NOV/DEZ')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // 1. DELETAR DADOS ANTIGOS
    console.log('🗑️  DELETANDO DADOS ANTIGOS...\n')

    // Deletar Finance de Out/Nov/Dez
    const deleteFinance = await pool.query(
      `DELETE FROM "Finance"
       WHERE "orgId" = $1
       AND "date" >= '2025-10-01'
       AND "date" < '2026-01-01'
       RETURNING id`,
      [ORG_ID]
    )
    console.log(`✅ ${deleteFinance.rowCount} registros Finance deletados`)

    // Deletar Payments de Out/Nov/Dez
    const deletePayments = await pool.query(
      `DELETE FROM "Payment"
       WHERE "orgId" = $1
       AND "paidAt" >= '2025-10-01'
       AND "paidAt" < '2026-01-01'
       RETURNING id`,
      [ORG_ID]
    )
    console.log(`✅ ${deletePayments.rowCount} Payments deletados`)

    // Deletar Invoices de Out/Nov/Dez
    const deleteInvoices = await pool.query(
      `DELETE FROM "Invoice"
       WHERE "orgId" = $1
       AND "issueDate" >= '2025-10-01'
       AND "issueDate" < '2026-01-01'
       RETURNING id`,
      [ORG_ID]
    )
    console.log(`✅ ${deleteInvoices.rowCount} Invoices deletadas\n`)

    // 2. CRIAR NOVOS DADOS
    console.log(
      '════════════════════════════════════════════════════════════\n'
    )
    console.log('💰 CRIANDO NOVAS RECEITAS...\n')

    let createdCount = 0
    let totalIncome = 0

    for (const entry of INCOME_DATA) {
      const clientId = CLIENT_MAP[entry.clientName]

      // Caso especial: Darlon é uma devolução de empréstimo (sem invoice/payment)
      if (!clientId && entry.clientName === 'Darlon') {
        const financeId = generateCuid()
        const now = new Date()
        const paymentDate = new Date(entry.year, entry.month - 1, 15) // Meio do mês

        await pool.query(
          `INSERT INTO "Finance"
           ("id", "orgId", "type", "category", "description", "amount", "date", "createdAt", "updatedAt")
           VALUES ($1, $2, 'INCOME', 'RECEITA', $3, $4, $5, $6, $7)`,
          [
            financeId,
            ORG_ID,
            'Devolução de empréstimo - Darlon',
            entry.amount,
            paymentDate,
            now,
            now,
          ]
        )

        console.log(
          `✅ ${entry.clientName} - ${entry.month}/${entry.year} - R$ ${entry.amount.toFixed(2)}`
        )
        console.log(`   Tipo: Devolução de empréstimo`)
        console.log(`   Data: ${paymentDate.toLocaleDateString('pt-BR')}\n`)

        createdCount++
        totalIncome += entry.amount
        continue
      }

      if (!clientId) {
        console.log(`⚠️  Cliente não encontrado: ${entry.clientName}`)
        continue
      }

      // Se for cliente com parcelamento (ex.: Dra. Alexandra), dividir em 2 parcelas
      const isInstallmentClient = entry.clientName === 'Alexandra'
      const now = new Date()

      if (isInstallmentClient) {
        const installmentAmounts = [entry.amount / 2, entry.amount / 2]
        const dueDays = [1, 15]

        for (let i = 0; i < 2; i++) {
          const dueDate = new Date(entry.year, entry.month - 1, dueDays[i])
          const issueDate = new Date(dueDate)
          issueDate.setDate(issueDate.getDate() - 1)

          const invoiceNumber = generateInvoiceNumber(
            `${entry.clientName}-PAR-${i + 1}`,
            entry.month,
            entry.year
          )

          const invoiceId = generateCuid()
          await pool.query(
            `INSERT INTO "Invoice" 
             ("id", "orgId", "clientId", "number", "status", "issueDate", "dueDate", "subtotal", "total", "currency", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, 'PAID', $5, $6, $7, $8, 'BRL', $9, $10)`,
            [
              invoiceId,
              ORG_ID,
              clientId,
              invoiceNumber,
              issueDate,
              dueDate,
              installmentAmounts[i],
              installmentAmounts[i],
              now,
              now,
            ]
          )

          const financeId = generateCuid()
          const description =
            entry.description ||
            `Pagamento parcela ${i + 1}/2 - ${entry.clientName} - ${entry.month}/${entry.year}`

          await pool.query(
            `INSERT INTO "Finance"
             ("id", "orgId", "clientId", "invoiceId", "type", "category", "description", "amount", "date", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, 'INCOME', 'RECEITA', $5, $6, $7, $8, $9)`,
            [
              financeId,
              ORG_ID,
              clientId,
              invoiceId,
              description,
              installmentAmounts[i],
              dueDate,
              now,
              now,
            ]
          )

          const paymentId = generateCuid()
          await pool.query(
            `INSERT INTO "Payment"
             ("id", "orgId", "clientId", "invoiceId", "amount", "paidAt", "method", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, 'PIX', 'PAID', $7, $8)`,
            [
              paymentId,
              ORG_ID,
              clientId,
              invoiceId,
              installmentAmounts[i],
              dueDate,
              now,
              now,
            ]
          )

          console.log(
            `✅ ${entry.clientName} PARCELA ${i + 1}/2 - ${entry.month}/${entry.year} - R$ ${installmentAmounts[
              i
            ].toFixed(2)}`
          )
          console.log(`   Fatura: ${invoiceNumber}`)
          console.log(`   Vencimento: ${dueDate.toLocaleDateString('pt-BR')}\n`)

          createdCount++
          totalIncome += installmentAmounts[i]
        }
        continue
      }

      // Caso padrão: 1 fatura por mês
      const paymentDay = PAYMENT_DAYS[clientId] || 10
      const dueDate = new Date(entry.year, entry.month - 1, paymentDay)
      const issueDate = new Date(dueDate)
      issueDate.setDate(issueDate.getDate() - 1)
      const invoiceNumber = generateInvoiceNumber(
        entry.clientName,
        entry.month,
        entry.year
      )
      const invoiceId = generateCuid()
      await pool.query(
        `INSERT INTO "Invoice" 
         ("id", "orgId", "clientId", "number", "status", "issueDate", "dueDate", "subtotal", "total", "currency", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'PAID', $5, $6, $7, $8, 'BRL', $9, $10)`,
        [
          invoiceId,
          ORG_ID,
          clientId,
          invoiceNumber,
          issueDate,
          dueDate,
          entry.amount,
          entry.amount,
          now,
          now,
        ]
      )

      const financeId = generateCuid()
      const description =
        entry.description ||
        `Pagamento ${entry.clientName} - ${entry.month}/${entry.year}`
      await pool.query(
        `INSERT INTO "Finance"
         ("id", "orgId", "clientId", "invoiceId", "type", "category", "description", "amount", "date", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'INCOME', 'RECEITA', $5, $6, $7, $8, $9)`,
        [
          financeId,
          ORG_ID,
          clientId,
          invoiceId,
          description,
          entry.amount,
          dueDate,
          now,
          now,
        ]
      )

      const paymentId = generateCuid()
      await pool.query(
        `INSERT INTO "Payment"
         ("id", "orgId", "clientId", "invoiceId", "amount", "paidAt", "method", "status", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'PIX', 'PAID', $7, $8)`,
        [
          paymentId,
          ORG_ID,
          clientId,
          invoiceId,
          entry.amount,
          dueDate,
          now,
          now,
        ]
      )

      console.log(
        `✅ ${entry.clientName} - ${entry.month}/${entry.year} - R$ ${entry.amount.toFixed(2)}`
      )
      console.log(`   Fatura: ${invoiceNumber}`)
      console.log(`   Vencimento: ${dueDate.toLocaleDateString('pt-BR')}\n`)

      createdCount++
      totalIncome += entry.amount
    }

    console.log(
      '════════════════════════════════════════════════════════════\n'
    )
    console.log(`✅ ${createdCount} receitas criadas`)
    console.log(`💰 Total de receitas: R$ ${totalIncome.toFixed(2)}\n`)

    // 3. RESUMO FINAL
    console.log(
      '════════════════════════════════════════════════════════════\n'
    )
    console.log('📊 RESUMO POR MÊS:\n')

    const summary = await pool.query(
      `SELECT 
         EXTRACT(MONTH FROM date) as month,
         EXTRACT(YEAR FROM date) as year,
         type,
         SUM(amount) as total
       FROM "Finance"
       WHERE "orgId" = $1
       AND date >= '2025-10-01'
       AND date < '2026-01-01'
       GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date), type
       ORDER BY year, month, type`,
      [ORG_ID]
    )

    let currentMonth = 0
    for (const row of summary.rows) {
      if (row.month !== currentMonth) {
        currentMonth = row.month
        const monthName = new Date(2025, row.month - 1).toLocaleDateString(
          'pt-BR',
          { month: 'long' }
        )
        console.log(`\n${monthName.toUpperCase()} ${row.year}:`)
      }
      console.log(`  ${row.type}: R$ ${Number(row.total).toFixed(2)}`)
    }

    console.log(
      '\n════════════════════════════════════════════════════════════\n'
    )
    console.log('✅ RECRIAÇÃO CONCLUÍDA!')
    console.log(
      '\n⚠️  REINICIE O SERVIDOR DE DESENVOLVIMENTO PARA VER AS ALTERAÇÕES\n'
    )
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await pool.end()
  }
}

recreateFinances()
