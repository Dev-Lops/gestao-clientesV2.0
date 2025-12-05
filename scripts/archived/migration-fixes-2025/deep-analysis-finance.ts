import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function deepAnalysis() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('       ANÁLISE PROFUNDA DE TODOS OS REGISTROS FINANCE')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Buscar TODOS os registros Finance
  const allRecords = await pool.query(
    `SELECT id, date, type, amount, description, "clientId", "invoiceId", "createdAt"
     FROM "Finance"
     WHERE "orgId" = $1
     ORDER BY date, "createdAt"`,
    [orgId]
  )

  console.log(`📊 Total de registros encontrados: ${allRecords.rows.length}\n`)

  // Agrupar por mês e tipo
  const grouped: Record<string, { income: any[]; expense: any[] }> = {}

  for (const record of allRecords.rows) {
    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[monthKey]) {
      grouped[monthKey] = { income: [], expense: [] }
    }

    const type = record.type.toUpperCase()
    if (type === 'INCOME') {
      grouped[monthKey].income.push(record)
    } else if (type === 'EXPENSE') {
      grouped[monthKey].expense.push(record)
    }
  }

  // Analisar cada mês
  const sortedMonths = Object.keys(grouped).sort()

  for (const monthKey of sortedMonths) {
    const [year, month] = monthKey.split('-')
    const monthName = new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })

    const data = grouped[monthKey]

    console.log(`\n${'='.repeat(60)}`)
    console.log(`  ${monthName.toUpperCase()}`)
    console.log('='.repeat(60))

    // RECEITAS
    console.log('\n📈 RECEITAS:\n')
    if (data.income.length === 0) {
      console.log('   Nenhuma receita encontrada')
    } else {
      const incomeMap = new Map<string, any[]>()

      // Agrupar por descrição + valor para identificar duplicados
      for (const record of data.income) {
        const key = `${record.description}-${record.amount}`
        if (!incomeMap.has(key)) {
          incomeMap.set(key, [])
        }
        incomeMap.get(key)!.push(record)
      }

      let incomeTotal = 0
      let duplicateCount = 0

      for (const [, records] of incomeMap.entries()) {
        const first = records[0]
        const date = new Date(first.date).toLocaleDateString('pt-BR')
        const amount = Number(first.amount)

        if (records.length > 1) {
          console.log(
            `   ⚠️  DUPLICADO (${records.length}x): ${date} - R$ ${amount.toFixed(2)} - ${first.description}`
          )
          console.log(
            `      IDs: ${records.map((r) => r.id.substring(0, 8)).join(', ')}`
          )
          duplicateCount += records.length - 1
          incomeTotal += amount // Contar apenas uma vez
        } else {
          console.log(
            `   ✅ ${date} - R$ ${amount.toFixed(2)} - ${first.description}`
          )
          incomeTotal += amount
        }
      }

      console.log(`\n   Subtotal Receitas: R$ ${incomeTotal.toFixed(2)}`)
      if (duplicateCount > 0) {
        console.log(`   ⚠️  ${duplicateCount} duplicados encontrados`)
      }
    }

    // DESPESAS
    console.log('\n📉 DESPESAS:\n')
    if (data.expense.length === 0) {
      console.log('   Nenhuma despesa encontrada')
    } else {
      const expenseMap = new Map<string, any[]>()

      // Agrupar por descrição + valor para identificar duplicados
      for (const record of data.expense) {
        const key = `${record.description}-${record.amount}`
        if (!expenseMap.has(key)) {
          expenseMap.set(key, [])
        }
        expenseMap.get(key)!.push(record)
      }

      let expenseTotal = 0
      let duplicateCount = 0

      for (const [, records] of expenseMap.entries()) {
        const first = records[0]
        const date = new Date(first.date).toLocaleDateString('pt-BR')
        const amount = Number(first.amount)

        if (records.length > 1) {
          console.log(
            `   ⚠️  DUPLICADO (${records.length}x): ${date} - R$ ${amount.toFixed(2)} - ${first.description}`
          )
          console.log(
            `      IDs: ${records.map((r) => r.id.substring(0, 8)).join(', ')}`
          )
          duplicateCount += records.length - 1
          expenseTotal += amount // Contar apenas uma vez
        } else {
          console.log(
            `   ✅ ${date} - R$ ${amount.toFixed(2)} - ${first.description}`
          )
          expenseTotal += amount
        }
      }

      console.log(`\n   Subtotal Despesas: R$ ${expenseTotal.toFixed(2)}`)
      if (duplicateCount > 0) {
        console.log(`   ⚠️  ${duplicateCount} duplicados encontrados`)
      }
    }

    // SALDO DO MÊS
    const incomeTotal = data.income.reduce((sum, r) => {
      const key = `${r.description}-${r.amount}`
      // Contar apenas registros únicos
      const duplicates = data.income.filter(
        (x) => `${x.description}-${x.amount}` === key
      )
      return duplicates[0].id === r.id ? sum + Number(r.amount) : sum
    }, 0)

    const expenseTotal = data.expense.reduce((sum, r) => {
      const key = `${r.description}-${r.amount}`
      // Contar apenas registros únicos
      const duplicates = data.expense.filter(
        (x) => `${x.description}-${x.amount}` === key
      )
      return duplicates[0].id === r.id ? sum + Number(r.amount) : sum
    }, 0)

    const balance = incomeTotal - expenseTotal

    console.log(`\n💰 SALDO DO MÊS: R$ ${balance.toFixed(2)}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('                    RESUMO GERAL')
  console.log('='.repeat(60) + '\n')

  // Identificar todos os duplicados para deleção
  const duplicatesToDelete: string[] = []

  for (const monthKey of sortedMonths) {
    const data = grouped[monthKey]

    // Identificar duplicados de receitas
    const incomeMap = new Map<string, any[]>()
    for (const record of data.income) {
      const key = `${record.description}-${record.amount}`
      if (!incomeMap.has(key)) {
        incomeMap.set(key, [])
      }
      incomeMap.get(key)!.push(record)
    }

    for (const [, records] of incomeMap.entries()) {
      if (records.length > 1) {
        // Manter o mais antigo (primeiro criado), deletar os outros
        const sorted = records.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        for (let i = 1; i < sorted.length; i++) {
          duplicatesToDelete.push(sorted[i].id)
        }
      }
    }

    // Identificar duplicados de despesas
    const expenseMap = new Map<string, any[]>()
    for (const record of data.expense) {
      const key = `${record.description}-${record.amount}`
      if (!expenseMap.has(key)) {
        expenseMap.set(key, [])
      }
      expenseMap.get(key)!.push(record)
    }

    for (const [, records] of expenseMap.entries()) {
      if (records.length > 1) {
        // Manter o mais antigo (primeiro criado), deletar os outros
        const sorted = records.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        for (let i = 1; i < sorted.length; i++) {
          duplicatesToDelete.push(sorted[i].id)
        }
      }
    }
  }

  if (duplicatesToDelete.length > 0) {
    console.log(
      `⚠️  TOTAL DE DUPLICADOS ENCONTRADOS: ${duplicatesToDelete.length}`
    )
    console.log('\n📝 IDs para deletar:')
    duplicatesToDelete.forEach((id) => console.log(`   - ${id}`))

    console.log('\n💡 Para remover duplicados, execute:')
    console.log('   npx tsx scripts/remove-duplicates.ts')
  } else {
    console.log('✅ Nenhum duplicado encontrado!')
  }

  // Verificar se há pagamentos no período
  console.log('\n' + '='.repeat(60))
  console.log('           VERIFICANDO PAYMENTS (DEZEMBRO)')
  console.log('='.repeat(60) + '\n')

  const payments = await pool.query(
    `SELECT id, amount, "paidAt", "invoiceId"
     FROM "Payment"
     WHERE "orgId" = $1
     AND "paidAt" >= '2025-12-01'
     AND "paidAt" < '2026-01-01'
     ORDER BY "paidAt"`,
    [orgId]
  )

  console.log(`Total de Payments em Dezembro: ${payments.rows.length}`)
  let paymentsTotal = 0
  for (const p of payments.rows) {
    console.log(
      `   ${new Date(p.paidAt).toLocaleDateString('pt-BR')} - R$ ${Number(p.amount).toFixed(2)} ${p.invoiceId ? `(Invoice: ${p.invoiceId.substring(0, 8)}...)` : ''}`
    )
    paymentsTotal += Number(p.amount)
  }
  console.log(`\nTotal Payments Dezembro: R$ ${paymentsTotal.toFixed(2)}`)

  await pool.end()
}

deepAnalysis().catch(console.error)
