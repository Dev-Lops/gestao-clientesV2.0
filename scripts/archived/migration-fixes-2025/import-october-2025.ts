import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'

    // DADOS DA PLANILHA DE OUTUBRO 2025
    const octoberData = {
      income: [
        {
          client: 'Fabiane',
          amount: 700,
          date: '2025-10-01',
          description: 'Receita Hudson/Fabiane',
        },
        {
          client: 'Dra. Alexandra',
          amount: 1200,
          date: '2025-10-01',
          description: 'Receita Isabel',
        },
        {
          client: 'Dra. Alexandra',
          amount: 1200,
          date: '2025-10-18',
          description: 'Receita Alexandra',
        },
        {
          client: 'Fabiane',
          amount: 600,
          date: '2025-10-01',
          description: 'Receita Fabiana',
        },
        {
          client: 'Infinix',
          amount: 1200,
          date: '2025-10-10',
          description: 'Receita Infinix',
        },
        {
          client: 'Manu Nails Desinger',
          amount: 775,
          date: '2025-10-14',
          description: 'Manu Nails Designer',
        },
        {
          client: 'Mané Mineira',
          amount: 750,
          date: '2025-10-24',
          description: 'Mané Mineira',
        },
      ],
      expenses: [
        { description: 'LUISE', amount: 280, date: '2025-10-09' },
        { description: 'JOSUÉ', amount: 750, date: '2025-10-10' },
        { description: 'LUZIA', amount: 300, date: '2025-10-01' },
        { description: 'INVESTIMENTO', amount: 80, date: '2025-10-25' },
        { description: 'DRIVE GOOGLE', amount: 5, date: '2025-10-01' },
        { description: 'CAPCUT', amount: 65, date: '2025-10-12' },
        { description: 'CANVA', amount: 35, date: '2025-10-01' },
        { description: 'CHATGPT 5.0', amount: 100, date: '2025-10-19' },
        { description: 'DAS', amount: 165.01, date: '2025-10-01' },
        { description: 'FLAVIA', amount: 760, date: '2025-10-30' },
        { description: 'mlbs', amount: 215.6, date: '2025-10-10' },
        { description: 'MISSÕES', amount: 100, date: '2025-10-01' },
        { description: 'EMP. GORDO', amount: 50, date: '2025-10-01' },
        { description: 'OUTROS GASTOS', amount: 70.82, date: '2025-10-01' },
        { description: 'EMP MARCELO', amount: 300, date: '2025-10-15' },
        { description: 'SALARIO ESTHER', amount: 2386.55, date: '2025-10-10' },
        { description: 'emprest anderson', amount: 322.61, date: '2025-10-25' },
        { description: 'GASTOS', amount: 127.99, date: '2025-10-01' },
        { description: 'merenda', amount: 345.3, date: '2025-10-01' },
        { description: 'carlos', amount: 125, date: '2025-10-24' },
      ],
    }

    console.log('\n=== IMPORTAÇÃO DE DADOS - OUTUBRO 2025 ===\n')

    // Buscar clientes existentes
    const clientsResult = await pool.query(
      `
      SELECT id, name FROM "Client" WHERE "orgId" = $1
    `,
      [orgId]
    )

    const clients = new Map<string, string>()
    clientsResult.rows.forEach((row) => {
      const nameNormalized = row.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      clients.set(nameNormalized, row.id)
    })

    console.log(`Clientes encontrados: ${clients.size}`)
    console.log('Mapeamento de clientes:')
    clientsResult.rows.forEach((row) => {
      console.log(`  - ${row.name}`)
    })

    let incomeInserted = 0
    let expenseInserted = 0

    // Inserir receitas
    console.log('\n--- INSERINDO RECEITAS ---\n')
    for (const income of octoberData.income) {
      // Buscar cliente pelo nome exato (trimmed)
      const client = clientsResult.rows.find(
        (c) =>
          c.name.trim().toLowerCase() === income.client.trim().toLowerCase()
      )

      if (!client) {
        console.log(`⚠️  Cliente não encontrado: ${income.client}`)
        console.log(
          `   Clientes disponíveis: ${clientsResult.rows.map((c) => c.name).join(', ')}`
        )
        continue
      }

      await pool.query(
        `
        INSERT INTO "Finance" (
          id, "orgId", "clientId", type, amount, description, date, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, 'INCOME', $3, $4, $5, NOW(), NOW()
        )
      `,
        [orgId, client.id, income.amount, income.description, income.date]
      )

      console.log(
        `✅ Receita: ${income.client} - R$ ${income.amount.toFixed(2)}`
      )
      incomeInserted++
    }

    // Inserir despesas
    console.log('\n--- INSERINDO DESPESAS ---\n')
    for (const expense of octoberData.expenses) {
      await pool.query(
        `
        INSERT INTO "Finance" (
          id, "orgId", type, amount, description, date, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, 'EXPENSE', $2, $3, $4, NOW(), NOW()
        )
      `,
        [orgId, expense.amount, expense.description, expense.date]
      )

      console.log(
        `✅ Despesa: ${expense.description} - R$ ${expense.amount.toFixed(2)}`
      )
      expenseInserted++
    }

    console.log('\n=== RESUMO ===')
    console.log(`Receitas inseridas: ${incomeInserted}`)
    console.log(`Despesas inseridas: ${expenseInserted}`)
    console.log(`Total: ${incomeInserted + expenseInserted} registros`)

    // Calcular totais
    const totalIncome = octoberData.income.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = octoberData.expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    )

    console.log(`\nTotal Receitas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`Total Despesas: R$ ${totalExpenses.toFixed(2)}`)
    console.log(`Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}`)
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await pool.end()
  }
}

main()
