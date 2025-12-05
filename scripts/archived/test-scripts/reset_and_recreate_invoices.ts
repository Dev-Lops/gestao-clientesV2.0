import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'
// Load env vars so Prisma can connect locally
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

/**
 * Batch script: Remove all invoices for org and recreate per provided plan
 * Usage: pnpm tsx scripts/reset_and_recreate_invoices.ts
 */

type InvoicePlanItem = {
  clientName: string
  amount: number
  label?: string
}

type MonthPlan = {
  month: number // 1-12
  year: number
  items: InvoicePlanItem[]
}

// Mapeamento de nomes conforme fornecido para nomes exatos do sistema
const clientMapping: Record<string, string> = {
  'zl sushi': 'ZL SUSHI',
  hudson: 'ZL SUSHI',
  isabel: 'K´Delícia ',
  kdelicia: 'K´Delícia ',
  'k delicia': 'K´Delícia ',
  alexandra: 'Dra. Alexandra',
  'alexandra pf': 'Dra. Alexandra',
  fabiana: 'Fabiane ',
  fabi: 'Fabiane ',
  infinix: 'Infinix',
  manu: 'Manu Nails Desinger',
  designer: 'Manu Nails Desinger',
  'mane mineira': 'Mané Mineira',
  mané: 'Mané Mineira',
  'adv ariane': 'Ariane',
  ariane: 'Ariane',
  unimarcas: 'UNIMARCAS',
  distribuidora: 'A2M',
  a2m: 'A2M',
}

const normalizeClient = (name: string): string | null => {
  const n = name.trim().toLowerCase()
  const mapped = clientMapping[n]
  return mapped || null
}

const plans: MonthPlan[] = [
  {
    month: 10,
    year: 2025,
    items: [
      { clientName: 'zl sushi', amount: 700 },
      { clientName: 'isabel', amount: 1200 },
      { clientName: 'alexandra', amount: 1200 },
      { clientName: 'fabiana', amount: 600 },
      { clientName: 'infinix', amount: 1200 },
      { clientName: 'manu', amount: 775 },
      { clientName: 'mane mineira', amount: 750 },
    ],
  },
  {
    month: 11,
    year: 2025,
    items: [
      { clientName: 'zl sushi', amount: 700 },
      { clientName: 'isabel', amount: 1200 },
      { clientName: 'infinix', amount: 1200 },
      { clientName: 'alexandra', amount: 1200 },
      { clientName: 'adv ariane', amount: 800 },
      { clientName: 'manu', amount: 600 },
      { clientName: 'unimarcas', amount: 882 },
      { clientName: 'fabiana', amount: 1200 },
      { clientName: 'distribuidora', amount: 50 },
    ],
  },
  {
    month: 12,
    year: 2025,
    items: [
      { clientName: 'alexandra', amount: 600 },
      { clientName: 'mane mineira', amount: 750 },
    ],
  },
]

async function findClientByName(orgId: string, rawName: string) {
  const exactName = normalizeClient(rawName)
  if (!exactName) {
    return null
  }

  const client = await prisma.client.findFirst({
    where: {
      orgId,
      name: exactName,
    },
  })
  return client
}

async function recreateInvoices(orgId: string) {
  const dryRun =
    process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')
  console.log('Resetting invoices for org:', orgId, dryRun ? '(dry-run)' : '')
  if (!dryRun) {
    await prisma.transaction.deleteMany({
      where: { orgId, invoiceId: { not: null } },
    })
    await prisma.invoiceItem.deleteMany({ where: { invoice: { orgId } } })
    await prisma.invoice.deleteMany({ where: { orgId } })
  }

  for (const plan of plans) {
    for (const item of plan.items) {
      if (item.amount <= 0) continue
      const client = await findClientByName(orgId, item.clientName)
      if (!client) {
        console.warn('Cliente não encontrado:', item.clientName)
        continue
      }

      const issueDate = new Date(plan.year, plan.month - 1, 1)
      // Usar paymentDay do cliente, ou 10 como padrão
      const dueDay = client.paymentDay || 10
      const dueDate = new Date(plan.year, plan.month - 1, dueDay)
      const number = `INV-${plan.year}${String(plan.month).padStart(2, '0')}-${client.id.slice(0, 6)}`

      // Se cliente é parcelado, usar installmentValue; senão usar valor direto
      let subtotal = item.amount
      let invoiceItems = [
        {
          description: item.label || `Mensalidade ${plan.month}/${plan.year}`,
          quantity: 1,
          unitAmount: subtotal,
          total: subtotal,
        },
      ] as const

      if (
        client.isInstallment &&
        client.installmentValue &&
        client.installmentValue > 0
      ) {
        // Usar valor da parcela cadastrada
        subtotal = client.installmentValue
        invoiceItems = [
          {
            description: `Parcela (${plan.month}/${plan.year})`,
            quantity: 1,
            unitAmount: subtotal,
            total: subtotal,
          },
        ]
      }

      if (dryRun) {
        console.log(
          '[DRY] Criaria fatura',
          number,
          'para',
          client.name,
          '| Vencimento:',
          dueDate.toLocaleDateString('pt-BR'),
          '| Valor:',
          subtotal,
          '| Parcelado:',
          client.isInstallment ? `SIM (${client.installmentCount}x)` : 'NÃO'
        )
      } else {
        const invoice = await prisma.invoice.create({
          data: {
            orgId,
            clientId: client.id,
            number,
            status: 'OPEN',
            issueDate,
            dueDate,
            subtotal,
            discount: 0,
            tax: 0,
            total: subtotal,
            currency: 'BRL',
            notes: null,
            items: {
              create: invoiceItems.map((it) => ({ ...it })),
            },
          },
        })
        console.log(
          'Fatura criada:',
          invoice.number,
          'para',
          client.name,
          '| Vencimento:',
          dueDate.toLocaleDateString('pt-BR'),
          '| Valor: R$',
          subtotal
        )
      }
    }
  }
}

async function main() {
  // Allow passing orgId via CLI arg: pnpm tsx scripts/reset_and_recreate_invoices.ts [--dry-run] <orgId>
  const dryRunIdx = process.argv.indexOf('--dry-run')
  const orgIdIdx = dryRunIdx !== -1 ? 3 : 2
  const argOrgId = process.argv[orgIdIdx]
  let orgId = argOrgId

  if (!orgId) {
    const org = await prisma.org.findFirst()
    if (!org) throw new Error('Org not found (and no orgId provided)')
    orgId = org.id
  }
  await recreateInvoices(orgId)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
