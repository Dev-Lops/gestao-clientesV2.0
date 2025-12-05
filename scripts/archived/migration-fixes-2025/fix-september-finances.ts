import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Ì¥ç Analisando Finance INCOME de setembro...')
  
  const septStart = new Date(2024, 8, 1) // setembro 2024
  const septEnd = new Date(2024, 8, 30, 23, 59, 59, 999)
  
  const septFinances = await prisma.finance.findMany({
    where: {
      type: 'INCOME',
      date: { gte: septStart, lte: septEnd }
    },
    select: {
      id: true,
      amount: true,
      date: true,
      invoiceId: true,
      description: true,
      clientId: true,
    },
    orderBy: { date: 'asc' }
  })
  
  console.log(`\nÌ≥ä Total de ${septFinances.length} Finance INCOME em setembro:`)
  let totalAmount = 0
  septFinances.forEach(f => {
    console.log(`  - ${f.id.substring(0, 12)}... | R$ ${f.amount.toFixed(2)} | ${f.date.toISOString().split('T')[0]} | Invoice: ${f.invoiceId?.substring(0, 12) || 'null'} | ${f.description || '(sem descri√ß√£o)'}`)
    totalAmount += f.amount
  })
  console.log(`\nÌ≤∞ Total: R$ ${totalAmount.toFixed(2)}`)
  
  console.log('\nÌ¥ç Verificando invoices relacionadas...')
  const uniqueInvoiceIds = [...new Set(septFinances.filter(f => f.invoiceId).map(f => f.invoiceId!))]
  
  for (const invId of uniqueInvoiceIds) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invId },
      select: {
        id: true,
        total: true,
        issueDate: true,
        dueDate: true,
        status: true,
        clientId: true,
      }
    })
    if (invoice) {
      console.log(`  Invoice ${invId.substring(0, 12)}: R$ ${invoice.total?.toFixed(2)} | ${invoice.status} | Due: ${invoice.dueDate?.toISOString().split('T')[0]}`)
    }
  }
  
  console.log('\nÌ¥ç Verificando payments relacionados a essas invoices...')
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId: { in: uniqueInvoiceIds }
    },
    select: {
      id: true,
      amount: true,
      paidAt: true,
      invoiceId: true,
      status: true,
    }
  })
  
  payments.forEach(p => {
    console.log(`  Payment ${p.id.substring(0, 12)}: R$ ${p.amount.toFixed(2)} | ${p.status} | Paid: ${p.paidAt?.toISOString().split('T')[0]} | Invoice: ${p.invoiceId?.substring(0, 12)}`)
  })
  
  // Identificar duplicatas
  console.log('\nÌæØ AN√ÅLISE DE DUPLICATAS:')
  const financesByInvoice = new Map<string, typeof septFinances>()
  septFinances.forEach(f => {
    if (f.invoiceId) {
      const existing = financesByInvoice.get(f.invoiceId) || []
      existing.push(f)
      financesByInvoice.set(f.invoiceId, existing)
    }
  })
  
  financesByInvoice.forEach((finances, invoiceId) => {
    if (finances.length > 1) {
      console.log(`\n  ‚ö†Ô∏è Invoice ${invoiceId.substring(0, 12)} tem ${finances.length} Finance entries:`)
      finances.forEach(f => {
        console.log(`     - ${f.id.substring(0, 12)}: R$ ${f.amount.toFixed(2)} em ${f.date.toISOString().split('T')[0]}`)
      })
    }
  })
  
  // Sugest√£o de corre√ß√£o
  console.log('\n\nÌ≤° SUGEST√ÉO DE CORRE√á√ÉO:')
  console.log('Se o valor correto √© R$1.00, provavelmente precisamos:')
  console.log('1. Manter apenas 1 Finance INCOME de R$1.00')
  console.log('2. Deletar os outros (R$1,200 e R$600)')
  console.log('\nPara executar a corre√ß√£o, responda "SIM" para continuar.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
