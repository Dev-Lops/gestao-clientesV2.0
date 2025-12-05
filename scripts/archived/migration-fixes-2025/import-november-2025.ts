import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'

    // DADOS DA PLANILHA DE NOVEMBRO 2025
    const novemberData = {
      // Saldo anterior que veio de outubro
      previousBalance: 62.09,

      income: [
        {
          client: 'Fabiane',
          amount: 700,
          date: '2025-11-01',
          description: 'Receita Hudson/Fabiane',
        },
        {
          client: 'Dra. Alexandra',
          amount: 1200,
          date: '2025-11-01',
          description: 'Receita Isabel',
        },
        {
          client: 'Infinix',
          amount: 1200,
          date: '2025-11-10',
          description: 'Receita Infinix',
        },
        {
          client: 'Dra. Alexandra',
          amount: 1200,
          date: '2025-11-18',
          description: 'Receita Alexandra',
        },
        {
          client: 'Ariane',
          amount: 800,
          date: '2025-11-27',
          description: 'ADV Ariane',
        },
        {
          client: 'Manu Nails Desinger',
          amount: 600,
          date: '2025-11-07',
          description: 'Manu',
        },
        {
          client: 'UNIMARCAS',
          amount: 882,
          date: '2025-11-27',
          description: 'UNIMARCAS',
        },
        {
          client: 'Fabiane',
          amount: 1200,
          date: '2025-11-01',
          description: 'FABI',
        },
        {
          client: 'K´Delícia',
          amount: 50,
          date: '2025-11-05',
          description: 'Distribuidora',
        },
        {
          client: 'K´Delícia',
          amount: 100,
          date: '2025-11-05',
          description: 'Distribuidora',
        },
      ],
    }

    console.log('\n=== IMPORTAÇÃO DE DADOS - NOVEMBRO 2025 ===\n')
    console.log(
      `Saldo anterior (Outubro): R$ ${novemberData.previousBalance.toFixed(2)}\n`
    )

    // Buscar clientes existentes
    const clientsResult = await pool.query(
      `
      SELECT id, name FROM "Client" WHERE "orgId" = $1
    `,
      [orgId]
    )

    const clients = new Map<string, string>()
    clientsResult.rows.forEach((row) => {
      const nameNormalized = row.name.toLowerCase().trim()
      clients.set(nameNormalized, row.id)
    })

    console.log(`Clientes encontrados: ${clients.size}`)
    console.log('Mapeamento de clientes:')
    clientsResult.rows.forEach((row) => {
      console.log(`  - ${row.name}`)
    })

    let incomeInserted = 0

    // Limpar dados anteriores de novembro (se houver)
    const deleteResult = await pool.query(
      `
      DELETE FROM "Finance"
      WHERE "orgId" = $1
        AND date >= '2025-11-01'::date
        AND date < '2025-12-01'::date
      RETURNING id
    `,
      [orgId]
    )

    if (deleteResult.rowCount > 0) {
      console.log(
        `\n⚠️  Deletados ${deleteResult.rowCount} registros anteriores de novembro\n`
      )
    }

    // Inserir receitas
    console.log('--- INSERINDO RECEITAS ---\n')
    for (const income of novemberData.income) {
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

    console.log('\n=== RESUMO ===')
    console.log(`Receitas inseridas: ${incomeInserted}`)

    // Calcular totais
    const totalIncome = novemberData.income.reduce(
      (sum, i) => sum + i.amount,
      0
    )

    console.log(
      `\nSaldo anterior: R$ ${novemberData.previousBalance.toFixed(2)}`
    )
    console.log(`Receitas Novembro: R$ ${totalIncome.toFixed(2)}`)
    console.log(
      `Total disponível: R$ ${(novemberData.previousBalance + totalIncome).toFixed(2)}`
    )

    // Buscar despesas de novembro (se houver)
    const expensesResult = await pool.query(
      `
      SELECT SUM(amount) as total FROM "Finance"
      WHERE "orgId" = $1
        AND date >= '2025-11-01'::date
        AND date < '2025-12-01'::date
        AND type = 'EXPENSE'
    `,
      [orgId]
    )

    const totalExpenses = Number(expensesResult.rows[0].total || 0)

    if (totalExpenses > 0) {
      console.log(`Despesas Novembro: R$ ${totalExpenses.toFixed(2)}`)
      console.log(
        `Saldo Final: R$ ${(novemberData.previousBalance + totalIncome - totalExpenses).toFixed(2)}`
      )
    } else {
      console.log('\nNota: Não há despesas registradas para novembro ainda.')
      console.log(
        `Saldo atual (sem despesas): R$ ${(novemberData.previousBalance + totalIncome).toFixed(2)}`
      )
    }
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await pool.end()
  }
}

main()
