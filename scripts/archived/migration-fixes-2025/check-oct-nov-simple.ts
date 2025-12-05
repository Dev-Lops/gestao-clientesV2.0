import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    const orgId = 'cmi3s1whv0002cmpwzddysc4j'

    console.log('\n=== OUTUBRO 2024 ===\n')

    // Buscar entradas de outubro
    const octoberData: any[] = await prisma.$queryRaw`
      SELECT 
        date, type, amount, description, 
        c.name as client_name
      FROM "Finance" f
      LEFT JOIN "Client" c ON f."clientId" = c.id
      WHERE f."orgId" = ${orgId}
        AND f.date >= '2024-10-01'::date
        AND f.date < '2024-11-01'::date
      ORDER BY f.date, f.type
    `

    const octoberIncome = octoberData.filter((f) => f.type === 'INCOME')
    const octoberExpense = octoberData.filter((f) => f.type === 'EXPENSE')

    console.log('RECEITAS:')
    if (octoberIncome.length === 0) {
      console.log('  Nenhuma receita encontrada')
    } else {
      octoberIncome.forEach((f) => {
        const date = new Date(f.date).toLocaleDateString('pt-BR')
        console.log(
          `  ${date} - ${f.client_name || 'SEM CLIENTE'} - R$ ${Number(f.amount).toFixed(2)} - ${f.description || ''}`
        )
      })
    }

    console.log(
      `\nTotal Receitas Outubro: R$ ${octoberIncome.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
    )

    console.log('\nDESPESAS:')
    if (octoberExpense.length === 0) {
      console.log('  Nenhuma despesa encontrada')
    } else {
      octoberExpense.forEach((f) => {
        const date = new Date(f.date).toLocaleDateString('pt-BR')
        console.log(
          `  ${date} - ${f.description || 'SEM DESCRIÇÃO'} - R$ ${Number(f.amount).toFixed(2)}`
        )
      })
    }

    console.log(
      `\nTotal Despesas Outubro: R$ ${octoberExpense.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
    )

    console.log('\n\n=== NOVEMBRO 2024 ===\n')

    // Buscar entradas de novembro
    const novemberData: any[] = await prisma.$queryRaw`
      SELECT 
        date, type, amount, description, 
        c.name as client_name
      FROM "Finance" f
      LEFT JOIN "Client" c ON f."clientId" = c.id
      WHERE f."orgId" = ${orgId}
        AND f.date >= '2024-11-01'::date
        AND f.date < '2024-12-01'::date
      ORDER BY f.date, f.type
    `

    const novemberIncome = novemberData.filter((f) => f.type === 'INCOME')
    const novemberExpense = novemberData.filter((f) => f.type === 'EXPENSE')

    console.log('RECEITAS:')
    if (novemberIncome.length === 0) {
      console.log('  Nenhuma receita encontrada')
    } else {
      novemberIncome.forEach((f) => {
        const date = new Date(f.date).toLocaleDateString('pt-BR')
        console.log(
          `  ${date} - ${f.client_name || 'SEM CLIENTE'} - R$ ${Number(f.amount).toFixed(2)} - ${f.description || ''}`
        )
      })
    }

    console.log(
      `\nTotal Receitas Novembro: R$ ${novemberIncome.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
    )

    console.log('\nDESPESAS:')
    if (novemberExpense.length === 0) {
      console.log('  Nenhuma despesa encontrada')
    } else {
      novemberExpense.forEach((f) => {
        const date = new Date(f.date).toLocaleDateString('pt-BR')
        console.log(
          `  ${date} - ${f.description || 'SEM DESCRIÇÃO'} - R$ ${Number(f.amount).toFixed(2)}`
        )
      })
    }

    console.log(
      `\nTotal Despesas Novembro: R$ ${novemberExpense.reduce((s, f) => s + Number(f.amount), 0).toFixed(2)}`
    )
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
