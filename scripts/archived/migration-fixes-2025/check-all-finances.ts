import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'

    // Verificar se a org existe
    console.log('Verificando organização...\n')
    const orgCheck = await pool.query(
      `
      SELECT id, name FROM "Org" WHERE id = $1
    `,
      [orgId]
    )

    if (orgCheck.rows.length === 0) {
      console.log('❌ Organização não encontrada!')
      return
    }

    console.log(`✅ Organização: ${orgCheck.rows[0].name}\n`)

    // Contar total de registros Finance
    console.log('Contando registros Finance...\n')
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total FROM "Finance" WHERE "orgId" = $1
    `,
      [orgId]
    )

    console.log(`Total de registros Finance: ${countResult.rows[0].total}\n`)

    // Buscar TODOS os registros com datas
    console.log('Buscando todos os registros Finance...\n')
    const allFinances = await pool.query(
      `
      SELECT 
        date, type, amount, description, 
        c.name as client_name,
        TO_CHAR(date, 'YYYY-MM') as month
      FROM "Finance" f
      LEFT JOIN "Client" c ON f."clientId" = c.id
      WHERE f."orgId" = $1
      ORDER BY f.date DESC
    `,
      [orgId]
    )

    console.log(`Encontrados ${allFinances.rows.length} registros:\n`)

    // Agrupar por mês
    const byMonth = new Map<string, any[]>()

    allFinances.rows.forEach((row) => {
      const month = row.month
      if (!byMonth.has(month)) {
        byMonth.set(month, [])
      }
      byMonth.get(month)!.push(row)
    })

    // Mostrar resumo por mês
    const months = Array.from(byMonth.keys()).sort().reverse()

    months.forEach((month) => {
      const records = byMonth.get(month)!
      const income = records.filter((r) => r.type === 'INCOME')
      const expense = records.filter((r) => r.type === 'EXPENSE')

      const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
      const totalExpense = expense.reduce((s, r) => s + Number(r.amount), 0)

      console.log(`📅 ${month}: ${records.length} registros`)
      console.log(
        `   Receitas: R$ ${totalIncome.toFixed(2)} (${income.length} registros)`
      )
      console.log(
        `   Despesas: R$ ${totalExpense.toFixed(2)} (${expense.length} registros)`
      )
      console.log()
    })

    // Mostrar detalhes de outubro e novembro 2025
    console.log('\n=== DETALHES OUTUBRO 2025 ===\n')
    const oct2025 = allFinances.rows.filter((r) => r.month === '2025-10')
    if (oct2025.length === 0) {
      console.log('❌ Nenhum registro em outubro 2025\n')
    } else {
      oct2025.forEach((r) => {
        const date = new Date(r.date).toLocaleDateString('pt-BR')
        console.log(
          `${date} - ${r.type} - ${r.client_name || r.description} - R$ ${Number(r.amount).toFixed(2)}`
        )
      })
    }

    console.log('\n=== DETALHES NOVEMBRO 2025 ===\n')
    const nov2025 = allFinances.rows.filter((r) => r.month === '2025-11')
    if (nov2025.length === 0) {
      console.log('❌ Nenhum registro em novembro 2025\n')
    } else {
      nov2025.forEach((r) => {
        const date = new Date(r.date).toLocaleDateString('pt-BR')
        console.log(
          `${date} - ${r.type} - ${r.client_name || r.description} - R$ ${Number(r.amount).toFixed(2)}`
        )
      })
    }
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await pool.end()
  }
}

main()
