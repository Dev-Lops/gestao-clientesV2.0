import { prisma } from '../src/lib/prisma'

async function main() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n=== OUTUBRO 2024 ===\n')

  const octoberFinances = await prisma.finance.findMany({
    where: {
      orgId: orgId,
      date: {
        gte: new Date('2024-10-01'),
        lt: new Date('2024-11-01'),
      },
    },
    include: { client: true },
    orderBy: { date: 'asc' },
  })

  const octoberIncome = octoberFinances.filter((f) => f.type === 'INCOME')
  const octoberExpense = octoberFinances.filter((f) => f.type === 'EXPENSE')

  console.log('RECEITAS:')
  octoberIncome.forEach((f) => {
    console.log(
      `  ${f.date.toLocaleDateString('pt-BR')} - ${f.client?.name || 'SEM CLIENTE'} - R$ ${f.amount.toFixed(2)} - ${f.description || ''}`
    )
  })

  console.log(
    `\nTotal Receitas Outubro: R$ ${octoberIncome.reduce((s, f) => s + f.amount, 0).toFixed(2)}`
  )

  console.log('\nDESPESAS:')
  octoberExpense.forEach((f) => {
    console.log(
      `  ${f.date.toLocaleDateString('pt-BR')} - ${f.description} - R$ ${f.amount.toFixed(2)}`
    )
  })

  console.log(
    `\nTotal Despesas Outubro: R$ ${octoberExpense.reduce((s, f) => s + f.amount, 0).toFixed(2)}`
  )

  console.log('\n\n=== NOVEMBRO 2024 ===\n')

  const novemberFinances = await prisma.finance.findMany({
    where: {
      orgId: orgId,
      date: {
        gte: new Date('2024-11-01'),
        lt: new Date('2024-12-01'),
      },
    },
    include: { client: true },
    orderBy: { date: 'asc' },
  })

  const novemberIncome = novemberFinances.filter((f) => f.type === 'INCOME')
  const novemberExpense = novemberFinances.filter((f) => f.type === 'EXPENSE')

  console.log('RECEITAS:')
  novemberIncome.forEach((f) => {
    console.log(
      `  ${f.date.toLocaleDateString('pt-BR')} - ${f.client?.name || 'SEM CLIENTE'} - R$ ${f.amount.toFixed(2)} - ${f.description || ''}`
    )
  })

  console.log(
    `\nTotal Receitas Novembro: R$ ${novemberIncome.reduce((s, f) => s + f.amount, 0).toFixed(2)}`
  )

  console.log('\nDESPESAS:')
  novemberExpense.forEach((f) => {
    console.log(
      `  ${f.date.toLocaleDateString('pt-BR')} - ${f.description} - R$ ${f.amount.toFixed(2)}`
    )
  })

  console.log(
    `\nTotal Despesas Novembro: R$ ${novemberExpense.reduce((s, f) => s + f.amount, 0).toFixed(2)}`
  )

  await prisma.$disconnect()
}

main()
